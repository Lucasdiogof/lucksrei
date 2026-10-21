"use strict";
/* Cena 5 — caixa. A venda (parte em dinheiro) entra na gaveta; trilho de movimentos (abertura, venda, suprimento, sangria),
   esperado na gaveta, fechamento com contado e diferença. Sem conciliação bancária. */
SP.css(`
.s5-p{width:1180px;height:700px;display:flex}
.s5-l{width:600px;padding:30px 32px;position:relative;border-right:1px solid rgba(110,160,250,.14)}
.s5-r{flex:1;padding:30px 32px;position:relative}
.s5-hd{display:flex;align-items:center;gap:12px;margin-bottom:26px}
.s5-hd h3{font:700 30px 'SP Roboto';flex:1}
.s5-st{position:relative;height:36px;width:150px}
.s5-st span{position:absolute;right:0;top:0}
.s5-rail{position:absolute;left:62px;top:122px;width:3px;height:430px;background:rgba(148,163,184,.18);border-radius:2px}
.s5-rail i{position:absolute;left:0;top:0;width:3px;border-radius:2px;background:linear-gradient(180deg,#60A5FA,#1E6CFF);box-shadow:0 0 12px rgba(96,165,250,.8)}
.s5-mv{position:absolute;left:32px;right:32px;height:96px;display:flex;align-items:center;gap:18px}
.s5-mv .n{width:64px;height:64px;border-radius:50%;flex:none;display:flex;align-items:center;justify-content:center;background:#10224b;border:2px solid rgba(148,163,184,.3);position:relative;z-index:1}
.s5-mv .n.on{border-color:#60A5FA;box-shadow:0 0 22px rgba(37,99,235,.6)}
.s5-mv .nm{flex:1}
.s5-mv .nm b{display:block;font:500 22px 'SP Roboto'}
.s5-mv .nm span{display:block;margin-top:5px;font:400 17px 'SP Roboto';color:#8EA3C7}
.s5-mv .a{font:700 24px 'SP Roboto';font-variant-numeric:tabular-nums}
.s5-big span{font:500 16px 'SP Roboto';letter-spacing:.14em;text-transform:uppercase;color:#8EA3C7}
.s5-big b{display:block;margin-top:10px;font:700 76px/1 'SP Roboto';letter-spacing:-.03em;font-variant-numeric:tabular-nums}
.s5-kv{margin-top:30px}
.s5-kv div{display:flex;justify-content:space-between;height:52px;align-items:center;border-bottom:1px solid rgba(110,160,250,.12);font:400 20px 'SP Roboto';color:#9fb2d3;font-variant-numeric:tabular-nums}
.s5-kv div b{color:#E5EDFB;font-weight:500}
.s5-close{position:absolute;inset:0;padding:30px 32px;background:linear-gradient(180deg,#152c60,#0f2250)}
.s5-close h3{font:700 30px 'SP Roboto';margin-bottom:24px}
.s5-close .row{display:flex;justify-content:space-between;align-items:center;height:76px;border-radius:14px;background:rgba(6,16,38,.45);border:1px solid rgba(96,165,250,.18);padding:0 20px;margin-bottom:12px;font:400 21px 'SP Roboto';color:#9fb2d3;font-variant-numeric:tabular-nums}
.s5-close .row b{font:700 28px 'SP Roboto';color:#fff}
.s5-close .row.ok{border-color:rgba(74,222,128,.45);background:rgba(22,163,74,.12)}
.s5-close .row.ok b{color:#86EFAC}
.s5-close .hist{margin-top:22px;display:flex;align-items:center;gap:14px;font:400 18px 'SP Roboto';color:#8EA3C7}
.s5-tok{display:flex;align-items:center;gap:12px;height:62px;padding:0 22px 0 12px;border-radius:31px;background:#163470;border:1px solid #60A5FA;font:500 21px 'SP Roboto';color:#fff;white-space:nowrap;box-shadow:0 0 40px rgba(37,99,235,.55)}
.s5-tok .c{width:40px;height:40px;border-radius:50%;background:#16A34A;display:flex;align-items:center;justify-content:center}
`);
SP.scenes.s05 = (function () {
  const S = { D: 9.8 };
  let pnl, rail, mvs = [], nodes = [], big, kv = [], close, cRows = [], chipO, chipC, tok, head;
  const MV = [
    { ic: "clock", nm: "Abertura", sb: "08:02 · valor inicial", a: 200, c: "#E5EDFB", t: .9 },
    { ic: "receipt", nm: "Venda #1048", sb: "10:41 · parte em dinheiro", a: 30, c: "#86EFAC", t: 2.0 },
    { ic: "plus", nm: "Suprimento", sb: "13:15 · reforço de troco", a: 100, c: "#86EFAC", t: 3.0 },
    { ic: "minus", nm: "Sangria", sb: "16:20 · retirada", a: -150, c: "#FCA5A5", t: 3.9 },
  ];
  S.build = function (root) {
    pnl = h(`<div class="pn blk s5-p"><div class="s5-l"><div class="s5-hd"><h3>Movimentos do caixa</h3></div><div class="s5-rail"><i></i></div>
      ${MV.map(m => `<div class="s5-mv"><div class="n">${KIT.ico(m.ic, 26, "#9CC7FF", 2)}</div><div class="nm"><b>${m.nm}</b><span>${m.sb}</span></div><div class="a" style="color:${m.c}">${m.a > 0 ? "+" : "−"} ${fmtBRL(Math.abs(m.a))}</div></div>`).join("")}</div>
      <div class="s5-r"><div class="s5-hd"><h3>Caixa</h3><div class="s5-st"><span class="chip gr o"><i></i>Aberto</span><span class="chip sl c">${KIT.ico("lock", 16)}Fechado</span></div></div>
        <div class="s5-big"><span>Esperado na gaveta</span><b class="v">R$ 0,00</b></div>
        <div class="s5-kv"><div><span>Abertura</span><b>R$ 200,00</b></div><div><span>Vendas em dinheiro</span><b>R$ 30,00</b></div><div><span>Suprimentos</span><b>R$ 100,00</b></div><div><span>Sangrias</span><b>− R$ 150,00</b></div></div>
        <div class="s5-close"><h3>Fechar caixa</h3><div class="row"><span>Esperado na gaveta</span><b>R$ 180,00</b></div><div class="row"><span>Contado</span><b class="ct">R$ 0,00</b></div><div class="row ok"><span>Diferença</span><b>R$ 0,00</b></div>
          <div class="hist">${KIT.ico("check", 22, "#4ADE80", 2.4)}Caixa fechado às 18:30 · salvo no histórico</div></div></div></div>`);
    root.appendChild(pnl);
    rail = $(".s5-rail i", pnl); mvs = $$(".s5-mv", pnl); nodes = $$(".s5-mv .n", pnl); big = $(".s5-big .v", pnl); kv = $$(".s5-kv div", pnl);
    close = $(".s5-close", pnl); cRows = [...$$(".row", close), $(".hist", close)]; chipO = $(".s5-st .o", pnl); chipC = $(".s5-st .c", pnl);
    tok = h(`<div class="blk s5-tok"><div class="c">${KIT.ico("check", 22, "#fff", 2.6)}</div>Venda #1048 · Dinheiro R$ 30,00</div>`); root.appendChild(tok);
    head = hl(["Seu caixa, sempre organizado."], "", {}); head.style.fontSize = pick({ wide: 76, sq: 60, tall: 66 }) + "px"; head.style.textAlign = "center"; root.appendChild(head);
    if (FN !== "wide") { head.remove(); head = hl(["Seu caixa,", "sempre organizado."], "", { accent: 1 }); head.style.fontSize = pick({ wide: 76, sq: 64, tall: 76 }) + "px"; head.style.textAlign = "center"; root.appendChild(head); }
  };
  const LY = () => pick({ wide: { p: [960, 610, .84], head: [960, 150] }, sq: { p: [540, 650, .78], head: [540, 150] }, tall: { p: [540, 1150, .82], head: [540, 480] } });
  S.render = function (t) {
    const L = LY();
    const pin = E.out4(P(t, .5, 1.5)), out = E.in3(P(t, 8.7, 9.5));
    put(pnl, { x: L.p[0], y: L.p[1] + (1 - pin) * 50, s: L.p[2] * lerp(.95, 1, pin) * (1 + out * .04), rx: (1 - pin) * 12, o: pin * (1 - out) });
    // movimentos entram em sequência; o trilho acende até cada nó
    MV.forEach((m, i) => {
      const a = E.out4(P(t, m.t, m.t + .6)); setS(mvs[i], "top", (108 + i * 116) + "px"); setS(mvs[i], "opacity", (.18 + .82 * a).toFixed(3));
      nodes[i].classList.toggle("on", a > .3);
    });
    setS(rail, "height", (kf(t, MV.map((m, i) => [m.t + .3, i * 116 + 30])) * (t > .9 ? 1 : 0)).toFixed(1) + "px");
    // esperado: anima rápido a cada movimento
    let v = 0; MV.forEach(m => { v += m.a * E.out3(P(qt(t), m.t + .2, m.t + .8)); });
    setT(big, fmtBRL(v));
    kv.forEach((k, i) => setS(k, "opacity", E.out3(P(t, MV[i].t + .2, MV[i].t + .7)).toFixed(3)));
    // token da venda chega da esquerda até o nó 2
    const ps = L.p[2], ox = L.p[0] - 590 * ps, oy = L.p[1] - 350 * ps;
    const nx = ox + (32 + 32) * ps, ny = oy + (108 + 116 + 48) * ps;
    const f = P(t, .9, 2.0), fe = E.io3(f);
    put(tok, { x: lerp(FN === "wide" ? -200 : L.p[0], nx + 220 * ps, fe), y: lerp(FN === "wide" ? ny - 120 : oy - 120, ny, fe), s: lerp(1, .6, E.in2(P(t, 1.7, 2.1))) * ps * 1.15, z: 50, o: cl(f * 5) * (1 - E.in2(P(t, 1.85, 2.15))) });
    // fechamento
    const ci = E.io5(P(t, 5.3, 6.1)); setS(close, "transform", `translateX(${((1 - ci) * 105).toFixed(2)}%)`); setS(close, "opacity", ci > .002 ? "1" : "0");
    cRows.forEach((r, i) => setS(r, "opacity", E.out3(P(t, 6.0 + i * .35, 6.5 + i * .35)).toFixed(3)));
    setT($(".ct", close), fmtBRL(180 * E.out3(P(qt(t), 6.4, 7.1))));
    const cc = E.io3(P(t, 7.4, 7.8)); setS(chipO, "opacity", (1 - cc).toFixed(3)); setS(chipC, "opacity", cc.toFixed(3));
    put(head, { x: L.head[0], y: L.head[1] });
    hlAt(head, t, .5, 8.9);
  };
  return S;
})();
