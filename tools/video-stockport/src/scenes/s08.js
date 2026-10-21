"use strict";
/* Cena 8 — equipe e acessos. Matriz de permissões por papel, fiel ao app (role_permissions):
   proprietário tudo; gerente sem gestão de equipe; caixa vende e opera o caixa, só consulta estoque; somente consulta. */
SP.css(`
.s8-m{width:1320px;height:640px;padding:30px 34px}
.s8-m .hd{display:flex;align-items:center;gap:16px;margin-bottom:22px}
.s8-m .hd .ic{width:58px;height:58px;border-radius:16px;background:rgba(37,99,235,.2);border:1px solid rgba(96,165,250,.35);display:flex;align-items:center;justify-content:center}
.s8-m .hd b{display:block;font:700 28px 'SP Roboto'}
.s8-m .hd span{display:block;margin-top:4px;font:400 17px 'SP Roboto';color:#8EA3C7}
.s8-g{display:grid;grid-template-columns:420px repeat(5,1fr);align-items:center}
.s8-g .ch{font:500 14px 'SP Roboto';letter-spacing:.04em;text-transform:uppercase;color:#8EA3C7;text-align:center;padding-bottom:14px;white-space:nowrap}
.s8-row{display:contents}
.s8-p{display:flex;align-items:center;gap:16px;height:104px;border-top:1px solid rgba(110,160,250,.12)}
.s8-p b{display:block;font:500 23px 'SP Roboto';white-space:nowrap}
.s8-p .rl{margin-top:8px}
.s8-cell{height:104px;border-top:1px solid rgba(110,160,250,.12);display:flex;align-items:center;justify-content:center}
.s8-cell i{width:52px;height:52px;border-radius:15px;display:flex;align-items:center;justify-content:center}
.s8-cell i.y{background:rgba(37,99,235,.22);border:1px solid rgba(96,165,250,.5)}
.s8-cell i.v{background:rgba(148,163,184,.12);border:1px solid rgba(148,163,184,.3)}
.s8-cell i.n{background:rgba(15,23,42,.35);border:1px dashed rgba(148,163,184,.22)}
.s8-leg{display:flex;gap:26px;margin-top:20px;font:400 17px 'SP Roboto';color:#8EA3C7}
.s8-leg span{display:flex;align-items:center;gap:8px}
`);
SP.scenes.s08 = (function () {
  const S = { D: 7.8 };
  let mx, rowsP = [], cells = [], head;
  const COLS = ["Vendas e caixa", "Estoque", "Relatórios", "Custos e lucro", "Equipe"];
  // no 1:1 e no 9:16 a matriz fica com 3 colunas para caber grande na tela
  const KEEP = FN === "wide" ? [0, 1, 2, 3, 4] : [0, 2, 3];
  const PEOPLE = [
    ["RA", "Ricardo Alves", "Proprietário", "#2563EB", "yyyyy"],
    ["AR", "Ana Ribeiro", "Gerente", "#0A3D91", "yyyyn"],
    ["JC", "Júlia Costa", "Caixa / atendente", "#1E6CFF", "yvnnn"],
    ["PS", "Pedro Santos", "Somente consulta", "#475569", "nvnnn"],
  ];
  const IC = { y: ["check", "#9CC7FF"], v: ["eye", "#CBD5E1"], n: ["lock", "#64748B"] };
  S.build = function (root) {
    mx = h(`<div class="pn blk s8-m"><div class="hd"><div class="ic">${KIT.ico("building", 30, "#9CC7FF")}</div><div><b>Mercado Bom Dia · Equipe</b><span>Cada pessoa vê e faz apenas o que o seu papel permite</span></div></div>
      <div class="s8-g"><div></div>${KEEP.map(j => `<div class="ch">${COLS[j]}</div>`).join("")}
      ${PEOPLE.map(p => `<div class="s8-p">${KIT.avatar(p[0], p[3], 54)}<div><b>${p[1]}</b><div class="rl"><span class="chip ${p[2] === "Proprietário" ? "" : "sl"}" style="height:30px;font-size:15px">${p[2]}</span></div></div></div>${KEEP.map(j => p[4][j]).map(k => `<div class="s8-cell"><i class="${k}">${KIT.ico(IC[k][0], 26, IC[k][1], 2.2)}</i></div>`).join("")}`).join("")}</div>
      <div class="s8-leg"><span>${KIT.ico("check", 18, "#9CC7FF", 2.4)}Pode operar</span><span>${KIT.ico("eye", 18, "#CBD5E1")}Só consulta</span><span>${KIT.ico("lock", 18, "#64748B")}Sem acesso</span></div></div>`);
    if (FN !== "wide") { mx.style.width = "1000px"; $(".s8-g", mx).style.gridTemplateColumns = "400px repeat(3,1fr)"; }
    root.appendChild(mx); rowsP = $$(".s8-p", mx); cells = $$(".s8-cell i", mx);
    head = hl(["Sua equipe, cada um", "com o acesso certo."], "", { accent: 1 }); head.style.fontSize = pick({ wide: 56, sq: 60, tall: 74 }) + "px"; head.style.textAlign = pick({ wide: "left", sq: "center", tall: "center" }); root.appendChild(head);
  };
  const LY = () => pick({ wide: { m: [1300, 560, .98], head: [110, 540] }, sq: { m: [540, 640, 1.0], head: [540, 150] }, tall: { m: [540, 1100, 1.04], head: [540, 480] } });
  S.render = function (t) {
    const L = LY(), out = E.in3(P(t, 6.6, 7.3)), mi = E.out4(P(t, .5, 1.5));
    put(mx, { x: L.m[0] + (1 - mi) * 60, y: L.m[1], s: L.m[2], ry: (1 - mi) * -22 + Math.sin(t * .4) * 1.5 * (FN === "wide" ? 1 : 0) - (FN === "wide" ? 6 : 0), o: mi * (1 - out) });
    rowsP.forEach((r, i) => { const a = E.out4(P(t, .7 + i * .15, 1.3 + i * .15)); setS(r, "opacity", a.toFixed(3)); setS(r, "transform", `translateX(${((1 - a) * -24).toFixed(1)}px)`); });
    cells.forEach((c, k) => { const row = Math.floor(k / KEEP.length), col = k % KEEP.length; const a = spr(t - 1.3 - col * .14 - row * .1, 13, .6); setS(c, "opacity", cl((t - 1.3 - col * .14 - row * .1) * 5).toFixed(3)); setS(c, "transform", `scale(${(.4 + .6 * a).toFixed(3)})`); });
    put(head, { x: L.head[0] + (FN === "wide" ? (head._w || head.offsetWidth) / 2 : 0), y: L.head[1] });
    hlAt(head, t, .6, 6.5);
  };
  return S;
})();
