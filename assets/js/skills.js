/* Lucksrei — Technical Skills: grade de tecnologias + modal de detalhes.
 *
 * Dados: skills-data.js (ordem e vínculos). Textos do modal: skills-details.js, carregado sob demanda
 * (pré-carregado quando a grade chega perto da tela). Strings da interface: assets/i18n (skills.*).
 * O modal é um <dialog> nativo (showModal): foco preso, fundo inerte, Escape e retorno do foco ao botão de origem.
 */
(function () {
  "use strict";

  var DATA = window.LUCKSREI_SKILLS;
  var grid = document.getElementById("skill-grid");
  if (!DATA || !grid) return;

  var I18N = window.LucksreiI18n;
  var byId = {};
  DATA.ORDER.forEach(function (s) { byId[s.id] = s; });
  var root = document.documentElement;
  var dialog = null;
  var opener = null;
  var currentId = null;
  var detailsState = window.LUCKSREI_SKILL_TEXT ? "ready" : "idle";
  var waiting = [];

  function loc() { return I18N ? I18N.getLocale() : "en"; }
  function t(key, vars) { return I18N ? I18N.t(key, vars) : key; }
  function pick(v) { return v && typeof v === "object" ? (v[loc()] || v.en) : v; }
  function label(s) { return pick(s.label) || s.name; }
  function el(tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    return n;
  }
  function logo(id, size) {
    var img = el("img", "skill-logo");
    img.src = "/assets/img/skills/" + id + ".svg";
    img.alt = "";
    img.width = size; img.height = size;
    img.decoding = "async";
    return img;
  }

  /* ---------- grade ---------- */
  function renderGrid() {
    var frag = document.createDocumentFragment();
    DATA.ORDER.forEach(function (s) {
      var li = el("li");
      var b = el("button", "skill");
      b.type = "button";
      b.setAttribute("data-skill", s.id);
      b.setAttribute("aria-haspopup", "dialog");
      b.setAttribute("aria-label", t("skills.open", { name: label(s) }));
      var img = logo(s.id, 40);
      img.loading = "lazy";
      b.appendChild(img);
      b.appendChild(el("span", "skill-name", label(s)));
      li.appendChild(b);
      frag.appendChild(li);
    });
    grid.textContent = "";
    grid.appendChild(frag);
  }

  function relabelGrid() {
    grid.querySelectorAll(".skill").forEach(function (b) {
      var s = byId[b.getAttribute("data-skill")];
      b.setAttribute("aria-label", t("skills.open", { name: label(s) }));
      b.querySelector(".skill-name").textContent = label(s);
    });
  }

  /* ---------- textos sob demanda ---------- */
  function loadDetails(cb) {
    if (detailsState === "ready" || window.LUCKSREI_SKILL_TEXT) { detailsState = "ready"; return cb(true); }
    waiting.push(cb);
    if (detailsState === "loading") return;
    detailsState = "loading";
    var sc = document.createElement("script");
    sc.src = "/assets/js/skills-details.js";
    sc.onload = function () {
      detailsState = window.LUCKSREI_SKILL_TEXT ? "ready" : "idle";
      var q = waiting; waiting = [];
      q.forEach(function (f) { f(detailsState === "ready"); });
    };
    sc.onerror = function () {
      detailsState = "idle";
      var q = waiting; waiting = [];
      q.forEach(function (f) { f(false); });
    };
    document.head.appendChild(sc);
  }

  /* ---------- modal ---------- */
  function ensureDialog() {
    if (dialog) return dialog;
    dialog = document.createElement("dialog");
    dialog.className = "skill-modal";
    dialog.setAttribute("aria-labelledby", "skill-modal-title");
    dialog.addEventListener("click", function (e) {
      if (e.target === dialog) dialog.close();
      var rel = e.target.closest && e.target.closest("[data-skill-jump]");
      if (rel) { show(rel.getAttribute("data-skill-jump"), true); return; }
      var a = e.target.closest && e.target.closest("a[href]");
      if (a) dialog.close();
    });
    dialog.addEventListener("close", function () {
      root.classList.remove("has-modal");
      root.style.removeProperty("--sbw");
      currentId = null;
      if (opener && document.contains(opener)) opener.focus({ preventScroll: true });
      opener = null;
    });
    document.body.appendChild(dialog);
    return dialog;
  }

  function section(title, node) {
    var s = el("div", "sk-sec");
    s.appendChild(el("h4", "sk-sec-title", title));
    s.appendChild(node);
    return s;
  }

  function chipList(items) {
    var ul = el("ul", "sk-chips");
    items.forEach(function (it) { ul.appendChild(it); });
    return ul;
  }

  function build(s, texts) {
    var body = dialog.querySelector(".sk-body");
    body.textContent = "";
    var tx = texts && texts[s.id] ? (texts[s.id][loc()] || texts[s.id].en) : null;

    if (!tx) {
      body.appendChild(el("p", "sk-msg", t(detailsState === "loading" ? "skills.modal.loading" : "skills.modal.error")));
      return;
    }
    body.appendChild(section(t("skills.modal.what"), el("p", "sk-text", tx[1])));
    body.appendChild(section(t("skills.modal.how"), el("p", "sk-text", tx[2])));

    if (s.exp.length) {
      var wrap = el("div");
      wrap.appendChild(chipList(s.exp.map(function (id) { return el("li", "sk-chip", pick(DATA.EXPERIENCES[id].name)); })));
      var link = el("a", "sk-link", t("skills.modal.exp_link") + " →");
      link.href = "/#experiencia";
      wrap.appendChild(link);
      body.appendChild(section(t("skills.modal.exp"), wrap));
    }

    if (s.projects.length) {
      body.appendChild(section(t("skills.modal.projects"), chipList(s.projects.map(function (id) {
        var p = DATA.PROJECTS[id];
        var li = el("li");
        var a = el("a", "sk-chip is-link", p.name);
        a.href = p.href;
        if (p.caseStudy) a.appendChild(el("span", "sk-tag", t("skills.modal.case")));
        li.appendChild(a);
        return li;
      }))));
    }

    if (s.related.length) {
      body.appendChild(section(t("skills.modal.related"), chipList(s.related.map(function (id) {
        var r = byId[id];
        var li = el("li");
        var b = el("button", "sk-chip is-rel");
        b.type = "button";
        b.setAttribute("data-skill-jump", id);
        b.appendChild(logo(id, 16));
        b.appendChild(document.createTextNode(label(r)));
        li.appendChild(b);
        return li;
      }))));
    }
  }

  function head(s, desc) {
    var h = dialog.querySelector(".sk-head");
    h.textContent = "";
    var lg = logo(s.id, 52);
    lg.className = "skill-logo sk-logo";
    var txt = el("div", "sk-headtext");
    var title = el("h3", "sk-title", label(s));
    title.id = "skill-modal-title";
    title.tabIndex = -1;
    txt.appendChild(title);
    txt.appendChild(el("p", "sk-desc", desc || ""));
    h.appendChild(lg);
    h.appendChild(txt);
  }

  function frame() {
    ensureDialog();
    if (dialog.querySelector(".sk-head")) return;
    var close = el("button", "sk-close");
    close.type = "button";
    close.innerHTML = '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18"/></svg>';
    close.addEventListener("click", function () { dialog.close(); });
    dialog.appendChild(close);
    dialog.appendChild(el("div", "sk-head"));
    dialog.appendChild(el("div", "sk-body"));
    dialog.querySelector(".sk-close").setAttribute("aria-label", t("skills.modal.close"));
  }

  function fill(id) {
    var s = byId[id];
    var texts = window.LUCKSREI_SKILL_TEXT;
    var tx = texts && texts[id] ? (texts[id][loc()] || texts[id].en) : null;
    head(s, tx ? tx[0] : "");
    build(s, texts);
    dialog.querySelector(".sk-close").setAttribute("aria-label", t("skills.modal.close"));
  }

  function show(id, keepOpener) {
    var s = byId[id];
    if (!s) return;
    frame();
    if (!keepOpener) opener = document.activeElement;
    currentId = id;
    if (!dialog.open) {
      var sbw = window.innerWidth - root.clientWidth;
      root.style.setProperty("--sbw", sbw + "px");
      root.classList.add("has-modal");
      dialog.showModal();
    }
    fill(id);
    var token = id;
    if (detailsState !== "ready") {
      loadDetails(function () { if (dialog.open && currentId === token) fill(token); });
    }
    var title = dialog.querySelector(".sk-title");
    if (title) title.focus({ preventScroll: true });
    dialog.scrollTop = 0;
    var body = dialog.querySelector(".sk-body");
    if (body) body.scrollTop = 0;
  }

  grid.addEventListener("click", function (e) {
    var b = e.target.closest && e.target.closest(".skill");
    if (b) show(b.getAttribute("data-skill"));
  });

  renderGrid();

  if ("IntersectionObserver" in window) {
    var pre = new IntersectionObserver(function (entries, obs) {
      if (entries.some(function (x) { return x.isIntersecting; })) { obs.disconnect(); loadDetails(function () {}); }
    }, { rootMargin: "600px 0px" });
    pre.observe(grid);
  }

  document.addEventListener("lucksrei:locale", function () {
    relabelGrid();
    if (dialog && dialog.open && currentId) fill(currentId);
  });

})();
