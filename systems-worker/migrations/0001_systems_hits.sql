-- Aggregated, cookie-less measurement of the sales pages (sistemas.lucksrei.com). Counters only: no IP, user-agent, cookie, id,
-- gclid/fbclid or full URL is ever stored. Every dimension is an allow-list value (see systems-worker/measure.mjs), so the
-- number of possible rows is bounded. A row = "this many events of this kind in this UTC hour". It counts page LOADS and
-- clicks, not people: the same person reloading counts twice.
CREATE TABLE IF NOT EXISTS lx_hits (
  hour     TEXT    NOT NULL,   -- 'AAAA-MM-DDTHH' (UTC)
  event    TEXT    NOT NULL,   -- pv | plans | checkout
  product  TEXT    NOT NULL,   -- beard | stockport
  source   TEXT    NOT NULL,   -- meta | google | teste | other | none  (utm_source, allow-listed)
  medium   TEXT    NOT NULL,   -- paid | cpc | other | none
  campaign TEXT    NOT NULL,   -- known campaign slugs | other | none
  content  TEXT    NOT NULL,   -- known ad angles | other | none
  ref      TEXT    NOT NULL,   -- facebook | google | other | none (class of the referrer host only)
  days     INTEGER NOT NULL DEFAULT 0, -- checkout only: 30 | 90 | 180 | 365, else 0
  n        INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (hour, event, product, source, medium, campaign, content, ref, days),
  CHECK (n >= 0)
) WITHOUT ROWID;
-- Retention: done automatically by the Worker cron (scheduled -> purgeOld, daily 03:17 UTC, 400 days). Manual equivalent:  DELETE FROM lx_hits WHERE hour < strftime('%Y-%m-%dT%H', 'now', '-400 days');
