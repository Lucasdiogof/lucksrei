/* Lucksrei — vídeos de vitrine em loop (tipo GIF):
 * <video data-loop-video data-src="….mp4" data-src-av1="….av1.mp4" poster="…" muted loop playsinline preload="none">.
 * Nada é baixado antes de a página terminar de carregar; depois, o arquivo só vem quando o vídeo chega perto da tela.
 * AV1 (mais leve na mesma qualidade) quando o navegador toca; senão o MP4 H.264.
 * Toca visível e pausa fora dela ou com a aba oculta.
 * prefers-reduced-motion ou economia de dados: não baixa nem toca — fica o pôster. */
(function () {
  "use strict";
  var vids = document.querySelectorAll("video[data-loop-video]");
  if (!vids.length) return;
  var mql = window.matchMedia("(prefers-reduced-motion: reduce)");
  if (mql.matches || !("IntersectionObserver" in window)) return;
  var conn = navigator.connection;
  if (conn && conn.saveData) return;
  var av1 = vids[0].canPlayType('video/mp4; codecs="av01.0.05M.08"') === "probably";

  function load(v) {
    if (v.getAttribute("src")) return;
    v.src = (av1 && v.getAttribute("data-src-av1")) || v.getAttribute("data-src");
    v.preload = "auto";
  }
  function play(v) {
    load(v);
    var p = v.play();
    if (p && p.catch) p.catch(function () { /* autoplay bloqueado: fica o pôster */ });
  }

  function start() {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        var v = en.target;
        v.__visible = en.isIntersecting;
        if (en.isIntersecting && !document.hidden) play(v); else v.pause();
      });
    }, { rootMargin: "200px 0px", threshold: 0.01 });
    vids.forEach(function (v) { io.observe(v); });
  }
  if (document.readyState === "complete") start(); else window.addEventListener("load", start);

  document.addEventListener("visibilitychange", function () {
    vids.forEach(function (v) { if (document.hidden) v.pause(); else if (v.__visible) play(v); });
  });
  if (mql.addEventListener) mql.addEventListener("change", function (e) {
    if (e.matches) vids.forEach(function (v) { v.pause(); });
  });
})();
