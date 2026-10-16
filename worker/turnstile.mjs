/* Cloudflare Turnstile — validação no servidor (Siteverify).
 *
 * O navegador só entrega o token; quem decide é este módulo, com o segredo guardado como secret do Worker
 * (TURNSTILE_SECRET_KEY, nunca no repositório, no HTML ou no JS). Aceita só se: success === true, o hostname é do site
 * e a action é a esperada. Qualquer falha de rede, timeout ou resposta inesperada rejeita (falha fechada).
 */

export const SITEVERIFY_URL = "https://challenges.cloudflare.com/turnstile/v0/siteverify";
export const DEFAULT_HOSTNAMES = ["lucksrei.com", "www.lucksrei.com"];

export function parseHostnames(raw) {
  const list = String(raw || "").split(",").map((h) => h.trim().toLowerCase()).filter(Boolean);
  return list.length ? list : DEFAULT_HOSTNAMES;
}

// -> { ok: true } | { ok: false, reason: "missing" | "invalid" | "hostname" | "action" | "unavailable" }
export async function verifyTurnstile({ secret, token, ip, hostnames, action, fetchImpl = fetch, timeoutMs = 5000 }) {
  if (typeof token !== "string" || token.length === 0) return { ok: false, reason: "missing" };
  if (token.length > 2048) return { ok: false, reason: "invalid" };
  try {
    const body = new URLSearchParams({ secret, response: token });
    if (ip) body.set("remoteip", ip);
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
