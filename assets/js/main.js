(function(){
  "use strict";

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  document.querySelectorAll("[data-current-path]").forEach(function (el) { el.textContent = window.location.pathname; });

  var yearEl = document.getElementById("year");
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  var header = document.querySelector(".site-header");
  var backToTop = document.querySelector(".back-to-top");
  if (header || backToTop) {
    var onScroll = function () {
      if (header) {
        if (window.scrollY > 8) header.classList.add("is-scrolled");
        else header.classList.remove("is-scrolled");
      }
      if (backToTop) {
        if (window.scrollY > 640) backToTop.classList.add("is-visible");
        else backToTop.classList.remove("is-visible");
      }
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
  }
  if (backToTop) {
    backToTop.addEventListener("click", function () {
      window.scrollTo({ top: 0, behavior: reduceMotion ? "auto" : "smooth" });
    });
  }

  var toggle = document.querySelector(".mobile-toggle");
  var mobileNav = document.querySelector(".mobile-nav");
  if (toggle && mobileNav) {
    var closeMobileNav = function () {
      mobileNav.classList.remove("is-open");
      toggle.setAttribute("aria-expanded", "false");
    };
    toggle.addEventListener("click", function () {
      var open = mobileNav.classList.toggle("is-open");
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
    });
    mobileNav.querySelectorAll("a").forEach(function (a) {
      a.addEventListener("click", closeMobileNav);
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && mobileNav.classList.contains("is-open")) {
        closeMobileNav();
        toggle.focus();
      }
    });
  }

  // indicador deslizante do menu: um único traço (transform) que segue o link ativo/hover/foco
  var syncIndicator = null;
  var navWrap = document.querySelector(".nav-links");
  if (navWrap) {
    var ind = document.createElement("span");
    ind.className = "nav-indicator";
    ind.setAttribute("aria-hidden", "true");
    navWrap.appendChild(ind);
    navWrap.classList.add("has-indicator");
    var place = function (a) {
      if (!a || !a.offsetWidth) { ind.style.opacity = "0"; return; }
      ind.style.opacity = "1";
      ind.style.transform = "translateX(" + a.offsetLeft + "px) scaleX(" + (a.offsetWidth / 100) + ")";
    };
    var activeLink = function () { return navWrap.querySelector("a[aria-current]"); };
    syncIndicator = function () { place(activeLink()); };
    navWrap.querySelectorAll("a").forEach(function (a) {
      a.addEventListener("mouseenter", function () { place(a); });
      a.addEventListener("focus", function () { place(a); });
      a.addEventListener("blur", syncIndicator);
    });
    navWrap.addEventListener("mouseleave", syncIndicator);
    window.addEventListener("resize", syncIndicator);
    document.addEventListener("lucksrei:locale", function () { window.requestAnimationFrame(syncIndicator); });
    syncIndicator();
    window.requestAnimationFrame(function () { ind.classList.add("is-ready"); });
  }

  var sections = Array.prototype.slice.call(document.querySelectorAll("main section[id]"));
  var navLinks = Array.prototype.slice.call(document.querySelectorAll(".nav-links a, .mobile-nav a"));
  if (sections.length && navLinks.length && "IntersectionObserver" in window) {
    var byId = {};
    navLinks.forEach(function (a) {
      var href = a.getAttribute("href") || "";
      if (href.indexOf("#") === 0) {
        byId[href.slice(1)] = byId[href.slice(1)] || [];
        byId[href.slice(1)].push(a);
      }
    });
    var activeObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        var links = byId[entry.target.id];
        if (!links) return;
        if (entry.isIntersecting) {
          navLinks.forEach(function (a) { a.removeAttribute("aria-current"); });
          links.forEach(function (a) { a.setAttribute("aria-current", "true"); });
          if (syncIndicator) syncIndicator();
        }
      });
    }, { rootMargin: "-40% 0px -55% 0px", threshold: 0 });
    sections.forEach(function (s) { activeObserver.observe(s); });
  }

  var revealTargets = Array.prototype.slice.call(document.querySelectorAll("[data-reveal]"));
  if (revealTargets.length) {
    if (reduceMotion || !("IntersectionObserver" in window)) {
      revealTargets.forEach(function (el) { el.classList.add("is-visible"); });
    } else {
      var revealObserver = new IntersectionObserver(function (entries, obs) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            obs.unobserve(entry.target);
          }
        });
      }, { threshold: 0.15 });
      revealTargets.forEach(function (el) { revealObserver.observe(el); });
    }
  }

  var counters = Array.prototype.slice.call(document.querySelectorAll("[data-counter]"));
  if (counters.length) {
    var animateCounter = function (el) {
      var target = parseFloat(el.getAttribute("data-counter"));
      var suffix = el.getAttribute("data-counter-suffix") || "";
      if (reduceMotion || isNaN(target)) {
        el.textContent = target + suffix;
        return;
      }
      var start = 0;
      var duration = 900;
      var startTime = null;
      var step = function (ts) {
        if (startTime === null) startTime = ts;
        var progress = Math.min((ts - startTime) / duration, 1);
        var eased = 1 - Math.pow(1 - progress, 3);
        var value = Math.round(start + (target - start) * eased);
        el.textContent = value + suffix;
        if (progress < 1) window.requestAnimationFrame(step);
      };
      window.requestAnimationFrame(step);
    };
    if ("IntersectionObserver" in window) {
      var counterObserver = new IntersectionObserver(function (entries, obs) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            animateCounter(entry.target);
            obs.unobserve(entry.target);
          }
        });
      }, { threshold: 0.6 });
      counters.forEach(function (el) { counterObserver.observe(el); });
    } else {
      counters.forEach(animateCounter);
    }
  }

  // Visitas: no máximo uma contagem por sessão de aba. O marcador fica só em sessionStorage (nunca é enviado);
  // sem cookie e sem identificador. O servidor grava apenas mês + país (ver worker/index.mjs).
  try {
    if (navigator.sendBeacon && !sessionStorage.getItem("lk.v")) {
      sessionStorage.setItem("lk.v", "1");
      navigator.sendBeacon("/api/visit");
    }
  } catch (err) { /* storage indisponível: não conta */ }

  // Tema claro/escuro: o theme-boot.js (no <head>) já aplicou o tema antes da pintura. Aqui só o botão do header:
  // troca, salva a escolha (lucksrei.theme) e mantém o rótulo acessível no idioma atual. Sem escolha salva, o site
  // acompanha o sistema também quando ele muda com a página aberta.
  var themeBtn = document.querySelector("[data-theme-toggle]");
  var THEME_KEY = "lucksrei.theme";
  function currentTheme() { return document.documentElement.getAttribute("data-theme") === "light" ? "light" : "dark"; }
  function themeLabel() {
    if (!themeBtn) return;
    var I = window.LucksreiI18n;
    var key = currentTheme() === "dark" ? "theme.to_light" : "theme.to_dark";
    var text = I && I.t ? I.t(key) : (currentTheme() === "dark" ? "Switch to light theme" : "Switch to dark theme");
    themeBtn.setAttribute("aria-label", text);
    themeBtn.title = text;
  }
  function applyTheme(t) {
    document.documentElement.setAttribute("data-theme", t);
    document.documentElement.style.colorScheme = t;
    var meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute("content", t === "light" ? "#0d1424" : "#040405");
    themeLabel();
  }
  if (themeBtn) {
    themeLabel();
    themeBtn.addEventListener("click", function () {
      var next = currentTheme() === "dark" ? "light" : "dark";
      applyTheme(next);
      try { localStorage.setItem(THEME_KEY, next); } catch (err) { /* storage indisponível: vale só nesta página */ }
    });
    document.addEventListener("lucksrei:locale", themeLabel);
  }
  if (window.matchMedia) {
    var sys = window.matchMedia("(prefers-color-scheme: light)");
    var onSys = function (e) {
      var saved = null;
      try { saved = localStorage.getItem(THEME_KEY); } catch (err) { /* sem storage: segue o sistema */ }
      if (saved !== "light" && saved !== "dark") applyTheme(e.matches ? "light" : "dark");
    };
    if (sys.addEventListener) sys.addEventListener("change", onSys); else if (sys.addListener) sys.addListener(onSys);
  }
})();
