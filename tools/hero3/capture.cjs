// Hero v3 — grava a cena no navegador real (v2 e ?hero=v3) com relógio controlado: um PNG por tique (12/s).
// uso: PW_DIR=<pasta com node_modules/playwright> node tools/hero3/capture.cjs <url-base> <saida> <segundos> [desk|mob]
const { createRequire } = require('node:module');
const req = createRequire((process.env.PW_DIR || __dirname) + '/');
const { chromium } = req('playwright');
const fs = require('node:fs');
const [base, out, secs, dev = 'desk'] = process.argv.slice(2);
(async () => {
  fs.mkdirSync(out, { recursive: true });
  const b = await chromium.launch();
  const vp = dev === 'mob' ? { width: 390, height: 844 } : { width: 1440, height: 900 };
  const p = await b.newPage({ viewport: vp, deviceScaleFactor: 1 });
  const errs = []; p.on('pageerror', e => errs.push(String(e))); p.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });
  await p.clock.install({ time: 0 });
  await p.goto(base, { waitUntil: 'load' });
  await p.evaluate(() => { document.documentElement.setAttribute('data-theme', 'dark'); document.getElementById('hero-scene').scrollIntoView({ block: 'center' }); });
  await p.clock.runFor(1000);
  for (let i = 0; i < 50 && !(await p.evaluate(() => !!document.querySelector('.hs-canvas'))); i++) { await p.waitForTimeout(100); await p.clock.runFor(100); }
  // v3 tem seek(): cada PNG é exatamente o tique i. A v2 não tem: o relógio dela anda e registramos início e fim
  // (t0/t1 em meta.json) para o vídeo sair na velocidade certa.
  const hasSeek = await p.evaluate(() => { const h = document.getElementById('hero-scene').__heroScene; return !!(h && h.seek); });
  const t0 = await p.evaluate(() => { const h = document.getElementById('hero-scene').__heroScene; return h ? h.time() : 0; });
  const stage = p.locator('.hs-stage');
  const n = Math.round(secs * 12);
  for (let i = 0; i < n; i++) {
    if (hasSeek) { await p.evaluate(t => document.getElementById('hero-scene').__heroScene.seek(t), i / 12); await p.clock.runFor(1); }
    else await p.clock.runFor(1000 / 12);
    await stage.screenshot({ path: `${out}/${String(i).padStart(4, '0')}.png` });
  }
  const t1 = await p.evaluate(() => { const h = document.getElementById('hero-scene').__heroScene; return h ? h.time() : 0; });
  fs.writeFileSync(`${out}/meta.json`, JSON.stringify({ seek: hasSeek, t0, t1, n, fps: hasSeek ? 12 : n / Math.max(1e-6, t1 - t0) }));
  const t = await p.evaluate(() => { const h = document.getElementById('hero-scene').__heroScene; return h ? h.time() : null; });
  console.log(dev, base, 'frames', n, 'clock', t, 'errors', JSON.stringify(errs));
  await b.close();
})();
