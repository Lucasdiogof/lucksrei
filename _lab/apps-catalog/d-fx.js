/* Proposta D — polimento do /apps atual: o markup continua sendo o de assets/js/apps.js (sem mudar),
 * este arquivo só acrescenta camadas depois de cada render:
 *  - tom do produto (--t) tirado do próprio logo (ou da cor do case) → borda, luz e anel do logo por app;
 *  - luz que segue o ponteiro (--mx/--my) e borda que percorre o card no hover;
 *  - entrada escalonada ao rolar (IntersectionObserver), índice "01 · SETOR";
 *  - stack com no máximo 3 chips + "+N" (o resto vai no title);
 *  - produto com case: o card inteiro abre o case (link esticado; lojas continuam links próprios);
 *  - cabeçalho do grupo com a contagem e o fio dourado que se desenha.
 * Tudo em transform/opacity (a borda animada usa @property só durante o hover). Reduced motion: tudo parado. */
(function () {
  "use strict";
  var data = window.LUCKSREI_APPS, I = window.LucksreiI18n, root = document.getElementById("apps-root");
  if (!data || !I || !root) return;
  var CASE_TONE = { "fan-hub": "#6fcf97", "match-queue": "#2ee88a", "aprovaura": "#7fbfe0", "la-pelve": "#d59ab4" };
  var reduce = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
  var fine = window.matchMedia && matchMedia("(hover: hover) and (pointer: fine)").matches;
  var byId = {};
  data.apps.forEach(function (a) { byId[a.id] = a; });
  var toneCache = {};

  function sampleTone(app, cb) {
    if (CASE_TONE[app.id]) return cb(CASE_TONE[app.id]);
    if (app.id in toneCache) return cb(toneCache[app.id]);
    var img = new Image();
    img.onload = function () {
      try {
        var c = document.createElement("canvas"); c.width = c.height = 24;
        var x = c.getContext("2d", { willReadFrequently: true }); x.drawImage(img, 0, 0, 24, 24);
        var d = x.getImageData(0, 0, 24, 24).data, r = 0, g = 0, b = 0, n = 0;
        for (var i = 0; i < d.length; i += 4) {
          var mx = Math.max(d[i], d[i + 1], d[i + 2]), mn = Math.min(d[i], d[i + 1], d[i + 2]);
          if (d[i + 3] < 200 || mx - mn < 40 || mx < 50) continue;
          r += d[i]; g += d[i + 1]; b += d[i + 2]; n++;
        }
        toneCache[app.id] = n > 8 ? "rgb(" + Math.round(r / n) + "," + Math.round(g / n) + "," + Math.round(b / n) + ")" : null;
      } catch (e) { toneCache[app.id] = null; }
      cb(toneCache[app.id]);
    };
    img.onerror = function () { cb(null); };
    img.src = app.logo;
  }

  function pad(n) { return (n < 10 ? "0" : "") + n; }

  var io = ("IntersectionObserver" in window && !reduce) ? new IntersectionObserver(function (es) {
    es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add("d-in"); io.unobserve(e.target); } });
  }, { rootMargin: "0px 0px -8% 0px" }) : null;

  function enhanceCard(card, i) {
    if (card.getAttribute("data-d")) return;
    card.setAttribute("data-d", "1");
    var app = byId[card.getAttribute("data-app")];
    if (!app) return;
    card.classList.add("d-card");
    card.style.setProperty("--i", String(i % 12));
    sampleTone(app, function (t) { if (t) card.style.setProperty("--t", t); });

    // índice antes do setor: "01 · ESPORTES"
    var sec = card.querySelector(".app-sector");
    var idx = document.createElement("span");
    idx.className = "d-idx"; idx.textContent = pad(i + 1);
    idx.setAttribute("aria-hidden", "true");
    if (sec) sec.insertBefore(idx, sec.firstChild);
    else card.querySelector(".app-top").appendChild(idx);

    // stack: no máximo 3 chips + "+N"
    var chips = card.querySelectorAll(".app-chips .chip");
    if (chips.length > 3) {
      var rest = [];
      for (var k = 3; k < chips.length; k++) { rest.push(chips[k].textContent); chips[k].remove(); }
      var more = document.createElement("span");
      more.className = "chip d-more"; more.textContent = "+" + rest.length; more.title = rest.join(" · ");
      more.setAttribute("aria-label", rest.join(", "));
      card.querySelector(".app-chips").appendChild(more);
    }

    // case: o card inteiro vira o link do case (sem link dentro de link: o próprio .app-case é esticado)
    var c = card.querySelector(".app-case");
    if (c) card.classList.add("d-has-case");

    // camadas decorativas (aria-hidden): luz e borda viva
    var glow = document.createElement("span"); glow.className = "d-glow"; glow.setAttribute("aria-hidden", "true");
    var edge = document.createElement("span"); edge.className = "d-edge"; edge.setAttribute("aria-hidden", "true");
    card.appendChild(glow); card.appendChild(edge);

    if (fine && !reduce) {
      card.addEventListener("pointermove", function (e) {
        var r = card.getBoundingClientRect();
        card.style.setProperty("--mx", ((e.clientX - r.left) / r.width * 100).toFixed(1) + "%");
        card.style.setProperty("--my", ((e.clientY - r.top) / r.height * 100).toFixed(1) + "%");
      });
    }
    if (io) { card.classList.add("d-pre"); io.observe(card); }
  }

  function enhanceGroup(sec) {
    if (sec.getAttribute("data-d")) return;
    sec.setAttribute("data-d", "1");
    var head = sec.querySelector(".apps-group-head");
    var n = sec.querySelectorAll(".app-card").length;
    if (head) {
      head.classList.add("d-head");
      var count = document.createElement("span");
      count.className = "d-count"; count.textContent = pad(n);
      count.setAttribute("aria-hidden", "true");
      head.insertBefore(count, head.firstChild);
      var line = document.createElement("span"); line.className = "d-line"; line.setAttribute("aria-hidden", "true");
      head.appendChild(line);
      if (io) { head.classList.add("d-pre"); io.observe(head); }
    }
    sec.querySelectorAll(".app-card").forEach(enhanceCard);
  }

  function run() { root.querySelectorAll(".apps-group").forEach(enhanceGroup); }
  run();
  document.addEventListener("lucksrei:locale", function () { setTimeout(run, 0); });   // apps.js re-renderiza na troca de idioma
})();
