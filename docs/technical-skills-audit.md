# Technical Skills — auditoria de associações (2026-10-21)

Revisão de **81 competências**, dos **17 aplicativos individuais** com tecnologias no `/apps/` e dos **oito repositórios Flutter próprios**. Os 20 apps do ecossistema Cooper Pay aparecem no catálogo, mas as skills os representam por um único projeto agrupador (`cooper-pay`), com base no histórico da Cooper Tec.

## Hierarquia das evidências

1. **Código próprio inspecionado:** `pubspec.yaml` em `match-queue`, `fan-hub`, `la-pelve`, `aprovaura`, `bebometro`, `stockport-system`; `app/pubspec.yaml` em `orbijob` e `busaogyn`, além das pastas `supabase/functions/`, `.github/workflows/` e testes. Dependência instalada é evidência de integração, não necessariamente de recurso já publicado em produção.
2. **Catálogo:** `assets/js/apps-data.js` define os chips técnicos dos apps próprios e profissionais. Chips dos projetos profissionais são declarações históricas de portfólio; o código dessas empresas não foi auditado.
3. **Carreira:** linha do tempo em `index.html` e textos publicados em `assets/js/skills-details.js`. Experiência declarada não é prova independente de uma biblioteca específica.
4. **Sem evidência verificável:** não adicionar projetos/empresas por suposição. Itens históricos em aberto estão sinalizados abaixo para confirmação do proprietário.

## Invariantes que agora têm teste automático

- Todo app catalogado com **Flutter** possui vínculo tanto em **Flutter** como em **Dart**. A lista da grade é a mesma referência `FLUTTER_PROJECTS`, com **18 projetos agregados** (17 apps individuais + Cooper Pay).
- Cada chip técnico mapeável do catálogo exige o vínculo correspondente na grade; os chips genéricos não criam tecnologia específica por inferência.
- Nos repositórios próprios, `flutter_bloc`, `get_it`, `go_router`, `supabase_flutter`, ML Kit, Firebase, `pdf`, Sentry, scanner, localização e biometria foram cruzados com os manifestos e as associações. A pasta Edge Functions e os workflows CI foram inspecionados.
- Firebase é uma família de SDKs: **Firebase Auth** não é sinônimo de **Firebase Messaging**, **Crashlytics**, **Supabase Auth** ou Firestore. Mapas com localização de terceiros não demonstram GPS do dispositivo.
- App Store Connect não significa que um app em preparação já está publicado. Flutter Web não significa necessariamente um PWA instalável.

## Inventário completo

| Nº | Competência | Projetos associados | Experiências profissionais | Fonte principal | Observação |
|---:|---|---:|---:|---|---|
| 01 | Flutter | 18 | 5 | Repositório + catálogo |  |
| 02 | Dart | 18 | 5 | Invariante Flutter/Dart | Os dois cards compartilham a mesma referência de 18 projetos. |
| 03 | Android | 17 | 5 | Repositório + catálogo |  |
| 04 | iOS | 16 | 5 | Repositório + catálogo |  |
| 05 | Clean Architecture | 1 | 3 | Repositório + catálogo |  |
| 06 | BLoC / Cubit | 14 | 4 | Repositório + catálogo |  |
| 07 | TDD | 0 | 1 | Histórico profissional |  |
| 08 | Automated Testing | 8 | 1 | Repositório + catálogo |  |
| 09 | Dependency Injection | 7 | 0 | Repositório + catálogo |  |
| 10 | GetIt | 7 | 0 | Repositório + catálogo |  |
| 11 | go_router | 6 | 0 | Repositório + catálogo |  |
| 12 | Freezed | 1 | 0 | Catálogo / carreira |  |
| 13 | GetX | 1 | 1 | Catálogo / carreira |  |
| 14 | Scoped Model | 1 | 1 | Catálogo / carreira |  |
| 15 | SOLID | 0 | 0 | A confirmar | Princípios gerais presentes na arquitetura; sem projeto explicitamente comprovado. |
| 16 | REST APIs | 2 | 1 | Catálogo / carreira |  |
| 17 | GraphQL | 1 | 1 | Catálogo / carreira |  |
| 18 | gRPC | 1 | 1 | Catálogo / carreira |  |
| 19 | SignalR | 1 | 1 | Catálogo / carreira |  |
| 20 | Supabase | 8 | 0 | Repositório + catálogo |  |
| 21 | Supabase Realtime | 1 | 0 | Repositório + catálogo |  |
| 22 | Supabase Edge Functions | 7 | 0 | Repositório + catálogo |  |
| 23 | Offline-first | 3 | 1 | Repositório + catálogo |  |
| 24 | SQLite | 2 | 1 | Repositório + catálogo |  |
| 25 | PostgreSQL | 8 | 0 | Repositório + catálogo |  |
| 26 | Firebase | 9 | 4 | Repositório + catálogo | Não atribuir Firebase a apps com apenas Supabase. |
| 27 | Firebase Auth | 2 | 1 | Catálogo / carreira |  |
| 28 | Fastlane | 2 | 1 | Catálogo / carreira |  |
| 29 | Codemagic | 1 | 1 | Catálogo / carreira |  |
| 30 | GitHub Actions | 10 | 1 | Repositório + catálogo |  |
| 31 | App Store Connect | 4 | 1 | Repositório + catálogo | Apenas projetos com publicação iOS confirmada ou experiência de loja, sem inferir release por metadata. |
| 32 | Google Play Console | 1 | 1 | Catálogo / carreira | Não atribuir publicação Android a apps ainda em preparação. |
| 33 | In-App Purchases | 1 | 0 | Catálogo / carreira |  |
| 34 | Git | 8 | 0 | Repositório + catálogo |  |
| 35 | GitHub | 8 | 0 | Repositório + catálogo |  |
| 36 | Row-Level Security | 6 | 0 | Repositório + catálogo |  |
| 37 | Modular Packages | 1 | 1 | Catálogo / carreira |  |
| 38 | Cloudflare Workers | 7 | 0 | Repositório + catálogo |  |
| 39 | Firebase Crashlytics | 4 | 2 | Repositório + catálogo |  |
| 40 | Firebase Remote Config | 2 | 2 | Catálogo / carreira |  |
| 41 | Firebase Cloud Messaging | 5 | 2 | Repositório + catálogo |  |
| 42 | OneSignal | 3 | 2 | Catálogo / carreira |  |
| 43 | Cloud Firestore | 1 | 1 | Catálogo / carreira |  |
| 44 | WhatsApp API | 1 | 0 | Repositório + catálogo |  |
| 45 | Zendesk | 1 | 1 | Catálogo / carreira |  |
| 46 | Facebook Login | 1 | 1 | Catálogo / carreira |  |
| 47 | Sentry | 2 | 1 | Repositório + catálogo |  |
| 48 | Firebase Realtime | 1 | 1 | Catálogo / carreira |  |
| 49 | Gemini API | 1 | 0 | Repositório + catálogo |  |
| 50 | Google ML Kit | 2 | 0 | Repositório + catálogo |  |
| 51 | Deep Links | 3 | 0 | Repositório + catálogo |  |
| 52 | i18n | 5 | 0 | Repositório + catálogo |  |
| 53 | GPS | 5 | 2 | Repositório + catálogo | Não inferir GPS apenas porque o app mostra ônibus num mapa. |
| 54 | Google Maps & Places | 3 | 1 | Catálogo / carreira | Google Maps / Places não comprova GPS do dispositivo. |
| 55 | Mapbox | 2 | 1 | Catálogo / carreira |  |
| 56 | MapLibre | 1 | 0 | Repositório + catálogo |  |
| 57 | Web / PWA | 8 | 0 | Repositório + catálogo | Build Flutter Web não equivale automaticamente a PWA instalável. |
| 58 | PDF Generation | 3 | 1 | Repositório + catálogo |  |
| 59 | Flutter Flavors | 2 | 1 | Repositório + catálogo |  |
| 60 | WebView | 1 | 0 | Repositório + catálogo |  |
| 61 | Barcode Scanning | 1 | 0 | Repositório + catálogo |  |
| 62 | Biometric Authentication | 2 | 1 | Repositório + catálogo |  |
| 63 | Hive | 0 | 1 | A confirmar | Agrosmart é citado no histórico, mas os chips atuais mencionam Sembast, não Hive. |
| 64 | Sembast | 2 | 1 | Catálogo / carreira |  |
| 65 | Micro-frontends | 2 | 1 | Catálogo / carreira |  |
| 66 | JWT | 1 | 0 | A confirmar | Há menção a StockPort; conferir implementação específica do fluxo JWT antes de atribuir mais projetos. |
| 67 | Scrum | 0 | 2 | A confirmar | Processos de equipe declarados nos textos existentes; sem artefato externo do processo. |
| 68 | Azure DevOps | 1 | 1 | Catálogo / carreira |  |
| 69 | GitLab | 0 | 1 | A confirmar | O histórico de Saneago menciona SVN; a atribuição ao GitLab requer confirmação. |
| 70 | SQL | 6 | 0 | Repositório + catálogo |  |
| 71 | Provider | 1 | 1 | Catálogo / carreira |  |
| 72 | TypeScript | 3 | 0 | Repositório + catálogo |  |
| 73 | JavaScript | 0 | 0 | Código do site | Este próprio portfólio utiliza JavaScript e testes Node. |
| 74 | Java | 0 | 2 | Histórico profissional |  |
| 75 | Spring | 0 | 1 | A confirmar | A linha do tempo da Memora menciona Java e ZK, mas não Spring. |
| 76 | MongoDB | 0 | 0 | A confirmar | Nenhum projeto/experiência do site identifica MongoDB diretamente. |
| 77 | MySQL | 0 | 0 | A confirmar | Nenhum projeto/experiência do site identifica MySQL diretamente. |
| 78 | DB2 | 0 | 0 | A confirmar | Nenhum projeto/experiência do site identifica IBM DB2 diretamente. |
| 79 | ObjectDB | 2 | 1 | Catálogo / carreira |  |
| 80 | ZK Framework | 0 | 2 | Histórico profissional |  |
| 81 | Oracle | 0 | 1 | A confirmar | O histórico profissional cita Memora; Oracle não aparece na linha do tempo. |

## Confirmações históricas pendentes

Os itens **Hive, MySQL, DB2, MongoDB, GitLab, Oracle, Spring, JWT, SOLID e Scrum** permanecem na grade, sem inventar vínculos adicionais. Para os que já tinham atribuição histórica publicada, ela foi preservada; isso não equivale a uma auditoria independente do código das empresas. A autorização para adicionar/remover experiência histórica deverá vir do proprietário quando disponível.

## Fora de escopo

Não houve acesso ao código-fonte dos aplicativos profissionais externos nem aos seus pipelines proprietários. Não foram executados builds dos apps nem deploys de backend, e nenhuma conclusão sobre publicação mobile foi derivada apenas de `pubspec.yaml`.

Fontes de código mantidas: `assets/js/apps-data.js`, `assets/js/skills-data.js`, `assets/js/skills-details.js`. Testes: `tests/skills.test.js` e `tests/skills-evidence.test.js`.
