/* Browser check of the Meta Pixel consent behaviour (same setup as systems-ga4.mjs). The Pixel id is a FAKE one injected by a route,
 * and every Facebook request is stubbed: nothing reaches Meta. Run: node tests/browser/systems-meta.mjs (needs Playwright). */
import http from "node:http"; import fs from "node:fs"; import path from "node:path"; import assert from "node:assert";
import { chromium } from "playwright";

const root = path.resolve(process.env.SYSTEMS_DIR || path.join(import.meta.dirname, "..", "..", "systems"));
const csp = /Content-Security-Policy: (.*)/.exec(fs.readFileSync(path.join(root, "_headers"), "utf8"))[1].trim();
const types = { ".html": "text/html; charset=utf-8", ".js": "text/javascript", ".css": "text/css", ".svg": "image/svg+xml", ".webp": "image/webp", ".png": "image/png", ".woff2": "font/woff2" };
const srv = http.createServer((req, res) => {
  let p = decodeURIComponent(new URL(req.url, "http://x").pathname); if (p.endsWith("/")) p += "index.html";
  const f = path.join(root, p);
  if (!f.startsWith(root) || !fs.existsSync(f)) { res.writeHead(404); return res.end("nf"); }
  res.writeHead(200, { "Content-Type": types[path.extname(f)] || "application/octet-stream", "Content-Security-Policy": csp }); res.end(fs.readFileSync(f));
}).listen(0);
const base = `http://localhost:${srv.address().port}`;
const PX = "123456789012345";
const browser = await chromium.launch();
const STD = ["Lead", "InitiateCheckout", "Purchase", "AddToCart", "CompleteRegistration"];

async function open(ctx, url) {
  const page = await ctx.newPage(); const g = { fb: [], csp: [] };
  await page.route(/tracking-config\.js$/, (r) => r.fulfill({ contentType: "text/javascript", body: `window.LX_TRACKING={ga4:"",googleAds:"",metaPixel:"${PX}"};` }));
  await page.route(/facebook\./, (r) => { const u = r.request().url(); g.fb.push(u); if (u.includes("fbevents.js")) r.fulfill({ contentType: "text/javascript", body: "/*stub*/" }); else r.abort(); });
  page.on("console", (m) => { if (/Content Security Policy/i.test(m.text())) g.csp.push(m.text()); });
  await page.goto(base + url); await page.waitForLoadState("networkidle");
  return { page, g };
}
const queue = (page) => page.evaluate(() => (window.fbq && window.fbq.queue || []).map((a) => Array.from(a)));
let n = 0;
for (const product of ["beard", "stockport"]) {
  const url = `/${product}/`;
  let ctx = await browser.newContext(); let { page, g } = await open(ctx, url);
  assert.strictEqual(g.fb.length, 0, product + ": undecided -> zero Facebook requests");
  await page.locator("#consent [data-consent=deny]").click(); await page.reload(); await page.waitForLoadState("networkidle");
  assert.strictEqual(g.fb.length, 0, product + ": decline -> zero Facebook requests");
  assert.strictEqual(await page.evaluate(() => typeof window.fbq), "undefined", product + ": no fbq after decline");
  await ctx.close(); console.log("ok -", product, "decline/undecided send nothing"); n++;

  ctx = await browser.newContext(); ({ page, g } = await open(ctx, url));
  await page.locator("#consent [data-consent=accept]").click(); await page.waitForTimeout(400);
  assert.strictEqual(g.fb.filter((u) => u.includes("fbevents.js")).length, 1, product + ": fbevents.js loaded once");
  const q = await queue(page);
  assert(q.some((a) => a[0] === "set" && a[1] === "autoConfig" && a[2] === false && a[3] === PX), product + ": autoConfig off");
  assert.strictEqual(q.filter((a) => a[0] === "init").length, 1, product + ": one init"); assert.deepStrictEqual(q.find((a) => a[0] === "init"), ["init", PX], product + ": init without advanced matching");
  const pv = q.filter((a) => a[0] === "track" && a[1] === "PageView"); assert.strictEqual(pv.length, 1, product + ": one PageView");
  assert.strictEqual(pv[0][2].product, product, product + ": PageView carries product"); assert(pv[0][3] && pv[0][3].eventID, product + ": PageView has an eventID");
  await page.locator("#planos").scrollIntoViewIfNeeded(); await page.waitForTimeout(600);
  await page.locator('a[data-track="checkout_link_click"]').first().evaluate((a) => a.addEventListener("click", (e) => e.preventDefault()));
  await page.locator('a[data-track="checkout_link_click"]').first().click({ force: true }); await page.waitForTimeout(200);
  const q2 = await queue(page);
  const custom = q2.filter((a) => a[0] === "trackCustom").map((a) => a[1]);
  assert(custom.includes("PlansView") && custom.includes("CheckoutLinkClick"), product + ": custom events sent (" + custom + ")");
  assert(!q2.some((a) => a[0] === "track" && STD.includes(a[1])), product + ": no standard conversion events");
  const ids = q2.filter((a) => a[0] === "track" || a[0] === "trackCustom").map((a) => a[3].eventID); assert.strictEqual(new Set(ids).size, ids.length, product + ": eventIDs unique");
  assert.strictEqual(g.csp.length, 0, product + ": no CSP violations: " + g.csp.join(" | "));
  // revoke removes _fbp/_fbc and nothing else
  await page.evaluate(() => { document.cookie = "_fbp=x; path=/"; document.cookie = "_fbc=y; path=/"; document.cookie = "keep=1; path=/"; });
  await page.locator(".footer-links button.linklike").click(); await page.locator("#consent [data-consent=deny]").click();
  const ck = await page.evaluate(() => document.cookie); assert(!/_fbp|_fbc/.test(ck) && /keep=1/.test(ck), product + ": revoke removes only _fbp/_fbc (" + ck + ")");
  await ctx.close(); console.log("ok -", product, "accept/events/revoke"); n++;
}
await browser.close(); srv.close(); console.log(`\nsystems-meta browser: ${n} groups ok`);
