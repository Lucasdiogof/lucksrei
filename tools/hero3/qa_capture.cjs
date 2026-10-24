// Captura a página de comparação (tools/hero3/qa/perfil.html) no navegador real: PNG por modo e vídeo a 12 q/s.
// uso: PW_DIR=... node tools/hero3/qa_capture.cjs <saida> <segundos>
const { createRequire } = require('node:module');
const req = createRequire((process.env.PW_DIR || __dirname) + '/');
const { chromium } = req('playwright');
const fs = require('node:fs');
const [out, secs] = process.argv.slice(2);
(async () => {
  fs.mkdirSync(out, { recursive: true });
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 1560, height: 420 }, deviceScaleFactor: 1 });
  const errs = []; p.on('pageerror', e => errs.push(String(e))); p.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });
  for (const mode of (process.env.MODES || 'parado,andar,giro,rot360').split(',')) {
    await p.goto(`http://localhost:8765/tools/hero3/qa/perfil.html?mode=${mode}&t=0`);
    await p.waitForSelector('body[data-ready="1"]');
    const row = p.locator('#row');
    const n = mode === 'parado' ? 1 : Math.round(secs * 12);
    fs.mkdirSync(`${out}/${mode}`, { recursive: true });
    for (let i = 0; i < n; i++) {
      await p.evaluate(t => window.__render(t), i / 12);
      await row.screenshot({ path: `${out}/${mode}/${String(i).padStart(4, '0')}.png` });
    }
  }
  console.log('erros', JSON.stringify(errs));
  await b.close();
})();
