/* Lucksrei — renderiza a página /apps a partir de assets/js/apps-data.js */
(function () {
  "use strict";

  var data = window.LUCKSREI_APPS;
  var root = document.getElementById("apps-root");
  var filtersEl = document.getElementById("apps-filters");
  if (!data || !root || !filtersEl) return;

  var ICON_PLAY = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5.5 3.4v17.2c0 .8.9 1.3 1.6.9l14-8.6c.6-.4.6-1.3 0-1.7L7.1 2.5c-.7-.4-1.6.1-1.6.9z"/></svg>';
  var ICON_APPLE = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12.152 6.896c-.948 0-2.415-1.078-3.96-1.04-2.04.027-3.91 1.183-4.961 3.014-2.117 3.675-.546 9.103 1.519 12.09 1.013 1.454 2.208 3.09 3.792 3.039 1.52-.065 2.09-.987 3.935-.987 1.831 0 2.35.987 3.96.948 1.637-.026 2.676-1.48 3.676-2.948 1.156-1.688 1.636-3.325 1.662-3.415-.039-.013-3.182-1.221-3.22-4.857-.026-3.04 2.48-4.494 2.597-4.559-1.429-2.09-3.623-2.324-4.39-2.376-2-.156-3.675 1.09-4.61 1.09zM15.53 3.83c.843-1.012 1.4-2.427 1.245-3.83-1.207.052-2.662.805-3.532 1.818-.78.896-1.454 2.338-1.273 3.714 1.338.104 2.715-.688 3.559-1.701"/></svg>';

  function el(tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    return n;
  }

  function initials(name) {
    var words = name.replace(/[^A-Za-zÀ-ú0-9 ]/g, "").split(/\s+/).filter(Boolean);
    var skip = { cooper: 1, pay: 1 };
    var pick = words.filter(function (w) { return !skip[w.toLowerCase()]; });
    if (!pick.length) pick = words;
    return (pick.length > 1 ? pick[0][0] + pick[1][0] : pick[0].slice(0, 2)).toUpperCase();
  }

  function storeLink(app, kind) {
    var isAndroid = kind === "android";
    var a = el("a", "store");
    a.href = isAndroid ? app.androidUrl : app.iosUrl;
    a.target = "_blank";
    a.rel = "noopener noreferrer";
    a.setAttribute("aria-label", (isAndroid ? "Ver " : "Ver ") + app.name + (isAndroid ? " no Google Play" : " na App Store") + " (abre em nova aba)");
    a.innerHTML = isAndroid ? ICON_PLAY : ICON_APPLE;
    a.appendChild(document.createTextNode(isAndroid ? "Google Play" : "App Store"));
    return a;
  }

  function card(app) {
    var li = el("li", "app-card" + (app.group === "own" ? " is-own" : ""));

    var top = el("div", "app-top");
    var logo = el("div", "app-logo");
    if (app.logo) {
      var img = el("img");
      img.src = app.logo;
      img.alt = "Logo " + app.name;
      img.width = 56;
      img.height = 56;
      img.loading = "lazy";
      img.decoding = "async";
      logo.appendChild(img);
    } else {
      logo.classList.add("is-pending");
      logo.setAttribute("role", "img");
      logo.setAttribute("aria-label", "Logo de " + app.name + " (em breve)");
      logo.textContent = initials(app.name);
    }
    top.appendChild(logo);
    if (app.sector) top.appendChild(el("span", "app-sector", app.sector));
    li.appendChild(top);

    var body = el("div", "app-body");
    body.appendChild(el("h3", "app-name", app.name));
    if (app.subtitle) body.appendChild(el("p", "app-sub", app.subtitle));
    var metaParts = [];
    if (app.downloads) metaParts.push(el("span", null, app.downloads + " downloads"));
    if (app.rating != null) {
      var r = el("span", "rating", "★ " + app.rating.toFixed(1));
      if (app.reviewCount != null) {
        var rc = el("span", null, " (" + app.reviewCount.toLocaleString("pt-BR") + ")");
        r.appendChild(rc);
      }
      metaParts.push(r);
    }
    if (app.period) metaParts.push(el("span", null, app.period));
    if (metaParts.length) {
      var meta = el("div", "app-meta");
      metaParts.forEach(function (m) { meta.appendChild(m); });
      body.appendChild(meta);
    }
    li.appendChild(body);

    if (app.technologies && app.technologies.length) {
      var chips = el("div", "app-chips");
      app.technologies.forEach(function (t) { chips.appendChild(el("span", "chip", t)); });
      li.appendChild(chips);
    }

    var foot = el("div", "app-foot");
    var platforms = (app.platforms || []).slice();
    if (app.androidUrl && platforms.indexOf("android") < 0) platforms.push("android");
    if (app.iosUrl && platforms.indexOf("ios") < 0) platforms.push("ios");
    ["android", "ios", "web"].forEach(function (p) {
      if (platforms.indexOf(p) < 0) return;
      if (p === "android" && app.androidUrl) foot.appendChild(storeLink(app, "android"));
      else if (p === "ios" && app.iosUrl) foot.appendChild(storeLink(app, "ios"));
      else foot.appendChild(el("span", "store-tag", p === "android" ? "Android" : p === "ios" ? "iOS" : "Web"));
    });
    if (app.private && !app.androidUrl && !app.iosUrl) foot.appendChild(el("span", "app-note", "Projeto privado"));
    if (app.caseUrl) {
      var c = el("a", "app-case", "Ver case study →");
      c.href = app.caseUrl;
      c.setAttribute("aria-label", "Ver case study de " + app.name);
      foot.appendChild(c);
    }
    if (foot.childNodes.length) li.appendChild(foot);
    return li;
  }

  var exp = data.expected;
  if (exp) {
    var bad = data.apps.length !== exp.total;
    data.groups.forEach(function (g) {
      if (data.apps.filter(function (a) { return a.group === g.id; }).length !== exp[g.id]) bad = true;
    });
    if (bad && window.console) console.error("LUCKSREI_APPS: contagem diferente do esperado", exp);
  }

  var counts = { all: data.apps.length };
  data.groups.forEach(function (g) {
    counts[g.id] = data.apps.filter(function (a) { return a.group === g.id; }).length;
  });

  var sections = {};
  data.groups.forEach(function (g) {
    var sec = el("section", "apps-group");
    sec.id = g.id;
    sec.setAttribute("aria-labelledby", "g-" + g.id);
    var head = el("div", "apps-group-head");
    var h2 = el("h2", null, g.title);
    h2.id = "g-" + g.id;
    head.appendChild(h2);
    if (g.intro) head.appendChild(el("p", null, g.intro));
    sec.appendChild(head);
    var ul = el("ul", "apps-grid");
    data.apps.filter(function (a) { return a.group === g.id; }).forEach(function (a) { ul.appendChild(card(a)); });
    sec.appendChild(ul);
    root.appendChild(sec);
    sections[g.id] = sec;
  });

  var buttons = {};
  function addFilter(id, label) {
    var b = el("button", "apps-filter");
    b.type = "button";
    b.setAttribute("aria-pressed", "false");
    b.appendChild(document.createTextNode(label));
    b.appendChild(el("span", "count", String(counts[id])));
    b.addEventListener("click", function () { setFilter(id, true); });
    filtersEl.appendChild(b);
    buttons[id] = b;
  }
  addFilter("all", "Todos");
  data.groups.forEach(function (g) { addFilter(g.id, g.filter); });

  function setFilter(id, push) {
    if (!buttons[id]) id = "all";
    Object.keys(buttons).forEach(function (k) { buttons[k].setAttribute("aria-pressed", k === id ? "true" : "false"); });
    Object.keys(sections).forEach(function (k) { sections[k].hidden = !(id === "all" || id === k); });
    if (push && window.history && history.replaceState) {
      history.replaceState(null, "", id === "all" ? location.pathname : "#" + id);
    }
  }

  var initial = (location.hash || "").replace("#", "");
  setFilter(buttons[initial] ? initial : "all", false);
})();
