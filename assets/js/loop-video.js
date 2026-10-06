/* Lucksrei — vídeos de vitrine em loop (tipo GIF): <video data-loop-video data-src="…" poster="…" muted loop playsinline>.
 * O arquivo só é baixado quando o vídeo chega perto da tela; toca visível e pausa fora dela ou com a aba oculta.
 * prefers-reduced-motion: não baixa nem toca — fica o pôster. */
(function () {
  "use strict";
  var vids = document.querySelectorAll("video[data-loop-video]");
  if (!vids.length) return;
  var mql = window.matchMedia("(prefers-reduced-motion: reduce)");
  if (mql.matches || !("IntersectionObserver" in window)) return;

  function load(v) {
    if (v.getAttribute("src")) return;
    v.src = v.getAttribute("data-src");
    v.preload = "auto";
  }
  function play(v) {
    load(v);
    var p = v.play();
    if (p && p.catch) p.catch(function () { /* autoplay bloqueado: fica o pôster */ });
  }

  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (en) {
      var v = en.target;
      v.__visible = en.isIntersecting;
      if (en.isIntersecting && !document.hidden) play(v); else v.pause();
    });
  }, { rootMargin: "200px 0px", threshold: 0.01 });
  vids.forEach(function (v) { io.observe(v); });

  document.addEventListener("visibilitychange", function () {
    vids.forEach(function (v) { if (document.hidden) v.pause(); else if (v.__visible) play(v); });
  });
  if (mql.addEventListener) mql.addEventListener("change", function (e) {
    if (e.matches) vids.forEach(function (v) { v.pause(); });
  });
})();
