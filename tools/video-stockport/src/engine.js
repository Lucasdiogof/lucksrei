"use strict";
/* StockPort System — motor do filme.
   Tudo é função pura do tempo: window.render(t) desenha o quadro t (segundos). Nada de Math.random()/Date. */
const SP = window.SP = { scenes: {}, fmts: {}, assets: {} };
const qs = new URLSearchParams(location.search);
SP.fmtName = ["wide", "sq", "tall"].includes(qs.get("fmt")) ? qs.get("fmt") : "wide";
SP.renderMode = qs.has("render");

/* ───── matemática, easings, PRNG ───── */
const cl = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const P = (t, a, b) => cl((t - a) / (b - a));             // progresso 0..1 de t entre a e b
const lerp = (a, b, x) => a + (b - a) * x;
const mix = (a, b, x) => a + (b - a) * x;
const RAD = Math.PI / 180;
const E = {
  lin: x => x,
  in2: x => x * x, in3: x => x * x * x,
  out2: x => 1 - (1 - x) * (1 - x), out3: x => 1 - Math.pow(1 - x, 3), out4: x => 1 - Math.pow(1 - x, 4), out5: x => 1 - Math.pow(1 - x, 5),
  io2: x => x * x * (3 - 2 * x),
  io3: x => x < .5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2,
  io5: x => x < .5 ? 16 * x ** 5 : 1 - Math.pow(-2 * x + 2, 5) / 2,
  expo: x => x >= 1 ? 1 : 1 - Math.pow(2, -10 * x),
  back: x => { const c = 1.45; return 1 + (c + 1) * Math.pow(x - 1, 3) + c * Math.pow(x - 1, 2); }
};
/* mola amortecida: x em segundos desde o disparo */
function spr(x, w = 12, z = .62) { if (x <= 0) return 0; const k = Math.sqrt(1 - z * z); return 1 - Math.exp(-z * w * x) * (Math.cos(w * k * x) + z / k * Math.sin(w * k * x)); }
function rng(seed) { let a = seed >>> 0; return () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
/* interpolação por keyframes [[t,v],...] com easing opcional */
function kf(t, keys, ease = E.io3) {
  if (t <= keys[0][0]) return keys[0][1];
  for (let i = 1; i < keys.length; i++) if (t <= keys[i][0]) { const a = keys[i - 1], b = keys[i]; return lerp(a[1], b[1], ease(P(t, a[0], b[0]))); }
  return keys[keys.length - 1][1];
}
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
function h(html) { const d = document.createElement("div"); d.innerHTML = html.trim(); return d.firstElementChild; }
const brl = c => DATA.brl(c);   // dinheiro sempre em centavos inteiros (data.js)
const num = (v, dec = 0) => v.toLocaleString("pt-BR", { minimumFractionDigits: dec, maximumFractionDigits: dec });

/* ───── formato ativo ───── */
const FMT = {
  wide: { W: 1920, H: 1080, name: "16:9" },
  sq: { W: 1080, H: 1080, name: "1:1" },
  tall: { W: 1080, H: 1920, name: "9:16" },
}[SP.fmtName];
const FN = SP.fmtName;
const pick = o => o[FN];                                  // pick({wide:…, sq:…, tall:…})

/* ───── escrita de estilo com cache (evita trabalho redundante por quadro) ───── */
function setT(el, v) { if (el._t !== v) { el.textContent = v; el._t = v; } }
function setS(el, k, v) { const c = el._s || (el._s = {}); if (c[k] !== v) { el.style[k] = v; c[k] = v; } }
function show(el, on) { if (el._on !== on) { el.style.display = on ? "" : "none"; el._on = on; } }
function setV(el, k, v) { const c = el._v || (el._v = {}); if (c[k] !== v) { el.style.setProperty(k, v); c[k] = v; } }

/* pose de um bloco: x,y = centro (px do palco); s escala; rx,ry,rz graus; z px; o opacidade; b blur px */
function put(el, p) {
  const o = p.o === undefined ? 1 : p.o;
  if (o <= .004) { show(el, false); return; }
  show(el, true);
  const w = el._w || (el._w = el.offsetWidth || parseFloat(el.getAttribute("width")) || 0), hh = el._h || (el._h = el.offsetHeight || parseFloat(el.getAttribute("height")) || 0);
  const s = p.s === undefined ? 1 : p.s;
  const tr = `translate3d(${((p.x || 0) - w / 2).toFixed(2)}px,${((p.y || 0) - hh / 2).toFixed(2)}px,${(p.z || 0).toFixed(2)}px) rotateX(${(p.rx || 0).toFixed(3)}deg) rotateY(${(p.ry || 0).toFixed(3)}deg) rotateZ(${(p.rz || 0).toFixed(3)}deg) scale(${(s * (p.sx || 1)).toFixed(4)},${(s * (p.sy || 1)).toFixed(4)})`;
  setS(el, "transform", tr);
  setS(el, "opacity", o >= .999 ? "" : o.toFixed(3));
  setS(el, "filter", p.b > .2 ? `blur(${p.b.toFixed(1)}px)` : "");
}

/* ───── texto cinematográfico ─────
   hl(["linha 1","linha 2"], cls) cria <div class="hl"> com uma máscara por palavra. */
function hl(lines, cls = "", opts = {}) {
  const e = document.createElement("div"); e.className = "hl blk " + cls; e._words = [];
  lines.forEach((ln, li) => {
    const row = document.createElement("div"); row.className = "hr" + (opts.accent === li ? " ac" : "") + (opts.dim === li ? " dm" : "");
    ln.split(" ").forEach((w, wi, arr) => {
      const m = document.createElement("span"); m.className = "hw"; const i = document.createElement("i"); i.textContent = w; m.appendChild(i);
      row.appendChild(m); if (wi < arr.length - 1) row.appendChild(document.createTextNode(" ")); e._words.push({ m, i, line: li });
    });
    e.appendChild(row);
  });
  return e;
}
/* revela/esconde as palavras: entra em tIn, sai em tOut (undefined = fica) */
function hlAt(e, t, tIn, tOut, o = {}) {
  const st = o.st === undefined ? .09 : o.st, d = o.d || 1.0, dOut = o.dOut || .55, dy = o.dy === undefined ? 108 : o.dy;
  let any = false;
  e._words.forEach((w, k) => {
    const x = P(t, tIn + k * st, tIn + k * st + d), ei = E.out5(x);
    let a = cl(x * 2.4), y = (1 - ei) * dy, b = (1 - cl(x * 1.8)) * 10;
    if (tOut !== undefined) { const xo = P(t, tOut + k * .03, tOut + k * .03 + dOut), eo = E.in2(xo); a *= 1 - cl(xo * 1.25); y -= eo * 26; b += xo * 8; }
    if (a > .004) any = true;
    setS(w.i, "transform", a <= .004 ? "translateY(110%)" : `translateY(${y.toFixed(2)}%)`);
    setS(w.i, "opacity", a >= .999 ? "" : a.toFixed(3));
    setS(w.i, "filter", b > .3 ? `blur(${b.toFixed(1)}px)` : "");
  });
  return any;
}

/* contador animado: de a para b, com tabulares */
function counter(el, t, t0, t1, a, b, dec = 0, pre = "", suf = "", ease = E.out4) {
  const v = lerp(a, b, ease(P(t, t0, t1))); setT(el, pre + num(v, dec) + suf);
}

/* ───── registro de cenas e linha do tempo por formato ─────
   cada cena: SP.scenes[id] = { D, build(root), render(lt, g) } ; g = fator global de opacidade 0..1 */
SP.timeline = {};   // preenchido por timeline.js
SP.active = [];

SP.build = function (cam) {
  SP.cam = cam;
  const tl = SP.timeline[FN];
  SP.segs = tl.map(seg => {
    const sc = SP.scenes[seg.id]; const root = document.createElement("section"); root.className = "scene sc-" + seg.id; root.style.display = "none";
    cam.appendChild(root); sc.root = root; sc.fmt = FN; sc.build(root, FMT);
    return Object.assign({ sc }, seg);
  });
  SP.DURATION = Math.max(...SP.segs.map(s => s.t1));
};

/* monta mapa formato→mestre (keyframes lineares, monótono) */
function warp(map, ft) {
  if (!map) return ft;
  if (ft <= map[0][0]) return map[0][1] + (ft - map[0][0]);
  for (let i = 1; i < map.length; i++) if (ft <= map[i][0]) { const a = map[i - 1], b = map[i]; return lerp(a[1], b[1], (ft - a[0]) / (b[0] - a[0])); }
  const l = map[map.length - 1]; return l[1] + (ft - l[0]);
}
SP.warp = warp;

window.render = function (t) {
  t = Math.max(0, Math.min(SP.DURATION, t));
  SP.t = t;
  SP.bg && SP.bg.render(t);
  for (const s of SP.segs) {
    const on = t >= s.t0 - 1e-6 && t <= s.t1 + 1e-6;
    show(s.sc.root, on);
    if (!on) continue;
    const ft = t - s.t0, lt = warp(s.map, ft);
    s.sc.render(lt, 1, ft);
  }
  if (SP.onRender) SP.onRender(t);
};

/* rotação 3D na convenção do CSS ("rotateX(rx) rotateY(ry)", y para baixo, +z para a câmera) */
function rot3(x, y, z, rx, ry) {
  const a = ry * RAD, b = rx * RAD;
  const x1 = x * Math.cos(a) + z * Math.sin(a), z1 = -x * Math.sin(a) + z * Math.cos(a);
  return [x1, y * Math.cos(b) - z1 * Math.sin(b), y * Math.sin(b) + z1 * Math.cos(b)];
}
/* bloco-âncora 3D (tamanho zero) com um filho posicionado: base do produto no ponto de âncora */
function anchor(child, ox, oy) { const a = document.createElement("div"); a.className = "blk p3"; a.style.width = a.style.height = "0px"; a._w = a._h = 0.0001; child.style.left = ox + "px"; child.style.top = oy + "px"; a.appendChild(child); return a; }
SP.css = s => { const st = document.createElement("style"); st.textContent = s; document.head.appendChild(st); };
/* projeção de um ponto (px do palco + z) pela perspectiva de #cam (1800 px, origem no centro) */
function proj(x, y, z) { const k = 1800 / (1800 - z); return [FMT.W / 2 + (x - FMT.W / 2) * k, FMT.H / 2 + (y - FMT.H / 2) * k]; }
/* posiciona um filho estático dentro de um grupo 3D */
function at(el, x, y, z, extra = "") { el.style.transform = `translate3d(${x}px,${y}px,${z}px) ${extra}`; return el; }
/* tempo quantizado em 1/30 s para números que mudam a cada quadro: os dois subquadros misturados no export a 60→30 fps
   mostram o mesmo dígito (sem "fantasma" no contador) */
const qt = t => Math.floor(t * 30 + 1e-4) / 30;
