/* Lucksrei — microinterações da identidade "Digital Kingdom" (premium > espetáculo).
 * 1. Entrada da logo (1x por sessão): LUCKSREI aparece, a coroa assenta sobre o I, passa um reflexo; depois fica parada.
 * 2. Light follow: nos cards de produto/app, um brilho quente quase invisível acompanha o cursor (só ponteiro fino).
 * 3. Easter egg: digitar "rei", "king" ou "rey" fora de campos de texto faz a coroa da logo saudar e o reflexo passar.
 * Tudo desligado com prefers-reduced-motion. Sem dependências. */
(function () {
  "use strict";
  var root = document.documentElement;
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reduce) return;

  // 1) entrada da logo
  try {
    if (!sessionStorage.getItem("lk.brand")) {
      sessionStorage.setItem("lk.brand", "1");
      root.classList.add("brand-intro");
      setTimeout(function () { root.classList.remove("brand-intro"); }, 2400);
    }
  } catch (e) { /* storage indisponível: sem entrada */ }

  // 2) light follow (só mouse/caneta; rAF para não disparar estilo a cada evento)
  if (window.matchMedia("(hover: hover) and (pointer: fine)").matches) {
    var pending = null, target = null;
    document.addEventListener("pointermove", function (e) {
      var card = e.target.closest && e.target.closest(".work-item, .app-card");
      if (!card) return;
      target = card; pending = e;
      if (pending.__queued) return;
      pending.__queued = true;
      requestAnimationFrame(function () {
        var r = target.getBoundingClientRect();
        target.style.setProperty("--mx", (pending.clientX - r.left) + "px");
        target.style.setProperty("--my", (pending.clientY - r.top) + "px");
      });
    }, { passive: true });
  }

  // 3) easter egg discreto
  var buf = "";
  document.addEventListener("keydown", function (e) {
    var t = e.target;
    if (t && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName))) return;
    if (!e.key || e.key.length !== 1) return;
    buf = (buf + e.key.toLowerCase()).slice(-4);
    if (/(rei|rey|king)$/.test(buf)) {
      buf = "";
      root.classList.remove("kd-hail"); void root.offsetWidth;
      root.classList.add("kd-hail");
      setTimeout(function () { root.classList.remove("kd-hail"); }, 1300);
    }
  });
})();
