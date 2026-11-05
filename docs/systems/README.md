# Lucksrei Systems showcase (sistemas.lucksrei.com)

Status: **implemented in the repo, not published.** Nothing remote was changed (no DNS, Worker, Custom Domain, Hotmart or marketplace edits).

## 1. Audit (verified on 2026-11-05; "unverified" is marked as such)

| Item | Finding |
|---|---|
| Repo / base | `Lucasdiogof/lucksrei`, built from `origin/main` 44fb787. The local `main` was ahead 57 / behind 167 and was not used. |
| Stack | Plain static HTML/CSS/JS, no bundler. One Worker `lucksrei-site` (`wrangler.jsonc`): `assets.directory "./"`, script only for `/api/*` and `/assets/video/*.mp4`, D1 + rate limits for visits/contact. `workers_dev:false`. |
| CI | `.github/workflows/site-tests.yml` runs every `tests/*.test.js` with Node 22. Deploy is Cloudflare Workers Builds on push to main (not visible in GitHub; see memory note: sometimes needs an empty "Trigger Workers build" commit). |
| Beard landing | `lucksrei.com/beard/` (PR #24, 71c463a), HTTP 200. Reused: copy, 8 Hotmart links, screenshots, hero, FAQ and the grace-period text. |
| StockPort landing | `lucasdiogo1234.hotmart.host/stockport-system`, HTTP 200 (Hotmart Pages). Kept as is; not the final home. |
| Web apps | `beard.lucksrei.com` and `stockport.lucksrei.com` both answer 200 (StockPort title "StockPort System", confirmed in its repo `product.json`). They are app/login hosts, never sales pages. |
| Store apps | App Store pages for both exist (HTTP 200, titles "Beard System" / "StockPort System"). Google Play URLs return 200 but Play titles were not readable without JS (**unverified**). The live portfolio already links all four. The showcase mentions them as text links, no store badges. |
| `sistemas.lucksrei.com` | Does not resolve (curl exit 000). Not provisioned. |
| Beard product facts | Internal ERP; public booking was retired (`docs/public-booking.md`); grace 7 days configurable (read-only/export by permission, then block). |
| StockPort product facts | From `docs/business-rules.md` / `status.md`: products/categories, camera scanner (Android/iOS) + manual code, stock entries/adjustments/history/low stock, POS with Pix/cash/debit/credit/other and change, PDF receipt (not fiscal), cash register, customers, suppliers, reports, CSV export, roles with cost/profit hidden from staff. **No fiscal documents.** No documented grace period (only "expired" derived from `expires_at`), so none is claimed. |
| Existing analytics | The portfolio has first-party visit counting (D1). No GA/Meta/Ads tags anywhere. |
| Checkouts | All 8 Hotmart URLs answer 200 (this proves the page loads, not that each offer has the right price: **to confirm in the Hotmart phase**). Whop: 2/2 answer 200. Payhip: 403 to automated requests (bot block; **unverified**). Mercado Livre StockPort 30d: reachable only through a Mercado Livre verification redirect (**unverified**). |
| **Missing data** | Beard's four Mercado Livre listings: no link found in the repos/docs. Listed as pending; the Beard page shows only Whop and Payhip. StockPort shows only the one known Mercado Livre listing (labelled "30 dias"). |
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

## 4. Publishing (needs owner approval; none of this was run)

1. Merge the PR. The main Worker build is unaffected (`systems/` ignored); run tests are green.
2. Cloudflare dashboard → Workers & Pages → Create → **Import from GitHub** (`Lucasdiogof/lucksrei`, the same repo); project name `lucksrei-systems`; deploy command `npx wrangler deploy --config wrangler.systems.jsonc`; no build command. (CLI alternative: `npx wrangler deploy --config wrangler.systems.jsonc`.)
3. Worker → Settings → Domains & Routes → **Add Custom Domain** `sistemas.lucksrei.com` (Cloudflare creates the DNS record and certificate; the zone is already on Cloudflare). Do not use a wildcard.
4. Verify: `/`, `/beard/`, `/stockport/`, `/sitemap.xml`, `/robots.txt`, headers (`curl -I`), a real checkout click per product, mobile.
5. Rollback: remove the Custom Domain (portfolio and apps are unaffected) or roll the Worker back to the previous deployment.
6. Submit `https://sistemas.lucksrei.com/sitemap.xml` in Search Console (new Domain property).

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

## 6. Conversion tracking (prepared, off)

* `systems/assets/js/tracking-config.js` has empty `ga4`, `googleAds`, `metaPixel`. **Empty = nothing loads.** No IDs are committed.
* A cookie banner (Recusar / Aceitar, equal weight; "Preferências de cookies" in the footer) stores the choice in `localStorage`. Before consent nothing is loaded, sent or queued.
* Events (after consent): `page_view`, `cta_click` (where), `checkout_click` (product, days, value, BRL), `marketplace_click`, `store_click`, `app_link_click`. GA4 names: `select_checkout` for the checkout click. Meta: `PageView`, `ViewContent`, `InitiateCheckout` (checkout click), `Lead` (marketplace click). **`checkout_click` is a click, never a purchase.** No purchase event exists in the showcase.
* UTMs: `utm_source/medium/campaign` are read in memory only (no cookie or storage) and forwarded to Hotmart as `src` and `sck` (`product_days_medium_campaign`), so the Hotmart sales report can attribute purchases to a campaign. Canonical URLs ignore query strings.
* **To enable** (owner action): fill the IDs, then widen `systems/_headers` CSP only as needed: `script-src 'self' https://www.googletagmanager.com https://connect.facebook.net`; `connect-src 'self' https://www.google-analytics.com https://*.analytics.google.com https://www.googletagmanager.com https://www.facebook.com https://connect.facebook.net`; `img-src 'self' data: https://www.google-analytics.com https://www.facebook.com https://*.googletagmanager.com`. Keep Consent Mode off (no tag before consent).
* **Real purchases** can only come from Hotmart: its Pixel/Conversions-API or webhook integration. Not implemented. A safe proposal if wanted: a Worker endpoint receiving the Hotmart webhook, verifying the `hottok` header in constant time, deduplicating on transaction id (D1), and sending Meta Conversions API / Google Ads offline conversions with the `sck`/`src` values; no personal data stored beyond the transaction id. Cost: free tier. Needs decisions and credentials from the owner.
* **Missing to start ads**: GA4 measurement ID, Google Ads conversion ID/label (and linked GA4), Meta Pixel ID and verified domain `lucksrei.com`, the Hotmart pixel settings, and LGPD wording approved for the Privacy page (the banner links to the existing `/privacy/`, which does not yet describe marketing cookies: **to update before enabling**).

## 7. Validation done

* `node tests/systems.test.js` (+ all existing tests): generated files fresh; 4 plans × 2 products with exact price, per-day cost and Hotmart offer; 8 checkout URLs per page; canonical; one h1; no forbidden promises; no inline script/style/handlers; local assets and `rel=noopener`; hero image not lazy; strict CSP; no tracking IDs; main Worker ignores `systems/`; tracking silent without consent and never emits a purchase; UTM → `src/sck`.
* Real Chrome on 9 widths (320, 375, 390, 428, 768, 1024, 1366, 1440, 1920) × 3 pages: zero horizontal overflow, zero console errors, zero failed requests, every image decoded after scrolling (checked for the lazy gallery).
* Screenshots: `docs/systems/screenshots/` (390 and 1440, fold + full page).
* **Not done**: Lighthouse/CLS numbers, Safari/Firefox, keyboard-walk of the lightbox by hand, real checkout purchase, real post-deploy test. Run Lighthouse on the preview after step 2.
