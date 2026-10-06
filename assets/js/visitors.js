/* Lucksrei — página /visitors/: mapa-múndi, indicadores e ranking.
 *
 * Dados: GET /api/visitors (agregados por país e por estado/região, cache 5 min) e GET /api/whoami (país e estado do próprio visitante).
 * Mapa: /assets/img/visitors/world.svg (Natural Earth, local). A cor vem de variáveis CSS (--map-0…--map-5).
 * Usado em /visitors/ (completo, com ranking) e na home (resumo: sem ranking, #v-map[data-lazy] inicia perto do viewport).
 * Países sem forma no SVG (microestados: SG, MT, MC…) entram nos totais e no ranking; o mapa simplesmente não os pinta.
 * Estados/regiões: só em /visitors/ (#v-regions), lista por país escolhido nos botões.
 * Mapa interativo (só com #v-map[data-zoom], ou seja, /visitors/): zoom por botões, Ctrl/⌘ + rolagem, pinça e teclado;
 * arraste quando ampliado; clique/Enter num país aproxima nele. Países com visitas ganham as divisas dos estados
 * (/assets/img/visitors/admin1/<PAÍS>.svg, mesma projeção do world.svg, carregado sob demanda). Sem zoom, o estado
 * herda a cor do país; ampliado (≥ 2×), cada estado tem a própria cor pelas visitas dele.
 */
(function (root) {
  "use strict";

  // Nome do país no idioma atual. Sem Intl.DisplayNames, com erro ou com código desconhecido:
  // usa o fallback (nome em inglês do SVG, quando houver) e, por último, o próprio código ISO.
  function makeCountryNamer(DisplayNames) {
    var cache = { loc: null, dn: null };
    return function (code, locale, fallback) {
      if (cache.loc !== locale) {
        cache.loc = locale;
        try { cache.dn = DisplayNames ? new DisplayNames([locale], { type: "region" }) : null; } catch (e) { cache.dn = null; }
      }
      try { if (cache.dn) { var n = cache.dn.of(code); if (n && n !== code) return n; } } catch (e) { /* código inválido */ }
      return fallback || code;
    };
  }

  // 0 = neutro; 1–5 em escala logarítmica relativa ao país mais visitado
  function level(v, max) {
    if (!v) return 0;
    if (max <= 1) return 5;
    return 1 + Math.min(4, Math.floor(4.999 * Math.log(1 + v) / Math.log(1 + max)));
  }

  // Estados do Brasil com grafia oficial (o nome vindo da Cloudflare pode vir sem acento). DF muda por idioma.
  var BR_STATES = {
    AC: "Acre", AL: "Alagoas", AP: "Amapá", AM: "Amazonas", BA: "Bahia", CE: "Ceará", ES: "Espírito Santo",
    GO: "Goiás", MA: "Maranhão", MT: "Mato Grosso", MS: "Mato Grosso do Sul", MG: "Minas Gerais", PA: "Pará",
    PB: "Paraíba", PR: "Paraná", PE: "Pernambuco", PI: "Piauí", RJ: "Rio de Janeiro", RN: "Rio Grande do Norte",
    RS: "Rio Grande do Sul", RO: "Rondônia", RR: "Roraima", SC: "Santa Catarina", SP: "São Paulo", SE: "Sergipe",
    TO: "Tocantins"
  };

  // Nome do estado/região: Brasil pela tabela; demais países pelo nome da Cloudflare; por último "PAÍS-CÓDIGO".
  function regionLabel(country, code, name, dfLabel) {
    if (country === "BR") {
      if (code === "DF") return dfLabel || "Distrito Federal";
      if (BR_STATES[code]) return BR_STATES[code];
    }
    return name || (country + "-" + code);
  }

  if (typeof module === "object" && module.exports) module.exports = { makeCountryNamer: makeCountryNamer, level: level, regionLabel: regionLabel, BR_STATES: BR_STATES };
  if (!root.document) return;

  var I = root.LucksreiI18n;
  var mapBox = document.getElementById("v-map");
  if (!I || !mapBox) return;

  var $ = function (id) { return document.getElementById(id); };
  function setText(id, text) { var el = $(id); if (el) el.textContent = text; }
  var state = { data: null, you: null, youRegion: null, youRegionName: null, rgSel: null, svg: null, failed: false, adm: {} };
  var ZOOM = mapBox.hasAttribute("data-zoom");
  var BASE = null; // viewBox original {x, y, w, h}
  var vb = null;   // viewBox atual
  var MAX_ZOOM = 40;
  var EAGER_ADM = 12; // divisas carregadas de saída para os N países com mais visitas; os demais, ao aproximar
  var reduceMotion = window.matchMedia ? window.matchMedia("(prefers-reduced-motion: reduce)") : { matches: false };
  var tip = $("v-tip");

  function locale() { return I.getLocale(); }

  var namer = makeCountryNamer(typeof Intl !== "undefined" ? Intl.DisplayNames : null);
  function countryName(code, fallback) { return namer(code, locale(), fallback); }

  function regionName(country, code, name) { return regionLabel(country, code, name, I.t("visitors.regions.df")); }

  function visitsText(n) {
    return I.t(n === 1 ? "visitors.visits_one" : "visitors.visits_other", { n: I.formatNumber(n) });
  }

  // Nome do estado no idioma atual (Natural Earth traz pt/es/en); sem tradução, o nome local.
  function stateName(p) {
    var k = { "pt-BR": "pt", es: "es", en: "en" }[locale()];
    return (k && p.getAttribute("data-" + k)) || p.getAttribute("data-n") || p.getAttribute("data-r") || "";
  }

  function stateVisits(cc, code) {
    var g = state.regionsBy && state.regionsBy[cc];
    return (g && code && g[code]) || 0;
  }

  function tipText(path) {
    if (path.hasAttribute("data-c")) {
      var code = path.getAttribute("data-c");
      return countryName(code, path.getAttribute("data-n")) + ": " + visitsText((state.byCode && state.byCode[code]) || 0);
    }
    var cc = path.parentNode.getAttribute("data-c");
    return stateName(path) + " · " + countryName(cc) + ": " + visitsText(stateVisits(cc, path.getAttribute("data-r")));
  }

  function showTip(path, clientX, clientY) {
    tip.textContent = tipText(path);
    tip.hidden = false;
    var box = mapBox.getBoundingClientRect();
    var x, y;
    if (clientX == null) {
      var r = path.getBoundingClientRect();
      x = r.left + r.width / 2 - box.left;
      y = r.top - box.top;
    } else {
      x = clientX - box.left;
      y = clientY - box.top - 14;
    }
    var w = tip.offsetWidth;
    tip.style.left = Math.max(4, Math.min(box.width - w - 4, x - w / 2)) + "px";
    tip.style.top = Math.max(4, y - tip.offsetHeight) + "px";
  }

  function hideTip() { tip.hidden = true; }

  function paintMap() {
    if (!state.svg || !state.data) return;
    var by = state.byCode = {};
    var max = 0;
    state.data.countries.forEach(function (c) { by[c.code] = c.visits; if (c.visits > max) max = c.visits; });
    state.regionsBy = {};
    (state.data.regions || []).forEach(function (g) {
      var m = state.regionsBy[g.country] = {};
      g.items.forEach(function (it) { m[it.code] = it.visits; });
    });
    // Ordem de Tab = ordem do ranking (mais visitas primeiro): reposiciona os países com visitas no fim do SVG,
    // cada um seguido das divisas dos seus estados (quando carregadas).
    state.data.countries.forEach(function (c) {
      var el = state.svg.querySelector('path[data-c="' + c.code + '"]');
      if (el) state.svg.appendChild(el);
      if (state.adm[c.code] && state.adm[c.code].g) state.svg.appendChild(state.adm[c.code].g);
    });
    Object.keys(state.adm).forEach(function (cc) { if (state.adm[cc].g) paintAdm(cc, level(by[cc] || 0, max)); });
    state.svg.querySelectorAll("path[data-c]").forEach(function (p) {
      var code = p.getAttribute("data-c");
      var v = by[code] || 0;
      p.setAttribute("data-lv", String(level(v, max)));
      p.classList.toggle("is-you", code === state.you);
      if (v) {
        p.setAttribute("tabindex", "0");
        p.setAttribute("role", "img");
        p.setAttribute("aria-label", countryName(code, p.getAttribute("data-n")) + ": " + visitsText(v));
      } else {
        p.removeAttribute("tabindex");
        p.removeAttribute("role");
        p.removeAttribute("aria-label");
      }
    });
  }

  // Estados de um país: o grupo herda a cor do país (sem zoom); cada estado guarda a própria escala para o zoom.
  function paintAdm(cc, countryLv) {
    var a = state.adm[cc];
    var g = a.g;
    g.setAttribute("data-lv", String(countryLv));
    var country = state.svg.querySelector('path[data-c="' + cc + '"]');
    if (country) country.classList.add("has-adm");
    var m = (state.regionsBy && state.regionsBy[cc]) || {};
    var max = 0;
    Object.keys(m).forEach(function (k) { if (m[k] > max) max = m[k]; });
    g.querySelectorAll("path").forEach(function (p) {
      var code = p.getAttribute("data-r");
      var v = (code && m[code]) || 0;
      p.setAttribute("data-lv", String(level(v, max)));
      p.classList.toggle("is-you", cc === state.you && !!code && code === state.youRegion);
      if (v) {
        p.setAttribute("tabindex", "0");
        p.setAttribute("role", "img");
        p.setAttribute("aria-label", tipText(p));
      } else {
        p.removeAttribute("tabindex");
        p.removeAttribute("role");
        p.removeAttribute("aria-label");
      }
    });
  }

  // Carrega as divisas de um país (uma vez). 404 = país sem divisas no Natural Earth: segue só com o contorno.
  function ensureAdm(cc) {
    if (!ZOOM || !state.svg) return Promise.resolve(null);
    if (state.adm[cc]) return state.adm[cc].p;
    var a = state.adm[cc] = { g: null, p: null };
    a.p = fetch("/assets/img/visitors/admin1/" + cc + ".svg").then(function (r) {
      if (!r.ok) return null;
      return r.text().then(function (txt) {
        var doc = new DOMParser().parseFromString(txt, "image/svg+xml");
        var g = document.createElementNS("http://www.w3.org/2000/svg", "g");
        g.setAttribute("class", "adm");
        g.setAttribute("data-c", cc);
        Array.prototype.slice.call(doc.documentElement.childNodes).forEach(function (n) {
          if (n.nodeType === 1) g.appendChild(document.importNode(n, true));
        });
        a.g = g;
        var country = state.svg.querySelector('path[data-c="' + cc + '"]');
        if (country && country.nextSibling) state.svg.insertBefore(g, country.nextSibling); else state.svg.appendChild(g);
        paintMap();
        return g;
      });
    }).catch(function () { return null; });
    return a.p;
  }

  // ---- zoom e arraste (viewBox)
  function setVB(v) {
    vb = v;
    state.svg.setAttribute("viewBox", v.x + " " + v.y + " " + v.w + " " + v.h);
    var z = BASE.w / v.w;
    state.svg.classList.toggle("is-zoomed", z >= 2);
    state.svg.classList.toggle("can-pan", z > 1.001);
    var bIn = $("v-zoom-in"), bOut = $("v-zoom-out"), bReset = $("v-zoom-reset");
    if (bIn) bIn.disabled = z >= MAX_ZOOM - 0.001;
    if (bOut) bOut.disabled = z <= 1.001;
    if (bReset) bReset.disabled = z <= 1.001;
  }

  function clampVB(v) {
    var w = Math.min(BASE.w, Math.max(BASE.w / MAX_ZOOM, v.w));
    var h = w * BASE.h / BASE.w;
    var x = Math.min(BASE.x + BASE.w - w, Math.max(BASE.x, v.x));
    var y = Math.min(BASE.y + BASE.h - h, Math.max(BASE.y, v.y));
    return { x: x, y: y, w: w, h: h };
  }

  var anim = 0, animGuard = 0;
  function goTo(target, instant) {
    target = clampVB(target);
    cancelAnimationFrame(anim);
    if (instant || reduceMotion.matches || document.hidden) { setVB(target); return; } // aba oculta não roda animação
    var from = vb, t0 = performance.now(), D = 320;
    clearTimeout(animGuard);
    function step(now) {
      var k = Math.min(1, (now - t0) / D);
      var e = 1 - Math.pow(1 - k, 3);
      setVB({ x: from.x + (target.x - from.x) * e, y: from.y + (target.y - from.y) * e, w: from.w + (target.w - from.w) * e, h: from.h + (target.h - from.h) * e });
      if (k < 1) anim = requestAnimationFrame(step); else clearTimeout(animGuard);
    }
    anim = requestAnimationFrame(step);
    // garantia: se o navegador não rodar quadros (aba sem pintura), aplica o destino mesmo assim
    animGuard = setTimeout(function () { cancelAnimationFrame(anim); setVB(target); }, D + 120);
  }

  function zoomAt(factor, cx, cy, instant) {
    if (cx == null) { cx = vb.x + vb.w / 2; cy = vb.y + vb.h / 2; }
    var w = vb.w / factor, h = vb.h / factor;
    goTo({ x: cx - (cx - vb.x) * (w / vb.w), y: cy - (cy - vb.y) * (h / vb.h), w: w, h: h }, instant);
  }

  function zoomToBox(b) {
    var aspect = BASE.w / BASE.h;
    var w = Math.max(b.width * 1.35, b.height * 1.35 * aspect, BASE.w / MAX_ZOOM);
    var h = w / aspect;
    goTo({ x: b.x + b.width / 2 - w / 2, y: b.y + b.height / 2 - h / 2, w: w, h: h });
  }

  function toSvg(clientX, clientY) {
    var m = state.svg.getScreenCTM();
    if (!m) return { x: vb.x + vb.w / 2, y: vb.y + vb.h / 2 };
    var pt = new DOMPoint(clientX, clientY).matrixTransform(m.inverse());
    return { x: pt.x, y: pt.y };
  }

  // País: aproxima nele (e garante as divisas). Estado, já com zoom: aproxima no estado.
  function activate(path) {
    if (path.hasAttribute("data-r") || path.closest("g.adm")) {
      if (BASE.w / vb.w >= 2) zoomToBox(path.getBBox());
      else activateCountry(path.parentNode.getAttribute("data-c"));
      return;
    }
    activateCountry(path.getAttribute("data-c"));
  }

  function activateCountry(cc) {
    var country = state.svg.querySelector('path[data-c="' + cc + '"]');
    if (country) zoomToBox(country.getBBox());
    if (state.byCode && state.byCode[cc]) ensureAdm(cc);
  }

  function wireZoom() {
    var svg = state.svg;
    var base = (svg.getAttribute("viewBox") || "0 0 1000 439.1").split(/[\s,]+/).map(Number); // sem o ruído de float do baseVal
    BASE = { x: base[0], y: base[1], w: base[2], h: base[3] };
    vb = { x: 0, y: 0, w: BASE.w, h: BASE.h };
    setVB(vb);
    var hint = $("v-map-hint");
    $("v-zoom-in").addEventListener("click", function () { zoomAt(2); });
    $("v-zoom-out").addEventListener("click", function () { zoomAt(0.5); });
    $("v-zoom-reset").addEventListener("click", function () { goTo(BASE); });

    // Rolagem só amplia com Ctrl/⌘ (ou pinça do trackpad, que chega como ctrlKey): a página continua rolando normal.
    svg.addEventListener("wheel", function (e) {
      if (!(e.ctrlKey || e.metaKey)) { if (hint) hint.classList.add("is-on"); return; }
      e.preventDefault();
      var p = toSvg(e.clientX, e.clientY);
      zoomAt(Math.exp(-e.deltaY * 0.0025), p.x, p.y, true);
    }, { passive: false });
    svg.addEventListener("pointerleave", function () { if (hint) hint.classList.remove("is-on"); });

    // Arraste (ampliado) e pinça (dois dedos).
    var ptrs = {}, start = null, moved = false;
    svg.addEventListener("pointerdown", function (e) {
      if (e.pointerType === "mouse" && e.button !== 0) return;
      ptrs[e.pointerId] = { x: e.clientX, y: e.clientY };
      var ids = Object.keys(ptrs);
      moved = false;
      if (ids.length === 1) start = { x: e.clientX, y: e.clientY, vb: vb };
      if (ids.length === 2) {
        var a = ptrs[ids[0]], b = ptrs[ids[1]];
        start = { pinch: Math.hypot(a.x - b.x, a.y - b.y) || 1, vb: vb, c: toSvg((a.x + b.x) / 2, (a.y + b.y) / 2) };
      }
    });
    svg.addEventListener("pointermove", function (e) {
      if (!ptrs[e.pointerId] || !start) return;
      ptrs[e.pointerId] = { x: e.clientX, y: e.clientY };
      var ids = Object.keys(ptrs);
      if (ids.length === 2 && start.pinch) {
        var a = ptrs[ids[0]], b = ptrs[ids[1]];
        var f = Math.hypot(a.x - b.x, a.y - b.y) / start.pinch;
        var w = start.vb.w / f, h = start.vb.h / f, c = start.c;
        setVB(clampVB({ x: c.x - (c.x - start.vb.x) * (w / start.vb.w), y: c.y - (c.y - start.vb.y) * (h / start.vb.h), w: w, h: h }));
        moved = true;
        return;
      }
      if (ids.length !== 1 || start.pinch) return;
      var dx = e.clientX - start.x, dy = e.clientY - start.y;
      if (!moved && Math.hypot(dx, dy) < 6) return;
      if (BASE.w / vb.w <= 1.001) return; // sem zoom não há o que arrastar (a página rola normalmente)
      if (!moved) { moved = true; try { svg.setPointerCapture(e.pointerId); } catch (err) { /* ok */ } hideTip(); }
      var k = start.vb.w / svg.getBoundingClientRect().width;
      setVB(clampVB({ x: start.vb.x - dx * k, y: start.vb.y - dy * k, w: start.vb.w, h: start.vb.h }));
    });
    function end(e) {
      delete ptrs[e.pointerId];
      if (!Object.keys(ptrs).length) start = null;
      else if (start && start.pinch) start = null; // terminou a pinça: espera um novo toque
    }
    svg.addEventListener("pointerup", end);
    svg.addEventListener("pointercancel", end);

    svg.addEventListener("click", function (e) {
      if (moved) { moved = false; return; }
      var p = e.target.closest && e.target.closest("path[data-c], g.adm path");
      if (p) activate(p);
    });
    svg.addEventListener("dblclick", function (e) {
      if (e.target.closest && e.target.closest("path[data-c], g.adm path")) return; // o clique já aproximou
      var p = toSvg(e.clientX, e.clientY);
      zoomAt(2, p.x, p.y);
    });

    // Teclado: Enter/Espaço no país/estado focado aproxima; + / − / 0 e setas com o foco no mapa.
    svg.addEventListener("keydown", function (e) {
      var k = e.key;
      if ((k === "Enter" || k === " ") && e.target.closest && e.target.closest("path[data-c], g.adm path")) { e.preventDefault(); activate(e.target.closest("path[data-c], g.adm path")); return; }
      if (k === "+" || k === "=") { e.preventDefault(); zoomAt(2); return; }
      if (k === "-" || k === "_") { e.preventDefault(); zoomAt(0.5); return; }
      if (k === "0") { e.preventDefault(); goTo(BASE); return; }
      var step = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] }[k];
      if (step && BASE.w / vb.w > 1.001) { e.preventDefault(); goTo({ x: vb.x + step[0] * vb.w * 0.2, y: vb.y + step[1] * vb.h * 0.2, w: vb.w, h: vb.h }); }
    });
  }

  function renderStats() {
    var d = state.data;
    setText("v-total", d ? I.formatNumber(d.total_visits) : "—");
    setText("v-countries", d ? I.formatNumber(d.countries_count) : "—");
    setText("v-you", state.you
      ? (state.youRegion ? regionName(state.you, state.youRegion, state.youRegionName) + ", " : "") + countryName(state.you)
      : (state.data ? I.t("visitors.unknown_you") : "—"));
    var meta = [];
    if (d && d.updated_at) meta.push(I.t("visitors.updated", { date: I.formatDate(new Date(d.updated_at), { dateStyle: "medium" }) }));
    if (d && d.since) {
      var now = new Date();
      var start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - (d.window_months - 1), 1));
      var ws = start.getUTCFullYear() + "-" + String(start.getUTCMonth() + 1).padStart(2, "0");
      if (d.since > ws) {
        var p = d.since.split("-");
        meta.push(I.t("visitors.since", { month: I.formatDate(new Date(Date.UTC(+p[0], +p[1] - 1, 1)), { month: "long", year: "numeric", timeZone: "UTC" }) }));
      }
    }
    setText("v-meta", meta.join(" · "));
    setText("v-status", state.failed ? I.t("visitors.error") : (d && d.total_visits === 0 ? I.t("visitors.empty") : ""));
  }

  function renderRank() {
    var ol = $("v-rank");
    if (!ol) return; // a home mostra só o mapa e os totais
    ol.textContent = "";
    // ranking só a partir do 2º país (com um só, o mapa e os totais já dizem tudo)
    var many = !!state.data && state.data.countries.length >= 2;
    ol.hidden = !many;
    var title = $("v-rank-title");
    if (title) title.hidden = !many;
    if (!many) return;
    state.data.countries.slice(0, 10).forEach(function (c, i) {
      var li = document.createElement("li");
      li.setAttribute("tabindex", "0");
      li.setAttribute("data-c", c.code);
      var pos = document.createElement("span");
      pos.className = "rk-pos";
      pos.textContent = String(i + 1).padStart(2, "0");
      var nm = document.createElement("span");
      nm.className = "rk-name";
      nm.textContent = countryName(c.code);
      var n = document.createElement("span");
      n.className = "rk-n";
      n.textContent = I.formatNumber(c.visits);
      n.title = visitsText(c.visits);
      li.appendChild(pos); li.appendChild(nm); li.appendChild(n);
      ol.appendChild(li);
    });
  }

  // Estados/regiões (só em /visitors/): botões por país + top 10 do país escolhido.
  function renderRegions() {
    var ol = $("v-regions");
    if (!ol) return;
    var bar = $("v-rg-filters");
    var note = $("v-regions-note");
    var list = (state.data && state.data.regions) || [];
    ol.textContent = "";
    bar.textContent = "";
    // a seção inteira só aparece a partir do 2º estado registrado (somando todos os países)
    var states = list.reduce(function (n, g) { return n + g.items.length; }, 0);
    var on = !!state.data && states >= 2;
    var title = $("v-regions-title");
    if (title) title.hidden = !on;
    note.hidden = !on;
    if (!on) { bar.hidden = true; ol.hidden = true; note.textContent = ""; return; }
    var shown = list.slice(0, 8);
    if (!state.rgSel || !shown.some(function (g) { return g.country === state.rgSel; })) {
      state.rgSel = shown.some(function (g) { return g.country === state.you; }) ? state.you : shown[0].country;
    }
    bar.hidden = shown.length < 2; // um país só: o título já basta
    bar.setAttribute("aria-label", I.t("visitors.regions.filter_aria"));
    shown.forEach(function (g) {
      var b = document.createElement("button");
      b.type = "button";
      b.className = "rg-filter";
      b.setAttribute("data-c", g.country);
      b.setAttribute("aria-pressed", g.country === state.rgSel ? "true" : "false");
      b.textContent = countryName(g.country);
      var n = document.createElement("span");
      n.className = "count";
      n.textContent = I.formatNumber(g.visits);
      b.appendChild(n);
      bar.appendChild(b);
    });
    var g = shown.filter(function (x) { return x.country === state.rgSel; })[0];
    ol.hidden = !g.items.length;
    g.items.slice(0, 10).forEach(function (it, i) {
      var li = document.createElement("li");
      var pos = document.createElement("span");
      pos.className = "rk-pos";
      pos.textContent = String(i + 1).padStart(2, "0");
      var nm = document.createElement("span");
      nm.className = "rk-name";
      nm.textContent = regionName(g.country, it.code, it.name);
      var n = document.createElement("span");
      n.className = "rk-n";
      n.textContent = I.formatNumber(it.visits);
      n.title = visitsText(it.visits);
      li.appendChild(pos); li.appendChild(nm); li.appendChild(n);
      ol.appendChild(li);
    });
    ol.setAttribute("aria-label", I.t("visitors.regions.title") + " — " + countryName(g.country));
    var parts = [];
    if (state.data.regions_since) {
      var p = state.data.regions_since.split("-");
      parts.push(I.t("visitors.regions.since", { month: I.formatDate(new Date(Date.UTC(+p[0], +p[1] - 1, 1)), { month: "long", year: "numeric", timeZone: "UTC" }) }));
    }
    if (g.unknown) parts.push(I.t(g.unknown === 1 ? "visitors.regions.unknown_one" : "visitors.regions.unknown_other", { n: I.formatNumber(g.unknown) }));
    note.textContent = parts.join(" ");
  }

  function render() {
    renderStats();
    renderRank();
    renderRegions();
    paintMap();
    mapBox.setAttribute("aria-busy", state.svg && state.data ? "false" : "true");
    if (state.svg) state.svg.setAttribute("aria-label", I.t("visitors.map_aria"));
  }

  function highlight(code, on) {
    if (!state.svg) return;
    var p = state.svg.querySelector('path[data-c="' + code + '"]');
    if (p) p.classList.toggle("is-hl", on);
    var a = state.adm[code];
    if (a && a.g) a.g.classList.toggle("is-hl", on);
  }

  function wire() {
    var svg = state.svg;
    svg.addEventListener("pointermove", function (e) {
      if (e.buttons && state.svg.classList.contains("can-pan")) return; // arrastando
      var p = e.target.closest && e.target.closest("path[data-c], g.adm path");
      if (p) showTip(p, e.clientX, e.clientY); else hideTip();
    });
    svg.addEventListener("pointerleave", hideTip);
    svg.addEventListener("focusin", function (e) { var p = e.target.closest("path[data-c], g.adm path"); if (p) showTip(p); });
    svg.addEventListener("focusout", hideTip);
    document.addEventListener("keydown", function (e) { if (e.key === "Escape") hideTip(); });
    var ol = $("v-rank");
    if (ol) wireRank(svg, ol);
    var bar = $("v-rg-filters");
    if (bar) bar.addEventListener("click", function (e) {
      var b = e.target.closest("button[data-c]");
      if (!b || b.getAttribute("data-c") === state.rgSel) return;
      state.rgSel = b.getAttribute("data-c");
      renderRegions();
      var again = bar.querySelector('button[data-c="' + state.rgSel + '"]');
      if (again) again.focus(); // a lista de botões é recriada: devolve o foco ao botão escolhido
    });
  }

  function wireRank(svg, ol) {
    function over(e, on) { var li = e.target.closest("li[data-c]"); if (li) { highlight(li.getAttribute("data-c"), on); if (on && e.type === "focusin") { var p = svg.querySelector('path[data-c="' + li.getAttribute("data-c") + '"]'); if (p) showTip(p); } if (!on) hideTip(); } }
    ol.addEventListener("pointerover", function (e) { over(e, true); });
    ol.addEventListener("pointerout", function (e) { over(e, false); });
    ol.addEventListener("focusin", function (e) { over(e, true); });
    ol.addEventListener("focusout", function (e) { over(e, false); });
  }

  function getJSON(url) {
    // "no-cache": revalida sempre; o edge da Cloudflare responde do cache de 5 min (a Cloudflare reescreve o max-age para 4 h)
    return fetch(url, { credentials: "omit", cache: "no-cache" }).then(function (r) { if (!r.ok) throw new Error(String(r.status)); return r.json(); });
  }

  function start() {
    Promise.all([
      fetch("/assets/img/visitors/world.svg").then(function (r) { if (!r.ok) throw new Error("svg"); return r.text(); }),
      getJSON("/api/visitors").catch(function () { state.failed = true; return null; }),
      getJSON("/api/whoami").catch(function () { return null; })
    ]).then(function (res) {
      var doc = new DOMParser().parseFromString(res[0], "image/svg+xml");
      state.svg = document.importNode(doc.documentElement, true);
      state.svg.setAttribute("class", "world");
      state.svg.setAttribute("role", "group");
      state.svg.setAttribute("tabindex", "-1"); // o <svg> raiz não deve ser uma parada de Tab
      mapBox.insertBefore(state.svg, mapBox.firstChild);
      state.data = res[1];
      if (ZOOM) {
        wireZoom();
        // divisas dos países com mais visitas já de saída; os demais quando o visitante aproximar
        ((state.data && state.data.countries) || []).slice(0, EAGER_ADM).forEach(function (c) { ensureAdm(c.code); });
      }
      var who = res[2] || {};
      state.you = who.country || null;
      state.youRegion = (state.you && who.region) || null;
      state.youRegionName = who.region_name || null;
      wire();
      render();
    }).catch(function () {
      state.failed = true;
      render();
    });
  }

  // Na home o mapa só é buscado quando a seção chega perto do viewport.
  if (mapBox.hasAttribute("data-lazy") && "IntersectionObserver" in window) {
    var io = new IntersectionObserver(function (entries) {
      if (entries.some(function (en) { return en.isIntersecting; })) { io.disconnect(); start(); }
    }, { rootMargin: "400px 0px" });
    io.observe(mapBox);
  } else {
    start();
  }

  document.addEventListener("lucksrei:locale", render);
})(typeof window !== "undefined" ? window : this);
