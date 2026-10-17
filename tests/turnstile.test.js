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
    return C.handleContact(req, Object.assign({ TURNSTILE_SECRET_KEY: SECRET, TURNSTILE_ENFORCE: "on" }, env || {}), ctx, Object.assign({ cache: memCache(), now: function () { return NOW; }, send: async function (m) { sent.push(m); }, fetch: fetchImpl }, extra || {}));
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
  await plain("A) sem sitekey/secret/enforce", {}, NO_TOKEN);
  await plain("B) sitekey sem secret e sem enforce (token enviado e ignorado)", {}, {});
  await plain("C) secret sem enforce (token enviado e ignorado)", { TURNSTILE_SECRET_KEY: SECRET }, {});
  await plain("C2) secret sem enforce e sem token", { TURNSTILE_SECRET_KEY: SECRET }, NO_TOKEN);
  await plain("E) secret sem sitekey no front, sem enforce", { TURNSTILE_SECRET_KEY: SECRET }, NO_TOKEN);
  await plain("enforce=off", { TURNSTILE_SECRET_KEY: SECRET, TURNSTILE_ENFORCE: "off" }, NO_TOKEN);
  await plain("enforce vazio", { TURNSTILE_SECRET_KEY: SECRET, TURNSTILE_ENFORCE: "" }, NO_TOKEN);
  await plain("enforce com valor fora do contrato ('true' não ativa)", { TURNSTILE_SECRET_KEY: SECRET, TURNSTILE_ENFORCE: "true" }, NO_TOKEN);
  await plain("enforce 'ON' em maiúsculas não ativa (só o valor exato 'on')", { TURNSTILE_SECRET_KEY: SECRET, TURNSTILE_ENFORCE: "ON" }, NO_TOKEN);
  check(T.turnstileRequired({ TURNSTILE_ENFORCE: "on", TURNSTILE_SECRET_KEY: "x" }) === true && T.turnstileRequired({}) === false && T.turnstileRequired(null) === false, "turnstileRequired: true só com enforce=on + secret");

  // F) enforce ligado sem secret = configuração incompleta: não ativa, não derruba o formulário, avisa uma vez, sem valores
  T.resetTurnstileWarning();
  var logsF = await plain("F) enforce=on sem secret", { TURNSTILE_ENFORCE: "on" }, NO_TOKEN);
  check(logsF.filter(function (l) { return /TURNSTILE_ENFORCE=on sem TURNSTILE_SECRET_KEY/.test(l); }).length === 1, "F) aviso de configuração incompleta registrado");
  var logsF2 = await plain("F) segunda requisição", { TURNSTILE_ENFORCE: "on" }, NO_TOKEN);
  check(logsF2.filter(function (l) { return /TURNSTILE_ENFORCE/.test(l); }).length === 0, "F) o aviso não se repete a cada requisição");

  // D) enforce=on + secret: obrigatório; sem token nada é enviado e o Siteverify nem é chamado
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
    check(/<form class="contact-form" data-contact-form data-turnstile-sitekey="[^"]*" novalidate>/.test(h), f + ": atributo data-turnstile-sitekey presente");
    check(!/TURNSTILE_SECRET|0x4[A-Za-z0-9_-]{15,}/.test(h), f + ": sem segredo no HTML");
  });
  var js = read("assets/js/contact-form.js");
  check(!/TURNSTILE_SECRET|0x4[A-Za-z0-9_-]{20,}/.test(js), "contact-form.js sem segredo");
  check((js.match(/https:\/\/[a-z.]+/g) || []).filter(function (u) { return /challenges\.cloudflare\.com/.test(u); }).length >= 1 && !/siteverify/i.test(js), "o front só carrega api.js; Siteverify existe apenas no servidor");
  check(/appearance: "interaction-only"/.test(js) && /action: "contact"/.test(js), "widget sem CAPTCHA visual e com action contact");
  check(/if \(sitekey\) mountTurnstile\(\)/.test(js), "sem sitekey, nenhum script de terceiro é carregado");
  check(!/setStatus\("error", "contact\.form\.fail_captcha"\)/.test(js), "o front não bloqueia o envio por causa do Turnstile (a mensagem vem só da resposta do servidor)");
  check(!/theme: "dark"|theme: "light"/.test(js) && /getAttribute\("data-theme"\)/.test(js), "tema do widget vem do tema real do site, não fixo");
  check(!/\.set\(\s*"remoteip"/.test(read("worker/turnstile.mjs")) && !/ip: request\.headers/.test(read("worker/contact.mjs")), "remoteip não é enviado ao Siteverify");
  var cfg = read("wrangler.jsonc");
  check(!/TURNSTILE|0x4[A-Za-z0-9_-]{15,}/.test(cfg), "wrangler.jsonc sem chaves do Turnstile (o secret vive só no Worker)");
  var gi = require("child_process").execSync("git ls-files", { cwd: root }).toString().split("\n").filter(function (f) { return f && !/^tests\//.test(f) && /\.(js|mjs|html|md|jsonc|json|css|txt)$/.test(f); });
  gi.forEach(function (f) { if (/0x4[A-Za-z0-9_-]{25,}/.test(read(f))) check(false, "possível chave do Turnstile versionada em " + f); });
  var csp = read("_headers");
  check(/script-src 'self' https:\/\/challenges\.cloudflare\.com/.test(csp) && /frame-src https:\/\/challenges\.cloudflare\.com/.test(csp) && /connect-src 'self' https:\/\/challenges\.cloudflare\.com/.test(csp), "CSP prevê script, frame e connect do Turnstile");

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
  function gateFor(o, loc) { var w = fakeWin(o); var locale = { v: loc || "en" }; var g = F.createTurnstile({ root: w, box: {}, sitekey: "1x-sitekey-publica", getLocale: function () { return locale.v; }, waitMs: o.waitMs == null ? 300 : o.waitMs }); return { w: w, g: g, locale: locale }; }
  async function timed(p) { var t = Date.now(); var v = await p; return { v: v, ms: Date.now() - t }; }

  var fOk = gateFor({ widget: "token" });
  var t1 = await timed(fOk.g.obtain());
  check(t1.v === "tok-front-1" && fOk.w.scripts.length === 1 && /challenges\.cloudflare\.com\/turnstile\/v0\/api\.js\?render=explicit/.test(fOk.w.scripts[0].src), "front: carrega o api.js oficial uma vez e obtém o token");
  check(fOk.w.rendered[0].action === "contact" && fOk.w.rendered[0].appearance === "interaction-only" && fOk.w.rendered[0].sitekey === "1x-sitekey-publica", "front: render com sitekey, action contact e interaction-only");
  var t1b = await timed(fOk.g.obtain());
  check(t1b.v === "", "front: o token já usado NÃO é reaproveitado numa segunda tentativa sem reset");
  fOk.g.reset();
  var t2 = await fOk.g.obtain();
  check(fOk.w.resets.length === 1 && t2 === "tok-front-2" && t2 !== t1.v, "front: reset após a tentativa e token novo na seguinte (" + t2 + " ≠ " + t1.v + ")");

  var fScript = gateFor({ scriptFails: true });
  var t3 = await timed(fScript.g.obtain());
  check(t3.v === "" && t3.ms < 200, "front: script bloqueado/falho → segue sem token na hora (" + t3.ms + " ms)");
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
  check(fNone.w.rendered.length === 0, "front: rerender antes do primeiro render não cria widget");

  clearInterval(keepAlive);
  if (failures.length) { console.error("FALHOU:\n - " + failures.join("\n - ")); process.exit(1); }
  console.log("ok — turnstile: matriz sitekey/secret/enforce, falha fechada só com enforcement ativo, replay, token gigante, sem remoteip, front que nunca bloqueia, reset, tema e idioma, segredo fora do front");
})().catch(function (e) { console.error(e); process.exit(1); });
