/* Lucksrei — cena pixel art do hero (Lucas programando).
 *
 * Canvas 2D + requestAnimationFrame + folha de sprites. Sem biblioteca, sem texto na cena (não depende de idioma).
 * Mundo de 240x150 px lógicos desenhado com escala inteira (image-rendering: pixelated).
 *
 * Fluxo: o pôster (img) já está no HTML; depois do load os assets entram em segundo plano e, quando a cena
 * aparece na tela, a INTRO roda do começo (a cada carregamento) e depois entra em um LOOP de microações.
 * Pausa com a aba oculta e fora da viewport. prefers-reduced-motion: só o pôster final, sem animação e sem JS extra.
 * Os assets e o mapa de frames vêm de tools/make-hero-scene.py (o bloco FRAMES abaixo é gerado por ele).
 */
(function () {
  "use strict";
  var root = document.getElementById("hero-scene");
  if (!root) return;
  var poster = root.querySelector(".hs-poster");
  var stage = root.querySelector(".hs-stage") || root;
  var mql = window.matchMedia("(prefers-reduced-motion: reduce)");
  if (mql.matches) { if (poster && poster.getAttribute("data-final")) poster.src = poster.getAttribute("data-final"); return; }

  var DATA = /*FRAMES*/ {"cell":[64,64],"anchor":[28,60],"cols":11,"frames":{"front_idle":[0,2],"front_thumb":[2,3],"stand":[5,2],"walk":[7,6],"sit":[13,3],"type":[16,4],"seat_idle":[20,2],"lean":[22,2],"think":[24,2],"scratch":[26,4],"phone_reach":[30,3],"phone_up":[33,3],"phone_look":[36,2],"phone_tap":[38,2],"success":[40,4]}} /*END-FRAMES*/;
  var W = 240, H = 150, FLOOR = 136, SEAT_X = 142, ENTER_X = -34, PRESENT_X = 78;
  var BASE = root.getAttribute("data-base") || "/assets/img/hero/";
  var CROP = { w: 150, h: 100, y: 44 };           // enquadramento no celular
  var SC = { x0: 188, x1: 224, top: 84, slope: 0.11, h0: 27, hslope: 0.2 };   // tela projetada do monitor (igual ao gerador)

  var state = { running: false, visible: false, hidden: document.hidden, started: false, loaded: false };
  var bg, spr, canvas, ctx, off, octx, view = { x: 0, y: 0, w: W, h: H, scale: 2, crop: false }, cam = { x: 0 };
  var raf = 0, last = 0, acc = 0, clock = 0;

  /* ---------------------------------------------------------------- estado do ator e da cena */
  var actor = { x: ENTER_X, anim: "stand", seq: [0], idx: 0, t: 0, fps: 8, loop: true, visible: false, front: false };
  var scene = { phoneOnDesk: true, notify: 0, mode: "off", bootT: 0, buildP: 0, okT: 0, lines: [], cursorT: 0, typing: false, sparks: [] };

  function rnd(a, b) { return a + Math.random() * (b - a); }
  function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

  function setAnim(name, o) {
    o = o || {};
    var f = DATA.frames[name];
    actor.anim = name;
    actor.seq = o.frames || (function () { var a = []; for (var i = 0; i < f[1]; i++) a.push(i); return a; })();
    actor.idx = 0; actor.t = 0; actor.fps = o.fps || 8; actor.loop = o.loop !== false;
  }

  /* ---------------------------------------------------------------- passos da história (geradores) */
  function wait(s) { var t = 0; return { update: function (dt) { t += dt; return t >= s; } }; }
  function walk(to, speed) {
    speed = speed || 38;
    setAnim("walk", { fps: 9 });
    return { update: function (dt) { actor.x += speed * dt; if (actor.x >= to) { actor.x = to; return true; } return false; } };
  }
  function play(name, dur, o) { setAnim(name, o); return wait(dur); }
  function playOnce(name, per, o) {   // roda os frames uma vez e segura o último
    var f = DATA.frames[name]; o = o || {}; o.loop = false; o.fps = o.fps || (1 / per);
    setAnim(name, o);
    return wait(actor.seq.length * (1 / actor.fps));
  }

  function* intro() {
    yield wait(0.6);
    actor.visible = true;
    yield walk(PRESENT_X);
    actor.front = true;
    yield play("front_idle", 0.8, { fps: 2.5 });
    yield play("front_thumb", 2.3, { frames: [0, 1, 0, 1, 0, 2], fps: 3 });
    actor.front = false;
    yield play("stand", 0.35, { fps: 2 });
    yield walk(SEAT_X);
    yield playOnce("sit", 0.3);
    yield play("seat_idle", 0.5, { fps: 2 });
    scene.mode = "boot"; scene.bootT = 0;
    yield play("seat_idle", 1.3, { fps: 2 });
    scene.mode = "code";
    yield play("lean", 0.5, { fps: 3 });
    yield microType(3.2);
    yield* phoneTest();
    yield microType(1.4);
  }

  function microType(d) { scene.typing = true; return play("type", d, { fps: 7.5, frames: [0, 1, 0, 1, 2, 3, 2, 3] }); }

  function* phoneTest() {
    scene.typing = false;
    scene.notify = 1.1;
    yield play("type", 1.0, { fps: 7.5, frames: [0, 1, 0, 1] });
    yield playOnce("phone_reach", 0.2);
    scene.phoneOnDesk = false;
    yield playOnce("phone_up", 0.2);
    yield play("phone_look", rnd(1.1, 1.8), { fps: 2.2 });
    yield play("phone_tap", rnd(1.4, 2.4), { fps: 3.2 });
    yield play("phone_look", 0.7, { fps: 2 });
    yield playOnce("phone_up", 0.2, { frames: [2, 1, 0] });
    yield playOnce("phone_reach", 0.2, { frames: [2, 1, 0] });
    scene.phoneOnDesk = true;
    scene.typing = true;
  }

  function* loop() {
    var lastKind = "", sincePhone = 0;
    while (true) {
      var w = [["type", 40], ["think", 13], ["scratch", 10], ["lean", 9], ["notify", 8], ["build", 10], ["phone", sincePhone > 3 ? 12 : 4]];
      var tot = 0; for (var i = 0; i < w.length; i++) { if (w[i][0] === lastKind) w[i][1] *= 0.15; tot += w[i][1]; }
      var r = Math.random() * tot, kind = "type";
      for (i = 0; i < w.length; i++) { r -= w[i][1]; if (r <= 0) { kind = w[i][0]; break; } }
      lastKind = kind; sincePhone++;
      if (kind === "type") { yield microType(rnd(4.5, 10)); }
      else if (kind === "think") { scene.typing = false; yield play("think", rnd(2, 3.6), { fps: 1.3 }); }
      else if (kind === "scratch") { scene.typing = false; yield play("scratch", rnd(1.4, 2.2), { fps: 5 }); }
      else if (kind === "lean") { yield play("lean", rnd(1, 1.8), { fps: 4 }); yield microType(rnd(2, 4)); }
      else if (kind === "notify") { scene.notify = 1.3; yield microType(1.4); if (Math.random() < 0.5) { sincePhone = 0; yield* phoneTest(); } }
      else if (kind === "build") { yield* build(); }
      else { sincePhone = 0; yield* phoneTest(); }
    }
  }

  function* build() {
    yield microType(rnd(1.5, 2.5));
    scene.typing = false; scene.mode = "build"; scene.buildP = 0;
    yield play("lean", 2.0, { fps: 3 });
    scene.mode = "ok"; scene.okT = 0; spark(30);
    yield play("success", 1.5, { fps: 5 });
    scene.mode = "code";
  }

  var gen = null, step = null;
  function* story() { yield* intro(); yield* loop(); }
  function advance(dt) {
    if (!gen) { gen = story(); step = gen.next().value; }
    if (step && step.update(dt)) { var n = gen.next(); step = n.value; }
  }

  /* ---------------------------------------------------------------- tela do monitor */
  var COLORS = ["#63b3ff", "#46d9ff", "#8f9bc4", "#e8bc46", "#63b3ff", "#8f9bc4"];
  function newLine() {
    var segs = [], n = 2 + Math.floor(Math.random() * 3), tot = 0;
    for (var i = 0; i < n; i++) { var len = 3 + Math.floor(Math.random() * 8); segs.push({ c: pick(COLORS), n: len }); tot += len + 1; }
    return { ind: Math.floor(Math.random() * 4), segs: segs, reveal: 0, total: tot };
  }
  function spark(n) { for (var i = 0; i < n; i++) scene.sparks.push({ x: 206 + rnd(-14, 14), y: 98 + rnd(-8, 8), vx: rnd(-14, 14), vy: rnd(-26, -8), life: rnd(0.5, 1.1), c: pick(["#e8bc46", "#63b3ff", "#f5f0e4"]) }); }

  function updateScreen(dt) {
    scene.cursorT += dt;
    if (scene.mode === "boot") scene.bootT += dt;
    if (scene.mode === "build") scene.buildP = Math.min(1, scene.buildP + dt / 1.9);
    if (scene.mode === "ok") scene.okT += dt;
    if (scene.notify > 0) scene.notify -= dt;
    if (scene.mode !== "code" || !scene.typing) return;
    var L = scene.lines, cur = L[L.length - 1];
    if (!cur || cur.reveal >= cur.total) { cur = newLine(); L.push(cur); if (L.length > 8) L.shift(); }
    cur.reveal += dt * rnd(9, 15);
  }

  function drawScreen() {
    var g = octx, m = scene.mode;
    g.fillStyle = "#0a1028"; g.fillRect(0, 0, 36, 24);
    if (m === "off") {
      g.fillStyle = "#070b1c"; g.fillRect(0, 0, 36, 24);
      g.fillStyle = "rgba(232,188,70," + (0.35 + 0.25 * Math.sin(scene.cursorT * 2)) + ")"; g.fillRect(17, 11, 2, 2);
      return;
    }
    if (m === "boot") {
      g.fillStyle = "#070b1c"; g.fillRect(0, 0, 36, 24);
      g.fillStyle = "#e8bc46"; g.fillRect(16, 8, 4, 3); g.fillRect(15, 7, 1, 2); g.fillRect(20, 7, 1, 2); g.fillRect(17, 6, 2, 1);
      g.fillStyle = "#18214a"; g.fillRect(10, 16, 16, 1);
      g.fillStyle = "#3c82ff"; g.fillRect(10, 16, Math.min(16, Math.round(scene.bootT / 1.2 * 16)), 1);
      return;
    }
    g.fillStyle = "#161e3e"; g.fillRect(0, 0, 36, 4);
    g.fillStyle = "#e8bc46"; g.fillRect(2, 1, 1, 1); g.fillStyle = "#63b3ff"; g.fillRect(5, 1, 1, 1); g.fillStyle = "#f5f0e4"; g.fillRect(8, 1, 1, 1);
    g.fillStyle = "#0e1634"; g.fillRect(0, 4, 7, 20);
    var L = scene.lines;
    for (var li = 0; li < L.length; li++) {
      var ln = L[li], x = 8 + ln.ind * 2, y = 5 + li * 2, budget = Math.floor(ln.reveal);
      for (var si = 0; si < ln.segs.length && budget > 0; si++) {
        var sg = ln.segs[si], w = Math.min(sg.n, budget);
        g.fillStyle = sg.c; g.fillRect(x, y, Math.min(w, 35 - x), 1);
        x += sg.n + 1; budget -= sg.n + 1;
      }
      if (li === L.length - 1 && (scene.typing || Math.floor(scene.cursorT * 2) % 2 === 0)) { g.fillStyle = "#f5f0e4"; g.fillRect(Math.min(33, x), y, 1, 2); }
    }
    if (!L.length && Math.floor(scene.cursorT * 2) % 2 === 0) { g.fillStyle = "#f5f0e4"; g.fillRect(10, 5, 1, 2); }
    if (m === "build" || m === "ok") {
      g.fillStyle = "#13284f"; g.fillRect(8, 20, 24, 2);
      g.fillStyle = m === "ok" ? "#58d3a5" : "#3c82ff"; g.fillRect(8, 20, Math.round(24 * (m === "ok" ? 1 : scene.buildP)), 2);
      if (m === "ok") { g.fillStyle = "#58d3a5"; g.fillRect(29, 15, 1, 1); g.fillRect(30, 16, 1, 1); g.fillRect(31, 14, 1, 3); }
    }
  }

  /* ---------------------------------------------------------------- desenho */
  function frameRect(name, i) {
    var f = DATA.frames[name], k = f[0] + i, cw = DATA.cell[0], ch = DATA.cell[1];
    return [(k % DATA.cols) * cw, Math.floor(k / DATA.cols) * ch, cw, ch];
  }

  function draw(t) {
    ctx.clearRect(0, 0, view.w, view.h);
    ctx.save();
    ctx.translate(-Math.round(view.x), -view.y);
    ctx.drawImage(bg, 0, 0);
    // tela viva projetada
    drawScreen();
    for (var i = 0; i < 36; i++) {
      var top = SC.top + Math.round(i * SC.slope), h = Math.round(SC.h0 - i * SC.hslope);
      ctx.drawImage(off, i, 0, 1, 24, SC.x0 + i, top, 1, h);
    }
    // celular na mesa (pisca quando chega notificação), caneca e vapor
    if (scene.phoneOnDesk) {
      ctx.fillStyle = "#242a44"; ctx.fillRect(150, 111, 7, 2);
      var lit = scene.notify > 0 && Math.floor(scene.notify * 6) % 2 === 0;
      ctx.fillStyle = lit ? "#ffffff" : "#63b3ff"; ctx.fillRect(151, 111, 5, 1);
    }
    ctx.fillStyle = "#ede8dc"; ctx.fillRect(227, 106, 6, 5); ctx.fillStyle = "#e8bc46"; ctx.fillRect(227, 108, 6, 1); ctx.fillStyle = "#ede8dc"; ctx.fillRect(233, 108, 2, 3);
    for (var s = 0; s < 3; s++) {
      var p = (t * 0.5 + s / 3) % 1;
      ctx.fillStyle = "rgba(245,240,228," + (0.5 * (1 - p)) + ")";
      ctx.fillRect(229 + Math.round(Math.sin(t * 2 + s * 2) * 1.5), 105 - Math.round(p * 9), 1, 1);
    }
    // estrelas piscando
    ctx.fillStyle = "rgba(255,255,255," + (0.35 + 0.35 * Math.sin(t * 1.7)) + ")"; ctx.fillRect(34, 25, 1, 1); ctx.fillRect(57, 24, 1, 1);
    ctx.fillStyle = "rgba(255,255,255," + (0.35 + 0.35 * Math.sin(t * 1.3 + 2)) + ")"; ctx.fillRect(30, 33, 1, 1); ctx.fillRect(45, 20, 1, 1);
    // personagem (sombra + sprite)
    if (actor.visible) {
      var fr = frameRect(actor.anim, actor.seq[actor.idx] || 0);
      var ax = Math.round(actor.x);
      ctx.fillStyle = "rgba(0,0,0,0.28)"; ctx.fillRect(ax - 9, FLOOR, 18, 1); ctx.fillStyle = "rgba(0,0,0,0.14)"; ctx.fillRect(ax - 12, FLOOR + 1, 24, 1);
      ctx.drawImage(spr, fr[0], fr[1], fr[2], fr[3], ax - DATA.anchor[0], FLOOR - DATA.anchor[1], fr[2], fr[3]);
    }
    // faíscas do "build ok"
    for (var k = scene.sparks.length - 1; k >= 0; k--) {
      var sp = scene.sparks[k];
      ctx.fillStyle = sp.c; ctx.globalAlpha = Math.max(0, sp.life); ctx.fillRect(Math.round(sp.x), Math.round(sp.y), 1, 1);
    }
    ctx.globalAlpha = 1;
    ctx.restore();
  }

  function update(dt) {
    clock += dt;
    advance(dt);
    // animação de frames
    actor.t += dt;
    var n = actor.seq.length, fi = Math.floor(actor.t * actor.fps);
    actor.idx = actor.loop ? fi % n : Math.min(n - 1, fi);
    updateScreen(dt);
    for (var k = scene.sparks.length - 1; k >= 0; k--) {
      var sp = scene.sparks[k]; sp.life -= dt; sp.x += sp.vx * dt; sp.y += sp.vy * dt; sp.vy += 40 * dt;
      if (sp.life <= 0) scene.sparks.splice(k, 1);
    }
    // câmera (só no enquadramento do celular): segue o personagem
    if (view.crop) {
      var target = Math.max(0, Math.min(W - view.w, actor.x - 52));
      cam.x += (target - cam.x) * Math.min(1, dt * 3.2);
      view.x = cam.x;
    }
  }

  /* ---------------------------------------------------------------- laço (25 fps, com pausas) */
  function frame(now) {
    raf = 0;
    if (!state.running) return;
    var dt = Math.min(0.1, (now - last) / 1000);
    if (now - last >= 40) { last = now; update(dt); draw(clock); }
    raf = requestAnimationFrame(frame);
  }
  function sync() {
    var should = state.loaded && state.visible && !state.hidden;
    if (should && !state.running) { state.running = true; last = performance.now(); if (!state.started) { state.started = true; showCanvas(); } if (!raf) raf = requestAnimationFrame(frame); }
    else if (!should && state.running) { state.running = false; if (raf) { cancelAnimationFrame(raf); raf = 0; } }
  }

  /* ---------------------------------------------------------------- layout (escala inteira) */
  function layout() {
    var cw = root.parentElement ? root.parentElement.clientWidth : 480;
    var crop = window.innerWidth < 600;
    var vw = crop ? CROP.w : W, vh = crop ? CROP.h : H;
    var scale = Math.max(1, Math.min(2, Math.floor(cw / vw)));
    view.crop = crop; view.w = vw; view.h = vh; view.y = crop ? CROP.y : 0; view.scale = scale;
    if (!crop) { view.x = 0; cam.x = 0; }
    root.style.setProperty("--hs-w", vw * scale + "px");
    root.style.setProperty("--hs-h", vh * scale + "px");
    root.style.setProperty("--hs-ox", (-(crop ? Math.round(view.x) : 0) * scale) + "px");
    root.style.setProperty("--hs-oy", (-view.y * scale) + "px");
    root.style.setProperty("--hs-pw", W * scale + "px");
    root.classList.toggle("is-crop", crop);
    if (canvas) { canvas.width = vw; canvas.height = vh; ctx.imageSmoothingEnabled = false; if (state.started) draw(clock); }
  }

  function showCanvas() {
    canvas.className = "hs-canvas";
    stage.appendChild(canvas);
    draw(0);
    root.classList.add("is-live");
  }

  /* ---------------------------------------------------------------- carga (depois do load; só perto da viewport) */
  function load() {
    var n = 0;
    function done() { if (++n < 2) return; canvas = document.createElement("canvas"); canvas.setAttribute("aria-hidden", "true");
      ctx = canvas.getContext("2d"); off = document.createElement("canvas"); off.width = 36; off.height = 24; octx = off.getContext("2d");
      state.loaded = true; layout(); sync(); }
    bg = new Image(); bg.onload = done; bg.src = BASE + "scene.png";
    spr = new Image(); spr.onload = done; spr.src = BASE + "sprites.png";
  }

  var started = false;
  function boot() {
    if (started) return; started = true;
    load();
  }
  function init() {
    if ("IntersectionObserver" in window) {
      var io = new IntersectionObserver(function (es) {
        state.visible = es[0].isIntersecting;
        if (state.visible) boot();
        sync();
      }, { rootMargin: "120px 0px" });
      io.observe(root);
    } else { state.visible = true; boot(); }
    document.addEventListener("visibilitychange", function () { state.hidden = document.hidden; sync(); });
    window.addEventListener("resize", function () { if (state.loaded) layout(); });
    mql.addEventListener && mql.addEventListener("change", function (e) {
      if (e.matches) { state.running = false; if (raf) cancelAnimationFrame(raf); if (canvas && canvas.parentNode) canvas.parentNode.removeChild(canvas); root.classList.remove("is-live"); if (poster) { poster.src = poster.getAttribute("data-final"); } }
    });
  }
  if (document.readyState === "complete") init(); else window.addEventListener("load", init);
})();
