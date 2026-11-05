/* Lucksrei Systems: consent, tracking, UTM hand-off to checkout and the screenshot lightbox. No dependencies.
 * Marketing tags load ONLY after "Aceitar" and only for IDs set in tracking-config.js. A checkout click is never reported as a purchase. */
(function () {
  "use strict";
  var KEY = "lx_consent";
  var cfg = window.LX_TRACKING || {};
  var product = (document.currentScript && document.currentScript.getAttribute("data-product")) || "";
  var loaded = false;

  function stored() { try { return localStorage.getItem(KEY); } catch (e) { return null; } }
  function store(v) { try { localStorage.setItem(KEY, v); } catch (e) { /* private mode: the choice lasts for this page only */ } }

  // ---- UTM: kept in memory only (no cookie, no storage), forwarded to Hotmart as src/sck so purchases can be attributed ----
  var q = new URLSearchParams(location.search);
  var clean = function (v) { return (v || "").replace(/[^A-Za-z0-9_.-]/g, "").slice(0, 40); };
  var utm = { source: clean(q.get("utm_source")), medium: clean(q.get("utm_medium")), campaign: clean(q.get("utm_campaign")) };
  function decorateCheckout() {
    if (!utm.source && !utm.campaign) return;
    [].forEach.call(document.querySelectorAll('a[data-track="checkout_click"]'), function (a) {
      var u = new URL(a.href);
      if (utm.source) u.searchParams.set("src", utm.source);
      u.searchParams.set("sck", [a.dataset.product, a.dataset.days, utm.medium, utm.campaign].map(clean).filter(Boolean).join("_"));
      a.href = u.toString();
    });
  }

  // ---- tag loading (after consent) ----
  function loadTags() {
    if (loaded) return; loaded = true;
    window.dataLayer = window.dataLayer || [];
    window.gtag = function () { window.dataLayer.push(arguments); };
    var first = cfg.ga4 || cfg.googleAds;
    if (first) {
      var s = document.createElement("script"); s.async = true;
      s.src = "https://www.googletagmanager.com/gtag/js?id=" + encodeURIComponent(first);
      document.head.appendChild(s);
      window.gtag("js", new Date());
      if (cfg.ga4) window.gtag("config", cfg.ga4, { send_page_view: false });
      if (cfg.googleAds) window.gtag("config", cfg.googleAds);
    }
    if (cfg.metaPixel) {
      /* eslint-disable */
      !function (f, b, e, v, n, t, s) { if (f.fbq) return; n = f.fbq = function () { n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments); }; if (!f._fbq) f._fbq = n; n.push = n; n.loaded = !0; n.version = "2.0"; n.queue = []; t = b.createElement(e); t.async = !0; t.src = v; s = b.getElementsByTagName(e)[0]; s.parentNode.insertBefore(t, s); }(window, document, "script", "https://connect.facebook.net/en_US/fbevents.js");
      window.fbq("init", cfg.metaPixel);
      /* eslint-enable */
    }
    track("page_view", { product: product });
  }

  var MAP = { // our event -> [GA4 name, Meta standard/custom event]
    page_view: ["page_view", "PageView"],
    cta_click: ["cta_click", "ViewContent"],
    checkout_click: ["select_checkout", "InitiateCheckout"], // click only: NOT a purchase
    marketplace_click: ["marketplace_click", "Lead"],
    store_click: ["store_click", null],
    app_link_click: ["app_link_click", null]
  };
  function track(name, p) {
    p = p || {};
    window.lxEvents = window.lxEvents || [];
    if (stored() !== "granted") return; // consent denied or undecided: nothing is sent or even queued
    window.lxEvents.push({ name: name, params: p });
    var m = MAP[name]; if (!m) return;
    if (window.gtag) window.gtag("event", m[0], p);
    if (window.fbq && m[1]) { if (name === "page_view") window.fbq("track", "PageView"); else window.fbq("track", m[1], p); }
  }

  // ---- consent banner ----
  var banner = document.getElementById("consent");
  function setConsent(v) {
    store(v); if (banner) banner.hidden = true;
    if (v === "granted") loadTags();
  }
  if (banner) {
    banner.addEventListener("click", function (e) { var b = e.target.closest("[data-consent]"); if (b) setConsent(b.dataset.consent === "accept" ? "granted" : "denied"); });
    var s0 = stored();
    if (s0 === "granted") loadTags(); else if (s0 !== "denied") banner.hidden = false;
    var links = document.querySelector(".footer-links");
    if (links) { var btn = document.createElement("button"); btn.type = "button"; btn.className = "linklike"; btn.textContent = "Preferências de cookies"; btn.addEventListener("click", function () { banner.hidden = false; }); links.appendChild(btn); }
  }

  // ---- click tracking ----
  document.addEventListener("click", function (e) {
    var a = e.target.closest("[data-track]"); if (!a) return;
    var d = a.dataset, p = { product: d.product || product };
    ["days", "value", "where", "store", "marketplace"].forEach(function (k) { if (d[k]) p[k] = k === "value" || k === "days" ? Number(d[k]) : d[k]; });
    if (d.track === "checkout_click") { p.currency = "BRL"; p.item_id = p.product + "-" + p.days; if (utm.source) p.utm_source = utm.source; if (utm.campaign) p.utm_campaign = utm.campaign; }
    track(d.track, p);
  });

  // ---- lightbox ----
  var lb = document.getElementById("lightbox");
  if (lb && lb.showModal) {
    document.addEventListener("click", function (e) {
      var b = e.target.closest(".shot-btn"); if (!b) return;
      document.getElementById("lightbox-img").src = b.dataset.full;
      document.getElementById("lightbox-img").alt = b.querySelector("img").alt;
      document.getElementById("lightbox-cap").textContent = b.dataset.cap;
      lb.showModal();
    });
    lb.addEventListener("click", function (e) { if (e.target === lb) lb.close(); });
  }

  decorateCheckout();
})();
