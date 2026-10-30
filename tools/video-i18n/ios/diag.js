// Página de diagnóstico para iPhone: troca o idioma como o site faz (evento lucksrei:locale), mostra o estado do vídeo
// visível e junta um relatório copiável (eventos lucksrei:video-swap, erros, congelamentos, eventos de ciclo de vida).
(function () {
  var $ = function (id) { return document.getElementById(id); };
  var logEl = $('log'), stEl = $('st'), lines = [], t0 = performance.now();
  function log(m) { var s = ((performance.now() - t0) / 1000).toFixed(2) + 's ' + m; lines.push(s); logEl.textContent = lines.slice(-60).join('\n'); }
  function top() { var all = document.querySelectorAll('video[data-loop-video]'); return all[all.length - 1]; }
  function loc(src) { return (/loop\.(pt-BR|en|es)(\.av1)?\.mp4/.exec(src || '') || [])[1] || '-'; }
  function setLocale(l) {
    document.documentElement.lang = l;
    log('troca pedida → ' + l);
    document.dispatchEvent(new CustomEvent('lucksrei:locale', { detail: { locale: l } }));
    document.querySelectorAll('#langs button').forEach(function (b) { b.classList.toggle('on', b.dataset.l === l); });
  }
  var sleep = function (ms) { return new Promise(function (r) { setTimeout(r, ms); }); };

  document.querySelectorAll('#langs button').forEach(function (b) { b.onclick = function () { setLocale(b.dataset.l); }; });
  $('seq').onclick = async function () { for (var l of ['pt-BR', 'en', 'es', 'pt-BR']) { setLocale(l); await sleep(3000); } };
  $('fast').onclick = async function () { var ls = ['pt-BR', 'en', 'es']; for (var i = 0; i < 10; i++) { setLocale(ls[i % 3]); await sleep(400); } log('trocas rápidas: o ÚLTIMO foi ' + ls[9 % 3]); };
  $('loopend').onclick = async function () {
    var v = top(); if (!v || !v.duration) return log('sem duração ainda — toque num idioma primeiro');
    var wait = Math.max(0, (v.duration - 0.5 - v.currentTime) * 1000); log('esperando ' + Math.round(wait) + ' ms para trocar a 0,5 s do fim');
    await sleep(wait); setLocale(['pt-BR', 'en', 'es'][(Math.random() * 3) | 0]);
  };
  $('clear').onclick = function () { lines = []; logEl.textContent = ''; maxGap = 0; };
  $('copy').onclick = function () {
    var txt = report();
    (navigator.clipboard ? navigator.clipboard.writeText(txt) : Promise.reject()).then(function () { log('relatório copiado'); }, function () { logEl.textContent = txt; log('copie manualmente o texto acima'); });
  };

  document.addEventListener('lucksrei:video-swap', function (e) { log('swap ' + JSON.stringify(e.detail)); });
  ['visibilitychange', 'pagehide', 'pageshow', 'freeze', 'resume'].forEach(function (n) { (n === 'visibilitychange' ? document : window).addEventListener(n, function () { log('evento ' + n + (n === 'visibilitychange' ? ' → ' + document.visibilityState : '')); }); });
  window.addEventListener('error', function (e) { log('ERRO JS ' + e.message); });
  document.addEventListener('error', function (e) { var v = e.target; if (v && v.error) log('ERRO MÍDIA code=' + v.error.code + ' ' + (v.error.message || '') + ' src=' + loc(v.currentSrc)); }, true);
  document.addEventListener('stalled', function (e) { log('stalled ' + loc(e.target.currentSrc)); }, true);
  document.addEventListener('waiting', function (e) { log('waiting ' + loc(e.target.currentSrc)); }, true);

  // maior intervalo sem o tempo do vídeo visível avançar enquanto ele deveria tocar (congelamento visível)
  var last = null, lastT = -1, lastP = 0, maxGap = 0, frames = 0;
  (function tick() {
    var v = top(), p = performance.now(); frames++;
    if (v && v.getAttribute('src') && !v.paused) {
      if (v.currentTime !== lastT) { if (lastP) maxGap = Math.max(maxGap, p - lastP); lastP = p; lastT = v.currentTime; }
    } else lastP = 0;
    last = v; requestAnimationFrame(tick);
  })();
  var cp = function (t) { var a = document.createElement('video'); return a.canPlayType(t) || 'não'; };
  function report() {
    var v = top();
    return ['UA: ' + navigator.userAgent, 'tela: ' + screen.width + 'x' + screen.height + ' dpr ' + devicePixelRatio,
      'H.264: ' + cp('video/mp4; codecs="avc1.640028"') + ' · AV1: ' + cp('video/mp4; codecs="av01.0.08M.08"'),
      'vídeo atual: ' + (v ? loc(v.currentSrc) + ' t=' + v.currentTime.toFixed(2) + ' rs=' + v.readyState + ' paused=' + v.paused + ' err=' + (v.error ? v.error.code : '-') : '-'),
      'maior congelamento: ' + Math.round(maxGap) + ' ms · players no DOM: ' + document.querySelectorAll('video[data-loop-video]').length, '---'].concat(lines).join('\n');
  }
  setInterval(function () {
    var v = top(); if (!v) return;
    stEl.textContent = 'idioma do arquivo: ' + loc(v.currentSrc) + '\ncodec: ' + (/av1/.test(v.currentSrc) ? 'AV1' : 'H.264') + '\ntempo: ' + v.currentTime.toFixed(2) + ' / ' + (v.duration || 0).toFixed(2) +
      '\nreadyState: ' + v.readyState + '  paused: ' + v.paused + '\nplayers: ' + document.querySelectorAll('video[data-loop-video]').length + '  maior congelamento: ' + Math.round(maxGap) + ' ms';
  }, 250);
  log('pronta. Toque em PT/EN/ES. H.264=' + cp('video/mp4; codecs="avc1.640028"') + ' AV1=' + cp('video/mp4; codecs="av01.0.08M.08"'));
})();
