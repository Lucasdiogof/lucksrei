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
function fakeDb(opts) {
  opts = opts || {};
  var rows = {}; // "ym|country" -> {ym,country,n,u}
  var regions = {}; // "ym|country|region" -> {ym,country,region,name,n,updated_at}
  var log = [];
  return {
    rows: rows, regions: regions, log: log,
    prepare: function (sql) {
      if (opts.noRegionTable && /visits_region_monthly/.test(sql)) throw new Error("no such table: visits_region_monthly");
      return {
        bind: function () {
          var a = Array.prototype.slice.call(arguments);
          log.push({ sql: sql, args: a });
          var q = {
            run: function () {
              if (/^INSERT INTO visits_monthly/.test(sql)) {
                var k = a[0] + "|" + a[1];
                if (rows[k]) { rows[k].n += 1; rows[k].u = a[2]; } else rows[k] = { ym: a[0], country: a[1], n: 1, u: a[2] };
              } else if (/^INSERT INTO visits_region_monthly/.test(sql)) {
                var rk = a[0] + "|" + a[1] + "|" + a[2];
                var cur = regions[rk];
                if (cur) { cur.n += 1; cur.updated_at = a[4]; if (a[3]) cur.name = a[3]; }
                else regions[rk] = { ym: a[0], country: a[1], region: a[2], name: a[3], n: 1, updated_at: a[4] };
              } else if (/^DELETE FROM visits_monthly/.test(sql)) {
                Object.keys(rows).forEach(function (k) { if (rows[k].ym < a[0]) delete rows[k]; });
              } else if (/^DELETE FROM visits_region_monthly/.test(sql)) {
                Object.keys(regions).forEach(function (k) { if (regions[k].ym < a[0]) delete regions[k]; });
              }
              return Promise.resolve({ success: true });
            },
            all: function () {
              if (/FROM visits_region_monthly/.test(sql)) {
                return Promise.resolve({ results: Object.keys(regions).map(function (k) { return regions[k]; }).filter(function (r) { return r.ym >= a[0]; }) });
              }
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
  env.DB.log.filter(function (l) { return /^INSERT INTO visits_monthly/.test(l.sql); }).forEach(function (l) {
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
  check(Object.keys(vj).sort().join() === "countries,countries_count,regions,regions_since,since,total_visits,updated_at,window_months", "campos do endpoint: " + Object.keys(vj).join());
  var flat = JSON.stringify(vj);
  ["ip", "user-agent", "mozilla", "city", "lat", "lon", "header", "postal"].forEach(function (w) { check(flat.toLowerCase().indexOf(w) < 0, "resposta sem '" + w + "'"); });

  // --- /api/whoami
  var wr = await W.fetch(req("GET", "/api/whoami", UA, { country: "pt", regionCode: "11", region: "Lisbon", city: "Lisbon", postalCode: "1000", latitude: "38.7", asn: 1 }), env, ctx);
  var wj = await wr.json();
  check(JSON.stringify(wj) === '{"country":"PT","region":"11","region_name":"Lisbon"}' && wr.headers.get("cache-control") === "no-store", "whoami devolve só país e região, sem cache: " + JSON.stringify(wj));
  var wnr = await (await W.fetch(req("GET", "/api/whoami", UA, { country: "BR", regionCode: "??" }), env, ctx)).json();
  check(wnr.country === "BR" && wnr.region === null && wnr.region_name === null, "whoami com região inválida → null");
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

  // --- cache: visit e whoami nunca em cache; visitors 5 min na borda
  check((await W.fetch(req("POST", "/api/visit", h, { country: "BR" }), env, ctx)).headers.get("cache-control") === "no-store", "visit: no-store");
  check((await W.fetch(req("POST", "/api/visit", UA, { country: "BR" }), env, ctx)).headers.get("cache-control") === "no-store", "visit ignorada: no-store");

  // --- países sem forma no SVG (microestados): entram em total, countries_count e ranking
  var svgSrc = read("assets/img/visitors/world.svg");
  ["SG", "MT", "MC"].forEach(function (c) { check(svgSrc.indexOf('data-c="' + c + '"') < 0, c + " continua sem forma no SVG (caso coberto por este teste)"); });
  var envM = { DB: fakeDb(), ASSETS: env.ASSETS };
  Object.keys(store).forEach(function (k) { delete store[k]; });
  var seed = { BR: 4, SG: 3, MT: 2, MC: 1 };
  for (var sc in seed) for (var si = 0; si < seed[sc]; si++) await W.fetch(req("POST", "/api/visit", h, { country: sc }), envM, ctx);
  await W.fetch(req("POST", "/api/visit", h, { country: "T1" }), envM, ctx); // Tor → XX
  var mj = await (await W.fetch(req("GET", "/api/visitors"), envM, ctx)).json();
  check(mj.total_visits === 11, "microestados + XX no total: " + mj.total_visits);
  check(mj.countries_count === 4, "SG/MT/MC contam como países (XX não): " + mj.countries_count);
  check(mj.countries.map(function (c) { return c.code + c.visits; }).join() === "BR4,SG3,MT2,MC1", "ranking com microestados: " + JSON.stringify(mj.countries));
  Object.keys(store).forEach(function (k) { delete store[k]; });
  // o cliente só pinta/foca/mostra tooltip de <path> existente
  var vjs = read("assets/js/visitors.js");
  check(/var el = state\.svg\.querySelector\('path\[data-c="' \+ c\.code \+ '"\]'\);\s*if \(el\)/.test(vjs), "paintMap ignora país sem forma");
  check(/if \(p\) showTip\(p\)/.test(vjs) && /function highlight[\s\S]*?if \(p\) p\.classList/.test(vjs), "ranking → mapa ignora país sem forma (sem tooltip, sem erro)");

  // --- nomes de país: Intl.DisplayNames por idioma e fallbacks
  var V = require(path.join(root, "assets/js/visitors.js"));
  var nm = V.makeCountryNamer(Intl.DisplayNames);
  check(nm("SG", "pt-BR") === "Singapura" && nm("MT", "pt-BR") === "Malta" && nm("MC", "pt-BR") === "Mônaco" && nm("BR", "pt-BR") === "Brasil", "pt-BR: " + [nm("SG", "pt-BR"), nm("MC", "pt-BR"), nm("BR", "pt-BR")]);
  check(nm("SG", "en") === "Singapore" && nm("MC", "en") === "Monaco" && nm("DE", "en") === "Germany", "en: " + [nm("SG", "en"), nm("MC", "en"), nm("DE", "en")]);
  check(nm("SG", "es") === "Singapur" && nm("MC", "es") === "Mónaco" && nm("DE", "es") === "Alemania", "es: " + [nm("SG", "es"), nm("MC", "es"), nm("DE", "es")]);
  check(nm("QQ", "en") === "QQ" && nm("QQ", "pt-BR", "Fallback") === "Fallback", "código não reconhecido → fallback / código ISO");
  ["en", "pt-BR", "es"].forEach(function (l) {
    var none = V.makeCountryNamer(undefined);
    check(none("SG", l) === "SG" && none("BR", l, "Brazil") === "Brazil", l + ": sem Intl.DisplayNames → código ISO (ou nome do SVG)");
    var ctorThrows = V.makeCountryNamer(function () { throw new RangeError("unsupported"); });
    check(ctorThrows("MT", l) === "MT", l + ": construtor lança → código ISO");
    var ofThrows = V.makeCountryNamer(function () { this.of = function () { throw new RangeError("invalid"); }; });
    check(ofThrows("MC", l) === "MC", l + ": .of() lança → código ISO");
    var undef = V.makeCountryNamer(function () { this.of = function () { return undefined; }; });
    check(undef("SG", l) === "SG", l + ": .of() sem resultado → código ISO");
  });
  check(V.level(0, 10) === 0 && V.level(10, 10) === 5 && V.level(1, 1) === 5 && V.level(1, 1000) >= 1, "escala do mapa 0–5");

  // --- estados/regiões
  check(mod.normalizeRegion(" go ") === "GO" && mod.normalizeRegion("ENG") === "ENG" && mod.normalizeRegion("13") === "13", "região normalizada (ISO 3166-2, 1–3)");
  ["", "SP-1", "ABCD", "g o", undefined, null, 7].forEach(function (v) { check(mod.normalizeRegion(v) === "XX", "região inválida vira XX: " + String(v)); });
  check(mod.cleanRegionName("  São\u0007  Paulo <b> ") === "São Paulo b" && mod.cleanRegionName(5) === "" && mod.cleanRegionName("x".repeat(200)).length === 80, "nome da região saneado");
  var envR = { DB: fakeDb(), ASSETS: env.ASSETS };
  Object.keys(store).forEach(function (k) { delete store[k]; });
  var seedR = [["BR", "GO", "Goias", 3], ["BR", "SP", "Sao Paulo", 2], ["BR", "??", "", 1], ["US", "CA", "California", 2], ["PT", undefined, "Lisbon", 1]];
  for (var ri = 0; ri < seedR.length; ri++) for (var rj = 0; rj < seedR[ri][3]; rj++) {
    await W.fetch(req("POST", "/api/visit", h, { country: seedR[ri][0], regionCode: seedR[ri][1], region: seedR[ri][2], city: "Goiania", latitude: "-16.6", postalCode: "74000" }), envR, ctx);
  }
  await W.fetch(req("POST", "/api/visit", h, { regionCode: "GO" }), envR, ctx); // sem país: conta no total, não cria região
  var rIns = envR.DB.log.filter(function (l) { return /^INSERT INTO visits_region_monthly/.test(l.sql); });
  check(rIns.length === 9, "uma linha de região por visita com país: " + rIns.length);
  rIns.forEach(function (l) {
    check(l.args.length === 5 && /^\d{4}-\d{2}$/.test(l.args[0]) && /^[A-Z]{2}$/.test(l.args[1]) && /^[A-Z0-9]{1,3}$/.test(l.args[2]) && typeof l.args[3] === "string" && l.args[3].length <= 80 && typeof l.args[4] === "number", "insert de região só com mês, país, região, nome e timestamp");
    check(JSON.stringify(l.args).indexOf("Goiania") < 0 && JSON.stringify(l.args).indexOf("74000") < 0 && JSON.stringify(l.args).indexOf("-16.6") < 0, "cidade, CEP e coordenadas nunca gravados");
  });
  var rj2 = await (await W.fetch(req("GET", "/api/visitors"), envR, ctx)).json();
  check(rj2.total_visits === 10 && rj2.countries_count === 3, "total e países seguem iguais com região: " + rj2.total_visits + "/" + rj2.countries_count);
  var br = rj2.regions[0];
  check(br.country === "BR" && br.visits === 6 && br.unknown === 1, "BR agrupado, com desconhecido à parte: " + JSON.stringify(br));
  check(br.items.map(function (x) { return x.code + x.visits; }).join() === "GO3,SP2" && br.items[0].name === "Goias", "ranking de estados do BR, sem XX");
  check(rj2.regions.map(function (g) { return g.country; }).join() === "BR,US,PT", "países com região ordenados por visitas");
  check(rj2.regions[2].items.length === 0 && rj2.regions[2].unknown === 1, "PT sem regionCode → só desconhecido");
  check(rj2.regions.every(function (g) { return g.items.every(function (it) { return Object.keys(it).sort().join() === "code,name,visits"; }); }), "item de região só com code, name, visits");
  check(/^\d{4}-\d{2}$/.test(rj2.regions_since), "regions_since no formato AAAA-MM");
  // tabela de região ausente (migration não aplicada): país continua contando e /api/visitors continua 200
  var envNo = { DB: fakeDb({ noRegionTable: true }), ASSETS: env.ASSETS };
  Object.keys(store).forEach(function (k) { delete store[k]; });
  check((await W.fetch(req("POST", "/api/visit", h, { country: "BR", regionCode: "GO" }), envNo, ctx)).status === 204, "sem tabela de região: visit 204");
  check(Object.keys(envNo.DB.rows).length === 1, "sem tabela de região: país contado mesmo assim");
  var noJ = await W.fetch(req("GET", "/api/visitors"), envNo, ctx);
  var noB = await noJ.json();
  check(noJ.status === 200 && noB.total_visits === 1 && noB.regions.length === 0 && noB.regions_since === null, "sem tabela de região: visitors 200 sem regiões");
  Object.keys(store).forEach(function (k) { delete store[k]; });
  // purge também apaga regiões antigas
  envR.DB.regions["2020-01|BR|GO"] = { ym: "2020-01", country: "BR", region: "GO", name: "", n: 5, updated_at: 1 };
  var oldRand = Math.random; Math.random = function () { return 0; };
  await W.fetch(req("POST", "/api/visit", h, { country: "BR", regionCode: "GO" }), envR, ctx);
  Math.random = oldRand;
  await Promise.all(waits);
  check(!envR.DB.regions["2020-01|BR|GO"], "purge remove meses antigos da tabela de regiões");
  Object.keys(store).forEach(function (k) { delete store[k]; });
  // nomes de estado no cliente
  var VR = require(path.join(root, "assets/js/visitors.js"));
  check(VR.regionLabel("BR", "GO", "Goias") === "Goiás" && VR.regionLabel("BR", "SP", "") === "São Paulo" && VR.regionLabel("BR", "DF", "x", "Federal District") === "Federal District", "estados do Brasil com grafia oficial; DF por idioma");
  check(Object.keys(VR.BR_STATES).length === 26, "26 estados + DF");
  check(VR.regionLabel("US", "CA", "California") === "California" && VR.regionLabel("FR", "IDF", "") === "FR-IDF", "outros países: nome da Cloudflare ou PAÍS-CÓDIGO");
  var vpage = read("visitors/index.html");
  // inglês é o padrão: o HTML estático é o que aparece em EN, então tem de bater com o dicionário
  var vctx = { window: {} };
  require("vm").runInNewContext(read("assets/i18n/en.js"), vctx);
  var EN = vctx.window.LUCKSREI_I18N.en;
  var vcount = 0;
  vpage.replace(/<(h1|h2|p|span|dt|a)\b[^>]*data-i18n="(visitors\.[^"]+)">([^<]*)<\/\1>/g, function (_, tag, k, txt) { vcount++; check(txt === EN[k], "visitors/index.html: texto estático em en igual ao dicionário (" + k + ")"); });
  check(vcount >= 10, "visitors/index.html: textos estáticos conferidos (" + vcount + ")");
  check(vpage.indexOf('content="' + EN["seo.visitors.description"] + '"') > 0, "visitors/index.html: meta description estática igual ao dicionário");
  check(/id="v-regions"/.test(vpage) && /id="v-rg-filters"/.test(vpage) && read("index.html").indexOf('id="v-regions"') < 0, "estados só em /visitors/, não na home");
  check(/0002_visits_region\.sql/.test(fs.readdirSync(path.join(root, "migrations")).join()) && /CREATE TABLE IF NOT EXISTS visits_region_monthly/.test(read("migrations/0002_visits_region.sql")) && !/visits_monthly\b(?!_)/.test(read("migrations/0002_visits_region.sql").replace(/visits_region_monthly/g, "").replace(/--.*$/gm, "")), "migration 0002 só cria a tabela nova");

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
  check(page.indexOf("visitors.js") > 0 && page.indexOf("apps.js") < 0, "visitors.js na página de visitantes");
  var home = read("index.html");
  check(home.indexOf("visitors.js") > 0 && /id="v-map" data-lazy/.test(home) && home.indexOf('id="v-rank"') < 0, "home carrega visitors.js, mapa lazy e sem ranking");
  check(home.indexOf('id="contato"') < home.indexOf('id="v-map"') && home.indexOf('id="v-map"') < home.indexOf("<footer"), "mapa da home fica depois do CTA e antes do rodapé");
  ["apps/index.html", "contact/index.html", "projects/aura/index.html", "privacy/index.html"].forEach(function (f) {
    var t = read(f);
    check(t.indexOf('data-i18n="footer.visitors"') > 0 && t.indexOf('href="/visitors/"') > 0, f + ": link no rodapé");
    check(t.indexOf("visitors.js") < 0, f + ": não carrega visitors.js");
  });
  check(read("sitemap.xml").indexOf("https://lucksrei.com/visitors/") > 0, "sitemap inclui /visitors/");
  check(home.indexOf('data-i18n="footer.visitors"') > 0 && home.indexOf('href="/visitors/"') > 0, "index.html: link no rodapé");
  // --- /privacy/ localizada (en no HTML estático; pt-BR e es pelos dicionários)
  var vm = require("vm");
  var dctx = { window: {} };
  ["en", "pt-BR", "es"].forEach(function (l) { vm.runInNewContext(read("assets/i18n/" + l + ".js"), dctx); });
  var D = dctx.window.LUCKSREI_I18N;
  var priv = read("privacy/index.html");
  check(/<html lang="en" data-seo="privacy">/.test(priv) && /canonical" href="https:\/\/lucksrei.com\/privacy\/"/.test(priv), "privacy com data-seo e canonical");
  check(priv.indexOf("pt-only-notice") < 0 && /<main id="main">/.test(priv), "privacy sem aviso de 'só em português' e sem main fixo em pt-BR");
  var pkeys = [];
  priv.replace(/<(h1|h2|p|a|span)\b[^>]*data-i18n="(privacy\.site\.[^"]+)">([\s\S]*?)<\/\1>/g, function (_, tag, k, txt) { pkeys.push(k); check(txt === D.en[k], "privacy: texto estático em en igual ao dicionário (" + k + ")"); });
  check(pkeys.length >= 20, "privacy: corpo, títulos e navegação via data-i18n (" + pkeys.length + ")");
  ["en", "pt-BR", "es"].forEach(function (l) {
    var d = D[l];
    ["title", "description", "ogTitle", "ogDescription"].forEach(function (k) { check(d["seo.privacy." + k], l + ": seo.privacy." + k); });
    pkeys.forEach(function (k) { check(d[k], l + ": " + k); });
    check(d["privacy.site.p3b"].indexOf('href="/visitors/"') > 0, l + ": privacy linka o mapa de visitantes");
    check(d["privacy.site.p5"].indexOf('href="/projects/match-queue/privacy/"') > 0, l + ": privacy linka a política do Match Queue");
    check(/54\.868\.173\/0001-55/.test(d["privacy.site.p1"]) && /LUCAS DIOGO FRANCA/.test(d["privacy.site.p1"]), l + ": razão social e CNPJ preservados");
  });
  // mesmo conteúdo jurídico: estatística agregada e ausência de IP / localização precisa / identificadores
  check(/estatísticas agregadas de acesso por país e por estado ou região/.test(D["pt-BR"]["privacy.site.p3b"]) && /Não são armazenados IP, cidade, localização precisa ou identificadores pessoais/.test(D["pt-BR"]["privacy.site.p3b"]), "pt-BR: estatísticas agregadas (país e estado) sem IP/cidade");
  check(/aggregated access statistics by country and by state or region/.test(D.en["privacy.site.p3b"]) && /No IP address, city, precise location or personal identifiers are stored/.test(D.en["privacy.site.p3b"]), "en: estatísticas agregadas (país e estado) sem IP/cidade");
  check(/estadísticas agregadas de acceso por país y por estado o región/.test(D.es["privacy.site.p3b"]) && /no se almacenan la dirección IP, la ciudad, la ubicación precisa ni identificadores personales/.test(D.es["privacy.site.p3b"]), "es: estatísticas agregadas (país e estado) sem IP/cidade");
  check(D["pt-BR"]["privacy.notice"] && read("projects/aura/privacy/index.html").indexOf("privacy.notice") > 0, "aviso 'só em português' continua nas políticas dos apps");
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
