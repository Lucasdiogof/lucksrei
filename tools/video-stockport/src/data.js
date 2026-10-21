"use strict";
/* Base de dados demonstrativa comum a todas as cenas. Dinheiro sempre em CENTAVOS inteiros; nenhuma conta com ponto flutuante.
   A mesma história atravessa o filme: o café é cadastrado (62 un.), recebe entrada (+24 → 86), é vendido na venda #1048
   (−2 → 84), a venda entra no caixa (parte em dinheiro) e no faturamento do dia. Validado por test/validate.mjs.
   Funciona no navegador (window.DATA) e no Node (module.exports). */
(function (root) {
  const P = {
    cafe: { id: "cafe", name: "Café Torrado 500 g", cat: "Mercearia", price: 1890, stock0: 64, min: 20, code: "7891234500017" },
    agua: { id: "agua", name: "Água Mineral 1,5 L", cat: "Bebidas", price: 350, stock0: 149, min: 40, code: "7891234500024" },
    caderno: { id: "caderno", name: "Caderno 96 folhas", cat: "Papelaria", price: 1490, stock0: 23, min: 12, code: "7891234500031" },
    sabao: { id: "sabao", name: "Sabão em Pó 1 kg", cat: "Limpeza", price: 1290, stock0: 7, min: 10, code: "7891234500048" },
  };
  /* movimentações do dia, em ordem cronológica (saldo calculado, nunca digitado) */
  const MOVES = [
    { k: "Entrada", p: "caderno", q: +12, note: "Papelaria Central" },
    { k: "Venda", p: "sabao", q: -1, note: "Venda #1046" },
    { k: "Ajuste", p: "agua", q: -1, note: "Ajuste · avaria" },
    { k: "Venda", p: "cafe", q: -2, note: "Venda #1047" },
    { k: "Entrada", p: "cafe", q: +24, note: "Distribuidora Serra" },     // a entrada da cena de estoque
    { k: "Venda", p: "cafe", q: -2, note: "Venda #1048" },               // a venda do PDV
    { k: "Venda", p: "agua", q: -6, note: "Venda #1048" },
    { k: "Venda", p: "caderno", q: -1, note: "Venda #1048" },
  ];
  const stockAfter = (pid, nMoves) => MOVES.slice(0, nMoves).reduce((s, m) => s + (m.p === pid ? m.q : 0), P[pid].stock0);
  const ENTRY_IDX = 4, SALE_IDX = 5;
  /* a venda #1048 */
  const SALE = {
    n: 1048, customer: "Mariana Souza", discount: 370,
    items: [{ p: "cafe", q: 2 }, { p: "agua", q: 6 }, { p: "caderno", q: 1 }],
    pay: [{ m: "Pix", v: 4000 }, { m: "Dinheiro", v: 3000 }],
  };
  SALE.lines = SALE.items.map(i => ({ ...i, total: P[i.p].price * i.q }));
  SALE.subtotal = SALE.lines.reduce((s, l) => s + l.total, 0);
  SALE.total = SALE.subtotal - SALE.discount;
  SALE.paid = SALE.pay.reduce((s, p) => s + p.v, 0);
  SALE.cash = SALE.pay.filter(p => p.m === "Dinheiro").reduce((s, p) => s + p.v, 0);
  SALE.change = SALE.paid - SALE.total;
  /* caixa do dia: só dinheiro entra na gaveta */
  const CASH = {
    opening: 20000,
    cashSales: [3000, 3780, 6500, 2100, 9830, 3050],   // 6 vendas pagas (total ou parte) em dinheiro; a 1ª é a #1048, a 2ª a #1047 (2 cafés)
    supply: 10000, withdrawal: 15000,
  };
  CASH.cashSalesTotal = CASH.cashSales.reduce((s, v) => s + v, 0);
  CASH.expected = CASH.opening + CASH.cashSalesTotal + CASH.supply - CASH.withdrawal;
  CASH.counted = CASH.expected; CASH.diff = CASH.counted - CASH.expected;
  /* faturamento do dia por forma de pagamento (dinheiro = vendas em dinheiro do caixa) */
  const TODAY = { sales: 23, byMethod: { Pix: 59100, Dinheiro: CASH.cashSalesTotal, "Débito": 23120, "Crédito": 17980 }, profit: 41230 };
  TODAY.revenue = Object.values(TODAY.byMethod).reduce((s, v) => s + v, 0);
  TODAY.ticket = Math.round(TODAY.revenue / TODAY.sales);
  TODAY.pct = Object.fromEntries(Object.entries(TODAY.byMethod).map(([k, v]) => [k, Math.round(v * 100 / TODAY.revenue)]));
  /* últimos 14 dias (o último é hoje) e o período do relatório (01 a 21/10) */
  const DAYS14 = [82040, 94010, 76020, 111030, 126000, 98010, 104050, 118020, 87030, 132010, 115040, 99020, 121060, TODAY.revenue];
  const MONTH = { first7: [101020, 88040, 93070, 120010, 109050, 97030, 112060] };
  MONTH.days = [...MONTH.first7, ...DAYS14];
  MONTH.revenue = MONTH.days.reduce((s, v) => s + v, 0);
  MONTH.sales = 412;
  MONTH.profit = Math.round(MONTH.revenue * 321 / 1000);
  MONTH.margin = Math.round(MONTH.profit * 100 / MONTH.revenue);
  MONTH.top = [{ p: "cafe", q: 186 }, { p: "agua", q: 402 }, { p: "caderno", q: 74 }].map(r => ({ ...r, total: r.q * P[r.p].price }));
  const LOW = [{ name: "Sabão em Pó 1 kg", q: null, min: 10 }, { name: "Biscoito Água e Sal", q: 4, min: 12 }, { name: "Detergente 500 ml", q: 7, min: 15 }];
  LOW[0].q = stockAfter("sabao", MOVES.length);

  /* formatação em centavos inteiros: "R$ 1.284,60" */
  function brl(c, sign = false) {
    const neg = c < 0, a = Math.abs(Math.round(c)), r = Math.floor(a / 100), d = a % 100;
    const s = String(r).replace(/\B(?=(\d{3})+(?!\d))/g, ".") + "," + String(d).padStart(2, "0");
    return (neg ? "− " : sign ? "+ " : "") + "R$ " + s;
  }
  const D = { P, MOVES, ENTRY_IDX, SALE_IDX, stockAfter, SALE, CASH, TODAY, DAYS14, MONTH, LOW, brl };
  if (typeof module !== "undefined") module.exports = D; else root.DATA = D;
})(typeof window !== "undefined" ? window : globalThis);
