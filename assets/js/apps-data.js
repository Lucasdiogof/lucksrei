/* Lucksrei — dataset da página /apps.
 *
 * Para adicionar ou editar um app, mexa só aqui.
 *
 * Campos (todos opcionais, exceto id, name e group):
 *   id          slug único; o logo padrão é /assets/img/apps/<id>.webp
 *   name        nome exibido
 *   subtitle    contexto/empresa. String (nome próprio) ou { en, 'pt-BR', es }
 *   subtitleKey chave i18n alternativa ao subtitle (ex.: 'apps.ecosystem')
 *   group       'own' (meus produtos) | 'professional' | 'cooper'
 *   sector      id do setor (fintech, insurtech, agtech, govtech, retailtech, mobility, management, education, health, sports, games, banking) → apps.sector.<id>
 *   logo        caminho do logo; null = placeholder com iniciais.
 *               Para trocar o fallback: salve o arquivo em assets/img/apps/<id>.webp
 *               (128x128) e escreva aqui '/assets/img/apps/<id>.webp'.
 *               Os PNGs originais ficam em assets/img/apps/src/ (não publicados).
 *   platforms   ['android', 'ios', 'web']; plataforma com URL vira botão de loja
 *   androidUrl  URL do Google Play (null = sem botão)
 *   iosUrl      URL da App Store (null = sem botão)
 *   downloads   texto, ex.: '1M+'   (null = não exibe)
 *   rating      número, ex.: 4.4    (null = não exibe)
 *   reviewCount número, ex.: 72600  (null = não exibe)
 *   private     true = "Projeto privado" quando não há loja
 *   period      'AAAA[-MM]/AAAA[-MM]' ou '/present'; formatado por idioma com Intl
 *   technologies lista de tecnologias
 *   caseUrl     página de case study no site (só produtos próprios)
 *
 * Nenhum número de downloads/avaliação foi confirmado até aqui: tudo null.
 *
 * TOTAIS ESPERADOS (conferidos por tests/apps-data.test.js e no console da página):
 *   own 5 + professional 9 + cooper 20 = 34.
 */
(function () {
  "use strict";

  function cooper(id, name, subtitle, stores) {
    stores = stores || {};
    return {
      id: id, name: name, subtitle: subtitle || null, subtitleKey: subtitle ? null : 'apps.ecosystem', group: 'cooper',
      sector: 'banking', logo: '/assets/img/apps/' + id + '.webp', platforms: (stores.android ? ['android'] : []).concat(stores.ios ? ['ios'] : []),
      androidUrl: stores.android || null, iosUrl: stores.ios || null, downloads: null, rating: null, reviewCount: null
    };
  }

  window.LUCKSREI_APPS = {
    expected: { own: 5, professional: 9, cooper: 20, total: 34 },
    featured: ['fan-hub', 'toro', 'iza', 'aprovaura', 'cooper-pay'],
    // textos dos grupos: apps.filter.<id>, apps.group.<id>.title|intro (assets/i18n)
    groups: [{ id: 'own' }, { id: 'professional' }, { id: 'cooper' }],

    apps: [
      /* ---- meus produtos ---- */
      { id: 'fan-hub', name: 'Goiás App', subtitle: { en: 'Goiás fan app', 'pt-BR': 'App do torcedor do Goiás', es: 'App de la hinchada del Goiás' }, group: 'own', sector: 'sports',
        logo: '/assets/img/apps/fan-hub.webp', platforms: ['android', 'ios', 'web'], androidUrl: null, iosUrl: null,
        downloads: null, rating: null, reviewCount: null, technologies: ['Flutter', 'Supabase'], caseUrl: '/projects/fan-hub/' },
      { id: 'match-queue', name: 'Match Queue', subtitle: { en: 'Matchmaking for competitive teams', 'pt-BR': 'Matchmaking para times competitivos', es: 'Matchmaking para equipos competitivos' }, group: 'own', sector: 'games',
        logo: '/assets/img/apps/match-queue.webp', platforms: ['android', 'ios', 'web'], androidUrl: null, iosUrl: 'https://apps.apple.com/br/app/match-queue/id6810790338',
        downloads: null, rating: null, reviewCount: null, technologies: ['Flutter', 'Supabase'], caseUrl: '/projects/match-queue/' },
      { id: 'aprovaura', name: 'Aprovaura', subtitle: { en: 'Study for entrance exams and tests', 'pt-BR': 'Estudo para vestibulares e provas', es: 'Estudio para exámenes de ingreso y pruebas' }, group: 'own', sector: 'education',
        logo: '/assets/img/apps/aprovaura.webp', platforms: ['android', 'ios', 'web'], androidUrl: null, iosUrl: 'https://apps.apple.com/br/app/aprovaura/id6817047910',
        downloads: null, rating: null, reviewCount: null, technologies: ['Flutter', 'Supabase', 'IA'], caseUrl: '/projects/aura/' },
      { id: 'la-pelve', name: 'La Pelve', subtitle: { en: 'Clinical management for pelvic physiotherapy', 'pt-BR': 'Gestão clínica para fisioterapia pélvica', es: 'Gestión clínica para fisioterapia pélvica' }, group: 'own', sector: 'health',
        logo: '/assets/img/apps/la-pelve.webp', platforms: ['android', 'ios', 'web'], androidUrl: null, iosUrl: 'https://apps.apple.com/br/app/la-pelve/id6811234099',
        downloads: null, rating: null, reviewCount: null, technologies: ['Flutter', 'Supabase'], caseUrl: '/projects/la-pelve/' },
      { id: 'busaogyn', name: 'BusãoGyn', subtitle: { en: 'Bus arrivals and live tracking in Goiânia', 'pt-BR': 'Chegadas e ônibus ao vivo em Goiânia', es: 'Llegadas y autobuses en vivo en Goiânia' }, group: 'own', sector: 'mobility',
        logo: '/assets/img/apps/busaogyn.webp', platforms: ['android', 'ios', 'web'], androidUrl: null, iosUrl: null,
        downloads: null, rating: null, reviewCount: null, technologies: ['Flutter', 'Cloudflare Workers', 'MapLibre'] },

      /* ---- profissionais ---- */
      { id: 'toro', name: 'Toro Investimentos', subtitle: { en: 'Now Santander Corretora', 'pt-BR': 'Atualmente Santander Corretora', es: 'Actualmente Santander Corretora' }, group: 'professional', sector: 'fintech',
        logo: '/assets/img/apps/toro-investimentos.webp', platforms: ['android', 'ios'],
        androidUrl: 'https://play.google.com/store/apps/details?id=br.com.toroinvestimentos&hl=pt_BR',
        iosUrl: 'https://apps.apple.com/br/app/santander-corretora-taxa-0/id1490105579',
        downloads: null, rating: null, reviewCount: null, period: '2021-05/2021-12' },
      { id: 'iza', name: 'IZA Seguradora', subtitle: { en: 'Insurance', 'pt-BR': 'Seguros', es: 'Seguros' }, group: 'professional', sector: 'insurtech',
        logo: '/assets/img/apps/iza.webp', platforms: ['android', 'ios'],
        androidUrl: 'https://play.google.com/store/apps/details?id=vc.com.iza.izaapp&hl=pt_BR',
        iosUrl: 'https://apps.apple.com/br/app/iza-seguradora-s-a/id1526181722',
        downloads: null, rating: null, reviewCount: null, period: '2020-10/2021-03', technologies: ['Flutter', 'Firebase'] },
      { id: 'tabela-fone', name: 'Tabela Fone', subtitle: { en: 'Price intelligence for used phone retailers', 'pt-BR': 'Inteligência de preços para lojistas de celulares usados', es: 'Inteligencia de precios para tiendas de celulares usados' }, group: 'professional', sector: 'retailtech',
        logo: '/assets/img/apps/tabela-fone.webp', platforms: ['android', 'ios'],
        androidUrl: 'https://play.google.com/store/apps/details?id=com.tabelafone.app&hl=pt_BR',
        iosUrl: 'https://apps.apple.com/br/app/tabela-fone/id6781041082',
        downloads: null, rating: null, reviewCount: null, period: '2026-03/2026-09', technologies: ['Flutter', 'Supabase', 'Cubit/BLoC'] },
      { id: 'boosteragro', name: 'BoosterAGRO', subtitle: { en: 'Digital agriculture', 'pt-BR': 'Agricultura digital', es: 'Agricultura digital' }, group: 'professional', sector: 'agtech',
        logo: '/assets/img/apps/boosteragro.webp', platforms: ['android', 'ios'],
        androidUrl: 'https://play.google.com/store/apps/details?id=com.boosteragtech.boosteragro&hl=pt_BR',
        iosUrl: 'https://apps.apple.com/br/app/boosteragro/id1268230658',
        downloads: null, rating: null, reviewCount: null, period: '2022-01/2023-06', technologies: ['Flutter', 'Cubit/BLoC', 'Offline-first'] },
      { id: 'agrosmart', name: 'Agrosmart', subtitle: { en: 'Now BoosterPRO · climate intelligence', 'pt-BR': 'Atualmente BoosterPRO · inteligência climática', es: 'Actualmente BoosterPRO · inteligencia climática' }, group: 'professional', sector: 'agtech',
        logo: '/assets/img/apps/agrosmart.webp', platforms: ['android', 'ios'],
        androidUrl: 'https://play.google.com/store/apps/details?id=br.com.agrosmart.app_agrosmart&hl=pt_BR',
        iosUrl: 'https://apps.apple.com/br/app/boosterpro/id1539190452',
        downloads: null, rating: null, reviewCount: null, period: '2022-01/2023-06', technologies: ['Flutter', 'Cubit/BLoC', 'Offline-first'] },
      { id: 'emater-go-mobi', name: 'EMATER-GO Mobi', subtitle: { en: 'Rural technicians and producers', 'pt-BR': 'Técnicos e produtores rurais', es: 'Técnicos y productores rurales' }, group: 'professional', sector: 'govtech',
        logo: '/assets/img/apps/emater-go-mobi.webp', platforms: ['android', 'ios'],
        androidUrl: 'https://play.google.com/store/apps/details?id=br.gov.go.emater_mob_tecnico&hl=en_US',
        iosUrl: 'https://apps.apple.com/br/app/emater-go-mobi/id1525305265',
        downloads: null, rating: null, reviewCount: null, period: '2020-04/2020-07', technologies: ['Flutter', 'ObjectDB', 'REST API'] },
      { id: 'agr-fiscal', name: 'AGR Fiscal', subtitle: { en: 'Regulatory agency inspectors', 'pt-BR': 'Fiscais de agência reguladora', es: 'Fiscales de agencia reguladora' }, group: 'professional', sector: 'govtech',
        logo: '/assets/img/apps/agr-fiscal.webp', platforms: ['android'],
        androidUrl: 'https://play.google.com/store/apps/details?id=tests.com.example.aplicativo_fiscalizacao1&hl=en_US', /* na loja como "AGR-F"; o id sem o 1 final dá 404 */
        iosUrl: null, downloads: null, rating: null, reviewCount: null, period: '2019-09/2019-10', technologies: ['Flutter', 'ObjectDB', 'REST API'] },
      { id: 'vai', name: 'Vai', subtitle: { en: 'Private urban mobility platform', 'pt-BR': 'Plataforma privada de mobilidade urbana', es: 'Plataforma privada de movilidad urbana' }, group: 'professional', sector: 'mobility',
        logo: '/assets/img/apps/vai.webp', platforms: [], androidUrl: null, iosUrl: null, downloads: null, rating: null, reviewCount: null,
        private: true, period: '2019-02/2019-08', technologies: ['Flutter', 'Firebase RTDB'] },
      { id: 'gpol', name: 'GPOL', subtitle: { en: 'Online political career management', 'pt-BR': 'Gestão online de carreira política', es: 'Gestión en línea de carrera política' }, group: 'professional', sector: 'management',
        logo: '/assets/img/apps/gpol.webp', platforms: [], androidUrl: null, iosUrl: null, downloads: null, rating: null, reviewCount: null,
        private: true, period: '2019-01/2019-03', technologies: ['Flutter', 'Firestore'] },

      /* ---- ecossistema Cooper Pay (20) ---- */
      cooper('sol-cooper-pay', 'Sol Cooper Pay', null, { android: 'https://play.google.com/store/apps/details?id=br.com.cooper.sol', ios: 'https://apps.apple.com/br/app/sol-cooper-pay/id6502643583' }),
      cooper('bom-dia-cooper-pay', 'Bom Dia Cooper Pay', null, { android: 'https://play.google.com/store/apps/details?id=br.com.cooper.bomdiabank', ios: 'https://apps.apple.com/br/app/bom-dia-cooper-pay/id6740144337' }),
      cooper('gooroo-cooper-pay', 'Gooroo Cooper Pay', null, { android: 'https://play.google.com/store/apps/details?id=br.com.cooper.gooroo', ios: 'https://apps.apple.com/br/app/gooroopay/id6747404164' }),
      cooper('nova-plus-cooper-pay', 'Nova Plus Cooper Pay', null, { android: 'https://play.google.com/store/apps/details?id=br.com.cooper.novaplus', ios: 'https://apps.apple.com/br/app/nova-plus-cooper-pay/id6742997754' }),
      cooper('lillean-cooper-pay', 'Lillean Cooper Pay', null, { android: 'https://play.google.com/store/apps/details?id=br.com.cooper.lillean', ios: 'https://apps.apple.com/br/app/lillean-cooper-pay/id6761025752' }),
      cooper('cooper-pay', 'Cooper Pay', null, { android: 'https://play.google.com/store/apps/details?id=br.com.cooper.cooperbank', ios: 'https://apps.apple.com/br/app/cooper-pay/id1631192035' }),
      cooper('vitor-cooper-pay', 'Vitor Cooper Pay', null, { android: 'https://play.google.com/store/apps/details?id=br.com.cooper.vitor', ios: 'https://apps.apple.com/br/app/vitor-pay/id6755193485' }),
      cooper('brasita', 'Brasita', null, { android: 'https://play.google.com/store/apps/details?id=br.com.cooper.brasita', ios: 'https://apps.apple.com/br/app/brasita/id6757868339' }),
      cooper('paraiso-cooper-pay', 'Paraíso Cooper Pay', null, { android: 'https://play.google.com/store/apps/details?id=br.com.cooper.paraiso', ios: 'https://apps.apple.com/br/app/para%C3%ADso-cooper-pay/id6670398082' }),
      cooper('unicive-cooper-pay', 'Unicive Cooper Pay', null, { android: 'https://play.google.com/store/apps/details?id=br.com.cooper.unicv', ios: 'https://apps.apple.com/br/app/unicv-pay/id6748837977' }),
      cooper('seralle-cooper-pay', 'Serallê Cooper Pay', null, { android: 'https://play.google.com/store/apps/details?id=br.com.cooper.seralle', ios: 'https://apps.apple.com/br/app/serall%C3%AA-cooper-pay/id6741502111' }),
      cooper('amigao-cooper-pay', 'Amigão Cooper Pay', 'Conta Digital Amigão', { android: 'https://play.google.com/store/apps/details?id=br.com.cooper.amigao', ios: 'https://apps.apple.com/br/app/conta-digital-amig%C3%A3o/id6499366730' }),
      cooper('aqui-agora-cooper-pay', 'Aqui Agora Cooper Pay', null, { android: 'https://play.google.com/store/apps/details?id=br.com.cooper.aquiagora', ios: 'https://apps.apple.com/br/app/aqui-agora-cooper-pay/id6535696411' }),
      cooper('calceleve-cooper-pay', 'Calceleve Cooper Pay', null, { android: 'https://play.google.com/store/apps/details?id=br.com.cooper.calceleve', ios: 'https://apps.apple.com/br/app/calceleve-cooper-pay/id6476935583' }),
      cooper('stock-cooper-pay', 'Stock Cooper Pay', null, { android: 'https://play.google.com/store/apps/details?id=br.com.cooper.stock', ios: 'https://apps.apple.com/br/app/stock-cooper-pay/id6738746943' }),
      cooper('cooper-corporate', 'Cooper Corporate', null, { android: 'https://play.google.com/store/apps/details?id=br.com.cooper.corporate', ios: 'https://apps.apple.com/br/app/cooper-corporate/id6720764079' }),
      cooper('medprev-cooper-pay', 'Medprev Cooper Pay', null, { android: 'https://play.google.com/store/apps/details?id=br.com.cooper.medprev', ios: 'https://apps.apple.com/br/app/medprev-pay/id6737420094' }),
      cooper('cooper-multi', 'Cooper Multi', null, { android: 'https://play.google.com/store/apps/details?id=br.com.cooper.multi', ios: 'https://apps.apple.com/br/app/cooper-multi/id6757078607' }),
      cooper('appeldorn-cooper-pay', 'Appeldorn Cooper Pay', null, { android: 'https://play.google.com/store/apps/details?id=br.com.cooper.appeldorn', ios: 'https://apps.apple.com/br/app/appeldorn-cooper-pay/id6767218369' }),
      cooper('cooper-beneficios', 'Cooper Benefícios')
    ]
  };
})();
