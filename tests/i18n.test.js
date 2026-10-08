/* Valida i18n, screenshots localizadas e consistência com o dataset. Rode: node tests/i18n.test.js */
"use strict";
var fs = require("fs");
var path = require("path");
var vm = require("vm");
var root = path.join(__dirname, "..");
var failures = [];
function check(ok, msg) { if (!ok) failures.push(msg); }
function read(p) { return fs.readFileSync(path.join(root, p), "utf8"); }

var Loc = require(path.join(root, "assets/js/i18n-boot.js"));
var Shots = require(path.join(root, "assets/js/screenshots-data.js"));

// ---- locales
check(JSON.stringify(Loc.SUPPORTED) === JSON.stringify(["en", "pt-BR", "es"]), "SUPPORTED deve ser en, pt-BR, es");
var ctx = { window: {} };
Loc.SUPPORTED.forEach(function (l) { vm.runInNewContext(read("assets/i18n/" + l + ".js"), ctx); });
var D = ctx.window.LUCKSREI_I18N;
check(Object.keys(D).length === 3, "devem existir exatamente 3 dicionários, existem " + Object.keys(D).length);
var enKeys = Object.keys(D.en);
Loc.SUPPORTED.forEach(function (l) {
  var keys = Object.keys(D[l]);
  var missing = enKeys.filter(function (k) { return !(k in D[l]) || typeof D[l][k] !== "string" || D[l][k].trim() === ""; });
  var extra = keys.filter(function (k) { return !(k in D.en); });
  check(missing.length === 0, l + " sem chaves: " + missing.slice(0, 5).join(", "));
  check(extra.length === 0, l + " com chaves extras: " + extra.slice(0, 5).join(", "));
});
// chaves obrigatórias
["nav.about", "nav.experience", "nav.projects", "nav.apps", "nav.technologies", "nav.contact", "nav.lang_aria", "footer.privacy",
 "apps.filter.all", "apps.filter.own", "apps.filter.professional", "apps.filter.cooper", "apps.private", "apps.own_tag", "apps.ecosystem", "common.present",
 "seo.home.title", "seo.home.description", "seo.apps.title", "seo.contact.title", "seo.fanhub.title", "seo.matchqueue.title", "seo.aprovaura.title", "seo.lapelve.title", "seo.notfound.title"
].forEach(function (k) { Loc.SUPPORTED.forEach(function (l) { check(D[l][k], "chave obrigatória ausente em " + l + ": " + k); }); });
// placeholders {name} iguais em todos os idiomas
enKeys.forEach(function (k) {
  var ph = function (s) { return (s.match(/\{\w+\}/g) || []).sort().join(","); };
  Loc.SUPPORTED.forEach(function (l) { check(ph(D[l][k]) === ph(D.en[k]), "placeholders divergem em " + l + ": " + k); });
});
// todo data-i18n / data-i18n-attr / data-i18n-suffix usado no HTML existe nos 3 idiomas
function walk(dir, out) {
  fs.readdirSync(dir).forEach(function (n) {
    if (n === ".git" || n === "node_modules" || n === "tests") return;
    var p = path.join(dir, n);
    if (fs.statSync(p).isDirectory()) walk(p, out); else if (/\.html$/.test(n)) out.push(p);
  });
  return out;
}
var htmlFiles = walk(root, []);
htmlFiles.forEach(function (f) {
  var h = fs.readFileSync(f, "utf8");
  var used = [];
  h.replace(/data-i18n="([^"]+)"/g, function (_, k) { used.push(k); });
  h.replace(/data-i18n-suffix="([^"]+)"/g, function (_, k) { used.push(k); });
  h.replace(/data-i18n-attr="([^"]+)"/g, function (_, v) { v.split(";").forEach(function (p) { used.push(p.slice(p.indexOf(":") + 1)); }); });
  used.forEach(function (k) { check(k in D.en, path.relative(root, f) + ": chave inexistente " + k); });
  var seo = h.match(/<html[^>]*data-seo="([^"]+)"/);
  if (seo) ["title", "description", "ogTitle", "ogDescription"].forEach(function (s) {
    if (s.indexOf("og") === 0 && !/og:(title|description)/.test(h)) return;
    check(("seo." + seo[1] + "." + s) in D.en || s.indexOf("og") === 0, path.relative(root, f) + ": seo." + seo[1] + "." + s + " ausente");
  });
});

// ---- resolução de idioma
check(Loc.normalize("pt") === "pt-BR", "pt deve resolver para pt-BR");
check(Loc.normalize("pt-PT") === "pt-BR", "pt-PT deve resolver para pt-BR");
check(Loc.normalize("pt-BR") === "pt-BR", "pt-BR");
check(Loc.normalize("es-MX") === "es", "es-MX deve resolver para es");
check(Loc.normalize("es-AR") === "es" && Loc.normalize("es") === "es", "es-AR/es");
check(Loc.normalize("en-GB") === "en", "en-GB deve resolver para en");
check(Loc.normalize("fr-FR") === null, "idioma desconhecido não normaliza");
check(Loc.resolve(null, ["fr-FR", "de"]) === "en", "idioma desconhecido cai em en");
check(Loc.resolve("xx", ["fr"]) === "en", "locale salvo inválido é ignorado → en");
check(Loc.resolve("klingon", ["pt-BR"]) === "pt-BR", "locale salvo inválido não impede navigator");
check(Loc.resolve(null, ["fr", "es-MX"]) === "es", "primeiro idioma suportado da lista");
check(Loc.resolve("pt-BR", ["es"]) === "pt-BR", "preferência salva vence navigator.language");
check(Loc.resolve("en", ["pt-BR"]) === "en", "preferência salva (en) vence navigator pt-BR");
check(Loc.resolve("pt", ["es"]) === "es", "valor salvo 'pt' (não canônico) é ignorado");
check(Loc.resolve(undefined, undefined) === "en", "sem nada → en");
var fake = { store: {}, getItem: function (k) { return this.store[k] || null; }, setItem: function (k, v) { this.store[k] = v; } };
Loc.writeStored(fake, "klingon");
check(Object.keys(fake.store).length === 0, "locale inválido não é salvo");
Loc.writeStored(fake, "es");
check(fake.store[Loc.STORAGE_KEY] === "es" && Object.keys(fake.store).length === 1, "só a preferência de idioma é salva");

// ---- dataset de apps localizável
var actx = { window: {} };
vm.runInNewContext(read("assets/js/apps-data.js"), actx);
var A = actx.window.LUCKSREI_APPS;
check(A.apps.length === 33, "dataset deve continuar com 33 apps, tem " + A.apps.length);
var ids = {};
A.apps.forEach(function (a) { check(!ids[a.id], "app duplicado: " + a.id); ids[a.id] = 1; });
check(Object.keys(ids).length === 33, "idiomas não devem duplicar apps");
A.apps.forEach(function (a) {
  if (a.subtitle && typeof a.subtitle === "object") Loc.SUPPORTED.forEach(function (l) { check(typeof a.subtitle[l] === "string" && a.subtitle[l], a.id + ": subtitle sem " + l); });
  if (a.subtitleKey) Loc.SUPPORTED.forEach(function (l) { check(D[l][a.subtitleKey], a.id + ": subtitleKey ausente em " + l); });
  if (a.sector) Loc.SUPPORTED.forEach(function (l) { check(D[l]["apps.sector." + a.sector], a.id + ": setor sem tradução em " + l + " (" + a.sector + ")"); });
});
A.groups.forEach(function (g) {
  Loc.SUPPORTED.forEach(function (l) {
    ["apps.filter." + g.id, "apps.group." + g.id + ".title", "apps.group." + g.id + ".intro"].forEach(function (k) { check(D[l][k], "falta " + k + " em " + l); });
  });
});

// ---- screenshots localizadas
var proj = Object.keys(Shots.DATA);
check(proj.length >= 4, "manifesto deve cobrir os 4 produtos");
proj.forEach(function (p) {
  var P = Shots.DATA[p];
  Object.keys(P.slots).forEach(function (slot) {
    var s = P.slots[slot];
    s.locales.forEach(function (l) {
      check(Loc.SUPPORTED.indexOf(l) >= 0, p + "/" + slot + ": locale inválido " + l);
      var file = path.join(root, "assets/img", P.dir, "screens", l, slot + ".webp");
      check(fs.existsSync(file), "arquivo declarado não existe: " + path.relative(root, file));
      check(s.dims[l] && s.dims[l].length === 2, p + "/" + slot + ": dims ausentes para " + l);
    });
    Loc.SUPPORTED.forEach(function (l) {
      ["alt"].forEach(function (f) { check(D[l]["shots." + p + "." + slot + "." + f], "falta shots." + p + "." + slot + "." + f + " em " + l); });
    });
    // blocos usam title/caption
  });
  Object.keys(P.blocks).forEach(function (b) {
    P.blocks[b].forEach(function (slot) {
      check(P.slots[slot], p + ":" + b + " referencia slot inexistente " + slot);
      Loc.SUPPORTED.forEach(function (l) {
        ["title", "caption"].forEach(function (f) { check(D[l]["shots." + p + "." + slot + "." + f], "falta shots." + p + "." + slot + "." + f + " em " + l); });
      });
    });
  });
  // todo arquivo em screens/<locale>/ precisa estar declarado
  Loc.SUPPORTED.forEach(function (l) {
    var dir = path.join(root, "assets/img", P.dir, "screens", l);
    if (!fs.existsSync(dir)) return;
    fs.readdirSync(dir).forEach(function (f) {
      var slot = f.replace(/\.webp$/, "");
      check(P.slots[slot] && P.slots[slot].locales.indexOf(l) >= 0, "arquivo não declarado no manifesto: " + p + "/" + l + "/" + f);
    });
  });
  // sem imagem de outro idioma no caminho
  Object.keys(P.blocks).forEach(function (b) {
    Loc.SUPPORTED.forEach(function (l) {
      Shots.blockFor(p, b, l).forEach(function (s) {
        check(s.src.indexOf("/screens/" + l + "/") > 0, "screenshot de outro idioma em " + p + ":" + b + " (" + l + "): " + s.src);
        check(s.locale === l, "locale do slot diverge");
      });
    });
  });
});
// seleção por idioma e ausência de fallback silencioso
check(Shots.blockFor("aprovaura", "b1", "pt-BR").length === 5, "aprovaura b1 pt-BR deve ter 5 telas");
check(Shots.blockFor("aprovaura", "b1", "en").map(function (s) { return s.id; }).join() === "practice,practice-more,trail,trail-topics,trail-question", "aprovaura b1 en: trilha completa em inglês");
check(Shots.blockFor("aprovaura", "b1", "es").map(function (s) { return s.id; }).join() === "practice,practice-more,trail,trail-topics,trail-question", "aprovaura b1 es: trilha completa em espanhol");
["pt-BR", "en", "es"].forEach(function (l) {
  ["b2", "b5"].forEach(function (b) { check(Shots.blockFor("aprovaura", b, l).every(function (s) { return s.src.indexOf("/screens/" + l + "/") > 0; }), "aprovaura " + b + " " + l + ": sem imagem de outro idioma"); });
  ["home", "practice", "mock-build", "mock-question"].forEach(function (s) { check(Shots.slotFor("aprovaura", s, l), "aprovaura " + s + " existe em " + l); });
  ["home", "practice"].forEach(function (s) { check(fs.existsSync(path.join(root, "assets/img/home/aura", l, s + ".webp")), "miniatura da home aprovaura " + l + "/" + s); });
});
var aprovBlocks = function (b, l) { return Shots.blockFor("aprovaura", b, l).map(function (s) { return s.id; }).join(); };
check(aprovBlocks("b2", "pt-BR") === "mock-build,mock-build-more,mock-question" && aprovBlocks("b2", "en") === "mock-build,mock-build-more,mock-question" && aprovBlocks("b2", "es") === "mock-build,mock-build-more,mock-question", "aprovaura: telas do simulado por idioma");
check(aprovBlocks("b3", "pt-BR") === "essay-list,essay-proposal,essay-correcting,essay-score", "aprovaura: redação em português (lista de temas, proposta, correção, nota)");
check(aprovBlocks("b5", "pt-BR") === "home,profile,level-up" && aprovBlocks("b5", "en") === "home,profile,level-up" && aprovBlocks("b5", "es") === "home,profile,level-up", "aprovaura: só telas novas (tema escuro) em progresso");
check(aprovBlocks("b3", "en") === "essay-list,essay-proposal,essay-correcting,essay-score", "aprovaura: redação em inglês (lista de temas, proposta, correção, nota)");
check(aprovBlocks("b3", "es") === "essay-list,essay-proposal,essay-correcting,essay-score" && aprovBlocks("b4", "en") === "map,map-done,topics" && aprovBlocks("b4", "es") === "map,map-done,topics", "redação em espanhol (com lista de temas) e tópicos de geografia em en/es");
// Perfil: o e-mail pessoal NUNCA aparece. As 3 telas de perfil publicadas têm a linha do e-mail coberta com a cor do
// cartão (só nome e @usuário); qualquer tela de perfil nova precisa passar pela mesma máscara antes de entrar.
check(["pt-BR", "en", "es"].every(function (l) { return Shots.slotFor("aprovaura", "profile", l); }), "aprovaura: perfil (e-mail mascarado) nos 3 idiomas");
var mqIds = function (b, l) { return Shots.blockFor("matchqueue", b, l).map(function (x) { return x.id; }).join(","); };
check(["pt-BR", "en", "es"].every(function (l) { return mqIds("b2", l) === "play,queue-search,teams-explore,team-detail"; }), "match queue b2 nos 3 idiomas, com detalhe do time");
check(["pt-BR", "en", "es"].every(function (l) { return mqIds("b3", l) === "central,players,player-detail,market,account"; }), "match queue b3 completo nos 3 idiomas");
check(["play", "queue-search", "teams-explore"].every(function (n) { return fs.existsSync(path.join(root, "assets/img/home/match-queue/pt-BR", n + ".webp")); }), "match queue: 3 miniaturas pt-BR da home existem");
check(Shots.slotFor("lapelve", "home", "en").src.indexOf("/screens/en/home.webp") > 0, "la pelve home en usa a versão en");
check(Shots.slotFor("lapelve", "home", "pt-BR").src.indexOf("/screens/pt-BR/home.webp") > 0, "la pelve home pt-BR usa a versão pt-BR");
check(Shots.slotFor("aprovaura", "essay-themes", "en") === null, "aprovaura temas de redação só em pt-BR → en null (sem fallback)");
var model = Shots.buildScreenshots("fanhub", "b2", function (k, v, l) { return D[l][k]; });
check(model["pt-BR"].length === 12 && Shots.blockFor("fanhub", "b3", "pt-BR").length === 11 && Shots.blockFor("fanhub", "b4", "pt-BR").length === 7 && Shots.blockFor("fanhub", "b5", "pt-BR").length === 10 && Shots.blockFor("fanhub", "b5", "en").length === 10 && model.en.length === 12 && Shots.blockFor("fanhub", "b3", "en").length === 11 && Shots.blockFor("fanhub", "b4", "en").map(function (s) { return s.id; }).join() === "tickets,ticket-sectors,purchase,purchased,my-tickets,ticket,member-signup" && model.es.length === 12 && Shots.blockFor("fanhub", "b3", "es").length === 11 && Shots.blockFor("fanhub", "b4", "es").map(function (s) { return s.id; }).join() === "tickets,ticket-sectors,purchase,purchased,my-tickets,ticket,member-signup" && Shots.blockFor("fanhub", "b5", "es").length === 10, "modelo por locale do fan hub (pt-BR e es completos; en também completo)");
check(["play", "queue-search", "teams-explore", "central", "players", "player-detail", "market"].every(function (s) { return Shots.slotFor("matchqueue", s, "es") && fs.existsSync(path.join(root, "assets/img/match-queue/screens/es", s + ".webp")); }), "match queue: telas em espanhol existem no manifesto e em disco");
check(Shots.blockFor("fanhub", "b2", "pt-BR").every(function (s) { return fs.existsSync(path.join(root, s.src.replace(/^\//, ""))); }), "fan hub b2: todo arquivo do manifesto existe");
check(model["pt-BR"].every(function (x) { return x.src.indexOf("/pt-BR/") > 0 && x.alt; }), "itens do modelo têm src e alt do próprio idioma");

if (failures.length) { console.error("FALHOU:\n - " + failures.join("\n - ")); process.exit(1); }
console.log("ok — i18n: " + enKeys.length + " strings × 3 locales; " + proj.length + " projetos de screenshots; 33 apps");
