/* Turnstile no /api/contact: validação no servidor, falha segura e segredo fora do front. Rode: node tests/turnstile.test.js */
"use strict";
var fs = require("fs");
var path = require("path");
var root = path.join(__dirname, "..");
var failures = [];
function check(ok, msg) { if (!ok) failures.push(msg); }
function read(p) { return fs.readFileSync(path.join(root, p), "utf8"); }

var NOW = 1790000000000;
var SECRET = "test-turnstile-secret-local";
function body(over) { return JSON.stringify(Object.assign({ name: "Ana Souza", email: "ana@example.com", subject: "hiring", message: "Olá Lucas, queremos conversar sobre uma vaga Flutter.", website: "", ts: NOW - 30000, turnstileToken: "tok-valido-123" }, over || {})); }
function post(b, ip) { return new Request("https://lucksrei.com/api/contact", { method: "POST", headers: { origin: "https://lucksrei.com", "content-type": "application/json", "cf-connecting-ip": ip || "203.0.113.9" }, body: b || body() }); }
function memCache() { var m = new Map(); return { match: async function (r) { var v = m.get(r.url); return v ? v.clone() : undefined; }, put: async function (r, res) { m.set(r.url, res); } }; }
function siteverify(result, calls) {
  return async function (url, init) {
    if (calls) calls.push({ url: String(url), init: init });
    var r = typeof result === "function" ? result(init) : result;
    if (r instanceof Error) throw r;
    return new Response(JSON.stringify(r.body || {}), { status: r.status || 200 });
  };
}
var GOOD = { body: { success: true, hostname: "lucksrei.com", action: "contact", challenge_ts: "2026-10-16T10:00:00Z" } };

(async function () {
  var keepAlive = setInterval(function () {}, 50); // AbortSignal.timeout não segura o processo do Node
  var C = await import("../worker/contact.mjs");
  var T = await import("../worker/turnstile.mjs");
  var ctx = { waitUntil: function (p) { return p; } };
  var sent = []; var logged = [];
  var oe = console.error, ol = console.log; console.error = console.log = function () { logged.push([].slice.call(arguments).join(" ")); };
  function run(req, env, fetchImpl, extra) {
    return C.handleContact(req, Object.assign({ TURNSTILE_SECRET_KEY: SECRET }, env || {}), ctx, Object.assign({ cache: memCache(), now: function () { return NOW; }, send: async function (m) { sent.push(m); }, fetch: fetchImpl }, extra || {}));
  }

  // ---- válido
  var calls = [];
  var ok = await run(post(), {}, siteverify(GOOD, calls));
  check(ok.status === 200 && sent.length === 1, "token válido: 200 e e-mail enviado");
  var sv = calls[0], form = sv.init.body;
  check(sv.url === "https://challenges.cloudflare.com/turnstile/v0/siteverify" && sv.init.method === "POST", "Siteverify: POST na URL oficial");
  check(form.get("secret") === SECRET && form.get("response") === "tok-valido-123" && form.get("remoteip") === "203.0.113.9", "Siteverify recebe secret, token e IP");
  check(!!sv.init.signal, "Siteverify com timeout (AbortSignal)");

  // ---- rejeições (nada é enviado, nada chega ao e-mail)
  async function rejected(label, req, env, f, expectStatus, expectError) {
    var before = sent.length; var r = await run(req, env, f); var j = await r.json();
    check(r.status === expectStatus && j.error === expectError && sent.length === before, label + " → " + expectStatus + " " + expectError + " (obtido " + r.status + " " + j.error + ")");
  }
  await rejected("token inválido", post(), {}, siteverify({ body: { success: false, "error-codes": ["invalid-input-response"] } }), 400, "captcha");
  await rejected("token expirado/duplicado", post(), {}, siteverify({ body: { success: false, "error-codes": ["timeout-or-duplicate"] } }), 400, "captcha");
  await rejected("token ausente", post(body({ turnstileToken: undefined })), {}, siteverify(GOOD), 400, "captcha");
  await rejected("token vazio", post(body({ turnstileToken: "" })), {}, siteverify(GOOD), 400, "captcha");
  await rejected("token não-string", post(body({ turnstileToken: { a: 1 } })), {}, siteverify(GOOD), 400, "captcha");
  await rejected("token gigante (> 2048)", post(body({ turnstileToken: "x".repeat(2049) })), {}, siteverify(GOOD), 400, "captcha");
  await rejected("hostname errado", post(), {}, siteverify({ body: { success: true, hostname: "evil.example", action: "contact" } }), 400, "captcha");
  await rejected("hostname de workers.dev", post(), {}, siteverify({ body: { success: true, hostname: "lucksrei-site.x.workers.dev", action: "contact" } }), 400, "captcha");
  await rejected("action errada", post(), {}, siteverify({ body: { success: true, hostname: "lucksrei.com", action: "login" } }), 400, "captcha");
  await rejected("action ausente", post(), {}, siteverify({ body: { success: true, hostname: "lucksrei.com" } }), 400, "captcha");
  await rejected("success ausente", post(), {}, siteverify({ body: { hostname: "lucksrei.com", action: "contact" } }), 400, "captcha");
  await rejected("Siteverify fora do ar (rede)", post(), {}, siteverify(new Error("network down")), 503, "captcha_unavailable");
  await rejected("Siteverify HTTP 500", post(), {}, siteverify({ status: 500 }), 503, "captcha_unavailable");
  await rejected("Siteverify internal-error", post(), {}, siteverify({ body: { success: false, "error-codes": ["internal-error"] } }), 503, "captcha_unavailable");
  await rejected("Siteverify devolve lixo", post(), {}, async function () { return new Response("<html>", { status: 200 }); }, 503, "captcha_unavailable");

  // ---- hostnames: www aceito, caixa ignorada, override por variável
  check((await run(post(), {}, siteverify({ body: { success: true, hostname: "WWW.LuckSrei.com", action: "contact" } }))).status === 200, "www.lucksrei.com (qualquer caixa) aceito");
  check((await run(post(), { TURNSTILE_HOSTNAMES: "preview.exemplo.dev" }, siteverify({ body: { success: true, hostname: "preview.exemplo.dev", action: "contact" } }))).status === 200, "TURNSTILE_HOSTNAMES substitui a lista padrão");
  check(JSON.stringify(T.parseHostnames("")) === JSON.stringify(["lucksrei.com", "www.lucksrei.com"]), "lista padrão de hostnames");

  // ---- timeout real do verificador
  var t0 = Date.now();
  var slow = function (url, init) { return new Promise(function (_, rej) { init.signal.addEventListener("abort", function () { rej(new Error("aborted")); }); }); };
  var tv = await T.verifyTurnstile({ secret: SECRET, token: "t", hostnames: ["lucksrei.com"], action: "contact", fetchImpl: slow, timeoutMs: 80 });
  check(tv.ok === false && tv.reason === "unavailable" && Date.now() - t0 < 1500, "Siteverify pendurado: aborta no timeout e falha fechada (" + (Date.now() - t0) + " ms)");

  // ---- ordem: verificações locais baratas vêm ANTES da chamada de rede
  var cnt = []; 
  await run(post(body({ website: "http://spam.example" })), {}, siteverify(GOOD, cnt));
  await run(post(body({ ts: NOW - 500 })), {}, siteverify(GOOD, cnt));
  await run(post(body({ email: "invalido" })), {}, siteverify(GOOD, cnt));
  await run(new Request("https://lucksrei.com/api/contact", { method: "POST", headers: { origin: "https://evil.example", "content-type": "application/json" }, body: body() }), {}, siteverify(GOOD, cnt));
  check(cnt.length === 0, "honeypot, tempo mínimo, validação e origem cruzada nem chegam ao Siteverify: " + cnt.length);

  // ---- defesas anteriores continuam valendo com Turnstile ligado
  var d = { cache: memCache() }; var codes = [];
  for (var i = 0; i < 5; i++) codes.push((await run(post(), {}, siteverify(GOOD), d)).status);
  check(codes.join() === "200,200,200,429,429", "limite por IP (3/10 min) continua: " + codes.join());

  // ---- sem o secret: verificação desligada, fluxo de sempre
  var c2 = []; var before = sent.length;
  var off = await C.handleContact(post(body({ turnstileToken: undefined })), {}, ctx, { cache: memCache(), now: function () { return NOW; }, send: async function (m) { sent.push(m); }, fetch: siteverify(GOOD, c2) });
  check(off.status === 200 && c2.length === 0 && sent.length === before + 1, "sem TURNSTILE_SECRET_KEY o contato funciona como antes e não chama o Siteverify");

  // ---- segredo e token nunca saem
  console.error = oe; console.log = ol;
  var alllogs = logged.join("\n");
  check(alllogs.indexOf(SECRET) < 0 && alllogs.indexOf("tok-valido-123") < 0, "secret e token nunca aparecem em log");
  var rj = JSON.stringify(await (await run(post(), {}, siteverify({ body: { success: false } }))).json());
  check(rj.indexOf(SECRET) < 0 && rj.indexOf("invalid-input") < 0, "resposta de erro não vaza segredo nem códigos internos");

  // ---- front e repositório: sitekey público (em branco até criar o widget), secret jamais
  ["index.html", "contact/index.html"].forEach(function (f) {
    var h = read(f);
    check(/<form class="contact-form" data-contact-form data-turnstile-sitekey="[^"]*" novalidate>/.test(h), f + ": atributo data-turnstile-sitekey presente");
    check(!/TURNSTILE_SECRET|0x4[A-Za-z0-9_-]{15,}/.test(h), f + ": sem segredo no HTML");
  });
  var js = read("assets/js/contact-form.js");
  check(!/TURNSTILE_SECRET|0x4[A-Za-z0-9_-]{20,}/.test(js), "contact-form.js sem segredo");
  check((js.match(/https:\/\/[a-z.]+/g) || []).filter(function (u) { return /challenges\.cloudflare\.com/.test(u); }).length >= 1 && !/siteverify/i.test(js), "o front só carrega api.js; Siteverify existe apenas no servidor");
  check(/appearance: "interaction-only"/.test(js) && /action: "contact"/.test(js), "widget sem CAPTCHA visual e com action contact");
  check(/if \(sitekey\) mountTurnstile\(\)/.test(js), "sem sitekey, nenhum script de terceiro é carregado");
  var cfg = read("wrangler.jsonc");
  check(!/TURNSTILE|0x4[A-Za-z0-9_-]{15,}/.test(cfg), "wrangler.jsonc sem chaves do Turnstile (o secret vive só no Worker)");
  var gi = require("child_process").execSync("git ls-files", { cwd: root }).toString().split("\n").filter(function (f) { return f && !/^tests\//.test(f) && /\.(js|mjs|html|md|jsonc|json|css|txt)$/.test(f); });
  gi.forEach(function (f) { if (/0x4[A-Za-z0-9_-]{25,}/.test(read(f))) check(false, "possível chave do Turnstile versionada em " + f); });
  var csp = read("_headers");
  check(/script-src 'self' https:\/\/challenges\.cloudflare\.com/.test(csp) && /frame-src https:\/\/challenges\.cloudflare\.com/.test(csp) && /connect-src 'self' https:\/\/challenges\.cloudflare\.com/.test(csp), "CSP prevê script, frame e connect do Turnstile");

  clearInterval(keepAlive);
  if (failures.length) { console.error("FALHOU:\n - " + failures.join("\n - ")); process.exit(1); }
  console.log("ok — turnstile: válido, inválido, ausente, expirado, hostname/action errados, timeout, indisponível (falha fechada), ordem das checagens, desligado sem secret, segredo fora do front");
})().catch(function (e) { console.error(e); process.exit(1); });
