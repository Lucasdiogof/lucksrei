"use strict";
/* Cena 4 — vendas e PDV. Painel de venda recriado (não é print): produtos → carrinho, quantidades, desconto, cliente,
   pagamento combinado (Pix + dinheiro) e confirmação "Venda registrada." */
SP.css(`
.s4-pos{width:1240px;height:800px;display:flex;padding:0}
.s4-l{width:600px;padding:28px 28px;border-right:1px solid rgba(110,160,250,.14);position:relative}
.s4-r{flex:1;padding:28px 30px;position:relative;display:flex;flex-direction:column}
.s4-top{display:flex;align-items:center;gap:12px;margin-bottom:18px}
.s4-top h3{font:700 30px 'SP Roboto';letter-spacing:-.01em;flex:1}
.s4-search{display:flex;align-items:center;gap:12px;height:56px;border-radius:12px;background:rgba(6,16,38,.55);border:1px solid rgba(96,165,250,.3);padding:0 16px;color:#E5EDFB;font:400 21px 'SP Roboto';margin-bottom:20px}
.s4-search .ph{color:#7f93b8}
.s4-search .cur{display:inline-block;width:2px;height:24px;background:#60A5FA;margin-left:2px;vertical-align:middle}
.s4-grid{display:grid;grid-template-columns:1fr 1fr;gap:16px}
.s4-tile{position:relative;height:262px;border-radius:18px;background:rgba(96,165,250,.07);border:1px solid rgba(96,165,250,.16);padding:16px;display:flex;flex-direction:column;align-items:center}
.s4-tile .th{width:140px;height:140px}
.s4-tile b{font:500 20px 'SP Roboto';color:#F1F5FF;white-space:nowrap;margin-top:6px}
.s4-tile span{font:700 22px 'SP Roboto';color:#9CC7FF;margin-top:6px;font-variant-numeric:tabular-nums}
.s4-tile .pr{position:absolute;inset:-1px;border-radius:18px;border:2px solid #60A5FA;background:rgba(37,99,235,.14);opacity:0}
.s4-cust{display:flex;align-items:center;gap:14px;height:64px;border-radius:14px;border:1px dashed rgba(148,163,184,.35);padding:0 16px;margin-bottom:16px;font:400 19px 'SP Roboto';color:#8EA3C7;position:relative}
.s4-cust .on{position:absolute;inset:-1px;border-radius:14px;border:1px solid rgba(96,165,250,.45);background:#13295a;display:flex;align-items:center;gap:14px;padding:0 16px;color:#F1F5FF;font:500 20px 'SP Roboto'}
.s4-cust .on span{color:#8EA3C7;font:400 17px 'SP Roboto'}
.s4-lines{position:relative;height:300px}
.s4-ln{position:absolute;left:0;right:0;height:92px;display:flex;align-items:center;gap:16px;border-bottom:1px solid rgba(110,160,250,.12)}
.s4-ln .nm{flex:1;min-width:0}
.s4-ln .nm b{display:block;font:500 21px 'SP Roboto';white-space:nowrap}
.s4-ln .nm span{display:block;margin-top:5px;font:400 16px 'SP Roboto';color:#8EA3C7;font-variant-numeric:tabular-nums}
.s4-step{display:flex;align-items:center;gap:0;height:42px;border-radius:21px;border:1px solid rgba(96,165,250,.3);overflow:hidden}
.s4-step i{width:40px;height:40px;display:flex;align-items:center;justify-content:center;color:#9CC7FF}
.s4-step b{width:40px;text-align:center;font:700 21px 'SP Roboto';font-variant-numeric:tabular-nums}
.s4-ln .tt{width:120px;text-align:right;font:500 22px 'SP Roboto';font-variant-numeric:tabular-nums}
.s4-sum{margin-top:auto;border-top:1px solid rgba(110,160,250,.18);padding-top:16px}
.s4-sum div{display:flex;justify-content:space-between;font:400 19px 'SP Roboto';color:#8EA3C7;margin-bottom:8px;font-variant-numeric:tabular-nums}
.s4-sum div.ds b{color:#86EFAC;font-weight:500}
.s4-sum .tot{align-items:baseline;color:#E5EDFB;font:500 22px 'SP Roboto';margin:10px 0 0}
.s4-sum .tot b{font:700 46px 'SP Roboto';letter-spacing:-.02em;color:#fff}
.s4-pay{position:absolute;left:0;top:0;bottom:0;width:600px;background:linear-gradient(180deg,#152c60,#0f2250);border-right:1px solid rgba(110,160,250,.25);padding:28px;box-shadow:20px 0 60px rgba(0,0,0,.35)}
.s4-pay h3{font:700 30px 'SP Roboto';margin-bottom:6px}
.s4-pay .rc{font:400 19px 'SP Roboto';color:#8EA3C7;margin-bottom:20px}
.s4-pay .rc b{color:#fff;font:700 22px 'SP Roboto'}
.s4-meth{display:grid;grid-template-columns:repeat(5,1fr);gap:10px;margin-bottom:22px}
.s4-meth div{height:86px;border-radius:14px;border:1px solid rgba(96,165,250,.2);background:rgba(96,165,250,.06);display:flex;flex-direction:column;align-items:center;justify-content:center;gap:8px;font:500 16px 'SP Roboto';color:#B6C4DD}
.s4-meth div.on{border-color:#60A5FA;background:rgba(37,99,235,.22);color:#fff}
.s4-pr{display:flex;align-items:center;gap:14px;height:66px;border-radius:14px;background:rgba(6,16,38,.45);border:1px solid rgba(96,165,250,.18);padding:0 18px;margin-bottom:10px;font:500 20px 'SP Roboto'}
.s4-pr .a{margin-left:auto;font:700 22px 'SP Roboto';font-variant-numeric:tabular-nums}
.s4-pst{display:flex;justify-content:space-between;margin:16px 4px 0;font:400 19px 'SP Roboto';color:#8EA3C7;font-variant-numeric:tabular-nums}
.s4-pst b{color:#E5EDFB;font-weight:500}
.s4-btn{position:absolute;left:28px;right:28px;bottom:28px;height:66px;border-radius:14px;background:linear-gradient(180deg,#3B7BFF,#2563EB);display:flex;align-items:center;justify-content:center;gap:12px;font:500 22px 'SP Roboto';color:#fff;box-shadow:0 12px 30px rgba(37,99,235,.45)}
.s4-ok{width:680px;height:480px;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center}
.s4-ok h4{font:700 44px 'SP Roboto';letter-spacing:-.02em;margin-top:26px}
.s4-ok p{font:400 24px 'SP Roboto';color:#B6C4DD;margin-top:12px;font-variant-numeric:tabular-nums}
.s4-ok p.st{display:flex;align-items:center;gap:10px;font-size:21px;color:#9CC7FF}
.s4-ok .cs{display:flex;gap:12px;margin-top:26px}
.s4-tok{width:96px;height:96px;border-radius:20px;background:rgba(37,99,235,.25);border:2px solid #60A5FA;box-shadow:0 0 30px rgba(37,99,235,.6)}
`);
SP.scenes.s04 = (function () {
  const S = { D: 13.0 }; const PR = KIT.PRODUCTS;
  let colL, colR, pos, tiles = [], lines = [], tok = [], cust, sum, subN, dsRow, totN, pay, prs = [], methods, btn, ok, okRing, head, srch, cnt, paidN, remN;
  const CART = [{ id: "cafe", q: 2, t0: 1.7 }, { id: "agua", q: 6, t0: 2.9 }, { id: "caderno", q: 1, t0: 4.0 }];
  S.build = function (root) {
    pos = h(`<div class="pn blk s4-pos"><div class="s4-l"><div class="s4-top"><h3>${DATA.tx("c.new")}</h3><span class="chip gr"><i></i>${DATA.tx("c.open")}</span></div>
      <div class="s4-search">${KIT.ico("scan", 24, "#60A5FA")}<span class="q"></span><span class="cur"></span><span class="ph">${DATA.tx("p.search")}</span></div>
      <div class="s4-grid">${["cafe", "agua", "caderno", "sabao"].map(id => `<div class="s4-tile" data-id="${id}"><div class="pr"></div><div class="th"></div><b>${PR[id].name}</b><span>${brl(PR[id].price)}</span></div>`).join("")}</div>
      <div class="s4-pay"><h3>${DATA.tx("c.pay")}</h3><div class="rc">${DATA.tx("c.charge")} <b>${brl(DATA.SALE.total)}</b></div>
        <div class="s4-meth">${[["cash", DATA.tx("c.cash")], ["pix", "Pix"], ["card", DATA.tx("c.debit")], ["card", DATA.tx("c.credit")], ["wallet", DATA.tx("c.other")]].map(m => `<div>${KIT.ico(m[0], 26)}${m[1]}</div>`).join("")}</div>
        <div class="s4-pr">${KIT.ico("pix", 24, "#60A5FA")}Pix<span class="a">${brl(DATA.SALE.pay[0].v)}</span></div>
        <div class="s4-pr">${KIT.ico("cash", 24, "#60A5FA")}${DATA.tx("c.cash")}<span class="a">${brl(DATA.SALE.pay[1].v)}</span></div>
        <div class="s4-pst"><span>${DATA.tx("c.paid")} <b class="pd">R$ 0,00</b></span><span>${DATA.tx("c.short")} <b class="rm">${brl(DATA.SALE.total)}</b></span><span>${DATA.tx("c.change")} <b>R$ 0,00</b></span></div>
        <div class="s4-btn">${KIT.ico("check", 26, "#fff", 2.4)}${DATA.tx("c.confirm")}</div></div></div>
      <div class="s4-r"><div class="s4-top"><h3>${DATA.tx("c.cart")}</h3><span class="chip sl cnt">${DATA.tx("c.items", { n: 0 })}</span></div>
        <div class="s4-cust">${KIT.ico("user", 24)}${DATA.tx("c.nocust")}<div class="on">${KIT.avatar("MS", "#2563EB", 40)}<div>Mariana Souza<br><span>${DATA.tx("c.cust", { n: 12 })}</span></div></div></div>
        <div class="s4-lines">${CART.map(c => `<div class="s4-ln"><div class="nm"><b>${PR[c.id].name}</b><span>${brl(PR[c.id].price)} ${DATA.tx("c.per")}</span></div><div class="s4-step"><i>${KIT.ico("minus", 18)}</i><b>1</b><i>${KIT.ico("plus", 18)}</i></div><div class="tt">R$ 0,00</div></div>`).join("")}</div>
        <div class="s4-sum"><div><span>${DATA.tx("c.subtotal")}</span><b class="sb">R$ 0,00</b></div><div class="ds"><span>${DATA.tx("c.discount")}</span><b>${brl(-DATA.SALE.discount)}</b></div><div class="tot"><span>${DATA.tx("c.total")}</span><b class="to">R$ 0,00</b></div></div></div></div>`);
    root.appendChild(pos);
    colL = $(".s4-l", pos); colR = $(".s4-r", pos); tiles = $$(".s4-tile", pos); tiles.forEach(t => $(".th", t).appendChild(KIT.productThumb(t.dataset.id, 140)));
    lines = $$(".s4-ln", pos); cust = $(".s4-cust .on", pos); subN = $(".sb", pos); dsRow = $(".ds", pos); totN = $(".to", pos);
    pay = $(".s4-pay", pos); prs = $$(".s4-pr", pos); methods = $$(".s4-meth div", pos); btn = $(".s4-btn", pos); srch = $(".s4-search", pos); cnt = $(".cnt", pos);
    paidN = $(".pd", pos); remN = $(".rm", pos);
    CART.forEach(c => { const e = h(`<div class="blk"></div>`); e.style.width = e.style.height = "110px"; e.appendChild(KIT.productThumb(c.id, 110)); root.appendChild(e); tok.push(e); });
    ok = h(`<div class="pn blk s4-ok"><svg width="150" height="150" viewBox="0 0 150 150"><circle cx="75" cy="75" r="66" fill="rgba(22,163,74,.16)" stroke="#4ADE80" stroke-width="5" pathLength="1" stroke-dasharray="1 1" class="rg"/><path d="M46 77l20 20 40-42" fill="none" stroke="#4ADE80" stroke-width="9" stroke-linecap="round" stroke-linejoin="round" pathLength="1" stroke-dasharray="1 1" class="ck"/></svg>
      <h4>${DATA.tx("c.done")}</h4><p>${DATA.tx("c.doneLine", { n: DATA.SALE.n, itens: 9, valor: brl(DATA.SALE.total) })}</p><p class="st">${KIT.ico("package", 20, "#9CC7FF")} ${DATA.tx("c.stockUpd", { produto: DATA.tx("prod.coffeeShort"), a: DATA.stockAfter("cafe", DATA.SALE_IDX), b: DATA.stockAfter("cafe", DATA.SALE_IDX + 1) })}</p><div class="cs"><span class="chip">${KIT.ico("receipt", 18)}${DATA.tx("c.pdf")}</span><span class="chip sl">Pix + ${DATA.tx("c.cash")}</span></div></div>`);
    root.appendChild(ok); okRing = [$(".rg", ok), $(".ck", ok)];
    head = hl(DATA.txl("h.pos"), "", { accent: 1 }); head.style.fontSize = pick({ wide: 64, sq: 58, tall: 80 }) + "px"; head.style.textAlign = pick({ wide: "left", sq: "center", tall: "center" }); root.appendChild(head);
  };
  // câmera sobre o painel: no 16:9 o painel inteiro; no 1:1 e no 9:16 a câmera se aproxima da coluna que importa
  // (produtos → carrinho → pagamento) para os textos ficarem legíveis no celular. Colunas: esquerda −320, direita +300.
  const LEFT = -320, RIGHT = 300;
  const POSE = () => pick({
    wide: [[0, 1330, 560, .82, -14], [5.8, 1330, 560, .82, -14], [7.0, 960, 545, 1.04, 0]],
    sq: [[0, 540 - LEFT * 1.0, 600, 1.0, 0, 0], [4.5, 540 - LEFT * 1.0, 600, 1.0, 0, 0], [5.4, 540 - RIGHT * 1.08, 600, 1.08, 0, 1], [6.4, 540 - RIGHT * 1.08, 600, 1.08, 0, 1], [7.2, 540 - LEFT * 1.02, 600, 1.02, 0, 0]],
    tall: [[0, 540 - LEFT * 1.3, 1150, 1.3, 0, 0], [4.5, 540 - LEFT * 1.3, 1150, 1.3, 0, 0], [5.4, 540 - RIGHT * 1.42, 1150, 1.42, 0, 1], [6.4, 540 - RIGHT * 1.42, 1150, 1.42, 0, 1], [7.2, 540 - LEFT * 1.36, 1150, 1.36, 0, 0]],
  });
  const OK = () => pick({ wide: [960, 545, 1.05], sq: [540, 600, 1.1], tall: [540, 1150, 1.45] });
  const HEAD = () => pick({ wide: [110, 330], sq: [540, 135], tall: [540, 330] });
  S.render = function (t) {
    const PS = POSE(), key = (j) => kf(t, PS.map(k => [k[0], k[j]]), E.io5);
    const pin = E.out4(P(t, .6, 1.8)), out = E.in3(P(t, 11.8, 12.5));
    const okP = E.io3(P(t, 9.0, 9.7));
    const px = key(1), py = key(2), ps = key(3), ryK = key(4);
    const ry = ryK * pin + (1 - pin) * (FN === "wide" ? -30 : -14);
    // fora do 16:9 a coluna fora de foco esmaece (não fica um pedaço de interface cortado na borda)
    if (FN !== "wide") { const fr = key(5); setS(colL, "opacity", (.1 + .9 * (1 - fr)).toFixed(3)); setS(colR, "opacity", (.1 + .9 * fr).toFixed(3)); }
    put(pos, { x: px + (1 - pin) * 80, y: py, s: ps * (1 - okP * .05), ry, rx: (1 - pin) * 6, z: -okP * 120, o: pin * (1 - out) * (1 - okP * .6), b: okP * 4 });
    // busca: "Café" digitado
    const typed = "Café"; const nT = Math.floor(cl(P(t, 1.0, 1.5)) * 4) * (t < 2.6 ? 1 : 0);
    setT($(".q", srch), typed.slice(0, nT)); setS($(".ph", srch), "display", nT ? "none" : ""); setS($(".cur", srch), "opacity", (Math.floor(t * 2.5) % 2 ? 1 : .2).toString());
    // toque nos cards e voo até o carrinho
    const panelW = 1240 * ps, panelH = 800 * ps, ox = px - panelW / 2, oy = py - panelH / 2;
    let items = 0, sub = 0;   // centavos inteiros
    CART.forEach((c, i) => {
      const ti = tiles.find(x => x.dataset.id === c.id), tIdx = tiles.indexOf(ti);
      const press = Math.sin(Math.PI * P(t, c.t0 - .25, c.t0 + .15)); setS($(".pr", ti), "opacity", (press * .9 + (t > c.t0 && t < c.t0 + .6 ? .1 : 0)).toFixed(3)); setS(ti, "transform", `scale(${(1 - press * .04).toFixed(4)})`);
      const sx = ox + (28 + (tIdx % 2) * 288 + 136) * ps, sy = oy + (28 + 62 + 76 + Math.floor(tIdx / 2) * 278 + 86) * ps;
      const ex = ox + (600 + 30 + 40) * ps, ey = oy + (28 + 62 + 80 + i * 92 + 46) * ps;
      const f = P(t, c.t0, c.t0 + .7), fe = E.io3(f);
      put(tok[i], { x: lerp(sx, ex, fe), y: lerp(sy, ey, fe) - Math.sin(fe * Math.PI) * 120 * ps, s: lerp(1.15, .45, fe) * ps, z: 60, o: f > 0 && f < 1 ? Math.min(1, f * 6, (1 - f) * 5) : 0 });
      // linha do carrinho; a quantidade sobe em degraus e cada valor exibido é preço × quantidade
      const la = E.out4(P(t, c.t0 + .55, c.t0 + 1.0));
      setS(lines[i], "transform", `translateY(${(i * 92 + (1 - la) * 16).toFixed(1)}px)`); setS(lines[i], "opacity", la.toFixed(3));
      const q = la > 0 ? Math.min(c.q, 1 + Math.floor(Math.max(0, t - (c.t0 + 1.0)) / .16)) : 0;
      setT($(".s4-step b", lines[i]), String(q || 1)); setT($(".tt", lines[i]), brl(PR[c.id].price * (q || 1)));
      if (la > .5) { items += q; sub += PR[c.id].price * q; }
    });
    setT(cnt, items === 1 ? DATA.tx("c.item1") : DATA.tx("c.items", { n: items })); setT(subN, brl(sub));
    // desconto aplicado de uma vez: o total só mostra valores exatos (subtotal, depois subtotal − desconto)
    const dOn = t >= 5.3, dsa = E.out3(P(t, 5.3, 5.6)); setS(dsRow, "opacity", (.25 + .75 * dsa).toFixed(3));
    setT(totN, brl(sub - (dOn ? DATA.SALE.discount : 0)));
    const tp = Math.sin(Math.PI * P(t, 5.3, 5.9)); setS(totN, "textShadow", tp > .01 ? `0 0 ${(24 * tp).toFixed(1)}px rgba(96,165,250,${(.8 * tp).toFixed(2)})` : "");
    const ca = E.out4(P(t, 4.6, 5.1)); setS(cust, "opacity", ca.toFixed(3)); setS(cust, "transform", `translateY(${((1 - ca) * 10).toFixed(1)}px)`);
    // pagamento combinado
    const pa = E.io5(P(t, 6.6, 7.4)); setS(pay, "transform", `translateY(${((1 - pa) * 105).toFixed(2)}%)`); setS(pay, "opacity", pa > .002 ? "1" : "0");
    const m1 = t >= 7.6, m2 = t >= 8.1; methods.forEach((m, i) => m.classList.toggle("on", (i === 1 && m1) || (i === 0 && m2)));
    prs.forEach((r, i) => { const a = E.out3(P(t, 7.7 + i * .5, 8.1 + i * .5)); setS(r, "opacity", a.toFixed(3)); setS(r, "transform", `translateX(${((1 - a) * 20).toFixed(1)}px)`); });
    const paid = DATA.SALE.pay.reduce((s2, p2, i) => s2 + (t >= 7.8 + i * .5 ? p2.v : 0), 0); setT(paidN, brl(paid)); setT(remN, brl(DATA.SALE.total - paid));
    const bp = Math.sin(Math.PI * P(t, 8.7, 9.0)); setS(btn, "transform", `scale(${(1 - bp * .04).toFixed(4)})`); setS(btn, "filter", bp > .01 ? `brightness(${(1 + bp * .25).toFixed(3)})` : "");
    // confirmação: entra, fica e sai no mesmo lugar
    const O = OK(), oi = E.out4(P(t, 9.35, 9.95)), oo = E.in3(P(t, 11.5, 12.2));
    put(ok, { x: O[0], y: O[1] + (1 - oi) * 24, s: O[2] * lerp(.94, 1, oi) * lerp(1, .96, oo), z: 80, o: oi * (1 - oo) });
    setS(okRing[0], "strokeDashoffset", (1 - E.out3(P(t, 9.2, 9.9))).toFixed(3)); setS(okRing[1], "strokeDashoffset", (1 - E.out3(P(t, 9.6, 10.1))).toFixed(3));
    const H = HEAD(); put(head, { x: H[0] + (FN === "wide" ? (head._w || head.offsetWidth) / 2 : 0), y: H[1] });
    hlAt(head, t, .8, FN === "wide" ? 5.6 : 8.6);
  };
  return S;
})();
