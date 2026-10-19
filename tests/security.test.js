/* Segurança do site estático: _headers, CSP e inventário de recursos. Rode: node tests/security.test.js */
"use strict";
var fs = require("fs");
var path = require("path");
var crypto = require("crypto");
var cp = require("child_process");
var root = path.join(__dirname, "..");
var failures = [];
function check(ok, msg) { if (!ok) failures.push(msg); }
function read(p) { return fs.readFileSync(path.join(root, p), "utf8"); }
var SH = require("./helpers/static-headers.js");

var text = read("_headers");
var rules = SH.parse(text);
var h = SH.headersFor(rules, "/index.html");

// ---- cabeçalhos presentes em toda página
check(h["x-content-type-options"] === "nosniff", "X-Content-Type-Options: nosniff");
check(/^(strict-origin-when-cross-origin|no-referrer|same-origin|strict-origin)$/.test(h["referrer-policy"] || ""), "Referrer-Policy restritivo");
check(h["x-frame-options"] === "DENY", "X-Frame-Options: DENY (fallback do frame-ancestors)");
check(/camera=\(\)/.test(h["permissions-policy"] || "") && /microphone=\(\)/.test(h["permissions-policy"]) && /geolocation=\(\)/.test(h["permissions-policy"]), "Permissions-Policy desliga câmera, microfone e localização");
check(h["cross-origin-opener-policy"] === "same-origin", "COOP same-origin");
var hsts = h["strict-transport-security"] || "";
check(/^max-age=\d+$/.test(hsts), "HSTS só com max-age (sem includeSubDomains nem preload): " + hsts);
check(Number(hsts.split("=")[1]) >= 86400 && Number(hsts.split("=")[1]) <= 31536000, "HSTS conservador (1 dia a 1 ano)");
// CSP completa aplicada (458bf53 tirou do Report-Only): sem curingas e sem execução insegura
var csp = h["content-security-policy"] || "";
check(/frame-ancestors 'none'/.test(csp) && /object-src 'none'/.test(csp) && /base-uri 'self'/.test(csp) && /form-action 'self'/.test(csp), "CSP aplicada: frame-ancestors, object-src, base-uri, form-action");
check(!h["content-security-policy-report-only"], "sem política Report-Only duplicada (a completa já é aplicada)");
var ro = csp;
var dirs = {};
ro.split(";").forEach(function (d) { d = d.trim(); if (d) dirs[d.split(/\s+/)[0]] = d.split(/\s+/).slice(1); });
check(dirs["default-src"] && dirs["default-src"].join() === "'self'", "default-src 'self'");
check(!/\*/.test(ro.replace(/'sha256-[^']+'/g, "")), "sem curinga na CSP");
check(!/unsafe-eval/.test(ro), "sem unsafe-eval");
check(!(dirs["script-src"] || []).some(function (v) { return /unsafe-inline|data:|blob:/.test(v); }), "script-src sem unsafe-inline");
check(!(dirs["style-src"] || []).some(function (v) { return /unsafe-inline/.test(v); }), "style-src sem unsafe-inline (usa hash)");
check((dirs["style-src-attr"] || []).join() === "'unsafe-inline'", "style=\"\" liberado só em style-src-attr");
var hosts = (ro.match(/https?:\/\/[^\s;]+/g) || []).filter(function (x, i, a) { return a.indexOf(x) === i; });
check(hosts.join() === "https://challenges.cloudflare.com", "único host externo: Turnstile (" + hosts.join() + ")");
check((dirs["frame-ancestors"] || []).join() === "'none'" && (dirs["object-src"] || []).join() === "'none'", "frame-ancestors e object-src 'none'");

// ---- cada hash da CSP corresponde a um <style> inline real, e cada <style> inline tem hash
var ignore = read(".assetsignore").split(/\r?\n/).map(function (s) { return s.trim(); }).filter(Boolean);
var htmlFiles = cp.execFileSync("git", ["ls-files", "*.html"], { cwd: root }).toString().split("\n").filter(Boolean).filter(function (f) {
  return !ignore.some(function (i) { return f === i || f.indexOf(i + "/") === 0; });
});
var inlineStyleHashes = {};
var external = [];
var inlineScripts = [];
var handlers = [];
htmlFiles.forEach(function (f) {
  var s = read(f);
  (s.match(/<style\b[^>]*>[\s\S]*?<\/style>/g) || []).forEach(function (b) {
    var body = b.replace(/^<style\b[^>]*>/, "").replace(/<\/style>$/, "").replace(/\r\n/g, "\n"); // o git guarda LF; checkout no Windows vira CRLF
    inlineStyleHashes["sha256-" + crypto.createHash("sha256").update(body, "utf8").digest("base64")] = f;
  });
  (s.match(/<script\b[^>]*>[\s\S]*?<\/script>/g) || []).forEach(function (b) {
    var open = b.match(/^<script\b[^>]*>/)[0];
    if (/application\/ld\+json/.test(open)) return;
    if (!/\ssrc="/.test(open)) inlineScripts.push(f);
    var src = (open.match(/\ssrc="([^"]+)"/) || [])[1];
    if (src && /^(https?:)?\/\//.test(src)) external.push(f + " script " + src);
  });
  if (/\son[a-z]+="/i.test(s)) handlers.push(f);
  (s.match(/<(link|img|source|video|audio|iframe|embed|object)\b[^>]*>/g) || []).forEach(function (t) {
    var m = t.match(/\s(?:href|src|poster|data-src|data-src-av1)="((?:https?:)?\/\/[^"]+)"/g);
    if (m && !/rel="canonical"|rel="alternate"/.test(t)) external.push(f + " " + t.slice(0, 60));
  });
  if (/<iframe\b/i.test(s)) external.push(f + " iframe");
});
var cspHashes = (ro.match(/'sha256-[^']+'/g) || []).map(function (x) { return x.slice(1, -1); });
Object.keys(inlineStyleHashes).forEach(function (hh) { check(cspHashes.indexOf(hh) >= 0, "<style> inline sem hash na CSP (" + inlineStyleHashes[hh] + "): " + hh); });
cspHashes.forEach(function (hh) { check(inlineStyleHashes[hh], "hash da CSP sem <style> correspondente (sobrou?): " + hh); });
check(inlineScripts.length === 0, "nenhum <script> inline executável nas páginas publicadas: " + inlineScripts.join(", "));
check(handlers.length === 0, "nenhum handler on*= inline: " + handlers.join(", "));
check(external.length === 0, "nenhum recurso externo carregado pelas páginas: " + external.join(" | "));

// ---- CSS/JS publicados não puxam nada de fora
var css = read("assets/css/style.css");
check(!/@import|url\(\s*['"]?(https?:)?\/\//.test(css), "CSS sem @import nem url() externo");
var jsFiles = fs.readdirSync(path.join(root, "assets/js")).filter(function (f) { return /\.js$/.test(f); });
jsFiles.forEach(function (f) {
  var s = read("assets/js/" + f);
  check(!/\beval\(|new Function\(|setTimeout\(\s*['"]|setInterval\(\s*['"]/.test(s), f + ": sem eval/new Function/timer com string");
  check(!/document\.write\(/.test(s) || f === "i18n-boot.js", f + ": document.write só no i18n-boot (carrega o dicionário do próprio site)");
  check(!/importScripts|new Worker\(|WebSocket\(/.test(s), f + ": sem worker/websocket");
});

// ---- regras antigas preservadas e limites do Cloudflare
check((SH.headersFor(rules, "/.well-known/apple-app-site-association")["content-type"] || "") === "application/json", "AASA continua application/json");
check(h["content-type"] === undefined, "o curinga não força Content-Type em páginas");
text.split(/\r?\n/).forEach(function (l, i) { check(l.length <= 2000, "_headers linha " + (i + 1) + " passa de 2000 caracteres"); });
check(rules.length <= 100, "no máximo 100 regras no _headers");
["tools", "docs", "tests", "worker", "migrations", "wrangler.jsonc"].forEach(function (d) { check(ignore.indexOf(d) >= 0, ".assetsignore deve ignorar " + d); });

if (failures.length) { console.error("FALHOU:\n - " + failures.join("\n - ")); process.exit(1); }
console.log("ok — security/headers: " + htmlFiles.length + " páginas publicadas sem recurso externo, sem script inline e com os " + cspHashes.length + " hashes de <style> na CSP; HSTS " + hsts);
