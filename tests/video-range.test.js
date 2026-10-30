/* HTTP Range de /assets/video/*.mp4 pelo Worker: 200, 206, 416 e casos inválidos. Rode: node tests/video-range.test.js */
"use strict";
var failures = [];
function check(ok, msg) { if (!ok) failures.push(msg); }

(async function () {
  var R = await import("../worker/range.mjs");
  var W = (await import("../worker/index.mjs")).default;
  var ctx = { waitUntil: function (p) { return p; } };

  // parseRange (arquivo de 1000 bytes)
  var p = function (h) { return R.parseRange(h, 1000); };
  check(p(null) === null && p("") === null, "sem Range → ignora");
  check(JSON.stringify(p("bytes=0-99")) === '{"start":0,"end":99}', "0-99");
  check(JSON.stringify(p("bytes=100-199")) === '{"start":100,"end":199}', "100-199");
  check(JSON.stringify(p("bytes=-100")) === '{"start":900,"end":999}', "sufixo -100");
  check(JSON.stringify(p("bytes=900-")) === '{"start":900,"end":999}', "aberto 900-");
  check(JSON.stringify(p("bytes=0-99999")) === '{"start":0,"end":999}', "fim além do arquivo é cortado");
  check(JSON.stringify(p("bytes=-5000")) === '{"start":0,"end":999}', "sufixo maior que o arquivo → tudo");
  check(p("bytes=1000-") === "416" && p("bytes=99999999-") === "416", "início fora → 416");
  check(p("bytes=-0") === "416", "sufixo 0 → 416");
  check(p("bytes=abc") === null && p("bytes=-") === null && p("items=0-1") === null, "inválido → ignora");
  check(p("bytes=0-1,5-6") === null, "multi-intervalo → resposta inteira");
  check(p("bytes=50-10") === null, "primeiro > último → ignora");

  // caminho do Worker
  var body = new Uint8Array(1000); for (var i = 0; i < 1000; i++) body[i] = i % 251;
  var seenRange = [];
  var env = { ASSETS: { fetch: async function (req) {
    seenRange.push(req.headers.get("range"));
    var h = { "content-type": "video/mp4", etag: '"abc"', "cache-control": "public, max-age=0, must-revalidate", "x-content-type-options": "nosniff" };
    if (req.headers.get("if-none-match") === '"abc"') return new Response(null, { status: 304, headers: h });
    return new Response(body, { status: 200, headers: h });
  } } };
  function get(path, headers, method) { return W.fetch(new Request("https://lucksrei.com" + path, { method: method || "GET", headers: headers || {} }), env, ctx); }
  var V = "/assets/video/x-loop.mp4";

  var r = await get(V);
  check(r.status === 200 && r.headers.get("accept-ranges") === "bytes" && r.headers.get("content-length") === "1000" && (await r.arrayBuffer()).byteLength === 1000, "200 inteiro com Accept-Ranges e Content-Length");
  check(r.headers.get("content-type") === "video/mp4" && r.headers.get("etag") === '"abc"' && r.headers.get("x-content-type-options") === "nosniff", "preserva Content-Type, ETag e cabeçalhos do asset");

  r = await get(V, { range: "bytes=100-199" });
  var buf = new Uint8Array(await r.arrayBuffer());
  check(r.status === 206 && r.headers.get("content-range") === "bytes 100-199/1000" && r.headers.get("content-length") === "100" && buf.length === 100 && buf[0] === 100 % 251 && buf[99] === 199 % 251, "206 com o trecho certo");
  check(r.headers.get("accept-ranges") === "bytes" && r.headers.get("etag") === '"abc"' && r.headers.get("cache-control").indexOf("max-age") > -1, "206 mantém Accept-Ranges, ETag e Cache-Control");
  check(seenRange.every(function (x) { return x === null; }), "o Range não vai para o ASSETS (o Worker corta)");

  r = await get(V, { range: "bytes=-100" });
  buf = new Uint8Array(await r.arrayBuffer());
  check(r.status === 206 && r.headers.get("content-range") === "bytes 900-999/1000" && buf.length === 100 && buf[99] === 999 % 251, "206 com sufixo");

  r = await get(V, { range: "bytes=99999999-" });
  check(r.status === 416 && r.headers.get("content-range") === "bytes */1000" && (await r.arrayBuffer()).byteLength === 0, "416 com Content-Range */size e corpo vazio");

  r = await get(V, { range: "bytes=abc" });
  check(r.status === 200 && (await r.arrayBuffer()).byteLength === 1000, "Range inválido → 200 inteiro");

  r = await get(V, { range: "bytes=0-99", "if-range": '"outro"' });
  check(r.status === 200 && (await r.arrayBuffer()).byteLength === 1000, "If-Range diferente do ETag → 200 inteiro");
  r = await get(V, { range: "bytes=0-99", "if-range": '"abc"' });
  check(r.status === 206, "If-Range igual ao ETag → 206");

  r = await get(V, { range: "bytes=0-99" }, "HEAD");
  check(r.status === 206 && r.headers.get("content-length") === "100" && (await r.arrayBuffer()).byteLength === 0, "HEAD com Range → 206 sem corpo");
  r = await get(V, {}, "HEAD");
  check(r.status === 200 && r.headers.get("accept-ranges") === "bytes" && r.headers.get("content-length") === "1000", "HEAD → 200 com Accept-Ranges");

  r = await get(V, { "if-none-match": '"abc"' });
  check(r.status === 304, "revalidação por ETag continua dando 304");

  r = await get(V, {}, "POST");
  check(r.status !== 206, "POST não passa pelo caminho de Range");

  // só .mp4 diretamente em /assets/video/ passa pelo Worker
  check(R.isVideoPath("/assets/video/a.mp4") && R.isVideoPath("/assets/video/a.av1.mp4"), "isVideoPath: mp4");
  check(!R.isVideoPath("/assets/video/a.webp") && !R.isVideoPath("/assets/video/sub/a.mp4") && !R.isVideoPath("/assets/img/a.mp4"), "isVideoPath: resto fora");
  r = await get("/assets/video/x-loop-poster.en.webp", { range: "bytes=0-9" });
  check(r.status === 200, "poster não ganha tratamento de Range");

  if (failures.length) { console.error("FALHOU:\n - " + failures.join("\n - ")); process.exit(1); }
  console.log("video-range.test.js OK");
})();
