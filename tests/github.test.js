/* Valida o endpoint /api/github-contributions e o calendário. Rode: node tests/github.test.js */
"use strict";
var fs = require("fs");
var path = require("path");
var root = path.join(__dirname, "..");
var failures = [];
function check(ok, msg) { if (!ok) failures.push(msg); }
function read(p) { return fs.readFileSync(path.join(root, p), "utf8"); }
var fx = require("./helpers/github-fixture.js");

function memCache() {
  var m = new Map();
  return {
    match: async function (r) { var v = m.get(r.url); return v ? v.clone() : undefined; },
    put: async function (r, res) { m.set(r.url, res); }
  };
}
var ctx = { waitUntil: function (p) { return p; } };
function req(method) { return new Request("https://lucksrei.com/api/github-contributions", { method: method || "GET" }); }

(async function () {
  var G = await import("../worker/github.mjs");
  var Cal = require(path.join(root, "assets/js/github-calendar.js"));

  var days = fx.makeDays("2026-10-09");
  check(days.length === 53 * 7 - (6 - new Date("2026-10-09T00:00:00Z").getUTCDay()), "fixture com a janela esperada: " + days.length);
  var html = fx.buildHtml(days);

  // ---- parser do fragmento público
  var p = G.fromPublicHtml(html);
  check(p.days.length === days.length, "parser leu todos os dias");
  check(JSON.stringify(p.days) === JSON.stringify(days), "datas, contagens e níveis idênticos aos da origem");
  check(p.total === days.reduce(function (s, d) { return s + d[1]; }, 0), "total = soma dos dias");
  var thrown = 0;
  try { G.fromPublicHtml("<html>mudou</html>"); } catch (e) { thrown++; }
  try { G.fromPublicHtml(html.replace(/<tool-tip[\s\S]*?<\/tool-tip>/g, "")); } catch (e) { thrown++; }
  try { G.fromPublicHtml(html.replace(/data-level="\d"/g, 'data-level="9"')); } catch (e) { thrown++; }
  check(thrown === 3, "HTML irreconhecível falha em vez de inventar dados");
  var one = G.fromPublicHtml(html.replace(/>[^<>]* on 2026-10-09\./, ">1 contribution on 2026-10-09."));
  check(one.days[one.days.length - 1][1] === 1, "singular '1 contribution'");

  // ---- GraphQL oficial
  var gql = { data: { user: { contributionsCollection: { contributionCalendar: { totalContributions: 7, weeks: [
    { contributionDays: [{ date: "2026-10-04", contributionCount: 0, contributionLevel: "NONE" }, { date: "2026-10-05", contributionCount: 3, contributionLevel: "SECOND_QUARTILE" }] },
    { contributionDays: [{ date: "2026-10-11", contributionCount: 4, contributionLevel: "FOURTH_QUARTILE" }] }] } } } } };
  var g = G.fromGraphql(gql);
  check(g.total === 7 && g.days.length === 3 && g.days[1][2] === 2 && g.days[2][2] === 4, "GraphQL normalizado");
  var bad = 0; try { G.fromGraphql({ data: { user: null } }); } catch (e) { bad++; }
  check(bad === 1, "GraphQL sem usuário falha");

  // ---- handler: fonte, token, cache, stale, rate limit
  var calls = [];
  function fakeFetch(status, body) { return async function (url, init) { calls.push({ url: String(url), init: init }); return new Response(typeof body === "string" ? body : JSON.stringify(body), { status: status }); }; }

  var cache = memCache();
  var r1 = await G.handleGithub(req(), {}, ctx, { cache: cache, fetch: fakeFetch(200, html) });
  var b1 = await r1.json();
  check(r1.status === 200 && b1.source === "public" && b1.login === "Lucasdiogof" && b1.days.length === days.length, "sem token usa o fragmento público");
  check(/s-maxage=21600/.test(r1.headers.get("cache-control")), "cache de borda de 6 h");
  check(calls.length === 1 && calls[0].url === "https://github.com/users/Lucasdiogof/contributions" && !(calls[0].init.headers.authorization), "sem token não envia Authorization");
  var r2 = await G.handleGithub(req(), {}, ctx, { cache: cache, fetch: fakeFetch(500, "x") });
  check(r2.status === 200 && calls.length === 1, "segunda chamada vem do cache, sem nova requisição ao GitHub");

  calls = [];
  var cacheT = memCache();
  var r3 = await G.handleGithub(req(), { GITHUB_TOKEN: "test-token" }, ctx, { cache: cacheT, fetch: fakeFetch(200, gql) });
  var b3 = await r3.json();
  check(b3.source === "graphql" && calls[0].url === "https://api.github.com/graphql" && calls[0].init.headers.authorization === "Bearer test-token", "com token usa a API GraphQL oficial");
  check(JSON.stringify(b3).indexOf("test-token") < 0, "token nunca vai na resposta");

  // upstream falhou: serve a última boa como stale
  var c4 = memCache();
  await G.handleGithub(req(), {}, ctx, { cache: c4, fetch: fakeFetch(200, html) });
  c4.match = (function (orig) { return async function (r) { return /stale$/.test(r.url) ? orig(r) : undefined; }; })(c4.match);
  var r4 = await G.handleGithub(req(), {}, ctx, { cache: c4, fetch: fakeFetch(502, "bad") });
  var b4 = await r4.json();
  check(r4.status === 200 && b4.stale === true && b4.days.length === days.length, "GitHub fora do ar: serve a última resposta boa marcada como stale");

  // sem cache nenhum: erro honesto
  var r5 = await G.handleGithub(req(), {}, ctx, { cache: memCache(), fetch: fakeFetch(502, "bad") });
  check(r5.status === 503 && (await r5.json()).error === "unavailable" && r5.headers.get("cache-control") === "no-store", "indisponível: 503 sem inventar dados");
  var r6 = await G.handleGithub(req(), {}, ctx, { cache: memCache(), fetch: fakeFetch(429, "slow") });
  check(r6.status === 503 && (await r6.json()).error === "rate_limited" && r6.headers.get("retry-after") === "900", "rate limit do GitHub tratado com Retry-After");
  var r7 = await G.handleGithub(req(), {}, ctx, { cache: memCache(), fetch: fakeFetch(200, "<html>mudou</html>") });
  check(r7.status === 503, "HTML alterado vira erro, não dado falso");
  var r8 = await G.handleGithub(req("POST"), {}, ctx, { cache: memCache() });
  check(r8.status === 405, "só GET");

  // roteamento no worker
  var W = (await import("../worker/index.mjs")).default;
  var rr = await W.fetch(new Request("https://lucksrei.com/api/github-contributions", { method: "DELETE" }), {}, ctx);
  check(rr.status === 405, "rota registrada no worker");

  // ---- calendário (front)
  var weeks = Cal.toWeeks(p.days);
  check(weeks.length === 53 && weeks[0].length === 7 && weeks.every(function (w) { return w.length === 7 || w === weeks[weeks.length - 1]; }), "53 colunas de 7 dias");
  check(weeks[0][0] !== null && new Date(weeks[0][0][0] + "T00:00:00Z").getUTCDay() === 0, "primeira coluna começa no domingo");
  var marks = Cal.monthMarks(weeks);
  check(marks.length >= 12 && marks.length <= 13 && marks.every(function (m, i) { return i === 0 || m.week > marks[i - 1].week; }), "rótulos de mês em ordem: " + marks.length);
  check(Cal.validPayload({ days: p.days }) && !Cal.validPayload({ days: [] }) && !Cal.validPayload({ days: [["x", 1, 1]] }) && !Cal.validPayload({ days: [["2026-01-01", 1, 7]] }) && !Cal.validPayload(null), "validação do payload");

  // ---- sem token no frontend nem no repositório
  var front = ["index.html", "assets/js/github-calendar.js", "assets/js/skills.js", "assets/js/contact-form.js", "wrangler.jsonc"].map(read).join("\n");
  check(!/ghp_[A-Za-z0-9]|github_pat_|Bearer\s+[A-Za-z0-9]|GITHUB_TOKEN|api\.github\.com/.test(front), "nenhum token ou chamada direta à API do GitHub no frontend/config");
  check(/fetch\(ENDPOINT/.test(read("assets/js/github-calendar.js")) && /ENDPOINT = "\/api\/github-contributions"/.test(read("assets/js/github-calendar.js")), "frontend só fala com o próprio worker");
  var cssC = read("assets/css/style.css");
  check(!/\.gh-card\{[^}]*--gh-4:\s*#(d|e)[0-9a-f]{5}/i.test(cssC) && /--gh-3: #2ea043/.test(cssC), "verdes do GitHub (sem dourado nos quadrados)");

  var visibleHome = read("index.html").replace(/<!--[\s\S]*?-->/g, "");
  check(!/id="gh-calendar"|github-calendar\.js/.test(visibleHome) && /<!--[\s\S]*id="gh-calendar"[\s\S]*-->/.test(read("index.html")), "seção do GitHub comentada na home (oculta, código preservado)");
  var site = ["worker/github.mjs", "assets/js/github-calendar.js", "index.html"].map(read).join("\n");
  check(!/fixture|makeDays|buildHtml|Math\.random/.test(site), "dados sintéticos/aleatórios só existem em tests/");
  check(!/github-fixture/.test(read("assets/js/github-calendar.js") + read("worker/github.mjs")), "worker e front não importam o fixture");

  if (failures.length) { console.error("FALHOU:\n - " + failures.join("\n - ")); process.exit(1); }
  console.log("ok — github: parser, GraphQL, cache 6 h, stale, rate limit, erro honesto, calendário 53×7, sem token no frontend");
})().catch(function (e) { console.error(e); process.exit(1); });
