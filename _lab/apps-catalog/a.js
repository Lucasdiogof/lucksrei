/* Proposta A — Editorial App Directory: índice tipográfico numerado, linhas finas, metadados em colunas. */
(function () {
  "use strict";
  var L = window.LucksreiLab;
  if (!L) return;
  var el = L.el;

  function pad(n) { return (n < 10 ? "0" : "") + n; }

  function metaItem(label, value, cls) {
    if (!value) return null;
    var d = el("div", "a-meta-item" + (cls ? " " + cls : ""));
    d.appendChild(el("dt", null, label));
    d.appendChild(el("dd", null, value));
    return d;
  }

  function actions(app, compact) {
    var box = el("div", "a-act");
    var c = L.caseLink(app, "a-case");
    if (c) { c.appendChild(el("span", "a-case-arrow", "→")); box.appendChild(c); }
    var stores = L.storeLinks(app, "a-store", compact);
    if (stores.length) {
      var s = el("div", "a-stores");
      stores.forEach(function (n) { s.appendChild(n); });
      box.appendChild(s);
    } else if (!c) {
      box.appendChild(el("span", "a-note", app.private ? L.I.t("apps.private") : L.lab("noStore")));
    }
    return box;
  }

  function row(app, i, kind) {
    var li = el("li", "a-row a-row--" + kind);
    li.setAttribute("data-app", app.id);
    li.appendChild(el("span", "a-idx", pad(i + 1)));
    li.appendChild(L.logo(app, kind === "own" ? 64 : kind === "pro" ? 44 : 32, "a-logo"));

    var id = el("div", "a-id");
    id.appendChild(el("h3", "a-name", app.name));
    var sub = L.subtitleOf(app);
    if (sub && kind !== "cooper") id.appendChild(el("p", "a-sub", sub));
    li.appendChild(id);

    if (kind !== "cooper") {
      var meta = el("dl", "a-meta");
      [metaItem(L.lab("sector"), L.sectorOf(app)),
       kind === "pro" ? metaItem(L.lab("period"), L.periodOf(app), "is-mono") : null,
       metaItem(L.lab("stack"), (app.technologies || []).join(" · ")),
       kind === "own" ? metaItem(L.lab("platforms"), L.platformsOf(app).map(L.platformLabel).join(" · ")) : null
      ].forEach(function (n) { if (n) meta.appendChild(n); });
      li.appendChild(meta);
    }
    li.appendChild(actions(app, kind !== "own"));
    return li;
  }

  function section(id, num, kind, countLabel) {
    var apps = L.byGroup(id);
    var h = L.groupHead(id);
    var sec = el("section", "a-group a-group--" + kind);
    sec.id = id;
    sec.setAttribute("aria-labelledby", "a-g-" + id);
    var head = el("header", "a-head");
    head.appendChild(el("span", "a-num", num));
    var t = el("div", "a-head-text");
    var h2 = el("h2", null, h.title); h2.id = "a-g-" + id;
    t.appendChild(h2);
    t.appendChild(el("p", null, h.intro));
    head.appendChild(t);
    head.appendChild(el("span", "a-count", pad(apps.length) + " " + countLabel));
    sec.appendChild(head);
    var ol = el("ol", "a-list a-list--" + kind);
    apps.forEach(function (a, i) { ol.appendChild(row(a, i, kind)); });
    sec.appendChild(ol);
    return sec;
  }

  L.mount(function (root) {
    root.classList.add("lab-a");
    root.appendChild(section("own", "01", "own", L.lab("ownCount")));
    root.appendChild(section("professional", "02", "pro", L.lab("professionalCount")));
    root.appendChild(section("cooper", "03", "cooper", L.lab("brands")));
  });
})();
