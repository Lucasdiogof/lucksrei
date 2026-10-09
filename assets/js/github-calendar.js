/* Lucksrei — calendário de contribuições do GitHub (últimos 12 meses).
 *
 * Os dados vêm de /api/github-contributions (worker/github.mjs), nunca direto do GitHub e sem token no navegador.
 * Resposta: { login, total, source, days: [[AAAA-MM-DD, contribuições, nível 0–4], ...] } em ordem crescente.
 * Sem dados reais, mostra um estado de erro; nada é inventado ou simulado.
 * Teclado: o calendário recebe foco; setas ↑↓ andam 1 dia e ←→ 1 semana; o valor é lido em voz alta (aria-live).
 */
(function (root, factory) {
  "use strict";
  var api = factory(root);
  if (typeof module === "object" && module.exports) module.exports = api;
  else root.LucksreiGithub = api;
  if (root.document && root.document.getElementById) api.init();
})(typeof window !== "undefined" ? window : this, function (root) {
  "use strict";

  var ENDPOINT = "/api/github-contributions";

  // dias [[data, n, nível]] → colunas de semanas começando no domingo; dias fora do intervalo ficam null
  function toWeeks(days) {
    if (!days || !days.length) return [];
    var first = new Date(days[0][0] + "T00:00:00Z");
    var pad = first.getUTCDay();
    var cells = [];
    for (var i = 0; i < pad; i++) cells.push(null);
    days.forEach(function (d) { cells.push(d); });
    var weeks = [];
    for (var j = 0; j < cells.length; j += 7) weeks.push(cells.slice(j, j + 7));
    return weeks;
  }

  // índice da semana onde cada mês começa (usa o primeiro dia 1–7 visível; ignora o mês que cabe em < 2 colunas no começo)
  function monthMarks(weeks) {
    var marks = [];
    var lastMonth = -1;
    weeks.forEach(function (w, i) {
      var d = w.find(function (x) { return x; });
      if (!d) return;
      var m = Number(d[0].slice(5, 7));
      if (m !== lastMonth) { marks.push({ week: i, month: m, date: d[0] }); lastMonth = m; }
    });
    if (marks.length > 1 && marks[1].week - marks[0].week < 2) marks.shift();
    return marks;
  }

  function validPayload(p) {
    if (!p || !Array.isArray(p.days) || !p.days.length) return false;
    return p.days.every(function (d) {
      return Array.isArray(d) && /^\d{4}-\d{2}-\d{2}$/.test(d[0]) && d[1] >= 0 && d[2] >= 0 && d[2] <= 4;
    });
  }

  function init() {
    var host = root.document.getElementById("gh-calendar");
    if (!host) return;
    var I18N = root.LucksreiI18n;
    var t = function (k, v) { return I18N ? I18N.t(k, v) : k; };
    var loc = function () { return I18N ? I18N.getLocale() : "en"; };
    var login = host.getAttribute("data-login") || "Lucasdiogof";
    var profile = "https://github.com/" + login;
    var state = "idle";
    var payload = null;
    var weeks = [];
    var active = -1;
    var cellEls = [];
    var tip = null;
    var live = null;

    var fmtDate = function (iso, long) {
      var d = new Date(iso + "T00:00:00Z");
      return new Intl.DateTimeFormat(loc(), long ? { dateStyle: "long", timeZone: "UTC" } : { month: "short", timeZone: "UTC" }).format(d);
    };
    var nf = function (n) { return new Intl.NumberFormat(loc()).format(n); };
    var tipText = function (d) {
      var key = d[1] === 0 ? "github.tip_none" : d[1] === 1 ? "github.tip_one" : "github.tip_many";
      return t(key, { n: nf(d[1]), date: fmtDate(d[0], true) });
    };
    var mk = function (tag, cls, text) {
      var n = root.document.createElement(tag);
      if (cls) n.className = cls;
      if (text != null) n.textContent = text;
      return n;
    };

    function message(key, withRetry) {
      host.setAttribute("aria-busy", key === "github.loading" ? "true" : "false");
      host.textContent = "";
      var p = mk("p", "gh-state", t(key));
      p.id = "gh-state";
      p.setAttribute("role", "status");
      host.appendChild(p);
      if (withRetry) {
        var b = mk("button", "gh-retry", t("github.retry"));
        b.type = "button";
        b.addEventListener("click", function () { load(true); });
        host.appendChild(b);
      }
      var a = mk("a", "gh-link", t("github.profile") + " ↗");
      a.href = profile; a.target = "_blank"; a.rel = "noopener";
      host.appendChild(a);
    }

    function showTip(i) {
      var c = cellEls[i];
      if (!c || !tip) return;
      var d = c._d;
      tip.textContent = tipText(d);
      tip.hidden = false;
      var hr = host.getBoundingClientRect();
      var cr = c.getBoundingClientRect();
      var x = cr.left - hr.left + cr.width / 2;
      var half = tip.offsetWidth / 2 + 8;
      tip.style.left = Math.max(half, Math.min(hr.width - half, x)) + "px";
      tip.style.top = cr.top - hr.top - 8 + "px";
    }
    function hideTip() { if (tip) tip.hidden = true; }

    function setActive(i, announce) {
      if (active >= 0 && cellEls[active]) cellEls[active].classList.remove("is-active");
      active = i;
      var c = cellEls[i];
      if (!c) return;
      c.classList.add("is-active");
      showTip(i);
      if (announce && live) live.textContent = tipText(c._d);
      if (announce && c.scrollIntoView) c.scrollIntoView({ block: "nearest", inline: "nearest" });
    }

    function render() {
      weeks = toWeeks(payload.days);
      var marks = monthMarks(weeks);
      host.textContent = "";
      host.setAttribute("aria-busy", "false");
      cellEls = [];
      active = -1;

      var head = mk("div", "gh-head-row");
      head.appendChild(mk("p", "gh-total", t("github.total", { n: nf(payload.total) })));
      host.appendChild(head);

      var scroll = mk("div", "gh-scroll");
      scroll.tabIndex = 0;
      scroll.setAttribute("role", "group");
      scroll.setAttribute("aria-label", t("github.grid_aria") + ". " + t("github.total", { n: nf(payload.total) }));
      var cal = mk("div", "gh-cal");
      cal.style.setProperty("--w", weeks.length);

      var months = mk("div", "gh-months");
      months.setAttribute("aria-hidden", "true");
      marks.forEach(function (m) {
        var s = mk("span", null, fmtDate(m.date, false));
        s.style.gridColumn = m.week + 1;
        months.appendChild(s);
      });
      cal.appendChild(months);

      var dow = mk("div", "gh-dow");
      dow.setAttribute("aria-hidden", "true");
      [1, 3, 5].forEach(function (n) {
        var ref = new Date(Date.UTC(2023, 0, 1 + n)); // 2023-01-01 foi domingo
        var s = mk("span", null, new Intl.DateTimeFormat(loc(), { weekday: "short", timeZone: "UTC" }).format(ref));
        s.style.gridRow = n + 1;
        dow.appendChild(s);
      });
      cal.appendChild(dow);

      var days = mk("div", "gh-days");
      days.setAttribute("aria-hidden", "true");
      var idx = 0;
      weeks.forEach(function (w) {
        for (var r = 0; r < 7; r++) {
          var d = w[r];
          var c = mk("i", d ? "gh-day lv" + d[2] : "gh-day is-pad");
          if (d) { c._d = d; c._i = idx; cellEls.push(c); idx++; }
          days.appendChild(c);
        }
      });
      cal.appendChild(days);
      scroll.appendChild(cal);
      host.appendChild(scroll);

      tip = mk("div", "gh-tip");
      tip.hidden = true;
      tip.setAttribute("aria-hidden", "true");
      host.appendChild(tip);
      live = mk("div", "gh-live");
      live.setAttribute("aria-live", "polite");
      host.appendChild(live);

      var foot = mk("div", "gh-foot");
      var left = mk("p", "gh-note", t("github.note"));
      var right = mk("div", "gh-foot-right");
      var link = mk("a", "gh-link", t("github.profile") + " ↗");
      link.href = profile; link.target = "_blank"; link.rel = "noopener";
      var legend = mk("div", "gh-legend");
      legend.setAttribute("aria-hidden", "true");
      legend.appendChild(mk("span", null, t("github.less")));
      for (var l = 0; l < 5; l++) legend.appendChild(mk("i", "gh-day lv" + l));
      legend.appendChild(mk("span", null, t("github.more")));
      right.appendChild(legend);
      right.appendChild(link);
      foot.appendChild(left);
      foot.appendChild(right);
      host.appendChild(foot);

      days.addEventListener("mouseover", function (e) {
        var c = e.target.closest && e.target.closest(".gh-day");
        if (c && c._d) showTip(c._i);
      });
      days.addEventListener("mouseleave", function () { if (active < 0) hideTip(); else showTip(active); });
      days.addEventListener("click", function (e) {
        var c = e.target.closest && e.target.closest(".gh-day");
        if (c && c._d) setActive(c._i, false);
      });
      scroll.addEventListener("focus", function () { if (active < 0) setActive(cellEls.length - 1, true); else showTip(active); });
      scroll.addEventListener("blur", function () { hideTip(); });
      scroll.addEventListener("keydown", function (e) {
        var step = { ArrowUp: -1, ArrowDown: 1, ArrowLeft: -7, ArrowRight: 7, Home: -9999, End: 9999 }[e.key];
        if (step == null) return;
        e.preventDefault();
        var n = Math.max(0, Math.min(cellEls.length - 1, (active < 0 ? cellEls.length - 1 : active) + step));
        setActive(n, true);
      });

      // começa mostrando a data mais recente (como no GitHub)
      scroll.scrollLeft = scroll.scrollWidth;
    }

    function load(force) {
      if (state === "loading") return;
      state = "loading";
      message("github.loading", false);
      var ctl = typeof AbortController === "function" ? new AbortController() : null;
      var timer = ctl ? root.setTimeout(function () { ctl.abort(); }, 12000) : null;
      root.fetch(ENDPOINT, { cache: force ? "reload" : "default", headers: { accept: "application/json" }, signal: ctl ? ctl.signal : undefined })
        .then(function (r) { if (!r.ok) throw new Error("http " + r.status); return r.json(); })
        .then(function (p) {
          if (!validPayload(p)) throw new Error("payload");
          payload = p;
          state = "ready";
          if (!p.total && !p.days.some(function (d) { return d[1] > 0; })) { state = "empty"; message("github.empty", false); return; }
          render();
        })
        .catch(function () { state = "error"; message("github.error", true); })
        .then(function () { if (timer) root.clearTimeout(timer); });
    }

    root.document.addEventListener("lucksrei:locale", function () {
      if (state === "ready" && payload) render();
      else if (state === "error") message("github.error", true);
      else if (state === "empty") message("github.empty", false);
      else if (state === "loading") message("github.loading", false);
    });

    if ("IntersectionObserver" in root) {
      var io = new root.IntersectionObserver(function (entries, obs) {
        if (entries.some(function (x) { return x.isIntersecting; })) { obs.disconnect(); load(false); }
      }, { rootMargin: "400px 0px" });
      io.observe(host);
    } else {
      load(false);
    }
  }

  return { toWeeks: toWeeks, monthMarks: monthMarks, validPayload: validPayload, init: init };
});
