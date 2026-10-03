/* Lucksrei — dataset da página /apps.
 *
 * Para adicionar ou editar um app, mexa só aqui.
 *
 * Campos (todos opcionais, exceto id, name e group):
 *   id          slug único; o logo padrão é /assets/img/apps/<id>.webp
 *   name        nome exibido
 *   subtitle    contexto/empresa (ex.: "Hoje Santander Corretora")
 *   group       'own' (meus produtos) | 'professional' | 'cooper'
 *   sector      setor discreto exibido no canto do card
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
 *   period      período de atuação, texto
 *   technologies lista de tecnologias
 *   caseUrl     página de case study no site (só produtos próprios)
 *
 * Nenhum número de downloads/avaliação foi confirmado até aqui: tudo null.
 *
 * TOTAIS ESPERADOS (conferidos por tests/apps-data.test.js e no console da página):
 *   own 4 + professional 7 + cooper 21 = 32.
 */
(function () {
  "use strict";

  var COOPER = 'Ecossistema Cooper Pay';
  function cooper(id, name, subtitle) {
    return {
      id: id, name: name, subtitle: subtitle || COOPER, group: 'cooper',
      sector: 'Banking white-label', logo: '/assets/img/apps/' + id + '.webp', platforms: [],
      androidUrl: null, iosUrl: null, downloads: null, rating: null, reviewCount: null
    };
  }

  window.LUCKSREI_APPS = {
    expected: { own: 4, professional: 7, cooper: 21, total: 32 },
    featured: ['fan-hub', 'match-queue', 'aprovaura', 'la-pelve', 'cooper-pay'],
    groups: [
      {
        id: 'own', filter: 'Produtos próprios', title: 'Produtos próprios',
        intro: 'Aplicativos que concebi, construí e publico por conta própria. Os detalhes de arquitetura estão nos case studies.'
      },
      {
        id: 'professional', filter: 'Outros profissionais', title: 'Outros projetos profissionais',
        intro: 'Aplicativos de empresas e clientes em que atuei, de fintech e seguros a agro e setor público.'
      },
      {
        id: 'cooper', filter: 'Ecossistema Cooper', title: 'Ecossistema Cooper Pay',
        intro: 'Ecossistema financeiro multimarca: aplicativos com identidade e distribuição próprias nas lojas, construídos sobre uma plataforma compartilhada. Cada marca aparece aqui individualmente, mas não são projetos independentes entre si.'
      }
    ],

    apps: [
      /* ---- meus produtos ---- */
      { id: 'fan-hub', name: 'Fan Hub', subtitle: 'App do torcedor do Goiás', group: 'own', sector: 'Produto próprio · Esportes',
        logo: '/assets/img/apps/fan-hub.webp', platforms: ['android', 'ios', 'web'], androidUrl: null, iosUrl: null,
        downloads: null, rating: null, reviewCount: null, technologies: ['Flutter', 'Supabase'], caseUrl: '/projects/fan-hub/' },
      { id: 'match-queue', name: 'Match Queue', subtitle: 'Matchmaking para times competitivos', group: 'own', sector: 'Produto próprio · Games',
        logo: '/assets/img/apps/match-queue.webp', platforms: ['ios'], androidUrl: null, iosUrl: null,
        downloads: null, rating: null, reviewCount: null, technologies: ['Flutter', 'Supabase'], caseUrl: '/projects/match-queue/' },
      { id: 'aprovaura', name: 'Aprovaura', subtitle: 'Estudo para vestibulares e provas', group: 'own', sector: 'Produto próprio · Educação',
        logo: '/assets/img/apps/aprovaura.webp', platforms: ['android', 'ios'], androidUrl: null, iosUrl: null,
        downloads: null, rating: null, reviewCount: null, technologies: ['Flutter', 'Supabase', 'IA'], caseUrl: '/projects/aura/' },
      { id: 'la-pelve', name: 'La Pelve', subtitle: 'Gestão clínica para fisioterapia pélvica', group: 'own', sector: 'Produto próprio · Saúde',
        logo: '/assets/img/apps/la-pelve.webp', platforms: ['android', 'ios'], androidUrl: null, iosUrl: null,
        downloads: null, rating: null, reviewCount: null, technologies: ['Flutter', 'Supabase'], caseUrl: '/projects/la-pelve/' },

      /* ---- profissionais ---- */
      { id: 'toro', name: 'Toro Investimentos', subtitle: 'Hoje Santander Corretora', group: 'professional', sector: 'Fintech',
        logo: null, platforms: ['android', 'ios'],
        androidUrl: 'https://play.google.com/store/apps/details?id=br.com.toroinvestimentos&hl=pt_BR',
        iosUrl: 'https://apps.apple.com/br/app/santander-corretora-taxa-0/id1490105579',
        downloads: null, rating: null, reviewCount: null, period: '2021' },
      { id: 'iza', name: 'IZA Seguradora', subtitle: 'Seguros', group: 'professional', sector: 'InsurTech',
        logo: null, platforms: ['android', 'ios'],
        androidUrl: 'https://play.google.com/store/apps/details?id=vc.com.iza.izaapp&hl=pt_BR',
        iosUrl: 'https://apps.apple.com/br/app/iza-seguradora-s-a/id1526181722',
        downloads: null, rating: null, reviewCount: null, period: '2020 – 2021', technologies: ['Flutter', 'Firebase'] },
      { id: 'boosteragro', name: 'BoosterAGRO', subtitle: 'Agricultura digital', group: 'professional', sector: 'AgTech',
        logo: null, platforms: ['android', 'ios'],
        androidUrl: 'https://play.google.com/store/apps/details?id=com.boosteragtech.boosteragro&hl=pt_BR',
        iosUrl: 'https://apps.apple.com/br/app/boosteragro/id1268230658',
        downloads: null, rating: null, reviewCount: null },
      { id: 'emater-go-mobi', name: 'EMATER-GO Mobi', subtitle: 'Técnicos e produtores rurais', group: 'professional', sector: 'GovTech',
        logo: null, platforms: ['android', 'ios'],
        androidUrl: 'https://play.google.com/store/apps/details?id=br.gov.go.emater_mob_tecnico&hl=en_US',
        iosUrl: 'https://apps.apple.com/br/app/emater-go-mobi/id1525305265',
        downloads: null, rating: null, reviewCount: null, technologies: ['Flutter', 'ObjectDB', 'REST API'] },
      { id: 'agr-fiscal', name: 'AGR Fiscal', subtitle: 'Fiscais de agência reguladora', group: 'professional', sector: 'GovTech',
        logo: null, platforms: [],
        androidUrl: null, /* URL antiga do Google Play retornava 404 (2026-10-03); sem link público por enquanto */
        iosUrl: null, downloads: null, rating: null, reviewCount: null, technologies: ['Flutter', 'ObjectDB', 'REST API'] },
      { id: 'vai', name: 'Vai', subtitle: 'Plataforma privada de mobilidade urbana', group: 'professional', sector: 'Mobilidade',
        logo: null, platforms: [], androidUrl: null, iosUrl: null, downloads: null, rating: null, reviewCount: null,
        private: true, period: 'Fev – Ago 2019', technologies: ['Flutter', 'Firebase RTDB'] },
      { id: 'gpol', name: 'GPOL', subtitle: 'Gestão online de carreira política', group: 'professional', sector: 'Gestão',
        logo: null, platforms: [], androidUrl: null, iosUrl: null, downloads: null, rating: null, reviewCount: null,
        private: true, period: 'Jan – Mar 2019', technologies: ['Flutter', 'Firestore'] },

      /* ---- ecossistema Cooper Pay (21) ---- */
      cooper('sol-cooper-pay', 'Sol Cooper Pay'),
      cooper('bom-dia-cooper-pay', 'Bom Dia Cooper Pay'),
      cooper('gooroo-cooper-pay', 'Gooroo Cooper Pay'),
      cooper('nova-plus-cooper-pay', 'Nova Plus Cooper Pay'),
      cooper('lillean-cooper-pay', 'Lillean Cooper Pay'),
      cooper('cooper-pay', 'Cooper Pay'),
      cooper('vitor-cooper-pay', 'Vitor Cooper Pay'),
      cooper('brasita', 'Brasita'),
      cooper('paraiso-cooper-pay', 'Paraíso Cooper Pay'),
      cooper('unicive-cooper-pay', 'Unicive Cooper Pay'),
      cooper('seralle-cooper-pay', 'Serallê Cooper Pay'),
      cooper('amigao-cooper-pay', 'Amigão Cooper Pay', 'Conta Digital Amigão'),
      cooper('aqui-agora-cooper-pay', 'Aqui Agora Cooper Pay'),
      cooper('calceleve-cooper-pay', 'Calceleve Cooper Pay'),
      cooper('stock-cooper-pay', 'Stock Cooper Pay'),
      cooper('cooper-corporate', 'Cooper Corporate'),
      cooper('medprev-cooper-pay', 'Medprev Cooper Pay'),
      cooper('cooper-multi', 'Cooper Multi'),
      cooper('appeldorn-cooper-pay', 'Appeldorn Cooper Pay'),
      cooper('cooper-beneficios', 'Cooper Benefícios'),
      cooper('dazam-cooper-pay', 'Dazam Cooper Pay')
    ]
  };
})();
