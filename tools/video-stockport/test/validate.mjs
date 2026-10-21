// Validação dos dados demonstrativos do filme (centavos inteiros, estoque, venda, caixa, indicadores).
// uso: node test/validate.mjs   → sai com código 1 se alguma regra falhar.
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const D = require('../src/data.js');
let fails = 0;
const ok = (cond, msg) => { console.log(`${cond ? 'ok  ' : 'FAIL'} ${msg}`); if (!cond) fails++; };
const isInt = v => Number.isInteger(v);
const { P, SALE, CASH, TODAY, MONTH, DAYS14, LOW, brl, stockAfter, MOVES } = D;

// dinheiro: tudo inteiro
for (const p of Object.values(P)) ok(isInt(p.price) && p.price > 0, `preço inteiro em centavos: ${p.name} = ${brl(p.price)}`);
ok([SALE.subtotal, SALE.total, SALE.discount, CASH.expected, TODAY.revenue, MONTH.revenue, MONTH.profit].every(isInt), 'todos os totais são inteiros em centavos');
// formatação
ok(brl(7000) === 'R$ 70,00' && brl(128460) === 'R$ 1.284,60' && brl(-15000) === '− R$ 150,00' && brl(5) === 'R$ 0,05', 'formatação BRL');
// venda #1048
ok(SALE.lines.every(l => l.total === P[l.p].price * l.q), 'linhas do carrinho = preço × quantidade');
ok(SALE.subtotal === 7370, `subtotal ${brl(SALE.subtotal)}`);
ok(SALE.total === SALE.subtotal - SALE.discount && SALE.total === 7000, `total ${brl(SALE.total)} = subtotal − desconto`);
ok(SALE.paid === SALE.total && SALE.change === 0, `pagamentos (${SALE.pay.map(p => p.m + ' ' + brl(p.v)).join(' + ')}) cobrem o total, troco ${brl(SALE.change)}`);
ok(SALE.discount < SALE.subtotal && SALE.discount > 0, 'desconto positivo e menor que o subtotal');
// estoque
for (const id of Object.keys(P)) for (let n = 0; n <= MOVES.length; n++) ok(stockAfter(id, n) >= 0, `saldo não negativo: ${id} após ${n} movimentos = ${stockAfter(id, n)}`);
ok(stockAfter('cafe', 4) === 62 && stockAfter('cafe', 5) === 86 && stockAfter('cafe', 6) === 84, 'café: 62 → entrada +24 → 86 → venda −2 → 84');
ok(stockAfter('sabao', MOVES.length) < P.sabao.min, `sabão abaixo do mínimo (${stockAfter('sabao', MOVES.length)} < ${P.sabao.min})`);
ok(LOW.every(l => l.q < l.min), 'lista "produtos para repor" só tem itens abaixo do mínimo');
for (const s of SALE.items) ok(stockAfter(s.p, D.SALE_IDX) >= s.q, `venda não excede o estoque: ${s.p}`);
// caixa
ok(CASH.cashSales[1] === 2 * P.cafe.price, 'a venda #1047 (2 cafés, dinheiro) está nas vendas em dinheiro');
ok(CASH.cashSales[0] === SALE.cash, `a venda #1048 entra na gaveta só com a parte em dinheiro (${brl(SALE.cash)})`);
ok(CASH.expected === CASH.opening + CASH.cashSalesTotal + CASH.supply - CASH.withdrawal, `esperado na gaveta ${brl(CASH.expected)} = abertura + vendas em dinheiro + suprimento − sangria`);
ok(CASH.diff === 0, 'fechamento sem diferença');
ok(CASH.withdrawal <= CASH.opening + CASH.cashSalesTotal + CASH.supply, 'sangria não excede o dinheiro disponível');
// dia
ok(TODAY.byMethod.Dinheiro === CASH.cashSalesTotal, 'faturamento em dinheiro = vendas em dinheiro do caixa');
ok(TODAY.revenue === 128460, `faturamento hoje ${brl(TODAY.revenue)}`);
ok(Object.values(TODAY.pct).reduce((s, v) => s + v, 0) === 100, `percentuais por forma de pagamento somam 100 (${JSON.stringify(TODAY.pct)})`);
ok(TODAY.profit < TODAY.revenue && TODAY.profit > 0, `lucro estimado ${brl(TODAY.profit)} menor que o faturamento`);
ok(DAYS14[DAYS14.length - 1] === TODAY.revenue, 'última barra do gráfico = faturamento de hoje');
ok(TODAY.sales >= CASH.cashSales.length, 'vendas do dia ≥ vendas em dinheiro');
// mês
ok(MONTH.days.length === 21, `relatório de 01 a 21/10 = 21 dias, faturamento ${brl(MONTH.revenue)}, lucro ${brl(MONTH.profit)}`);
ok(MONTH.top.every(r => r.total === r.q * P[r.p].price), 'tabela de mais vendidos = quantidade × preço');
ok(MONTH.top.reduce((s, r) => s + r.total, 0) < MONTH.revenue, 'mais vendidos cabem no faturamento do período');
ok(MONTH.margin === Math.round(MONTH.profit * 100 / MONTH.revenue), `margem ${MONTH.margin}%`);
console.log(fails ? `\n${fails} falha(s)` : '\ntodos os dados conferem');
process.exit(fails ? 1 : 0);
