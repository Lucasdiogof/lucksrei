"use strict";
/* Cena 2 — produtos e catálogo. Quatro produtos 3D sobre o piso; viram linhas do catálogo (o próprio produto é a miniatura);
   o feixe de leitura percorre o código de barras do café e encontra o item na lista. */
SP.css(`
.s2-floor{width:1600px;height:1600px;background:
 radial-gradient(closest-side,rgba(37,99,235,.22),rgba(37,99,235,0) 70%),
 repeating-linear-gradient(0deg,rgba(96,165,250,.38) 0 2px,transparent 2px 100px),repeating-linear-gradient(90deg,rgba(96,165,250,.38) 0 2px,transparent 2px 100px);
 -webkit-mask-image:radial-gradient(closest-side,#000 30%,transparent 100%);transform:rotateX(90deg)}
.s2-list{width:820px;height:700px;padding:30px 30px}
.s2-list .hd{display:flex;align-items:center;justify-content:space-between;margin-bottom:18px}
.s2-list .hd h3{font:700 34px 'SP Roboto';letter-spacing:-.02em}
.s2-search{display:flex;align-items:center;gap:12px;height:54px;border-radius:12px;background:rgba(6,16,38,.55);border:1px solid rgba(96,165,250,.22);padding:0 16px;color:#7f93b8;font:400 20px 'SP Roboto';margin-bottom:16px}
.s2-cats{display:flex;gap:10px;margin-bottom:14px}
.s2-row{position:relative;height:104px;display:flex;align-items:center;gap:20px;padding:0 18px 0 120px;border-radius:16px}
.s2-row+.s2-row{margin-top:8px}
.s2-row .slot{position:absolute;left:12px;top:10px;width:84px;height:84px;border-radius:14px;background:rgba(96,165,250,.08);border:1px solid rgba(96,165,250,.14)}
.s2-row .nm{flex:1;min-width:0}
.s2-row .nm b{display:block;font:500 25px 'SP Roboto';color:#F1F5FF;white-space:nowrap}
.s2-row .nm span{display:block;margin-top:6px;font:400 18px 'SP Roboto';color:#8EA3C7}
.s2-row .pr{text-align:right}
.s2-row .pr b{display:block;font:700 26px 'SP Roboto';font-variant-numeric:tabular-nums}
.s2-row .pr span{display:block;margin-top:6px;font:500 18px 'SP Roboto';color:#8EA3C7;font-variant-numeric:tabular-nums}
.s2-row .pr span.lo{color:#FCD34D}
.s2-row .hi{position:absolute;inset:0;border-radius:16px;border:2px solid #60A5FA;background:rgba(37,99,235,.16);box-shadow:0 0 40px rgba(37,99,235,.45)}
.s2-lab{width:600px;height:330px;border-radius:24px;padding:28px 40px}
.s2-lab .t{font:500 22px 'SP Roboto';color:#334155;letter-spacing:.02em}
.s2-lab .bc{position:relative;margin-top:22px;height:170px}
.s2-lab .dg{margin-top:12px;font:500 30px 'SP Roboto';letter-spacing:.24em;color:#0F172A;font-variant-numeric:tabular-nums;text-align:center}
.s2-beam{position:absolute;left:-30px;right:-30px;height:4px;border-radius:2px;background:#38BDF8;box-shadow:0 0 18px 4px rgba(56,189,248,.8),0 0 60px 10px rgba(30,108,255,.45)}
.s2-found{display:flex;align-items:center;gap:14px;height:64px;padding:0 26px 0 14px;border-radius:32px;background:rgba(22,163,74,.16);border:1px solid rgba(74,222,128,.45);font:500 24px 'SP Roboto';color:#BBF7D0;white-space:nowrap}
.s2-found .ok{width:40px;height:40px;border-radius:50%;background:#16A34A;display:flex;align-items:center;justify-content:center}
.s2-det{width:600px;height:300px;padding:28px 32px}
.s2-det .g{display:grid;grid-template-columns:1fr 1fr;gap:18px 26px;margin-top:22px}
.s2-det .g div span{display:block;font:500 15px 'SP Roboto';letter-spacing:.14em;text-transform:uppercase;color:#7f93b8}
.s2-det .g div b{display:block;margin-top:6px;font:500 28px 'SP Roboto';font-variant-numeric:tabular-nums;color:#F1F5FF}
`);
SP.scenes.s02 = (function () {
  const S = { D: 10.0 }; const PR = KIT.PRODUCTS, IDS = ["cafe", "agua", "caderno", "sabao"];
  let floor, prods = [], list, rows = [], lab, beam, digits, found, det, link, head, cats;
  S.build = function (root) {
    floor = h(`<div class="blk p3" style="width:1600px;height:1600px"><div class="s2-floor"></div></div>`); root.appendChild(floor);
    list = h(`<div class="pn blk s2-list"><div class="hd"><h3>Produtos</h3><span class="chip">${KIT.ico("plus", 18)}Novo produto</span></div>
      <div class="s2-search">${KIT.ico("search", 22)}Buscar produto ou ler código de barras</div>
      <div class="s2-cats"><span class="chip">Todos</span><span class="chip sl">Mercearia</span><span class="chip sl">Bebidas</span><span class="chip sl">Papelaria</span><span class="chip sl">Limpeza</span></div>
      ${IDS.map(id => { const p = PR[id]; return `<div class="s2-row"><div class="hi" style="opacity:0"></div><div class="slot"></div><div class="nm"><b>${p.name}</b><span>${p.cat} · ${p.code.slice(0, 3)} ${p.code.slice(3)}</span></div><div class="pr"><b>${brl(p.price)}</b><span class="${p.qty < p.min ? "lo" : ""}">${p.qty < p.min ? "Estoque baixo · " : ""}${p.qty} un.</span></div></div>`; }).join("")}</div>`);
    root.appendChild(list); rows = $$(".s2-row", list); cats = $$(".s2-cats .chip", list);
    IDS.forEach((id, i) => {
      const p = PR[id], c = KIT.product(id); const a = anchor(c, -p.w / 2, -p.h); root.appendChild(a); prods.push(a);
    });
    lab = h(`<div class="pn lt blk s2-lab"><div class="t">CAFÉ TORRADO 500 G · MERCEARIA</div><div class="bc">${KIT.barcode(520, 170, PR.cafe.seed, "#0F172A")}<div class="s2-beam"></div></div><div class="dg">7 891234 500017</div></div>`);
    root.appendChild(lab); beam = $(".s2-beam", lab); digits = $(".dg", lab);
    found = h(`<div class="blk s2-found"><div class="ok">${KIT.ico("check", 24, "#fff", 2.6)}</div>Produto encontrado</div>`); root.appendChild(found);
    det = h(`<div class="pn blk s2-det"><div style="display:flex;align-items:center;gap:14px"><span class="chip">Mercearia</span><span style="font:700 30px 'SP Roboto';letter-spacing:-.01em">Café Torrado 500 g</span></div>
      <div class="g"><div><span>Preço de venda</span><b>${brl(PR.cafe.price)}</b></div><div><span>Em estoque</span><b>${PR.cafe.qty} un.</b></div><div><span>Estoque mínimo</span><b>${PR.cafe.min} un.</b></div><div><span>Código</span><b style="font-size:24px">7891234500017</b></div></div></div>`); root.appendChild(det);
    link = h(`<svg class="blk" width="${FMT.W}" height="${FMT.H}" viewBox="0 0 ${FMT.W} ${FMT.H}"><path fill="none" stroke="#60A5FA" stroke-width="2.5" stroke-dasharray="1 1" pathLength="1" stroke-linecap="round"/><circle r="7" fill="#9CC7FF"/></svg>`); root.appendChild(link);
    head = hl(["Cadastre e organize", "seus produtos."], "", { accent: 1 }); head.style.fontSize = pick({ wide: 80, sq: 72, tall: 88 }) + "px"; head.style.textAlign = pick({ wide: "left", sq: "center", tall: "center" }); root.appendChild(head);
  };
  // layout por formato
  const LY = () => pick({
    wide: { fx: 1180, fy: 800, fs: 1.0, pk: 1.35, spread: 290, list: [560, 610, 1.04], lab: [1390, 440, 1], det: [1390, 810, 1.02], found: [1390, 655], head: [110, 150] },
    sq: { fx: 570, fy: 660, fs: .8, pk: 1.2, spread: 200, list: [540, 330, .62], lab: [540, 760, .78], det: [540, 790, .8], found: [540, 950], head: [540, 175] },
    tall: { fx: 590, fy: 1180, fs: .95, pk: 1.5, spread: 190, list: [540, 690, 1.15], lab: [540, 1330, 1.12], det: [540, 1690, 1.12], found: [540, 1110], head: [540, 300] },
  });
  // centro de cada miniatura relativo ao centro do painel (medido no layout, sem transformações)
  let SL = null;
  function slotPos(i) {
    if (!SL) { const was = list.style.display; list.style.display = ""; SL = rows.map(r => { const sl = r.querySelector(".slot"); return [r.offsetLeft + sl.offsetLeft + 42 - 410, r.offsetTop + sl.offsetTop + 42 - 350]; }); list.style.display = was; }
    return SL[i];
  }
  S.render = function (t) {
    const L = LY(), W = FMT.W;
    const inA = E.out4(P(t, 0, 1.6));
    // câmera do piso: orbita devagar e achata quando os produtos viram catálogo
    const flat = E.io5(P(t, 3.5, 5.0));
    const rx = lerp(-24, -12, flat), ry = lerp(-38 + 6 * P(t, 0, 3.6), -26, flat);
    const fo = inA * (1 - E.io2(P(t, 3.3, 4.6)));
    put(floor, { x: L.fx, y: L.fy, z: -60, rx, ry, s: L.fs, o: fo * .9 });
    // posições dos produtos no piso (fila em X, alternando Z)
    const pos = [[-1.5, -.35], [-.5, .45], [.5, -.35], [1.5, .45]];
    // posições nas miniaturas da lista (em coordenadas do palco)
    const lx = L.list[0], ly = L.list[1], ls = L.list[2];
    const listIn = E.out4(P(t, 3.9, 5.0));
    const listOut = E.in3(P(t, 8.8, 9.5));
    put(list, { x: lx, y: ly + (1 - listIn) * 40, s: ls * lerp(.96, 1, listIn), o: listIn * (1 - listOut), rx: (1 - listIn) * 8 });
    IDS.forEach((id, i) => {
      const p = PR[id];
      const v = rot3(pos[i][0] * L.spread, 0, pos[i][1] * L.spread, rx, ry);
      const rise = spr(t - .7 - i * .2, 9, .7), ap = cl((t - .7 - i * .2) * 3);
      const fx = L.fx + v[0] * L.fs, fy = L.fy + v[1] * L.fs + (1 - rise) * 60;
      // destino: miniatura (slot 84×84 no canto da linha i)
      const sl = slotPos(i), sx = lx + sl[0] * ls, sy = ly + sl[1] * ls;
      const k = E.io5(P(t, 3.5 + i * .08, 4.9 + i * .08));
      const thumbS = 64 / Math.max(p.w, p.h) * ls;
      const bob = Math.sin(t * 1.3 + i) * 4 * (1 - k);
      put(prods[i], { x: lerp(fx, sx, k), y: lerp(fy + bob, sy + p.h * thumbS * .5, k), z: lerp(v[2] * L.fs + 40, 60, k), rx: lerp(rx, -16, k), ry: lerp(ry, -30, k) + (k > .99 ? Math.sin(t * .8 + i) * 6 : 0), s: lerp(L.pk * L.fs, thumbS, k), o: ap * (1 - listOut) });
      // etiquetas flutuantes
    });
    // linhas da lista: textos entram em cascata
    rows.forEach((r, i) => { const a = E.out3(P(t, 4.4 + i * .1, 5.1 + i * .1)); setS(r.querySelector(".nm"), "opacity", a.toFixed(3)); setS(r.querySelector(".pr"), "opacity", a.toFixed(3)); setS(r.querySelector(".nm"), "transform", `translateX(${((1 - a) * 24).toFixed(1)}px)`); });
    cats.forEach((c, i) => setS(c, "opacity", E.out3(P(t, 4.5 + i * .06, 5.0 + i * .06)).toFixed(3)));
    // etiqueta com código e feixe
    const labIn = E.out4(P(t, 5.0, 5.9)), lo = 1 - E.in3(P(t, 8.8, 9.5));
    // no 1:1 a ficha do produto ocupa o lugar da etiqueta (não há altura para as duas)
    const labSwap = FN === "sq" ? 1 - E.in2(P(t, 7.9, 8.3)) : 1;
    put(lab, { x: L.lab[0] + (1 - labIn) * 60, y: L.lab[1], s: L.lab[2], ry: (1 - labIn) * -24, o: labIn * lo * labSwap });
    const bp = E.io3(P(t, 5.9, 7.0));
    setS(beam, "top", (bp * 170 - 2).toFixed(1) + "px"); setS(beam, "opacity", (Math.sin(Math.min(1, bp) * Math.PI) * 1 + (t > 5.9 && t < 7 ? .1 : 0)).toFixed(3));
    const nd = Math.floor(cl(P(t, 6.2, 7.0)) * 13), dstr = "7891234500017";
    let shown = ""; for (let i = 0; i < 13; i++) { shown += i < nd ? dstr[i] : "·"; if (i === 0 || i === 6) shown += " "; }
    setT(digits, shown);
    const fd = spr(t - 7.05, 10, .6), fa = cl((t - 7.05) * 4) * lo;
    put(found, { x: L.found[0], y: L.found[1], s: lerp(.85, 1, fd) * (FN === "wide" ? 1 : .9), o: fa * (1 - E.in2(P(t, 8.0, 8.4))) });
    // item encontrado na lista + detalhes
    const hi = E.out3(P(t, 7.2, 7.7)); setS(rows[0].querySelector(".hi"), "opacity", (hi * (1 - listOut)).toFixed(3));
    const di = E.out4(P(t, 8.3, 9.1));
    put(det, { x: L.det[0], y: L.det[1] + (1 - di) * 30, s: L.det[2], rx: (1 - di) * 30, o: di * lo });
    // ligação etiqueta → linha da lista (só no 16:9, onde estão lado a lado)
    const lp = E.io3(P(t, 7.1, 7.9));
    if (FN === "wide" && lp > 0 && lo > 0) {
      show(link, true); link.style.opacity = lo;
      const ax = L.lab[0] - 300, ay = L.lab[1] + 40, bx = lx + 410 * ls - 10, by = ly + slotPos(0)[1] * ls;
      const d = `M${ax} ${ay}C${ax - 90} ${ay},${bx + 90} ${by},${bx} ${by}`; const pth = link.firstElementChild; if (pth._d !== d) { pth.setAttribute("d", d); pth._d = d; }
      setS(pth, "strokeDashoffset", (1 - lp).toFixed(3));
      const pt = pth.getPointAtLength(pth.getTotalLength() * lp); const c = link.lastElementChild; c.setAttribute("cx", pt.x); c.setAttribute("cy", pt.y); c.style.opacity = lp < 1 ? 1 : Math.max(0, 1 - (t - 7.9) * 2);
      setS(link, "transform", "none");
    } else show(link, false);
    // título
    put(head, { x: L.head[0] + (FN === "wide" ? (head._w || head.offsetWidth) / 2 : 0), y: L.head[1] });
    hlAt(head, t, FN === "wide" ? .9 : 1.0, FN === "wide" ? 8.7 : 3.6);
  };
  return S;
})();
