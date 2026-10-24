// QA da Fase F (cena v3 como padrão), servida com a CSP real (tools/hero3/qa/csp-server.cjs na porta 8766).
// uso: PW_DIR=... node tools/hero3/qa/qa_final.cjs <saida>
const { createRequire } = require('node:module');
const { chromium } = createRequire((process.env.PW_DIR || __dirname) + '/')('playwright');
const fs = require('fs');
const URL = 'http://localhost:8766/';
const out = process.argv[2];
const VPS = [['1440x900', 1440, 900], ['1280x800', 1280, 800], ['768x1024', 768, 1024], ['390x844', 390, 844]];
const R = { viewports: {}, checks: {} };
async function open(b, vp, opts = {}) {
  const ctx = await b.newContext(Object.assign({ viewport: { width: vp[1], height: vp[2] } }, opts));
  const p = await ctx.newPage();
  const errs = [];
  p.on('pageerror', e => errs.push('pageerror: ' + e));
  p.on('console', m => { if (m.type() === 'error') errs.push('console: ' + m.text()); });
  await p.goto(URL + (opts.qs || ''), { waitUntil: 'load' });
  await p.evaluate(() => { document.documentElement.style.scrollBehavior = 'auto'; document.querySelector('.hs-stage').scrollIntoView({ block: 'center' }); });
  return { ctx, p, errs };
}
const seek = (p, t) => p.evaluate(t => document.getElementById('hero-scene').__heroScene.seek(t), t);
(async () => {
  const b = await chromium.launch();
  // 1) viewports: momentos-chave, estouro horizontal, posição do botão
  for (const vp of VPS) {
    const { ctx, p, errs } = await open(b, vp);
    await p.waitForFunction(() => { const h = document.getElementById('hero-scene').__heroScene; return h && h.seek; });
    const shots = [];
    for (const t of [1.5, 10, 23, 46.3, 70.6]) {
      await seek(p, t); await p.waitForTimeout(450);
      const f = `${out}/vp-${vp[0]}-${t}.png`; await p.locator('.hero-scene').screenshot({ path: f }); shots.push(f);
    }
    const m = await p.evaluate(() => {
      const st = document.querySelector('.hs-stage').getBoundingClientRect(), r = document.querySelector('.hs-replay');
      const rb = r.getBoundingClientRect(), h = document.querySelector('.hs-hello.is-on');
      return { overflowX: document.documentElement.scrollWidth > window.innerWidth, stage: [Math.round(st.width), Math.round(st.height)],
        replayInside: rb.left >= st.left && rb.right <= st.right && rb.top >= st.top && rb.bottom <= st.bottom,
        replayPos: getComputedStyle(r).position, canvas: [document.querySelector('.hs-canvas').width, document.querySelector('.hs-canvas').height] };
    });
    R.viewports[vp[0]] = Object.assign(m, { errors: errs });
    await ctx.close();
  }
  // 2) idiomas: fala 1 e 2 cabem no balão (desktop e celular)
  R.checks.locales = {};
  for (const vp of [VPS[0], VPS[3]]) for (const loc of ['pt-BR', 'en', 'es']) {
    const { ctx, p, errs } = await open(b, vp);
    await p.waitForFunction(() => window.LucksreiI18n && document.getElementById('hero-scene').__heroScene);
    await p.evaluate(l => window.LucksreiI18n.setLocale(l), loc);
    const res = [];
    for (const t of [10, 17]) {
      await seek(p, t); await p.waitForTimeout(450);
      res.push(await p.evaluate(() => { const h = document.querySelector('.hs-hello.is-on'), s = document.querySelector('.hs-stage').getBoundingClientRect();
        if (!h) return null; const r = h.getBoundingClientRect(); return { inside: r.left >= s.left && r.right <= s.right && r.top >= s.top && r.bottom <= s.bottom, text: h.innerText.slice(0, 40) }; }));
      await p.locator('.hero-scene').screenshot({ path: `${out}/loc-${vp[0]}-${loc}-${t}.png` });
    }
    const label = await p.evaluate(() => document.querySelector('.hs-replay').getAttribute('aria-label'));
    R.checks.locales[vp[0] + ' ' + loc] = { bubbles: res, replayLabel: label, errors: errs };
    await ctx.close();
  }
  // 3) movimento reduzido: só o pôster final, nada da cena carrega
  {
    const { ctx, p, errs } = await open(b, VPS[0], { reducedMotion: 'reduce' });
    await p.waitForTimeout(1200);
    R.checks.reducedMotion = await p.evaluate(() => ({ poster: document.querySelector('.hs-poster').src.split('/').pop(), canvas: !!document.querySelector('.hs-canvas'),
      replay: !!document.querySelector('.hs-replay'), heroAssets: performance.getEntriesByType('resource').filter(r => r.name.includes('/hero/v3/')).length }));
    R.checks.reducedMotion.errors = errs;
    await p.locator('.hero-scene').screenshot({ path: `${out}/reduced-motion.png` });
    await ctx.close();
  }
  // 4) sem JavaScript: pôster final pelo <noscript> (estilo com hash na CSP)
  {
    const { ctx, p, errs } = await open(b, VPS[0], { javaScriptEnabled: false });
    await p.waitForTimeout(800);
    await p.locator('.hero-scene').screenshot({ path: `${out}/no-js.png` });
    R.checks.noJs = { errors: errs, cssContent: await p.evaluate(() => getComputedStyle(document.querySelector('.hs-poster')).content) };
    await ctx.close();
  }
  // 5) pausa fora da tela e retomada; botão rever (teclado); custo de desenho; bytes; heap
  {
    const { ctx, p, errs } = await open(b, VPS[0]);
    await p.waitForFunction(() => { const h = document.getElementById('hero-scene').__heroScene; return h && h.seek; });
    await p.waitForTimeout(1500);
    const t1 = await p.evaluate(() => document.getElementById('hero-scene').__heroScene.time());
    await p.evaluate(() => window.scrollTo(0, document.body.scrollHeight)); await p.waitForTimeout(1500);
    const t2 = await p.evaluate(() => document.getElementById('hero-scene').__heroScene.time());
    await p.evaluate(() => document.querySelector('.hs-stage').scrollIntoView({ block: 'center' })); await p.waitForTimeout(1200);
    const t3 = await p.evaluate(() => document.getElementById('hero-scene').__heroScene.time());
    await seek(p, 40); await p.waitForTimeout(600);
    await p.locator('.hs-replay').focus(); await p.keyboard.press('Enter'); await p.waitForTimeout(100);
    const tr = await p.evaluate(() => document.getElementById('hero-scene').__heroScene.time());
    const perf = await p.evaluate(() => { const h = document.getElementById('hero-scene').__heroScene, n = 600, a = performance.now();
      for (let i = 0; i < n; i++) h.seek(i * 0.143 % 86); return (performance.now() - a) / n; });
    const bytes = await p.evaluate(() => performance.getEntriesByType('resource').filter(r => /hero/.test(r.name)).map(r => [r.name.split('/assets/')[1], r.encodedBodySize]));
    const cdp = await ctx.newCDPSession(p); await cdp.send('HeapProfiler.collectGarbage');
    const heap = (await cdp.send('Runtime.getHeapUsage')).usedSize;
    R.checks.runtime = { pauseOffscreen: { before: +t1.toFixed(2), whileHidden: +t2.toFixed(2), back: +t3.toFixed(2) }, replayAfter: +tr.toFixed(2),
      drawMsPerFrame: +perf.toFixed(3), heroBytes: bytes, heroTotalKB: +(bytes.reduce((s, x) => s + x[1], 0) / 1024).toFixed(1), heapMB: +(heap / 1048576).toFixed(1), errors: errs };
    await ctx.close();
  }
  // 6) reserva ?hero=v2 (cena anterior) e ?scene=v2
  for (const qs of ['?hero=v2', '?scene=v2']) {
    const { ctx, p, errs } = await open(b, VPS[0], { qs });
    await p.waitForTimeout(2500);
    R.checks['fallback ' + qs] = await p.evaluate(() => ({ canvas: !!document.querySelector('.hs-canvas'), poster: document.querySelector('.hs-poster').src.split('/').pop(),
      v3: !!(document.getElementById('hero-scene').__heroScene && document.getElementById('hero-scene').__heroScene.version), scripts: [...document.scripts].map(s => s.src.split('/').pop()).filter(s => /hero/.test(s)) }));
    R.checks['fallback ' + qs].errors = errs;
    await p.locator('.hero-scene').screenshot({ path: `${out}/fallback-${qs.slice(1).replace('=', '-')}.png` });
    await ctx.close();
  }
  fs.writeFileSync(`${out}/qa.json`, JSON.stringify(R, null, 2));
  console.log(JSON.stringify(R, null, 1));
  await b.close();
})();
