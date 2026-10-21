"use strict";
/* Cena 10 — encerramento. Linhas cobalto convergem para o centro e desenham o contorno do SP (geometria original,
   só traço); o preenchimento original aparece por cima; wordmark, frase e assinatura. Quadro final sustentado. */
SP.scenes.s10 = (function () {
  const S = { D: 8.2 };
  let lic, lines, outl, oPaths = [], mk, wm, tag, sig, LN = [];
  S.build = function (root) {
    const W = FMT.W, H = FMT.H, cx = W / 2, cy = pick({ wide: 420, sq: 380, tall: 760 });
    const R = rng(1010); let d = "";
    for (let i = 0; i < 30; i++) {
      const a = i / 30 * Math.PI * 2 + R() * .15, r0 = Math.hypot(W, H) * (.55 + R() * .1), x0 = cx + Math.cos(a) * r0, y0 = cy + Math.sin(a) * r0;
      const r1 = 40 + R() * 60, x1 = cx + Math.cos(a + .9) * r1, y1 = cy + Math.sin(a + .9) * r1;
      const mx = cx + Math.cos(a + .45) * r0 * .45, my = cy + Math.sin(a + .45) * r0 * .45;
      LN.push(`<path d="M${x0.toFixed(0)} ${y0.toFixed(0)}Q${mx.toFixed(0)} ${my.toFixed(0)} ${x1.toFixed(0)} ${y1.toFixed(0)}" pathLength="1" stroke-dasharray=".22 1.3" stroke-dashoffset=".22" data-dl="${(R() * .5).toFixed(3)}"/>`);
    }
    lines = h(`<svg class="blk" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}"><defs><filter id="s10b"><feGaussianBlur stdDeviation="2.5"/></filter></defs><g fill="none" stroke="#4C8DFF" stroke-width="2.2" stroke-linecap="round">${LN.join("")}</g></svg>`);
    root.appendChild(lines); LN = $$("path", lines);
    // contorno com os paths originais do monograma
    const MS = pick({ wide: 380, sq: 360, tall: 440 });
    const doc = new DOMParser().parseFromString(SP.assets.mark, "image/svg+xml"), g = doc.querySelector("svg > g");
    const ds = [...g.children].filter(e => e.tagName === "path").map(e => e.getAttribute("d"));
    outl = h(`<svg class="blk" width="${MS}" height="${MS}" viewBox="0 0 960 960"><g transform="${g.getAttribute("transform")}" fill="none" stroke="#7FB2FF" stroke-width="7" stroke-linejoin="round">${ds.map(x => `<path d="${x}" pathLength="1" stroke-dasharray="1 1" stroke-dashoffset="1"/>`).join("")}</g></svg>`);
    root.appendChild(outl); oPaths = $$("path", outl);
    mk = h(`<div class="blk" style="width:${MS}px;height:${MS}px">${KIT.mark("", MS)}</div>`); root.appendChild(mk);
    const WMW = pick({ wide: 600, sq: 560, tall: 680 });
    wm = h(`<div class="blk" style="width:${WMW}px;height:${WMW * 110 / 420}px">${KIT.wordmark("", WMW)}</div>`); root.appendChild(wm);
    wm.style.webkitMaskImage = "linear-gradient(90deg,#000 0%,#000 var(--p),transparent calc(var(--p) + 14%))";
    tag = hl(["Do estoque à venda.", "Tudo conectado."], "", { accent: 1 }); tag.style.fontSize = pick({ wide: 58, sq: 54, tall: 66 }) + "px"; tag.style.textAlign = "center"; root.appendChild(tag);
    if (FN === "wide") { tag.remove(); tag = hl(["Do estoque à venda. Tudo conectado."], "", {}); tag.style.fontSize = "54px"; tag.style.textAlign = "center"; root.appendChild(tag); }
    lic = h(`<div class="blk sub" style="font-size:${pick({ wide: 28, sq: 28, tall: 34 })}px;color:#C7D2E4">Licença de uso do software</div>`); root.appendChild(lic);
    sig = h(`<div class="blk sub" style="font-size:${pick({ wide: 24, sq: 24, tall: 28 })}px;letter-spacing:.18em;text-transform:uppercase;color:#8EA3C7">Um produto Lucksrei</div>`); root.appendChild(sig);
    S.cy = cy;
  };
  S.render = function (t) {
    const W = FMT.W, cy = S.cy, cx = W / 2;
    const fadeEnd = FN === "sq" ? E.io2(P(t, 7.4, 8.2)) : 0;   // o loop do site termina no fundo vazio, igual ao quadro 0
    // linhas convergindo
    show(lines, true); setS(lines, "transform", "none");
    LN.forEach(p => { const dl = +p.dataset.dl, x = E.io3(P(t, dl, dl + 1.6)); setS(p, "strokeDashoffset", (.22 - x * 1.28).toFixed(3)); setS(p, "opacity", (Math.sin(x * Math.PI) * .9).toFixed(3)); });
    // contorno
    const op = E.io3(P(t, 1.0, 2.6)), fill = E.io3(P(t, 2.3, 3.2));
    oPaths.forEach((p, i) => setS(p, "strokeDashoffset", (1 - cl(op * 1.3 - i * .04)).toFixed(3)));
    const breathe = 1 + .012 * Math.sin(t * .9);
    put(outl, { x: cx, y: cy, s: breathe, o: (1 - fill * .85) * cl(t * 3) * (1 - fadeEnd) });
    put(mk, { x: cx, y: cy, s: breathe, o: fill * (1 - fadeEnd), b: (1 - fill) * 6 });
    const wp = E.io3(P(t, 3.1, 4.1)); setV(wm, "--p", (wp * 114 - 14).toFixed(1) + "%");
    put(wm, { x: cx, y: cy + pick({ wide: 300, sq: 290, tall: 350 }), o: cl(wp * 3) * (1 - fadeEnd) });
    put(tag, { x: cx, y: cy + pick({ wide: 440, sq: 455, tall: 560 }) });
    hlAt(tag, t, 4.0, FN === "sq" ? 7.4 : undefined, { st: .07 });
    put(lic, { x: cx, y: cy + pick({ wide: 525, sq: 545, tall: 690 }), o: E.out3(P(t, 4.7, 5.4)) * (1 - fadeEnd) });
    put(sig, { x: cx, y: pick({ wide: 1010, sq: 1010, tall: 1760 }), o: E.out3(P(t, 5.2, 6.0)) * (1 - fadeEnd) });
  };
  return S;
})();
