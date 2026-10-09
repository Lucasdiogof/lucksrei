/* Lucksrei — textos do modal de Technical Skills (carregado só quando o primeiro modal abre).
 *
 * Formato: id → { locale → [descrição curta, o que é, como utilizo]. }
 * Vínculos com empresas e projetos ficam em skills-data.js. Nomes de tecnologias não são traduzidos.
 * Skills sem evidência no histórico usam texto conservador, sem atribuir empresa ou projeto.
 */
(function (root, factory) {
  "use strict";
  var api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  else root.LUCKSREI_SKILL_TEXT = api;
})(typeof window !== "undefined" ? window : this, function () {
  "use strict";

  return {
    flutter: {
      en: ["Cross-platform UI toolkit for Android and iOS.", "Google's open-source toolkit for building natively compiled mobile, web and desktop apps from a single Dart codebase.", "My main tool since 2019: production apps for Android and iOS in fintech, agrotech, insurance, government and my own products, from architecture to store release."],
      "pt-BR": ["Toolkit de UI multiplataforma para Android e iOS.", "Toolkit open source do Google para criar apps mobile, web e desktop compilados nativamente a partir de uma única base de código em Dart.", "Minha principal ferramenta desde 2019: apps de produção para Android e iOS em fintech, agrotech, seguros, governo e produtos próprios, da arquitetura à publicação nas lojas."],
      es: ["Toolkit de UI multiplataforma para Android e iOS.", "Toolkit de código abierto de Google para crear apps móviles, web y de escritorio compiladas de forma nativa desde una única base de código en Dart.", "Mi herramienta principal desde 2019: apps de producción para Android e iOS en fintech, agrotech, seguros, gobierno y productos propios, de la arquitectura a la publicación en las tiendas."]
    },
    dart: {
      en: ["The language behind Flutter.", "A typed, object-oriented language optimized for client apps, with sound null safety, async/await and streams.", "The language of every Flutter app listed here: domain logic, state management, data layers and tests."],
      "pt-BR": ["A linguagem por trás do Flutter.", "Linguagem tipada e orientada a objetos otimizada para apps cliente, com null safety, async/await e streams.", "A linguagem de todos os apps Flutter listados aqui: regras de domínio, gerenciamento de estado, camadas de dados e testes."],
      es: ["El lenguaje detrás de Flutter.", "Lenguaje tipado y orientado a objetos optimizado para apps cliente, con null safety, async/await y streams.", "El lenguaje de todas las apps Flutter listadas aquí: lógica de dominio, gestión de estado, capas de datos y pruebas."]
    },
    android: {
      en: ["Android builds and Google Play releases.", "Google's mobile platform. With Flutter, the Android side covers build configuration, signing and Google Play distribution.", "Android builds and Google Play releases of the Flutter apps I worked on, including the platform-specific configuration they need."],
      "pt-BR": ["Builds Android e publicação no Google Play.", "Plataforma mobile do Google. Com Flutter, o lado Android cobre configuração de build, assinatura e distribuição no Google Play.", "Builds Android e publicações no Google Play dos apps Flutter em que atuei, incluindo a configuração específica da plataforma."],
      es: ["Builds de Android y publicación en Google Play.", "Plataforma móvil de Google. Con Flutter, el lado Android cubre la configuración de build, la firma y la distribución en Google Play.", "Builds de Android y publicaciones en Google Play de las apps Flutter en las que trabajé, incluida la configuración específica de la plataforma."]
    },
    ios: {
      en: ["iOS builds, App Store and TestFlight.", "Apple's mobile platform. With Flutter, the iOS side covers Xcode project setup, signing, App Store Connect and TestFlight.", "iOS builds and App Store releases of the Flutter apps I worked on, with TestFlight distribution for testing."],
      "pt-BR": ["Builds iOS, App Store e TestFlight.", "Plataforma mobile da Apple. Com Flutter, o lado iOS cobre o projeto Xcode, assinatura, App Store Connect e TestFlight.", "Builds iOS e publicações na App Store dos apps Flutter em que atuei, com distribuição via TestFlight para testes."],
      es: ["Builds de iOS, App Store y TestFlight.", "Plataforma móvil de Apple. Con Flutter, el lado iOS cubre el proyecto Xcode, la firma, App Store Connect y TestFlight.", "Builds de iOS y publicaciones en App Store de las apps Flutter en las que trabajé, con distribución por TestFlight para pruebas."]
    },
    flavors: {
      en: ["One codebase, many app identities.", "Build variants in Flutter that produce different apps from the same code, each with its own name, identifier, assets and configuration.", "At Cooper Tec, white-label apps of the Cooper Pay ecosystem with distinct identities and configurations. Cooper Pay Corporate is the business (PJ) solution, not a white-label flavor like the others."],
      "pt-BR": ["Um código, várias identidades de app.", "Variantes de build no Flutter que geram apps diferentes a partir do mesmo código, cada um com nome, identificador, assets e configuração próprios.", "Na Cooper Tec, apps white-label do ecossistema Cooper Pay com identidades e configurações distintas. O Cooper Pay Corporate é a solução PJ, não um flavor white-label como os demais."],
      es: ["Un código, varias identidades de app.", "Variantes de build en Flutter que generan apps distintas desde el mismo código, cada una con su nombre, identificador, assets y configuración.", "En Cooper Tec, apps white-label del ecosistema Cooper Pay con identidades y configuraciones distintas. Cooper Pay Corporate es la solución PJ, no un flavor white-label como los demás."]
    },
    bloc: {
      en: ["State management with streams.", "BLoC separates business logic from the UI using streams of events and states; Cubit is its simpler, method-driven variant.", "State management with BLoC and Cubit in the Flutter apps at Cooper Tec and Agrosmart: events and states kept apart from the UI, which keeps presentation logic testable."],
      "pt-BR": ["Gerenciamento de estado com streams.", "O BLoC separa a lógica de negócio da UI usando fluxos de eventos e estados; o Cubit é a variante mais simples, baseada em métodos.", "Gerenciamento de estado com BLoC e Cubit nos apps Flutter da Cooper Tec e da Agrosmart: eventos e estados separados da UI, o que mantém a lógica de apresentação testável."],
      es: ["Gestión de estado con streams.", "BLoC separa la lógica de negocio de la UI mediante flujos de eventos y estados; Cubit es su variante más simple, basada en métodos.", "Gestión de estado con BLoC y Cubit en las apps Flutter de Cooper Tec y Agrosmart: eventos y estados separados de la UI, lo que mantiene la lógica de presentación testeable."]
    },
    provider: {
      en: ["Dependency and state provider for Flutter.", "A Flutter package that exposes values and state to the widget tree and rebuilds only the widgets that depend on them.", "Used in Flutter to expose state and dependencies to the widget tree and rebuild only the widgets that depend on them, in line with the presentation/domain separation of Clean Architecture."],
      "pt-BR": ["Provedor de dependências e estado para Flutter.", "Pacote do Flutter que expõe valores e estado para a árvore de widgets e reconstrói apenas os widgets que dependem deles.", "Usado no Flutter para expor estado e dependências à árvore de widgets e reconstruir apenas os widgets que dependem deles, alinhado à separação entre apresentação e domínio da Clean Architecture."],
      es: ["Proveedor de dependencias y estado para Flutter.", "Paquete de Flutter que expone valores y estado al árbol de widgets y reconstruye solo los widgets que dependen de ellos.", "Se usa en Flutter para exponer estado y dependencias al árbol de widgets y reconstruir solo los widgets que dependen de ellos, en línea con la separación entre presentación y dominio de Clean Architecture."]
    },
    "clean-architecture": {
      en: ["Layered architecture with clear boundaries.", "An architecture style that separates presentation, domain and data so business rules do not depend on frameworks, databases or the UI.", "The structure of the Flutter apps at Cooper Tec, Agrosmart and Toro Investimentos, and of the Goiás App (domain, data and presentation layers), keeping features testable and easier to evolve."],
      "pt-BR": ["Arquitetura em camadas com limites claros.", "Estilo de arquitetura que separa apresentação, domínio e dados para que as regras de negócio não dependam de frameworks, bancos de dados ou da UI.", "A estrutura dos apps Flutter na Cooper Tec, na Agrosmart e na Toro Investimentos, e do Goiás App (camadas de domínio, dados e apresentação), mantendo as features testáveis e mais fáceis de evoluir."],
      es: ["Arquitectura en capas con límites claros.", "Estilo de arquitectura que separa presentación, dominio y datos para que las reglas de negocio no dependan de frameworks, bases de datos ni de la UI.", "La estructura de las apps Flutter en Cooper Tec, Agrosmart y Toro Investimentos, y de Goiás App (capas de dominio, datos y presentación), manteniendo las features testeables y más fáciles de evolucionar."]
    },
    solid: {
      en: ["Five principles of object-oriented design.", "Single responsibility, open/closed, Liskov substitution, interface segregation and dependency inversion.", "Guides how I split classes and layers in Dart: small single-purpose classes, abstractions at layer boundaries and dependencies pointing inward, which keeps features testable."],
      "pt-BR": ["Cinco princípios de design orientado a objetos.", "Responsabilidade única, aberto/fechado, substituição de Liskov, segregação de interfaces e inversão de dependência.", "Orienta como divido classes e camadas em Dart: classes pequenas e com um único propósito, abstrações nas fronteiras entre camadas e dependências apontando para dentro, o que mantém as features testáveis."],
      es: ["Cinco principios de diseño orientado a objetos.", "Responsabilidad única, abierto/cerrado, sustitución de Liskov, segregación de interfaces e inversión de dependencias.", "Guía cómo divido clases y capas en Dart: clases pequeñas de un solo propósito, abstracciones en los límites entre capas y dependencias que apuntan hacia adentro, lo que mantiene las features testeables."]
    },
    tdd: {
      en: ["Tests first, code second.", "Test-driven development: write a failing test, make it pass, then refactor, in short cycles.", "Part of how I build features at Cooper Tec, alongside Clean Architecture and BLoC."],
      "pt-BR": ["Primeiro o teste, depois o código.", "Desenvolvimento guiado por testes: escrever um teste que falha, fazê-lo passar e refatorar, em ciclos curtos.", "Parte de como construo features na Cooper Tec, junto com Clean Architecture e BLoC."],
      es: ["Primero la prueba, después el código.", "Desarrollo guiado por pruebas: escribir una prueba que falla, hacerla pasar y refactorizar, en ciclos cortos.", "Parte de cómo construyo features en Cooper Tec, junto con Clean Architecture y BLoC."]
    },
    "dependency-injection": {
      en: ["Wiring layers without hard dependencies.", "A technique where objects receive their dependencies instead of creating them, which decouples layers and makes code easy to test.", "Wires repositories, data sources and use cases into the presentation layer through constructors and interfaces, so each layer can be replaced by a fake in tests."],
      "pt-BR": ["Ligando camadas sem dependências rígidas.", "Técnica em que os objetos recebem suas dependências em vez de criá-las, o que desacopla camadas e facilita os testes.", "Conecta repositórios, data sources e casos de uso à camada de apresentação por construtores e interfaces, permitindo trocar cada camada por um fake nos testes."],
      es: ["Conectar capas sin dependencias rígidas.", "Técnica en la que los objetos reciben sus dependencias en lugar de crearlas, lo que desacopla capas y facilita las pruebas.", "Conecta repositorios, data sources y casos de uso con la capa de presentación mediante constructores e interfaces, de modo que cada capa pueda sustituirse por un fake en las pruebas."]
    },
    "automated-testing": {
      en: ["Unit and widget tests that guard releases.", "Automated checks that verify behavior on every change, from unit tests of business rules to widget tests of the UI.", "Unit tests are part of my architecture practice, practiced as TDD at Cooper Tec."],
      "pt-BR": ["Testes unitários e de widget que protegem os releases.", "Verificações automáticas que validam o comportamento a cada mudança, de testes unitários das regras de negócio a testes de widget da UI.", "Testes unitários fazem parte da minha prática de arquitetura, aplicados como TDD na Cooper Tec."],
      es: ["Pruebas unitarias y de widget que protegen los releases.", "Verificaciones automáticas que validan el comportamiento en cada cambio, desde pruebas unitarias de reglas de negocio hasta pruebas de widget de la UI.", "Las pruebas unitarias forman parte de mi práctica de arquitectura, aplicadas como TDD en Cooper Tec."]
    },
    "rest-api": {
      en: ["Talking to backends over HTTP.", "An architectural style for web services that exposes resources over HTTP, usually exchanging JSON.", "Integration of mobile apps with web-service backends: HTTP requests, JSON serialization, error handling and authentication, kept in the data layer of the app."],
      "pt-BR": ["Conversando com backends via HTTP.", "Estilo arquitetural de serviços web que expõe recursos via HTTP, normalmente trocando JSON.", "Integração de apps mobile com backends de web services: requisições HTTP, serialização JSON, tratamento de erros e autenticação, mantidos na camada de dados do app."],
      es: ["Hablar con backends por HTTP.", "Estilo arquitectónico de servicios web que expone recursos por HTTP, normalmente intercambiando JSON.", "Integración de apps móviles con backends de servicios web: peticiones HTTP, serialización JSON, manejo de errores y autenticación, mantenidos en la capa de datos de la app."]
    },
    supabase: {
      en: ["Open-source backend on top of PostgreSQL.", "A backend platform with a Postgres database, authentication, storage and real-time features.", "The backend of my own products: Match Queue, FanHub, La Pelve and Aprovaura, with Postgres, authentication and real-time features."],
      "pt-BR": ["Backend open source sobre PostgreSQL.", "Plataforma de backend com banco Postgres, autenticação, storage e recursos em tempo real.", "O backend dos meus produtos próprios: Match Queue, FanHub, La Pelve e Aprovaura, com Postgres, autenticação e recursos em tempo real."],
      es: ["Backend de código abierto sobre PostgreSQL.", "Plataforma de backend con base de datos Postgres, autenticación, storage y funciones en tiempo real.", "El backend de mis productos propios: Match Queue, FanHub, La Pelve y Aprovaura, con Postgres, autenticación y funciones en tiempo real."]
    },
    postgresql: {
      en: ["Relational database.", "An open-source relational database known for reliability, SQL compliance and extensibility.", "The database behind my own products through Supabase: Match Queue, FanHub, La Pelve and Aprovaura."],
      "pt-BR": ["Banco de dados relacional.", "Banco relacional open source conhecido por confiabilidade, aderência ao SQL e extensibilidade.", "O banco de dados dos meus produtos próprios via Supabase: Match Queue, FanHub, La Pelve e Aprovaura."],
      es: ["Base de datos relacional.", "Base de datos relacional de código abierto conocida por su fiabilidad, cumplimiento de SQL y extensibilidad.", "La base de datos de mis productos propios a través de Supabase: Match Queue, FanHub, La Pelve y Aprovaura."]
    },
    firebase: {
      en: ["Google's backend services for apps.", "A suite of managed services for apps, including Firestore and Realtime Database, authentication, messaging and crash reporting.", "Used with Flutter at IZA (Firebase and NoSQL), and Firebase Cloud Messaging delivers the notifications in Match Queue."],
      "pt-BR": ["Serviços de backend do Google para apps.", "Conjunto de serviços gerenciados para apps, incluindo Firestore e Realtime Database, autenticação, mensageria e relatório de falhas.", "Usado com Flutter na IZA (Firebase e NoSQL), e o Firebase Cloud Messaging entrega as notificações do Match Queue."],
      es: ["Servicios de backend de Google para apps.", "Conjunto de servicios gestionados para apps, incluidos Firestore y Realtime Database, autenticación, mensajería y reporte de fallos.", "Se usa con Flutter en IZA (Firebase y NoSQL), y Firebase Cloud Messaging entrega las notificaciones de Match Queue."]
    },
    jwt: {
      en: ["Signed tokens for API authentication.", "JSON Web Token: a compact, signed token that carries claims between a client and a server.", "Used to authenticate API calls from mobile apps: the token is sent in the Authorization header, and expiration and renewal are handled on the client."],
      "pt-BR": ["Tokens assinados para autenticação em APIs.", "JSON Web Token: token compacto e assinado que carrega claims entre cliente e servidor.", "Usado para autenticar chamadas de API em apps mobile: o token vai no cabeçalho Authorization e a expiração e a renovação são tratadas no cliente."],
      es: ["Tokens firmados para autenticación en APIs.", "JSON Web Token: token compacto y firmado que transporta claims entre cliente y servidor.", "Se usa para autenticar llamadas a APIs desde apps móviles: el token se envía en el encabezado Authorization y la expiración y renovación se gestionan en el cliente."]
    },
    hive: {
      en: ["Fast local storage for Flutter.", "A lightweight key-value database written in Dart, used to keep data on the device.", "Local persistence in the offline-first apps at Agrosmart: data is stored on the device with Hive and synchronized with the backend when the connection returns."],
      "pt-BR": ["Armazenamento local rápido para Flutter.", "Banco de dados chave-valor leve, escrito em Dart, usado para manter dados no dispositivo.", "Persistência local nos apps offline-first da Agrosmart: os dados ficam no dispositivo com Hive e são sincronizados com o backend quando a conexão volta."],
      es: ["Almacenamiento local rápido para Flutter.", "Base de datos clave-valor ligera, escrita en Dart, usada para guardar datos en el dispositivo.", "Persistencia local en las apps offline-first de Agrosmart: los datos se guardan en el dispositivo con Hive y se sincronizan con el backend cuando vuelve la conexión."]
    },
    sembast: {
      en: ["Document store for Dart and Flutter.", "A NoSQL persistent store for Dart that keeps JSON-like documents in a file.", "Local document storage and offline-first strategies at Agrosmart, with data synchronization between the device and the backend."],
      "pt-BR": ["Document store para Dart e Flutter.", "Armazenamento NoSQL persistente para Dart que guarda documentos estilo JSON em arquivo.", "Armazenamento local de documentos e estratégias offline-first na Agrosmart, com sincronização de dados entre o dispositivo e o backend."],
      es: ["Document store para Dart y Flutter.", "Almacenamiento NoSQL persistente para Dart que guarda documentos tipo JSON en un archivo.", "Almacenamiento local de documentos y estrategias offline-first en Agrosmart, con sincronización de datos entre el dispositivo y el backend."]
    },
    objectdb: {
      en: ["Object database.", "An object-oriented database management system. Not to be confused with ObjectBox.", "Used in freelance projects, in the EMATER-GO Mobi and AGR Fiscal apps."],
      "pt-BR": ["Banco de dados orientado a objetos.", "Sistema de banco de dados orientado a objetos. Não confundir com o ObjectBox.", "Usado em projetos freelance, nos apps EMATER-GO Mobi e AGR Fiscal."],
      es: ["Base de datos orientada a objetos.", "Sistema de gestión de bases de datos orientado a objetos. No confundir con ObjectBox.", "Usado en proyectos freelance, en las apps EMATER-GO Mobi y AGR Fiscal."]
    },
    codemagic: {
      en: ["CI/CD built for Flutter.", "A hosted CI/CD service focused on mobile and Flutter, handling builds, tests, signing and store delivery.", "CI/CD for the apps of the Cooper Pay ecosystem at Cooper Tec: builds and releases across multiple white-label configurations."],
      "pt-BR": ["CI/CD feito para Flutter.", "Serviço de CI/CD hospedado, focado em mobile e Flutter, que cuida de builds, testes, assinatura e entrega nas lojas.", "CI/CD dos apps do ecossistema Cooper Pay na Cooper Tec: builds e releases em múltiplas configurações white-label."],
      es: ["CI/CD pensado para Flutter.", "Servicio de CI/CD alojado, enfocado en móvil y Flutter, que gestiona builds, pruebas, firma y entrega a las tiendas.", "CI/CD de las apps del ecosistema Cooper Pay en Cooper Tec: builds y releases en múltiples configuraciones white-label."]
    },
    fastlane: {
      en: ["Automation for mobile builds and releases.", "An open-source tool that automates building, signing, testing and publishing Android and iOS apps.", "Build and release automation at Agrosmart, for BoosterAGRO and BoosterPRO."],
      "pt-BR": ["Automação de builds e releases mobile.", "Ferramenta open source que automatiza build, assinatura, testes e publicação de apps Android e iOS.", "Automação de builds e releases na Agrosmart, para BoosterAGRO e BoosterPRO."],
      es: ["Automatización de builds y releases móviles.", "Herramienta de código abierto que automatiza el build, la firma, las pruebas y la publicación de apps Android e iOS.", "Automatización de builds y releases en Agrosmart, para BoosterAGRO y BoosterPRO."]
    },
    "github-actions": {
      en: ["Workflows that run on every change.", "GitHub's automation platform, used to run builds, tests and deployments from repository events.", "CI/CD pipelines at Agrosmart, automating builds and releases of BoosterAGRO and BoosterPRO."],
      "pt-BR": ["Workflows que rodam a cada mudança.", "Plataforma de automação do GitHub, usada para rodar builds, testes e deploys a partir de eventos do repositório.", "Pipelines de CI/CD na Agrosmart, automatizando builds e releases do BoosterAGRO e do BoosterPRO."],
      es: ["Workflows que se ejecutan en cada cambio.", "Plataforma de automatización de GitHub, usada para ejecutar builds, pruebas y despliegues a partir de eventos del repositorio.", "Pipelines de CI/CD en Agrosmart, automatizando builds y releases de BoosterAGRO y BoosterPRO."]
    },
    "azure-devops": {
      en: ["Microsoft's repositories and pipelines.", "A suite for source control, work tracking and CI/CD pipelines.", "CI/CD at Toro Investimentos, on the app now known as Santander Corretora."],
      "pt-BR": ["Repositórios e pipelines da Microsoft.", "Suíte para controle de versão, acompanhamento de trabalho e pipelines de CI/CD.", "CI/CD na Toro Investimentos, no app hoje conhecido como Santander Corretora."],
      es: ["Repositorios y pipelines de Microsoft.", "Suite para control de versiones, seguimiento de trabajo y pipelines de CI/CD.", "CI/CD en Toro Investimentos, en la app hoy conocida como Santander Corretora."]
    },
    git: {
      en: ["Distributed version control.", "The standard distributed version control system for tracking changes and collaborating on code.", "My everyday version control across professional and personal projects."],
      "pt-BR": ["Controle de versão distribuído.", "O sistema de controle de versão distribuído padrão para rastrear mudanças e colaborar em código.", "Meu controle de versão do dia a dia em projetos profissionais e pessoais."],
      es: ["Control de versiones distribuido.", "El sistema de control de versiones distribuido estándar para seguir cambios y colaborar en código.", "Mi control de versiones del día a día en proyectos profesionales y personales."]
    },
    github: {
      en: ["Code hosting and collaboration.", "A platform for hosting Git repositories, reviewing code and automating workflows.", "Where I host and review code. My public profile is at github.com/Lucasdiogof."],
      "pt-BR": ["Hospedagem e colaboração de código.", "Plataforma para hospedar repositórios Git, revisar código e automatizar workflows.", "Onde hospedo e reviso código. Meu perfil público está em github.com/Lucasdiogof."],
      es: ["Alojamiento y colaboración de código.", "Plataforma para alojar repositorios Git, revisar código y automatizar workflows.", "Donde alojo y reviso código. Mi perfil público está en github.com/Lucasdiogof."]
    },
    java: {
      en: ["Server-side and web systems.", "A general-purpose, object-oriented language widely used for enterprise and web applications.", "Before mobile, I built Java web systems at Memora Processos Inovadores and at Saneago. That work was Java/Web, not mobile."],
      "pt-BR": ["Sistemas server-side e web.", "Linguagem de propósito geral e orientada a objetos, muito usada em aplicações corporativas e web.", "Antes do mobile, desenvolvi sistemas web em Java na Memora Processos Inovadores e na Saneago. Essa atuação foi Java/Web, não mobile."],
      es: ["Sistemas server-side y web.", "Lenguaje de propósito general y orientado a objetos, muy usado en aplicaciones corporativas y web.", "Antes de lo móvil, desarrollé sistemas web en Java en Memora Processos Inovadores y en Saneago. Esa actuación fue Java/Web, no móvil."]
    },
    sql: {
      en: ["The language of relational data.", "The standard language for querying and modifying data in relational databases.", "Queries, joins, aggregations and schema design for relational data, including the PostgreSQL behind Supabase in my own products."],
      "pt-BR": ["A linguagem dos dados relacionais.", "Linguagem padrão para consultar e modificar dados em bancos relacionais.", "Consultas, joins, agregações e modelagem de esquema para dados relacionais, incluindo o PostgreSQL por trás do Supabase nos meus produtos próprios."],
      es: ["El lenguaje de los datos relacionales.", "Lenguaje estándar para consultar y modificar datos en bases de datos relacionales.", "Consultas, joins, agregaciones y diseño de esquemas para datos relacionales, incluido PostgreSQL detrás de Supabase en mis productos propios."]
    },
    mysql: {
      en: ["Relational database.", "A widely used open-source relational database management system.", "Relational modeling and SQL queries on MySQL, one of the relational databases I work with alongside PostgreSQL and DB2."],
      "pt-BR": ["Banco de dados relacional.", "Sistema gerenciador de banco de dados relacional open source amplamente usado.", "Modelagem relacional e consultas SQL em MySQL, um dos bancos relacionais com que trabalho junto com PostgreSQL e DB2."],
      es: ["Base de datos relacional.", "Sistema gestor de bases de datos relacionales de código abierto muy utilizado.", "Modelado relacional y consultas SQL en MySQL, una de las bases de datos relacionales con las que trabajo junto a PostgreSQL y DB2."]
    },
    db2: {
      en: ["IBM's relational database.", "IBM's relational database management system, common in corporate environments.", "Relational modeling and SQL queries on DB2, one of the relational databases I work with alongside PostgreSQL and MySQL."],
      "pt-BR": ["Banco de dados relacional da IBM.", "Sistema gerenciador de banco de dados relacional da IBM, comum em ambientes corporativos.", "Modelagem relacional e consultas SQL em DB2, um dos bancos relacionais com que trabalho junto com PostgreSQL e MySQL."],
      es: ["Base de datos relacional de IBM.", "Sistema gestor de bases de datos relacionales de IBM, común en entornos corporativos.", "Modelado relacional y consultas SQL en DB2, una de las bases de datos relacionales con las que trabajo junto a PostgreSQL y MySQL."]
    },
    "zk-framework": {
      en: ["Java web framework.", "An event-driven Java framework for building web UIs on the server side.", "Used in corporate Java web systems at Memora Processos Inovadores and at Saneago."],
      "pt-BR": ["Framework web em Java.", "Framework Java orientado a eventos para construir interfaces web no lado do servidor.", "Usado em sistemas corporativos web em Java na Memora Processos Inovadores e na Saneago."],
      es: ["Framework web en Java.", "Framework Java orientado a eventos para construir interfaces web del lado del servidor.", "Usado en sistemas corporativos web en Java en Memora Processos Inovadores y en Saneago."]
    },
    javascript: {
      en: ["The language of the web.", "The scripting language that runs in every browser, and on servers and edge runtimes.", "Used in web work such as this portfolio, which is plain HTML, CSS and JavaScript served by a Cloudflare Worker."],
      "pt-BR": ["A linguagem da web.", "A linguagem de script que roda em todo navegador, em servidores e em runtimes de borda.", "Usado em trabalhos web como este portfólio, feito em HTML, CSS e JavaScript puros e servido por um Cloudflare Worker."],
      es: ["El lenguaje de la web.", "El lenguaje de scripting que corre en todos los navegadores, en servidores y en runtimes de borde.", "Usado en trabajos web como este portafolio, hecho en HTML, CSS y JavaScript puros y servido por un Cloudflare Worker."]
    },
    typescript: {
      en: ["JavaScript with types.", "A typed superset of JavaScript that compiles to plain JavaScript.", "Adds static types to JavaScript in web and edge code, catching mistakes at compile time and documenting the shape of data."],
      "pt-BR": ["JavaScript com tipos.", "Superconjunto tipado de JavaScript que compila para JavaScript puro.", "Adiciona tipagem estática ao JavaScript em código web e de borda, detectando erros em tempo de compilação e documentando o formato dos dados."],
      es: ["JavaScript con tipos.", "Superconjunto tipado de JavaScript que compila a JavaScript puro.", "Añade tipado estático a JavaScript en código web y de borde, detectando errores en compilación y documentando la forma de los datos."]
    },
    "web-pwa": {
      en: ["Flutter apps that also run in the browser.", "Flutter's web target compiles the same Dart code to the browser; as a Progressive Web App it can be installed and work like an app.", "My four products ship web/PWA builds from the same Flutter codebase as the mobile apps, sharing the backend and the business rules."],
      "pt-BR": ["Apps Flutter que também rodam no navegador.", "O alvo web do Flutter compila o mesmo código Dart para o navegador; como Progressive Web App, pode ser instalado e funcionar como um app.", "Meus quatro produtos têm versão web/PWA gerada da mesma base Flutter dos apps mobile, compartilhando o backend e as regras de negócio."],
      es: ["Apps Flutter que también funcionan en el navegador.", "El destino web de Flutter compila el mismo código Dart para el navegador; como Progressive Web App se puede instalar y funcionar como una app.", "Mis cuatro productos tienen versión web/PWA generada desde la misma base Flutter de las apps móviles, compartiendo el backend y las reglas de negocio."]
    },
    "deep-links": {
      en: ["Links that open a specific screen of the app.", "Android App Links and iOS Universal Links route a URL straight into the right screen, with a web fallback when the app is not installed.", "Invite links in Match Queue: the link opens the app on the right team and falls back to the web version, with verified domain files for Android and iOS."],
      "pt-BR": ["Links que abrem uma tela específica do app.", "Android App Links e iOS Universal Links levam uma URL direto para a tela certa, com a versão web como alternativa quando o app não está instalado.", "Links de convite no Match Queue: o link abre o app no time certo ou cai na versão web, com os arquivos de domínio verificado para Android e iOS."],
      es: ["Enlaces que abren una pantalla específica de la app.", "Android App Links e iOS Universal Links llevan una URL directo a la pantalla correcta, con la versión web como alternativa cuando la app no está instalada.", "Enlaces de invitación en Match Queue: el enlace abre la app en el equipo correcto o la versión web, con los archivos de dominio verificado para Android e iOS."]
    },
    i18n: {
      en: ["Apps in more than one language.", "Internationalization prepares the code for several languages and localization delivers the translated texts, formats and content.", "Aprovaura runs in Portuguese, English and Spanish, interface and study content included; this portfolio follows the same approach."],
      "pt-BR": ["Apps em mais de um idioma.", "Internacionalização prepara o código para vários idiomas e a localização entrega os textos, formatos e conteúdos traduzidos.", "O Aprovaura funciona em português, inglês e espanhol, da interface ao conteúdo de estudo; este portfólio segue a mesma abordagem."],
      es: ["Apps en más de un idioma.", "La internacionalización prepara el código para varios idiomas y la localización entrega los textos, formatos y contenidos traducidos.", "Aprovaura funciona en portugués, inglés y español, de la interfaz al contenido de estudio; este portafolio sigue el mismo enfoque."]
    },
    gps: {
      en: ["Device location in mobile apps.", "Location services read the device position through GPS and the network, with runtime permissions on Android and iOS.", "Location features in the Cooper Pay apps at Cooper Tec and real-time GPS tracking in freelance projects such as a ride-hailing app."],
      "pt-BR": ["Localização do aparelho em apps mobile.", "Os serviços de localização leem a posição do aparelho por GPS e rede, com permissões em tempo de execução no Android e no iOS.", "Recursos de localização nos apps Cooper Pay na Cooper Tec e rastreamento por GPS em tempo real em projetos freelance, como um app de mobilidade."],
      es: ["Ubicación del dispositivo en apps móviles.", "Los servicios de ubicación leen la posición del dispositivo por GPS y red, con permisos en tiempo de ejecución en Android e iOS.", "Funciones de ubicación en las apps Cooper Pay en Cooper Tec y seguimiento GPS en tiempo real en proyectos freelance, como una app de movilidad."]
    },
    rls: {
      en: ["Access rules enforced by the database.", "A PostgreSQL feature that filters rows per user with policies, so each user only reads and writes their own data, whatever the client sends.", "Policies in Match Queue and La Pelve: each team or professional only sees their own records, with sensitive actions behind database functions."],
      "pt-BR": ["Regras de acesso aplicadas pelo banco.", "Recurso do PostgreSQL que filtra linhas por usuário com políticas, para que cada um só leia e grave os próprios dados, independentemente do que o cliente envia.", "Políticas no Match Queue e no La Pelve: cada time ou profissional vê só os próprios registros, com as ações sensíveis atrás de funções do banco."],
      es: ["Reglas de acceso aplicadas por la base de datos.", "Función de PostgreSQL que filtra filas por usuario con políticas, para que cada uno solo lea y escriba sus propios datos, sin importar lo que envíe el cliente.", "Políticas en Match Queue y La Pelve: cada equipo o profesional ve solo sus propios registros, con las acciones sensibles detrás de funciones de la base."]
    },
    "cloudflare-workers": {
      en: ["Serverless code at the edge.", "Cloudflare's serverless platform runs JavaScript/TypeScript close to the user, with storage options such as KV and D1.", "Data integration for FanHub, plus the server side of this portfolio, including the privacy-friendly visitor map."],
      "pt-BR": ["Código serverless na borda.", "Plataforma serverless da Cloudflare que roda JavaScript/TypeScript perto do usuário, com opções de armazenamento como KV e D1.", "Integração de dados do FanHub e a parte servidor deste portfólio, incluindo o mapa de visitantes sem dados pessoais."],
      es: ["Código serverless en el borde.", "Plataforma serverless de Cloudflare que ejecuta JavaScript/TypeScript cerca del usuario, con opciones de almacenamiento como KV y D1.", "Integración de datos de FanHub y la parte de servidor de este portafolio, incluido el mapa de visitantes sin datos personales."]
    },
    crashlytics: {
      en: ["Crash reports from real users.", "Firebase's crash reporting tool: groups crashes and errors with stack traces, device data and the affected app version.", "Crash monitoring at Toro Investimentos (now Santander Corretora), used to prioritize fixes by impact on users."],
      "pt-BR": ["Relatórios de crash de usuários reais.", "Ferramenta de relatórios de falhas do Firebase: agrupa crashes e erros com stack trace, dados do aparelho e a versão do app afetada.", "Monitoramento de falhas na Toro Investimentos (hoje Santander Corretora), usado para priorizar correções pelo impacto nos usuários."],
      es: ["Informes de fallos de usuarios reales.", "Herramienta de informes de fallos de Firebase: agrupa crashes y errores con stack trace, datos del dispositivo y la versión de la app afectada.", "Monitoreo de fallos en Toro Investimentos (hoy Santander Corretora), usado para priorizar correcciones por impacto en los usuarios."]
    },
    "remote-config": {
      en: ["App behavior changed without a new release.", "Firebase service that delivers parameters to installed apps, used for feature flags, gradual rollouts and adjustments without going through the stores.", "Feature flags and remote parameters in the Toro Investimentos app (now Santander Corretora)."],
      "pt-BR": ["Comportamento do app alterado sem nova versão.", "Serviço do Firebase que entrega parâmetros aos apps instalados, usado para feature flags, liberações graduais e ajustes sem passar pelas lojas.", "Feature flags e parâmetros remotos no app da Toro Investimentos (hoje Santander Corretora)."],
      es: ["Comportamiento de la app cambiado sin nueva versión.", "Servicio de Firebase que entrega parámetros a las apps instaladas, usado para feature flags, lanzamientos graduales y ajustes sin pasar por las tiendas.", "Feature flags y parámetros remotos en la app de Toro Investimentos (hoy Santander Corretora)."]
    },
    "firebase-messaging": {
      en: ["Push notifications for Android and iOS.", "Firebase Cloud Messaging delivers notifications and data messages to devices, using APNs on iOS.", "Push notifications in FanHub: device tokens, APNs setup on iOS and messages that open the right screen."],
      "pt-BR": ["Notificações push para Android e iOS.", "O Firebase Cloud Messaging entrega notificações e mensagens de dados aos aparelhos, usando o APNs no iOS.", "Notificações push no FanHub: tokens dos aparelhos, configuração do APNs no iOS e mensagens que abrem a tela certa."],
      es: ["Notificaciones push para Android e iOS.", "Firebase Cloud Messaging entrega notificaciones y mensajes de datos a los dispositivos, usando APNs en iOS.", "Notificaciones push en FanHub: tokens de los dispositivos, configuración de APNs en iOS y mensajes que abren la pantalla correcta."]
    },
    sentry: {
      en: ["Error and performance monitoring.", "A monitoring platform that captures errors, stack traces and performance data from apps and backends, with alerts and release tracking.", "Error tracking in Flutter apps: grouped issues by release, breadcrumbs to reproduce problems and alerts when a new version introduces failures."],
      "pt-BR": ["Monitoramento de erros e performance.", "Plataforma de monitoramento que captura erros, stack traces e dados de performance de apps e backends, com alertas e acompanhamento por versão.", "Rastreamento de erros em apps Flutter: problemas agrupados por versão, breadcrumbs para reproduzir falhas e alertas quando uma versão nova introduz erros."],
      es: ["Monitoreo de errores y rendimiento.", "Plataforma de monitoreo que captura errores, stack traces y datos de rendimiento de apps y backends, con alertas y seguimiento por versión.", "Seguimiento de errores en apps Flutter: problemas agrupados por versión, breadcrumbs para reproducir fallos y alertas cuando una versión nueva introduce errores."]
    },
    gemini: {
      en: ["Google's generative AI models via API.", "The Gemini API gives access to Google's multimodal models for text generation, analysis and structured output.", "Essay grading in Aprovaura: the text is sent from a backend function and comes back as an estimated score with feedback per ENEM competency."],
      "pt-BR": ["Modelos de IA generativa do Google via API.", "A API do Gemini dá acesso aos modelos multimodais do Google para geração de texto, análise e saída estruturada.", "Correção de redação no Aprovaura: o texto sai de uma função no backend e volta como nota estimada com devolutiva por competência do ENEM."],
      es: ["Modelos de IA generativa de Google vía API.", "La API de Gemini da acceso a los modelos multimodales de Google para generación de texto, análisis y salida estructurada.", "Corrección de redacción en Aprovaura: el texto sale de una función del backend y vuelve como nota estimada con devolución por competencia del ENEM."]
    },
    "app-store-connect": {
      en: ["Publishing and testing on the App Store.", "Apple's portal for app records, builds, TestFlight beta testing, review submissions and App Store releases.", "App Store releases of the Cooper Pay apps at Cooper Tec and of my own products, including TestFlight builds and review submissions."],
      "pt-BR": ["Publicação e testes na App Store.", "Portal da Apple para cadastro de apps, builds, testes beta no TestFlight, envio para revisão e publicação na App Store.", "Publicações na App Store dos apps Cooper Pay na Cooper Tec e dos meus produtos, incluindo builds no TestFlight e envios para revisão."],
      es: ["Publicación y pruebas en la App Store.", "Portal de Apple para el registro de apps, builds, pruebas beta en TestFlight, envío a revisión y publicación en la App Store.", "Publicaciones en la App Store de las apps Cooper Pay en Cooper Tec y de mis productos, incluidos builds en TestFlight y envíos a revisión."]
    },
    "google-play-console": {
      en: ["Publishing on Google Play.", "Google's console for app listings, release tracks (internal, closed, production), store policies and Android vitals.", "Google Play releases of the Cooper Pay apps at Cooper Tec and of my own products, from internal testing tracks to production."],
      "pt-BR": ["Publicação no Google Play.", "Console do Google para ficha dos apps, trilhas de lançamento (interna, fechada, produção), políticas da loja e Android vitals.", "Publicações no Google Play dos apps Cooper Pay na Cooper Tec e dos meus produtos, das trilhas de teste interno à produção."],
      es: ["Publicación en Google Play.", "Consola de Google para la ficha de las apps, pistas de lanzamiento (interna, cerrada, producción), políticas de la tienda y Android vitals.", "Publicaciones en Google Play de las apps Cooper Pay en Cooper Tec y de mis productos, de las pistas de prueba interna a producción."]
    },
    gitlab: {
      en: ["Git hosting with built-in CI/CD.", "A DevOps platform for Git repositories, merge requests, issues and pipelines.", "Repositories and code review at Saneago, in the development of internal systems and portals."],
      "pt-BR": ["Hospedagem Git com CI/CD integrado.", "Plataforma DevOps para repositórios Git, merge requests, issues e pipelines.", "Repositórios e revisão de código na Saneago, no desenvolvimento de sistemas internos e portais."],
      es: ["Alojamiento Git con CI/CD integrado.", "Plataforma DevOps para repositorios Git, merge requests, issues y pipelines.", "Repositorios y revisión de código en Saneago, en el desarrollo de sistemas internos y portales."]
    },
    scrum: {
      en: ["Agile delivery in short sprints.", "An agile framework with sprints, planning, daily stand-ups, reviews and retrospectives around a prioritized backlog.", "Day-to-day process of the mobile teams at Cooper Tec and Agrosmart: sprint planning, estimates, reviews and retrospectives."],
      "pt-BR": ["Entrega ágil em sprints curtas.", "Framework ágil com sprints, planejamento, dailies, reviews e retrospectivas em torno de um backlog priorizado.", "Processo do dia a dia dos times mobile na Cooper Tec e na Agrosmart: planejamento de sprint, estimativas, reviews e retrospectivas."],
      es: ["Entrega ágil en sprints cortos.", "Marco ágil con sprints, planificación, dailies, reviews y retrospectivas en torno a un backlog priorizado.", "Proceso diario de los equipos móviles en Cooper Tec y Agrosmart: planificación de sprint, estimaciones, reviews y retrospectivas."]
    },
    spring: {
      en: ["Java framework for enterprise applications.", "An application framework for Java with dependency injection, web MVC, data access and integration modules.", "Enterprise web systems and REST services at Memora, together with ZK, Maven and Tomcat."],
      "pt-BR": ["Framework Java para aplicações corporativas.", "Framework de aplicações para Java com injeção de dependência, web MVC, acesso a dados e módulos de integração.", "Sistemas web corporativos e serviços REST na Memora, junto com ZK, Maven e Tomcat."],
      es: ["Framework Java para aplicaciones empresariales.", "Framework de aplicaciones para Java con inyección de dependencias, web MVC, acceso a datos y módulos de integración.", "Sistemas web empresariales y servicios REST en Memora, junto con ZK, Maven y Tomcat."]
    },
    oracle: {
      en: ["Enterprise relational database.", "Oracle Database: a relational database widely used in corporate systems, with SQL and PL/SQL.", "Queries and maintenance of the enterprise systems at Memora, from development and testing to production."],
      "pt-BR": ["Banco de dados relacional corporativo.", "Oracle Database: banco relacional muito usado em sistemas corporativos, com SQL e PL/SQL.", "Consultas e manutenção dos sistemas corporativos na Memora, do desenvolvimento e testes à produção."],
      es: ["Base de datos relacional empresarial.", "Oracle Database: base de datos relacional muy usada en sistemas corporativos, con SQL y PL/SQL.", "Consultas y mantenimiento de los sistemas empresariales en Memora, del desarrollo y las pruebas a producción."]
    },
    mongodb: {
      en: ["Document database (NoSQL).", "A NoSQL database that stores JSON-like documents with flexible schemas, indexes and aggregation pipelines.", "Document modeling and queries for app backends: collections designed around how the screens read the data."],
      "pt-BR": ["Banco de documentos (NoSQL).", "Banco NoSQL que guarda documentos no formato JSON com esquema flexível, índices e pipelines de agregação.", "Modelagem de documentos e consultas para backends de apps: coleções desenhadas a partir de como as telas leem os dados."],
      es: ["Base de datos de documentos (NoSQL).", "Base de datos NoSQL que guarda documentos en formato JSON con esquema flexible, índices y pipelines de agregación.", "Modelado de documentos y consultas para backends de apps: colecciones diseñadas a partir de cómo las pantallas leen los datos."]
    }
  };
});
