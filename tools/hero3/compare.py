"""Comparação lado a lado: sprites da v2 em produção × rig v3 (mesma escala, mesmo fundo). Saída: out/compare-*.png."""
import os
import sys

from PIL import Image

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import poses as po  # noqa: E402
import rig  # noqa: E402

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
SPR = Image.open(os.path.join(ROOT, "assets", "img", "hero", "sprites.png")).convert("RGBA")
BG = (52, 56, 78, 255)


def v2(k):
    return SPR.crop(((k % 10) * 72, (k // 10) * 72, (k % 10) * 72 + 72, (k // 10) * 72 + 72))


def row(cells, crop=None, zoom=6):
    cells = [c.crop(crop) if crop else c for c in cells]
    w, h = cells[0].size
    im = Image.new("RGBA", (w * len(cells), h), BG)
    for i, c in enumerate(cells):
        im.alpha_composite(c, (i * w, 0))
    return im.resize((im.width * zoom, im.height * zoom), Image.NEAREST)


def stack(rows):
    W = max(r.width for r in rows)
    im = Image.new("RGBA", (W, sum(r.height for r in rows) + 12 * len(rows)), (20, 22, 30, 255))
    y = 0
    for r in rows:
        im.alpha_composite(r, (0, y))
        y += r.height + 12
    return im


if __name__ == "__main__":
    out = os.path.join(rig.OUT)
    os.makedirs(out, exist_ok=True)
    R = lambda th, P=None: Image.fromarray(rig.render(P if P is not None else po.stand(), th)["img"])  # noqa: E731
    # corpo: frente, perfil, giro (v2 tem 1 quadro) — em cima v2, embaixo v3 nos ângulos equivalentes
    top = row([v2(0), v2(23), v2(3), v2(7), v2(9)], crop=(10, 0, 56, 72))
    bot = row([R(0), R(45), R(90), R(90, po.walk(0.0)[0]), R(90, po.walk(0.25)[0])], crop=(10, 0, 56, 72))
    stack([top, bot]).save(os.path.join(out, "compare-body.png"))
    # cabeças a 12×: v2 (frente, giro, perfil) × v3 (0, 22.5, 45, 67.5, 90)
    hc = (22, 2, 46, 26)
    top = row([v2(0), v2(23), v2(3)], crop=hc, zoom=12)
    bot = row([R(0), R(22.5), R(45), R(67.5), R(90)], crop=hc, zoom=12)
    stack([top, bot]).save(os.path.join(out, "compare-heads.png"))
    print("ok")
