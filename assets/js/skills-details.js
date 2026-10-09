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
    }
  };
});
