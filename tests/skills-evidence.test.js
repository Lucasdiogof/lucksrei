/* Regression: every technology exposed in /apps/ must point to the same project
 * in Technical Skills. This also checks a snapshot of inspected private app
 * pubspec.yaml files (2026-10-21), rather than guessing technologies from names.
 * Run: node tests/skills-evidence.test.js
 */
"use strict";
const fs = require("fs");
const path = require("path");
const vm = require("vm");
const root = path.join(__dirname, "..");
const D = require(path.join(root, "assets/js/skills-data.js"));
const errors = [];
const check = (truth, reason) => { if (!truth) errors.push(reason); };
const known = Object.fromEntries(D.ORDER.map(s => [s.id, s]));
const appSandbox = { window: {} };
vm.runInNewContext(fs.readFileSync(path.join(root, "assets/js/apps-data.js"), "utf8"), appSandbox);
const apps = appSandbox.window.LUCKSREI_APPS.apps;
const alias = { "emater-go-mobi": "emater" };
const publicTag = {
  "Flutter": ["flutter", "dart"],
  "Supabase": ["supabase", "postgresql"],
  "Supabase Realtime": ["supabase-realtime", "supabase", "postgresql"],
  "RLS": ["rls", "postgresql"],
  "Firebase": ["firebase"],
  "Cloudflare Workers": ["cloudflare-workers"],
  "TypeScript": ["typescript"],
  "Gemini": ["gemini"],
  "Edge Functions": ["edge-functions"],
  "Offline cache": [], // caching does not by itself prove Offline-first
  "Offline-first": ["offline-first"],
  "Encrypted SQLite": ["sqlite"],
  "WhatsApp API": ["whatsapp-api"],
  "MapLibre": ["maplibre"],
  "Real-time": [], // real-time feeds do not imply Supabase Realtime
  "GitHub Actions": ["github-actions"],
  "ML Kit": ["ml-kit"],
  "PostgreSQL": ["postgresql"],
  "Cubit/BLoC": ["bloc"],
  "BLoC Pattern": ["bloc"],
  "go_router": ["go-router"],
  "Freezed": ["freezed"],
  "In-App Purchase": ["in-app-purchases"],
  "Deep links": ["deep-links"],
  "GraphQL": ["graphql"],
  "SignalR": ["signalr"],
  "Modular packages": ["modular-packages"],
  "Biometria": ["biometrics"],
  "Sentry": ["sentry"],
  "OneSignal": ["onesignal"],
  "GetX": ["getx"],
  "gRPC": ["grpc"],
  "Firebase Cloud Messaging": ["firebase-messaging", "firebase"],
  "Cloud Messaging": ["firebase-messaging", "firebase"],
  "Remote Config": ["remote-config", "firebase"],
  "SQLite": ["sqlite"],
  "Zendesk": ["zendesk"],
  "Facebook Login": ["facebook-login"],
  "Micro-frontends": ["micro-frontends"],
  "Mapbox": ["mapbox"],
  "Sembast": ["sembast"],
  "Firebase Crashlytics": ["crashlytics", "firebase"],
  "ObjectDB": ["objectdb"],
  "REST API": ["rest-api"],
  "Offline sync": [], // offline sync is not proof of an Offline-first architecture
  "Google Maps": ["google-maps"],
  "Provider": ["provider"],
  "Chat com áudio": [], // no matching dedicated skill
  "Geolocalização": ["gps"],
  "PDF": ["pdf"],
  "Firebase RTDB": ["firebase-rtdb", "firebase"],
  "Firebase Auth": ["firebase-auth", "firebase"],
  "Google Places": ["google-maps"],
  "Pagamento com cartão": [], // no dedicated card-payment technology skill
  "Firestore": ["firestore", "firebase"],
  "Scoped Model": ["scoped-model"]
};
apps.forEach(app => {
  const project = alias[app.id] || app.id;
  (app.technologies || []).forEach(tag => {
    check(Object.prototype.hasOwnProperty.call(publicTag, tag), "Unknown catalog technology: " + app.id + " -> " + tag);
    (publicTag[tag] || []).forEach(skill => {
      check(known[skill] && known[skill].projects.includes(project),
        "Catalog says " + app.id + " uses " + tag + " but " + skill + " does not link to " + project);
    });
  });
});
// Source snapshots checked in repositories: they are implementation evidence,
// not proof that an unreleased feature is already live in the stores.
const sourceProjects = {
  "match-queue": { repo: "match-queue", yaml: "pubspec.yaml", pkgs: ["flutter_bloc","get_it","go_router","supabase_flutter","firebase_core","firebase_messaging","firebase_crashlytics"], functions: true, actions: true },
  "fan-hub": { repo: "fan-hub", yaml: "pubspec.yaml", pkgs: ["flutter_bloc","get_it","go_router","supabase_flutter","firebase_core","firebase_messaging","sentry_flutter","pdf"], functions: true, actions: true },
  "la-pelve": { repo: "la-pelve", yaml: "pubspec.yaml", pkgs: ["flutter_bloc","get_it","go_router","supabase_flutter","sqlite3","local_auth"], functions: true, actions: true },
  "aprovaura": { repo: "aprovaura", yaml: "pubspec.yaml", pkgs: ["flutter_bloc","get_it","go_router","supabase_flutter"], functions: true, actions: true },
  "busaogyn": { repo: "busaogyn", yaml: "app/pubspec.yaml", pkgs: ["flutter_bloc","maplibre_gl"], functions: false, actions: true },
  "orbijob": { repo: "orbijob", yaml: "app/pubspec.yaml", pkgs: ["flutter_bloc","get_it","supabase_flutter","google_mlkit_translation","firebase_core","firebase_messaging","webview_flutter"], functions: true, actions: true },
  "bebometro": { repo: "bebometro", yaml: "pubspec.yaml", pkgs: ["flutter_bloc","get_it","supabase_flutter","google_mlkit_text_recognition","geolocator"], functions: true, actions: true },
  "stockport": { repo: "stockport-system", yaml: "pubspec.yaml", pkgs: ["flutter_bloc","get_it","go_router","supabase_flutter","pdf","mobile_scanner"], functions: true, actions: true }
};
const packageSkills = {
  flutter_bloc: ["bloc"], get_it: ["get-it","dependency-injection"],
  go_router: ["go-router"], supabase_flutter: ["supabase","postgresql"],
  firebase_core: ["firebase"], firebase_messaging: ["firebase-messaging","firebase"],
  firebase_crashlytics: ["crashlytics","firebase"],
  google_mlkit_translation: ["ml-kit"], google_mlkit_text_recognition: ["ml-kit"],
  maplibre_gl: ["maplibre"], sqlite3: ["sqlite"], local_auth: ["biometrics"],
  sentry_flutter: ["sentry"], pdf: ["pdf"], webview_flutter: ["webview"],
  mobile_scanner: ["barcode-scanning"], geolocator: ["gps"]
};
Object.entries(sourceProjects).forEach(([project, evidence]) => {
  evidence.pkgs.forEach(pkg => (packageSkills[pkg] || []).forEach(skill => {
    check(known[skill] && known[skill].projects.includes(project),
      "Source " + evidence.repo + "/" + evidence.yaml + " has " + pkg + " but " + skill + " lacks " + project);
  }));
  if (evidence.functions) check(known["edge-functions"].projects.includes(project), project + ": function source missing in skills");
  if (evidence.actions) check(known["github-actions"].projects.includes(project), project + ": workflows missing in skills");
  check(known["flutter"].projects.includes(project) && known["dart"].projects.includes(project),
    "Flutter/Dart parity missing: " + project);
});
const ownFirebase = Object.keys(sourceProjects).filter(x => sourceProjects[x].pkgs.includes("firebase_core")).sort();
const ownFirebaseCards = known.firebase.projects.filter(x => Object.hasOwn(sourceProjects, x)).sort();
check(JSON.stringify(ownFirebase) === JSON.stringify(ownFirebaseCards),
  "Firebase linked without source dependency: expected " + ownFirebase + ", got " + ownFirebaseCards);
check(known.flutter.projects === known.dart.projects, "Flutter/Dart must share one reference array");
const catalogFlutter = apps.filter(x => (x.technologies || []).includes("Flutter")).map(x => alias[x.id] || x.id);
catalogFlutter.forEach(p => check(known.flutter.projects.includes(p), "App Flutter absent from skills: " + p));
check(known.flutter.projects.includes("cooper-pay"), "Cooper Pay Flutter experience missing");
check(known["firebase-auth"].projects.every(x => ["vai", "gpol"].includes(x)),
  "Do not infer Firebase Authentication from Firebase Messaging");
check(known["supabase-realtime"].projects.every(x => ["match-queue"].includes(x)),
  "Do not infer Supabase Realtime from generic real-time features");
const summaries = D.ORDER.length;
check(summaries === 81, "All 81 skills must remain in inventory");
if (errors.length) {
  console.error("FAIL:\n - " + errors.join("\n - "));
  process.exit(1);
}
console.log("ok — " + summaries + " skills, " + catalogFlutter.length + " Flutter catalog apps, " +
  Object.keys(sourceProjects).length + " inspected source manifests and all mapped tags");
