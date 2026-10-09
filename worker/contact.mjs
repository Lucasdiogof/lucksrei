/* POST /api/contact — formulário "Send Message".
 *
 * Corpo JSON: { name, email, subject: "hiring"|"collab"|"other", message, website (honeypot), ts (ms em que o formulário abriu) }
 * Respostas: 200 { ok: true } só depois que o provedor aceitou a mensagem. Erros: 400 invalid (com fields), 403, 413, 415,
 * 429 (com Retry-After), 502 delivery_failed, 503 unavailable (nenhum provedor configurado — nunca simula sucesso).
 *
 * Entrega (a primeira configurada vence):
 *   1. Secret RESEND_API_KEY (API do Resend; domínio lucksrei.com verificado no Resend). É o provedor em produção.
 *   2. Binding SEND_EMAIL (Cloudflare Email, send_email): alternativa sem chave; não está habilitado em wrangler.jsonc.
 * Remetente "Lucksrei <marketing@lucksrei.com>", destino marketing@lucksrei.com (o Email Routing já encaminha ao Gmail),
 * Reply-To = e-mail do visitante. Variáveis opcionais: CONTACT_TO e CONTACT_FROM (só o endereço; inválido volta ao padrão).
 *
 * Antiabuso: mesma origem obrigatória, JSON, corpo ≤ 8 KB, honeypot, tempo mínimo de preenchimento, limite por IP
 * (3 por 10 min, 10 por dia) e teto global (40 por hora), todos em caches.default. O IP só entra como hash SHA-256 truncado
 * na chave do contador e nunca é gravado em outro lugar. O conteúdo da mensagem nunca é registrado em log.
 */

export const LIMITS = { nameMin: 2, nameMax: 80, emailMax: 254, messageMin: 10, messageMax: 2000, bodyMax: 8192, minFillMs: 2000, maxAgeMs: 24 * 3600 * 1000 };
export const SUBJECTS = { hiring: "Hiring Opportunity", collab: "Mobile Project Collaboration", other: "Other Inquiry" };
const EMAIL_RE = /^[A-Za-z0-9.!#$%&'*+\/=?^_`{|}~-]+@[A-Za-z0-9](?:[A-Za-z0-9-]*[A-Za-z0-9])?(?:\.[A-Za-z0-9](?:[A-Za-z0-9-]*[A-Za-z0-9])?)*\.[A-Za-z]{2,}$/;
const DEFAULT_TO = "marketing@lucksrei.com";
const DEFAULT_FROM = "marketing@lucksrei.com";
const FROM_NAME = "Lucksrei";

const RATE = [
  { scope: "ip10m", window: 600, limit: 3 },
  { scope: "ipday", window: 86400, limit: 10 },
];
const GLOBAL = { scope: "all1h", window: 3600, limit: 40 };

const CTRL = /[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f\u2028\u2029]/g;
const oneLine = (v) => String(v == null ? "" : v).replace(CTRL, "").replace(/[\r\n\t]+/g, " ").replace(/\s+/g, " ").trim();
const multiLine = (v) => String(v == null ? "" : v).replace(/\r\n?/g, "\n").replace(CTRL, "").replace(/\n{3,}/g, "\n\n").trim();

export function validateContact(raw) {
  const o = raw && typeof raw === "object" ? raw : {};
  const value = {
    name: oneLine(o.name),
    email: oneLine(o.email),
    subject: typeof o.subject === "string" ? o.subject : "",
    message: multiLine(o.message),
  };
  const fields = [];
  if (value.name.length < LIMITS.nameMin || value.name.length > LIMITS.nameMax) fields.push("name");
  if (!value.email || value.email.length > LIMITS.emailMax || !EMAIL_RE.test(value.email)) fields.push("email");
  if (!Object.prototype.hasOwnProperty.call(SUBJECTS, value.subject)) fields.push("subject");
  if (value.message.length < LIMITS.messageMin || value.message.length > LIMITS.messageMax) fields.push("message");
  return fields.length ? { ok: false, fields } : { ok: true, value };
}

function json(body, status, extra) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
      "x-content-type-options": "nosniff",
      "referrer-policy": "no-referrer",
      ...(extra || {}),
    },
  });
}

async function shortHash(text) {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  return [...new Uint8Array(buf).slice(0, 10)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

// Contador em caches.default (por data center; aproximado, suficiente contra abuso comum). true = ainda dentro do limite.
export async function hit(cache, scope, id, windowSec, limit, now = Date.now()) {
  if (!cache) return true;
  const key = new Request(`https://rl.invalid/${scope}/${id}`);
  const found = await cache.match(key);
  let count = 0;
  let resetAt = now + windowSec * 1000;
  if (found) {
    const s = await found.json();
    if (s.resetAt > now) { count = s.count; resetAt = s.resetAt; }
  }
  if (count >= limit) return { ok: false, retryAfter: Math.max(1, Math.ceil((resetAt - now) / 1000)) };
  const ttl = Math.max(1, Math.ceil((resetAt - now) / 1000));
  await cache.put(key, new Response(JSON.stringify({ count: count + 1, resetAt }), { headers: { "cache-control": `max-age=${ttl}` } }));
  return { ok: true };
}

// RFC 2047: cada encoded-word ≤ 75 caracteres; parte o texto em blocos de até 42 bytes sem cortar caracteres UTF-8
function encodeWord(s) {
  const enc = new TextEncoder();
  const parts = [];
  let cur = "";
  for (const ch of s) {
    if (enc.encode(cur + ch).length > 42) { parts.push(cur); cur = ""; }
    cur += ch;
  }
  if (cur) parts.push(cur);
  return parts
    .map((p) => {
      let bin = "";
      for (const b of enc.encode(p)) bin += String.fromCharCode(b);
      return `=?UTF-8?B?${btoa(bin)}?=`;
    })
    .join("\r\n ");
}
function b64Lines(s) {
  const bytes = new TextEncoder().encode(s);
  let bin = "";
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin).replace(/(.{76})/g, "$1\r\n");
}

export function buildMail(value, env) {
  const to = EMAIL_RE.test(env.CONTACT_TO || "") ? env.CONTACT_TO : DEFAULT_TO;
  const from = EMAIL_RE.test(env.CONTACT_FROM || "") ? env.CONTACT_FROM : DEFAULT_FROM;
  const subject = `[lucksrei.com] ${SUBJECTS[value.subject]} — ${value.name}`.slice(0, 200);
  const text = `${value.message}\n\n—\nFrom: ${value.name} <${value.email}>\nSubject: ${SUBJECTS[value.subject]}\nSent via lucksrei.com`;
  return { to, from, replyTo: value.email, subject, text };
}

export function rawMime(mail) {
  const id = `<${crypto.randomUUID()}@lucksrei.com>`;
  return [
    `From: ${FROM_NAME} <${mail.from}>`,
    `To: ${mail.to}`,
    `Reply-To: ${mail.replyTo}`,
    `Subject: ${encodeWord(mail.subject)}`,
    `Message-ID: ${id}`,
    `Date: ${new Date().toUTCString()}`,
    "MIME-Version: 1.0",
    "Content-Type: text/plain; charset=UTF-8",
    "Content-Transfer-Encoding: base64",
    "",
    b64Lines(mail.text),
  ].join("\r\n");
}

async function sendWithBinding(env, mail) {
  const { EmailMessage } = await import("cloudflare:email");
  await env.SEND_EMAIL.send(new EmailMessage(mail.from, mail.to, rawMime(mail)));
}

async function sendWithResend(env, mail, fetchImpl) {
  const res = await fetchImpl("https://api.resend.com/emails", {
    method: "POST",
    headers: { authorization: `Bearer ${env.RESEND_API_KEY}`, "content-type": "application/json", "user-agent": "lucksrei-site/contact" },
    body: JSON.stringify({ from: `${FROM_NAME} <${mail.from}>`, to: [mail.to], reply_to: mail.replyTo, subject: mail.subject, text: mail.text }),
    signal: AbortSignal.timeout(10000),
  });
  if (!res.ok) throw new Error("resend_" + res.status);
}

export function configured(env) {
  return !!(env.SEND_EMAIL || env.RESEND_API_KEY);
}

export async function deliver(env, mail, deps = {}) {
  if (deps.send) return deps.send(mail);
  if (env.RESEND_API_KEY) return sendWithResend(env, mail, deps.fetch || fetch);
  if (env.SEND_EMAIL) return sendWithBinding(env, mail);
  throw new Error("not_configured");
}

export async function handleContact(request, env, ctx, deps = {}) {
  if (request.method !== "POST") return new Response(null, { status: 405, headers: { allow: "POST" } });
  let sameOrigin = false;
  try { sameOrigin = request.headers.get("origin") === new URL(request.url).origin; } catch (e) { /* inválido */ }
  if (!sameOrigin) return json({ error: "forbidden" }, 403);
  if (!/^application\/json\b/i.test(request.headers.get("content-type") || "")) return json({ error: "unsupported" }, 415);
  const declared = Number(request.headers.get("content-length"));
  if (declared > LIMITS.bodyMax) return json({ error: "too_large" }, 413);
  if (!(deps.send || configured(env))) return json({ error: "unavailable" }, 503);

  let text;
  try { text = await request.text(); } catch (e) { return json({ error: "invalid", fields: [] }, 400); }
  if (new TextEncoder().encode(text).length > LIMITS.bodyMax) return json({ error: "too_large" }, 413);
  let body;
  try { body = JSON.parse(text); } catch (e) { return json({ error: "invalid", fields: [] }, 400); }
  if (!body || typeof body !== "object" || Array.isArray(body)) return json({ error: "invalid", fields: [] }, 400);

  // honeypot: robôs recebem o mesmo "ok" sem que nada seja enviado
  if (typeof body.website === "string" && body.website.trim() !== "") return json({ ok: true }, 200);

  const now = deps.now ? deps.now() : Date.now();
  const ts = Number(body.ts);
  if (!Number.isFinite(ts) || now - ts < LIMITS.minFillMs || now - ts > LIMITS.maxAgeMs) return json({ error: "invalid", fields: [] }, 400);

  const checked = validateContact(body);
  if (!checked.ok) return json({ error: "invalid", fields: checked.fields }, 400);

  const cache = deps.cache === undefined ? (typeof caches !== "undefined" ? caches.default : null) : deps.cache;
  const ip = request.headers.get("cf-connecting-ip") || "unknown";
  const idHash = await shortHash(ip);
  const checks = [...RATE.map((r) => [r.scope, idHash, r.window, r.limit]), [GLOBAL.scope, "all", GLOBAL.window, GLOBAL.limit]];
  for (const [scope, id, win, limit] of checks) {
    const r = await hit(cache, scope, id, win, limit, now);
    if (r && r.ok === false) return json({ error: "rate_limited" }, 429, { "retry-after": String(r.retryAfter) });
  }

  try {
    await deliver(env, buildMail(checked.value, env), deps);
  } catch (e) {
    if (e && e.message === "not_configured") return json({ error: "unavailable" }, 503);
    console.error("contact delivery failed:", e && /^resend_\d{3}$/.test(e.message) ? e.message : "error");
    return json({ error: "delivery_failed" }, 502);
  }
  return json({ ok: true }, 200);
}
