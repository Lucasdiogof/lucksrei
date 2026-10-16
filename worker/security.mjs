/* Defesas compartilhadas pelos endpoints /api/*.
 *
 * - API_HEADERS: cabeçalhos de toda resposta da API (o HTML/CSS/JS recebe os seus em _headers).
 * - overLimit: Cloudflare Workers Rate Limiting (binding "ratelimits" em wrangler.jsonc). É limitação na camada da
 *   aplicação: roda DENTRO do Worker, depois que ele já foi invocado, então NÃO poupa requisições do Worker nem
 *   substitui WAF/Rate Limiting Rules da zona. Serve para proteger recursos a jusante (D1, Resend). O contador é local
 *   a cada localização (data center) da Cloudflare, não é global. Sem o binding (ambiente antigo, testes, wrangler dev)
 *   ou se ele falhar, a requisição passa (falha aberta): o limite nunca pode derrubar o site. A chave por IP é o hash
 *   do IP, que existe só na memória do Worker e nunca é gravado.
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

// true = passou do limite. `scope` "shared" usa uma chave única compartilhada por todos os IPs, mas só dentro da
// mesma localização da Cloudflare (teto por colo, não global).
export async function overLimit(env, binding, request, scope) {
  const rl = env && env[binding];
  if (!rl || typeof rl.limit !== "function") return false;
  try {
    const key = scope === "shared" ? "shared" : await shortHash(request.headers.get("cf-connecting-ip") || "unknown");
    const { success } = await rl.limit({ key });
    return success === false;
  } catch (e) {
    return false;
  }
}
