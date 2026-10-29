// Sem JavaScript o card mostra o pôster (em inglês, idioma do texto estático). Uso: PW_DIR=... node tools/video-i18n/e2e/nojs.mjs
import { createRequire } from 'node:module'; import http from 'node:http'; import fs from 'node:fs'; import path from 'node:path'; import url from 'node:url';
const here = path.dirname(url.fileURLToPath(import.meta.url)), repo = path.resolve(here, '..', '..', '..');
const { chromium } = createRequire((process.env.PW_DIR || repo) + '/')('playwright');
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.webp': 'image/webp', '.png': 'image/png', '.svg': 'image/svg+xml', '.mp4': 'video/mp4' };
const srv = http.createServer((q, r) => { let f = path.join(repo, decodeURIComponent(q.url.split('?')[0])); if (fs.existsSync(f) && fs.statSync(f).isDirectory()) f = path.join(f, 'index.html'); if (!fs.existsSync(f)) { r.writeHead(404); return r.end(); } r.writeHead(200, { 'content-type': MIME[path.extname(f)] || 'application/octet-stream' }); fs.createReadStream(f).pipe(r); }).listen(0, '127.0.0.1');
await new Promise(r => srv.once('listening', r));
const b = await chromium.launch(); const out = []; let bad = 0;
for (const [p, n] of [['/', 7], ['/projects/orbijob/', 1], ['/projects/stockport/', 1], ['/projects/fan-hub/', 1]]) {
  const ctx = await b.newContext({ javaScriptEnabled: false, viewport: { width: 1280, height: 900 } }); const pg = await ctx.newPage();
  const reqs = []; pg.on('request', q => reqs.push(q.url()));
  await pg.goto(`http://127.0.0.1:${srv.address().port}${p}`, { waitUntil: 'load' });
  const imgs = await pg.evaluate(() => [...document.querySelectorAll('noscript')].length);   // com JS desligado o <noscript> vira conteúdo real
  const loaded = await pg.evaluate(() => [...document.querySelectorAll('img[src*="-loop-poster"]')].map(i => [i.src.split('/').pop(), i.naturalWidth, Math.round(i.getBoundingClientRect().width)]));
  const mp4 = reqs.filter(u => /\.mp4/.test(u)).length;
  const ok = loaded.length === n && loaded.every(x => x[1] === 720 && x[2] > 100) && mp4 === 0; if (!ok) bad++;
  out.push({ p, ok, posters: loaded.length, mp4Requests: mp4, sample: loaded[0] });
  await ctx.close();
}
console.log(JSON.stringify(out, null, 1)); await b.close(); srv.close(); process.exit(bad ? 1 : 0);
