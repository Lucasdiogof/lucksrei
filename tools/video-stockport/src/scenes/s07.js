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
  const S = { D: 14.0 };
  let board, cards = {}, bars = [], line, donut = [], pdf, pdfParts = [], head, kpiV = {}, rule;
  const DAYS = DATA.DAYS14, TD = DATA.TODAY, MO = DATA.MONTH;   // centavos
  // layout do painel (px dentro do board)
  const C = {
    vendas: [30, 30, 380, 170], fat: [430, 30, 380, 170], lucro: [830, 30, 380, 170], baixo: [1230, 30, 380, 170],
    chart: [30, 220, 980, 400], pay: [1030, 220, 580, 400],
    repor: [30, 640, 480, 260], top: [530, 640, 480, 260], gaveta: [1030, 640, 580, 260],
  };
  S.build = function (root) {
    board = h(`<div class="blk p3 s7-board"></div>`); root.appendChild(board);
    const card = (k, html, cls = "") => { const [x, y, w, hh] = C[k]; const e = h(`<div class="s7-c ${cls}" style="width:${w}px;height:${hh}px">${html}</div>`); e._x = x; e._y = y; board.appendChild(e); cards[k] = e; return e; };
    card("vendas", `<h6>${KIT.ico("receipt", 18, "#64748B")}${DATA.tx("r.sales")}</h6><div class="v">${TD.sales}</div><div class="n">${DATA.tx("r.ticket")} <b style="color:#0F172A">${brl(TD.ticket)}</b></div>`);
    card("fat", `<h6>${KIT.ico("trend", 18, "#64748B")}${DATA.tx("r.rev")}</h6><div class="v">${brl(TD.revenue)}</div><div class="n">${KIT.ico("receipt", 15, "#64748B")}${DATA.tx("r.salesN", { n: TD.sales })}</div>`);
    card("lucro", `<h6>${KIT.ico("bars", 18, "#64748B")}${DATA.tx("r.profit")}</h6><div class="v">${brl(TD.profit)}</div><div class="n">${KIT.ico("lock", 15, "#64748B")}${DATA.tx("r.cost")}</div>`);
    card("baixo", `<h6>${KIT.ico("alert", 18, "#B45309")}${DATA.tx("p.low")}</h6><div class="v">${DATA.LOW.length}</div><div class="n">${DATA.tx("r.below")}</div>`, "am");
    const bw = 44, gap = (900 - DAYS.length * bw) / (DAYS.length - 1), mx = 140000;
    const pts = DAYS.map((v, i) => [10 + i * (bw + gap) + bw / 2, 270 - v / mx * 250]);
    card("chart", `<h5>${DATA.tx("r.perDay")}</h5><div class="sbt">${DATA.tx("r.14d")}</div><svg width="930" height="290" viewBox="0 0 930 290" style="margin-top:18px">
      ${[0, 1, 2, 3].map(i => `<line x1="0" x2="930" y1="${20 + i * 83}" y2="${20 + i * 83}" stroke="#EEF2F7" stroke-width="1.5"/>`).join("")}
      ${DAYS.map((v, i) => `<rect class="br" x="${10 + i * (bw + gap)}" y="${270 - v / mx * 250}" width="${bw}" height="${v / mx * 250}" rx="8" fill="${i === DAYS.length - 1 ? "#2563EB" : "#BFDBFE"}"/>`).join("")}
      <path class="ln" d="${pts.map((p, i) => (i ? "L" : "M") + p[0].toFixed(1) + " " + (p[1] - 18).toFixed(1)).join("")}" fill="none" stroke="#0A3D91" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" pathLength="1" stroke-dasharray="1 1"/>
      <line x1="0" x2="930" y1="271" y2="271" stroke="#CBD5E1" stroke-width="2"/></svg>`);
    const COL = { Pix: "#2563EB", Dinheiro: "#60A5FA", "Débito": "#0A3D91", "Crédito": "#93C5FD" }, PAY = Object.keys(TD.pct).map(k => [k, TD.pct[k], COL[k]]);
    let acc = 0;
    card("pay", `<h5>${DATA.tx("r.byPay")}</h5><div class="sbt">${DATA.tx("s.today")}</div><div style="display:flex;align-items:center;gap:34px;margin-top:26px">
      <svg width="240" height="240" viewBox="0 0 240 240" style="transform:rotate(-90deg)">${PAY.map(p => { const s = `<circle class="dn" cx="120" cy="120" r="92" fill="none" stroke="${p[2]}" stroke-width="40" pathLength="100" stroke-dasharray="0 100" data-a="${acc}" data-v="${p[1]}"/>`; acc += p[1]; return s; }).join("")}</svg>
      <div>${PAY.map(p => `<div style="display:flex;align-items:center;gap:12px;height:46px;font:400 19px 'SP Roboto';color:#334155"><i style="width:14px;height:14px;border-radius:4px;background:${p[2]}"></i><span style="width:110px">${DATA.payLabel(p[0])}</span><b style="font-weight:500;color:#0F172A">${p[1]}%</b></div>`).join("")}</div></div>`);
    card("repor", `<h5>${DATA.tx("r.restock")}</h5><div style="margin-top:10px">
      ${DATA.LOW.map(l => `<div class="s7-li">${KIT.ico("alert", 20, "#B45309")}<span class="x"><b>${l.name}</b></span>${l.q} / ${DATA.tx("s.minShort")} ${l.min}</div>`).join("")}</div>`);
    card("top", `<h5>${DATA.tx("r.top")}</h5><div style="margin-top:10px">
      <div class="s7-li"><span class="x"><b>${DATA.P.cafe.name}</b></span><div class="bar"><i style="width:100%"></i></div></div>
      <div class="s7-li"><span class="x"><b>${DATA.P.agua.name}</b></span><div class="bar"><i style="width:82%"></i></div></div>
      <div class="s7-li"><span class="x"><b>${DATA.P.caderno.name}</b></span><div class="bar"><i style="width:54%"></i></div></div></div>`);
    card("gaveta", `<div style="display:flex;gap:30px"><div style="flex:1"><h6>${KIT.ico("cash", 18, "#64748B")}${DATA.tx("r.drawer")}</h6><div class="v" style="font-size:44px">${brl(DATA.CASH.expected)}</div><div class="n"><span class="chip gr" style="height:28px;font-size:14px;background:#DCFCE7;color:#15803D;border-color:#BBF7D0"><i></i>${DATA.tx("r.closed")}</span></div></div>
      <div style="flex:1;border-left:1px solid #EEF2F7;padding-left:28px"><h6>${KIT.ico("package", 18, "#64748B")}${DATA.tx("r.stockVal")}</h6><div class="v" style="font-size:44px">${brl(1842000)}</div><div class="n">${DATA.tx("r.avgCost")}</div></div></div>`);
    Object.values(cards).forEach(e => { e.style.transform = `translate3d(${e._x}px,${e._y}px,0)`; });
    bars = $$(".br", board); line = $(".ln", board); donut = $$(".dn", board);
    kpiV = { vendas: $(".v", cards.vendas), fat: $(".v", cards.fat), lucro: $(".v", cards.lucro), baixo: $(".v", cards.baixo) };
    // relatório PDF
    const mini = KIT.sparkline(536, 140, MO.days, "#2563EB", true, 3);
    pdf = h(`<div class="blk s7-pdf"><div class="hd"><!-- variante clara original da marca (fundo branco) -->${KIT.markLight(40)}<b>StockPort System</b><span>Mercado Bom Dia</span></div><div class="rule"></div>
      <h2>${DATA.tx("rp.title")}</h2><div class="per">${DATA.tx("rp.period", { de: DATA.tx("rp.from"), ate: DATA.tx("rp.to"), dia: DATA.tx("rp.day"), hora: DATA.tx("rp.hour") })}</div>
      <div class="k"><div><span>${DATA.tx("rp.salesH")}</span><b>${MO.sales}</b></div><div><span>${DATA.tx("rp.revH")}</span><b>${brl(MO.revenue)}</b></div><div><span>${DATA.tx("rp.profH")}</span><b>${brl(MO.profit)}</b></div><div><span>${DATA.tx("rp.marginH")}</span><b>${MO.margin}%</b></div></div>
      <div class="ch"><div style="font:500 13px 'SP Roboto';color:#64748B;margin-bottom:6px">${DATA.tx("rp.perDay")}</div>${mini}</div>
      <table><tr><th>${DATA.tx("rp.colProd")}</th><th>${DATA.tx("rp.colQty")}</th><th>${DATA.tx("c.total")}</th></tr>${MO.top.map(r => `<tr><td>${DATA.P[r.p].name}</td><td>${r.q}</td><td>${brl(r.total)}</td></tr>`).join("")}</table>
      <div class="ft"><span>StockPort System</span><span>${DATA.tx("rp.page", { n: 1, m: 2 })}</span></div></div>`);
    root.appendChild(pdf); rule = $(".rule", pdf);
    pdfParts = [$(".hd", pdf), rule, $("h2", pdf), $(".per", pdf), $(".k", pdf), $(".ch", pdf), $("table", pdf), $(".ft", pdf)];
    head = hl(FN === "wide" ? ["Entenda", "seus resultados."] : [DATA.tx("h.res")], "", { accent: FN === "wide" ? 1 : -1 }); head.style.fontSize = pick({ wide: 96, sq: 62, tall: 76 }) + "px"; head.style.textAlign = pick({ wide: "left", sq: "center", tall: "center" }); root.appendChild(head);
  };
  // câmera = ponto de foco no board (px do board) + escala. 16:9: do faturamento ao painel inteiro.
  // 9:16 e 1:1: percorre os detalhes (faturamento → gráfico → formas de pagamento) antes de recuar.
  const F = { fat: [620, 115], chart: [520, 420], pay: [1320, 420], all: [820, 465] };
  const CAM = () => pick({
    wide: [[.4, ...F.fat, 2.6], [3.4, ...F.all, .98]],
    sq: [[.4, ...F.fat, 1.9], [2.8, ...F.chart, 1.02], [4.6, ...F.chart, 1.02], [5.6, ...F.pay, 1.5], [6.8, ...F.pay, 1.5], [7.6, ...F.all, .62]],
    tall: [[.4, ...F.fat, 1.65], [2.8, ...F.chart, 1.06], [4.6, ...F.chart, 1.06], [5.6, ...F.pay, 1.6], [6.8, ...F.pay, 1.6], [7.6, ...F.all, .62]],
  });
  const LY = () => pick({
    wide: { b: [960, 560], pdf: [1340, 545, .98], head: [110, 545] },
    sq: { b: [540, 610], pdf: [540, 640, .84], head: [540, 105] },
    tall: { b: [540, 1120], pdf: [540, 1180, 1.1], head: [540, 330] },
  });
  S.render = function (t) {
    const L = LY(), CK = CAM(), out = E.in3(P(t, 12.8, 13.5));
    const key = j => kf(t, CK.map(k => [k[0], k[j]]), E.io5);
    const fx = key(1), fy = key(2), s = key(3);
    const pb = E.io5(P(t, .4, 3.4));
    const rx = lerp(0, FN === "wide" ? 14 : 6, pb) + Math.sin(t * .35) * 1.5, ry = lerp(0, FN === "wide" ? -9 : -4, pb) + Math.sin(t * .27) * 2;
    const reorg = E.io5(P(t, 7.8, 9.4));
    const bx = L.b[0] - (fx - 820) * s, by = L.b[1] - (fy - 465) * s;
    put(board, { x: bx, y: by, s: s * lerp(1, .9, reorg), rx: rx * (1 - reorg), ry: ry * (1 - reorg), z: -reorg * 300, o: E.out2(P(t, .5, 1.3)) * (1 - E.in2(P(t, 8.0, 8.9))), b: (1 - E.out3(P(t, .5, 1.4))) * 12 });
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
    // gráficos crescem; os números já aparecem com o valor exato
    bars.forEach((b, i) => { const g = E.out4(P(t, 2.0 + i * .06, 2.9 + i * .06)); setS(b, "transform", `scaleY(${g.toFixed(4)})`); b.style.transformOrigin = "50% 100%"; b.style.transformBox = "fill-box"; });
    setS(line, "strokeDashoffset", (1 - E.io3(P(t, 2.8, 4.2))).toFixed(3));
    donut.forEach((d, i) => { const g = E.out3(P(t, 2.4 + i * .15, 3.4 + i * .15)); d.setAttribute("stroke-dasharray", `${(+d.dataset.v * g - .6).toFixed(2)} 100`); d.setAttribute("stroke-dashoffset", (-(+d.dataset.a)).toString()); });
    // relatório
    const pi = E.out4(P(t, 8.6, 9.8));
    const px = FN === "wide" ? lerp(960, L.pdf[0], E.io3(P(t, 9.8, 10.8))) : L.pdf[0];
    put(pdf, { x: px, y: L.pdf[1] + (1 - pi) * 40, s: L.pdf[2] * lerp(.85, 1, pi), rx: (1 - pi) * 18, ry: FN === "wide" ? lerp(0, -8, E.io3(P(t, 9.8, 10.8))) + Math.sin(t * .5) * 1.5 : 0, z: 40, o: pi * (1 - out) });
    pdfParts.forEach((p, i) => { const a = E.out3(P(t, 9.0 + i * .12, 9.6 + i * .12)); setS(p, "opacity", a.toFixed(3)); if (p === rule) setS(p, "transform", `scaleX(${a.toFixed(3)})`); });
    put(head, { x: L.head[0] + (FN === "wide" ? (head._w || head.offsetWidth) / 2 : 0), y: L.head[1] });
    hlAt(head, t, FN === "wide" ? 10.0 : 1.4, 12.8);
  };
  return S;
})();
