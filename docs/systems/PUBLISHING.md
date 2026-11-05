# Publishing sistemas.lucksrei.com (published on 2026-11-05)

## Production state
| Item | Value |
|---|---|
| PR / merge | PR #25 `feat/sistemas-showcase`, merged as `74728fc` (merge commit, history kept, no force push) |
| Worker | `lucksrei-systems` (static assets only: `assets.directory ./systems`, no `main`, no D1, no rate limits, no secrets) |
| First production version | `81a9d6a2-f1a2-47ef-a5ab-057bd5f56224` |
| Custom Domain | `sistemas.lucksrei.com` -> `lucksrei-systems`, active. Cloudflare created the DNS record and the certificate. The name did not exist before. |
| URLs | https://sistemas.lucksrei.com/ , https://sistemas.lucksrei.com/beard/ , https://sistemas.lucksrei.com/stockport/ |
| Untouched | `lucksrei.com` (Worker `lucksrei-site`, still serves `/beard/`), `beard.lucksrei.com`, `stockport.lucksrei.com`, every other Worker and domain. Hotmart, Payhip, Whop, Mercado Livre: not edited. No redirects. |
| Tracking | GA4, Google Ads and Meta Pixel IDs are empty, so nothing loads. Only custom events exist, and only after consent. No Purchase/Lead/InitiateCheckout/begin_checkout. |

Account Custom Domain list (read from the Cloudflare API on the maintenance date): exactly one entry for `sistemas.lucksrei.com`, pointing at `lucksrei-systems`; no zone route competes with it. `wrangler.systems.jsonc` now declares that same domain (see "Deploying again").

## Isolation
* `.assetsignore` lists `systems` and `wrangler.systems.jsonc`, so `lucksrei-site` never uploads or serves them. Checked in production: `lucksrei.com/systems/` and `lucksrei.com/wrangler.systems.jsonc` return 404.
* `lucksrei.com`, `lucksrei.com/beard/`, `beard.lucksrei.com`, `stockport.lucksrei.com` returned the same status and size before and after the publication.
* Internal files are not served from the new host: `/wrangler.systems.jsonc`, `/_headers` and `/docs/...` return 404.

## Costs
Static asset requests are free and unlimited, and this Worker has no script, so no invocation is billed ([billing](https://developers.cloudflare.com/workers/static-assets/billing-and-limitations/)). No fee is documented for a Custom Domain. The account plan itself could not be read from the CLI; confirm in the dashboard (Workers & Pages -> Plans) if exact billing matters.

## What was tested in production (2026-11-05, real Chrome)
* 3 pages x 6 widths (320, 390, 768, 1024, 1440, 1920): no horizontal overflow, no broken image, one `h1` per page, no `meta robots`, no `X-Robots-Tag`, only same-origin requests, no HTTP error.
* Consent banner (first visit, accept, deny, not shown again), no third-party request, gallery tabs (arrows, Home, End), lightbox (Enter/Escape, focus returns), FAQ, anchors below the fixed header, all pages readable without JavaScript.
* 8 checkout links (4 per product): offer code and price match (30 d R$ 29,90 / 90 d R$ 79,90 / 180 d R$ 149,90 / 365 d R$ 269,90). Never clicked through, no purchase.
* SEO: title, description, canonical and Open Graph point at `sistemas.lucksrei.com`; `sitemap.xml` lists the 3 pages; `robots.txt` works; 404 page works.
* HTTPS valid, `http://` answers 301 to `https://`, CSP/HSTS/nosniff/frame-deny headers present.
* Lighthouse 12.8.2 (local Chrome headless, against the production URLs):

| Page | Mobile Perf / A11y / BP / SEO | Mobile LCP / CLS / TBT | Desktop Perf / A11y / BP / SEO | Desktop LCP |
|---|---|---|---|---|
| Home | 100 / 100 / 93 / 100 | 1.2 s / 0 / 0 ms | 100 / 100 / 93 / 100 | 0.4 s |
| Beard | 99 / 100 / 93 / 100 | 2.0 s / 0 / 0 ms | 100 / 100 / 93 / 100 | 0.4 s |
| StockPort | 99 / 100 / 93 / 100 | 2.3 s / 0 / 0 ms | 100 / 100 / 93 / 100 | 0.5 s |

The 93 in Best Practices comes only from the CSP console message described below.

## Preview
The temporary Worker `lucksrei-systems-preview` (Basic-auth gate) was deleted after the production checks (`wrangler delete`); its address now returns 404. If a protected preview is needed again, create a new isolated Worker with a gate script and a `PREVIEW_PASSWORD` secret, keep it out of the repo and delete it afterwards. Findings from the first round: `wrangler versions upload` needs the Worker to exist (`deploy` once), `preview_urls` is a non-versioned setting, `*.workers.dev` previews add `X-Robots-Tag: noindex` (which makes Lighthouse SEO/crawlable audits fail there, a property of the preview, not of the pages), and a gated Worker made hosted Lighthouse fail with `PROTOCOL_TIMEOUT (CSS.enable)`.

## Deploying again (keeps the Custom Domain)
Run from a clean checkout of `main`, after the PR is merged and CI is green:
```
node tools/systems/build.mjs          # regenerates systems/ (idempotent; commit the result)
node tests/systems.test.js            # and the other tests/*.test.js
npx wrangler deploy -c wrangler.systems.jsonc --dry-run   # validates config and the 47 asset files
npx wrangler deploy -c wrangler.systems.jsonc             # needs the owner's approval
```
* The Cloudflare account has several accounts: pass `CLOUDFLARE_ACCOUNT_ID=70b6ccb1877549c1c290d18664a7c7cb` (the one that owns the zone).
* The file declares the one Custom Domain `sistemas.lucksrei.com` that already exists, so `deploy` describes the same state instead of creating a second domain or route. This was checked statically (JSON validity, test, dry-run) and against the Cloudflare domain list; a second real deploy was **not** run as part of the maintenance (not authorized), so the "no change" message was not observed. After any deploy, check `https://sistemas.lucksrei.com/` and the Worker's Domains & Routes tab.
* Never add a `main`, bindings or `workers_dev: true` to this file. Never run `wrangler deploy` with the root `wrangler.jsonc` for this Worker (that is `lucksrei-site`).
* Pushing to `main` deploys only `lucksrei-site` (Workers Build). The showcase Worker is deployed by hand with the command above, unless a separate Workers Build is connected later.

## Rollback
* Bad content: Cloudflare dashboard -> Workers & Pages -> `lucksrei-systems` -> Deployments -> roll back to a previous version (or `npx wrangler rollback --name lucksrei-systems`), or revert the commit and deploy again. Only the first version `81a9d6a2...` existed at the time of writing, so a rollback target appears after the next deploy.
* Domain problem: remove the Custom Domain in the Worker's Domains & Routes (Cloudflare removes its DNS record). `lucksrei.com`, the apps and every other Worker are unaffected.
* Portfolio: the previous `lucksrei-site` version before the merge was `c8304b58-71a9-49a8-8b3b-2471c3dbd97a`.
* Nothing else needs undoing: no data store, no secrets, no DNS edits to other names.

## Cloudflare bot-detection script and the CSP console message
**Observed.** Every page of this host (and also `lucksrei.com` and `beard.lucksrei.com`, so it is zone-wide) receives, at the end of the HTML, an inline `<script>` injected by Cloudflare. It creates a 1x1 iframe whose script sets `window.__CF$cv$params` and would load `/cdn-cgi/challenge-platform/scripts/jsd/main.js` (Cloudflare's JavaScript Detections for bot scoring). Our CSP is `script-src 'self'` with no `unsafe-inline`, so Chrome blocks that inline script and logs: "Executing inline script violates the following Content Security Policy directive 'script-src 'self''". The inline code changes on every request, so a fixed hash cannot allow it.

**Is it harmless?** For visitors, yes: the page, the consent logic and every test passed with the script blocked, and no request to `/cdn-cgi/challenge-platform/` is made (checked in the network log). Effects: (1) one console error and one DevTools "issue", which costs 7 points of Lighthouse Best Practices (93 instead of 100); (2) Cloudflare's JS-based bot signal is not collected for these pages (the other bot signals still apply). It is a Cloudflare feature working against our stricter CSP, not a defect in the site and not an attack. The `cdn-cgi` script was not enabled by this project.

**Not done in this round (by decision):** the zone setting was not changed, protection was not disabled, and the CSP was not loosened. `unsafe-inline` would weaken the XSS protection of the whole page just to hide a message, so it is not recommended.

**Safe alternatives, if it has to be fixed later (each needs the owner's approval; the zone setting itself could not be read with the available token):**
1. In the Cloudflare dashboard (Security -> Bots, JavaScript Detections, or Bot Fight Mode depending on the plan), turn the JS Detections off only for `sistemas.lucksrei.com`, for example with a Configuration Rule on that hostname. It is zone-scoped, so do it as a rule and not as a global switch.
2. Check Cloudflare's current documentation for running JS Detections together with a strict CSP (nonce support). If it supports it, adopt it instead of option 1, since it keeps the bot signal.
3. Accept the message and document it (current state). Lighthouse then stays at 93 for Best Practices; the other categories are unaffected.

## Remaining items (not part of this maintenance)
* Search Console (owner action, later): add `sistemas.lucksrei.com` as a property, submit `/sitemap.xml`, inspect the three URLs. Not done.
* Privacy policy (`lucksrei.com/privacy/`) needs the cookie/measurement text before any pixel is enabled. Pixels and campaigns stay off; to enable them later follow [TRACKING.md](TRACKING.md) (CSP additions included).
* Beard Mercado Livre listing links are unknown and not invented; Payhip/Whop/Mercado Livre/Hotmart pages are reviewed in a separate phase.
* `lucksrei.com/beard/` still exists; redirects from old addresses are a separate, later decision.
* Preservation of the `sck` parameter through to Hotmart sales is not proven (see TRACKING.md).
