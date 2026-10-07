"""Quadros de caminhada a partir da arte de referência do personagem (tools/ref/lucas-walk-ref.webp, 8 quadros de perfil
para a direita, fundo transparente). A arte é reduzida para a escala da cena (64 px de altura) por média de área com
alfa pré-multiplicado, recebe uma paleta comum (sem dithering) e é encaixada na célula 72x72 do gerador:
sola dos pés na linha da âncora e o tronco centrado no x da âncora (caminhada no lugar; o JS desloca o personagem).
"""
import os
import numpy as np
from PIL import Image

import hero_char as hc

REF = os.path.join(os.path.dirname(os.path.abspath(__file__)), "ref", "lucas-walk-ref.webp")
HEIGHT = 64                 # altura do personagem na cena (px lógicos), igual à dos quadros desenhados por código
SOLE_Y = hc.FY + 1          # última linha opaca (sola) na célula
STAND_FRAME = 3             # quadro com as pernas juntas: vira a pose "parado de perfil"


class ImgFrame:
    """Quadro pronto (RGBA na célula), com a mesma interface dos Cell desenhados por código."""
    def __init__(self, im):
        self.im = im

    def image(self):
        return self.im.copy()


def _segments(alpha):
    cols = alpha.sum(axis=0) > 3
    segs, s = [], None
    for x, v in enumerate(cols):
        if v and s is None:
            s = x
        if not v and s is not None:
            if x - s > 30:
                segs.append((s, x))
            s = None
    if s is not None:
        segs.append((s, len(cols)))
    return segs


def _frames():
    im = Image.open(REF).convert("RGBA")
    a = np.asarray(im)
    alpha = a[:, :, 3] > 40
    rows = np.where(alpha.sum(axis=1) > 3)[0]
    y0, y1 = rows.min(), rows.max() + 1
    scale = HEIGHT / (y1 - y0)
    small = []
    for x0, x1 in _segments(alpha):
        fr = np.asarray(im.crop((x0 - 4, y0, x1 + 4, y1))).astype(float)
        fr[..., :3] *= fr[..., 3:4] / 255.0
        w = max(1, round(fr.shape[1] * scale))
        pm = np.asarray(Image.fromarray(fr.clip(0, 255).astype("uint8"), "RGBA").resize((w, HEIGHT), Image.BOX)).astype(float)
        al = pm[..., 3]
        rgb = np.where(al[..., None] > 0, pm[..., :3] * 255.0 / np.maximum(al[..., None], 1), 0)
        out = np.zeros((HEIGHT, w, 4), "uint8")
        out[..., :3] = rgb.clip(0, 255).astype("uint8")
        out[..., 3] = np.where(al > 128, 255, 0)
        small.append(out)
    # paleta comum a todos os quadros (as mesmas cores em todo o ciclo)
    W = sum(s.shape[1] for s in small)
    sheet = np.zeros((HEIGHT, W, 4), "uint8")
    x = 0
    for s in small:
        sheet[:, x:x + s.shape[1]] = s
        x += s.shape[1]
    q = np.asarray(Image.fromarray(sheet[..., :3], "RGB").quantize(colors=40, method=Image.Quantize.MEDIANCUT,
                                                                 dither=Image.Dither.NONE).convert("RGB"))
    cells, x = [], 0
    for s in small:
        w = s.shape[1]
        rgba = np.dstack([q[:, x:x + w], s[..., 3]]).astype("uint8")
        x += w
        op = rgba[..., 3] > 0
        ys = np.where(op.any(axis=1))[0]
        # centro do tronco (moletom): média das colunas opacas na faixa do peito
        band = op[int(HEIGHT * 0.32):int(HEIGHT * 0.55)]
        cx = int(round(np.where(band)[1].mean()))
        cell = Image.new("RGBA", (hc.CW, hc.CH), (0, 0, 0, 0))
        cell.alpha_composite(Image.fromarray(rgba, "RGBA"), (hc.FX - cx, SOLE_Y - ys.max()))
        cells.append(cell)
    return cells


_CACHE = None


def walk_frames():
    global _CACHE
    if _CACHE is None:
        _CACHE = _frames()
    return [ImgFrame(c) for c in _CACHE]


def stand_frame():
    return walk_frames()[STAND_FRAME]


# cores do corpo (as mesmas dos quadros desenhados por código): cada pixel da referência vai para a mais próxima
BODY_KEYS = ("o", "D", "T", "L", "c", "Q", "P", "p", "F", "f", "s", "S", "k")


def _unify(cell):
    """Troca a cabeça da referência pela SIDE_HEAD (mesma linguagem da cabeça de frente) e leva o corpo para a paleta comum."""
    a = np.asarray(cell).astype(int).copy()
    op = a[..., 3] > 0
    ys = np.where(op.any(axis=1))[0]
    top = ys.min()
    rows = a[top:top + 16]
    xs = np.where(rows[:14, :, 3].any(axis=0))[0]
    x0 = xs.min() - (16 - (xs.max() - xs.min() + 1)) // 2
    for dy in range(16):
        for x in range(x0 - 2, x0 + 18):
            r, g, b, al = a[top + dy, x]
            if al and not (dy >= 11 and b > r + 25 and b > 60):
                a[top + dy, x] = 0
    pal = np.array([hc.PAL[k] for k in BODY_KEYS])
    nos = np.array([hc.PAL[k] for k in BODY_KEYS if k not in ("s", "S", "k")])   # pés/pernas: sem tons de pele
    m = a[..., 3] > 0
    feet = np.zeros_like(m); feet[ys.max() - 9:, :] = True
    for mask, pp in ((m & ~feet, pal), (m & feet, nos)):
        px = a[mask][:, :3]
        if len(px):
            idx = ((px[:, None, :] - pp[None, :, :]) ** 2).sum(axis=2).argmin(axis=1)
            a[mask, :3] = pp[idx]
    a[m, 3] = 255
    out = Image.fromarray(a.astype("uint8"), "RGBA")
    head = Image.new("RGBA", (16, 16), (0, 0, 0, 0))
    for ry, row in enumerate(hc.SIDE_HEAD):
        for rx, ch in enumerate(row):
            if ch != ".":
                head.putpixel((rx, ry), hc.FRONT_PAL[ch] + (255,))
    out.alpha_composite(head, (int(x0), int(top)))
    return out


_UNIFIED = None


def walk_frames():
    global _UNIFIED
    if _UNIFIED is None:
        _UNIFIED = [_unify(c) for c in _frames()]
    return [ImgFrame(c) for c in _UNIFIED]


def stand_frame():
    return walk_frames()[STAND_FRAME]
