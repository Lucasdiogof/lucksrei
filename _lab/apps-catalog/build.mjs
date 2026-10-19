// Gera _lab/apps-catalog/{a,b,c}.html a partir de apps/index.html (mesmo header, hero, rodapé, i18n e tema).
// Só troca o renderizador do catálogo e acrescenta o CSS da proposta. Rode: node _lab/apps-catalog/build.mjs
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, "../..");
const src = fs.readFileSync(path.join(root, "apps/index.html"), "utf8");
const NAMES = { a: "Editorial App Directory", b: "Product Gallery", c: "Signature Lucksrei" };

const bar = (k) => `
<nav class="lab-bar" aria-label="Lab">
  <span>LAB /apps</span>${Object.keys(NAMES).map((x) => `<a href="/_lab/apps-catalog/${x}.html"${x === k ? ' aria-current="page"' : ""}>${x.toUpperCase()} · ${NAMES[x]}</a>`).join("")}<a href="/apps/">Atual</a>
</nav>
<style>
.lab-bar{ position: fixed; z-index: 90; left: 50%; bottom: 14px; transform: translateX(-50%); display: flex; gap: 4px; align-items: center;
  padding: 6px; border-radius: 999px; background: rgba(10,11,14,.92); border: 1px solid rgba(255,255,255,.12); font: 12px/1 var(--font-mono); max-width: calc(100vw - 24px); overflow-x: auto; }
.lab-bar span{ color: #dbb250; padding: 0 10px; white-space: nowrap; }
.lab-bar a{ color: #aeb4bf; text-decoration: none; padding: 8px 12px; border-radius: 999px; white-space: nowrap; }
.lab-bar a[aria-current]{ background: #dbb250; color: #111; }
@media (max-width: 700px){ .lab-bar a{ padding: 8px 9px; } .lab-bar span{ display: none; } }
</style>`;

for (const k of Object.keys(NAMES)) {
  let html = src
    .replace("<title>", `<meta name="robots" content="noindex, nofollow">\n<title>[Lab ${k.toUpperCase()}] `)
    .replace('<link rel="stylesheet" href="/assets/css/style.css">',
      `<link rel="stylesheet" href="/assets/css/style.css">\n<link rel="stylesheet" href="/_lab/apps-catalog/${k}.css">`)
    .replace('<script src="/assets/js/apps.js"></script>',
      `<script src="/_lab/apps-catalog/lab-common.js"></script>\n<script src="/_lab/apps-catalog/${k}.js"></script>`)
    .replace("</body>", `${bar(k)}\n</body>`);
  if (!html.includes(`${k}.js`)) throw new Error("apps.js não encontrado em apps/index.html");
  fs.writeFileSync(path.join(here, `${k}.html`), html);
}
console.log("ok: a.html b.html c.html");
