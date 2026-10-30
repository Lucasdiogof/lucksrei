// Monta .preview/ (ignorado pelo Git e pelo deploy do site) com o site publicável + a página de diagnóstico em /diag/.
//   node tools/video-i18n/ios/prepare-preview.mjs
import fs from 'node:fs';
import path from 'node:path';
import url from 'node:url';

const here = path.dirname(url.fileURLToPath(import.meta.url));
const repo = path.resolve(here, '..', '..', '..');
const out = path.join(repo, '.preview');
const skip = new Set(['.git', '.github', '.preview', '.wrangler', '.review', 'node_modules', 'tools', 'tests', 'docs', 'worker', 'migrations']);
fs.rmSync(out, { recursive: true, force: true });
fs.mkdirSync(out);
for (const e of fs.readdirSync(repo)) if (!skip.has(e)) fs.cpSync(path.join(repo, e), path.join(out, e), { recursive: true });   // por item: cpSync não copia uma pasta para dentro dela mesma
fs.mkdirSync(path.join(out, 'diag'));
for (const f of ['diag.html', 'diag.js', 'diag.css']) fs.copyFileSync(path.join(here, f), path.join(out, 'diag', f));
console.log('.preview pronto:', fs.readdirSync(out).length, 'itens na raiz; página de diagnóstico em /diag/diag.html');
