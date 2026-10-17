/* Cloudflare Turnstile — validação no servidor (Siteverify).
 *
 * O navegador só entrega o token; quem decide é este módulo, com o segredo guardado como secret do Worker
 * (TURNSTILE_SECRET_KEY, nunca no repositório, no HTML ou no JS). Aceita só se: success === true, o hostname é do site
 * e a action é a esperada. Com a verificação ativa, qualquer falha de rede, timeout ou resposta inesperada rejeita (falha fechada).
 *
 * Ativação (turnstileRequired): TURNSTILE_ENFORCE === "on" E TURNSTILE_SECRET_KEY presente. É um fail-open de CONFIGURAÇÃO
 * (nada ativado = formulário com as defesas de sempre), não do Siteverify: ativo, o Siteverify nunca vira bypass.
 * O IP do visitante NÃO é enviado ao Siteverify (remoteip é opcional).
 */

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

// true só com TURNSTILE_ENFORCE === "on" e o secret presente. "on" sem secret = configuração incompleta: não ativa, só avisa (sem valores).
export function turnstileRequired(env) {
  if (!env || env.TURNSTILE_ENFORCE !== "on") return false;
  if (!env.TURNSTILE_SECRET_KEY) {
    if (!warnedMisconfigured) {
      warnedMisconfigured = true;
      console.warn("contact: TURNSTILE_ENFORCE=on sem TURNSTILE_SECRET_KEY; Turnstile NÃO está ativo (o formulário segue com as outras defesas)");
    }
    return false;
  }
  return true;
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
