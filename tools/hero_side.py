"""Lucas de PERFIL (andar / parado de lado), desenhado pixel a pixel como a versão de lado do personagem de FRENTE:
- cabeça: perfil puro com as MESMAS faixas da cabeça de frente (cabelo nas linhas 0-5, óculos nas 6-9, bochecha na 10,
  barba e boca nas 11-15), mesma paleta (FRONT_PAL), mesmos óculos de armação grossa;
- corpo: magro/médio — o tronco de lado tem ~60% da largura do tronco de frente (13 px contra 22), costas e frente quase
  retas (sem barriga), capuz só uma dobra na nuca, braço fino solto ao lado do corpo;
- pernas: coxa afinando até a canela, joelho para a frente, tênis branco em 3 posições.

Célula 72x72, âncora dos pés em (32, 68), virado para a direita (o andar para a esquerda é o espelho, feito no gerador).
"""
import math
import hero_char as hc
from hero_char import Cell

FP = hc.FRONT_PAL

# perfil (15 px): nuca/cabelo à esquerda, orelha no meio, costeleta ligando à barba, uma lente na frente do olho com a
# haste até a orelha, nariz na borda direita. O contorno externo vem do finish().
SIDE_PROFILE = [
    "....oooooo.....",
    "..oohhHHHhhoo..",
    ".ohhhHHhhhhhho.",
    "ohhhhhhhhhhhhho",
    "ohhhhhhhhhsssso",
    "ohhhhhhhsssssso",
    "ohhhhSShsggggso",
    "ohhhSkSgggwegso",
    "ohhhSkSssgllgss",
    "ohhhSSSssggggsk",
    ".ohhhbbssssssSo",
    "..ohhbbbsssbbbo",
    "...oobbbbbbmtto",
    ".....obbbbbbmbo",
    "......obbBBbbo.",
    "........oobbo..",
]
SIDE_PROFILE_BLINK = list(SIDE_PROFILE)
SIDE_PROFILE_BLINK[7] = "ohhhSkSgggSSgso"
SIDE_PROFILE_BLINK[8] = "ohhhSkSssgssgss"
assert all(len(r) == 15 for r in SIDE_PROFILE + SIDE_PROFILE_BLINK), [len(r) for r in SIDE_PROFILE]

HIP = (32, 46)
HEAD_X = 25           # x da coluna 0 da cabeça (orelha em 30-31, logo acima do pescoço)


def head(c, x, y, blink=False):
    for ry, row in enumerate(SIDE_PROFILE_BLINK if blink else SIDE_PROFILE):
        for rx, ch in enumerate(row):
            if ch != ".":
                c.put(x + rx, y + ry, FP[ch])


# tronco: (y relativo à linha dos ombros, x das costas, x da frente). Ombro arredondado, peito 1 px à frente,
# barriga reta (nada estufado), barra reta. 12-13 px de profundidade.
TORSO = [(-3, 28, 29), (-2, 27, 30), (-1, 27, 32), (0, 27, 35), (1, 27, 36), (2, 26, 37), (3, 26, 37), (4, 26, 38), (5, 26, 38), (6, 26, 38),
         (7, 26, 38), (8, 26, 38), (9, 26, 37), (10, 27, 37), (11, 27, 37), (12, 27, 37), (13, 27, 37), (14, 27, 37),
         (15, 27, 37), (16, 27, 37), (17, 27, 37), (18, 27, 37), (19, 27, 37), (20, 26, 37), (21, 26, 37), (22, 26, 37)]


def torso(c, shy):
    for ry, xb, xf in TORSO:
        y = shy + ry
        for x in range(xb, xf + 1):
            k = "T"
            if x == xb and ry > 1:
                k = "D"                                   # costas: 1 px de sombra
            elif x == xf and ry > 1:
                k = "L"                                   # frente: 1 px de luz
            elif ry <= 1:
                k = "L"                                   # luz de cima no ombro
            c.put(x, y, k)
    # capuz: só uma dobra na nuca (2 px de sombra), sem volume extra
    c.put(28, shy, "D"); c.put(29, shy, "D"); c.put(27, shy + 1, "D"); c.put(28, shy + 1, "D")
    # gola na frente do pescoço e cordão
    for x in range(32, 35):
        c.put(x, shy - 1, "D")
    for y in range(shy + 1, shy + 7):
        c.put(36, y, "c")
    # bolso canguru: costura curta na frente, sem bojo
    for y in range(shy + 13, shy + 19):
        c.put(34, y, "D")
    for x in range(34, 38):
        c.put(x, shy + 13, "D")
    # barra canelada
    for x in range(26, 38):
        c.put(x, shy + 21, "D"); c.put(x, shy + 22, "D")


# --------------------------------------------------------------------------- tênis branco de lado
# (dx, dy) relativos ao tornozelo; F = cabedal, w = luz, f = sola
SHOES = {
    "flat": ["FFFF....",
             "FFFFFFw.",
             "ffffffff"],
    "toe_up": [".....Fw.",
               "FFFFFFFf",
               "FFFFff..",
               "fff....."],
    "heel_up": ["FFF.....",
                "FFFFw...",
                ".ffFFFw.",
                "...fffff"],
}
SHOE_X = -2


def shoe(c, ax, ay, kind="flat"):
    for ry, row in enumerate(SHOES[kind]):
        for rx, ch in enumerate(row):
            if ch != ".":
                c.put(ax + SHOE_X + rx, ay + ry, ch)


def shoe_ankle_y(kind):
    """y do tornozelo para a sola tocar o chão (última linha do tênis na linha 68)."""
    return 68 - (len(SHOES[kind]) - 1)


# --------------------------------------------------------------------------- pernas
def taper(c, p0, p1, w0, w1, tones, halo=True):
    """Segmento com largura de w0 (em p0) a w1 (em p1). Luz na borda da frente (direita), sombra na de trás."""
    (x0, y0), (x1, y1) = p0, p1
    dx, dy = x1 - x0, y1 - y0
    ln2 = max(1e-6, dx * dx + dy * dy)
    ln = math.sqrt(ln2)
    nx, ny = dy / ln, -dx / ln
    if nx < 0:
        nx, ny = -nx, -ny
    pad = max(w0, w1) / 2 + 2
    cells = {}
    for yy in range(int(min(y0, y1) - pad), int(max(y0, y1) + pad) + 1):
        for xx in range(int(min(x0, x1) - pad), int(max(x0, x1) + pad) + 1):
            t = max(0.0, min(1.0, ((xx - x0) * dx + (yy - y0) * dy) / ln2))
            cx, cy = x0 + dx * t, y0 + dy * t
            r = (w0 + (w1 - w0) * t) / 2
            d = math.hypot(xx - cx, yy - cy)
            side = ((xx - cx) * nx + (yy - cy) * ny) / max(r, 0.01)
            cells[(xx, yy)] = (d, r, side)
    lt, md, dk = tones
    if halo:
        for p, (d, r, _) in cells.items():
            if d <= r + 1.0:
                c.put(p[0], p[1], "o")
    for p, (d, r, side) in cells.items():
        if d <= r:
            c.put(p[0], p[1], lt if side > 0.5 else (dk if side < -0.4 else md))


SWING_THIGH, SWING_SHIN = 9.6, 9.6      # só a perna no ar dobra: com 19,2 px o joelho sai no máximo ~4 px para a frente


def leg(c, hip, ankle, near, support=False):
    """Perna de apoio (pé no chão) sempre RETA: o quadril não 'agacha' a cada passo. A perna no ar dobra o joelho
    para a frente, de leve."""
    d = math.hypot(ankle[0] - hip[0], ankle[1] - hip[1])
    if support or d >= SWING_THIGH + SWING_SHIN - 0.3:
        knee = ((hip[0] + ankle[0]) / 2, (hip[1] + ankle[1]) / 2)
    else:
        knee = hc.ik(hip, ankle, SWING_THIGH, SWING_SHIN, -1)
    tones = ("p", "P", "Q") if near else ("P", "Q", "Q")
    taper(c, hip, knee, 6.0, 4.8, tones)
    taper(c, knee, (ankle[0], ankle[1] - 1), 4.8, 4.0, tones)


def pelvis(c, hip):
    """Assento da calça logo abaixo da barra: liga as coxas ao tronco, na mesma profundidade do tronco."""
    x, y = hip
    for i, (a, b) in enumerate([(-5, 4), (-5, 4), (-4, 3)]):
        for xx in range(x + a, x + b + 1):
            c.put(xx, y - 1 + i, "Q" if xx == x + a else ("p" if xx == x + b else "P"))


# ciclo de 8 quadros para UMA perna (a outra está defasada 4 quadros): (dx do tornozelo, pé, altura do pé).
# O pé de apoio recua 3 px por quadro (= STEP do JS), então não desliza.
CYCLE = [(6, "toe_up", 0), (3, "flat", 0), (0, "flat", 0), (-3, "flat", 0),
         (-6, "heel_up", 0), (-5, "heel_up", 1), (-1, "heel_up", 2), (3, "flat", 2)]
BOB = [0, 1, 0, 0, 0, 1, 0, 0]             # 1 px só no quadro "desce": sem quicar
ARM = [-2, -1.5, 0, 1.5, 2, 1.5, 0, -1.5]  # mão de perto: oposta à perna de perto, balanço curto


def place_leg(c, hip, ph, near):
    dx, kind, lift = CYCLE[ph % 8]
    ax = hip[0] + dx
    ay = shoe_ankle_y(kind) - lift
    leg(c, (hip[0] + (0 if near else -1), hip[1]), (ax, ay), near, support=lift == 0)
    shoe(c, ax, ay, kind)


# --------------------------------------------------------------------------- braços
def arm(c, sh, swing, near):
    """Braço fino e solto: ombro → cotovelo (leve dobra) → mão na altura do quadril."""
    el = (sh[0] - 0.6 + swing * 0.4, sh[1] + 9.5)
    hd = (sh[0] + 0.6 + swing * 1.1, sh[1] + 18.5 - abs(swing) * 0.2)
    tones = ("L", "T", "D") if near else ("T", "D", "D")
    taper(c, sh, el, 4.8, 4.2, tones)
    taper(c, el, hd, 4.2, 3.8, tones)
    hx, hy = int(round(hd[0])), int(round(hd[1]))
    s, sd, sl = ("s", "S", "k") if near else ("S", "S", "s")
    shape = [(hx + x, hy + y) for y in range(3) for x in range(-1, 2)]
    for (x, y) in shape:                                   # contorno próprio da mão
        for ddx, ddy in ((1, 0), (-1, 0), (0, 1), (0, -1)):
            if (x + ddx, y + ddy) not in shape:
                c.put(x + ddx, y + ddy, "o")
    for x in range(hx - 1, hx + 2):
        c.put(x, hy - 1, "D")                              # punho
    for (x, y) in shape:
        c.put(x, y, s)
    c.put(hx + 1, hy, sl); c.put(hx - 1, hy + 2, sd); c.put(hx, hy + 2, sd)


def side(ph, blink=False, stand=False):
    c = Cell()
    bob = 0 if stand else BOB[ph % 8]
    hip = (HIP[0], HIP[1] + bob)
    shy = hip[1] - 22                       # linha dos ombros: cabeça e pescoço na mesma altura do personagem de frente
    sh = (31, shy + 2)
    swing = 0 if stand else ARM[ph % 8]
    # de trás para a frente: braço de longe, pernas, quadril, tronco, pescoço, cabeça, braço de perto
    arm(c, (sh[0], sh[1]), -swing, near=False)
    if stand:
        for near, dx in ((False, -2), (True, 2)):
            ax = hip[0] + dx
            leg(c, (hip[0] + (0 if near else -1), hip[1]), (ax, shoe_ankle_y("flat")), near, support=True)
            shoe(c, ax, shoe_ankle_y("flat"), "flat")
    else:
        place_leg(c, hip, ph + 4, near=False)
        place_leg(c, hip, ph, near=True)
    pelvis(c, hip)
    torso(c, shy)
    for y in range(shy - 7, shy):                          # pescoço (atrás do maxilar; sombra embaixo do queixo)
        for x in range(29, 34):
            c.put(x, y, "S" if x < 32 else "s")
    head(c, HEAD_X, shy - 18, blink=blink)
    arm(c, sh, swing, near=True)
    return c.finish()


def walk_frames():
    return [side(i) for i in range(8)]


def stand_frames():
    return [side(0, stand=True), side(0, stand=True, blink=True)]
