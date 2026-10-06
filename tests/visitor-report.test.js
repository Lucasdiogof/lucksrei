/* Valida cálculo e formatação do relatório manual (tools/visitor-report.mjs) com dados fictícios em memória.
 * Nada aqui consulta o D1. Rode: node tests/visitor-report.test.js */
"use strict";
var path = require("path");
var root = path.join(__dirname, "..");
var failures = [];
function check(ok, msg) { if (!ok) failures.push(msg); }

(async function () {
  var R = await import(path.join(root, "tools/visitor-report.mjs").replace(/\\/g, "/").replace(/^([A-Za-z]):/, "file:///$1:"));
  var NOW = new Date(Date.UTC(2026, 9, 20, 12)); // 2026-10-20
  var namer = function (c) { return { BR: "Brasil", US: "Estados Unidos", PT: "Portugal", SG: "Singapura" }[c] || c; };
  function row(ym, country, n, u) { return { ym: ym, country: country, n: n, updated_at: u || 1791000000 }; }

  // --- somente leitura
  check(R.assertReadOnly(R.QUERY) === R.QUERY && /^SELECT ym, country, n, updated_at FROM visits_monthly$/.test(R.QUERY), "a consulta do relatório é um SELECT simples");
  ["DELETE FROM visits_monthly", "UPDATE visits_monthly SET n = 0", "INSERT INTO visits_monthly VALUES (1)", "DROP TABLE visits_monthly",
   "SELECT 1; DROP TABLE visits_monthly", "PRAGMA table_info(visits_monthly)", "SELECT * FROM x WHERE 1 = 1; DELETE FROM x", " select n from t where x = 'a'; "
  ].forEach(function (sql) { var ok = false; try { R.assertReadOnly(sql); } catch (e) { ok = true; } check(ok, "deve recusar: " + sql); });

  // --- banco vazio
  var empty = R.buildReport([], NOW);
  check(empty.total === 0 && empty.countriesCount === 0 && empty.months.length === 0 && empty.comparison === null && empty.firstMonth === null && empty.lastUpdate === null, "banco vazio: tudo zerado, sem comparação");
  check(/Sem visitas registradas/.test(R.formatReport(empty, namer)), "banco vazio: mensagem clara");
  check(R.buildReport(null, NOW).total === 0, "rows nulo não quebra");

  // --- 1 país, 1 mês
  var one = R.buildReport([row("2026-10", "BR", 5, 1791200000)], NOW);
  check(one.total === 5 && one.countriesCount === 1 && one.top[0].code === "BR" && one.top[0].share === 1, "1 país: 100%");
  check(one.months.length === 1 && one.months[0].ym === "2026-10" && one.currentMonthVisits === 5, "1 mês");
  check(one.comparison === null, "1 mês: não inventa comparação");
  var t1 = R.formatReport(one, namer);
  check(/dados insuficientes/.test(t1) && !/Diferença/.test(t1), "1 mês: texto sem comparação");
  check(/Brasil \(BR\)/.test(t1) && /100,0%/.test(t1) && /5 visitas/.test(t1), "1 país: formatação pt-BR");
  check(one.lastUpdate === new Date(1791200000 * 1000).toISOString(), "último update = maior updated_at");

  // --- vários países + XX
  var multi = R.buildReport([
    row("2026-10", "BR", 98), row("2026-10", "US", 11), row("2026-10", "PT", 6), row("2026-10", "SG", 5), row("2026-10", "XX", 3), row("2026-10", "DE", 0)
  ], NOW);
  check(multi.total === 123, "XX entra no total: " + multi.total);
  check(multi.unknown === 3, "XX separado: " + multi.unknown);
  check(multi.countriesCount === 4, "XX e país com 0 fora da contagem: " + multi.countriesCount);
  check(multi.countries.map(function (c) { return c.code; }).join() === "BR,US,PT,SG", "ranking sem XX, ordenado");
  check(Math.abs(multi.top[0].share - 98 / 123) < 1e-12, "percentual sobre o total geral");
  var tm = R.formatReport(multi, namer);
  check(/79,7%/.test(tm) && /8,9%/.test(tm) && /4,9%/.test(tm), "percentuais com 1 casa, vírgula decimal");
  check(/Desconhecido\/Tor:\s+3 visitas/.test(tm) && /XX\s+2,4%/.test(tm), "XX mostrado à parte");
  check(!/\d+\. XX/.test(tm), "XX não aparece no top");
  check(/Países:\s+4/.test(tm), "quantidade de países sem XX");
  var many = []; for (var i = 0; i < 12; i++) many.push(row("2026-10", String.fromCharCode(65 + i) + "A", 20 - i));
  var mr = R.buildReport(many, NOW);
  check(mr.top.length === 10 && mr.countriesCount === 12 && /mais 2 país/.test(R.formatReport(mr, namer)), "top 10 + contagem do resto");
  var tie = R.buildReport([row("2026-10", "US", 2), row("2026-10", "BR", 2)], NOW);
  check(tie.countries[0].code === "BR", "empate desempata por código");

  // --- múltiplos meses, lacuna e comparação
  var months = R.buildReport([row("2026-07", "BR", 4), row("2026-09", "BR", 10), row("2026-09", "US", 10), row("2026-10", "BR", 25), row("2026-10", "XX", 5)], NOW);
  check(months.months.map(function (m) { return m.ym + ":" + m.visits; }).join() === "2026-07:4,2026-08:0,2026-09:20,2026-10:30", "linha do tempo contínua com mês vazio: " + JSON.stringify(months.months));
  check(months.firstMonth === "2026-07", "primeiro mês");
  var c = months.comparison;
  check(c && c.currentVisits === 30 && c.previousVisits === 20 && c.diff === 10 && Math.abs(c.pct - 0.5) < 1e-12, "comparação: +10 (+50%)");
  var tc = R.formatReport(months, namer);
  check(/Diferença: \+10 \(\+50,0%\)/.test(tc), "comparação formatada: " + (tc.match(/Diferença.*/) || [""])[0]);
  var down = R.buildReport([row("2026-09", "BR", 40), row("2026-10", "BR", 30)], NOW).comparison;
  check(down.diff === -10 && Math.abs(down.pct + 0.25) < 1e-12, "queda: -25%");
  check(/Diferença: -10 \(-25,0%\)/.test(R.formatReport(R.buildReport([row("2026-09", "BR", 40), row("2026-10", "BR", 30)], NOW), namer)), "queda formatada");

  // --- divisão por zero
  check(R.ratio(5, 0) === null && R.ratio(0, 0) === null && R.ratio(1, 4) === 0.25, "ratio protegido");
  var zeroPrev = R.buildReport([row("2026-08", "BR", 7), row("2026-10", "BR", 3)], NOW);
  check(zeroPrev.comparison && zeroPrev.comparison.previousVisits === 0 && zeroPrev.comparison.diff === 3 && zeroPrev.comparison.pct === null, "mês anterior com 0: diferença sem percentual");
  var tz = R.formatReport(zeroPrev, namer);
  check(/sem base no mês anterior/.test(tz) && !/Infinity|NaN/.test(tz), "sem Infinity/NaN no texto");
  var zeroCur = R.buildReport([row("2026-09", "BR", 6)], NOW).comparison;
  check(zeroCur.currentVisits === 0 && zeroCur.diff === -6 && zeroCur.pct === -1, "mês atual ainda sem visitas: -100%");

  // --- janela de 12 meses (igual ao site) vs dados retidos (13 meses)
  var win = R.buildReport([row("2025-10", "BR", 2), row("2026-10", "BR", 3)], NOW);
  check(win.total === 5 && win.window12 === 3, "janela de 12 meses separada do total retido");
  check(/últimos 12 meses, como no site: 3/.test(R.formatReport(win, namer)), "aviso da janela do site");

  // --- rótulos e saneamento de erro
  check(R.monthLabel("2026-10") === "Out/2026", "rótulo do mês: " + R.monthLabel("2026-10"));
  check(R.monthKey(new Date(Date.UTC(2026, 0, 15)), -1) === "2025-12", "virada de ano");
  var s = R.sanitize("Authentication error token=abcdefABCDEF0123456789abcdefABCDEF01 db 244f20e5-166c-4f6c-bfa1-0ad648902fab");
  check(s.indexOf("abcdefABCDEF0123456789") < 0 && s.indexOf("244f20e5") < 0 && /\[oculto\]/.test(s), "erro sem token nem id");

  // --- nomes reais via Intl (sem namer injetado) e fallback para o código
  var real = R.formatReport(R.buildReport([row("2026-10", "SG", 2), row("2026-10", "QQ", 1)], NOW));
  check(/Singapura \(SG\)/.test(real) && /QQ \(QQ\)/.test(real), "nomes em pt-BR e fallback ISO");

  // --- estados/regiões
  check(R.assertReadOnly(R.REGION_QUERY) === R.REGION_QUERY && /^SELECT ym, country, region, name, n, updated_at FROM visits_region_monthly$/.test(R.REGION_QUERY), "consulta de regiões é um SELECT simples");
  check(R.buildRegions(null) === null && /indisponível/.test(R.formatRegions(null, namer)), "tabela ausente: aviso, sem erro");
  var noReg = R.buildRegions([]);
  check(noReg.countries.length === 0 && /ainda sem visitas com estado/.test(R.formatRegions(noReg, namer)), "sem dados por estado: aviso");
  function rr(ym, c, r, name, n, u) { return { ym: ym, country: c, region: r, name: name, n: n, updated_at: u || 1791000000 }; }
  var reg = R.buildRegions([rr("2026-10", "BR", "GO", "Goias", 3), rr("2026-10", "BR", "SP", "", 2), rr("2026-10", "BR", "XX", "", 1), rr("2026-10", "BR", "DF", "Federal District", 1),
    rr("2026-10", "US", "CA", "California", 2), rr("2026-10", "XX", "XX", "", 4), rr("2026-10", "PT", "11", "Lisbon", 0)]);
  check(reg.countries.map(function (c) { return c.country + c.visits; }).join() === "BR7,US2", "países com região, sem XX e sem n=0: " + JSON.stringify(reg.countries.map(function (c) { return c.country; })));
  check(reg.countries[0].unknown === 1 && reg.countries[0].items.map(function (i) { return i.code; }).join() === "GO,SP,DF", "BR: ranking sem XX, desconhecido à parte");
  check(Math.abs(reg.countries[0].items[0].share - 3 / 7) < 1e-12, "% dentro do país");
  var tr = R.formatRegions(reg, namer);
  check(/Goiás \(GO\)/.test(tr) && /São Paulo \(SP\)/.test(tr) && /Distrito Federal \(DF\)/.test(tr), "nomes oficiais dos estados do Brasil");
  check(/California \(CA\)/.test(tr) && /Sem estado identificado: 1 \(14,3%\)/.test(tr) && /42,9%/.test(tr), "outros países pelo nome da Cloudflare; desconhecido com %");
  check(!/XX/.test(tr), "XX nunca aparece como estado");
  var manyR = []; for (var q = 0; q < 12; q++) manyR.push(rr("2026-10", "BR", "R" + String.fromCharCode(65 + q), "", 20 - q));
  check(/mais 2 região/.test(R.formatRegions(R.buildRegions(manyR), namer)), "top 10 regiões + resto contado");
  var manyC = ["AR", "BR", "CL", "DE", "ES", "FR", "GB"].map(function (c, i) { return rr("2026-10", c, "A", "", 10 - i); });
  check(/mais 2 país/.test(R.formatRegions(R.buildRegions(manyC), namer)), "top 5 países + resto contado");

  if (failures.length) { console.error("FALHOU:\n - " + failures.join("\n - ")); process.exit(1); }
  console.log("ok — relatório: somente SELECT, vazio, 1/vários países, XX à parte, 1/vários meses, comparação, divisão por zero, janela de 12 meses");
})().catch(function (e) { console.error(e); process.exit(1); });
