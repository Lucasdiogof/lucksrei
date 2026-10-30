/* Lucksrei — vídeos de vitrine em loop (tipo GIF), no idioma do site.
 *
 *   <video data-loop-video="goias-app" width="720" height="720" muted loop playsinline preload="none" aria-hidden="true"></video>
 *
 * Arquivos por idioma (en, pt-BR, es):  /assets/video/<nome>-loop.<locale>.mp4 · .av1.mp4 · <nome>-loop-poster.<locale>.webp
 * O pôster e o primeiro arquivo já saem no idioma ativo (i18n-boot); nada é baixado antes de a página carregar, e o
 * arquivo só vem quando o vídeo chega perto da tela. AV1 quando o navegador toca; senão H.264. Toca visível e pausa
 * fora da tela ou com a aba oculta. Movimento reduzido ou economia de dados: fica só o pôster (também trocado de idioma).
 *
 * TROCA DE IDIOMA SEM CORTE (evento "lucksrei:locale" do i18n.js), só para vídeo visível e tocando:
 *   1. o vídeo atual segue tocando; um segundo <video> é criado POR BAIXO dele, no idioma novo;
 *   2. o novo é levado ao mesmo ponto da linha do tempo (seek + ajuste fino de playbackRate, medido quadro a quadro
 *      com requestVideoFrameCallback; sem ele, com rAF) e só é aceito depois de vários quadros consecutivos alinhados
 *      e de ter buffer à frente;
 *   3. no instante certo o antigo é removido (a troca é só tirar o que cobre o novo: não há pôster, tela preta nem seek visível);
 *   4. o antigo é liberado (src vazio). Um único par de players por vídeo, só durante a troca.
 * Várias trocas seguidas: cada pedido cancela o anterior (contador de geração); o último idioma escolhido sempre vence.
 * Falha ou rede lenta: o vídeo atual continua no idioma anterior e a troca é tentada de novo (2 vezes, e ao reaparecer).
 * Vídeo fora da tela / aba oculta: sem player extra; descarrega o arquivo, mostra o pôster do idioma novo e retoma do
 * mesmo tempo quando voltar. Evento "lucksrei:video-swap" informa cada troca (desvio medido em ms) para teste e telemetria. */
(function (root, factory) {
  "use strict";
  var api = factory(root);
  if (typeof module === "object" && module.exports) module.exports = api;
  else root.LucksreiLoopVideo = api;
  if (root.document && root.document.documentElement) api.init();
})(typeof window !== "undefined" ? window : this, function (root) {
  "use strict";

  var SUPPORTED = ["en", "pt-BR", "es"];
  var DIR = "/assets/video/";
  var VER = "1";             // sobe a cada re-render de qualquer vídeo/pôster (muda a URL → cache longo sem arquivo velho); espelhar nos <noscript> das páginas
  var TOL = 0.04;            // s: um quadro a 30 fps (33 ms) + folga; os dois vídeos nunca apresentam na mesma fase de vsync
  var OK_FRAMES = 8;         // quadros consecutivos alinhados antes de revelar
  var BUFFER_AHEAD = 1.5;    // s de vídeo já baixado à frente do ponto atual
  var HARD_TIMEOUT = 20000;  // ms por tentativa
  var MAX_RETRIES = 2;

  // ---------- funções puras (testadas em tests/loop-video.test.js)
  function norm(locale) { return SUPPORTED.indexOf(locale) >= 0 ? locale : "en"; }
  function urls(name, locale, av1) {
    locale = norm(locale);
    return {
      src: DIR + name + "-loop." + locale + (av1 ? ".av1" : "") + ".mp4?v=" + VER,
      poster: DIR + name + "-loop-poster." + locale + ".webp?v=" + VER
    };
  }
  // a − b na linha do tempo circular de duração d, em (−d/2, d/2]
  function wrapDiff(a, b, d) {
    var x = (((a - b) % d) + d) % d;
    return x > d / 2 ? x - d : x;
  }
  function mean(a) { var s = 0; for (var i = 0; i < a.length; i++) s += a[i]; return a.length ? s / a.length : 0; }

  function currentLocale() {
    var I = root.LucksreiI18n, L = root.LucksreiLocale;
    return norm((I && I.getLocale && I.getLocale()) || (L && L.current) || "en");
  }

  var slots = [];
  var env = { av1: false, motion: true, io: null };

  function now() { return (root.performance && root.performance.now) ? root.performance.now() : Date.now(); }
  function emit(type, detail) {
    try { root.document.dispatchEvent(new root.CustomEvent(type, { detail: detail })); } catch (e) { /* sem CustomEvent */ }
  }

  function attach(v) {
    var s = { v: v, name: v.getAttribute("data-loop-video"), locale: null, want: currentLocale(), visible: false,
      gen: 0, prep: null, retries: 0, resume: 0, baseStyle: v.getAttribute("style") || "", timer: 0 };
    v.__slot = s;
    // canPlayType promete AV1 e o decodificador falha (visto no WebKit do Playwright): volta para H.264, retomando do mesmo ponto
    v.addEventListener("error", function () {
      if (!env.av1 || s.v !== v || s.prep || !v.getAttribute("src") || !v.error || (v.error.code !== 3 && v.error.code !== 4)) return;
      env.av1 = false; s.resume = v.currentTime || 0; v.removeAttribute("src"); v.load(); s.locale = null;
      if (s.visible && !root.document.hidden && env.motion) play(s);
    });
    v.setAttribute("poster", urls(s.name, s.want, false).poster);
    slots.push(s);
    return s;
  }

  // ---------- carregamento normal (primeira vez, ou depois de descarregar)
  function load(s) {
    var v = s.v;
    if (v.getAttribute("src")) return;
    s.locale = s.want;
    v.setAttribute("poster", urls(s.name, s.locale, false).poster);
    var resume = s.resume; s.resume = 0;
    if (resume > 0) {
      v.addEventListener("loadedmetadata", function seek() {
        v.removeEventListener("loadedmetadata", seek);
        if (v.duration > 0) try { v.currentTime = resume % v.duration; } catch (e) { /* ignora */ }
      });
    }
    v.src = urls(s.name, s.locale, env.av1).src;
    v.preload = "auto";
  }
  function unload(s) {
    var v = s.v;
    if (v.getAttribute("src")) { s.resume = v.currentTime || 0; v.pause(); v.removeAttribute("src"); v.load(); }
    s.locale = null;
    v.setAttribute("poster", urls(s.name, s.want, false).poster);
  }
  function play(s) {
    if (s.prep) return;
    if (s.locale && s.locale !== s.want && s.v.getAttribute("src") && !playing(s.v)) unload(s);
    load(s);
    var p = s.v.play();
    if (p && p.catch) p.catch(function () { /* autoplay bloqueado: fica o pôster */ });
    if (s.locale !== s.want) reconcile(s);
  }
  function playing(v) { return !v.paused && !v.ended && v.readyState >= 2; }

  // ---------- troca contínua
  function abort(s, keepTimer) {
    var p = s.prep;
    if (!p) return;
    s.prep = null; s.gen++; s.v.__vfc = false;
    var nv = p.nv;
    try { nv.pause(); } catch (e) { /* ignora */ }
    nv.removeAttribute("src"); try { nv.load(); } catch (e2) { /* ignora */ }
    if (nv.parentNode) nv.parentNode.removeChild(nv);
    s.v.style.cssText = s.baseStyle;
    if (!keepTimer && s.timer) { root.clearTimeout(s.timer); s.timer = 0; }
  }

  // decide o que fazer quando o idioma pedido difere do carregado
  function reconcile(s) {
    if (s.want === s.locale) { abort(s); return; }
    if (!s.v.getAttribute("src")) return;                         // nada carregado: load() já usa s.want
    if (s.prep && s.prep.locale === s.want) return;               // já preparando exatamente isso
    var live = s.visible && !root.document.hidden && playing(s.v) && env.motion;
    if (!live) { abort(s); unload(s); if (s.visible && !root.document.hidden && env.motion) play(s); return; }
    swap(s);
  }

  function swap(s) {
    abort(s, true);
    var old = s.v, want = s.want, gen = ++s.gen, t0 = now();
    var nv = root.document.createElement("video");
    nv.className = old.className;
    ["width", "height", "aria-hidden"].forEach(function (a) { if (old.hasAttribute(a)) nv.setAttribute(a, old.getAttribute(a)); });
    nv.setAttribute("data-loop-video", s.name);
    nv.muted = true; nv.defaultMuted = true; nv.loop = true; nv.setAttribute("playsinline", ""); nv.setAttribute("muted", "");
    nv.preload = "auto";
    nv.style.cssText = s.baseStyle;
    // o novo fica POR BAIXO do atual: mesmo retângulo, atrás (o atual vai para a frente só durante a troca)
    if (root.getComputedStyle(old).position === "static") old.style.position = "relative";
    old.style.zIndex = "1";
    nv.style.position = "absolute"; nv.style.zIndex = "0"; nv.style.margin = "0";
    nv.style.left = old.offsetLeft + "px"; nv.style.top = old.offsetTop + "px";
    nv.style.width = old.offsetWidth + "px"; nv.style.height = old.offsetHeight + "px";
    var prep = s.prep = { nv: nv, locale: want, attempts: 0, errs: [], ok: 0, rate: 1, seeking: false, started: false, lastMT: 0, lastNow: 0 };
    old.parentNode.insertBefore(nv, old);

    var useVfc = typeof nv.requestVideoFrameCallback === "function";
    function stale() { return gen !== s.gen || s.prep !== prep; }
    function fail(why) {
      if (stale()) return;
      abort(s);
      if (why === "av1" && env.av1) { env.av1 = false; swap(s); return; }
      emit("lucksrei:video-swap", { name: s.name, to: want, ok: false, reason: why });
      if (s.retries++ < MAX_RETRIES) s.timer = root.setTimeout(function () { s.timer = 0; if (s.want !== s.locale) reconcile(s); }, 8000);
    }
    nv.addEventListener("error", function () { fail(env.av1 ? "av1" : "error"); });
    s.timer = root.setTimeout(function () { s.timer = 0; fail("timeout"); }, HARD_TIMEOUT);

    // posição do antigo no instante do último quadro dele apresentado, extrapolada até agora
    function oldPos(at) { return old.__mt != null ? old.__mt + (at - old.__now) / 1000 : old.currentTime; }
    if (typeof old.requestVideoFrameCallback === "function" && !old.__vfc) {
      old.__vfc = true;
      (function track() {
        old.requestVideoFrameCallback(function (n, md) { old.__mt = md.mediaTime; old.__now = n; if (old.__vfc) track(); });
      })();
    }

    function align() {
      var D = nv.duration; if (!(D > 0)) return;
      prep.seeking = true; prep.attempts++;
      nv.playbackRate = 1;
      nv.currentTime = (old.currentTime + 0.25) % D;
    }
    nv.addEventListener("loadedmetadata", function () { if (!stale()) align(); });
    nv.addEventListener("seeked", function () {
      if (stale()) return;
      prep.seeking = false; prep.errs = []; prep.ok = 0;
      if (!prep.started) { prep.started = true; var p = nv.play(); if (p && p.catch) p.catch(function () { fail("play"); }); frames(); }
    });

    function buffered() {
      var b = nv.buffered, t = nv.currentTime;
      if (!b.length && nv.readyState >= 4) return BUFFER_AHEAD;   // WebKit não informa `buffered` em MP4 progressivo; HAVE_ENOUGH_DATA basta
      for (var i = 0; i < b.length; i++) if (t >= b.start(i) - 0.05 && t <= b.end(i)) return Math.min(b.end(i) - t, nv.duration);
      return 0;
    }
    function onFrame(at, mt) {
      if (stale() || prep.seeking) return;
      var D = nv.duration;
      var e = wrapDiff(mt, oldPos(at), D);          // > 0: o novo está à frente
      prep.errs.push(e); if (prep.errs.length > OK_FRAMES) prep.errs.shift();
      if (Math.abs(e) > 0.5) { if (prep.attempts < 6) { align(); return; } return fail("sync"); }
      var avg = mean(prep.errs);
      // controle: corrige o resíduo com playbackRate (sem seek), sem oscilar
      if (Math.abs(avg) > 0.02 && prep.errs.length >= 3) {
        var r = Math.max(0.8, Math.min(1.25, 1 - avg * 1.5));
        if (Math.abs(r - prep.rate) > 0.01) { prep.rate = r; nv.playbackRate = r; }
      } else if (prep.rate !== 1) { prep.rate = 1; nv.playbackRate = 1; }
      var good = Math.abs(e) <= TOL && Math.abs(avg) <= 0.025;
      prep.ok = good ? prep.ok + 1 : 0;
      if (prep.ok >= OK_FRAMES && nv.readyState >= 3 && buffered() >= Math.min(BUFFER_AHEAD, D - 0.1)) reveal(avg, e);
    }
    function frames() {
      if (useVfc) {
        nv.requestVideoFrameCallback(function (n, md) { if (stale()) return; onFrame(n, md.mediaTime); frames(); });
      } else {
        root.requestAnimationFrame(function (n) { if (stale()) return; onFrame(n, nv.currentTime); frames(); });
      }
    }

    function reveal(avg, last) {
      var wasSeen = !!(old.__mt != null);
      nv.playbackRate = 1;
      nv.style.cssText = s.baseStyle;
      var d = Math.abs(old.currentTime - nv.currentTime); if (d > old.duration / 2) d = old.duration - d;
      s.prep = null;
      if (s.timer) { root.clearTimeout(s.timer); s.timer = 0; }
      old.__vfc = false;
      var io = env.io;
      if (io) io.unobserve(old);
      old.pause(); old.removeAttribute("src"); try { old.load(); } catch (e) { /* ignora */ }
      if (old.parentNode) old.parentNode.removeChild(old);
      nv.setAttribute("poster", urls(s.name, want, false).poster);
      nv.__slot = s; s.v = nv; s.locale = want; s.retries = 0;
      if (io) io.observe(nv);
      emit("lucksrei:video-swap", { name: s.name, to: want, ok: true, driftMs: Math.round(Math.abs(avg) * 1000), lastFrameMs: Math.round(Math.abs(last) * 1000),
        attempts: prep.attempts, tookMs: Math.round(now() - t0), measured: wasSeen });
      if (s.want !== s.locale) reconcile(s);   // o idioma mudou de novo enquanto revelava
    }

    nv.src = urls(s.name, want, env.av1).src;
  }

  function onLocale(e) {
    var loc = norm(e && e.detail && e.detail.locale || currentLocale());
    slots.forEach(function (s) {
      s.want = loc; s.retries = 0;
      if (!s.v.getAttribute("src") && !s.prep) { s.v.setAttribute("poster", urls(s.name, loc, false).poster); return; }
      reconcile(s);
    });
  }

  function init() {
    var vids = root.document.querySelectorAll("video[data-loop-video]");
    if (!vids.length) return;
    Array.prototype.forEach.call(vids, attach);
    root.document.addEventListener("lucksrei:locale", onLocale);
    // WebKit (build Windows do Playwright) deixa o loop parado em 0; o vídeo que deveria tocar e foi pausado pelo navegador volta a tocar
    root.document.addEventListener("pause", function (e) {
      var v = e.target, s = v && v.__slot;
      if (!s || s.v !== v || !s.visible || root.document.hidden || !env.motion || !v.getAttribute("src") || v.ended || v.currentTime > 0.2) return;
      root.setTimeout(function () { if (v.paused && s.v === v && s.visible) { var p = v.play(); if (p && p.catch) p.catch(function () { /* autoplay bloqueado */ }); } }, 0);
    }, true);
    var mql = root.matchMedia ? root.matchMedia("(prefers-reduced-motion: reduce)") : { matches: false };
    var conn = root.navigator.connection;
    env.motion = !mql.matches;
    if (mql.matches || !("IntersectionObserver" in root) || (conn && conn.saveData)) { env.motion = false; return; }   // fica o pôster (já no idioma certo)
    env.av1 = slots[0].v.canPlayType('video/mp4; codecs="av01.0.05M.08"') === "probably";

    function start() {
      env.io = new root.IntersectionObserver(function (entries) {
        entries.forEach(function (en) {
          var s = en.target.__slot;
          if (!s || s.v !== en.target) return;
          s.visible = en.isIntersecting;
          if (en.isIntersecting && !root.document.hidden) play(s);
          else { abort(s); s.v.pause(); if (s.locale && s.locale !== s.want) unload(s); }
        });
      }, { rootMargin: "200px 0px", threshold: 0.01 });
      slots.forEach(function (s) { env.io.observe(s.v); });
    }
    if (root.document.readyState === "complete") start(); else root.addEventListener("load", start);

    root.document.addEventListener("visibilitychange", function () {
      slots.forEach(function (s) {
        if (root.document.hidden) { abort(s); s.v.pause(); if (s.locale && s.locale !== s.want) unload(s); }
        else if (s.visible) play(s);
      });
    });
    if (mql.addEventListener) mql.addEventListener("change", function (e) {
      env.motion = !e.matches;
      if (e.matches) slots.forEach(function (s) { abort(s); s.v.pause(); });
    });
  }

  return { init: init, urls: urls, wrapDiff: wrapDiff, norm: norm, SUPPORTED: SUPPORTED, VER: VER, _slots: slots, _env: env };
});
