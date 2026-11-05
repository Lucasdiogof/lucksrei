/* sistemas.lucksrei.com showcase: generated files are fresh, 4 plans x 2 products with the right prices and Hotmart offers,
 * links/assets resolve, nothing forbidden is promised, and tracking stays silent without consent.
 * Run: node tests/systems.test.js */
"use strict";
var fs = require("fs"), path = require("path"), assert = require("assert"), vm = require("vm"), cp = require("child_process");
var root = path.join(__dirname, "..");
var S = path.join(root, "systems");
var read = function (f) { return fs.readFileSync(path.join(S, f), "utf8"); };

// 1. The committed output equals the generator output.
cp.execFileSync(process.execPath, [path.join(root, "tools/systems/build.mjs"), "--check"], { stdio: "inherit" });

var plans = {
  beard: { base: "M108332227C", offs: { 30: "v3744m8m", 90: "266mk4ak", 180: "6swonc53", 365: "ohpz770b" } },
  stockport: { base: "Y108188423I", offs: { 30: "2etqhbn4", 90: "abyjgd6l", 180: "3hhdqjj4", 365: "0e1joqem" } }
};
var prices = { 30: "R$ 29,90", 90: "R$ 79,90", 180: "R$ 149,90", 365: "R$ 269,90" };
var perDay = { 30: "R$ 1,00", 90: "R$ 0,89", 180: "R$ 0,83", 365: "R$ 0,74" };

Object.keys(plans).forEach(function (slug) {
  var html = read(slug + "/index.html");
  [30, 90, 180, 365].forEach(function (d) {
    var url = "https://pay.hotmart.com/" + plans[slug].base + "?off=" + plans[slug].offs[d];
    var m = html.match(new RegExp('<a href="' + url.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + '"[^>]*data-days="' + d + '"[^>]*>Comprar ' + d + " dias</a>"));
    assert(m, slug + " checkout " + d);
    assert(m[0].indexOf('data-track="checkout_link_click"') > -1 && m[0].indexOf('rel="noopener"') > -1, slug + " attrs " + d);
    assert(html.indexOf(prices[d]) > -1 && html.indexOf(perDay[d] + " por dia") > -1, slug + " price " + d);
  });
  assert.strictEqual((html.match(/pay\.hotmart\.com/g) || []).length, 8, slug + ": 4 links + 4 JSON-LD offers");
  assert(html.indexOf('rel="canonical" href="https://sistemas.lucksrei.com/' + slug + '/"') > -1, slug + " canonical");
  assert.strictEqual((html.match(/<h1>/g) || []).length, 1, slug + " one h1");
  assert(html.indexOf("Prefere comprar por outra plataforma?") > -1, slug + " alt platforms");
  assert(html.indexOf("renovação automática") > -1 && html.indexOf("ativação") > -1, slug + " payment rules");
  assert.strictEqual(html.indexOf('href="https://beard.lucksrei.com"') > -1, slug === "beard", slug + " app url only on its own page");
  assert.strictEqual(html.indexOf('href="https://stockport.lucksrei.com"') > -1, slug === "stockport", slug + " app url only on its own page");
});
// product rules must not leak between products
assert(read("beard/index.html").indexOf("7 dias por padrão") > -1, "beard grace period");
assert(read("stockport/index.html").indexOf("tolerância") === -1, "stockport has no documented grace period");
assert(read("stockport/index.html").indexOf("O StockPort não emite nota fiscal") > -1, "stockport fiscal disclaimer");

["index.html", "beard/index.html", "stockport/index.html", "404.html"].forEach(function (f) {
  var html = read(f), low = html.toLowerCase();
  ["mais vendido", "mais popular", "autoagend", "portal do cliente", "24 horas", "garantia de resultado", "depoimento", "clientes satisfeitos"].forEach(function (t) {
    assert(low.indexOf(t) === -1, f + ": termo proibido " + t);
  });
  var noLd = html.replace(/<script type="application\/ld\+json">[\s\S]*?<\/script>/, "");
  assert(!/<script(?![^>]*src=)/.test(noLd), f + ": sem script inline");
  assert(!/\son[a-z]+=/.test(noLd), f + ": sem handlers inline");
  assert(!/\sstyle=/.test(noLd), f + ": sem style inline");
  JSON.parse((html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/) || [0, "{}"])[1]);
  (html.match(/<a [^>]*href="https?:\/\/[^"]*"[^>]*>/g) || []).forEach(function (a) {
    if (/href="https:\/\/lucksrei\.com/.test(a) || /href="mailto:/.test(a)) return;
    assert(a.indexOf("noopener") > -1, f + ": rel noopener ausente em " + a);
  });
  (html.match(/(?:src|href)="\/[^"#?]*"/g) || []).forEach(function (r) {
    var p = r.replace(/^[a-z]+="/, "").replace(/"$/, "");
    var file = p.slice(-1) === "/" ? p + "index.html" : p;
    assert(fs.existsSync(path.join(S, file)), f + ": falta " + p);
  });
  (html.match(/<img [^>]*>/g) || []).filter(function (i) { return i.indexOf("lightbox-img") === -1; }).forEach(function (i) {
    assert(/width="\d+"/.test(i) && /height="\d+"/.test(i) && /alt=/.test(i), f + ": img sem dimensões/alt " + i);
  });
});
["beard", "stockport"].forEach(function (s) {
  var hero = read(s + "/index.html").split('<section class="hero">')[1].split("</section>")[0];
  assert(hero.indexOf('loading="lazy"') === -1 && hero.indexOf('fetchpriority="high"') > -1, s + " hero image eager");
});
assert.strictEqual(read("sitemap.xml").split("<loc>").length, 4, "sitemap has 3 urls");
assert(read("robots.txt").indexOf("Sitemap: https://sistemas.lucksrei.com/sitemap.xml") > -1, "robots");
assert(read("_headers").indexOf("script-src 'self';") > -1 && read("_headers").indexOf("unsafe-inline") === -1, "strict CSP");
var cfgSrc = read("assets/js/tracking-config.js");
assert(/ga4: ""/.test(cfgSrc) && /googleAds: ""/.test(cfgSrc) && /metaPixel: ""/.test(cfgSrc), "no marketing IDs committed");

// documentation referenced from the shipped config must exist
["docs/systems/PUBLISHING.md", "docs/systems/TRACKING.md", "docs/systems/README.md"].forEach(function (d) { assert(fs.existsSync(path.join(root, d)), "falta " + d); });
assert(read("_headers").indexOf("docs/systems/TRACKING.md") > -1 && fs.readFileSync(path.join(root, "wrangler.systems.jsonc"), "utf8").indexOf("docs/systems/PUBLISHING.md") > -1, "references point to existing docs");

// 2. The main Worker must not serve the showcase, and the showcase Worker is assets-only.
assert(/^systems$/m.test(fs.readFileSync(path.join(root, ".assetsignore"), "utf8")), "main worker ignores systems/");
var wj = JSON.parse(fs.readFileSync(path.join(root, "wrangler.systems.jsonc"), "utf8").replace(/^\s*\/\/.*$/gm, ""));
assert(wj.name === "lucksrei-systems" && wj.assets.directory === "./systems" && !wj.main && !wj.d1_databases && !wj.routes, "systems worker is static only");

// 3. Tracking with a stubbed browser: silent without consent; a checkout click is never a purchase.
function run(consent) {
  var handlers = {}, store = consent ? { lx_consent: consent } : {};
  var anchor = { dataset: { product: "beard", days: "30", price: "29.90", track: "checkout_link_click" }, href: "https://pay.hotmart.com/M108332227C?off=v3744m8m" };
  anchor.closest = function () { return anchor; };
  var ctx = {
    window: { LX_TRACKING: {} }, location: { search: "?utm_source=google&utm_campaign=beard%20teste" },
    localStorage: { getItem: function (k) { return store[k] || null; }, setItem: function (k, v) { store[k] = v; } },
    document: {
      currentScript: { getAttribute: function () { return "beard"; } }, getElementById: function () { return null; }, querySelector: function () { return null; },
      querySelectorAll: function (sel) { return /checkout_link_click/.test(sel) ? [anchor] : []; }, addEventListener: function (t, f) { handlers[t] = f; }, head: { appendChild: function () {} }, createElement: function () { return {}; }
    },
    URL: URL, URLSearchParams: URLSearchParams, Date: Date
  };
  ctx.window.window = ctx.window;
  vm.createContext(ctx);
  vm.runInContext(fs.readFileSync(path.join(S, "assets/js/systems.js"), "utf8"), ctx);
  handlers.click({ target: anchor });
  return { events: ctx.window.lxEvents || [], href: anchor.href };
}
assert.strictEqual(run("denied").events.length, 0, "denied: nothing recorded");
assert.strictEqual(run(null).events.length, 0, "undecided: nothing recorded");
var granted = run("granted");
var names = granted.events.map(function (e) { return e.name; });
assert(names.indexOf("checkout_link_click") > -1, "granted: checkout link click recorded as an interaction");
["purchase", "begin_checkout", "InitiateCheckout", "Lead", "checkout_started"].forEach(function (n) { assert(names.indexOf(n) === -1, "never emits " + n); });
// outbound clicks must map to custom events, never Meta standard conversions
var js = fs.readFileSync(path.join(S, "assets/js/systems.js"), "utf8");
assert(!/fbq\("track", "(Lead|InitiateCheckout|Purchase|AddToCart|CompleteRegistration)"/.test(js) && js.indexOf('"trackCustom"') > -1, "meta: custom events only");
assert(!/gtag\("event", "(purchase|begin_checkout|generate_lead)"/.test(js), "ga4: no conversion event names");
var u = new URL(granted.href);
assert.strictEqual(u.searchParams.get("sck"), "b|30|google|beardteste", "sck: product|days|source|campaign");
assert(u.searchParams.get("sck").length <= 30 && u.searchParams.get("sck").indexOf("_") === -1, "sck within Hotmart limits (30 chars, no underscore)");
assert.strictEqual(u.searchParams.get("src"), null, "src is not used (affiliate parameter)");
assert.strictEqual(u.searchParams.get("utm_source"), "google", "utm forwarded");
assert.strictEqual(u.searchParams.get("off"), "v3744m8m", "offer preserved");
console.log("systems: ok");
