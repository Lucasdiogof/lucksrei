/* Vídeos de vitrine por idioma: nomes de arquivo, markup das 9 páginas e lógica pura do player. Rode: node tests/loop-video.test.js */
"use strict";
var fs = require("fs");
var path = require("path");
var root = path.join(__dirname, "..");
var failures = [];
function check(ok, msg) { if (!ok) failures.push(msg); }
function read(p) { return fs.readFileSync(path.join(root, p), "utf8"); }

var LV = require(path.join(root, "assets/js/loop-video.js"));
var LOCALES = ["en", "pt-BR", "es"];
var NAMES = ["goias-app", "aprovaura", "la-pelve", "match-queue", "bebometro", "orbijob", "busaogyn", "stockport"];

check(JSON.stringify(LV.SUPPORTED) === JSON.stringify(LOCALES), "locales do player devem ser en, pt-BR, es");
check(LV.norm("fr") === "en" && LV.norm("pt-BR") === "pt-BR", "locale desconhecido cai para en");
var u = LV.urls("goias-app", "pt-BR", true);
check(u.src === "/assets/video/goias-app-loop.pt-BR.av1.mp4?v=" + LV.VER, "url AV1: " + u.src);
check(LV.urls("goias-app", "es", false).src === "/assets/video/goias-app-loop.es.mp4?v=" + LV.VER, "url H.264");
check(LV.urls("goias-app", "en").poster === "/assets/video/goias-app-loop-poster.en.webp?v=" + LV.VER, "url do pôster");
check(Math.abs(LV.wrapDiff(0.1, 41.9, 42) - 0.2) < 1e-9, "wrapDiff atravessa o fim do loop");
check(Math.abs(LV.wrapDiff(41.9, 0.1, 42) + 0.2) < 1e-9, "wrapDiff negativo");
check(Math.abs(LV.wrapDiff(10, 10, 42)) < 1e-9, "wrapDiff zero");

// arquivos finais: 8 vídeos × 3 idiomas × (H.264, AV1, pôster)
NAMES.forEach(function (n) {
  LOCALES.forEach(function (l) {
    [LV.urls(n, l, false).src, LV.urls(n, l, true).src, LV.urls(n, l).poster].forEach(function (f) {
      check(fs.existsSync(path.join(root, f.replace(/^\//, "").replace(/\?.*$/, ""))), "arquivo ausente: " + f);
    });
  });
  // os originais publicados continuam no lugar (rollback)
  check(fs.existsSync(path.join(root, "assets/video/" + n + "-loop.mp4")), "original removido: " + n + "-loop.mp4");
});

// markup: todas as páginas usam só data-loop-video="<nome>" (sem src/poster fixos) e o mesmo script central
var pages = ["index.html", "projects/aura/index.html", "projects/bebometro/index.html", "projects/busaogyn/index.html", "projects/fan-hub/index.html", "projects/la-pelve/index.html", "projects/match-queue/index.html", "projects/orbijob/index.html", "projects/stockport/index.html"];
var seen = {};
pages.forEach(function (p) {
  var h = read(p);
  var tags = h.match(/<video\b[^>]*data-loop-video[^>]*>/g) || [];
  check(tags.length >= 1, p + ": sem vídeo de vitrine");
  tags.forEach(function (t) {
    var m = t.match(/data-loop-video="([a-z-]+)"/);
    check(!!m && NAMES.indexOf(m[1]) >= 0, p + ": data-loop-video inválido " + t);
    if (m) seen[m[1]] = true;
    check(!/\sdata-src|\ssrc=|\sposter=/.test(t), p + ": src/poster fixo no HTML (deve vir do idioma): " + t);
    check(/\bmuted\b/.test(t) && /\bloop\b/.test(t) && /playsinline/.test(t) && /preload="none"/.test(t), p + ": faltam muted/loop/playsinline/preload=none");
  });
  // sem JavaScript não há player: o pôster em inglês (idioma do texto estático) vem de um <noscript><img>, que não baixa nada com JS ligado
  var ns = h.match(new RegExp('</video><noscript><img [^>]*src="/assets/video/([a-z-]+)-loop-poster\\.en\\.webp\\?v=' + LV.VER + '"[^>]*></noscript>', 'g')) || [];
  check(ns.length === tags.length, p + ": cada vídeo precisa do <noscript> com pôster (" + ns.length + "/" + tags.length + ")");
  check((h.match(/assets\/js\/loop-video\.js/g) || []).length === 1, p + ": loop-video.js deve entrar uma vez");
});
check(NAMES.every(function (n) { return seen[n]; }), "algum vídeo não aparece em nenhuma página");

if (failures.length) { console.error("FALHOU:\n - " + failures.join("\n - ")); process.exit(1); }
console.log("ok — loop-video: " + NAMES.length * 3 * 3 + " arquivos finais, " + pages.length + " páginas");
