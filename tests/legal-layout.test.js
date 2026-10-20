/* Project legal layouts: keep title, breadcrumb and content on the same reading rail.
 * Run: node tests/legal-layout.test.js
 */
"use strict";
var fs = require("fs");
var path = require("path");
var root = path.join(__dirname, "..");
var css = fs.readFileSync(path.join(root, "assets/css/style.css"), "utf8");
var failures = [];
function check(value, message) { if (!value) failures.push(message); }

check(/main > \[data-legal\] > \.page-hero > \.container\{ max-width: 760px; \}/.test(css),
  "hero dos documentos deve usar a largura de leitura de 760px");
check(/main > \[data-legal\] > \.page-hero h1\{[^}]*text-wrap: balance;/.test(css),
  "títulos longos não devem deixar a última palavra isolada");
check(/main > \[data-legal\] > section:not\(\.page-hero\)\{ padding: 42px 0 72px; \}/.test(css),
  "o conteúdo não deve herdar o vão de 88px do section global");
check(/main > \[data-legal\] \.legal-body \.legal-draft \+ h2\{ margin-top: 28px; \}/.test(css),
  "o primeiro título após o aviso deve ter espaçamento editorial");
check(/@media \(max-width: 700px\)\{[\s\S]*?main > \[data-legal\] > \.page-hero\{ padding: 36px 0 26px; \}/.test(css),
  "ajuste mobile do cabeçalho jurídico ausente");

function walk(dir, found) {
  fs.readdirSync(dir, { withFileTypes: true }).forEach(function (entry) {
    var file = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(file, found);
    else if (entry.name === "index.html") {
      var html = fs.readFileSync(file, "utf8");
      if (html.includes('data-legal="pt-BR"')) found.push({ file: file, html: html });
    }
  });
  return found;
}
var pages = walk(path.join(root, "projects"), []);
check(pages.length >= 14, "inventário de documentos legais inesperadamente menor: " + pages.length);
pages.forEach(function (page) {
  var html = page.html, relative = path.relative(root, page.file);
  ["en", "pt-BR", "es"].forEach(function (locale) {
    check(html.includes('data-legal="' + locale + '"'), relative + ": locale " + locale + " ausente");
  });
  var heroes = (html.match(/class="page-hero lk-grid"/g) || []).length;
  var bodies = (html.match(/class="container legal-body" style="max-width:760px"/g) || []).length;
  check(heroes === 3 && bodies === 3, relative + ": 3 heroes e 3 artigos alinhados esperados");
});
if (failures.length) { console.error("FALHOU:\n - " + failures.join("\n - ")); process.exit(1); }
console.log("ok — " + pages.length + " documentos de projeto, 3 idiomas cada, hero e artigo alinhados");
