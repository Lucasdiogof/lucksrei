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
    "go-router": {
      en: ["Declarative routing for Flutter.","Defines nested routes, URL parameters, redirections and deep-link navigation using Flutter Router APIs.","Declarative navigation in Tabela Fone, Match Queue, Goiás App, La Pelve, Aprovaura and StockPort."],
      "pt-BR": ["Navegação declarativa no Flutter.","Define rotas aninhadas, parâmetros, redirecionamentos e deep links com as APIs Router do Flutter.","Navegação declarativa no Tabela Fone, Match Queue, Goiás App, La Pelve, Aprovaura e StockPort."],
      es: ["Navegación declarativa en Flutter.","Define rutas anidadas, parámetros, redirecciones y enlaces profundos con las API Router de Flutter.","Navegación declarativa en Tabela Fone, Match Queue, Goiás App, La Pelve, Aprovaura y StockPort."]
    },
    "freezed": {
      en: ["Immutable models and unions in Dart.","Generates copyWith, equality, serialization helpers and sealed union-style data models for Dart applications.","Used for models and state handling in Tabela Fone."],
      "pt-BR": ["Modelos imutáveis e uniões em Dart.","Gera copyWith, igualdade, auxiliares de serialização e modelos com variantes tipadas para aplicações Dart.","Utilizado para modelos e estados no Tabela Fone."],
      es: ["Modelos inmutables y uniones en Dart.","Genera copyWith, igualdad, serialización y modelos con variantes tipadas para aplicaciones Dart.","Utilizado para modelos y estados en Tabela Fone."]
    },
    "getx": {
      en: ["Flutter state and navigation toolkit.","Provides reactive state, dependency management and navigation utilities for Flutter applications.","Part of the IZA Seguradora mobile stack."],
      "pt-BR": ["Estado e navegação para Flutter.","Disponibiliza estado reativo, gestão de dependências e utilitários de navegação no Flutter.","Integra a stack mobile da IZA Seguradora."],
      es: ["Estado y navegación para Flutter.","Proporciona estado reactivo, gestión de dependencias y utilidades de navegación en Flutter.","Forma parte del stack móvil de IZA Seguradora."]
    },
    "modular-packages": {
      en: ["Shared modules with clear boundaries.","Organizes features into reusable packages with explicit dependencies and independent responsibilities.","Used in the modular Flutter architecture at Toro Investimentos."],
      "pt-BR": ["Módulos reutilizáveis e desacoplados.","Organiza funcionalidades em pacotes reutilizáveis, com dependências explícitas e responsabilidades próprias.","Utilizado na arquitetura Flutter modular da Toro Investimentos."],
      es: ["Módulos reutilizables y desacoplados.","Organiza funciones en paquetes reutilizables con dependencias explícitas y responsabilidades definidas.","Utilizado en la arquitectura Flutter modular de Toro Investimentos."]
    },
    "micro-frontends": {
      en: ["Composable frontend applications.","Splits interface capabilities into smaller independently maintained modules integrated into a common application.","Part of the Agrosmart and BoosterAGRO mobile architecture."],
      "pt-BR": ["Interfaces compostas por módulos.","Divide funcionalidades visuais em módulos menores, mantidos separadamente e integrados numa aplicação.","Presente na arquitetura mobile da Agrosmart e do BoosterAGRO."],
      es: ["Interfaces compuestas por módulos.","Divide funcionalidades visuales en módulos más pequeños que se integran en una aplicación común.","Presente en la arquitectura móvil de Agrosmart y BoosterAGRO."]
    },
    "graphql": {
      en: ["Typed API queries and mutations.","Clients request precisely selected fields through schemas, queries, mutations and subscriptions.","Used for data communication at Toro Investimentos."],
      "pt-BR": ["Consultas e mutações tipadas em APIs.","Clientes selecionam os campos necessários por meio de esquemas, consultas, mutações e assinaturas.","Utilizado na comunicação de dados da Toro Investimentos."],
      es: ["Consultas y mutaciones tipadas en API.","Los clientes seleccionan campos mediante esquemas, consultas, mutaciones y suscripciones.","Utilizado para comunicación de datos en Toro Investimentos."]
    },
    "offline-first": {
      en: ["Useful flows even without connectivity.","Designs local reads, queued changes and recovery after reconnecting instead of treating network loss as a blank screen.","Applied to offline workflows in La Pelve and the Agrosmart ecosystem."],
      "pt-BR": ["Fluxos úteis mesmo sem conexão.","Projeta leituras locais, operações pendentes e recuperação após reconexão, sem tornar o app inútil offline.","Aplicado a fluxos offline do La Pelve e do ecossistema Agrosmart."],
      es: ["Funciones útiles incluso sin conexión.","Diseña lecturas locales, cambios pendientes y recuperación tras reconectarse sin vaciar la aplicación.","Aplicado a flujos offline de La Pelve y el ecosistema Agrosmart."]
    },
    "sqlite": {
      en: ["Embedded relational database for devices.","Persists structured data locally with transactions, indexes and queries, including encrypted local storage when configured.","Used for local persistence in La Pelve and IZA Seguradora."],
      "pt-BR": ["Banco relacional embarcado no dispositivo.","Persiste dados estruturados localmente com transações, índices e consultas; admite criptografia quando configurada.","Utilizado na persistência local do La Pelve e da IZA Seguradora."],
      es: ["Base de datos relacional integrada en dispositivos.","Guarda datos estructurados localmente con transacciones, índices y consultas; admite cifrado configurado.","Utilizado para persistencia local en La Pelve e IZA Seguradora."]
    },
    "firebase-auth": {
      en: ["Identity and login with Firebase.","Provides user sign-in, identity tokens and authentication state across client applications.","Used in the Vai and GPOL mobile applications."],
      "pt-BR": ["Identidade e login com Firebase.","Fornece autenticação, tokens de identidade e estado de sessão para aplicações cliente.","Utilizado nos aplicativos Vai e GPOL."],
      es: ["Identidad e inicio de sesión con Firebase.","Proporciona autenticación, tokens de identidad y estado de sesión para aplicaciones cliente.","Utilizado en las aplicaciones Vai y GPOL."]
    },
    "firestore": {
      en: ["Cloud document database for applications.","Stores indexed documents and collections with real-time listeners and offline client capabilities.","Used as the database in GPOL."],
      "pt-BR": ["Banco de documentos na nuvem.","Armazena documentos e coleções indexadas com listeners em tempo real e recursos offline no cliente.","Utilizado como banco de dados do GPOL."],
      es: ["Base de documentos en la nube.","Almacena documentos y colecciones indexadas con eventos en tiempo real y capacidades sin conexión.","Utilizado como base de datos en GPOL."]
    },
    "firebase-rtdb": {
      en: ["Live synchronization with Firebase RTDB.","A cloud-hosted JSON tree synchronizes subscribed clients when data changes.","Used for real-time data in the Vai mobility platform."],
      "pt-BR": ["Sincronização ao vivo com Firebase RTDB.","Banco de dados em árvore JSON sincroniza clientes conectados conforme os dados mudam.","Utilizado para dados em tempo real na plataforma de mobilidade Vai."],
      es: ["Sincronización en vivo con Firebase RTDB.","Base de datos en árbol JSON sincroniza clientes conectados cuando los datos cambian.","Utilizado para datos en tiempo real en la plataforma Vai."]
    },
    "in-app-purchases": {
      en: ["Digital purchases within mobile apps.","Integrates store-managed purchase flows, products and entitlements under Apple and Google billing requirements.","Used for paid features in Tabela Fone."],
      "pt-BR": ["Compras digitais dentro de aplicativos.","Integra fluxos de compra, produtos e direitos de acesso gerenciados pelas lojas Apple e Google.","Utilizado nos recursos pagos do Tabela Fone."],
      es: ["Compras digitales dentro de aplicaciones.","Integra compras, productos y derechos de acceso administrados por las tiendas de Apple y Google.","Utilizado para funciones de pago en Tabela Fone."]
    },
    "onesignal": {
      en: ["Push notification and engagement platform.","Delivers messages and notifications to mobile audiences through an external messaging service.","Used in Toro Investimentos and the Agrosmart ecosystem."],
      "pt-BR": ["Plataforma de notificações e comunicação.","Entrega notificações e mensagens ao público mobile por meio de um serviço de comunicação.","Utilizada na Toro Investimentos e no ecossistema Agrosmart."],
      es: ["Plataforma de notificaciones y comunicación.","Entrega notificaciones y mensajes a usuarios móviles mediante un servicio externo.","Utilizada en Toro Investimentos y el ecosistema Agrosmart."]
    },
    "whatsapp-api": {
      en: ["Business messaging integrations.","Connects business workflows to WhatsApp messaging APIs through authenticated backend operations.","Used for clinic notification and communication workflows in La Pelve."],
      "pt-BR": ["Integrações de mensagens empresariais.","Conecta fluxos de negócio às APIs de mensagens do WhatsApp por operações autenticadas no backend.","Utilizada nas rotinas de comunicação e notificações do La Pelve."],
      es: ["Integraciones de mensajería empresarial.","Conecta procesos del negocio con API de WhatsApp mediante operaciones autenticadas de backend.","Utilizada para comunicaciones y notificaciones de La Pelve."]
    },
    "zendesk": {
      en: ["Customer support platform integration.","Connects application support experiences with service requests and customer assistance tooling.","Part of the IZA Seguradora mobile integration stack."],
      "pt-BR": ["Integração com plataforma de suporte.","Conecta experiências de atendimento do aplicativo a ferramentas de solicitações e assistência ao cliente.","Presente nas integrações mobile da IZA Seguradora."],
      es: ["Integración con plataforma de soporte.","Conecta la atención en la aplicación con herramientas de solicitudes y asistencia al cliente.","Presente en las integraciones móviles de IZA Seguradora."]
    },
    "facebook-login": {
      en: ["Third-party identity provider sign-in.","Allows users to authenticate through a Facebook account using an OAuth-based login integration.","Used among the sign-in options in IZA Seguradora."],
      "pt-BR": ["Login com provedor externo de identidade.","Permite autenticação pela conta Facebook por integração de login baseada em OAuth.","Utilizado entre as opções de login da IZA Seguradora."],
      es: ["Inicio de sesión con proveedor externo.","Permite autenticación mediante una cuenta de Facebook con integración de inicio de sesión OAuth.","Utilizado entre las opciones de acceso de IZA Seguradora."]
    },
    "ml-kit": {
      en: ["On-device machine learning for mobile.","Google's mobile SDK processes tasks such as text recognition and translation on supported devices.","On-device translation in OrbiJob and OCR for labels and menus in Bebômetro."],
      "pt-BR": ["Aprendizado de máquina no próprio aparelho.","SDK mobile do Google para tarefas como reconhecimento de texto e tradução local em aparelhos compatíveis.","Tradução local no OrbiJob e OCR para rótulos e cardápios no Bebômetro."],
      es: ["Aprendizaje automático en el dispositivo.","SDK móvil de Google para tareas como reconocimiento de texto y traducción local en dispositivos compatibles.","Traducción local en OrbiJob y OCR de etiquetas y menús en Bebômetro."]
    },
    "google-maps": {
      en: ["Maps, places and location search.","Combines map visualization, geographic APIs and place discovery for location-aware application features.","Google Maps in EMATER-GO Mobi and GPOL, and Maps plus Places in Vai."],
      "pt-BR": ["Mapas, lugares e busca geográfica.","Combina visualização de mapas, APIs geográficas e descoberta de locais em funcionalidades de localização.","Google Maps no EMATER-GO Mobi e GPOL, e Maps mais Places no Vai."],
      es: ["Mapas, lugares y búsqueda geográfica.","Combina visualización de mapas, API geográficas y búsqueda de lugares para funciones basadas en ubicación.","Google Maps en EMATER-GO Mobi y GPOL, y Maps más Places en Vai."]
    },
    "mapbox": {
      en: ["Custom maps and geospatial visualization.","Provides map rendering, styles and geospatial interactions for location-rich applications.","Used in the Agrosmart and BoosterAGRO mobile products."],
      "pt-BR": ["Mapas customizados e visualização geográfica.","Fornece renderização, estilos e interações geoespaciais para aplicações orientadas a localização.","Utilizado nos produtos mobile Agrosmart e BoosterAGRO."],
      es: ["Mapas personalizados y visualización geográfica.","Proporciona mapas, estilos e interacciones geoespaciales para aplicaciones basadas en ubicación.","Utilizado en los productos móviles Agrosmart y BoosterAGRO."]
    },
    "maplibre": {
      en: ["Open-source vector map rendering.","Displays interactive vector maps with customizable styles and geographic overlays.","Used for maps and bus positioning in BusãoGyn."],
      "pt-BR": ["Renderização open source de mapas vetoriais.","Exibe mapas interativos com estilos personalizáveis e camadas geográficas.","Utilizado nos mapas e na posição dos ônibus do BusãoGyn."],
      es: ["Renderizado open source de mapas vectoriales.","Muestra mapas interactivos con estilos personalizados y capas geográficas.","Utilizado en mapas y ubicación de autobuses de BusãoGyn."]
    },
    "pdf": {
      en: ["Generate printable application documents.","Creates structured reports, receipts and shareable documents with attention to typography and data integrity.","Printable reports and exports in AGR Fiscal, StockPort and Goiás App."],
      "pt-BR": ["Geração de documentos imprimíveis.","Cria relatórios, recibos e documentos compartilháveis com cuidado tipográfico e integridade de dados.","Relatórios e exportações para impressão no AGR Fiscal, StockPort e Goiás App."],
      es: ["Generación de documentos imprimibles.","Crea informes, recibos y documentos compartibles cuidando tipografía e integridad de datos.","Informes y exportaciones imprimibles en AGR Fiscal, StockPort y Goiás App."]
    },
    "webview": {
      en: ["Embedded browser experiences in mobile apps.","Renders external web pages inside the app while handling navigation, permissions and web session isolation.","Used for viewing job portals in OrbiJob."],
      "pt-BR": ["Navegação Web integrada ao aplicativo.","Renderiza sites dentro do app com controle de navegação, permissões e isolamento de sessões.","Utilizado para abrir portais de vagas no OrbiJob."],
      es: ["Navegación Web integrada en aplicaciones.","Renderiza sitios en la app con control de navegación, permisos y aislamiento de sesiones.","Utilizado para abrir portales de empleo en OrbiJob."]
    },
    "barcode-scanning": {
      en: ["Fast data capture with camera scanners.","Reads barcode values through camera integrations and supports manual input when scanning is unavailable.","Used to identify products in StockPort inventory and sales."],
      "pt-BR": ["Captura rápida de códigos de barras.","Lê códigos com a câmera e oferece digitação manual quando o scanner não está disponível.","Utilizado para identificar produtos no estoque e nas vendas do StockPort."],
      es: ["Captura rápida de códigos de barras.","Lee códigos mediante cámara y permite introducirlos manualmente cuando no hay escáner.","Utilizado para identificar productos y ventas en StockPort."]
    },
    "biometrics": {
      en: ["Biometric verification in mobile apps.","Uses operating-system biometric prompts to confirm access to protected actions and sensitive screens.","Biometric access at Toro Investimentos and local biometric checks in La Pelve."],
      "pt-BR": ["Verificação biométrica em aplicativos.","Usa os mecanismos biométricos do sistema para confirmar acesso a ações e telas protegidas.","Acesso biométrico na Toro Investimentos e verificações biométricas locais no La Pelve."],
      es: ["Verificación biométrica en aplicaciones.","Usa los mecanismos biométricos del sistema para confirmar el acceso a acciones y pantallas protegidas.","Acceso biométrico en Toro Investimentos y comprobaciones biométricas locales en La Pelve."]
    },
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
      en: ["State management with streams.","BLoC separates business logic from the UI using streams of events and states; Cubit is its simpler, method-driven variant.","BLoC/Cubit at Cooper Tec, Agrosmart and Toro, plus AGR Fiscal, Tabela Fone and current Flutter products."],
      "pt-BR": ["Gerenciamento de estado com streams.","O BLoC separa a lógica de negócio da UI usando fluxos de eventos e estados; o Cubit é a variante mais simples, baseada em métodos.","BLoC/Cubit na Cooper Tec, Agrosmart e Toro, além de AGR Fiscal, Tabela Fone e produtos Flutter atuais."],
      es: ["Gestión de estado con streams.","BLoC separa la lógica de negocio de la UI mediante flujos de eventos y estados; Cubit es su variante más simple, basada en métodos.","BLoC/Cubit en Cooper Tec, Agrosmart y Toro, además de AGR Fiscal, Tabela Fone y productos Flutter actuales."]
    },
    provider: {
      en: ["Dependency and state provider for Flutter.","A Flutter package that exposes values and state to the widget tree and rebuilds only the widgets that depend on them.","Used for Flutter presentation state and dependency exposure, including the EMATER-GO Mobi project."],
      "pt-BR": ["Provedor de dependências e estado para Flutter.","Pacote do Flutter que expõe valores e estado para a árvore de widgets e reconstrói apenas os widgets que dependem deles.","Utilizado no estado da apresentação Flutter e na exposição de dependências, incluindo o projeto EMATER-GO Mobi."],
      es: ["Proveedor de dependencias y estado para Flutter.","Paquete de Flutter que expone valores y estado al árbol de widgets y reconstruye solo los widgets que dependen de ellos.","Utilizado para estado de presentación Flutter y exposición de dependencias, incluido el proyecto EMATER-GO Mobi."]
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
      en: ["Unit and widget tests that guard releases.","Automated checks that verify behavior on every change, from unit tests of business rules to widget tests of the UI.","Regression suites in all eight current Flutter codebases, including OrbiJob, Bebômetro and StockPort."],
      "pt-BR": ["Testes unitários e de widget que protegem os releases.","Verificações automáticas que validam o comportamento a cada mudança, de testes unitários das regras de negócio a testes de widget da UI.","Suítes de regressão nos oito repositórios Flutter atuais, incluindo OrbiJob, Bebômetro e StockPort."],
      es: ["Pruebas unitarias y de widget que protegen los releases.","Verificaciones automáticas que validan el comportamiento en cada cambio, desde pruebas unitarias de reglas de negocio hasta pruebas de widget de la UI.","Suites de regresión en los ocho repositorios Flutter actuales, incluidos OrbiJob, Bebômetro y StockPort."]
    },
    "rest-api": {
      en: ["Talking to backends over HTTP.","An architectural style for web services that exposes resources over HTTP, usually exchanging JSON.","HTTP and JSON integrations with backend services, including public-sector mobile applications EMATER-GO Mobi and AGR Fiscal."],
      "pt-BR": ["Conversando com backends via HTTP.","Estilo arquitetural de serviços web que expõe recursos via HTTP, normalmente trocando JSON.","Integrações HTTP e JSON com serviços de backend, incluindo os aplicativos públicos EMATER-GO Mobi e AGR Fiscal."],
      es: ["Hablar con backends por HTTP.","Estilo arquitectónico de servicios web que expone recursos por HTTP, normalmente intercambiando JSON.","Integraciones HTTP y JSON con servicios de backend, incluidas las aplicaciones públicas EMATER-GO Mobi y AGR Fiscal."]
    },
    supabase: {
      en: ["Open-source backend on top of PostgreSQL.","A backend platform with a Postgres database, authentication, storage and real-time features.","Backend for Match Queue, Goiás App, La Pelve, Aprovaura, OrbiJob, Bebômetro, StockPort and Tabela Fone."],
      "pt-BR": ["Backend open source sobre PostgreSQL.","Plataforma de backend com banco Postgres, autenticação, storage e recursos em tempo real.","Backend de Match Queue, Goiás App, La Pelve, Aprovaura, OrbiJob, Bebômetro, StockPort e Tabela Fone."],
      es: ["Backend de código abierto sobre PostgreSQL.","Plataforma de backend con base de datos Postgres, autenticación, storage y funciones en tiempo real.","Backend de Match Queue, Goiás App, La Pelve, Aprovaura, OrbiJob, Bebômetro, StockPort y Tabela Fone."]
    },
    postgresql: {
      en: ["Relational database.","An open-source relational database known for reliability, SQL compliance and extensibility.","Relational storage underlying eight Supabase-based apps, including Tabela Fone, OrbiJob and StockPort."],
      "pt-BR": ["Banco de dados relacional.","Banco relacional open source conhecido por confiabilidade, aderência ao SQL e extensibilidade.","Banco relacional de oito apps baseados em Supabase, incluindo Tabela Fone, OrbiJob e StockPort."],
      es: ["Base de datos relacional.","Base de datos relacional de código abierto conocida por su fiabilidad, cumplimiento de SQL y extensibilidad.","Base de datos relacional de ocho apps con Supabase, incluidos Tabela Fone, OrbiJob y StockPort."]
    },
    firebase: {
      en: ["Google's backend services for apps.","A suite of managed services for apps, including Firestore and Realtime Database, authentication, messaging and crash reporting.","Firebase in IZA, Toro, Agrosmart, Vai and GPOL, plus messaging and diagnostics in recent mobile products."],
      "pt-BR": ["Serviços de backend do Google para apps.","Conjunto de serviços gerenciados para apps, incluindo Firestore e Realtime Database, autenticação, mensageria e relatório de falhas.","Firebase na IZA, Toro, Agrosmart, Vai e GPOL, além de mensagens e diagnósticos em produtos mobile recentes."],
      es: ["Servicios de backend de Google para apps.","Conjunto de servicios gestionados para apps, incluidos Firestore y Realtime Database, autenticación, mensajería y reporte de fallos.","Firebase en IZA, Toro, Agrosmart, Vai y GPOL, además de mensajería y diagnóstico en productos móviles recientes."]
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
      en: ["Workflows that run on every change.","GitHub's automation platform, used to run builds, tests and deployments from repository events.","Workflows in all eight current app repositories and professional Agrosmart projects."],
      "pt-BR": ["Workflows que rodam a cada mudança.","Plataforma de automação do GitHub, usada para rodar builds, testes e deploys a partir de eventos do repositório.","Workflows nos oito repositórios atuais de apps e nos projetos profissionais da Agrosmart."],
      es: ["Workflows que se ejecutan en cada cambio.","Plataforma de automatización de GitHub, usada para ejecutar builds, pruebas y despliegues a partir de eventos del repositorio.","Flujos en los ocho repositorios actuales de apps y los proyectos profesionales de Agrosmart."]
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
    sql: {
      en: ["The language of relational data.","The standard language for querying and modifying data in relational databases.","SQL migrations in Match Queue, Goiás App, La Pelve, OrbiJob, Bebômetro and StockPort."],
      "pt-BR": ["A linguagem dos dados relacionais.","Linguagem padrão para consultar e modificar dados em bancos relacionais.","Migrações SQL no Match Queue, Goiás App, La Pelve, OrbiJob, Bebômetro e StockPort."],
      es: ["El lenguaje de los datos relacionales.","Lenguaje estándar para consultar y modificar datos en bases de datos relacionales.","Migraciones SQL en Match Queue, Goiás App, La Pelve, OrbiJob, Bebômetro y StockPort."]
    },
    javascript: {
      en: ["The language of the web.", "The scripting language that runs in every browser, and on servers and edge runtimes.", "Used in web work such as this portfolio, which is plain HTML, CSS and JavaScript served by a Cloudflare Worker."],
      "pt-BR": ["A linguagem da web.", "A linguagem de script que roda em todo navegador, em servidores e em runtimes de borda.", "Usado em trabalhos web como este portfólio, feito em HTML, CSS e JavaScript puros e servido por um Cloudflare Worker."],
      es: ["El lenguaje de la web.", "El lenguaje de scripting que corre en todos los navegadores, en servidores y en runtimes de borde.", "Usado en trabajos web como este portafolio, hecho en HTML, CSS y JavaScript puros y servido por un Cloudflare Worker."]
    },
    typescript: {
      en: ["JavaScript with types.","A typed superset of JavaScript that compiles to plain JavaScript.","Typed server and edge code in Goiás App, BusãoGyn and OrbiJob, including API adapters and Cloudflare Workers."],
      "pt-BR": ["JavaScript com tipos.","Superconjunto tipado de JavaScript que compila para JavaScript puro.","Código tipado de servidor e edge no Goiás App, BusãoGyn e OrbiJob, incluindo adaptadores de API e Cloudflare Workers."],
      es: ["JavaScript con tipos.","Superconjunto tipado de JavaScript que compila a JavaScript puro.","Código tipado de servidor y edge en Goiás App, BusãoGyn y OrbiJob, incluidos adaptadores de API y Cloudflare Workers."]
    },
    react: {
      en: ["The library behind modern web UIs.", "A JavaScript library for building component-based user interfaces, with a declarative model close to Flutter widgets.", "Used in the Samara Rúbia website, built on React 19 with Next.js."],
      "pt-BR": ["A biblioteca por trás das UIs web modernas.", "Biblioteca JavaScript para construir interfaces baseadas em componentes, com modelo declarativo próximo aos widgets do Flutter.", "Usado no site da Samara Rúbia, feito com React 19 e Next.js."],
      es: ["La biblioteca detrás de las UIs web modernas.", "Biblioteca JavaScript para construir interfaces basadas en componentes, con un modelo declarativo cercano a los widgets de Flutter.", "Usado en el sitio de Samara Rúbia, hecho con React 19 y Next.js."]
    },
    nextjs: {
      en: ["React framework for fast web sites.", "A React framework with routing, server rendering and static export, producing sites that load fast and rank well.", "Static export for the Samara Rúbia website: three languages, accessibility tests and deploy through a Cloudflare Worker."],
      "pt-BR": ["Framework React para sites rápidos.", "Framework React com roteamento, renderização no servidor e exportação estática, que gera sites rápidos e bem posicionados.", "Exportação estática no site da Samara Rúbia: três idiomas, testes de acessibilidade e deploy por um Cloudflare Worker."],
      es: ["Framework de React para sitios rápidos.", "Framework de React con enrutamiento, renderizado en servidor y exportación estática, que genera sitios rápidos y bien posicionados.", "Exportación estática en el sitio de Samara Rúbia: tres idiomas, pruebas de accesibilidad y despliegue mediante un Cloudflare Worker."]
    },
    tailwind: {
      en: ["Utility-first CSS.", "A CSS framework where styles are composed from small utility classes, keeping a design system consistent without custom stylesheets.", "Styling of the Samara Rúbia website with Tailwind CSS 4 and design tokens, in light and dark themes."],
      "pt-BR": ["CSS orientado a utilitários.", "Framework CSS em que os estilos são compostos por pequenas classes utilitárias, mantendo o design system consistente sem folhas de estilo próprias.", "Estilização do site da Samara Rúbia com Tailwind CSS 4 e design tokens, nos temas claro e escuro."],
      es: ["CSS orientado a utilidades.", "Framework CSS en el que los estilos se componen con pequeñas clases utilitarias, manteniendo el design system consistente sin hojas de estilo propias.", "Estilos del sitio de Samara Rúbia con Tailwind CSS 4 y design tokens, en temas claro y oscuro."]
    },
    playwright: {
      en: ["End-to-end tests in real browsers.", "A tool that drives Chromium, Firefox and WebKit to test a site as a user would, including accessibility checks with axe.", "Automated tests of the Samara Rúbia website: navigation, languages, menu, links and accessibility on desktop and mobile."],
      "pt-BR": ["Testes ponta a ponta em navegadores reais.", "Ferramenta que controla Chromium, Firefox e WebKit para testar um site como um usuário faria, incluindo checagens de acessibilidade com axe.", "Testes automatizados do site da Samara Rúbia: navegação, idiomas, menu, links e acessibilidade em desktop e celular."],
      es: ["Pruebas de extremo a extremo en navegadores reales.", "Herramienta que controla Chromium, Firefox y WebKit para probar un sitio como lo haría un usuario, incluidas comprobaciones de accesibilidad con axe.", "Pruebas automatizadas del sitio de Samara Rúbia: navegación, idiomas, menú, enlaces y accesibilidad en escritorio y móvil."]
    },
    resend: {
      en: ["Transactional email by API.", "An email delivery service with a simple API and SMTP, used for account and invitation messages with a verified sending domain.", "Account activation and invite emails sent by the Edge Functions of StockPort System and Beard System."],
      "pt-BR": ["E-mail transacional por API.", "Serviço de envio de e-mail com API simples e SMTP, usado em mensagens de conta e convite com domínio de envio verificado.", "E-mails de ativação de conta e convite enviados pelas Edge Functions do StockPort System e do Beard System."],
      es: ["Correo transaccional por API.", "Servicio de envío de correo con API simple y SMTP, usado en mensajes de cuenta e invitación con dominio de envío verificado.", "Correos de activación de cuenta e invitación enviados por las Edge Functions de StockPort System y Beard System."]
    },
    "cloudflare-pages": {
      en: ["Static web hosting on the Cloudflare edge.", "Cloudflare hosting for static sites and web builds, deployed from the command line or CI and served from the edge.", "Web build and activation and invite pages of StockPort System, deployed with Wrangler."],
      "pt-BR": ["Hospedagem web estática na borda da Cloudflare.", "Hospedagem da Cloudflare para sites estáticos e builds web, publicada pela linha de comando ou CI e servida da borda.", "Build web e páginas de ativação e convite do StockPort System, publicados com o Wrangler."],
      es: ["Alojamiento web estático en el borde de Cloudflare.", "Alojamiento de Cloudflare para sitios estáticos y builds web, publicado por línea de comandos o CI y servido desde el borde.", "Build web y páginas de activación e invitación de StockPort System, publicados con Wrangler."]
    },
    "web-pwa": {
      en: ["Flutter apps that also run in the browser.","Flutter Web runs Dart in the browser. Installable PWA support requires extra app-specific configuration.","Web builds for Match Queue, Goiás App, La Pelve, Aprovaura, BusãoGyn, OrbiJob, Bebômetro and StockPort, at different release stages."],
      "pt-BR": ["Apps Flutter que também rodam no navegador.","Flutter Web executa Dart no navegador. A instalação como PWA exige configuração específica em cada aplicativo.","Builds Web de Match Queue, Goiás App, La Pelve, Aprovaura, BusãoGyn, OrbiJob, Bebômetro e StockPort, em diferentes fases de publicação."],
      es: ["Apps Flutter que también funcionan en el navegador.","Flutter Web ejecuta Dart en el navegador. La instalación como PWA exige configuración específica de cada aplicación.","Builds Web de Match Queue, Goiás App, La Pelve, Aprovaura, BusãoGyn, OrbiJob, Bebômetro y StockPort, en distintas etapas de publicación."]
    },
    "deep-links": {
      en: ["Links that open a specific screen of the app.","Android App Links and iOS Universal Links route a URL straight into the right screen, with a web fallback when the app is not installed.","Team invite links in Match Queue, app navigation in Tabela Fone and authentication callbacks in StockPort."],
      "pt-BR": ["Links que abrem uma tela específica do app.","Android App Links e iOS Universal Links levam uma URL direto para a tela certa, com a versão web como alternativa quando o app não está instalado.","Links de convite de equipe no Match Queue, navegação no Tabela Fone e callbacks de autenticação no StockPort."],
      es: ["Enlaces que abren una pantalla específica de la app.","Android App Links e iOS Universal Links llevan una URL directo a la pantalla correcta, con la versión web como alternativa cuando la app no está instalada.","Enlaces de invitación de equipos en Match Queue, navegación en Tabela Fone y retornos de autenticación en StockPort."]
    },
    i18n: {
      en: ["Apps in more than one language.","Internationalization prepares the code for several languages and localization delivers the translated texts, formats and content.","Localized Flutter interfaces in Aprovaura, BusãoGyn, OrbiJob, Bebômetro and StockPort."],
      "pt-BR": ["Apps em mais de um idioma.","Internacionalização prepara o código para vários idiomas e a localização entrega os textos, formatos e conteúdos traduzidos.","Interfaces Flutter localizadas no Aprovaura, BusãoGyn, OrbiJob, Bebômetro e StockPort."],
      es: ["Apps en más de un idioma.","La internacionalización prepara el código para varios idiomas y la localización entrega los textos, formatos y contenidos traducidos.","Interfaces Flutter localizadas en Aprovaura, BusãoGyn, OrbiJob, Bebômetro y StockPort."]
    },
    gps: {
      en: ["Device location in mobile apps.","Location services read the device position through GPS and the network, with runtime permissions on Android and iOS.","Location flows at Cooper Tec and in freelance work including AGR Fiscal and Vai, plus Bebômetro."],
      "pt-BR": ["Localização do aparelho em apps mobile.","Os serviços de localização leem a posição do aparelho por GPS e rede, com permissões em tempo de execução no Android e no iOS.","Localização na Cooper Tec e em projetos freelancer, incluindo AGR Fiscal e Vai, além do Bebômetro."],
      es: ["Ubicación del dispositivo en apps móviles.","Los servicios de ubicación leen la posición del dispositivo por GPS y red, con permisos en tiempo de ejecución en Android e iOS.","Ubicación en Cooper Tec y proyectos freelance, incluidos AGR Fiscal y Vai, además de Bebômetro."]
    },
    rls: {
      en: ["Access rules enforced by the database.","A PostgreSQL feature that filters rows per user with policies, so each user only reads and writes their own data, whatever the client sends.","PostgreSQL policies protect user and company data in Match Queue, La Pelve, OrbiJob, Bebômetro and StockPort, beyond checks in the UI."],
      "pt-BR": ["Regras de acesso aplicadas pelo banco.","Recurso do PostgreSQL que filtra linhas por usuário com políticas, para que cada um só leia e grave os próprios dados, independentemente do que o cliente envia.","Políticas do PostgreSQL protegem dados de usuários e empresas no Match Queue, La Pelve, OrbiJob, Bebômetro e StockPort, além das validações da interface."],
      es: ["Reglas de acceso aplicadas por la base de datos.","Función de PostgreSQL que filtra filas por usuario con políticas, para que cada uno solo lea y escriba sus propios datos, sin importar lo que envíe el cliente.","Las políticas de PostgreSQL protegen datos de usuarios y empresas en Match Queue, La Pelve, OrbiJob, Bebômetro y StockPort, además de la interfaz."]
    },
    "cloudflare-workers": {
      en: ["Serverless code at the edge.","Cloudflare's serverless platform runs JavaScript/TypeScript close to the user, with storage options such as KV and D1.","Web hosting and edge work for Match Queue, Goiás App, La Pelve, Aprovaura, BusãoGyn, OrbiJob and Bebômetro."],
      "pt-BR": ["Código serverless na borda.","Plataforma serverless da Cloudflare que roda JavaScript/TypeScript perto do usuário, com opções de armazenamento como KV e D1.","Hospedagem Web e serviços edge para Match Queue, Goiás App, La Pelve, Aprovaura, BusãoGyn, OrbiJob e Bebômetro."],
      es: ["Código serverless en el borde.","Plataforma serverless de Cloudflare que ejecuta JavaScript/TypeScript cerca del usuario, con opciones de almacenamiento como KV y D1.","Hospedaje Web y servicios edge para Match Queue, Goiás App, La Pelve, Aprovaura, BusãoGyn, OrbiJob y Bebômetro."]
    },
    crashlytics: {
      en: ["Crash reports from real users.","Firebase's crash reporting tool: groups crashes and errors with stack traces, device data and the affected app version.","Crashlytics in Match Queue dependencies, plus Toro Investimentos and the Agrosmart ecosystem."],
      "pt-BR": ["Relatórios de crash de usuários reais.","Ferramenta de relatórios de falhas do Firebase: agrupa crashes e erros com stack trace, dados do aparelho e a versão do app afetada.","Crashlytics nas dependências do Match Queue, além da Toro Investimentos e do ecossistema Agrosmart."],
      es: ["Informes de fallos de usuarios reales.","Herramienta de informes de fallos de Firebase: agrupa crashes y errores con stack trace, datos del dispositivo y la versión de la app afectada.","Crashlytics en dependencias de Match Queue, además de Toro Investimentos y el ecosistema Agrosmart."]
    },
    "remote-config": {
      en: ["App behavior changed without a new release.","Firebase service that delivers parameters to installed apps, used for feature flags, gradual rollouts and adjustments without going through the stores.","Remote settings in the IZA and Toro Investimentos mobile stacks."],
      "pt-BR": ["Comportamento do app alterado sem nova versão.","Serviço do Firebase que entrega parâmetros aos apps instalados, usado para feature flags, liberações graduais e ajustes sem passar pelas lojas.","Configurações remotas nas stacks mobile da IZA e da Toro Investimentos."],
      es: ["Comportamiento de la app cambiado sin nueva versión.","Servicio de Firebase que entrega parámetros a las apps instaladas, usado para feature flags, lanzamientos graduales y ajustes sin pasar por las tiendas.","Configuración remota en los stacks móviles de IZA y Toro Investimentos."]
    },
    "firebase-messaging": {
      en: ["Push notifications for Android and iOS.","Firebase Cloud Messaging delivers notifications and data messages to devices, using APNs on iOS.","Push integrations in Match Queue, Goiás App, OrbiJob, IZA Seguradora and GPOL."],
      "pt-BR": ["Notificações push para Android e iOS.","O Firebase Cloud Messaging entrega notificações e mensagens de dados aos aparelhos, usando o APNs no iOS.","Integrações de push no Match Queue, Goiás App, OrbiJob, IZA Seguradora e GPOL."],
      es: ["Notificaciones push para Android e iOS.","Firebase Cloud Messaging entrega notificaciones y mensajes de datos a los dispositivos, usando APNs en iOS.","Integraciones push en Match Queue, Goiás App, OrbiJob, IZA Seguradora y GPOL."]
    },
    sentry: {
      en: ["Error and performance monitoring.","A monitoring platform that captures errors, stack traces and performance data from apps and backends, with alerts and release tracking.","Monitoring at Toro Investimentos and a Sentry Flutter integration in Goiás App."],
      "pt-BR": ["Monitoramento de erros e performance.","Plataforma de monitoramento que captura erros, stack traces e dados de performance de apps e backends, com alertas e acompanhamento por versão.","Monitoramento na Toro Investimentos e integração Sentry Flutter no Goiás App."],
      es: ["Monitoreo de errores y rendimiento.","Plataforma de monitoreo que captura errores, stack traces y datos de rendimiento de apps y backends, con alertas y seguimiento por versión.","Monitoreo en Toro Investimentos e integración Sentry Flutter en Goiás App."]
    },
    gemini: {
      en: ["Google's generative AI models via API.", "The Gemini API gives access to Google's multimodal models for text generation, analysis and structured output.", "Essay grading in Aprovaura: the text is sent from a backend function and comes back as an estimated score with feedback per ENEM competency."],
      "pt-BR": ["Modelos de IA generativa do Google via API.", "A API do Gemini dá acesso aos modelos multimodais do Google para geração de texto, análise e saída estruturada.", "Correção de redação no Aprovaura: o texto sai de uma função no backend e volta como nota estimada com devolutiva por competência do ENEM."],
      es: ["Modelos de IA generativa de Google vía API.", "La API de Gemini da acceso a los modelos multimodales de Google para generación de texto, análisis y salida estructurada.", "Corrección de redacción en Aprovaura: el texto sale de una función del backend y vuelve como nota estimada con devolución por competencia del ENEM."]
    },
    "app-store-connect": {
      en: ["Publishing and testing on the App Store.","Apple's portal for app records, builds, TestFlight beta testing, review submissions and App Store releases.","Store releases of Cooper Pay products, Match Queue, La Pelve and Aprovaura, excluding apps not yet published."],
      "pt-BR": ["Publicação e testes na App Store.","Portal da Apple para cadastro de apps, builds, testes beta no TestFlight, envio para revisão e publicação na App Store.","Publicações de Cooper Pay, Match Queue, La Pelve e Aprovaura, sem contar apps ainda não lançados."],
      es: ["Publicación y pruebas en la App Store.","Portal de Apple para el registro de apps, builds, pruebas beta en TestFlight, envío a revisión y publicación en la App Store.","Publicaciones de Cooper Pay, Match Queue, La Pelve y Aprovaura, sin contar apps todavía sin lanzar."]
    },
    "google-play-console": {
      en: ["Publishing on Google Play.","Google's console for app listings, release tracks (internal, closed, production), store policies and Android vitals.","Play Console releases of Cooper Pay apps at Cooper Tec; preparing a listing is not a published release."],
      "pt-BR": ["Publicação no Google Play.","Console do Google para ficha dos apps, trilhas de lançamento (interna, fechada, produção), políticas da loja e Android vitals.","Publicações de apps Cooper Pay no Play Console pela Cooper Tec; preparar a ficha não significa lançar."],
      es: ["Publicación en Google Play.","Consola de Google para la ficha de las apps, pistas de lanzamiento (interna, cerrada, producción), políticas de la tienda y Android vitals.","Publicaciones de apps Cooper Pay en Play Console con Cooper Tec; preparar la ficha no equivale a publicar."]
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
    "get-it": {
      en: ["Service locator for Dart and Flutter.","A simple service locator that registers dependencies once and resolves them anywhere, including singletons, lazy singletons and factories.","Dependency wiring with get_it in seven Flutter apps, including OrbiJob, Bebômetro and StockPort."],
      "pt-BR": ["Service locator para Dart e Flutter.","Service locator simples que registra as dependências uma vez e as resolve em qualquer ponto, com singletons, lazy singletons e factories.","Injeção de dependências com get_it em sete apps Flutter, incluindo OrbiJob, Bebômetro e StockPort."],
      es: ["Service locator para Dart y Flutter.","Service locator simple que registra las dependencias una vez y las resuelve en cualquier punto, con singletons, lazy singletons y factories.","Inyección de dependencias con get_it en siete apps Flutter, incluidos OrbiJob, Bebômetro y StockPort."]
    }
  };
});
