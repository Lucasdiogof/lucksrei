// Generates the static showcase in systems/ from tools/systems/data.mjs. Run: node tools/systems/build.mjs
// `node tools/systems/build.mjs --check` fails when the committed files differ (used by tests/systems.test.js).
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { ORIGIN, MAIN, SUPPORT_EMAIL, LEGAL, PLANS, PRODUCTS, brl, check, icon } from "./data.mjs";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
const out = path.join(root, "systems");
const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const perDay = (p) => "R$ " + (p.cents / p.days / 100).toFixed(2).replace(".", ",");

const head = ({ title, description, canonical, ogTitle, ogDescription, ogImage, ogW, ogH, theme, jsonld }) => `<!doctype html>
<html lang="pt-BR">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="theme-color" content="${theme === "stockport" ? "#0B1B3B" : "#17181A"}">
<title>${esc(title)}</title>
<meta name="description" content="${esc(description)}">
<link rel="canonical" href="${canonical}">
<link rel="icon" type="image/png" sizes="32x32" href="/assets/img/favicon-32.png">
<link rel="icon" type="image/png" sizes="192x192" href="/assets/img/favicon-192.png">
<link rel="apple-touch-icon" href="/assets/img/apple-touch-icon.png">
<link rel="preload" href="/assets/fonts/outfit-latin.woff2" as="font" type="font/woff2" crossorigin>
<link rel="stylesheet" href="/assets/css/systems.css">
<meta property="og:type" content="website">
<meta property="og:site_name" content="Lucksrei Systems">
<meta property="og:locale" content="pt_BR">
<meta property="og:title" content="${esc(ogTitle)}">
<meta property="og:description" content="${esc(ogDescription)}">
<meta property="og:url" content="${canonical}">
<meta property="og:image" content="${ogImage}">
<meta property="og:image:width" content="${ogW}">
<meta property="og:image:height" content="${ogH}">
<meta name="twitter:card" content="summary_large_image">
<script type="application/ld+json">${JSON.stringify(jsonld)}</script>
</head>
<body data-theme="${theme}">
<a class="skip" href="#conteudo">Ir para o conteúdo</a>
`;

const foot = (dataProduct) => `
<div id="consent" class="consent" role="dialog" aria-label="Preferências de privacidade" hidden>
  <p>Cookies de medição e anúncios só com a sua permissão; sem ela, nada de marketing é carregado. <a href="${LEGAL.privacy}">Política de privacidade</a></p>
  <div><button type="button" class="btn btn-ghost" data-consent="deny">Recusar</button><button type="button" class="btn btn-ghost" data-consent="accept">Aceitar</button></div>
</div>
<dialog id="lightbox" class="lightbox" aria-label="Imagem ampliada"><form method="dialog"><button class="lb-close" aria-label="Fechar">&times;</button></form><img alt="" id="lightbox-img"><p id="lightbox-cap"></p></dialog>
<script src="/assets/js/tracking-config.js"></script>
<script src="/assets/js/systems.js"${dataProduct ? ` data-product="${dataProduct}"` : ""}></script>
</body>
</html>
`;

const footer = (extra = "", email = SUPPORT_EMAIL) => `<footer>
  <div class="footer-content">
    <img class="footer-logo" src="/assets/img/lucksrei/lucksrei-crown.webp" alt="" width="56" height="40">
    <h3>Lucksrei Systems</h3>
    <p>Soluções digitais para a gestão do seu negócio.</p>
    <nav class="footer-links" aria-label="Rodapé">
      <a href="/">Sistemas</a>${extra}
      <a href="${LEGAL.support}">Suporte</a>
      <a href="${LEGAL.terms}">Termos</a>
      <a href="${LEGAL.privacy}">Privacidade</a>
      <a href="${MAIN}">lucksrei.com</a>
      <a href="mailto:${email}">${email}</a>
    </nav>
    <div class="copyright">© 2026 Lucksrei Systems. Todos os direitos reservados.</div>
  </div>
</footer>`;

const productNav = PRODUCTS.map((p) => `<a href="/${p.slug}/">${esc(p.name)}</a>`).join("");

function productPage(p) {
  const base = `/assets/img/${p.slug}/`;
  const canonical = `${ORIGIN}/${p.slug}/`;
  const offerUrl = (i) => p.checkout + p.offers[i];
  const jsonld = {
    "@context": "https://schema.org", "@type": "Product", name: p.name,
    description: p.description, brand: { "@type": "Brand", name: "Lucksrei Systems" },
    url: canonical, image: ORIGIN + base + p.og,
    offers: PLANS.map((pl, i) => ({ "@type": "Offer", name: `Licença de ${pl.days} dias`, price: (pl.cents / 100).toFixed(2), priceCurrency: "BRL", url: offerUrl(i) }))
  };
  const hero = p.hero;
  const heroImgs = hero.main
    ? `<div class="hero-media hero-desktop"><img class="main" src="${base}${hero.main.src}" width="${hero.main.w}" height="${hero.main.h}" alt="${esc(hero.main.alt)}" fetchpriority="high"><img class="phone" src="${base}${hero.phone.src}" width="${hero.phone.w}" height="${hero.phone.h}" alt="${esc(hero.phone.alt)}"></div>`
    : `<div class="hero-media hero-phones"><img src="${base}${hero.phone.src}" width="${hero.phone.w}" height="${hero.phone.h}" alt="${esc(hero.phone.alt)}" fetchpriority="high"><img src="${base}${hero.second.src}" width="${hero.second.w}" height="${hero.second.h}" alt="${esc(hero.second.alt)}"></div>`;
  const track = (ev, extra = "") => `data-track="${ev}" data-product="${p.slug}"${extra}`;
  const plans = PLANS.map((pl, i) => `
        <div class="pricing-card${pl.days === 365 ? " featured" : ""}">
          ${pl.days === 365 ? '<span class="badge dark">Menor custo por dia</span>' : ""}
          <span class="pricing-duration">${pl.days} dias</span>
          <div class="pricing-price">${brl(pl.cents)}</div>
          <div class="pricing-day">${perDay(pl)} por dia</div>
          <ul class="pricing-features">
            <li>${check} Todas as funcionalidades</li>
            <li>${check} Acesso pela Web</li>
            <li>${check} Pagamento único, sem renovação</li>
          </ul>
          <a href="${offerUrl(i)}" class="btn btn-primary" rel="noopener" ${track("checkout_link_click", ` data-days="${pl.days}" data-price="${(pl.cents / 100).toFixed(2)}"`)}>Comprar ${pl.days} dias</a>
        </div>`).join("");
  const feats = p.features.map(([ic, t, d]) => `
          <div class="feature-card"><div class="feature-icon">${icon(ic)}</div><h3>${esc(t)}</h3><p>${esc(d)}</p></div>`).join("");
  const probs = p.problems.map(([t, d]) => `<div class="problem"><h3>${esc(t)}</h3><p>${esc(d)}</p></div>`).join("");
  const tabs = p.screens.map(([f, t], i) => `<button type="button" role="tab" id="tab-${i}" aria-controls="panel-${i}" aria-selected="${i === 0}" tabindex="${i === 0 ? 0 : -1}" data-i="${i}">${esc(t)}</button>`).join("");
  const screens = p.screens.map(([f, t, d], i) => `
          <div class="shot${i === 0 ? " on" : ""}" role="tabpanel" id="panel-${i}" aria-labelledby="tab-${i}">
            <button type="button" class="shot-btn" data-full="${base}${f}" data-cap="${esc(t)}: ${esc(d)}" aria-label="Ampliar a tela ${esc(t)}"><img src="${base}${f}" width="${p.screenW}" height="${p.screenH}" loading="lazy" decoding="async" alt="${esc(p.name)}: tela de ${esc(t.toLowerCase())}"></button>
            <p class="cap"><strong>${esc(t)}</strong><span>${esc(d)}</span></p>
          </div>`).join("");
  const faq = p.faq.map(([q, a]) => `      <details><summary>${esc(q)}</summary><p>${a}</p></details>`).join("\n");
  const market = p.marketplaces.map(([n, u]) => `<a href="${u}" rel="noopener" ${track("marketplace_click", ` data-marketplace="${esc(n.split(" (")[0].toLowerCase().replace(/ /g, "-"))}"`)}>${esc(n)}</a>`).join("");
  const important = p.important.map((x) => `<li>${esc(x)}</li>`).join("");

  return head({ title: p.title, description: p.description, canonical, ogTitle: p.ogTitle, ogDescription: p.ogDescription, ogImage: ORIGIN + base + p.og, ogW: p.ogW, ogH: p.ogH, theme: p.theme, jsonld }) + `
<header>
  <a href="#" class="logo" aria-label="${esc(p.name)}"><img src="${base}${p.logo.src}" alt="${esc(p.name)}" width="${p.logo.w}" height="${p.logo.h}"></a>
  <nav class="nav" aria-label="Seções"><a href="#funcionalidades">Funcionalidades</a><a href="#telas">Telas</a><a href="#planos">Planos</a><a href="#faq">Dúvidas</a></nav>
  <a href="#planos" class="btn btn-primary" ${track("cta_click", ' data-where="header"')}>Ver licenças</a>
</header>

<main id="conteudo">
  <section class="hero">
    <div class="hero-content">
      <p class="eyebrow">${esc(p.name)} · por Lucksrei Systems</p>
      <h1>${esc(hero.h1)}</h1>
      <p class="lead">${esc(hero.lead)}</p>
      <div class="hero-actions">
        <a href="#planos" class="btn btn-primary" ${track("cta_click", ' data-where="hero"')}>Conhecer as licenças</a>
        <a href="#funcionalidades" class="btn btn-ghost">Ver funcionalidades</a>
      </div>
      <p class="hero-note">A partir de ${brl(PLANS[0].cents)} · pagamento único · sem renovação automática${p.heroNote ? ` · ${esc(p.heroNote)}` : ""}</p>
    </div>
    ${heroImgs}
  </section>

  <section class="problems" aria-labelledby="problemas">
    <div class="container">
      <div class="section-title"><h2 id="problemas">O que costuma atrapalhar o dia a dia</h2></div>
      <div class="problems-grid">${probs}</div>
    </div>
  </section>

  <section class="features" id="funcionalidades">
    <div class="container">
      <div class="section-title"><h2>${esc(p.featuresTitle)}</h2><p>${esc(p.featuresLead)}</p></div>
      <div class="features-grid">${feats}
      </div>
      <p class="center-cta"><a href="#planos" class="btn btn-primary" ${track("cta_click", ' data-where="features"')}>Escolher minha licença</a></p>
    </div>
  </section>

  <section class="screens" id="telas">
    <div class="container">
      <div class="section-title"><h2>O sistema por dentro</h2><p>${esc(p.screensLead)} Toque para ampliar.</p></div>
      <div class="stage${p.portrait ? " stage-portrait" : ""}" data-stage>
        <div class="stage-tabs" role="tablist" aria-label="Telas do sistema" hidden>${tabs}</div>
        <div class="stage-panels">${screens}
        </div>
      </div>
    </div>
  </section>

  <section class="pricing" id="planos">
    <div class="section-title">
      <h2>${esc(p.pricingTitle)}</h2>
      <p>${p.flow?.pricingLead ?? "Todas as licenças têm as mesmas funcionalidades. O pagamento é único, sem renovação automática, e o prazo conta a partir da ativação ou, no máximo, 30 dias após a aprovação do pagamento."}</p>
    </div>
    <div class="pricing-grid">${plans}
    </div>
    <p class="pricing-note">${p.flow?.pricingNote ?? "O pagamento é processado pela plataforma de venda escolhida (por exemplo, a Hotmart). Depois da confirmação, a Lucksrei ativa a licença manualmente e envia as instruções por e-mail."}</p>
    <div class="alt-buy">
      <h3>Prefere comprar por outra plataforma?</h3>
      <p>As licenças também estão disponíveis em:</p>
      <div class="alt-links">${market}</div>${p.flow?.altNote ? `
      <p class="pricing-note">${p.flow.altNote}</p>` : ""}
    </div>
  </section>

  <section class="info-section" id="como-funciona">
    <div class="container">
      <div class="info-grid">
        <div class="info-box">
          <h3>Como funciona</h3>
          <ol>
            <li>Escolha o período de acesso.</li>
            <li>Finalize a compra na plataforma de venda da oferta escolhida (por exemplo, a Hotmart).</li>
            <li>${p.flow?.s3 ?? `A Lucksrei cria ${p.accessWho}.`}</li>
            <li>${p.flow?.s4 ?? "Receba as instruções por e-mail, no endereço usado na compra."}</li>
            <li>${p.flow?.s5 ?? "Ative seu acesso, defina sua senha e comece a usar."}</li>
          </ol>
          <p class="info-p">${p.flow?.infoP ?? "A conta é criada manualmente, depois da confirmação do pagamento, e o acesso não é necessariamente imediato. O período contratado (30, 90, 180 ou 365 dias) começa na ativação ou, no máximo, 30 dias após a aprovação do pagamento, o que ocorrer primeiro; ativar depois desse limite não reinicia a contagem."}</p>
        </div>
        <div class="info-box">
          <h3>Onde usar</h3>
          <p>Acesse pelo navegador no computador, Android ou iPhone, sem instalar nada: <a href="${p.appUrl}" rel="noopener" ${track("app_link_click")}>${p.appUrl.replace("https://", "")}</a> (endereço de acesso do sistema, para quem já tem conta).</p>
          <p class="info-p">Aplicativos: <a href="${p.store.android}" rel="noopener" ${track("store_click", ' data-store="google-play"')}>Google Play</a> · <a href="${p.store.ios}" rel="noopener" ${track("store_click", ' data-store="app-store"')}>App Store</a></p>
          <h3 class="h3-gap">Informações importantes</h3>
          <ul>${important}</ul>
        </div>
      </div>
    </div>
  </section>

  <section class="faq" id="faq">
    <div class="section-title"><h2>Perguntas frequentes</h2></div>
${faq}
  </section>
</main>

${footer(PRODUCTS.filter((x) => x !== p).map((x) => `<a href="/${x.slug}/">${esc(x.name)}</a>`).join(""), p.supportEmail)}
` + foot(p.slug);
}

function indexPage() {
  const canonical = ORIGIN + "/";
  const jsonld = {
    "@context": "https://schema.org", "@type": "Organization", name: "Lucksrei Systems", url: canonical, logo: ORIGIN + "/assets/img/lucksrei/lucksrei-md.webp",
    email: SUPPORT_EMAIL, parentOrganization: { "@type": "Organization", name: "Lucksrei", url: MAIN }
  };
  const cards = PRODUCTS.map((p) => {
    const shot = p.portrait ? `<div class="card-shot card-shot-portrait"><img src="/assets/img/${p.slug}/${p.hero.phone.src}" width="${p.hero.phone.w}" height="${p.hero.phone.h}" alt="Tela do ${esc(p.name)}" loading="lazy"></div>`
      : `<div class="card-shot"><img src="/assets/img/${p.slug}/${p.hero.main.src}" width="${p.hero.main.w}" height="${p.hero.main.h}" alt="Tela do ${esc(p.name)}" loading="lazy"></div>`;
    return `
      <article class="product-card" data-theme="${p.theme}">
        ${shot}
        <div class="card-body">
          <img class="card-logo" src="/assets/img/${p.slug}/${p.logo.src}" alt="${esc(p.name)}" width="${p.logo.w}" height="${p.logo.h}">
          <p class="card-audience">${esc(p.audience)}</p>
          <h3>${esc(p.tagline)}</h3>
          <p>${esc(p.description.split(". ")[0])}.</p>
          <p class="card-price">Licenças de 30 a 365 dias, a partir de ${brl(PLANS[0].cents)}</p>
          <a class="btn btn-primary" href="/${p.slug}/" data-track="cta_click" data-product="${p.slug}" data-where="catalog">Conhecer o ${esc(p.name.replace(" System", ""))}</a>
        </div>
      </article>`;
  }).join("");
  return head({
    title: "Lucksrei Systems: sistemas de gestão para barbearias e comércios",
    description: "Lucksrei Systems desenvolve e vende sistemas de gestão: Beard System para barbearias e StockPort System para estoque, vendas e caixa. Licenças de pagamento único.",
    canonical, ogTitle: "Lucksrei Systems: sistemas de gestão para o seu negócio", ogDescription: "Beard System para barbearias e StockPort System para comércios. Licenças de 30 a 365 dias, pagamento único.",
    ogImage: ORIGIN + "/assets/img/lucksrei/og.jpg", ogW: 1200, ogH: 630, theme: "lucksrei", jsonld
  }) + `
<header>
  <a href="/" class="logo" aria-label="Lucksrei Systems"><img src="/assets/img/lucksrei/lucksrei-sm.webp" alt="Lucksrei" width="140" height="30"><span class="logo-text">Systems</span></a>
  <nav class="nav" aria-label="Seções"><a href="#sistemas">Sistemas</a><a href="#como-funciona">Como funciona</a><a href="#suporte">Suporte</a></nav>
  <a href="#sistemas" class="btn btn-primary">Ver sistemas</a>
</header>

<main id="conteudo">
  <section class="hero-band">
    <div class="hero hero-institutional">
      <div class="hero-content">
        <p class="eyebrow">Lucksrei Systems</p>
        <h1>Sistemas de gestão para quem faz o negócio acontecer.</h1>
        <p class="lead">Desenvolvemos e vendemos softwares simples e completos para organizar a rotina de pequenos negócios, com licença de pagamento único e suporte direto com quem desenvolveu.</p>
        <div class="hero-actions"><a href="#sistemas" class="btn btn-primary">Conhecer os sistemas</a><a href="#como-funciona" class="btn btn-ghost">Como funciona</a></div>
      </div>
      <div class="hero-products" aria-label="Sistemas disponíveis">
        ${PRODUCTS.map((p) => `<a class="hero-product" data-theme="${p.theme}" href="/${p.slug}/" data-track="cta_click" data-product="${p.slug}" data-where="home-hero"><img src="/assets/img/${p.slug}/${p.logo.src}" alt="${esc(p.name)}" width="${p.logo.w}" height="${p.logo.h}"><span>${esc(p.audience)}</span><b>${esc(p.tagline)}</b></a>`).join("")}
      </div>
    </div>
  </section>

  <section class="catalog" id="sistemas">
    <div class="container">
      <div class="section-title"><h2>Nossos sistemas</h2><p>Cada sistema tem sua própria página, com telas reais, licenças e perguntas frequentes.</p></div>
      <div class="catalog-grid">${cards}
      </div>
      <p class="soon">Novos sistemas serão adicionados a este catálogo.</p>
    </div>
  </section>

  <section class="info-section" id="como-funciona">
    <div class="container">
      <div class="info-grid">
        <div class="info-box"><h3>Como funciona</h3>
          <ol><li>Escolha o sistema e o período da licença.</li><li>Pague pela Hotmart (ou outra plataforma disponível na página do sistema).</li><li>Depois da confirmação do pagamento, você recebe as instruções de acesso por e-mail.</li><li>Use pelo navegador, no computador, Android ou iPhone.</li></ol>
        </div>
        <div class="info-box"><h3>Licenças</h3>
          <ul><li>30 dias, 90 dias, 180 dias ou 365 dias.</li><li>Mesmas funcionalidades em todas.</li><li>Pagamento único, sem renovação automática.</li><li>O prazo de uso começa na ativação do acesso, conforme a regra descrita na página de cada sistema.</li></ul>
        </div>
      </div>
    </div>
  </section>

  <section class="support" id="suporte">
    <div class="container">
      <div class="section-title"><h2>Suporte e documentos</h2><p>Dúvidas antes ou depois da compra: fale com a Lucksrei.</p></div>
      <div class="alt-links"><a href="${LEGAL.support}">Suporte</a><a href="${LEGAL.terms}">Termos de uso</a><a href="${LEGAL.privacy}">Privacidade</a><a href="mailto:${SUPPORT_EMAIL}">${SUPPORT_EMAIL}</a></div>
    </div>
  </section>
</main>

${footer(productNav)}
` + foot("");
}

const notFound = head({ title: "Página não encontrada | Lucksrei Systems", description: "Página não encontrada.", canonical: ORIGIN + "/", ogTitle: "Lucksrei Systems", ogDescription: "Sistemas de gestão", ogImage: ORIGIN + "/assets/img/lucksrei/og.jpg", ogW: 1200, ogH: 630, theme: "lucksrei", jsonld: {} }).replace('<link rel="canonical" href="' + ORIGIN + '/">', '<meta name="robots" content="noindex">') + `
<header><a href="/" class="logo" aria-label="Lucksrei Systems"><img src="/assets/img/lucksrei/lucksrei-sm.webp" alt="Lucksrei" width="140" height="30"><span class="logo-text">Systems</span></a></header>
<main id="conteudo" class="nf"><h1>Página não encontrada</h1><p>O endereço não existe. Veja os sistemas disponíveis.</p><p><a class="btn btn-primary" href="/">Ir para o catálogo</a></p></main>
` + foot("");

const csp = "default-src 'self'; script-src 'self'; style-src 'self'; style-src-attr 'none'; img-src 'self' data:; font-src 'self'; connect-src 'self'; media-src 'none'; frame-src 'none'; worker-src 'self'; manifest-src 'self'; base-uri 'self'; form-action 'none'; frame-ancestors 'none'; object-src 'none'";
const files = {
  "index.html": indexPage(),
  "404.html": notFound,
  ...Object.fromEntries(PRODUCTS.map((p) => [`${p.slug}/index.html`, productPage(p)])),
  "robots.txt": `User-agent: *\nAllow: /\n\nSitemap: ${ORIGIN}/sitemap.xml\n`,
  "sitemap.xml": `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${["/", ...PRODUCTS.map((p) => `/${p.slug}/`)].map((u) => `  <url><loc>${ORIGIN}${u}</loc></url>`).join("\n")}\n</urlset>\n`,
  "_headers": `# Headers of the sistemas.lucksrei.com Worker. To enable GA4/Google Ads/Meta Pixel, see docs/systems/TRACKING.md (CSP additions are listed there).
/*
  X-Content-Type-Options: nosniff
  Referrer-Policy: strict-origin-when-cross-origin
  X-Frame-Options: DENY
  Permissions-Policy: camera=(), microphone=(), geolocation=(), payment=(), usb=()
  Cross-Origin-Opener-Policy: same-origin
  Strict-Transport-Security: max-age=2592000
  Content-Security-Policy: ${csp}

/assets/fonts/*
  Cache-Control: public, max-age=31536000, immutable
/assets/img/*
  Cache-Control: public, max-age=86400
`
};

let bad = 0;
for (const [rel, body] of Object.entries(files)) {
  const f = path.join(out, rel);
  if (process.argv.includes("--check")) {
    if (!fs.existsSync(f) || fs.readFileSync(f, "utf8") !== body) { console.error("stale: systems/" + rel); bad++; }
  } else { fs.mkdirSync(path.dirname(f), { recursive: true }); fs.writeFileSync(f, body); }
}
if (bad) process.exit(1);
