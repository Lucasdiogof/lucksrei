"use strict";
/* Boot, reprodução em tempo real e página de desenvolvimento (play/pause, timeline, seek, cenas, formato, inspeção). */
(async function () {
  document.body.classList.toggle("rm", SP.renderMode);
  const stage = $("#stage"), vp = $("#vp");
  stage.style.width = FMT.W + "px"; stage.style.height = FMT.H + "px";
  await SP.loadBrand();
  await Promise.all([300, 400, 500, 700].map(w => document.fonts.load(`${w} 20px "SP Roboto"`)));
  SP.build($("#cam"));
  window.DURATION = SP.DURATION;
  const fit = () => {
    if (SP.renderMode) { vp.style.transform = "none"; return; }
    const k = Math.min(innerWidth / FMT.W, (innerHeight - 64) / FMT.H); vp.style.transform = `scale(${k})`;
    vp.style.left = (innerWidth - FMT.W * k) / 2 + "px"; vp.style.top = (innerHeight - 64 - FMT.H * k) / 2 + "px";
  };
  addEventListener("resize", fit); fit();
  const tq = qs.get("t");
  render(tq ? +tq : 0);
  await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
  window.READY = true;
  if (SP.renderMode) return;

  /* ───── interface de desenvolvimento ───── */
  const dev = $("#dev"); let playing = !tq, t0 = performance.now(), base = tq ? +tq : 0, cur = base;
  dev.innerHTML = `<button id="bp" class="${playing ? "on" : ""}">${playing ? "⏸" : "▶"}</button><div class="sl"><input id="rg" type="range" min="0" max="${SP.DURATION}" step="0.01" value="0"></div><span class="tm" id="tm"></span>
    <button id="bm1">−1 s</button><button id="bp1">+1 s</button><select id="sc"></select><select id="ft"><option value="wide">16:9</option><option value="sq">1:1</option><option value="tall">9:16</option></select>
    <button id="bi">inspeção</button><a id="bf" target="_blank">quadro avulso</a>`;
  const sel = $("#sc"); SP.segs.forEach((s, i) => { const o = document.createElement("option"); o.value = s.t0; o.textContent = `${i + 1}. ${s.id}  ${s.t0.toFixed(1)}s`; sel.appendChild(o); });
  $("#ft").value = FN; $("#ft").onchange = e => { const u = new URL(location.href); u.searchParams.set("fmt", e.target.value); location.href = u; };
  const rg = $("#rg"), tm = $("#tm"), bp = $("#bp");
  const slEl = $(".sl"); SP.segs.forEach(s => { const d = document.createElement("div"); d.className = "seg"; d.style.left = s.t0 / SP.DURATION * 100 + "%"; d.style.width = (s.t1 - s.t0) / SP.DURATION * 100 + "%"; d.title = s.id; d.onclick = () => seek(s.t0); slEl.appendChild(d); });
  const guides = h('<div id="guides"></div>'); stage.appendChild(guides);
  [[.05, .05, .9, .9], [.1, .1, .8, .8]].forEach(g => { const i = document.createElement("i"); i.style.cssText = `left:${g[0] * 100}%;top:${g[1] * 100}%;width:${g[2] * 100}%;height:${g[3] * 100}%`; guides.appendChild(i); });
  function seek(t) { cur = Math.max(0, Math.min(SP.DURATION, t)); base = cur; t0 = performance.now(); render(cur); upd(); }
  function upd() { rg.value = cur; tm.textContent = `${cur.toFixed(2)} / ${SP.DURATION.toFixed(1)} s`; const f = $("#bf"); f.href = `?render&fmt=${FN}&t=${cur.toFixed(2)}`; }
  bp.onclick = () => { playing = !playing; bp.textContent = playing ? "⏸" : "▶"; bp.classList.toggle("on", playing); base = cur; t0 = performance.now(); };
  rg.oninput = () => seek(+rg.value); sel.onchange = () => seek(+sel.value); $("#bm1").onclick = () => seek(cur - 1); $("#bp1").onclick = () => seek(cur + 1);
  $("#bi").onclick = e => { document.body.classList.toggle("insp"); e.target.classList.toggle("on"); };
  addEventListener("keydown", e => { if (e.code === "Space") { e.preventDefault(); bp.click(); } if (e.code === "ArrowRight") seek(cur + (e.shiftKey ? 5 : 1)); if (e.code === "ArrowLeft") seek(cur - (e.shiftKey ? 5 : 1)); if (e.key === "i") $("#bi").click(); });
  (function loop() { if (playing) { cur = base + (performance.now() - t0) / 1000; if (cur > SP.DURATION) { cur = 0; base = 0; t0 = performance.now(); } render(cur); upd(); } requestAnimationFrame(loop); })();
  upd();
})();
