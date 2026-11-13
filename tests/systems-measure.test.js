/* Aggregated, cookie-less measurement of sistemas.lucksrei.com (systems-worker/measure.mjs + the client in systems/assets/js/systems.js).
 * Simulated D1 and requests only: nothing reaches Cloudflare or a real analytics property. Run: node tests/systems-measure.test.js */
"use strict";
var fs = require("fs"), path = require("path"), assert = require("assert");
var root = path.join(__dirname, "..");

(async function () {
  var M = await import("../systems-worker/handler.mjs");
  var E = (await import("../systems-worker/measure.mjs")).default;
  assert.deepStrictEqual(Object.keys(await import("../systems-worker/measure.mjs")), ["default"], "entry module exports only the handler (workerd rejects other exports)");
  var ORIGIN = "https://sistemas.lucksrei.com";
  var BROWSER = { origin: ORIGIN, "user-agent": "Mozilla/5.0 (Linux; Android 14) Chrome/130 Mobile", "cf-connecting-ip": "203.0.113.9" };
  function fakeDb(fail) {
    var db = { binds: [], sql: [] };
    db.prepare = function (sql) { return { bind: function () { db.binds.push([].slice.call(arguments)); db.sql.push(sql); return this; }, run: async function () { if (fail) throw new Error("D1 down"); return {}; } }; };
    return db;
  }
  function post(body, headers, cf) {
    var r = new Request(ORIGIN + "/m", { method: "POST", headers: Object.assign({}, BROWSER, headers || {}), body: typeof body === "string" ? body : JSON.stringify(body) });
    if (cf) Object.defineProperty(r, "cf", { value: cf });
    return r;
  }
  var NOW = new Date("2026-11-12T14:35:10Z");
  async function run(req, env) { return M.handleMeasure(req, env, NOW); }
  var ok = { e: "pv", p: "beard", s: "meta", m: "paid", c: "bd-teste1", k: "preco", r: "facebook", d: 0 };

  // 1. a valid page load is counted once, in the right hour, with allow-listed dimensions only
  var db = fakeDb(); var res = await run(post(ok), { DB: db });
  assert.strictEqual(res.status, 204); assert.strictEqual(res.headers.get("x-lx-measure"), "stored");
  assert.deepStrictEqual(db.binds[0], ["2026-11-12T14", "pv", "beard", "meta", "paid", "bd-teste1", "preco", "facebook", 0]);
  assert(/ON CONFLICT[\s\S]*n = n \+ 1/.test(db.sql[0]), "upsert counter, no row per visit");

  // 2. no cookie, no identifier in the answer; never cacheable
  assert(!res.headers.get("set-cookie") && res.headers.get("cache-control") === "no-store");

  // 3. no UTM at all -> "none"; checkout carries the plan; click ids and any extra field are ignored (never stored)
  db = fakeDb();
  await run(post({ e: "checkout", p: "beard", d: 90, gclid: "G123", fbclid: "F456", email: "a@b.c", url: "https://x/?id=1", ua: "secret" }), { DB: db });
  assert.deepStrictEqual(db.binds[0], ["2026-11-12T14", "checkout", "beard", "none", "none", "none", "none", "none", 90]);
  assert(!JSON.stringify(db.binds).match(/G123|F456|a@b|secret|x\//), "nothing from the body outside the allow-lists is stored");

  // 4. unknown / hostile values collapse into "other"; days outside the plans become 0; days only count on checkout
  db = fakeDb();
  await run(post({ e: "pv", p: "beard", s: "<script>", m: "x", c: "joao.silva", k: "../../etc", r: "https://evil/", d: 30 }), { DB: db });
  assert.deepStrictEqual(db.binds[0].slice(3), ["other", "other", "other", "other", "none", 0]);
  db = fakeDb(); await run(post({ e: "checkout", p: "beard", d: 31 }), { DB: db }); assert.strictEqual(db.binds[0][8], 0);

  // 5. cardinality is bounded no matter what a caller sends
  db = fakeDb(); var seen = {}, r = 7;
  var rnd = function () { r = (r * 16807) % 2147483647; return r; };
  for (var i = 0; i < 600; i++) {
    await run(post({ e: ["pv", "plans", "checkout", "zz"][rnd() % 4], p: ["beard", "x"][rnd() % 2], s: "s" + rnd(), m: "m" + rnd(), c: "c" + rnd(), k: "k" + rnd(), r: "r" + rnd(), d: rnd() }), { DB: db });
  }
  db.binds.forEach(function (b) { seen[b.slice(1).join("|")] = 1; });
  assert(Object.keys(seen).length <= 2 * 2 * 2 * 2 * 2 * 2 * 2 * 2, "bounded rows: " + Object.keys(seen).length);
  assert(!db.binds.some(function (b) { return /^(s|m|c|k|r)\d/.test(b.slice(3).join(" ")); }), "random strings never reach the table");

  // 6. things that must be ignored (204, nothing written): other origin, opt-out signals, bots, datacenters, big or malformed bodies, invalid events
  async function ignored(name, req, env) {
    var d = (env && env.DB) || fakeDb(); var x = await run(req, Object.assign({ DB: d }, env || {}));
    assert.strictEqual(x.status, 204, name); assert.strictEqual(d.binds.length, 0, name + " must not write");
    return x.headers.get("x-lx-measure");
  }
  assert.strictEqual(await ignored("origin", post(ok, { origin: "https://evil.example" })), "origin");
  assert.strictEqual(await ignored("no origin", post(ok, { origin: "" })), "origin");
  assert.strictEqual(await ignored("gpc", post(ok, { "sec-gpc": "1" })), "optout");
  assert.strictEqual(await ignored("dnt", post(ok, { dnt: "1" })), "optout");
  assert.strictEqual(await ignored("bot", post(ok, { "user-agent": "Googlebot/2.1" })), "bot");
  assert.strictEqual(await ignored("fb crawler", post(ok, { "user-agent": "facebookexternalhit/1.1" })), "bot");
  assert.strictEqual(await ignored("headless", post(ok, { "user-agent": "Mozilla/5.0 HeadlessChrome/130" })), "bot");
  assert.strictEqual(await ignored("datacenter", post(ok, {}, { asn: 16509, asOrganization: "Amazon.com" })), "datacenter");
  assert.strictEqual(await ignored("size", post(JSON.stringify(Object.assign({ pad: "x".repeat(500) }, ok)))), "size");
  assert.strictEqual(await ignored("json", post("{not json")), "invalid");
  assert.strictEqual(await ignored("event", post({ e: "purchase", p: "beard" })), "invalid");
  assert.strictEqual(await ignored("product", post({ e: "pv", p: "outro" })), "invalid");
  assert.strictEqual(await ignored("limit", post(ok), { RL_MEASURE: { limit: async function () { return { success: false }; } } }), "limit");

  // 6b. body limit is enforced on the STREAM: no/wrong Content-Length, chunked big bodies, never read past the cap, nothing written
  async function streamed(chunks, headers) {
    var pulled = 0, i = 0, d = fakeDb();
    var body = new ReadableStream({ pull: function (c) { if (i >= chunks.length) return c.close(); pulled += chunks[i].length; c.enqueue(new TextEncoder().encode(chunks[i++])); } });
    var req = new Request(ORIGIN + "/m", { method: "POST", headers: Object.assign({}, BROWSER, headers || {}), body: body, duplex: "half" });
    var x = await run(req, { DB: d });
    return { why: x.headers.get("x-lx-measure"), writes: d.binds.length, pulled: pulled };
  }
  var big = await streamed(new Array(5000).fill("x".repeat(1000)));
  assert.strictEqual(big.why, "size"); assert.strictEqual(big.writes, 0); assert(big.pulled < 50000, "stopped reading early: " + big.pulled);
  assert.strictEqual((await streamed(["{", "x".repeat(450), "}"], { "content-length": "10" })).why, "size", "lying small Content-Length");
  assert.strictEqual((await streamed(["x".repeat(100)], { "content-length": "999999" })).why, "size", "huge declared length rejected before reading");
  var chunked = await streamed([JSON.stringify(ok).slice(0, 20), JSON.stringify(ok).slice(20)]);
  assert.strictEqual(chunked.why, "stored", "small chunked body still counts");
  assert.strictEqual((await ignored("empty", post(""))), "invalid");
  assert.strictEqual((await ignored("array", post("[1,2]"))), "invalid");
  assert.strictEqual((await ignored("null", post("null"))), "invalid");
  assert.strictEqual((await ignored("bad utf8", new Request(ORIGIN + "/m", { method: "POST", headers: BROWSER, body: new Uint8Array([0xff, 0xfe, 0x7b]) }))), "invalid");

  // 6c. retention: rows older than 399 days are removed (daily cron, so nothing outlives 400), newer ones kept (SQL cutoff computed from the hour string)
  var dels = []; var rdb = { prepare: function (sql) { return { bind: function () { dels.push([sql].concat([].slice.call(arguments))); return this; }, run: async function () { return { meta: { changes: 3 } }; } }; } };
  assert.strictEqual(await M.purgeOld({ DB: rdb }, new Date("2026-11-12T03:17:00Z")), 3);
  assert(/DELETE FROM lx_hits WHERE hour < \?1/.test(dels[0][0]));
  assert.strictEqual(dels[0][1], "2025-10-09T03", "cutoff = now - 399 days (daily cron: oldest surviving row <= 400 days)");
  var sched = []; await E.scheduled({ scheduledTime: Date.parse("2026-11-12T03:17:00Z") }, { DB: rdb }, { waitUntil: function (p) { sched.push(p); } }); await Promise.all(sched);
  assert.strictEqual(dels.length, 2, "scheduled() runs the purge");

  // 7. a real mobile network (not a datacenter) still counts; GET is refused; a rate-limiter failure never blocks counting
  db = fakeDb();
  await run(post(ok, {}, { asn: 28573, asOrganization: "CLARO S.A." }), { DB: db, RL_MEASURE: { limit: async function () { throw new Error("rl down"); } } });
  assert.strictEqual(db.binds.length, 1);
  assert.strictEqual((await E.fetch(new Request(ORIGIN + "/m"), { DB: fakeDb() })).status, 405);

  // 8. fail-safe: D1 down, no D1 binding -> still 204 and no exception
  assert.strictEqual((await run(post(ok), { DB: fakeDb(true) })).status, 204);
  assert.strictEqual((await run(post(ok), {})).headers.get("x-lx-measure"), "error");

  // 9. other paths fall through to the assets binding (the Worker never replaces a page)
  var asset = await E.fetch(new Request(ORIGIN + "/beard/"), { ASSETS: { fetch: async function () { return new Response("page"); } } });
  assert.strictEqual(await asset.text(), "page");

  // 10. client contract: fetch without credentials, no cookie/storage added, GPC/DNT respected, fires on load / plans / checkout, no consent dependency
  var js = fs.readFileSync(path.join(root, "systems/assets/js/systems.js"), "utf8");
  var m = js.slice(js.indexOf("// ---- aggregated"), js.indexOf("// ---- tag loading"));
  assert(/credentials: "omit"/.test(m) && /keepalive: true/.test(m) && /"\/m"/.test(m), "client posts /m without credentials");
  assert(!/localStorage|sessionStorage|document\.cookie|sendBeacon/.test(m), "measurement writes no storage or cookie");
  assert(/globalPrivacyControl/.test(m) && /doNotTrack/.test(m), "GPC/DNT respected");
  assert(!/stored\(\)/.test(m), "does not depend on the banner choice");
  ['measure("pv")', 'measure("plans")', 'measure("checkout"'].forEach(function (c) { assert(js.indexOf(c) > 0, c); });
  assert(!/gclid|fbclid/.test(m.replace(/\/\/.*$/gm, "")), "click ids are not read by the measurement");
  console.log("systems-measure: ok");
})().catch(function (e) { console.error(e); process.exit(1); });
