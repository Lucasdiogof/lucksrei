"use strict";
/* Componentes reutilizáveis: ícones, código de barras, produtos 3D (cuboides CSS), átomos de interface. */
const KIT = window.KIT = {};

/* ───── ícones (24×24, traço) ───── */
const ICONS = {
  package: '<path d="M12 2.5l8.5 4.8v9.4L12 21.5l-8.5-4.8V7.3z"/><path d="M3.5 7.3L12 12l8.5-4.7M12 12v9.5"/>',
  cart: '<circle cx="9" cy="20" r="1.5"/><circle cx="18" cy="20" r="1.5"/><path d="M2 3h3l2.5 12h11l2-8H6"/>',
  cash: '<rect x="2" y="6" width="20" height="12" rx="2.2"/><circle cx="12" cy="12" r="2.7"/><path d="M6 12h.01M18 12h.01"/>',
  wallet: '<rect x="2.5" y="6" width="19" height="13" rx="2.5"/><path d="M2.5 10h19"/><circle cx="17" cy="14.5" r="1.3"/>',
  users: '<circle cx="9" cy="8" r="3.4"/><path d="M2.5 20c0-3.6 2.9-6 6.5-6s6.5 2.4 6.5 6"/><circle cx="17.5" cy="9" r="2.5"/><path d="M17 14c2.8 0 4.5 1.8 4.5 4.5"/>',
  user: '<circle cx="12" cy="8" r="4"/><path d="M4 21c0-4 3.6-6.5 8-6.5s8 2.5 8 6.5"/>',
  truck: '<path d="M2 6h11v10H2zM13 9h4.2L21 12.8V16h-8z"/><circle cx="6.5" cy="18" r="2"/><circle cx="17" cy="18" r="2"/>',
  bars: '<path d="M5 20V11M11 20V4M17 20v-7M2.5 20h19"/>',
  trend: '<path d="M3 17l6-6 4 4 8-9"/><path d="M15 6h6v6"/>',
  pdf: '<path d="M14 2.5H6.5a2 2 0 00-2 2v15a2 2 0 002 2h11a2 2 0 002-2V8z"/><path d="M14 2.5V8h5.5M8 13h8M8 17h8M8 9h2"/>',
  table: '<rect x="3" y="4" width="18" height="16" rx="2.2"/><path d="M3 9.5h18M3 14.7h18M9 4v16"/>',
  phone: '<rect x="6.8" y="2" width="10.4" height="20" rx="2.6"/><path d="M10.5 18.5h3"/>',
  browser: '<rect x="2" y="4" width="20" height="16" rx="2.6"/><path d="M2 9h20M5.5 6.5h.01M8 6.5h.01"/>',
  shield: '<path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z"/><path d="M8.5 12l2.5 2.5L15.5 10"/>',
  lock: '<rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V8a4 4 0 018 0v3"/>',
  search: '<circle cx="11" cy="11" r="6.5"/><path d="M16 16l5 5"/>',
  check: '<path d="M4 12.5l5 5L20 6.5"/>',
  alert: '<path d="M12 3.5l9.5 16.5h-19z"/><path d="M12 10v4.5M12 17.5v.01"/>',
  scan: '<path d="M3 8V5.5A2.5 2.5 0 015.5 3H8M16 3h2.5A2.5 2.5 0 0121 5.5V8M21 16v2.5a2.5 2.5 0 01-2.5 2.5H16M8 21H5.5A2.5 2.5 0 013 18.5V16M7 12h10"/>',
  receipt: '<path d="M5.5 3h13v18l-2.7-1.8L13.1 21l-2.1-1.8L8.2 21 5.5 19.2z"/><path d="M9 8h6M9 12h6"/>',
  arrow: '<path d="M4 12h15M13 6l6 6-6 6"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  minus: '<path d="M5 12h14"/>',
  tag: '<path d="M3 12V4a1 1 0 011-1h8l9 9-9 9z"/><circle cx="8" cy="8" r="1.3"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5.2l3.2 2"/>',
  building: '<path d="M4.5 21V5.5L12 3l7.5 2.5V21M2.5 21h19M9 9h1.5M13.5 9H15M9 13h1.5M13.5 13H15M10 21v-4h4v4"/>',
  layers: '<path d="M12 3l9 5-9 5-9-5z"/><path d="M3 13l9 5 9-5"/>',
  down: '<path d="M12 4v12M6 11l6 6 6-6M5 20h14"/>',
  up: '<path d="M12 20V8M6 13l6-6 6 6"/>',
  globe: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c3 3 3 15 0 18M12 3c-3 3-3 15 0 18"/>',
  eye: '<path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>',
  pix: '<path d="M7 7l5 5-5 5M17 7l-5 5 5 5"/>',
  card: '<rect x="2.5" y="5" width="19" height="14" rx="2.4"/><path d="M2.5 10h19M6 15h4"/>',
};
KIT.ico = (n, size = 24, color = "currentColor", sw = 1.8) => `<svg class="ic" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="${sw}" stroke-linecap="round" stroke-linejoin="round">${ICONS[n]}</svg>`;

/* ───── código de barras determinístico ───── */
KIT.barcode = (w, h, seed = 1, color = "#0F172A", digits) => {
  const r = rng(seed * 7919 + 3); let x = 0, out = "", n = 0;
  while (x < w - 3) { const bw = [1, 1, 2, 3][Math.floor(r() * 4)] * (w / 110), gap = [1, 2, 2, 3][Math.floor(r() * 4)] * (w / 110); if (n % 1 === 0) out += `<rect x="${x.toFixed(2)}" y="0" width="${bw.toFixed(2)}" height="${h}" fill="${color}"/>`; x += bw + gap; n++; }
  return `<svg width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">${out}</svg>`;
};

/* ───── cores ───── */
KIT.shade = (hex, k) => { // k>0 clareia, k<0 escurece
  const n = parseInt(hex.slice(1), 16); let r = n >> 16, g = (n >> 8) & 255, b = n & 255;
  const f = v => Math.round(k >= 0 ? v + (255 - v) * k : v * (1 + k)); return `rgb(${f(r)},${f(g)},${f(b)})`;
};

/* ───── cuboide CSS 3D: origem no centro da base; y cresce para baixo (altura = -y) ───── */
KIT.cuboid = (w, h, d, f = {}) => {
  const e = document.createElement("div"); e.className = "cb p3"; e.style.cssText = `position:absolute;left:0;top:0;width:${w}px;height:${h}px;transform-style:preserve-3d`;
  const face = (cls, wd, ht, left, top, tr, bg, html) => `<div class="fc ${cls}" style="position:absolute;width:${wd}px;height:${ht}px;left:${left}px;top:${top}px;transform:${tr};background:${bg};backface-visibility:hidden;overflow:hidden">${html || ""}</div>`;
  e.innerHTML =
    face("f", w, h, 0, 0, `translateZ(${d / 2}px)`, f.front || "#2a4a8a", f.frontHTML) +
    face("b", w, h, 0, 0, `rotateY(180deg) translateZ(${d / 2}px)`, f.back || f.left || "#16305f", f.backHTML) +
    face("r", d, h, (w - d) / 2, 0, `rotateY(90deg) translateZ(${w / 2}px)`, f.right || "#1b3a73", f.rightHTML) +
    face("l", d, h, (w - d) / 2, 0, `rotateY(-90deg) translateZ(${w / 2}px)`, f.left || "#16305f", f.leftHTML) +
    face("t", w, d, 0, (h - d) / 2, `rotateX(90deg) translateZ(${h / 2}px)`, f.top || "#5a86d6", f.topHTML) +
    face("m", w, d, 0, (h - d) / 2, `rotateX(-90deg) translateZ(${h / 2}px)`, f.bottom || "#0c1d40", "");
  e._w = w; e._h = h; return e;
};

/* ───── produtos (fictícios, demonstrativos) ───── */
KIT.PRODUCTS = {
  cafe: { id: "cafe", name: "Café Torrado 500 g", cat: "Mercearia", code: "7891234500017", seed: 11, w: 96, h: 150, d: 62, base: "#2B3F72", accent: "#FBBF24" },
  agua: { id: "agua", name: "Água Mineral 1,5 L", cat: "Bebidas", code: "7891234500024", seed: 22, w: 150, h: 96, d: 100, base: "#3B82C4", accent: "#E0F2FE" },
  caderno: { id: "caderno", name: "Caderno 96 folhas", cat: "Papelaria", code: "7891234500031", seed: 33, w: 104, h: 130, d: 22, base: "#F1F5FC", accent: "#2563EB" },
  sabao: { id: "sabao", name: "Sabão em Pó 1 kg", cat: "Limpeza", code: "7891234500048", seed: 44, w: 104, h: 130, d: 56, base: "#1E6CFF", accent: "#FFFFFF" },
};
/* preço (centavos), categoria, mínimo e saldo vêm da base comum (data.js) */
for (const id in KIT.PRODUCTS) { const d = DATA.P[id]; Object.assign(KIT.PRODUCTS[id], { name: d.name, cat: d.cat, price: d.price, min: d.min, code: d.code, qty: DATA.stockAfter(id, DATA.ENTRY_IDX) }); }
/* arte de cada face — vetorial, sem marcas reais */
KIT.productFaces = (p, o = {}) => {
  const S = KIT.shade, b = p.base, a = p.accent;
  const lbl = (t, sz, col, ls = ".08em", w = 700) => `<div style="font:${w} ${sz}px/1 'SP Roboto';letter-spacing:${ls};color:${col};white-space:nowrap">${t}</div>`;
  const center = (inner, bg, extra = "") => `<div style="position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:8px;${bg ? "background:" + bg + ";" : ""}${extra}">${inner}</div>`;
  const shineF = "linear-gradient(115deg,rgba(255,255,255,.20) 0%,rgba(255,255,255,0) 38%)";
  let front, right, top, left;
  if (p.id === "cafe") {
    front = `background:linear-gradient(180deg,${S(b, .08)},${S(b, -.25)})`;
    var fh = center(lbl("CAFÉ", 30, "#fff", ".1em") + `<div style="width:56px;height:3px;background:${a};border-radius:2px"></div>` + lbl("TORRADO", 13, a, ".26em", 500) + `<div style="margin-top:10px">${KIT.ico("package", 28, a, 1.4)}</div>`, shineF);
  } else if (p.id === "agua") {
    front = `background:linear-gradient(180deg,${S(b, .12)},${S(b, -.15)})`;
    var fh = center(`<svg width="86" height="38" viewBox="0 0 86 38" fill="none" stroke="${a}" stroke-width="3" stroke-linecap="round"><path d="M4 12c10-8 14 8 24 0s14 8 24 0 14 8 24 0"/><path d="M4 28c10-8 14 8 24 0s14 8 24 0 14 8 24 0" opacity=".6"/></svg>` + lbl("ÁGUA", 22, "#fff", ".16em") + lbl("MINERAL 1,5 L", 11, a, ".18em", 500), shineF);
  } else if (p.id === "caderno") {
    front = `background:linear-gradient(180deg,#FFFFFF,${S(b, -.06)})`;
    var fh = center(`<div style="width:78%;height:46%;border-radius:6px;background:${a};display:flex;align-items:center;justify-content:center">${lbl("96", 34, "#fff", ".02em")}</div>` + lbl("CADERNO", 15, "#0F2A66", ".2em"), "") +
      `<div style="position:absolute;left:8px;top:8px;bottom:8px;width:6px;display:flex;flex-direction:column;justify-content:space-between">${"<i style='display:block;height:6px;border-radius:3px;background:#94A3B8'></i>".repeat(9)}</div>`;
  } else {
    front = `background:linear-gradient(180deg,${S(b, .1)},${S(b, -.22)})`;
    var fh = center(`<div style="width:70%;height:34%;border-radius:8px;background:#fff;display:flex;align-items:center;justify-content:center">${lbl("SABÃO", 17, "#0A3D91", ".1em")}</div>` + lbl("EM PÓ · 1 KG", 11, "#fff", ".2em", 500) + KIT.ico("layers", 22, "#fff", 1.5), shineF);
  }
  const bgOf = s => s.replace("background:", "");
  return {
    front: bgOf(front), frontHTML: fh,
    right: `linear-gradient(180deg,${S(b, -.28)},${S(b, -.5)})`, rightHTML: `<div style="position:absolute;inset:0;background:linear-gradient(90deg,rgba(0,0,0,.18),rgba(255,255,255,.04))"></div>`,
    left: `linear-gradient(180deg,${S(b, -.18)},${S(b, -.42)})`,
    top: `linear-gradient(135deg,${S(b, .42)},${S(b, .18)})`,
  };
};
KIT.product = (id, scale = 1) => { const p = KIT.PRODUCTS[id]; const e = KIT.cuboid(p.w, p.h, p.d, KIT.productFaces(p)); e.dataset.pid = id; return e; };

/* mini produto: cubo 3D com rotação fixa, em tamanho pequeno para cards (renderiza como imagem viva) */
KIT.productThumb = (id, size = 120) => {
  const p = KIT.PRODUCTS[id], k = size / Math.max(p.w, p.h) * .78;
  const wrap = document.createElement("div"); wrap.style.cssText = `position:relative;width:${size}px;height:${size}px;perspective:900px`;
  const stage = document.createElement("div"); stage.style.cssText = `position:absolute;left:50%;top:50%;width:0;height:0;transform-style:preserve-3d;transform:translateY(${p.h * k * .5}px) rotateX(-18deg) rotateY(-32deg) scale(${k})`;
  const c = KIT.product(id); c.style.left = -p.w / 2 + "px"; c.style.top = -p.h + "px"; stage.appendChild(c); wrap.appendChild(stage); return wrap;
};

/* ───── átomos de interface ───── */
KIT.logoMini = () => `<svg width="30" height="30" viewBox="60 40 820 920">${KIT.markInner || ""}</svg>`;
KIT.avatar = (ini, col = "#2563EB", s = 44) => `<div style="width:${s}px;height:${s}px;border-radius:50%;background:linear-gradient(180deg,${KIT.shade(col, .15)},${KIT.shade(col, -.25)});display:flex;align-items:center;justify-content:center;font:600 ${s * .38}px 'SP Roboto';color:#fff;flex:none;border:1px solid rgba(255,255,255,.18)">${ini}</div>`;
KIT.sparkline = (w, hh, vals, col = "#60A5FA", fill = true, sw = 3) => {
  const mx = Math.max(...vals), mn = Math.min(...vals), pts = vals.map((v, i) => [i / (vals.length - 1) * w, hh - 6 - (v - mn) / (mx - mn || 1) * (hh - 12)]);
  const d = pts.map((p, i) => (i ? "L" : "M") + p[0].toFixed(1) + " " + p[1].toFixed(1)).join("");
  return `<svg width="${w}" height="${hh}" viewBox="0 0 ${w} ${hh}">${fill ? `<path d="${d}L${w} ${hh}L0 ${hh}Z" fill="${col}" opacity=".14"/>` : ""}<path d="${d}" fill="none" stroke="${col}" stroke-width="${sw}" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
};

/* caixa de estoque (fardo) com a cor do produto e etiqueta frontal */
KIT.caseBox = (id, w = 120, h = 92, d = 110) => {
  const p = KIT.PRODUCTS[id], S = KIT.shade, b = id === "caderno" ? "#C9D6EE" : p.base;
  const dark = id === "caderno";
  const f = `<div style="position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:6px;background:linear-gradient(115deg,rgba(255,255,255,.16),rgba(255,255,255,0) 45%)">
    <div style="font:700 15px 'SP Roboto';letter-spacing:.16em;color:${dark ? "#0F2A66" : "#fff"}">${p.name.split(" ")[0].toUpperCase()}</div>
    <div style="width:${w * .62}px;height:16px;background:#fff;border-radius:3px;display:flex;align-items:center;justify-content:center;padding:2px 4px">${KIT.barcode(w * .55, 12, p.seed, "#0F172A")}</div></div>`;
  return KIT.cuboid(w, h, d, { front: `linear-gradient(180deg,${S(b, .06)},${S(b, -.2)})`, frontHTML: f, right: `linear-gradient(180deg,${S(b, -.3)},${S(b, -.5)})`, left: S(b, -.4), top: `linear-gradient(135deg,${S(b, .35)},${S(b, .12)})` });
};
