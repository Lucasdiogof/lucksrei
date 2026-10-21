"use strict";
/* Cena 9 — exportações e plataformas. O relatório se divide em CSV (planilha) e PDF (compartilhar);
   depois a composição se acomoda em molduras discretas de navegador e celular. Sem ícones de loja. */
SP.css(`
.s9-csv{width:760px;height:470px;border-radius:14px;background:#fff;overflow:hidden;box-shadow:0 40px 100px rgba(0,0,0,.5);color:#0F172A}
.s9-csv table{width:100%;border-collapse:collapse;font:400 17px 'SP Roboto';font-variant-numeric:tabular-nums}
.s9-csv th{background:#0A3D91;color:#fff;font-weight:500;text-align:left;padding:13px 14px;white-space:nowrap}
.s9-csv td{padding:12px 14px;border-bottom:1px solid #E2E8F0;border-right:1px solid #EEF2F7;white-space:nowrap}
.s9-csv td.n{text-align:right}
.s9-csv .rn{width:44px;background:#F1F5F9;color:#94A3B8;text-align:center;font-size:14px}
.s9-pdf{width:440px;height:600px;border-radius:6px;background:#fff;box-shadow:0 40px 100px rgba(0,0,0,.5);padding:32px 34px;color:#0F172A}
.s9-pdf .hd{display:flex;align-items:center;gap:10px;font:700 15px 'SP Roboto'}
.s9-pdf .rule{height:3px;background:#2563EB;margin:14px 0 18px}
.s9-pdf h2{font:700 24px 'SP Roboto';letter-spacing:-.01em}
.s9-pdf p{font:400 13px 'SP Roboto';color:#64748B;margin-top:4px}
.s9-pdf .ln{height:10px;border-radius:5px;background:#EEF2F7;margin-top:12px}
.s9-file{display:flex;align-items:center;gap:12px;height:56px;padding:0 20px 0 12px;border-radius:28px;background:rgba(10,26,60,.92);border:1px solid rgba(96,165,250,.4);font:500 20px 'SP Roboto';white-space:nowrap}
.s9-file .bd{width:40px;height:40px;border-radius:10px;display:flex;align-items:center;justify-content:center;font:700 12px 'SP Roboto';color:#fff;letter-spacing:.05em}
.s9-br{width:900px;height:600px;border-radius:18px;background:#0e1d3e;border:1px solid rgba(148,163,184,.35);box-shadow:0 40px 100px rgba(0,0,0,.45)}
.s9-br .bar{height:46px;display:flex;align-items:center;gap:8px;padding:0 18px;border-bottom:1px solid rgba(148,163,184,.2)}
.s9-br .bar i{width:12px;height:12px;border-radius:50%;background:rgba(148,163,184,.4)}
.s9-br .bar u{margin-left:18px;flex:1;height:26px;border-radius:13px;background:rgba(148,163,184,.12);text-decoration:none}
.s9-ph{width:330px;height:680px;border-radius:52px;border:10px solid #1b2b4f;background:#0e1d3e;box-shadow:0 40px 100px rgba(0,0,0,.5),inset 0 0 0 1px rgba(148,163,184,.3)}
.s9-ph::before{content:"";position:absolute;left:50%;top:14px;width:90px;height:24px;border-radius:12px;background:#1b2b4f;transform:translateX(-50%)}
.s9-chips{display:flex;gap:14px}
`);
SP.scenes.s09 = (function () {
  const S = { D: 8.4 };
  let csv, pdf, fCsv, fPdf, br, ph, chips, head, cRows = [];
  S.build = function (root) {
    br = h(`<div class="blk s9-br"><div class="bar"><i></i><i></i><i></i><u></u></div></div>`); ph = h(`<div class="blk s9-ph"></div>`);
    root.appendChild(br); root.appendChild(ph);
    const R = [["21/10/2026", "#1048", "Mariana Souza", "Pix + Dinheiro", "70,00"], ["21/10/2026", "#1047", "—", "Dinheiro", "37,80"], ["21/10/2026", "#1046", "Carlos Mendes", "Débito", "112,40"], ["20/10/2026", "#1045", "—", "Pix", "18,90"], ["20/10/2026", "#1044", "Lúcia Prado", "Crédito", "64,30"], ["20/10/2026", "#1043", "—", "Dinheiro", "9,80"], ["20/10/2026", "#1042", "Mariana Souza", "Pix", "42,50"]];
    csv = h(`<div class="blk s9-csv"><table><tr><th class="rn"></th><th>Data</th><th>Venda</th><th>Cliente</th><th>Pagamento</th><th>Total (R$)</th></tr>${R.map((r, i) => `<tr><td class="rn">${i + 2}</td><td>${r[0]}</td><td>${r[1]}</td><td>${r[2]}</td><td>${r[3]}</td><td class="n">${r[4]}</td></tr>`).join("")}</table></div>`);
    pdf = h(`<div class="blk s9-pdf"><div class="hd">${KIT.markLight(30)}StockPort System</div><div class="rule"></div><h2>Recibo · Venda #1048</h2><p>21/10/2026 · Mariana Souza</p>
      ${["Café Torrado 500 g · 2 × R$ 18,90", "Água Mineral 1,5 L · 6 × R$ 3,50", "Caderno 96 folhas · 1 × R$ 14,90"].map(x => `<div style="display:flex;justify-content:space-between;margin-top:18px;font:400 15px 'SP Roboto';color:#334155"><span>${x.split(" · ")[0]}</span><span>${x.split(" · ")[1]}</span></div>`).join("")}
      <div style="border-top:1px solid #E2E8F0;margin-top:20px;padding-top:14px;display:flex;justify-content:space-between;font:400 15px 'SP Roboto';color:#64748B"><span>Desconto</span><span>− R$ 3,70</span></div>
      <div style="display:flex;justify-content:space-between;margin-top:10px;font:700 22px 'SP Roboto'"><span>Total</span><span>R$ 70,00</span></div>
      <div style="display:flex;justify-content:space-between;margin-top:12px;font:400 15px 'SP Roboto';color:#64748B"><span>Pix · Dinheiro</span><span>R$ 40,00 · R$ 30,00</span></div>
      <div class="ln" style="width:70%;margin-top:28px"></div><div class="ln" style="width:45%"></div></div>`);
    root.appendChild(csv); root.appendChild(pdf); cRows = $$("tr", csv);
    fCsv = h(`<div class="blk s9-file"><div class="bd" style="background:#0A3D91">CSV</div>vendas-outubro.csv</div>`); fPdf = h(`<div class="blk s9-file"><div class="bd" style="background:#DC2626">PDF</div>recibo-1048.pdf</div>`);
    root.appendChild(fCsv); root.appendChild(fPdf);
    chips = h(`<div class="blk s9-chips"><span class="chip">${KIT.ico("phone", 18)}Android e iOS</span><span class="chip">${KIT.ico("browser", 18)}Web</span><span class="chip sl">${KIT.ico("globe", 18)}Português · English · Español</span><span class="chip sl">${KIT.ico("eye", 18)}Tema claro e escuro</span></div>`);
    if (FN !== "wide") chips.style.cssText += ";flex-wrap:wrap;justify-content:center;width:720px";
    root.appendChild(chips);
    head = hl(["Informações onde você precisa."], "", {}); head.style.fontSize = pick({ wide: 72, sq: 56, tall: 60 }) + "px"; head.style.textAlign = "center"; root.appendChild(head);
    if (FN === "tall") { head.remove(); head = hl(["Informações", "onde você precisa."], "", { accent: 1 }); head.style.fontSize = "78px"; head.style.textAlign = "center"; root.appendChild(head); }
  };
  const LY = () => pick({
    wide: { c0: [960, 560], csv: [700, 590, .92], pdf: [1420, 580, .95], br: [700, 600, 1.0], ph: [1420, 600, 1.0], fc: [700, 900], fp: [1420, 930], ch: [960, 985], head: [960, 140] },
    sq: { c0: [540, 560], csv: [400, 580, .62], pdf: [820, 580, .62], br: [400, 590, .64], ph: [820, 590, .66], fc: [400, 840], fp: [820, 840], ch: [540, 960], head: [540, 130] },
    tall: { c0: [540, 960], csv: [540, 740, .9], pdf: [540, 1300, .9], br: [540, 720, .9], ph: [540, 1340, .82], fc: [540, 1010], fp: [540, 1625], ch: [540, 1770], head: [540, 300] },
  });
  S.render = function (t) {
    const L = LY(), out = E.in3(P(t, 7.6, 8.4));
    // divisão: começam juntos no centro e se separam
    const sp = E.io5(P(t, .6, 1.8)), ia = E.out3(P(t, .4, 1.1));
    const frame = E.io5(P(t, 3.6, 4.8));   // entram as molduras
    // dentro das molduras: o CSV vai para o navegador, o recibo para o celular
    const csvS = lerp(L.csv[2], L.br[2] * (FN === "wide" ? .98 : .98) * 860 / 760, frame), pdfS = lerp(L.pdf[2], L.ph[2] * 290 / 440, frame);
    put(csv, { x: lerp(L.c0[0], L.csv[0], sp), y: lerp(L.c0[1], L.csv[1], sp) + frame * (L.br[1] - L.csv[1] + 23 * L.br[2]), s: lerp(.7, 1, sp) * csvS, ry: lerp(0, FN === "wide" ? 8 : 0, sp) * (1 - frame), o: ia * (1 - out) });
    put(pdf, { x: lerp(L.c0[0], L.pdf[0], sp), y: lerp(L.c0[1], L.pdf[1], sp) + frame * (L.ph[1] - L.pdf[1]), s: lerp(.7, 1, sp) * pdfS, ry: lerp(0, FN === "wide" ? -8 : 0, sp) * (1 - frame), z: 10, o: ia * (1 - out) });
    cRows.forEach((r, i) => setS(r, "opacity", E.out3(P(t, .9 + i * .08, 1.3 + i * .08)).toFixed(3)));
    const fa = E.out4(P(t, 1.7, 2.3)) * (1 - E.in2(P(t, 3.4, 3.8)));
    put(fCsv, { x: L.fc[0], y: L.fc[1] + (1 - fa) * 20, z: 30, o: fa * (1 - out) }); put(fPdf, { x: L.fp[0], y: L.fp[1] + (1 - fa) * 20, z: 30, o: fa * (1 - out) });
    put(br, { x: L.br[0], y: L.br[1], s: L.br[2] * lerp(1.08, 1, frame), o: frame * (1 - out) });
    put(ph, { x: L.ph[0], y: L.ph[1], s: L.ph[2] * lerp(1.08, 1, frame), o: frame * (1 - out) });
    const ca = E.out4(P(t, 4.6, 5.4)); put(chips, { x: L.ch[0], y: L.ch[1] + (1 - ca) * 16, s: FN === "wide" ? 1 : 1.05, o: ca * (1 - out) });
    put(head, { x: L.head[0], y: L.head[1] });
    hlAt(head, t, .5, 7.5);
  };
  return S;
})();
