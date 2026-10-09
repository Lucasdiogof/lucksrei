/* GET /api/github-contributions — calendário público de contribuições do GitHub (últimos 12 meses).
 *
 * Resposta: { login, total, source, days: [[AAAA-MM-DD, contribuições, nível 0–4], ...], fetched_at }
 *
 * Fonte, em ordem:
 *   1. API GraphQL oficial (contributionsCollection), quando o secret GITHUB_TOKEN existe no Worker.
 *      Token só no ambiente do Worker (wrangler secret put GITHUB_TOKEN); basta leitura pública (sem escopos).
 *   2. Sem token: o fragmento público https://github.com/users/<login>/contributions, o mesmo que alimenta o gráfico
 *      do perfil. Não é uma API documentada; se o HTML mudar, o parser falha e a resposta é 503 (nunca dado inventado).
 *
 * Cache: borda (caches.default) por 6 h. A última resposta boa também fica por 7 dias e é servida se o GitHub falhar
 * ou limitar a taxa (campo stale: true). Só contribuições públicas (e as privadas que o perfil optou por mostrar).
 */

export const LOGIN = "Lucasdiogof";
const TTL = 6 * 3600;
const STALE_TTL = 7 * 86400;
const UA = "lucksrei-site (+https://lucksrei.com)";
const LEVELS = { NONE: 0, FIRST_QUARTILE: 1, SECOND_QUARTILE: 2, THIRD_QUARTILE: 3, FOURTH_QUARTILE: 4 };

const QUERY = `query($login:String!){user(login:$login){contributionsCollection{contributionCalendar{totalContributions weeks{contributionDays{date contributionCount contributionLevel}}}}}}`;

export function fromGraphql(json) {
  const cal = json && json.data && json.data.user && json.data.user.contributionsCollection.contributionCalendar;
  if (!cal || !Array.isArray(cal.weeks)) throw new Error("graphql_shape");
  const days = [];
  for (const w of cal.weeks) {
    for (const d of w.contributionDays) {
      days.push([d.date, d.contributionCount, d.contributionLevel in LEVELS ? LEVELS[d.contributionLevel] : 0]);
    }
  }
  days.sort((a, b) => (a[0] < b[0] ? -1 : 1));
  return { total: cal.totalContributions, days };
}

// Fragmento HTML público: <td data-date data-level id="contribution-day-component-…"> + <tool-tip for="id">N contributions on …</tool-tip>
export function fromPublicHtml(html) {
  if (typeof html !== "string") throw new Error("html_shape");
  const tips = new Map();
  const tipRe = /<tool-tip\b[^>]*?\bfor="([^"]+)"[^>]*>([\s\S]*?)<\/tool-tip>/g;
  let m;
  while ((m = tipRe.exec(html))) {
    const txt = m[2].replace(/<[^>]+>/g, "").trim();
    const n = /^No contributions/i.test(txt) ? 0 : (/^([\d,.]+)\s+contributions?\b/i.exec(txt) || [])[1];
    if (n !== undefined && n !== null) tips.set(m[1], typeof n === "number" ? n : parseInt(String(n).replace(/[,.]/g, ""), 10));
  }
  const days = [];
  const cellRe = /<(?:td|rect)\b[^>]*\bdata-date="(\d{4}-\d{2}-\d{2})"[^>]*>/g;
  while ((m = cellRe.exec(html))) {
    const tag = m[0];
    const level = Number((/\bdata-level="(\d)"/.exec(tag) || [])[1]);
    const id = (/\bid="([^"]+)"/.exec(tag) || [])[1];
    if (!(level >= 0 && level <= 4) || !tips.has(id)) throw new Error("html_shape");
    days.push([m[1], tips.get(id), level]);
  }
  if (days.length < 300) throw new Error("html_shape");
  days.sort((a, b) => (a[0] < b[0] ? -1 : 1));
  return { total: days.reduce((s, d) => s + d[1], 0), days };
}

export async function fetchContributions(env, fetchImpl = fetch) {
  if (env.GITHUB_TOKEN) {
    const res = await fetchImpl("https://api.github.com/graphql", {
      method: "POST",
      headers: { authorization: `Bearer ${env.GITHUB_TOKEN}`, "content-type": "application/json", "user-agent": UA },
      body: JSON.stringify({ query: QUERY, variables: { login: LOGIN } }),
    });
    if (!res.ok) throw Object.assign(new Error("upstream"), { status: res.status });
    const json = await res.json();
    if (json.errors) throw Object.assign(new Error("graphql_errors"), { status: 502 });
    return { ...fromGraphql(json), source: "graphql" };
  }
  const res = await fetchImpl(`https://github.com/users/${LOGIN}/contributions`, {
    headers: { "user-agent": UA, accept: "text/html" },
  });
  if (!res.ok) throw Object.assign(new Error("upstream"), { status: res.status });
  return { ...fromPublicHtml(await res.text()), source: "public" };
}

function reply(body, status, cacheControl) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": cacheControl,
      "x-content-type-options": "nosniff",
      "referrer-policy": "no-referrer",
    },
  });
}

export async function handleGithub(request, env, ctx, deps = {}) {
  if (request.method !== "GET") return new Response(null, { status: 405, headers: { allow: "GET" } });
  const cache = deps.cache === undefined ? (typeof caches !== "undefined" ? caches.default : null) : deps.cache;
  const origin = new URL(request.url).origin;
  const key = new Request(origin + "/api/github-contributions");
  const staleKey = new Request(origin + "/api/github-contributions?stale");
  if (cache) {
    const hit = await cache.match(key);
    if (hit) return hit;
  }
  try {
    const data = await fetchContributions(env, deps.fetch);
    const body = { login: LOGIN, total: data.total, source: data.source, days: data.days, fetched_at: new Date().toISOString() };
    const fresh = reply(body, 200, `public, max-age=3600, s-maxage=${TTL}`);
    if (cache) {
      ctx.waitUntil(cache.put(key, fresh.clone()));
      ctx.waitUntil(cache.put(staleKey, reply(body, 200, `public, max-age=${STALE_TTL}`)));
    }
    return fresh;
  } catch (e) {
    if (cache) {
      const old = await cache.match(staleKey);
      if (old) {
        const body = await old.json();
        return reply({ ...body, stale: true }, 200, "public, max-age=300");
      }
    }
    const limited = e && (e.status === 403 || e.status === 429);
    const res = reply({ error: limited ? "rate_limited" : "unavailable" }, 503, "no-store");
    if (limited) res.headers.set("retry-after", "900");
    return res;
  }
}
