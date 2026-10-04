/* Lucksrei — motor de i18n (client-side, sem serviços externos).
 *
 * Textos: assets/i18n/<locale>.js  (window.LUCKSREI_I18N[locale] = { "chave": "texto" })
 * HTML:   data-i18n="chave"                  → innerHTML
 *         data-i18n-attr="alt:chave;aria-label:chave2"
 *         data-i18n-suffix="chave"           → sufixo dos contadores (30+, 2M+…)
 *         data-period="2023-09/present"      → período formatado com Intl
 * <html data-seo="home"> → title/description/Open Graph vêm de seo.<id>.*
 *
 * Futuro: URLs localizadas (/en/, /pt-br/, /es/) só precisam chamar setLocale() com o
 * locale da rota; nada aqui depende de URL.
 */
(function (root, factory) {
  "use strict";
  var api = factory(root);
  if (typeof module === "object" && module.exports) module.exports = api;
  else root.LucksreiI18n = api;
  if (root.document && root.document.documentElement) api.init();
})(typeof window !== "undefined" ? window : this, function (root) {
  "use strict";

  var Loc = root.LucksreiLocale || (typeof require === "function" ? require("./i18n-boot.js") : null);
  var BCP47 = { en: "en", "pt-BR": "pt-BR", es: "es" };
  var OG_LOCALE = { en: "en_US", "pt-BR": "pt_BR", es: "es_ES" };
  var current = (Loc && Loc.current) || "en";
  var DEFAULT = "en";

  function dict(locale) {
    var all = root.LUCKSREI_I18N || {};
    return all[locale] || null;
  }

  // chave → texto do idioma atual; cai para inglês e por último para a própria chave
  function t(key, vars, locale) {
    var d = dict(locale || current);
    var v = d && Object.prototype.hasOwnProperty.call(d, key) ? d[key] : null;
    if (v == null) {
      var fb = dict(DEFAULT);
      v = fb && Object.prototype.hasOwnProperty.call(fb, key) ? fb[key] : key;
    }
    if (vars) {
      Object.keys(vars).forEach(function (k) { v = v.split("{" + k + "}").join(String(vars[k])); });
    }
    return v;
  }

  function has(key, locale) {
    var d = dict(locale || current);
    return !!d && Object.prototype.hasOwnProperty.call(d, key);
  }

  function intlLocale(locale) { return BCP47[locale || current] || "en"; }

  function formatNumber(n, opts, locale) {
    return new Intl.NumberFormat(intlLocale(locale), opts).format(n);
  }

  function formatDate(date, opts, locale) {
    return new Intl.DateTimeFormat(intlLocale(locale), opts || { month: "short", year: "numeric" }).format(date);
  }

  // "2023-09/present" | "2019-02/2019-08" | "2020/2021" | "2021/2021"
  function formatPeriod(range, locale) {
    var parts = String(range).split("/");
    function one(v) {
      if (v === "present") return t("common.present", null, locale);
      var m = /^(\d{4})(?:-(\d{2}))?$/.exec(v);
      if (!m) return v;
      if (!m[2]) return m[1];
      return formatDate(new Date(Date.UTC(+m[1], +m[2] - 1, 1)), { month: "short", year: "numeric", timeZone: "UTC" }, locale);
    }
    var a = one(parts[0]);
    var b = parts[1] ? one(parts[1]) : null;
    if (b == null || a === b) return a;
    return a + " — " + b;
  }

  function apply(scope) {
    var rootEl = scope || root.document;
    if (!rootEl || !rootEl.querySelectorAll) return;
    rootEl.querySelectorAll("[data-i18n]").forEach(function (el) {
      el.innerHTML = t(el.getAttribute("data-i18n"));
    });
    rootEl.querySelectorAll("[data-i18n-attr]").forEach(function (el) {
      el.getAttribute("data-i18n-attr").split(";").forEach(function (pair) {
        var i = pair.indexOf(":");
        if (i < 1) return;
        var txt = t(pair.slice(i + 1));
        var tmp = root.document.createElement("textarea");
        tmp.innerHTML = txt; // decodifica entidades (&amp;) para o valor do atributo
        el.setAttribute(pair.slice(0, i), tmp.value);
      });
    });
    rootEl.querySelectorAll("[data-i18n-suffix]").forEach(function (el) {
      var suffix = t(el.getAttribute("data-i18n-suffix"));
      el.setAttribute("data-counter-suffix", suffix);
      if (el.hasAttribute("data-counter")) el.textContent = el.getAttribute("data-counter") + suffix;
    });
    rootEl.querySelectorAll("[data-period]").forEach(function (el) {
      el.textContent = formatPeriod(el.getAttribute("data-period"));
    });
  }

  function setMeta(selector, value) {
    var el = root.document.querySelector(selector);
    if (el && value != null) el.setAttribute("content", value);
  }

  function applySeo() {
    var id = root.document.documentElement.getAttribute("data-seo");
    if (!id) return;
    var title = t("seo." + id + ".title");
    var desc = t("seo." + id + ".description");
    var ogT = t("seo." + id + ".ogTitle");
    var ogD = t("seo." + id + ".ogDescription");
    var dec = function (s) { var x = root.document.createElement("textarea"); x.innerHTML = s; return x.value; };
    root.document.title = dec(title);
    setMeta('meta[name="description"]', dec(desc));
    setMeta('meta[property="og:title"]', dec(ogT));
    setMeta('meta[property="og:description"]', dec(ogD));
    setMeta('meta[name="twitter:title"]', dec(ogT));
    setMeta('meta[name="twitter:description"]', dec(ogD));
    setMeta('meta[property="og:locale"]', OG_LOCALE[current]);
  }

  function syncSwitcher() {
    root.document.querySelectorAll(".lang-btn").forEach(function (b) {
      var on = b.getAttribute("data-locale") === current;
      b.setAttribute("aria-pressed", on ? "true" : "false");
      if (on) b.setAttribute("aria-current", "true"); else b.removeAttribute("aria-current");
    });
  }

  function loadDict(locale, cb) {
    if (dict(locale)) return cb();
    var s = root.document.createElement("script");
    s.src = "/assets/i18n/" + locale + ".js";
    s.onload = cb;
    s.onerror = cb;
    root.document.head.appendChild(s);
  }

  function release() {
    var el = root.document.documentElement;
    el.className = el.className.replace(/\bi18n-pending\b/, "").trim();
  }

  function render(announce) {
    var el = root.document.documentElement;
    el.setAttribute("lang", current);
    apply();
    applySeo();
    syncSwitcher();
    release();
    if (announce !== false && typeof root.CustomEvent === "function") {
      root.document.dispatchEvent(new root.CustomEvent("lucksrei:locale", { detail: { locale: current } }));
    }
  }

  // persist=true só quando o usuário escolhe manualmente
  function setLocale(locale, persist) {
    if (!Loc || !Loc.isSupported(locale)) return false;
    loadDict(locale, function () {
      current = locale;
      if (Loc) Loc.current = locale;
      if (persist) {
        var st; try { st = root.localStorage; } catch (e) { st = null; }
        Loc.writeStored(st, locale);
      }
      render(true);
    });
    return true;
  }

  function init() {
    current = (Loc && Loc.current) || current;
    root.document.querySelectorAll(".lang-btn").forEach(function (b) {
      b.addEventListener("click", function () {
        var l = b.getAttribute("data-locale");
        if (l !== current) setLocale(l, true);
      });
    });
    syncSwitcher();
    if (current !== DEFAULT) render(true);
    else { applySeo(); release(); if (typeof root.CustomEvent === "function") root.document.dispatchEvent(new root.CustomEvent("lucksrei:locale", { detail: { locale: current } })); }
  }

  return {
    t: t, has: has, apply: apply, applySeo: applySeo, setLocale: setLocale, init: init,
    formatNumber: formatNumber, formatDate: formatDate, formatPeriod: formatPeriod,
    getLocale: function () { return current; },
    SUPPORTED: Loc ? Loc.SUPPORTED : ["en", "pt-BR", "es"]
  };
});
