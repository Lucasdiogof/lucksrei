/* Lucksrei — resolução de idioma. Roda no <head>, antes da primeira pintura.
 *
 * Ordem: preferência salva (localStorage) → navigator.languages → inglês (padrão).
 * Locales aceitos somente: en, pt-BR, es.
 * Define <html lang>, carrega o dicionário do idioma e, se não for inglês, esconde o corpo
 * até o i18n.js aplicar as traduções (evita o flash de idioma errado).
 */
(function (root, factory) {
  "use strict";
  var api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  else root.LucksreiLocale = api;
  if (root.document && root.document.documentElement) api.boot(root);
})(typeof window !== "undefined" ? window : this, function () {
  "use strict";

  var SUPPORTED = ["en", "pt-BR", "es"];
  var DEFAULT = "en";
  var STORAGE_KEY = "lucksrei.locale";

  // pt, pt-BR, pt-PT → pt-BR · es, es-MX, es-AR… → es · en, en-US… → en · resto → null
  function normalize(tag) {
    if (typeof tag !== "string") return null;
    var t = tag.trim().replace("_", "-").toLowerCase();
    if (t === "pt" || t.indexOf("pt-") === 0) return "pt-BR";
    if (t === "es" || t.indexOf("es-") === 0) return "es";
    if (t === "en" || t.indexOf("en-") === 0) return "en";
    return null;
  }

  function isSupported(v) {
    return SUPPORTED.indexOf(v) >= 0;
  }

  // stored: valor salvo (só vale se for exatamente um dos 3 locales); languages: navigator.languages
  function resolve(stored, languages) {
    if (isSupported(stored)) return stored;
    var list = Array.isArray(languages) ? languages : languages ? [languages] : [];
    for (var i = 0; i < list.length; i++) {
      var n = normalize(list[i]);
      if (n) return n;
    }
    return DEFAULT;
  }

  function readStored(storage) {
    try {
      return storage ? storage.getItem(STORAGE_KEY) : null;
    } catch (e) {
      return null;
    }
  }

  function writeStored(storage, locale) {
    try {
      if (storage && isSupported(locale)) storage.setItem(STORAGE_KEY, locale);
    } catch (e) { /* storage indisponível: segue sem persistir */ }
  }

  function boot(win) {
    var nav = win.navigator || {};
    var storage;
    try { storage = win.localStorage; } catch (e) { storage = null; }
    var locale = resolve(readStored(storage), nav.languages && nav.languages.length ? Array.prototype.slice.call(nav.languages) : [nav.language]);
    var el = win.document.documentElement;
    el.setAttribute("lang", locale);
    win.LucksreiLocale.current = locale;
    if (locale !== DEFAULT) {
      el.className += " i18n-pending";
      // salvaguarda: nunca deixa a página escondida se o dicionário falhar
      win.setTimeout(function () { el.className = el.className.replace(/\bi18n-pending\b/, "").trim(); }, 3000);
    }
    // bloqueante: o dicionário precisa existir quando o i18n.js rodar
    win.document.write('<script src="/assets/i18n/' + locale + '.js"><\/script>');
  }

  return {
    SUPPORTED: SUPPORTED,
    DEFAULT: DEFAULT,
    STORAGE_KEY: STORAGE_KEY,
    normalize: normalize,
    isSupported: isSupported,
    resolve: resolve,
    readStored: readStored,
    writeStored: writeStored,
    boot: boot,
    current: DEFAULT
  };
});
