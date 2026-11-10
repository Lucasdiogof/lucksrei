/* Browser check of GA4 consent behaviour on the sales pages (desktop + mobile, accept + decline).
 * Not part of `tests/*.test.js` because it needs Playwright and a browser:
 *   npm i --no-save playwright && npx playwright install chromium && node tests/browser/systems-ga4.mjs
 * It serves ./systems with the CSP from systems/_headers and answers every Google request with a local stub,
 * so NO hit ever reaches the real GA4 property. */
import http from "node:http"; import fs from "node:fs"; import path from "node:path"; import assert from "node:assert";
import { chromium, devices } from "playwright";

const root = path.resolve(process.env.SYSTEMS_DIR || path.join(import.meta.dirname, "..", "..", "systems"));
const csp = /Content-Security-Policy: (.*)/.exec(fs.readFileSync(path.join(root, "_headers"), "utf8"))[1].trim();
const types = { ".html": "text/html; charset=utf-8", ".js": "text/javascript", ".css": "text/css", ".svg": "image/svg+xml", ".webp": "image/webp", ".png": "image/png", ".woff2": "font/woff2", ".txt": "text/plain", ".xml": "application/xml", ".mp4": "video/mp4" };
const srv = http.createServer((req, res) => {
  let p = decodeURIComponent(new URL(req.url, "http://x").pathname); if (p.endsWith("/")) p += "index.html";
  const f = path.join(root, p);
  if (!f.startsWith(root) || !fs.existsSync(f)) { res.writeHead(404); return res.end("nf"); }
  res.writeHead(200, { "Content-Type": types[path.extname(f)] || "application/octet-stream", "Content-Security-Policy": csp }); res.end(fs.readFileSync(f));
}).listen(0);
const base = `http://localhost:${srv.address().port}`;
const GA = "G-629PGJE5CZ";
const browser = await chromium.launch();
const profiles = { desktop: { viewport: { width: 1280, height: 800 } }, mobile: devices["iPhone 13"] };
let n = 0; const ok = (m) => { n++; console.log("ok -", m); };

async function open(ctx, url) {
  const page = await ctx.newPage(); const g = { reqs: [], csp: [] };
  await page.route(/google|googletagmanager/, (r) => {
    const u = r.request().url(); g.reqs.push(u);
    if (u.includes("gtag/js")) r.fulfill({ contentType: "text/javascript", body: "/*stub*/" }); else r.abort();
  });
  page.on("console", (m) => { if (/Content Security Policy/i.test(m.text())) g.csp.push(m.text()); });
  await page.goto(base + url); await page.waitForLoadState("networkidle");
  return { page, g };
}
const events = (page) => page.evaluate(() => (window.dataLayer || []).filter((a) => a[0] === "event").map((a) => ({ name: a[1], ...a[2] })));
const gaCfg = (page) => page.evaluate((id) => (window.dataLayer || []).filter((a) => a[0] === "config" && a[1] === id).map((a) => a[2]), GA);
const noNav = (page) => page.locator('a[data-track="checkout_link_click"]').first().evaluate((a) => a.addEventListener("click", (e) => e.preventDefault()));

for (const [pname, opts] of Object.entries(profiles)) {
  for (const product of ["beard", "stockport"]) {
    const url = `/${product}/`, tag = `${pname} ${product}`;
    // ---- decline: nothing loads, nothing is sent
    let ctx = await browser.newContext(opts); let { page, g } = await open(ctx, url);
    await page.locator("#consent [data-consent=deny]").click();
    await noNav(page);
    await page.locator('a[data-track="checkout_link_click"]').first().click({ force: true });
    await page.reload(); await page.waitForLoadState("networkidle");
    assert.strictEqual(g.reqs.length, 0, tag + ": decline -> zero Google requests (" + g.reqs.join(",") + ")");
    assert.strictEqual(await page.evaluate(() => typeof window.gtag + typeof window.dataLayer), "undefinedundefined", tag + ": no gtag/dataLayer");
    assert.strictEqual(await page.locator("#consent").isHidden(), true, tag + ": banner stays closed after decline");
    ok(tag + ": decline sends nothing"); await ctx.close();

    // ---- undecided: nothing either
    ctx = await browser.newContext(opts); ({ page, g } = await open(ctx, url));
    assert.strictEqual(g.reqs.length, 0, tag + ": undecided -> zero Google requests");
    ok(tag + ": undecided sends nothing");

    // ---- accept: one loader, one page_view, product label, no conversion events
    await page.locator("#consent [data-consent=accept]").click(); await page.waitForTimeout(300);
    assert.strictEqual(g.reqs.filter((u) => u.includes("gtag/js")).length, 1, tag + ": gtag loaded exactly once");
    assert(g.reqs.every((u) => u.includes("id=" + GA)), tag + ": only the GA4 id is requested");
    const cfgs = await gaCfg(page); assert.strictEqual(cfgs.length, 1, tag + ": config once");
    assert.strictEqual(cfgs[0].cookie_domain, "localhost", tag + ": cookie_domain pinned to the page host (sistemas.lucksrei.com in production)"); assert.strictEqual(cfgs[0].send_page_view, false); assert.strictEqual(cfgs[0].allow_google_signals, false); assert.strictEqual(cfgs[0].allow_ad_personalization_signals, false);
    let ev = await events(page);
    assert.deepStrictEqual(ev.filter((e) => e.name === "page_view").map((e) => e.product), [product], tag + ": one page_view with product");
    await page.locator("#planos").scrollIntoViewIfNeeded(); await page.waitForTimeout(600);
    await page.evaluate(() => window.scrollBy(0, 40)); await page.evaluate(() => window.scrollBy(0, -40)); await page.waitForTimeout(300);
    ev = await events(page);
    assert.deepStrictEqual(ev.filter((e) => e.name === "plans_view").map((e) => e.product), [product], tag + ": plans_view once with product");
    await noNav(page);
    await page.locator('a[data-track="checkout_link_click"]').first().click({ force: true }); await page.waitForTimeout(200);
    ev = await events(page);
    const ck = ev.filter((e) => e.name === "checkout_link_click");
    assert.strictEqual(ck.length, 1, tag + ": one checkout_link_click per click");
    assert.strictEqual(ck[0].product, product); assert.strictEqual(ck[0].currency, "BRL"); assert(ck[0].plan.startsWith(product + "-"), tag + ": plan label");
    assert(ev.every((e) => !/purchase|begin_checkout|generate_lead/.test(e.name)), tag + ": no conversion event names");
    assert.deepStrictEqual(g.csp, [], tag + ": no CSP violations (" + g.csp.join(" | ") + ")");
    ok(tag + ": accept -> single page_view, plans_view, checkout_link_click, CSP clean");

    // ---- reload while granted: still exactly one page_view
    await page.reload(); await page.waitForLoadState("networkidle"); await page.waitForTimeout(300);
    ev = await events(page); assert.strictEqual(ev.filter((e) => e.name === "page_view").length, 1, tag + ": reload -> one page_view");
    // ---- change of mind: reopen preferences and decline -> GA cookies removed, others kept
    await page.evaluate(() => { document.cookie = "_ga=GA1.1.1.1; path=/"; document.cookie = "_ga_ABC=GS2.1.x; path=/"; document.cookie = "keep=1; path=/"; });
    await page.locator(".footer-links .linklike").click(); await page.locator("#consent [data-consent=deny]").click();
    const cookies = await page.evaluate(() => document.cookie);
    assert(!/_ga/.test(cookies) && /keep=1/.test(cookies), tag + ": decline removes _ga cookies only (" + cookies + ")");
    ok(tag + ": revoke removes GA cookies"); await ctx.close();
  }
}
await browser.close(); srv.close(); console.log(`\nsystems-ga4 browser: ${n} groups ok`);
