# Technical Skills assets and verification

The home skill grid is sourced from `assets/js/skills-data.js` and `assets/js/skills-details.js`. Its project references now follow the current app catalog rather than relying on the old four own products.

## Icon sources

Recognizable product marks added in this revision are vector paths from the maintained [Simple Icons](https://github.com/simple-icons/simple-icons) repository: getx, graphql, sqlite, maplibre, mapbox, googlemaps, whatsapp, zendesk, facebook, firebase, supabase. The SVG fills have been adapted for sufficient visibility on the existing dark skill tiles, while preserving their paths. These marks belong to their respective owners.

Where a tool or concept has no distinct verified mark (such as Offline-first, go_router, Freezed, WebView, barcode scanning and Supabase Edge Functions), the site uses a neutral technical pictogram; it is **not** labeled an official vendor logo. Existing original icons were preserved.

Check `node tests/skills.test.js` after updating technologies. Only connect skills to projects backed by published catalog or inspected code. Do not turn package mentions into claims of production launches.
