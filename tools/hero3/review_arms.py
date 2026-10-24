"""Hero v3 — revisão dos braços sentado: antes × depois, com e sem monitores/mesa, em movimento.

Lê dois atlas+trilhas (o anterior salvo em out/before/ e o atual em assets/img/hero/v3/) e compõe os dois do mesmo
jeito que o runtime, tique a tique. Painéis: antes (como no site) | depois (como no site) | depois sem monitores |
depois sem mesa nem monitores (anatomia completa).
Uso: python3 tools/hero3/review_arms.py    → tools/hero3/out/preview/bracos-*.mp4|gif e bracos-quadros.png
"""
import json
import os
import sys

import numpy as np
from PIL import Image, ImageDraw

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import anims  # noqa: E402
import poses as po  # noqa: E402
import preview  # noqa: E402
import scene3  # noqa: E402

HERE = os.path.dirname(os.path.abspath(__file__))


def load_atlas(d):
    data = json.load(open(os.path.join(d, "actor.json")))
    atlas = np.array(Image.open(os.path.join(d, "actor.png")).convert("RGBA"))
    frames = []
    for f in data["frames"]:
        layers = []
        for key in ("b", "o"):
            r = f.get(key)
            if not r:
                layers.append(None)
                continue
            x, y, w, h, ox, oy = r
            cell = np.zeros((72, 72, 4), np.uint8)
            fx, fy = preview.FOOT
            cell[fy + oy:fy + oy + h, fx + ox:fx + ox + w] = atlas[y:y + h, x:x + w]
            layers.append(cell)
        frames.append(tuple(layers))
    return data, frames


def compose(L, frames, rec, desk=True, monitors=True):
    idx, x, y, chair, mug_hand, talk = rec[:6]
    base, over = frames[idx]
    im = L["bg"].copy()
    ch = L["chair"] if chair == 0 else L["chair"].transform(im.size, Image.AFFINE, (1, 0, -chair, 0, 1, 0))
    im.alpha_composite(ch)
    preview.place(im, base, x, y)
    if desk:
        im.alpha_composite(L["desk"])
    if not mug_hand:
        im.alpha_composite(L["mug"])
    preview.place(im, over, x, y)
    if monitors:
        im.alpha_composite(L["monitors"])
    return im


def panels(L, sets, recs, crop, labels):
    out = []
    for k in range(len(recs[0])):
        tiles = []
        for (frames, desk, mon), rr in zip(sets, recs):
            tiles.append(compose(L, frames, rr[min(k, len(rr) - 1)], desk, mon).crop(crop))
        w, h = tiles[0].size
        c = Image.new("RGBA", (len(tiles) * (w + 3), h + 9), (12, 14, 20, 255))
        d = ImageDraw.Draw(c)
        for i, t in enumerate(tiles):
            c.alpha_composite(t, (i * (w + 3), 9))
            d.text((i * (w + 3) + 2, -2), labels[i], fill=(255, 220, 90))
        out.append(c)
    return out


if __name__ == "__main__":
    L = scene3.layers()
    _, f_old = load_atlas(os.path.join(HERE, "out", "before"))
    d_new, f_new = load_atlas(anims.ASSETS)
    d_old = json.load(open(os.path.join(HERE, "out", "before", "actor.json")))
    loop_old, loop_new = preview.expand(d_old["loop"]), preview.expand(d_new["loop"])
    crop = (78, 52, 150, 128)
    labels = ["antes", "depois", "sem monitores", "sem mesa"]
    sets = [(f_old, True, True), (f_new, True, True), (f_new, True, False), (f_new, False, False)]
    # loop: digitar, olhar, mouse, comemorar, café (primeiros ~23 s)
    n = 23 * anims.TICK
    imgs = panels(L, sets, [loop_old[:n], loop_new[:n], loop_new[:n], loop_new[:n]], crop, labels)
    preview.write_video(imgs, os.path.join(preview.OUT, "bracos-antes-depois-loop"), anims.TICK, 4)
    # resto do loop (coçar cabeça/nuca, recostar)
    imgs2 = panels(L, sets, [loop_old[n:], loop_new[n:], loop_new[n:], loop_new[n:]], crop, labels)
    preview.write_video(imgs2, os.path.join(preview.OUT, "bracos-antes-depois-loop2"), anims.TICK, 4)
    # intro: virar, sentar
    io_, in_ = preview.expand(d_old["intro"]), preview.expand(d_new["intro"])
    imgs3 = panels(L, sets, [io_[-40:], in_[-40:], in_[-40:], in_[-40:]], crop, labels)
    preview.write_video(imgs3, os.path.join(preview.OUT, "bracos-antes-depois-sentar"), anims.TICK, 4)
    # folha para revisão quadro a quadro (a cada 4 tiques)
    sel = (imgs + imgs2)[::4]
    preview.sheet(sel, os.path.join(preview.OUT, "bracos-quadros.png"), cols=4, label=lambda i: "%.1fs" % (i * 4 / anims.TICK), scale=2)
    print("ok", len(imgs) + len(imgs2) + len(imgs3), "tiques")
