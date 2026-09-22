(function(){
  "use strict";

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var canHover = window.matchMedia("(hover:hover) and (pointer:fine)").matches;

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

  // rAF-throttled pointer tracking shared by the hero glow and the "view case" bubble
  var pendingFrame = null;
  var queueFrame = function (fn) {
    if (pendingFrame) window.cancelAnimationFrame(pendingFrame);
    pendingFrame = window.requestAnimationFrame(function () { pendingFrame = null; fn(); });
  };

  var heroVisual = document.querySelector(".hero-visual");
  if (heroVisual && !reduceMotion && canHover) {
    heroVisual.addEventListener("mousemove", function (e) {
      queueFrame(function () {
        var rect = heroVisual.getBoundingClientRect();
        var x = ((e.clientX - rect.left) / rect.width) * 100;
        var y = ((e.clientY - rect.top) / rect.height) * 100;
        heroVisual.style.setProperty("--mx", x + "%");
        heroVisual.style.setProperty("--my", y + "%");
      });
    });
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

  var showcaseRows = Array.prototype.slice.call(document.querySelectorAll("[data-view-case]"));
  if (showcaseRows.length && !reduceMotion && canHover) {
    var bubble = document.createElement("div");
    bubble.className = "view-bubble";
    bubble.textContent = "Ver case";
    bubble.setAttribute("aria-hidden", "true");
    document.body.appendChild(bubble);

    var hideBubble = function () { bubble.classList.remove("is-visible"); };

    showcaseRows.forEach(function (row) {
      row.addEventListener("mouseenter", function () { bubble.classList.add("is-visible"); });
      row.addEventListener("mouseleave", hideBubble);
      row.addEventListener("mousemove", function (e) {
        queueFrame(function () {
          bubble.style.left = e.clientX + "px";
          bubble.style.top = e.clientY + "px";
        });
      });
    });
    // safety net: never leave the bubble stuck visible if the pointer leaves the viewport mid-hover
    document.addEventListener("mouseleave", hideBubble);
  }
})();
