# Publishing sistemas.lucksrei.com (nothing here has been run)

Prerequisite: owner approval, merge of the PR, green CI. Order matters: review a hosted copy first, only then attach the domain.

## Isolation (verified)
* `wrangler.systems.jsonc`: Worker `lucksrei-systems`, `assets.directory ./systems`, **no `main`, no D1, no rate limits, no routes**. `workers_dev:false`, `preview_urls:false` by default.
* `.assetsignore` lists `systems` and `wrangler.systems.jsonc`, so the existing Worker `lucksrei-site` (lucksrei.com, D1 visits, contact form) never uploads or serves them. No existing config, route or binding is edited by this PR.
* The apps (`beard.lucksrei.com`, `stockport.lucksrei.com`) are other projects and are not touched.
* `npx wrangler dev --config wrangler.systems.jsonc` was run locally (real workerd): the config is valid, `_headers` apply (CSP, HSTS, nosniff, frame deny), `404.html` is served for unknown paths. This is a rehearsal only, not a hosted test.

## Costs and limits (checked on Cloudflare docs, 2026-11-05)
* Static asset requests are **free and unlimited** on Free and Paid plans ([billing](https://developers.cloudflare.com/workers/static-assets/billing-and-limitations/)). This Worker has no script, so no request is billed as a Worker invocation. Storing assets has no extra cost.
* Static assets per Worker version: 20,000 files (Free) / 100,000 (Paid), 25 MiB per file ([limits](https://developers.cloudflare.com/workers/platform/limits/)). The showcase has ~55 files, largest 270 KB.
* Free plan: 100,000 Worker requests/day applies only to requests that run a script. Here none do. (Contrast: serving this host from `lucksrei-site` with `run_worker_first` would count against that limit.)
* Custom domains: up to 100 per zone; no fee is documented for adding one. **I could not read the account's plan or billing from here**; confirm in the dashboard (Workers & Pages → Plans) before relying on "free". Workers Builds (CI) has its own monthly build-minute allowance; the build for this Worker is a plain `wrangler deploy` with no build step.
* SSL: Cloudflare issues the certificate automatically for a Custom Domain on a zone it manages.

## Step 1: hosted review copy (no custom domain, no public indexing)
Goal: see the real hosted pages without exposing them or touching DNS.
1. Create the Worker from the repo in the dashboard (Workers & Pages → Create → Import from GitHub, repo `Lucasdiogof/lucksrei`), name `lucksrei-systems`, root directory `/`, **deploy command `npx wrangler deploy --config wrangler.systems.jsonc`**, no build command. Important: if a *non-production branch* build is enabled, set its command to `npx wrangler versions upload --config wrangler.systems.jsonc`.
2. Preferred, no deployment at all: from a machine logged into Cloudflare, `npx wrangler versions upload --config wrangler.systems.jsonc --preview-alias review` produces a **Version URL** (`review-lucksrei-systems.<subdomain>.workers.dev`) without promoting anything ([docs](https://developers.cloudflare.com/workers/configuration/previews/)). Version URLs are public unless protected: enable them only together with **Cloudflare Access** (Zero Trust → Access, one policy: the owner's e-mail) on that Worker's preview/Version URLs. Unverified: whether `versions upload` works for a Worker that has never been deployed; if it refuses, use the fallback.
3. Fallback: `workers_dev: true` in a **temporary** copy of the config, one `wrangler deploy`, protect the `*.workers.dev` URL with Cloudflare Access, review, then set it back to `false` and redeploy (or delete the Worker). The main site's `workers_dev:false` setting stays as is.
4. Review checklist on the hosted copy: the three pages at 390 and 1440 px, `curl -I` headers, gallery tabs, cookie banner (decline then accept with no IDs configured: no network calls to Google/Meta), every checkout link opens the right Hotmart offer and price (**the only check that proves the offers**), `/robots.txt`, `/sitemap.xml` (they name the final domain; that is correct), 404 page.
5. Run Lighthouse against the hosted URL (desktop and mobile). Local results are in README; hosted results may differ slightly.

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
