"""Auditoria artística: cada pose da v2 (sprites.png em produção) ao lado da equivalente da v3, mesmas condições.
Em pé: personagem sozinho; sentado: no quarto (mesa, caneca, braços sobre a mesa, monitores), na âncora SLOT.
Saída: tools/hero3/out/auditoria-v2-v3-*.png"""
import json
import os
import re
import sys

import numpy as np
from PIL import Image, ImageDraw

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import anims  # noqa: E402
import poses as po  # noqa: E402
import rig  # noqa: E402
import scene3  # noqa: E402

ROOT = scene3.ROOT
SPR = Image.open(os.path.join(ROOT, "assets", "img", "hero", "sprites.png")).convert("RGBA")
src = open(os.path.join(ROOT, "assets", "js", "hero-scene.js"), encoding="utf-8").read()
DATA = json.loads(re.search(r"/\*FRAMES\*/ (.*?) /\*END-FRAMES\*/", src, re.S).group(1))
ROWS = DATA["rows"]


def v2(name, i=0):
    k = DATA["frames"][name][0] + i
    x, y = (k % 10) * 72, (k // 10) * 72
    return SPR.crop((x, y, x + 72, y + 72)), SPR.crop((x, y + ROWS * 72, x + 72, y + ROWS * 72 + 72))


def v3(P, th):
    r = rig.render(P, th)
    return Image.fromarray(r["img"]), Image.fromarray(anims.over_layer(r))


L = scene3.layers()


def seated_scene(base, over, mug=True):
    im = L["bg"].copy()
    im.alpha_composite(L["chair"])
    im.alpha_composite(base, (int(anims.SLOT[0]) - 32, int(anims.SLOT[1]) - 68))
    im.alpha_composite(L["desk"])
    if mug:
        im.alpha_composite(L["mug"])
    im.alpha_composite(over, (int(anims.SLOT[0]) - 32, int(anims.SLOT[1]) - 68))
    im.alpha_composite(L["monitors"])
    return im.crop((86, 62, 142, 124))


def standing(base):
    im = Image.new("RGBA", (72, 72), (52, 56, 78, 255))
    im.alpha_composite(base)
    return im.crop((12, 0, 56, 72))


PAIRS_STAND = [("parado de frente", v2("front_idle")[0], v3(po.stand(), 0)[0]),
               ("parado de perfil", v2("stand_r")[0], v3(po.stand(), 90)[0]),
               ("giro (3/4)", v2("turn_r")[0], v3(po.stand(), 45)[0])]
PAIRS_STAND += [("andar %d" % i, v2("walk_r", i)[0], v3(po.walk(i / 8)[0], 90)[0]) for i in range(0, 8, 2)]
PAIRS_SEAT = [("sentado parado", v2("seated_idle"), v3(po.rest_hands(po.seated()), anims.SEAT_THETA), True),
              ("digitando", v2("typing"), v3(po.typing(0), anims.SEAT_THETA), True),
              ("olhando o teclado", v2("typing_down"), v3(po.typing(0, pitch=-5.0, look=(0.2, 1)), anims.SEAT_THETA), True),
              ("coça a cabeça", v2("scratch_head", 1), v3(po.scratch_head(1.0, 1), anims.SEAT_THETA), True),
              ("coça a nuca", v2("scratch_neck", 1), v3(po.scratch_neck(1.0, 1), anims.SEAT_THETA), True),
              ("comemora", v2("celebrate", 1), v3(po.celebrate(1.0, 1.0), anims.SEAT_THETA), True),
              ("bebe", v2("coffee_drink", 1), v3(po.coffee("sip", 1.0), anims.SEAT_THETA), False),
              ("sentando", v2("sit_down", 4), v3(po.sit(0.62), anims.SEAT_THETA), True)]


def sheet(pairs, fn, Z):
    w, h = pairs[0][1].size
    S = Image.new("RGB", (len(pairs) * (w * Z + 8), 2 * h * Z + 40), (14, 16, 22))
    d = ImageDraw.Draw(S)
    for i, (label, a, b) in enumerate(pairs):
        x = i * (w * Z + 8)
        d.text((x + 2, 2), label, fill=(255, 220, 90))
        S.paste(a.convert("RGB").resize((w * Z, h * Z), Image.NEAREST), (x, 16))
        S.paste(b.convert("RGB").resize((w * Z, h * Z), Image.NEAREST), (x, 24 + h * Z))
    d.text((2, h * Z + 16), "v2 em cima, v3 embaixo", fill=(160, 160, 180))
    S.save(fn)


if __name__ == "__main__":
    sheet([(l, standing(a), standing(b)) for l, a, b in PAIRS_STAND], os.path.join(rig.OUT, "auditoria-v2-v3-em-pe.png"), 5)
    seat = []
    for l, a, b, mug in PAIRS_SEAT:
        seat.append((l, seated_scene(a[0], a[1], mug), seated_scene(b[0], b[1], mug)))
    sheet(seat, os.path.join(rig.OUT, "auditoria-v2-v3-sentado.png"), 5)
    print("ok")
