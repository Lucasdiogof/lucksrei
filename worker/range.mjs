// HTTP Range para /assets/video/*.mp4. Os Static Assets da Cloudflare respondem 200 com o arquivo inteiro e sem
// Accept-Ranges (medido em produção); Safari/iOS exige 206 para tocar <video>. O Worker lê o arquivo pelo binding
// ASSETS e devolve 200, 206 ou 416. Arquivos de ~2 MB: ler inteiro em memória é aceitável (shortcut: se passar de
// ~20 MB, usar stream com corte em vez de arrayBuffer).

// Interpreta o cabeçalho Range para um arquivo de `size` bytes.
// → null (ignorar: ausente, inválido ou multi-intervalo → resposta 200 inteira), "416" (insatisfatível) ou {start, end}.
export function parseRange(header, size) {
  if (!header) return null;
  const m = /^bytes=(\d*)-(\d*)$/.exec(header.trim());
  if (!m || (m[1] === "" && m[2] === "")) return null;
  let start, end;
  if (m[1] === "") {
    const n = Number(m[2]); // suffix: últimos n bytes
    if (n === 0) return "416";
    start = Math.max(0, size - n);
    end = size - 1;
  } else {
    start = Number(m[1]);
    end = m[2] === "" ? size - 1 : Math.min(Number(m[2]), size - 1);
    if (m[2] !== "" && Number(m[2]) < start) return null; // first > last é inválido: ignora
    if (start >= size) return "416";
  }
  return { start, end };
}

export function isVideoPath(pathname) {
  return /^\/assets\/video\/[^/]+\.mp4$/.test(pathname);
}

export async function handleVideo(request, env) {
  if (request.method !== "GET" && request.method !== "HEAD") return env.ASSETS.fetch(request);
  // sem Range e sem If-Range → o caminho normal já é correto; o Worker só acrescenta Accept-Ranges
  const assetReq = new Request(request.url, { method: "GET", headers: stripRange(request.headers) });
  const asset = await env.ASSETS.fetch(assetReq);
  if (asset.status !== 200) return asset; // 304/404 etc. passam como vieram
  const headers = new Headers(asset.headers);
  headers.set("accept-ranges", "bytes");
  headers.delete("content-length");
  headers.delete("content-encoding");
  headers.append("vary", "Range");

  const buf = await asset.arrayBuffer();
  const size = buf.byteLength;
  const etag = asset.headers.get("etag");
  const ifRange = request.headers.get("if-range");
  const ifRangeOk = !ifRange || (etag && ifRange === etag);
  const range = ifRangeOk ? parseRange(request.headers.get("range"), size) : null;

  if (range === "416") {
    headers.set("content-range", "bytes */" + size);
    return new Response(null, { status: 416, headers });
  }
  if (!range) {
    headers.set("content-length", String(size));
    return new Response(request.method === "HEAD" ? null : buf, { status: 200, headers });
  }
  headers.set("content-range", "bytes " + range.start + "-" + range.end + "/" + size);
  headers.set("content-length", String(range.end - range.start + 1));
  return new Response(request.method === "HEAD" ? null : buf.slice(range.start, range.end + 1), { status: 206, headers });
}

function stripRange(h) {
  const out = new Headers(h);
  out.delete("range");
  out.delete("if-range");
  return out;
}
