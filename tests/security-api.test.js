/* Endurecimento dos endpoints /api/*: cabeçalhos, métodos, limites de borda e falha segura. Rode: node tests/security-api.test.js */
"use strict";
var failures = [];
function check(ok, msg) { if (!ok) failures.push(msg); }

(async function () {
  var W = (await import("../worker/index.mjs")).default;
  var C = await import("../worker/contact.mjs");
  var S = await import("../worker/security.mjs");
  var ctx = { waitUntil: function (p) { return p; } };
  var IP = "203.0.113.77";
  function call(method, path, opts) {
    opts = opts || {};
    var headers = Object.assign({ "cf-connecting-ip": IP }, opts.headers || {});
    return new Request("https://lucksrei.com" + path, { method: method, headers: headers, body: opts.body });
  }
  function fakeDb() {
    var db = { writes: 0, reads: 0 };
    db.prepare = function (sql) { return { bind: function () { return this; }, run: async function () { if (/^\s*INSERT/i.test(sql)) db.writes++; return {}; }, all: async function () { db.reads++; return { results: [] }; } }; };
    return db;
  }
  // binding de rate limit simulado: permite `max` chamadas por chave
  function fakeLimiter(max) {
    var seen = {}; var keys = [];
    return { keys: keys, limit: async function (o) { keys.push(o.key); seen[o.key] = (seen[o.key] || 0) + 1; return { success: seen[o.key] <= max }; } };
  }
  var BROWSER = { origin: "https://lucksrei.com", "user-agent": "Mozilla/5.0 (X11; Linux x86_64) Chrome/130" };

  // ---- cabeçalhos em toda resposta da API
  var env0 = { DB: fakeDb() };
  var samples = [
    await W.fetch(call("POST", "/api/visit", { headers: BROWSER }), env0, ctx),
    await W.fetch(call("GET", "/api/visit"), env0, ctx),
    await W.fetch(call("GET", "/api/whoami"), env0, ctx),
    await W.fetch(call("GET", "/api/visitors"), env0, ctx),
    await W.fetch(call("GET", "/api/contact"), env0, ctx),
    await W.fetch(call("GET", "/api/nao-existe"), env0, ctx),
    await W.fetch(call("POST", "/api/contact", { headers: { origin: "https://evil.example", "content-type": "application/json" }, body: "{}" }), { RESEND_API_KEY: "x" }, ctx),
  ];
  samples.forEach(function (r, i) {
    var h = r.headers;
    check(h.get("x-content-type-options") === "nosniff" && h.get("referrer-policy") === "no-referrer" && h.get("x-frame-options") === "DENY" && h.get("cross-origin-resource-policy") === "same-origin" && /default-src 'none'/.test(h.get("content-security-policy") || ""),
      "resposta #" + i + " (" + r.status + ") sem os cabeçalhos de segurança da API");
  });

  // ---- métodos
  check((await W.fetch(call("GET", "/api/visit"), env0, ctx)).headers.get("allow") === "POST", "/api/visit só aceita POST");
  check((await W.fetch(call("POST", "/api/whoami"), env0, ctx)).status === 405, "/api/whoami só aceita GET");
  check((await W.fetch(call("PUT", "/api/visitors"), env0, ctx)).status === 405, "/api/visitors só aceita GET");
  check((await W.fetch(call("DELETE", "/api/contact"), env0, ctx)).headers.get("allow") === "POST", "/api/contact só aceita POST");
  var nf = await W.fetch(call("GET", "/api/admin"), env0, ctx);
  check(nf.status === 404 && (await nf.json()).error === "not_found", "rota desconhecida: 404 JSON sem vazar nada");

  // ---- /api/visit: limite por IP e compartilhado por localização (colo, não global), antes de qualquer escrita no D1
  var dbV = fakeDb(); var rlVisit = fakeLimiter(30); var rlAll = fakeLimiter(1000);
  var envV = { DB: dbV, RL_VISIT: rlVisit, RL_VISIT_COLO: rlAll };
  var codes = [];
  for (var i = 0; i < 45; i++) codes.push((await W.fetch(call("POST", "/api/visit", { headers: BROWSER }), envV, ctx)).status);
  check(codes.every(function (c) { return c === 204; }), "/api/visit sempre 204 (nunca quebra a página), mesmo acima do limite");
  check(dbV.writes === 30, "só as 30 primeiras visitas por IP gravam no D1: " + dbV.writes);
  check(rlAll.keys.length > 0 && rlAll.keys.every(function (k) { return k === "shared"; }), "o limite compartilhado usa uma chave única, não o IP");
  check(rlVisit.keys.every(function (k) { return /^[0-9a-f]{20}$/.test(k) && k.indexOf("203") < 0; }), "a chave do limite é o hash do IP, nunca o IP");
  var dbG = fakeDb(); var envG = { DB: dbG, RL_VISIT: fakeLimiter(1000), RL_VISIT_COLO: fakeLimiter(5) };
  for (i = 0; i < 12; i++) await W.fetch(call("POST", "/api/visit", { headers: Object.assign({ "cf-connecting-ip": "198.51.100." + i }, BROWSER) }), envG, ctx);
  check(dbG.writes === 5, "o teto compartilhado por colo protege o D1 mesmo com IPs diferentes: " + dbG.writes);
  var dbBot = fakeDb(); var rlBot = fakeLimiter(30);
  await W.fetch(call("POST", "/api/visit", { headers: { origin: "https://lucksrei.com", "user-agent": "python-requests/2.31" } }), { DB: dbBot, RL_VISIT: rlBot }, ctx);
  await W.fetch(call("POST", "/api/visit", { headers: { "user-agent": BROWSER["user-agent"] } }), { DB: dbBot, RL_VISIT: rlBot }, ctx);
  check(rlBot.keys.length === 0 && dbBot.writes === 0, "bot e chamada sem Origin são barrados ANTES do limitador e do D1");

  // ---- falha segura: sem binding, ou binding quebrado, o site segue funcionando
  var dbS = fakeDb();
  await W.fetch(call("POST", "/api/visit", { headers: BROWSER }), { DB: dbS }, ctx);
  check(dbS.writes === 1, "sem binding de rate limit (build antigo/wrangler dev) a visita é gravada normalmente");
  var dbB = fakeDb();
  await W.fetch(call("POST", "/api/visit", { headers: BROWSER }), { DB: dbB, RL_VISIT: { limit: async function () { throw new Error("boom"); } } }, ctx);
  check(dbB.writes === 1, "binding que lança erro não derruba a contagem (falha aberta)");
  check(!(await S.overLimit({}, "RL_X", call("GET", "/"))) && !(await S.overLimit(null, "RL_X", call("GET", "/"))), "overLimit sem binding = false");

  // ---- leituras: sem limite próprio (cache de borda / sem recurso externo); nenhum binding de leitura é consultado
  var spy = fakeLimiter(0);
  var envR = { DB: fakeDb(), RL_READ: spy, RL_GITHUB: spy, RL_VISIT: spy, RL_VISIT_COLO: spy };
  var who = []; for (i = 0; i < 100; i++) who.push((await W.fetch(call("GET", "/api/whoami"), envR, ctx)).status);
  check(who.every(function (c) { return c === 200; }), "/api/whoami nunca responde 429 (sem limite próprio)");
  var rv = await W.fetch(call("GET", "/api/visitors"), envR, ctx);
  check(rv.status === 200 && spy.keys.length === 0, "/api/visitors e /api/whoami não consultam nenhum limitador");

  // ---- /api/contact: limite de borda antes de ler o corpo e de enviar e-mail
  var payload = JSON.stringify({ name: "Ana", email: "ana@example.com", subject: "other", message: "uma mensagem de teste válida", website: "", ts: Date.now() - 30000 });
  var post = function (extra) { return call("POST", "/api/contact", { headers: Object.assign({ origin: "https://lucksrei.com", "content-type": "application/json" }, extra || {}), body: payload }); };
  var sent = 0; var deps = { cache: null, send: async function () { sent++; } };
  var envC = { RL_CONTACT: fakeLimiter(2) };
  var cc = []; for (i = 0; i < 4; i++) cc.push((await C.handleContact(post(), envC, ctx, deps)).status);
  check(cc.join() === "200,200,429,429" && sent === 2, "/api/contact: limite de 10/min por IP (aqui 2): " + cc.join() + " enviados=" + sent);
  var big = call("POST", "/api/contact", { headers: { origin: "https://lucksrei.com", "content-type": "application/json", "content-length": "9000" }, body: "x" });
  check((await C.handleContact(big, { RL_CONTACT: fakeLimiter(10) }, ctx, deps)).status === 413, "corpo declarado > 8 KB: 413");
  var big2 = call("POST", "/api/contact", { headers: { origin: "https://lucksrei.com", "content-type": "application/json" }, body: "x".repeat(9000) });
  check((await C.handleContact(big2, {}, ctx, deps)).status === 413, "corpo real > 8 KB (sem Content-Length confiável): 413");
  check((await C.handleContact(post({ "content-type": "text/plain" }), {}, ctx, deps)).status === 415, "Content-Type inválido: 415");
  check((await C.handleContact(post({ origin: "https://evil.example" }), {}, ctx, deps)).status === 403, "origem cruzada: 403");
  check((await C.handleContact(call("GET", "/api/contact"), {}, ctx, deps)).status === 405, "GET: 405");
  var sentBefore = sent;
  var rl0 = await C.handleContact(post(), { RL_CONTACT: fakeLimiter(0) }, ctx, deps);
  check(rl0.status === 429 && sent === sentBefore, "limitado na borda: nada é enviado");

  // ---- ordem das camadas do contato: o limite de 10/min conta toda tentativa que chega ao corpo, o de cache só envios válidos
  var rlC = fakeLimiter(1000); var sent2 = 0;
  var cache = (function () { var m = {}; return { match: async function (k) { var h = m[k.url]; return h ? h.clone() : undefined; }, put: async function (k, v) { m[k.url] = v; } }; })();
  var deps2 = { cache: cache, send: async function () { sent2++; } };
  var badBody = function () { return call("POST", "/api/contact", { headers: { origin: "https://lucksrei.com", "content-type": "application/json" }, body: JSON.stringify({ name: "A", email: "x", message: "", website: "", ts: Date.now() - 30000 }) }); };
  var honey = function () { return call("POST", "/api/contact", { headers: { origin: "https://lucksrei.com", "content-type": "application/json" }, body: JSON.stringify({ website: "robo" }) }); };
  for (i = 0; i < 6; i++) { await C.handleContact(badBody(), { RL_CONTACT: rlC }, ctx, deps2); await C.handleContact(honey(), { RL_CONTACT: rlC }, ctx, deps2); }
  check(rlC.keys.length === 12, "RL_CONTACT conta também tentativas inválidas e honeypot: " + rlC.keys.length);
  var st = []; for (i = 0; i < 5; i++) st.push((await C.handleContact(post(), { RL_CONTACT: rlC }, ctx, deps2)).status);
  check(st.join() === "200,200,200,429,429" && sent2 === 3, "o cache só conta envios válidos: 3 por 10 min mesmo após 12 tentativas inválidas (" + st.join() + ")");
  var rlX = fakeLimiter(1000);
  await C.handleContact(call("GET", "/api/contact"), { RL_CONTACT: rlX }, ctx, deps2);
  await C.handleContact(post({ origin: "https://evil.example" }), { RL_CONTACT: rlX }, ctx, deps2);
  await C.handleContact(post({ "content-type": "text/plain" }), { RL_CONTACT: rlX }, ctx, deps2);
  check(rlX.keys.length === 0, "método errado, origem cruzada e Content-Type inválido são barrados antes de RL_CONTACT");

  // ---- GitHub continua funcional, sem feature flag e sem limitador próprio
  var ghEnv = { RL_GITHUB: fakeLimiter(0) };
  var gh = await W.fetch(call("DELETE", "/api/github-contributions"), ghEnv, ctx);
  check(gh.status === 405 && gh.headers.get("allow") === "GET" && ghEnv.RL_GITHUB.keys.length === 0, "github-contributions: rota ativa por padrão, só GET, sem limitador");

  // ---- configuração: bindings declarados em wrangler.jsonc e usados no código
  var cfg = require("fs").readFileSync(require("path").join(__dirname, "..", "wrangler.jsonc"), "utf8");
  var src = ["index.mjs", "contact.mjs"].map(function (f) { return require("fs").readFileSync(require("path").join(__dirname, "..", "worker", f), "utf8"); }).join("\n");
  ["RL_VISIT", "RL_VISIT_COLO", "RL_CONTACT"].forEach(function (n) {
    check(cfg.indexOf('"' + n + '"') >= 0 && src.indexOf('"' + n + '"') >= 0, n + " declarado em wrangler.jsonc e usado no Worker");
  });
  var ids = (cfg.match(/"namespace_id": "(\d+)"/g) || []);
  check(ids.length === 3 && new Set(ids).size === 3, "só os 3 bindings em uso, com namespace_id únicos");
  check(!/RL_READ|RL_GITHUB|RL_VISIT_ALL|GITHUB_CONTRIBUTIONS/.test(cfg + src), "nenhum binding sem uso nem feature flag do GitHub restante");
  check(/"RL_VISIT",[^}]*"limit": 30, "period": 60/.test(cfg) && /"RL_VISIT_COLO",[^}]*"limit": 300, "period": 60/.test(cfg) && /"RL_CONTACT",[^}]*"limit": 10, "period": 60/.test(cfg), "limites: visita 30/min por IP, 300/min por colo; contato 10/min");
  check(!/workers_dev|preview_urls/.test(cfg), "workers_dev/preview_urls ficam para o painel até confirmar o domínio (ver docs/security.md)");
  check(!/(secret|token|api[_-]?key)\s*"?\s*:\s*"[^"]{8,}"/i.test(cfg), "wrangler.jsonc sem segredo");

  if (failures.length) { console.error("FALHOU:\n - " + failures.join("\n - ")); process.exit(1); }
  console.log("ok — security/api: cabeçalhos em toda resposta, métodos, limites de aplicação (visit, contato), leituras e github sem limitador, falha aberta sem binding, D1 intocado acima do limite");
})().catch(function (e) { console.error(e); process.exit(1); });
