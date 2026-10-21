// Trilha ORIGINAL do filme, sintetizada aqui mesmo (osciladores, filtros e reverb em código; nenhuma amostra ou
// composição de terceiros). Determinística: o mesmo comando gera sempre o mesmo WAV.
// uso: node audio/make-music.mjs <wide|tall|sq> <saida.wav> [duração em s]
// Harmonia: Dmaj9 → Bm9 → Gmaj7 → Asus4, 96 bpm, 2 compassos por acorde. Seções acompanham a montagem de cada formato.
import fs from 'node:fs';

const [fmt = 'wide', out = 'stockport.wav', durArg] = process.argv.slice(2);
const SEC = {   // [intro, entra baixo/arpejo, entra tudo, final (só pad + arpejo), duração]
  wide: [0, 8.0, 26.2, 81.8, 90.0],
  tall: [0, 3.0, 18.5, 48.5, 54.9],
  sq: [0, 3.0, 18.5, 36.3, 43.9],
}[fmt];
const DUR = durArg ? +durArg : SEC[4];
const SR = 48000, N = Math.round(DUR * SR), BPM = 96, BEAT = 60 / BPM, BAR = BEAT * 4, CH = BAR * 2;
const L = new Float32Array(N), R = new Float32Array(N), sendL = new Float32Array(N), sendR = new Float32Array(N);
const mtof = m => 440 * Math.pow(2, (m - 69) / 12);
const CHORDS = [[50, 54, 57, 61, 64], [47, 50, 54, 57, 61], [43, 47, 50, 54, 57], [45, 50, 52, 57, 64]];
const ROOT = [38, 35, 31, 33];
const clamp = (x, a, b) => Math.max(a, Math.min(b, x));
const smooth = (t, a, b) => { const x = clamp((t - a) / (b - a), 0, 1); return x * x * (3 - 2 * x); };
// nível de cada camada no tempo (entradas e saídas suaves nas seções)
const lvl = {
  pad: t => smooth(t, 0, 3.5) * (1 - smooth(t, DUR - 3.2, DUR)),
  bass: t => smooth(t, SEC[1] - .5, SEC[1] + 1.5) * (1 - smooth(t, SEC[3] - 1, SEC[3] + 1)),
  arp: t => (smooth(t, SEC[1], SEC[1] + 3) * .7 + smooth(t, SEC[2] - 1, SEC[2] + 1) * .3) * (1 - .45 * smooth(t, SEC[3] - 1, SEC[3] + 1)) * (1 - smooth(t, DUR - 3.5, DUR - .3)),
  perc: t => smooth(t, SEC[2] - .5, SEC[2] + 1) * (1 - smooth(t, SEC[3] - 1.5, SEC[3])),
};
let seed = 7; const rnd = () => (seed = (seed * 1103515245 + 12345) >>> 0) / 4294967296;

// pad: 3 dentes-de-serra levemente desafinados por nota, passa-baixas lento, troca de acorde com crossfade
{
  const nChords = Math.ceil(DUR / CH) + 1;
  for (let c = 0; c < nChords; c++) {
    const t0 = c * CH, notes = c * CH + CH * 1.6 > DUR && t0 < DUR ? CHORDS[0] : CHORDS[c % 4];   // o último acorde volta ao Dmaj9
    const s0 = Math.max(0, Math.round((t0 - .8) * SR)), s1 = Math.min(N, Math.round((t0 + CH + 1.8) * SR));
    notes.forEach((m, ni) => {
      const det = [-0.07, 0, 0.07], ph = det.map(() => rnd()), f = det.map(d => mtof(m + d));
      let lp1 = 0, lp2 = 0; const pan = (ni / (notes.length - 1) - .5) * .7;
      for (let i = s0; i < s1; i++) {
        const t = i / SR, lt = t - (t0 - .8);
        const env = smooth(lt, 0, 1.6) * (1 - smooth(lt, CH + .8, CH + 2.6));
        let v = 0; for (let k = 0; k < 3; k++) { ph[k] += f[k] / SR; ph[k] -= Math.floor(ph[k]); v += 2 * ph[k] - 1; }
        const cut = 900 + 700 * Math.sin(t * .23 + ni) + 600 * smooth(t, SEC[2], SEC[2] + 4), a = 1 - Math.exp(-2 * Math.PI * cut / SR);
        lp1 += a * (v - lp1); lp2 += a * (lp1 - lp2);
        const s = lp2 * env * lvl.pad(t) * .028;
        L[i] += s * (1 - pan); R[i] += s * (1 + pan); sendL[i] += s * .9; sendR[i] += s * .9;
      }
    });
  }
}
// baixo: senoide grave nos tempos 1 e 3
for (let b = 0; b * BEAT * 2 < DUR; b++) {
  const t0 = b * BEAT * 2, c = Math.floor(t0 / CH) % 4, f = mtof(ROOT[c]);
  const s0 = Math.round(t0 * SR), s1 = Math.min(N, s0 + Math.round(1.1 * SR)); let ph = 0;
  for (let i = s0; i < s1; i++) { const lt = (i - s0) / SR, t = i / SR; ph += f / SR; const env = Math.min(1, lt / .012) * Math.exp(-lt * 2.6);
    const v = (Math.sin(2 * Math.PI * ph) + .25 * Math.sin(4 * Math.PI * ph)) * env * lvl.bass(t) * .11; L[i] += v; R[i] += v; }
}
// arpejo: triângulo com decaimento curto, colcheias subindo pelas notas do acorde, pingue-pongue no estéreo
{
  const pattern = [0, 2, 4, 1, 3, 4, 2, 1];
  for (let k = 0; k * BEAT / 2 < DUR; k++) {
    const t0 = k * BEAT / 2, c = Math.floor(t0 / CH) % 4, m = CHORDS[c][pattern[k % 8]] + 12, f = mtof(m);
    const vel = (k % 2 ? .7 : 1) * (k % 8 === 0 ? 1.15 : 1), pan = k % 2 ? .35 : -.35;
    const s0 = Math.round(t0 * SR), s1 = Math.min(N, s0 + Math.round(.9 * SR)); let ph = 0;
    for (let i = s0; i < s1; i++) { const lt = (i - s0) / SR, t = i / SR; ph += f / SR; const p = ph - Math.floor(ph);
      const tri = 4 * Math.abs(p - .5) - 1, env = Math.min(1, lt / .004) * Math.exp(-lt * 7.5), v = tri * env * vel * lvl.arp(t) * .05;
      L[i] += v * (1 - pan); R[i] += v * (1 + pan); sendL[i] += v * .6; sendR[i] += v * .6; }
  }
}
// percussão discreta: pulso grave (1 e 3) e chimbal de ruído filtrado nos contratempos
for (let k = 0; k * BEAT / 2 < DUR; k++) {
  const t0 = k * BEAT / 2, s0 = Math.round(t0 * SR);
  if (k % 4 === 0) { let ph = 0; for (let i = s0; i < Math.min(N, s0 + Math.round(.3 * SR)); i++) { const lt = (i - s0) / SR, t = i / SR; ph += (48 + 70 * Math.exp(-lt * 30)) / SR; const v = Math.sin(2 * Math.PI * ph) * Math.exp(-lt * 14) * lvl.perc(t) * .15; L[i] += v; R[i] += v; } }
  if (k % 2 === 1) { let prev = 0; for (let i = s0; i < Math.min(N, s0 + Math.round(.08 * SR)); i++) { const lt = (i - s0) / SR, t = i / SR, n = rnd() * 2 - 1, hp = n - prev; prev = n; const v = hp * Math.exp(-lt * 60) * lvl.perc(t) * .022; L[i] += v * .8; R[i] += v * 1.2; } }
}
// reverb (Schroeder: 4 pentes + 2 passa-tudo por canal) no envio
function reverb(x, offs) {
  const y = new Float32Array(N), combs = [1557, 1617, 1491, 1422].map(d => ({ d: d + offs, b: new Float32Array(d + offs), i: 0, lp: 0 }));
  for (let n = 0; n < N; n++) { let s = 0; for (const c of combs) { const o = c.b[c.i]; c.lp = o * .72 + c.lp * .28; c.b[c.i] = x[n] + c.lp * .86; c.i = (c.i + 1) % c.d; s += o; } y[n] = s * .25; }
  for (const d of [225, 556]) { const b = new Float32Array(d + offs); let j = 0; for (let n = 0; n < N; n++) { const o = b[j]; const v = y[n] + o * .5; b[j] = v; y[n] = o - v * .5; j = (j + 1) % (d + offs); } }
  return y;
}
const rvL = reverb(sendL, 0), rvR = reverb(sendR, 23);
let peak = 0; for (let i = 0; i < N; i++) { L[i] += rvL[i] * .55; R[i] += rvR[i] * .55; peak = Math.max(peak, Math.abs(L[i]), Math.abs(R[i])); }
// normaliza o pico em −3 dBFS (a loudness final é ajustada no mux com loudnorm) e grava WAV 16 bits estéreo
const g = .708 / peak, buf = Buffer.alloc(44 + N * 4);
buf.write('RIFF', 0); buf.writeUInt32LE(36 + N * 4, 4); buf.write('WAVEfmt ', 8); buf.writeUInt32LE(16, 16); buf.writeUInt16LE(1, 20); buf.writeUInt16LE(2, 22);
buf.writeUInt32LE(SR, 24); buf.writeUInt32LE(SR * 4, 28); buf.writeUInt16LE(4, 32); buf.writeUInt16LE(16, 34); buf.write('data', 36); buf.writeUInt32LE(N * 4, 40);
for (let i = 0; i < N; i++) { buf.writeInt16LE(Math.round(clamp(L[i] * g, -1, 1) * 32767), 44 + i * 4); buf.writeInt16LE(Math.round(clamp(R[i] * g, -1, 1) * 32767), 46 + i * 4); }
fs.mkdirSync(new URL('.', 'file://' + (out.startsWith('/') ? out : process.cwd() + '/' + out)).pathname, { recursive: true });
fs.writeFileSync(out, buf);
console.log(`${out}: ${DUR.toFixed(2)} s, ${fmt}, pico normalizado em −3 dBFS`);
