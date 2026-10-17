/* Turnstile no /api/contact: ativação por TURNSTILE_ENFORCE, validação no servidor, falha segura, front que nunca decide e segredo fora do front. Rode: node tests/turnstile.test.js */
"use strict";
var fs = require("fs");
var path = require("path");
var root = path.join(__dirname, "..");
var failures = [];
function check(ok, msg) { if (!ok) failures.push(msg); }
function read(p) { return fs.readFileSync(path.join(root, p), "utf8"); }

var NOW = 1790000000000;
var SECRET = "test-turnstile-secret-local";
var SITE = "1x-sitekey-publica-teste";
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
  var oe = console.error, ol = console.log, ow = console.warn; console.error = console.log = console.warn = function () { logged.push([].slice.call(arguments).join(" ")); };
  function run(req, env, fetchImpl, extra) {
    return C.handleContact(req, Object.assign({ TURNSTILE_SECRET_KEY: SECRET, TURNSTILE_SITE_KEY: SITE, TURNSTILE_ENFORCE: "on" }, env || {}), ctx, Object.assign({ cache: memCache(), now: function () { return NOW; }, send: async function (m) { sent.push(m); }, fetch: fetchImpl }, extra || {}));
  }

  // ---- válido
  var calls = [];
  var ok = await run(post(), {}, siteverify(GOOD, calls));
  check(ok.status === 200 && sent.length === 1, "token válido: 200 e e-mail enviado");
  var sv = calls[0], form = sv.init.body;
  check(sv.url === "https://challenges.cloudflare.com/turnstile/v0/siteverify" && sv.init.method === "POST", "Siteverify: POST na URL oficial");
  check(form.get("secret") === SECRET && form.get("response") === "tok-valido-123" && !form.has("remoteip") && Array.from(form.keys()).sort().join() === "response,secret", "Siteverify recebe só secret e token: o IP do visitante (remoteip) não é enviado");
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

  // ---- ativação: só TURNSTILE_ENFORCE === "on" E secret. Qualquer outro estado = fluxo de sempre, sem Siteverify
  async function plain(label, env, over, expectWarn) {
    var c = []; var b = sent.length; var w0 = logged.length;
    var r = await C.handleContact(post(body(over)), env, ctx, { cache: memCache(), now: function () { return NOW; }, send: async function (m) { sent.push(m); }, fetch: siteverify(GOOD, c) });
    check(r.status === 200 && c.length === 0 && sent.length === b + 1, label + ": formulário funciona e o Siteverify não é chamado (status " + r.status + ", chamadas " + c.length + ")");
    return logged.slice(w0);
  }
  var NO_TOKEN = { turnstileToken: undefined };
  await plain("A) sem sitekey, sem secret, enforce off", {}, NO_TOKEN);
  await plain("B) sitekey sem secret, enforce off (token enviado e ignorado)", { TURNSTILE_SITE_KEY: SITE }, {});
  await plain("B2) sitekey sem secret, enforce off, widget falhou (sem token)", { TURNSTILE_SITE_KEY: SITE }, NO_TOKEN);
  await plain("C) sitekey + secret, enforce off (token enviado e ignorado)", { TURNSTILE_SITE_KEY: SITE, TURNSTILE_SECRET_KEY: SECRET }, {});
  await plain("C2) sitekey + secret, enforce off, sem token (widget falhou)", { TURNSTILE_SITE_KEY: SITE, TURNSTILE_SECRET_KEY: SECRET }, NO_TOKEN);
  await plain("E) sem sitekey, secret, enforce off", { TURNSTILE_SECRET_KEY: SECRET }, NO_TOKEN);
  await plain("enforce=off explícito", { TURNSTILE_SITE_KEY: SITE, TURNSTILE_SECRET_KEY: SECRET, TURNSTILE_ENFORCE: "off" }, NO_TOKEN);
  await plain("enforce vazio", { TURNSTILE_SITE_KEY: SITE, TURNSTILE_SECRET_KEY: SECRET, TURNSTILE_ENFORCE: "" }, NO_TOKEN);
  await plain("enforce com valor fora do contrato ('true' não ativa)", { TURNSTILE_SITE_KEY: SITE, TURNSTILE_SECRET_KEY: SECRET, TURNSTILE_ENFORCE: "true" }, NO_TOKEN);
  await plain("enforce 'ON' em maiúsculas não ativa (só o valor exato 'on')", { TURNSTILE_SITE_KEY: SITE, TURNSTILE_SECRET_KEY: SECRET, TURNSTILE_ENFORCE: "ON" }, NO_TOKEN);
  var full = { TURNSTILE_ENFORCE: "on", TURNSTILE_SECRET_KEY: "x", TURNSTILE_SITE_KEY: SITE };
  check(T.turnstileRequired(full) === true && T.turnstileRequired({}) === false && T.turnstileRequired(null) === false, "turnstileRequired: true só com enforce=on + secret + sitekey");
  check(T.turnstileRequired({ ...full, TURNSTILE_SITE_KEY: "tem espaço" }) === false && T.turnstileRequired({ ...full, TURNSTILE_SITE_KEY: "x".repeat(101) }) === false && T.turnstileRequired({ ...full, TURNSTILE_SITE_KEY: "" }) === false, "sitekey vazia ou fora do formato não conta como presente");

  // configurações incompletas com enforce=on: não ativam, não derrubam o formulário, avisam uma vez (só nomes, nunca valores)
  async function incomplete(label, env, mustMention, mustNot) {
    T.resetTurnstileWarning();
    var l1 = await plain(label, env, NO_TOKEN);
    var w = l1.filter(function (l) { return /TURNSTILE_ENFORCE=on mas falta ou é inválida/.test(l); });
    check(w.length === 1 && w[0].indexOf(mustMention) >= 0 && (!mustNot || w[0].indexOf(mustNot) < 0) && w[0].indexOf(SECRET) < 0 && w[0].indexOf(SITE) < 0, label + ": aviso único, só com o nome do que falta e sem valores");
    var l2 = await plain(label + " (2ª requisição)", env, NO_TOKEN);
    check(l2.filter(function (l) { return /TURNSTILE_ENFORCE/.test(l); }).length === 0, label + ": o aviso não se repete a cada requisição");
  }
  await incomplete("F) enforce=on + secret, SEM sitekey", { TURNSTILE_ENFORCE: "on", TURNSTILE_SECRET_KEY: SECRET }, "TURNSTILE_SITE_KEY", "TURNSTILE_SECRET_KEY");
  await incomplete("G) enforce=on + sitekey, SEM secret", { TURNSTILE_ENFORCE: "on", TURNSTILE_SITE_KEY: SITE }, "TURNSTILE_SECRET_KEY", "TURNSTILE_SITE_KEY");
  await incomplete("H) enforce=on sem secret e sem sitekey", { TURNSTILE_ENFORCE: "on" }, "TURNSTILE_SITE_KEY e TURNSTILE_SECRET_KEY");

  // ---- /api/contact de ponta a ponta: nenhuma configuração ausente, incompleta OU INVÁLIDA ativa o enforcement
  async function e2e(label, env, expectRequired, expectWarn) {
    T.resetTurnstileWarning();
    var c = []; var b = sent.length; var w0 = logged.length;
    var r = await C.handleContact(post(body(NO_TOKEN)), env, ctx, { cache: memCache(), now: function () { return NOW; }, send: async function (m) { sent.push(m); }, fetch: siteverify(GOOD, c) });
    var wl = logged.slice(w0);
    if (expectRequired) check(r.status === 400 && sent.length === b && c.length === 0, label + ": EXIGE (sem token → 400, nada enviado, Siteverify nem chamado)");
    else check(r.status === 200 && sent.length === b + 1 && c.length === 0, label + ": NÃO exige (200, e-mail enviado, Siteverify NÃO chamado) — status " + r.status + ", chamadas " + c.length);
    var warns = wl.filter(function (l) { return /TURNSTILE_ENFORCE=on mas falta ou é inválida/.test(l); });
    check(expectWarn ? warns.length === 1 : warns.length === 0, label + ": " + (expectWarn ? "warning único de configuração" : "sem warning de configuração") + " (" + warns.length + ")");
    check(wl.every(function (l) { return l.indexOf(SECRET) < 0 && l.indexOf("non-empty-test-secret") < 0 && l.indexOf(SITE) < 0 && l.indexOf('"abc"') < 0; }), label + ": nenhum valor sensível no log");
    return warns[0] || "";
  }
  var okSecret = "non-empty-test-secret";
  var wAbc = await e2e('sitekey "abc" (curta/inválida) + secret + enforce=on', { TURNSTILE_SITE_KEY: "abc", TURNSTILE_SECRET_KEY: okSecret, TURNSTILE_ENFORCE: "on" }, false, true);
  check(wAbc.indexOf("TURNSTILE_SITE_KEY") >= 0 && wAbc.indexOf("TURNSTILE_SECRET_KEY") < 0 && !/\babc\b/.test(wAbc.replace("TURNSTILE_ENFORCE=on mas falta ou é inválida", "")), 'o warning de "abc" cita só o nome TURNSTILE_SITE_KEY, não o valor');
  await e2e("sitekey só com espaços + secret + enforce=on", { TURNSTILE_SITE_KEY: "   ", TURNSTILE_SECRET_KEY: okSecret, TURNSTILE_ENFORCE: "on" }, false, true);
  await e2e("sitekey vazia + secret + enforce=on", { TURNSTILE_SITE_KEY: "", TURNSTILE_SECRET_KEY: okSecret, TURNSTILE_ENFORCE: "on" }, false, true);
  await e2e("sitekey com caractere inválido + secret + enforce=on", { TURNSTILE_SITE_KEY: "chave com espaço!", TURNSTILE_SECRET_KEY: okSecret, TURNSTILE_ENFORCE: "on" }, false, true);
  await e2e("sitekey > 100 caracteres + secret + enforce=on", { TURNSTILE_SITE_KEY: "k".repeat(101), TURNSTILE_SECRET_KEY: okSecret, TURNSTILE_ENFORCE: "on" }, false, true);
  await e2e("sitekey não-string + secret + enforce=on", { TURNSTILE_SITE_KEY: 12345678, TURNSTILE_SECRET_KEY: okSecret, TURNSTILE_ENFORCE: "on" }, false, true);
  await e2e("sitekey válida + secret só com espaços + enforce=on", { TURNSTILE_SITE_KEY: SITE, TURNSTILE_SECRET_KEY: "   ", TURNSTILE_ENFORCE: "on" }, false, true);
  await e2e("sitekey válida + secret vazio + enforce=on", { TURNSTILE_SITE_KEY: SITE, TURNSTILE_SECRET_KEY: "", TURNSTILE_ENFORCE: "on" }, false, true);
  await e2e("sitekey válida + secret não-string + enforce=on", { TURNSTILE_SITE_KEY: SITE, TURNSTILE_SECRET_KEY: 12345, TURNSTILE_ENFORCE: "on" }, false, true);
  await e2e('sitekey válida + secret + enforce="ON"', { TURNSTILE_SITE_KEY: SITE, TURNSTILE_SECRET_KEY: okSecret, TURNSTILE_ENFORCE: "ON" }, false, false);
  await e2e('sitekey válida + secret + enforce="true"', { TURNSTILE_SITE_KEY: SITE, TURNSTILE_SECRET_KEY: okSecret, TURNSTILE_ENFORCE: "true" }, false, false);
  await e2e("sitekey válida + secret + enforce ausente", { TURNSTILE_SITE_KEY: SITE, TURNSTILE_SECRET_KEY: okSecret }, false, false);
  await e2e('sitekey válida + secret + enforce="on" → EXIGE', { TURNSTILE_SITE_KEY: SITE, TURNSTILE_SECRET_KEY: okSecret, TURNSTILE_ENFORCE: "on" }, true, false);
  // sitekey e secret com espaços nas pontas são normalizados (trim) e o Siteverify recebe o secret já normalizado
  var cTrim = []; var bTrim = sent.length;
  var rTrim = await C.handleContact(post(body()), { TURNSTILE_SITE_KEY: "  " + SITE + "  ", TURNSTILE_SECRET_KEY: "  " + okSecret + "\n", TURNSTILE_ENFORCE: "on" }, ctx, { cache: memCache(), now: function () { return NOW; }, send: async function (m) { sent.push(m); }, fetch: siteverify(GOOD, cTrim) });
  check(rTrim.status === 200 && sent.length === bTrim + 1 && cTrim.length === 1 && cTrim[0].init.body.get("secret") === okSecret, "enforce=on com espaços nas pontas: exige, token válido segue e o Siteverify recebe o secret normalizado");
  check(T.getTurnstileSiteKey({ TURNSTILE_SITE_KEY: " " + SITE + " " }) === SITE && T.getTurnstileSiteKey({ TURNSTILE_SITE_KEY: "abc" }) === null && T.getTurnstileSiteKey({}) === null && T.getTurnstileSiteKey(null) === null, "getTurnstileSiteKey: válida normalizada, o resto null");
  check(T.getTurnstileSecret({ TURNSTILE_SECRET_KEY: "  s3  " }) === "s3" && T.getTurnstileSecret({ TURNSTILE_SECRET_KEY: " \t " }) === null && T.getTurnstileSecret({ TURNSTILE_SECRET_KEY: 7 }) === null && T.getTurnstileSecret({}) === null, "getTurnstileSecret: trim, vazio/whitespace/não-string = null");
  // a MESMA regra: tudo que o endpoint de config recusa, o enforcement também recusa (e vice-versa)
  var Wcfg = (await import("../worker/index.mjs")).default;
  var samples = ["abc", "", "   ", SITE, " " + SITE + " ", "x".repeat(8), "x".repeat(100), "x".repeat(101), "bad key", "bad/key", undefined, null, 123456789, { a: 1 }];
  for (var si = 0; si < samples.length; si++) {
    var envS = { TURNSTILE_SITE_KEY: samples[si], TURNSTILE_SECRET_KEY: okSecret, TURNSTILE_ENFORCE: "on" };
    var cj = await (await Wcfg.fetch(new Request("https://lucksrei.com/api/turnstile-config"), envS, ctx)).json();
    T.resetTurnstileWarning(); var logsBefore = logged.length;
    check(cj.enabled === T.turnstileRequired(envS) && (cj.enabled ? cj.sitekey === T.getTurnstileSiteKey(envS) : cj.sitekey === null), "config e enforcement concordam para sitekey " + JSON.stringify(samples[si]) + " (enabled=" + cj.enabled + ")");
  }

  // D) enforce=on + secret + sitekey: obrigatório; sem token nada é enviado e o Siteverify nem é chamado
  var cD = []; var bD = sent.length;
  var noTok = await run(post(body(NO_TOKEN)), {}, siteverify(GOOD, cD));
  check(noTok.status === 400 && (await noTok.json()).error === "captcha" && cD.length === 0 && sent.length === bD, "D) enforce=on sem token: 400 captcha, sem e-mail, sem chamar a Cloudflare");
  var dupSeen = {};
  var dupSv = function (url, init) { var tk = init.body.get("response"); var r = dupSeen[tk] ? { success: false, "error-codes": ["timeout-or-duplicate"] } : { success: true, hostname: "lucksrei.com", action: "contact" }; dupSeen[tk] = true; return Promise.resolve(new Response(JSON.stringify(r), { status: 200 })); };
  var first = await run(post(body({ turnstileToken: "tok-replay" })), {}, dupSv);
  var replay = await run(post(body({ turnstileToken: "tok-replay" }), "203.0.113.10"), {}, dupSv);
  check(first.status === 200 && replay.status === 400 && (await replay.json()).error === "captcha", "D) replay do mesmo token (Siteverify simulado devolve timeout-or-duplicate): rejeitado");
  var wrn = logged.filter(function (l) { return /turnstile recusado/.test(l); });
  check(wrn.length > 0 && wrn.every(function (l) { return !l.includes(SECRET) && !l.includes("tok-") && !l.includes("203.0.113"); }), "rejeições registram só o motivo, sem token, secret nem IP");

  // hostnames de produção: workers.dev e hosts locais nunca entram, nem por override
  check(JSON.stringify(T.parseHostnames("x.workers.dev, localhost,127.0.0.1,[::1]")) === JSON.stringify(["lucksrei.com", "www.lucksrei.com"]), "override com workers.dev/localhost/127.0.0.1 é ignorado");
  check(JSON.stringify(T.parseHostnames("a.exemplo.dev,b.workers.dev")) === JSON.stringify(["a.exemplo.dev"]), "o filtro tira só os hosts não-produção");

  // ---- segredo e token nunca saem
  console.error = oe; console.log = ol; console.warn = ow;
  var alllogs = logged.join("\n");
  check(alllogs.indexOf(SECRET) < 0 && alllogs.indexOf("tok-valido-123") < 0, "secret e token nunca aparecem em log");
  var rj = JSON.stringify(await (await run(post(), {}, siteverify({ body: { success: false } }))).json());
  check(rj.indexOf(SECRET) < 0 && rj.indexOf("invalid-input") < 0, "resposta de erro não vaza segredo nem códigos internos");

  // ---- front e repositório: sitekey público (em branco até criar o widget), secret jamais
  ["index.html", "contact/index.html"].forEach(function (f) {
    var h = read(f);
    check(/<form class="contact-form" data-contact-form data-turnstile-contact novalidate>/.test(h) && !/data-turnstile-sitekey/.test(h), f + ": só o marcador data-turnstile-contact, sem sitekey no HTML");
    check(!/TURNSTILE_SECRET|0x4[A-Za-z0-9_-]{15,}/.test(h), f + ": sem segredo no HTML");
  });
  var js = read("assets/js/contact-form.js");
  check(!/TURNSTILE_SECRET|0x4[A-Za-z0-9_-]{20,}/.test(js), "contact-form.js sem segredo");
  check((js.match(/https:\/\/[a-z.]+/g) || []).filter(function (u) { return /challenges\.cloudflare\.com/.test(u); }).length >= 1 && !/siteverify/i.test(js), "o front só carrega api.js; Siteverify existe apenas no servidor");
  check(/appearance: "interaction-only"/.test(js) && /action: "contact"/.test(js), "widget sem CAPTCHA visual e com action contact");
  check(/if \(withTurnstile\) mountTurnstile\(\)/.test(js) && /\/api\/turnstile-config/.test(js) && !/data-turnstile-sitekey/.test(js), "o front só usa o marcador e busca a sitekey em /api/turnstile-config");
  check(!/setStatus\("error", "contact\.form\.fail_captcha"\)/.test(js), "o front não bloqueia o envio por causa do Turnstile (a mensagem vem só da resposta do servidor)");
  check(!/theme: "dark"|theme: "light"/.test(js) && /getAttribute\("data-theme"\)/.test(js), "tema do widget vem do tema real do site, não fixo");
  check(!/\.set\(\s*"remoteip"/.test(read("worker/turnstile.mjs")) && !/ip: request\.headers/.test(read("worker/contact.mjs")), "remoteip não é enviado ao Siteverify");
  var cfg = read("wrangler.jsonc");
  check(!/TURNSTILE|0x4[A-Za-z0-9_-]{15,}/.test(cfg), "wrangler.jsonc sem chaves do Turnstile (o secret vive só no Worker)");
  var gi = require("child_process").execSync("git ls-files", { cwd: root }).toString().split("\n").filter(function (f) { return f && !/^tests\//.test(f) && /\.(js|mjs|html|md|jsonc|json|css|txt)$/.test(f); });
  gi.forEach(function (f) { if (/0x4[A-Za-z0-9_-]{25,}/.test(read(f))) check(false, "possível chave do Turnstile versionada em " + f); });
  var csp = read("_headers");
  check(/script-src 'self' https:\/\/challenges\.cloudflare\.com/.test(csp) && /frame-src https:\/\/challenges\.cloudflare\.com/.test(csp) && /connect-src 'self' https:\/\/challenges\.cloudflare\.com/.test(csp), "CSP prevê script, frame e connect do Turnstile");

  // ---- GET /api/turnstile-config: só a sitekey pública
  var Wk = (await import("../worker/index.mjs")).default;
  function cfgReq(method) { return new Request("https://lucksrei.com/api/turnstile-config", { method: method || "GET" }); }
  var cfgOf = async function (env) { return JSON.stringify(await (await Wk.fetch(cfgReq(), env, ctx)).json()); };
  var DIS = JSON.stringify({ enabled: false, sitekey: null });
  check(await cfgOf({}) === DIS && await cfgOf({ TURNSTILE_SITE_KEY: "" }) === DIS && await cfgOf({ TURNSTILE_SITE_KEY: "   " }) === DIS && await cfgOf({ TURNSTILE_SITE_KEY: "abc" }) === DIS, "config: ausente, vazia, whitespace e malformada → disabled");
  check(await cfgOf({ TURNSTILE_SITE_KEY: "  " + SITE + " " }) === JSON.stringify({ enabled: true, sitekey: SITE }), "config: sitekey válida é devolvida normalizada (trim)");
  var noKey = await Wk.fetch(cfgReq(), { TURNSTILE_SECRET_KEY: SECRET, TURNSTILE_ENFORCE: "on" }, ctx);
  check(noKey.status === 200 && JSON.stringify(await noKey.json()) === JSON.stringify({ enabled: false, sitekey: null }), "config sem sitekey: 200 { enabled: false, sitekey: null }");
  var withKey = await Wk.fetch(cfgReq(), { TURNSTILE_SITE_KEY: SITE, TURNSTILE_SECRET_KEY: SECRET, TURNSTILE_ENFORCE: "on" }, ctx);
  var wkText = await withKey.text();
  check(withKey.status === 200 && JSON.stringify(JSON.parse(wkText)) === JSON.stringify({ enabled: true, sitekey: SITE }), "config com sitekey: 200 { enabled: true, sitekey }");
  check(wkText.indexOf(SECRET) < 0 && !/enforce|secret|on"/i.test(wkText) && Object.keys(JSON.parse(wkText)).join() === "enabled,sitekey" && wkText.length < 100, "a resposta não traz secret, enforcement nem nada interno, e é pequena (" + wkText.length + " B)");
  check(withKey.headers.get("cache-control") === "no-store" && /json/.test(withKey.headers.get("content-type")) && withKey.headers.get("x-content-type-options") === "nosniff" && withKey.headers.get("cross-origin-resource-policy") === "same-origin" && /default-src 'none'/.test(withKey.headers.get("content-security-policy")) && withKey.headers.get("x-frame-options") === "DENY", "config: no-store e os mesmos cabeçalhos de segurança da API");
  var dbTouched = 0; var guardEnv = { TURNSTILE_SITE_KEY: SITE, DB: { prepare: function () { dbTouched++; throw new Error("D1 não deve ser usado"); } } };
  await Wk.fetch(cfgReq(), guardEnv, ctx);
  check(dbTouched === 0, "config não toca o D1");
  for (var mi = 0; mi < 3; mi++) {
    var mm = ["POST", "PUT", "DELETE"][mi];
    var rm = await Wk.fetch(cfgReq(mm), { TURNSTILE_SITE_KEY: SITE }, ctx);
    check(rm.status === 405 && rm.headers.get("allow") === "GET" && rm.headers.get("x-content-type-options") === "nosniff", mm + " /api/turnstile-config → 405");
  }
  var badKey = await Wk.fetch(cfgReq(), { TURNSTILE_SITE_KEY: "<script>alert(1)</script>" }, ctx);
  check(JSON.stringify(await badKey.json()) === JSON.stringify({ enabled: false, sitekey: null }), "sitekey fora do formato nunca é servida");

  // ---- front: o Turnstile só tenta obter um token; nunca decide (createTurnstile com window simulado)
  var F = require("../assets/js/contact-form.js");
  function fakeWin(o) {
    var scripts = []; var w = { rendered: [], removed: [], resets: [], theme: o.theme || "dark" };
    var n = 0;
    function fire(params) {
      if (o.widget === "token") setTimeout(function () { params.callback("tok-front-" + (++n)); }, 5);
      else if (o.widget === "error") setTimeout(function () { params["error-callback"](); }, 5);
    }
    var ts = {
      render: function (box, params) { if (o.renderThrows) throw new Error("x"); w.rendered.push(params); fire(params); return "w" + w.rendered.length; },
      remove: function (id) { w.removed.push(id); },
      reset: function (id) { w.resets.push(id); fire(w.rendered[w.rendered.length - 1]); }
    };
    w.document = {
      documentElement: { getAttribute: function (a) { return a === "data-theme" ? w.theme : null; } },
      getElementById: function (id) { return scripts.filter(function (x) { return x.id === id; })[0] || null; },
      createElement: function () { return {}; },
      head: { appendChild: function (sc) { scripts.push(sc); setTimeout(function () { if (o.scriptFails) sc.onerror && sc.onerror(); else { w.turnstile = ts; sc.onload && sc.onload(); } }, 5); } }
    };
    w.setTimeout = setTimeout; w.scripts = scripts;
    return w;
  }
  var CFG_ON = { enabled: true, sitekey: "1x-sitekey-publica" };
  // o.config: objeto (resposta do endpoint), "fail" (rota falha) ou { delay, value }
  function gateFor(o, loc) {
    var w = fakeWin(o); var locale = { v: loc || "en" }; var cfgCalls = { n: 0 };
    var cfg = o.config === undefined ? CFG_ON : o.config;
    var g = F.createTurnstile({ root: w, box: {}, getLocale: function () { return locale.v; }, waitMs: o.waitMs == null ? 300 : o.waitMs,
      fetchConfig: function () {
        cfgCalls.n++;
        if (cfg === "fail") return Promise.reject(new Error("config 500"));
        if (cfg && cfg.delay) return new Promise(function (r) { setTimeout(function () { r(cfg.value); }, cfg.delay); });
        return Promise.resolve(cfg);
      } });
    return { w: w, g: g, locale: locale, cfgCalls: cfgCalls };
  }
  async function timed(p) { var t = Date.now(); var v = await p; return { v: v, ms: Date.now() - t }; }

  var fOk = gateFor({ widget: "token" });
  var t1 = await timed(fOk.g.obtain());
  check(t1.v === "tok-front-1" && fOk.cfgCalls.n === 1 && fOk.w.scripts.length === 1 && /challenges\.cloudflare\.com\/turnstile\/v0\/api\.js\?render=explicit/.test(fOk.w.scripts[0].src), "front: busca a config, carrega o api.js oficial uma vez e obtém o token");
  check(fOk.w.rendered[0].action === "contact" && fOk.w.rendered[0].appearance === "interaction-only" && fOk.w.rendered[0].sitekey === "1x-sitekey-publica", "front: render com a sitekey do endpoint, action contact e interaction-only");
  var t1b = await timed(fOk.g.obtain());
  check(t1b.v === "" && fOk.cfgCalls.n === 1, "front: o token já usado NÃO é reaproveitado numa segunda tentativa sem reset (e a config não é buscada de novo)");
  fOk.g.reset();
  var t2 = await fOk.g.obtain();
  check(fOk.w.resets.length === 1 && t2 === "tok-front-2" && t2 !== t1.v, "front: reset após a tentativa e token novo na seguinte (" + t2 + " ≠ " + t1.v + ")");

  var fOff = gateFor({ widget: "token", config: { enabled: false, sitekey: null } });
  var t0a = await timed(fOff.g.obtain());
  check(t0a.v === "" && t0a.ms < 200 && fOff.w.scripts.length === 0 && fOff.w.rendered.length === 0, "front: endpoint diz disabled → nada de terceiros, sem espera (" + t0a.ms + " ms)");
  var fCfgFail = gateFor({ widget: "token", config: "fail" });
  var t0b = await timed(fCfgFail.g.obtain());
  check(t0b.v === "" && t0b.ms < 200 && fCfgFail.w.scripts.length === 0, "front: rota de config falha → segue sem token, sem carregar nada (" + t0b.ms + " ms)");
  var fBadCfg = [{ enabled: true, sitekey: "" }, { enabled: "true", sitekey: "abc" }, { enabled: true, sitekey: 5 }, null];
  for (var bi = 0; bi < fBadCfg.length; bi++) {
    var fb = gateFor({ widget: "token", config: fBadCfg[bi] });
    var tb = await timed(fb.g.obtain());
    check(tb.v === "" && tb.ms < 200 && fb.w.scripts.length === 0, "front: resposta de config inesperada #" + bi + " → desligado");
  }
  var fCfgSlow = gateFor({ widget: "token", config: { delay: 1500, value: CFG_ON }, waitMs: 300 });
  var t0c = await timed(fCfgSlow.g.obtain());
  check(t0c.v === "" && t0c.ms >= 250 && t0c.ms < 900, "front: config lenta → espera só o limite curto e segue sem token (" + t0c.ms + " ms)");

  var fScript = gateFor({ scriptFails: true });
  var t3 = await timed(fScript.g.obtain());
  check(t3.v === "" && t3.ms < 250, "front: script bloqueado/falho → segue sem token (" + t3.ms + " ms)");
  var fErr = gateFor({ widget: "error" });
  var t4 = await timed(fErr.g.obtain());
  check(t4.v === "" && t4.ms < 250, "front: erro do widget → segue sem token (" + t4.ms + " ms)");
  var fThrow = gateFor({ renderThrows: true });
  var t4b = await timed(fThrow.g.obtain());
  check(t4b.v === "" && t4b.ms < 250, "front: render que lança → segue sem token");
  var fSlow = gateFor({ widget: "slow", waitMs: 400 });
  var t5 = await timed(fSlow.g.obtain());
  check(t5.v === "" && t5.ms >= 350 && t5.ms < 1500, "front: widget que demora → espera só o limite curto e segue sem token (" + t5.ms + " ms)");
  check(/var TS_WAIT_MS = 4[0-9]{3};/.test(read("assets/js/contact-form.js")), "front: espera máxima padrão de ~4,5 s (não 10 s)");

  var fTheme = gateFor({ widget: "token", theme: "light" }, "pt-BR");
  await fTheme.g.obtain();
  check(fTheme.w.rendered[0].theme === "light" && fTheme.w.rendered[0].language === "pt-br", "front: tema e idioma iniciais seguem os do site (light, pt-br)");
  fTheme.w.theme = "dark"; fTheme.locale.v = "es"; fTheme.g.rerender();
  check(fTheme.w.removed.length === 1 && fTheme.w.rendered.length === 2 && fTheme.w.rendered[1].theme === "dark" && fTheme.w.rendered[1].language === "es", "front: mudança de tema/idioma re-renderiza o widget");
  var fLoc = gateFor({ widget: "token" }, "fr");
  await fLoc.g.obtain();
  check(fLoc.w.rendered[0].language === "auto", "front: idioma desconhecido → auto");
  var fNone = gateFor({ widget: "token" });
  fNone.g.rerender();
  check(fNone.w.rendered.length === 0 && fNone.cfgCalls.n === 0, "front: rerender antes do primeiro render não cria widget nem busca config");

  clearInterval(keepAlive);
  if (failures.length) { console.error("FALHOU:\n - " + failures.join("\n - ")); process.exit(1); }
  console.log("ok — turnstile: matriz A–H sitekey/secret/enforce, endpoint de config, falha fechada só com enforcement ativo, replay, token gigante, sem remoteip, front que nunca bloqueia, reset, tema e idioma, segredo fora do front");
})().catch(function (e) { console.error(e); process.exit(1); });
