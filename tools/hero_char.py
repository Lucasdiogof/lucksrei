"""Personagem v2 (Lucas) em pixel art, gerado por código: partes sombreadas (manga com volume, cotovelo, punho, mão),
cabeça em 3/4 olhando para a direita, contorno por parte. Todos os frames saem do MESMO desenho, então não mudam de pessoa.

Célula 72x72, âncora dos pés em (32, 68). Luz vindo de cima/direita (a do monitor): borda superior azul no moletom.
"""
import math
from PIL import Image

CW, CH = 72, 72
FX, FY = 32, 68

PAL = {
    "o": (10, 12, 26),       # contorno
    "h": (66, 44, 34), "H": (104, 70, 50), "j": (42, 28, 26),   # cabelo / luz / sombra
    "s": (232, 171, 126), "S": (205, 140, 96), "k": (244, 192, 150),   # pele
    "g": (14, 16, 28), "G": (74, 84, 120),                         # armação / reflexo da lente
    "w": (246, 242, 234), "e": (38, 24, 18),
    "b": (72, 48, 36), "B": (46, 31, 26), "m": (178, 86, 68), "t": (255, 252, 246),
    "T": (28, 45, 100), "D": (19, 31, 75), "L": (40, 63, 138), "R": (52, 80, 160), "c": (120, 132, 176),
    "P": (40, 44, 60), "Q": (28, 32, 48), "p": (54, 58, 76),
    "F": (214, 218, 230), "f": (140, 146, 170),
    "M": (30, 34, 52), "N": (132, 196, 255), "n": (72, 118, 220),
    "C": (240, 236, 226), "y": (47, 143, 106),
}

# --------------------------------------------------------------------------- cabeças 16x16 (sem contorno)
def _rows(rows):
    for i, r in enumerate(rows):
        assert len(r) == 16, (i, len(r), r)
    return rows


HEAD_FRONT = _rows([
    "....hhhhhhhh....",
    "..hhhHHHhhhhhh..",
    ".hhhHHhhhhhhhhh.",
    ".hhhhhhhhhhhhhh.",
    ".hhssssssssssjh.",
    ".hssssssssssssh.",
    "SsggggssssggggsS",
    "SsgwegsssgewgssS"[:16],
    "SsggggssssggggsS",
    ".sssssssksssssss"[:16],
    ".bbsssssssssssbb",
    ".bbbbsmtttmsbbb.",
    "..bbbbbmmmbbbb..",
    "...bbbbbBBbbb...",
    "....bbbBBBBbb...",
    ".....bbbbbbb....",
])

# 3/4 para a direita: orelha à esquerda, lente esquerda cheia, lente direita mais estreita, nariz saindo à direita
HEAD_34 = _rows([
    "....hhhhhhhh....",
    "..hhhHHHhhhhhh..",
    ".hhhHHhhhhhhhhh.",
    ".hhhhhhhhhhhhhhh",
    ".hhhhssssssssshh",
    ".hhhhsssssssssss",
    ".hhhhsggggsgggg.",
    ".hhSSsgwegsgwegs",
    ".hhSSsggggsggggs",
    ".hhjSsssssssskks",
    "..hbbbsssssssskk",
    "..hbbbbssmtmsssk",
    "...bbbbbbmmmbbbk",
    "....bbbbbbbbbbb.",
    ".....bbbBBBBbb..",
    "......bbbbbbb...",
])

# 3/4 olhando para baixo (celular/teclado): pupilas embaixo
HEAD_34D = _rows([
    "....hhhhhhhh....",
    "..hhhHHHhhhhhh..",
    ".hhhHHhhhhhhhhh.",
    ".hhhhhhhhhhhhhhh",
    ".hhhhssssssssshh",
    ".hhhhsssssssssss",
    ".hhhhsggggsgggg.",
    ".hhSSsgwwgsgwwgs",
    ".hhSSsgeegsgeegs",
    ".hhjSsssssssskks",
    "..hbbbsssssssskk",
    "..hbbbbssssmsssk",
    "...bbbbbbbmmbbbk",
    "....bbbbbbbbbbb.",
    ".....bbbBBBBbb..",
    "......bbbbbbb...",
])

# 3/4 olhando para cima (pensando): pupilas no canto superior
HEAD_34U = _rows([
    "....hhhhhhhh....",
    "..hhhHHHhhhhhh..",
    ".hhhHHhhhhhhhhh.",
    ".hhhhhhhhhhhhhhh",
    ".hhhhssssssssshh",
    ".hhhhsssssssssss",
    ".hhhhsggggsgggg.",
    ".hhSSsgwegsgweg.",
    ".hhSSsggggsggggs",
    ".hhjSsssssssskks",
    "..hbbbsssssssskk",
    "..hbbbbssmtmsssk",
    "...bbbbbbmmmbbbk",
    "....bbbbbbbbbbb.",
    ".....bbbBBBBbb..",
    "......bbbbbbb...",
])

# Cabeça única: quando REF_HEAD está definida (tools/hero_ref.py), ela substitui todas as cabeças desenhadas abaixo,
# para o rosto ser o MESMO em perfil, frente e sentado. {(dx, dy): (r, g, b)} numa caixa 16x16; REF_HEAD_BLINK = olhos fechados.
REF_HEAD = None
REF_HEAD_BLINK = None

HEADS = {"front": HEAD_FRONT, "frontd": HEAD_FRONT, "34": HEAD_34, "34d": HEAD_34D, "34u": HEAD_34U}


class Cell:
    def __init__(self):
        self.px = {}

    def put(self, x, y, k):
        x, y = int(round(x)), int(round(y))
        if 0 <= x < CW and 0 <= y < CH:
            self.px[(x, y)] = k

    def rect(self, x, y, w, h, k):
        for yy in range(h):
            for xx in range(w):
                self.put(x + xx, y + yy, k)

    # ---- cápsula sombreada: luz (cima/direita) / meio / sombra (baixo/esquerda)
    def capsule(self, p0, p1, w, tones, halo=True):
        (x0, y0), (x1, y1) = p0, p1
        dx, dy = x1 - x0, y1 - y0
        ln = max(1e-6, math.hypot(dx, dy))
        ux, uy = dx / ln, dy / ln
        nx, ny = -uy, ux
        if nx * 0.55 + ny * -0.83 < 0:
            nx, ny = -nx, -ny           # normal aponta para a luz
        r = w / 2.0
        pad = r + 2
        lt, md, dk = tones

        def cover(rad):
            out = {}
            for yy in range(int(min(y0, y1) - pad), int(max(y0, y1) + pad) + 1):
                for xx in range(int(min(x0, x1) - pad), int(max(x0, x1) + pad) + 1):
                    t = max(0.0, min(1.0, ((xx - x0) * dx + (yy - y0) * dy) / (ln * ln)))
                    cx, cy = x0 + dx * t, y0 + dy * t
                    d = math.hypot(xx - cx, yy - cy)
                    if d <= rad:
                        side = ((xx - cx) * nx + (yy - cy) * ny) / max(r, 0.01)
                        out[(xx, yy)] = side
            return out

        if halo:
            for (xx, yy) in cover(r + 1.0):
                self.put(xx, yy, "o")
        for (xx, yy), side in cover(r).items():
            self.put(xx, yy, lt if side > 0.45 else (dk if side < -0.35 else md))

    def disc(self, cx, cy, r, k, halo=False):
        if halo:
            self.disc(cx, cy, r + 1, "o")
        for yy in range(int(cy - r - 1), int(cy + r + 2)):
            for xx in range(int(cx - r - 1), int(cx + r + 2)):
                if (xx - cx) ** 2 + (yy - cy) ** 2 <= r * r + 0.3:
                    self.put(xx, yy, k)

    def poly(self, pts, k):
        ys = [p[1] for p in pts]
        for y in range(int(min(ys)), int(max(ys)) + 1):
            xs = []
            for i in range(len(pts)):
                (xa, ya), (xb, yb) = pts[i], pts[(i + 1) % len(pts)]
                if (ya <= y + 0.5 < yb) or (yb <= y + 0.5 < ya):
                    xs.append(xa + (y + 0.5 - ya) / (yb - ya) * (xb - xa))
            xs.sort()
            for j in range(0, len(xs) - 1, 2):
                for x in range(int(round(xs[j])), int(round(xs[j + 1]))):
                    self.put(x, y, k)

    def head(self, kind, x, y, blink=False):
        if REF_HEAD is not None:
            for (dx, dy), c in (REF_HEAD_BLINK if blink else REF_HEAD).items():
                self.put(x + dx, y + dy, c)
            return
        for ry, row in enumerate(HEADS[kind]):
            for rx, ch in enumerate(row):
                if ch == ".":
                    continue
                self.put(x + rx, y + ry, "s" if ch in "gweG" else ch)
        self.glasses(kind, x, y, blink)

    def glasses(self, kind, x, y, blink=False):
        """Óculos de armação fina (lentes vazadas com olho visível), desenhados por cima da cabeça."""
        eyes = {"34d": "down", "34u": "up", "frontd": "down"}.get(kind, "fwd")
        if kind in ("front", "frontd"):
            lenses = [(2, 5), (9, 5)]
        else:
            lenses = [(5, 5), (11, 4)]
        for lx, lw in lenses:
            for yy in range(4):
                for xx in range(lw):
                    edge = yy in (0, 3) or xx in (0, lw - 1)
                    self.put(x + lx + xx, y + 6 + yy, "g" if edge else "s")
            iw = lw - 2
            rows = {"fwd": ["w" * (iw - 1) + "e", "s" * iw], "down": ["w" * iw, "w" * (iw - 1) + "e"], "up": ["w" * (iw - 1) + "e", "s" * iw]}[eyes]
            if kind == "34d":
                rows = ["w" * iw, "s" * (iw - 1) + "e"]
            if not blink:
                for r_, line in enumerate(rows):
                    for c_, ch in enumerate(line):
                        self.put(x + lx + 1 + c_, y + 7 + r_, ch)
            self.put(x + lx, y + 6, "G")
        if kind in ("front", "frontd"):
            self.put(x + 7, y + 7, "g"); self.put(x + 8, y + 7, "g")
        else:
            self.put(x + 10, y + 7, "g")
        # haste da armação em direção à orelha (3/4)
        if kind not in ("front", "frontd"):
            self.put(x + 4, y + 7, "g"); self.put(x + 3, y + 7, "g")

    def finish(self):
        """Realce discreto na borda superior do moletom (luz ambiente, sem foco da tela) e contorno externo de 1px."""
        px = self.px
        for (x, y), k in list(px.items()):
            if k in ("T", "D", "L") and (x, y - 1) not in px:
                px[(x, y)] = "R"
        out = {}
        for (x, y) in px:
            for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)):
                p = (x + dx, y + dy)
                if p not in px and 0 <= p[0] < CW and 0 <= p[1] < CH:
                    out[p] = "o"
        px.update(out)
        return self

    def image(self):
        im = Image.new("RGBA", (CW, CH), (0, 0, 0, 0))
        p = im.load()
        for (x, y), k in self.px.items():
            p[x, y] = (k if isinstance(k, tuple) else PAL[k]) + (255,)
        return im


# --------------------------------------------------------------------------- esqueleto
THIGH, SHIN, UPPER, FORE = 12, 12, 10, 9
SLEEVE = ("L", "T", "D")
FARSLEEVE = ("T", "D", "D")
PANTS = ("p", "P", "Q")
FARPANTS = ("P", "Q", "Q")


def ik(root, target, l1, l2, bend=1):
    dx, dy = target[0] - root[0], target[1] - root[1]
    d = max(1e-6, math.hypot(dx, dy))
    d = min(d, l1 + l2 - 0.05)
    a = (l1 * l1 - l2 * l2 + d * d) / (2 * d)
    h = math.sqrt(max(0.0, l1 * l1 - a * a))
    ux, uy = dx / d, dy / d
    return (root[0] + ux * a - uy * h * bend, root[1] + uy * a + ux * h * bend)


def shoe(c, ankle):
    x, y = int(round(ankle[0])), int(round(ankle[1]))
    for yy in range(4):
        for xx in range(-2, 6):
            c.put(x + xx, y + yy - 1, "o")
    for yy in range(3):
        for xx in range(-1, 5):
            c.put(x + xx, y + yy, "F")
    for xx in range(-1, 5):
        c.put(x + xx, y + 2, "f")
    c.put(x + 3, y, "k")


def leg(c, hip, ankle, near=True, bend=1):
    knee = ik(hip, ankle, THIGH, SHIN, bend)
    t = PANTS if near else FARPANTS
    c.capsule(hip, knee, 6.2, t)
    c.capsule(knee, ankle, 5.2, t)
    shoe(c, ankle)
    return knee


def hand(c, pos, kind="open", near=True):
    x, y = pos
    s, sd, sl = ("s", "S", "k") if near else ("S", "S", "s")
    if kind == "keys":      # mão sobre o teclado
        c.rect(int(x) - 1, int(y) - 1, 5, 3, "o")
        c.rect(int(x), int(y), 4, 2, s)
        c.put(x + 1, y, sd); c.put(x + 2, y + 1, sd)
        c.put(x, y, sl); c.put(x + 3, y + 1, sd)
    elif kind == "grip":    # segurando (celular/caneca)
        c.disc(x + 1, y, 3.0, "o"); c.disc(x + 1, y, 2.2, s); c.put(x, y - 1, sl); c.put(x + 2, y + 1, sd)
    elif kind == "fist":
        c.disc(x, y, 3.0, "o"); c.disc(x, y, 2.2, s); c.put(x - 1, y - 1, sl); c.put(x + 1, y + 1, sd)
    else:                   # mão aberta/relaxada: bloco 3x3 arredondado (o disco r=2 virava uma cruz)
        c.rect(int(x) - 2, int(y) - 1, 5, 4, "o"); c.rect(int(x) - 1, int(y) - 2, 3, 6, "o")
        c.rect(int(x) - 1, int(y) - 1, 3, 3, s); c.put(x - 1, y - 1, sl); c.put(x + 1, y + 1, sd)


def arm(c, shoulder, handpos, near=True, bend=1, kind="open"):
    elbow = ik(shoulder, handpos, UPPER, FORE, bend)
    t = SLEEVE if near else FARSLEEVE
    c.capsule(shoulder, elbow, 6.0, t)
    c.capsule(elbow, handpos, 5.2, t)
    # punho (barra canelada) perto da mão
    ex, ey = handpos[0] - elbow[0], handpos[1] - elbow[1]
    ln = max(1e-6, math.hypot(ex, ey))
    cx, cy = handpos[0] - ex / ln * 2.0, handpos[1] - ey / ln * 2.0
    c.disc(cx, cy, 2.4, "D")
    hand(c, handpos, kind, near)
    return elbow


def torso_profile(c, hip, lean):
    a = math.radians(lean)
    up = (math.sin(a), -math.cos(a))
    perp = (math.cos(a), math.sin(a))
    sh = (hip[0] + up[0] * 20, hip[1] + up[1] * 20)
    top, bot = 6.6, 6.2
    pts = [(sh[0] - perp[0] * top, sh[1] - perp[1] * top), (sh[0] + perp[0] * top, sh[1] + perp[1] * top),
           (hip[0] + perp[0] * bot, hip[1] + perp[1] * bot + 3.5), (hip[0] - perp[0] * bot, hip[1] - perp[1] * bot + 3.5)]
    # contorno
    c.poly([(pts[0][0] - 1, pts[0][1] - 1), (pts[1][0] + 1, pts[1][1] - 1), (pts[2][0] + 1, pts[2][1] + 1), (pts[3][0] - 1, pts[3][1] + 1)], "o")
    c.poly(pts, "T")
    # sombra à esquerda (costas) e luz à direita (peito)
    for (x, y), k in list(c.px.items()):
        pass
    c.poly([(pts[0][0], pts[0][1]), (pts[0][0] + 3, pts[0][1]), (pts[3][0] + 3, pts[3][1]), (pts[3][0], pts[3][1])], "D")
    c.poly([(pts[1][0] - 2, pts[1][1] + 2), (pts[1][0], pts[1][1] + 2), (pts[2][0], pts[2][1] - 4), (pts[2][0] - 2, pts[2][1] - 4)], "L")
    # barra do moletom
    c.poly([(pts[3][0], pts[3][1] - 2), (pts[2][0], pts[2][1] - 2), (pts[2][0], pts[2][1]), (pts[3][0], pts[3][1])], "D")
    # bolso canguru
    px_, py_ = hip[0] + perp[0] * 1.5, hip[1] - 1
    c.rect(int(px_), int(py_) - 3, 6, 1, "D")
    return sh


def figure(c, hip, lean=0, head="34", hdx=0, hdy=0, near_hand=None, far_hand=None, near_ankle=None, far_ankle=None,
           near_bend=1, far_bend=1, leg_bend=1, blink=False, near_kind="open", far_kind="open", extras=None):
    a = math.radians(lean)
    sh = (hip[0] + math.sin(a) * 20, hip[1] - math.cos(a) * 20)
    if far_hand:
        arm(c, (sh[0] - 1, sh[1] + 2), far_hand, near=False, bend=far_bend, kind=far_kind)
    if far_ankle:
        leg(c, (hip[0] - 1, hip[1] + 1), far_ankle, near=False, bend=leg_bend)
    torso_profile(c, hip, lean)
    c.disc(sh[0] - 3, sh[1] - 1, 4.2, "D", halo=True)       # capuz atrás do pescoço
    if near_ankle:
        leg(c, hip, near_ankle, near=True, bend=leg_bend)
    c.rect(int(sh[0]) - 1, int(sh[1]) - 4, 5, 5, "S")        # pescoço
    c.head(head, int(round(sh[0] - 8 + hdx)), int(round(sh[1] - 18 + hdy)), blink=blink)
    c.line_cord = None
    if near_hand:
        arm(c, (sh[0] + 1, sh[1] + 3), near_hand, near=True, bend=near_bend, kind=near_kind)
    if extras:
        extras(c)
    return sh


def phone(c, hand_pos, ui=0, lit=True):
    x, y = int(round(hand_pos[0])), int(round(hand_pos[1]))
    c.rect(x - 2, y - 8, 7, 11, "o")
    c.rect(x - 1, y - 7, 5, 9, "M")
    if lit:
        c.rect(x, y - 6, 3, 7, "N")
        c.put(x, y - 5 + (ui % 2), "n"); c.put(x + 1, y - 3, "n"); c.put(x + 2, y - 5 + ((ui + 1) % 2), "n")
        c.put(x + 1, y - 6, "w")
