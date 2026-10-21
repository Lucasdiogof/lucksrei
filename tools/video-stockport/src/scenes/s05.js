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
.s5-mv .nm b{display:block;font:500 25px 'SP Roboto'}
.s5-mv .nm span{display:block;margin-top:5px;font:400 19px 'SP Roboto';color:#9fb2d3}
.s5-mv .a{font:700 27px 'SP Roboto';font-variant-numeric:tabular-nums}
.s5-big span{font:500 18px 'SP Roboto';letter-spacing:.14em;text-transform:uppercase;color:#8EA3C7}
.s5-big b{display:block;margin-top:10px;font:700 84px/1 'SP Roboto';letter-spacing:-.03em;font-variant-numeric:tabular-nums}
.s5-kv{margin-top:30px}
.s5-kv div{display:flex;justify-content:space-between;height:56px;align-items:center;border-bottom:1px solid rgba(110,160,250,.12);font:400 22px 'SP Roboto';color:#9fb2d3;font-variant-numeric:tabular-nums}
.s5-kv div b{color:#E5EDFB;font-weight:500}
.s5-close{position:absolute;left:32px;right:32px;top:100px}
.s5-open{position:absolute;left:32px;right:32px;top:100px}
.s5-close h4{font:500 18px 'SP Roboto';letter-spacing:.14em;text-transform:uppercase;color:#8EA3C7;margin-bottom:18px}
.s5-close .row{display:flex;justify-content:space-between;align-items:center;height:76px;border-radius:14px;background:rgba(6,16,38,.45);border:1px solid rgba(96,165,250,.18);padding:0 20px;margin-bottom:12px;font:400 22px 'SP Roboto';color:#9fb2d3;font-variant-numeric:tabular-nums}
.s5-close .row b{font:700 30px 'SP Roboto';color:#fff}
.s5-close .row.ok{border-color:rgba(74,222,128,.45);background:rgba(22,163,74,.12)}
.s5-close .row.ok b{color:#86EFAC}
.s5-close .hist{margin-top:22px;display:flex;align-items:center;gap:14px;font:400 20px 'SP Roboto';color:#8EA3C7}
.s5-tok{display:flex;align-items:center;gap:12px;height:62px;padding:0 22px 0 12px;border-radius:31px;background:#163470;border:1px solid #60A5FA;font:500 21px 'SP Roboto';color:#fff;white-space:nowrap;box-shadow:0 0 40px rgba(37,99,235,.55)}
.s5-tok .c{width:40px;height:40px;border-radius:50%;background:#16A34A;display:flex;align-items:center;justify-content:center}
`);
SP.scenes.s05 = (function () {
  const S = { D: 10.4 };
  let colL, colR, pnl, rail, mvs = [], nodes = [], big, kv = [], open, close, cRows = [], chipO, chipC, tok, head;
  const C = DATA.CASH;
  // movimentos do dia (centavos); o esperado na gaveta muda em degraus, sempre com o valor exato após cada movimento
  const MV = [
    { ic: "clock", nm: "Abertura", sb: "08:02 · valor inicial", a: C.opening, c: "#E5EDFB", t: 1.2 },
    { ic: "receipt", nm: "Vendas em dinheiro", sb: `${C.cashSales.length} vendas · inclui a #${DATA.SALE.n}`, a: C.cashSalesTotal, c: "#86EFAC", t: 2.4 },
    { ic: "plus", nm: "Suprimento", sb: "13:15 · reforço de troco", a: C.supply, c: "#86EFAC", t: 3.4 },
    { ic: "minus", nm: "Sangria", sb: "16:20 · retirada", a: -C.withdrawal, c: "#FCA5A5", t: 4.3 },
  ];
  S.build = function (root) {
    pnl = h(`<div class="pn blk s5-p"><div class="s5-l"><div class="s5-hd"><h3>Movimentos do caixa</h3></div><div class="s5-rail"><i></i></div>
      ${MV.map(m => `<div class="s5-mv"><div class="n">${KIT.ico(m.ic, 26, "#9CC7FF", 2)}</div><div class="nm"><b>${m.nm}</b><span>${m.sb}</span></div><div class="a" style="color:${m.c}">${brl(m.a, true)}</div></div>`).join("")}</div>
      <div class="s5-r"><div class="s5-hd"><h3>Caixa</h3><div class="s5-st"><span class="chip gr o"><i></i>Aberto</span><span class="chip sl c">${KIT.ico("lock", 16)}Fechado</span></div></div>
        <div class="s5-open"><div class="s5-big"><span>Esperado na gaveta</span><b class="v">${brl(0)}</b></div>
        <div class="s5-kv">${MV.map(m => `<div><span>${m.nm}</span><b>${brl(m.a)}</b></div>`).join("")}</div></div>
        <div class="s5-close"><h4>Fechamento do caixa</h4><div class="row"><span>Esperado na gaveta</span><b>${brl(C.expected)}</b></div><div class="row"><span>Contado</span><b>${brl(C.counted)}</b></div><div class="row ok"><span>Diferença</span><b>${brl(C.diff)}</b></div>
          <div class="hist">${KIT.ico("check", 22, "#4ADE80", 2.4)}Caixa fechado às 18:30 · salvo no histórico</div></div></div></div>`);
    root.appendChild(pnl);
    colL = $(".s5-l", pnl); colR = $(".s5-r", pnl); rail = $(".s5-rail i", pnl); mvs = $$(".s5-mv", pnl); nodes = $$(".s5-mv .n", pnl); big = $(".s5-big .v", pnl); kv = $$(".s5-kv div", pnl);
    open = $(".s5-open", pnl); close = $(".s5-close", pnl); cRows = [$("h4", close), ...$$(".row", close), $(".hist", close)]; chipO = $(".s5-st .o", pnl); chipC = $(".s5-st .c", pnl);
    tok = h(`<div class="blk s5-tok"><div class="c">${KIT.ico("check", 22, "#fff", 2.6)}</div>Venda #${DATA.SALE.n} · Dinheiro ${brl(DATA.SALE.cash)}</div>`); root.appendChild(tok);
    head = hl(FN === "wide" ? ["Controle cada movimentação do caixa."] : ["Controle cada", "movimentação do caixa."], "", { accent: FN === "wide" ? -1 : 1 });
    head.style.fontSize = pick({ wide: 70, sq: 62, tall: 80 }) + "px"; head.style.textAlign = "center"; root.appendChild(head);
  };
  // câmera: 16:9 painel inteiro; 1:1 e 9:16 aproximam da coluna de movimentos e depois do fechamento
  const LEFTC = -290, RIGHTC = 300;
  const POSE = () => pick({
    wide: [[0, 960, 615, 1.0]],
    sq: [[0, 540 - LEFTC * 1.12, 620, 1.12, 0], [5.4, 540 - LEFTC * 1.12, 620, 1.12, 0], [6.2, 540 - RIGHTC * 1.12, 620, 1.12, 1]],
    tall: [[0, 540 - LEFTC * 1.55, 1130, 1.55, 0], [5.4, 540 - LEFTC * 1.55, 1130, 1.55, 0], [6.2, 540 - RIGHTC * 1.55, 1130, 1.55, 1]],
  });
  const HEAD = () => pick({ wide: [960, 150], sq: [540, 135], tall: [540, 400] });
  S.render = function (t) {
    const PS = POSE(), key = j => PS.length > 1 ? kf(t, PS.map(k => [k[0], k[j]]), E.io5) : PS[0][j];
    const px = key(1), py = key(2), ps = key(3);
    if (FN !== "wide") { const fr = key(4); setS(colL, "opacity", (.1 + .9 * (1 - fr)).toFixed(3)); setS(colR, "opacity", (.1 + .9 * fr).toFixed(3)); }
    const pin = E.out4(P(t, .6, 1.6)), out = E.in3(P(t, 9.2, 9.9));
    put(pnl, { x: px, y: py + (1 - pin) * 50, s: ps * lerp(.96, 1, pin), rx: (1 - pin) * 12, o: pin * (1 - out) });
    // movimentos entram em sequência; o trilho acende até cada nó; o esperado troca em degraus
    let v = 0;
    MV.forEach((m, i) => {
      const a = E.out4(P(t, m.t, m.t + .6)); setS(mvs[i], "top", (108 + i * 116) + "px"); setS(mvs[i], "opacity", (.18 + .82 * a).toFixed(3));
      nodes[i].classList.toggle("on", a > .3); if (t >= m.t + .3) v += m.a;
      setS(kv[i], "opacity", E.out3(P(t, m.t + .3, m.t + .7)).toFixed(3));
    });
    setS(rail, "height", (kf(t, MV.map((m, i) => [m.t + .3, i * 116 + 30])) * (t > MV[0].t ? 1 : 0)).toFixed(1) + "px");
    setT(big, brl(v));
    const pulse = Math.max(...MV.map(m => Math.sin(Math.PI * P(t, m.t + .3, m.t + .9))));
    setS(big, "textShadow", pulse > .01 ? `0 0 ${(26 * pulse).toFixed(1)}px rgba(96,165,250,${(.7 * pulse).toFixed(2)})` : "");
    // a venda #1048 (parte em dinheiro) chega e entra nas vendas em dinheiro
    const ox = px - 590 * ps, oy = py - 350 * ps, nx = ox + 64 * ps, ny = oy + (108 + 116 + 48) * ps;
    const f = P(t, 1.3, 2.5), fe = E.io3(f);
    put(tok, { x: lerp(FN === "wide" ? 220 : 540, nx + 230 * ps, fe), y: lerp(FN === "wide" ? ny - 160 : Math.min(FMT.H - 120, oy + 700 * ps + 80), ny, fe), s: lerp(1, .6, E.in2(P(t, 2.2, 2.6))) * Math.min(ps, 1.2) * 1.1, z: 50, o: cl(f * 5) * (1 - E.in2(P(t, 2.35, 2.65))) });
    // fechamento: o conteúdo do caixa aberto sai antes de o fechamento entrar (sem sobreposição)
    const oo = E.in2(P(t, 5.8, 6.3)); setS(open, "opacity", (1 - oo).toFixed(3)); setS(open, "transform", `translateY(${(-oo * 16).toFixed(1)}px)`);
    cRows.forEach((r, i) => { const a = E.out3(P(t, 6.4 + i * .3, 6.9 + i * .3)); setS(r, "opacity", a.toFixed(3)); setS(r, "transform", `translateY(${((1 - a) * 14).toFixed(1)}px)`); });
    const cc = E.io3(P(t, 8.2, 8.6)); setS(chipO, "opacity", (1 - cc).toFixed(3)); setS(chipC, "opacity", cc.toFixed(3));
    const H = HEAD(); put(head, { x: H[0], y: H[1] });
    hlAt(head, t, .6, 9.1);
  };
  return S;
})();
