"""Sprites do personagem (Lucas) em pixel art, gerados por código para manter TODOS os frames consistentes.

Identidade preservada do avatar: cabelo castanho curto, óculos de armação preta, barba castanha com cavanhaque,
moletom azul-marinho com contorno de luz azul (rim light) e cordões cinza.

Cada frame mora numa célula de CELL_W x CELL_H. Âncora: pés no chão em (28, 60).
Vista de perfil (olhando para a direita) para andar e trabalhar; vista frontal para a apresentação (joinha).
"""
from PIL import Image

CELL_W, CELL_H = 64, 64
FX, FY = 28, 60  # âncora dos pés

PAL = {
    "o": (11, 13, 28),        # contorno
    "h": (88, 58, 38),        # cabelo
    "H": (122, 84, 54),       # cabelo (luz)
    "s": (232, 160, 96),      # pele
    "S": (196, 124, 72),      # pele (sombra)
    "k": (246, 190, 134),     # pele (luz)
    "g": (16, 18, 30),        # armação dos óculos
    "w": (244, 240, 232),     # branco do olho
    "e": (40, 26, 18),        # pupila
    "b": (74, 50, 34),        # barba
    "B": (50, 34, 24),        # barba (sombra)
    "m": (176, 84, 66),       # boca
    "t": (255, 252, 246),     # dentes
    "T": (31, 42, 90),        # moletom
    "D": (21, 29, 68),        # moletom (sombra)
    "L": (52, 70, 150),       # moletom (luz)
    "R": (58, 120, 255),      # luz azul (rim)
    "c": (126, 132, 158),     # cordão
    "P": (43, 48, 66),        # calça
    "Q": (30, 34, 49),        # calça (sombra)
    "F": (222, 226, 238),     # tênis
    "f": (128, 134, 154),     # sola
    "M": (36, 40, 58),        # celular (corpo)
    "N": (126, 190, 255),     # tela do celular (acesa)
    "n": (74, 120, 220),      # tela do celular (UI)
    "G": (232, 188, 70),      # dourado (caneca/detalhes)
    "C": (240, 236, 226),     # caneca
}

# ---------------------------------------------------------------- cabeças (sem contorno; ele é gerado depois)
HEAD_FRONT = [
    "...hhhhhhhh...",
    "..hhhHHhhhhh..",
    ".hhhhHHhhhhhh.",
    ".hhhhhhhhhhhh.",
    ".hhsssssssshh.",
    ".hssssssssssh.",
    "SsggggssggggsS",
    "SsgwegssgewgsS",
    "SsggggssggggsS",
    ".ssssssksssss.",
    ".bbssssssssbb.",
    ".bbbbmttttmbbb",
    "..bbbbmmmmbbb.",
    "...bbbbBBbbb..",
]

# perfil olhando para a direita: cabelo curto (calota e nuca), orelha, óculos, barba no maxilar
HEAD_PROF = [
    "....hhhhhh....",
    "...hhhHHhhhh..",
    "..hhhhhhhhhhh.",
    "..hhhhhhhhhhhs",
    "..hhhhhhhhhssk",
    "..hhhhhhhsssss",
    "..hhhhsssggggg",
    "..hhhSssgwegss",
    "..hhhSSsgggggk",
    "...hhbbssssssk",
    "...hbbbbssmssk",
    "....bbbbbbmbbb",
    "....bbbbbBBBBb",
    ".....bbbBBBBB.",
]

# cabeça abaixada (olhando o celular/teclado): olhos para baixo
HEAD_PROF_DOWN = [
    "....hhhhhh....",
    "...hhhHHhhhh..",
    "..hhhhhhhhhhh.",
    "..hhhhhhhhhhhs",
    "..hhhhhhhhhssk",
    "..hhhhhhhsssss",
    "..hhhhsssggggg",
    "..hhhSssgwwgss",
    "..hhhSSsgegggk",
    "...hhbbssssssk",
    "...hbbbbssmssk",
    "....bbbbbbmbbb",
    "....bbbbbBBBBb",
    ".....bbbBBBBB.",
]

HEADS = {"front": HEAD_FRONT, "prof": HEAD_PROF, "down": HEAD_PROF_DOWN}
for _k, _h in HEADS.items():
    for _i, _r in enumerate(_h):
        assert len(_r) == 14, (_k, _i, len(_r), _r)
HEAD_W, HEAD_H = 14, 14


class Cell:
    """Célula de pixels com material por pixel (para contorno e luz)."""

    def __init__(self):
        self.px = {}  # (x,y) -> chave de PAL

    def put(self, x, y, k):
        x, y = int(round(x)), int(round(y))
        if 0 <= x < CELL_W and 0 <= y < CELL_H:
            self.px[(x, y)] = k

    def disc(self, cx, cy, r, k):
        for yy in range(int(cy - r - 1), int(cy + r + 2)):
            for xx in range(int(cx - r - 1), int(cx + r + 2)):
                if (xx - cx) ** 2 + (yy - cy) ** 2 <= r * r + 0.25:
                    self.put(xx, yy, k)

    def line(self, p0, p1, w, k):
        (x0, y0), (x1, y1) = p0, p1
        n = max(1, int(max(abs(x1 - x0), abs(y1 - y0)) * 2))
        for i in range(n + 1):
            t = i / n
            self.disc(x0 + (x1 - x0) * t, y0 + (y1 - y0) * t, w / 2, k)

    def rect(self, x, y, w, h, k):
        for yy in range(h):
            for xx in range(w):
                self.put(x + xx, y + yy, k)

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

    def head(self, kind, x, y, flip=False, blink=False):
        tpl = HEADS[kind]
        for ry, row in enumerate(tpl):
            for rx, ch in enumerate(row):
                if ch == ".":
                    continue
                if blink and ch in "we":
                    ch = "s"
                self.put(x + (HEAD_W - 1 - rx if flip else rx), y + ry, ch)

    def finish(self):
        """Luz azul na borda superior do moletom e contorno de 1px."""
        px = self.px
        for (x, y), k in list(px.items()):
            if k in ("T", "D", "L") and (x, y - 1) not in px:
                px[(x, y)] = "R"
        out = {}
        for (x, y) in px:
            for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)):
                p = (x + dx, y + dy)
                if p not in px and 0 <= p[0] < CELL_W and 0 <= p[1] < CELL_H:
                    out[p] = "o"
        px.update(out)
        return self

    def image(self):
        im = Image.new("RGBA", (CELL_W, CELL_H), (0, 0, 0, 0))
        p = im.load()
        for (x, y), k in self.px.items():
            p[x, y] = PAL[k] + (255,)
        return im
