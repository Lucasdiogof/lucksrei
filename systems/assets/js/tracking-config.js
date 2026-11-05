/* Marketing IDs. Empty = that tool never loads. These are public identifiers (not secrets), but filling them also
 * requires the CSP additions listed in docs/systems/TRACKING.md. Nothing here ever runs before the visitor accepts. */
window.LX_TRACKING = {
  ga4: "",        // e.g. "G-XXXXXXXXXX"
  googleAds: "",  // e.g. "AW-XXXXXXXXXX"
  metaPixel: ""   // numeric Pixel ID
};
