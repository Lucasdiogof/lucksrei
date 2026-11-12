# Legitimate-interest assessment (LIA): aggregated measurement on sistemas.lucksrei.com

Date: 12 Nov 2026. Controller: Lucas Diogo França (Lucksrei). Basis: LGPD art. 7, IX (legitimate interest). Scope: `POST /m`, table `lx_hits` (D1 `lucksrei-systems-hits`). Not a legal opinion: it records the owner's reasoning; review it if the scope changes.

## 1. Purpose
Know whether paid and organic visits reach the Beard System and StockPort System sales pages and the Hotmart links, per allow-listed campaign, to decide how to spend a small advertising budget and to find broken pages. GA4 and the Meta Pixel only see visitors who click Aceitar, so without this counter most traffic is invisible.

## 2. Necessity
- Only counters per (UTC hour, event pv|plans|checkout, product, allow-listed source/medium/campaign/content, referrer class, plan days). No person-level row exists.
- Not collected or kept: IP, user agent, cookies, device storage, any identifier, query string, referrer URL, gclid/fbclid, unlisted UTM values (become `other`/`none`), email, name, anything from Hotmart.
- Less intrusive alternatives checked: Cloudflare Web Analytics and zone analytics (no campaign data), GA4/Pixel only with consent (blind to most visitors). Counting server requests of the static pages was rejected (it would put every page view inside the Free plan limit).
- Retention: a daily job deletes rows older than 399 days, so no row outlives 400 days.

## 3. Balance against the visitor's rights and expectations
- A visitor of a sales page reasonably expects the owner to count visits; the data cannot identify, single out or follow anyone; no profile, no sharing, no sale, no third-party recipient (Cloudflare hosts the service as operator).
- Risk to the visitor is minimal: no identifier, no cross-site or cross-visit linkage, no effect on the visitor.
- Respect for signals: Global Privacy Control and Do Not Track = nothing is counted. Declining the banner does not disable the counter (it identifies no one) but also never loads GA4/Pixel/any third-party tag.
- Opt-out beyond GPC/DNT: contact in the privacy policy; counters cannot be matched to a person, so individual erasure is not technically possible and is stated as such.

## 4. Transparency
`privacy/index.html` section 3.1 (pt/en/es) describes the counter, the legal basis, that it runs even if cookies are declined, what is not kept and the 400-day maximum. That page must be live before the Worker is deployed.

## 5. Safeguards
Origin check, body cap of 400 bytes (stream-enforced), allow-lists, rate limit per IP (in memory, hashed), answer always 204, no cookies, `credentials: omit`, tests in `tests/systems-measure.test.js` and `tests/browser/systems-measure.mjs`.

## 6. Conclusion and triggers for a new assessment
The processing passes the necessity and balancing tests under the limits above. A new assessment (and consent where applicable) is required before: storing any identifier or IP, fingerprinting, per-person funnels, sending data to a third party, or widening the allow-lists beyond campaign labels.
