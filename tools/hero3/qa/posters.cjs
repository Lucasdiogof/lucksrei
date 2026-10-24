// pôsteres da v3 a partir do próprio canvas (240×150 lógicos): vazio (abertura) e final (sentado programando).
// uso: node tools/hero3/qa/csp-server.cjs <repo> 8766 & node tools/hero3/qa/posters.cjs <saida>; depois
// python3 tools/hero3/qa/posters_save.py <saida> (paleta exata, sem perda) grava assets/img/hero/poster-*.png
const { createRequire } = require('node:module');
const { chromium } = createRequire((process.env.PW_DIR || __dirname) + '/')('playwright');
const fs = require('fs');
const [out] = process.argv.slice(2);
(async () => {
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
  const msgs = []; p.on('console', m => { if (m.type() === 'error' || m.type() === 'warning') msgs.push(m.text()); }); p.on('pageerror', e => msgs.push(String(e)));
  await p.goto('http://localhost:8766/', { waitUntil: 'load' });
  await p.evaluate(() => { document.documentElement.style.scrollBehavior = 'auto'; document.querySelector('.hs-stage').scrollIntoView({ block: 'center' }); });
  await p.waitForFunction(() => { const h = document.getElementById('hero-scene').__heroScene; return h && h.seek; });
  for (const [name, t] of [['poster-empty', 1.5], ['poster-final', 23]]) {
    const data = await p.evaluate(t => { const h = document.getElementById('hero-scene').__heroScene; h.seek(t); const c = document.querySelector('.hs-canvas'); return [c.width, c.height, c.toDataURL('image/png')]; }, t);
    fs.writeFileSync(`${out}/${name}.png`, Buffer.from(data[2].split(',')[1], 'base64'));
    console.log(name, data[0] + 'x' + data[1]);
  }
  console.log('console:', JSON.stringify(msgs));
  await b.close();
})();
