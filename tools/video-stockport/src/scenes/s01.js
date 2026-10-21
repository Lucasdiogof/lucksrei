"use strict";
/* Cena 1 — impacto da marca. Linhas de uma operação comercial (loja, prateleiras, balcão) desenhadas em isométrico,
   o monograma SP montado por camadas com profundidade real (cópias em Z), o wordmark revelado por máscara e o título. */
SP.scenes.s01 = (function () {
  const S = { D: 7.6 };
  let wire, wireG, glowG, mk, mkFront, mkDepth = [], mkSweep, wm, h1, sub, crown = [], body = [];
  /* segmentos isométricos (unidades de grade) → px */
  function isoPts(k, cx, cy) {
    const iso = (x, y, z) => [cx + (x - y) * .866 * k, cy + (x + y) * .5 * k - z * k];
    const segs = [];
    const box = (x, y, z, w, d, hh, dl) => { // arestas visíveis de um cuboide
      const p = (a, b, c) => iso(x + a, y + b, z + c);
      [[p(0, 0, 0), p(w, 0, 0)], [p(0, 0, 0), p(0, d, 0)], [p(w, 0, 0), p(w, d, 0)], [p(0, d, 0), p(w, d, 0)],
       [p(0, d, 0), p(0, d, hh)], [p(w, 0, 0), p(w, 0, hh)], [p(w, d, 0), p(w, d, hh)],
       [p(0, d, hh), p(w, d, hh)], [p(w, 0, hh), p(w, d, hh)], [p(0, 0, hh), p(w, 0, hh)], [p(0, 0, hh), p(0, d, hh)], [p(0, 0, 0), p(0, 0, hh)]]
        .forEach((s, i) => segs.push({ a: s[0], b: s[1], dl: dl + i * .012 }));
    };
    // piso: grade
    for (let i = -7; i <= 7; i++) { segs.push({ a: iso(i, -7, 0), b: iso(i, 7, 0), dl: .1 + Math.abs(i) * .02, floor: 1 }); segs.push({ a: iso(-7, i, 0), b: iso(7, i, 0), dl: .1 + Math.abs(i) * .02, floor: 1 }); }
    // loja: corpo, toldo, porta, vitrine
    box(-6, -6, 0, 5, 4, 3.2, .3); box(-6, -6.6, 2.4, 5, .6, .35, .55);
    segs.push({ a: iso(-4.2, -2, 0), b: iso(-4.2, -2, 2), dl: .6 }, { a: iso(-3.2, -2, 0), b: iso(-3.2, -2, 2), dl: .62 }, { a: iso(-4.2, -2, 2), b: iso(-3.2, -2, 2), dl: .64 });
    // prateleiras (3 módulos com níveis)
    [[1, -6], [3.2, -6], [5.4, -6]].forEach(([x, y], m) => { box(x, y, 0, 1.8, .8, 3, .45 + m * .08); for (let l = 1; l < 3; l++) segs.push({ a: iso(x, y + .8, l), b: iso(x + 1.8, y + .8, l), dl: .7 + m * .08 + l * .03 }); });
    // caixas empilhadas
    box(1.4, 1.2, 0, 1.2, 1.2, 1, .75); box(2.8, 1.2, 0, 1.2, 1.2, 1, .8); box(2.1, 1.4, 1, 1.2, 1.2, 1, .85);
    // balcão com terminal
    box(-5.5, 2, 0, 3, 1.2, 1.1, .7); box(-4.6, 2.2, 1.1, .9, .6, .55, .9);
    // carrinho / pallet
    box(4.6, 3.6, 0, 1.6, 1.6, .25, .9); box(4.8, 3.8, .25, 1.2, 1.2, .9, .95);
    return segs;
  }
  S.build = function (root) {
    const W = FMT.W, H = FMT.H, k = pick({ wide: 62, sq: 46, tall: 54 }), cy = pick({ wide: H * .52, sq: H * .5, tall: H * .5 });
    const segs = isoPts(k, W / 2, cy);
    let html = `<svg class="blk" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" style="left:0;top:0"><defs><filter id="s1g" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="3.2"/></filter>
      <linearGradient id="s1lg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#60A5FA"/><stop offset="1" stop-color="#1E6CFF"/></linearGradient></defs><g id="s1w">`;
    segs.forEach((s, i) => html += `<path d="M${s.a[0].toFixed(1)} ${s.a[1].toFixed(1)}L${s.b[0].toFixed(1)} ${s.b[1].toFixed(1)}" pathLength="1" stroke="${s.floor ? "#24407c" : "url(#s1lg)"}" stroke-width="${s.floor ? 1 : 1.6}" fill="none" stroke-dasharray="1 1" stroke-dashoffset="1" opacity="${s.floor ? .55 : .85}"/>`);
    html += `</g><g id="s1gl" filter="url(#s1g)">`;
    segs.forEach((s, i) => { if (!s.floor) html += `<path d="M${s.a[0].toFixed(1)} ${s.a[1].toFixed(1)}L${s.b[0].toFixed(1)} ${s.b[1].toFixed(1)}" pathLength="1" stroke="#9CC7FF" stroke-width="4" fill="none" stroke-dasharray=".18 1.2" stroke-dashoffset="1"/>`; });
    html += `</g></svg>`;
    wire = h(html); wire._w = W; wire._h = H; root.appendChild(wire);
    wireG = $$("#s1w path", wire).map((p, i) => ({ p, s: segs[i] })); glowG = $$("#s1gl path", wire).map((p, i) => ({ p, s: segs.filter(s => !s.floor)[i] }));

    // monograma 3D: N cópias escuras em Z (extrusão) + face frontal original + brilho recortado pela silhueta
    const MS = pick({ wide: 440, sq: 380, tall: 460 });
    mk = h(`<div class="blk p3" style="width:${MS}px;height:${MS}px"></div>`); root.appendChild(mk);
    for (let i = 12; i >= 1; i--) { const d = h(`<div style="position:absolute;inset:0;transform:translateZ(${-i * 2.2}px)">${KIT.mark("mkd", MS)}</div>`); d.firstChild.style.filter = `brightness(0) saturate(100%)`; d.style.opacity = 1; mk.appendChild(d); mkDepth.push(d); }
    mkFront = h(`<div style="position:absolute;inset:0">${KIT.mark("mkf", MS)}</div>`); mk.appendChild(mkFront);
    const paths = $$("svg > g > path, svg > g > g", mkFront);   // ordem do original: corpo, dobra recortada, 3 dobras, 3 coroas
    body = paths.slice(0, 5); crown = paths.slice(5);
    // brilho: retângulo em gradiente recortado pela própria geometria (cópia dos paths do original)
    const svg = $("svg", mkFront), g = $("svg > g", mkFront), cid = "s1clip";
    const cp = document.createElementNS("http://www.w3.org/2000/svg", "clipPath"); cp.id = cid;
    $$(":scope > path", g).forEach(p => cp.appendChild(p.cloneNode()));
    g.appendChild(cp);
    const sw = document.createElementNS("http://www.w3.org/2000/svg", "g"); sw.setAttribute("clip-path", `url(#${cid})`);
    sw.innerHTML = `<defs><linearGradient id="s1sw" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#fff" stop-opacity="0"/><stop offset=".5" stop-color="#fff" stop-opacity=".75"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient></defs><rect id="s1swr" x="-400" y="0" width="260" height="1000" fill="url(#s1sw)" transform="skewX(-18)"/>`;
    g.appendChild(sw); mkSweep = $("#s1swr", sw);
    mkDepth.forEach((d, i) => { const k2 = i / mkDepth.length; d.firstChild.style.filter = `brightness(${.18 + .25 * k2}) sepia(1) hue-rotate(185deg) saturate(4)`; });

    const WMW = pick({ wide: 640, sq: 560, tall: 640 });
    wm = h(`<div class="blk" style="width:${WMW}px;height:${WMW * 110 / 420}px">${KIT.wordmark("", WMW)}</div>`); root.appendChild(wm);
    wm.style.webkitMaskImage = "linear-gradient(90deg,#000 0%,#000 var(--p),transparent calc(var(--p) + 14%))";
    h1 = hl(["Seu negócio.", "Sob controle."], "", { accent: 1 }); h1.style.fontSize = pick({ wide: 118, sq: 96, tall: 112 }) + "px"; root.appendChild(h1);
    sub = hl(["Estoque, vendas e gestão em um só sistema."], "sub"); sub.style.fontSize = pick({ wide: 36, sq: 33, tall: 38 }) + "px"; root.appendChild(sub);
    h1.style.textAlign = sub.style.textAlign = pick({ wide: "left", sq: "center", tall: "center" });
  };
  S.render = function (t) {
    const W = FMT.W, H = FMT.H;
    // linhas: desenho progressivo 0.0–2.4, pulso de luz percorrendo, recuo e esmaecimento quando a marca entra
    const wireA = kf(t, [[0, 1], [1.6, 1], [3.0, .38], [6.4, .3], [7.6, 0]]);
    const camZ = kf(t, [[0, -120], [7.6, 140]], E.lin), camRot = kf(t, [[0, -2], [7.6, 2]], E.lin);
    put(wire, { x: W / 2, y: H / 2 + kf(t, [[5.8, 0], [7.6, 60]]), z: camZ, rz: 0, rx: camRot, o: wireA });
    wireG.forEach(({ p, s }) => { const x = E.out3(P(t, s.dl * 1.6, s.dl * 1.6 + .9)); setS(p, "strokeDashoffset", (1 - x).toFixed(3)); });
    glowG.forEach(({ p, s }) => { const x = P(t, s.dl * 1.6 + .2, s.dl * 1.6 + 1.7); setS(p, "strokeDashoffset", (1.18 - x * 2.4).toFixed(3)); setS(p, "opacity", (Math.sin(x * Math.PI) * .9).toFixed(3)); });

    // monograma
    const L = pick({ wide: { mx: W / 2, my: 430, mx2: 540, my2: 440, ms2: .8, wy: 780, wx2: 540, wy2: 720 }, sq: { mx: W / 2, my: 420, mx2: W / 2, my2: 230, ms2: .5, wy: 740, wx2: W / 2, wy2: 400 }, tall: { mx: W / 2, my: 780, mx2: W / 2, my2: 540, ms2: .66, wy: 1140, wx2: W / 2, wy2: 810 } });
    const ap = E.io5(P(t, 3.6, 4.9));       // marca vai para a posição de assinatura
    const mIn = P(t, .9, 2.6), sway = Math.sin(t * .9) * 5;
    const ry = lerp(-34, 0, E.out4(mIn)) + sway * (1 - ap * .4), rx = lerp(14, 4, E.out4(mIn));
    const mOut = E.in3(P(t, 6.6, 7.6));
    put(mk, { x: lerp(L.mx, L.mx2, ap), y: lerp(L.my, L.my2, ap) - mOut * 30, s: lerp(lerp(.86, 1, E.out3(mIn)), L.ms2, ap) * (1 - mOut * .08), rx, ry, z: lerp(-200, 0, E.out4(mIn)), o: cl(mIn * 3) * (1 - mOut), b: (1 - E.out3(cl(mIn * 2))) * 8 });
    // camadas: corpo revela de baixo para cima, coroa desce em três peças
    const bodyP = E.out4(P(t, 1.0, 2.3));
    body.forEach((p, i) => { setS(p, "opacity", cl(bodyP * 2 - i * .12).toFixed(3)); setS(p, "transform", `translateY(${((1 - bodyP) * 90).toFixed(1)}px)`); });
    crown.forEach((p, i) => { const c = spr(t - 1.75 - [0.12, 0.12, 0][i], 11, .62); setS(p, "opacity", cl((t - 1.75) * 4).toFixed(3)); setS(p, "transform", `translate(${((1 - c) * [-120, 120, 0][i]).toFixed(1)}px,${((1 - c) * [-60, -60, -160][i]).toFixed(1)}px)`); });
    mkDepth.forEach((d, i) => setS(d, "opacity", cl(bodyP * 1.4).toFixed(3)));
    mkSweep.setAttribute("x", (-500 + 1800 * E.io3(P(t, 2.7, 3.9))).toFixed(0));
    // wordmark
    const wp = E.io3(P(t, 2.4, 3.5));
    setV(wm, "--p", (wp * 114 - 14).toFixed(1) + "%");
    put(wm, { x: lerp(L.mx, L.wx2, ap), y: lerp(L.wy, L.wy2, ap) - mOut * 30, s: lerp(1, pick({ wide: .7, sq: .6, tall: .74 }), ap), o: cl(wp * 3) * (1 - mOut) });
    // título
    const tx = pick({ wide: 1000, sq: W / 2, tall: W / 2 }), ty = pick({ wide: 500, sq: 660, tall: 1180 });
    put(h1, { x: tx + (FN === "wide" ? h1._w / 2 || 0 : 0), y: ty, o: 1 });
    if (!h1._w) { h1._w = h1.offsetWidth; }
    hlAt(h1, t, 4.25, 6.9);
    put(sub, { x: tx + (FN === "wide" ? (sub._w || sub.offsetWidth) / 2 : 0), y: ty + pick({ wide: 175, sq: 150, tall: 175 }) });
    hlAt(sub, t, 5.0, 6.95, { st: .03, dy: 60 });
  };
  return S;
})();
