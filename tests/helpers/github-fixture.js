/* Fixture SINTÉTICA no formato do fragmento público de contribuições do GitHub. Só para testes e preview local:
   os números aqui não são os do perfil real. */
"use strict";

// 371 dias terminando em `end` (AAAA-MM-DD), começando num domingo, como o calendário do GitHub
function makeDays(end) {
  var e = new Date(end + "T00:00:00Z");
  var start = new Date(e.getTime() - 52 * 7 * 86400000);
  start = new Date(start.getTime() - start.getUTCDay() * 86400000);
  var days = [];
  for (var d = start, i = 0; d <= e; d = new Date(d.getTime() + 86400000), i++) {
    var n = (i * 7 + (i % 5) * 3) % 11;
    if (i % 3 === 0 || i % 17 === 0) n = 0;
    var level = n === 0 ? 0 : n < 3 ? 1 : n < 6 ? 2 : n < 9 ? 3 : 4;
    days.push([d.toISOString().slice(0, 10), n, level]);
  }
  return days;
}

function buildHtml(days) {
  var tds = "", tips = "";
  days.forEach(function (d, i) {
    var id = "contribution-day-component-" + (i % 7) + "-" + Math.floor(i / 7);
    tds += '<td tabindex="0" data-ix="' + Math.floor(i / 7) + '" aria-selected="false" aria-describedby="contribution-graph-legend-level-' + d[2] +
      '" style="width: 10px" data-date="' + d[0] + '" id="' + id + '" data-level="' + d[2] + '" role="gridcell" data-view-component="true" class="ContributionCalendar-day"></td>\n';
    tips += '<tool-tip id="tooltip-' + i + '" for="' + id + '" popover="manual" data-direction="n" data-type="label" data-view-component="true" class="sr-only position-absolute">' +
      (d[1] === 0 ? "No contributions" : d[1] + (d[1] === 1 ? " contribution" : " contributions")) + " on " + d[0] + ".</tool-tip>\n";
  });
  return '<div class="js-yearly-contributions"><h2>' + days.reduce(function (s, d) { return s + d[1]; }, 0) + ' contributions in the last year</h2><table><tbody><tr>' + tds + "</tr></tbody></table>" + tips + "</div>";
}

module.exports = { makeDays: makeDays, buildHtml: buildHtml };
