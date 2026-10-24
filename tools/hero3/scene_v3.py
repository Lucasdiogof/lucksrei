"""Hero v3 — Fase D: o MESMO quarto da v2, redesenhado com mais acabamento, em camadas.

Referência obrigatória: tools/make-hero-scene.py (v2). Mesma composição, mesma perspectiva (parede/mesa sobem 1 px a cada
6 para a direita; profundidade a 45°), mesmos objetos nos mesmos lugares, mesma paleta (o dicionário C da v2) com
poucos tons derivados dela. Nada de objeto novo inventado: só acabamento — volume, materiais, sombras de contato,
oclusão ambiente, profundidade na janela e luz.

Camadas (ordem de desenho; o runtime intercala o personagem):
  sky        céu e cidade vistos pela janela (separado para animar luzes/estrelas)
  room       parede, rodapé, piso, tapete, moldura da janela (vidro transparente), quadro, estante
  chair      cadeira (camada própria: é puxada)
  [corpo]
  desk       mesa + teclado
  mug        caneca
  [braços sobre a mesa]
  monitors   monitores (de costas para a câmera)
  glow       luz das telas (aditiva, em pontilhado ordenado: nítida como pixel art; o runtime varia a intensidade)
  moon       luar no chão e na parede (aditiva)
  shade      sombra ambiente nas bordas (multiplicação)
Saída: assets/img/hero/v3/scene/*.png + scene.json (manifesto). Uso: python3 tools/hero3/scene_v3.py
"""
import json
import math
import os
import sys

from PIL import Image

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import scene3  # noqa: E402

mhs = scene3.mhs
C, ly, W, H, rgb, lerp = mhs.C, mhs.ly, mhs.W, mhs.H, mhs.rgb, mhs.lerp
OUT = os.path.join(scene3.ROOT, "assets", "img", "hero", "v3", "scene")

BAYER = [[0, 8, 2, 10], [12, 4, 14, 6], [3, 11, 1, 9], [15, 7, 13, 5]]


def dither(x, y, v):
    """Pontilhado ordenado 4×4: True se o pixel (x, y) acende para a intensidade v ∈ [0, 1]."""
    return v * 16 > BAYER[y % 4][x % 4] + 0.5


def mix(a, b, t):
    return lerp(a, b, max(0.0, min(1.0, t)))


# tons derivados da paleta da v2 (nenhuma cor nova de matiz diferente)
T = {
    "wall_ao": mix(C["wall_t"], (0, 0, 0), 0.35),
    "floor_hi": mix(C["floor"], C["base_hi"], 0.25),
    "floor_lo": mix(C["floor2"], (0, 0, 0), 0.25),
    "rug_lo": mix(C["rug"], (0, 0, 0), 0.3),
    "rug_hi": mix(C["rug2"], C["base_hi"], 0.3),
    "gold_dd": mix(C["gold_d"], (0, 0, 0), 0.35),
    "wood_lit": mix(mix(C["wood_hi"], rgb("#22170f"), 0.38), C["blue_l"], 0.18),
    "metal_dd": mix(C["metal_d"], (0, 0, 0), 0.4),
}


def wall_base(x):
    return mhs.wall_base(x)


# ================================================================ céu (pela janela)
WX0, WX1, WT0, WHH = 12, 54, 26, 46            # janela da v2


def build_sky():
    """Céu e cidade da v2 (mesmas cores, lua, estrelas e prédios) + uma silhueta distante sutil atrás dos prédios, para
    dar profundidade sem escurecer a janela."""
    cv = mhs.Canvas()
    for x in range(WX0 + 2, WX1 - 1):
        t0 = round(ly(WX0, WT0, x)) + 2
        for y in range(t0, t0 + WHH - 4):
            cv.put(x, y, lerp(rgb("#0a1030"), rgb("#2a4a96"), (y - t0) / (WHH - 4)))
    for sx, sy in ((17, 31), (24, 33), (29, 29), (20, 41)):                      # as duas perto da lua saíram
        cv.put(sx, sy, C["ivory"])
    # lua cheia (a da v2 era crescente), com crateras e borda inferior direita um tom abaixo
    moon = ["..####..", ".######.", "##c#####", "#####c##", "###cc###", "######s#", ".####ss.", "..#sss.."]
    MC = {"#": rgb("#f3eccd"), "c": rgb("#d9d0ad"), "s": rgb("#cfc59f")}
    for ry, row in enumerate(moon):
        for rx, ch in enumerate(row):
            if ch != ".":
                cv.put(41 + rx, 29 + ry, MC[ch])
    for bx, bw, bh in ((17, 4, 15), (30, 4, 17), (43, 4, 17), (51, 3, 13)):      # silhueta distante (entre os prédios)
        for x in range(bx, min(bx + bw, WX1 - 1)):
            gb = round(ly(WX0, WT0, x)) + WHH - 3
            for y in range(gb - bh, gb):
                cv.put(x, y, mix(rgb("#2a4a96"), rgb("#0a1230"), 0.55))
    for bx, bw, bh in ((14, 5, 11), (20, 5, 16), (26, 6, 9), (33, 5, 18), (39, 6, 12), (46, 6, 15)):
        for x in range(bx, bx + bw):
            gb = round(ly(WX0, WT0, x)) + WHH - 3
            for y in range(gb - bh, gb):
                cv.put(x, y, rgb("#0a1230"))
            cv.put(x, gb - bh, rgb("#16224c"))                                    # luz do céu no topo do prédio
            for wy in range(gb - bh + 2, gb - 1, 4):
                if (x - bx) % 3 == 1 and (x * 7 + wy * 3) % 5 < 2:
                    cv.put(x, wy, C["gold"] if (x + wy) % 4 else C["cyan"])
    return cv.im


# ================================================================ quarto
def _floor(cv):
    """Porcelanato claro em placas grandes (foto 1/2), à noite: placas num tom escuro da paleta da v2 um pouco mais claro
    que o piso de tábuas, rejunte nas duas direções da cena (paralelo à parede e a 45°), variação leve por placa,
    brilho de piso esmaltado embaixo da luz das telas e oclusão junto ao rodapé."""
    tile = mix(C["floor"], C["base"], 0.45)
    tile2 = mix(C["floor2"], C["base"], 0.4)
    grout = mix(C["floor2"], C["plank"], 0.6)
    for x in range(W):
        wb = round(wall_base(x))
        for y in range(wb, H):
            v = y + x / 6.0
            u = x - y
            row, col = int(v) // 12, (u + 400) // 22
            c = tile if (row * 3 + col * 7) % 5 not in (1, 3) else tile2
            if int(v) % 12 == 0 or (u + 400) % 22 == 0:
                c = grout
            elif int(v) % 12 == 1:
                c = mix(c, C["base_hi"], 0.12)                          # borda da placa pegando luz
            if y - wb < 3:
                c = mix(c, C["plank"], 0.5 - (y - wb) * 0.15)
            cv.put(x, y, c)
    # reflexo esmaltado da luz das telas no chão à frente da mesa (faixas)
    bands(cv, 128, 141, 30, 7, C["blue_l"], [0.05, 0.09], lambda x, y: y > wall_base(x) + 3)


def _wall(cv):
    for x in range(W):
        wb = round(wall_base(x))
        for y in range(0, wb):
            t = y / 100
            band = int(t * 12)
            frac = t * 12 - band
            c0 = mix(C["wall_t"], C["wall_b"], min(1, band / 12))
            c1 = mix(C["wall_t"], C["wall_b"], min(1, (band + 1) / 12))
            use1 = ((x + y) % 2 == 0 and frac > 0.5) or ((x + y) % 4 == 0 and frac > 0.25)
            c = c1 if use1 else c0
            if y < 6 and dither(x, y, (6 - y) / 8):                  # canto do teto, mais escuro
                c = T["wall_ao"]
            cv.put(x, y, c)
        # rodapé: 3 px com chanfro de luz em cima e sombra embaixo
        for y in range(wb - 3, wb):
            cv.put(x, y, C["base"])
        cv.put(x, wb - 3, C["base_hi"])
        cv.put(x, wb - 1, mix(C["base"], C["plank"], 0.5))


def _rug(cv):
    """Tapete da v2 (mesmo losango e borda dourada) com textura de trama, borda dupla e sombra da mesa."""
    P0, A, B = (60, 142), (124, -21), (-26, -26)
    det = A[0] * B[1] - A[1] * B[0]
    for y in range(80, H):
        for x in range(W):
            dx, dy = x - P0[0], y - P0[1]
            s = (dx * B[1] - dy * B[0]) / det
            t = (A[0] * dy - A[1] * dx) / det
            if 0 <= s <= 1 and 0 <= t <= 1 and y > wall_base(x):
                outer = s < 0.012 or s > 0.988 or t < 0.035 or t > 0.965
                inner = (0.035 < s < 0.045 or 0.955 < s < 0.965) or (0.12 < t < 0.15 or 0.85 < t < 0.88)
                if outer:
                    c = C["gold_d"]
                elif inner and 0.03 < s < 0.97 and 0.1 < t < 0.9:
                    c = T["gold_dd"]
                else:
                    c = C["rug"] if (int(s * 60) + int(t * 9)) % 2 == 0 else C["rug2"]
                    if (x + 2 * y) % 5 == 0:
                        c = mix(c, T["rug_lo"], 0.6)                   # trama
                cv.put(x, y, c)


def _desk_shadow(cv):
    """Sombra de contato da mesa no chão/tapete (o tampo e as faces cobrem quase toda; aparece à frente e à esquerda)."""
    BL, FL, FR, BR = mhs.desk_corners()
    hgt = mhs.DESK_H
    pts = [(BL[0] - 2, BL[1] + hgt), (FL[0] - 2, FL[1] + hgt + 1), (FR[0] + 2, FR[1] + hgt + 1), (BR[0] + 3, BR[1] + hgt)]
    for y in range(int(min(p[1] for p in pts)) - 2, int(max(p[1] for p in pts)) + 4):
        for x in range(int(BL[0]) - 6, int(BR[0]) + 6):
            front = ly(*FL, x) + hgt
            if front - 1 <= y <= front + 3 and FL[0] - 4 <= x <= FR[0] + 3:
                d = (y - front + 1) / 4
                if dither(x, y, 0.75 * (1 - d)):
                    cv.tint(x, y, rgb("#03040a"), 0.45)


def _window_frame(cv):
    """Moldura da v2 com profundidade: batente interno escuro (o vidro fica recuado), travessas, parapeito com luz."""
    X0, X1, T0, HH = WX0, WX1, WT0, WHH
    cv.wallrect(X0 - 1, X1 + 1, ly(X0, T0, X0 - 1) - 1, HH + 2, C["metal_hi"])
    cv.wallrect(X0, X1, T0, HH, C["metal"])
    for x in range(X0 + 1, X1):                                      # batente: sombra interna em cima e à esquerda
        t0 = round(ly(X0, T0, x))
        cv.put(x, t0 + 1, C["metal_d"])
    for y in range(round(ly(X0, T0, X0 + 1)) + 1, round(ly(X0, T0, X0 + 1)) + HH - 1):
        cv.put(X0 + 1, y, C["metal_d"])
    # vidro: transparente (o céu vem de baixo)
    for x in range(WX0 + 2, WX1 - 1):
        t0 = round(ly(WX0, WT0, x)) + 2
        for y in range(t0, t0 + WHH - 4):
            cv.put(x, y, (0, 0, 0), 0)
    for x in range(X0, X1 + 1):                                      # travessa horizontal com luz em cima
        y = round(ly(X0, T0 + HH // 2, x))
        cv.put(x, y, C["metal"])
        cv.put(x, y - 1, C["metal_hi"])
    for y in range(round(ly(X0, T0, 33)), round(ly(X0, T0, 33)) + HH):
        cv.put(33, y, C["metal"])
        cv.put(34, y, C["metal_d"])
    cv.wallrect(X0 - 2, X1 + 2, ly(X0, T0 + HH, X0 - 2), 2, C["metal_hi"])    # parapeito
    for x in range(X0 - 2, X1 + 3):
        cv.put(x, round(ly(X0 - 2, T0 + HH + 2, x)), T["metal_dd"])          # sombra do parapeito na parede


LACE = mix(C["ivory"], C["wall_b"], 0.62)        # renda creme vista à noite
LACE_D = mix(LACE, C["wall_t"], 0.45)
LACE_L = mix(C["ivory"], C["wall_b"], 0.45)


def _curtains(cv, sky=None):
    """Cortinas de renda (foto 1) abertas nas laterais da janela, do varão até o chão. Renda é translúcida: cada pixel
    puxa o que está atrás (parede/janela) em direção ao creme da renda — mais nas pregas que pegam luz, menos nos furos
    da trama — e as pregas são ondas suaves de 4 px. Barra rendada embaixo e varão escuro com ponteiras."""
    rod_y = lambda x: round(ly(WX0, WT0 - 4, x))                   # noqa: E731
    lace = mix(C["ivory"], C["wall_b"], 0.55)
    for x0, x1 in ((4, 14), (51, 61)):
        for x in range(x0, x1 + 1):
            top = rod_y(x) + 1
            bot = round(wall_base(x)) + 1
            wave = 0.5 + 0.5 * math.cos((x - x0) * math.pi / 2)     # prega: 1 no meio da dobra, 0 no vinco
            for y in range(top, bot):
                k = 0.22 + 0.22 * wave
                if (x * 2 + y) % 6 == 0 or (x * 2 - y) % 6 == 0:
                    k *= 0.45                                       # furos da trama: aparece mais o fundo
                if y > bot - 6:
                    k += 0.08 if (x + y) % 2 == 0 else 0.0           # barra rendada
                if y < top + 2:
                    k += 0.1                                        # franzido junto ao varão
                cv.tint(x, y, lace, min(0.6, k))
    for x in range(2, 64):                                            # varão
        cv.put(x, rod_y(x), C["metal_d"])
        cv.put(x, rod_y(x) - 1, C["metal"] if x % 9 else C["metal_hi"])
    for x in (2, 63):
        cv.put(x, rod_y(x) - 1, C["metal_hi"])
        cv.put(x, rod_y(x), C["metal_hi"])


def _aircon(cv):
    """Split de parede (foto 1) acima da janela, branco à noite: corpo, aleta escura embaixo, etiqueta vermelha."""
    body = mix(C["ivory"], C["wall_t"], 0.6)
    for x in range(20, 47):
        t = round(ly(20, 8, x))
        for y in range(t, t + 8):
            c = body
            if y == t:
                c = mix(C["ivory"], C["wall_t"], 0.35)                 # luz em cima
            if y >= t + 6:
                c = mix(body, C["ink"], 0.55 if y == t + 6 else 0.3)   # aleta
            if x in (20, 46):
                c = mix(body, C["wall_t"], 0.3)
            cv.put(x, y, c)
        cv.put(x, t + 8, T["wall_ao"])                                # sombra na parede
    cv.put(24, round(ly(20, 8, 24)) + 2, mix(rgb("#c8263a"), C["wall_t"], 0.35))
    cv.put(25, round(ly(20, 8, 25)) + 2, mix(rgb("#c8263a"), C["wall_t"], 0.35))


def _picture(cv):
    """Quadro da coroa da v2 com chanfro (luz em cima/esquerda, sombra embaixo/direita) e sombra na parede."""
    QX, QT = 98, 34                                                  # mais alto que na v2 (48), a pedido do usuário
    for x in range(QX + 1, QX + 17):                                 # sombra na parede (embaixo/direita)
        cv.put(x, round(ly(QX, QT, x)) + 16, T["wall_ao"])
    for y in range(round(ly(QX, QT, QX + 16)) + 1, round(ly(QX, QT, QX + 16)) + 17):
        cv.put(QX + 16, y, T["wall_ao"])
    cv.wallrect(QX, QX + 15, QT, 16, C["gold_d"])
    for x in range(QX, QX + 16):
        cv.put(x, round(ly(QX, QT, x)), C["gold"])                   # chanfro de luz em cima
        cv.put(x, round(ly(QX, QT, x)) + 15, T["gold_dd"])
    for y in range(round(ly(QX, QT, QX)), round(ly(QX, QT, QX)) + 16):
        cv.put(QX, y, C["gold"])
    cv.wallrect(QX + 1, QX + 14, ly(QX, QT, QX + 1) + 1, 14, C["navy"])
    crown = ["..G..G..G.", ".GG.GG.GG.", ".GGGGGGGG.", "GGGGGGGGGG", "GlGGlGGlGG", "dddddddddd"]
    for ry, row in enumerate(crown):
        for rx, ch in enumerate(row):
            if ch != ".":
                x = QX + 3 + rx
                cv.put(x, round(ly(QX, QT, x)) + 4 + ry, {"G": C["gold"], "l": C["gold_l"], "d": C["gold_d"]}[ch])
    for i in range(4):                                               # brilho do vidro
        x = QX + 9 + i
        cv.put(x, round(ly(QX, QT, x)) + 2 + i, mix(C["navy"], C["ivory"], 0.25))


def bands(cv, cx, cy, rx, ry, tone, steps, region):
    """Luz em FAIXAS sólidas (pixel art): cada anel da elipse puxa a cor um passo em direção a `tone`; só a fronteira
    entre faixas usa 1 px de pontilhado."""
    for y in range(int(cy - ry) - 1, int(cy + ry) + 2):
        for x in range(int(cx - rx) - 1, int(cx + rx) + 2):
            if not (0 <= x < W and 0 <= y < H) or not region(x, y):
                continue
            d = math.hypot((x - cx) / rx, (y - cy) / ry)
            if d >= 1:
                continue
            level = (1 - d) * len(steps)
            k = int(level)
            if level - k < 0.12 and k > 0 and (x + y) % 2 == 0:
                k -= 1                                               # fronteira pontilhada de 1 px
            if k <= 0 and level < 1:
                k = 1 if (level > 0.88 and (x + y) % 2 == 0) else 0
            if k > 0:
                cv.tint(x, y, tone, steps[min(k, len(steps)) - 1])


def estante_real(cv):
    """Estante (fotos 3–6) — foco da cena. Mesma estrutura e lugar da v2 (nichos brancos em zigue-zague, painel preto
    no meio), nichos de 12 px (antes 10) para os objetos terem tamanho de ser reconhecidos, e MENOS objetos por nicho,
    os mais marcantes, cada um desenhado com contorno e luz:
      topo     luvas de boxe pretas, Deadpool, livros e a bola de pelúcia;
      nicho 1  almofada do Goiás, pêndulo de Newton, cubo de acrílico com polaroides;
      nicho 2  Funko com coroa, quadrinho “A Tríplice Coroa”, Bulbasaur, troféu dourado com asa no suporte azul;
      nicho 3  placa cinza com o G, Pikachu, Squirtle, troféu KGeN Cup (rosa/preto) e troféu Rissel League (roxo/dourado).
    Os vãos que sobravam ganharam Deadpool, livros e uma taça (topo), Bulbasaur e porta-retrato (nicho 2) e Squirtle
    (nicho 3), redistribuídos para cada nicho ter peso parecido.
    (A faixa azul do cartão que ficava atrás saiu, a pedido do usuário.)"""
    # maior que na rodada anterior (pedido do usuário): nichos de 14 px (antes 12), tábuas 12 % mais largas para a
    # direita (os objetos mantêm o tamanho e ganham respiro); cresce para cima, a base fica onde estava
    X0, Y0, TIER, SX = 158, 41, 14, 1.12

    def M(x):
        return round(X0 + (x - X0) * SX)
    WH, WM, WS, WD = rgb("#e9ebf1"), rgb("#c9cdd8"), rgb("#9aa0b2"), rgb("#5b6176")

    def Y(x, yb):
        return round(ly(X0, yb, x))

    def hline(x0, x1, yb, c, dy=0):
        for x in range(x0, x1 + 1):
            cv.put(x, Y(x, yb) + dy, c)

    def block(x0, x1, yb_top, h, c):
        for x in range(x0, x1 + 1):
            for y in range(Y(x, yb_top), Y(x, yb_top) + h):
                cv.put(x, y, c)

    def sprite(rows, x0, yb, bottom_gap, pal):
        """Desenha apoiado na tábua: a última linha fica bottom_gap px acima da tábua `yb` (que é o piso do nicho)."""
        h, w = len(rows), max(len(r) for r in rows)
        x0 = M(x0)
        base = Y(x0 + w // 2, yb)                     # objeto em pé: uma linha de base só (não acompanha a inclinação)
        for ry, row in enumerate(rows):
            for rx, ch in enumerate(row):
                if ch != ".":
                    cv.put(x0 + rx, base - bottom_gap - h + ry, pal[ch])


    block(M(170), M(182), Y0, TIER * 3, rgb("#0b0d16"))
    for k in range(3):
        for x in range(M(158), M(194) + 1):
            for dy in range(1, 3):
                cv.tint(x, Y(x, Y0 + k * TIER) + dy, rgb("#03040a"), 0.3 - dy * 0.1)
    boards = [(161, 194), (158, 191), (161, 194), (158, 191)]
    for k, (x0, x1) in enumerate(boards):
        yb = Y0 + k * TIER
        x0, x1 = M(x0), M(x1)
        hline(x0, x1, yb, WH); hline(x0, x1, yb, WM, 1); hline(x0, x1, yb, WD, 2)
    for k, side in enumerate(("r", "l", "r")):
        x = M(193) if side == "r" else 158
        for xx in (x, x + 1):
            for y in range(Y(xx, Y0 + k * TIER) + 3, Y(xx, Y0 + (k + 1) * TIER)):
                cv.put(xx, y, WM if xx == x else WS)

    K = {"o": rgb("#07080e"), "k": rgb("#16171f"), "K": rgb("#3a3d4c"), "w": rgb("#f4f4f6"), "W": rgb("#b8bdcb"),
         "g": rgb("#1f8a4c"), "G": rgb("#135a32"), "s": rgb("#d6dae3"), "S": rgb("#8f939f"), "b": rgb("#3a2c22"),
         "p": rgb("#f0f0ec"), "1": rgb("#c58a62"), "2": rgb("#6f86b8"), "3": rgb("#5f8f7a"), "4": rgb("#b07a6a"),
         "5": rgb("#8a6aa8"), "6": rgb("#d8b070"), "Y": rgb("#e3b04b"), "y": rgb("#fff0b8"), "d": rgb("#9a6e22"),
         "B": rgb("#4aa3d8"), "P": rgb("#d05cb4"), "V": rgb("#7a44c8"), "A": rgb("#e6b84a"), "r": rgb("#c8263a"),
         "a": rgb("#f2d04a"), "c": rgb("#e0602a"), "h": rgb("#2a1d18"), "f": rgb("#b07a50"), "x": rgb("#6f7380"),
         "X": rgb("#9a9eab"), "T": rgb("#62bfae"), "t": rgb("#3a8a7c"), "R": rgb("#7a1422"), "q": rgb("#5a3a2a")}
    # topo (em cima da 1ª tábua)
    sprite([".oooo.ooo.", "oKwkkoKwko", "okwkkokwko", "okkkkokkko", ".oooo.ooo."], 162, Y0, 0, K)          # luvas (friso branco)
    sprite(["..oooo..", ".owwwwo.", "owwkkwwo", "owkkkkwo", "owwkkwwo", "okwwwwko", ".okwwko.", "..oooo.."], 182, Y0, 0, K)  # bola
    sprite([".RRR.", "RrrrR", "kwrwk", "RkrkR", ".RrR.", "rrkrr", ".rrr.", ".R.R."], 172, Y0, 0, K)           # Deadpool
    sprite(["2222.", "44444", "3333.", "q6666"], 177, Y0, 0, K)                                              # livros
    sprite(["YyYYY", "YYYYd", ".YYd.", "..d..", ".ooo."], 190, Y0, 0, K)                                    # taça
    # nicho 1 (apoiado na 2ª tábua)
    n1 = Y0 + TIER
    sprite(["oooooooo", "ogwwwwgo", "ogwggwgo", "ogggwwgo", "ogwgggwo", "ogwggwgo", "ogwwwwgo", "oooooooo"], 162, n1, 0, K)  # Goiás
    sprite(["SSSSSSS", "S.x.x.S", "S.x.x.S", "S.x.x.S", "SsssssS", "bbbbbbb"], 172, n1, 0, K)          # pêndulo
    sprite(["WWWWWWWWWW", "W11W22W33W", "WppWppWppW", "WWWWWWWWWW", "W44W55W66W", "WppWppWppW", "WWWWWWWWWW"], 182, n1, 0, K)  # polaroides
    # nicho 2
    n2 = Y0 + 2 * TIER
    sprite(["Y.Y.Y", "YYYYY", "ohhho", "ofkfo", "offfo", ".rrr.", ".r.r."], 161, n2, 0, K)              # Funko com coroa
    sprite(["...gg.", "..gGgg", "tTTgGg", "TkTTTt", "TTwTTt", ".t..t."], 167, n2, 0, K)                # Bulbasaur
    sprite(["oooooo", "o2YY2o", "o2ff2o", "o2hh2o", "o2222o", "oooooo"], 174, n2, 0, K)                # quadrinho
    sprite(["w..YYY.", "ww.YyYY", ".wwYYYY", "...YdY.", "....B..", "...BBB.", "...B.B.", "..ooooo"], 180, n2, 0, K)  # troféu asa
    sprite(["XXXXX", "XBBBX", "XfhfX", "X1f1X", "XXXXX"], 189, n2, 0, K)                               # porta-retrato
    # nicho 3
    n3 = Y0 + 3 * TIER
    sprite(["xxxxxxx", "xXSSSXx", "xSXXXXx", "xSXXSSx", "xSXXXSx", "xXSSSXx", "xxxxxxx"], 172, n3, 0, K)  # placa G
    sprite(["o...o", "a...a", "aaaaa", "akaka", "raaar", "aaaaa", ".a.a."], 160, n3, 0, K)              # Pikachu
    sprite([".BBB.", "BkBkB", "BBBBB", ".fyf.", "BfyfB", ".fff.", ".B.B."], 165, n3, 0, K)                # Squirtle
    sprite([".PPPPP.", "PoooooP", "PowwwoP", "PoooooP", ".PoooP.", "..PoP..", "ooooooo"], 181, n3, 0, K)   # KGeN
    sprite(["..XXX..", ".XkXkX.", "..XXX..", "AVoooVA", "AVowoVA", ".VoooV.", ".AoooA.", "..ooo..", "oooAooo"], 187, n3, 0, K)  # Rissel


def build_room():
    cv = mhs.Canvas((0, 0, 0, 255))
    _wall(cv)
    bands(cv, 122, 84, 50, 30, C["blue"], [0.02, 0.04], lambda x, y: y < wall_base(x) - 3)   # base fraca; o resto é animado
    _floor(cv)
    _rug(cv)
    _desk_shadow(cv)
    _window_frame(cv)
    _picture(cv)
    estante_real(cv)
    return cv.im


# ================================================================ cadeira
def build_chair():
    """Cadeira da v2 (mesmo lugar e silhueta) com volume: almofada do encosto com luz da tela à direita e sombra à
    esquerda, costura, assento com borda frontal iluminada, estrela de 5 rodízios na base."""
    cv = mhs.Canvas()
    SEAT = mhs.SEAT
    BX0, BX1, BT, BH = 99, 119, 82, 20
    cx, fy = SEAT[0] - 1, SEAT[1] + 12
    cv.rect(cx - 1, SEAT[1] + 2, cx + 1, fy - 2, C["metal"])
    cv.put(cx + 1, SEAT[1] + 3, C["metal_hi"])
    for dx, dy in ((-9, 1), (8, -1), (-4, 3), (5, 3), (0, -2)):      # pés da estrela + rodízios
        for k in range(1, 5):
            cv.put(cx + round(dx * k / 5), fy - 1 + round(dy * k / 5), C["metal_d"])
        cv.put(cx + dx, fy + dy, C["ink"])
        cv.put(cx + dx + 1, fy + dy, C["ink"])
        cv.put(cx + dx, fy + dy - 1, C["metal"])
    front_l, length, depth = (102, 110), 22, 6
    pts = [front_l, (front_l[0] + length, ly(*front_l, front_l[0] + length)),
           (front_l[0] + length - depth, ly(*front_l, front_l[0] + length) - depth), (front_l[0] - depth, front_l[1] - depth)]
    cv.poly([(p[0], p[1] + 1) for p in pts], C["navy"])
    cv.poly(pts, rgb("#26336c"))
    cv.slant(front_l[0] - depth, front_l[0] - depth + length, front_l[1] - depth, rgb("#34449a"))
    cv.slant(front_l[0], front_l[0] + length, front_l[1], rgb("#3a4c96"))     # borda frontal do assento
    cush, frame, lit = C["navy3"], C["navy"], rgb("#2c3a78")
    for x in range(BX0 - 2, BX1 + 1):
        t = round(ly(BX0, BT, x))
        if x < BX0:
            for y in range(t + 1, t + BH - 1):
                cv.put(x, y, C["metal_d"] if x == BX0 - 2 else C["metal"])
            continue
        r = 2 if x in (BX0, BX1) else (1 if x in (BX0 + 1, BX1 - 1) else 0)
        for y in range(t + r, t + BH - r):
            k = (x - BX0) / (BX1 - BX0)
            c = frame if x in (BX0, BX1) or y in (t + r, t + BH - r - 1) else (lit if x > BX1 - 6 else cush)
            if c == cush and k < 0.25:
                c = mix(cush, C["navy"], 0.5)                           # lado da sombra (volume)
            if c in (cush, lit) and (y - t) in (2, BH - 3):
                c = mix(c, C["navy"], 0.35)                             # almofada arredondada em cima/embaixo
            cv.put(x, y, c)
    for y in range(round(ly(BX0, BT, BX0 + 10)) + 3, round(ly(BX0, BT, BX0 + 10)) + BH - 3):
        cv.put(BX0 + 10, y, frame)
    for x in range(BX0 + 3, BX1 - 2):
        cv.put(x, round(ly(BX0, BT, x)) + 1, rgb("#3a4c96"))
    return cv.im


# ================================================================ mesa e teclado
ESPRESSO = rgb("#22170f")
DW = {k: mix(C[k], ESPRESSO, 0.38) for k in ("wood", "wood_hi", "wood_d", "wood_dd")}
DW["face"] = mix(rgb("#33261c"), ESPRESSO, 0.38)


def _quad(cv, p0, length, depth, col):
    """Paralelogramo no tampo: canto frente-esquerdo p0, comprimento ao longo da mesa (1:6), profundidade a 45°."""
    pts = [p0, (p0[0] + length, ly(*p0, p0[0] + length)), (p0[0] + length - depth, ly(*p0, p0[0] + length) - depth),
           (p0[0] - depth, p0[1] - depth)]
    cv.poly(pts, col)
    return pts


def desk_items(cv):
    """Objetos reais da mesa (foto 2), no tampo da v2: mousepad preto grande sob os teclados, mousepad cinza com padrão
    grego à esquerda, headset preto/vermelho na ponta esquerda e o gabinete preto na ponta direita."""
    # mousepad cinza (padrão em gregas) à esquerda, por baixo da caneca
    g = _quad(cv, (91, 117), 16, 7, rgb("#4a4e5c"))
    for x in range(84, 108):
        for y in range(104, 119):
            if cv.p[x, y][3] and cv.p[x, y][:3] == rgb("#4a4e5c") and ((x + 2 * y) % 5 == 0 or (x - y) % 7 == 0):
                cv.put(x, y, rgb("#2f323d"))
    # mousepad preto grande
    _quad(cv, (98, 118), 68, 9, rgb("#14151b"))
    for x in range(98, 167):
        cv.put(x, round(ly(98, 118, x)), rgb("#2a2d38"))               # borda da frente
    # Mac mini: caixa prateada baixa ao lado do pé do monitor da esquerda (foto 2)
    for x in range(126, 132):
        b = round(ly(126, 114, x))
        cv.put(x, b - 2, rgb("#c9cdd8"))
        cv.put(x, b - 1, rgb("#9aa0b2"))
        cv.put(x, b, rgb("#5b6176"))
    cv.put(129, round(ly(126, 114, 129)) - 1, rgb("#e9ebf1"))
    # mouse (Logitech G preto, LED azul) no vão sob o monitor da esquerda, ao lado do pé
    for dx, dy, c in ((1, 0, "#07080e"), (2, 0, "#07080e"), (0, 1, "#07080e"), (1, 1, "#1d1f28"), (2, 1, "#2a2d38"),
                      (3, 1, "#07080e"), (0, 2, "#07080e"), (1, 2, "#16171f"), (2, 2, "#16171f"), (3, 2, "#07080e"),
                      (1, 3, "#07080e"), (2, 3, "#07080e")):
        cv.put(111 + dx, 114 + dy, rgb(c))
    cv.put(112, 116, rgb("#3c82ff"))
    # headset (arco preto e concha com detalhe vermelho)
    for dx, dy, c in ((0, 0, "#111219"), (1, 0, "#111219"), (2, 0, "#111219"), (3, -1, "#111219"), (-1, -1, "#111219"),
                      (0, -1, "#2a2d38"), (1, -2, "#111219"), (2, -2, "#111219"), (0, 1, "#8e1a28"), (1, 1, "#c8263a")):
        cv.put(89 + dx, 112 + dy, rgb(c))
    # gabinete (torre preta) na ponta direita: frente, lateral e topo, LED de energia
    x0, base = 168, 101
    for x in range(x0, x0 + 7):
        b = round(ly(x0, base, x))
        for y in range(b - 13, b):
            cv.put(x, y, rgb("#15161d") if x > x0 else rgb("#22242e"))
        cv.put(x, b - 13, rgb("#2f3240"))
    for i in range(1, 4):                                            # lateral (profundidade a 45°)
        for y in range(round(ly(x0, base, x0)) - 13 - i, round(ly(x0, base, x0)) - i):
            cv.put(x0 - i, y, rgb("#0d0e14"))
    cv.put(x0 + 3, round(ly(x0, base, x0 + 3)) - 11, rgb("#e9ebf1"))
    for y in range(round(ly(x0, base, x0 + 5)) - 10, round(ly(x0, base, x0 + 5)) - 3, 2):
        cv.put(x0 + 5, y, rgb("#1d1f28"))                              # grade de ventilação


def build_desk():
    """Mesa da v2 (mesmos cantos) com acabamento: tampo com luz da tela perto dos monitores e veio contínuo, quina da
    frente com chanfro, sombra sob o tampo nas faces, faces com veio vertical leve e mais escuras embaixo, pés com
    aresta iluminada; teclado com teclas."""
    cv = mhs.Canvas()
    BL, FL, FR, BR = mhs.desk_corners()
    hgt = mhs.DESK_H
    cv.poly([BL, FL, (FL[0], FL[1] + hgt), (BL[0], BL[1] + hgt)], DW["wood_dd"])
    cv.poly([FL, FR, (FR[0], FR[1] + hgt), (FL[0], FL[1] + hgt)], DW["face"])
    for x in range(int(FL[0]), int(FR[0]) + 1):
        top = round(ly(*FL, x))
        for y in range(top + 1, top + 5):
            cv.put(x, y, DW["wood_d"])
        cv.put(x, top + 5, DW["wood_dd"])
        cv.put(x, top + 6, mix(DW["face"], C["ink"], 0.35))          # sombra sob o tampo
        for y in range(top + 7, top + hgt):
            if (x * 5) % 13 == 0 and y % 3:
                cv.put(x, y, mix(DW["face"], DW["wood_dd"], 0.6))      # veio vertical do painel
            if y > top + hgt - 4:
                cv.put(x, y, mix(DW["face"], C["ink"], 0.25 * (y - (top + hgt - 4))))
        cv.put(x, top + hgt, C["ink"])
    for i in range(0, 13):
        for y in range(1, 5):
            cv.put(BL[0] + i, BL[1] + i + y, DW["wood_d"])
        cv.put(BL[0] + i, BL[1] + i + 5, mix(DW["wood_dd"], C["ink"], 0.4))
    for lx in (int(FL[0]), int(FL[0]) + 1, int(FL[0]) + 2, int(FL[0]) + 3):
        top = round(ly(*FL, lx))
        for y in range(top + 5, top + hgt):
            cv.put(lx, y, DW["wood_hi"] if lx == int(FL[0]) else (DW["wood"] if lx < int(FL[0]) + 2 else DW["wood_d"]))
    for i in range(0, 3):
        for y in range(BL[1] + 5 + i, BL[1] + hgt + i):
            cv.put(BL[0] + i, y, DW["wood_d"])
    cv.poly([BL, FL, FR, BR], DW["wood"])
    # luz das telas no tampo (pontilhado, mais forte perto dos monitores) e veio contínuo
    top = {(x, y) for y in range(int(BR[1]) - 2, int(FL[1]) + 2) for x in range(int(BL[0]), int(FR[0]) + 1)
           if cv.p[x, y][3] and cv.p[x, y][:3] == DW["wood"]}
    bands(cv, 134, 107, 34, 9, C["blue_l"], [0.04], lambda x, y: (x, y) in top)
    for k, off in enumerate((3, 6, 9)):
        for x in range(int(BL[0]) + 4 + k * 5, int(BR[0]) - 6):
            if (x * 3 + k * 7) % 13 < 7:
                y = round(ly(BL[0] + off, BL[1] + off, x))
                if cv.p[x, y][3] and cv.p[x, y][:3] == DW["wood"]:
                    cv.put(x, y, DW["wood_d"])
    for x in range(int(FL[0]), int(FR[0]) + 1):
        cv.put(x, round(ly(*FL, x)), DW["wood_hi"])
        cv.put(x, round(ly(*FL, x)) + 1, DW["wood_d"])
    for i in range(0, 13):
        cv.put(BL[0] + i, BL[1] + i, DW["wood_hi"] if i % 2 == 0 else DW["wood"])
    for x in range(int(BL[0]), int(BR[0]) + 1):
        cv.put(x, round(ly(*BL, x)), DW["wood_d"])
    desk_items(cv)
    keyboard(cv)
    return cv.im


def keyboard(cv):
    """Teclado da v2 (mesmo lugar e tamanho) com 3 fileiras de teclas de 2 px, barra de espaço e base escura."""
    nl, length, depth = (100, 114), 26, 4
    pts = [nl, (nl[0] + length, ly(*nl, nl[0] + length)), (nl[0] + length - depth, ly(*nl, nl[0] + length) - depth), (nl[0] - depth, nl[1] - depth)]
    cv.poly([(p[0], p[1] + 1) for p in pts], rgb("#121830"))
    cv.poly(pts, rgb("#2a3152"))
    key, key_lit = rgb("#5a6596"), rgb("#7e89b8")
    for r in range(1, 4):
        for x in range(nl[0] - r + 1, nl[0] + length - r - 1):
            y = round(ly(nl[0] - r, nl[1] - r, x))
            if (x + r) % 3 != 0:
                cv.put(x, y, key_lit if (x > nl[0] + 12 and (x + r) % 3 == 1) else key)
    for x in range(nl[0] + 6, nl[0] + 16):                           # barra de espaço
        cv.put(x, round(ly(*nl, x)), key)
    for x in range(nl[0], nl[0] + length):
        cv.put(x, round(ly(*nl, x)) + 1, rgb("#262e52"))


# ================================================================ monitores
MONITORS3 = [(113, 131, 116, 116, 17, "l"), (133, 156, 115, 111, 19, "r")]   # o da direita maior (foto 2)


def monitor_rims():
    """Filetes de luz das telas (o runtime acende) para a geometria dos monitores desta cena."""
    return [[(m[1] + 1) if m[5] == "r" else (m[0] - 1), (m[3] if m[5] == "r" else m[2]) - m[4] - 1, m[4] - 4] for m in MONITORS3]


def build_monitors():
    """Monitores da v2 (de costas, mesmos lugares) com cabo descendo para a mesa e chanfro na traseira."""
    cv = mhs.Canvas()
    for m in MONITORS3:
        x0, x1, b0, b1, h, rim = m
        sx = (x0 + x1) // 2

        def bot(x):
            return round(b0 + (b1 - b0) * (x - x0) / max(1, x1 - x0))
        for k in range(5):                                           # cabo atrás do pé
            cv.put(sx + 3 + (k > 2), bot(sx) - 4 + k, C["ink"])
    real = {"back": rgb("#2a2e44"), "hi": rgb("#4a5274"), "edge": rgb("#07080e"), "vent": rgb("#1c2034"), "foot": rgb("#12141f")}
    saved = dict(mhs.MON)
    mhs.MON.update(real)                       # monitores pretos (foto 2); mesma geometria da v2
    try:
        for m in MONITORS3:
            mhs.monitor(cv, *m)
    finally:
        mhs.MON.update(saved)
    x0, x1, b0, b1, h, _ = MONITORS3[1]
    top = lambda x: round(b0 + (b1 - b0) * (x - x0) / max(1, x1 - x0)) - h   # noqa: E731
    for x in range(142, 147):                  # webcam em cima do monitor da direita
        cv.put(x, top(x) - 1, rgb("#0b0c12"))
        cv.put(x, top(x) - 2, rgb("#1d1f2a") if x in (143, 144, 145) else (0, 0, 0), 255 if x in (143, 144, 145) else 0)
    cv.put(144, top(144) - 1, rgb("#3c82ff"))  # lente da webcam
    for m in MONITORS3:
        x0, x1, b0, b1, h, rim = m
        for x in range(x0 + 1, x1):                                  # traseira: meia-luz embaixo (volume)
            b = round(b0 + (b1 - b0) * (x - x0) / max(1, x1 - x0)) - 4
            cv.put(x, b - 1, mix(mhs.MON["back"], mhs.MON["edge"], 0.4))
    return cv.im


# ================================================================ luz
def _band_layer(cx, cy, rx, ry, alphas, region, rgbcol):
    """Camada aditiva em FAIXAS sólidas (mesma técnica de bands): alfa constante por anel; o runtime escala o total."""
    im = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    px = im.load()
    for y in range(int(cy - ry) - 1, int(cy + ry) + 2):
        for x in range(int(cx - rx) - 1, int(cx + rx) + 2):
            if not (0 <= x < W and 0 <= y < H) or not region(x, y):
                continue
            d = math.hypot((x - cx) / rx, (y - cy) / ry)
            if d >= 1:
                continue
            level = (1 - d) * len(alphas)
            k = int(level)
            if level - k < 0.12 and k > 0 and (x + y) % 2 == 0:
                k -= 1
            if k > 0:
                px[x, y] = rgbcol + (alphas[min(k, len(alphas)) - 1],)
    return im


def build_glow():
    """Luz das telas na parede atrás do Lucas (aditiva, desenhada ANTES do personagem): o runtime varia com o que
    acontece na tela (espera, digitando, build ok em verde, calmo)."""
    return _band_layer(124, 86, 40, 24, [18, 26, 32], lambda x, y: y < wall_base(x) - 3, (60, 110, 255))


def build_glow_desk():
    """Luz das telas no tampo (aditiva, depois da mesa e antes dos braços)."""
    BL, FL, FR, BR = mhs.desk_corners()
    desk = scene3.layers()["desk"]
    a = desk.load()
    return _band_layer(134, 107, 28, 8, [22, 34],
                       lambda x, y: a[x, y][3] > 0 and y < ly(*FL, x) - 1 and y > ly(*BL, x) + 1, (80, 140, 255))


def effects_data():
    """Pontos para os efeitos do runtime: janelas acesas da cidade (acendem/apagam), LED do gabinete, feixe do luar."""
    lights = []
    for bx, bw, bh in ((14, 5, 11), (20, 5, 16), (26, 6, 9), (33, 5, 18), (39, 6, 12), (46, 6, 15)):
        for x in range(bx, bx + bw):
            gb = round(ly(WX0, WT0, x)) + WHH - 3
            for wy in range(gb - bh + 2, gb - 1, 4):
                if (x - bx) % 3 == 1 and (x * 7 + wy * 3) % 5 < 2:
                    lights.append([x, wy])
    # janela que acende quando ele olha pela janela tomando café (Fase E): duas janelas apagadas do prédio alto (fora do montante, que fica em x = 34)
    gb = round(ly(WX0, WT0, 34)) + WHH - 3
    event = [[37, gb - 10], [37, gb - 14]]
    event = [p for p in event if p not in lights]
    x0, base = 168, 101
    return {"city": lights, "cityEvent": event, "cityDark": "#0a1230", "led": [x0 + 3, round(ly(x0, base, x0 + 3)) - 11],
            "dust": {"x": [20, 70], "y": [112, 146]}}


def build_moon():
    """Luar (aditivo) entrando pela janela: paralelogramo no chão (o da v2, um pouco mais definido) e borda no
    parapeito."""
    im = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    px = im.load()
    for y in range(108, 150):
        for x in range(0, 90):
            if y > wall_base(x) + 2:
                d = abs((x - 34 - (y - 128) * 0.6) / 22) + abs((y - 128) / 14)
                if d < 1 and dither(x, y, 0.5 * (1 - d)):
                    px[x, y] = (60, 100, 180, 34)
    return im


def build_shade():
    """Sombra ambiente (multiplicação): bordas e cantos mais escuros, o centro (mesa) intocado."""
    im = Image.new("RGBA", (W, H), (255, 255, 255, 0))
    px = im.load()
    for y in range(H):
        for x in range(W):
            d = max(abs(x - 120) / 120, abs(y - 88) / 75)
            v = max(0.0, (d - 0.72) / 0.28)
            if v > 0 and dither(x, y, v * 0.9):
                px[x, y] = (150, 156, 175, 255)
    return im


LAYERS = [("sky", build_sky, "source-over"), ("room", build_room, "source-over"), ("glow", build_glow, "lighter"),
          ("chair", build_chair, "chair"), ("desk", build_desk, "desk"), ("glowdesk", build_glow_desk, "lighter"),
          ("mug", lambda: scene3.layers()["mug"], "mug"), ("monitors", build_monitors, "monitors"),
          ("moon", build_moon, "lighter")]


def build():
    os.makedirs(OUT, exist_ok=True)
    manifest = []
    ims = {}
    for name, fn, op in LAYERS:
        im = fn()
        ims[name] = im
        im.save(os.path.join(OUT, name + ".png"), optimize=True)
        manifest.append({"name": name, "op": op})
    json.dump({"layers": manifest, "monitors": monitor_rims(), "fx": effects_data()}, open(os.path.join(OUT, "scene.json"), "w"))
    return ims


if __name__ == "__main__":
    ims = build()
    print("ok", {k: os.path.getsize(os.path.join(OUT, k + ".png")) for k in ims})
