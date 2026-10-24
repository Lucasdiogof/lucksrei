"""Recortes ampliados em volta do personagem em tiques escolhidos (revisão quadro a quadro).
Uso: python3 tools/hero3/inspect_ticks.py saida.png a:b[:passo] ...   (tiques da trilha intro+loop)"""
import os
import sys

from PIL import Image, ImageDraw

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import anims  # noqa: E402
import preview  # noqa: E402
import scene3  # noqa: E402

if __name__ == "__main__":
    if os.environ.get("HYB"):                       # trilhas do personagem híbrido (arte da v2)
        import hybrid_anims
        data, frames, ti, tl = hybrid_anims.build()
    else:
        data, frames, ti, tl = anims.build()
    L = scene3.layers()
    allr = ti + tl
    ids = []
    for arg in sys.argv[2:]:
        p = [int(v) for v in arg.split(":")]
        ids += list(range(p[0], p[1], p[2] if len(p) > 2 else 1))
    Z, cw, ch = 5, 56, 76
    cols = min(10, len(ids))
    rows = (len(ids) + cols - 1) // cols
    S = Image.new("RGB", (cols * cw * Z, rows * (ch * Z + 14)), (18, 20, 28))
    d = ImageDraw.Draw(S)
    for n, i in enumerate(ids):
        r = allr[i]
        im = preview.compose(L, frames, r)
        x, y = r[1], r[2]
        c = im.crop((x - cw // 2, y - ch + 6, x + cw // 2, y + 6)).convert("RGB").resize((cw * Z, ch * Z), Image.NEAREST)
        X, Y = (n % cols) * cw * Z, (n // cols) * (ch * Z + 14)
        S.paste(c, (X, Y + 14))
        d.text((X + 3, Y), "%d  %.2fs  f%d" % (i, i / anims.TICK, r[0]), fill=(255, 220, 90))
    S.save(sys.argv[1])
