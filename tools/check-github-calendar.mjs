/* Confere /api/github-contributions contra o fragmento público do perfil.
 * Uso: node tools/check-github-calendar.mjs [https://lucksrei.com]
 * Falha (exit 1) se o formato estiver errado, faltarem dias ou as contagens divergirem do que o GitHub mostra.
 * Rode com acesso à internet, depois do deploy, e compare o total com a página do perfil (github.com/Lucasdiogof).
 */
import { fromPublicHtml, LOGIN } from "../worker/github.mjs";

const base = (process.argv[2] || "https://lucksrei.com").replace(/\/$/, "");
const fail = (m) => { console.error("FALHOU: " + m); process.exit(1); };

const api = await fetch(base + "/api/github-contributions");
if (!api.ok) fail(`API respondeu ${api.status}`);
const mine = await api.json();
if (!Array.isArray(mine.days) || mine.days.length < 365) fail("menos de 365 dias na resposta");
if (!mine.days.every((d) => /^\d{4}-\d{2}-\d{2}$/.test(d[0]) && d[1] >= 0 && d[2] >= 0 && d[2] <= 4)) fail("dia fora do formato");
console.log(`API: fonte=${mine.source}${mine.stale ? " (STALE)" : ""}, ${mine.days.length} dias, total=${mine.total}, atualizado=${mine.fetched_at}`);
const res = await fetch(`https://github.com/users/${LOGIN}/contributions`, { headers: { "user-agent": "lucksrei-check" } });
if (!res.ok) fail(`perfil público respondeu ${res.status}`);
const gh = new Map(fromPublicHtml(await res.text()).days.map((d) => [d[0], d]));
let diff = 0;
for (const d of mine.days) { const g = gh.get(d[0]); if (g && (g[1] !== d[1] || g[2] !== d[2])) diff++; }
const common = mine.days.filter((d) => gh.has(d[0])).length;
console.log(`GitHub: ${gh.size} dias; em comum ${common}; divergentes ${diff}`);
if (!common) fail("nenhum dia em comum");
if (diff) fail(`${diff} dias divergem (se a API estiver em cache de até 6 h, dias recentes podem diferir)`);
console.log("OK: calendário confere com o perfil. Compare também o total com a página github.com/" + LOGIN + ".");
