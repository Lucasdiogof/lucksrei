// Quick contact sheet of single frames: node sheet.mjs t1 t2 ... -> frames-sheet/<t>.png
import { chromium } from '/opt/node22/lib/node_modules/playwright/index.mjs';
import fs from 'node:fs'; import path from 'node:path'; import url from 'node:url';
const here = path.dirname(url.fileURLToPath(import.meta.url));
const dir = path.join(here, 'sheet'); fs.mkdirSync(dir, { recursive: true });
const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 720, height: 720 } });
p.on('pageerror', e => console.log('PAGE ERROR', e.message)); p.on('console', m => console.log('console', m.text()));
await p.goto(url.pathToFileURL(path.join(here, process.env.FILE || 'aprovaura-promo-v8.html')).href); await p.evaluate(() => window.ready);
for (const t of process.argv.slice(2)) { await p.evaluate(t => window.render(+t), t); await p.screenshot({ path: path.join(dir, `${t}.png`) }); }
await b.close();
