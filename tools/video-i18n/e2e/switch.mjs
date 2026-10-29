// Testes de navegador da troca de idioma dos vídeos (Etapa 3). Servidor estático local com Range (seek) e throttle opcional.
//   PW_DIR=<pasta com node_modules/playwright> node tools/video-i18n/e2e/switch.mjs [--chrome] [--only nome]
// --chrome usa o Chrome instalado (H.264); sem ele, o Chromium do Playwright (só AV1). Saída: tabela + JSON em tools/video-i18n/e2e/out/
import { createRequire } from 'node:module';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import url from 'node:url';

const here = path.dirname(url.fileURLToPath(import.meta.url));
const repo = path.resolve(here, '..', '..', '..');
const require = createRequire((process.env.PW_DIR || repo) + '/');
const { chromium } = require('playwright');
const args = process.argv.slice(2);
const useChrome = args.includes('--chrome');
const h264Only = args.includes('--h264');   // esconde o AV1 do canPlayType: exercita o caminho H.264 (Safari antigo, Firefox sem AV1 etc.)
const only = args.includes('--only') ? args[args.indexOf('--only') + 1] : null;
const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.mp4': 'video/mp4', '.webp': 'image/webp', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.json': 'application/json', '.woff2': 'font/woff2', '.ico': 'image/x-icon', '.txt': 'text/plain', '.xml': 'application/xml' };
let throttleBps = 0, hits = [];
const server = http.createServer((req, res) => {
  const p = decodeURIComponent(req.url.split('?')[0]);
  let f = path.join(repo, p);
  if (!f.startsWith(repo)) { res.writeHead(403); return res.end(); }
  if (fs.existsSync(f) && fs.statSync(f).isDirectory()) f = path.join(f, 'index.html');
  if (!fs.existsSync(f)) { res.writeHead(404); return res.end(); }
  const st = fs.statSync(f), type = MIME[path.extname(f)] || 'application/octet-stream';
  if (p.endsWith('.mp4') && !(req.headers.range || '').match(/bytes=0-1$/)) hits.push(p);
  let start = 0, end = st.size - 1, code = 200;
  const h = { 'content-type': type, 'accept-ranges': 'bytes', 'cache-control': 'no-store' };
  const m = /bytes=(\d*)-(\d*)/.exec(req.headers.range || '');
  if (m) { code = 206; if (m[1]) start = +m[1]; if (m[2]) end = Math.min(+m[2], st.size - 1); h['content-range'] = `bytes ${start}-${end}/${st.size}`; }
  h['content-length'] = end - start + 1;
  res.writeHead(code, h);
  const rs = fs.createReadStream(f, { start, end });
  if (!throttleBps || !p.endsWith('.mp4')) return rs.pipe(res);
  rs.on('data', c => { rs.pause(); res.write(c); setTimeout(() => rs.resume(), throttleBps ? c.length / throttleBps * 1000 : 0); });
  rs.on('end', () => res.end());
  res.on('close', () => rs.destroy());
}).listen(0, '127.0.0.1');
await new Promise(r => server.once('listening', r));
const base = `http://127.0.0.1:${server.address().port}`;

const browser = await chromium.launch({ ...(useChrome ? { channel: 'chrome' } : {}), args: ['--autoplay-policy=no-user-gesture-required'] });
const engine = (useChrome ? 'chrome' : 'chromium') + (h264Only ? '-h264' : '-av1');
const results = [];
const sleep = ms => new Promise(r => setTimeout(r, ms));

async function open(locale, pagePath, opts = {}) {
  const ctx = await browser.newContext({ viewport: opts.viewport || { width: 1280, height: 900 }, reducedMotion: opts.reduced ? 'reduce' : 'no-preference', ...(opts.ctx || {}) });
  if (h264Only) await ctx.addInitScript(() => { const o = HTMLVideoElement.prototype.canPlayType; HTMLVideoElement.prototype.canPlayType = function (t) { return /av01/.test(t) ? '' : o.call(this, t); }; });
  await ctx.addInitScript(l => { try { localStorage.setItem('lucksrei.locale', l); } catch (e) {} }, locale);
  const page = await ctx.newPage();
  page.on('pageerror', e => console.error('[pageerror]', e.message));
  hits = [];
  await page.goto(base + pagePath, { waitUntil: 'load' });
  // instrumentação: amostra o vídeo visível a cada quadro (tempo, estado) e guarda os eventos de troca
  await page.evaluate(() => {
    window.__swaps = []; window.__samples = [];
    document.addEventListener('lucksrei:video-swap', e => window.__swaps.push({ ...e.detail, at: performance.now() }));
    (function tick() {
      const f = document.querySelector('video[data-loop-video]'), all = f ? f.parentNode.querySelectorAll('video[data-loop-video]') : [], v = all[all.length - 1];
      if (v) window.__samples.push({ p: performance.now(), t: v.currentTime, d: v.duration, rs: v.readyState, paused: v.paused, src: v.currentSrc, n: all.length });
      requestAnimationFrame(tick);
    })();
  });
  return { ctx, page };
}
const click = (page, l) => page.evaluate(x => document.querySelector(`.lang-btn[data-locale="${x}"]`).click(), l);
const srcLocale = s => (/loop\.(pt-BR|en|es)(\.av1)?\.mp4/.exec(s || '') || [])[1];
const state = page => page.evaluate(() => {
  const f = document.querySelector('video[data-loop-video]'), all = f ? f.parentNode.querySelectorAll('video[data-loop-video]') : [], v = all[all.length - 1];   // o de cima é o visível
  return v ? { src: v.currentSrc || v.getAttribute('src'), attr: v.getAttribute('src'), t: v.currentTime, paused: v.paused, rs: v.readyState, d: v.duration, poster: v.getAttribute('poster'), n: all.length } : null;
});

// congelamento (maior intervalo sem o tempo do vídeo visível avançar), reinício em 0 e número de players
const analyze = page => page.evaluate(() => {
  const s = window.__samples; let maxStall = 0, last = null, restarts = 0;
  for (let i = 1; i < s.length; i++) {
    const a = s[i - 1], b = s[i];
    if (b.t !== a.t && !b.paused) { if (last != null) maxStall = Math.max(maxStall, b.p - last); last = b.p; }
    if (a.src && b.src && a.src !== b.src && b.t < 0.7 && a.t > 3 && a.t < (a.d || 1e9) - 3) restarts++;
  }
  return { maxStallMs: Math.round(maxStall), srcChanges: s.filter((x, i) => i && x.src !== s[i - 1].src).length, restarts, maxPlayers: Math.max(...s.map(x => x.n)) };
});
// salto da linha do tempo na troca: tempo do 1º quadro do novo − (tempo do último quadro do antigo + tempo decorrido)
const continuity = page => page.evaluate(() => {
  const S = window.__samples, out = [];
  for (const sw of window.__swaps.filter(x => x.ok)) {
    let lastOld = null, firstNew = null;
    for (let i = 1; i < S.length; i++) if (S[i].src !== S[i - 1].src && Math.abs(S[i].p - sw.at) < 500) { lastOld = S[i - 1]; firstNew = S[i]; }
    const row = { to: sw.to, driftMs: sw.driftMs, tookMs: sw.tookMs, attempts: sw.attempts };
    if (lastOld && firstNew) {
      const D = firstNew.d || lastOld.d;
      let diff = firstNew.t - (lastOld.t + (firstNew.p - lastOld.p) / 1000);
      diff = ((diff % D) + D * 1.5) % D - D / 2;
      row.jumpMs = Math.round(diff * 1000);
    } else row.note = 'amostra da troca não encontrada';
    out.push(row);
  }
  return out;
});

async function scenario(name, fn) {
  if (only && only !== name) return;
  const t0 = Date.now(); let r;
  try { r = await fn(); r = { ok: r.ok !== false, ...r }; } catch (e) { r = { ok: false, error: String(e.message || e).slice(0, 300) }; }
  r.name = name; r.sec = +((Date.now() - t0) / 1000).toFixed(1); results.push(r);
  console.log((r.ok ? 'PASS ' : 'FAIL ') + name, JSON.stringify({ ...r, name: undefined, ok: undefined }));
}
const waitSwap = (page, n, ms = 25000) => page.waitForFunction(k => window.__swaps.filter(s => s.ok).length >= k, n, { timeout: ms });
const playingAt = (page, sec) => page.waitForFunction(m => { const v = document.querySelector('video[data-loop-video]'); return v && v.currentTime > m && !v.paused; }, sec, { timeout: 40000 });
const PAGE = '/projects/fan-hub/';

await scenario('abre-em-cada-idioma', async () => {
  const out = {};
  for (const l of ['pt-BR', 'en', 'es']) {
    const { ctx, page } = await open(l, PAGE);
    await page.waitForFunction(() => { const v = document.querySelector('video[data-loop-video]'); return v && v.readyState >= 3 && !v.paused; }, null, { timeout: 15000 });
    const st = await state(page);
    out[l] = { codec: /\.av1\./.test(st.src) ? 'av1' : 'h264', file: srcLocale(st.src), poster: (/poster\.(pt-BR|en|es)\./.exec(st.poster) || [])[1], mp4Requests: [...new Set(hits.map(srcLocale))].join(',') };
    if (out[l].file !== l || out[l].poster !== l || hits.some(h => srcLocale(h) !== l)) out.ok = false;
    await ctx.close();
  }
  return out;
});

await scenario('troca-em-reproducao', async () => {
  const { ctx, page } = await open('pt-BR', PAGE);
  await playingAt(page, 4);
  const res = [];
  for (const l of ['en', 'es', 'pt-BR']) {
    await click(page, l); await waitSwap(page, res.length + 1);
    const st = await state(page); res.push({ l, file: srcLocale(st.src), t: +st.t.toFixed(2), players: st.n, paused: st.paused });
    await sleep(2500);
  }
  const an = await analyze(page), cont = await continuity(page);
  await ctx.close();
  return { ok: res.every(r => r.file === r.l && r.players === 1 && !r.paused) && an.restarts === 0 && cont.every(c => Math.abs(c.jumpMs ?? 0) <= 70), res, ...an, continuity: cont };
});

await scenario('trocas-rapidas', async () => {
  const { ctx, page } = await open('pt-BR', PAGE);
  await playingAt(page, 3);
  for (const l of ['en', 'es', 'pt-BR', 'en']) { await click(page, l); await sleep(120); }
  await page.waitForFunction(() => window.__swaps.some(s => s.ok && s.to === 'en'), null, { timeout: 25000 });
  await sleep(2500);
  const st = await state(page), an = await analyze(page);
  const swaps = await page.evaluate(() => window.__swaps.map(s => ({ to: s.to, ok: s.ok, reason: s.reason })));
  await ctx.close();
  return { ok: srcLocale(st.src) === 'en' && st.n === 1 && !st.paused && swaps.filter(s => s.ok && s.to !== 'en').length === 0, final: srcLocale(st.src), players: st.n, swaps, ...an };
});

await scenario('sem-quadro-vazio-durante-a-troca', async () => {
  // capturas de tela do retângulo do vídeo durante a troca (~15–20/s): nenhuma pode ser lisa (preto/pôster/fundo) nem dar salto de brilho
  const { ctx, page } = await open('pt-BR', PAGE);
  await page.waitForFunction(() => { const v = document.querySelector('video[data-loop-video]'); return v.currentTime > 8.5 && v.currentTime < 10; }, null, { timeout: 40000, polling: 30 });
  const box = await page.evaluate(() => { const r = document.querySelector('video[data-loop-video]').getBoundingClientRect(); return { x: r.x, y: r.y, width: r.width, height: r.height }; });
  await click(page, 'en');
  const frames = []; const t0 = Date.now();
  while (Date.now() - t0 < 4500) {
    const buf = await page.screenshot({ clip: box, type: 'png' });
    frames.push(await page.evaluate(async b64 => {
      const bmp = await createImageBitmap(await (await fetch('data:image/png;base64,' + b64)).blob());
      const c = new OffscreenCanvas(96, 96), g = c.getContext('2d'); g.drawImage(bmp, 0, 0, 96, 96);
      const d = g.getImageData(0, 0, 96, 96).data; let s = 0, q = 0; const n = d.length / 4;
      for (let i = 0; i < d.length; i += 4) { const y = .299 * d[i] + .587 * d[i + 1] + .114 * d[i + 2]; s += y; q += y * y; }
      const m = s / n; return { m, sd: Math.sqrt(Math.max(0, q / n - m * m)) };
    }, buf.toString('base64')));
  }
  const swaps = await page.evaluate(() => window.__swaps.filter(s => s.ok).length);
  const minSd = Math.min(...frames.map(f => f.sd)), maxJump = Math.max(...frames.slice(1).map((f, i) => Math.abs(f.m - frames[i].m)));
  await ctx.close();
  return { ok: swaps === 1 && minSd > 6 && maxJump < 35, frames: frames.length, minStdDev: +minSd.toFixed(1), maxLumaJump: +maxJump.toFixed(1), swaps };
});

await scenario('troca-perto-do-fim-e-do-loop', async () => {
  const { ctx, page } = await open('pt-BR', PAGE);
  const out = [];
  for (const [phase, l] of [['fim', 'en'], ['recomeco', 'es']]) {
    await page.waitForFunction(ph => { const v = document.querySelector('video[data-loop-video]'); return ph === 'fim' ? v.currentTime > v.duration - 2.2 : v.currentTime < 0.6 && v.currentTime > 0.05; }, phase, { timeout: 45000, polling: 30 });
    await click(page, l); await waitSwap(page, out.length + 1);
    const st = await state(page); out.push({ phase, to: l, file: srcLocale(st.src), t: +st.t.toFixed(2) });
    await sleep(1500);
  }
  const cont = await continuity(page), an = await analyze(page);
  await ctx.close();
  return { ok: out.every(o => o.file === o.to) && cont.every(c => Math.abs(c.jumpMs ?? 0) <= 70), out, continuity: cont, ...an };
});

await scenario('troca-fora-da-tela', async () => {
  const { ctx, page } = await open('pt-BR', '/');
  await page.evaluate(() => document.querySelector('video[data-loop-video]').scrollIntoView({ block: 'center' }));
  await playingAt(page, 3);
  const t0 = (await state(page)).t;
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await sleep(800);
  await click(page, 'en'); await sleep(1200);
  const hidden = await page.evaluate(() => { const v = document.querySelector('video[data-loop-video]'); return { src: v.getAttribute('src'), poster: v.getAttribute('poster'), n: document.querySelectorAll('video[data-loop-video]').length }; });
  await page.evaluate(() => document.querySelector('video[data-loop-video]').scrollIntoView({ block: 'center' }));
  await page.waitForFunction(() => { const v = document.querySelector('video[data-loop-video]'); return v.getAttribute('src') && v.readyState >= 3 && !v.paused; }, null, { timeout: 20000 });
  const st = await state(page);
  await ctx.close();
  return { ok: !hidden.src && /poster\.en\./.test(hidden.poster) && srcLocale(st.src) === 'en', offscreen: hidden, resumedAt: +st.t.toFixed(2), wasAt: +t0.toFixed(2) };
});

await scenario('aba-oculta', async () => {
  const { ctx, page } = await open('pt-BR', PAGE);
  await playingAt(page, 3);
  await page.evaluate(() => { Object.defineProperty(document, 'hidden', { configurable: true, get: () => true }); document.dispatchEvent(new Event('visibilitychange')); });
  await sleep(500);
  const paused = (await state(page)).paused;
  await click(page, 'es'); await sleep(1500);
  const mid = await page.evaluate(() => ({ n: document.querySelectorAll('video[data-loop-video]').length, src: document.querySelector('video[data-loop-video]').getAttribute('src') }));
  await page.evaluate(() => { delete document.hidden; document.dispatchEvent(new Event('visibilitychange')); });
  await page.waitForFunction(() => { const v = document.querySelector('video[data-loop-video]'); return v.getAttribute('src') && /\.es\./.test(v.currentSrc) && !v.paused && v.readyState >= 3; }, null, { timeout: 20000 });
  const st = await state(page);
  await ctx.close();
  return { ok: paused && mid.n === 1 && !mid.src && srcLocale(st.src) === 'es', pausedWhileHidden: paused, whileHidden: mid, after: srcLocale(st.src) };
});

await scenario('conexao-lenta', async () => {
  throttleBps = 70 * 1024;
  const { ctx, page } = await open('pt-BR', PAGE);
  await playingAt(page, 2);
  await click(page, 'en'); await sleep(1500);
  const midSt = await state(page);
  await waitSwap(page, 1, 60000);
  const cont = await continuity(page), st = await state(page), an = await analyze(page);
  throttleBps = 0;
  await ctx.close();
  return { ok: srcLocale(midSt.src) === 'pt-BR' && !midSt.paused && srcLocale(st.src) === 'en' && an.maxStallMs < 250, stillOldAfter1_5s: srcLocale(midSt.src), final: srcLocale(st.src), ...an, continuity: cont };
});

await scenario('falha-no-download', async () => {
  const { ctx, page } = await open('pt-BR', PAGE);
  await playingAt(page, 2);
  await page.route(/loop\.es(\.av1)?\.mp4/, r => r.abort());
  await click(page, 'es');
  await page.waitForFunction(() => window.__swaps.some(s => !s.ok), null, { timeout: 15000 });
  const st = await state(page), sw = await page.evaluate(() => window.__swaps), an = await analyze(page);
  await page.unroute(/loop\.es(\.av1)?\.mp4/);
  await waitSwap(page, 1, 30000);                       // a nova tentativa automática (8 s) deve conseguir
  const st2 = await state(page);
  await ctx.close();
  return { ok: srcLocale(st.src) === 'pt-BR' && !st.paused && st.n === 1 && srcLocale(st2.src) === 'es', keptOld: srcLocale(st.src), firstFail: sw[0] && sw[0].reason, afterRetry: srcLocale(st2.src), ...an };
});

await scenario('movimento-reduzido', async () => {
  const { ctx, page } = await open('pt-BR', PAGE, { reduced: true });
  await sleep(1500);
  const a = await state(page);
  await click(page, 'es'); await sleep(800);
  const b = await state(page);
  await ctx.close();
  return { ok: hits.length === 0 && /poster\.pt-BR/.test(a.poster) && /poster\.es/.test(b.poster) && !b.attr, mp4Requests: hits.length, posterBefore: a.poster, posterAfter: b.poster };
});

await scenario('home-so-baixa-o-visivel', async () => {
  const out = {};
  for (const [label, vp, ctxo] of [['desktop', { width: 1280, height: 900 }, {}], ['mobile', { width: 390, height: 844 }, { isMobile: true, hasTouch: true, deviceScaleFactor: 2 }]]) {
    const { ctx, page } = await open('es', '/', { viewport: vp, ctx: ctxo });
    await sleep(3500);
    const initial = [...new Set(hits)].length;
    for (let i = 0; i < 7; i++) { await page.evaluate(k => document.querySelectorAll('video[data-loop-video]')[k].scrollIntoView({ block: 'center' }), i); await sleep(1300); }
    const reqs = [...new Set(hits)];
    out[label] = { carregadosAoAbrir: initial, depoisDeRolarTudo: reqs.length, locales: [...new Set(reqs.map(srcLocale))].join(','), videosNaHome: 7 };
    if (initial > 3 || reqs.length !== 7 || reqs.some(r => srcLocale(r) !== 'es')) out.ok = false;
    await ctx.close();
  }
  return out;
});

await scenario('ultimo-idioma-prevalece-em-rede-lenta', async () => {
  throttleBps = 90 * 1024;
  const { ctx, page } = await open('pt-BR', PAGE);
  await playingAt(page, 2);
  await click(page, 'en'); await sleep(700); await click(page, 'es'); await sleep(700); await click(page, 'pt-BR'); await sleep(700); await click(page, 'es');
  await page.waitForFunction(() => window.__swaps.some(s => s.ok && s.to === 'es'), null, { timeout: 60000 });
  await sleep(3000);
  const st = await state(page), swaps = await page.evaluate(() => window.__swaps.map(s => ({ to: s.to, ok: s.ok })));
  throttleBps = 0;
  await ctx.close();
  return { ok: srcLocale(st.src) === 'es' && st.n === 1 && swaps.filter(s => s.ok).every(s => s.to === 'es'), final: srcLocale(st.src), swaps };
});

fs.mkdirSync(path.join(here, 'out'), { recursive: true });
fs.writeFileSync(path.join(here, 'out', `e2e-${engine}.json`), JSON.stringify({ engine, version: browser.version(), results }, null, 1));
console.log(`\n${engine} ${browser.version()}: ${results.filter(r => r.ok).length}/${results.length} cenários ok`);
await browser.close(); server.close();
process.exit(results.every(r => r.ok) ? 0 : 1);
