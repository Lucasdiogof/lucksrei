/* Lucksrei — microinterações da identidade "Digital Kingdom" (premium > espetáculo).
 * 1. Entrada da logo (1x por sessão): LUCKSREI aparece, a coroa assenta sobre o I, passa um reflexo; depois fica parada.
 * 2. Light follow: nos cards de produto/app, um brilho quente quase invisível acompanha o cursor (só ponteiro fino).
 * 3. Easter egg: digitar "rei", "king" ou "rey" fora de campos de texto faz a coroa da logo saudar e o reflexo passar.
 * Tudo desligado com prefers-reduced-motion. Sem dependências. */
(function () {
  "use strict";
  var root = document.documentElement;
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // 0) AMBIENTE VIVO (versão leve; CSS: bloco "AMBIENTE VIVO" no fim de style.css). Luz parada + poucas partículas
  //    nas margens que acendem e somem e, a cada ciclo, reaparecem em outro lugar. No celular, nenhuma partícula.
  //    Os 4 apps principais ganham halo e moldura fina (parados; a moldura acende no hover).
  try { ambient(); } catch (e) { /* decorativo: nunca quebra a página */ }
  function ambient() {
    var path = location.pathname;
    var page = /^\/(index\.html)?$/.test(path) ? "home" : /^\/apps\//.test(path) ? "apps"
      : /^\/projects\/[^/]+\/?$/.test(path) ? "case" : /^\/visitors\//.test(path) ? "visitors"
      : /^\/contact\//.test(path) ? "contact" : "quiet";
    root.setAttribute("data-amb", page);
    var n = window.matchMedia("(max-width: 600px)").matches ? 0
      : { home: 6, apps: 6, contact: 6, "case": 4, visitors: 3, quiet: 3 }[page];
    var R = Math.random;
    function rnd(a, b) { return a + R() * (b - a); }
    function place(el) {                                  // só nas margens: a coluna de leitura fica limpa
      el.style.setProperty("--x", (R() < 0.5 ? rnd(1.5, 13) : rnd(87, 98.5)).toFixed(1) + "%");
      el.style.setProperty("--y", rnd(6, 94).toFixed(1) + "%");
    }
    var amb = document.createElement("div");
    amb.className = "amb";
    amb.setAttribute("aria-hidden", "true");
    amb.appendChild(Object.assign(document.createElement("div"), { className: "amb-glow" }));
    amb.appendChild(Object.assign(document.createElement("div"), { className: "amb-beam" }));   // feixe de luz diagonal (parado)
    for (var i = 0; i < n; i++) {
      var p = document.createElement("i");
      var gold = i % 4 === 3;
      p.className = "amb-p" + (i % 2 ? " v2" : "") + (gold ? " is-gold" : "");
      place(p);
      p.style.setProperty("--s", (gold ? rnd(1.6, 2.2) : rnd(1.2, 2.2)).toFixed(1) + "px");
      p.style.setProperty("--o", rnd(.4, .8).toFixed(2));
      p.style.setProperty("--d", rnd(8, 14).toFixed(1) + "s");
      p.style.setProperty("--dl", (-rnd(0, 12)).toFixed(1) + "s");
      if (!reduce) p.addEventListener("animationiteration", function () { place(this); });
      amb.appendChild(p);
    }
    document.body.insertBefore(amb, document.body.firstChild);

    // apps principais: home (.work-item[data-product]) e /apps/ (.app-card.is-own, renderizados antes pelo apps.js)
    var KIND = { "fan-hub": "goias", "match-queue": "mq", "aura": "aura", "aprovaura": "aura", "la-pelve": "pelve" };
    function decorate(card) {
      if (card.classList.contains("has-fx")) return;
      var kind = KIND[card.getAttribute("data-product") || card.getAttribute("data-app")];
      if (!kind) return;
      card.classList.add("has-fx");
      card.setAttribute("data-fx", kind);
      var back = document.createElement("span"); back.className = "fx-back"; back.setAttribute("aria-hidden", "true");
      back.appendChild(Object.assign(document.createElement("span"), { className: "fx-halo" }));
      var front = document.createElement("span"); front.className = "fx-front"; front.setAttribute("aria-hidden", "true");
      front.appendChild(Object.assign(document.createElement("span"), { className: "fx-ring" }));
      card.insertBefore(back, card.firstChild);
      card.appendChild(front);
    }
    function scan() {
      var cards = document.querySelectorAll(".work-item[data-product], .app-card.is-own[data-app]");
      for (var i = 0; i < cards.length; i++) decorate(cards[i]);
    }
    scan();
    // /apps/: o apps.js recria os cards a cada troca de idioma
    if (page === "apps") document.addEventListener("lucksrei:locale", scan);
  }

  if (reduce) return;

  // 1) entrada da logo
  try {
    if (!sessionStorage.getItem("lk.brand")) {
      sessionStorage.setItem("lk.brand", "1");
      root.classList.add("brand-intro");
      setTimeout(function () { root.classList.remove("brand-intro"); }, 2400);
    }
  } catch (e) { /* storage indisponível: sem entrada */ }

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
