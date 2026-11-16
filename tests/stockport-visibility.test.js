"use strict";
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const root = path.join(__dirname, "..");
const read = (file) => fs.readFileSync(path.join(root, file), "utf8");
assert(!/stockport/i.test(read("sitemap.xml")), "withdrawn product must not be in the portfolio sitemap");
assert(!/stockport/i.test(read("systems/sitemap.xml")), "withdrawn product must not be in the commercial sitemap");
assert(!/^\/projects\/stockport(?:\/|\s)/m.test(read("_redirects")), "retired case URL should not redirect to legal pages");
assert(!fs.existsSync(path.join(root, "projects/stockport/index.html")), "retired case page must remain absent");
for (const slug of ["account-deletion","data-deletion","licensing","privacy","support","terms"]) {
  const html = read("projects/stockport/" + slug + "/index.html");
  assert(/<meta name="robots" content="noindex, follow">/.test(html), slug + ": legal page must remain reachable but not indexable");
}
console.log("ok — withdrawn product excluded from sitemaps and legal pages marked noindex");
