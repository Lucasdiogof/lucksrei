"use strict";
/* Linha do tempo por formato. Cada segmento: cena, duração no formato e `map` opcional — keyframes
   [tempo no formato, tempo local da cena] que encurtam esperas e transições sem acelerar a leitura dos títulos.
   `mood` ajusta o brilho do fundo por cena. */
(function () {
  const MOODS = { s01: { glow: .75, gx: .5, gy: .42 }, s02: { glow: .6, gx: .62, gy: .55 }, s03: { glow: .55, gx: .35, gy: .6 }, s04: { glow: .6, gx: .6, gy: .5 },
    s05: { glow: .5, gx: .5, gy: .55 }, s06: { glow: .55, gx: .5, gy: .55 }, s07: { glow: .85, gx: .5, gy: .5 }, s08: { glow: .5, gx: .65, gy: .5 }, s09: { glow: .55, gx: .5, gy: .55 }, s10: { glow: .75, gx: .5, gy: .42 } };
  function seq(list, ov = 1.0) {   // encadeia cenas com sobreposição `ov` (transições cruzadas)
    let t = 0; return list.map(([id, D, map]) => { const s = { id, t0: t, t1: t + D, map, mood: MOODS[id] }; t += D - ov; return s; });
  }
  // master 16:9 — todas as cenas em tempo real
  SP.timeline.wide = seq([["s01", 7.6], ["s02", 10.2], ["s03", 10.8], ["s04", 12.6], ["s05", 9.8], ["s06", 8.8], ["s07", 13.6], ["s08", 7.8], ["s09", 8.4], ["s10", 8.4]]);
  // loop 1:1 do site — sem a cena de clientes/fornecedores; termina no fundo vazio do quadro 0
  SP.timeline.sq = seq([
    ["s01", 6.4, [[0, 0], [2.2, 3.2], [6.4, 7.6]]],
    ["s02", 7.2, [[0, 0], [3.0, 3.6], [4.0, 5.0], [5.0, 7.2], [6.6, 9.2], [7.2, 10.2]]],
    ["s03", 7.0, [[0, 0], [1.4, 1.7], [3.0, 3.4], [4.4, 5.4], [5.6, 7.4], [6.2, 9.4], [7.0, 10.8]]],
    ["s04", 8.4, [[0, 0], [1.0, 1.4], [4.4, 5.6], [5.2, 6.6], [7.8, 9.9], [8.4, 12.6]]],
    ["s05", 6.2, [[0, .4], [3.2, 4.6], [4.0, 5.4], [5.6, 7.8], [6.2, 9.8]]],
    ["s07", 8.6, [[0, 0], [3.6, 4.4], [4.4, 7.4], [5.8, 9.4], [8.0, 12.6], [8.6, 13.6]]],
    ["s08", 4.4, [[0, .2], [2.6, 3.4], [4.4, 7.8]]],
    ["s09", 4.8, [[0, 0], [1.8, 1.8], [2.2, 3.4], [3.8, 5.6], [4.8, 8.4]]],
    ["s10", 7.4, [[0, .6], [7.4, 8.4]]],
  ], .7);
  // vertical 9:16 — versão sintética
  SP.timeline.tall = seq([
    ["s01", 5.8, [[0, .4], [1.8, 3.2], [5.8, 7.6]]],
    ["s02", 6.4, [[0, 0], [2.6, 3.4], [3.4, 5.0], [4.4, 7.2], [5.8, 9.2], [6.4, 10.2]]],
    ["s03", 6.2, [[0, 0], [1.2, 1.7], [2.6, 3.4], [3.8, 5.4], [5.0, 7.4], [5.5, 9.4], [6.2, 10.8]]],
    ["s04", 7.6, [[0, 0], [.8, 1.4], [3.8, 5.6], [4.6, 6.6], [7.0, 9.9], [7.6, 12.6]]],
    ["s05", 5.6, [[0, .4], [2.8, 4.6], [3.4, 5.4], [5.0, 7.8], [5.6, 9.8]]],
    ["s07", 7.8, [[0, 0], [3.2, 4.4], [3.8, 7.4], [5.2, 9.4], [7.3, 12.6], [7.8, 13.6]]],
    ["s08", 4.2, [[0, .2], [2.4, 3.4], [4.2, 7.8]]],
    ["s10", 6.0, [[0, .6], [6.0, 6.6]]],
  ], .7);
})();
