/* Valida o formulário de contato (front e /api/contact). Rode: node tests/contact.test.js */
"use strict";
var fs = require("fs");
var path = require("path");
var root = path.join(__dirname, "..");
var failures = [];
function check(ok, msg) { if (!ok) failures.push(msg); }
function read(p) { return fs.readFileSync(path.join(root, p), "utf8"); }

function memCache() {
  var m = new Map();
  return {
    match: async function (r) { var v = m.get(r.url); return v ? v.clone() : undefined; },
    put: async function (r, res) { m.set(r.url, res); }
  };
}
var ctx = { waitUntil: function (p) { return p; } };
var NOW = 1790000000000;
function good(over) { return Object.assign({ name: "Ana Souza", email: "ana@example.com", subject: "hiring", message: "Hello Lucas, we would like to talk about a Flutter role.", website: "", ts: NOW - 30000 }, over || {}); }
function post(body, headers) {
  var h = Object.assign({ origin: "https://lucksrei.com", "content-type": "application/json", "cf-connecting-ip": "203.0.113.7" }, headers || {});
  return new Request("https://lucksrei.com/api/contact", { method: "POST", headers: h, body: typeof body === "string" ? body : JSON.stringify(body) });
}

(async function () {
  var C = await import("../worker/contact.mjs");
  var Front = require(path.join(root, "assets/js/contact-form.js"));
  var sent = [];
  function deps(extra) { return Object.assign({ cache: memCache(), now: function () { return NOW; }, send: async function (m) { sent.push(m); } }, extra || {}); }
  var logged = [];
  var origErr = console.error, origLog = console.log;
  console.error = function () { logged.push([].slice.call(arguments).join(" ")); };
  console.log = function () { logged.push([].slice.call(arguments).join(" ")); };

  // ---- validação (servidor)
  check(C.validateContact(good()).ok, "payload válido");
  [["name", { name: "A" }], ["name", { name: "x".repeat(81) }], ["email", { email: "sem-arroba" }], ["email", { email: "a@b" }], ["email", { email: "a b@c.com" }],
   ["email", { email: "a@" + "x".repeat(250) + ".com" }], ["subject", { subject: "spam" }], ["subject", { subject: "" }], ["message", { message: "curta" }], ["message", { message: "m".repeat(2001) }]
  ].forEach(function (c) { var r = C.validateContact(good(c[1])); check(!r.ok && r.fields.indexOf(c[0]) >= 0, "rejeita " + c[0] + " inválido: " + JSON.stringify(c[1]).slice(0, 40)); });
  check(C.validateContact(good({ message: "m".repeat(2000) })).ok && C.validateContact(good({ name: "Al" })).ok, "limites exatos aceitos");
  var inj = C.validateContact(good({ name: "Eve\r\nBcc: x@evil.com", email: "ana@example.com" })).value;
  check(inj.name.indexOf("\n") < 0 && inj.name.indexOf("\r") < 0, "quebras de linha removidas dos campos de cabeçalho");
  check(C.validateContact(good({ email: "a@example.com\r\nBcc: x@y.com" })).ok === false, "e-mail com injeção rejeitado");
  check(C.validateContact(good({ message: "linha1\r\n\r\n\r\n\r\nlinha2\u0000" })).value.message === "linha1\n\nlinha2", "mensagem normalizada, sem controles");
  ["josé@example.com", "ana@exämple.com", "ana@example..com", "ana@-example.com", "ana@example.c", "a@b@c.com"].forEach(function (e) { check(!C.validateContact(good({ email: e })).ok, "e-mail fora do padrão ASCII rejeitado: " + e); });
  ["ana+news@example.com", "a.b_c-d@sub.example.co.uk"].forEach(function (e) { check(C.validateContact(good({ email: e })).ok, "e-mail válido aceito: " + e); });
  check(!C.validateContact(null).ok && !C.validateContact("x").ok, "corpo não objeto");

  // ---- handler
  var r = await C.handleContact(post(good()), {}, ctx, deps());
  check(r.status === 200 && (await r.json()).ok === true && sent.length === 1, "envio válido → 200 só depois do provedor aceitar");
  var m = sent[0];
  check(m.to === "marketing@lucksrei.com" && m.replyTo === "ana@example.com" && /Hiring Opportunity/.test(m.subject) && /Ana Souza/.test(m.text), "e-mail montado (destino padrão, reply-to do visitante)");
  var m2 = C.buildMail(C.validateContact(good()).value, { CONTACT_TO: "x@y.com", CONTACT_FROM: "no@lucksrei.com" });
  check(m2.to === "x@y.com" && m2.from === "no@lucksrei.com", "destino/remetente configuráveis por variável");
  var mime = C.rawMime(m);
  check(/^From: .*\r\nTo: marketing@lucksrei.com\r\nReply-To: ana@example.com\r\nSubject: =\?UTF-8\?B\?/.test(mime) && /Content-Transfer-Encoding: base64/.test(mime), "MIME com cabeçalhos seguros e UTF-8");

  var longName = C.buildMail(C.validateContact(good({ name: "Ação Ñandú 日本語 ".repeat(5).trim().slice(0, 80) })).value, {});
  var subjLine = C.rawMime(longName).split("\r\n").slice(0, 12).join("\r\n").match(/Subject: ([\s\S]*?)\r\nMessage-ID/)[1];
  var words = subjLine.split("\r\n ");
  check(words.length > 1 && words.every(function (w) { return /^=\?UTF-8\?B\?[A-Za-z0-9+\/=]+\?=$/.test(w) && w.length <= 75; }), "assunto longo em encoded-words de até 75 caracteres (RFC 2047)");
  var decoded = words.map(function (w) { return Buffer.from(w.slice(10, -2), "base64").toString("utf8"); }).join("");
  check(decoded === longName.subject, "assunto com acentos/CJK decodifica sem perda");
  check((await C.handleContact(new Request("https://lucksrei.com/api/contact"), {}, ctx, deps())).status === 405, "GET → 405");
  check((await C.handleContact(post(good(), { origin: "https://evil.example" }), {}, ctx, deps())).status === 403, "origem diferente → 403");
  check((await C.handleContact(post(good(), { origin: "" }), {}, ctx, deps())).status === 403, "sem Origin → 403");
  check((await C.handleContact(post(good(), { "content-type": "text/plain" }), {}, ctx, deps())).status === 415, "content-type errado → 415");
  check((await C.handleContact(post("x".repeat(9000)), {}, ctx, deps())).status === 413, "corpo > 8 KB → 413");
  check((await C.handleContact(post("{nao json"), {}, ctx, deps())).status === 400, "JSON inválido → 400");
  var bad = await C.handleContact(post(good({ email: "x" })), {}, ctx, deps());
  var badBody = await bad.json();
  check(bad.status === 400 && badBody.fields.join() === "email", "campo inválido → 400 com a lista de campos");

  var before = sent.length;
  var hp = await C.handleContact(post(good({ website: "http://spam.example" })), {}, ctx, deps());
  check(hp.status === 200 && sent.length === before, "honeypot preenchido: nada é enviado");
  check((await C.handleContact(post(good({ ts: NOW - 500 })), {}, ctx, deps())).status === 400, "preenchido rápido demais → 400");
  check((await C.handleContact(post(good({ ts: undefined })), {}, ctx, deps())).status === 400, "sem timestamp → 400");
  check((await C.handleContact(post(good({ ts: NOW - 3 * 86400000 })), {}, ctx, deps())).status === 400, "timestamp velho → 400");

  // rate limit por IP: 3 por 10 min
  var d = deps();
  var codes = [];
  for (var i = 0; i < 5; i++) codes.push((await C.handleContact(post(good()), {}, ctx, d)).status);
  check(codes.join() === "200,200,200,429,429", "rate limit por IP: " + codes.join());
  var limited = await C.handleContact(post(good()), {}, ctx, d);
  check(Number(limited.headers.get("retry-after")) > 0 && (await limited.json()).error === "rate_limited", "429 com Retry-After");
  var other = await C.handleContact(post(good(), { "cf-connecting-ip": "198.51.100.9" }), {}, ctx, d);
  check(other.status === 200, "outro IP não é afetado");
  var gd = deps(); var g = [];
  for (var j = 0; j < 42; j++) g.push((await C.handleContact(post(good(), { "cf-connecting-ip": "10.0.0." + j }), {}, ctx, gd)).status);
  check(g.indexOf(429) === 40, "teto global por hora (40): primeiro 429 na posição " + g.indexOf(429));

  // provedor ausente / falhando
  var none = await C.handleContact(post(good()), {}, ctx, { cache: memCache(), now: function () { return NOW; } });
  check(none.status === 503 && (await none.json()).error === "unavailable", "sem provedor configurado → 503 (nunca finge sucesso)");
  var fail = await C.handleContact(post(good()), {}, ctx, deps({ send: async function () { throw new Error("smtp down"); } }));
  check(fail.status === 502 && (await fail.json()).error === "delivery_failed", "falha do provedor → 502, não 200");
  var resendCalls = [];
  var viaResend = await C.handleContact(post(good()), { RESEND_API_KEY: "k_test" }, ctx, { cache: memCache(), now: function () { return NOW; },
    fetch: async function (u, init) { resendCalls.push([u, init]); return new Response("{}", { status: 200 }); } });
  check(viaResend.status === 200 && resendCalls[0][0] === "https://api.resend.com/emails" && resendCalls[0][1].headers.authorization === "Bearer k_test", "Resend quando RESEND_API_KEY existe");
  var resendFail = await C.handleContact(post(good()), { RESEND_API_KEY: "k_test" }, ctx, { cache: memCache(), now: function () { return NOW; }, fetch: async function () { return new Response("no", { status: 422 }); } });
  check(resendFail.status === 502, "Resend recusou → 502");

  // nada sensível em log
  console.error = origErr; console.log = origLog;
  check(logged.join("\n").indexOf("Hello Lucas") < 0 && logged.join("\n").indexOf("ana@example.com") < 0, "mensagem e e-mail nunca vão para o log");

  // roteamento no worker
  var W = (await import("../worker/index.mjs")).default;
  check((await W.fetch(new Request("https://lucksrei.com/api/contact"), {}, ctx)).status === 405, "rota /api/contact registrada");

  // ---- front: validação espelha o servidor
  var V = Front.validate;
  check(Object.keys(V({ name: "Ana", email: "ana@example.com", subject: "other", message: "uma mensagem válida" })).length === 0, "front: válido");
  check(V({ name: "", email: "", subject: "", message: "" }).name && V({ name: "", email: "", subject: "", message: "" }).message, "front: campos obrigatórios");
  check(V({ name: "Ana", email: "ana@x", subject: "other", message: "uma mensagem válida" }).email, "front: e-mail inválido");
  check(Front.LIMITS.messageMax === C.LIMITS.messageMax && Front.LIMITS.nameMax === C.LIMITS.nameMax && Front.LIMITS.emailMax === C.LIMITS.emailMax && Front.LIMITS.messageMin === C.LIMITS.messageMin, "limites do front = limites do servidor");
  check(JSON.stringify(Front.SUBJECTS) === JSON.stringify(Object.keys(C.SUBJECTS)), "assuntos do front = servidor");

  // ---- front: comportamento (JS) e HTML
  var js = read("assets/js/contact-form.js");
  check(/if \(busy\) return;/.test(js) && /btn\.disabled = on/.test(js), "bloqueia envio duplicado");
  check(/res\.status === 200 && res\.body && res\.body\.ok === true/.test(js), "sucesso só com 200 + ok:true");
  check(!/mailto:/.test(js), "sem mailto como envio");
  var errBranch = js.slice(js.indexOf("var key = \"contact.form.fail\""));
  check(!/value = ""/.test(errBranch.slice(0, errBranch.indexOf("setStatus(\"error\", key)"))), "erro não apaga o texto digitado");
  ["index.html", "contact/index.html"].forEach(function (f) {
    var h = read(f);
    check(/<form class="contact-form" data-contact-form novalidate>/.test(h), f + ": formulário presente");
    ["name", "email", "subject", "message"].forEach(function (n) { check(new RegExp('<label for="cf-' + n + '">').test(h), f + ": label de " + n); });
    check(/name="website"[^>]*tabindex="-1"[^>]*autocomplete="off"/.test(h), f + ": honeypot");
    check(/value="hiring"[\s\S]*value="collab"[\s\S]*value="other"/.test(h), f + ": assuntos");
    check(/contact-form\.js/.test(h), f + ": script carregado");
    check(/marketing@lucksrei\.com/.test(h) && /linkedin\.com\/in\/lucas-diogo-aa39b9174/.test(h) && /github\.com\/Lucasdiogof/.test(h), f + ": canais existentes preservados");
  });
  check((read("index.html").match(/id="contato"/g) || []).length === 1 && (read("index.html").match(/class="contact-block/g) || []).length === 1, "uma única seção de contato");
  check(/assets\/cv\/lucas-diogo-franca-resume\.pdf/.test(read("contact/index.html")), "currículo preservado em /contact/");
  check(/maxlength="2000"/.test(read("index.html")) && /maxlength="80"/.test(read("index.html")) && /maxlength="254"/.test(read("index.html")), "maxlength nos campos");

  if (failures.length) { console.error("FALHOU:\n - " + failures.join("\n - ")); process.exit(1); }
  console.log("ok — contact: validação, origem, honeypot, tempo mínimo, rate limit por IP e global, 503 sem provedor, 502 em falha, sucesso só com confirmação");
})().catch(function (e) { console.error(e); process.exit(1); });
