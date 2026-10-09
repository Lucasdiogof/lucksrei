/* Valida Technical Skills: dados, ordem, logos, textos PT/EN/ES e vínculos. Rode: node tests/skills.test.js */
"use strict";
var fs = require("fs");
var path = require("path");
var root = path.join(__dirname, "..");
var failures = [];
function check(ok, msg) { if (!ok) failures.push(msg); }
function read(p) { return fs.readFileSync(path.join(root, p), "utf8"); }

var D = require(path.join(root, "assets/js/skills-data.js"));
var T = require(path.join(root, "assets/js/skills-details.js"));
var LOCALES = ["en", "pt-BR", "es"];

var EXPECTED = ["flutter", "dart", "android", "ios", "flavors", "bloc", "provider", "clean-architecture", "solid", "tdd", "dependency-injection",
  "automated-testing", "rest-api", "supabase", "postgresql", "firebase", "jwt", "hive", "sembast", "objectdb", "codemagic", "fastlane", "github-actions",
  "azure-devops", "git", "github", "java", "sql", "mysql", "db2", "zk-framework", "javascript", "typescript"];
check(JSON.stringify(D.ORDER.map(function (s) { return s.id; })) === JSON.stringify(EXPECTED), "ordem da grade diferente da esperada (mobile primeiro)");

var ids = {};
D.ORDER.forEach(function (s) {
  check(!ids[s.id], "id duplicado: " + s.id); ids[s.id] = s;
  check(s.name && typeof s.name === "string", "sem nome: " + s.id);
  var svgPath = "assets/img/skills/" + s.id + "." + (s.ext || "svg");
  check(fs.existsSync(path.join(root, svgPath)), "logo ausente: " + svgPath);
  if (s.ext === "png") {
    var png = fs.readFileSync(path.join(root, svgPath));
    check(png.slice(1, 4).toString() === "PNG" && png.readUInt32BE(16) >= 100 && png.length < 60000, "png inválido ou grande demais: " + s.id);
  } else if (fs.existsSync(path.join(root, svgPath))) {
    var svg = read(svgPath);
    check(/^<svg[^>]+viewBox="/.test(svg), "svg inválido: " + s.id);
    check(!/<script|<image|href="http|onload=/i.test(svg), "svg com conteúdo ativo/externo: " + s.id);
    check(!/<rect[^>]*width="(100%|24|128)"/.test(svg), "svg com retângulo de fundo: " + s.id);
    check(!/fill="(#fff|#ffffff|white)"/i.test(svg) || ["java"].indexOf(s.id) >= 0, "fill branco inesperado: " + s.id);
    check(!/(background|style)=[^>]*#fff/i.test(svg), "svg com fundo branco inline: " + s.id);
  }
  if (s.label) LOCALES.forEach(function (l) { check(s.label[l], "label " + l + " ausente: " + s.id); });
  s.exp.forEach(function (e) { check(D.EXPERIENCES[e], s.id + ": experiência desconhecida " + e); });
  s.projects.forEach(function (p) { check(D.PROJECTS[p], s.id + ": projeto desconhecido " + p); });
  s.related.forEach(function (r) { check(D.ORDER.some(function (x) { return x.id === r; }), s.id + ": relacionada desconhecida " + r); check(r !== s.id, s.id + " relaciona a si mesma"); });
  check(T[s.id], "sem textos: " + s.id);
  LOCALES.forEach(function (l) {
    var tx = T[s.id] && T[s.id][l];
    check(Array.isArray(tx) && tx.length === 3 && tx.every(function (x, i) { return typeof x === "string" && x.length > (i === 0 ? 8 : 20); }), "textos incompletos " + l + ": " + s.id);
    if (tx) check(tx.every(function (x) { return x.length <= 260; }), "texto longo demais " + l + ": " + s.id);
  });
});
Object.keys(T).forEach(function (id) { check(ids[id], "texto órfão: " + id); });

// projetos com estudo de caso apontam para páginas que existem; os demais para /apps/
Object.keys(D.PROJECTS).forEach(function (id) {
  var p = D.PROJECTS[id];
  check(p.href.charAt(0) === "/", "link externo em " + id);
  var file = p.href.replace(/#.*/, "").replace(/^\//, "") + "index.html";
  check(fs.existsSync(path.join(root, file)), "página inexistente para " + id + ": " + p.href);
  if (p.caseStudy) check(/^\/projects\//.test(p.href), "case study fora de /projects: " + id);
});
var apps = { window: {} }; require("vm").runInNewContext(read("assets/js/apps-data.js"), apps);

// vínculos informados pelo Lucas
function has(skill, kind, id) { return ids[skill][kind].indexOf(id) >= 0; }
["cooper-tec", "agrosmart", "toro", "iza", "freelance"].forEach(function (e) { check(has("flutter", "exp", e), "Flutter sem " + e); });
["cooper-pay", "boosteragro", "boosterpro", "santander", "iza-seguros", "match-queue", "fan-hub", "la-pelve", "aprovaura"].forEach(function (p) { check(has("flutter", "projects", p), "Flutter sem " + p); });
check(has("codemagic", "exp", "cooper-tec") && ids.codemagic.exp.length === 1, "Codemagic = só Cooper Tec");
check(has("flavors", "exp", "cooper-tec") && ids.flavors.exp.length === 1, "Flutter Flavors = só Cooper Tec");
["fastlane", "github-actions"].forEach(function (s) { check(ids[s].exp.length === 1 && has(s, "exp", "agrosmart") && has(s, "projects", "boosteragro") && has(s, "projects", "boosterpro"), s + " = Agrosmart / BoosterAGRO / BoosterPRO"); });
check(ids["azure-devops"].exp.join() === "toro" && has("azure-devops", "projects", "santander"), "Azure DevOps = Toro / Santander Corretora");
["hive", "sembast"].forEach(function (s) { check(ids[s].exp.join() === "agrosmart", s + " = Agrosmart"); });
["supabase", "postgresql"].forEach(function (s) { ["match-queue", "fan-hub", "la-pelve", "aprovaura"].forEach(function (p) { check(has(s, "projects", p), s + " sem " + p); }); check(ids[s].exp.length === 0, s + " não deve ter empresa"); });
["cooper-tec", "agrosmart", "toro"].forEach(function (e) { check(has("clean-architecture", "exp", e), "Clean Architecture sem " + e); });
check(ids.java.exp.join() === "memora,saneago" && ids["zk-framework"].exp.join() === "memora,saneago", "Java e ZK = Memora e Saneago");
check(ids.objectdb.exp.join() === "freelance" && has("objectdb", "projects", "emater") && has("objectdb", "projects", "agr-fiscal"), "ObjectDB = Emater-GO Mobi e AGR Fiscal");
check(/Java\/Web, not mobile/.test(T.java.en[2]) && /Java\/Web, não mobile/.test(T.java["pt-BR"][2]) && /Java\/Web, no móvil/.test(T.java.es[2]), "Java deve dizer que a atuação na Memora foi Java/Web");
check(/Cooper Pay Corporate/.test(T.flavors.en[2]) && /PJ/.test(T.flavors.en[2]) && /not a white-label/.test(T.flavors.en[2]), "Flavors deve ressalvar o Cooper Pay Corporate");
check(/ObjectBox/.test(T.objectdb.en[1]) && /Not to be confused/.test(T.objectdb.en[1]), "ObjectDB deve avisar que não é ObjectBox");
// nenhum texto pode soar como falta de experiência
check(!/No specific|not attributed|attributed to it|Nenhuma empresa|nenhuma empresa|ninguna empresa|Aquí no se le atribuye|no experience|sem experiência/i.test(JSON.stringify(T)), "texto que transmite falta de experiência");
// vínculos de projetos conferidos com as páginas de estudo de caso e /apps
check(["flutter", "dart", "android", "ios", "supabase", "postgresql"].every(function (s) { return has(s, "projects", "fan-hub") || s === "dart"; }), "Goiás App: Flutter, Android, iOS, Supabase, PostgreSQL");
check(has("clean-architecture", "projects", "fan-hub"), "Goiás App documenta Clean Architecture");
check(!has("android", "projects", "match-queue") && has("ios", "projects", "match-queue"), "Match Queue só iOS");
// Tabela Fone e apps só descritos no apps-data.js: sem vínculo de tecnologia (apps-data não é prova independente)
check(!D.PROJECTS["tabela-fone"] && !JSON.stringify(D.ORDER).match(/tabela-fone|"vai"|"gpol"/) && !/Tabela Fone/.test(JSON.stringify(T)), "Tabela Fone/Vai/GPOL sem vínculos de tecnologia");
check(ids.bloc.projects.length === 0 && ids["rest-api"].exp.length === 0 && ids["rest-api"].projects.length === 0 && ids.firebase.exp.join() === "iza", "BLoC/REST/Firebase só com vínculos comprovados");
check(D.PROJECTS["fan-hub"].name === "FanHub" && D.PROJECTS["fan-hub"].href === "/projects/fan-hub/", "FanHub como nome do produto, URL preservada");
check(/FanHub/.test(T.supabase.en[2]) && !/Goiás App/.test(T.supabase.en[2]), "Supabase cita o produto como FanHub");
check(ids.hive.projects.length === 0 && ids.sembast.projects.length === 0, "Hive/Sembast: só a experiência comprovada (Agrosmart)");
// skills sem evidência não recebem empresa nem projeto
["provider", "solid", "dependency-injection", "jwt", "git", "github", "sql", "mysql", "db2", "javascript", "typescript"].forEach(function (s) { check(ids[s].exp.length === 0 && ids[s].projects.length === 0, s + " sem evidência não pode ter vínculos"); });
// nomes de experiência batem com a linha do tempo da home
var home = read("index.html");
["Cooper Tec", "Agrosmart", "Toro Investimentos", "IZA", "Saneago"].forEach(function (n) { check(home.indexOf(">" + n + "<") >= 0 || read("assets/i18n/en.js").indexOf('"' + n + '"') >= 0, "experiência fora da home: " + n); });

// regras de interface: sem níveis, percentuais, barras ou emojis
var all = read("assets/js/skills.js") + read("assets/js/skills-data.js") + read("assets/js/skills-details.js") + read("index.html").match(/<section id="skills"[\s\S]*?<\/section>/)[0];
check(!/\b(Expert|Advanced|Beginner|Intermediate|Mid)\b/.test(all), "etiqueta de nível proibida");
check(!/\d\s?%|progress|<meter/i.test(all.replace(/100%/g, "")), "percentual/barra de progresso proibida");
check(!/[\u{1F300}-\u{1FAFF}☀-➿]/u.test(all), "emoji proibido");
check(!/\b(Claude|Anthropic|ChatGPT|OpenAI)\b/i.test(read("assets/js/skills-details.js") + read("assets/js/skills-data.js")), "referência a IA/gerador");
// HTML da home: seção, script de dados antes do script da grade
check(/<ul class="skill-grid" id="skill-grid"/.test(home), "grade ausente na home");
check(home.indexOf("skills-data.js") > 0 && home.indexOf("skills-data.js") < home.indexOf("/assets/js/skills.js"), "skills-data.js deve vir antes de skills.js");
// seções existentes continuam e na mesma ordem
var order = ["sobre", "projetos", "processo", "skills", "experiencia", "contato"].map(function (id) { return home.indexOf('<section id="' + id + '"'); });
check(order.every(function (v, i) { return v > 0 && (i === 0 || v > order[i - 1]); }), "ordem das seções da home");

if (failures.length) { console.error("FALHOU:\n - " + failures.join("\n - ")); process.exit(1); }
console.log("ok — skills: " + D.ORDER.length + " tecnologias, logos locais, textos nos 3 idiomas, vínculos conferidos com o histórico");
