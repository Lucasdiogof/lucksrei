// servidor estático de QA que aplica os cabeçalhos de /* do _headers (CSP real da produção)
const http = require('http'), fs = require('fs'), path = require('path');
const ROOT = process.argv[2], PORT = +process.argv[3] || 8766;
const lines = fs.readFileSync(path.join(ROOT, '_headers'), 'utf8').split('\n');
const H = {}; let on = false;
for (const l of lines) { if (/^\S/.test(l)) on = l.trim() === '/*'; else if (on && l.includes(':')) { const i = l.indexOf(':'); H[l.slice(0, i).trim()] = l.slice(i + 1).trim(); } }
const T = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.json': 'application/json', '.svg': 'image/svg+xml', '.woff2': 'font/woff2', '.ico': 'image/x-icon', '.webp': 'image/webp', '.mp4': 'video/mp4', '.jpg': 'image/jpeg' };
http.createServer((q, r) => {
  let p = decodeURIComponent(q.url.split('?')[0]); if (p.endsWith('/')) p += 'index.html';
  const f = path.join(ROOT, p);
  if (!f.startsWith(ROOT) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { r.writeHead(404); return r.end(); }
  r.writeHead(200, Object.assign({ 'Content-Type': T[path.extname(f)] || 'application/octet-stream' }, H));
  fs.createReadStream(f).pipe(r);
}).listen(PORT, () => console.log('csp-server', PORT, Object.keys(H).length, 'headers'));
