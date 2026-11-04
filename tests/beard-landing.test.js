/* Landing /beard/: cada botão de compra aponta para a oferta Hotmart do seu período, com o preço certo,
 * e a página não promete autoagendamento. Run: node tests/beard-landing.test.js
 */
"use strict";
var fs = require("fs");
var path = require("path");
var assert = require("assert");
var root = path.join(__dirname, "..");
var html = fs.readFileSync(path.join(root, "beard/index.html"), "utf8");

var plans = {
  "30": { off: "v3744m8m", price: "R$ 29,90" },
  "90": { off: "266mk4ak", price: "R$ 79,90" },
  "180": { off: "6swonc53", price: "R$ 149,90" },
  "365": { off: "ohpz770b", price: "R$ 269,90" }
};
Object.keys(plans).forEach(function (d) {
  var re = new RegExp('<div class="pricing-card[^"]*">[\\s\\S]*?</div>\\s*(?=<div class="pricing-card|</div>\\s*</section>)', "g");
  var card = (html.match(re) || []).filter(function (c) { return c.indexOf('data-plan="' + d + '"') > -1; })[0];
  assert(card, "card " + d);
  assert(card.indexOf("<span class=\"pricing-duration\">" + d + " dias") > -1, "duração " + d);
  assert(card.indexOf(plans[d].price) > -1, "preço " + d);
  assert(card.indexOf('href="https://pay.hotmart.com/M108332227C?off=' + plans[d].off + '"') > -1, "checkout " + d);
  assert(card.indexOf("Comprar " + d + " dias") > -1, "botão " + d);
});
assert.strictEqual((html.match(/pay\.hotmart\.com/g) || []).length, 8, "4 links + 4 ofertas no JSON-LD");
["mais popular", "autoagend", "portal do cliente", "payhip", "whop", "mercado livre", "whatsapp autom"].forEach(function (t) {
  assert(html.toLowerCase().indexOf(t) === -1, "termo proibido: " + t);
});
["hero-financeiro", "hero-agenda", "logo", "og"].forEach(function (n) {
  assert(fs.existsSync(path.join(root, "assets/img/beard", n + (n === "og" ? ".png" : ".webp"))), n);
});
console.log("beard-landing: ok");
