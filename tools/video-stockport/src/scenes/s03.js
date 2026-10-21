"use strict";
/* Cena 3 — estoque em movimento. Estante 3D; uma caixa de entrada desliza para a vaga, gera a linha de movimentação,
   o saldo sobe; o sabão abaixo do mínimo ganha destaque âmbar discreto. */
SP.css(`
.s3-ledger{width:640px;height:440px;padding:26px 28px}
.s3-ledger .hd{display:flex;align-items:center;justify-content:space-between;margin-bottom:14px}
.s3-ledger .hd h3{font:700 28px 'SP Roboto';letter-spacing:-.01em}
.s3-rows{position:relative;height:340px;overflow:hidden}
.s3-r{position:absolute;left:0;right:0;height:76px;display:flex;align-items:center;gap:16px;padding:0 14px;border-radius:14px;border-bottom:1px solid rgba(110,160,250,.12)}
.s3-r .ic{flex:none}
.s3-r .k{width:44px;height:44px;border-radius:12px;display:flex;align-items:center;justify-content:center;flex:none}
.s3-r .nm{flex:1;min-width:0}
.s3-r .nm b{display:block;font:500 21px 'SP Roboto';color:#F1F5FF;white-space:nowrap}
.s3-r .nm span{display:block;margin-top:4px;font:400 16px 'SP Roboto';color:#8EA3C7;white-space:nowrap}
.s3-r .q{width:80px;text-align:right;font:700 24px 'SP Roboto';font-variant-numeric:tabular-nums}
.s3-r .s{width:96px;text-align:right;font:400 17px 'SP Roboto';color:#8EA3C7;font-variant-numeric:tabular-nums}
.s3-r .s b{display:block;font:500 22px 'SP Roboto';color:#E5EDFB}
.s3-r.new{background:rgba(37,99,235,.16);border:1px solid rgba(96,165,250,.45)}
.s3-bal{width:640px;height:200px;padding:24px 28px}
.s3-bal .top{display:flex;align-items:flex-end;justify-content:space-between}
.s3-bal .top>div>span{font:500 16px 'SP Roboto';letter-spacing:.14em;text-transform:uppercase;color:#8EA3C7}
.s3-bal .top b{display:block;margin-top:6px;font:500 26px 'SP Roboto'}
.s3-bal .big{font:700 64px/1 'SP Roboto';letter-spacing:-.02em;font-variant-numeric:tabular-nums}
.s3-bal .big small{font:500 24px 'SP Roboto';color:#8EA3C7;margin-left:6px;letter-spacing:0}
.s3-gauge{position:relative;height:14px;border-radius:7px;background:rgba(148,163,184,.16);margin-top:26px}
.s3-gauge i{position:absolute;left:0;top:0;bottom:0;border-radius:7px;background:linear-gradient(90deg,#1E6CFF,#60A5FA)}
.s3-gauge u{position:absolute;top:-8px;bottom:-8px;width:3px;border-radius:2px;background:#E5EDFB;text-decoration:none}
.s3-gauge em{position:absolute;top:22px;font:500 15px 'SP Roboto';font-style:normal;color:#8EA3C7;white-space:nowrap;transform:translateX(-50%)}
.s3-low{width:640px;height:200px;padding:24px 28px;border-color:rgba(251,191,36,.45)!important}
.s3-low .s3-gauge i{background:linear-gradient(90deg,#D97706,#FBBF24)}
.s3-ring{width:200px;height:200px;border-radius:50%;border:3px solid #60A5FA}
`);
SP.scenes.s03 = (function () {
  const S = { D: 10.8 };
  let rack, items = [], posts = [], shelves = [], inBox, trail, ledger, rowsEl, rws = [], bal, balN, balBar, low, ring, head, lowGlow;
  const BW = 170, LV = 165, RD = 150;
  // vagas: [nível, baia, produto]  (nível 0 = chão)
  const SLOTS = [[0, 0, "cafe"], [0, 1, "cafe"], [0, 2, "agua"], [0, 3, "agua"], [1, 0, "caderno"], [1, 1, "sabao"], [1, 3, "agua"], [2, 0, "cafe"], [2, 1, "caderno"], [2, 2, "caderno"], [2, 3, "agua"]];
  const TARGET = [1, 2];
  const slotXYZ = (lv, bay) => [(-1.5 + bay) * BW, -lv * LV - 8, 0];
  S.build = function (root) {
    rack = h(`<div class="blk p3"></div>`); rack.style.width = rack.style.height = "0px"; rack._w = rack._h = .0001; root.appendChild(rack);
    const metal = { front: "linear-gradient(180deg,#3d5c9e,#24407c)", right: "#1b3466", left: "#1b3466", top: "linear-gradient(90deg,#6d95e0,#4a74c4)" };
    for (let lv = 0; lv < 4; lv++) { const sh = KIT.cuboid(4 * BW + 16, 8, RD, metal); at(sh, -(4 * BW + 16) / 2, -lv * LV - 8, 0); rack.appendChild(sh); shelves.push(sh); }
    for (let b = 0; b <= 4; b++) for (const zz of [-RD / 2 + 5, RD / 2 - 5]) { const po = KIT.cuboid(10, 3 * LV + 8, 10, metal); at(po, (-2 + b) * BW - 5, -(3 * LV + 8), zz); rack.appendChild(po); posts.push(po); }
    SLOTS.forEach(([lv, bay, id], i) => { const c = KIT.caseBox(id, 124, 96, 112); const [x, y] = slotXYZ(lv, bay); at(c, x - 62, y - 96, 0); rack.appendChild(c); items.push({ c, lv, bay, id, x, y }); });
    // brilho âmbar na vaga do sabão
    lowGlow = h(`<div style="position:absolute;width:150px;height:110px;border-radius:12px;border:2px solid #FBBF24;box-shadow:0 0 40px rgba(251,191,36,.6),inset 0 0 30px rgba(251,191,36,.25);opacity:0"></div>`);
    { const [x, y] = slotXYZ(1, 1); at(lowGlow, x - 75, y - 104, RD / 2 + 2); rack.appendChild(lowGlow); }
    inBox = h(`<div class="blk p3"></div>`); inBox.style.width = inBox.style.height = "0px"; inBox._w = inBox._h = .0001;
    const ib = KIT.caseBox("cafe", 124, 96, 112); at(ib, -62, -96, 0); inBox.appendChild(ib); root.appendChild(inBox);
    trail = h(`<svg class="blk" width="${FMT.W}" height="${FMT.H}" viewBox="0 0 ${FMT.W} ${FMT.H}"><defs><linearGradient id="s3tr" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#60A5FA" stop-opacity="0"/><stop offset="1" stop-color="#9CC7FF"/></linearGradient></defs><path fill="none" stroke="url(#s3tr)" stroke-width="3" stroke-linecap="round"/></svg>`); root.appendChild(trail);
    ring = h(`<div class="blk s3-ring"></div>`); root.appendChild(ring);
    const R = [
      { k: "Entrada", ic: "down", col: "#4ADE80", bg: "rgba(74,222,128,.14)", nm: "Café Torrado 500 g", sub: "Entrada · Distribuidora Serra", q: "+24", s: 86, nw: 1 },
      { k: "Venda", ic: "cart", col: "#93C5FD", bg: "rgba(96,165,250,.14)", nm: "Café Torrado 500 g", sub: "Venda #1047", q: "−2", s: 62 },
      { k: "Ajuste", ic: "layers", col: "#CBD5E1", bg: "rgba(148,163,184,.14)", nm: "Água Mineral 1,5 L", sub: "Ajuste · avaria", q: "−1", s: 148 },
      { k: "Entrada", ic: "down", col: "#4ADE80", bg: "rgba(74,222,128,.14)", nm: "Caderno 96 folhas", sub: "Entrada · Papelaria Central", q: "+12", s: 35 },
      { k: "Venda", ic: "cart", col: "#93C5FD", bg: "rgba(96,165,250,.14)", nm: "Sabão em Pó 1 kg", sub: "Venda #1046", q: "−1", s: 6 },
    ];
    ledger = h(`<div class="pn blk s3-ledger"><div class="hd"><h3>Movimentações</h3><span class="chip sl">${KIT.ico("clock", 18)}Hoje</span></div><div class="s3-rows">${R.map(r => `<div class="s3-r${r.nw ? " new" : ""}"><div class="k" style="background:${r.bg}">${KIT.ico(r.ic, 24, r.col, 2)}</div><div class="nm"><b>${r.nm}</b><span>${r.sub}</span></div><div class="q" style="color:${r.col}">${r.q}</div><div class="s">saldo<b>${r.s}</b></div></div>`).join("")}</div></div>`);
    root.appendChild(ledger); rws = $$(".s3-r", ledger);
    bal = h(`<div class="pn blk s3-bal"><div class="top"><div><span>Saldo atual</span><b>Café Torrado 500 g</b></div><div class="big"><span class="n">62</span><small>un.</small></div></div><div class="s3-gauge"><i></i><u style="left:${20 / 120 * 100}%"></u><em style="left:${20 / 120 * 100}%">mín. 20</em></div></div>`);
    root.appendChild(bal); balN = $(".n", bal); balBar = $(".s3-gauge i", bal);
    low = h(`<div class="pn blk s3-low"><div class="top" style="display:flex;justify-content:space-between;align-items:flex-start"><div><span class="chip am">${KIT.ico("alert", 18)}Estoque baixo</span><b style="display:block;margin-top:14px;font:500 26px 'SP Roboto'">Sabão em Pó 1 kg</b></div><div style="text-align:right"><div style="font:700 64px/1 'SP Roboto';color:#FCD34D">6<small style="font:500 24px 'SP Roboto';color:#8EA3C7;margin-left:6px">un.</small></div><div style="margin-top:8px;font:400 18px 'SP Roboto';color:#8EA3C7">mínimo 10 un.</div></div></div><div class="s3-gauge" style="margin-top:20px"><i style="width:${6 / 40 * 100}%"></i><u style="left:${10 / 40 * 100}%"></u></div></div>`);
    root.appendChild(low);
    head = hl(["Saiba o que entra, o que sai", "e o que precisa de atenção."], "", { accent: 1 }); head.style.fontSize = pick({ wide: 70, sq: 54, tall: 62 }) + "px"; head.style.textAlign = pick({ wide: "left", sq: "center", tall: "center" }); root.appendChild(head);
  };
  const LY = () => pick({
    wide: { rx: 600, ry: 840, rs: 1.0, led: [1370, 440, 1], bal: [1370, 820, 1], head: [130, 170] },
    sq: { rx: 540, ry: 600, rs: .62, led: [540, 760, .8], bal: [540, 905, .8], head: [540, 120] },
    tall: { rx: 540, ry: 1080, rs: .9, led: [540, 1250, 1.15], bal: [540, 1665, 1.15], head: [540, 290] },
  });
  S.render = function (t) {
    const L = LY();
    const out = E.in3(P(t, 9.4, 10.3));
    const cin = E.out4(P(t, 0, 1.6));
    const rRX = lerp(-30, -20, cin) + 2 * Math.sin(t * .4), rRY = lerp(-52, -34, E.io3(P(t, 0, 4))) + lerp(0, 10, E.io3(P(t, 5.2, 7.2)));
    // no quadrado/vertical a estante dá lugar aos painéis
    const shrink = FN === "wide" ? 0 : E.io3(P(t, 4.0, 4.9));
    const rs = L.rs * lerp(1, FN === "sq" ? .7 : .8, shrink), ryy = L.ry + (FN === "wide" ? 0 : lerp(0, FN === "sq" ? -150 : -340, shrink));
    put(rack, { x: L.rx, y: ryy, z: -20 - out * 200, rx: rRX, ry: rRY, s: rs * lerp(.9, 1, cin), o: cl((t - .3) * 3) * (1 - out) });
    shelves.forEach((s, i) => setS(s, "opacity", E.out3(P(t, .1 + i * .1, .7 + i * .1)).toFixed(3)));
    items.forEach((it, i) => { const a = spr(t - .5 - i * .06, 11, .65); setS(it.c, "opacity", cl((t - .5 - i * .06) * 4).toFixed(3)); setS(it.c, "transform", `translate3d(${it.x - 62}px,${(it.y - 96 - (1 - a) * 60).toFixed(1)}px,0px)`); });
    // caixa de entrada: trajetória em arco até a vaga (coordenadas locais da estante → palco)
    const [tx, ty] = slotXYZ(TARGET[0], TARGET[1]);
    const fp = P(t, 1.7, 3.4), fe = E.io3(fp);
    const local = u => { const e = u; return [lerp(tx + 900, tx, e), lerp(ty - 620, ty, e) - Math.sin(e * Math.PI) * 120, lerp(380, 0, E.out2(e))]; };
    const toStage = (x, y, z) => { const v = rot3(x * rs, y * rs, z * rs, rRX, rRY); return [L.rx + v[0], ryy + v[1], v[2] - 20]; };
    const land = spr(t - 3.4, 16, .45);
    const cur = toStage(...local(fe));
    put(inBox, { x: cur[0], y: cur[1] + (t > 3.4 ? (1 - land) * 6 : 0), z: cur[2], rx: rRX, ry: rRY + (1 - fe) * -40, rz: (1 - fe) * 12, s: rs, sy: t > 3.4 ? 1 - (1 - land) * .08 : 1, o: cl((t - 1.6) * 4) * (1 - out) });
    // rastro de luz
    if (fp > 0 && t < 4.6) {
      let d = ""; for (let k = 0; k <= 24; k++) { const u = Math.max(0, fe - .45 + k / 24 * .45); const pp = toStage(...local(u)); const sp = proj(pp[0], pp[1] - 48 * rs, pp[2]); d += (k ? "L" : "M") + sp[0].toFixed(1) + " " + sp[1].toFixed(1); }
      show(trail, true); const pth = trail.lastElementChild; pth.setAttribute("d", d); setS(trail, "opacity", (1 - P(t, 3.4, 4.4)).toFixed(3));
    } else show(trail, false);
    // anel ao pousar
    const rp = P(t, 3.4, 4.3); const ts = proj(...toStage(tx, ty - 48, 0));
    put(ring, { x: ts[0], y: ts[1], s: lerp(.3, 1.6, E.out3(rp)) * rs, o: rp > 0 && rp < 1 ? (1 - rp) * .9 : 0 });
    // painel de movimentações: linhas; a nova entra no topo e empurra as outras
    const li = E.out4(P(t, 3.2, 4.2));
    put(ledger, { x: L.led[0] + (1 - li) * 50, y: L.led[1], s: L.led[2], ry: (1 - li) * -20, o: li * (1 - out) });
    const push = E.io3(P(t, 3.8, 4.5));
    rws.forEach((r, i) => { const y = i === 0 ? lerp(-80, 0, push) : (i - 1 + push) * 82; setS(r, "transform", `translateY(${y.toFixed(1)}px)`); setS(r, "opacity", (i === 0 ? push : 1).toFixed(3)); });
    // saldo
    const bi = E.out4(P(t, 3.9, 4.8)), bo = E.io3(P(t, 6.0, 6.6));
    put(bal, { x: L.bal[0], y: L.bal[1] + (1 - bi) * 30 - bo * 20, s: L.bal[2], o: bi * (1 - bo) * (1 - out) });
    const v = lerp(62, 86, E.out3(P(qt(t), 4.3, 5.4))); setT(balN, String(Math.round(v))); setS(balBar, "width", (v / 120 * 100).toFixed(2) + "%");
    // estoque baixo
    const lo = E.out4(P(t, 6.3, 7.2));
    put(low, { x: L.bal[0], y: L.bal[1] + (1 - lo) * 30, s: L.bal[2], o: lo * (1 - out) });
    setS(lowGlow, "opacity", (E.out3(P(t, 5.8, 6.5)) * (.75 + .25 * Math.sin(t * 3.2))).toFixed(3));
    // título
    put(head, { x: L.head[0] + (FN === "wide" ? (head._w || head.offsetWidth) / 2 : 0), y: L.head[1] });
    hlAt(head, t, .7, 9.6);
  };
  return S;
})();
