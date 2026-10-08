/* lucksrei-site — Worker de estatísticas agregadas de visitas por país e por estado/região.
 *
 * Só /api/* passa por aqui (run_worker_first em wrangler.jsonc); o resto é servido direto pelos assets.
 *
 *   POST /api/visit     conta UMA visita no mês/país (e mês/país/região) atuais. 204 sempre (nunca quebra a página).
 *   GET  /api/visitors  agregados dos últimos 12 meses, por país e por região dentro de cada país (cache de 5 min).
 *   GET  /api/whoami    { country, region, region_name } do próprio visitante, vindos só de request.cf (sem cache).
 *
 * Métrica: "visitas" = no máximo UMA contagem por sessão de aba. Quem decide é o cliente
 * (sessionStorage; o servidor nunca vê esse marcador). Não é visitante único.
 *
 * Privacidade: só se grava (mês UTC, país, contador) e (mês UTC, país, região, nome da região, contador).
 * País e região vêm EXCLUSIVAMENTE de request.cf (country, regionCode, region); nada enviado pelo cliente é lido.
 * Região = estado/província (subdivisão ISO 3166-2), nunca cidade. IP, user-agent, headers, cidade, CEP e
 * coordenadas nunca são gravados nem devolvidos. O user-agent é testado em memória (filtro de robôs) e descartado.
 * A rede de origem (request.cf.asn) também: se for de nuvem/hospedagem, a visita é ignorada; o ASN nunca é gravado.
 * A contagem por região é gravada à parte: se falhar, a contagem por país não é afetada.
 *
 * Cache:
 *   /api/visitors  cache de borda (caches.default) de ~5 min: "public, max-age=300, s-maxage=300".
 *                  No HIT a Cloudflare reescreve o max-age para 14400 (Browser Cache TTL da zona); o s-maxage fica.
 *                  Não afeta o site: visitors.js busca com cache: "no-cache" (revalida sempre e recebe o cache de 5 min).
 *                  Só quem abre o endpoint direto no navegador pode ver um JSON de até 4 h. Comportamento aceito.
 *   /api/whoami    no-store.
 *   /api/visit     no-store (também nas respostas de ruído/robô/nuvem).
 *
 * Rate limiting pode ser adicionado futuramente se houver abuso real.
 */

const VISITORS_TTL = 300; // s
const WINDOW_MONTHS = 12;
const KEEP_MONTHS = 13;
const UNKNOWN = "XX"; // sem país, Tor ("T1") ou código inválido: entra no total, fora de mapa/ranking/contagem de países
// Redes de nuvem e hospedagem (request.cf.asn). Navegadores automatizados — agentes de IA, scanners, testes
// com Playwright — rodam nelas com user-agent de Chrome comum e furam o BOT_UA; gente de verdade quase nunca.
// Ficam DE FORA de propósito: Cloudflare (13335, WARP), Akamai (20940, 16625) e Fastly (54113), que são saída
// do iCloud Private Relay e de VPNs de consumidor usadas por pessoas reais.
const DATACENTER_ASNS = new Set([
  16509, 14618, 8987, 38895, // Amazon AWS
  15169, 396982, 19527, // Google / Google Cloud
  8075, 8068, 8069, // Microsoft Azure
  31898, // Oracle Cloud
  32934, // Meta
  14061, // DigitalOcean
  63949, // Linode (Akamai Cloud)
  20473, // Vultr
  16276, // OVH
  24940, 213230, // Hetzner
  51167, // Contabo
  12876, // Scaleway
  36351, // IBM Cloud (SoftLayer)
  60781, 28753, // Leaseweb
  45102, 37963, // Alibaba Cloud
  132203, 45090, // Tencent Cloud
  136907, // Huawei Cloud
]);
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

// Parte da subdivisão ISO 3166-2 (request.cf.regionCode): 1–3 letras/dígitos. Ausente ou inválida → "XX".
export function normalizeRegion(raw) {
  if (typeof raw !== "string") return UNKNOWN;
  const r = raw.trim().toUpperCase();
  return /^[A-Z0-9]{1,3}$/.test(r) ? r : UNKNOWN;
}

// Nome da região vindo da Cloudflare (request.cf.region), só para exibição: sem caracteres de controle, até 80.
export function cleanRegionName(raw) {
  if (typeof raw !== "string") return "";
  return raw.replace(/[\u0000-\u001f\u007f<>]/g, "").replace(/\s+/g, " ").trim().slice(0, 80);
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

export function fromDatacenter(request) {
  const asn = Number((request.cf || {}).asn);
  return DATACENTER_ASNS.has(asn);
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

async function recordRegion(env, country, region, name, now) {
  const ym = monthKey(now);
  const ts = Math.floor(now.getTime() / 1000);
  await env.DB.prepare(
    "INSERT INTO visits_region_monthly (ym, country, region, name, n, updated_at) VALUES (?1, ?2, ?3, ?4, 1, ?5) " +
      "ON CONFLICT(ym, country, region) DO UPDATE SET n = n + 1, updated_at = excluded.updated_at, " +
      "name = CASE WHEN excluded.name <> '' THEN excluded.name ELSE name END"
  )
    .bind(ym, country, region, name, ts)
    .run();
}

async function purgeOld(env, now) {
  const before = monthKey(now, -(KEEP_MONTHS - 1));
  await env.DB.prepare("DELETE FROM visits_monthly WHERE ym < ?1").bind(before).run();
  await env.DB.prepare("DELETE FROM visits_region_monthly WHERE ym < ?1").bind(before).run();
}

// Regiões por país na mesma janela de 12 meses. Tabela ausente ou erro → sem regiões (o resto da resposta segue).
export async function readRegions(env, from) {
  let rows;
  try {
    ({ results: rows } = await env.DB.prepare(
      "SELECT ym, country, region, name, n, updated_at FROM visits_region_monthly WHERE ym >= ?1"
    )
      .bind(from)
      .all());
  } catch (e) {
    return { regions: [], regions_since: null };
  }
  const byCountry = new Map();
  let since = null;
  for (const r of rows || []) {
    if (!(r.n > 0) || r.country === UNKNOWN) continue;
    if (since === null || r.ym < since) since = r.ym;
    let c = byCountry.get(r.country);
    if (!c) byCountry.set(r.country, (c = { country: r.country, visits: 0, unknown: 0, items: new Map() }));
    c.visits += r.n;
    if (r.region === UNKNOWN) { c.unknown += r.n; continue; }
    const it = c.items.get(r.region) || { code: r.region, name: "", visits: 0, u: -1 };
    it.visits += r.n;
    if (r.name && r.updated_at > it.u) { it.name = r.name; it.u = r.updated_at; }
    c.items.set(r.region, it);
  }
  const regions = [...byCountry.values()]
    .map((c) => ({
      country: c.country,
      visits: c.visits,
      unknown: c.unknown,
      items: [...c.items.values()]
        .map(({ code, name, visits }) => ({ code, name, visits }))
        .sort((a, b) => b.visits - a.visits || (a.code < b.code ? -1 : 1)),
    }))
    .sort((a, b) => b.visits - a.visits || (a.country < b.country ? -1 : 1));
  return { regions, regions_since: since };
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
  const { regions, regions_since } = await readRegions(env, from);
  return {
    total_visits: total,
    countries_count: countries.length,
    updated_at: updated ? new Date(updated * 1000).toISOString() : null,
    since,
    window_months: WINDOW_MONTHS,
    countries,
    regions_since,
    regions,
  };
}

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const path = url.pathname.replace(/\/+$/, "") || "/";

    if (path === "/api/visit") {
      if (request.method !== "POST") return new Response(null, { status: 405, headers: { ...BASE_HEADERS, allow: "POST" } });
      const none = new Response(null, { status: 204, headers: { ...BASE_HEADERS, "cache-control": "no-store" } });
      if (!isSameOriginBrowserCall(request) || looksLikeBot(request) || fromDatacenter(request)) return none;
      const now = new Date();
      const cf = request.cf || {};
      const country = normalizeCountry(cf.country);
      try {
        await recordVisit(env, country, now);
        if (Math.random() < 0.02) ctx.waitUntil(purgeOld(env, now).catch(() => {}));
      } catch (e) {
        /* falha de banco nunca afeta a página */
      }
      if (country !== UNKNOWN) {
        const region = normalizeRegion(cf.regionCode);
        try {
          await recordRegion(env, country, region, region === UNKNOWN ? "" : cleanRegionName(cf.region), now);
        } catch (e) {
          /* a contagem por região é independente: falha aqui não desfaz a do país */
        }
      }
      return none;
    }

    if (path === "/api/whoami") {
      if (request.method !== "GET") return new Response(null, { status: 405, headers: { ...BASE_HEADERS, allow: "GET" } });
      const cf = request.cf || {};
      const c = normalizeCountry(cf.country);
      const r = c === UNKNOWN ? UNKNOWN : normalizeRegion(cf.regionCode);
      return json({
        country: c === UNKNOWN ? null : c,
        region: r === UNKNOWN ? null : r,
        region_name: r === UNKNOWN ? null : cleanRegionName(cf.region) || null,
      }, 200, "no-store");
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
