/* Proposta B — Product Gallery: bento de produtos próprios com palco tonal do logo, cards horizontais
 * para os profissionais e uma vitrine compacta das marcas Cooper. Cores de tom vêm de --p (4 cases)
 * ou da média dos pixels do próprio logo — nunca de uma cor inventada. */
(function () {
  "use strict";
  var L = window.LucksreiLab;
  if (!L) return;
  var el = L.el;
  var CASE_TONE = { "fan-hub": "#6fcf97", "match-queue": "#2ee88a", "aprovaura": "#7fbfe0", "la-pelve": "#d59ab4" };
  var SPANS = ["b-span-7", "b-span-5", "b-span-5", "b-span-7", "b-span-6", "b-span-6"];

  function tone(node, app) {
    if (CASE_TONE[app.id]) { node.style.setProperty("--t", CASE_TONE[app.id]); return; }
    L.logoTone(app, function (c) { if (c) node.style.setProperty("--t", c); });
  }

  function storeRow(app) {
    var s = el("div", "b-stores");
    L.storeLinks(app, "b-store", true).forEach(function (n) { s.appendChild(n); });
    return s.childNodes.length ? s : null;
  }

  function platformLine(app) {
    var p = L.platformsOf(app);
    if (!p.length) return null;
    var line = el("span", "b-plat");
    p.forEach(function (k) { line.appendChild(el("span", null, L.platformLabel(k))); });
    return line;
  }

  /* produto próprio: o título é o link do case e cobre a placa (link "esticado");
     as lojas ficam por cima, como links independentes — sem link dentro de link. */
  function feature(app, i) {
    var art = el("article", "b-feature " + SPANS[i % SPANS.length] + (app.caseUrl ? " has-case" : ""));
    art.setAttribute("data-app", app.id);
    tone(art, app);

    var stage = el("div", "b-stage");
    stage.setAttribute("aria-hidden", "true");
    var mark = L.logo(app, 112, "b-stage-logo");
    mark.alt = "";
    stage.appendChild(mark);
    art.appendChild(stage);

    var body = el("div", "b-body");
    var kicker = el("p", "b-kicker");
    kicker.textContent = [L.sectorOf(app), L.periodOf(app)].filter(Boolean).join(" · ");
    body.appendChild(kicker);
    var h3 = el("h3", "b-name");
    var c = L.caseLink(app, "b-title-link", app.name);
    if (c) h3.appendChild(c); else h3.textContent = app.name;
    body.appendChild(h3);
    var sub = L.subtitleOf(app);
    if (sub) body.appendChild(el("p", "b-sub", sub));
    if (app.technologies && app.technologies.length) body.appendChild(el("p", "b-stack", app.technologies.join("  /  ")));

    var foot = el("div", "b-foot");
    var pl = platformLine(app); if (pl) foot.appendChild(pl);
    var st = storeRow(app); if (st) foot.appendChild(st);
    if (app.caseUrl) foot.appendChild(el("span", "b-go", L.I.t("apps.case")));
    body.appendChild(foot);
    art.appendChild(body);
    return art;
  }

  function proCard(app) {
    var art = el("article", "b-pro");
    art.setAttribute("data-app", app.id);
    tone(art, app);
    var tile = el("div", "b-pro-tile");
    tile.appendChild(L.logo(app, 56, "b-pro-logo"));
    art.appendChild(tile);
    var body = el("div", "b-pro-body");
    body.appendChild(el("h3", "b-pro-name", app.name));
    var sub = L.subtitleOf(app);
    if (sub) body.appendChild(el("p", "b-pro-sub", sub));
    var meta = el("p", "b-pro-meta");
    meta.textContent = [L.sectorOf(app), L.periodOf(app)].filter(Boolean).join(" · ");
    body.appendChild(meta);
    if (app.technologies && app.technologies.length) body.appendChild(el("p", "b-stack", app.technologies.join("  /  ")));
    var foot = el("div", "b-pro-foot");
    var st = storeRow(app);
    if (st) foot.appendChild(st);
    else foot.appendChild(el("span", "b-private", app.private ? L.I.t("apps.private") : L.lab("noStore")));
    body.appendChild(foot);
    art.appendChild(body);
    return art;
  }

  function cooperTile(app) {
    var li = el("li", "b-coop");
    li.setAttribute("data-app", app.id);
    li.appendChild(L.logo(app, 52, "b-coop-logo"));
    li.appendChild(el("span", "b-coop-name", app.name));
    var st = storeRow(app);
    if (st) li.appendChild(st);
    else li.appendChild(el("span", "b-private", L.lab("noStore")));
    return li;
  }

  function head(id, extra) {
    var h = L.groupHead(id);
    var box = el("header", "b-head");
    var h2 = el("h2", null, h.title); h2.id = "b-g-" + id;
    box.appendChild(h2);
    box.appendChild(el("p", null, h.intro));
    if (extra) box.appendChild(extra);
    return box;
  }

  L.mount(function (root) {
    root.classList.add("lab-b");

    var own = el("section", "b-group b-group--own"); own.id = "own";
    own.setAttribute("aria-labelledby", "b-g-own");
    own.appendChild(head("own"));
    var bento = el("div", "b-bento");
    L.byGroup("own").forEach(function (a, i) { bento.appendChild(feature(a, i)); });
    own.appendChild(bento);
    root.appendChild(own);

    var pro = el("section", "b-group b-group--pro"); pro.id = "professional";
    pro.setAttribute("aria-labelledby", "b-g-professional");
    pro.appendChild(head("professional"));
    var grid = el("div", "b-pro-grid");
    L.byGroup("professional").forEach(function (a) { grid.appendChild(proCard(a)); });
    pro.appendChild(grid);
    root.appendChild(pro);

    var coopApps = L.byGroup("cooper");
    var both = coopApps.filter(function (a) { return a.androidUrl && a.iosUrl; }).length;
    var facts = el("p", "b-facts");
    facts.textContent = coopApps.length + " " + L.lab("brands") + " · " + L.lab("oneCodebase") + " · " + both + " " + L.lab("both");
    var coop = el("section", "b-group b-group--cooper"); coop.id = "cooper";
    coop.setAttribute("aria-labelledby", "b-g-cooper");
    coop.appendChild(head("cooper", facts));
    var ul = el("ul", "b-coop-grid");
    coopApps.forEach(function (a) { ul.appendChild(cooperTile(a)); });
    coop.appendChild(ul);
    root.appendChild(coop);
  });
})();
