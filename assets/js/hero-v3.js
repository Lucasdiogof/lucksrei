/* Lucksrei — cena pixel art do hero (v3): o quarto da v2 evoluído, com cinemática (abertura, intro, loop em duas tomadas).
 *
 * Mesmo enquadramento, mesmo tamanho (240×150 px lógicos a 2×) e mesmas falas da v2. O personagem usa a arte da v2
 * como quadros-chave, com intermediários desenhados com as mesmas primitivas (tools/hero3/): giros, caminhada em
 * perspectiva, sentar e um loop sentado mais rico (digitar, mouse, olhar os monitores, café, coçar a cabeça e a nuca,
 * comemorar). Cinemática: abertura com o quarto vazio, telas que acordam no toque do mouse, build que pulsa e passa
 * (verde) ou falha (âmbar) em tomadas alternadas, café olhando a janela (uma janela da cidade acende) e um botão
 * discreto para rever a cena. Câmera fixa de propósito (pixel exato, sem margem de mundo para panorâmica).
 *
 * O runtime só TOCA uma trilha pronta (assets/img/hero/v3/actor.json, gerada por tools/hero3/hybrid_anims.py):
 * 12 tiques/s, cada tique = [quadro, x, y, deslocamento da cadeira, caneca na mão?, fala, luz]. A posição já vem
 * resolvida no gerador (pé de apoio parado no chão, sem deslizar), então aqui não há interpolação: nada borra nem treme.
 * Camadas (tools/hero3/scene_v3.py): céu → quarto → luz das telas → cadeira → corpo → mesa → caneca → braços → monitores
 * → luar, poeira, LED e filetes acesos. Relógio só anda com a cena visível e a aba ativa; prefers-reduced-motion e sem
 * JS: pôster estático (assets/img/hero/poster-final.png, gerado desta cena).
 *
 * Reserva: ?hero=v2 carrega a cena anterior (hero-scene.js, com os pôsteres -v2); ?scene=v2 usa o quarto da v2 com o
 * personagem novo (só para comparação).
 */
(function () {
  "use strict";
  var root = document.getElementById("hero-scene");
  if (!root) return;
  var poster = root.querySelector(".hs-poster");
  if (/[?&]hero=v2(&|$)/.test(location.search)) {
    if (poster) { poster.src = "/assets/img/hero/poster-empty-v2.png"; poster.setAttribute("data-final", "/assets/img/hero/poster-final-v2.png"); }
    var v2 = document.createElement("script"); v2.src = "/assets/js/hero-scene.js"; document.body.appendChild(v2);
    return;
  }
  var stage = root.querySelector(".hs-stage") || root;
  var hellos = root.querySelectorAll(".hs-hello");
  var BASE = "/assets/img/hero/v3/";
  var SCENE3 = !/[?&]scene=v2(&|$)/.test(location.search), SB = SCENE3 ? BASE + "scene/" : BASE;
  var mql = window.matchMedia("(prefers-reduced-motion: reduce)");
  if (mql.matches) { if (poster && poster.getAttribute("data-final")) poster.src = poster.getAttribute("data-final"); return; }

  var W = 240, H = 150, CROP = { x: 40, y: 14, w: 160, h: 136 }, HELLO = SCENE3 ? [62, 1] : [62, 8], HELLO_CROP = [44, 17];   // v3: balão no alto (o quadro da coroa subiu)
  var D, SC = null, img = {}, canvas, ctx, view = { x: 0, y: 0, w: W, h: H, scale: 2 };
  var intro = [], loop = [], TI = 0, TL = 0;
  var state = { running: false, visible: false, hidden: document.hidden, started: false, loaded: false };
  var raf = 0, last = 0, clock = 0, seekTo = null;

  function expand(runs) { var out = []; for (var i = 0; i < runs.length; i++) for (var k = 0; k < runs[i][0]; k++) out.push(runs[i]); return out; }

  /* ---------------------------------------------------------------- luz das telas (cenário v3): estados da trilha
     r[7] = fx: 1 digitando, 2 build ok (verde), 3 telas em espera, 4 calmo, 5 build rodando (pulso lento),
     6 build falhou (âmbar), 7 café olhando a janela (calmo; uma janela da cidade acende). O nível sai da própria trilha (estado
     atual, anterior e quando trocou), então é o mesmo em qualquer instante — inclusive com seek (QA). */
  var FXL = { 0: 0.6, 1: 0.7, 2: 0.78, 3: 0.25, 4: 0.55, 5: 0.66, 6: 0.6, 7: 0.55 }, fxInfo = [];
  function fxPrepare() {
    var all = intro.concat(loop), prev = 3, start = 0;
    for (var i = 0; i < all.length; i++) {
      var fx = all[i][7] || 0;
      if (i === 0 || fx !== (all[i - 1][7] || 0)) { prev = i === 0 ? fx : (all[i - 1][7] || 0); start = i; }
      fxInfo.push([fx, prev, start]);
    }
  }
  function lightAt(t) {
    var n = Math.floor(t * D.tick), i = n < intro.length ? n : intro.length + (n - intro.length) % loop.length;
    var info = fxInfo[i] || [0, 0, 0], fx = info[0], prev = info[1];
    var ramp = prev === 3 && fx !== 3 ? 2.4 : 0.6;                        // as telas “acordam” devagar
    var since = (i - info[2]) / D.tick + (t * D.tick - n) / D.tick;
    var k = Math.min(1, since / ramp), e = k * k * (3 - 2 * k);
    var level = FXL[prev] + (FXL[fx] - FXL[prev]) * e;
    if (fx === 1) level += 0.025 * Math.sin(t * 7) * Math.sin(t * 2.3);  // digitando: a tela muda de leve
    if (fx === 5) level += 0.04 * Math.sin(since * 7.5);                  // build rodando: pulso lento
    var green = (fx === 2 ? e : 0) * (fx === 2 ? Math.max(0, 1 - Math.max(0, since - 1.2) / 1.2) : 0);
    if (prev === 2 && fx !== 2) green = Math.max(0, 1 - since / 0.6);
    var amber = fx === 6 ? e * Math.max(0, 1 - Math.max(0, since - 1.4) / 1.2) : (prev === 6 ? Math.max(0, 1 - since / 0.6) : 0);
    return { level: Math.max(0, level), green: 0.45 * green, amber: 0.4 * amber, fx: fx, prev: prev, since: since };  // só um toque
  }
  var tint;
  function lightOnActor(fr, x, y, L) {
    // luz das telas no personagem: a silhueta do quadro recebe um sopro azul (verde no build), por cima, aditivo
    if (!fr || L.level < 0.3) return;
    if (!tint) { tint = document.createElement("canvas"); tint.width = 72; tint.height = 72; }
    var tc = tint.getContext("2d");
    tc.globalCompositeOperation = "source-over"; tc.clearRect(0, 0, 72, 72);
    tc.drawImage(img.actor, fr[0], fr[1], fr[2], fr[3], 0, 0, fr[2], fr[3]);
    tc.globalCompositeOperation = "source-in";           // só a cor da luz, recortada pela silhueta (sem o quadro)
    // sutil: só a cor da luz é somada (recortada pela silhueta), esfriando o personagem de leve
    var g = L.green, a = (0.02 + 0.035 * Math.min(1, L.level));
    var am = L.amber;
    tc.fillStyle = "rgba(" + Math.round(30 + 20 * g + 150 * am) + "," + Math.round(70 + 45 * g + 20 * am) + "," + Math.round(190 - 110 * g - 150 * am) + "," + a.toFixed(3) + ")";
    tc.fillRect(0, 0, fr[2], fr[3]);
    ctx.globalCompositeOperation = "lighter";
    ctx.drawImage(tint, 0, 0, fr[2], fr[3], x + fr[4], y + fr[5], fr[2], fr[3]);
    ctx.globalCompositeOperation = "source-over";
  }
  var GLOW = 0.6;                                        // força geral da luz das telas (1 = camada cheia; ficou forte demais)
  function fxLayer(im, alpha) {
    ctx.globalCompositeOperation = "lighter"; ctx.globalAlpha = Math.min(1, Math.max(0, alpha));
    ctx.drawImage(im, 0, 0);
    ctx.globalAlpha = 1; ctx.globalCompositeOperation = "source-over";
  }
  function recAt(t) {
    var n = Math.floor(t * D.tick);
    return n < intro.length ? intro[n] : loop[(n - intro.length) % loop.length];
  }

  /* ---------------------------------------------------------------- desenho */
  function sprite(fr, x, y) {
    if (!fr) return;
    ctx.drawImage(img.actor, fr[0], fr[1], fr[2], fr[3], x + fr[4], y + fr[5], fr[2], fr[3]);
  }
  function draw(t) {
    var r = recAt(t), f = D.frames[r[1]], x = r[2], y = r[3], chair = r[4], mugHand = r[5], seated = x === D.slot[0] && y === D.slot[1];
    ctx.clearRect(0, 0, view.w, view.h);
    ctx.save();
    ctx.translate(-view.x, -view.y);
    var L = SCENE3 ? lightAt(t) : null, FX = SCENE3 ? SC.fx : null;
    if (SCENE3) {
      ctx.drawImage(img.sky, 0, 0);
      ctx.fillStyle = FX.cityDark;                                          // janelas da cidade que apagam/acendem
      for (var c = 0; c < FX.city.length; c++) if (Math.sin(t * 0.23 + c * 2.39) > 0.86) ctx.fillRect(FX.city[c][0], FX.city[c][1], 1, 1);
      var ce = L.fx === 7 ? Math.min(1, Math.max(0, (L.since - 0.9) / 0.5)) : (L.prev === 7 ? Math.max(0, 1 - L.since / 6) : 0);
      if (ce > 0 && FX.cityEvent) {                                         // café olhando a janela: uma janela acende (e apaga devagar)
        ctx.fillStyle = "rgba(227,176,75," + ce.toFixed(3) + ")";
        for (var q = 0; q < FX.cityEvent.length; q++) ctx.fillRect(FX.cityEvent[q][0], FX.cityEvent[q][1], 1, 1);
      }
      ctx.drawImage(img.room, 0, 0);
      fxLayer(img.glow, GLOW * L.level);                                           // luz das telas na parede (atrás dele)
    } else ctx.drawImage(img.bg, 0, 0);
    ctx.fillStyle = "rgba(255,255,255," + (0.3 + 0.3 * Math.sin(t * 1.6)).toFixed(3) + ")"; ctx.fillRect(24, 33, 1, 1); if (SCENE3) ctx.fillRect(29, 29, 1, 1); else ctx.fillRect(45, 27, 1, 1);
    ctx.fillStyle = "rgba(255,255,255," + (0.3 + 0.3 * Math.sin(t * 1.2 + 2)).toFixed(3) + ")"; ctx.fillRect(17, 31, 1, 1); if (SCENE3) ctx.fillRect(20, 41, 1, 1); else ctx.fillRect(40, 36, 1, 1);   // v3: lua cheia ocupa o lugar
    ctx.drawImage(img.chair, chair, 0);
    ctx.fillStyle = "rgba(0,0,0,0.28)"; ctx.fillRect(x - 8, y, 17, 1);                 // sombra no chão (a mesa cobre)
    ctx.fillStyle = "rgba(0,0,0,0.14)"; ctx.fillRect(x - 11, y + 1, 23, 1);
    sprite(f.b, x, y);
    if (SCENE3 && seated) lightOnActor(f.b, x, y, L);
    ctx.drawImage(img.desk, 0, 0);
    if (SCENE3) fxLayer(img.glowdesk, GLOW * L.level);
    if (!mugHand) {
      ctx.drawImage(img.mug, 0, 0);
      for (var s = 0; s < 2; s++) {                                                    // vapor bem leve (como na v2)
        var p = (t * 0.45 + s / 2) % 1;
        ctx.fillStyle = "rgba(245,240,228," + (0.35 * (1 - p)).toFixed(3) + ")";
        ctx.fillRect(D.mug[0] + 1 + Math.round(Math.sin(t * 2 + s * 3)), D.mug[1] - 2 - Math.round(p * 7), 1, 1);
      }
    }
    sprite(f.o, x, y);
    if (SCENE3 && seated) lightOnActor(f.o, x, y, L);
    ctx.drawImage(img.monitors, 0, 0);
    if (SCENE3) {
      fxLayer(img.moon, 1);
      for (var dm = 0; dm < 7; dm++) {                                      // poeira lenta no feixe do luar
        var dx0 = FX.dust.x[0], dw = FX.dust.x[1] - dx0, dy0 = FX.dust.y[0], dh = FX.dust.y[1] - dy0;
        var mx = dx0 + ((dm * 37 + t * (0.6 + 0.25 * (dm % 3))) % dw), my = dy0 + ((dm * 53 + t * 0.35) % dh);
        var dd = Math.abs((mx - 34 - (my - 128) * 0.6) / 22) + Math.abs((my - 128) / 14);
        if (dd < 0.85) { ctx.fillStyle = "rgba(170,200,255," + (0.28 * (1 - dd)).toFixed(3) + ")"; ctx.fillRect(Math.round(mx), Math.round(my), 1, 1); }
      }
      ctx.fillStyle = "rgba(233,235,241," + (0.25 + 0.75 * (0.5 + 0.5 * Math.sin(t * 1.8))).toFixed(3) + ")";   // LED do gabinete
      ctx.fillRect(FX.led[0], FX.led[1], 1, 1);
    }
    var lit = SCENE3 ? Math.min(1, 0.25 + 0.45 * L.level) : (seated ? 0.8 + 0.15 * Math.sin(t * 13) : 0.45);
    var ra = SCENE3 ? Math.min(1, 2.5 * L.amber) : 0;                        // filete: o âmbar precisa aparecer (é só 1 px)
    var rc = SCENE3 && (L.green > 0 || ra > 0) ? Math.round(99 - 40 * L.green + 141 * ra) + "," + Math.round(179 + 60 * L.green - 34 * ra) + "," + Math.round(255 - 140 * L.green - 215 * ra) : "99,179,255";
    if (ra > 0) lit = Math.max(lit, 0.75 * ra);
    for (var m = 0; m < D.monitors.length; m++) {
      ctx.fillStyle = "rgba(" + rc + "," + (lit * (m ? 0.8 : 1)).toFixed(3) + ")"; ctx.fillRect(D.monitors[m][0], D.monitors[m][1] + 2, 1, D.monitors[m][2]);
    }
    ctx.restore();
    for (var k = 0; k < hellos.length; k++) hellos[k].classList.toggle("is-on", r[6] === k + 1);
    setReplay(t > TI + 1);
  }

  /* ---------------------------------------------------------------- laço (~25 fps de desenho; a trilha anda a 12 tiques/s) */
  function frame(now) {
    raf = 0;
    if (!state.running) return;
    if (now - last >= 40) {
      clock += Math.min(0.1, (now - last) / 1000);
      last = now;
      if (seekTo !== null) { clock = seekTo; seekTo = null; }
      draw(clock);
    }
    raf = requestAnimationFrame(frame);
  }
  function sync() {
    var should = state.loaded && state.visible && !state.hidden;
    if (should && !state.running) { state.running = true; last = performance.now(); if (!state.started) { state.started = true; showCanvas(); } if (!raf) raf = requestAnimationFrame(frame); }
    else if (!should && state.running) { state.running = false; if (raf) { cancelAnimationFrame(raf); raf = 0; } }
  }

  /* ---------------------------------------------------------------- layout (igual à v2: cena inteira; recorte fixo no celular) */
  function layout() {
    var cw = root.parentElement ? root.parentElement.clientWidth : 480;
    var crop = cw < 480 ? CROP : null;
    var vw = crop ? crop.w : W, vh = crop ? crop.h : H;
    var scale = Math.max(1, Math.min(2, Math.floor(cw / vw)));
    view.x = crop ? crop.x : 0; view.y = crop ? crop.y : 0; view.w = vw; view.h = vh; view.scale = scale;
    root.style.setProperty("--hs-w", vw * scale + "px");
    root.style.setProperty("--hs-h", vh * scale + "px");
    root.style.setProperty("--hs-ox", -view.x * scale + "px");
    root.style.setProperty("--hs-oy", -view.y * scale + "px");
    root.style.setProperty("--hs-pw", W * scale + "px");
    var hp = crop ? HELLO_CROP : HELLO;
    root.style.setProperty("--hs-hx", (hp[0] - view.x) * scale + "px");
    root.style.setProperty("--hs-hy", (hp[1] - view.y) * scale + "px");
    root.classList.toggle("is-crop", !!crop);
    if (canvas) { canvas.width = vw; canvas.height = vh; ctx.imageSmoothingEnabled = false; if (state.started) draw(clock); }
    placeReplay();
  }

  /* ---------------------------------------------------------------- botão discreto “rever a cena” (Fase E)
     Fica FORA do .hs-stage (que é role="img": filhos interativos sumiriam para leitores de tela), posicionado sobre o
     canto inferior esquerdo da cena. Aparece depois da intro; volta ao começo (sem áudio). Texto pelas chaves i18n.
     Estilo em style.css (.hs-replay): a CSP da produção não aceita <style> injetado. */
  var replay = null, replayOn = false;
  function makeReplay() {
    replay = document.createElement("button");
    replay.type = "button"; replay.className = "hs-replay";
    replay.setAttribute("aria-label", "Replay the scene"); replay.title = "Replay the scene";
    replay.setAttribute("data-i18n-attr", "aria-label:home.hero.replay;title:home.hero.replay");
    replay.innerHTML = '<svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true" focusable="false">' +
      '<path d="M3.2 6.2A5 5 0 1 1 3 9.5" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/>' +
      '<path d="M2.6 2.8v3.6h3.6" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/></svg>';
    replay.addEventListener("click", function () { clock = 0; last = performance.now(); draw(0); setReplay(false); });
    stage.parentNode.insertBefore(replay, stage.nextSibling);
    var I = window.LucksreiI18n; if (I && I.apply) I.apply(root);
    placeReplay();
  }
  function placeReplay() {
    if (!replay) return;
    replay.style.left = stage.offsetLeft + 12 + "px";
    replay.style.top = stage.offsetTop + stage.offsetHeight - 40 + "px";
  }
  function setReplay(on) {
    if (!replay || on === replayOn) return;
    replayOn = on; replay.classList.toggle("is-on", on);
    if (!on && document.activeElement === replay) replay.blur();
  }
  function showCanvas() {
    canvas.className = "hs-canvas";
    stage.insertBefore(canvas, hellos[0] || null);
    draw(clock);
    root.classList.add("is-live");
    if (SCENE3) root.classList.add("is-v3");                 // balão compacto (style.css): não cobre o quadro nem a estante
    makeReplay();
  }

  /* ---------------------------------------------------------------- carga */
  function load() {
    var names = SCENE3 ? ["sky", "room", "glow", "chair", "desk", "glowdesk", "monitors", "mug", "moon", "actor"] : ["bg", "chair", "desk", "monitors", "mug", "actor"], n = 0;
    function done() {
      if (++n < names.length + 1) return;
      intro = expand(D.intro); loop = expand(D.loop); TI = intro.length / D.tick; TL = loop.length / D.tick;
      if (SCENE3) fxPrepare();
      canvas = document.createElement("canvas"); canvas.setAttribute("aria-hidden", "true");
      ctx = canvas.getContext("2d");
      state.loaded = true; layout(); sync();
      root.__heroScene = { version: "v3", intro: TI, loop: TL, time: function () { return clock; },
        seek: function (t) { clock = t; if (state.started) draw(clock); } };                  // leitura/QA
    }
    names.forEach(function (k) { img[k] = new Image(); img[k].onload = done; img[k].src = (k === "actor" ? BASE : SB) + k + ".png"; });
    fetch(BASE + "actor.json").then(function (r) { return r.json(); }).then(function (j) {
      if (!SCENE3) { D = j; done(); return; }
      // cenário v3: os filetes acesos das telas seguem a geometria dos monitores desta cena
      fetch(SB + "scene.json").then(function (r) { return r.json(); }).then(function (sc) { SC = sc; if (sc.monitors) j.monitors = sc.monitors; D = j; done(); });
    });
  }

  var booted = false;
  function init() {
    layout();
    if ("IntersectionObserver" in window) {
      new IntersectionObserver(function (es) { state.visible = es[0].isIntersecting; if (state.visible && !booted) { booted = true; load(); } sync(); }).observe(root);
    } else { state.visible = true; booted = true; load(); }
    document.addEventListener("visibilitychange", function () { state.hidden = document.hidden; sync(); });
    window.addEventListener("resize", layout);
  }
  if (document.readyState === "complete") init(); else window.addEventListener("load", init);
})();
