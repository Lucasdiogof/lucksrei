/* Lucksrei — página /visitors/: mapa-múndi, indicadores e ranking.
 *
 * Dados: GET /api/visitors (agregados por país e por estado/região, cache 5 min) e GET /api/whoami (país e estado do próprio visitante).
 * Mapa: /assets/img/visitors/world.svg (Natural Earth, local). A cor vem de variáveis CSS (--map-0…--map-5).
 * Usado em /visitors/ (completo, com ranking) e na home (resumo: sem ranking, #v-map[data-lazy] inicia perto do viewport).
 * Países sem forma no SVG (microestados: SG, MT, MC…) entram nos totais e no ranking; o mapa simplesmente não os pinta.
 * Estados/regiões: só em /visitors/ (#v-regions), lista por país escolhido nos botões; sem mapa por estado.
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
  var state = { data: null, you: null, youRegion: null, youRegionName: null, rgSel: null, svg: null, failed: false };
  var tip = $("v-tip");

  function locale() { return I.getLocale(); }

  var namer = makeCountryNamer(typeof Intl !== "undefined" ? Intl.DisplayNames : null);
  function countryName(code, fallback) { return namer(code, locale(), fallback); }

  function regionName(country, code, name) { return regionLabel(country, code, name, I.t("visitors.regions.df")); }

  function visitsText(n) {
    return I.t(n === 1 ? "visitors.visits_one" : "visitors.visits_other", { n: I.formatNumber(n) });
  }

  function showTip(path, clientX, clientY) {
    var code = path.getAttribute("data-c");
    var v = (state.byCode && state.byCode[code]) || 0;
    tip.textContent = countryName(code, path.getAttribute("data-n")) + ": " + visitsText(v);
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
    // Ordem de Tab = ordem do ranking (mais visitas primeiro): reposiciona os países com visitas no fim do SVG.
    state.data.countries.forEach(function (c) {
      var el = state.svg.querySelector('path[data-c="' + c.code + '"]');
      if (el) state.svg.appendChild(el);
    });
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
    if (!state.data) return;
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
    if (!state.data) { note.textContent = ""; return; }
    if (!list.length) { bar.hidden = true; ol.hidden = true; note.textContent = I.t("visitors.regions.empty"); return; }
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
  }

  function wire() {
    var svg = state.svg;
    svg.addEventListener("pointermove", function (e) {
      var p = e.target.closest && e.target.closest("path[data-c]");
      if (p) showTip(p, e.clientX, e.clientY); else hideTip();
    });
    svg.addEventListener("pointerleave", hideTip);
    svg.addEventListener("focusin", function (e) { var p = e.target.closest("path[data-c]"); if (p) showTip(p); });
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
