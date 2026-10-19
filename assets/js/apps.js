/* Lucksrei — renderiza a página /apps a partir de assets/js/apps-data.js (localizado via i18n) */
(function () {
  "use strict";

  var data = window.LUCKSREI_APPS;
  var I = window.LucksreiI18n;
  var root = document.getElementById("apps-root");
  var filtersEl = document.getElementById("apps-filters");
  if (!data || !I || !root) return;

  var ICON_PLAY = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5.5 3.4v17.2c0 .8.9 1.3 1.6.9l14-8.6c.6-.4.6-1.3 0-1.7L7.1 2.5c-.7-.4-1.6.1-1.6.9z"/></svg>';
  var ICON_WEB = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2a10 10 0 100 20 10 10 0 000-20zm6.9 9h-3.1a15.6 15.6 0 00-1.2-5.3A8 8 0 0118.9 11zM12 4.1c.8 1 1.9 3.2 2.2 6.9H9.8C10.1 7.300 11.200 5.100 12 4.100zM4.300 13h3.100c.1 1.900.5 3.700 1.200 5.300A8 8 0 014.300 13zm3.100-2H4.300a8 8 0 014.300-5.300C7.900 7.300 7.500 9.100 7.400 11zM12 19.900c-.8-1-1.900-3.200-2.200-6.900h4.400c-.3 3.700-1.400 5.900-2.200 6.900zm3.400-1.600c.7-1.600 1.100-3.400 1.200-5.300h3.100a8 8 0 01-4.300 5.300z"/></svg>';
  var ICON_APPLE = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12.152 6.896c-.948 0-2.415-1.078-3.96-1.04-2.04.027-3.91 1.183-4.961 3.014-2.117 3.675-.546 9.103 1.519 12.09 1.013 1.454 2.208 3.09 3.792 3.039 1.52-.065 2.09-.987 3.935-.987 1.831 0 2.35.987 3.96.948 1.637-.026 2.676-1.48 3.676-2.948 1.156-1.688 1.636-3.325 1.662-3.415-.039-.013-3.182-1.221-3.22-4.857-.026-3.04 2.48-4.494 2.597-4.559-1.429-2.09-3.623-2.324-4.39-2.376-2-.156-3.675 1.09-4.61 1.09zM15.53 3.83c.843-1.012 1.4-2.427 1.245-3.83-1.207.052-2.662.805-3.532 1.818-.78.896-1.454 2.338-1.273 3.714 1.338.104 2.715-.688 3.559-1.701"/></svg>';

  var activeFilter = "all";

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

  function subtitleOf(app) {
    if (app.subtitleKey) return I.t(app.subtitleKey);
    var s = app.subtitle;
    if (!s) return "";
    if (typeof s === "string") return s; // nome próprio, igual em todos os idiomas
    return s[I.getLocale()] || s.en || "";
  }

  function sectorOf(app) {
    var label = app.sector ? I.t("apps.sector." + app.sector) : "";
    return label;
  }

  function storeLink(app, kind) {
    var isAndroid = kind === "android";
    var a = el("a", "store");
    a.href = isAndroid ? app.androidUrl : app.iosUrl;
    a.target = "_blank";
    a.rel = "noopener noreferrer";
    a.setAttribute("aria-label", I.t(isAndroid ? "apps.store_android_aria" : "apps.store_ios_aria", { name: app.name }));
    a.innerHTML = isAndroid ? ICON_PLAY : ICON_APPLE;
    a.appendChild(document.createTextNode(isAndroid ? "Android" : "iOS"));
    return a;
  }

  function webLink(app) {
    var a = el("a", "store");
    a.href = app.webUrl;
    a.target = "_blank";
    a.rel = "noopener noreferrer";
    a.setAttribute("aria-label", I.t("apps.store_web_aria", { name: app.name }));
    a.innerHTML = ICON_WEB;
    a.appendChild(document.createTextNode("Web"));
    return a;
  }

  function card(app) {
    var li = el("li", "app-card" + (app.group === "own" ? " is-own" : ""));
    li.setAttribute("data-app", app.id);

    var top = el("div", "app-top");
    var logo = el("div", "app-logo");
    if (app.logo) {
      var img = el("img");
      img.src = app.logo;
      img.alt = I.t("apps.logo_alt", { name: app.name });
      img.width = 56;
      img.height = 56;
      img.loading = "lazy";
      img.decoding = "async";
      logo.appendChild(img);
    } else {
      logo.classList.add("is-pending");
      logo.setAttribute("role", "img");
      logo.setAttribute("aria-label", I.t("apps.logo_pending", { name: app.name }));
      logo.textContent = initials(app.name);
    }
    top.appendChild(logo);
    var sec = sectorOf(app);
    if (sec) top.appendChild(el("span", "app-sector", sec));
    li.appendChild(top);

    var body = el("div", "app-body");
    body.appendChild(el("h3", "app-name", app.name));
    var sub = subtitleOf(app);
    if (sub) body.appendChild(el("p", "app-sub", sub));
    var metaParts = [];
    if (app.downloads) metaParts.push(el("span", null, app.downloads + " " + I.t("apps.downloads")));
    if (app.rating != null) {
      var r = el("span", "rating", "★ " + I.formatNumber(app.rating, { minimumFractionDigits: 1, maximumFractionDigits: 1 }));
      if (app.reviewCount != null) r.appendChild(el("span", null, " (" + I.formatNumber(app.reviewCount) + ")"));
      metaParts.push(r);
    }
    if (app.period) metaParts.push(el("span", null, I.formatPeriod(app.period)));
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
    var plats = el("div", "app-plats");
    ["android", "ios", "web"].forEach(function (p) {
      if (platforms.indexOf(p) < 0) return;
      if (p === "android" && app.androidUrl) plats.appendChild(storeLink(app, "android"));
      else if (p === "ios" && app.iosUrl) plats.appendChild(storeLink(app, "ios"));
      else if (p === "web" && app.webUrl) plats.appendChild(webLink(app));
      else {
        var tag = el("span", "store-tag");
        tag.innerHTML = p === "android" ? ICON_PLAY : p === "ios" ? ICON_APPLE : ICON_WEB;
        tag.appendChild(document.createTextNode(p === "android" ? "Android" : p === "ios" ? "iOS" : "Web"));
        plats.appendChild(tag);
      }
    });
    if (plats.childNodes.length) foot.appendChild(plats);
    if (app.private && !app.androidUrl && !app.iosUrl) foot.appendChild(el("span", "app-note", I.t("apps.private")));
    if (app.caseUrl) {
      var c = el("a", "app-case", I.t("apps.case"));
      c.href = app.caseUrl;
      c.setAttribute("aria-label", I.t("apps.case_aria", { name: app.name }));
      foot.appendChild(c);
    }
    if (foot.childNodes.length) li.appendChild(foot);
    return li;
  }

  function validate() {
    var exp = data.expected;
    if (!exp) return;
    var bad = data.apps.length !== exp.total;
    data.groups.forEach(function (g) {
      if (data.apps.filter(function (a) { return a.group === g.id; }).length !== exp[g.id]) bad = true;
    });
    if (bad && window.console) console.error("LUCKSREI_APPS: contagem diferente do esperado", exp);
  }

  function render() {
    var counts = { all: data.apps.length };
    data.groups.forEach(function (g) {
      counts[g.id] = data.apps.filter(function (a) { return a.group === g.id; }).length;
    });

    root.textContent = "";
    data.groups.forEach(function (g) {
      var sec = el("section", "apps-group");
      sec.id = g.id;
      sec.setAttribute("aria-labelledby", "g-" + g.id);
      var head = el("div", "apps-group-head");
      var h2 = el("h2", null, I.t("apps.group." + g.id + ".title"));
      h2.id = "g-" + g.id;
      head.appendChild(h2);
      head.appendChild(el("p", null, I.t("apps.group." + g.id + ".intro")));
      sec.appendChild(head);
      var ul = el("ul", "apps-grid");
      data.apps.filter(function (a) { return a.group === g.id; }).forEach(function (a) { ul.appendChild(card(a)); });
      sec.appendChild(ul);
      root.appendChild(sec);
    });

    if (filtersEl) filtersEl.textContent = "";
    function addFilter(id) {
      var b = el("button", "apps-filter");
      b.type = "button";
      b.setAttribute("data-filter", id);
      b.appendChild(document.createTextNode(I.t("apps.filter." + id)));
      b.appendChild(el("span", "count", String(counts[id])));
      b.addEventListener("click", function () { setFilter(id, true); });
      filtersEl.appendChild(b);
    }
    if (filtersEl) {
      addFilter("all");
      data.groups.forEach(function (g) { addFilter(g.id); });
    }
    setFilter(activeFilter, false);
  }

  function setFilter(id, push) {
    var ids = ["all"].concat(data.groups.map(function (g) { return g.id; }));
    if (ids.indexOf(id) < 0) id = "all";
    activeFilter = id;
    if (filtersEl) filtersEl.querySelectorAll(".apps-filter").forEach(function (b) {
      b.setAttribute("aria-pressed", b.getAttribute("data-filter") === id ? "true" : "false");
    });
    root.querySelectorAll(".apps-group").forEach(function (sec) { sec.hidden = !(id === "all" || id === sec.id); });
    if (push && window.history && history.replaceState) {
      history.replaceState(null, "", id === "all" ? location.pathname : "#" + id);
    }
  }

  var initial = (location.hash || "").replace("#", "");
  if (initial) activeFilter = initial;
  validate();
  render();
  document.addEventListener("lucksrei:locale", render);
})();
