// Single source of truth for the Lucksrei Systems showcase. Add a product here and run `node tools/systems/build.mjs`.
// Every claim below was checked against the product repo (docs/business-rules.md, docs/status.md) or the already approved /beard/ landing.
export const ORIGIN = "https://sistemas.lucksrei.com";
export const MAIN = "https://lucksrei.com";
export const SUPPORT_EMAIL = "marketing@lucksrei.com";
export const LEGAL = { support: MAIN + "/support/", terms: MAIN + "/terms/", privacy: MAIN + "/privacy/" };

export const PLANS = [
  { days: 30, cents: 2990 },
  { days: 90, cents: 7990 },
  { days: 180, cents: 14990 },
  { days: 365, cents: 26990 }
];
export const brl = (c) => "R$ " + (c / 100).toFixed(2).replace(".", ",");

export const check = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" aria-hidden="true"><polyline points="20 6 9 17 4 12"/></svg>';
const I = {
  cal: '<rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>',
  user: '<path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>',
  scissors: '<circle cx="6" cy="6" r="3"/><circle cx="6" cy="18" r="3"/><line x1="20" y1="4" x2="8.12" y2="15.88"/><line x1="14.47" y1="14.48" x2="20" y2="20"/><line x1="8.12" y1="8.12" x2="12" y2="12"/>',
  card: '<rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/>',
  chart: '<line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/>',
  pct: '<line x1="19" y1="5" x2="5" y2="19"/><circle cx="6.5" cy="6.5" r="2.5"/><circle cx="17.5" cy="17.5" r="2.5"/>',
  team: '<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>',
  mail: '<path d="M4 4h16a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z"/><polyline points="22,6 12,13 2,6"/>',
  box: '<path d="M21 8l-9-5-9 5v8l9 5 9-5z"/><path d="M3 8l9 5 9-5"/><line x1="12" y1="13" x2="12" y2="21"/>',
  scan: '<path d="M4 7V5a1 1 0 0 1 1-1h2M17 4h2a1 1 0 0 1 1 1v2M20 17v2a1 1 0 0 1-1 1h-2M7 20H5a1 1 0 0 1-1-1v-2"/><line x1="8" y1="8" x2="8" y2="16"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="16" y1="8" x2="16" y2="16"/>',
  bag: '<path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/>',
  truck: '<rect x="1" y="3" width="15" height="13"/><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/>',
  alert: '<path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>'
};
export const icon = (k) => `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">${I[k]}</svg>`;

const COMMON_FAQ_PAY = [
  ["O pagamento é mensal?", "Não. O pagamento é único para o período escolhido (30, 90, 180 ou 365 dias). Não há cobrança recorrente."],
  ["A licença renova automaticamente?", "Não. É uma licença pré-paga, sem assinatura e sem renovação automática. Para continuar depois do prazo, basta contratar um novo período."],
  ["Quando começa a validade?", "A licença começa na data da ativação ou, no máximo, 30 dias após a aprovação do pagamento, prevalecendo o que ocorrer primeiro. Ativar depois desse limite não reinicia a contagem. Os planos têm 30, 90, 180 ou 365 dias, são pré-pagos e não se renovam automaticamente."]
];
const FAQ_END = [
  ["Como funciona o reembolso?", "O reembolso segue as regras da plataforma em que você comprou (na Hotmart, o prazo para solicitação é de 7 dias) e os direitos previstos em lei, como o de desistência em compras feitas fora do estabelecimento (art. 49 do Código de Defesa do Consumidor). Veja os Termos de Uso."],
  ["Como falar com o suporte?", `Pela <a href="${MAIN}/support/">página de suporte</a> ou pelo e-mail <a href="mailto:${SUPPORT_EMAIL}">${SUPPORT_EMAIL}</a>.`]
];

const SP_SUPPORT_EMAIL = "stockport@lucksrei.com";
const SP_FAQ_PAY = [
  COMMON_FAQ_PAY[0],
  COMMON_FAQ_PAY[1],
  ["Quando começa a validade?", "O período de uso começa quando você ativa o acesso (ao criar sua senha pelo convite) ou, no máximo, 30 dias depois da confirmação do pagamento, o que ocorrer primeiro. Nunca começa antes da aprovação do pagamento. Os 30 dias são apenas o limite para o início da contagem: a duração do plano continua sendo a que você comprou (30, 90, 180 ou 365 dias)."]
];
const SP_FAQ_END = [
  ["Como funciona o reembolso?", "O reembolso segue as regras e os termos da Hotmart, plataforma de pagamento, e o prazo para solicitação é de 7 dias."],
  ["Como falar com o suporte?", `Pela <a href="${MAIN}/support/">página de suporte</a> ou pelo e-mail <a href="mailto:${SP_SUPPORT_EMAIL}">${SP_SUPPORT_EMAIL}</a>, informando o e-mail da compra e o número do pedido.`]
];

export const PRODUCTS = [
  {
    slug: "beard", theme: "beard", name: "Beard System",
    tagline: "Gestão completa para barbearias",
    audience: "Barbearias",
    appUrl: "https://beard.lucksrei.com",
    store: { android: "https://play.google.com/store/apps/details?id=com.lucksrei.beard.system", ios: "https://apps.apple.com/br/app/beard-system/id6828040621" },
    title: "Beard System: sistema para barbearia com agenda, caixa e comissões | Lucksrei Systems",
    description: "Software de gestão para barbearia: agenda por profissional, clientes, caixa, comissões e financeiro. Licença de 30 a 365 dias, pagamento único, sem renovação automática.",
    ogTitle: "Beard System: gestão completa para barbearias",
    ogDescription: "Agenda, clientes, equipe, caixa, comissões e financeiro em um só sistema. Licenças de 30, 90, 180 e 365 dias, pagamento único.",
    logo: { src: "logo.webp", w: 94, h: 36 },
    og: "og.png", ogW: 1200, ogH: 628,
    hero: {
      h1: "Sua barbearia em um só sistema.",
      lead: "Agenda, clientes, comissões, caixa e financeiro em uma plataforma de gestão interna, pensada para o dia a dia da barbearia.",
      main: { src: "hero-financeiro.webp", w: 1400, h: 875, alt: "Tela de financeiro do Beard System no computador" },
      phone: { src: "hero-agenda.webp", w: 360, h: 779, alt: "Tela de agenda do Beard System no celular" }
    },
    problems: [
      ["Agenda espalhada", "Horários anotados em papel, no WhatsApp e na memória levam a encaixes duplicados e esquecimentos."],
      ["Caixa e comissão no improviso", "Sem registro organizado, fechar o caixa e calcular o que cada profissional recebe vira conta de fim de mês."],
      ["Pouca visão do negócio", "Receitas, valores a receber e histórico de clientes ficam difíceis de consultar quando estão em lugares diferentes."]
    ],
    featuresTitle: "Tudo o que sua barbearia precisa",
    featuresLead: "Ferramentas de gestão interna para o dono, os gerentes e a equipe.",
    features: [
      ["cal", "Agenda organizada", "Visualização diária e semanal por profissional, com horários, disponibilidade e remarcações ou cancelamentos feitos pela equipe."],
      ["user", "Clientes e histórico", "Cadastre seus clientes e consulte o histórico de atendimentos."],
      ["scissors", "Serviços e profissionais", "Cadastre serviços e profissionais e configure a disponibilidade de cada um."],
      ["card", "Caixa e pagamentos", "Controle as movimentações, registre recebimentos e pagamentos e faça o fechamento do caixa."],
      ["chart", "Controle financeiro", "Acompanhe receitas, valores recebidos e a receber, com gráficos e relatórios."],
      ["pct", "Comissões", "Acompanhe por profissional os valores gerados, pendentes e pagos."],
      ["team", "Equipe e permissões", "Convide os usuários da barbearia e defina papéis e permissões de acesso para cada perfil."],
      ["mail", "Avisos por e-mail", "Se a barbearia habilitar, clientes com e-mail cadastrado podem receber avisos e lembretes informativos dos atendimentos."]
    ],
    screens: [
      ["agenda.webp", "Agenda", "Horários organizados por profissional."],
      ["clientes.webp", "Clientes", "Cadastro e histórico de atendimentos."],
      ["caixa.webp", "Caixa", "Movimentações, recebimentos e fechamento."],
      ["financeiro.webp", "Financeiro", "Receitas, gráficos e relatórios."],
      ["comissoes.webp", "Comissões", "Gerado, pendente e pago por profissional."],
      ["equipe.webp", "Equipe", "Usuários, convites e permissões."]
    ],
    screenW: 1000, screenH: 625,
    screensLead: "Telas reais do Beard System, no tema escuro.",
    pricingTitle: "Escolha a licença da sua barbearia",
    checkout: "https://pay.hotmart.com/M108332227C?off=",
    offers: ["v3744m8m", "266mk4ak", "6swonc53", "ohpz770b"],
    marketplaces: [
      ["Whop", "https://whop.com/lucksrei/beard-system-gestao-completa-para-barbearias"],
      ["Payhip", "https://payhip.com/b/zN4ko"]
    ],
    important: [
      "Produto digital, sem envio físico.",
      "Todas as licenças têm as mesmas funcionalidades; muda apenas o período de acesso.",
      "Cada barbearia possui seus próprios dados e usuários.",
      "O Beard é para a gestão interna da barbearia: o cliente final não usa o sistema nem cria conta.",
      "A compra não inclui código-fonte ou personalização exclusiva."
    ],
    accessWho: "a conta da sua barbearia",
    // wording for purchases made on Hotmart (automatic invite by e-mail, no promised time); the other platforms stay manual (altNote)
    flow: {
      pricingLead: "Todas as licenças têm as mesmas funcionalidades; muda apenas o período de uso. O pagamento é único, sem renovação automática, e o período começa na ativação do acesso ou, no máximo, 30 dias após a confirmação do pagamento.",
      pricingNote: "O pagamento é processado pela Hotmart. Depois da confirmação, você recebe por e-mail um convite individual para criar a sua própria senha e ativar o acesso.",
      s3: "Receba, no e-mail usado na compra, o convite individual de acesso.",
      s4: "Crie a sua própria senha pelo convite. Nós nunca enviamos senhas.",
      s5: "Entre no Beard System e comece a usar.",
      infoP: "O período de uso começa quando você ativa o acesso ou, no máximo, 30 dias depois da confirmação do pagamento, o que ocorrer primeiro, e nunca antes da aprovação. Os 30 dias são apenas o limite para o início da contagem: a duração do plano continua sendo a que você comprou. O convite chega depois da confirmação do pagamento; não prometemos um prazo exato.",
      altNote: "Nestas plataformas, a ativação é feita manualmente pela Lucksrei depois da confirmação e pode não ser imediata."
    },
    faq: [
      ...COMMON_FAQ_PAY,
      ["Como recebo meu acesso?", "Depois da confirmação do pagamento na Hotmart, você recebe, no e-mail usado na compra, um convite individual (uso único, válido por 7 dias) para criar a sua própria senha e ativar o acesso. Nós nunca enviamos senhas. O convite depende da confirmação do pagamento e da entrega do e-mail, por isso não prometemos um prazo exato. Em compras por outras plataformas (Whop, Payhip), a ativação é manual e pode não ser imediata."],
      ["Não recebi o e-mail do convite. O que faço?", "Confira as pastas de Spam e Lixo eletrônico. Se o convite expirou ou já foi usado, abra o Beard, na tela de entrada toque em “Ative sua conta” (ao lado de “Primeiro acesso?”), informe o e-mail da compra e toque em “Enviar e-mail de ativação”. Se ainda assim não chegar, fale com o suporte informando o e-mail e o número do pedido."],
      ["Já sou cliente e tenho conta. E se eu comprar de novo?", "Quando o e-mail da compra corresponde de forma inequívoca à conta da sua barbearia, o novo período pode ser associado automaticamente. Em situações ambíguas (por exemplo, e-mail diferente do cadastrado), a associação pode exigir revisão manual da nossa equipe, que confirma a sua identidade para proteger os dados e não é imediata. Compre com o mesmo e-mail da conta e, se precisar, fale com o suporte."],
      ["Os funcionários podem acessar?", "Sim. O proprietário convida os usuários da barbearia e define papéis e permissões de acesso para cada um."],
      ["Os clientes da barbearia precisam criar conta?", "Não. O Beard é um sistema de gestão interna: quem usa são o proprietário, administradores, gerentes e a equipe autorizada. O cliente pede o horário à barbearia e o profissional registra no sistema. Se a barbearia habilitar os avisos por e-mail e o cliente tiver e-mail cadastrado, ele pode receber avisos informativos."],
      ["Preciso instalar algo?", "Não. O acesso é pelo navegador, no computador, no tablet ou no celular. Os aplicativos do Beard na Google Play e na App Store também podem ser usados."],
      ["O que acontece quando a licença vence?", "Depois do vencimento há um período de tolerância, de 7 dias por padrão, em que você só consulta e exporta os dados (conforme as permissões do seu perfil), sem fazer alterações. Terminado esse prazo, o acesso é bloqueado. Os dados da barbearia não são apagados por causa do vencimento e, quando a licença é renovada, o acesso volta com os dados que já existiam. Para renovar, compre um novo período com o mesmo e-mail da conta. Se o e-mail for outro ou o novo período não aparecer, fale com o suporte informando o número do pedido e o e-mail da conta."],
      ...FAQ_END
    ]
  },
  {
    slug: "stockport", theme: "stockport", name: "StockPort System",
    tagline: "Estoque, vendas e caixa para o seu comércio",
    audience: "Pequenos comércios",
    appUrl: "https://stockport.lucksrei.com",
    store: { android: "https://play.google.com/store/apps/details?id=com.lucksrei.stockport", ios: "https://apps.apple.com/br/app/stockport-system/id6825179571" },
    title: "StockPort System: controle de estoque, vendas e caixa para comércio | Lucksrei Systems",
    description: "Sistema de estoque, vendas e caixa para pequeno comércio: produtos, código de barras, entradas e saídas, clientes, fornecedores e relatórios. Licença de 30 a 365 dias, pagamento único.",
    ogTitle: "StockPort System: estoque, vendas e caixa",
    ogDescription: "Produtos, estoque, vendas, caixa, clientes, fornecedores e relatórios em um só sistema. Licenças de 30, 90, 180 e 365 dias, pagamento único.",
    logo: { src: "logo.svg", w: 150, h: 55 },
    og: "og.png", ogW: 1200, ogH: 630,
    hero: {
      h1: "Do estoque à venda, tudo conectado.",
      lead: "Cadastre produtos, controle o estoque, venda no caixa e acompanhe os resultados do seu comércio em um só sistema.",
      phone: { src: "painel.webp", w: 780, h: 1638, alt: "Painel do StockPort System no celular, com faturamento do dia e alertas de estoque" },
      second: { src: "vendas.webp", w: 780, h: 1638, alt: "Tela de vendas do StockPort System com carrinho e busca por código de barras" }
    },
    problems: [
      ["Estoque no caderno", "Sem registro de entradas e saídas, só se descobre que o produto acabou quando o cliente pede."],
      ["Caixa que não fecha", "Sem controle de abertura, suprimentos e retiradas, a diferença do caixa aparece no fim do dia sem explicação."],
      ["Decisão no escuro", "Sem relatórios de vendas e lucro estimado, fica difícil saber o que repor e o que realmente rende."]
    ],
    featuresTitle: "O que o StockPort faz pelo seu comércio",
    featuresLead: "Um sistema simples para o dono, o gerente e o balcão.",
    features: [
      ["box", "Produtos e categorias", "Cadastre produtos com categoria, código de barras, preço de venda, custo e estoque mínimo."],
      ["scan", "Código de barras", "Busque pelo nome ou leia o código com a câmera do celular (Android e iPhone) ou com um leitor."],
      ["bag", "Vendas", "Carrinho com quantidades, descontos e cliente; pagamento combinado em dinheiro, Pix, débito ou crédito, com troco."],
      ["truck", "Entradas e fornecedores", "Registre entradas de mercadoria por fornecedor e consulte o histórico completo de movimentações."],
      ["alert", "Estoque baixo", "Produtos abaixo do mínimo aparecem na lista de reposição e nos alertas do painel."],
      ["card", "Caixa", "Abertura, suprimentos, retiradas e fechamento, com o saldo esperado na gaveta."],
      ["chart", "Relatórios e exportação", "Faturamento, ticket médio e lucro estimado por período, com exportação em CSV e recibo em PDF."],
      ["team", "Usuários e permissões", "Defina quem vende, quem repõe estoque e quem enxerga custos e lucro."]
    ],
    screens: [
      ["painel.webp", "Painel", "Faturamento do dia e produtos para repor."],
      ["vendas.webp", "Vendas", "Busca, carrinho e código de barras."],
      ["pagamento.webp", "Pagamento", "Formas de pagamento combinadas, com troco."],
      ["estoque.webp", "Estoque", "Entradas, ajustes e histórico de movimentações."],
      ["caixa.webp", "Caixa", "Sessão de caixa e saldo esperado."],
      ["clientes.webp", "Clientes", "Cadastro e histórico de compras."],
      ["relatorios.webp", "Relatórios", "Faturamento, ticket médio e lucro estimado."]
    ],
    screenW: 780, screenH: 1638, portrait: true,
    screensLead: "Telas reais do StockPort System. Valores e nomes exibidos são dados de demonstração.",
    pricingTitle: "Escolha a licença do seu comércio",
    checkout: "https://pay.hotmart.com/Y108188423I?off=",
    offers: ["2etqhbn4", "abyjgd6l", "3hhdqjj4", "0e1joqem"],
    marketplaces: [
      ["Whop", "https://whop.com/lucksrei/stockport-system/"],
      ["Payhip", "https://payhip.com/b/yQDHG"],
      ["Mercado Livre (30 dias)", "https://www.mercadolivre.com.br/stockport-30-dias--gestao-de-estoque-vendas-e-caixa/up/MLBU5652230878"]
    ],
    important: [
      "Produto digital, sem envio físico.",
      "Todas as licenças têm as mesmas funcionalidades; muda apenas o período de acesso.",
      "Cada comércio possui seus próprios dados e usuários.",
      "O StockPort não emite nota fiscal (NF-e, NFC-e ou SAT); o recibo em PDF não tem valor fiscal.",
      "A compra não inclui código-fonte ou personalização exclusiva."
    ],
    accessWho: "a conta do seu comércio",
    heroNote: "não emite nota fiscal",
    supportEmail: SP_SUPPORT_EMAIL,
    // wording that only applies to purchases made on Hotmart (invite by e-mail); the other platforms stay manual (altNote)
    flow: {
      pricingLead: "Todas as licenças têm as mesmas funcionalidades; muda apenas o período de uso. O pagamento é único, sem renovação automática, e o período começa na ativação do acesso ou, no máximo, 30 dias após a confirmação do pagamento.",
      pricingNote: "O pagamento é processado pela Hotmart. Depois da confirmação, você recebe por e-mail um convite individual para criar a sua própria senha e ativar o acesso.",
      s3: "Receba, no e-mail usado na compra, o convite individual de acesso.",
      s4: "Crie a sua própria senha pelo convite. Nós nunca enviamos senhas.",
      s5: "Entre no StockPort System e comece a usar.",
      infoP: "O período de uso começa quando você ativa o acesso ou, no máximo, 30 dias depois da confirmação do pagamento, o que ocorrer primeiro, e nunca antes da aprovação. Os 30 dias são apenas o limite para o início da contagem: a duração do plano continua sendo a que você comprou. O convite chega depois da confirmação do pagamento; não prometemos um prazo exato.",
      altNote: "Nestas plataformas, a ativação é feita manualmente pela Lucksrei depois da confirmação e pode não ser imediata."
    },
    faq: [
      ...SP_FAQ_PAY,
      ["Como recebo meu acesso?", "Depois da confirmação do pagamento na Hotmart, você recebe, no e-mail usado na compra, um convite individual (uso único, válido por 7 dias) para criar a sua própria senha e ativar o acesso. Nós nunca enviamos senhas. O convite depende da confirmação do pagamento e da entrega do e-mail, por isso não prometemos um prazo exato."],
      ["Não recebi o e-mail do convite. O que faço?", "Confira as pastas de Spam e Lixo eletrônico. Se o convite expirou ou já foi usado, abra o StockPort, na tela de entrada toque em “Ative sua conta” (ao lado de “Primeiro acesso?”), informe o e-mail da compra e toque em “Enviar e-mail de ativação”. Se ainda assim não chegar, fale com o suporte informando o e-mail e o número do pedido."],
      ["Já sou cliente e tenho conta. E se eu comprar de novo?", "Se o e-mail da compra já estiver ligado a uma conta existente, nossa equipe confirma a sua identidade antes de associar o novo período, para proteger os dados da conta. Compre com o mesmo e-mail da conta e, se precisar, fale com o suporte."],
      ["Posso usar o leitor de código de barras?", "Sim. No celular Android e iPhone você lê o código com a câmera; em qualquer dispositivo também é possível digitar o código ou usar um leitor que funcione como teclado."],
      ["O StockPort emite nota fiscal?", "Não. O sistema controla estoque, vendas e caixa e gera recibo em PDF sem valor fiscal. A emissão de NF-e, NFC-e ou SAT não faz parte desta versão."],
      ["Os funcionários podem acessar?", "Sim. Você convida os usuários e define o perfil de cada um. Por exemplo, o perfil de balcão vende, mas não enxerga custos e lucro."],
      ["Preciso instalar algo?", "Não. O acesso é pelo navegador. Os aplicativos do StockPort na Google Play e na App Store também podem ser usados."],
      ["O que acontece quando a licença vence?", "Ao fim do período, o acesso fica indisponível até um novo período ser ativado. Para renovar, compre um novo plano com o mesmo e-mail da conta: os dias que ainda restarem são mantidos. Se o e-mail for outro, o suporte ajuda a identificar a conta. Não há renovação automática."],
      ...SP_FAQ_END
    ]
  }
];
