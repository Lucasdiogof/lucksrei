/* Lucksrei — laboratório do catálogo /apps (NÃO publicado: _lab está no .assetsignore).
 * Base comum às três propostas: lê os dados reais de assets/js/apps-data.js, textos de assets/i18n
 * e devolve peças pequenas (logo, links de loja, link do case, metadados). Cada proposta monta o próprio DOM.
 * Textos novos do laboratório ficam em LAB_TEXT; ao integrar uma proposta, eles vão para os 3 dicionários. */
(function () {
  "use strict";

  var data = window.LUCKSREI_APPS;
  var I = window.LucksreiI18n;

  var LAB_TEXT = {
    "pt-BR": { stack: "Stack", sector: "Setor", period: "Período", platforms: "Plataformas", stores: "Lojas", index: "Índice", apps: "apps",
      brands: "marcas", oneCodebase: "uma base de código", both: "Android e iOS", noStore: "Sem link de loja", featured: "Produto em destaque",
      chooseProduct: "Escolha um produto", since: "desde", timeline: "Linha do tempo", professionalCount: "projetos", ownCount: "produtos" },
    en: { stack: "Stack", sector: "Sector", period: "Period", platforms: "Platforms", stores: "Stores", index: "Index", apps: "apps",
      brands: "brands", oneCodebase: "one codebase", both: "Android and iOS", noStore: "No store link", featured: "Featured product",
      chooseProduct: "Choose a product", since: "since", timeline: "Timeline", professionalCount: "projects", ownCount: "products" },
    es: { stack: "Stack", sector: "Sector", period: "Período", platforms: "Plataformas", stores: "Tiendas", index: "Índice", apps: "apps",
      brands: "marcas", oneCodebase: "una base de código", both: "Android e iOS", noStore: "Sin enlace de tienda", featured: "Producto destacado",
      chooseProduct: "Elige un producto", since: "desde", timeline: "Línea de tiempo", professionalCount: "proyectos", ownCount: "productos" }
  };

  var ICON = {
    android: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5.5 3.4v17.2c0 .8.9 1.3 1.6.9l14-8.6c.6-.4.6-1.3 0-1.7L7.1 2.5c-.7-.4-1.6.1-1.6.9z"/></svg>',
    ios: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12.152 6.896c-.948 0-2.415-1.078-3.96-1.04-2.04.027-3.91 1.183-4.961 3.014-2.117 3.675-.546 9.103 1.519 12.09 1.013 1.454 2.208 3.09 3.792 3.039 1.52-.065 2.09-.987 3.935-.987 1.831 0 2.35.987 3.96.948 1.637-.026 2.676-1.48 3.676-2.948 1.156-1.688 1.636-3.325 1.662-3.415-.039-.013-3.182-1.221-3.22-4.857-.026-3.04 2.48-4.494 2.597-4.559-1.429-2.09-3.623-2.324-4.39-2.376-2-.156-3.675 1.09-4.61 1.09zM15.53 3.83c.843-1.012 1.4-2.427 1.245-3.83-1.207.052-2.662.805-3.532 1.818-.78.896-1.454 2.338-1.273 3.714 1.338.104 2.715-.688 3.559-1.701"/></svg>',
    arrow: '<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M7 17 17 7M9 7h8v8"/></svg>'
  };

  function lab(key) {
    var l = I.getLocale();
    return (LAB_TEXT[l] || LAB_TEXT.en)[key] || LAB_TEXT.en[key] || key;
  }

  function el(tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    return n;
  }

  function subtitleOf(app) {
    if (app.subtitleKey) return I.t(app.subtitleKey);
    var s = app.subtitle;
    if (!s) return "";
    if (typeof s === "string") return s;
    return s[I.getLocale()] || s.en || "";
  }

  function sectorOf(app) { return app.sector ? I.t("apps.sector." + app.sector) : ""; }
  function periodOf(app) { return app.period ? I.formatPeriod(app.period) : ""; }
  function startYear(app) { var m = /^(\d{4})/.exec(app.period || ""); return m ? +m[1] : null; }

  /** Plataformas declaradas + as que têm loja (mesma regra de apps.js). */
  function platformsOf(app) {
    var p = (app.platforms || []).slice();
    if (app.androidUrl && p.indexOf("android") < 0) p.push("android");
    if (app.iosUrl && p.indexOf("ios") < 0) p.push("ios");
    return ["android", "ios", "web"].filter(function (k) { return p.indexOf(k) >= 0; });
  }
  function platformLabel(k) { return k === "android" ? "Android" : k === "ios" ? "iOS" : "Web"; }

  function logo(app, size, cls) {
    var img = el("img", cls || null);
    img.src = app.logo;
    img.alt = I.t("apps.logo_alt", { name: app.name });
    img.width = size; img.height = size;
    img.loading = "lazy"; img.decoding = "async";
    return img;
  }

  /** Link de loja real; `compact` = só o ícone (o nome da loja fica no aria-label). */
  function storeLink(app, kind, cls, compact) {
    var a = el("a", cls);
    a.href = kind === "android" ? app.androidUrl : app.iosUrl;
    a.target = "_blank";
    a.rel = "noopener noreferrer";
    a.setAttribute("aria-label", I.t(kind === "android" ? "apps.store_android_aria" : "apps.store_ios_aria", { name: app.name }));
    a.innerHTML = ICON[kind];
    if (!compact) a.appendChild(el("span", null, kind === "android" ? "Google Play" : "App Store"));
    return a;
  }

  function storeLinks(app, cls, compact) {
    var out = [];
    if (app.androidUrl) out.push(storeLink(app, "android", cls, compact));
    if (app.iosUrl) out.push(storeLink(app, "ios", cls, compact));
    return out;
  }

  /** Link do case (só quando existe caseUrl; nunca um link inventado). */
  function caseLink(app, cls, label) {
    if (!app.caseUrl) return null;
    var a = el("a", cls, label || I.t("apps.case").replace(/\s*→\s*$/, ""));
    a.href = app.caseUrl;
    a.setAttribute("aria-label", I.t("apps.case_aria", { name: app.name }));
    return a;
  }

  /** Cor tirada do próprio logo (média dos pixels saturados), para tons de produto sem inventar cor de marca. */
  var toneCache = {};
  function logoTone(app, cb) {
    if (toneCache[app.id]) return cb(toneCache[app.id]);
    var img = new Image();
    img.decoding = "async";
    img.onload = function () {
      try {
        var c = document.createElement("canvas"); c.width = c.height = 24;
        var x = c.getContext("2d", { willReadFrequently: true });
        x.drawImage(img, 0, 0, 24, 24);
        var d = x.getImageData(0, 0, 24, 24).data, r = 0, g = 0, b = 0, n = 0;
        for (var i = 0; i < d.length; i += 4) {
          if (d[i + 3] < 200) continue;
          var mx = Math.max(d[i], d[i + 1], d[i + 2]), mn = Math.min(d[i], d[i + 1], d[i + 2]);
          if (mx - mn < 40 || mx < 50) continue;           // ignora cinza, branco e preto
          r += d[i]; g += d[i + 1]; b += d[i + 2]; n++;
        }
        var tone = n > 8 ? "rgb(" + Math.round(r / n) + "," + Math.round(g / n) + "," + Math.round(b / n) + ")" : null;
        toneCache[app.id] = tone;
        cb(tone);
      } catch (e) { cb(null); }
    };
    img.onerror = function () { cb(null); };
    img.src = app.logo;
  }

  function byGroup(id) { return data.apps.filter(function (a) { return a.group === id; }); }

  function groupHead(id) {
    return { title: I.t("apps.group." + id + ".title"), intro: I.t("apps.group." + id + ".intro") };
  }

  /** Conferência que o protótipo roda no console (os 35 apps, os 3 grupos e nenhum link perdido). */
  function audit(root) {
    var total = data.apps.length;
    var rendered = {};
    root.querySelectorAll("[data-app]").forEach(function (n) { rendered[n.getAttribute("data-app")] = 1; });
    var missing = data.apps.filter(function (a) { return !rendered[a.id]; }).map(function (a) { return a.id; });
    var hrefs = {};
    root.querySelectorAll("a[href]").forEach(function (a) { hrefs[a.getAttribute("href")] = 1; });
    var lost = [];
    data.apps.forEach(function (a) {
      ["androidUrl", "iosUrl", "caseUrl"].forEach(function (k) { if (a[k] && !hrefs[a[k]]) lost.push(a.id + ":" + k); });
    });
    var nested = root.querySelectorAll("a a").length;
    var result = { total: total, rendered: Object.keys(rendered).length, missing: missing, lostLinks: lost, nestedLinks: nested };
    window.__labAudit = result;
    if (missing.length || lost.length || nested) console.error("LAB AUDIT", result); else console.info("LAB AUDIT ok", result);
    return result;
  }

  window.LucksreiLab = {
    data: data, I: I, el: el, lab: lab, ICON: ICON, subtitleOf: subtitleOf, sectorOf: sectorOf, periodOf: periodOf,
    startYear: startYear, platformsOf: platformsOf, platformLabel: platformLabel, logo: logo, storeLink: storeLink,
    storeLinks: storeLinks, caseLink: caseLink, logoTone: logoTone, byGroup: byGroup, groupHead: groupHead, audit: audit,
    /** Renderiza e re-renderiza a cada troca de idioma. */
    mount: function (render) {
      var root = document.getElementById("apps-root");
      if (!data || !I || !root) return;
      function run() { root.textContent = ""; render(root); audit(root); }
      run();
      document.addEventListener("lucksrei:locale", run);
    }
  };
})();
