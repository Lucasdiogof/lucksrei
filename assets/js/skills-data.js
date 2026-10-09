/* Lucksrei — Technical Skills: ordem da grade e vínculos (experiências, projetos, relacionadas).
 *
 * Para editar: mexa só aqui e em assets/js/skills-details.js (textos nos 3 idiomas).
 *
 * order  ordem exata da grade (primeiro o mobile). Cada item:
 *   id       slug; logo em /assets/img/skills/<id>.svg (ext: "png" quando o logo só existe em PNG; wide: true para logo largo, que mantém a altura do ícone)
 *   name     nome próprio (não traduzido). label = nome traduzível quando o item é um conceito
 *   exp      ids de EXPERIENCES onde há evidência (vazio = nenhuma atribuição)
 *   projects ids de PROJECTS onde há evidência
 *   related  ids de outras skills
 * Só entram vínculos comprovados pelo histórico do site (/#experiencia, /apps/) ou informados pelo Lucas.
 */
(function (root, factory) {
  "use strict";
  var api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  else root.LUCKSREI_SKILLS = api;
})(typeof window !== "undefined" ? window : this, function () {
  "use strict";

  var EXPERIENCES = {
    "cooper-tec": { name: "Cooper Tec" },
    "agrosmart": { name: "Agrosmart" },
    "toro": { name: "Toro Investimentos" },
    "iza": { name: "IZA" },
    "freelance": { name: { en: "Freelance", "pt-BR": "Freelancer", es: "Freelance" } },
    "memora": { name: "Memora Processos Inovadores" },
    "saneago": { name: "Saneago" }
  };

  var PROJECTS = {
    "cooper-pay": { name: "Cooper Pay", href: "/apps/#cooper" },
    "boosteragro": { name: "BoosterAGRO", href: "/apps/#professional" },
    "boosterpro": { name: "BoosterPRO", href: "/apps/#professional" },
    "santander": { name: "Santander Corretora", href: "/apps/#professional" },
    "iza-seguros": { name: "IZA Seguros", href: "/apps/#professional" },
    "emater": { name: "EMATER-GO Mobi", href: "/apps/#professional" },
    "agr-fiscal": { name: "AGR Fiscal", href: "/apps/#professional" },
    "match-queue": { name: "Match Queue", href: "/projects/match-queue/", caseStudy: true },
    "fan-hub": { name: "FanHub", href: "/projects/fan-hub/", caseStudy: true },
    "la-pelve": { name: "La Pelve", href: "/projects/la-pelve/", caseStudy: true },
    "aprovaura": { name: "Aprovaura", href: "/projects/aura/", caseStudy: true }
  };

  var OWN = ["match-queue", "fan-hub", "la-pelve", "aprovaura"];
  var COOPER_AGRO = ["boosteragro", "boosterpro"];

  var ORDER = [
    { id: "flutter", name: "Flutter", exp: ["cooper-tec", "agrosmart", "toro", "iza", "freelance"],
      projects: ["cooper-pay", "boosteragro", "boosterpro", "santander", "iza-seguros", "match-queue", "fan-hub", "la-pelve", "aprovaura"], related: ["dart", "bloc", "clean-architecture", "flavors"] },
    { id: "dart", name: "Dart", exp: ["cooper-tec", "agrosmart", "toro", "iza", "freelance"], projects: [], related: ["flutter", "bloc"] },
    { id: "android", name: "Android", exp: ["cooper-tec", "agrosmart", "toro", "iza"],
      projects: ["cooper-pay", "boosteragro", "boosterpro", "santander", "iza-seguros", "fan-hub", "la-pelve", "aprovaura"], related: ["flutter", "ios"] },
    { id: "ios", name: "iOS", exp: ["cooper-tec", "agrosmart", "toro", "iza"],
      projects: ["cooper-pay", "boosteragro", "boosterpro", "santander", "iza-seguros", "match-queue", "fan-hub", "la-pelve", "aprovaura"], related: ["flutter", "android"] },
    { id: "flavors", name: "Flutter Flavors", exp: ["cooper-tec"], projects: ["cooper-pay"], related: ["flutter", "codemagic"] },
    { id: "bloc", name: "BLoC / Cubit", exp: ["cooper-tec", "agrosmart"], projects: [], related: ["flutter", "clean-architecture"] },
    { id: "provider", name: "Provider", ext: "png", wide: true, exp: [], projects: [], related: ["flutter", "bloc"] },
    { id: "clean-architecture", name: "Clean Architecture", label: { en: "Clean Architecture", "pt-BR": "Arquitetura Limpa", es: "Arquitectura Limpia" }, exp: ["cooper-tec", "agrosmart", "toro"], projects: ["fan-hub"], related: ["solid", "tdd", "dependency-injection"] },
    { id: "solid", name: "SOLID", exp: [], projects: [], related: ["clean-architecture", "dependency-injection"] },
    { id: "tdd", name: "TDD", exp: ["cooper-tec"], projects: [], related: ["automated-testing", "clean-architecture"] },
    { id: "dependency-injection", name: "Dependency Injection", label: { en: "Dependency Injection", "pt-BR": "Injeção de Dependência", es: "Inyección de Dependencias" }, exp: [], projects: [], related: ["clean-architecture", "solid"] },
    { id: "automated-testing", name: "Automated Testing", label: { en: "Automated Testing", "pt-BR": "Testes Automatizados", es: "Pruebas Automatizadas" }, exp: ["cooper-tec"], projects: [], related: ["tdd", "github-actions"] },
    { id: "rest-api", name: "REST APIs", exp: [], projects: [], related: ["jwt", "flutter"] },
    { id: "supabase", name: "Supabase", exp: [], projects: OWN, related: ["postgresql", "flutter"] },
    { id: "postgresql", name: "PostgreSQL", exp: [], projects: OWN, related: ["supabase", "sql"] },
    { id: "firebase", name: "Firebase", exp: ["iza"], projects: ["iza-seguros", "match-queue"], related: ["flutter"] },
    { id: "jwt", name: "JWT", exp: [], projects: [], related: ["rest-api"] },
    { id: "hive", name: "Hive", exp: ["agrosmart"], projects: [], related: ["sembast", "flutter"] },
    { id: "sembast", name: "Sembast", exp: ["agrosmart"], projects: [], related: ["hive", "flutter"] },
    { id: "objectdb", name: "ObjectDB", exp: ["freelance"], projects: ["emater", "agr-fiscal"], related: ["hive", "sembast"] },
    { id: "codemagic", name: "Codemagic", exp: ["cooper-tec"], projects: ["cooper-pay"], related: ["flavors", "fastlane"] },
    { id: "fastlane", name: "Fastlane", exp: ["agrosmart"], projects: COOPER_AGRO, related: ["github-actions", "codemagic"] },
    { id: "github-actions", name: "GitHub Actions", exp: ["agrosmart"], projects: COOPER_AGRO, related: ["fastlane", "github"] },
    { id: "azure-devops", name: "Azure DevOps", exp: ["toro"], projects: ["santander"], related: ["git"] },
    { id: "git", name: "Git", exp: [], projects: [], related: ["github"] },
    { id: "github", name: "GitHub", exp: [], projects: [], related: ["git", "github-actions"] },
    { id: "java", name: "Java", exp: ["memora", "saneago"], projects: [], related: ["zk-framework", "sql"] },
    { id: "sql", name: "SQL", exp: [], projects: [], related: ["postgresql", "mysql"] },
    { id: "mysql", name: "MySQL", exp: [], projects: [], related: ["sql"] },
    { id: "db2", name: "DB2", exp: [], projects: [], related: ["sql"] },
    { id: "zk-framework", name: "ZK Framework", ext: "png", exp: ["memora", "saneago"], projects: [], related: ["java"] },
    { id: "javascript", name: "JavaScript", exp: [], projects: [], related: ["typescript"] },
    { id: "typescript", name: "TypeScript", exp: [], projects: [], related: ["javascript"] }
  ];

  return { EXPERIENCES: EXPERIENCES, PROJECTS: PROJECTS, ORDER: ORDER };
});
