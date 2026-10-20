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
    "stockport": { name: "StockPort System", href: "/apps/#systems" }
  };

  var OWN = ["match-queue", "fan-hub", "la-pelve", "aprovaura"];
  var COOPER_AGRO = ["boosteragro", "agrosmart"];

  var ORDER = [
    { id: "flutter", name: "Flutter", exp: ["cooper-tec", "agrosmart", "toro", "iza", "freelance"],
      projects: ["cooper-pay", "boosteragro", "agrosmart", "toro", "iza", "match-queue", "fan-hub", "la-pelve", "aprovaura", "busaogyn", "orbijob", "bebometro", "stockport", "tabela-fone", "vai", "gpol"], related: ["dart", "bloc", "clean-architecture", "flavors"] },
    { id: "dart", name: "Dart", exp: ["cooper-tec", "agrosmart", "toro", "iza", "freelance"], projects: ["busaogyn", "orbijob", "bebometro", "stockport", "tabela-fone", "vai", "gpol"], related: ["flutter", "bloc"] },
    { id: "android", name: "Android", exp: ["cooper-tec", "agrosmart", "toro", "iza"],
      projects: ["cooper-pay", "boosteragro", "agrosmart", "toro", "iza", "fan-hub", "la-pelve", "aprovaura", "busaogyn", "orbijob", "bebometro", "stockport", "tabela-fone", "vai", "gpol"], related: ["flutter", "ios"] },
    { id: "ios", name: "iOS", exp: ["cooper-tec", "agrosmart", "toro", "iza"],
      projects: ["cooper-pay", "boosteragro", "agrosmart", "toro", "iza", "match-queue", "fan-hub", "la-pelve", "aprovaura", "busaogyn", "orbijob", "bebometro", "stockport", "tabela-fone", "vai", "gpol"], related: ["flutter", "android"] },
    { id: "clean-architecture", name: "Clean Architecture", ext: "png", label: { en: "Clean Architecture", "pt-BR": "Arquitetura Limpa", es: "Arquitectura Limpia" }, exp: ["cooper-tec", "agrosmart", "toro"], projects: ["fan-hub"], related: ["solid", "tdd", "dependency-injection"] },
    { id: "bloc", name: "BLoC / Cubit", exp: ["cooper-tec", "agrosmart"], projects: ["tabela-fone", "orbijob", "stockport"], related: ["flutter", "clean-architecture"] },
    { id: "tdd", name: "TDD", exp: ["cooper-tec"], projects: [], related: ["automated-testing", "clean-architecture"] },
    { id: "automated-testing", name: "Automated Testing", label: { en: "Automated Testing", "pt-BR": "Testes Automatizados", es: "Pruebas Automatizadas" }, exp: ["cooper-tec"], projects: ["orbijob", "bebometro", "stockport"], related: ["tdd", "github-actions"] },
    { id: "dependency-injection", name: "Dependency Injection", text: true, label: { en: "Dependency Injection", "pt-BR": "Injeção de Dependência", es: "Inyección de Dependencias" }, exp: [], projects: ["orbijob", "stockport"], related: ["clean-architecture", "solid", "get-it"] },
    { id: "get-it", name: "get_it", ext: "png", exp: [], projects: OWN, related: ["dependency-injection", "flutter", "bloc"] },
    { id: "go-router", name: "go_router", exp: [], projects: ["tabela-fone"], related: ["flutter", "deep-links"] },
    { id: "freezed", name: "Freezed", exp: [], projects: ["tabela-fone"], related: ["dart", "clean-architecture"] },
    { id: "getx", name: "GetX", exp: [], projects: ["iza"], related: ["flutter", "bloc"] },
    { id: "scoped-model", name: "Scoped Model", exp: [], projects: ["gpol"], related: ["flutter", "provider"] },
    { id: "modular-packages", name: "Modular Packages", exp: [], projects: ["toro"], related: ["clean-architecture", "flutter"] },
    { id: "micro-frontends", name: "Micro-frontends", exp: [], projects: ["boosteragro", "agrosmart"], related: ["modular-packages", "clean-architecture"] },
    { id: "solid", name: "SOLID", exp: [], projects: [], related: ["clean-architecture", "dependency-injection"] },
    { id: "rest-api", name: "REST APIs", exp: [], projects: ["emater", "agr-fiscal"], related: ["jwt", "flutter"] },
    { id: "graphql", name: "GraphQL", exp: [], projects: ["toro"], related: ["rest-api", "typescript"] },
    { id: "grpc", name: "gRPC", exp: [], projects: ["iza"], related: ["rest-api", "java"] },
    { id: "signalr", name: "SignalR", exp: [], projects: ["toro"], related: ["supabase-realtime", "rest-api"] },
    { id: "supabase", name: "Supabase", exp: [], projects: OWN, related: ["postgresql", "rls", "flutter"] },
    { id: "supabase-realtime", name: "Supabase Realtime", exp: [], projects: ["match-queue"], related: ["supabase", "postgresql", "signalr"] },
    { id: "edge-functions", name: "Supabase Edge Functions", exp: [], projects: ["aprovaura", "orbijob", "bebometro", "stockport", "la-pelve"], related: ["supabase", "typescript", "rest-api"] },
    { id: "offline-first", name: "Offline-first", exp: [], projects: ["la-pelve", "boosteragro", "agrosmart"], related: ["sqlite", "hive", "sembast"] },
    { id: "sqlite", name: "SQLite", exp: [], projects: ["la-pelve", "iza"], related: ["offline-first", "sql", "postgresql"] },
    { id: "postgresql", name: "PostgreSQL", exp: [], projects: OWN, related: ["supabase", "sql"] },
    { id: "firebase", name: "Firebase", ext: "png", exp: ["iza"], projects: ["iza", "match-queue", "orbijob", "bebometro", "stockport", "tabela-fone", "fan-hub", "aprovaura", "la-pelve"], related: ["flutter", "crashlytics", "remote-config", "firebase-messaging"] },
    { id: "firebase-auth", name: "Firebase Authentication", exp: [], projects: ["vai", "gpol"], related: ["firebase", "jwt", "flutter"] },
    { id: "firestore", name: "Cloud Firestore", exp: [], projects: ["gpol"], related: ["firebase", "firebase-rtdb"] },
    { id: "firebase-rtdb", name: "Firebase Realtime Database", exp: [], projects: ["vai"], related: ["firebase", "firestore", "supabase-realtime"] },
    { id: "flavors", name: "Flutter Flavors", text: true, exp: ["cooper-tec"], projects: ["cooper-pay"], related: ["flutter", "codemagic"] },
    { id: "fastlane", name: "Fastlane", exp: ["agrosmart"], projects: COOPER_AGRO, related: ["github-actions", "codemagic"] },
    { id: "codemagic", name: "Codemagic", exp: ["cooper-tec"], projects: ["cooper-pay"], related: ["flavors", "fastlane"] },
    { id: "github-actions", name: "GitHub Actions", exp: ["agrosmart"], projects: COOPER_AGRO, related: ["fastlane", "github"] },
    { id: "app-store-connect", name: "App Store Connect", exp: ["cooper-tec"], projects: ["cooper-pay", "match-queue", "aprovaura", "orbijob", "stockport", "bebometro"], related: ["ios", "fastlane"] },
    { id: "google-play-console", name: "Google Play Console", exp: ["cooper-tec"], projects: ["cooper-pay", "fan-hub", "la-pelve", "aprovaura", "orbijob", "bebometro"], related: ["android", "fastlane"] },
    { id: "in-app-purchases", name: "In-App Purchases", exp: [], projects: ["tabela-fone"], related: ["app-store-connect", "google-play-console"] },
    { id: "git", name: "Git", exp: [], projects: ["stockport", "orbijob", "bebometro", "busaogyn"], related: ["github"] },
    { id: "github", name: "GitHub", exp: [], projects: ["stockport", "orbijob", "bebometro", "busaogyn"], related: ["git", "github-actions"] },
    { id: "rls", name: "Row-Level Security", exp: [], projects: ["match-queue", "la-pelve", "stockport", "orbijob", "bebometro", "fan-hub"], related: ["supabase", "postgresql"] },
    { id: "cloudflare-workers", name: "Cloudflare Workers", exp: [], projects: ["fan-hub", "busaogyn", "bebometro", "orbijob", "aprovaura", "la-pelve"], related: ["supabase", "typescript"] },
    { id: "crashlytics", name: "Firebase Crashlytics", ext: "png", exp: ["toro"], projects: ["toro"], related: ["firebase", "sentry"] },
    { id: "remote-config", name: "Firebase Remote Config", ext: "png", exp: ["toro"], projects: ["toro"], related: ["firebase", "crashlytics"] },
    { id: "firebase-messaging", name: "Firebase Cloud Messaging", ext: "png", exp: [], projects: ["fan-hub", "orbijob"], related: ["firebase", "deep-links"] },
    { id: "onesignal", name: "OneSignal", exp: [], projects: ["toro", "agrosmart", "boosteragro"], related: ["firebase-messaging", "flutter"] },
    { id: "whatsapp-api", name: "WhatsApp API", exp: [], projects: ["la-pelve"], related: ["edge-functions", "rest-api"] },
    { id: "zendesk", name: "Zendesk", exp: [], projects: ["iza"], related: ["rest-api", "firebase-messaging"] },
    { id: "facebook-login", name: "Facebook Login", exp: [], projects: ["iza"], related: ["firebase-auth", "flutter"] },
    { id: "sentry", name: "Sentry", exp: [], projects: ["toro"], related: ["crashlytics"] },
    { id: "gemini", name: "Gemini API", exp: [], projects: ["aprovaura"], related: ["supabase", "rest-api"] },
    { id: "ml-kit", name: "Google ML Kit", exp: [], projects: ["orbijob"], related: ["flutter", "offline-first"] },
    { id: "deep-links", name: "Deep Links", wide: true, exp: [], projects: ["match-queue", "stockport", "tabela-fone"], related: ["flutter", "web-pwa"] },
    { id: "i18n", name: "i18n", label: { en: "Localization (i18n)", "pt-BR": "Idiomas (i18n)", es: "Idiomas (i18n)" }, exp: [], projects: ["aprovaura", "orbijob", "bebometro", "stockport"], related: ["flutter", "dart"] },
    { id: "gps", name: "GPS", label: { en: "GPS & Location", "pt-BR": "GPS e Localização", es: "GPS y Ubicación" }, exp: ["cooper-tec", "freelance"], projects: ["cooper-pay", "busaogyn", "bebometro", "emater", "vai"], related: ["flutter", "android"] },
    { id: "google-maps", name: "Google Maps & Places", exp: [], projects: ["emater", "vai"], related: ["gps", "mapbox", "maplibre"] },
    { id: "mapbox", name: "Mapbox", exp: [], projects: ["agrosmart", "boosteragro"], related: ["google-maps", "gps"] },
    { id: "maplibre", name: "MapLibre", exp: [], projects: ["busaogyn"], related: ["google-maps", "gps"] },
    { id: "web-pwa", name: "Web / PWA", wide: true, exp: [], projects: OWN, related: ["flutter", "cloudflare-workers"] },
    { id: "pdf", name: "PDF Generation", exp: [], projects: ["agr-fiscal", "stockport"], related: ["flutter", "sql"] },
    { id: "webview", name: "WebView", exp: [], projects: ["orbijob"], related: ["flutter", "deep-links"] },
    { id: "barcode-scanning", name: "Barcode Scanning", exp: [], projects: ["stockport"], related: ["ml-kit", "flutter"] },
    { id: "biometrics", name: "Biometric Authentication", exp: [], projects: ["toro"], related: ["ios", "android", "firebase-auth"] },
    { id: "hive", name: "Hive", exp: ["agrosmart"], projects: ["busaogyn", "orbijob", "bebometro", "stockport"], related: ["sembast", "flutter"] },
    { id: "sembast", name: "Sembast", exp: ["agrosmart"], projects: ["agrosmart", "boosteragro"], related: ["hive", "flutter"] },
    { id: "provider", name: "Provider", text: true, exp: [], projects: ["emater"], related: ["flutter", "bloc"] },
    { id: "jwt", name: "JWT", exp: [], projects: ["stockport"], related: ["rest-api"] },
    { id: "scrum", name: "Scrum", exp: ["cooper-tec", "agrosmart"], projects: [], related: ["azure-devops", "git"] },
    { id: "azure-devops", name: "Azure DevOps", exp: ["toro"], projects: ["toro"], related: ["git"] },
    { id: "gitlab", name: "GitLab", exp: ["saneago"], projects: [], related: ["git", "github"] },
    { id: "sql", name: "SQL", exp: [], projects: ["stockport"], related: ["postgresql", "mysql"] },
    { id: "typescript", name: "TypeScript", exp: [], projects: ["busaogyn", "fan-hub", "orbijob"], related: ["javascript"] },
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
