/* Browser check of the aggregated measurement (POST /m): works with consent undecided / declined / accepted, sends no cookie and stores nothing,
 * respects Global Privacy Control, never blocks the page or the Hotmart links when the endpoint fails.
 *   npm i --no-save playwright && node tests/browser/systems-measure.mjs      (PW_CHANNEL=chrome uses the installed Chrome)
 * Serves ./systems locally and answers /m with the real handler on a fake D1; every non-local request (Google, Meta, Hotmart) is aborted. */
import http from "node:http"; import fs from "node:fs"; import path from "node:path"; import assert from "node:assert";
import { chromium } from "playwright";
import { handleMeasure } from "../../systems-worker/handler.mjs";

const root = path.resolve(path.join(import.meta.dirname, "..", "..", "systems"));
const csp = /Content-Security-Policy: (.*)/.exec(fs.readFileSync(path.join(root, "_headers"), "utf8"))[1].trim();
const types = { ".html": "text/html; charset=utf-8", ".js": "text/javascript", ".css": "text/css" };
const rows = []; const seenCookieHeaders = []; let mode = "ok";
const fakeDb = { prepare() { return { bind(...a) { this.a = a; return this; }, async run() { rows.push(this.a); return {}; } }; } };
const srv = http.createServer(async (req, res) => {
  const url = new URL(req.url, "http://x"); let p = decodeURIComponent(url.pathname);
  if (p === "/m") {
    const chunks = []; for await (const c of req) chunks.push(c);
    seenCookieHeaders.push(req.headers.cookie || "");
    if (mode === "500") { res.writeHead(500); return res.end("boom"); }
    if (mode === "hang") return; // never answers
    const r = await handleMeasure(new Request("https://sistemas.lucksrei.com/m", { method: req.method, headers: { origin: "https://sistemas.lucksrei.com", "user-agent": req.headers["user-agent"] || "", "sec-gpc": req.headers["sec-gpc"] || "" }, body: req.method === "POST" ? Buffer.concat(chunks) : undefined }), { DB: fakeDb });
    res.writeHead(r.status, Object.fromEntries(r.headers)); return res.end();
  }
  if (p.endsWith("/")) p += "index.html";
  const f = path.join(root, p);
  if (!f.startsWith(root) || !fs.existsSync(f)) { res.writeHead(404); return res.end("nf"); }
  res.writeHead(200, { "Content-Type": types[path.extname(f)] || "application/octet-stream", "Content-Security-Policy": csp }); res.end(fs.readFileSync(f));
}).listen(0);
const base = `http://localhost:${srv.address().port}`;
const browser = await chromium.launch({ channel: process.env.PW_CHANNEL });
const UTM = "?utm_source=meta&utm_medium=paid&utm_campaign=bd-teste1&utm_content=preco&fbclid=ABC&gclid=XYZ";
let n = 0; const ok = (m) => console.log("ok -", m, ++n && "");

async function visit(product, qs, { choice, gpc, preCookie } = {}) {
  rows.length = 0; seenCookieHeaders.length = 0;
  const ctx = await browser.newContext({ extraHTTPHeaders: gpc ? { "Sec-GPC": "1" } : {}, userAgent: "Mozilla/5.0 (Linux; Android 14) Chrome/130 Mobile Safari/537.36" });
  if (gpc) await ctx.addInitScript(() => Object.defineProperty(navigator, "globalPrivacyControl", { value: true }));
  if (preCookie) await ctx.addCookies([{ name: "_ga", value: "GA1.1.123.456", url: base }]);
  const page = await ctx.newPage(); const ext = [];
  await page.route((u) => !u.toString().startsWith(base), (r) => { ext.push(r.request().url()); r.abort(); });
  await page.goto(base + "/" + product + "/" + (qs || ""), { waitUntil: "load" }); await page.waitForTimeout(500);
  if (choice) await page.locator(`#consent [data-consent=${choice}]`).click();
  await page.locator("#planos").scrollIntoViewIfNeeded(); await page.waitForTimeout(400);
  const hrefs = await page.$$eval('a[data-track="checkout_link_click"]', (as) => as.map((a) => a.href));
  await page.evaluate(() => document.addEventListener("click", (e) => e.preventDefault(), true)); // stay on the page: the Hotmart click is measured, not followed
  if (hrefs.length) await page.locator('a[data-track="checkout_link_click"]').nth(1).dispatchEvent("click", { bubbles: true, cancelable: true }).catch(() => {});
  await page.waitForTimeout(400);
  const storage = await page.evaluate(() => ({ ls: Object.keys(localStorage), ss: Object.keys(sessionStorage), cookie: document.cookie }));
  await ctx.close();
  return { rows: rows.slice(), cookies: seenCookieHeaders.slice(), ext, storage, hrefs };
}
const events = (r) => r.rows.map((x) => x[1]);

for (const choice of [undefined, "deny", "accept"]) {
  const r = await visit("beard", UTM, { choice, preCookie: true });
  assert.deepStrictEqual(events(r), ["pv", "plans", "checkout"], `${choice}: pv + plans + checkout counted`);
  r.rows.forEach((x) => assert.deepStrictEqual(x.slice(2, 8), ["beard", "meta", "paid", "bd-teste1", "preco", "none"], "allow-listed dimensions, no click ids"));
  assert.strictEqual(r.rows[2][8], 90, "checkout carries the plan days");
  assert(!JSON.stringify(r.rows).match(/ABC|XYZ/), "fbclid/gclid never stored");
  assert(r.cookies.length === 3 && r.cookies.every((c) => c === ""), `${choice}: /m requests carry no cookie even with _ga present`);
  if (!choice) assert.strictEqual(r.ext.length, 0, "undecided: still nothing sent to third parties");
  if (choice === "deny") { assert.strictEqual(r.ext.length, 0, "declined: nothing sent to third parties"); assert.deepStrictEqual(r.storage.ls, ["lx_consent"], "only the existing consent choice is stored"); }
  if (!choice) assert.deepStrictEqual(r.storage.ls, [], "undecided: nothing stored in the browser");
  ok(`beard ${choice || "undecided"}: counted without cookie/storage, third parties untouched`);
}

let r = await visit("stockport", "", { choice: "deny" });
assert.deepStrictEqual(r.rows.map((x) => x.slice(1, 8)).filter((x) => x[0] !== "plans" && x[0] !== "checkout"), [["pv", "stockport", "none", "none", "none", "none", "none"]], "no UTM -> none");
ok("stockport without UTM counted as none");

r = await visit("beard", UTM, { gpc: true });
assert.strictEqual(r.rows.length, 0, "Global Privacy Control: nothing counted");
assert.strictEqual(r.cookies.length, 0, "Global Privacy Control: no request at all");
ok("GPC respected");

for (const m of ["500", "hang"]) {
  mode = m;
  const rr = await visit("beard", UTM, { choice: "accept" });
  assert.strictEqual(rr.hrefs.length, 4, "4 plan links still there"); rr.hrefs.forEach((h) => { const u = new URL(h); assert(u.hostname === "pay.hotmart.com" && u.searchParams.get("off") && /^b\|meta\|bd-teste1\|preco$/.test(u.searchParams.get("sck")), h); });
  ok(`/m ${m}: page and Hotmart links intact`);
}
mode = "ok";
await browser.close(); srv.close();
console.log(`\nsystems-measure browser: ${n} groups ok`);
