/* Lucksrei — formulário "Send Message" (home e /contact/).
 *
 * Envia JSON para POST /api/contact (worker/contact.mjs). O sucesso só aparece depois da confirmação do servidor
 * (HTTP 200 com { ok: true }); em qualquer erro o texto digitado é mantido. Validação aqui é conforto de UX;
 * a validação que vale é a do servidor. Os limites abaixo precisam bater com worker/contact.mjs.
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
      if (res.status === 429) key = "contact.form.fail_rate";
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
      var timer = ctl ? root.setTimeout(function () { ctl.abort(); }, 20000) : null;
      var payload = {
        name: clean(values.name).replace(/\s+/g, " "), email: clean(values.email), subject: values.subject,
        message: clean(values.message), website: form.elements.website.value, ts: loadedAt, locale: I18N ? I18N.getLocale() : "en"
      };
      root.fetch("/api/contact", {
        method: "POST", headers: { "content-type": "application/json", accept: "application/json" },
        body: JSON.stringify(payload), signal: ctl ? ctl.signal : undefined, credentials: "same-origin"
      })
        .then(function (r) { return r.json().catch(function () { return null; }).then(function (b) { return { status: r.status, body: b }; }); })
        .then(onResult, function () { setStatus("error", "contact.form.fail_network"); })
        .then(function () { if (timer) root.clearTimeout(timer); setBusy(false); });
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
  }

  return { validate: validate, LIMITS: LIMITS, SUBJECTS: SUBJECTS, init: init };
});
