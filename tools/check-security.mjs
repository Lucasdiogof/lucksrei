/* Verifica o site publicado: cabeçalhos de segurança, métodos e respostas da API, e a superfície pública.
 * Uso: node tools/check-security.mjs [https://lucksrei.com] [--workers-dev https://lucksrei-site.<conta>.workers.dev] [--probe-rate-limit]
 *
 * Só faz GET/POST seguros: os POSTs de teste são recusados (origem cruzada ou Content-Type inválido) antes de qualquer envio de e-mail.
 * --probe-rate-limit manda 70 GETs em /api/whoami para ver o 429 do limite de borda (gasta ~70 requisições do Worker, use de vez em quando).
 * Sai com código 1 se algo estiver fora do esperado. Não imprime segredos (não há nenhum aqui).
 */
const args = process.argv.slice(2);
const flag = (n) => { const i = args.indexOf(n); return i >= 0 ? args[i + 1] : null; };
const base = (args.find((a) => /^https?:/.test(a)) || "https://lucksrei.com").replace(/\/$/, "");
const workersDev = flag("--workers-dev");
const probe = args.includes("--probe-rate-limit");
let bad = 0;
const ok = (c, m) => { console.log((c ? "OK    " : "FALHA ") + m); if (!c) bad++; };
const info = (m) => console.log("INFO  " + m);
const get = (p, init) => fetch(base + p, { redirect: "manual", ...init });

for (const p of ["/", "/apps/", "/contact/", "/visitors/", "/projects/fan-hub/"]) {
  const r = await get(p);
  const h = r.headers;
  ok(r.status === 200, `${p} responde 200 (${r.status})`);
  ok(h.get("x-content-type-options") === "nosniff", `${p}: X-Content-Type-Options`);
  ok(h.get("x-frame-options") === "DENY" && /frame-ancestors 'none'/.test(h.get("content-security-policy") || ""), `${p}: anti-clickjacking (X-Frame-Options + frame-ancestors)`);
  ok(/camera=\(\)/.test(h.get("permissions-policy") || ""), `${p}: Permissions-Policy`);
  ok(!!h.get("referrer-policy") && h.get("cross-origin-opener-policy") === "same-origin", `${p}: Referrer-Policy e COOP`);
  const hsts = h.get("strict-transport-security") || "";
  ok(/max-age=\d+/.test(hsts) && !/preload|includeSubDomains/i.test(hsts), `${p}: HSTS conservador (${hsts || "ausente"})`);
  ok(!!(h.get("content-security-policy") || h.get("content-security-policy-report-only")), `${p}: CSP presente`);
}
{
  const r = await get("/");
  const html = await r.text();
  const m = html.match(/data-turnstile-sitekey="([^"]*)"/);
  info(`Turnstile no HTML: ${m && m[1] ? "sitekey configurada" : "sitekey vazia (verificação desligada)"}`);
  const c = r.headers.get("content-security-policy") || "";
  info(`CSP de recursos: ${/default-src/.test(c) ? "APLICADA" : "em Report-Only (promover depois de validar o console)"}`);
}
for (const [p, method, status] of [["/api/visit", "GET", 405], ["/api/whoami", "POST", 405], ["/api/visitors", "DELETE", 405], ["/api/contact", "GET", 405], ["/api/nao-existe", "GET", 404]]) {
  const r = await get(p, { method });
  ok(r.status === status && r.headers.get("x-content-type-options") === "nosniff" && r.headers.get("cross-origin-resource-policy") === "same-origin", `${method} ${p} → ${status} com cabeçalhos da API (${r.status})`);
}
for (const p of ["/api/whoami", "/api/visitors"]) {
  const r = await get(p);
  ok(r.status === 200 && /json/.test(r.headers.get("content-type") || ""), `GET ${p} → 200 JSON`);
}
{
  const r = await get("/api/github-contributions");
  ok(r.status === 404, `GET /api/github-contributions → 404 (desligado por padrão; ${r.status})`);
}
{
  const r = await get("/api/contact", { method: "POST", headers: { origin: "https://exemplo-malicioso.test", "content-type": "application/json" }, body: "{}" });
  ok(r.status === 403, `POST /api/contact de outra origem → 403 (${r.status})`);
  const r2 = await get("/api/contact", { method: "POST", headers: { origin: base, "content-type": "text/plain" }, body: "x" });
  ok([415, 429, 503].includes(r2.status), `POST /api/contact com Content-Type inválido é recusado (${r2.status})`);
}
for (const p of ["/.env", "/.git/config", "/worker/index.mjs", "/wrangler.jsonc", "/tools/check-security.mjs", "/tests/security.test.js", "/docs/security.md", "/DESIGN.md"]) {
  const r = await get(p);
  const body = r.status === 200 ? await r.text() : "";
  ok(r.status !== 200 || /<html/i.test(body.slice(0, 400)) && /404|not found|não encontrad/i.test(body), `${p} não é servido (${r.status})`);
}
if (workersDev) {
  try {
    const r = await fetch(workersDev.replace(/\/$/, "") + "/", { redirect: "manual" });
    ok(r.status >= 400, `workers.dev ${workersDev} não serve o site (${r.status})`);
  } catch (e) {
    ok(true, `workers.dev ${workersDev} inalcançável (desativado)`);
  }
} else info("workers.dev não testado (passe --workers-dev <url>)");
if (probe) {
  const codes = [];
  for (let i = 0; i < 70; i++) codes.push((await get("/api/whoami")).status);
  const n429 = codes.filter((c) => c === 429).length;
  ok(n429 > 0, `limite de borda em /api/whoami: ${n429} respostas 429 em 70 chamadas`);
}
console.log(bad ? `\n${bad} verificação(ões) com falha` : "\nTudo conforme o esperado");
process.exit(bad ? 1 : 0);
