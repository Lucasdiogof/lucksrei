<p align="center">
  <img src="assets/img/brand/lucksrei-md.webp" width="160" alt="Lucksrei">
</p>

<h1 align="center">lucksrei.com</h1>

<p align="center">
  Portfolio of Lucas Diogo França, mobile engineer, and home of the Lucksrei apps and systems.
</p>

<p align="center">
  <img src="https://img.shields.io/badge/HTML-E34F26?logo=html5&logoColor=white" alt="HTML">
  <img src="https://img.shields.io/badge/CSS-1572B6?logo=css3&logoColor=white" alt="CSS">
  <img src="https://img.shields.io/badge/JavaScript-F7DF1E?logo=javascript&logoColor=black" alt="JavaScript">
  <img src="https://img.shields.io/badge/Cloudflare_Workers-F38020?logo=cloudflare&logoColor=white" alt="Cloudflare Workers">
  <img src="https://img.shields.io/badge/Cloudflare_D1-F38020?logo=cloudflare&logoColor=white" alt="Cloudflare D1">
</p>

<p align="center">
  <b>English</b> · <a href="README.pt-BR.md">Português</a> · <a href="README.es.md">Español</a>
</p>

---

A static site with no build step and no framework: plain HTML, CSS and JavaScript served by Cloudflare Workers Static Assets. A small Worker answers only `/api/*` (visitor stats, contact form, GitHub calendar). Live at **[lucksrei.com](https://lucksrei.com)**.

## What's on the site

| Page | Content |
| --- | --- |
| `/` | Home: pixel-art hero scene, case studies, technical skills with evidence, visitor map and contact |
| `/apps/` | Every Lucksrei app and system, with tabs, store links and web app links |
| `/projects/<app>/` | Case study per app (Aprovaura, Bebômetro, BusãoGyn, Fan Hub, La Pelve, Match Queue, OrbiJob, StockPort) plus its privacy, support and data-deletion pages |
| `/privacy/`, `/terms/`, `/support/` | General legal and support pages for the licensed systems |
| `/contact/` | Contact form (Resend, optional Turnstile) |
| `/visitors/` | Aggregated visits by country and state/region |

The whole site is in **English, Portuguese and Spanish** (`assets/i18n/{en,pt-BR,es}.js`), with screenshots per language (`assets/js/screenshots-data.js`) and light and dark themes.

## Architecture

```text
index.html, apps/, projects/, ...   static pages (served directly, no Worker cost)
assets/css/style.css                design tokens (:root) and all styles
assets/js/                          page scripts: i18n, hero, apps, skills, visitors, contact
assets/i18n/                        en, pt-BR and es dictionaries
worker/                             Worker for /api/* only (run_worker_first)
migrations/                         D1 schema (lucksrei-visits)
tests/                              Node tests, no dependencies
tools/                              asset generators (brand, hero, maps, app videos, captures)
docs/                               internal notes (not served)
```

### API

| Endpoint | What it does |
| --- | --- |
| `POST /api/visit` | counts a visit per month, country and region in D1 (bot and datacenter filtered, rate limited) |
| `GET /api/visitors` | last 12 months of aggregates (edge cache 5 min) |
| `GET /api/whoami` | the visitor's own country and region |
| `POST /api/contact` | validates and sends the contact e-mail (rate limits, honeypot, Turnstile when enabled) |
| `GET /api/turnstile-config` | public Turnstile site key and whether it is on |
| `GET /api/github-contributions` | GitHub contribution calendar (edge cache 6 h) |

Every API response carries strict security headers (`worker/security.mjs`); static pages get theirs from `_headers`. Full threat model and rollbacks: [docs/security.md](docs/security.md).

## Run locally

Requires Node.js 22 and Wrangler.

```bash
npx wrangler dev --local          # site + API on http://localhost:8787
npx wrangler d1 migrations apply lucksrei-visits --local
```

Pages also open straight from a static server; only `/api/*` needs the Worker.

### Configuration

Set in the Worker (`Settings → Variables and Secrets`), never in the repository. `wrangler.jsonc` uses `keep_vars` so dashboard variables survive deploys.

| Name | Type | Purpose |
| --- | --- | --- |
| `RESEND_API_KEY` | secret | sends the contact e-mail through Resend |
| `CONTACT_TO` / `CONTACT_FROM` | variable (optional) | override the default contact addresses |
| `TURNSTILE_SITE_KEY` | variable (public) | Turnstile widget |
| `TURNSTILE_SECRET_KEY` | secret | Turnstile Siteverify |
| `TURNSTILE_ENFORCE` | variable | `on` makes Turnstile mandatory |
| `GITHUB_TOKEN` | secret (optional) | GitHub GraphQL for the calendar (without it, the public profile page is parsed) |

## Tests

```bash
for f in tests/*.test.js; do node "$f"; done
```

The same loop runs in CI (`.github/workflows/site-tests.yml`) on every push. The tests cover i18n parity, localized screenshots, the apps dataset, legal page layout, security headers, the contact form, Turnstile and the visitor API.

## Deploy

Pushing to `main` deploys through Cloudflare Workers Builds. `.assetsignore` keeps the Worker code, tests, tools, docs and these READMEs out of the public assets.

## Documentation

Internal notes, in Portuguese:

- [DESIGN.md](DESIGN.md): "Royal Tech" design system: colors, type, spacing, components
- [docs/security.md](docs/security.md): API surface, limits, headers, Turnstile, rollback
- [docs/visitor-analytics.md](docs/visitor-analytics.md): visitor counting and the map
- [docs/hero-v3.md](docs/hero-v3.md): the pixel-art hero scene

## License

No open-source license is granted. The code is public as part of a portfolio; all rights reserved. The Lucksrei logo and brand assets may not be reused.

---

Built by Lucas Diogo França.
