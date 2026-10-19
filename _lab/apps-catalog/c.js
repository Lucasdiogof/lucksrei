/* Proposta C — Signature Lucksrei: seletor editorial dos produtos próprios (abas acessíveis + palco),
 * linha do tempo dos projetos profissionais pelos períodos reais e um painel-registro das marcas Cooper. */
(function () {
  "use strict";
  var L = window.LucksreiLab;
  if (!L) return;
  var el = L.el;
  var CASE_TONE = { "fan-hub": "#6fcf97", "match-queue": "#2ee88a", "aprovaura": "#7fbfe0", "la-pelve": "#d59ab4" };
  var active = 0;

  function pad(n) { return (n < 10 ? "0" : "") + n; }
  function tone(node, app) {
    if (CASE_TONE[app.id]) { node.style.setProperty("--t", CASE_TONE[app.id]); return; }
    L.logoTone(app, function (c) { if (c) node.style.setProperty("--t", c); });
  }

  function chapterHead(id, numeral, label) {
    var h = L.groupHead(id);
    var box = el("header", "c-head");
    var big = el("span", "c-numeral", numeral);
    big.setAttribute("aria-hidden", "true");
    box.appendChild(big);
    var t = el("div", "c-head-text");
    t.appendChild(el("span", "c-label", label));
    var h2 = el("h2", null, h.title); h2.id = "c-g-" + id;
    t.appendChild(h2);
    t.appendChild(el("p", null, h.intro));
    box.appendChild(t);
    return box;
  }

  /* ---------- produtos próprios: tablist vertical + painel ---------- */
  function ownSection() {
    var apps = L.byGroup("own");
    var sec = el("section", "c-group c-own"); sec.id = "own";
    sec.setAttribute("aria-labelledby", "c-g-own");
    sec.appendChild(chapterHead("own", pad(apps.length), L.lab("featured")));

    var wrap = el("div", "c-selector");
    var list = el("div", "c-tabs");
    list.setAttribute("role", "tablist");
    list.setAttribute("aria-orientation", "vertical");
    list.setAttribute("aria-label", L.lab("chooseProduct"));
    var stage = el("div", "c-stage");
    var tabs = [], panels = [];

    apps.forEach(function (app, i) {
      var tab = el("button", "c-tab");
      tab.type = "button";
      tab.id = "c-tab-" + app.id;
      tab.setAttribute("role", "tab");
      tab.setAttribute("aria-controls", "c-panel-" + app.id);
      tone(tab, app);
      tab.appendChild(el("span", "c-tab-idx", pad(i + 1)));
      var lg = L.logo(app, 32, "c-tab-logo"); lg.alt = "";
      tab.appendChild(lg);
      tab.appendChild(el("span", "c-tab-name", app.name));
      tab.addEventListener("click", function () { select(i, true); });
      tab.addEventListener("keydown", function (e) {
        var k = e.key, n = null;
        if (k === "ArrowDown" || k === "ArrowRight") n = (i + 1) % apps.length;
        else if (k === "ArrowUp" || k === "ArrowLeft") n = (i - 1 + apps.length) % apps.length;
        else if (k === "Home") n = 0; else if (k === "End") n = apps.length - 1;
        if (n != null) { e.preventDefault(); select(n, true); }
      });
      list.appendChild(tab); tabs.push(tab);

      var panel = el("article", "c-panel");
      panel.id = "c-panel-" + app.id;
      panel.setAttribute("role", "tabpanel");
      panel.setAttribute("aria-labelledby", tab.id);
      panel.setAttribute("data-app", app.id);
      panel.tabIndex = 0;
      tone(panel, app);
      var art = el("div", "c-art");
      art.setAttribute("aria-hidden", "true");
      var big = L.logo(app, 144, "c-art-logo"); big.alt = "";
      art.appendChild(big);
      art.appendChild(el("span", "c-art-idx", pad(i + 1)));
      panel.appendChild(art);

      var info = el("div", "c-info");
      info.appendChild(el("p", "c-kicker", [L.sectorOf(app), L.periodOf(app)].filter(Boolean).join(" · ")));
      info.appendChild(el("h3", "c-name", app.name));
      var sub = L.subtitleOf(app);
      if (sub) info.appendChild(el("p", "c-sub", sub));
      var dl = el("dl", "c-facts");
      function fact(label, value) { if (!value) return; var d = el("div"); d.appendChild(el("dt", null, label)); d.appendChild(el("dd", null, value)); dl.appendChild(d); }
      fact(L.lab("stack"), (app.technologies || []).join(" · "));
      fact(L.lab("platforms"), L.platformsOf(app).map(L.platformLabel).join(" · "));
      info.appendChild(dl);
      var act = el("div", "c-actions");
      var c = L.caseLink(app, "c-cta");
      if (c) { c.appendChild(el("span", "c-cta-arrow", "→")); act.appendChild(c); }
      L.storeLinks(app, "c-store").forEach(function (n) { act.appendChild(n); });
      info.appendChild(act);
      panel.appendChild(info);
      stage.appendChild(panel); panels.push(panel);
    });

    function select(i, focus) {
      active = i;
      tabs.forEach(function (t, j) {
        var on = j === i;
        t.setAttribute("aria-selected", on ? "true" : "false");
        t.tabIndex = on ? 0 : -1;
        panels[j].classList.toggle("is-active", on);
      });
      if (focus) tabs[i].focus();
    }
    select(Math.min(active, apps.length - 1), false);

    wrap.appendChild(list);
    wrap.appendChild(stage);
    sec.appendChild(wrap);
    return sec;
  }

  /* ---------- profissionais: linha do tempo pelos períodos reais ---------- */
  function proSection() {
    var apps = L.byGroup("professional").slice().sort(function (a, b) { return (b.period || "").localeCompare(a.period || ""); });
    var sec = el("section", "c-group c-pro"); sec.id = "professional";
    sec.setAttribute("aria-labelledby", "c-g-professional");
    sec.appendChild(chapterHead("professional", pad(apps.length), L.lab("timeline")));
    var ol = el("ol", "c-timeline");
    var lastYear = null;
    apps.forEach(function (app) {
      var y = L.startYear(app);
      var li = el("li", "c-entry" + (y !== lastYear ? " has-year" : ""));
      li.setAttribute("data-app", app.id);
      var yr = el("span", "c-year", y !== lastYear && y ? String(y) : "");
      yr.setAttribute("aria-hidden", y === lastYear ? "true" : "false");
      li.appendChild(yr);
      lastYear = y;
      li.appendChild(el("span", "c-dot"));
      var card = el("div", "c-entry-body");
      card.appendChild(L.logo(app, 44, "c-entry-logo"));
      var txt = el("div", "c-entry-text");
      txt.appendChild(el("h3", "c-entry-name", app.name));
      var sub = L.subtitleOf(app);
      if (sub) txt.appendChild(el("p", "c-entry-sub", sub));
      txt.appendChild(el("p", "c-entry-meta", [L.sectorOf(app), L.periodOf(app)].filter(Boolean).join(" · ")));
      if (app.technologies && app.technologies.length) txt.appendChild(el("p", "c-entry-stack", app.technologies.join(" · ")));
      card.appendChild(txt);
      var st = el("div", "c-entry-stores");
      L.storeLinks(app, "c-mini-store", true).forEach(function (n) { st.appendChild(n); });
      if (!st.childNodes.length) st.appendChild(el("span", "c-private", app.private ? L.I.t("apps.private") : L.lab("noStore")));
      card.appendChild(st);
      li.appendChild(card);
      ol.appendChild(li);
    });
    sec.appendChild(ol);
    return sec;
  }

  /* ---------- Cooper: painel-registro (numeral + parede de marcas) ---------- */
  function cooperSection() {
    var apps = L.byGroup("cooper");
    var both = apps.filter(function (a) { return a.androidUrl && a.iosUrl; }).length;
    var sec = el("section", "c-group c-coop"); sec.id = "cooper";
    sec.setAttribute("aria-labelledby", "c-g-cooper");
    var panel = el("div", "c-ledger");
    var side = el("div", "c-ledger-side");
    var n = el("span", "c-ledger-num", String(apps.length)); n.setAttribute("aria-hidden", "true");
    side.appendChild(n);
    side.appendChild(el("span", "c-ledger-cap", L.lab("brands") + " · " + L.lab("oneCodebase")));
    var h = L.groupHead("cooper");
    var h2 = el("h2", null, h.title); h2.id = "c-g-cooper";
    side.appendChild(h2);
    side.appendChild(el("p", null, h.intro));
    side.appendChild(el("p", "c-ledger-fact", both + " · " + L.lab("both")));
    panel.appendChild(side);
    var ul = el("ul", "c-wall");
    apps.forEach(function (app) {
      var li = el("li", "c-brand");
      li.setAttribute("data-app", app.id);
      li.appendChild(L.logo(app, 44, "c-brand-logo"));
      li.appendChild(el("span", "c-brand-name", app.name));
      var st = el("span", "c-brand-stores");
      L.storeLinks(app, "c-mini-store", true).forEach(function (s) { st.appendChild(s); });
      if (!st.childNodes.length) st.appendChild(el("span", "c-private", L.lab("noStore")));
      li.appendChild(st);
      ul.appendChild(li);
    });
    panel.appendChild(ul);
    sec.appendChild(panel);
    return sec;
  }

  L.mount(function (root) {
    root.classList.add("lab-c");
    root.appendChild(ownSection());
    root.appendChild(proSection());
    root.appendChild(cooperSection());
  });
})();
