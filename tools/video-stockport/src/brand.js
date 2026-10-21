"use strict";
/* Carrega os SVGs ORIGINAIS da marca (assets/brand/, cópia de stockport-system/assets/branding/stockport/). A geometria nunca é redesenhada. */
SP.loadBrand = async function () {
  const get = async f => (await fetch("assets/brand/" + f)).text();
  SP.assets.mark = await get("stockport_logo_mark.svg");
  SP.assets.wordmark = await get("stockport_wordmark_dark.svg");
  SP.assets.micro = await get("stockport_logo_micro.svg");
  SP.assets.markLight = await get("stockport_logo_mark_light.svg");
  let n = 0;
  /* svg inline com ids únicos (o clipPath "a" do original colidiria entre cópias). Retorna string. */
  KIT.mark = (cls = "", w = "100%") => {
    const id = "mk" + (n++), s = SP.assets.mark.replace(/id="a"/, `id="${id}"`).replace(/url\(#a\)/, `url(#${id})`).replace(/ width="960" height="960"/, ` width="${w}" height="${w}"`);
    return s.replace("<svg ", `<svg class="${cls}" `);
  };
  KIT.markLight = (w = 34) => { const id = "ml" + (n++); return SP.assets.markLight.replace(/id="a"/, `id="${id}"`).replace(/url\(#a\)/, `url(#${id})`).replace(/ width="960" height="960"/, ` width="${w}" height="${w}"`); };
  KIT.wordmark = (cls = "", w = 420) => SP.assets.wordmark.replace(/ width="420" height="110"/, ` width="${w}" height="${w * 110 / 420}"`).replace("<svg ", `<svg class="${cls}" `);
  KIT.micro = (cls = "", w = 64) => SP.assets.micro.replace(/ width="\d+" height="\d+"/, ` width="${w}" height="${w}"`).replace("<svg ", `<svg class="${cls}" `);
};
