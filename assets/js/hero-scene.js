/* Lucksrei — cena pixel art do hero (Lucas programando).
 *
 * Canvas 2D + requestAnimationFrame + folha de sprites. Sem biblioteca e sem texto na cena (não depende de idioma).
 * Mundo de 240x150 px lógicos desenhado em escala inteira (image-rendering: pixelated).
 *
 * Fluxo: o pôster (img) já está no HTML; depois do load os assets entram em segundo plano e, quando a cena
 * aparece na tela, a INTRO roda do começo (a cada carregamento) e depois entra em um LOOP de microações sorteadas.
 * Efeitos: luz do monitor/celular no rosto, símbolos de código subindo do teclado, balões (dúvida, ideia,
 * notificação, build ok), estrela cadente na janela e poeira na luz. Pausa com a aba oculta e fora da viewport.
 * prefers-reduced-motion: só o pôster final, sem animação e sem carregar nada.
 * Assets e o bloco FRAMES abaixo vêm de tools/make-hero-scene.py.
 */
(function () {
  "use strict";
  var root = document.getElementById("hero-scene");
  if (!root) return;
  var poster = root.querySelector(".hs-poster");
  var stage = root.querySelector(".hs-stage") || root;
  var mql = window.matchMedia("(prefers-reduced-motion: reduce)");
  if (mql.matches) { if (poster && poster.getAttribute("data-final")) poster.src = poster.getAttribute("data-final"); return; }

  var DATA = /*FRAMES*/ {"cell":[72,72],"anchor":[32,68],"cols":10,"frames":{"front_idle":[0,3],"front_thumb":[3,4],"stand":[7,2],"walk":[9,8],"sit":[17,4],"type":[21,6],"seat_idle":[27,4],"lean":[31,2],"think":[33,2],"scratch":[35,4],"phone_reach":[39,3],"phone_up":[42,3],"phone_look":[45,2],"phone_tap":[47,2],"success":[49,4]},"floor":138,"seatX":144,"cols_screen":[[190,74,34],[191,74,34],[192,74,33],[193,75,33],[194,75,33],[195,75,32],[196,75,32],[197,75,32],[198,76,32],[199,76,31],[200,76,31],[201,76,31],[202,76,30],[203,77,30],[204,77,30],[205,77,30],[206,77,29],[207,77,29],[208,78,29],[209,78,28],[210,78,28],[211,78,28],[212,78,27],[213,79,27],[214,79,27],[215,79,26],[216,79,26],[217,79,26],[218,80,26],[219,80,25]],"phone":[148,109,6,2],"mug":[230,104],"desk":[148,238,111]} /*END-FRAMES*/;
  var W = 240, H = 150, FLOOR = DATA.floor, SEAT_X = DATA.seatX, ENTER_X = -44, PRESENT_X = 66;
  var COLS = DATA.cols_screen, PH = DATA.phone, MUG = DATA.mug;
  var BASE = root.getAttribute("data-base") || "/assets/img/hero/";
  var CROP = { w: 150, h: 100, y: 44 };           // enquadramento no celular
  var SEATED = { sit: 1, type: 1, seat_idle: 1, lean: 1, think: 1, scratch: 1, phone_reach: 1, phone_up: 1, phone_look: 1, phone_tap: 1, success: 1 };

  var state = { running: false, visible: false, hidden: document.hidden, started: false, loaded: false };
  var bg, spr, canvas, ctx, off, octx, cc, cctx, view = { x: 0, y: 0, w: W, h: H, scale: 2, crop: false }, cam = { x: 0 };
  var raf = 0, last = 0, clock = 0;

  /* ---------------------------------------------------------------- estado */
  var actor = { x: ENTER_X, anim: "stand", seq: [0], idx: 0, t: 0, fps: 8, loop: true, visible: false };
  var scene = { phoneOnDesk: true, phoneInHand: false, notify: 0, mode: "off", bootT: 0, buildP: 0, okT: 0, lines: [],
    cursorT: 0, typing: false, speed: 1, glyphT: 0.6, bubble: null, fx: [], starT: 9, dust: [] };

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
    speed = speed || 40;
    setAnim("walk", { fps: 10 });
    return { update: function (dt) { actor.x += speed * dt; if (actor.x >= to) { actor.x = to; return true; } return false; } };
  }
  function play(name, dur, o) { setAnim(name, o); return wait(dur); }
  function playOnce(name, per, o) {
    o = o || {}; o.loop = false; o.fps = o.fps || (1 / per);
    setAnim(name, o);
    return wait(actor.seq.length / actor.fps);
  }
  function bubble(kind, dur, x, y) { scene.bubble = { kind: kind, t: 0, dur: dur, x: x, y: y }; }

  function microType(d, fast) {
    scene.typing = true; scene.speed = fast ? 1.8 : 1;
    return play("type", d, { fps: fast ? 11 : 7.5, frames: [0, 1, 2, 3, 4, 5, 2, 1] });
  }

  function* intro() {
    yield wait(0.7);
    actor.visible = true;
    yield walk(PRESENT_X);
    yield play("front_idle", 0.7, { fps: 2.5 });
    yield play("front_thumb", 2.2, { frames: [0, 1, 0, 3, 0, 2], fps: 3 });
    yield play("stand", 0.3, { fps: 2 });
    yield walk(SEAT_X);
    yield playOnce("sit", 0.22);
    yield play("seat_idle", 0.5, { fps: 2 });
    scene.mode = "boot"; scene.bootT = 0;
    yield play("seat_idle", 1.4, { fps: 2 });
    scene.mode = "code";
    yield play("lean", 0.4, { fps: 3 });
    yield microType(3.4);
    yield* phoneTest();
    yield microType(1.4);
  }

  function* phoneTest() {
    scene.typing = false;
    scene.notify = 1.2;
    bubble("bell", 1.2, 160, 84);
    yield play("type", 1.1, { fps: 7.5, frames: [0, 1, 2, 3] });
    yield playOnce("phone_reach", 0.18);
    scene.phoneOnDesk = false; scene.phoneInHand = true;
    yield playOnce("phone_up", 0.18);
    yield play("phone_look", rnd(1.0, 1.6), { fps: 2.2 });
    yield play("phone_tap", rnd(1.6, 2.4), { fps: 3.4 });
    yield play("phone_look", 0.6, { fps: 2 });
    if (Math.random() < 0.55) { bubble("check", 1.0, SEAT_X + 6, 66); yield play("phone_look", 0.8, { fps: 2 }); }
    yield playOnce("phone_up", 0.18, { frames: [2, 1, 0] });
    yield playOnce("phone_reach", 0.18, { frames: [2, 1, 0] });
    scene.phoneOnDesk = true; scene.phoneInHand = false;
    scene.typing = true;
  }

  function* think() {
    scene.typing = false;
    bubble("dots", 1.2, SEAT_X + 6, 64);
    yield play("think", 1.2, { fps: 1.3 });
    bubble("q", rnd(1.0, 1.6), SEAT_X + 6, 64);
    yield play("think", scene.bubble.dur, { fps: 1.3 });
    if (Math.random() < 0.6) {
      bubble("bulb", 1.1, SEAT_X + 6, 64);
      yield play("lean", 0.5, { fps: 4 });
      yield microType(rnd(2.5, 4), true);           // ideia: digita rápido
    }
  }

  function* build() {
    yield microType(rnd(1.5, 2.5));
    scene.typing = false; scene.mode = "build"; scene.buildP = 0;
    yield play("lean", 2.0, { fps: 3 });
    scene.mode = "ok"; scene.okT = 0; confetti(34);
    bubble("check", 1.4, 204, 58);
    yield play("success", 1.5, { fps: 5 });
    scene.mode = "code";
  }

  function* loop() {
    var lastKind = "", sincePhone = 0;
    while (true) {
      var w = [["type", 38], ["think", 14], ["scratch", 9], ["lean", 8], ["notify", 8], ["build", 11], ["phone", sincePhone > 3 ? 12 : 3]];
      var tot = 0; for (var i = 0; i < w.length; i++) { if (w[i][0] === lastKind) w[i][1] *= 0.15; tot += w[i][1]; }
      var r = Math.random() * tot, kind = "type";
      for (i = 0; i < w.length; i++) { r -= w[i][1]; if (r <= 0) { kind = w[i][0]; break; } }
      lastKind = kind; sincePhone++;
      if (kind === "type") yield microType(rnd(4, 9), Math.random() < 0.25);
      else if (kind === "think") yield* think();
      else if (kind === "scratch") { scene.typing = false; yield play("scratch", rnd(1.4, 2.2), { fps: 5 }); }
      else if (kind === "lean") { yield play("lean", rnd(1, 1.6), { fps: 4 }); yield microType(rnd(2, 4)); }
      else if (kind === "notify") { scene.notify = 1.3; bubble("bell", 1.3, 160, 84); yield microType(1.5); if (Math.random() < 0.5) { sincePhone = 0; yield* phoneTest(); } }
      else if (kind === "build") yield* build();
      else { sincePhone = 0; yield* phoneTest(); }
    }
  }

  var gen = null, step = null;
  function* story() { yield* intro(); yield* loop(); }
  function advance(dt) {
    if (!gen) { gen = story(); step = gen.next().value; }
    if (step && step.update(dt)) step = gen.next().value;
  }

  /* ---------------------------------------------------------------- pixel font (símbolos de código e ícones) */
  var GLYPH = {
    "{": [".##", ".#.", "#..", ".#.", ".##"], "}": ["##.", ".#.", "..#", ".#.", "##."],
    "<": ["..#", ".#.", "#..", ".#.", "..#"], ">": ["#..", ".#.", "..#", ".#.", "#.."],
    "/": ["..#", "..#", ".#.", "#..", "#.."], ";": ["...", ".#.", "...", ".#.", "#.."],
    "=": ["...", "###", "...", "###", "..."], "(": [".#", "#.", "#.", "#.", ".#"], ")": ["#.", ".#", ".#", ".#", "#."]
  };
  var ICON = {
    q: { c: "#3c82ff", p: [".###.", "#...#", "...#.", "..#..", ".....", "..#.."] },
    bulb: { c: "#e8bc46", p: [".###.", "#####", "#####", ".###.", ".ooo.", "..o.."] },
    check: { c: "#3fbf7f", p: ["....#", "...##", "#.##.", "###..", ".#..."] },
    bell: { c: "#e8bc46", p: ["..#..", ".###.", ".###.", ".###.", "#####", "..o.."] },
    dots: { c: "#8f9bc4", p: [".....", ".....", "#.#.#", ".....", "....."] }
  };
  function drawBits(g, rows, x, y, col, alt) {
    for (var r = 0; r < rows.length; r++) for (var c = 0; c < rows[r].length; c++) {
      var ch = rows[r][c];
      if (ch === "#") { g.fillStyle = col; g.fillRect(x + c, y + r, 1, 1); }
      else if (ch === "o") { g.fillStyle = alt || "#8f9bc4"; g.fillRect(x + c, y + r, 1, 1); }
    }
  }
  function drawBubble(b) {
    var p = Math.min(1, b.t / 0.15), out = b.t > b.dur - 0.2 ? Math.max(0, (b.dur - b.t) / 0.2) : 1;
    ctx.globalAlpha = out;
    var bx = Math.round(b.x - 5), by = Math.round(b.y - 4 * (1 - p));
    ctx.fillStyle = "#0a0c1a"; ctx.fillRect(bx - 1, by, 11, 10); ctx.fillRect(bx, by - 1, 9, 12);
    ctx.fillStyle = "#f5f0e4"; ctx.fillRect(bx, by, 9, 10);
    ctx.fillStyle = "#0a0c1a"; ctx.fillRect(bx + 3, by + 11, 2, 1); ctx.fillStyle = "#f5f0e4"; ctx.fillRect(bx + 3, by + 10, 2, 1);
    var ic = ICON[b.kind];
    drawBits(ctx, ic.p, bx + 2, by + 2, ic.c);
    ctx.globalAlpha = 1;
  }

  /* ---------------------------------------------------------------- efeitos */
  function confetti(n) {
    for (var i = 0; i < n; i++) scene.fx.push({ k: "dot", x: 205 + rnd(-12, 12), y: 86 + rnd(-8, 8), vx: rnd(-22, 22), vy: rnd(-34, -10), g: 46, life: rnd(0.7, 1.3), c: pick(["#e8bc46", "#ffe078", "#63b3ff", "#46d9ff", "#f5f0e4"]) });
  }
  function glyph() {
    var keys = Object.keys(GLYPH);
    scene.fx.push({ k: "glyph", ch: pick(keys), x: rnd(160, 176), y: 103, vx: rnd(-3, 3), vy: rnd(-12, -8), g: 0, life: 1.5, max: 1.5, c: pick(["#63b3ff", "#46d9ff", "#e8bc46", "#8f9bc4"]) });
  }
  function initDust() { for (var i = 0; i < 5; i++) scene.dust.push({ x: rnd(26, 70), y: rnd(70, 128), s: rnd(0.4, 1), ph: rnd(0, 6) }); }

  /* ---------------------------------------------------------------- tela do monitor */
  var COLORS = ["#63b3ff", "#46d9ff", "#8f9bc4", "#e8bc46", "#63b3ff", "#8f9bc4", "#c792ea"];
  function newLine() {
    var segs = [], n = 2 + Math.floor(Math.random() * 3), tot = 0;
    for (var i = 0; i < n; i++) { var len = 3 + Math.floor(Math.random() * 7); segs.push({ c: pick(COLORS), n: len }); tot += len + 1; }
    return { ind: Math.floor(Math.random() * 4), segs: segs, reveal: 0, total: tot };
  }
  function updateScreen(dt) {
    scene.cursorT += dt;
    if (scene.mode === "boot") scene.bootT += dt;
    if (scene.mode === "build") scene.buildP = Math.min(1, scene.buildP + dt / 1.9);
    if (scene.mode === "ok") scene.okT += dt;
    if (scene.notify > 0) scene.notify -= dt;
    if (scene.mode !== "code" || !scene.typing) return;
    var L = scene.lines, cur = L[L.length - 1];
    if (!cur || cur.reveal >= cur.total) { cur = newLine(); L.push(cur); if (L.length > 9) L.shift(); }
    cur.reveal += dt * rnd(9, 15) * scene.speed;
    scene.glyphT -= dt * scene.speed;
    if (scene.glyphT <= 0) { glyph(); scene.glyphT = rnd(0.6, 1.3); }
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
    g.fillStyle = "#161e3e"; g.fillRect(0, 0, 36, 3);
    g.fillStyle = "#e8bc46"; g.fillRect(2, 1, 1, 1); g.fillStyle = "#63b3ff"; g.fillRect(4, 1, 1, 1); g.fillStyle = "#f5f0e4"; g.fillRect(6, 1, 1, 1);
    g.fillStyle = "#0e1634"; g.fillRect(0, 3, 6, 21);
    for (var k = 0; k < 6; k++) { g.fillStyle = k === 2 ? "#3c82ff" : "#26305a"; g.fillRect(1, 5 + k * 3, 3, 1); }
    var L = scene.lines;
    for (var li = 0; li < L.length; li++) {
      var ln = L[li], x = 8 + ln.ind * 2, y = 4 + li * 2, budget = Math.floor(ln.reveal);
      for (var si = 0; si < ln.segs.length && budget > 0; si++) {
        var sg = ln.segs[si], w = Math.min(sg.n, budget);
        g.fillStyle = sg.c; g.fillRect(x, y, Math.min(w, 35 - x), 1);
        x += sg.n + 1; budget -= sg.n + 1;
      }
      if (li === L.length - 1 && (scene.typing || Math.floor(scene.cursorT * 2) % 2 === 0)) { g.fillStyle = "#f5f0e4"; g.fillRect(Math.min(33, x), y, 1, 2); }
    }
    if (!L.length && Math.floor(scene.cursorT * 2) % 2 === 0) { g.fillStyle = "#f5f0e4"; g.fillRect(10, 5, 1, 2); }
    if (m === "build" || m === "ok") {
      g.fillStyle = "#0a1028"; g.fillRect(6, 19, 30, 5);
      g.fillStyle = "#13284f"; g.fillRect(8, 20, 24, 2);
      g.fillStyle = m === "ok" ? "#3fbf7f" : "#3c82ff"; g.fillRect(8, 20, Math.round(24 * (m === "ok" ? 1 : scene.buildP)), 2);
    }
  }

  /* ---------------------------------------------------------------- desenho */
  function frameRect(name, i) {
    var f = DATA.frames[name], k = f[0] + i, cw = DATA.cell[0], ch = DATA.cell[1];
    return [(k % DATA.cols) * cw, Math.floor(k / DATA.cols) * ch, cw, ch];
  }

  function glowAmount() {
    if (scene.phoneInHand) return { c: "126,196,255", a: 0.12 + 0.03 * Math.sin(clock * 9), x: 37, y: 22, w: 12, h: 18 };
    if (!SEATED[actor.anim] || scene.mode === "off") return null;
    if (scene.mode === "ok") return { c: "63,191,127", a: 0.16 * Math.max(0, 1 - scene.okT / 1.5), x: 36, y: 20, w: 24, h: 24 };
    var a = scene.mode === "boot" ? 0.08 : 0.12 + (scene.typing ? 0.04 * Math.sin(clock * 11) : 0);
    return { c: "80,150,255", a: a, x: 36, y: 20, w: 24, h: 24 };
  }

  function draw(t) {
    ctx.clearRect(0, 0, view.w, view.h);
    ctx.save();
    ctx.translate(-Math.round(view.x), -view.y);
    ctx.drawImage(bg, 0, 0);
    // estrela cadente e estrelas piscando (janela)
    ctx.fillStyle = "rgba(255,255,255," + (0.35 + 0.35 * Math.sin(t * 1.7)) + ")"; ctx.fillRect(34, 25, 1, 1); ctx.fillRect(57, 24, 1, 1);
    ctx.fillStyle = "rgba(255,255,255," + (0.35 + 0.35 * Math.sin(t * 1.3 + 2)) + ")"; ctx.fillRect(30, 33, 1, 1); ctx.fillRect(45, 20, 1, 1);
    // tela viva projetada (perspectiva: virada para ele)
    drawScreen();
    for (var i = 0; i < COLS.length; i++) {
      var col = COLS[i], sx = Math.min(35, Math.floor(i * 36 / COLS.length));
      ctx.drawImage(off, sx, 0, 1, 24, col[0], col[1], 1, col[2]);
    }
    // celular na mesa, caneca e vapor
    if (scene.phoneOnDesk) {
      ctx.fillStyle = "#242a44"; ctx.fillRect(PH[0], PH[1], PH[2], PH[3]);
      var lit = scene.notify > 0 && Math.floor(scene.notify * 6) % 2 === 0;
      ctx.fillStyle = lit ? "#ffffff" : "#63b3ff"; ctx.fillRect(PH[0] + 1, PH[1], PH[2] - 2, 1);
      if (lit) { ctx.fillStyle = "rgba(126,196,255,.25)"; ctx.fillRect(PH[0] - 2, PH[1] - 3, PH[2] + 4, 3); }
    }
    ctx.fillStyle = "#ede8dc"; ctx.fillRect(MUG[0], MUG[1], 6, 6); ctx.fillStyle = "#e8bc46"; ctx.fillRect(MUG[0], MUG[1] + 2, 6, 1); ctx.fillStyle = "#a37a50"; ctx.fillRect(MUG[0], MUG[1], 6, 1); ctx.fillStyle = "#ede8dc"; ctx.fillRect(MUG[0] + 6, MUG[1] + 2, 2, 3);
    for (var s = 0; s < 3; s++) {
      var p = (t * 0.5 + s / 3) % 1;
      ctx.fillStyle = "rgba(245,240,228," + (0.5 * (1 - p)) + ")";
      ctx.fillRect(MUG[0] + 2 + Math.round(Math.sin(t * 2 + s * 2) * 1.5), MUG[1] - 1 - Math.round(p * 9), 1, 1);
    }
    // poeira na luz da janela
    for (var d = 0; d < scene.dust.length; d++) {
      var du = scene.dust[d];
      ctx.fillStyle = "rgba(190,215,255," + (0.18 + 0.14 * Math.sin(t * du.s + du.ph)) + ")";
      ctx.fillRect(Math.round(du.x + Math.sin(t * 0.3 + du.ph) * 3), Math.round(du.y), 1, 1);
    }
    // personagem: sombra + sprite (com a luz da tela/celular no rosto, só nos pixels dele)
    if (actor.visible) {
      var fr = frameRect(actor.anim, actor.seq[actor.idx] || 0);
      var ax = Math.round(actor.x), cw = fr[2], ch = fr[3];
      ctx.fillStyle = "rgba(0,0,0,0.28)"; ctx.fillRect(ax - 10, FLOOR, 20, 1); ctx.fillStyle = "rgba(0,0,0,0.14)"; ctx.fillRect(ax - 13, FLOOR + 1, 26, 1);
      var gl = glowAmount();
      if (gl && gl.a > 0.01) {
        cctx.globalCompositeOperation = "source-over";
        cctx.clearRect(0, 0, cw, ch);
        cctx.drawImage(spr, fr[0], fr[1], cw, ch, 0, 0, cw, ch);
        cctx.globalCompositeOperation = "source-atop";
        cctx.fillStyle = "rgba(" + gl.c + "," + gl.a.toFixed(3) + ")"; cctx.fillRect(gl.x, gl.y, gl.w, gl.h);
        
        ctx.drawImage(cc, ax - DATA.anchor[0], FLOOR - DATA.anchor[1]);
      } else {
        ctx.drawImage(spr, fr[0], fr[1], cw, ch, ax - DATA.anchor[0], FLOOR - DATA.anchor[1], cw, ch);
      }
    }
    // partículas (confete e símbolos de código)
    for (var k = 0; k < scene.fx.length; k++) {
      var f = scene.fx[k];
      if (f.k === "glyph") {
        ctx.globalAlpha = Math.max(0, Math.min(1, f.life / f.max * 1.6));
        drawBits(ctx, GLYPH[f.ch], Math.round(f.x), Math.round(f.y), f.c);
      } else if (f.k === "star") {
        for (var tr = 0; tr < 6; tr++) { ctx.globalAlpha = Math.max(0, f.life / f.max) * (1 - tr / 6); ctx.fillStyle = "#ffffff"; ctx.fillRect(Math.round(f.x + tr * 1.6), Math.round(f.y - tr * 0.8), 1, 1); }
      } else {
        ctx.globalAlpha = Math.max(0, Math.min(1, f.life)); ctx.fillStyle = f.c; ctx.fillRect(Math.round(f.x), Math.round(f.y), 1, 1);
      }
    }
    ctx.globalAlpha = 1;
    if (scene.bubble) drawBubble(scene.bubble);
    ctx.restore();
  }

  function update(dt) {
    clock += dt;
    advance(dt);
    actor.t += dt;
    var n = actor.seq.length, fi = Math.floor(actor.t * actor.fps);
    actor.idx = actor.loop ? fi % n : Math.min(n - 1, fi);
    updateScreen(dt);
    if (scene.bubble) { scene.bubble.t += dt; if (scene.bubble.t >= scene.bubble.dur) scene.bubble = null; }
    // estrela cadente de vez em quando
    scene.starT -= dt;
    if (scene.starT <= 0) { scene.fx.push({ k: "star", x: rnd(36, 58), y: rnd(19, 30), vx: -34, vy: 17, g: 0, life: 0.55, max: 0.55 }); scene.starT = rnd(12, 24); }
    for (var k = scene.fx.length - 1; k >= 0; k--) {
      var f = scene.fx[k]; f.life -= dt; f.x += f.vx * dt; f.y += f.vy * dt; f.vy += (f.g || 0) * dt;
      if (f.k === "star" && (f.x < 24 || f.y > 58)) f.life = 0;
      if (f.life <= 0) scene.fx.splice(k, 1);
    }
    for (var d = 0; d < scene.dust.length; d++) { var du = scene.dust[d]; du.y -= dt * 1.5 * du.s; if (du.y < 66) du.y = 128; }
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
    function done() {
      if (++n < 2) return;
      canvas = document.createElement("canvas"); canvas.setAttribute("aria-hidden", "true");
      ctx = canvas.getContext("2d");
      off = document.createElement("canvas"); off.width = 36; off.height = 24; octx = off.getContext("2d");
      cc = document.createElement("canvas"); cc.width = DATA.cell[0]; cc.height = DATA.cell[1]; cctx = cc.getContext("2d");
      initDust();
      state.loaded = true; layout(); sync();
    }
    bg = new Image(); bg.onload = done; bg.src = BASE + "scene.png";
    spr = new Image(); spr.onload = done; spr.src = BASE + "sprites.png";
  }

  var started = false;
  function boot() { if (started) return; started = true; load(); }
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
    if (mql.addEventListener) mql.addEventListener("change", function (e) {
      if (e.matches) { state.running = false; if (raf) cancelAnimationFrame(raf); if (canvas && canvas.parentNode) canvas.parentNode.removeChild(canvas); root.classList.remove("is-live"); if (poster) poster.src = poster.getAttribute("data-final"); }
    });
  }
  if (document.readyState === "complete") init(); else window.addEventListener("load", init);
})();
