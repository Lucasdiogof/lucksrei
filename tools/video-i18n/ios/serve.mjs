// Servidor local para testar no iPhone/iPad (mesma rede Wi-Fi). Serve o repositório inteiro (inclui tools/) com HTTP Range
// (200/206/416, mesma regra de worker/range.mjs) e atraso opcional por requisição de MP4.
//   node tools/video-i18n/ios/serve.mjs [porta=8080] [kBps de rede lenta, opcional]
// No iPhone: http://<IP do PC>:<porta>/tools/video-i18n/ios/diag.html   (ipconfig mostra o IP; firewall do Windows precisa liberar a porta)
import http from 'node:http';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import url from 'node:url';
import { parseRange } from '../../../worker/range.mjs';

const repo = path.resolve(path.dirname(url.fileURLToPath(import.meta.url)), '..', '..', '..');
const port = +process.argv[2] || 8080, slowKBps = +process.argv[3] || 0;
const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.mp4': 'video/mp4', '.webp': 'image/webp', '.svg': 'image/svg+xml', '.png': 'image/png', '.json': 'application/json', '.woff2': 'font/woff2' };
const log = [];

http.createServer((req, res) => {
  const p = decodeURIComponent(req.url.split('?')[0]);
  let f = path.join(repo, p);
  if (!f.startsWith(repo)) { res.writeHead(403); return res.end(); }
  if (fs.existsSync(f) && fs.statSync(f).isDirectory()) f = path.join(f, 'index.html');
  if (!fs.existsSync(f)) { res.writeHead(404); return res.end(); }
  const size = fs.statSync(f).size, isMp4 = f.endsWith('.mp4');
  const r = isMp4 ? parseRange(req.headers.range, size) : null;
  const h = { 'content-type': MIME[path.extname(f)] || 'application/octet-stream', 'cache-control': 'no-store' };
  if (isMp4) h['accept-ranges'] = 'bytes';
  let code = 200, start = 0, end = size - 1;
  if (r === '416') { h['content-range'] = 'bytes */' + size; res.writeHead(416, h); return res.end(); }
  if (r) { code = 206; ({ start, end } = r); h['content-range'] = `bytes ${start}-${end}/${size}`; }
  h['content-length'] = end - start + 1;
  if (isMp4) console.log(new Date().toISOString().slice(11, 23), req.socket.remoteAddress, code, req.headers.range || '-', path.basename(f));
  res.writeHead(code, h);
  const rs = fs.createReadStream(f, { start, end });
  if (!isMp4 || !slowKBps) return rs.pipe(res);
  rs.on('data', c => { rs.pause(); res.write(c); setTimeout(() => rs.resume(), c.length / (slowKBps * 1024) * 1000); });
  rs.on('end', () => res.end());
  res.on('close', () => rs.destroy());
}).listen(port, '0.0.0.0', () => {
  const ips = Object.values(os.networkInterfaces()).flat().filter(i => i.family === 'IPv4' && !i.internal).map(i => i.address);
  console.log('servindo', repo, slowKBps ? `(rede lenta: ${slowKBps} kB/s por MP4)` : '');
  ips.forEach(ip => console.log(`  iPhone → http://${ip}:${port}/tools/video-i18n/ios/diag.html`));
});
