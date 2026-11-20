// Generates the lucksrei.com/tech/ landing (same layout as /beard/, product-landing.css) from tools/systems/data.mjs.
// Run: node tools/systems/landing.mjs   (--check fails when tech/index.html is stale; used by tests/tech-landing.test.js)
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { PLANS, PRODUCTS, brl, check, icon } from "./data.mjs";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
const p = PRODUCTS.find((x) => x.slug === "tech");
const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const base = `/assets/img/${p.slug}/`, url = "https://lucksrei.com/tech/";
const offer = (i) => p.checkout + p.offers[i];
const jsonld = {
  "@context": "https://schema.org", "@type": "Product", name: p.name, description: p.description, brand: { "@type": "Brand", name: "Lucksrei" },
  url, image: "https://lucksrei.com" + base + p.og,
  offers: PLANS.map((pl, i) => ({ "@type": "Offer", name: `Licença de ${pl.days} dias`, price: (pl.cents / 100).toFixed(2), priceCurrency: "BRL", availability: "https://schema.org/InStock", url: offer(i) }))
};
const cards = PLANS.map((pl, i) => `
        <div class="pricing-card${pl.days === 365 ? " featured" : ""}">${pl.days === 365 ? '\n          <span class="badge dark">Melhor valor</span>' : ""}
          <span class="pricing-duration">${pl.days} dias</span>
          <div class="pricing-price">${brl(pl.cents)}</div>
          <ul class="pricing-features">
            <li>${check} Todas as funcionalidades</li>
            <li>${check} ${p.platforms}</li>
            <li>${check} Pagamento único, sem renovação</li>
          </ul>
          <a href="${offer(i)}" class="btn btn-primary" data-plan="${pl.days}" rel="noopener">Comprar ${pl.days} dias</a>
        </div>`).join("");
const feats = p.features.map(([ic, t, d]) => `
          <div class="feature-card"><div class="feature-icon">${icon(ic)}</div><h3>${esc(t)}</h3><p>${esc(d)}</p></div>`).join("");
const shots = p.screens.map(([f, t, d]) => `
          <div class="feature-card screen-card"><img src="${base}${f}" width="${p.screenW}" height="${p.screenH}" loading="lazy" decoding="async" alt="${esc(t)} no ${esc(p.name)}"><h3>${esc(t)}</h3><p>${esc(d)}</p></div>`).join("");
const faq = p.faq.map(([q, a]) => `      <details><summary>${esc(q)}</summary><p>${a}</p></details>`).join("\n");
const imp = p.important.map((x) => `<li>${esc(x)}</li>`).join("");

const html = `<!doctype html>
<html lang="pt-BR">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="theme-color" content="#031554">
<title>Tech System — Gestão completa para assistências técnicas | Lucksrei</title>
<meta name="description" content="${esc(p.description)}">
<link rel="canonical" href="${url}">
<link rel="icon" type="image/png" sizes="32x32" href="/assets/img/favicon-32.png">
<link rel="icon" type="image/png" sizes="192x192" href="/assets/img/favicon-192.png">
<link rel="apple-touch-icon" href="/assets/img/apple-touch-icon.png">
<link rel="preload" href="/assets/fonts/outfit-latin.woff2" as="font" type="font/woff2" crossorigin>
<link rel="stylesheet" href="/assets/css/product-landing.css">
<meta property="og:type" content="website">
<meta property="og:site_name" content="Lucksrei">
<meta property="og:locale" content="pt_BR">
<meta property="og:title" content="${esc(p.ogTitle)}">
<meta property="og:description" content="${esc(p.ogDescription)}">
<meta property="og:url" content="${url}">
<meta property="og:image" content="https://lucksrei.com${base}${p.og}">
<meta property="og:image:width" content="${p.ogW}">
<meta property="og:image:height" content="${p.ogH}">
<meta name="twitter:card" content="summary_large_image">
<script type="application/ld+json">${JSON.stringify(jsonld)}</script>
</head>
<body data-product="tech">

  <header>
    <a href="#" class="logo" aria-label="${p.name}"><img src="${base}${p.logo.src}" alt="${p.name}" width="${p.logo.w}" height="${p.logo.h}"></a>
    <a href="#planos" class="btn btn-primary">Conhecer os planos</a>
  </header>

  <main>
    <section class="hero">
      <div class="hero-content">
        <h1>${esc(p.hero.h1)}</h1>
        <p>${esc(p.hero.lead)}</p>
        <div class="hero-actions">
          <a href="#planos" class="btn btn-primary">Conhecer os planos</a>
          <a href="#funcionalidades" class="btn btn-ghost">Explorar funcionalidades</a>
        </div>
      </div>
      <div class="hero-image-wrapper">
        <img class="main" src="${base}${p.hero.main.src}" width="${p.hero.main.w}" height="${p.hero.main.h}" alt="${esc(p.hero.main.alt)}">
      </div>
    </section>

    <section class="features" id="funcionalidades">
      <div class="container">
        <div class="section-title">
          <h2>${esc(p.featuresTitle)}</h2>
          <p>${esc(p.featuresLead)}</p>
        </div>
        <div class="features-grid">${feats}
        </div>
      </div>
    </section>

    <section class="screens" id="telas">
      <div class="container">
        <div class="section-title">
          <h2>O sistema por dentro</h2>
          <p>${esc(p.screensLead)}</p>
        </div>
        <div class="features-grid">${shots}
        </div>
      </div>
    </section>

    <section class="pricing" id="planos">
      <div class="section-title">
        <h2>${esc(p.pricingTitle)}</h2>
        <p>${p.flow.pricingLead}</p>
      </div>
      <div class="pricing-grid">${cards}
      </div>
      <p class="pricing-note">${p.flow.pricingNote} Prefere outra plataforma? Veja as opções na <a href="https://sistemas.lucksrei.com/tech/#planos">página do Tech System em Lucksrei Systems</a>.</p>
    </section>

    <section class="info-section" id="como-funciona">
      <div class="container">
        <div class="info-grid">
          <div class="info-box">
            <h3>Como funciona</h3>
            <ol>
              <li>Escolha o período de acesso.</li>
              <li>Finalize a compra na plataforma de venda da oferta escolhida.</li>
              <li>${p.flow.s3}</li>
              <li>${p.flow.s4}</li>
              <li>${p.flow.s5}</li>
            </ol>
            <p class="info-p">${p.flow.infoP}</p>
          </div>
          <div class="info-box">
            <h3>Informações importantes</h3>
            <ul>${imp}</ul>
            <p class="info-p">Acesse pelo navegador: <a href="${p.appUrl}" rel="noopener">tech.lucksrei.com</a>. Aplicativos: <a href="${p.store.android}" rel="noopener">Google Play</a> · <a href="${p.store.ios}" rel="noopener">App Store</a>.</p>
          </div>
        </div>
      </div>
    </section>

    <section class="faq" id="faq">
      <div class="section-title">
        <h2>Perguntas frequentes</h2>
      </div>
${faq}
    </section>
  </main>

  <footer>
    <div class="footer-content">
      <h3>Lucksrei Systems</h3>
      <p>Soluções tecnológicas inteligentes para o seu negócio.</p>
      <div class="footer-links">
        <a href="https://lucksrei.com">Site</a>
        <a href="https://lucksrei.com/projects/tech/support/">Suporte</a>
        <a href="https://lucksrei.com/projects/tech/terms/">Termos</a>
        <a href="https://lucksrei.com/projects/tech/privacy/">Privacidade</a>
        <a href="https://lucksrei.com/projects/tech/licensing/">Licenciamento</a>
        <a href="mailto:tech@lucksrei.com">tech@lucksrei.com</a>
      </div>
      <div class="copyright">© 2026 Lucksrei Systems — Tech System. Todos os direitos reservados.</div>
    </div>
  </footer>

</body>
</html>
`;
const f = path.join(root, "tech", "index.html");
if (process.argv.includes("--check")) {
  if (!fs.existsSync(f) || fs.readFileSync(f, "utf8") !== html) { console.error("stale: tech/index.html"); process.exit(1); }
} else { fs.mkdirSync(path.dirname(f), { recursive: true }); fs.writeFileSync(f, html); }
