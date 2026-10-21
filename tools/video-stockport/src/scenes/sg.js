"use strict";
/* Cena "gestão" (só no vertical): clientes, fornecedores e equipe em três cards grandes, um de cada vez. */
SP.css(`
.sg-c{width:940px;padding:28px 32px;border-radius:26px}
.sg-c .tp{display:flex;align-items:center;gap:20px}
.sg-c .tp .ic{width:76px;height:76px;border-radius:20px;display:flex;align-items:center;justify-content:center;background:rgba(37,99,235,.2);border:1px solid rgba(96,165,250,.38);flex:none}
.sg-c .tp b{display:block;font:700 36px 'SP Roboto';letter-spacing:-.01em;white-space:nowrap}
.sg-c .tp span{display:block;margin-top:6px;font:400 24px 'SP Roboto';color:#9fb2d3;white-space:nowrap}
.sg-c .ln{display:flex;align-items:center;gap:16px;margin-top:22px;height:72px;border-radius:16px;background:rgba(37,99,235,.14);border:1px solid rgba(96,165,250,.3);padding:0 20px;font:400 25px 'SP Roboto';color:#D6E3FA;white-space:nowrap}
.sg-c .ln em{margin-left:auto;font:700 28px 'SP Roboto';font-style:normal;color:#fff}
.sg-team{display:grid;grid-template-columns:1fr 1fr;gap:14px;margin-top:22px}
.sg-team div{display:flex;align-items:center;gap:14px;height:76px;border-radius:16px;background:rgba(6,16,38,.4);border:1px solid rgba(96,165,250,.18);padding:0 16px;font:500 22px 'SP Roboto';white-space:nowrap}
.sg-team div span{display:block;font:400 18px 'SP Roboto';color:#9fb2d3;margin-top:3px}
`);
SP.scenes.sg = (function () {
  const S = { D: 7.6 };
  let cards = [], head;
  S.build = function (root) {
    const e = DATA.MOVES[DATA.ENTRY_IDX];
    cards = [
      h(`<div class="pn blk sg-c"><div class="tp">${KIT.avatar("MS", "#2563EB", 76)}<div><b>${DATA.SALE.customer}</b><span>Cliente · histórico de compras</span></div></div>
        <div class="ln">${KIT.ico("receipt", 28, "#93C5FD", 2)}Venda #${DATA.SALE.n} · hoje<em>${brl(DATA.SALE.total)}</em></div></div>`),
      h(`<div class="pn blk sg-c"><div class="tp"><div class="ic">${KIT.ico("truck", 40, "#9CC7FF", 1.8)}</div><div><b>${e.note}</b><span>Fornecedor · histórico de entradas</span></div></div>
        <div class="ln">${KIT.ico("down", 28, "#4ADE80", 2)}${DATA.P[e.p].name}<em>+${e.q} un.</em></div></div>`),
      h(`<div class="pn blk sg-c"><div class="tp"><div class="ic">${KIT.ico("users", 40, "#9CC7FF", 1.8)}</div><div><b>Equipe</b><span>Cada papel com o seu acesso</span></div></div>
        <div class="sg-team">${[["RA", "Ricardo", "Proprietário", "#2563EB"], ["AR", "Ana", "Gerente", "#0A3D91"], ["JC", "Júlia", "Caixa / atendente", "#1E6CFF"], ["PS", "Pedro", "Somente consulta", "#475569"]].map(p => `<div>${KIT.avatar(p[0], p[3], 48)}<div style="all:unset">${p[1]}<span>${p[2]}</span></div></div>`).join("")}</div></div>`),
    ];
    cards.forEach(c => root.appendChild(c));
    head = hl(["Clientes, fornecedores", "e equipe organizados."], "", { accent: 1 }); head.style.fontSize = "74px"; head.style.textAlign = "center"; root.appendChild(head);
  };
  S.render = function (t) {
    const out = E.in3(P(t, 6.8, 7.6)), Y = [800, 1150, 1540];
    cards.forEach((c, i) => { const a = E.out4(P(t, .6 + i * .7, 1.4 + i * .7)); put(c, { x: 540, y: Y[i] + (1 - a) * 50, s: 1, rx: (1 - a) * 14, o: a * (1 - out) }); });
    put(head, { x: 540, y: 380 });
    hlAt(head, t, .8, 6.9);
  };
  return S;
})();
