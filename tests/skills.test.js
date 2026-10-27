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

var EXPECTED = ["flutter","dart","android","ios","clean-architecture","bloc","tdd","automated-testing","playwright","dependency-injection","get-it","go-router","freezed","getx","scoped-model","solid","rest-api","graphql","grpc","signalr","supabase","supabase-realtime","edge-functions","offline-first","sqlite","postgresql","firebase","firebase-auth","fastlane","codemagic","github-actions","app-store-connect","google-play-console","in-app-purchases","git","github","rls","modular-packages","cloudflare-workers","cloudflare-pages","crashlytics","remote-config","firebase-messaging","onesignal","resend","firestore","whatsapp-api","zendesk","facebook-login","sentry","firebase-rtdb","gemini","ml-kit","deep-links","i18n","gps","google-maps","mapbox","maplibre","web-pwa","pdf","flavors","webview","barcode-scanning","biometrics","hive","sembast","micro-frontends","jwt","scrum","azure-devops","gitlab","sql","provider","typescript","javascript","react","nextjs","tailwind","java","spring","mongodb","mysql","db2","objectdb","zk-framework","oracle"];
check(JSON.stringify(D.ORDER.map(function (s) { return s.id; })) === JSON.stringify(EXPECTED), "ordem da grade diferente da esperada (por importância)");

// Conceitos e produtos sem logotipo distinto confiável devem usar a apresentação sem imagem.
var TEXT_ONLY = ["modular-packages","micro-frontends","firebase-auth","firestore","firebase-rtdb"];
TEXT_ONLY.forEach(function (id) {
  var s = D.ORDER.find(function (item) { return item.id === id; });
  check(s && s.text === true, id + ": deve ser apresentado apenas com texto");
});
// Cards somente com texto devem permanecer distribuídos entre as tecnologias com logos.
var TEXT_POSITIONS = D.ORDER.map(function (s, i) { return s.text ? i : -1; }).filter(function (i) { return i >= 0; });
check(TEXT_POSITIONS.every(function (pos, i) { return i === 0 || pos - TEXT_POSITIONS[i - 1] >= 4; }),
  "skills sem ícone devem ficar distribuídas na grade, sem blocos agrupados");
check(D.ORDER.find(function (s) { return s.id === "firebase-auth"; }).name === "Firebase Auth",
  "rótulo de Firebase Auth deve permanecer abreviado");
check(D.ORDER.find(function (s) { return s.id === "firebase-rtdb"; }).name === "Firebase Realtime",
  "rótulo de Firebase Realtime deve permanecer abreviado");
check(D.ORDER.findIndex(function (s) { return s.id === "flavors"; }) > 50 &&
  D.ORDER.findIndex(function (s) { return s.id === "modular-packages"; }) > 30,
  "Flutter Flavors e Modular Packages devem ficar mais abaixo na grade");
// O destaque de cards sem logo deve ser tipográfico, sem borda temática ou hover especial.
var STYLE = read("assets/css/style.css");
check(!/\.skill\.is-text\s*\{[^}]*border/.test(STYLE), "cards só-texto não devem ter borda especial");
check(!/\.skill\.is-text:hover\s+\.skill-name/.test(STYLE), "cards só-texto sem destaque dourado exclusivo");
check(!/\.skill\.is-text\s+\.skill-name\s*\{/.test(STYLE), "cards só-texto devem herdar integralmente a tipografia de .skill-name");
check(/\.skill-name\s*\{[^}]*font-family:\s*var\(--font-mono\);[^}]*font-size:\s*11\.5px/.test(STYLE), "tipografia base igual à de Supabase Edge Functions");
check(D.ORDER.find(function (s) { return s.id === "get-it"; }).name === "GetIt", "nome visual do get_it deve ser GetIt");
var ids = {};
D.ORDER.forEach(function (s) {
  check(!ids[s.id], "id duplicado: " + s.id); ids[s.id] = s;
  check(s.name && typeof s.name === "string", "sem nome: " + s.id);
  var svgPath = "assets/img/skills/" + s.id + "." + (s.ext || "svg");
  // text: true = cartão sem logo (só o nome em branco); nesse caso não pode haver ext/wide nem arquivo de logo
  if (s.text) check(!s.ext && !s.wide && !fs.existsSync(path.join(root, "assets/img/skills/" + s.id + ".svg")) && !fs.existsSync(path.join(root, "assets/img/skills/" + s.id + ".png")), "skill só-texto com logo sobrando: " + s.id);
  else check(fs.existsSync(path.join(root, svgPath)), "logo ausente: " + svgPath);
  if (s.text) { /* sem logo */ } else if (s.ext === "png") {
    var png = fs.readFileSync(path.join(root, svgPath));
    check(png.slice(1, 4).toString() === "PNG" && png.readUInt32BE(16) >= 100 && png.length < 60000, "png inválido ou grande demais: " + s.id);
  } else if (fs.existsSync(path.join(root, svgPath))) {
    var svg = read(svgPath);
    check(/^<svg[^>]+viewBox="/.test(svg), "svg inválido: " + s.id);
    // o ícone oficial do Flutter traz a sombra como PNG embutido (data URI, inerte em <img>); nenhum outro svg pode ter <image>
    var imgOk = s.id === "flavors" ? svg.replace(/<image[^>]*xlink:href="data:image\/png;base64,[A-Za-z0-9+\/=]+"[^>]*\/>/g, "") : svg;
    check(!/<script|<image|href="http|onload=/i.test(imgOk), "svg com conteúdo ativo/externo: " + s.id);
    check(!/<rect[^>]*width="(100%|24|128)"/.test(svg), "svg com retângulo de fundo: " + s.id);
    check(!/fill="(#fff|#ffffff|white)"/i.test(svg) || ["java", "web-pwa"].indexOf(s.id) >= 0, "fill branco inesperado: " + s.id);
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
["cooper-pay", "boosteragro", "agrosmart", "toro", "iza", "match-queue", "fan-hub", "la-pelve", "aprovaura"].forEach(function (p) { check(has("flutter", "projects", p), "Flutter sem " + p); });
check(has("codemagic", "exp", "cooper-tec") && ids.codemagic.exp.length === 1, "Codemagic = só Cooper Tec");
check(has("flavors", "exp", "cooper-tec") && ids.flavors.exp.length === 1, "Flutter Flavors = só Cooper Tec");
["fastlane", "github-actions"].forEach(function (s) { check(ids[s].exp.length === 1 && has(s, "exp", "agrosmart") && has(s, "projects", "boosteragro") && has(s, "projects", "agrosmart"), s + " = Agrosmart / BoosterAGRO / BoosterPRO"); });
check(ids["azure-devops"].exp.join() === "toro" && has("azure-devops", "projects", "toro"), "Azure DevOps = Toro / Santander Corretora");
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
check(["flutter", "dart", "android", "ios", "supabase", "postgresql"].every(function (s) { return has(s, "projects", "fan-hub"); }), "Goiás App: Flutter, Dart, Android, iOS, Supabase, PostgreSQL");
check(has("clean-architecture", "projects", "fan-hub"), "Goiás App documenta Clean Architecture");
check(!has("android", "projects", "match-queue") && has("ios", "projects", "match-queue"), "Match Queue só iOS");
// Os chips do catálogo são declarações públicas verificáveis; os repositórios próprios também fornecem evidências independentes.
check(["tabela-fone","vai","gpol","busaogyn","orbijob","bebometro","stockport"].every(function (p) { return !!D.PROJECTS[p]; }), "novos projetos ausentes da seção de skills");
check(has("bloc","projects","tabela-fone") && has("rest-api","projects","emater") && has("firebase","projects","iza"), "BLoC/REST/Firebase com vínculos evidenciados");
check(D.PROJECTS["fan-hub"].name === "Goiás App" && D.PROJECTS["fan-hub"].href === "/projects/fan-hub/", "FanHub como nome do produto, URL preservada");
check(/Goiás App/.test(T.supabase.en[2]), "Supabase deve usar o nome atual Goiás App");
check(ids.hive.projects.length === 0 && has("sembast","projects","agrosmart"), "Hive com vínculo de experiência; Sembast presente nos projetos Agrosmart");
// skills sem evidência não recebem empresa nem projeto
["solid", "mysql", "db2", "javascript", "mongodb"].forEach(function (s) { check(ids[s].exp.length === 0 && ids[s].projects.length === 0, s + " sem evidência não pode ter vínculos"); });
// nomes de experiência batem com a linha do tempo da home
var home = read("index.html");
["Cooper Tec", "Agrosmart", "Toro Investimentos", "IZA", "Saneago"].forEach(function (n) { check(home.indexOf(">" + n + "<") >= 0 || read("assets/i18n/en.js").indexOf('"' + n + '"') >= 0, "experiência fora da home: " + n); });

// regras de interface: sem níveis, percentuais, barras ou emojis
var all = read("assets/js/skills.js") + read("assets/js/skills-data.js") + read("assets/js/skills-details.js") + read("index.html").match(/<section id="skills"[\s\S]*?<\/section>/)[0];
check(!/\b(Expert|Advanced|Beginner|Intermediate|Mid)\b/.test(all), "etiqueta de nível proibida");
check(!/\d\s?%|progress(?!ive)|<meter/i.test(all.replace(/100%/g, "")), "percentual/barra de progresso proibida");   // "Progressive Web App" é nome, não barra
check(!/[\u{1F300}-\u{1FAFF}☀-➿]/u.test(all), "emoji proibido");
check(!/\b(Claude|Anthropic|ChatGPT|OpenAI)\b/i.test(read("assets/js/skills-details.js") + read("assets/js/skills-data.js")), "referência a IA/gerador");
// HTML da home: seção, script de dados antes do script da grade
check(/<ul class="skill-grid" id="skill-grid"/.test(home), "grade ausente na home");
check(home.indexOf("skills-data.js") > 0 && home.indexOf("skills-data.js") < home.indexOf("/assets/js/skills.js"), "skills-data.js deve vir antes de skills.js");
// seções existentes continuam e na mesma ordem
var order = ["sobre", "projetos", "processo", "skills", "experiencia", "contato"].map(function (id) { return home.indexOf('<section id="' + id + '"'); });
check(order.every(function (v, i) { return v > 0 && (i === 0 || v > order[i - 1]); }), "ordem das seções da home");


// Inventário revisado a partir de /apps/: todas as novas competências devem apontar para projetos reais.
check(D.ORDER.length === 87, "total de skills esperado: 87");
// Agrupamento por stack: cada skill em exatamente um grupo, com nome nos 3 idiomas.
(function () {
  var seen = {};
  D.GROUPS.forEach(function (g) {
    LOCALES.forEach(function (l) { check(g.name[l], "grupo sem nome " + l + ": " + g.id); });
    g.skills.forEach(function (id) { check(!seen[id], "skill em mais de um grupo: " + id); seen[id] = true; });
  });
  D.ORDER.forEach(function (s) { check(seen[s.id], "skill sem grupo: " + s.id); });
  Object.keys(seen).forEach(function (id) { check(D.ORDER.some(function (s) { return s.id === id; }), "grupo cita skill inexistente: " + id); });
})();
// Flutter e Dart são indissociáveis em aplicativos Flutter; lista compartilhada evita regressão.
check(ids.flutter.projects === ids.dart.projects, "Flutter e Dart devem compartilhar a mesma lista de projetos");
check(ids.flutter.projects.length === 19, "total de projetos Flutter/Dart (incluindo Cooper Pay) deve ser 19");
check(["emater","agr-fiscal","stockport","orbijob","bebometro"].every(function (p) { return has("dart","projects",p); }), "Dart precisa refletir projetos recentes e profissionais");
check(!has("firebase","projects","bebometro") && !has("firebase","projects","stockport") && !has("firebase","projects","aprovaura"), "Não inferir Firebase a partir de Supabase");

const coverage = [["go-router","tabela-fone"],["freezed","tabela-fone"],["getx","iza"],["scoped-model","gpol"],["modular-packages","toro"],["micro-frontends","boosteragro"],["graphql","toro"],["grpc","iza"],["signalr","toro"],["supabase-realtime","match-queue"],["edge-functions","aprovaura"],["offline-first","la-pelve"],["sqlite","la-pelve"],["firebase-auth","vai"],["firestore","gpol"],["firebase-rtdb","vai"],["in-app-purchases","tabela-fone"],["onesignal","toro"],["whatsapp-api","la-pelve"],["zendesk","iza"],["facebook-login","iza"],["ml-kit","orbijob"],["google-maps","emater"],["mapbox","agrosmart"],["maplibre","busaogyn"],["pdf","agr-fiscal"],["webview","orbijob"],["barcode-scanning","stockport"],["biometrics","toro"]];
coverage.forEach(function (pair) { check(has(pair[0], "projects", pair[1]), "vínculo ausente: " + pair.join(" → ")); });
["busaogyn", "orbijob", "bebometro", "stockport"].forEach(function (p) {
  check(has("flutter", "projects", p), "Flutter sem projeto recente " + p);
});
check(has("maplibre", "projects", "busaogyn") && has("ml-kit", "projects", "orbijob"), "skills atuais sem vínculo aos novos apps");
check(!D.ORDER.some(function (s) { return s.projects.some(function (p) { return !D.PROJECTS[p]; }); }), "projeto órfão em skill");

if (failures.length) { console.error("FALHOU:\n - " + failures.join("\n - ")); process.exit(1); }
console.log("ok — skills: " + D.ORDER.length + " tecnologias, logos locais, textos nos 3 idiomas, vínculos conferidos com o histórico");
