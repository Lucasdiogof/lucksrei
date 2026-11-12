/* Lucksrei Systems: consent, tracking, UTM hand-off to checkout and the screenshot lightbox. No dependencies.
 * Marketing tags load ONLY after "Aceitar" and only for IDs set in tracking-config.js.
 * Event semantics: everything sent from this site is an INTERACTION (page view, outbound link click). Meta standard conversion events
 * (Lead, InitiateCheckout, Purchase) and GA4 purchase/begin_checkout are deliberately NOT sent: a click on a Hotmart link does not prove the
 * checkout opened, started or paid. Those need Hotmart's own pixel / webhook (docs/systems/TRACKING.md). */
(function () {
  "use strict";
  var KEY = "lx_consent";
  var cfg = window.LX_TRACKING || {};
  var product = (document.currentScript && document.currentScript.getAttribute("data-product")) || "";
  var loaded = false;

  function stored() { try { return localStorage.getItem(KEY); } catch (e) { return null; } }
  function store(v) { try { localStorage.setItem(KEY, v); } catch (e) { /* private mode: the choice lasts for this page only */ } }

  // ---- UTM: kept in memory only (no cookie, no storage). Hotmart documents `sck` for producer links that go straight to the checkout
  // (up to 30 chars; "|" separates parts; "_" is reserved) and recommends carrying the UTMs too. We do not use `src` (affiliate/alt-page parameter).
  // sck = product|source|campaign|content: the plan is already in the Hotmart offer (`off`), so it is left out to keep the ad angle within 30 chars.
  // Click ids (gclid/fbclid) are never forwarded: Hotmart cannot store them in 30 chars and GA4/Meta read them from this page.
  var q = new URLSearchParams(location.search);
  var clean = function (v) { return (v || "").replace(/[^A-Za-z0-9.-]/g, "").slice(0, 20); };
  var utm = { source: clean(q.get("utm_source")), medium: clean(q.get("utm_medium")), campaign: clean(q.get("utm_campaign")), content: clean(q.get("utm_content")) };
  function decorateCheckout() {
    if (!utm.source && !utm.medium && !utm.campaign && !utm.content) return;
    [].forEach.call(document.querySelectorAll('a[data-track="checkout_link_click"]'), function (a) {
      var u = new URL(a.href);
      ["source", "medium", "campaign", "content"].forEach(function (k) { if (utm[k]) u.searchParams.set("utm_" + k, utm[k]); });
      u.searchParams.set("sck", [a.dataset.product.charAt(0), utm.source, utm.campaign, utm.content].filter(Boolean).join("|").slice(0, 30));
      a.href = u.toString();
    });
  }

  // ---- aggregated, cookie-less measurement (own Worker, POST /m; docs/systems/TRACKING.md). Independent of the banner on purpose: it stores no
  // id and no cookie, only counts "page loaded / plans seen / checkout link clicked" per allow-listed campaign. It never loads or re-enables
  // a third-party tag. Counts loads and clicks, not people. Global Privacy Control / Do Not Track = nothing is sent. Failures are ignored.
  var optOut = navigator.globalPrivacyControl === true || navigator.doNotTrack === "1";
  var refClass = (function () {
    try {
      var h = new URL(document.referrer).hostname;
      return /(^|\.)(facebook\.com|fb\.com|instagram\.com|fb\.me)$/.test(h) ? "facebook" : /(^|\.)google\.[a-z.]+$/.test(h) ? "google" : "other";
    } catch (e) { return ""; }
  })();
  function measure(ev, days) {
    if (optOut || !product || location.protocol.indexOf("http") !== 0) return;
    try {
      // credentials omitted: the browser attaches no cookie (not even the _ga ones of the parent domain) to this request
      fetch("/m", { method: "POST", credentials: "omit", keepalive: true, cache: "no-store", referrerPolicy: "no-referrer",
        body: JSON.stringify({ e: ev, p: product, s: utm.source, m: utm.medium, c: utm.campaign, k: utm.content, r: refClass, d: days || 0 }) }).catch(function () { /* measurement must never matter */ });
    } catch (e) { /* idem */ }
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
      if (cfg.ga4) window.gtag("config", cfg.ga4, { send_page_view: false, cookie_domain: location.hostname, allow_google_signals: false, allow_ad_personalization_signals: false });
      if (cfg.googleAds) window.gtag("config", cfg.googleAds);
    }
    if (cfg.metaPixel) {
      /* eslint-disable */
      !function (f, b, e, v, n, t, s) { if (f.fbq) return; n = f.fbq = function () { n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments); }; if (!f._fbq) f._fbq = n; n.push = n; n.loaded = !0; n.version = "2.0"; n.queue = []; t = b.createElement(e); t.async = !0; t.src = v; s = b.getElementsByTagName(e)[0]; s.parentNode.insertBefore(t, s); }(window, document, "script", "https://connect.facebook.net/en_US/fbevents.js");
      // No automatic button/form/microdata events and no advanced matching: only the events we send ourselves, no personal data.
      window.fbq("set", "autoConfig", false, cfg.metaPixel);
      window.fbq("init", cfg.metaPixel);
      /* eslint-enable */
    }
    track("page_view", { product: product });
  }

  // our event -> [GA4 event name, Meta custom event | "PageView"]. Custom names on purpose; never standard conversion events.
  var MAP = {
    page_view: [null, "PageView"], // GA4: null on purpose, the gtag.js automatic page_view is the only one (a manual one doubled it)
    plans_view: ["plans_view", "PlansView"],
    cta_click: ["cta_click", "CtaClick"],
    checkout_link_click: ["checkout_link_click", "CheckoutLinkClick"],
    marketplace_click: ["marketplace_link_click", "MarketplaceLinkClick"],
    store_click: ["store_link_click", "StoreLinkClick"],
    app_link_click: ["app_link_click", "AppLinkClick"]
  };
  function eid() { try { return crypto.randomUUID(); } catch (e) { return String(Date.now()) + Math.random().toString(16).slice(2); } }
  function track(name, p) {
    p = p || {};
    window.lxEvents = window.lxEvents || [];
    if (stored() !== "granted") return; // consent denied or undecided: nothing is sent or even queued
    window.lxEvents.push({ name: name, params: p });
    var m = MAP[name]; if (!m) return;
    if (window.gtag && m[0]) window.gtag("event", m[0], p);
    // eventID is random per event: a future server-side (Conversions API) copy of the same event reuses it so Meta can deduplicate.
    if (window.fbq) { var o = { eventID: eid() }; if (m[1] === "PageView") window.fbq("track", "PageView", p, o); else window.fbq("trackCustom", m[1], p, o); }
  }

  // ---- consent banner ----
  var banner = document.getElementById("consent");
  // Declining removes the measurement cookies already set on this domain: Google Analytics (_ga, _ga_*) and Meta Pixel (_fbp, _fbc).
  function dropGaCookies() {
    document.cookie.split(";").forEach(function (c) {
      var n = c.split("=")[0].trim();
      if (n !== "_ga" && n.indexOf("_ga_") !== 0 && n !== "_fbp" && n !== "_fbc") return;
      // The Google tag ignores cookie_domain and writes these two cookies on the parent domain (lucksrei.com), so expire them on the
      // host and on each parent domain. Only the _ga / _ga_<id> / _fbp / _fbc names are touched; no other cookie.
      var parts = location.hostname.split(".");
      for (var i = 0; i <= parts.length - 2; i++) document.cookie = n + "=; Max-Age=0; path=/; domain=" + parts.slice(i).join(".") + "; SameSite=Lax; Secure";
      document.cookie = n + "=; Max-Age=0; path=/; SameSite=Lax; Secure";
    });
  }
  function setConsent(v) {
    store(v); if (banner) banner.hidden = true;
    if (v === "granted") { if (loaded) { if (window.fbq) window.fbq("consent", "grant"); } else loadTags(); } // re-accept on the same page: just re-grant, no second PageView
    else {
      if (window.fbq) window.fbq("consent", "revoke"); // stop Meta from sending/storing anything more; track() is already gated on stored()
      if (cfg.ga4 || cfg.metaPixel) { try { dropGaCookies(); } catch (e) { /* nothing to drop */ } }
    }
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
    ["days", "price", "where", "store", "marketplace"].forEach(function (k) { if (d[k]) p[k] = k === "price" || k === "days" ? Number(d[k]) : d[k]; });
    if (d.track === "checkout_link_click") { p.currency = "BRL"; p.plan = p.product + "-" + p.days; if (utm.source) p.utm_source = utm.source; if (utm.campaign) p.utm_campaign = utm.campaign; }
    if (d.track === "checkout_link_click") measure("checkout", Number(d.days));
    track(d.track, p);
  });

  // ---- screenshot stage: one large screen at a time, tabs with arrow keys; without JS every screen stays visible ----
  [].forEach.call(document.querySelectorAll("[data-stage]"), function (st) {
    var tabs = [].slice.call(st.querySelectorAll('[role="tab"]')), panels = [].slice.call(st.querySelectorAll('[role="tabpanel"]'));
    var bar = st.querySelector(".stage-tabs");
    function show(i, focus) {
      tabs.forEach(function (b, k) { var on = k === i; b.setAttribute("aria-selected", on); b.tabIndex = on ? 0 : -1; panels[k].classList.toggle("on", on); });
      var img = panels[i].querySelector("img"); img.loading = "eager";
      if (focus) tabs[i].focus();
    }
    bar.hidden = false; st.classList.add("is-on");
    tabs.forEach(function (b, i) {
      b.addEventListener("click", function () { show(i); });
      b.addEventListener("mouseenter", function () { panels[i].querySelector("img").loading = "eager"; });
      b.addEventListener("keydown", function (e) {
        var k = e.key === "ArrowRight" || e.key === "ArrowDown" ? 1 : e.key === "ArrowLeft" || e.key === "ArrowUp" ? -1 : 0;
        if (k) { e.preventDefault(); show((i + k + tabs.length) % tabs.length, true); }
        else if (e.key === "Home" || e.key === "End") { e.preventDefault(); show(e.key === "Home" ? 0 : tabs.length - 1, true); }
      });
    });
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

  // plan interest: the plans section was seen (once per page view; consent is checked inside track)
  var plans = document.getElementById("planos");
  if (plans && window.IntersectionObserver) {
    var seen = false;
    new IntersectionObserver(function (es, ob) {
      es.forEach(function (en) { if (en.isIntersecting && !seen) { seen = true; ob.disconnect(); measure("plans"); track("plans_view", { product: product }); } });
    }, { threshold: 0.1 }).observe(plans);
  }

  // mobile sticky "Ver planos": only while neither the hero nor the plans are on screen; sits above the consent banner while it is open
  var sticky = document.getElementById("sticky-cta"), hero = document.querySelector(".hero");
  if (sticky && hero && plans && window.IntersectionObserver) {
    var inHero = true, inPlans = false;
    var upd = function () {
      var open = banner && !banner.hidden;
      sticky.style.setProperty("--consent-h", open ? banner.offsetHeight + 8 + "px" : "0px");
      sticky.hidden = inHero || inPlans;
    };
    var io = new IntersectionObserver(function (es) { es.forEach(function (en) { if (en.target === hero) inHero = en.isIntersecting; else inPlans = en.isIntersecting; }); upd(); });
    io.observe(hero); io.observe(plans);
    if (banner) banner.addEventListener("click", function () { setTimeout(upd, 0); });
  }

  decorateCheckout();
  measure("pv");
})();
