/* Valida o dataset de /apps. Rode: node tests/apps-data.test.js */
"use strict";
var fs = require("fs");
var path = require("path");
var vm = require("vm");
var root = path.join(__dirname, "..");
var ctx = { window: {} };
vm.runInNewContext(fs.readFileSync(path.join(root, "assets/js/apps-data.js"), "utf8"), ctx);
var d = ctx.window.LUCKSREI_APPS;
var failures = [];
function check(ok, msg) { if (!ok) failures.push(msg); }
function count(g) { return d.apps.filter(function (a) { return a.group === g; }).length; }

check(d.apps.length === 31, "total deve ser 31, é " + d.apps.length);
check(count("own") === 4, "own deve ser 4, é " + count("own"));
check(count("professional") === 7, "professional deve ser 7, é " + count("professional"));
check(count("cooper") === 20, "cooper deve ser 20, é " + count("cooper"));
var ids = {};
d.apps.forEach(function (a) {
  check(!ids[a.id], "id duplicado: " + a.id);
  ids[a.id] = 1;
  check(["own", "professional", "cooper"].indexOf(a.group) >= 0, "group inválido em " + a.id);
  if (a.logo) check(fs.existsSync(path.join(root, a.logo)), "logo inexistente: " + a.logo);
  ["androidUrl", "iosUrl"].forEach(function (k) {
    if (a[k]) check(/^https:\/\/(play\.google\.com|apps\.apple\.com)\//.test(a[k]), k + " suspeita em " + a.id);
  });
  if (a.rating != null) check(typeof a.rating === "number", "rating inválido em " + a.id);
});
d.featured.forEach(function (id) { check(ids[id], "featured desconhecido: " + id); });
var forbidden = ["amigao" + "-card", "amigão " + "card"];
d.apps.forEach(function (a) {
  forbidden.forEach(function (f) {
    check((a.id + " " + a.name).toLowerCase().indexOf(f) < 0, "app fora do portfólio presente: " + a.name);
  });
});

// logos publicadas: 31 WebP, todas referenciadas, nenhuma via /src/
var published = fs.readdirSync(path.join(root, "assets/img/apps")).filter(function (n) { return /\.webp$/.test(n); });
check(published.length === 31, "logos publicadas devem ser 31, são " + published.length);
var referenced = d.apps.filter(function (a) { return a.logo; }).map(function (a) { return path.basename(a.logo); });
check(referenced.length === 31, "apps com logo devem ser 31, são " + referenced.length);
published.forEach(function (n) { check(referenced.indexOf(n) >= 0, "logo publicada sem app: " + n); });
d.apps.forEach(function (a) {
  if (a.logo && a.group === "cooper") check(path.basename(a.logo, ".webp") === a.id, "logo/id divergem em " + a.id);
  if (a.logo) check(a.logo.indexOf("/src/") < 0, "logo aponta para /src/: " + a.id);
});
var noLogo = d.apps.filter(function (a) { return !a.logo; }).map(function (a) { return a.id; }).sort().join(",");
check(noLogo === "", "todos os apps devem ter logo; sem logo: " + noLogo);
var agr = d.apps.filter(function (a) { return a.id === "agr-fiscal"; })[0];
check(agr && /id=tests\.com\.example\.aplicativo_fiscalizacao1&/.test(agr.androidUrl) && !agr.iosUrl, "AGR Fiscal: só Google Play, id com 1 no final (sem o 1 dá 404)");
var ignore = fs.readFileSync(path.join(root, ".assetsignore"), "utf8");
check(/assets\/img\/apps\/src/.test(ignore), "originais devem estar no .assetsignore");
// lojas: nada do app fora do portfólio e links Cooper só do publisher Cooper Card (br.com.cooper.*)
var banned = ["coopercard.mobile." + "apa", "id1573329092"];
d.apps.forEach(function (a) {
  [a.androidUrl, a.iosUrl].forEach(function (u) { if (u) banned.forEach(function (b) { check(u.indexOf(b) < 0, "link de app fora do portfólio em " + a.id); }); });
  if (a.group === "cooper" && a.androidUrl) check(/id=br\.com\.cooper\.[a-z]+$/.test(a.androidUrl), "pacote Android Cooper inesperado em " + a.id);
});
check(d.apps.filter(function (a) { return a.group === "cooper" && a.androidUrl && a.iosUrl; }).length === 19, "19 apps Cooper devem ter Android e iOS");
// CTA da home: o fallback estático precisa bater com o cálculo
var home = fs.readFileSync(path.join(root, "index.html"), "utf8");
var m = home.match(/id="apps-more"[^>]*>\+(\d+)</);
var shownCount = d.featured.filter(function (id) { return ids[id]; }).length;
check(m && Number(m[1]) === d.apps.length - shownCount, "contador estático da home não bate com o dataset");
// nenhuma menção residual no site
function walk(dir, out) {
  fs.readdirSync(dir).forEach(function (n) {
    if (n === ".git" || n === "node_modules" || n === "tests" || n === "src") return;
    var p = path.join(dir, n);
    if (fs.statSync(p).isDirectory()) walk(p, out); else if (/\.(html|js|xml|txt|css)$/.test(n)) out.push(p);
  });
  return out;
}
walk(root, []).forEach(function (f) {
  var t = fs.readFileSync(f, "utf8").toLowerCase();
  forbidden.forEach(function (x) { check(t.indexOf(x) < 0, "menção residual em " + path.relative(root, f)); });
});

if (failures.length) { console.error("FALHOU:\n - " + failures.join("\n - ")); process.exit(1); }
console.log("ok — " + d.apps.length + " apps (own " + count("own") + ", professional " + count("professional") + ", cooper " + count("cooper") + ")");
