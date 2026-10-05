/* Valida o Worker de visitas (lógica, privacidade) e a integração da página. Rode: node tests/visitors.test.js
 * O comportamento real do upsert/concorrência no D1 é validado com `wrangler dev` (ver README do teste no relatório). */
"use strict";
var fs = require("fs");
var path = require("path");
var root = path.join(__dirname, "..");
var failures = [];
function check(ok, msg) { if (!ok) failures.push(msg); }
function read(p) { return fs.readFileSync(path.join(root, p), "utf8"); }

// D1 falso: reproduz só as 3 instruções do Worker (upsert, agregação, purge) em memória
function fakeDb() {
  var rows = {}; // "ym|country" -> {ym,country,n,u}
  var log = [];
  return {
    rows: rows, log: log,
    prepare: function (sql) {
      return {
        bind: function () {
          var a = Array.prototype.slice.call(arguments);
          log.push({ sql: sql, args: a });
          var q = {
            run: function () {
              if (/^INSERT INTO visits_monthly/.test(sql)) {
                var k = a[0] + "|" + a[1];
                if (rows[k]) { rows[k].n += 1; rows[k].u = a[2]; } else rows[k] = { ym: a[0], country: a[1], n: 1, u: a[2] };
              } else if (/^DELETE FROM visits_monthly/.test(sql)) {
                Object.keys(rows).forEach(function (k) { if (rows[k].ym < a[0]) delete rows[k]; });
              }
              return Promise.resolve({ success: true });
            },
            all: function () {
              var by = {};
              Object.keys(rows).forEach(function (k) {
                var r = rows[k];
                if (r.ym < a[0]) return;
                var g = by[r.country] || (by[r.country] = { country: r.country, n: 0, u: 0, since: r.ym });
                g.n += r.n; if (r.u > g.u) g.u = r.u; if (r.ym < g.since) g.since = r.ym;
              });
              return Promise.resolve({ results: Object.keys(by).map(function (c) { return by[c]; }) });
            }
          };
          return q;
        }
      };
    }
  };
}

function req(method, p, headers, cf) {
  var r = new Request("https://lucksrei.com" + p, { method: method, headers: headers || {} });
  Object.defineProperty(r, "cf", { value: cf });
  return r;
}
var UA = { "user-agent": "Mozilla/5.0 (X11; Linux) Safari/537.36" };

(async function () {
  var mod = await import(path.join(root, "worker/index.mjs").replace(/\\/g, "/").replace(/^([A-Za-z]):/, "file:///$1:"));
  var W = mod.default;
  var store = {};
  global.caches = { default: { match: async function (k) { var h = store[k.url]; return h ? h.clone() : undefined; }, put: async function (k, v) { store[k.url] = v; } } };
  var waits = [];
  var ctx = { waitUntil: function (p) { waits.push(p); } };
  var env = { DB: fakeDb(), ASSETS: { fetch: async function () { return new Response("asset", { status: 200 }); } } };

  // --- país: só request.cf.country, normalizado
  check(mod.normalizeCountry("br") === "BR", "normaliza para maiúsculo");
  check(mod.normalizeCountry(" us ") === "US", "aparar espaços");
  ["", "BRA", "1", "B", undefined, null, 5, "T1", "XX", "ZZ", "B1"].forEach(function (v) { check(mod.normalizeCountry(v) === "XX", "inválido/ausente vira XX: " + String(v)); });

  // --- /api/visit
  var origin = { origin: "https://lucksrei.com" };
  var h = Object.assign({}, UA, origin);
  var r = await W.fetch(req("POST", "/api/visit", h, { country: "pt" }), env, ctx);
  check(r.status === 204 && !(await r.text()), "visit responde 204 sem corpo");
  await W.fetch(req("POST", "/api/visit", h, { country: "PT" }), env, ctx);
  await W.fetch(req("POST", "/api/visit", h, { country: "BR" }), env, ctx);
  await W.fetch(req("POST", "/api/visit", h, undefined), env, ctx); // sem cf → XX
  var before = Object.keys(env.DB.rows).length;
  // ruído: sem Origin, Origin de fora, robô, método errado
  await W.fetch(req("POST", "/api/visit", UA, { country: "BR" }), env, ctx);
  await W.fetch(req("POST", "/api/visit", Object.assign({}, UA, { origin: "https://evil.example" }), { country: "BR" }), env, ctx);
  await W.fetch(req("POST", "/api/visit", { origin: "https://lucksrei.com", "user-agent": "Googlebot/2.1" }, { country: "BR" }), env, ctx);
  await W.fetch(req("POST", "/api/visit", { origin: "https://lucksrei.com", "user-agent": "curl/8.0" }, { country: "BR" }), env, ctx);
  check((await W.fetch(req("GET", "/api/visit", h, { country: "BR" }), env, ctx)).status === 405, "GET em /api/visit → 405");
  var total = Object.keys(env.DB.rows).reduce(function (s, k) { return s + env.DB.rows[k].n; }, 0);
  check(total === 4, "só 4 visitas válidas contadas, contou " + total);
  check(Object.keys(env.DB.rows).length === before, "ruído não cria linhas");
  // país vindo do cliente é ignorado
  var forged = req("POST", "/api/visit?country=JP", Object.assign({ "cf-ipcountry": "JP", "x-country": "JP" }, h), { country: "DE" });
  await W.fetch(forged, env, ctx);
  check(Object.keys(env.DB.rows).some(function (k) { return /\|DE$/.test(k); }) && !Object.keys(env.DB.rows).some(function (k) { return /\|JP$/.test(k); }), "país vem só de request.cf.country");
  // o que é gravado: só (ym, country, 1, ts)
  env.DB.log.filter(function (l) { return /^INSERT/.test(l.sql); }).forEach(function (l) {
    check(l.args.length === 3 && /^\d{4}-\d{2}$/.test(l.args[0]) && /^[A-Z]{2}$/.test(l.args[1]) && typeof l.args[2] === "number", "insert só com mês, país e timestamp");
  });

  // --- /api/visitors
  var vr = await W.fetch(req("GET", "/api/visitors"), env, ctx);
  var vj = await vr.json();
  check(vr.status === 200 && /s-maxage=300/.test(vr.headers.get("cache-control")), "visitors cacheável 5 min");
  check(vj.total_visits === 5, "total conta tudo (inclui XX): " + vj.total_visits);
  check(vj.countries_count === 3, "XX não conta como país: " + vj.countries_count);
  check(vj.countries.every(function (c) { return c.code !== "XX"; }), "XX fora do ranking/mapa");
  check(vj.countries[0].visits >= vj.countries[1].visits, "ordenado por visitas");
  check(Object.keys(vj).sort().join() === "countries,countries_count,since,total_visits,updated_at,window_months", "campos do endpoint: " + Object.keys(vj).join());
  var flat = JSON.stringify(vj);
  ["ip", "user-agent", "mozilla", "city", "region", "lat", "lon", "header"].forEach(function (w) { check(flat.toLowerCase().indexOf(w) < 0, "resposta sem '" + w + "'"); });

  // --- /api/whoami
  var wr = await W.fetch(req("GET", "/api/whoami", UA, { country: "pt", city: "Lisbon", latitude: "38.7", asn: 1 }), env, ctx);
  var wj = await wr.json();
  check(JSON.stringify(wj) === '{"country":"PT"}' && wr.headers.get("cache-control") === "no-store", "whoami devolve só o país, sem cache");
  var wu = await (await W.fetch(req("GET", "/api/whoami", UA, {}), env, ctx)).json();
  check(wu.country === null, "whoami sem país → null");

  // --- purge: meses fora da janela somem
  env.DB.rows["2020-01|BR"] = { ym: "2020-01", country: "BR", n: 9, u: 1 };
  var vj2 = await (await W.fetch(req("GET", "/api/visitors?x=1"), env, ctx)).json();
  check(vj2.total_visits === 5, "meses com mais de 12 meses não entram (cache ou janela)");
  Object.keys(store).forEach(function (k) { delete store[k]; });
  vj2 = await (await W.fetch(req("GET", "/api/visitors"), env, ctx)).json();
  check(vj2.total_visits === 5, "janela de 12 meses exclui 2020-01");

  // --- falha de banco nunca quebra a página; visitors devolve 503
  var broken = { DB: { prepare: function () { throw new Error("boom"); } }, ASSETS: env.ASSETS };
  check((await W.fetch(req("POST", "/api/visit", h, { country: "BR" }), broken, ctx)).status === 204, "falha no D1: visit continua 204");
  Object.keys(store).forEach(function (k) { delete store[k]; });
  check((await W.fetch(req("GET", "/api/visitors"), broken, ctx)).status === 503, "falha no D1: visitors 503");

  // --- rotas
  check((await W.fetch(req("GET", "/api/nada"), env, ctx)).status === 404, "rota /api/* desconhecida → 404");
  check(await (await W.fetch(req("GET", "/apps/"), env, ctx)).text() === "asset", "fora de /api/* cai nos assets");
  check((await W.fetch(req("GET", "/api/whoami"), env, ctx)).headers.get("x-content-type-options") === "nosniff", "nosniff");

  // --- integração estática
  var wj2 = read("wrangler.jsonc");
  check(/"run_worker_first": \["\/api\/\*"\]/.test(wj2), "só /api/* roda o Worker primeiro");
  check(/"name": "lucksrei-site"/.test(wj2) && /"binding": "DB"/.test(wj2) && /"binding": "ASSETS"/.test(wj2), "mesmo Worker, bindings DB e ASSETS");
  var ign = read(".assetsignore");
  ["worker", "migrations", "DESIGN.md"].forEach(function (x) { check(ign.split(/\r?\n/).indexOf(x) >= 0, ".assetsignore deve conter " + x); });
  var al = JSON.parse(read(".well-known/assetlinks.json"));
  check(Array.isArray(al) && al.length >= 1, "assetlinks.json válido e presente");
  var page = read("visitors/index.html");
  check(/<html lang="en" data-seo="visitors">/.test(page) && /canonical" href="https:\/\/lucksrei.com\/visitors\/"/.test(page), "página com data-seo e canonical");
  check(page.indexOf("visitors.js") > 0 && page.indexOf("apps.js") < 0, "visitors.js só na página de visitantes");
  ["index.html", "apps/index.html", "contact/index.html", "projects/aura/index.html", "privacy/index.html"].forEach(function (f) {
    var t = read(f);
    check(t.indexOf('data-i18n="footer.visitors"') > 0 && t.indexOf('href="/visitors/"') > 0, f + ": link no rodapé");
    check(t.indexOf("visitors.js") < 0, f + ": não carrega visitors.js");
  });
  check(read("sitemap.xml").indexOf("https://lucksrei.com/visitors/") > 0, "sitemap inclui /visitors/");
  var priv = read("privacy/index.html");
  check(priv.indexOf("estatísticas agregadas de acesso por país") > 0 && /Não são armazenados IP, localização precisa/.test(priv.replace(/\s+/g, " ")), "política cita estatísticas agregadas");
  var main = read("assets/js/main.js");
  check(/sessionStorage\.getItem\("lk\.v"\)/.test(main) && /sendBeacon\("\/api\/visit"\)/.test(main) && !/document\.cookie/.test(main), "beacon por sessão de aba, sem cookie");
  var svg = read("assets/img/visitors/world.svg");
  check(!/fill="/.test(svg) && !/style="/.test(svg) && !/#[0-9a-fA-F]{3,6}/.test(svg), "SVG sem cor fixa");
  check((svg.match(/<path /g) || []).length > 150, "SVG com os países");
  var js = read("assets/js/visitors.js");
  check(!/document\.cookie|localStorage|fingerprint/i.test(js), "visitors.js sem cookie/localStorage");

  if (failures.length) { console.error("FALHOU:\n - " + failures.join("\n - ")); process.exit(1); }
  console.log("ok — worker: país só de request.cf, ruído filtrado, agregados sem dado pessoal, falhas isoladas; página, rodapé, privacidade e sitemap integrados");
})().catch(function (e) { console.error(e); process.exit(1); });
