"use strict";
/* Cena 7 — dashboard e relatórios. A câmera parte do faturamento do dia e recua revelando o painel (tema claro, em
   camadas com profundidade); depois os cards se reorganizam num relatório PDF com a marca. Valores demonstrativos. */
SP.css(`
.s7-board{width:1640px;height:930px;border-radius:30px;background:linear-gradient(180deg,#F5F7FB,#E9EEF8);box-shadow:0 60px 140px rgba(0,0,0,.55);border:1px solid rgba(255,255,255,.6)}
.s7-c{position:absolute;left:0;top:0;border-radius:20px;background:#fff;border:1px solid #E2E8F0;box-shadow:0 10px 30px rgba(15,23,42,.10),0 2px 6px rgba(15,23,42,.06);padding:22px 24px;color:#0F172A;backface-visibility:hidden}
.s7-c h6{font:500 15px 'SP Roboto';letter-spacing:.12em;text-transform:uppercase;color:#64748B;display:flex;align-items:center;gap:8px;white-space:nowrap}
.s7-c .v{margin-top:14px;font:700 50px/1 'SP Roboto';letter-spacing:-.025em;color:#1D4ED8;font-variant-numeric:tabular-nums;white-space:nowrap}
.s7-c .n{margin-top:12px;font:400 17px 'SP Roboto';color:#64748B;white-space:nowrap;display:flex;align-items:center;gap:6px}
.s7-c .n b{color:#15803D;font-weight:500}
.s7-c.am .v{color:#B45309}
.s7-c h5{font:700 22px 'SP Roboto';color:#0F172A;margin-bottom:4px;white-space:nowrap}
.s7-c .sbt{font:400 16px 'SP Roboto';color:#64748B}
.s7-li{display:flex;align-items:center;gap:12px;height:58px;border-bottom:1px solid #EEF2F7;font:400 18px 'SP Roboto';color:#334155;white-space:nowrap}
.s7-li b{font-weight:500;color:#0F172A}
.s7-li .x{flex:1}
.s7-li .bar{height:10px;border-radius:5px;background:#DBEAFE;width:120px;position:relative;overflow:hidden}
.s7-li .bar i{position:absolute;left:0;top:0;bottom:0;background:#2563EB;border-radius:5px}
.s7-hero{position:absolute;inset:0;border-radius:30px;pointer-events:none}
.s7-pdf{width:640px;height:880px;background:#fff;border-radius:6px;box-shadow:0 50px 120px rgba(0,0,0,.55),0 8px 24px rgba(0,0,0,.3);padding:46px 50px;color:#0F172A}
.s7-pdf .hd{display:flex;align-items:center;gap:14px}
.s7-pdf .hd b{font:700 19px 'SP Roboto';letter-spacing:-.01em}
.s7-pdf .hd span{margin-left:auto;font:400 14px 'SP Roboto';color:#64748B}
.s7-pdf .rule{height:3px;background:#2563EB;margin:18px 0 24px;transform-origin:0 50%}
.s7-pdf h2{font:700 32px 'SP Roboto';letter-spacing:-.02em}
.s7-pdf .per{font:400 16px 'SP Roboto';color:#64748B;margin-top:6px}
.s7-pdf .k{display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin-top:26px}
.s7-pdf .k div{border:1px solid #E2E8F0;border-radius:8px;padding:12px}
.s7-pdf .k span{display:block;font:500 11px 'SP Roboto';letter-spacing:.1em;text-transform:uppercase;color:#64748B}
.s7-pdf .k b{display:block;margin-top:6px;font:700 19px 'SP Roboto';color:#1D4ED8;font-variant-numeric:tabular-nums;white-space:nowrap}
.s7-pdf .ch{margin-top:24px;height:170px;border:1px solid #E2E8F0;border-radius:8px;padding:14px}
.s7-pdf table{width:100%;border-collapse:collapse;margin-top:24px;font:400 15px 'SP Roboto';font-variant-numeric:tabular-nums}
.s7-pdf th{background:#EEF2FA;color:#334155;font-weight:500;text-align:left;padding:10px 10px}
.s7-pdf td{padding:10px 10px;border-bottom:1px solid #EEF2F7;color:#0F172A}
.s7-pdf td:last-child,.s7-pdf th:last-child{text-align:right}
.s7-pdf .ft{position:absolute;left:50px;right:50px;bottom:30px;display:flex;justify-content:space-between;font:400 13px 'SP Roboto';color:#94A3B8}
`);
SP.scenes.s07 = (function () {
  const S = { D: 13.6 };
  let board, cards = {}, bars = [], line, donut = [], pdf, pdfParts = [], head, kpiV = {}, rule;
  const DAYS = [820, 940, 760, 1110, 1260, 980, 1040, 1180, 870, 1320, 1150, 990, 1210, 1284.6];
  // layout do painel (px dentro do board)
  const C = {
    vendas: [30, 30, 380, 170], fat: [430, 30, 380, 170], lucro: [830, 30, 380, 170], baixo: [1230, 30, 380, 170],
    chart: [30, 220, 980, 400], pay: [1030, 220, 580, 400],
    repor: [30, 640, 480, 260], top: [530, 640, 480, 260], gaveta: [1030, 640, 580, 260],
  };
  S.build = function (root) {
    board = h(`<div class="blk p3 s7-board"></div>`); root.appendChild(board);
    const card = (k, html, cls = "") => { const [x, y, w, hh] = C[k]; const e = h(`<div class="s7-c ${cls}" style="width:${w}px;height:${hh}px">${html}</div>`); e._x = x; e._y = y; board.appendChild(e); cards[k] = e; return e; };
    card("vendas", `<h6>${KIT.ico("receipt", 18, "#64748B")}Vendas hoje</h6><div class="v">23</div><div class="n"><b>+4</b> em relação a ontem</div>`);
    card("fat", `<h6>${KIT.ico("trend", 18, "#64748B")}Faturamento hoje</h6><div class="v">R$ 1.284,60</div><div class="n"><b>+8%</b> na semana</div>`);
    card("lucro", `<h6>${KIT.ico("bars", 18, "#64748B")}Lucro hoje · estimado</h6><div class="v">R$ 412,30</div><div class="n">${KIT.ico("lock", 15, "#64748B")}perfis com acesso a custos</div>`);
    card("baixo", `<h6>${KIT.ico("alert", 18, "#B45309")}Estoque baixo</h6><div class="v">3</div><div class="n">produtos abaixo do mínimo</div>`, "am");
    const bw = 44, gap = (900 - DAYS.length * bw) / (DAYS.length - 1), mx = 1400;
    const pts = DAYS.map((v, i) => [10 + i * (bw + gap) + bw / 2, 270 - v / mx * 250]);
    card("chart", `<h5>Faturamento por dia</h5><div class="sbt">Últimos 14 dias</div><svg width="930" height="290" viewBox="0 0 930 290" style="margin-top:18px">
      ${[0, 1, 2, 3].map(i => `<line x1="0" x2="930" y1="${20 + i * 83}" y2="${20 + i * 83}" stroke="#EEF2F7" stroke-width="1.5"/>`).join("")}
      ${DAYS.map((v, i) => `<rect class="br" x="${10 + i * (bw + gap)}" y="${270 - v / mx * 250}" width="${bw}" height="${v / mx * 250}" rx="8" fill="${i === DAYS.length - 1 ? "#2563EB" : "#BFDBFE"}"/>`).join("")}
      <path class="ln" d="${pts.map((p, i) => (i ? "L" : "M") + p[0].toFixed(1) + " " + (p[1] - 18).toFixed(1)).join("")}" fill="none" stroke="#0A3D91" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" pathLength="1" stroke-dasharray="1 1"/>
      <line x1="0" x2="930" y1="271" y2="271" stroke="#CBD5E1" stroke-width="2"/></svg>`);
    const PAY = [["Pix", 46, "#2563EB"], ["Dinheiro", 22, "#60A5FA"], ["Débito", 18, "#0A3D91"], ["Crédito", 14, "#93C5FD"]];
    let acc = 0;
    card("pay", `<h5>Por forma de pagamento</h5><div class="sbt">Este mês</div><div style="display:flex;align-items:center;gap:34px;margin-top:26px">
      <svg width="240" height="240" viewBox="0 0 240 240" style="transform:rotate(-90deg)">${PAY.map(p => { const s = `<circle class="dn" cx="120" cy="120" r="92" fill="none" stroke="${p[2]}" stroke-width="40" pathLength="100" stroke-dasharray="0 100" data-a="${acc}" data-v="${p[1]}"/>`; acc += p[1]; return s; }).join("")}</svg>
      <div>${PAY.map(p => `<div style="display:flex;align-items:center;gap:12px;height:46px;font:400 19px 'SP Roboto';color:#334155"><i style="width:14px;height:14px;border-radius:4px;background:${p[2]}"></i><span style="width:110px">${p[0]}</span><b style="font-weight:500;color:#0F172A">${p[1]}%</b></div>`).join("")}</div></div>`);
    card("repor", `<h5>Produtos para repor</h5><div style="margin-top:10px">
      <div class="s7-li">${KIT.ico("alert", 20, "#B45309")}<span class="x"><b>Sabão em Pó 1 kg</b></span>6 / mín. 10</div>
      <div class="s7-li">${KIT.ico("alert", 20, "#B45309")}<span class="x"><b>Biscoito Água e Sal</b></span>4 / mín. 12</div>
      <div class="s7-li">${KIT.ico("alert", 20, "#B45309")}<span class="x"><b>Detergente 500 ml</b></span>7 / mín. 15</div></div>`);
    card("top", `<h5>Produtos mais vendidos</h5><div style="margin-top:10px">
      <div class="s7-li"><span class="x"><b>Café Torrado 500 g</b></span><div class="bar"><i style="width:100%"></i></div></div>
      <div class="s7-li"><span class="x"><b>Água Mineral 1,5 L</b></span><div class="bar"><i style="width:82%"></i></div></div>
      <div class="s7-li"><span class="x"><b>Caderno 96 folhas</b></span><div class="bar"><i style="width:54%"></i></div></div></div>`);
    card("gaveta", `<div style="display:flex;gap:30px"><div style="flex:1"><h6>${KIT.ico("cash", 18, "#64748B")}Gaveta do caixa</h6><div class="v" style="font-size:44px">R$ 180,00</div><div class="n"><span class="chip gr" style="height:28px;font-size:14px;background:#DCFCE7;color:#15803D;border-color:#BBF7D0"><i></i>Caixa fechado</span></div></div>
      <div style="flex:1;border-left:1px solid #EEF2F7;padding-left:28px"><h6>${KIT.ico("package", 18, "#64748B")}Valor do estoque</h6><div class="v" style="font-size:44px">R$ 18.420</div><div class="n">ao custo médio</div></div></div>`);
    Object.values(cards).forEach(e => { e.style.transform = `translate3d(${e._x}px,${e._y}px,0)`; });
    bars = $$(".br", board); line = $(".ln", board); donut = $$(".dn", board);
    kpiV = { vendas: $(".v", cards.vendas), fat: $(".v", cards.fat), lucro: $(".v", cards.lucro), baixo: $(".v", cards.baixo) };
    // relatório PDF
    const mini = KIT.sparkline(536, 140, DAYS, "#2563EB", true, 3);
    pdf = h(`<div class="blk s7-pdf"><div class="hd"><!-- variante clara original da marca (fundo branco) -->${KIT.markLight(40)}<b>StockPort System</b><span>Mercado Bom Dia</span></div><div class="rule"></div>
      <h2>Relatório de vendas</h2><div class="per">01/10/2026 a 21/10/2026 · gerado em 21/10 às 18:40</div>
      <div class="k"><div><span>Vendas</span><b>412</b></div><div><span>Faturamento</span><b>R$ 24.318</b></div><div><span>Lucro est.</span><b>R$ 7.802</b></div><div><span>Margem</span><b>32%</b></div></div>
      <div class="ch"><div style="font:500 13px 'SP Roboto';color:#64748B;margin-bottom:6px">FATURAMENTO POR DIA</div>${mini}</div>
      <table><tr><th>Produto</th><th>Qtd.</th><th>Total</th></tr><tr><td>Café Torrado 500 g</td><td>186</td><td>R$ 3.515,40</td></tr><tr><td>Água Mineral 1,5 L</td><td>402</td><td>R$ 1.407,00</td></tr><tr><td>Caderno 96 folhas</td><td>74</td><td>R$ 1.102,60</td></tr></table>
      <div class="ft"><span>StockPort System</span><span>página 1 de 2</span></div></div>`);
    root.appendChild(pdf); rule = $(".rule", pdf);
    pdfParts = [$(".hd", pdf), rule, $("h2", pdf), $(".per", pdf), $(".k", pdf), $(".ch", pdf), $("table", pdf), $(".ft", pdf)];
    head = hl(["Transforme", "movimentações", "em decisões."], "", { accent: 2 }); head.style.fontSize = pick({ wide: 92, sq: 64, tall: 80 }) + "px"; head.style.textAlign = pick({ wide: "left", sq: "left", tall: "center" }); root.appendChild(head);
    if (FN !== "wide") { head.remove(); head = hl(FN === "tall" ? ["Transforme movimentações", "em decisões."] : ["Transforme movimentações", "em decisões."], "", { accent: 1 }); head.style.fontSize = pick({ sq: 56, tall: 62 }) + "px"; head.style.textAlign = "center"; root.appendChild(head); }
  };
  const LY = () => pick({
    wide: { b: [960, 560, .98], pdf: [1340, 545, .98], head: [110, 545] },
    sq: { b: [540, 560, .6], pdf: [540, 620, .86], head: [540, 105] },
    tall: { b: [540, 980, .62], pdf: [540, 1130, 1.02], head: [540, 300] },
  });
  S.render = function (t) {
    const L = LY(), out = E.in3(P(t, 12.4, 13.2));
    // câmera: começa no card de faturamento (perto) e recua
    const pb = E.io5(P(t, .4, 3.4));
    const fx = C.fat[0] + C.fat[2] / 2 - 820, fy = C.fat[1] + C.fat[3] / 2 - 465;   // centro do card relativo ao centro do board
    const near = pick({ wide: 2.6, sq: 2.0, tall: 1.8 });
    const s = lerp(near * L.b[2], L.b[2], pb);
    const rx = lerp(0, 14, pb) + Math.sin(t * .35) * 1.5, ry = lerp(0, -9, pb) + Math.sin(t * .27) * 2;
    const reorg = E.io5(P(t, 7.4, 9.0));
    const bx = L.b[0] - fx * s * (1 - pb), by = L.b[1] - fy * s * (1 - pb);
    put(board, { x: bx, y: by, s: s * lerp(1, .9, reorg), rx: rx * (1 - reorg), ry: ry * (1 - reorg), z: -reorg * 300, o: E.out2(P(t, .5, 1.3)) * (1 - E.in2(P(t, 8.0, 9.2))), b: (1 - E.out3(P(t, .5, 1.4))) * 12 });
    // cards sobem do plano em camadas (parallax) e, na reorganização, convergem para o centro do board
    const order = ["fat", "vendas", "lucro", "baixo", "chart", "pay", "repor", "top", "gaveta"];
    order.forEach((k, i) => {
      const e = cards[k], a = k === "fat" ? 1 : E.out4(P(t, 1.2 + i * .12, 2.2 + i * .12));
      const z = (k === "fat" ? 40 : 24 + (i % 3) * 10) * a * (1 - reorg);
      const cx = e._x + C[k][2] / 2, cy = e._y + C[k][3] / 2;
      const gx = lerp(e._x, e._x + (820 - cx) * .85, reorg), gy = lerp(e._y, e._y + (465 - cy) * .85, reorg);
      setS(e, "transform", `translate3d(${gx.toFixed(1)}px,${(gy + (1 - a) * 30).toFixed(1)}px,${z.toFixed(1)}px) scale(${lerp(1, .5, reorg).toFixed(4)})`);
      setS(e, "opacity", a.toFixed(3));
    });
    // números e gráficos vivos
    setT(kpiV.fat, fmtBRL(lerp(1203.1, 1284.6, E.out3(P(qt(t), .2, 2.6)))));
    setT(kpiV.vendas, String(Math.round(lerp(18, 23, E.out3(P(qt(t), 1.4, 3.2))))));
    setT(kpiV.lucro, fmtBRL(lerp(370, 412.3, E.out3(P(qt(t), 1.6, 3.4)))));
    bars.forEach((b, i) => { const g = E.out4(P(t, 2.0 + i * .06, 2.9 + i * .06)); setS(b, "transform", `scaleY(${g.toFixed(4)})`); b.style.transformOrigin = "50% 100%"; b.style.transformBox = "fill-box"; });
    setS(line, "strokeDashoffset", (1 - E.io3(P(t, 2.8, 4.2))).toFixed(3));
    donut.forEach((d, i) => { const g = E.out3(P(t, 2.4 + i * .15, 3.4 + i * .15)); d.setAttribute("stroke-dasharray", `${(+d.dataset.v * g - .6).toFixed(2)} 100`); d.setAttribute("stroke-dashoffset", (-(+d.dataset.a)).toString()); });
    // relatório
    const pi = E.out4(P(t, 8.2, 9.4));
    const px = FN === "wide" ? lerp(960, L.pdf[0], E.io3(P(t, 9.4, 10.4))) : L.pdf[0];
    put(pdf, { x: px, y: L.pdf[1] + (1 - pi) * 40, s: L.pdf[2] * lerp(.85, 1, pi), rx: (1 - pi) * 18, ry: FN === "wide" ? lerp(0, -8, E.io3(P(t, 9.4, 10.4))) + Math.sin(t * .5) * 1.5 : 0, z: 40, o: pi * (1 - out) });
    pdfParts.forEach((p, i) => { const a = E.out3(P(t, 8.6 + i * .12, 9.2 + i * .12)); setS(p, "opacity", a.toFixed(3)); if (p === rule) setS(p, "transform", `scaleX(${a.toFixed(3)})`); });
    // título (no 16:9 à esquerda do relatório; nos outros acima)
    put(head, { x: L.head[0] + (FN === "wide" ? (head._w || head.offsetWidth) / 2 : 0), y: L.head[1] });
    if (FN === "sq" || FN === "tall") { hlAt(head, t, 9.6, 12.5); } else hlAt(head, t, 9.7, 12.5);
  };
  return S;
})();
