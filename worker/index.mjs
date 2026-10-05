/* lucksrei-site — Worker de estatísticas agregadas de visitas por país.
 *
 * Só /api/* passa por aqui (run_worker_first em wrangler.jsonc); o resto é servido direto pelos assets.
 *
 *   POST /api/visit     conta UMA visita no mês/país atuais. 204 sempre (nunca quebra a página).
 *   GET  /api/visitors  agregados dos últimos 12 meses (cache de 5 min).
 *   GET  /api/whoami    { country } do próprio visitante, vindo só de request.cf.country (sem cache).
 *
 * Métrica: "visitas" = no máximo UMA contagem por sessão de aba. Quem decide é o cliente
 * (sessionStorage; o servidor nunca vê esse marcador). Não é visitante único.
 *
 * Privacidade: só se grava (mês UTC, país, contador). O país vem EXCLUSIVAMENTE de request.cf.country;
 * nada enviado pelo cliente é lido. IP, user-agent, headers, cidade, região e coordenadas nunca são
 * gravados nem devolvidos. O user-agent é testado em memória (filtro de robôs) e descartado.
 */

const VISITORS_TTL = 300; // s
const WINDOW_MONTHS = 12;
const KEEP_MONTHS = 13;
const UNKNOWN = "XX"; // sem país, Tor ("T1") ou código inválido: entra no total, fora de mapa/ranking/contagem de países
const BOT_UA = /bot|crawl|spider|slurp|preview|facebookexternalhit|headless|phantom|lighthouse|pagespeed|pingdom|uptime|monitor|curl|wget|python-requests|httpclient|axios|node-fetch|go-http|java\//i;

const BASE_HEADERS = {
  "x-content-type-options": "nosniff",
  "referrer-policy": "no-referrer",
};

export function normalizeCountry(raw) {
  if (typeof raw !== "string") return UNKNOWN;
  const c = raw.trim().toUpperCase();
  if (!/^[A-Z]{2}$/.test(c)) return UNKNOWN;
  if (c === "T1" || c === "XX" || c === "ZZ") return UNKNOWN;
  return c;
}

export function monthKey(date, offsetMonths = 0) {
  const d = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + offsetMonths, 1));
  return d.getUTCFullYear() + "-" + String(d.getUTCMonth() + 1).padStart(2, "0");
}

// A contagem só vale para chamadas do próprio site. Origin é filtro de ruído, não segurança forte.
export function isSameOriginBrowserCall(request) {
  const origin = request.headers.get("origin");
  if (!origin) return false;
  try {
    return origin === new URL(request.url).origin;
  } catch (e) {
    return false;
  }
}

export function looksLikeBot(request) {
  return BOT_UA.test(request.headers.get("user-agent") || "");
}

function json(body, status, cacheControl) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...BASE_HEADERS, "content-type": "application/json; charset=utf-8", "cache-control": cacheControl },
  });
}

async function recordVisit(env, country, now) {
  const ym = monthKey(now);
  const ts = Math.floor(now.getTime() / 1000);
  await env.DB.prepare(
    "INSERT INTO visits_monthly (ym, country, n, updated_at) VALUES (?1, ?2, 1, ?3) " +
      "ON CONFLICT(ym, country) DO UPDATE SET n = n + 1, updated_at = excluded.updated_at"
  )
    .bind(ym, country, ts)
    .run();
}

async function purgeOld(env, now) {
  await env.DB.prepare("DELETE FROM visits_monthly WHERE ym < ?1").bind(monthKey(now, -(KEEP_MONTHS - 1))).run();
}

export async function readVisitors(env, now) {
  const from = monthKey(now, -(WINDOW_MONTHS - 1));
  const { results } = await env.DB.prepare(
    "SELECT country, SUM(n) AS n, MAX(updated_at) AS u, MIN(ym) AS since FROM visits_monthly WHERE ym >= ?1 GROUP BY country"
  )
    .bind(from)
    .all();
  let total = 0;
  let updated = 0;
  let since = null;
  const countries = [];
  for (const r of results || []) {
    total += r.n;
    if (r.u > updated) updated = r.u;
    if (since === null || r.since < since) since = r.since;
    if (r.country !== UNKNOWN && r.n > 0) countries.push({ code: r.country, visits: r.n });
  }
  countries.sort((a, b) => b.visits - a.visits || (a.code < b.code ? -1 : 1));
  return {
    total_visits: total,
    countries_count: countries.length,
    updated_at: updated ? new Date(updated * 1000).toISOString() : null,
    since,
    window_months: WINDOW_MONTHS,
    countries,
  };
}

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const path = url.pathname.replace(/\/+$/, "") || "/";

    if (path === "/api/visit") {
      if (request.method !== "POST") return new Response(null, { status: 405, headers: { ...BASE_HEADERS, allow: "POST" } });
      const none = new Response(null, { status: 204, headers: { ...BASE_HEADERS, "cache-control": "no-store" } });
      if (!isSameOriginBrowserCall(request) || looksLikeBot(request)) return none;
      const now = new Date();
      try {
        await recordVisit(env, normalizeCountry(request.cf && request.cf.country), now);
        if (Math.random() < 0.02) ctx.waitUntil(purgeOld(env, now).catch(() => {}));
      } catch (e) {
        /* falha de banco nunca afeta a página */
      }
      return none;
    }

    if (path === "/api/whoami") {
      if (request.method !== "GET") return new Response(null, { status: 405, headers: { ...BASE_HEADERS, allow: "GET" } });
      const c = normalizeCountry(request.cf && request.cf.country);
      return json({ country: c === UNKNOWN ? null : c }, 200, "no-store");
    }

    if (path === "/api/visitors") {
      if (request.method !== "GET") return new Response(null, { status: 405, headers: { ...BASE_HEADERS, allow: "GET" } });
      const cache = typeof caches !== "undefined" ? caches.default : null;
      const key = new Request(url.origin + "/api/visitors");
      if (cache) {
        const hit = await cache.match(key);
        if (hit) return hit;
      }
      try {
        const body = await readVisitors(env, new Date());
        const res = json(body, 200, `public, max-age=${VISITORS_TTL}, s-maxage=${VISITORS_TTL}`);
        if (cache) ctx.waitUntil(cache.put(key, res.clone()));
        return res;
      } catch (e) {
        return json({ error: "unavailable" }, 503, "no-store");
      }
    }

    if (path.startsWith("/api/")) return json({ error: "not_found" }, 404, "no-store");
    return env.ASSETS.fetch(request);
  },
};
