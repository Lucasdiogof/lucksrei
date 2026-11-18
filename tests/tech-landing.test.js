/* Landing /tech/ e páginas legais do Tech System: arquivo gerado atualizado, 4 ofertas Hotmart com o preço certo,
 * nada de dados de teste/revisão nos textos públicos e imagens/sitemap presentes. Run: node tests/tech-landing.test.js */
"use strict";
var fs = require("fs"), path = require("path"), assert = require("assert"), cp = require("child_process");
var root = path.join(__dirname, "..");
var read = function (f) { return fs.readFileSync(path.join(root, f), "utf8"); };

cp.execFileSync(process.execPath, [path.join(root, "tools/systems/landing.mjs"), "--check"], { stdio: "inherit" });

var html = read("tech/index.html");
var plans = { 30: ["9sd1hisj", "R$ 29,90"], 90: ["uw2vrhwa", "R$ 79,90"], 180: ["26y1jwtc", "R$ 149,90"], 365: ["tqbkw02l", "R$ 269,90"] };
Object.keys(plans).forEach(function (d) {
  var i = html.indexOf('data-plan="' + d + '"');
  assert(i > -1, "plano " + d);
  var card = html.slice(html.lastIndexOf('<div class="pricing-card', i), i);
  assert(card.indexOf(plans[d][1]) > -1, "preço " + d);
  assert(html.indexOf('href="https://pay.hotmart.com/G108540478S?off=' + plans[d][0] + '"') > -1, "checkout " + d);
});
assert.strictEqual((html.match(/<h1>/g) || []).length, 1, "um h1");
assert(html.indexOf('rel="canonical" href="https://lucksrei.com/tech/"') > -1, "canonical");

var pages = ["tech/index.html", "systems/tech/index.html"].concat(["privacy", "terms", "support", "licensing", "account-deletion", "data-deletion"].map(function (p) { return "projects/tech/" + p + "/index.html"; }));
pages.forEach(function (f) {
  var low = read(f).toLowerCase();
  ["revisão google", "revisao google", "usuário fictício", "conta de teste", "dados de demonstração", "barbear"].concat(f.indexOf("systems/") === 0 ? [] : ["beard"]).forEach(function (t) {
    assert(low.indexOf(t) === -1, f + ": termo proibido " + t);
  });
});
["logo.webp", "hero.webp", "og.png", "visao-geral.webp", "ordens.webp", "equipe.webp"].forEach(function (n) {
  assert(fs.existsSync(path.join(root, "assets/img/tech", n)) && fs.existsSync(path.join(root, "systems/assets/img/tech", n)), n);
});
var sm = read("sitemap.xml");
["tech/", "projects/tech/privacy/", "projects/tech/terms/", "projects/tech/support/", "projects/tech/licensing/", "projects/tech/account-deletion/", "projects/tech/data-deletion/"].forEach(function (u) {
  assert(sm.indexOf("<loc>https://lucksrei.com/" + u + "</loc>") > -1, "sitemap " + u);
});
console.log("tech-landing: ok");
