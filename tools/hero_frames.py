"""Frames do personagem (v2). Cada frame devolve (base, over): `base` é o corpo inteiro (a mesa é desenhada POR CIMA
dele) e `over` só os braços/mãos/caneca que ficam sobre o tampo (desenhados DEPOIS da mesa). Em pé, `over` é None.

Célula 72x72, âncora dos pés em (32, 68) para TODOS os frames: em pé o pé fica no chão; sentado/sentando, o frame é
posicionado no ponto SLOT (diante da cadeira) e o quadril cai exatamente no assento (SEAT_HIP_CELL = chairSeatAnchor).

Vistas:
- perfil para a direita (andar/parado) — o andar para a esquerda é o espelho horizontal (feito no gerador);
- de frente (idle, joinha) — o mesmo desenho do protótipo, que já funcionava;
- sentado em 3/4: tronco quase de frente girado para a direita (para o monitor), cabeça 3/4; antebraços apontando
  para a câmera (encurtados), cotovelos colados ao corpo.
"""
import math
import hero_char as hc
from hero_char import Cell, shoe, hand

hc.THIGH, hc.SHIN = 11.5, 11.5      # 23 px: perna quase reta com o quadril a 22 px do tornozelo (antes 24 = sempre dobrada)

HIP_STAND = (32, 44)
ANK = 66                            # y do tornozelo com o pé no chão (sola em y=68 = âncora)
FEET_CX = 32                        # x dos pés em TODOS os frames em pé/sentando/sentado (nada desliza)
SEAT_HIP_CELL = (34, 52)            # quadril sentado, em coordenadas da célula (âncora dos pés = SLOT)
SH_Y = SEAT_HIP_CELL[1] - 20        # ombros sentado

ARM_LIT = ("L", "T", "D")           # manga com luz (lado do monitor)
ARM_SHADE = ("T", "D", "D")         # manga na sombra


def _sh(hip, lean):
    a = math.radians(lean)
    return (hip[0] + math.sin(a) * 20, hip[1] - math.cos(a) * 20)


# ============================================================ PERFIL (andar / parado)
# pé de apoio anda 3 px para trás a cada frame (= deslocamento do personagem no canvas: sem deslizar)
LEG = [(6, 66), (3, 66), (0, 66), (-3, 66), (-6, 65), (-5, 63), (-1, 62), (4, 64)]   # tornozelo (dx, y) por frame
ARM = [-4, -2, 0, 2, 4, 2, 0, -2]                                                     # mão perto: oposta à perna perto
BOB = [0, 1, 0, -1]                                                                   # contato / baixo / passagem / alto
STEP = 3                                                                              # px por frame no canvas


def leg_side(c, hip, ankle, near=True):
    """Perna de perfil: reta quando esticada (sem quebra no joelho); com o pé erguido, joelho para a FRENTE."""
    d = math.hypot(ankle[0] - hip[0], ankle[1] - hip[1])
    if d >= 21.4:
        knee = ((hip[0] + ankle[0]) / 2, (hip[1] + ankle[1]) / 2)
    else:
        knee = hc.ik(hip, ankle, hc.THIGH, hc.SHIN, -1)
    t = hc.PANTS if near else hc.FARPANTS
    c.capsule(hip, knee, 5.8, t)
    c.capsule(knee, ankle, 5.6, t)
    shoe(c, ankle)


def torso_side(c, hip, lean):
    """Tronco de perfil com costas curvas: ombro arredondado, dorso que alarga abaixo da nuca e afina na cintura, peito
    um pouco à frente. Sombra só na parte baixa das costas (não vira 'mochila'); luz no peito; capuz pequeno na nuca."""
    a = math.radians(lean)
    up, perp = (math.sin(a), -math.cos(a)), (math.cos(a), math.sin(a))
    sh = (hip[0] + up[0] * 20, hip[1] + up[1] * 20)
    hx, hy = hip

    def P(dx, dy):                       # ponto no referencial do tronco (dx para frente, dy para cima a partir do quadril)
        return (hx + perp[0] * dx + up[0] * dy, hy + perp[1] * dx + up[1] * dy + 3.5 * (1 if dy < 1 else 0) * 0)

    back = [(-5.2, 21), (-6.8, 17), (-7.2, 11), (-6.9, 5), (-6.2, -1), (-6.2, -3.5)]
    front = [(5.6, 21), (6.9, 17), (7.2, 11), (7.0, 5), (6.6, -1), (6.8, -3.5)]
    pts = [P(*p) for p in back] + [P(*p) for p in reversed(front)]
    out = [(x + (-1 if i < len(back) else 1), y + (-1 if i in (0, len(pts) - 1) else (1 if i in (len(back) - 1, len(back)) else 0))) for i, (x, y) in enumerate(pts)]
    c.poly(out, "o")
    c.poly(pts, "T")
    # sombra: faixa fina nas costas, só do meio para baixo
    c.poly([P(-7.2, 11), P(-5.0, 11), P(-4.6, -3.5), P(-6.2, -3.5)], "D")
    # luz no peito
    c.poly([P(4.4, 15), P(6.9, 15), P(6.8, -1), P(4.6, -1)], "L")
    # ombro (luz de cima)
    c.poly([P(-4.5, 21), P(5.4, 21), P(6.0, 19), P(-5.5, 19)], "L")
    # barra do moletom e bolso canguru
    c.poly([P(-6.2, -1.5), P(6.6, -1.5), P(6.8, -3.5), P(-6.2, -3.5)], "D")
    c.rect(int(hx + 1), int(hy) - 4, 6, 1, "D")
    c.rect(int(sh[0]) + 3, int(sh[1]) + 1, 1, 7, "c")          # cordão do capuz
    return sh

def profile(near_ank, far_ank, near_dx, far_dx, bob=0, blink=False, head="34"):
    c = Cell()
    hip = (HIP_STAND[0], HIP_STAND[1] + bob)
    lean = 2
    sh = _sh(hip, lean)
    reach = 18.6            # ombro→mão quase igual ao braço (19): cotovelo dobra ~2 px, braço solto ao lado do corpo
    def handpos(dx):
        return (sh[0] + dx, sh[1] + 2 + math.sqrt(max(0.0, reach * reach - dx * dx)))
    # braço de trás: sai do mesmo ombro, fica atrás do tronco e só aparece quando balança
    hc.arm(c, (sh[0], sh[1] + 2), handpos(far_dx), near=False, bend=1)
    leg_side(c, (hip[0] - 1, hip[1] + 1), (hip[0] + far_ank[0], far_ank[1]), near=False)
    torso_side(c, hip, lean)
    c.disc(sh[0] - 4.2, sh[1] - 0.5, 2.7, "D", halo=True)       # capuz (dobra pequena na nuca)
    leg_side(c, hip, (hip[0] + near_ank[0], near_ank[1]), near=True)
    c.rect(int(sh[0]) - 1, int(sh[1]) - 4, 5, 5, "S")         # pescoço
    c.head(head, int(round(sh[0] - 8)), int(round(sh[1] - 18)), blink=blink)
    hc.arm(c, (sh[0] + 1, sh[1] + 2), handpos(near_dx), near=True, bend=1)
    return c.finish()


def walk(i):
    return profile(LEG[i % 8], LEG[(i + 4) % 8], ARM[i % 8], -ARM[i % 8], bob=BOB[i % 4])


def stand_profile(blink=False):
    return profile((1, 66), (-1, 66), 1, -1, blink=blink)


# ============================================================ DE FRENTE (idle / joinha) — desenho do protótipo
def front(thumb=None, blink=False, bob=0):
    c = Cell()
    cx, hipy = 32, 44 + bob
    shy = hipy - 20
    for dx in (-4, 4):
        c.capsule((cx + dx, hipy + 2), (cx + dx, ANK - 2), 6.4, ("p", "P", "Q"))
        shoe(c, (cx + dx - 2, ANK))
    c.capsule((cx + 9, shy + 3), (cx + 11, shy + 13), 6.0, ("T", "D", "D"))
    c.capsule((cx + 11, shy + 13), (cx + 10, shy + 19), 5.4, ("T", "D", "D"))
    c.disc(cx + 10, shy + 21, 2.4, "S", halo=True)
    torso_front(c, cx, shy, hipy)
    if thumb is None:            # braço esquerdo do espectador solto ao lado do corpo
        c.capsule((cx - 9, shy + 3), (cx - 11, shy + 13), 6.0, ("L", "T", "D"))
        c.capsule((cx - 11, shy + 13), (cx - 10, shy + 19), 5.4, ("L", "T", "D"))
        c.disc(cx - 10, shy + 21, 2.4, "s", halo=True)
    else:
        sh, el, hd = (cx - 9, shy + 3), (cx - 16, shy + 11 + thumb), (cx - 15, shy + 2 + thumb)
        c.capsule(sh, el, 6.0, ("L", "T", "D"))
        c.capsule(el, hd, 5.6, ("L", "T", "D"))
        c.disc(hd[0], hd[1] + 2.4, 2.4, "D")
        c.rect(int(hd[0]) - 3, int(hd[1]) - 5, 7, 6, "o")
        c.rect(int(hd[0]) - 2, int(hd[1]) - 4, 5, 5, "s")
        c.rect(int(hd[0]) - 2, int(hd[1]) - 9, 2, 6, "o"); c.rect(int(hd[0]) - 1, int(hd[1]) - 9, 2, 6, "s")
        c.rect(int(hd[0]) - 2, int(hd[1]) - 1, 5, 1, "S")
    c.head("front", cx - 8, shy - 18, blink=blink)
    return c.finish()


def torso_front(c, cx, shy, hipy):
    """Tronco do moletom de frente (com sombra à esquerda, luz à direita, barra, bolso, gola e cordões)."""
    c.poly([(cx - 10, shy - 1), (cx + 10, shy - 1), (cx + 11, hipy + 3), (cx - 11, hipy + 3)], "o")
    c.poly([(cx - 9, shy), (cx + 9, shy), (cx + 10, hipy + 2), (cx - 10, hipy + 2)], "T")
    c.poly([(cx - 9, shy), (cx - 6, shy), (cx - 7, hipy + 2), (cx - 10, hipy + 2)], "D")
    c.poly([(cx + 6, shy + 2), (cx + 9, shy + 2), (cx + 10, hipy + 2), (cx + 7, hipy + 2)], "L")
    c.rect(cx - 10, hipy - 1, 21, 3, "D")
    c.rect(cx - 5, hipy - 9, 11, 1, "D")
    c.rect(cx - 3, shy - 2, 7, 5, "D")
    c.rect(cx - 4, shy + 2, 1, 8, "c"); c.rect(cx + 4, shy + 2, 1, 8, "c")
    c.rect(cx - 1, shy - 3, 3, 3, "S")


# ============================================================ SENTADO (3/4)
def limb(c, a, b, w, tones):
    c.capsule(a, b, w, tones)


def arm3(c, sh, el, hd, tones, kind="keys"):
    """Braço com cotovelo explícito (o antebraço vem para a câmera, então ele é curto na tela: IK esticaria)."""
    limb(c, sh, el, 6.0, tones)
    limb(c, el, hd, 5.2, tones)
    ex, ey = hd[0] - el[0], hd[1] - el[1]
    ln = max(1e-6, math.hypot(ex, ey))
    c.disc(hd[0] - ex / ln * 2.0, hd[1] - ey / ln * 2.0, 2.3, "D")      # punho canelado
    hand(c, (hd[0] - (1 if kind == "keys" else 0), hd[1]), kind, near=True)


def mug(c, x, y, tilt=0):
    """Caneca 4x5 (branca com faixa verde), alça à esquerda. tilt=1: inclinada (bebendo)."""
    for yy in range(5):
        sx = x + (tilt * (2 - yy) // 2)
        for xx in range(-1, 5):
            c.put(sx + xx, y + yy, "o")
    for yy in range(5):
        sx = x + (tilt * (2 - yy) // 2)
        for xx in range(4):
            c.put(sx + xx, y + yy, "y" if yy in (2, 3) else ("t" if xx == 3 else "C"))
    c.put(x + (tilt * 2 // 2) + 0, y, "B")       # café na boca da caneca
    c.put(x + (tilt * 2 // 2) + 1, y, "B")
    c.put(x - 2, y + 1, "o"); c.put(x - 2, y + 2, "C"); c.put(x - 2, y + 3, "o")    # alça


def seated(pose, hip=SEAT_HIP_CELL, head="front", hdx=0, hdy=0, blink=False, legs="seat"):
    """pose: dict com 'L' e 'R' = (cotovelo, mão, tipo) dos braços esquerdo/direito do espectador, e opcionalmente
    'mug' = (x, y, tilt) desenhada na mão direita. Devolve (base, over). Os pés ficam sempre em FEET_CX."""
    cx, hipy = hip
    shy = hipy - 20
    base = Cell()
    fx = FEET_CX
    if legs == "seat":    # sentado: coxas vêm para a câmera (curtas na tela) e canelas descem; quase tudo fica atrás da mesa
        for dx in (-4, 4):
            base.capsule((cx + dx, hipy + 1), (fx + dx + 1, hipy + 6), 6.6, ("p", "P", "Q"))
            base.capsule((fx + dx + 1, hipy + 6), (fx + dx, ANK - 2), 5.6, ("p", "P", "Q"))
            shoe(base, (fx + dx - 2, ANK))
    else:                 # em pé / meio caminho: pernas do quadril ao chão; o joelho vai para a frente quanto mais baixo o quadril
        drop = max(0, hipy - 44)
        knee_dy = (ANK - hipy) // 2
        for dx in (-4, 4):
            kx = fx + dx + drop // 2
            base.capsule((cx + dx, hipy + 1), (kx, hipy + knee_dy), 6.4, ("p", "P", "Q"))
            base.capsule((kx, hipy + knee_dy), (fx + dx, ANK - 2), 5.6, ("p", "P", "Q"))
            shoe(base, (fx + dx - 2, ANK))
    torso_front(base, cx, shy, hipy)
    kind_front = head in ("front", "frontd")
    base.head(head, cx - (8 if kind_front else 7) + hdx, shy - 18 + hdy, blink=blink)

    over = Cell()
    shL, shR = (cx - 9, shy + 3), (cx + 9, shy + 3)
    for cell in (base, over):
        L, R = pose["L"], pose["R"]
        arm3(cell, shL, L[0], L[1], ARM_SHADE, L[2])
        arm3(cell, shR, R[0], R[1], ARM_LIT, R[2])
        if pose.get("mug"):
            mx, my, tilt = pose["mug"]
            mug(cell, mx, my, tilt)
    return base.finish(), over


# --- posições (célula). Teclado: mãos em L(29,54) R(43,52); caneca da mesa: mão em (53,53)
KEYS = [((24, 47), (31, 54), (44, 46), (40, 53)), ((24, 47), (32, 54), (44, 45), (40, 52)),
        ((24, 48), (31, 55), (44, 46), (41, 53)), ((24, 47), (32, 54), (44, 46), (39, 53))]
REST = ((24, 47), (30, 54), (44, 46), (41, 53))


def type_pose(i):
    le, lh, re, rh = KEYS[i % 4]
    return {"L": (le, lh, "keys"), "R": (re, rh, "keys")}


def rest_pose():
    le, lh, re, rh = REST
    return {"L": (le, lh, "keys"), "R": (re, rh, "keys")}


def with_left(el, hd, kind="open", right=None):
    p = rest_pose() if right is None else right
    p = dict(p)
    p["L"] = (el, hd, kind)
    return p


def with_right(el, hd, kind="grip", mugpos=None):
    p = dict(rest_pose())
    p["R"] = (el, hd, kind)
    if mugpos:
        p["mug"] = mugpos
    return p


# --- sentar / levantar (de frente, mesmas coordenadas: pés em FEET_CX, o quadril desce até SEAT_HIP_CELL)
SIDES = ((22, 54), (24, 61), (42, 54), (40, 61))             # braços soltos ao lado do corpo (cotovelo/mão E, cotovelo/mão D)
DESKH = ((24, 47), (31, 54), (44, 46), (40, 53))             # mãos no teclado


def _mix(a, b, t):
    return tuple((round(a[i][0] + (b[i][0] - a[i][0]) * t), round(a[i][1] + (b[i][1] - a[i][1]) * t)) for i in range(4))


def sit_frame(hip, hands, head="front", hdy=0, hdx=0, on_desk=False):
    """Em pé/meio sentado ATRÁS da mesa: braços só na camada do corpo (a mesa os esconde), a não ser que as mãos
    já estejam apoiadas no tampo (on_desk)."""
    le, lh, re, rh = hands
    base, over = seated({"L": (le, lh, "open"), "R": (re, rh, "open")}, hip=hip, head=head, hdy=hdy, hdx=hdx, legs="stand")
    return (base, over if on_desk else None)


# quadril (x, y), mistura braços->teclado, queda da cabeça, cabeça: descida suave com antecipação de 1 px,
# aceleração no meio e amortecimento ao tocar o assento
SIT_PATH = [((32, 44), 0.0, 0, "34"), ((32, 45), 0.0, 1, "34"), ((33, 47), 0.1, 1, "front"), ((33, 49), 0.3, 1, "front"),
            ((34, 51), 0.55, 0, "front"), ((34, 53), 0.85, 0, "front"), ((34, 53), 1.0, 1, "front"), ((34, 52), 1.0, 0, "front")]
STAND_PATH = [((34, 52), 1.0, 1, "front"), ((34, 52), 0.85, 2, "front"), ((34, 49), 0.6, 2, "front"), ((34, 47), 0.35, 1, "front"),
              ((33, 45), 0.15, 0, "front"), ((32, 44), 0.0, 0, "front"), ((32, 44), 0.0, 0, "34")]


def path_frames(path):
    return [sit_frame(hip, _mix(SIDES, DESKH, k), head=hd, hdy=dy, on_desk=k > 0.75) for hip, k, dy, hd in path]


ORDER = []


def add(name, frames):
    ORDER.append((name, [f if isinstance(f, tuple) else (f, None) for f in frames]))


add("front_idle", [front(), front(bob=1), front(blink=True)])
add("stand_r", [stand_profile(), stand_profile(blink=True)])
add("walk_r", [walk(i) for i in range(8)])
add("turn_r", [sit_frame((32, 44), SIDES, head="34")])
add("sit_down", path_frames(SIT_PATH))
add("seated_idle", [seated(rest_pose(), head="frontd"), seated(rest_pose(), head="frontd", hdy=1), seated(rest_pose(), head="frontd", blink=True)])
add("typing", [seated(type_pose(i), head="frontd") for i in range(4)])
add("typing_down", [seated(type_pose(i), head="frontd", hdy=1) for i in (0, 2)])
add("scratch_head", [seated(with_left((20, 30), (24, 23), "open"), hdx=1),
                     seated(with_left((19, 25), (27, 17), "open"), hdx=1),
                     seated(with_left((19, 26), (26, 18), "open"), hdx=1, hdy=1)])
add("scratch_neck", [seated(with_left((18, 36), (25, 28), "open")),
                     seated(with_left((18, 33), (28, 25), "open"), hdy=1),
                     seated(with_left((18, 34), (27, 26), "open"), hdy=1)])
add("celebrate", [seated(with_left((20, 41), (21, 33), "fist")),
                  seated(with_left((19, 37), (21, 27), "fist"), hdy=-1),
                  seated(with_left((20, 41), (21, 34), "fist"))])
add("coffee_reach", [seated(with_right((47, 46), (49, 51), "open")),
                     seated(with_right((48, 47), (53, 53), "grip"))])          # mão na caneca da mesa (MUG)
add("coffee_hold", [seated(with_right((48, 45), (52, 49), "grip", (52, 47, 0)))])   # levantou 4 px, mesma posição
add("coffee_drink", [seated(with_right((49, 35), (44, 28), "grip", (42, 23, 0)), hdx=1),
                     seated(with_right((49, 34), (44, 27), "grip", (42, 22, 1)), head="34u", hdx=1, hdy=-1)])
add("coffee_return", [seated(with_right((49, 41), (44, 38), "grip", (44, 36, 0)))])
add("stand_up", path_frames(STAND_PATH))
