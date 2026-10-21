"use strict";
/* Fundo: gradiente navy, brilho cobalto à deriva, grade pontilhada técnica, partículas (PRNG com seed), vinheta e ruído anti-banding. */
SP.bg = (function () {
  const cv = document.getElementById("bg"); cv.width = FMT.W; cv.height = FMT.H;
  const c = cv.getContext("2d"), W = FMT.W, H = FMT.H;
  const R = rng(20261021);
  const motes = Array.from({ length: 70 }, () => ({ x: R(), y: R(), z: .3 + R() * .7, ph: R() * 6.28, sp: .006 + R() * .012, r: .8 + R() * 1.8 }));
  // ruído estático para dither
  const nz = document.createElement("canvas"); nz.width = nz.height = 256; const nc = nz.getContext("2d"), id = nc.createImageData(256, 256), rn = rng(99);
  for (let i = 0; i < id.data.length; i += 4) { const v = rn() * 255; id.data[i] = id.data[i + 1] = id.data[i + 2] = v; id.data[i + 3] = 255; } nc.putImageData(id, 0, 0);
  const nzp = c.createPattern(nz, "repeat");
  const M0 = { glow: .55, gx: .5, gy: .4, grid: .5, tint: 0, dots: 1 };
  function mood(t) {
    const segs = SP.segs; let cur = null, prev = null;
    for (const s of segs) if (t >= s.t0) { prev = cur; cur = s; }
    if (!cur) return M0;
    const a = Object.assign({}, M0, cur.mood || {}), b = prev ? Object.assign({}, M0, prev.mood || {}) : a;
    const k = E.io2(P(t, cur.t0, cur.t0 + 1.6)), o = {}; for (const key in M0) o[key] = lerp(b[key], a[key], k); return o;
  }
  // no loop 1:1 tudo o que se move no fundo fecha ciclos inteiros em DURATION (sem salto na emenda)
  const qf = w => { if (FN !== "sq") return w; const D = SP.DURATION, n = Math.max(1, Math.round(w * D / 6.2832)); return n * 6.2832 / D; };
  const qv = v => { if (FN !== "sq") return v; const D = SP.DURATION; return Math.max(1, Math.round(v * D)) / D; };
  function render(t) {
    const m = mood(t);
    const g = c.createLinearGradient(0, 0, 0, H); g.addColorStop(0, "#0C1D40"); g.addColorStop(1, "#06112A"); c.fillStyle = g; c.fillRect(0, 0, W, H);
    // brilhos cobalto
    const gl = (x, y, r, a, col) => { const rg = c.createRadialGradient(x, y, 0, x, y, r); rg.addColorStop(0, `rgba(${col},${a})`); rg.addColorStop(1, `rgba(${col},0)`); c.fillStyle = rg; c.fillRect(0, 0, W, H); };
    const R0 = Math.max(W, H);
    gl(W * (m.gx + .06 * Math.sin(t * qf(.21))), H * (m.gy + .05 * Math.cos(t * qf(.17))), R0 * .62, .30 * m.glow + .04, "30,108,255");
    gl(W * (1 - m.gx + .05 * Math.cos(t * qf(.13))), H * (1 - m.gy + .06 * Math.sin(t * qf(.19))), R0 * .5, .17 * m.glow, "56,189,248");
    gl(W * .5, H * 1.05, R0 * .7, .16 * m.glow, "10,61,145");
    // grade pontilhada técnica
    if (m.dots > .01) {
      const sp = FN === "wide" ? 64 : 54, ox = (t * qv(3 / sp) * sp) % sp; c.fillStyle = "rgba(120,170,255,1)";
      for (let y = sp / 2; y < H; y += sp) for (let x = sp / 2 - ox; x < W + sp; x += sp) {
        const dx = (x - W * .5) / W, dy = (y - H * .5) / H, f = Math.max(0, 1 - Math.sqrt(dx * dx * 1.4 + dy * dy * 1.9) * 1.25);
        if (f < .02) continue; c.globalAlpha = .17 * f * m.dots * m.grid; c.fillRect(x - 1, y - 1, 2, 2);
      }
      c.globalAlpha = 1;
    }
    // partículas
    for (const p of motes) {
      const y = ((p.y - t * qv(p.sp * p.z) + 100) % 1), x = p.x + .02 * Math.sin(t * qf(.3) + p.ph);
      const tw = .5 + .5 * Math.sin(t * qf(1.1) + p.ph * 3); c.globalAlpha = (.12 + .38 * tw) * p.z * .8 * (m.glow + .3);
      c.fillStyle = p.z > .8 ? "#9CC7FF" : "#4C8DFF"; c.beginPath(); c.arc(x * W, y * H, p.r * p.z, 0, 6.283); c.fill();
    }
    c.globalAlpha = 1;
    // vinheta
    const vg = c.createRadialGradient(W / 2, H / 2, Math.min(W, H) * .35, W / 2, H / 2, Math.hypot(W, H) * .6); vg.addColorStop(0, "rgba(3,8,20,0)"); vg.addColorStop(1, "rgba(3,8,20,.62)"); c.fillStyle = vg; c.fillRect(0, 0, W, H);
    // ruído fixo (dither contra banding nos gradientes; parado para não pesar no encode)
    c.save(); c.globalAlpha = .022; c.fillStyle = nzp; c.fillRect(0, 0, W, H); c.restore();
  }
  return { render };
})();
