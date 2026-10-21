// StockPort System — captura index.html quadro a quadro (window.render(t) é determinístico) e codifica os MP4.
// uso:
//   node render.mjs sheet <fmt> <dir> t1,t2,...       quadros avulsos PNG no tamanho real do formato (wide|sq|tall)
//   node render.mjs video <fmt> <out.mp4> [--fps-in 60] [--workers 4] [--t0 a --t1 b] [--crf 16]
//        captura e envia os quadros direto ao ffmpeg por pipe (nenhum quadro vai para o disco); com --fps-in 60
//        cada par de quadros é misturado (motion blur leve) e o resultado sai a 30 fps.
//   node render.mjs derive <in.mp4> <out-prefix>      loop 720×720 H.264 + AV1 e pôster WebP a partir do quadrado
// Playwright e ffmpeg vêm do ambiente: PW_DIR (pasta com node_modules/playwright) e FFMPEG (binário com libx264/libsvtav1/libwebp).
import { createRequire } from 'node:module';
import { spawn, spawnSync } from 'node:child_process';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import url from 'node:url';

const here = path.dirname(url.fileURLToPath(import.meta.url));
const require = createRequire((process.env.PW_DIR || here) + '/');
const FFMPEG = process.env.FFMPEG || 'ffmpeg';
const argv = process.argv.slice(2), mode = argv[0];
const opt = (k, d) => { const i = argv.indexOf('--' + k); return i > 0 ? argv[i + 1] : d; };
const SIZES = { wide: [1920, 1080], sq: [1080, 1080], tall: [1080, 1920] };

const MIME = { '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript', '.png': 'image/png', '.ttf': 'font/ttf', '.svg': 'image/svg+xml', '.webp': 'image/webp' };
let server, base;
async function serve() {
  server = http.createServer((req, res) => {
    const f = path.join(here, decodeURIComponent(req.url.split('?')[0]).replace(/^\/$/, '/index.html'));
    if (!f.startsWith(here) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); return res.end(); }
    res.writeHead(200, { 'content-type': MIME[path.extname(f)] || 'application/octet-stream' }); fs.createReadStream(f).pipe(res);
  }).listen(0, '127.0.0.1');
  await new Promise(r => server.once('listening', r));
  base = `http://127.0.0.1:${server.address().port}/index.html`;
}
async function open(browser, fmt) {
  const [w, h] = SIZES[fmt];
  const ctx = await browser.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: 1 });
  await ctx.route(u => !u.href.startsWith(base.replace('/index.html', '')), r => r.abort());   // sem rede externa
  const page = await ctx.newPage();
  page.on('pageerror', e => console.error('PAGEERR', e.message));
  page.on('console', m => { if (m.type() === 'error') console.error('CONSOLE', m.text()); });
  await page.goto(`${base}?render&fmt=${fmt}`); await page.waitForFunction('window.READY===true', null, { timeout: 60000 });
  return page;
}
const settle = (p, t) => p.evaluate(t => { window.render(t); return new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r))); }, t);
const run = args => { const r = spawnSync(FFMPEG, args, { stdio: 'inherit' }); if (r.status) process.exit(r.status); };

if (mode === 'derive') {
  const [, inp, pre] = argv;
  // loop do site: 720×720 H.264 + AV1, sem áudio; pôster WebP
  run(['-v', 'error', '-y', '-i', inp, '-vf', 'scale=720:720:flags=lanczos,format=yuv420p', '-c:v', 'libx264', '-profile:v', 'high', '-preset', 'veryslow', '-crf', '24', '-movflags', '+faststart', '-an', `${pre}-720.mp4`]);
  run(['-v', 'error', '-y', '-i', inp, '-vf', 'scale=720:720:flags=lanczos,format=yuv420p', '-c:v', 'libsvtav1', '-preset', '4', '-crf', '32', '-g', '300', '-svtav1-params', 'tune=0', '-movflags', '+faststart', '-an', `${pre}-720.av1.mp4`]);
  process.exit(0);
}
const { chromium } = require('playwright');
await serve();
const browser = await chromium.launch({ args: ['--font-render-hinting=none', '--disable-lcd-text', '--force-color-profile=srgb'] });
const fmt = argv[1];
if (mode === 'sheet') {
  const dir = argv[2]; fs.mkdirSync(dir, { recursive: true });
  const page = await open(browser, fmt);
  // tempos absolutos ("12.5") ou relativos a uma cena do formato ("s04+3.2")
  const segs = await page.evaluate(() => SP.segs.map(s => ({ id: s.id, t0: s.t0 })));
  const ts = argv[3].split(',').map(x => { const m = x.match(/^(s\d\d)\+([\d.]+)$/); return m ? segs.find(s => s.id === m[1]).t0 + +m[2] : +x; });
  for (const t of ts) { await settle(page, t); await page.screenshot({ path: path.join(dir, `${fmt}-${t.toFixed(2).padStart(6, '0')}.png`) }); }
} else if (mode === 'video') {
  const outFile = argv[2], fpsIn = +opt('fps-in', 30), W = +opt('workers', 4), crf = opt('crf', '16');
  const p0 = await open(browser, fmt); const dur = await p0.evaluate('window.DURATION'); await p0.context().close();
  const t0 = +opt('t0', 0), t1 = +opt('t1', dur), i0 = Math.round(t0 * fpsIn), i1 = Math.round(t1 * fpsIn), N = i1 - i0;
  // tmix soma o quadro n com o n−1: ficar com os ímpares mistura os pares (2m, 2m+1) do mesmo quadro de saída
  const vf = (fpsIn === 60 ? `tmix=frames=2,select='mod(n\\,2)',setpts=N/(30*TB),` : '') + 'format=yuv420p';
  fs.mkdirSync(path.dirname(path.resolve(outFile)), { recursive: true });
  const ff = spawn(FFMPEG, ['-v', 'error', '-y', '-f', 'image2pipe', '-framerate', String(fpsIn), '-c:v', 'mjpeg', '-i', '-', '-vf', vf, '-r', '30',
    '-c:v', 'libx264', '-profile:v', 'high', '-preset', 'slow', '-crf', crf, '-pix_fmt', 'yuv420p', '-color_primaries', 'bt709', '-color_trc', 'bt709', '-colorspace', 'bt709',
    '-movflags', '+faststart', '-an', outFile], { stdio: ['pipe', 'inherit', 'inherit'] });
  const done = new Promise(r => ff.on('close', r));
  // workers capturam fora de ordem; um buffer reordena antes de escrever no pipe
  const buf = new Map(); let next = 0; const start = Date.now();
  const flush = async () => { while (buf.has(next)) { const b = buf.get(next); buf.delete(next); next++; if (!ff.stdin.write(b)) await new Promise(r => ff.stdin.once('drain', r)); if (next % 150 === 0) console.log(`${next}/${N} (${((Date.now() - start) / 1000).toFixed(0)} s)`); } };
  let chain = Promise.resolve();
  await Promise.all(Array.from({ length: W }, async (_, w) => {
    const page = await open(browser, fmt);
    for (let i = w; i < N; i += W) {
      while (i - next > W * 24) await new Promise(r => setTimeout(r, 20));   // limita a memória do buffer
      await settle(page, (i0 + i) / fpsIn);
      buf.set(i, await page.screenshot({ type: 'jpeg', quality: 96 }));
      chain = chain.then(flush); await chain;
    }
  }));
  await chain; ff.stdin.end(); const code = await done;
  console.log(`${N} quadros em ${((Date.now() - start) / 1000).toFixed(0)} s → ${outFile} (ffmpeg ${code})`);
}
await browser.close(); server.close();
