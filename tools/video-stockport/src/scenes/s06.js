"use strict";
/* Cena 6 — clientes e fornecedores. Fornecedor → produto → cliente, ligados por fluxos de luz; cards com histórico. Dados fictícios. */
SP.css(`
.s6-c{width:560px;height:520px;padding:28px 30px}
.s6-c .tp{display:flex;align-items:center;gap:18px}
.s6-c .tp .ic{width:72px;height:72px;border-radius:20px;display:flex;align-items:center;justify-content:center;background:rgba(37,99,235,.18);border:1px solid rgba(96,165,250,.35);flex:none}
.s6-c .tp b{display:block;font:700 30px 'SP Roboto';letter-spacing:-.01em;white-space:nowrap}
.s6-c .tp span{display:block;margin-top:6px;font:400 18px 'SP Roboto';color:#8EA3C7}
.s6-c .ct{display:flex;gap:10px;margin:22px 0 22px}
.s6-c h5{font:500 15px 'SP Roboto';letter-spacing:.14em;text-transform:uppercase;color:#8EA3C7;margin-bottom:8px}
.s6-c .hr{display:flex;align-items:center;gap:14px;height:68px;border-bottom:1px solid rgba(110,160,250,.12);font:400 19px 'SP Roboto';color:#B6C4DD}
.s6-c .hr .k{width:40px;height:40px;border-radius:11px;display:flex;align-items:center;justify-content:center;background:rgba(96,165,250,.12);flex:none}
.s6-c .hr .x{flex:1;min-width:0}
.s6-c .hr .x b{display:block;font:500 20px 'SP Roboto';color:#F1F5FF;white-space:nowrap}
.s6-c .hr .v{font:500 20px 'SP Roboto';color:#E5EDFB;font-variant-numeric:tabular-nums}
.s6-c .hr.nw{background:rgba(37,99,235,.14);border-radius:12px;border-bottom-color:transparent;padding:0 10px;margin:0 -10px}
.s6-hub{width:300px;height:300px;border-radius:50%;border:1.5px solid rgba(96,165,250,.35);background:radial-gradient(closest-side,rgba(37,99,235,.28),rgba(37,99,235,0))}
.s6-lbl{display:flex;align-items:center;gap:10px;height:44px;padding:0 18px;border-radius:22px;background:rgba(10,26,60,.9);border:1px solid rgba(96,165,250,.35);font:500 19px 'SP Roboto';color:#CFE0FF;white-space:nowrap}
`);
SP.scenes.s06 = (function () {
  const S = { D: 8.4 };
  let sup, cus, hub, prod, flow, lbA, lbB, head, pA, pB, dA, dB;
  S.build = function (root) {
    sup = h(`<div class="pn blk s6-c"><div class="tp"><div class="ic">${KIT.ico("truck", 36, "#9CC7FF", 1.8)}</div><div><b>Distribuidora Serra</b><span>Fornecedor · Mercearia e bebidas</span></div></div>
      <div class="ct"><span class="chip sl">${KIT.ico("user", 16)}Rafael · comercial</span><span class="chip sl">${KIT.ico("clock", 16)}Entrega às terças</span></div>
      <h5>Histórico de entradas</h5>
      <div class="hr nw"><div class="k">${KIT.ico("down", 20, "#4ADE80", 2)}</div><div class="x"><b>Café Torrado 500 g</b>21/10 · ${DATA.MOVES[DATA.ENTRY_IDX].q} un.</div></div>
      <div class="hr"><div class="k">${KIT.ico("down", 20, "#4ADE80", 2)}</div><div class="x"><b>Água Mineral 1,5 L</b>14/10 · 48 un.</div></div>
      <div class="hr"><div class="k">${KIT.ico("down", 20, "#4ADE80", 2)}</div><div class="x"><b>Café Torrado 500 g</b>07/10 · 36 un.</div></div></div>`);
    cus = h(`<div class="pn blk s6-c"><div class="tp">${KIT.avatar("MS", "#2563EB", 72)}<div><b>Mariana Souza</b><span>Cliente · 12 compras</span></div></div>
      <div class="ct"><span class="chip sl">${KIT.ico("phone", 16)}Contato salvo</span><span class="chip sl">${KIT.ico("tag", 16)}Cliente frequente</span></div>
      <h5>Histórico de compras</h5>
      <div class="hr nw"><div class="k">${KIT.ico("receipt", 20, "#93C5FD", 2)}</div><div class="x"><b>Venda #${DATA.SALE.n}</b>Hoje · 9 itens</div><div class="v">${brl(DATA.SALE.total)}</div></div>
      <div class="hr"><div class="k">${KIT.ico("receipt", 20, "#93C5FD", 2)}</div><div class="x"><b>Venda #1031</b>14/10 · 2 itens</div><div class="v">R$ 42,50</div></div>
      <div class="hr"><div class="k">${KIT.ico("receipt", 20, "#93C5FD", 2)}</div><div class="x"><b>Venda #1012</b>03/10 · 5 itens</div><div class="v">R$ 96,10</div></div></div>`);
    hub = h(`<div class="blk s6-hub"></div>`);
    const c = KIT.product("cafe"); prod = anchor(c, -48, -150);
    flow = h(`<svg class="blk" width="${FMT.W}" height="${FMT.H}" viewBox="0 0 ${FMT.W} ${FMT.H}"><defs><filter id="s6b"><feGaussianBlur stdDeviation="4"/></filter></defs>
      <path class="a" fill="none" stroke="#2f5bb5" stroke-width="2.5" pathLength="1" stroke-dasharray="1 1"/><path class="b" fill="none" stroke="#2f5bb5" stroke-width="2.5" pathLength="1" stroke-dasharray="1 1"/>
      <g filter="url(#s6b)"><circle class="pa" r="9" fill="#60A5FA"/><circle class="pb" r="9" fill="#60A5FA"/></g><circle class="qa" r="5" fill="#E0EDFF"/><circle class="qb" r="5" fill="#E0EDFF"/></svg>`);
    [hub, flow, sup, cus, prod].forEach(e => root.appendChild(e));
    lbA = h(`<div class="blk s6-lbl">${KIT.ico("down", 18, "#4ADE80", 2)}Entrada · ${DATA.MOVES[DATA.ENTRY_IDX].q} un.</div>`); lbB = h(`<div class="blk s6-lbl">${KIT.ico("cart", 18, "#93C5FD", 2)}Venda #${DATA.SALE.n}</div>`); root.appendChild(lbA); root.appendChild(lbB);
    head = hl(["Clientes e fornecedores", "com todo o histórico."], "", { accent: 1 }); head.style.fontSize = pick({ wide: 66, sq: 58, tall: 72 }) + "px"; head.style.textAlign = "center"; root.appendChild(head);
  };
  const LY = () => pick({
    wide: { sup: [400, 610, .96, 16], cus: [1520, 610, .96, -16], hub: [960, 620, 1], head: [960, 150], vert: 0 },
    sq: { sup: [290, 600, .64, 18], cus: [790, 600, .64, -18], hub: [540, 900, .55], head: [540, 140], vert: 0 },
    tall: { sup: [540, 760, .82, 0], cus: [540, 1560, .82, 0], hub: [540, 1160, .7], head: [540, 260], vert: 1 },
  });
  S.render = function (t) {
    const L = LY(), out = E.in3(P(t, 7.1, 7.8));
    const ai = E.out4(P(t, .7, 1.8)), bi = E.out4(P(t, .9, 2.0)), hi = E.out4(P(t, .5, 1.5));
    const sway = Math.sin(t * .5) * 2;
    put(sup, { x: L.sup[0] - (1 - ai) * (L.vert ? 0 : 120), y: L.sup[1] - (L.vert ? (1 - ai) * 80 : 0), s: L.sup[2], ry: L.sup[3] + sway, o: ai * (1 - out) });
    put(cus, { x: L.cus[0] + (1 - bi) * (L.vert ? 0 : 120), y: L.cus[1] + (L.vert ? (1 - bi) * 80 : 0), s: L.cus[2], ry: L.cus[3] + sway, o: bi * (1 - out) });
    put(hub, { x: L.hub[0], y: L.hub[1], s: L.hub[2] * lerp(.6, 1, hi) * (1 + .03 * Math.sin(t * 2)), o: hi * (1 - out) });
    put(prod, { x: L.hub[0], y: L.hub[1] + 70 * L.hub[2], s: 1.05 * L.hub[2], rx: -14, ry: -30 + t * 14, o: hi * (1 - out) });
    // ligações
    const ps = L.sup, pc = L.cus, hx = L.hub[0], hy = L.hub[1], hr = 150 * L.hub[2];
    let a, b;
    if (!L.vert) {
      const ax = ps[0] + 280 * ps[2] * .97, bx = pc[0] - 280 * pc[2] * .97;
      a = `M${ax} ${ps[1]}C${ax + 120} ${ps[1]},${hx - hr - 120} ${hy},${hx - hr} ${hy}`; b = `M${hx + hr} ${hy}C${hx + hr + 120} ${hy},${bx - 120} ${pc[1]},${bx} ${pc[1]}`;
    } else {
      const ay = ps[1] + 260 * ps[2], by = pc[1] - 260 * pc[2];
      a = `M${hx} ${ay}L${hx} ${hy - hr}`; b = `M${hx} ${hy + hr}L${hx} ${by}`;
    }
    const pa = $(".a", flow), pb = $(".b", flow);
    if (pa._d !== a) { pa.setAttribute("d", a); pa._d = a; } if (pb._d !== b) { pb.setAttribute("d", b); pb._d = b; }
    setS(flow, "opacity", (1 - out).toFixed(3)); show(flow, true); setS(flow, "transform", "none");
    const la = E.io3(P(t, 1.4, 2.4)), lb = E.io3(P(t, 1.9, 2.9));
    setS(pa, "strokeDashoffset", (1 - la).toFixed(3)); setS(pb, "strokeDashoffset", (1 - lb).toFixed(3));
    const dot = (path, c1, c2, ph, on) => { const L0 = path.getTotalLength(), u = ((t - ph) * .45) % 1; const p = path.getPointAtLength(L0 * u); [c1, c2].forEach(c => { c.setAttribute("cx", p.x.toFixed(1)); c.setAttribute("cy", p.y.toFixed(1)); c.style.opacity = on * Math.sin(u * Math.PI); }); };
    dot(pa, $(".pa", flow), $(".qa", flow), 2.4, la >= 1 ? 1 : 0); dot(pb, $(".pb", flow), $(".qb", flow), 2.9, lb >= 1 ? 1 : 0);
    const mA = pa.getPointAtLength(pa.getTotalLength() * .5), mB = pb.getPointAtLength(pb.getTotalLength() * .5);
    put(lbA, { x: mA.x + (L.vert ? 150 : 0), y: mA.y - (L.vert ? 0 : 46), s: FN === "wide" ? 1 : .9, o: E.out3(P(t, 2.3, 2.8)) * (1 - out) });
    put(lbB, { x: mB.x + (L.vert ? 150 : 0), y: mB.y - (L.vert ? 0 : 46), s: FN === "wide" ? 1 : .9, o: E.out3(P(t, 2.8, 3.3)) * (1 - out) });
    put(head, { x: L.head[0], y: L.head[1] });
    hlAt(head, t, .8, 7.0);
  };
  return S;
})();
