"""Poses do personagem: esqueleto simples (articulações) -> sprites. Usa hero_sprites.Cell."""
import math
import hero_sprites as hs
from hero_sprites import Cell

HIP_STAND = (27, 40)
THIGH, SHIN, UPPER, FORE = 10, 10, 8, 8


def ik(root, target, l1, l2, bend=1):
    """Dois ossos: devolve a articulação do meio (joelho/cotovelo)."""
    dx, dy = target[0] - root[0], target[1] - root[1]
    d = max(1e-6, math.hypot(dx, dy))
    d = min(d, l1 + l2 - 0.01)
    a = (l1 * l1 - l2 * l2 + d * d) / (2 * d)
    h = math.sqrt(max(0, l1 * l1 - a * a))
    ux, uy = dx / d, dy / d
    mx, my = root[0] + ux * a, root[1] + uy * a
    return (mx - uy * h * bend, my + ux * h * bend)


def shoe(c, ankle, facing=1, lift=0):
    x, y = int(round(ankle[0])), int(round(ankle[1]))
    for yy in range(3):
        for xx in range(-2, 5):
            c.put(x + (xx if facing > 0 else -xx), y + yy - 1, "F")
    for xx in range(-2, 5):
        c.put(x + (xx if facing > 0 else -xx), y + 2, "f")


def leg(c, hip, ankle, near=True, bend=1):
    knee = ik(hip, ankle, THIGH, SHIN, bend)
    col = "P" if near else "Q"
    c.line(hip, knee, 5, col)
    c.line(knee, ankle, 4.2, col)
    shoe(c, (ankle[0], ankle[1]))
    return knee


def arm(c, shoulder, hand, near=True, bend=-1, sleeve=None):
    elbow = ik(shoulder, hand, UPPER, FORE, bend)
    col = sleeve or ("T" if near else "D")
    c.line(shoulder, elbow, 5.0, col)
    c.line(elbow, hand, 4.6, col)
    c.disc(hand[0], hand[1], 2.0, "s" if near else "S")
    return elbow


def torso(c, hip, lean_deg):
    a = math.radians(lean_deg)
    up = (math.sin(a), -math.cos(a))
    perp = (math.cos(a), math.sin(a))
    sh = (hip[0] + up[0] * 17, hip[1] + up[1] * 17)
    hw_s, hw_h = 6.4, 6.0
    pts = [
        (sh[0] - perp[0] * hw_s, sh[1] - perp[1] * hw_s), (sh[0] + perp[0] * hw_s, sh[1] + perp[1] * hw_s),
        (hip[0] + perp[0] * hw_h, hip[1] + perp[1] * hw_h + 3), (hip[0] - perp[0] * hw_h, hip[1] - perp[1] * hw_h + 3),
    ]
    c.poly(pts, "T")
    return sh


def profile(c, hip, lean=0, head="prof", hdx=0, hdy=0, near_hand=None, far_hand=None, near_ankle=None, far_ankle=None,
            near_bend=-1, far_bend=-1, leg_bend=1, blink=False, sleeve_far=True, extras=None):
    """Figura de perfil olhando para a direita."""
    sh = (hip[0] + math.sin(math.radians(lean)) * 17, hip[1] - math.cos(math.radians(lean)) * 17)
    # braço de trás, perna de trás
    if far_hand:
        arm(c, (sh[0] - 1, sh[1] + 1), far_hand, near=False, bend=far_bend)
    if far_ankle:
        leg(c, (hip[0] - 1, hip[1] + 1), far_ankle, near=False, bend=leg_bend)
    torso(c, hip, lean)
    # capuz atrás do pescoço
    c.disc(sh[0] - 3, sh[1] - 0.5, 3.6, "D")
    if near_ankle:
        leg(c, hip, near_ankle, near=True, bend=leg_bend)
    # cordão
    c.line((sh[0] + 3, sh[1] + 2), (sh[0] + 3.5, sh[1] + 8), 1, "c")
    # cabeça (o queixo/barba cobrem a gola)
    c.head(head, int(round(sh[0] - 7 + hdx)), int(round(sh[1] - 14 + hdy)), blink=blink)
    if near_hand:
        arm(c, (sh[0] + 1, sh[1] + 2), near_hand, near=True, bend=near_bend)
    if extras:
        extras(c)
    return sh


def sit_frame(i):
    """Transição de pé -> sentado (perfil): 0 prepara, 1 desce, 2 assenta."""
    c = Cell()
    hips = [(27, 43), (26, 46), (26, 48)]
    leans = [6, 10, 8]
    ank = [((30, 58), (27, 58)), ((33, 58), (30, 58)), ((36, 58), (33, 58))]
    hip, lean = hips[i], leans[i]
    sh = (hip[0] + math.sin(math.radians(lean)) * 17, hip[1] - math.cos(math.radians(lean)) * 17)
    hands = [((sh[0] + 9, sh[1] + 9), (sh[0] + 5, sh[1] + 9)), ((sh[0] + 11, sh[1] + 8), (sh[0] + 7, sh[1] + 8)), ((45, 38), (43, 38))]
    profile(c, hip, lean, near_hand=hands[i][0], far_hand=hands[i][1], near_ankle=ank[i][0], far_ankle=ank[i][1], leg_bend=-1)
    return c.finish()


def stand_profile(blink=False, bob=0):
    c = Cell()
    hip = (HIP_STAND[0], HIP_STAND[1] + bob)
    profile(c, hip, 0, near_hand=(hip[0] + 1, hip[1] + 1), far_hand=(hip[0] - 2, hip[1] + 1),
            near_ankle=(hip[0] + 2, 58), far_ankle=(hip[0] - 2, 58), blink=blink)
    return c.finish()


def walk_frame(i, n=6):
    ph = 2 * math.pi * i / n
    c = Cell()
    hip = (HIP_STAND[0], HIP_STAND[1] + 1 - round(1.4 * abs(math.sin(ph))))

    def foot(p):
        return (hip[0] + 7 * math.cos(p) + 1, 58 - 4 * max(0.0, -math.sin(p)))

    sh_x = hip[0]
    near_hand = (sh_x - 5.5 * math.cos(ph) + 1, hip[1] - 4 + 2 * abs(math.sin(ph)) + 5)
    far_hand = (sh_x + 5.5 * math.cos(ph) + 1, hip[1] - 4 + 2 * abs(math.sin(ph)) + 5)
    profile(c, hip, 3, near_hand=near_hand, far_hand=far_hand, near_ankle=foot(ph), far_ankle=foot(ph + math.pi))
    return c.finish()


def front_frame(blink=False, thumb=0, bob=0, tilt=0):
    """Vista frontal: joinha com o braço esquerdo (do espectador), como no avatar."""
    c = Cell()
    cx, hipy = 28, 40 + bob
    shy = hipy - 17
    # pernas
    for dx, col in ((-3, "P"), (3, "P")):
        c.rect(cx + dx - 2, hipy, 5, 17, col)
        c.rect(cx + dx - 3, 57, 6, 3, "F")
        c.rect(cx + dx - 3, 59, 6, 1, "f")
    # braço de baixo (lado do espectador direito)
    c.line((cx + 7, shy + 2), (cx + 9, shy + 11), 4.6, "D")
    c.line((cx + 9, shy + 11), (cx + 8, shy + 17), 4.2, "D")
    c.disc(cx + 8, shy + 18, 2.2, "S")
    # tronco
    c.poly([(cx - 8, shy), (cx + 8, shy), (cx + 8, hipy + 3), (cx - 8, hipy + 3)], "T")
    c.rect(cx - 2, shy - 1, 5, 4, "D")  # gola do capuz
    c.line((cx - 3, shy + 2), (cx - 3, shy + 9), 1.2, "c")
    c.line((cx + 3, shy + 2), (cx + 3, shy + 9), 1.2, "c")
    # braço do joinha (lado esquerdo do espectador): ombro -> cotovelo para fora -> punho para cima
    sh = (cx - 8, shy + 2)
    el = (cx - 13, shy + 9 + thumb)
    hand = (cx - 13, shy + 2 + thumb)
    c.line(sh, el, 4.6, "T")
    c.line(el, hand, 4.4, "T")
    c.rect(hand[0] - 2, hand[1] - 3, 5, 5, "s")
    c.rect(hand[0] - 1, hand[1] - 6, 2, 4, "s")   # polegar
    c.rect(hand[0] - 2, hand[1] - 1, 5, 1, "S")
    # cabeça
    c.head("front", cx - 7 + tilt, shy - 13, blink=blink)
    return c.finish()


def seated_frame(kind="type", i=0, blink=False):
    """Sentado, de perfil, na cadeira. Quadril em (26, 48); joelho à frente; pés no chão."""
    c = Cell()
    hip = (26, 48)
    lean = 8
    sh = (hip[0] + math.sin(math.radians(lean)) * 17, hip[1] - math.cos(math.radians(lean)) * 17)
    near_ankle, far_ankle = (36, 58), (33, 58)
    head, hdx, hdy = "prof", 0, 0
    near_hand, far_hand = None, None
    extras = None
    key_a, key_b = (45, 38 - (i % 2)), (43, 38 - ((i + 1) % 2))
    if kind == "type":
        near_hand, far_hand = (key_a if i % 2 == 0 else key_b), (key_b if i % 2 == 0 else key_a)
        if i % 4 >= 2:
            near_hand, far_hand = (46, 38), (44, 37)
        head = "prof"
    elif kind == "idle":
        near_hand, far_hand = (45, 38), (43, 38)
    elif kind == "lean":
        lean = 16
        sh = (hip[0] + math.sin(math.radians(lean)) * 17, hip[1] - math.cos(math.radians(lean)) * 17)
        near_hand, far_hand = (46, 38), (44, 38)
        hdx, hdy = 2, 1
    elif kind == "think":
        near_hand = (sh[0] + 9, sh[1] + 2 - (i % 2))
        far_hand = (43, 38)
        head = "prof"
        hdy = 0
    elif kind == "scratch":
        t = [0, 1, 2, 1][i % 4]
        far_hand = (sh[0] - 4 + t, sh[1] - 13 + (1 if t == 1 else 0))   # a mão aparece por cima da cabeça (braço de trás)
        near_hand = (44, 38)
    elif kind == "phone_reach":
        reach = [0.33, 0.66, 1.0][min(i, 2)]
        tgt = (39, 37)
        near_hand = (45 + (tgt[0] - 45) * reach, 38 + (tgt[1] - 38) * reach)
        far_hand = (43, 38)
        head = "down" if i >= 1 else "prof"
    elif kind == "phone_up":  # pega e traz o celular até o rosto
        t = [0.33, 0.7, 1.0][min(i, 2)]
        near_hand = (39 + (40 - 39) * t, 37 + (sh[1] + 5 - 37) * t)
        far_hand = (43, 38)
        head = "down"
        hdx = 1
    elif kind == "phone_look":
        near_hand = (41, sh[1] + 5)
        far_hand = (43, 38)
        head = "down"
        hdx = 1
    elif kind == "phone_tap":
        near_hand = (41, sh[1] + 5)
        far_hand = (40 + (i % 2) * 1, sh[1] + 7)
        head = "down"
        hdx = 1
    elif kind == "success":
        t = [0, 1, 2, 1][i % 4]
        near_hand = (sh[0] + 6, sh[1] - 12 - t)
        far_hand = (43, 38)
        lean = 2
        sh = (hip[0] + math.sin(math.radians(lean)) * 17, hip[1] - math.cos(math.radians(lean)) * 17)
        near_hand = (sh[0] + 6, sh[1] - 12 - t)
    elif kind == "sip":
        t = [0.5, 1.0, 1.0, 0.5][i % 4]
        near_hand = (45 + (sh[0] + 13 - 45) * t, 38 + (sh[1] + 1 - 38) * t)
        far_hand = (43, 38)
    if kind.startswith("phone") and near_hand:
        extras = lambda cc: draw_phone(cc, near_hand, ui=i)
    profile(c, hip, lean, head=head, hdx=hdx, hdy=hdy, near_hand=near_hand, far_hand=far_hand,
            near_ankle=near_ankle, far_ankle=far_ankle, blink=blink, leg_bend=-1, near_bend=-1, far_bend=-1, extras=extras)
    return c.finish()


def draw_phone(c, hand, lit=True, ui=0, held_up=True):
    """Celular na mão (sempre depois do braço)."""
    x, y = int(round(hand[0])), int(round(hand[1]))
    c.rect(x - 1, y - 6, 5, 8, "M")
    if lit:
        c.rect(x, y - 5, 3, 6, "N")
        c.put(x, y - 4 + (ui % 2), "n")
        c.put(x + 1, y - 2, "n")
        c.put(x + 2, y - 4 + ((ui + 1) % 2), "n")
        c.put(x + 1, y - 5, "w")
