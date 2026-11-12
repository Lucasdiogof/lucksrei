/* Logic of the /m counter (kept apart from measure.mjs: a Worker entry module must export only its handler, workerd rejects other named exports).
 * lucksrei-systems: aggregated, cookie-less measurement of the sales pages.
 *
 * The Worker is still STATIC for every page: only POST /m runs code (assets.run_worker_first = ["/m"]); pages, images and JS
 * are served by the assets layer, which is free and unlimited. Nothing here can slow or break a page or the checkout.
 *
 *   POST /m  body {"e":"pv|plans|checkout","p":"beard|stockport","s":utm_source,"m":utm_medium,"c":utm_campaign,"k":utm_content,"r":ref class,"d":days}
 *            always 204. Counts one event in (UTC hour x event x product x allow-listed dimensions) in D1 table lx_hits.
 *
 * It measures what the ad platforms cannot tell us and what GA4/Pixel miss without consent: that the page LOADED in a browser that ran our
 * script, with which campaign, and that a checkout link was clicked. It counts loads and clicks, NOT visitors (no id exists to deduplicate).
 * It does not read consent, does not touch GA4 or the Meta Pixel and never re-enables a third-party tag.
 *
 * Privacy: IP, user-agent, cookies, headers, gclid/fbclid, referrer URL and any unknown UTM value are NEVER stored. The IP only feeds
 * the rate limiter as a hash that lives in memory (worker/security.mjs). Every dimension is allow-listed (unknown -> "other", empty -> "none"),
 * so a hostile caller cannot create new rows or smuggle text into the table. Global Privacy Control / Do Not Track = nothing counted.
 * Fail-safe: any error (D1 down, bad body) still answers 204; the client uses fetch keepalive and ignores the answer. */

import { API_HEADERS, overLimit } from "../worker/security.mjs";

export const ALLOWED_ORIGIN = "https://sistemas.lucksrei.com";
const EVENTS = new Set(["pv", "plans", "checkout"]);
const PRODUCTS = new Set(["beard", "stockport"]);
const SOURCES = new Set(["meta", "google", "teste"]);
const MEDIUMS = new Set(["paid", "cpc"]);
// shortcut: campaign and ad-angle names are an allow-list edited here; unknown ones show up as "other". Add new campaigns to this list on launch.
const CAMPAIGNS = new Set(["bd-teste1", "sp-teste1", "bd-search1", "sp-search1"]);
const CONTENTS = new Set(["comissao", "preco", "estoque", "sistema"]);
const REFS = new Set(["facebook", "google", "other"]);
const DAYS = new Set([30, 90, 180, 365]);
const MAX_BODY = 400;
// Same filters as lucksrei-site /api/visit (worker/index.mjs), copied on purpose: importing that file would bundle the whole site Worker here.
const BOT_UA = /bot|crawl|claude|anthropic|chatgpt|openai|perplexity|spider|slurp|preview|facebookexternalhit|headless|phantom|lighthouse|pagespeed|pingdom|uptime|monitor|curl|wget|python-requests|httpclient|axios|node-fetch|go-http|java\//i;
const DATACENTER_ASNS = new Set([16509, 14618, 8987, 38895, 15169, 396982, 19527, 8075, 8068, 8069, 31898, 14061, 63949, 20473, 16276, 24940, 213230, 51167, 12876, 36351, 60781, 28753, 45102, 37963, 132203, 45090, 136907]);
const DATACENTER_ORG = /\b(amazon|aws|google(?! fiber)|microsoft|azure|oracle|digitalocean|linode|vultr|choopa|ovh|hetzner|contabo|scaleway|ibm cloud|softlayer|leaseweb|alibaba|tencent|huawei cloud|anthropic|openai)\b/i;

const pick = (v, allowed) => { const s = typeof v === "string" ? v.slice(0, 20) : ""; return !s ? "none" : allowed.has(s) ? s : "other"; };

export function normalize(b) {
  if (!b || typeof b !== "object" || !EVENTS.has(b.e) || !PRODUCTS.has(b.p)) return null;
  const days = b.e === "checkout" && DAYS.has(Number(b.d)) ? Number(b.d) : 0;
  const source = pick(b.s, SOURCES);
  return {
    event: b.e, product: b.p, source,
    medium: pick(b.m, MEDIUMS), campaign: pick(b.c, CAMPAIGNS), content: pick(b.k, CONTENTS),
    ref: typeof b.r === "string" && REFS.has(b.r) ? b.r : "none", days,
  };
}

// Reads at most MAX_BODY bytes: stops pulling the stream as soon as the cap is passed, whatever Content-Length says (or omits). null = too big.
async function readCapped(request) {
  const declared = Number(request.headers.get("content-length"));
  if (declared > MAX_BODY) return null;
  if (!request.body) return "";
  const reader = request.body.getReader(); const parts = []; let total = 0;
  for (;;) {
    const { done: end, value } = await reader.read();
    if (end) break;
    total += value.byteLength;
    if (total > MAX_BODY) { try { await reader.cancel(); } catch (e) { /* already closed */ } return null; }
    parts.push(value);
  }
  const all = new Uint8Array(total); let o = 0; for (const p of parts) { all.set(p, o); o += p.byteLength; }
  return new TextDecoder().decode(all);
}

export const RETENTION_DAYS = 400;
// Cron Trigger (free plan: 5 per account, we use 1): deletes counters older than RETENTION_DAYS. Returns the number of rows removed.
export async function purgeOld(env, now = new Date()) {
  const cutoff = hourUtc(new Date(now.getTime() - RETENTION_DAYS * 86400000));
  const r = await env.DB.prepare("DELETE FROM lx_hits WHERE hour < ?1").bind(cutoff).run();
  return r && r.meta ? r.meta.changes : 0;
}

const hourUtc = (d) => d.toISOString().slice(0, 13);

function done(why) { return new Response(null, { status: 204, headers: { ...API_HEADERS, "cache-control": "no-store", "x-lx-measure": why } }); }

export async function handleMeasure(request, env, now = new Date()) {
  try {
    if (request.method !== "POST") return new Response(null, { status: 405, headers: { ...API_HEADERS, allow: "POST", "cache-control": "no-store" } });
    if (request.headers.get("origin") !== (env.ALLOWED_ORIGIN || ALLOWED_ORIGIN)) return done("origin");
    if (request.headers.get("sec-gpc") === "1" || request.headers.get("dnt") === "1") return done("optout");
    if (BOT_UA.test(request.headers.get("user-agent") || "")) return done("bot");
    const cf = request.cf || {};
    if (DATACENTER_ASNS.has(Number(cf.asn)) || DATACENTER_ORG.test(String(cf.asOrganization || ""))) return done("datacenter");
    if (await overLimit(env, "RL_MEASURE", request)) return done("limit");
    const text = await readCapped(request);
    if (text === null) return done("size");
    let row; try { row = normalize(JSON.parse(text)); } catch (e) { row = null; }
    if (!row) return done("invalid");
    await env.DB.prepare(
      "INSERT INTO lx_hits (hour, event, product, source, medium, campaign, content, ref, days, n) VALUES (?1,?2,?3,?4,?5,?6,?7,?8,?9,1) " +
      "ON CONFLICT(hour, event, product, source, medium, campaign, content, ref, days) DO UPDATE SET n = n + 1"
    ).bind(hourUtc(now), row.event, row.product, row.source, row.medium, row.campaign, row.content, row.ref, row.days).run();
    return done("stored");
  } catch (e) {
    return done("error");
  }
}
