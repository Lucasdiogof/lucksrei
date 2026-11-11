# Tracking and consent

**Status (10 Nov 2026): GA4 is ON for the sales pages; Google Ads is OFF; Meta Pixel `1159174163259187` is ON for visitors who click Aceitar once PR `feat/systems-meta-pixel` is merged and `lucksrei-systems` is deployed (the id is already in `tracking-config.js`; merge + deploy activates it).** Meta Pixel: loads only after **Aceitar**, `autoConfig` off (no automatic button/form/microdata events), no advanced matching, only our own events (`PageView` with `product`, custom `PlansView`/`CheckoutLinkClick`/...), each with a random `eventID` so a future Conversions API copy can deduplicate. Revoking calls `fbq('consent','revoke')` and removes `_fbp`/`_fbc`; accepting again on the same page calls `fbq('consent','grant')` without a second `PageView`. Beard and StockPort share one Pixel and are told apart by the `product` parameter. No `Purchase`/`Lead`/`InitiateCheckout` from the site, ever: real purchases come from Hotmart (approved order) and, when integrated, are sent server-side with the Hotmart transaction id as `event_id`. Test: `node tests/browser/systems-meta.mjs` (fake id, Facebook stubbed; covers decline, accept, revoke, re-accept).

(GA4 notes follow.)

**GA4:** GA4 account `415826588` (Lucksrei Systems), property `563751558` (Lucksrei — Comercial, America/Sao_Paulo, BRL), web stream "Lucksrei Systems — Vendas", Measurement ID `G-629PGJE5CZ` (public id, safe in the repo). One property for both products: **Beard and StockPort are separated by the `product` parameter on every event and by page path** (`/beard/`, `/stockport/`). Register `product`, `plan`, `days`, `where` as event-scoped custom dimensions in GA4 to report on them.

What GA4 does here: loaded only after **Aceitar** (no Consent Mode, no tag before consent); `send_page_view:false` kept, and **no manual `page_view` is sent to GA4** (11 Nov 2026 fix: the stream-level Google tag setting sends an automatic `page_view` (no `product`) regardless of `send_page_view:false`, so the manual one with `product` made 2 per visit; now the automatic one is the only one). Beard x StockPort are separated in GA4 by `page_location` (`/beard/` vs `/stockport/`); `product` stays on `plans_view`, `checkout_link_click` and the other events; Google signals and ad personalisation **off**; declining (or revoking in "Preferências de cookies") deletes the `_ga`/`_ga_*` cookies. **Measured in production (10 Nov 2026): even with `cookie_domain` set, the Google tag writes `_ga` and `_ga_629PGJE5CZ` on `.lucksrei.com`** (the property-level tag settings win). So revocation expires them on the host and on the parent domain, touching only those two names. The main site `lucksrei.com` does not load GA today; if it ever does, it would share this `_ga` cookie. CSP opened only for `www.googletagmanager.com` (script), `*.google-analytics.com` / `*.analytics.google.com` (connect, img). New event `plans_view` fires once when the plans section is seen (plan interest); `checkout_link_click` carries product, days, price, plan (`beard-30`...). The Privacy page (section 3.1, pt/en/es) describes the tool, cookies, purpose and consent.

Verification: `node tests/browser/systems-ga4.mjs` (Playwright, desktop + iPhone 13 viewport, decline / undecided / accept / revoke, CSP violations, duplicates). It stubs every Google request: no test hit reaches the real property.

Dedup between tools: GA4 never receives sales from the site. Real purchases come only from Hotmart (approved order); when conversions are later sent to GA4/Meta/Ads, dedupe on the Hotmart transaction id, and do not also fire a browser purchase event.

---
(Original design notes below.)


`systems/assets/js/tracking-config.js` holds `ga4` (set), `googleAds`, `metaPixel` (set to `1159174163259187`). Empty ID = that tool never loads. Nothing is sent, loaded or even queued before the visitor clicks **Aceitar**; **Recusar** stores a denial. The choice is kept in `localStorage` (`lx_consent`), reopened by "Preferências de cookies" in the footer.

## Event semantics (what each event does and does not prove)

The site only reports **interactions**. It never reports a conversion.

| Site event | GA4 | Meta | Meaning |
|---|---|---|---|
| `page_view` | none (automatic `page_view` from gtag.js, no `product`) | `PageView` (standard) | the page was viewed after consent |
| `cta_click` (`where`) | `cta_click` | custom `CtaClick` | a CTA to scroll/navigate inside the page |
| `checkout_link_click` (`product`, `days`, `price`, `currency`) | `checkout_link_click` | custom `CheckoutLinkClick` | the visitor **clicked a link to Hotmart**. It does not prove the checkout opened, started or was paid |
| `marketplace_click` (`marketplace`) | `marketplace_link_click` | custom `MarketplaceLinkClick` | outbound click to Whop/Payhip/Mercado Livre |
| `store_click` (`store`) | `store_link_click` | custom `StoreLinkClick` | outbound click to Google Play / App Store |
| `app_link_click` | `app_link_click` | custom `AppLinkClick` | outbound click to the web app address |

Deliberately **not** emitted: GA4 `begin_checkout`, `purchase`, `generate_lead`; Meta `Lead`, `InitiateCheckout`, `Purchase`, `AddToCart`, `CompleteRegistration`. `tests/systems.test.js` fails if they appear. Funnel stages: page view → CTA/plan interest (`cta_click`) → outbound click (`checkout_link_click`) → *checkout started* and *purchase* exist **only in Hotmart** (below).

Google Ads: no conversion tag is sent. If a conversion is wanted before real purchases are importable, use `checkout_link_click` only as a **secondary/observation** metric (never as the optimisation goal: clicks on a payment link are cheap and unrelated to revenue).

## UTMs, `sck`, `src` and Hotmart (what is evidenced)

Source: Hotmart Help Center, "Como posso identificar a origem das minhas vendas" ([pt-br](https://help.hotmart.com/pt-br/article/216441797/como-posso-identificar-a-origem-das-minhas-vendas-), [en](https://help.hotmart.com/en/article/216441797/how-can-i-track-the-source-of-my-sales-on-hotmart-)) and the webhook docs ([v2](https://developers.hotmart.com/docs/en/2.0.0/webhook/purchase-webhook/)).

* **`sck`** is the parameter for *producers* whose campaigns go straight to the payment page: this is our case (`pay.hotmart.com/...`). **`src`** is for affiliates / alternative sales pages. The site therefore sets **`sck`**, not `src`. Limits per the help page: up to 30 characters, `|` separates parts, the English help says `_` is not allowed (reserved).
* Format used (since `feat/checkout-attribution`): `sck=<b|s>|<utm_source>|<utm_campaign>|<utm_content>` cut to 30 chars (e.g. `b|meta|bd-teste1|comissao`; `b`=beard, `s`=stockport). The plan is not in `sck` because the Hotmart offer (`off`) already identifies it; this leaves room for the ad angle (`utm_content`). Keep `utm_campaign` <= 12 and `utm_content` <= 8 chars so `s|google|<campaign>|<content>` never truncates. UTMs are sanitised (letters, digits, `.`, `-`, 20 chars), kept **in memory only** (no cookie, no storage), and `utm_source/medium/campaign/content` are also forwarded to the checkout URL. Click ids (`gclid`, `fbclid`) are never forwarded. Production check 11 Nov 2026: `pay.hotmart.com` keeps `sck`/`utm_*` in the URL after load (adds `bid`); arrival in sales reports is still unproven. Test: `PW_CHANNEL=chrome node tests/browser/systems-attribution.mjs`.
* Where Hotmart says it shows them: Sales management → *Dashboard de Origem de Vendas* (tabs UTM/SCK/SRC), the sales export ("Código SCK"/"Código SRC") and Hotmart Analytics. The webhook v2 `origin` object *may* carry `sck`, `src` and `xcod`.
* **Not verified, to test with one real (or sandbox) purchase before any claim:** that the checkout preserves `utm_*`, that `sck` arrives intact with `|`, and the exact report/webhook field names in this account. Until then the honest statement is: *the site hands the campaign context to Hotmart in the documented parameter; attribution of sales in Hotmart reports is expected but not yet proven.*
* **Not possible today:** attributing a sale to a specific Google/Meta ad click inside Google Ads/Meta. That needs the conversion integration below. Hotmart's own pixel settings (per product) are a separate, untested path.
* Canonical tags ignore query strings, `robots`/sitemap list only clean URLs, so UTMs create no duplicate pages. Final URLs for ads: `https://sistemas.lucksrei.com/beard/` and `/stockport/` with UTMs appended by the ad platform.

## Real conversions (not implemented; needs owner decisions)
Only Hotmart knows a purchase happened. Safe design if wanted: Hotmart webhook (v2) → one Worker route that (1) checks the `X-HOTMART-HOTTOK` header against a secret in constant time, (2) ignores anything but approved-purchase events, (3) deduplicates on the transaction id (D1 or KV), (4) forwards a hashed, minimal event to Meta Conversions API and/or Google Ads offline conversion using the `sck`/`utm` values. Secrets live in Worker secrets, never in public JS. No personal data is stored beyond the transaction id. Cost: within free tiers at this volume (to confirm). Alternatively use Hotmart's built-in Meta/Google integrations if the product settings offer them; check in the Hotmart phase.

## Enabling later (owner action, not now)
1. Fill the IDs in `tracking-config.js`.
2. Widen the CSP in `systems/_headers` only as much as needed: `script-src 'self' https://www.googletagmanager.com https://connect.facebook.net`; `connect-src 'self' https://www.google-analytics.com https://*.analytics.google.com https://www.googletagmanager.com https://www.facebook.com https://connect.facebook.net`; `img-src 'self' data: https://www.google-analytics.com https://www.facebook.com https://*.googletagmanager.com`.
3. Update the Privacy page text to describe measurement/advertising cookies and processors (the banner links to `/privacy/`, which does not cover them today). Do not enable before this.
4. Keep Consent Mode off (no tag before consent). Verify in a real browser: decline → no requests to Google/Meta; accept → only the configured tools load.

## Missing before ads can be measured
GA4 measurement ID (and its link to Google Ads), Google Ads conversion goal decision, Meta Pixel ID and the verified domain `lucksrei.com`, Hotmart pixel/integration settings, one test purchase to confirm `sck` arrival, and the Privacy text.
