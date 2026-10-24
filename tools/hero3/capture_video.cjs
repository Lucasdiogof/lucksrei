// Grava a cena do hero em vídeo, em tempo real (sem relógio falso), recortada no quadro da cena (480×300).
// uso: PW_DIR=... node tools/hero3/capture_video.cjs <url> <saida.mp4> <segundos> [desk|mob]
const { createRequire } = require('node:module');
const req = createRequire((process.env.PW_DIR || __dirname) + '/');
const { chromium } = req('playwright');
const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const [url, out, secs, dev = 'desk'] = process.argv.slice(2);
(async () => {
  const tmp = fs.mkdtempSync(path.join(path.dirname(out), '.vid-'));
  const vp = dev === 'mob' ? { width: 390, height: 844 } : { width: 1440, height: 900 };
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: vp, deviceScaleFactor: 1, recordVideo: { dir: tmp, size: vp } });
  const p = await ctx.newPage();
  const tOpen = Date.now();                        // o vídeo começa aqui; o recorte final começa quando a cena está em quadro
  const errs = []; p.on('pageerror', e => errs.push(String(e)));
  await p.goto(url, { waitUntil: 'load' });
  // o site rola suave (scroll-behavior: smooth): rolagem instantânea, espera estabilizar e confere que a cena inteira
  // está dentro da tela antes de medir o recorte (antes o recorte era medido no meio da rolagem e pegava outra seção)
  const center = () => p.evaluate(() => {
    document.documentElement.style.scrollBehavior = 'auto';
    const r = document.querySelector('.hs-stage').getBoundingClientRect();
    window.scrollTo({ top: window.scrollY + r.top - (window.innerHeight - r.height) / 2, behavior: 'instant' });
  });
  await center();
  await p.waitForSelector('.hs-canvas', { timeout: 15000 });
  await p.waitForTimeout(400);
  await center();
  await p.waitForTimeout(200);
  const box = await p.locator('.hs-stage').boundingBox();
  if (box.y < 0 || box.y + box.height > vp.height) throw new Error('cena fora da tela: ' + JSON.stringify(box));
  // a seek da v3 (se houver) volta ao começo, para v2 e v3 começarem juntas a partir do canvas
  await p.evaluate(() => { const h = document.getElementById('hero-scene').__heroScene; if (h && h.seek) h.seek(0); });
  const steps = await p.evaluate(() => { const h = document.getElementById('hero-scene').__heroScene; return h && h.steps ? { intro: h.steps.map(s => [s.id, s.t0]), loop: h.loopSteps.map(s => [s.id, s.t0]), ti: h.intro } : null; });
  const t0 = Date.now();
  const startOffset = (t0 - tOpen) / 1000;
  for (let k = 0; k < secs; k++) {                 // durante a gravação, confere a cada segundo se a cena continua no lugar
    await p.waitForTimeout(1000);
    const bb = await p.locator('.hs-stage').boundingBox();
    if (Math.abs(bb.y - box.y) > 1) { await center(); }
  }
  const video = await p.video().path();
  await ctx.close(); await b.close();
  const r = spawnSync('ffmpeg', ['-v', 'error', '-y', '-ss', startOffset.toFixed(2), '-i', video, '-vf', `crop=${Math.round(box.width)}:${Math.round(box.height)}:${Math.round(box.x)}:${Math.round(box.y)},fps=25`,
    '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-crf', '16', '-movflags', '+faststart', out], { stdio: 'inherit' });
  fs.rmSync(tmp, { recursive: true, force: true });
  fs.writeFileSync(out.replace(/\.mp4$/, '.json'), JSON.stringify({ steps, box, errs }));
  console.log(path.basename(out), 'ok', r.status, 'erros', JSON.stringify(errs));
})();
