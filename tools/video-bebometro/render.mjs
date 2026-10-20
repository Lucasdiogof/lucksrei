// Captura index.html quadro a quadro (window.render(t) é determinístico) e codifica os MP4.
// uso:
//   node render.mjs sheet <dir> t1,t2,...            frames avulsos (1920×1080 PNG) para conferência
//   node render.mjs frames <dir> [fps=60] [workers=4] [t0] [t1]   frames JPEG 1920×1080
//   node render.mjs encode <dir> <out-dir> [fpsIn=60]            MP4 16:9 (1920×1080) e quadrado (720×720) a 30 fps
// Playwright e ffmpeg vêm do ambiente: PW_DIR (pasta com node_modules/playwright) e FFMPEG (binário).
import { createRequire } from 'node:module';
import { spawnSync } from 'node:child_process';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import url from 'node:url';

const here = path.dirname(url.fileURLToPath(import.meta.url));
const require = createRequire((process.env.PW_DIR || here) + '/');
const FFMPEG = process.env.FFMPEG || 'ffmpeg';
const [mode, dir = 'out', a3, a4, a5, a6] = process.argv.slice(2);

const MIME = { '.html': 'text/html', '.png': 'image/png', '.woff2': 'font/woff2', '.js': 'text/javascript' };
const server = http.createServer((req, res) => {
  const f = path.join(here, decodeURIComponent(req.url.split('?')[0]).replace(/^\/$/, '/index.html'));
  if (!f.startsWith(here) || !fs.existsSync(f)) { res.writeHead(404); return res.end(); }
  res.writeHead(200, { 'content-type': MIME[path.extname(f)] || 'application/octet-stream' });
  fs.createReadStream(f).pipe(res);
}).listen(0, '127.0.0.1');
await new Promise(r => server.once('listening', r));
const base = `http://127.0.0.1:${server.address().port}/index.html?render`;

async function open(browser) {
  const ctx = await browser.newContext({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 1 });
  const page = await ctx.newPage();
  page.on('pageerror', e => console.error('PAGEERR', e.message));
  page.on('console', m => { if (m.type() === 'error') console.error('CONSOLE', m.text()); });
  await page.goto(base); await page.waitForFunction('window.READY===true');
  return page;
}
const settle = (p, t) => p.evaluate(t => { window.render(t); return new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r))); }, t);

if (mode === 'encode') {
  const out = a3 || 'out', fpsIn = +(a4 || 60); fs.mkdirSync(out, { recursive: true });
  const inp = ['-v', 'error', '-y', '-framerate', String(fpsIn), '-i', path.join(dir, 'f%05d.jpg')];
  // 60 fps → média de 2 quadros → 30 fps (motion blur leve)
  const blur = `tmix=frames=2,select='not(mod(n\\,2))',setpts=N/(30*TB)`;
  const run = (args) => { const r = spawnSync(FFMPEG, args, { stdio: 'inherit' }); if (r.status) process.exit(r.status); };
  run([...inp, '-vf', `${blur},format=yuv420p`, '-r', '30', '-c:v', 'libx264', '-profile:v', 'high', '-preset', 'slow', '-crf', '17', '-movflags', '+faststart', '-an', path.join(out, 'bebometro-1080p.mp4')]);
  run([...inp, '-vf', `${blur},crop=1080:1080:420:0,scale=720:720:flags=lanczos,format=yuv420p`, '-r', '30', '-c:v', 'libx264', '-profile:v', 'high', '-preset', 'veryslow', '-crf', '27', '-movflags', '+faststart', '-an', path.join(out, 'bebometro-loop.mp4')]);
  run([...inp, '-vf', `${blur},crop=1080:1080:420:0,scale=720:720:flags=lanczos,format=yuv420p`, '-r', '30', '-c:v', 'libsvtav1', '-preset', '4', '-crf', '42', '-g', '300', '-svtav1-params', 'tune=0', '-movflags', '+faststart', '-an', path.join(out, 'bebometro-loop.av1.mp4')]);
  server.close(); process.exit(0);
}

const { chromium } = require('playwright');
const browser = await chromium.launch({ args: ['--font-render-hinting=none', '--disable-lcd-text'] });
fs.mkdirSync(dir, { recursive: true });
if (mode === 'sheet') {
  const page = await open(browser);
  for (const t of a3.split(',').map(Number)) { await settle(page, t); await page.screenshot({ path: path.join(dir, `t${t.toFixed(2)}.png`) }); }
} else if (mode === 'frames') {
  const fps = +(a3 || 60), W = +(a4 || 4), dur = await (await open(browser)).evaluate('window.DURATION');
  const t0 = a5 ? +a5 : 0, t1 = a6 ? +a6 : dur, i0 = Math.round(t0 * fps), i1 = Math.round(t1 * fps), t = Date.now();
  await Promise.all(Array.from({ length: W }, async (_, w) => {
    const page = await open(browser);
    for (let i = i0 + w; i < i1; i += W) { await settle(page, i / fps); await page.screenshot({ path: path.join(dir, `f${String(i - i0).padStart(5, '0')}.jpg`), type: 'jpeg', quality: 93 }); }
  }));
  console.log(`${i1 - i0} frames em ${((Date.now() - t) / 1000).toFixed(0)} s`);
}
await browser.close(); server.close();
