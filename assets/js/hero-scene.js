/* Lucksrei — cena pixel art do hero (v2): uma pequena história com começo, meio e fim (~40 s), sem loop.
 *
 * Canvas 2D + requestAnimationFrame + folha de sprites. Sem biblioteca. Mundo de 240x150 px lógicos em escala inteira.
 * Camadas: cenário (scene.png) → corpo do Lucas → mesa/teclado/monitor (desk.png) → caneca → braços sobre a mesa
 * (2ª metade da folha de sprites) → borda acesa das duas telas. As falas são HTML (nítidas e traduzíveis).
 *
 * Timeline determinística (mesma história a cada carregamento): STEPS abaixo. O relógio só anda com a cena visível
 * e a aba ativa (IntersectionObserver + visibilitychange): ao voltar, continua do mesmo instante. No fim (DONE) o
 * escritório fica vazio e o laço para. prefers-reduced-motion: só o pôster (Lucas sentado programando), nada carrega.
 * Sprites mudam no próprio ritmo (andar 10 fps, digitar 6, idle 2–3); o canvas desenha a ~25 fps.
 * Andar: o personagem avança STEP px a cada frame do ciclo (o pé de apoio recua os mesmos px no sprite): sem deslizar.
 * Assets e o bloco FRAMES vêm de tools/make-hero-scene.py.
 */
(function () {
  "use strict";
  var root = document.getElementById("hero-scene");
  if (!root) return;
  var poster = root.querySelector(".hs-poster");
  var stage = root.querySelector(".hs-stage") || root;
  var hellos = root.querySelectorAll(".hs-hello");
  var mql = window.matchMedia("(prefers-reduced-motion: reduce)");
  if (mql.matches) { if (poster && poster.getAttribute("data-final")) poster.src = poster.getAttribute("data-final"); return; }

  var DATA = /*FRAMES*/ {"cell":[72,72],"anchor":[32,68],"cols":10,"rows":7,"frames":{"front_idle":[0,3],"stand_r":[3,2],"stand_l":[5,2],"walk_r":[7,8],"walk_l":[15,8],"turn_r":[23,1],"turn_l":[24,1],"sit_down":[25,8],"seated_idle":[33,3],"typing":[36,4],"typing_down":[40,2],"scratch_head":[42,3],"scratch_neck":[45,3],"celebrate":[48,3],"coffee_reach":[51,2],"coffee_hold":[53,1],"coffee_drink":[54,2],"coffee_return":[56,1],"stand_up":[57,7]},"step":3,"entry":[-14,140],"present":[66,140],"waypoint":[84,128],"slot":[112,125],"seat":[114,109],"mug":[95,111],"monitors":[[112,98,13],[152,94,13]],"crop":{"x":40,"y":14,"w":160,"h":136},"hello":[62,8],"helloCrop":[44,17],"glow":[30,10,24,34]} /*END-FRAMES*/;
  var W = 240, H = 150, BASE = root.getAttribute("data-base") || "/assets/img/hero/";
  var CW = DATA.cell[0], CH = DATA.cell[1], AX = DATA.anchor[0], AY = DATA.anchor[1];
  var STEP = DATA.step, SLOT = DATA.slot, MUG = DATA.mug, MONS = DATA.monitors, GLOW = DATA.glow;
  var SEATED = { seated_idle: 1, typing: 1, typing_down: 1, scratch_head: 1, scratch_neck: 1, celebrate: 1,
    coffee_reach: 1, coffee_hold: 1, coffee_drink: 1, coffee_return: 1 };

  /* ---------------------------------------------------------------- timeline */
  // passo parado: { id, anim, d (s), fps, seq, loop } — caminhada: { id, anim, walk:[de, para], n frames, phase }
  var STEPS = [], T = 0;
  function hold(id, anim, d, o) { o = o || {}; STEPS.push({ id: id, anim: anim, d: d, fps: o.fps || 2, seq: o.seq || [0], loop: o.loop !== false, mug: o.mug }); }
  function walk(id, anim, from, to, phase) {
    var n = Math.ceil(Math.abs(to[0] - from[0]) / STEP);
    STEPS.push({ id: id, anim: anim, walk: [from, to], n: n, d: n / 10, fps: 10, phase: phase || 0 });
    return (phase || 0) + n;
  }
  var P = DATA.present, WP = DATA.waypoint, E = DATA.entry;
  // Cada ação humana tem antecipação e recuperação (100–400 ms): para de digitar → olha o monitor → pausa → age → volta → olha → digita.
  // `ease(n, k)`: repete cada quadro de uma sequência para dar ritmo (lento no começo/fim, rápido no meio) a 20 fps.
  function rep(frames, counts) { var o = []; for (var q = 0; q < frames.length; q++) for (var r = 0; r < counts[q]; r++) o.push(frames[q]); return o; }
  var TYPE = [0, 1, 2, 3];

  // ---- introdução: entra, para, vira de frente e encara o visitante — sem gesto — enquanto a 1ª fala aparece
  var ph = walk("INTRO_WALK", "walk_r", E, P);
  hold("INTRO_IDLE", "stand_r", 0.35);                                      // para
  hold("INTRO_IDLE", "turn_r", 0.2);                                        // gira o corpo
  hold("INTRO_THUMBS", "front_idle", 0.5, { seq: [0], fps: 2 });           // encara o visitante
  hold("INTRO_TEXT", "front_idle", 5.4, { seq: [0, 0, 1, 0, 0, 0, 2, 0, 0, 1, 0, 0, 0, 0, 2, 0], fps: 2.9 });   // parado, respira e pisca; 1ª fala
  hold("INTRO_TEXT", "front_idle", 0.4, { seq: [0], fps: 2 });

  // ---- caminha até a cadeira (pelo lado esquerdo da mesa), vira e senta
  hold("WALK_TO_DESK", "turn_r", 0.2);
  hold("WALK_TO_DESK", "stand_r", 0.15);
  ph = walk("WALK_TO_DESK", "walk_r", P, WP, 0);
  walk("WALK_TO_DESK", "walk_r", WP, SLOT, ph);
  hold("SIT", "stand_r", 0.3);                                            // chega ao lado da cadeira e para
  hold("SIT", "turn_r", 0.3);                                             // gira o corpo de frente para a cadeira
  hold("SIT", "sit_down", 1.1, { seq: rep([0, 1, 2, 3, 4, 5, 6, 7], [4, 3, 2, 2, 2, 2, 3, 4]), fps: 20, loop: false });
  hold("SIT", "seated_idle", 0.7, { seq: [0, 1, 0], fps: 3 });             // acomoda e olha os monitores

  for (var i = 0; i < STEPS.length; i++) { STEPS[i].t0 = T; T += STEPS[i].d; }
  var INTRO = STEPS, TI = T;            // intro: toca uma vez por carregamento e termina com ele sentado

  // ---- trabalho em LOOP infinito (sempre sentado): programa ~10 s → comemora → programa ~10 s → café →
  //      programa ~10 s → coça a cabeça → recomeça. Cada ação tem pausa antes/depois e volta limpa à digitação.
  STEPS = []; T = 0;
  // programa (~10 s): digitação com variações (olhar baixo, pausas curtas, piscadas) e, no fim, digita rápido: achou
  hold("TYPE_A", "typing", 3.0, { seq: TYPE, fps: 6 });
  hold("TYPE_A", "seated_idle", 0.4, { seq: [0, 2, 0], fps: 4 });
  hold("TYPE_A", "typing_down", 1.2, { seq: [0, 1], fps: 5 });
  hold("TYPE_A", "typing", 2.4, { seq: TYPE, fps: 7 });
  hold("TYPE_A", "seated_idle", 0.5, { seq: [0, 1, 0], fps: 3 });
  hold("TYPE_A", "typing", 2.5, { seq: TYPE, fps: 9 });
  // comemora: percebe que funcionou, soquinho curto, volta
  hold("CELEBRATE", "seated_idle", 0.3, { seq: [0, 2], fps: 4 });
  hold("CELEBRATE", "celebrate", 0.4, { seq: [0, 1], fps: 5, loop: false });
  hold("CELEBRATE", "celebrate", 0.3, { seq: [1], fps: 2 });
  hold("CELEBRATE", "celebrate", 0.25, { seq: [2], fps: 2 });
  hold("CELEBRATE", "seated_idle", 0.45, { seq: [0, 1], fps: 3 });
  // programa (~10 s)
  hold("TYPE_B", "typing", 2.4, { seq: TYPE, fps: 6 });
  hold("TYPE_B", "typing_down", 1.0, { seq: [0, 1], fps: 5 });
  hold("TYPE_B", "typing", 2.2, { seq: TYPE, fps: 7 });
  hold("TYPE_B", "seated_idle", 0.5, { seq: [0, 2, 0], fps: 4 });
  hold("TYPE_B", "typing", 2.0, { seq: TYPE, fps: 6 });
  hold("TYPE_B", "typing_down", 0.9, { seq: [1, 0], fps: 5 });
  hold("TYPE_B", "typing", 1.0, { seq: TYPE, fps: 6 });
  // café: mesa → mão → boca → mão → mesa (mesma caneca, mesmo desenho)
  hold("COFFEE", "seated_idle", 0.3, { seq: [0], fps: 2 });
  hold("COFFEE", "coffee_reach", 0.2);
  hold("COFFEE", "coffee_reach", 0.25, { seq: [1] });                     // mão na caneca (ainda na mesa)
  hold("COFFEE", "coffee_hold", 0.25, { mug: "hand" });                   // levanta: a caneca passa para a mão
  hold("COFFEE", "coffee_return", 0.2, { mug: "hand" });
  hold("COFFEE", "coffee_drink", 0.3, { mug: "hand" });
  hold("COFFEE", "coffee_drink", 0.8, { seq: [1, 1, 0, 1, 1], fps: 6, loop: false, mug: "hand" });   // bebe e baixa um instante
  hold("COFFEE", "coffee_drink", 0.25, { mug: "hand" });
  hold("COFFEE", "coffee_return", 0.25, { mug: "hand" });
  hold("COFFEE", "coffee_hold", 0.2, { mug: "hand" });
  hold("COFFEE", "coffee_reach", 0.25, { seq: [1] });                     // devolve na mesma posição
  hold("COFFEE", "coffee_reach", 0.2);
  hold("COFFEE", "seated_idle", 0.3, { seq: [0], fps: 2 });
  // programa (~10 s)
  hold("TYPE_C", "typing", 2.6, { seq: TYPE, fps: 6 });
  hold("TYPE_C", "seated_idle", 0.4, { seq: [0, 1, 0], fps: 4 });
  hold("TYPE_C", "typing", 2.4, { seq: TYPE, fps: 7 });
  hold("TYPE_C", "typing_down", 1.0, { seq: [0, 1], fps: 5 });
  hold("TYPE_C", "typing", 2.0, { seq: TYPE, fps: 6 });
  hold("TYPE_C", "seated_idle", 0.4, { seq: [0, 2, 0], fps: 4 });
  hold("TYPE_C", "typing", 1.2, { seq: TYPE, fps: 6 });
  // coça a cabeça: para de digitar e olha o monitor ("não funcionou…"), coça, volta a olhar e retoma (o loop recomeça digitando)
  hold("SCRATCH", "seated_idle", 0.45, { seq: [0], fps: 2 });
  hold("SCRATCH", "seated_idle", 0.3, { seq: [1, 0], fps: 4 });
  hold("SCRATCH", "scratch_head", 0.2, { seq: [0], fps: 2 });             // a mão sobe
  hold("SCRATCH", "scratch_head", 0.22, { seq: [1], fps: 2 });
  hold("SCRATCH", "scratch_head", 1.0, { seq: [1, 2, 1, 2, 1], fps: 5 });
  hold("SCRATCH", "scratch_head", 0.2, { seq: [0], fps: 2 });             // a mão desce
  hold("SCRATCH", "seated_idle", 0.35, { seq: [0], fps: 2 });             // olha o monitor de novo
  for (i = 0; i < STEPS.length; i++) { STEPS[i].t0 = T; T += STEPS[i].d; }
  var LOOP = STEPS, TL = T;
  STEPS = INTRO; T = TI;
  // [entra, sai] de cada fala (s, no relógio absoluto: só na intro): 1ª de frente para o visitante; 2ª ao ir para a mesa e sentar
  function stepAt(id, last) { var r = null; for (var q = 0; q < INTRO.length; q++) if (INTRO[q].id === id) { r = INTRO[q]; if (!last) break; } return r; }
  var TALK = [[stepAt("INTRO_THUMBS").t0 + 0.5, stepAt("INTRO_TEXT", true).t0 + 0.4],
    [stepAt("WALK_TO_DESK").t0 + 0.2, stepAt("SIT", true).t0 + 0.9]];

  /* ---------------------------------------------------------------- estado */
  var state = { running: false, visible: false, hidden: document.hidden, started: false, loaded: false, done: false };
  var bg, desk, mon, spr, canvas, ctx, cc, cctx, view = { x: 0, y: 0, w: W, h: H, scale: 2 };
  var raf = 0, last = 0, clock = 0, cursors = [0, 0];
  var actor = { x: E[0], y: E[1], anim: "walk_r", frame: 0, visible: true, mugInHand: false };

  // t = relógio absoluto desde o começo; depois da intro, o tempo dá voltas no LOOP (nunca termina)
  function sample(t) {
    var L = t < TI ? INTRO : LOOP, w = t < TI ? 0 : 1, tt = t < TI ? t : (t - TI) % TL, cursor = cursors[w];
    while (cursor > 0 && L[cursor].t0 > tt) cursor--;
    while (cursor < L.length - 1 && L[cursor].t0 + L[cursor].d <= tt) cursor++;
    cursors[w] = cursor;
    var s = L[cursor], lt = Math.max(0, tt - s.t0);
    actor.anim = s.anim;
    actor.mugInHand = s.mug === "hand";
    if (s.walk) {
      var k = Math.min(s.n, Math.floor(lt * s.fps)), a = s.walk[0], b = s.walk[1];
      actor.x = Math.round(a[0] + (b[0] - a[0]) * k / s.n);
      actor.y = Math.round(a[1] + (b[1] - a[1]) * k / s.n);
      actor.frame = (s.phase + k) % 8;
    } else {
      var fi = Math.floor(lt * s.fps), n = s.seq.length;
      actor.frame = s.seq[s.loop ? fi % n : Math.min(n - 1, fi)];
    }
    actor.visible = true;
  }

  /* ---------------------------------------------------------------- desenho */
  function cell(name, i) {
    var k = DATA.frames[name][0] + i;
    return [(k % DATA.cols) * CW, Math.floor(k / DATA.cols) * CH];
  }

  function drawMug(t) {
    var mx = MUG[0], my = MUG[1];
    ctx.fillStyle = "#070a16"; ctx.fillRect(mx - 1, my - 1, 6, 7); ctx.fillRect(mx - 2, my + 1, 1, 3);
    ctx.fillStyle = "#f5f0e4"; ctx.fillRect(mx, my, 4, 5); ctx.fillStyle = "#2f8f6a"; ctx.fillRect(mx, my + 2, 4, 2); ctx.fillStyle = "#1f6a50"; ctx.fillRect(mx, my + 3, 2, 1);
    ctx.fillStyle = "#4e3423"; ctx.fillRect(mx, my, 2, 1); ctx.fillStyle = "#f5f0e4"; ctx.fillRect(mx - 2, my + 2, 1, 1);
    for (var s = 0; s < 2; s++) {   // vapor bem leve
      var p = (t * 0.45 + s / 2) % 1;
      ctx.fillStyle = "rgba(245,240,228," + (0.35 * (1 - p)).toFixed(3) + ")";
      ctx.fillRect(mx + 1 + Math.round(Math.sin(t * 2 + s * 3)), my - 2 - Math.round(p * 7), 1, 1);
    }
  }

  function draw(t) {
    ctx.clearRect(0, 0, view.w, view.h);
    ctx.save();
    ctx.translate(-view.x, -view.y);
    ctx.drawImage(bg, 0, 0);
    // estrelas piscando na janela
    ctx.fillStyle = "rgba(255,255,255," + (0.3 + 0.3 * Math.sin(t * 1.6)).toFixed(3) + ")"; ctx.fillRect(24, 33, 1, 1); ctx.fillRect(45, 27, 1, 1);
    ctx.fillStyle = "rgba(255,255,255," + (0.3 + 0.3 * Math.sin(t * 1.2 + 2)).toFixed(3) + ")"; ctx.fillRect(17, 31, 1, 1); ctx.fillRect(40, 36, 1, 1);

    var on = actor.visible, seated = on && SEATED[actor.anim];
    var ox = actor.x - AX, oy = actor.y - AY, c = on ? cell(actor.anim, actor.frame) : null;
    if (on) {
      // sombra no chão (fica escondida pela mesa quando ele está atrás dela)
      ctx.fillStyle = "rgba(0,0,0,0.28)"; ctx.fillRect(actor.x - 8, actor.y, 17, 1);
      ctx.fillStyle = "rgba(0,0,0,0.14)"; ctx.fillRect(actor.x - 11, actor.y + 1, 23, 1);
      ctx.drawImage(spr, c[0], c[1], CW, CH, ox, oy, CW, CH);   // sem foco de luz no rosto: só a iluminação global da cena
    }
    ctx.drawImage(desk, 0, 0);
    if (!(on && actor.mugInHand)) drawMug(t);                                          // na mão, ela está no sprite
    if (on) ctx.drawImage(spr, c[0], c[1] + DATA.rows * CH, CW, CH, ox, oy, CW, CH);   // braços sobre a mesa
    ctx.drawImage(mon, 0, 0);                                                          // monitores: na frente do teclado e das mãos
    // borda das telas acesa (viradas para ele): só um filete, mais vivo enquanto digita
    var lit = seated ? (actor.anim === "typing" ? 0.85 + 0.15 * Math.sin(t * 13) : 0.75) : 0.45;
    for (var m = 0; m < MONS.length; m++) {
      ctx.fillStyle = "rgba(99,179,255," + (lit * (m ? 0.8 : 1)).toFixed(3) + ")"; ctx.fillRect(MONS[m][0], MONS[m][1] + 2, 1, MONS[m][2]);
    }
    ctx.restore();
    for (var k = 0; k < hellos.length; k++) hellos[k].classList.toggle("is-on", !!TALK[k] && t >= TALK[k][0] && t < TALK[k][1]);   // falas (HTML)
  }

  function update(dt) {
    clock += dt;
    sample(clock);
  }

  /* ---------------------------------------------------------------- laço (~25 fps; pausa fora da tela / aba oculta) */
  // 25 fps sem acordar o navegador a cada vsync: espera o próximo quadro com setTimeout e só então pede um rAF
  // (em telas de 120–240 Hz um rAF contínuo forçava o recálculo de todas as animações CSS da página a cada vsync).
  // Celular/toque: rAF contínuo (60–120 Hz; lá o despertar por timer perdia metade dos quadros com CPU lenta).
  var tmr = 0, useTimer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  function frame(now) {
    raf = 0;
    if (!state.running) return;
    if (now - last >= 40) {
      var dt = Math.min(0.1, (now - last) / 1000);
      last = now; update(dt); draw(clock);
      if (useTimer) { schedule(); return; }
    }
    raf = requestAnimationFrame(frame);
  }
  function schedule() {
    var wait = Math.max(0, 40 - (performance.now() - last) - 12);
    tmr = setTimeout(function () { tmr = 0; if (state.running && !raf) raf = requestAnimationFrame(frame); }, wait);
  }
  function stopLoop() {
    if (raf) { cancelAnimationFrame(raf); raf = 0; }
    if (tmr) { clearTimeout(tmr); tmr = 0; }
  }
  function sync() {
    var should = state.loaded && state.visible && !state.hidden && !state.done;
    if (should && !state.running) { state.running = true; last = performance.now(); if (!state.started) { state.started = true; showCanvas(); } if (!raf && !tmr) raf = requestAnimationFrame(frame); }
    else if (!should && state.running) { state.running = false; stopLoop(); }
  }

  /* ---------------------------------------------------------------- layout: câmera fixa (cena inteira; recorte fixo no celular) */
  function layout() {
    var cw = root.parentElement ? root.parentElement.clientWidth : 480;
    var crop = cw < 480 ? DATA.crop : null;
    var vw = crop ? crop.w : W, vh = crop ? crop.h : H;
    var scale = Math.max(1, Math.min(2, Math.floor(cw / vw)));
    view.x = crop ? crop.x : 0; view.y = crop ? crop.y : 0; view.w = vw; view.h = vh; view.scale = scale;
    root.style.setProperty("--hs-w", vw * scale + "px");
    root.style.setProperty("--hs-h", vh * scale + "px");
    root.style.setProperty("--hs-ox", -view.x * scale + "px");
    root.style.setProperty("--hs-oy", -view.y * scale + "px");
    root.style.setProperty("--hs-pw", W * scale + "px");
    var hp = crop ? DATA.helloCrop : DATA.hello;
    root.style.setProperty("--hs-hx", (hp[0] - view.x) * scale + "px");
    root.style.setProperty("--hs-hy", (hp[1] - view.y) * scale + "px");
    root.classList.toggle("is-crop", !!crop);
    if (canvas) { canvas.width = vw; canvas.height = vh; ctx.imageSmoothingEnabled = false; if (state.started) draw(clock); }
  }

  function showCanvas() {
    canvas.className = "hs-canvas";
    stage.insertBefore(canvas, hellos[0] || null);
    sample(0); draw(0);
    root.classList.add("is-live");
  }

  /* ---------------------------------------------------------------- carga (depois do load; só perto da viewport) */
  function load() {
    var n = 0;
    function done() {
      if (++n < 4) return;
      canvas = document.createElement("canvas"); canvas.setAttribute("aria-hidden", "true");
      ctx = canvas.getContext("2d");
      cc = document.createElement("canvas"); cc.width = CW; cc.height = CH; cctx = cc.getContext("2d");
      state.loaded = true; layout(); sync();
    }
    bg = new Image(); bg.onload = done; bg.src = BASE + "scene.png";
    desk = new Image(); desk.onload = done; desk.src = BASE + "desk.png";
    mon = new Image(); mon.onload = done; mon.src = BASE + "monitors.png";
    spr = new Image(); spr.onload = done; spr.src = BASE + "sprites.png";
  }

  var booted = false;
  function boot() { if (booted) return; booted = true; load(); }
  function init() {
    layout();
    if ("IntersectionObserver" in window) {
      var io = new IntersectionObserver(function (es) {
        state.visible = es[0].isIntersecting;
        if (state.visible) boot();
        sync();
      });
      io.observe(root);
    } else { state.visible = true; boot(); }
    document.addEventListener("visibilitychange", function () { state.hidden = document.hidden; sync(); });
    window.addEventListener("resize", layout);
    if (mql.addEventListener) mql.addEventListener("change", function (e) {
      if (!e.matches) return;
      state.running = false; state.done = true; stopLoop();
      if (canvas && canvas.parentNode) canvas.parentNode.removeChild(canvas);
      root.classList.remove("is-live"); for (var k = 0; k < hellos.length; k++) hellos[k].classList.remove("is-on");
      if (poster) poster.src = poster.getAttribute("data-final");
    });
  }
  if (document.readyState === "complete") init(); else window.addEventListener("load", init);
  root.__heroScene = { duration: TI, intro: TI, loop: TL, steps: INTRO, loopSteps: LOOP, time: function () { return clock; } };   // leitura (QA/gravação)
})();
