"""Comparação v2 × cenário v3 (mesmo personagem híbrido, mesmos tiques), tamanho real e recortes ampliados.
Saída: tools/hero3/out/cenario-v2-x-v3*.png  Uso: python3 tools/hero3/scene_compare.py [tique ...]"""
import json
import os
import sys

import numpy as np
from PIL import Image, ImageDraw

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import preview  # noqa: E402
import review_arms  # noqa: E402
import scene3  # noqa: E402
import scene_v3  # noqa: E402

OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "out")


def blend(dst, layer, op):
    if op == "lighter":
        a = np.asarray(layer, float)
        d = np.asarray(dst, float)
        add = a[..., :3] * (a[..., 3:4] / 255.0)
        d[..., :3] = np.minimum(255, d[..., :3] + add)
        return Image.fromarray(d.astype(np.uint8))
    if op == "multiply":
        a = np.asarray(layer, float)
        d = np.asarray(dst, float)
        m = a[..., 3:4] / 255.0
        d[..., :3] = d[..., :3] * (1 - m) + d[..., :3] * (a[..., :3] / 255.0) * m
        return Image.fromarray(d.astype(np.uint8))
    out = dst.copy()
    out.alpha_composite(layer)
    return out


def compose_v3(S, frames, rec):
    idx, x, y, chair, mug_hand, _ = rec[:6]
    base, over = frames[idx]
    im = Image.new("RGBA", (240, 150), (0, 0, 0, 255))
    for name in ("sky", "room"):
        im = blend(im, S[name], "source-over")
    ch = S["chair"] if chair == 0 else S["chair"].transform(im.size, Image.AFFINE, (1, 0, -chair, 0, 1, 0))
    im.alpha_composite(ch)
    preview.place(im, base, x, y)
    im.alpha_composite(S["desk"])
    if not mug_hand:
        im.alpha_composite(S["mug"])
    preview.place(im, over, x, y)
    im.alpha_composite(S["monitors"])
    for name, op in (("moon", "lighter"),):
        im = blend(im, S[name], op)
    return im


if __name__ == "__main__":
    S = scene_v3.build()
    L = scene3.layers()
    d, frames = review_arms.load_atlas(os.path.join(scene3.ROOT, "assets", "img", "hero", "v3"))
    allr = preview.expand(d["intro"]) + preview.expand(d["loop"])
    ticks = [int(t) for t in sys.argv[1:]] or [70, 230]
    rows = []
    for t in ticks:
        a = review_arms.compose(L, frames, allr[t])
        b = compose_v3(S, frames, allr[t])
        row = Image.new("RGB", (2 * 480 + 12, 300 + 18), (12, 14, 20))
        ImageDraw.Draw(row).text((4, 2), "v2 (cenário atual)", fill=(255, 220, 90))
        ImageDraw.Draw(row).text((496, 2), "v3 (cenário melhorado)", fill=(255, 220, 90))
        row.paste(a.convert("RGB").resize((480, 300), Image.NEAREST), (0, 18))
        row.paste(b.convert("RGB").resize((480, 300), Image.NEAREST), (492, 18))
        rows.append(row)
        # recortes ampliados (4×): janela, mesa/monitores, estante, cadeira/tapete
        crops = [(4, 18, 64, 78), (84, 74, 174, 134), (150, 40, 202, 90), (40, 100, 120, 150)]
        z = []
        for c in crops:
            pa = a.crop(c).convert("RGB")
            pb = b.crop(c).convert("RGB")
            w, h = pa.size
            k = 4
            t_ = Image.new("RGB", (2 * w * k + 6, h * k), (12, 14, 20))
            t_.paste(pa.resize((w * k, h * k), Image.NEAREST), (0, 0))
            t_.paste(pb.resize((w * k, h * k), Image.NEAREST), (w * k + 6, 0))
            z.append(t_)
        Z = Image.new("RGB", (max(i.width for i in z), sum(i.height + 8 for i in z)), (12, 14, 20))
        yy = 0
        for i in z:
            Z.paste(i, (0, yy))
            yy += i.height + 8
        Z.save(os.path.join(OUT, f"cenario-v2-x-v3-detalhes-{t}.png"))
    H_ = sum(r.height for r in rows)
    out = Image.new("RGB", (rows[0].width, H_))
    yy = 0
    for r in rows:
        out.paste(r, (0, yy))
        yy += r.height
    out.save(os.path.join(OUT, "cenario-v2-x-v3.png"))
    print("ok")
