"use strict";
/* Linha do tempo por formato. Cada segmento: cena, duração no formato e `map` opcional — keyframes
   [tempo no formato, tempo local da cena] que encurtam esperas e transições sem acelerar a leitura dos títulos.
   `mood` ajusta o brilho do fundo por cena. */
(function () {
  const MOODS = { s01: { glow: .75, gx: .5, gy: .42 }, s02: { glow: .6, gx: .62, gy: .55 }, s03: { glow: .55, gx: .35, gy: .6 }, s04: { glow: .6, gx: .6, gy: .5 },
    s05: { glow: .5, gx: .5, gy: .55 }, s06: { glow: .55, gx: .5, gy: .55 }, s07: { glow: .85, gx: .5, gy: .5 }, s08: { glow: .5, gx: .65, gy: .5 }, s09: { glow: .55, gx: .5, gy: .55 },
    sg: { glow: .55, gx: .5, gy: .5 }, s10: { glow: .75, gx: .5, gy: .42 } };
  function seq(list, ov = 1.0) {   // encadeia cenas com sobreposição `ov` (transições cruzadas)
    let t = 0; return list.map(([id, D, map]) => { const s = { id, t0: t, t1: t + D, map, mood: MOODS[id] }; t += D - ov; return s; });
  }
  // cortes compartilhados pelo vertical e pelo quadrado
  const CUT = {
    s02: [[0, .2], [1.8, 2.6], [3.6, 5.2], [5.4, 7.4], [6.4, 9.2], [7.0, 10.0]],
    s03: [[0, .4], [1.0, 1.6], [2.4, 3.5], [4.6, 6.2], [6.4, 8.2], [7.4, 10.6]],
    s04: [[0, .4], [4.0, 5.4], [4.8, 6.6], [6.4, 9.0], [7.8, 10.4], [8.8, 12.4], [9.6, 13.0]],
    s07: [[0, 0], [7.0, 7.8], [7.8, 9.6], [9.0, 13.0], [9.6, 14.0]],
  };
  // master 16:9 — história completa em tempo real (~90 s)
  SP.timeline.wide = seq([["s01", 8.6], ["s02", 10.0], ["s03", 10.6], ["s04", 13.0], ["s05", 10.4], ["s06", 8.4], ["s07", 14.0], ["s08", 7.8], ["s09", 8.0], ["s10", 8.2]]);
  // vertical 9:16 para marketplace (~54 s): impacto, produtos e estoque, PDV, caixa, resultados, gestão, marca
  SP.timeline.tall = seq([
    ["s01", 6.2],
    ["s02", 7.0, CUT.s02],
    ["s03", 7.4, CUT.s03],
    ["s04", 9.6, CUT.s04],
    ["s05", 8.0, [[0, .5], [4.6, 5.2], [5.4, 6.6], [7.4, 9.4], [8.0, 10.4]]],
    ["s07", 9.6, CUT.s07],
    ["sg", 5.6, [[0, 0], [5.6, 7.6]]],
    ["s10", 6.4, [[0, .6], [6.4, 8.2]]],
  ], .7);
  // loop 1:1 do site (~43 s): as cenas mais visuais; termina no fundo vazio do quadro 0
  SP.timeline.sq = seq([
    ["s01", 6.2],
    ["s02", 7.0, CUT.s02],
    ["s03", 7.4, CUT.s03],
    ["s04", 9.6, CUT.s04],
    ["s07", 9.6, CUT.s07],
    ["s10", 7.6, [[0, .6], [7.6, 8.2]]],
  ], .7);
})();
