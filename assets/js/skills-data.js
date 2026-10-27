/* Lucksrei — Technical Skills: ordem da grade e vínculos (experiências, projetos, relacionadas).
 *
 * Para editar: mexa só aqui e em assets/js/skills-details.js (textos nos 3 idiomas).
 *
 * order  ordem exata da grade, por importância para o perfil Senior Flutter (núcleo mobile e arquitetura → backend → entrega → observabilidade → legado). Cada item:
 *   id       slug; logo em /assets/img/skills/<id>.svg (ext: "png" quando o logo só existe em PNG; wide: true para logo largo, que mantém a altura do ícone; text: true = sem logo, apenas o nome centralizado com a tipografia padrão da grade)
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
    "agrosmart": { name: "Agrosmart (BoosterPRO)", href: "/apps/#professional" },
    "toro": { name: "Toro Investimentos (Santander Corretora)", href: "/apps/#professional" },
    "iza": { name: "IZA Seguradora", href: "/apps/#professional" },
    "emater": { name: "EMATER-GO Mobi", href: "/apps/#professional" },
    "agr-fiscal": { name: "AGR Fiscal", href: "/apps/#professional" },
    "match-queue": { name: "Match Queue", href: "/projects/match-queue/", caseStudy: true },
    "fan-hub": { name: "Goiás App", href: "/projects/fan-hub/", caseStudy: true },
    "la-pelve": { name: "La Pelve", href: "/projects/la-pelve/", caseStudy: true },
    "aprovaura": { name: "Aprovaura", href: "/projects/aura/", caseStudy: true },
    "tabela-fone": { name: "Tabela Fone", href: "/apps/#professional" },
    "vai": { name: "Vai", href: "/apps/#professional" },
    "gpol": { name: "GPOL", href: "/apps/#professional" },
    "busaogyn": { name: "BusãoGyn", href: "/projects/busaogyn/", caseStudy: true },
    "orbijob": { name: "OrbiJob", href: "/projects/orbijob/", caseStudy: true },
    "bebometro": { name: "Bebômetro", href: "/projects/bebometro/", caseStudy: true },
    "stockport": { name: "StockPort System", href: "/apps/#systems" },
    "beard": { name: "Beard System", href: "/apps/#systems" }
  };

  // Fonte única: projetos Flutter usam Dart. Atualizar ambos juntos.
  var FLUTTER_PROJECTS = ["cooper-pay", "boosteragro", "agrosmart", "toro", "iza", "match-queue", "fan-hub", "la-pelve", "aprovaura", "busaogyn", "orbijob", "bebometro", "stockport", "beard", "tabela-fone", "emater", "agr-fiscal", "vai", "gpol"];
  var COOPER_AGRO = ["boosteragro", "agrosmart"];

  var ORDER = [
{ id: "flutter", name: "Flutter", exp: ["cooper-tec", "agrosmart", "toro", "iza", "freelance"],
      projects: FLUTTER_PROJECTS, related: ["dart", "bloc", "clean-architecture", "flavors"] },
{ id: "dart", name: "Dart", exp: ["cooper-tec", "agrosmart", "toro", "iza", "freelance"], projects: FLUTTER_PROJECTS, related: ["flutter", "bloc"] },
{ id: "android", name: "Android", exp: ["cooper-tec", "agrosmart", "toro", "iza", "freelance"],
      projects: ["cooper-pay", "boosteragro", "agrosmart", "toro", "iza", "fan-hub", "la-pelve", "aprovaura", "busaogyn", "orbijob", "bebometro", "stockport", "beard", "tabela-fone", "emater", "agr-fiscal", "vai", "gpol"], related: ["flutter", "ios"] },
{ id: "ios", name: "iOS", exp: ["cooper-tec", "agrosmart", "toro", "iza", "freelance"],
      projects: ["cooper-pay", "boosteragro", "agrosmart", "toro", "iza", "match-queue", "fan-hub", "la-pelve", "aprovaura", "busaogyn", "orbijob", "bebometro", "stockport", "beard", "tabela-fone", "vai", "gpol"], related: ["flutter", "android"] },
{ id: "clean-architecture", name: "Clean Architecture", ext: "png", label: { en: "Clean Architecture", "pt-BR": "Arquitetura Limpa", es: "Arquitectura Limpia" }, exp: ["cooper-tec", "agrosmart", "toro"], projects: ["fan-hub"], related: ["solid", "tdd", "dependency-injection"] },
{ id: "bloc", name: "BLoC / Cubit", exp: ["cooper-tec", "agrosmart", "toro", "freelance"], projects: ["cooper-pay", "boosteragro", "agrosmart", "toro", "agr-fiscal", "tabela-fone", "match-queue", "fan-hub", "la-pelve", "aprovaura", "busaogyn", "orbijob", "bebometro", "stockport", "beard"], related: ["flutter", "clean-architecture"] },
{ id: "tdd", name: "TDD", exp: ["cooper-tec"], projects: [], related: ["automated-testing", "clean-architecture"] },
{ id: "automated-testing", name: "Automated Testing", label: { en: "Automated Testing", "pt-BR": "Testes Automatizados", es: "Pruebas Automatizadas" }, exp: ["cooper-tec"], projects: ["match-queue", "fan-hub", "la-pelve", "aprovaura", "busaogyn", "orbijob", "bebometro", "stockport", "beard"], related: ["tdd", "github-actions"] },
{ id: "playwright", name: "Playwright", exp: [], projects: [], related: ["automated-testing", "nextjs", "typescript"] },
{ id: "dependency-injection", name: "Dependency Injection", text: true, label: { en: "Dependency Injection", "pt-BR": "Injeção de Dependência", es: "Inyección de Dependencias" }, exp: [], projects: ["match-queue", "fan-hub", "la-pelve", "aprovaura", "orbijob", "bebometro", "stockport", "beard"], related: ["clean-architecture", "solid", "get-it"] },
{ id: "get-it", name: "GetIt", ext: "png", exp: [], projects: ["match-queue", "fan-hub", "la-pelve", "aprovaura", "orbijob", "bebometro", "stockport", "beard"], related: ["dependency-injection", "flutter", "bloc"] },
{ id: "go-router", name: "go_router", exp: [], projects: ["tabela-fone", "match-queue", "fan-hub", "la-pelve", "aprovaura", "stockport", "beard"], related: ["flutter", "deep-links"] },
{ id: "freezed", name: "Freezed", exp: [], projects: ["tabela-fone"], related: ["dart", "clean-architecture"] },
{ id: "getx", name: "GetX", exp: ["iza"], projects: ["iza"], related: ["flutter", "bloc"] },
{ id: "solid", name: "SOLID", exp: [], projects: [], related: ["clean-architecture", "dependency-injection"] },
{ id: "rest-api", name: "REST APIs", exp: ["freelance"], projects: ["emater", "agr-fiscal"], related: ["jwt", "flutter"] },
{ id: "graphql", name: "GraphQL", exp: ["toro"], projects: ["toro"], related: ["rest-api", "typescript"] },
{ id: "supabase", name: "Supabase", exp: [], projects: ["match-queue", "fan-hub", "la-pelve", "aprovaura", "orbijob", "bebometro", "stockport", "beard", "tabela-fone"], related: ["postgresql", "rls", "flutter"] },
{ id: "offline-first", name: "Offline-first", exp: ["agrosmart"], projects: ["la-pelve", "boosteragro", "agrosmart"], related: ["sqlite", "hive", "sembast"] },
{ id: "sqlite", name: "SQLite", exp: ["iza"], projects: ["la-pelve", "iza"], related: ["offline-first", "sql", "postgresql"] },
{ id: "postgresql", name: "PostgreSQL", exp: [], projects: ["match-queue", "fan-hub", "la-pelve", "aprovaura", "orbijob", "bebometro", "stockport", "beard", "tabela-fone"], related: ["supabase", "sql"] },
{ id: "firebase", name: "Firebase", ext: "png", exp: ["iza", "toro", "agrosmart", "freelance"], projects: ["fan-hub", "match-queue", "orbijob", "iza", "toro", "agrosmart", "boosteragro", "vai", "gpol"], related: ["flutter", "crashlytics", "remote-config", "firebase-messaging"] },
{ id: "firebase-auth", name: "Firebase Auth", text: true, exp: ["freelance"], projects: ["vai", "gpol"], related: ["firebase", "jwt", "flutter"] },
{ id: "fastlane", name: "Fastlane", exp: ["agrosmart"], projects: COOPER_AGRO, related: ["github-actions", "codemagic"] },
{ id: "codemagic", name: "Codemagic", exp: ["cooper-tec"], projects: ["cooper-pay"], related: ["flavors", "fastlane"] },
{ id: "github-actions", name: "GitHub Actions", exp: ["agrosmart"], projects: ["boosteragro", "agrosmart", "match-queue", "fan-hub", "la-pelve", "aprovaura", "busaogyn", "orbijob", "bebometro", "stockport", "beard"], related: ["fastlane", "github"] },
{ id: "app-store-connect", name: "App Store Connect", exp: ["cooper-tec"], projects: ["cooper-pay", "match-queue", "la-pelve", "aprovaura"], related: ["ios", "fastlane"] },
{ id: "google-play-console", name: "Google Play Console", exp: ["cooper-tec"], projects: ["cooper-pay"], related: ["android", "fastlane"] },
{ id: "in-app-purchases", name: "In-App Purchases", exp: [], projects: ["tabela-fone"], related: ["app-store-connect", "google-play-console"] },
{ id: "git", name: "Git", exp: [], projects: ["match-queue", "fan-hub", "la-pelve", "aprovaura", "busaogyn", "orbijob", "bebometro", "stockport", "beard"], related: ["github"] },
{ id: "github", name: "GitHub", exp: [], projects: ["match-queue", "fan-hub", "la-pelve", "aprovaura", "busaogyn", "orbijob", "bebometro", "stockport", "beard"], related: ["git", "github-actions"] },
{ id: "rls", name: "Row-Level Security", exp: [], projects: ["match-queue", "la-pelve", "stockport", "beard", "orbijob", "bebometro", "fan-hub"], related: ["supabase", "postgresql"] },
{ id: "modular-packages", name: "Modular Packages", text: true, exp: ["toro"], projects: ["toro"], related: ["clean-architecture", "flutter"] },
{ id: "cloudflare-workers", name: "Cloudflare Workers", exp: [], projects: ["match-queue", "fan-hub", "la-pelve", "aprovaura", "busaogyn", "orbijob", "bebometro"], related: ["supabase", "typescript"] },
{ id: "cloudflare-pages", name: "Cloudflare Pages", exp: [], projects: ["stockport"], related: ["cloudflare-workers", "nextjs"] },
{ id: "crashlytics", name: "Firebase Crashlytics", ext: "png", exp: ["toro", "agrosmart"], projects: ["toro", "boosteragro", "agrosmart", "match-queue"], related: ["firebase", "sentry"] },
{ id: "remote-config", name: "Firebase Remote Config", ext: "png", exp: ["toro", "iza"], projects: ["toro", "iza"], related: ["firebase", "crashlytics"] },
{ id: "firebase-messaging", name: "Firebase Cloud Messaging", ext: "png", exp: ["iza", "freelance"], projects: ["fan-hub", "match-queue", "orbijob", "iza", "gpol"], related: ["firebase", "deep-links"] },
{ id: "onesignal", name: "OneSignal", exp: ["toro", "agrosmart"], projects: ["toro", "agrosmart", "boosteragro"], related: ["firebase-messaging", "flutter"] },
{ id: "resend", name: "Resend", exp: [], projects: ["stockport", "beard"], related: ["supabase"] },
{ id: "firestore", name: "Cloud Firestore", text: true, exp: ["freelance"], projects: ["gpol"], related: ["firebase", "firebase-rtdb"] },
{ id: "whatsapp-api", name: "WhatsApp API", exp: [], projects: ["la-pelve"], related: ["rest-api"] },
{ id: "zendesk", name: "Zendesk", exp: ["iza"], projects: ["iza"], related: ["rest-api", "firebase-messaging"] },
{ id: "facebook-login", name: "Facebook Login", exp: ["iza"], projects: ["iza"], related: ["firebase-auth", "flutter"] },
{ id: "sentry", name: "Sentry", exp: ["toro"], projects: ["toro", "fan-hub"], related: ["crashlytics"] },
{ id: "firebase-rtdb", name: "Firebase Realtime", text: true, exp: ["freelance"], projects: ["vai"], related: ["firebase", "firestore"] },
{ id: "gemini", name: "Gemini API", exp: [], projects: ["aprovaura"], related: ["supabase", "rest-api"] },
{ id: "ml-kit", name: "Google ML Kit", exp: [], projects: ["orbijob", "bebometro"], related: ["flutter", "offline-first"] },
{ id: "deep-links", name: "Deep Links", wide: true, exp: [], projects: ["match-queue", "stockport", "beard", "tabela-fone"], related: ["flutter", "web-pwa"] },
{ id: "i18n", name: "i18n", label: { en: "Localization (i18n)", "pt-BR": "Idiomas (i18n)", es: "Idiomas (i18n)" }, exp: [], projects: ["aprovaura", "orbijob", "bebometro", "stockport", "beard", "busaogyn"], related: ["flutter", "dart"] },
{ id: "gps", name: "GPS", label: { en: "GPS & Location", "pt-BR": "GPS e Localização", es: "GPS y Ubicación" }, exp: ["cooper-tec", "freelance"], projects: ["cooper-pay", "bebometro", "vai", "agr-fiscal"], related: ["flutter", "android"] },
{ id: "google-maps", name: "Google Maps & Places", exp: ["freelance"], projects: ["emater", "vai", "gpol"], related: ["gps", "mapbox", "maplibre"] },
{ id: "mapbox", name: "Mapbox", exp: ["agrosmart"], projects: ["agrosmart", "boosteragro"], related: ["google-maps", "gps"] },
{ id: "maplibre", name: "MapLibre", exp: [], projects: ["busaogyn"], related: ["google-maps", "gps"] },
{ id: "web-pwa", name: "Web / PWA", wide: true, exp: [], projects: ["match-queue", "fan-hub", "la-pelve", "aprovaura", "busaogyn", "orbijob", "bebometro", "stockport", "beard"], related: ["flutter", "cloudflare-workers"] },
{ id: "pdf", name: "PDF Generation", exp: ["freelance"], projects: ["agr-fiscal", "stockport", "beard", "fan-hub"], related: ["flutter", "sql"] },
{ id: "flavors", name: "Flutter Flavors", text: true, exp: ["cooper-tec"], projects: ["cooper-pay", "fan-hub"], related: ["flutter", "codemagic"] },
{ id: "webview", name: "WebView", exp: [], projects: ["orbijob"], related: ["flutter", "deep-links"] },
{ id: "barcode-scanning", name: "Barcode Scanning", exp: [], projects: ["stockport", "beard"], related: ["ml-kit", "flutter"] },
{ id: "biometrics", name: "Biometric Authentication", exp: ["toro"], projects: ["toro", "la-pelve"], related: ["ios", "android", "firebase-auth"] },
{ id: "hive", name: "Hive", exp: ["agrosmart"], projects: [], related: ["sembast", "flutter"] },
{ id: "sembast", name: "Sembast", exp: ["agrosmart"], projects: ["agrosmart", "boosteragro"], related: ["hive", "flutter"] },
{ id: "micro-frontends", name: "Micro-frontends", text: true, exp: ["agrosmart"], projects: ["boosteragro", "agrosmart"], related: ["modular-packages", "clean-architecture"] },
{ id: "jwt", name: "JWT", exp: [], projects: ["stockport", "beard"], related: ["rest-api"] },
{ id: "scrum", name: "Scrum", exp: ["cooper-tec", "agrosmart"], projects: [], related: ["azure-devops", "git"] },
{ id: "azure-devops", name: "Azure DevOps", exp: ["toro"], projects: ["toro"], related: ["git"] },
{ id: "gitlab", name: "GitLab", exp: ["saneago"], projects: [], related: ["git", "github"] },
{ id: "sql", name: "SQL", exp: [], projects: ["match-queue", "fan-hub", "la-pelve", "orbijob", "bebometro", "stockport", "beard"], related: ["postgresql"] },
{ id: "provider", name: "Provider", text: true, exp: ["freelance"], projects: ["emater"], related: ["flutter", "bloc"] },
{ id: "typescript", name: "TypeScript", exp: [], projects: ["busaogyn", "fan-hub", "orbijob"], related: ["javascript"] },
{ id: "javascript", name: "JavaScript", ext: "png", exp: [], projects: [], related: ["typescript"] },
{ id: "react", name: "React", exp: [], projects: [], related: ["nextjs", "typescript", "tailwind"] },
{ id: "nextjs", name: "Next.js", exp: [], projects: [], related: ["react", "typescript", "cloudflare-pages"] },
{ id: "tailwind", name: "Tailwind CSS", exp: [], projects: [], related: ["react", "nextjs"] }
  ];

  // Agrupamento da grade por stack, em ordem de importância para vagas Flutter (grupos e skills). Toda skill de ORDER aparece em exatamente um grupo (tests/skills.test.js).
  var GROUPS = [
    { id: "mobile", name: { en: "Mobile", "pt-BR": "Mobile", es: "Móvil" }, skills: "flutter dart android ios flavors deep-links web-pwa webview".split(" ") },
    { id: "state", name: { en: "State and navigation", "pt-BR": "Estado e navegação", es: "Estado y navegación" }, skills: "bloc provider go-router freezed getx".split(" ") },
    { id: "architecture", name: { en: "Architecture", "pt-BR": "Arquitetura", es: "Arquitectura" }, skills: "clean-architecture solid dependency-injection get-it offline-first modular-packages micro-frontends".split(" ") },
    { id: "quality", name: { en: "Quality", "pt-BR": "Qualidade", es: "Calidad" }, skills: "tdd automated-testing crashlytics sentry playwright".split(" ") },
    { id: "backend", name: { en: "Backend and cloud", "pt-BR": "Backend e nuvem", es: "Backend y nube" }, skills: "rest-api supabase firebase firebase-auth firebase-messaging remote-config graphql rls jwt onesignal cloudflare-workers cloudflare-pages".split(" ") },
    { id: "delivery", name: { en: "Delivery and process", "pt-BR": "Entrega e processo", es: "Entrega y proceso" }, skills: "google-play-console app-store-connect github-actions codemagic fastlane git github gitlab azure-devops scrum".split(" ") },
    { id: "databases", name: { en: "Databases", "pt-BR": "Bancos de dados", es: "Bases de datos" }, skills: "sqlite firestore postgresql sql hive sembast firebase-rtdb".split(" ") },
    { id: "integrations", name: { en: "Integrations", "pt-BR": "Integrações", es: "Integraciones" }, skills: "in-app-purchases i18n google-maps gps biometrics barcode-scanning ml-kit gemini pdf whatsapp-api resend facebook-login zendesk mapbox maplibre".split(" ") },
    { id: "web", name: { en: "Web", "pt-BR": "Web", es: "Web" }, skills: "typescript react nextjs tailwind javascript".split(" ") }
  ];

  return { EXPERIENCES: EXPERIENCES, PROJECTS: PROJECTS, ORDER: ORDER, GROUPS: GROUPS };
});
