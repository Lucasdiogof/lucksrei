"""Gera os assets do hero em pixel art (v2) e injeta o mapa de frames/geometria no JS.

Uso (na raiz do site):  python tools/make-hero-scene.py
Saída:  assets/img/hero/scene.png        cenário fixo (parede, chão, janela, quadro, prateleira, cadeira)
        assets/img/hero/desk.png         mesa + teclado + monitor (RGBA, desenhada POR CIMA do corpo do Lucas)
        assets/img/hero/sprites.png      frames: linha de cima = corpo; mesma grade deslocada de N = braços sobre a mesa
        assets/img/hero/poster-empty.png escritório vazio (antes da animação e no fim)
        assets/img/hero/poster-final.png Lucas sentado programando (prefers-reduced-motion e sem JS)
        + bloco FRAMES em assets/js/hero-scene.js (entre /*FRAMES*/ e /*END-FRAMES*/)

Perspectiva: câmera na frente-esquerda olhando para o fundo-direita. A parede do fundo e a mesa são paralelas e sobem
1 px a cada 6 px para a direita; a profundidade (da frente para o fundo) vai a 45° para cima-esquerda. O Lucas senta
ATRÁS da mesa (entre ela e a parede), virado em 3/4 para o monitor, que fica de costas para o visitante.
Tudo desenhado por código: nada de arte de terceiros.
"""
import json
import math
import os
import re
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from PIL import Image, ImageDraw  # noqa: E402

import hero_char as hc  # noqa: E402
import hero_frames as hf  # noqa: E402

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, "assets", "img", "hero")
os.makedirs(OUT, exist_ok=True)

W, H = 240, 150


def ly(x0, y0, x):
    """Altura (y) de uma linha paralela à parede/mesa que passa por (x0, y0)."""
    return y0 - (x - x0) / 6.0


# ---------------------------------------------------------------- geometria do mundo (px lógicos)
WALL = (87, 96)                       # um ponto da base da parede
DESK_BL, DESK_FL = (86, 110), (98, 122)   # tampo: canto fundo-esquerdo e frente-esquerdo
DESK_LEN, DESK_H = 126, 19            # comprimento ao longo da diagonal e altura das faces
SLOT = (112, 125)                     # pés do Lucas em pé diante da cadeira (âncora de todos os frames sentado)
SEAT = (SLOT[0] + hf.SEAT_HIP_CELL[0] - hc.FX, SLOT[1] + hf.SEAT_HIP_CELL[1] - hc.FY)   # chairSeatAnchor = (114, 109)
ENTRY, PRESENT, WAYPOINT = (-14, 140), (66, 140), (84, 128)
MUG = (133, 108)                      # canto superior esquerdo da caneca na mesa (alça em x-2), à frente dos monitores
# dois monitores lado a lado, JUNTOS, na frente do teclado (entre o teclado e a câmera), num V bem leve:
# (x0, x1, base em x0, base em x1, altura, lado do filete aceso 'l'/'r')
MONITORS = [(97, 112, 114, 115, 15, "l"), (114, 129, 116, 113, 15, "r")]
CROP_MOBILE = {"x": 40, "y": 14, "w": 160, "h": 136}
HELLO = (62, 8)                       # canto superior esquerdo da legenda: faixa vazia da parede, acima de janela/quadro/prateleira
HELLO_CROP = (44, 17)                # no recorte do celular: no topo, sobre a parede vazia


def rgb(h):
    return tuple(int(h[i:i + 2], 16) for i in (1, 3, 5))


C = {
    "wall_t": rgb("#0b1020"), "wall_b": rgb("#141b36"), "base": rgb("#1c2646"), "base_hi": rgb("#2b3a6a"),
    "floor": rgb("#121830"), "floor2": rgb("#0f1529"), "plank": rgb("#0b1022"),
    "rug": rgb("#17234b"), "rug2": rgb("#1c2b5c"), "gold": rgb("#e8bc46"), "gold_d": rgb("#96681a"), "gold_l": rgb("#ffe078"),
    "wood": rgb("#5a4331"), "wood_hi": rgb("#7d5f45"), "wood_d": rgb("#3f2f23"), "wood_dd": rgb("#2c2119"),
    "blue": rgb("#3c82ff"), "blue_l": rgb("#63b3ff"), "cyan": rgb("#46d9ff"), "ivory": rgb("#f5f0e4"),
    "navy": rgb("#0e1530"), "navy2": rgb("#18214a"), "navy3": rgb("#222d5e"), "metal": rgb("#262d4c"), "metal_hi": rgb("#3c4675"),
    "metal_d": rgb("#171c33"), "ink": rgb("#070a16"),
    "leaf": rgb("#2f8f6a"), "leaf_d": rgb("#1f6a50"), "leaf_l": rgb("#4fc08a"), "pot": rgb("#a35a3e"), "pot_d": rgb("#74402e"),
}


def lerp(a, b, t):
    return tuple(int(round(a[i] + (b[i] - a[i]) * t)) for i in range(3))


class Canvas:
    def __init__(self, base=None, mode="RGBA"):
        self.im = Image.new(mode, (W, H), base if base else (0, 0, 0, 0))
        self.p = self.im.load()

    def put(self, x, y, c, a=255):
        x, y = int(round(x)), int(round(y))
        if 0 <= x < W and 0 <= y < H:
            self.p[x, y] = c + (a,) if len(self.p[x, y]) == 4 else c

    def get(self, x, y):
        return self.p[x, y][:3]

    def tint(self, x, y, c, t):
        if 0 <= x < W and 0 <= y < H:
            px = self.p[x, y]
            if len(px) == 4 and px[3] == 0:
                return
            self.put(x, y, lerp(px[:3], c, t), px[3] if len(px) == 4 else 255)

    def rect(self, x0, y0, x1, y1, c):
        for y in range(int(y0), int(y1) + 1):
            for x in range(int(x0), int(x1) + 1):
                self.put(x, y, c)

    def poly(self, pts, c):
        ys = [p[1] for p in pts]
        for y in range(int(math.floor(min(ys))), int(math.ceil(max(ys))) + 1):
            xs = []
            for i in range(len(pts)):
                (xa, ya), (xb, yb) = pts[i], pts[(i + 1) % len(pts)]
                if (ya <= y + 0.5 < yb) or (yb <= y + 0.5 < ya):
                    xs.append(xa + (y + 0.5 - ya) / (yb - ya) * (xb - xa))
            xs.sort()
            for j in range(0, len(xs) - 1, 2):
                for x in range(int(round(xs[j])), int(round(xs[j + 1]))):
                    self.put(x, y, c)

    def slant(self, x0, x1, y0, c):
        """Linha de 1 px paralela à parede (sobe 1 a cada 6) de x0 a x1, passando por (x0, y0)."""
        for x in range(int(x0), int(x1) + 1):
            self.put(x, round(ly(x0, y0, x)), c)

    def wallrect(self, x0, x1, ytop0, h, c):
        """Retângulo 'pregado' na parede: lados verticais, topo/base inclinados."""
        for x in range(int(x0), int(x1) + 1):
            t = round(ly(x0, ytop0, x))
            for y in range(t, t + h):
                self.put(x, y, c)


def wall_base(x):
    return ly(WALL[0], WALL[1], x)


# ================================================================ cenário (fixo)
def build_bg():
    cv = Canvas((0, 0, 0, 255))
    # parede em faixas com dither, até a base inclinada
    for x in range(W):
        wb = round(wall_base(x))
        for y in range(0, wb):
            t = y / 100
            band = int(t * 12)
            frac = t * 12 - band
            c0 = lerp(C["wall_t"], C["wall_b"], min(1, band / 12))
            c1 = lerp(C["wall_t"], C["wall_b"], min(1, (band + 1) / 12))
            use1 = ((x + y) % 2 == 0 and frac > 0.5) or ((x + y) % 4 == 0 and frac > 0.25)
            cv.put(x, y, c1 if use1 else c0)
        # rodapé (3 px) e chão
        for y in range(wb - 3, wb):
            cv.put(x, y, C["base"])
        cv.put(x, wb - 3, C["base_hi"])
        for y in range(wb, H):
            v = y + x / 6.0
            row = int(v) // 7
            c = C["floor"] if row % 2 == 0 else C["floor2"]
            if int(v) % 7 == 0:
                c = C["plank"]
            u = x - y + row * 23
            if u % 53 == 0:
                c = C["plank"]
            cv.put(x, y, c)
    # luar no chão (paralelogramo vindo da janela)
    for y in range(110, 146):
        for x in range(4, 80):
            if y > wall_base(x) + 2:
                d = abs((x - 34 - (y - 128) * 0.6) / 22) + abs((y - 128) / 14)
                if d < 1 and (x + y) % 2 == 0:
                    cv.tint(x, y, C["blue_l"], 0.10 * (1 - d))
    # tapete (alinhado à mesa), borda dourada apagada
    P0, A, B = (60, 142), (156, -26), (-26, -26)
    for y in range(80, H):
        for x in range(W):
            # coordenadas (s, t) no losango do tapete
            dx, dy = x - P0[0], y - P0[1]
            det = A[0] * B[1] - A[1] * B[0]
            s = (dx * B[1] - dy * B[0]) / det
            t = (A[0] * dy - A[1] * dx) / det
            if 0 <= s <= 1 and 0 <= t <= 1 and y > wall_base(x):
                edge = s < 0.012 or s > 0.988 or t < 0.06 or t > 0.94
                cv.put(x, y, C["gold_d"] if edge and (s < 0.012 or s > 0.988 or t < 0.035 or t > 0.965) else
                       (C["rug"] if (int(s * 60) + int(t * 9)) % 2 == 0 else C["rug2"]))

    # ---------- janela (noite, cidade)
    X0, X1, T0, HH = 12, 54, 26, 46
    cv.wallrect(X0 - 1, X1 + 1, ly(X0, T0, X0 - 1) - 1, HH + 2, C["metal_hi"])
    cv.wallrect(X0, X1, T0, HH, C["metal"])
    for x in range(X0 + 2, X1 - 1):
        t0 = round(ly(X0, T0, x)) + 2
        for y in range(t0, t0 + HH - 4):
            cv.put(x, y, lerp(rgb("#0a1030"), rgb("#2a4a96"), (y - t0) / (HH - 4)))
    for sx, sy in ((17, 31), (24, 33), (34, 27), (45, 27), (20, 41), (40, 36)):
        cv.put(sx, sy, C["ivory"])
    for yy in range(-4, 5):
        for xx in range(-4, 5):
            if xx * xx + yy * yy <= 14 and not ((xx + 2) ** 2 + (yy - 1) ** 2 <= 11):
                cv.put(44 + xx, 33 + yy, rgb("#f3eccd"))
    for bx, bw, bh in ((14, 5, 11), (20, 5, 16), (26, 6, 9), (33, 5, 18), (39, 6, 12), (46, 6, 15)):
        for x in range(bx, bx + bw):
            gb = round(ly(X0, T0, x)) + HH - 3
            for y in range(gb - bh, gb):
                cv.put(x, y, rgb("#0a1230"))
            for wy in range(gb - bh + 2, gb - 1, 4):
                if (x - bx) % 3 == 1 and (x * 7 + wy * 3) % 5 < 2:
                    cv.put(x, wy, C["gold"] if (x + wy) % 4 else C["cyan"])
    for x in range(X0, X1 + 1):                       # travessa horizontal
        cv.put(x, round(ly(X0, T0 + HH // 2, x)), C["metal"])
    for y in range(round(ly(X0, T0, 33)), round(ly(X0, T0, 33)) + HH):
        cv.put(33, y, C["metal"])
    cv.wallrect(X0 - 2, X1 + 2, ly(X0, T0 + HH, X0 - 2), 2, C["metal_hi"])   # parapeito

    # ---------- quadro com a coroa (o ÚNICO elemento de coroa da cena)
    QX, QT = 64, 42
    cv.wallrect(QX, QX + 15, QT, 16, C["gold_d"])
    cv.wallrect(QX + 1, QX + 14, ly(QX, QT, QX + 1) + 1, 14, C["navy"])
    crown = ["..G..G..G.", ".GG.GG.GG.", ".GGGGGGGG.", "GGGGGGGGGG", "GlGGlGGlGG", "dddddddddd"]
    for ry, row in enumerate(crown):
        for rx, ch in enumerate(row):
            if ch != ".":
                x = QX + 3 + rx
                cv.put(x, round(ly(QX, QT, x)) + 4 + ry, {"G": C["gold"], "l": C["gold_l"], "d": C["gold_d"]}[ch])

    # ---------- pôster de app (wireframe) atrás do Lucas
    PX, PT = 98, 50
    cv.wallrect(PX, PX + 13, PT, 18, C["blue"])
    cv.wallrect(PX + 1, PX + 12, ly(PX, PT, PX + 1) + 1, 16, C["navy2"])
    for i, (w_, col) in enumerate(((8, "blue_l"), (6, "metal_hi"), (9, "metal_hi"), (5, "gold"))):
        x0 = PX + 3
        for x in range(x0, x0 + w_):
            cv.put(x, round(ly(PX, PT, x)) + 4 + i * 3, C[col])

    # ---------- prateleira com livros e planta (acima da mesa)
    SX0, SX1, SY = 146, 206, 60
    for x in range(SX0, SX1 + 1):
        y = round(ly(SX0, SY, x))
        cv.put(x, y, C["wood_hi"]); cv.put(x, y + 1, C["wood"]); cv.put(x, y + 2, C["wood_dd"])
    books = [(4, "#3c82ff", 12), (3, "#18214a", 14), (4, "#e8bc46", 11), (3, "#2a3a7a", 13), (5, "#63b3ff", 12), (3, "#18214a", 10)]
    x = SX0 + 4
    for bw, col, bh in books:
        for xx in range(x, x + bw):
            y0 = round(ly(SX0, SY, xx))
            for yy in range(y0 - bh, y0):
                cv.put(xx, yy, rgb(col))
            cv.put(xx, y0 - bh, lerp(rgb(col), C["ivory"], 0.35))
        x += bw + 1
    px0 = 188
    for xx in range(px0, px0 + 7):
        y0 = round(ly(SX0, SY, xx))
        for yy in range(y0 - 6, y0):
            cv.put(xx, yy, C["pot"] if yy > y0 - 5 else C["pot_d"])
    for lx, ly_ in ((189, 44), (192, 41), (194, 45), (190, 47), (193, 46), (187, 46), (195, 43)):
        cv.rect(lx, ly_ - 3, lx + 1, ly_ - 1, C["leaf"] if (lx + ly_) % 2 else C["leaf_l"])

    # ---------- planta de chão (canto da frente à esquerda)
    pb = 134
    cv.rect(4, pb - 14, 16, pb, C["pot"]); cv.rect(4, pb - 14, 16, pb - 12, C["pot_d"]); cv.rect(5, pb, 15, pb + 1, C["pot_d"])
    for ang, ln, curve in [(-60, 22, 0.9), (-35, 26, 0.6), (-8, 28, 0.3), (18, 24, -0.4), (42, 20, -0.8), (-82, 15, 1.1), (66, 15, -1.0)]:
        x, y = 10.0, pb - 14.0
        for k in range(ln):
            t = k / ln
            a_ = math.radians(ang - 90 + curve * 40 * t)
            x += math.cos(a_); y += math.sin(a_)
            wid = max(1, int(round(3 * math.sin(math.pi * min(1, t * 1.15)))))
            for w_ in range(-(wid // 2), wid - wid // 2):
                cv.put(int(round(x)) + w_, int(round(y)), C["leaf_l"] if w_ < 0 else (C["leaf"] if t < 0.7 else C["leaf_d"]))

    # ---------- luz da tela (ela está virada para o Lucas): sopro azul na parede atrás dele
    for y in range(52, 104):
        for x in range(80, 150):
            d = math.hypot((x - 114) / 34, (y - 80) / 24)
            if d < 1 and (x + y) % 3 == 0 and y < wall_base(x) - 3:
                cv.tint(x, y, C["blue"], 0.09 * (1 - d))

    chair(cv)
    return cv.im


def chair(cv):
    """Cadeira de escritório virada para a mesa (mesma diagonal): encosto atrás do Lucas, assento em 3/4."""
    BX0, BX1, BT, BH = 99, 119, 82, 20
    # base e pistão (ficam atrás da mesa, mas existem)
    cx, fy = SEAT[0] - 1, SEAT[1] + 12
    cv.rect(cx - 1, SEAT[1] + 2, cx + 1, fy - 2, C["metal"])
    for dx, dy in ((-9, 1), (8, -1), (-4, 3), (5, 3), (0, -2)):
        cv.put(cx + dx, fy + dy, C["ink"]); cv.put(cx + dx + 1, fy + dy, C["ink"])
    # assento: losango alinhado (frente na diagonal, profundidade a 45°)
    front_l, length, depth = (102, 110), 22, 6
    pts = [front_l, (front_l[0] + length, ly(*front_l, front_l[0] + length)),
           (front_l[0] + length - depth, ly(*front_l, front_l[0] + length) - depth), (front_l[0] - depth, front_l[1] - depth)]
    cv.poly([(p[0], p[1] + 1) for p in pts], C["navy"])
    cv.poly(pts, rgb("#26336c"))
    cv.slant(front_l[0] - depth, front_l[0] - depth + length, front_l[1] - depth, rgb("#34449a"))
    # encosto: almofada paralela à mesa (cantos arredondados, costura no meio), espessura à esquerda
    cush, frame, lit = C["navy3"], C["navy"], rgb("#2c3a78")
    for x in range(BX0 - 2, BX1 + 1):
        t = round(ly(BX0, BT, x))
        if x < BX0:                                                    # espessura (lado)
            for y in range(t + 1, t + BH - 1):
                cv.put(x, y, C["metal_d"])
            continue
        r = 2 if x in (BX0, BX1) else (1 if x in (BX0 + 1, BX1 - 1) else 0)
        for y in range(t + r, t + BH - r):
            cv.put(x, y, frame if x in (BX0, BX1) or y in (t + r, t + BH - r - 1) else (lit if x > BX1 - 6 else cush))
    for y in range(round(ly(BX0, BT, BX0 + 10)) + 3, round(ly(BX0, BT, BX0 + 10)) + BH - 3):
        cv.put(BX0 + 10, y, frame)                                     # costura
    for x in range(BX0 + 3, BX1 - 2):
        cv.put(x, round(ly(BX0, BT, x)) + 1, rgb("#3a4c96"))          # luz da tela na borda de cima


# ================================================================ mesa (camada por cima do corpo)
def desk_corners():
    BL, FL = DESK_BL, DESK_FL
    BR = (BL[0] + DESK_LEN, ly(*BL, BL[0] + DESK_LEN))
    FR = (FL[0] + DESK_LEN, ly(*FL, FL[0] + DESK_LEN))
    return BL, FL, FR, BR


def build_desk():
    cv = Canvas()
    BL, FL, FR, BR = desk_corners()
    hgt = DESK_H
    # face lateral esquerda e face da frente: faixa superior (4 px), painel recuado mais escuro e pés nos cantos
    cv.poly([BL, FL, (FL[0], FL[1] + hgt), (BL[0], BL[1] + hgt)], C["wood_dd"])
    cv.poly([FL, FR, (FR[0], FR[1] + hgt), (FL[0], FL[1] + hgt)], rgb("#33261c"))
    for x in range(int(FL[0]), int(FR[0]) + 1):
        top = round(ly(*FL, x))
        for y in range(top + 1, top + 5):
            cv.put(x, y, C["wood_d"])                                  # faixa (tampo grosso)
        cv.put(x, top + 5, C["wood_dd"])
        cv.put(x, top + hgt, C["ink"])                                 # contato com o chão
    for i in range(0, 13):                                             # faixa na lateral
        for y in range(1, 5):
            cv.put(BL[0] + i, BL[1] + i + y, C["wood_d"])
    for lx in (int(FL[0]), int(FL[0]) + 1, int(FL[0]) + 2, int(FL[0]) + 3):   # pé da frente-esquerda (quina)
        top = round(ly(*FL, lx))
        for y in range(top + 5, top + hgt):
            cv.put(lx, y, C["wood"] if lx < int(FL[0]) + 2 else C["wood_d"])
    for i in range(0, 3):                                              # pé do fundo-esquerda (na lateral)
        for y in range(BL[1] + 5 + i, BL[1] + hgt + i):
            cv.put(BL[0] + i, y, C["wood_d"])
    # tampo
    cv.poly([BL, FL, FR, BR], C["wood"])
    for x in range(int(FL[0]), int(FR[0]) + 1):                      # quina da frente iluminada
        cv.put(x, round(ly(*FL, x)), C["wood_hi"])
        cv.put(x, round(ly(*FL, x)) + 1, C["wood_d"])
    for i in range(0, 13):                                           # quina lateral
        cv.put(BL[0] + i, BL[1] + i, C["wood_hi"] if i % 2 == 0 else C["wood"])
    for x in range(int(BL[0]), int(BR[0]) + 1):                      # borda do fundo
        cv.put(x, round(ly(*BL, x)), C["wood_d"])
    # veio da madeira (linhas tênues ao longo da diagonal)
    for k, off in enumerate((4, 8)):
        for x in range(int(BL[0]) + 6 + k * 9, int(BR[0]) - 8, 1):
            if (x * 3 + k) % 11 < 6:
                cv.put(x, round(ly(BL[0] + off, BL[1] + off, x)), C["wood_d"])
    # luz da tela no tampo (entre o monitor e o Lucas)
    for y in range(90, 120):
        for x in range(100, 170):
            d = math.hypot((x - 116) / 34, (y - 110) / 9)
            if d < 1 and (x + y) % 2 == 0:
                cv.tint(x, y, C["blue_l"], 0.10 * (1 - d))

    keyboard(cv)
    return cv.im


def build_monitors():
    cv = Canvas()
    for m in MONITORS:
        monitor(cv, *m)
    return cv.im


def keyboard(cv):
    nl, length, depth = (104, 115), 26, 4
    pts = [nl, (nl[0] + length, ly(*nl, nl[0] + length)), (nl[0] + length - depth, ly(*nl, nl[0] + length) - depth), (nl[0] - depth, nl[1] - depth)]
    cv.poly([(p[0], p[1] + 1) for p in pts], rgb("#121830"))
    cv.poly(pts, rgb("#3b4468"))
    for r in range(1, 4):                                            # fileiras de teclas
        for x in range(nl[0] - r + 1, nl[0] + length - r - 1):
            if (x + r) % 2 == 0:
                cv.put(x, round(ly(nl[0] - r, nl[1] - r, x)), rgb("#7e89b8"))
    for x in range(nl[0], nl[0] + length):                           # filete na frente
        cv.put(x, round(ly(*nl, x)) + 1, rgb("#262e52"))


MON = {"back": rgb("#444c6e"), "hi": rgb("#7480b4"), "edge": rgb("#0a0d1c"), "vent": rgb("#2b3252"), "foot": rgb("#161b32")}


def monitor(cv, x0, x1, b0, b1, h, rim):
    """Monitor visto por trás (a tela é do lado do Lucas): traseira grafite com contorno, respiros e led, pescoço e pé; o
    filete do lado de fora mostra a luz da tela vazando (o JS o acende)."""
    def bot(x):
        return round(b0 + (b1 - b0) * (x - x0) / max(1, x1 - x0))

    sx = (x0 + x1) // 2
    for dx in range(-5, 6):                                  # pé: base oval escura com contorno
        y = bot(sx + dx)
        cv.put(sx + dx, y - 1, MON["edge"]); cv.put(sx + dx, y, MON["foot"]); cv.put(sx + dx, y + 1, MON["edge"])
    cv.rect(sx - 1, bot(sx) - 5, sx + 1, bot(sx) - 1, MON["foot"])           # pescoço
    cv.put(sx - 2, bot(sx) - 3, MON["edge"]); cv.put(sx + 2, bot(sx) - 3, MON["edge"])
    for x in range(x0, x1 + 1):                              # traseira
        b = bot(x) - 4
        top = bot(x) - h
        for y in range(top, b + 1):
            edge = y == top or y == b or x in (x0, x1)
            cv.put(x, y, MON["edge"] if edge else MON["back"])
        cv.put(x, top + 1, MON["hi"])                        # filete de luz no topo
    for x in range(x0 + 3, x1 - 2):                          # respiros
        if x % 2 == 0:
            cv.put(x, bot(x) - h + 5, MON["vent"]); cv.put(x, bot(x) - h + 7, MON["vent"])
    cv.put(sx, bot(sx) - 6, C["gold_d"])                     # led discreto
    xr = x0 - 1 if rim == "l" else x1 + 1
    for y in range(bot(xr + (1 if rim == "l" else -1)) - h + 1, bot(xr + (1 if rim == "l" else -1)) - 4):
        cv.put(xr, y, C["blue_l"])


# ================================================================ folha de sprites
def mirror(im):
    m = im.transpose(Image.FLIP_LEFT_RIGHT)
    out = Image.new("RGBA", m.size, (0, 0, 0, 0))
    out.alpha_composite(m, (-(hc.CW - 1 - 2 * hc.FX), 0))           # mantém a âncora dos pés em x=FX
    return out


def build_sheet():
    order = list(hf.ORDER)
    # andar/parar para a esquerda = espelho
    names = dict(order)
    order.insert([n for n, _ in order].index("walk_r") + 1, ("walk_l", [(b, None) for b, _ in names["walk_r"]]))
    order.insert([n for n, _ in order].index("stand_r") + 1, ("stand_l", [(b, None) for b, _ in names["stand_r"]]))
    order.insert([n for n, _ in order].index("turn_r") + 1, ("turn_l", [(b, None) for b, _ in names["turn_r"]]))
    imgs, meta = [], {}
    for name, frames in order:
        meta[name] = [len(imgs), len(frames)]
        for b, o in frames:
            bi = b.image()
            oi = o.image() if o is not None else Image.new("RGBA", (hc.CW, hc.CH), (0, 0, 0, 0))
            if name.endswith("_l"):
                bi, oi = mirror(bi), mirror(oi)
            imgs.append((bi, oi))
    n, cols = len(imgs), 10
    rows = (n + cols - 1) // cols
    sheet = Image.new("RGBA", (cols * hc.CW, 2 * rows * hc.CH), (0, 0, 0, 0))
    for i, (bi, oi) in enumerate(imgs):
        x, y = (i % cols) * hc.CW, (i // cols) * hc.CH
        sheet.alpha_composite(bi, (x, y))
        sheet.alpha_composite(oi, (x, y + rows * hc.CH))
    return sheet, meta, cols, rows, imgs


def mug_layer(cv):
    x, y = MUG
    cv.rect(x - 1, y - 1, x + 4, y + 5, C["ink"])
    cv.rect(x, y, x + 3, y + 4, C["ivory"])
    cv.rect(x, y + 2, x + 3, y + 3, C["leaf"])                       # branca com faixa verde
    cv.put(x, y + 3, C["leaf_d"]); cv.put(x + 1, y + 3, C["leaf_d"])
    cv.put(x, y, rgb("#4e3423")); cv.put(x + 1, y, rgb("#4e3423"))
    cv.put(x - 2, y + 1, C["ink"]); cv.put(x - 2, y + 2, C["ivory"]); cv.put(x - 2, y + 3, C["ink"])


def main():
    bg, desk, mons = build_bg(), build_desk(), build_monitors()
    bg.convert("RGB").save(os.path.join(OUT, "scene.png"), optimize=True)
    desk.save(os.path.join(OUT, "desk.png"), optimize=True)
    mons.save(os.path.join(OUT, "monitors.png"), optimize=True)
    sheet, meta, cols, rows, imgs = build_sheet()
    sheet.save(os.path.join(OUT, "sprites.png"), optimize=True)

    def compose(frame=None):
        im = bg.copy().convert("RGBA")
        if frame is not None:
            b, o = imgs[meta[frame][0]]
            im.alpha_composite(b, (SLOT[0] - hc.FX, SLOT[1] - hc.FY))
        im.alpha_composite(desk)
        m = Canvas(); mug_layer(m); im.alpha_composite(m.im)
        if frame is not None:
            im.alpha_composite(o, (SLOT[0] - hc.FX, SLOT[1] - hc.FY))
        im.alpha_composite(mons)
        return im.convert("RGB")

    compose().save(os.path.join(OUT, "poster-empty.png"), optimize=True)
    compose("typing").save(os.path.join(OUT, "poster-final.png"), optimize=True)

    data = {"cell": [hc.CW, hc.CH], "anchor": [hc.FX, hc.FY], "cols": cols, "rows": rows, "frames": meta,
            "step": hf.STEP, "entry": ENTRY, "present": PRESENT, "waypoint": WAYPOINT, "slot": SLOT, "seat": list(SEAT),
            "mug": MUG, "monitors": [[(m[1] + 1) if m[5] == "r" else (m[0] - 1), (m[3] if m[5] == "r" else m[2]) - m[4] - 1, m[4] - 4] for m in MONITORS],
            "crop": CROP_MOBILE, "hello": HELLO, "helloCrop": HELLO_CROP, "glow": [30, 10, 24, 34]}
    js = os.path.join(ROOT, "assets", "js", "hero-scene.js")
    if os.path.exists(js):
        s = open(js, encoding="utf-8", newline="").read()
        block = "/*FRAMES*/ " + json.dumps(data, separators=(",", ":")) + " /*END-FRAMES*/"
        open(js, "w", encoding="utf-8", newline="").write(re.sub(r"/\*FRAMES\*/.*?/\*END-FRAMES\*/", lambda m: block, s, flags=re.S))
    for f in ("scene.png", "desk.png", "sprites.png", "poster-empty.png", "poster-final.png"):
        print(f, os.path.getsize(os.path.join(OUT, f)), "bytes")
    print("seat (chairSeatAnchor):", SEAT, "frames:", sum(v[1] for v in meta.values()))


if __name__ == "__main__":
    main()
