/* Lucksrei — renderiza screenshots do idioma atual a partir de screenshots-data.js
 *
 *   <div data-shots="projeto:bloco">          → <figure> por slot disponível no idioma
 *   <img data-shot-img="projeto:slot">        → imagem única (hero/vitrine); some se não existir no idioma
 *
 * Sem fallback entre idiomas. Bloco sem nenhuma imagem no idioma esconde o .case-block inteiro.
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

  function renderImg(img) {
    var parts = img.getAttribute("data-shot-img").split(":");
    var s = S.slotFor(parts[0], parts[1], I.getLocale());
    var holder = img.closest(".case-hero, .showcase-row");
    if (!s) {
      img.hidden = true;
      img.removeAttribute("src");
      if (holder) holder.classList.add("no-visual");
      return;
    }
    img.src = s.src;
    img.alt = decode(I.t(s.altKey));
    if (s.w && s.h) { img.width = s.w; img.height = s.h; }
    img.hidden = false;
    if (holder) holder.classList.remove("no-visual");
  }

  function renderAll() {
    document.querySelectorAll("[data-shots]").forEach(renderBlock);
    document.querySelectorAll("[data-shot-img]").forEach(renderImg);
  }

  renderAll();
  document.addEventListener("lucksrei:locale", renderAll);
})();
