/* Relatório manual de visitas (somente leitura). Rode na raiz do repo: node tools/visitor-report.mjs
 *
 * Consulta o D1 remoto lucksrei-visits com dois SELECTs simples via Wrangler (login OAuth já existente) e
 * calcula tudo localmente. Nunca escreve no banco, não cria arquivos e não imprime configuração.
 * Só existem agregados (mês × país × contador): não há dado pessoal para expor.
 * Documentação: docs/visitor-analytics.md ("Relatório manual").
 */
import { spawnSync } from "node:child_process";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import path from "node:path";

const require = createRequire(import.meta.url);
const { makeCountryNamer, regionLabel } = require("../assets/js/visitors.js");

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const DATABASE = "lucksrei-visits";
// Sem parênteses de propósito: o npx.cmd do Windows quebra com eles na linha de comando.
export const QUERY = "SELECT ym, country, n, updated_at FROM visits_monthly";
export const REGION_QUERY = "SELECT ym, country, region, name, n, updated_at FROM visits_region_monthly";
const UNKNOWN = "XX";
const WINDOW_MONTHS = 12; // o mesmo do site (/api/visitors)
const LOCALE = "pt-BR";

export function assertReadOnly(sql) {
  if (!/^\s*SELECT\s/i.test(sql) || sql.includes(";") ||
      /\b(INSERT|UPDATE|DELETE|DROP|ALTER|CREATE|REPLACE|UPSERT|PRAGMA|ATTACH|DETACH|VACUUM|REINDEX|TRUNCATE)\b/i.test(sql)) {
    throw new Error("consulta recusada: só um SELECT simples é permitido");
  }
  return sql;
}

export function monthKey(date, offset = 0) {
  const d = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + offset, 1));
  return d.getUTCFullYear() + "-" + String(d.getUTCMonth() + 1).padStart(2, "0");
}

function nextMonth(ym) {
  const [y, m] = ym.split("-").map(Number);
  return monthKey(new Date(Date.UTC(y, m - 1, 1)), 1);
}

// Divisão protegida: sem base, não há percentual (null), nunca Infinity/NaN.
export function ratio(part, whole) {
  return whole > 0 ? part / whole : null;
}

// rows: [{ ym: "AAAA-MM", country: "BR", n: 3, updated_at: epoch_s }]
export function buildReport(rows, now = new Date()) {
  const current = monthKey(now);
  const previous = monthKey(now, -1);
  const windowStart = monthKey(now, -(WINDOW_MONTHS - 1));
  const byMonth = new Map();
  const byCountry = new Map();
  let total = 0, unknown = 0, window12 = 0, updated = 0, first = null, last = null;

  for (const r of rows || []) {
    const n = Number(r.n) || 0;
    if (n <= 0) continue;
    const code = String(r.country || "").toUpperCase();
    total += n;
    if (r.ym >= windowStart) window12 += n;
    byMonth.set(r.ym, (byMonth.get(r.ym) || 0) + n);
    if (code === UNKNOWN) unknown += n;
    else byCountry.set(code, (byCountry.get(code) || 0) + n);
    if (first === null || r.ym < first) first = r.ym;
    if (last === null || r.ym > last) last = r.ym;
    if (Number(r.updated_at) > updated) updated = Number(r.updated_at);
  }

  const countries = [...byCountry]
    .map(([code, visits]) => ({ code, visits, share: ratio(visits, total) }))
    .sort((a, b) => b.visits - a.visits || (a.code < b.code ? -1 : 1));

  // Linha do tempo contínua, do primeiro mês com dados até o mês atual (meses sem visita = 0).
  const months = [];
  if (first !== null) {
    const end = last > current ? last : current;
    for (let ym = first; ym <= end; ym = nextMonth(ym)) months.push({ ym, visits: byMonth.get(ym) || 0 });
  }

  // Comparação só quando o mês anterior está dentro do período com dados (senão seria inventada).
  let comparison = null;
  if (first !== null && first <= previous) {
    const cur = byMonth.get(current) || 0;
    const prev = byMonth.get(previous) || 0;
    comparison = { current, previous, currentVisits: cur, previousVisits: prev, diff: cur - prev, pct: ratio(cur - prev, prev) };
  }

  return {
    total,
    window12,
    windowMonths: WINDOW_MONTHS,
    currentMonth: current,
    currentMonthVisits: byMonth.get(current) || 0,
    unknown,
    countriesCount: countries.length,
    countries,
    top: countries.slice(0, 10),
    months,
    firstMonth: first,
    lastUpdate: updated ? new Date(updated * 1000).toISOString() : null,
    comparison,
  };
}

const nf = new Intl.NumberFormat(LOCALE);
const pf = new Intl.NumberFormat(LOCALE, { style: "percent", minimumFractionDigits: 1, maximumFractionDigits: 1 });
const spf = new Intl.NumberFormat(LOCALE, { style: "percent", minimumFractionDigits: 1, maximumFractionDigits: 1, signDisplay: "exceptZero" });
const sgn = new Intl.NumberFormat(LOCALE, { signDisplay: "exceptZero" });

export function monthLabel(ym) {
  const [y, m] = ym.split("-").map(Number);
  const s = new Intl.DateTimeFormat(LOCALE, { month: "short", year: "numeric", timeZone: "UTC" }).format(new Date(Date.UTC(y, m - 1, 1)));
  return s.charAt(0).toUpperCase() + s.slice(1).replace(" de ", "/").replace(".", "");
}

function visits(n) { return nf.format(n) + (n === 1 ? " visita" : " visitas"); }
function label(l) { return (l + ":").padEnd(19); }
function pct(x) { return x === null ? "—" : pf.format(x); }

export function formatReport(rep, namer = makeCountryNamer(typeof Intl !== "undefined" ? Intl.DisplayNames : null)) {
  const out = ["Visitor Analytics — lucksrei.com", ""];
  if (!rep.total) {
    out.push("Sem visitas registradas no banco.");
    return out.join("\n");
  }
  const name = (c) => namer(c, LOCALE);
  out.push(label("Período") + monthLabel(rep.firstMonth) + " → atual (" + monthLabel(rep.currentMonth) + ")");
  out.push(label("Total") + visits(rep.total) + (rep.total !== rep.window12 ? "  (últimos " + rep.windowMonths + " meses, como no site: " + nf.format(rep.window12) + ")" : ""));
  out.push(label("Mês atual") + visits(rep.currentMonthVisits) + " (" + monthLabel(rep.currentMonth) + ", em andamento)");
  out.push(label("Países") + nf.format(rep.countriesCount));
  out.push(label("Desconhecido/Tor") + visits(rep.unknown) + " (no total; fora de países e ranking)");
  out.push(label("Primeiro mês") + monthLabel(rep.firstMonth));
  out.push(label("Último update") + (rep.lastUpdate ? rep.lastUpdate.replace("T", " ").replace(/\.\d+Z$/, " UTC") : "—"));
  out.push("");

  out.push("Top países (% do total):");
  const rows = rep.top.map((c, i) => [(i + 1) + ". " + name(c.code) + " (" + c.code + ")", nf.format(c.visits), pct(c.share)]);
  const w = Math.max(...rows.map((r) => r[0].length)) + 3;
  const wn = Math.max(...rows.map((r) => r[1].length));
  rows.forEach((r) => out.push("  " + (r[0] + " ").padEnd(w, ".") + " " + r[1].padStart(wn) + "  " + r[2]));
  if (rep.countries.length > rep.top.length) out.push("  … mais " + (rep.countries.length - rep.top.length) + " país(es)");
  out.push("");

  out.push("Distribuição por país:");
  rep.countries.forEach((c) => out.push("  " + c.code + "  " + pct(c.share).padStart(6) + "  " + nf.format(c.visits)));
  if (rep.unknown) out.push("  XX  " + pct(ratio(rep.unknown, rep.total)).padStart(6) + "  " + nf.format(rep.unknown) + "  (desconhecido/Tor)");
  out.push("");

  out.push("Por mês:");
  const max = Math.max(...rep.months.map((m) => m.visits));
  rep.months.forEach((m) => out.push("  " + m.ym + "  " + nf.format(m.visits).padStart(6) + "  " + "█".repeat(max ? Math.round((m.visits / max) * 30) : 0)));
  out.push("");

  if (rep.comparison) {
    const c = rep.comparison;
    out.push("Mês atual × anterior:");
    out.push("  " + monthLabel(c.current) + " (em andamento): " + nf.format(c.currentVisits));
    out.push("  " + monthLabel(c.previous) + ": " + nf.format(c.previousVisits));
    out.push("  Diferença: " + sgn.format(c.diff) + " (" + (c.pct === null ? "— sem base no mês anterior" : spf.format(c.pct)) + ")");
  } else {
    out.push("Comparação com o mês anterior: dados insuficientes (só há o mês atual).");
  }
  return out.join("\n");
}

// Estados/regiões: rows de visits_region_monthly → países (por visitas) com suas regiões; "XX" vira "desconhecido".
// rows === null significa tabela indisponível (migration ainda não aplicada).
export function buildRegions(rows) {
  if (rows === null) return null;
  const by = new Map();
  let since = null;
  for (const r of rows || []) {
    const n = Number(r.n) || 0;
    if (n <= 0 || r.country === UNKNOWN) continue;
    if (since === null || r.ym < since) since = r.ym;
    let c = by.get(r.country);
    if (!c) by.set(r.country, (c = { country: r.country, visits: 0, unknown: 0, items: new Map() }));
    c.visits += n;
    if (r.region === UNKNOWN) { c.unknown += n; continue; }
    const it = c.items.get(r.region) || { code: r.region, name: "", visits: 0, u: -1 };
    it.visits += n;
    if (r.name && Number(r.updated_at) > it.u) { it.name = r.name; it.u = Number(r.updated_at); }
    c.items.set(r.region, it);
  }
  const countries = [...by.values()]
    .map((c) => ({
      country: c.country, visits: c.visits, unknown: c.unknown,
      items: [...c.items.values()].map(({ code, name, visits }) => ({ code, name, visits, share: ratio(visits, c.visits) }))
        .sort((a, b) => b.visits - a.visits || (a.code < b.code ? -1 : 1)),
    }))
    .sort((a, b) => b.visits - a.visits || (a.country < b.country ? -1 : 1));
  return { since, countries };
}

export function formatRegions(reg, namer = makeCountryNamer(typeof Intl !== "undefined" ? Intl.DisplayNames : null)) {
  const out = ["Por estado/região:"];
  if (reg === null) { out.push("  indisponível (tabela visits_region_monthly ainda não existe no D1)."); return out.join("\n"); }
  if (!reg.countries.length) { out.push("  ainda sem visitas com estado registrado."); return out.join("\n"); }
  out[0] = "Por estado/região (desde " + monthLabel(reg.since) + "; % dentro do país):";
  reg.countries.slice(0, 5).forEach((c) => {
    out.push("  " + namer(c.country, LOCALE) + " (" + c.country + ") — " + visits(c.visits));
    const rows = c.items.slice(0, 10).map((it, i) => ["    " + (i + 1) + ". " + regionLabel(c.country, it.code, it.name, "Distrito Federal") + " (" + it.code + ")", nf.format(it.visits), pct(it.share)]);
    if (rows.length) {
      const w = Math.max(...rows.map((r) => r[0].length)) + 3;
      const wn = Math.max(...rows.map((r) => r[1].length));
      rows.forEach((r) => out.push((r[0] + " ").padEnd(w, ".") + " " + r[1].padStart(wn) + "  " + r[2]));
    }
    if (c.items.length > rows.length) out.push("    … mais " + (c.items.length - rows.length) + " região(ões)");
    if (c.unknown) out.push("    Sem estado identificado: " + nf.format(c.unknown) + " (" + pct(ratio(c.unknown, c.visits)) + ")");
  });
  if (reg.countries.length > 5) out.push("  … mais " + (reg.countries.length - 5) + " país(es) com dados por estado");
  return out.join("\n");
}

// Mascara qualquer coisa que pareça id/token antes de mostrar um erro do Wrangler.
export function sanitize(text) {
  return String(text || "")
    .replace(/[A-Za-z0-9_-]{32,}/g, "[oculto]")
    .replace(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi, "[oculto]");
}

function fetchRows(query = QUERY) {
  const sql = assertReadOnly(query);
  const npx = process.platform === "win32" ? "npx.cmd" : "npx";
  const cmd = `${npx} wrangler d1 execute ${DATABASE} --remote --json --command "${sql}"`;
  const run = () => spawnSync(cmd, { cwd: ROOT, shell: true, encoding: "utf8", maxBuffer: 16 * 1024 * 1024 });
  let res = run();
  if (res.status !== 0) res = run(); // uma nova tentativa: falhas passageiras (ex.: renovação do login OAuth)
  if (res.status !== 0) {
    const tail = sanitize((res.stderr || "") + (res.stdout || "")).trim().split(/\r?\n/).slice(-3).join("\n");
    throw new Error("falha ao consultar o D1 (wrangler saiu com código " + res.status + ")\n" + tail);
  }
  const start = res.stdout.indexOf("[");
  const parsed = JSON.parse(res.stdout.slice(start));
  const block = parsed && parsed[0];
  if (!block || !block.success || !Array.isArray(block.results)) throw new Error("resposta inesperada do D1");
  return block.results;
}

const isMain = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) {
  try {
    const report = formatReport(buildReport(fetchRows(), new Date()));
    let regionRows = null;
    try { regionRows = fetchRows(REGION_QUERY); } catch (e) { /* tabela ausente: a seção avisa */ }
    console.log(report + "\n\n" + formatRegions(buildRegions(regionRows)));
  } catch (e) {
    console.error("Erro: " + sanitize(e.message));
    process.exit(1);
  }
}
