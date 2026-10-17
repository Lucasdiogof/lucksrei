/* Lucksrei — formulário "Send Message" (home e /contact/).
 *
 * Envia JSON para POST /api/contact (worker/contact.mjs). O sucesso só aparece depois da confirmação do servidor
 * (HTTP 200 com { ok: true }); em qualquer erro o texto digitado é mantido. Validação aqui é conforto de UX;
 * a validação que vale é a do servidor. Os limites abaixo precisam bater com worker/contact.mjs.
 *
 * Turnstile: o <form> só leva o marcador data-turnstile-contact; a sitekey (pública) vem do Worker em GET /api/turnstile-config,
 * buscada quando o formulário se aproxima da tela (não no carregamento da página). Sem sitekey ({enabled:false}) ou se essa
 * rota falhar, nada de terceiros é carregado. O front NUNCA bloqueia o envio por causa do Turnstile: se o script não
 * carregar, o widget falhar ou o token não vier em poucos segundos, o POST sai sem token e quem decide é o servidor (a
 * verificação só é obrigatória quando está totalmente ativada lá; ver worker/contact.mjs e docs/security.md).
 * Widget em modo "interaction-only". Cada token vale uma tentativa: é consumido ao enviar e o widget é reiniciado depois.
 * Tema e idioma do widget seguem os do site.
 */
(function (root, factory) {
  "use strict";
  var api = factory(root);
  if (typeof module === "object" && module.exports) module.exports = api;
  else root.LucksreiContact = api;
  if (root.document && root.document.querySelector) api.init();
})(typeof window !== "undefined" ? window : this, function (root) {
  "use strict";

  var LIMITS = { nameMin: 2, nameMax: 80, emailMax: 254, messageMin: 10, messageMax: 2000 };
  var SUBJECTS = ["hiring", "collab", "other"];
  var EMAIL_RE = /^[A-Za-z0-9.!#$%&'*+\/=?^_`{|}~-]+@[A-Za-z0-9](?:[A-Za-z0-9-]*[A-Za-z0-9])?(?:\.[A-Za-z0-9](?:[A-Za-z0-9-]*[A-Za-z0-9])?)*\.[A-Za-z]{2,}$/;

  function clean(v) { return String(v == null ? "" : v).replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/g, "").trim(); }

  // devolve { name, email, subject, message } de erros (chave de i18n) — vazio = válido
  function validate(v) {
    var e = {};
    var name = clean(v.name).replace(/\s+/g, " ");
    var email = clean(v.email);
    var msg = clean(v.message);
    if (name.length < LIMITS.nameMin || name.length > LIMITS.nameMax) e.name = "contact.form.err_name";
    if (!email || email.length > LIMITS.emailMax || !EMAIL_RE.test(email)) e.email = "contact.form.err_email";
    if (SUBJECTS.indexOf(v.subject) < 0) e.subject = "contact.form.err_subject";
    if (msg.length < LIMITS.messageMin || msg.length > LIMITS.messageMax) e.message = "contact.form.err_message";
    return e;
  }

  var TURNSTILE_SRC = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
  var TS_LANG = { en: "en", "pt-BR": "pt-br", es: "es" };
  var TS_WAIT_MS = 4500;
  var TS_POLL_MS = 150;

  // Obtém (no máximo) um token do Turnstile por tentativa. Nunca decide nada: sem token, obtain() resolve "".
  // o.fetchConfig() -> Promise<{ enabled, sitekey }> (GET /api/turnstile-config); qualquer falha dela = sem Turnstile.
  function createTurnstile(o) {
    var win = o.root, box = o.box;
    var st = { token: "", widget: null, failed: false, sitekey: "", config: "idle" };   // config: idle | pending | on | off
    var waitMs = o.waitMs == null ? TS_WAIT_MS : o.waitMs;

    function theme() { return win.document.documentElement.getAttribute("data-theme") === "light" ? "light" : "dark"; }

    function render() {
      if (!win.turnstile || !st.sitekey) return;
      if (st.widget !== null) { try { win.turnstile.remove(st.widget); } catch (e) { /* já removido */ } st.widget = null; st.token = ""; }
      try {
        st.widget = win.turnstile.render(box, {
          sitekey: st.sitekey, action: "contact", theme: theme(), appearance: "interaction-only",
          language: TS_LANG[o.getLocale()] || "auto",
          callback: function (tok) { st.token = tok; st.failed = false; },
          "expired-callback": function () { st.token = ""; },
          "error-callback": function () { st.token = ""; st.failed = true; }
        });
        st.failed = false;
      } catch (e) { st.failed = true; }
    }

    function loadScript() {
      if (win.turnstile) { if (st.widget === null) render(); return; }
      if (win.document.getElementById("cf-turnstile-api")) return;
      var sc = win.document.createElement("script");
      sc.id = "cf-turnstile-api"; sc.src = TURNSTILE_SRC; sc.async = true; sc.defer = true;
      sc.onload = render;
      sc.onerror = function () { st.failed = true; };
      win.document.head.appendChild(sc);
    }

    // busca a configuração uma vez; só então carrega o script da Cloudflare
    function load() {
      if (st.config === "on") return loadScript();
      if (st.config !== "idle") return;
      st.config = "pending";
      var p;
      try { p = Promise.resolve(o.fetchConfig()); } catch (e) { p = Promise.reject(e); }
      p.then(function (cfg) {
        if (cfg && cfg.enabled === true && typeof cfg.sitekey === "string" && cfg.sitekey) { st.sitekey = cfg.sitekey; st.config = "on"; loadScript(); }
        else st.config = "off";
      }, function () { st.config = "off"; });
    }

    // espera pouco: o widget costuma resolver em < 1 s. Sem Turnstile (config desligada ou falha), script bloqueado ou erro do widget: nada de espera.
    function obtain() {
      load();
      return new Promise(function (resolve) {
        var waited = 0;
        (function poll() {
          if (st.token) { var tok = st.token; st.token = ""; return resolve(tok); }   // consumido: não pode ser reutilizado
          if (st.config === "off" || st.failed || waited >= waitMs) return resolve("");
          waited += TS_POLL_MS;
          win.setTimeout(poll, TS_POLL_MS);
        })();
      });
    }

    // depois de qualquer tentativa que usou token: um token novo para a próxima
    function reset() {
      st.token = "";
      if (st.widget !== null && win.turnstile) { try { win.turnstile.reset(st.widget); } catch (e) { st.failed = true; } }
    }

    function rerender() { if (st.widget !== null) render(); }

    return { load: load, obtain: obtain, reset: reset, rerender: rerender, state: st };
  }

  function init() {
    var form = root.document.querySelector("form[data-contact-form]");
    if (!form) return;
    var I18N = root.LucksreiI18n;
    var t = function (k, v) { return I18N ? I18N.t(k, v) : k; };
    var fields = ["name", "email", "subject", "message"];
    var els = {};
    fields.forEach(function (f) { els[f] = form.elements[f]; });
    var errEls = {};
    fields.forEach(function (f) { errEls[f] = form.querySelector("#cf-" + f + "-err"); });
    var count = form.querySelector("#cf-message-count");
    var status = form.querySelector(".cf-status");
    var btn = form.querySelector(".cf-submit");
    var btnLabel = btn.querySelector("[data-i18n]");
    var loadedAt = Date.now();
    var busy = false;
    var shownErrors = {};
    var statusKey = null;
    var statusKind = null;
    var withTurnstile = form.hasAttribute("data-turnstile-contact");
    var gate = null;

    function setLabel(key) { btnLabel.setAttribute("data-i18n", key); btnLabel.textContent = t(key); }

    function showErrors(e) {
      shownErrors = e;
      fields.forEach(function (f) {
        var on = !!e[f];
        els[f].setAttribute("aria-invalid", on ? "true" : "false");
        errEls[f].hidden = !on;
        errEls[f].textContent = on ? t(e[f], { min: LIMITS.messageMin }) : "";
      });
    }

    function setStatus(kind, key) {
      statusKind = kind; statusKey = key;
      status.setAttribute("data-kind", kind || "");
      status.textContent = "";
      if (!key) return;
      if (kind === "success") {
        var h = root.document.createElement("p");
        h.className = "cf-ok-title";
        h.textContent = t("contact.form.ok_title");
        status.appendChild(h);
      }
      var p = root.document.createElement("p");
      p.textContent = t(key);
      status.appendChild(p);
      if (kind === "success") {
        var again = root.document.createElement("button");
        again.type = "button";
        again.className = "cf-again";
        again.textContent = t("contact.form.ok_again");
        again.addEventListener("click", function () {
          setStatus(null, null);
          form.classList.remove("is-done");
          loadedAt = Date.now();
          els.name.focus();
        });
        status.appendChild(again);
      }
    }

    function updateCount() {
      count.textContent = t("contact.form.counter", { n: els.message.value.length, max: LIMITS.messageMax });
    }

    function mountTurnstile() {
      var box = root.document.createElement("div");
      box.className = "cf-turnstile-box";
      form.querySelector(".cf-actions").parentNode.insertBefore(box, form.querySelector(".cf-actions"));
      gate = createTurnstile({
        root: root, box: box, getLocale: function () { return I18N ? I18N.getLocale() : "en"; },
        fetchConfig: function () {
          return root.fetch("/api/turnstile-config", { credentials: "same-origin", headers: { accept: "application/json" } })
            .then(function (r) { if (!r.ok) throw new Error("config"); return r.json(); });
        }
      });
      if ("IntersectionObserver" in root) {
        var io = new root.IntersectionObserver(function (entries, obs) {
          if (entries.some(function (x) { return x.isIntersecting; })) { obs.disconnect(); gate.load(); }
        }, { rootMargin: "300px 0px" });
        io.observe(form);
      } else {
        gate.load();
      }
      form.addEventListener("focusin", gate.load);
      root.document.addEventListener("lucksrei:locale", gate.rerender);
      if (typeof root.MutationObserver === "function") {
        new root.MutationObserver(gate.rerender).observe(root.document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
      }
    }

    function setBusy(on) {
      busy = on;
      form.setAttribute("aria-busy", on ? "true" : "false");
      btn.disabled = on;
      setLabel(on ? "contact.form.sending" : "contact.form.send");
    }

    function onResult(res) {
      if (res.status === 200 && res.body && res.body.ok === true) {
        fields.forEach(function (f) { els[f].value = ""; });
        updateCount();
        showErrors({});
        form.classList.add("is-done");
        setStatus("success", "contact.form.ok");
        var again = status.querySelector(".cf-again");
        if (again) again.focus();
        return;
      }
      var key = "contact.form.fail";
      if (res.body && (res.body.error === "captcha" || res.body.error === "captcha_unavailable")) key = "contact.form.fail_captcha";
      else if (res.status === 429) key = "contact.form.fail_rate";
      else if (res.status === 503) key = "contact.form.fail_unavailable";
      if (res.status === 400 && res.body && Array.isArray(res.body.fields)) {
        var e = validate({ name: els.name.value, email: els.email.value, subject: els.subject.value, message: els.message.value });
        res.body.fields.forEach(function (f) { if (!e[f] && fields.indexOf(f) >= 0) e[f] = "contact.form.err_" + f; });
        showErrors(e);
      }
      setStatus("error", key);
    }

    form.addEventListener("submit", function (ev) {
      ev.preventDefault();
      if (busy) return;
      var values = { name: els.name.value, email: els.email.value, subject: els.subject.value, message: els.message.value };
      var e = validate(values);
      showErrors(e);
      var firstBad = fields.filter(function (f) { return e[f]; })[0];
      if (firstBad) {
        setStatus("error", "contact.form.err_summary");
        els[firstBad].focus();
        return;
      }
      setStatus(null, null);
      setBusy(true);
      var ctl = typeof AbortController === "function" ? new AbortController() : null;
      var timer = null;
      var payload = {
        name: clean(values.name).replace(/\s+/g, " "), email: clean(values.email), subject: values.subject,
        message: clean(values.message), website: form.elements.website.value, ts: loadedAt, locale: I18N ? I18N.getLocale() : "en"
      };
      var usedToken = false;
      (gate ? gate.obtain() : Promise.resolve("")).then(function (token) {
        if (token) { payload.turnstileToken = token; usedToken = true; }   // sem token o POST sai igual: o servidor decide
        timer = ctl ? root.setTimeout(function () { ctl.abort(); }, 20000) : null;
        return root.fetch("/api/contact", {
          method: "POST", headers: { "content-type": "application/json", accept: "application/json" },
          body: JSON.stringify(payload), signal: ctl ? ctl.signal : undefined, credentials: "same-origin"
        })
          .then(function (r) { return r.json().catch(function () { return null; }).then(function (b) { return { status: r.status, body: b }; }); })
          .then(onResult, function () { setStatus("error", "contact.form.fail_network"); });
      })
        .then(function () { if (timer) root.clearTimeout(timer); if (usedToken) gate.reset(); setBusy(false); });
    });

    fields.forEach(function (f) {
      els[f].addEventListener("input", function () {
        if (shownErrors[f]) { var e = validate({ name: els.name.value, email: els.email.value, subject: els.subject.value, message: els.message.value }); if (!e[f]) { delete shownErrors[f]; showErrors(shownErrors); } }
        if (f === "message") updateCount();
      });
    });

    root.document.addEventListener("lucksrei:locale", function () {
      showErrors(shownErrors);
      if (statusKey) setStatus(statusKind, statusKey);
      if (busy) setLabel("contact.form.sending");
      updateCount();
    });

    updateCount();
    if (withTurnstile) mountTurnstile();
  }

  return { validate: validate, LIMITS: LIMITS, SUBJECTS: SUBJECTS, init: init, createTurnstile: createTurnstile };
});
