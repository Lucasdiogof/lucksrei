/* Browser check that ad context reaches the Hotmart checkout links (sck + utm_*), with or without consent.
 *   npm i --no-save playwright && npx playwright install chromium && node tests/browser/systems-attribution.mjs
 * Serves ./systems locally; every Google/Meta/Hotmart request is aborted, so nothing reaches production tools. */
import http from "node:http"; import fs from "node:fs"; import path from "node:path"; import assert from "node:assert";
import { chromium } from "playwright";

const root = path.resolve(path.join(import.meta.dirname, "..", "..", "systems"));
const csp = /Content-Security-Policy: (.*)/.exec(fs.readFileSync(path.join(root, "_headers"), "utf8"))[1].trim();
const types = { ".html": "text/html; charset=utf-8", ".js": "text/javascript", ".css": "text/css" };
const srv = http.createServer((req, res) => {
  let p = decodeURIComponent(new URL(req.url, "http://x").pathname); if (p.endsWith("/")) p += "index.html";
  const f = path.join(root, p);
  if (!f.startsWith(root) || !fs.existsSync(f)) { res.writeHead(404); return res.end("nf"); }
  res.writeHead(200, { "Content-Type": types[path.extname(f)] || "application/octet-stream", "Content-Security-Policy": csp }); res.end(fs.readFileSync(f));
}).listen(0);
const base = `http://localhost:${srv.address().port}`;
const browser = await chromium.launch({ channel: process.env.PW_CHANNEL }); // PW_CHANNEL=chrome uses the installed Chrome
const cases = [
  ["beard", "M108332227C", "?utm_source=meta&utm_medium=paid&utm_campaign=bd-teste1&utm_content=comissao", "b|meta|bd-teste1|comissao"],
  ["beard", "M108332227C", "?utm_source=google&utm_medium=cpc&utm_campaign=bd-search1&utm_content=preco&gclid=TEST123", "b|google|bd-search1|preco"],
  ["stockport", "Y108188423I", "?utm_source=meta&utm_medium=paid&utm_campaign=sp-teste1&utm_content=comissao", "s|meta|sp-teste1|comissao"],
  ["stockport", "Y108188423I", "?utm_source=google&utm_medium=cpc&utm_campaign=sp-search1&utm_content=estoque&gclid=TEST123", "s|google|sp-search1|estoque"],
  ["beard", "M108332227C", "?utm_source=google&utm_medium=cpc&utm_campaign=bd-search1-longa&utm_content=comissao_v2&fbclid=x", null],
];
let n = 0;
for (const choice of ["deny", "accept"]) for (const [product, code, qs, want] of cases) {
  const ctx = await browser.newContext(); const page = await ctx.newPage(); const ext = [];
  await page.route((u) => !u.toString().startsWith(base), (r) => { ext.push(r.request().url()); r.abort(); });
  await page.goto(base + "/" + product + "/" + qs); await page.waitForLoadState("networkidle");
  assert.strictEqual(ext.length, 0, "no external request before consent");
  await page.locator(`#consent [data-consent=${choice}]`).click(); await page.waitForTimeout(200);
  const hrefs = await page.$$eval('a[data-track="checkout_link_click"]', (as) => as.map((a) => a.href));
  assert.strictEqual(hrefs.length, 4, product + ": 4 plan links");
  const q = new URLSearchParams(qs);
  for (const h of hrefs) {
    const u = new URL(h), sck = u.searchParams.get("sck");
    assert(u.pathname === "/" + code && u.searchParams.get("off"), "checkout code and offer kept: " + h);
    if (want) assert.strictEqual(sck, want, "sck " + h);
    assert(sck.length <= 30 && !sck.includes("_") && sck.startsWith(product[0] + "|"), "sck within Hotmart limits: " + sck);
    for (const k of ["utm_source", "utm_medium", "utm_campaign"]) assert.strictEqual(u.searchParams.get(k), q.get(k).replace(/[^A-Za-z0-9.-]/g, "").slice(0, 20), k);
    assert.strictEqual(u.searchParams.get("utm_content"), q.get("utm_content").replace(/[^A-Za-z0-9.-]/g, ""), "utm_content");
    for (const k of ["gclid", "fbclid", "src"]) assert.strictEqual(u.searchParams.get(k), null, k + " not forwarded");
  }
  if (choice === "deny") assert.strictEqual(ext.length, 0, "decline -> zero external requests");
  else assert(ext.every((x) => /googletagmanager\.com|facebook\.net|google-analytics\.com|facebook\.com/.test(new URL(x).hostname)), "accept -> only configured tools: " + ext.join(","));
  n++; console.log("ok -", choice, product, hrefs[0].split("?")[1]); await ctx.close();
}
await browser.close(); srv.close();
console.log(`systems-attribution: ${n} checks ok`);
