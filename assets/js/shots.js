/* Lucksrei — renderiza screenshots do idioma atual a partir de screenshots-data.js
 *
 *   <div data-shots="projeto:bloco">          → <figure> por slot disponível no idioma
 *   <img data-shot-img="projeto:slot">        → imagem única (hero/vitrine); some se não existir no idioma
 *   data-home                                 → usa a miniatura otimizada de /assets/img/home/
 *   data-shot-neutral="projeto:slot:idioma"    → fallback neutro da vitrine (ver renderNeutrals)
 *
 * Sem fallback entre idiomas (exceto o fallback neutro explícito da vitrine). Bloco sem nenhuma imagem no idioma esconde o .case-block inteiro.
 */
(function () {
  "use strict";
  var S = window.LucksreiShots;
  var I = window.LucksreiI18n;
  if (!S || !I) return;

  function el(tag, cls) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    return n;
  }

  function decode(s) {
    var x = document.createElement("textarea");
    x.innerHTML = s;
    return x.value;
  }

  function renderBlock(box) {
    var parts = box.getAttribute("data-shots").split(":");
    var locale = I.getLocale();
    var slots = S.blockFor(parts[0], parts[1], locale);
    box.textContent = "";
    var wide = box.classList.contains("art-grid");
    slots.forEach(function (s) {
      var fig = el("figure", "fig");
      var img = el("img", "media" + (wide ? "" : " media-sm"));
      img.src = s.src;
      img.alt = decode(I.t(s.altKey));
      if (s.w && s.h) { img.width = s.w; img.height = s.h; }
      img.loading = "lazy";
      img.decoding = "async";
      var cap = el("figcaption");
      var strong = el("strong");
      strong.textContent = decode(I.t(s.titleKey));
      cap.appendChild(strong);
      cap.appendChild(document.createTextNode(decode(I.t(s.captionKey))));
      fig.appendChild(img);
      fig.appendChild(cap);
      box.appendChild(fig);
    });
    var wrap = box.closest(".case-block");
    if (wrap) wrap.hidden = slots.length === 0;
  }

  // vitrine da home: miniaturas otimizadas em /assets/img/home/<projeto>/<idioma>/<slot>.webp (originais seguem nos cases)
  function homeSrc(src) {
    return src.replace(/\/assets\/img\/([^\/]+)\/screens\/([^\/]+)\/([^\/]+)$/, "/assets/img/home/$1/$2/$3");
  }

  function showImg(img, s) {
    img.src = img.hasAttribute("data-home") ? homeSrc(s.src) : s.src;
    img.alt = decode(I.t(s.altKey));
    if (s.w && s.h) { img.width = s.w; img.height = s.h; }
    img.hidden = false;
  }

  function hideImg(img) {
    img.hidden = true;
    img.removeAttribute("src");
  }

  function renderImg(img) {
    var parts = img.getAttribute("data-shot-img").split(":");
    var s = S.slotFor(parts[0], parts[1], I.getLocale());
    if (s) showImg(img, s); else hideImg(img);
  }

  // Fallback neutro (só na vitrine): se a placa não tem nenhuma imagem localizada no idioma atual,
  // mostra telas reais do app (data-shot-neutral="projeto:slot:idioma-do-arquivo"). Nunca arte com headline de outro idioma.
  function renderNeutrals() {
    document.querySelectorAll(".work-plate").forEach(function (plate) {
      var localized = plate.querySelectorAll("[data-shot-img]:not([hidden])").length;
      plate.querySelectorAll("[data-shot-neutral]").forEach(function (img) {
        if (localized) { hideImg(img); return; }
        var p = img.getAttribute("data-shot-neutral").split(":");
        var s = S.slotFor(p[0], p[1], p[2]);
        if (s) showImg(img, s); else hideImg(img);
      });
    });
  }

  // holder sem nenhuma imagem no idioma atual perde o visual; as visíveis ganham índice (--k) para o escalonamento
  function syncHolders() {
    document.querySelectorAll(".case-hero, .work-item").forEach(function (h) {
      var imgs = h.querySelectorAll("[data-shot-img], [data-shot-neutral]");
      if (!imgs.length) return;
      var k = 0;
      imgs.forEach(function (i) {
        if (i.hidden) { i.removeAttribute("data-k"); return; }
        i.setAttribute("data-k", String(k));
        i.style.setProperty("--k", k);
        k++;
      });
      h.classList.toggle("no-visual", k === 0);
    });
  }

  function renderAll() {
    document.querySelectorAll("[data-shots]").forEach(renderBlock);
    document.querySelectorAll("[data-shot-img]").forEach(renderImg);
    renderNeutrals();
    syncHolders();
  }

  renderAll();
  document.addEventListener("lucksrei:locale", renderAll);
})();
