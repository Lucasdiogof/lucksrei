// StockPort System — captura index.html quadro a quadro (window.render(t) é determinístico) e gera os MP4.
// uso:
//   node render.mjs check <fmt>                         fontes, erros JS, duração e textos dentro da área segura (wide|sq|tall)
//   node render.mjs sheet <fmt> <dir> t1,t2,...         quadros avulsos PNG (tempos absolutos ou "s04+3.2" = cena + segundos)
//   node render.mjs video <fmt> <out.mp4> [--workers 5] [--crf 12] [--t0 a --t1 b]
//        captura a 30 fps e envia os quadros por pipe ao ffmpeg (nada vai para o disco): sai o intermediário de alta
//        qualidade (H.264 CRF 12) de onde as versões finais são derivadas
//   node render.mjs finals <dir-intermediarios> <dir-final>
//        versões de entrega (H.264 High, yuv420p, BT.709, +faststart; AV1 e pôster WebP para o loop do site; com trilha
//        quando existir out/audio/stockport-<fmt>.wav, gerado por audio/make-music.mjs)
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
const run = args => { const r = spawnSync(FFMPEG, ['-hide_banner', '-v', 'error', '-y', ...args], { stdio: 'inherit' }); if (r.status) process.exit(r.status); };
const H264 = ['-c:v', 'libx264', '-profile:v', 'high', '-pix_fmt', 'yuv420p', '-color_primaries', 'bt709', '-color_trc', 'bt709', '-colorspace', 'bt709', '-movflags', '+faststart'];

if (mode === 'finals') {
  const [, src, dst] = argv; fs.mkdirSync(dst, { recursive: true });
  const I = f => path.join(src, `stockport-${f}.mp4`), O = f => path.join(dst, f);
  const wav = f => { const p = path.join(here, 'out', 'audio', `stockport-${f}.wav`); return fs.existsSync(p) ? p : null; };
  const AAC = ['-af', 'loudnorm=I=-16:TP=-1.5:LRA=11', '-c:a', 'aac', '-b:a', '192k', '-ar', '48000', '-shortest'];
  // master: qualidade de apresentação + versão leve para web/campanhas
  run(['-i', I('wide'), ...H264, '-preset', 'slow', '-crf', '18', '-an', O('stockport-master-1920x1080.mp4')]);
  run(['-i', I('wide'), ...H264, '-preset', 'slow', '-crf', '22', '-maxrate', '6M', '-bufsize', '12M', '-an', O('stockport-master-1920x1080-web.mp4')]);
  // vertical para marketplace (Mercado Livre e outros): H.264 High 4.1, 30 fps, teto de bitrate para celular
  run(['-i', I('tall'), ...H264, '-preset', 'slow', '-crf', '20', '-maxrate', '8M', '-bufsize', '16M', '-level', '4.1', '-an', O('stockport-vertical-1080x1920.mp4')]);
  if (wav('wide')) run(['-i', I('wide'), '-i', wav('wide'), ...H264, '-preset', 'slow', '-crf', '18', ...AAC, O('stockport-master-1920x1080-trilha.mp4')]);
  if (wav('tall')) run(['-i', I('tall'), '-i', wav('tall'), ...H264, '-preset', 'slow', '-crf', '20', '-maxrate', '8M', '-bufsize', '16M', '-level', '4.1', ...AAC, O('stockport-vertical-1080x1920-trilha.mp4')]);
  // loop do site: 720×720 H.264 e AV1, mudo, + pôster WebP do quadro com a marca
  run(['-i', I('sq'), '-vf', 'scale=720:720:flags=lanczos', ...H264, '-preset', 'veryslow', '-crf', '23', '-an', O('stockport-loop-720.mp4')]);
  run(['-i', I('sq'), '-vf', 'scale=720:720:flags=lanczos,format=yuv420p', '-c:v', 'libsvtav1', '-preset', '4', '-crf', '32', '-g', '300', '-svtav1-params', 'tune=0', '-movflags', '+faststart', '-an', O('stockport-loop-720.av1.mp4')]);
  const posterT = opt('poster', '41.5');
  run(['-ss', posterT, '-i', I('sq'), '-frames:v', '1', '-vf', 'scale=720:720:flags=lanczos', '-c:v', 'libwebp', '-quality', '86', O('stockport-loop-poster.webp')]);
  process.exit(0);
}

const MIME = { '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript', '.png': 'image/png', '.ttf': 'font/ttf', '.svg': 'image/svg+xml', '.webp': 'image/webp' };
const server = http.createServer((req, res) => {
  const f = path.join(here, decodeURIComponent(req.url.split('?')[0]).replace(/^\/$/, '/index.html'));
  if (!f.startsWith(here) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); return res.end(); }
  res.writeHead(200, { 'content-type': MIME[path.extname(f)] || 'application/octet-stream' }); fs.createReadStream(f).pipe(res);
}).listen(0, '127.0.0.1');
await new Promise(r => server.once('listening', r));
const base = `http://127.0.0.1:${server.address().port}/index.html`;
const errors = [];
async function open(browser, fmt) {
  const [w, h] = SIZES[fmt];
  const ctx = await browser.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: 1 });
  await ctx.route(u => !u.href.startsWith(base.replace('/index.html', '')), r => r.abort());   // sem rede externa
  const page = await ctx.newPage();
  page.on('pageerror', e => { errors.push(e.message); console.error('PAGEERR', e.message); });
  page.on('console', m => { if (m.type() === 'error') { errors.push(m.text()); console.error('CONSOLE', m.text()); } });
  await page.goto(`${base}?render&fmt=${fmt}`); await page.waitForFunction('window.READY===true', null, { timeout: 60000 });
  return page;
}
const settle = (p, t) => p.evaluate(t => { window.render(t); return new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r))); }, t);

const { chromium } = require('playwright');
const browser = await chromium.launch({ args: ['--font-render-hinting=none', '--disable-lcd-text', '--force-color-profile=srgb'] });
const fmt = argv[1];
if (!SIZES[fmt]) { console.error('formato: wide | sq | tall'); process.exit(2); }

if (mode === 'sheet') {
  const dir = argv[2]; fs.mkdirSync(dir, { recursive: true });
  const page = await open(browser, fmt);
  const segs = await page.evaluate(() => SP.segs.map(s => ({ id: s.id, t0: s.t0 })));
  const ts = argv[3].split(',').map(x => { const m = x.match(/^(s\w+)\+([\d.]+)$/); return m ? segs.find(s => s.id === m[1]).t0 + +m[2] : +x; });
  for (const t of ts) { await settle(page, t); await page.screenshot({ path: path.join(dir, `${fmt}-${t.toFixed(2).padStart(6, '0')}.png`) }); }
} else if (mode === 'check') {
  const page = await open(browser, fmt);
  const info = await page.evaluate(() => ({ dur: window.DURATION, fonts: [300, 400, 500, 700].map(w => document.fonts.check(`${w} 20px "SP Roboto"`)), segs: SP.segs.map(s => [s.id, s.t0, s.t1]) }));
  const [W, H] = SIZES[fmt], mx = W * .05, my = H * (fmt === 'tall' ? .05 : .05);
  let bad = 0;
  console.log(`duração ${info.dur.toFixed(2)} s · fontes Roboto 300/400/500/700: ${info.fonts.join('/')} · cenas: ${info.segs.map(s => s[0] + '@' + s[1].toFixed(1)).join(' ')}`);
  if (!info.fonts.every(Boolean)) { console.log('FAIL fonte não carregada'); bad++; }
  // a cada 0,25 s: títulos visíveis dentro da área segura, nunca dois títulos de cenas diferentes legíveis ao mesmo tempo
  for (let t = 0; t <= info.dur; t += .25) {
    await page.evaluate(t => window.render(t), t);
    const r = await page.evaluate(() => {
      const vis = []; document.querySelectorAll('.scene').forEach(sc => { if (sc.style.display === 'none') return;
        sc.querySelectorAll('.hl').forEach(h => { if (h.style.display === 'none') return; let box = null, op = 0;
          h.querySelectorAll('.hw i').forEach(i => { const o = +(i.style.opacity || 1); if (o < .5 || i.style.transform.includes('110%')) return; op = Math.max(op, o); const b = i.getBoundingClientRect(); box = box ? { l: Math.min(box.l, b.left), t: Math.min(box.t, b.top), r: Math.max(box.r, b.right), b: Math.max(box.b, b.bottom) } : { l: b.left, t: b.top, r: b.right, b: b.bottom }; });
          if (box) vis.push({ sc: sc.className, text: h.textContent.slice(0, 40), ...box }); }); });
      return vis;
    });
    for (const v of r) if (v.l < mx - 1 || v.r > W - mx + 1 || v.t < my - 1 || v.b > H - my + 1) { bad++; console.log(`FAIL ${t.toFixed(2)} s fora da área segura: "${v.text}" [${v.l.toFixed(0)},${v.t.toFixed(0)},${v.r.toFixed(0)},${v.b.toFixed(0)}]`); }
    const scs = new Set(r.map(v => v.sc)); if (scs.size > 1) { bad++; console.log(`FAIL ${t.toFixed(2)} s títulos de cenas diferentes ao mesmo tempo: ${r.map(v => '"' + v.text + '"').join(' + ')}`); }
  }
  if (errors.length) { bad++; console.log(`FAIL ${errors.length} erro(s) de JavaScript`); }
  console.log(bad ? `${bad} problema(s)` : 'ok: fontes, JS, área segura e títulos');
  await browser.close(); server.close(); process.exit(bad ? 1 : 0);
} else if (mode === 'video') {
  const outFile = argv[2], W = +opt('workers', 5), crf = opt('crf', '12'), fps = 30;
  const p0 = await open(browser, fmt); const dur = await p0.evaluate('window.DURATION'); await p0.context().close();
  const t0 = +opt('t0', 0), t1 = +opt('t1', dur), i0 = Math.round(t0 * fps), i1 = Math.round(t1 * fps), N = i1 - i0;
  fs.mkdirSync(path.dirname(path.resolve(outFile)), { recursive: true });
  const ff = spawn(FFMPEG, ['-hide_banner', '-v', 'error', '-y', '-f', 'image2pipe', '-framerate', String(fps), '-c:v', 'png', '-i', '-', ...H264, '-preset', 'medium', '-crf', crf, '-an', outFile], { stdio: ['pipe', 'inherit', 'inherit'] });
  const done = new Promise(r => ff.on('close', r));
  // workers capturam fora de ordem; um buffer reordena antes de escrever no pipe
  const buf = new Map(); let next = 0; const start = Date.now(); let chain = Promise.resolve();
  const flush = async () => { while (buf.has(next)) { const b = buf.get(next); buf.delete(next); next++; if (!ff.stdin.write(b)) await new Promise(r => ff.stdin.once('drain', r)); if (next % 300 === 0) console.log(`${next}/${N} (${((Date.now() - start) / 1000).toFixed(0)} s)`); } };
  await Promise.all(Array.from({ length: W }, async (_, w) => {
    const page = await open(browser, fmt);
    for (let i = w; i < N; i += W) {
      while (i - next > W * 12) await new Promise(r => setTimeout(r, 20));
      await settle(page, (i0 + i) / fps);
      buf.set(i, await page.screenshot({ type: 'png' }));
      chain = chain.then(flush); await chain;
    }
  }));
  await chain; ff.stdin.end(); const code = await done;
  console.log(`${N} quadros em ${((Date.now() - start) / 1000).toFixed(0)} s → ${outFile} (ffmpeg ${code})`);
  if (errors.length) { console.log(`${errors.length} erro(s) de JavaScript durante a captura`); process.exitCode = 1; }
}
await browser.close(); server.close();
