/* Cloudflare Turnstile — validação no servidor (Siteverify).
 *
 * O navegador só entrega o token; quem decide é este módulo, com o segredo guardado como secret do Worker
 * (TURNSTILE_SECRET_KEY, nunca no repositório, no HTML ou no JS). Aceita só se: success === true, o hostname é do site
 * e a action é a esperada. Com a verificação ativa, qualquer falha de rede, timeout ou resposta inesperada rejeita (falha fechada).
 *
 * Configuração (tudo no Worker; o HTML não leva chave nenhuma):
 *   TURNSTILE_SITE_KEY    variável pública: a sitekey. Servida por GET /api/turnstile-config; sem ela o front nem carrega o widget.
 *   TURNSTILE_SECRET_KEY  secret: só o servidor, para o Siteverify.
 *   TURNSTILE_ENFORCE     variável: "on" torna o Turnstile obrigatório.
 * Ativação (turnstileRequired): TURNSTILE_ENFORCE === "on" E secret E sitekey presentes. Qualquer combinação incompleta NÃO ativa
 * e só avisa (nomes, nunca valores): é um fail-open de CONFIGURAÇÃO (formulário com as defesas de sempre), não do Siteverify;
 * com tudo completo, o Siteverify nunca vira bypass. Nada vindo do cliente decide se o Turnstile é obrigatório.
 * O IP do visitante NÃO é enviado ao Siteverify (remoteip é opcional).
 */

import { API_HEADERS } from "./security.mjs";

export const SITEVERIFY_URL = "https://challenges.cloudflare.com/turnstile/v0/siteverify";
export const DEFAULT_HOSTNAMES = ["lucksrei.com", "www.lucksrei.com"];

// nunca aceitar workers.dev nem hosts locais como hostname de produção, nem por override
const NOT_PRODUCTION = /(^|\.)workers\.dev$|^localhost$|^127\.0\.0\.1$|^\[?::1\]?$/;

export function parseHostnames(raw) {
  const list = String(raw || "").split(",").map((h) => h.trim().toLowerCase()).filter((h) => h && !NOT_PRODUCTION.test(h));
  return list.length ? list : DEFAULT_HOSTNAMES;
}

let warnedMisconfigured = false;
export function resetTurnstileWarning() { warnedMisconfigured = false; }

// A sitekey é pública, mas só vale se tiver o formato esperado (evita servir lixo ao front).
const SITEKEY_RE = /^[A-Za-z0-9_-]{8,100}$/;
export function siteKey(env) {
  const k = env && typeof env.TURNSTILE_SITE_KEY === "string" ? env.TURNSTILE_SITE_KEY.trim() : "";
  return SITEKEY_RE.test(k) ? k : "";
}

// true só com TURNSTILE_ENFORCE === "on" E secret E sitekey. "on" com algo faltando = configuração incompleta: não ativa, avisa (só nomes).
export function turnstileRequired(env) {
  if (!env || env.TURNSTILE_ENFORCE !== "on") return false;
  const missing = [];
  if (!env.TURNSTILE_SECRET_KEY) missing.push("TURNSTILE_SECRET_KEY");
  if (!siteKey(env)) missing.push("TURNSTILE_SITE_KEY");
  if (missing.length) {
    if (!warnedMisconfigured) {
      warnedMisconfigured = true;
      console.warn("contact: TURNSTILE_ENFORCE=on mas falta " + missing.join(" e ") + "; Turnstile NÃO está ativo (o formulário segue com as outras defesas)");
    }
    return false;
  }
  return true;
}

// GET /api/turnstile-config -> { enabled, sitekey }. Só a sitekey pública; nunca o secret nem o estado do enforcement.
export function handleTurnstileConfig(request, env) {
  if (request.method !== "GET") return new Response(null, { status: 405, headers: { ...API_HEADERS, allow: "GET" } });
  const key = siteKey(env);
  return new Response(JSON.stringify({ enabled: key !== "", sitekey: key || null }), {
    status: 200,
    headers: { ...API_HEADERS, "content-type": "application/json; charset=utf-8", "cache-control": "no-store" },
  });
}

// -> { ok: true } | { ok: false, reason: "missing" | "invalid" | "hostname" | "action" | "unavailable" }
export async function verifyTurnstile({ secret, token, hostnames, action, fetchImpl = fetch, timeoutMs = 5000 }) {
  if (typeof token !== "string" || token.length === 0) return { ok: false, reason: "missing" };
  if (token.length > 2048) return { ok: false, reason: "invalid" };
  try {
    const body = new URLSearchParams({ secret, response: token });
    const res = await fetchImpl(SITEVERIFY_URL, { method: "POST", body, signal: AbortSignal.timeout(timeoutMs) });
    if (!res.ok) return { ok: false, reason: "unavailable" };
    const data = await res.json();
    if (!data || data.success !== true) {
      const codes = Array.isArray(data && data["error-codes"]) ? data["error-codes"] : [];
      return { ok: false, reason: codes.includes("internal-error") ? "unavailable" : "invalid" };
    }
    if (!hostnames.includes(String(data.hostname || "").toLowerCase())) return { ok: false, reason: "hostname" };
    if (action && data.action !== action) return { ok: false, reason: "action" };
    return { ok: true };
  } catch (e) {
    return { ok: false, reason: "unavailable" };
  }
}
