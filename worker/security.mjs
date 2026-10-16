/* Defesas compartilhadas pelos endpoints /api/*.
 *
 * - API_HEADERS: cabeçalhos de toda resposta da API (o HTML/CSS/JS recebe os seus em _headers).
 * - overLimit: Cloudflare Workers Rate Limiting (binding "ratelimits" em wrangler.jsonc). O contador roda no próprio
 *   data center, antes de qualquer D1, API externa ou e-mail. Sem o binding (ambiente antigo, testes, wrangler dev)
 *   ou se ele falhar, a requisição passa: o limite nunca pode derrubar o site. A chave é o hash do IP, que existe só
 *   na memória do Worker e nunca é gravado.
 */

export const API_HEADERS = {
  "x-content-type-options": "nosniff",
  "referrer-policy": "no-referrer",
  "x-frame-options": "DENY",
  "cross-origin-resource-policy": "same-origin",
  "content-security-policy": "default-src 'none'; frame-ancestors 'none'",
};

export async function shortHash(text) {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  return [...new Uint8Array(buf).slice(0, 10)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

// true = passou do limite. `scope` "all" usa uma chave única (teto global por data center).
export async function overLimit(env, binding, request, scope) {
  const rl = env && env[binding];
  if (!rl || typeof rl.limit !== "function") return false;
  try {
    const key = scope === "all" ? "all" : await shortHash(request.headers.get("cf-connecting-ip") || "unknown");
    const { success } = await rl.limit({ key });
    return success === false;
  } catch (e) {
    return false;
  }
}

export function tooManyRequests(retryAfter = 60) {
  return new Response(JSON.stringify({ error: "rate_limited" }), {
    status: 429,
    headers: { ...API_HEADERS, "content-type": "application/json; charset=utf-8", "cache-control": "no-store", "retry-after": String(retryAfter) },
  });
}
