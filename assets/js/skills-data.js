/* Lucksrei — Technical Skills: ordem da grade e vínculos (experiências, projetos, relacionadas).
 *
 * Para editar: mexa só aqui e em assets/js/skills-details.js (textos nos 3 idiomas).
 *
 * order  ordem exata da grade, por importância para o perfil Senior Flutter (núcleo mobile e arquitetura → backend → entrega → observabilidade → legado). Cada item:
 *   id       slug; logo em /assets/img/skills/<id>.svg (ext: "png" quando o logo só existe em PNG; wide: true para logo largo, que mantém a altura do ícone; text: true = sem logo, só o nome centralizado em branco)
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
    { id: "clean-architecture", name: "Clean Architecture", ext: "png", label: { en: "Clean Architecture", "pt-BR": "Arquitetura Limpa", es: "Arquitectura Limpia" }, exp: ["cooper-tec", "agrosmart", "toro"], projects: ["fan-hub"], related: ["solid", "tdd", "dependency-injection"] },
    { id: "bloc", name: "BLoC / Cubit", exp: ["cooper-tec", "agrosmart"], projects: [], related: ["flutter", "clean-architecture"] },
    { id: "tdd", name: "TDD", exp: ["cooper-tec"], projects: [], related: ["automated-testing", "clean-architecture"] },
    { id: "automated-testing", name: "Automated Testing", label: { en: "Automated Testing", "pt-BR": "Testes Automatizados", es: "Pruebas Automatizadas" }, exp: ["cooper-tec"], projects: [], related: ["tdd", "github-actions"] },
    { id: "dependency-injection", name: "Dependency Injection", text: true, label: { en: "Dependency Injection", "pt-BR": "Injeção de Dependência", es: "Inyección de Dependencias" }, exp: [], projects: [], related: ["clean-architecture", "solid", "get-it"] },
    { id: "get-it", name: "get_it", ext: "png", exp: [], projects: OWN, related: ["dependency-injection", "flutter", "bloc"] },
    { id: "solid", name: "SOLID", exp: [], projects: [], related: ["clean-architecture", "dependency-injection"] },
    { id: "rest-api", name: "REST APIs", exp: [], projects: [], related: ["jwt", "flutter"] },
    { id: "supabase", name: "Supabase", exp: [], projects: OWN, related: ["postgresql", "rls", "flutter"] },
    { id: "postgresql", name: "PostgreSQL", exp: [], projects: OWN, related: ["supabase", "sql"] },
    { id: "firebase", name: "Firebase", ext: "png", exp: ["iza"], projects: ["iza-seguros", "match-queue"], related: ["flutter", "crashlytics", "remote-config", "firebase-messaging"] },
    { id: "flavors", name: "Flutter Flavors", text: true, exp: ["cooper-tec"], projects: ["cooper-pay"], related: ["flutter", "codemagic"] },
    { id: "fastlane", name: "Fastlane", exp: ["agrosmart"], projects: COOPER_AGRO, related: ["github-actions", "codemagic"] },
    { id: "codemagic", name: "Codemagic", exp: ["cooper-tec"], projects: ["cooper-pay"], related: ["flavors", "fastlane"] },
    { id: "github-actions", name: "GitHub Actions", exp: ["agrosmart"], projects: COOPER_AGRO, related: ["fastlane", "github"] },
    { id: "app-store-connect", name: "App Store Connect", exp: ["cooper-tec"], projects: ["cooper-pay", "match-queue", "aprovaura"], related: ["ios", "fastlane"] },
    { id: "google-play-console", name: "Google Play Console", exp: ["cooper-tec"], projects: ["cooper-pay", "fan-hub", "la-pelve", "aprovaura"], related: ["android", "fastlane"] },
    { id: "git", name: "Git", exp: [], projects: [], related: ["github"] },
    { id: "github", name: "GitHub", exp: [], projects: [], related: ["git", "github-actions"] },
    { id: "rls", name: "Row-Level Security", exp: [], projects: ["match-queue", "la-pelve"], related: ["supabase", "postgresql"] },
    { id: "cloudflare-workers", name: "Cloudflare Workers", exp: [], projects: ["fan-hub"], related: ["supabase", "typescript"] },
    { id: "crashlytics", name: "Firebase Crashlytics", ext: "png", exp: ["toro"], projects: ["santander"], related: ["firebase", "sentry"] },
    { id: "remote-config", name: "Firebase Remote Config", ext: "png", exp: ["toro"], projects: ["santander"], related: ["firebase", "crashlytics"] },
    { id: "firebase-messaging", name: "Firebase Cloud Messaging", ext: "png", exp: [], projects: ["fan-hub"], related: ["firebase", "deep-links"] },
    { id: "sentry", name: "Sentry", exp: [], projects: [], related: ["crashlytics"] },
    { id: "gemini", name: "Gemini API", exp: [], projects: ["aprovaura"], related: ["supabase", "rest-api"] },
    { id: "deep-links", name: "Deep Links", wide: true, exp: [], projects: ["match-queue"], related: ["flutter", "web-pwa"] },
    { id: "i18n", name: "i18n", label: { en: "Localization (i18n)", "pt-BR": "Idiomas (i18n)", es: "Idiomas (i18n)" }, exp: [], projects: ["aprovaura"], related: ["flutter", "dart"] },
    { id: "gps", name: "GPS", label: { en: "GPS & Location", "pt-BR": "GPS e Localização", es: "GPS y Ubicación" }, exp: ["cooper-tec", "freelance"], projects: ["cooper-pay"], related: ["flutter", "android"] },
    { id: "web-pwa", name: "Web / PWA", wide: true, exp: [], projects: OWN, related: ["flutter", "cloudflare-workers"] },
    { id: "hive", name: "Hive", exp: ["agrosmart"], projects: [], related: ["sembast", "flutter"] },
    { id: "sembast", name: "Sembast", exp: ["agrosmart"], projects: [], related: ["hive", "flutter"] },
    { id: "provider", name: "Provider", text: true, exp: [], projects: [], related: ["flutter", "bloc"] },
    { id: "jwt", name: "JWT", exp: [], projects: [], related: ["rest-api"] },
    { id: "scrum", name: "Scrum", exp: ["cooper-tec", "agrosmart"], projects: [], related: ["azure-devops", "git"] },
    { id: "azure-devops", name: "Azure DevOps", exp: ["toro"], projects: ["santander"], related: ["git"] },
    { id: "gitlab", name: "GitLab", exp: ["saneago"], projects: [], related: ["git", "github"] },
    { id: "sql", name: "SQL", exp: [], projects: [], related: ["postgresql", "mysql"] },
    { id: "typescript", name: "TypeScript", exp: [], projects: [], related: ["javascript"] },
    { id: "javascript", name: "JavaScript", ext: "png", exp: [], projects: [], related: ["typescript"] },
    { id: "java", name: "Java", exp: ["memora", "saneago"], projects: [], related: ["spring", "zk-framework", "sql"] },
    { id: "spring", name: "Spring", exp: ["memora"], projects: [], related: ["java", "zk-framework"] },
    { id: "mysql", name: "MySQL", text: true, exp: [], projects: [], related: ["sql"] },
    { id: "mongodb", name: "MongoDB", exp: [], projects: [], related: ["firebase", "hive"] },
    { id: "oracle", name: "Oracle", text: true, exp: ["memora"], projects: [], related: ["sql", "db2"] },
    { id: "db2", name: "DB2", ext: "png", exp: [], projects: [], related: ["sql"] },
    { id: "objectdb", name: "ObjectDB", ext: "png", exp: ["freelance"], projects: ["emater", "agr-fiscal"], related: ["hive", "sembast"] },
    { id: "zk-framework", name: "ZK Framework", ext: "png", exp: ["memora", "saneago"], projects: [], related: ["java"] }
  ];

  return { EXPERIENCES: EXPERIENCES, PROJECTS: PROJECTS, ORDER: ORDER };
});
