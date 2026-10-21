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
.s4-ok{width:620px;height:430px;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center}
.s4-ok h4{font:700 44px 'SP Roboto';letter-spacing:-.02em;margin-top:26px}
.s4-ok p{font:400 22px 'SP Roboto';color:#9fb2d3;margin-top:10px;font-variant-numeric:tabular-nums}
.s4-ok .cs{display:flex;gap:12px;margin-top:26px}
.s4-tok{width:96px;height:96px;border-radius:20px;background:rgba(37,99,235,.25);border:2px solid #60A5FA;box-shadow:0 0 30px rgba(37,99,235,.6)}
`);
SP.scenes.s04 = (function () {
  const S = { D: 12.6 }; const PR = KIT.PRODUCTS;
  let pos, tiles = [], lines = [], tok = [], cust, sum, subN, dsRow, totN, pay, prs = [], methods, btn, ok, okRing, head, srch, cnt, paidN, remN;
  const CART = [{ id: "cafe", q: 2, t0: 1.7 }, { id: "agua", q: 6, t0: 2.9 }, { id: "caderno", q: 1, t0: 4.0 }];
  S.build = function (root) {
    pos = h(`<div class="pn blk s4-pos"><div class="s4-l"><div class="s4-top"><h3>Nova venda</h3><span class="chip gr"><i></i>Caixa aberto</span></div>
      <div class="s4-search">${KIT.ico("scan", 24, "#60A5FA")}<span class="q"></span><span class="cur"></span><span class="ph">Buscar produto ou ler código de barras</span></div>
      <div class="s4-grid">${["cafe", "agua", "caderno", "sabao"].map(id => `<div class="s4-tile" data-id="${id}"><div class="pr"></div><div class="th"></div><b>${PR[id].name}</b><span>${fmtBRL(PR[id].price)}</span></div>`).join("")}</div>
      <div class="s4-pay"><h3>Pagamento</h3><div class="rc">Receber <b>R$ 70,00</b></div>
        <div class="s4-meth">${[["cash", "Dinheiro"], ["pix", "Pix"], ["card", "Débito"], ["card", "Crédito"], ["wallet", "Outro"]].map(m => `<div>${KIT.ico(m[0], 26)}${m[1]}</div>`).join("")}</div>
        <div class="s4-pr">${KIT.ico("pix", 24, "#60A5FA")}Pix<span class="a">R$ 40,00</span></div>
        <div class="s4-pr">${KIT.ico("cash", 24, "#60A5FA")}Dinheiro<span class="a">R$ 30,00</span></div>
        <div class="s4-pst"><span>Pago <b class="pd">R$ 0,00</b></span><span>Falta <b class="rm">R$ 70,00</b></span><span>Troco <b>R$ 0,00</b></span></div>
        <div class="s4-btn">${KIT.ico("check", 26, "#fff", 2.4)}Confirmar venda</div></div></div>
      <div class="s4-r"><div class="s4-top"><h3>Carrinho</h3><span class="chip sl cnt">0 itens</span></div>
        <div class="s4-cust">${KIT.ico("user", 24)}Sem cliente (toque para escolher)<div class="on">${KIT.avatar("MS", "#2563EB", 40)}<div>Mariana Souza<br><span>Cliente · 12 compras</span></div></div></div>
        <div class="s4-lines">${CART.map(c => `<div class="s4-ln"><div class="nm"><b>${PR[c.id].name}</b><span>${fmtBRL(PR[c.id].price)} / un.</span></div><div class="s4-step"><i>${KIT.ico("minus", 18)}</i><b>1</b><i>${KIT.ico("plus", 18)}</i></div><div class="tt">R$ 0,00</div></div>`).join("")}</div>
        <div class="s4-sum"><div><span>Subtotal</span><b class="sb">R$ 0,00</b></div><div class="ds"><span>Desconto</span><b>− R$ 3,70</b></div><div class="tot"><span>Total</span><b class="to">R$ 0,00</b></div></div></div></div>`);
    root.appendChild(pos);
    tiles = $$(".s4-tile", pos); tiles.forEach(t => $(".th", t).appendChild(KIT.productThumb(t.dataset.id, 140)));
    lines = $$(".s4-ln", pos); cust = $(".s4-cust .on", pos); subN = $(".sb", pos); dsRow = $(".ds", pos); totN = $(".to", pos);
    pay = $(".s4-pay", pos); prs = $$(".s4-pr", pos); methods = $$(".s4-meth div", pos); btn = $(".s4-btn", pos); srch = $(".s4-search", pos); cnt = $(".cnt", pos);
    paidN = $(".pd", pos); remN = $(".rm", pos);
    CART.forEach(c => { const e = h(`<div class="blk"></div>`); e.style.width = e.style.height = "110px"; e.appendChild(KIT.productThumb(c.id, 110)); root.appendChild(e); tok.push(e); });
    ok = h(`<div class="pn blk s4-ok"><svg width="150" height="150" viewBox="0 0 150 150"><circle cx="75" cy="75" r="66" fill="rgba(22,163,74,.16)" stroke="#4ADE80" stroke-width="5" pathLength="1" stroke-dasharray="1 1" class="rg"/><path d="M46 77l20 20 40-42" fill="none" stroke="#4ADE80" stroke-width="9" stroke-linecap="round" stroke-linejoin="round" pathLength="1" stroke-dasharray="1 1" class="ck"/></svg>
      <h4>Venda registrada.</h4><p>Venda #1048 · 3 itens · R$ 70,00</p><div class="cs"><span class="chip">${KIT.ico("receipt", 18)}Recibo em PDF</span><span class="chip sl">Pix + Dinheiro</span></div></div>`);
    root.appendChild(ok); okRing = [$(".rg", ok), $(".ck", ok)];
    head = hl(["Venda com agilidade.", "Registre com precisão."], "", { accent: 1 }); head.style.fontSize = pick({ wide: 64, sq: 58, tall: 66 }) + "px"; head.style.textAlign = pick({ wide: "left", sq: "center", tall: "center" }); root.appendChild(head);
  };
  const LY = () => pick({
    wide: { p0: [1330, 560, .8], p1: [960, 560, .92], head: [110, 330], ok: [960, 540, 1] },
    sq: { p0: [540, 640, .76], p1: [540, 560, .82], head: [540, 120], ok: [540, 560, .95] },
    tall: { p0: [540, 1200, .82], p1: [540, 1120, .84], head: [540, 520], ok: [540, 1120, 1.3] },
  });
  // tamanho estimado do painel em escala: usado para mirar tokens
  S.render = function (t) {
    const L = LY();
    const pin = E.out4(P(t, .6, 1.8)), mv = E.io5(P(t, 5.4, 6.6)), out = E.in3(P(t, 11.6, 12.6));
    const okP = E.io3(P(t, 8.6, 9.4));
    const px = lerp(L.p0[0], L.p1[0], mv), py = lerp(L.p0[1], L.p1[1], mv), ps = lerp(L.p0[2], L.p1[2], mv);
    // no 16:9 o painel começa levemente inclinado ao lado do título
    const ry = FN === "wide" ? lerp(-14, 0, mv) * pin + (1 - pin) * -30 : (1 - pin) * -20;
    put(pos, { x: px + (1 - pin) * 80, y: py, s: ps * (1 - okP * .06), ry, rx: (1 - pin) * 6, z: -okP * 120, o: pin * (1 - out) * (1 - okP * .55), b: okP * 3 });
    // busca: "caf" digitado
    const typed = "Café"; const nT = Math.floor(cl(P(t, 1.0, 1.5)) * 4) * (t < 2.6 ? 1 : 0);
    setT($(".q", srch), typed.slice(0, nT)); setS($(".ph", srch), "display", nT ? "none" : ""); setS($(".cur", srch), "opacity", (Math.floor(t * 2.5) % 2 ? 1 : .2).toString());
    // toque nos cards e voo até o carrinho (coordenadas do palco aproximadas pelo layout do painel)
    const panelW = 1240 * ps, panelH = 800 * ps, ox = px - panelW / 2, oy = py - panelH / 2;
    let items = 0, sub = 0;
    CART.forEach((c, i) => {
      const ti = tiles.find(x => x.dataset.id === c.id), tIdx = tiles.indexOf(ti);
      const press = Math.sin(Math.PI * P(t, c.t0 - .25, c.t0 + .15)); setS($(".pr", ti), "opacity", (press * .9 + (t > c.t0 && t < c.t0 + .6 ? .1 : 0)).toFixed(3)); setS(ti, "transform", `scale(${(1 - press * .04).toFixed(4)})`);
      const sx = ox + (28 + (tIdx % 2) * 288 + 136) * ps, sy = oy + (28 + 62 + 76 + Math.floor(tIdx / 2) * 278 + 86) * ps;
      const ex = ox + (600 + 30 + 40) * ps, ey = oy + (28 + 62 + 80 + i * 92 + 46) * ps;
      const f = P(t, c.t0, c.t0 + .7), fe = E.io3(f);
      put(tok[i], { x: lerp(sx, ex, fe), y: lerp(sy, ey, fe) - Math.sin(fe * Math.PI) * 120 * ps, s: lerp(1.15, .45, fe) * ps, z: 60, o: f > 0 && f < 1 ? Math.min(1, f * 6, (1 - f) * 5) : 0 });
      // linha do carrinho
      const la = E.out4(P(t, c.t0 + .55, c.t0 + 1.0));
      setS(lines[i], "transform", `translateY(${(i * 92 + (1 - la) * 16).toFixed(1)}px)`); setS(lines[i], "opacity", la.toFixed(3));
      const q = la > 0 ? Math.max(1, Math.min(c.q, 1 + Math.floor(P(qt(t), c.t0 + 1.0, c.t0 + 1.0 + .16 * (c.q - 1)) * (c.q - 1) + 1e-6))) : 0;
      setT($(".s4-step b", lines[i]), String(q || 1)); setT($(".tt", lines[i]), fmtBRL(PR[c.id].price * (q || 1)));
      if (la > .5) { items += q; sub += PR[c.id].price * q; }
    });
    setT(cnt, items === 1 ? "1 item" : items + " itens"); setT(subN, fmtBRL(sub));
    const dsa = E.out3(P(qt(t), 5.0, 5.5)); setS(dsRow, "opacity", (.25 + .75 * dsa).toFixed(3));
    setT(totN, fmtBRL(Math.max(0, sub - 3.70 * dsa)));
    const ca = E.out4(P(t, 4.6, 5.1)); setS(cust, "opacity", ca.toFixed(3)); setS(cust, "transform", `translateY(${((1 - ca) * 10).toFixed(1)}px)`);
    // pagamento
    const pa = E.io5(P(t, 6.2, 7.0)); setS(pay, "transform", `translateY(${((1 - pa) * 105).toFixed(2)}%)`); setS(pay, "opacity", pa > .002 ? "1" : "0");
    const m1 = P(t, 7.2, 7.4) > 0, m2 = P(t, 7.7, 7.9) > 0; methods.forEach((m, i) => m.classList.toggle("on", (i === 1 && m1) || (i === 0 && m2)));
    prs.forEach((r, i) => { const a = E.out3(P(t, 7.3 + i * .5, 7.7 + i * .5)); setS(r, "opacity", a.toFixed(3)); setS(r, "transform", `translateX(${((1 - a) * 20).toFixed(1)}px)`); });
    const paid = (P(t, 7.3, 7.6) > 0 ? 40 : 0) + (P(t, 7.8, 8.1) > 0 ? 30 : 0); setT(paidN, fmtBRL(paid)); setT(remN, fmtBRL(70 - paid));
    const bp = Math.sin(Math.PI * P(t, 8.3, 8.6)); setS(btn, "transform", `scale(${(1 - bp * .04).toFixed(4)})`); setS(btn, "filter", bp > .01 ? `brightness(${(1 + bp * .25).toFixed(3)})` : "");
    // confirmação
    const oi = spr(t - 8.7, 10, .7), oa = cl((t - 8.7) * 4);
    const oOut = E.io3(P(t, 11.0, 12.0));
    put(ok, { x: lerp(L.ok[0], L.ok[0] + (FN === "wide" ? 520 : 0), oOut), y: L.ok[1] + (FN === "wide" ? 0 : oOut * 300), s: L.ok[2] * lerp(.9, 1, oi) * lerp(1, .35, oOut), z: 80, o: oa * (1 - E.in2(P(t, 11.5, 12.2))) });
    setS(okRing[0], "strokeDashoffset", (1 - E.out3(P(t, 8.8, 9.5))).toFixed(3)); setS(okRing[1], "strokeDashoffset", (1 - E.out3(P(t, 9.2, 9.7))).toFixed(3));
    // título
    put(head, { x: L.head[0] + (FN === "wide" ? (head._w || head.offsetWidth) / 2 : 0), y: L.head[1] });
    hlAt(head, t, .8, 5.2);
  };
  return S;
})();
