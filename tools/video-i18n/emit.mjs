// Gera tools/video-<pasta>/i18n.js a partir do dicionário (tools/video-i18n/<video>.json).
// Uso: node tools/video-i18n/emit.mjs <video> <pasta-do-filme>   ex.: node tools/video-i18n/emit.mjs busaogyn tools/video-busaogyn
// O filme lê window.VIDEO_I18N[id][idioma] e escolhe o idioma por ?lang=pt-BR|en|es (padrão pt-BR).
import fs from 'node:fs';
import path from 'node:path';
import url from 'node:url';

const here = path.dirname(url.fileURLToPath(import.meta.url));
const repo = path.resolve(here, '..', '..');
const [video, dir] = process.argv.slice(2);
if (!video || !dir) { console.error('uso: node emit.mjs <video> <pasta-do-filme>'); process.exit(2); }
const d = JSON.parse(fs.readFileSync(path.join(here, video + '.json'), 'utf8'));
const out = {};
for (const s of d.strings) out[s.id] = { 'pt-BR': s['pt-BR'], en: s.en, es: s.es, ...(s.fit ? { fit: s.fit } : {}) };
const body = '// GERADO por tools/video-i18n/emit.mjs a partir de tools/video-i18n/' + video + '.json — não edite à mão.\n' +
  'window.VIDEO_I18N = ' + JSON.stringify(out, null, 1) + ';\n';
fs.writeFileSync(path.join(repo, dir, 'i18n.js'), body);
console.log('i18n.js:', Object.keys(out).length, 'textos →', path.join(dir, 'i18n.js'));
