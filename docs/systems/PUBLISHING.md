# Publishing sistemas.lucksrei.com (nothing here has been run)

Prerequisite: owner approval, merge of the PR, green CI. Order matters: review a hosted copy first, only then attach the domain.

## Isolation (verified)
* `wrangler.systems.jsonc`: Worker `lucksrei-systems`, `assets.directory ./systems`, **no `main`, no D1, no rate limits, no routes**. `workers_dev:false`, `preview_urls:false` by default.
* `.assetsignore` lists `systems` and `wrangler.systems.jsonc`, so the existing Worker `lucksrei-site` (lucksrei.com, D1 visits, contact form) never uploads or serves them. No existing config, route or binding is edited by this PR.
* The apps (`beard.lucksrei.com`, `stockport.lucksrei.com`) are other projects and are not touched.
* `npx wrangler dev --config wrangler.systems.jsonc` was run locally (real workerd): the config is valid, `_headers` apply (CSP, HSTS, nosniff, frame deny), `404.html` is served for unknown paths. This is a rehearsal only, not a hosted test.

## Costs and limits (checked on Cloudflare docs, 2026-11-05)
* Static asset requests are **free and unlimited** on Free and Paid plans ([billing](https://developers.cloudflare.com/workers/static-assets/billing-and-limitations/)). This Worker has no script, so no request is billed as a Worker invocation. Storing assets has no extra cost.
* Static assets per Worker version: 20,000 files (Free) / 100,000 (Paid), 25 MiB per file ([limits](https://developers.cloudflare.com/workers/platform/limits/)). The showcase is 36 unique assets after deduplication (47 files), largest 270 KB.
* Free plan: 100,000 Worker requests/day applies only to requests that run a script. Here none do. (Contrast: serving this host from `lucksrei-site` with `run_worker_first` would count against that limit.)
* Custom domains: up to 100 per zone; no fee is documented for adding one. **I could not read the account's plan or billing from here**; confirm in the dashboard (Workers & Pages → Plans) before relying on "free". Workers Builds (CI) has its own monthly build-minute allowance; the build for this Worker is a plain `wrangler deploy` with no build step.
* SSL: Cloudflare issues the certificate automatically for a Custom Domain on a zone it manages.

## Step 1: hosted review copy (done on 2026-11-05 for PR #25; findings are real, not assumed)

Findings from actually doing it:
* `wrangler versions upload` **fails for a Worker that does not exist** ("run the `deploy` command first"). The Worker must be created once with `wrangler deploy`. With `workers_dev:false` and no routes that first deploy has **no reachable URL** ("No targets deployed").
* With `preview_urls:false` (the committed config) `versions upload --preview-alias` succeeds but prints **no preview URL**. The setting is non-versioned: it only takes effect after a `wrangler deploy` with `preview_urls:true`. After that, `versions upload --preview-alias review` prints `https://review-<worker>.<account-subdomain>.workers.dev` and a per-version URL. Both are **public** by default.
* Cloudflare Access on a Worker (dashboard → Worker → Access tab) needs Zero Trust enabled on the account. It was **not** enabled here ("Configure o Zero Trust para esta conta"); enabling it is an account-wide change, so it was not done.
* Protection actually used: the isolated Worker `lucksrei-systems-preview` runs a small **temporary Basic-auth gate script** (kept outside the repo) in front of the same `systems/` assets, with the password in a Worker secret, `X-Robots-Tag: noindex` and `no-store`. Verified: no password or a wrong one gives 401 on every path, including images; the right one gives 200. A Worker that was ever uploaded without the gate was deleted and recreated gated, so no ungated version URL exists (old ones return 404).
* Consequences: the preview Worker has a script, so its requests are Worker requests (free tier: 100,000/day; irrelevant for a review). It does not use D1, KV or any binding, and it does not touch `lucksrei-site`, DNS, routes or the apps. **Delete it after the review**: `npx wrangler delete --name lucksrei-systems-preview` (removes every version and URL).

To repeat it later: create the Worker once with `wrangler deploy`, set the secret with `wrangler secret put PREVIEW_PASSWORD`, then `wrangler versions upload --preview-alias review` using a config with `preview_urls:true` (never commit that variant).

Review checklist on the hosted copy: the three pages at 390 and 1440 px, `curl -I` headers, gallery tabs, cookie banner (decline, then accept with no IDs configured: no calls to Google/Meta), every checkout link points to the right Hotmart offer and price **without clicking through to pay**, `/robots.txt`, `/sitemap.xml` (they name the final domain on purpose), 404 page, then Lighthouse on the hosted URL.

## Step 2: attach the domain (separate approval)
1. Worker → Settings → Domains & Routes → **Add → Custom Domain** → `sistemas.lucksrei.com`. Cloudflare creates the DNS record and certificate. No wildcard, no change to `lucksrei.com`, `beard.`, `stockport.` records. Check the zone for an existing `sistemas` record first (none was observable: the name does not resolve today).
2. Wait for "Active"; `curl -I https://sistemas.lucksrei.com/beard/`.
3. Turn off the review access (disable Version URLs / `workers_dev`), keep Cloudflare Access only if you want a private period.
4. Search Console: add `sistemas.lucksrei.com` as a Domain/URL-prefix property, submit `/sitemap.xml`.

## Rollback
* Domain problem: remove the Custom Domain (portfolio and apps unaffected; DNS record is removed by Cloudflare).
* Bad content: Worker → Deployments → roll back to the previous version, or revert the commit and let the build run.
* Nothing else needs undoing: no data store, no secrets, no DNS edits to other names.

## Not part of this procedure
Hotmart external pages, redirects from `lucksrei.com/beard/`, marketplace edits, tracking IDs and ads campaigns: see README §5 and TRACKING.md, each needs its own approval.

## Hosted Lighthouse: known limitation of the preview (05/11/2026)
Lighthouse 12.8.2 against the password-protected preview URL fails on every run with `PROTOCOL_TIMEOUT (CSS.enable)` (tried: shared Chrome, own Chrome, fresh profile, 120-180 s protocol timeout). The same Lighthouse and Chrome on the same pages served locally complete all four categories at 100 (mobile, home). Partial hosted data (performance 100, accessibility 100) is not a full result: Best Practices is missing and SEO reads 69 because `is-crawlable` fails on the `X-Robots-Tag: noindex` that `*.workers.dev` previews add. That is an environment property, not a page defect, and the preview protection and noindex were deliberately left untouched. Run the hosted Lighthouse again on the final domain, where the page is public and indexable.
