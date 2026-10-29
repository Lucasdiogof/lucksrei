// Confere os dicionários dos vídeos (tools/video-i18n/*.json). Uso: node tools/video-i18n/check.mjs
// Erros (saída 1): campo vazio, id repetido, placeholders ou número de linhas diferentes entre idiomas,
// nome protegido que some numa tradução, texto original que não existe mais na fonte do vídeo.
// Avisos: tradução bem mais longa que o original (risco de corte) e fonte ausente (Goiás e La Pelve ficam fora do repositório).
import fs from 'node:fs';
import path from 'node:path';
import url from 'node:url';
import { execFileSync } from 'node:child_process';

const here = path.dirname(url.fileURLToPath(import.meta.url));
const repo = path.resolve(here, '..', '..');
const LANGS = ['pt-BR', 'en', 'es'];
let errors = 0, warns = 0;
const err = (v, m) => { errors++; console.log(`ERRO  ${v}: ${m}`); };
const warn = (v, m) => { warns++; console.log(`aviso ${v}: ${m}`); };

// O texto original é conferido contra a fonte PUBLICADA (origin/main, ou $VIDEO_BASE_REF): depois que o filme passa a ler o
// dicionário, os literais deixam de existir no index.html atual, mas o texto de referência continua sendo o do vídeo no ar.
function baseSource(p) {
  if (p.startsWith('../')) return null;
  try {
    const ref = process.env.VIDEO_BASE_REF || 'origin/main';
    const files = execFileSync('git', ['ls-tree', '-r', '--name-only', ref, '--', p], { cwd: repo, encoding: 'utf8' }).split('\n').filter(Boolean);
    return files.map(f => execFileSync('git', ['show', `${ref}:${f}`], { cwd: repo, encoding: 'utf8', maxBuffer: 64 << 20 })).join('\n') || null;
  } catch { return null; }
}
function readSource(p) {
  const base = baseSource(p);
  if (base) return base;
  // fontes fora do repositório (../x): FILMS_DIR aponta para a pasta que contém fan-hub-launch-film e la-pelve-launch-film
  if (p.startsWith('../') && process.env.FILMS_DIR) {
    // filmes externos já parametrizados: o texto original só existe no commit raiz (baseline)
    const [dir, ...rest] = p.slice(3).split('/'), rel = rest.join('/') || '.', cwd = path.resolve(process.env.FILMS_DIR, dir);
    try {
      const root = execFileSync('git', ['rev-list', '--max-parents=0', 'HEAD'], { cwd, encoding: 'utf8' }).trim().split('\n')[0];
      const files = execFileSync('git', ['ls-tree', '-r', '--name-only', root, '--', rel], { cwd, encoding: 'utf8' }).split('\n').filter(f => /\.(js|mjs|html|css)$/.test(f) && !/(^|\/)_v\d/.test(f));
      if (files.length) return files.map(f => execFileSync('git', ['show', root + ':' + f], { cwd, encoding: 'utf8', maxBuffer: 64 << 20 })).join('\n');
    } catch {}
  }
  const abs = p.startsWith('../') && process.env.FILMS_DIR ? path.resolve(process.env.FILMS_DIR, p.slice(3)) : path.resolve(repo, p);
  if (!fs.existsSync(abs)) return null;
  if (fs.statSync(abs).isFile()) return fs.readFileSync(abs, 'utf8');
  let s = '';
  for (const f of fs.readdirSync(abs, { recursive: true })) {
    if (/\.(js|mjs|html|css)$/.test(f) && !/node_modules|_v\d/.test(String(f))) s += fs.readFileSync(path.join(abs, String(f)), 'utf8') + '\n';
  }
  return s;
}
let srcLow = '';
// o texto pode estar em maiúsculas por CSS ou dividido em palavras soltas (['Build', 'the'])
function inSource(fr) {
  if (srcAll.includes(fr) || srcLow.includes(fr.toLowerCase())) return true;
  return fr.split(/\s+/).every(w => srcAll.includes(`'${w}'`) || srcAll.includes(`"${w}"`) || srcLow.includes(w.toLowerCase()) && w.length > 4);
}
let srcAll = '';
const ph = s => (s.match(/\{[^}]+\}/g) || []).sort().join(',');
const frags = s => s.split(/\{[^}]+\}|\n/).map(x => x.trim()).filter(x => x.replace(/[^\p{L}\p{N}]/gu, '').length >= 3);

for (const f of fs.readdirSync(here).filter(x => x.endsWith('.json')).sort()) {
  const d = JSON.parse(fs.readFileSync(path.join(here, f), 'utf8'));
  const v = d.video;
  const origin = d.origin === 'en' ? 'en' : 'pt-BR';
  const srcs = d.sources.map(readSource);
  const missing = d.sources.filter((p, i) => srcs[i] === null);
  if (missing.length) warn(v, `fonte ausente neste checkout (${missing.join(', ')}): texto original não conferido`);
  const src = srcs.filter(Boolean).join('\n');
  srcAll = src; srcLow = src.toLowerCase();
  const seen = new Set();
  for (const s of d.strings) {
    if (seen.has(s.id)) err(v, `id repetido: ${s.id}`);
    seen.add(s.id);
    for (const l of LANGS) if (typeof s[l] !== 'string' || !s[l].trim()) err(v, `${s.id}: falta ${l}`);
    if (LANGS.some(l => typeof s[l] !== 'string')) continue;
    for (const l of LANGS) {
      if (ph(s[l]) !== ph(s[origin])) err(v, `${s.id}: placeholders de ${l} diferem do original`);
      if (!(d.reflow || []).includes(s.id) && s[l].split('\n').length !== s[origin].split('\n').length) err(v, `${s.id}: número de linhas de ${l} difere do original`);
    }
    for (const p of d.protected || []) {
      if (!s[origin].includes(p)) continue;
      for (const l of LANGS) if (!s[l].includes(p)) err(v, `${s.id}: nome protegido "${p}" ausente em ${l}`);
    }
    if (src && !(d.unchecked || []).includes(s.id)) for (const fr of frags(s[origin])) if (!inSource(fr)) { err(v, `${s.id}: "${fr}" não está na fonte do vídeo`); break; }
    for (const l of LANGS) {
      if (l === origin || s[origin].length < 12) continue;
      const r = Math.max(...s[l].split('\n').map(x => x.length)) / Math.max(...s[origin].split('\n').map(x => x.length));
      if (r > 1.5) warn(v, `${s.id}: ${l} ${(r * 100) | 0}% mais longo que o original na linha mais larga (conferir layout)`);
    }
  }
  console.log(`${v}: ${d.strings.length} textos`);
}
console.log(`\n${errors} erro(s), ${warns} aviso(s)`);
process.exit(errors ? 1 : 0);
