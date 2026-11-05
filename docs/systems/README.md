# Lucksrei Systems showcase (sistemas.lucksrei.com)

Status: **published on 2026-11-05** (PR #25, merge commit `74728fc`): Worker `lucksrei-systems` with the Custom Domain `sistemas.lucksrei.com`. Hotmart, Payhip, Whop, Mercado Livre, analytics and redirects were not touched. Details, tests and rollback: [PUBLISHING.md](PUBLISHING.md).

## 1. Audit (verified on 2026-11-05; "unverified" is marked as such)

| Item | Finding |
|---|---|
| Repo / base | `Lucasdiogof/lucksrei`, built from `origin/main` 44fb787. The local `main` was ahead 57 / behind 167 and was not used. |
| Stack | Plain static HTML/CSS/JS, no bundler. One Worker `lucksrei-site` (`wrangler.jsonc`): `assets.directory "./"`, script only for `/api/*` and `/assets/video/*.mp4`, D1 + rate limits for visits/contact. `workers_dev:false`. |
| CI | `.github/workflows/site-tests.yml` runs every `tests/*.test.js` with Node 22. Deploy is Cloudflare Workers Builds on push to main (not visible in GitHub; see memory note: sometimes needs an empty "Trigger Workers build" commit). |
| Beard landing | `lucksrei.com/beard/` (PR #24, 71c463a), HTTP 200. Reused: copy, 8 Hotmart links, screenshots, hero, FAQ and the grace-period text. |
| StockPort landing | `lucasdiogo1234.hotmart.host/stockport-system`, HTTP 200 (Hotmart Pages). Kept as is; not the final home. |
| Web apps | `beard.lucksrei.com` and `stockport.lucksrei.com` both answer 200 (StockPort title "StockPort System", confirmed in its repo `product.json`). They are app/login hosts, never sales pages. |
| Store apps | **Confirmed live on 2026-11-05 (this review):** App Store lookup API returns both apps (Beard 1.0.1 id6828040621, StockPort 1.0.0 id6825179571, seller "Lucas Diogo Franca", Brazil); both Google Play pages render the title, developer and an **Instalar** button, while a bogus package returns 404. Availability was checked for Brazil only. The pages mention the stores as plain text links in "Onde usar", with no badges, and always as secondary to the Web access. |
| `sistemas.lucksrei.com` | Does not resolve (curl exit 000). Not provisioned. |
| Beard product facts | Internal ERP; public booking was retired (`docs/public-booking.md`); grace 7 days configurable (read-only/export by permission, then block). |
| StockPort product facts | From `docs/business-rules.md` / `status.md`: products/categories, camera scanner (Android/iOS) + manual code, stock entries/adjustments/history/low stock, POS with Pix/cash/debit/credit/other and change, PDF receipt (not fiscal), cash register, customers, suppliers, reports, CSV export, roles with cost/profit hidden from staff. **No fiscal documents.** No documented grace period (only "expired" derived from `expires_at`), so none is claimed. |
| Existing analytics | The portfolio has first-party visit counting (D1). No GA/Meta/Ads tags anywhere. |
| Checkouts | All 8 Hotmart URLs answer 200 (proves the page loads, **not** that each offer has the right price/period: confirm with one visit per offer in the Hotmart phase). Whop 2/2 answer 200. Payhip returns 403 to automated requests (bot block, unverified). Mercado Livre StockPort 30d redirects automated clients to a login wall (unverified). |
| **Missing data** | **Beard Mercado Livre (4 listings): not recovered.** Searched: both product repos and docs, the live portfolio, a web search (no results for the seller/product) and the Mercado Livre listing/seller pages (login wall; no sign-in was attempted). The owner must supply the four URLs. The Beard page shows Whop and Payhip only; StockPort shows its one known Mercado Livre listing, labelled "30 dias". When the links arrive: add them to `marketplaces` in `tools/systems/data.mjs` and rebuild. |
| Screenshots | Beard: existing approved real captures (6 + 2 hero). StockPort: raw real captures from `stockport-system/docs/screenshots-ux2` (780×1638, demo company data, labelled as such). The Play/App Store marketing frames were **not** used because they contain headlines and device mockups. **No desktop-resolution StockPort capture exists** (only 780×487); a 1280px web capture of dashboard/POS is the one image worth obtaining. |

## 2. Architecture decision

* `systems/` is a **separate static Worker** `lucksrei-systems` (`wrangler.systems.jsonc`, assets only: no script, no D1, no rate limits). Static asset requests are free and unlimited on Workers; there is no cost.
* Why not reuse `lucksrei-site`: its assets root is `./` and its Worker runs for `/api/*`. Serving a second hostname from it would need `run_worker_first: ["/*"]` (a billable Worker invocation per asset) or host rewriting, and any mistake would touch the portfolio, the visits D1 and the contact form. A separate Worker isolates blast radius and rollback.
* `systems/` is in `.assetsignore`, so `lucksrei.com/systems/...` does **not** exist and the main Worker is byte-for-byte unaffected. `wrangler.systems.jsonc` is ignored too.
* Pages are **generated** by `node tools/systems/build.mjs` from `tools/systems/data.mjs` (single product/plan/FAQ/link source) and committed, matching the repo pattern (committed HTML, no build in deploy). `tests/systems.test.js` fails if committed output is stale.
* Adding a product = one entry in `data.mjs` + its images under `systems/assets/img/<slug>/`; the catalog grid, sitemap, footer and page template update on build.
* Identities by `data-theme` tokens in one `systems.css`: `lucksrei` (graphite/gold), `beard` (graphite/copper/cream), `stockport` (navy/blue/white). Outfit font self-hosted (same file as the portfolio).
* Supabase / Resend / forms: **not used.** The showcase has no sign-up, lead capture or login; support is `mailto:` and `lucksrei.com/support/`. Nothing justifies storing personal data. If lead capture is wanted later, reuse the existing `/api/contact` Worker (Turnstile + rate limit) rather than a new Supabase table.
* i18n: pt-BR only on purpose (launch priority). The portfolio's en/es machinery was not reused to avoid half-translated sales pages. `lang="pt-BR"` is set; add `/en/` later with `hreflang`.
* CSP (`systems/_headers`): `default-src 'self'; script-src 'self'; style-src 'self'; style-src-attr 'none'; img-src 'self' data:`. No inline script/style/handlers. The Cloudflare-injected script CSP noise seen before is pre-existing and unrelated.

## 3. URL matrix

| Role | URL | State |
|---|---|---|
| Portfolio | `https://lucksrei.com` | live, untouched |
| Showcase home | `https://sistemas.lucksrei.com/` | **future** (needs domain) |
| Beard sales | `https://sistemas.lucksrei.com/beard/` | **future** |
| StockPort sales | `https://sistemas.lucksrei.com/stockport/` | **future** |
| Old Beard sales | `https://lucksrei.com/beard/` | live; keep until migration |
| Old StockPort sales | `https://lucasdiogo1234.hotmart.host/stockport-system` | live; keep (not redirectable: Hotmart-hosted) |
| Beard app/login | `https://beard.lucksrei.com` | live; never redirect |
| StockPort app/login | `https://stockport.lucksrei.com` | live; never redirect |
| Checkout | `pay.hotmart.com/M108332227C?off=…` (Beard), `…/Y108188423I?off=…` (StockPort) | live; 4 offers each |
| Alternatives | Whop, Payhip (both products), Mercado Livre (StockPort 30d; Beard pending) | live / partly unverified |
| Support/legal | `lucksrei.com/support/`, `/terms/`, `/privacy/` | live |

## 4. Publishing

Done on 2026-11-05. See [PUBLISHING.md](PUBLISHING.md): what was published, how to deploy again, rollback, the Cloudflare bot-script/CSP note and the remaining items.

## 5. Migration plan (separate phase, after step 4 is validated)

| Old | New | Action | Notes |
|---|---|---|---|
| `lucksrei.com/beard/` | `sistemas.lucksrei.com/beard/` | 301 (add one rule to `_redirects`) | Keep the old page until Hotmart/marketplace/ads links are updated; check Search Console first. Old page has `canonical` to itself today; switch it only when redirecting. |
| Hotmart external page (Beard) | `/beard/` | update the product's external page in Hotmart | page, not checkout URL; not done now |
| Hotmart external page (StockPort) | `/stockport/` | same | keep Hotmart Pages live until confirmed |
| `hotmart.host/stockport-system` | — | keep | cannot redirect; delete only with owner approval after traffic review |
| App hosts | — | **never redirect** | login and activation links live there |
| Portfolio `/apps/`, `/projects/*` | add links to the showcase | optional | not in this PR |

Impact: ads must use `sistemas.lucksrei.com/<product>/` as the final URL (UTMs do not change the canonical or create duplicate pages). Support must know both pages exist during the overlap.

## 6. Conversion tracking

See [TRACKING.md](TRACKING.md): consent behaviour, event semantics (interactions only, custom events, no Lead/InitiateCheckout/Purchase), UTM/`sck` strategy with what Hotmart documents and what is still unproven, the safe design for real purchase conversions, CSP changes and the missing data.

## 7. Validation

* `node tests/systems.test.js` plus all existing tests: generated files fresh; 4 plans x 2 products with exact price, per-day cost and Hotmart offer; canonical; one h1; no forbidden promises; no inline script/style/handlers; assets and `rel=noopener`; hero image not lazy; strict CSP; no tracking IDs; main Worker ignores `systems/`; tracking silent without consent; no conversion events; `sck` within Hotmart limits.
* Real Chrome, 9 widths (320 to 1920) x 3 pages: zero horizontal overflow, console errors or failed requests; every gallery tab image decoded (each tab clicked).
* **Lighthouse 12, served by `wrangler dev` (real workerd, real `_headers`), headless Chrome 156, default throttling (mobile = simulated slow 4G + 4x CPU; desktop preset), consent banner visible.** Local network, so absolute LCP is optimistic; re-run on the hosted copy.

| Page | Form factor | Performance | Accessibility | Best practices | SEO | LCP | CLS | TBT |
|---|---|---|---|---|---|---|---|---|
| `/` | mobile | 100 | 100 | 100 | 100 | 1.5 s | 0 | 0 ms |
| `/` | desktop | 100 | 100 | 100 | 100 | 0.5 s | 0 | 0 ms |
| `/beard/` | mobile | 100 | 100 | 100 | 100 | 1.8 s | 0 | 0 ms |
| `/beard/` | desktop | 100 | 100 | 100 | 100 | 0.5 s | 0 | 0 ms |
| `/stockport/` | mobile | 99 | 100 | 100 | 100 | 2.1 s | 0 | 0 ms |
| `/stockport/` | desktop | 100 | 100 | 100 | 100 | 0.6 s | 0 | 0 ms |

  No performance/accessibility/best-practice/SEO audit failed except Lighthouse's informational "network dependency tree" insight. Nothing needed fixing, so no complexity was added.
* **Not done**: Safari/Firefox, a purchase through any checkout, hosted-copy Lighthouse.

## 8. Differences from the previous landings (for the visual review)

* **Beard** (`lucksrei.com/beard/` stays as is): same copy, offers, FAQ and real screenshots; new header navigation, "O que costuma atrapalhar" section, **screenshot stage** (large screen with module tabs and click-to-zoom instead of six small thumbnails), per-day cost on every plan, "Menor custo por dia" replaces "Boa escolha"/"Melhor valor", other-platform block (Whop, Payhip), store text links, cookie banner, strict CSP.
* **StockPort** (Hotmart Pages page stays as is): new page with its own blue identity and the official logo; raw real captures instead of designed store frames; no claim about fiscal documents or a grace period.
* **Institutional home**: new catalog in graphite/gold with the official wordmark and crown; two product cards; scales to more products from `data.mjs`.
* Screenshots: `docs/systems/screenshots/` (desktop 1440 and mobile 390, fold and full page, three pages).
