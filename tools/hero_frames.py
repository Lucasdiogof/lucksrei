"""Frames do personagem v2: poses -> Cell. Ordem/nomes em ORDER (usado pelo gerador da cena)."""
import math
from hero_char import Cell, figure, arm, leg, hand, phone, ik, PANTS, FARPANTS, SLEEVE, FARSLEEVE, shoe

HIP_STAND = (32, 44)
ANK = 66                      # y do tornozelo
SEAT_HIP = (30, 53)
SCRATCH_BEND = -1
KB_Y = 39                     # y das mãos no teclado (célula)


def _sh(hip, lean):
    a = math.radians(lean)
    return (hip[0] + math.sin(a) * 20, hip[1] - math.cos(a) * 20)


def stand(blink=False, bob=0, head="34"):
    c = Cell()
    hip = (HIP_STAND[0], HIP_STAND[1] + bob)
    sh = _sh(hip, 0)
    figure(c, hip, 0, head=head, near_hand=(hip[0] + 1, hip[1] + 6), far_hand=(hip[0] - 3, hip[1] + 6),
           near_ankle=(hip[0] + 3, ANK), far_ankle=(hip[0] - 3, ANK), blink=blink, near_bend=-1, far_bend=-1)
    return c.finish()


def walk(i, n=8):
    ph = 2 * math.pi * i / n
    c = Cell()
    hip = (HIP_STAND[0], HIP_STAND[1] + 1 - round(1.5 * abs(math.sin(ph))))
    sh = _sh(hip, 3)

    def foot(p):
        return (hip[0] + 9 * math.cos(p) + 2, ANK - 4 * max(0.0, -math.sin(p)))

    nh = (sh[0] - 7 * math.cos(ph) + 1, sh[1] + 16 - 1.5 * abs(math.sin(ph)))
    fh = (sh[0] + 7 * math.cos(ph) + 1, sh[1] + 16 - 1.5 * abs(math.sin(ph)))
    figure(c, hip, 3, head="34", near_hand=nh, far_hand=fh, near_ankle=foot(ph), far_ankle=foot(ph + math.pi),
           near_bend=-1, far_bend=-1, leg_bend=1)
    return c.finish()


def front(thumb=0, blink=False, bob=0):
    """De frente: joinha com o braço esquerdo do espectador (como no avatar)."""
    c = Cell()
    cx, hipy = 32, 44 + bob
    shy = hipy - 20
    # pernas
    for dx in (-4, 4):
        c.capsule((cx + dx, hipy + 2), (cx + dx, ANK - 2), 6.4, ("p", "P", "Q"))
        shoe(c, (cx + dx - 2, ANK))
    # braço de baixo
    c.capsule((cx + 9, shy + 3), (cx + 11, shy + 13), 6.0, ("T", "D", "D"))
    c.capsule((cx + 11, shy + 13), (cx + 10, shy + 19), 5.4, ("T", "D", "D"))
    c.disc(cx + 10, shy + 21, 2.4, "S", halo=True)
    # tronco de frente
    c.poly([(cx - 10, shy - 1), (cx + 10, shy - 1), (cx + 11, hipy + 3), (cx - 11, hipy + 3)], "o")
    c.poly([(cx - 9, shy), (cx + 9, shy), (cx + 10, hipy + 2), (cx - 10, hipy + 2)], "T")
    c.poly([(cx - 9, shy), (cx - 6, shy), (cx - 7, hipy + 2), (cx - 10, hipy + 2)], "D")
    c.poly([(cx + 6, shy + 2), (cx + 9, shy + 2), (cx + 10, hipy + 2), (cx + 7, hipy + 2)], "L")
    c.rect(cx - 10, hipy - 1, 21, 3, "D")                       # barra
    c.rect(cx - 5, hipy - 9, 11, 1, "D")                        # bolso
    c.rect(cx - 3, shy - 2, 7, 5, "D")                          # gola do capuz
    c.rect(cx - 4, shy + 2, 1, 8, "c"); c.rect(cx + 4, shy + 2, 1, 8, "c")   # cordões
    c.rect(cx - 1, shy - 3, 3, 3, "S")                          # pescoço
    # braço do joinha (lado esquerdo do espectador)
    sh = (cx - 9, shy + 3)
    el = (cx - 16, shy + 11 + thumb)
    hd = (cx - 15, shy + 2 + thumb)
    c.capsule(sh, el, 6.0, ("L", "T", "D"))
    c.capsule(el, hd, 5.6, ("L", "T", "D"))
    c.disc(hd[0], hd[1] + 2.4, 2.4, "D")
    # punho + polegar
    c.rect(int(hd[0]) - 3, int(hd[1]) - 5, 7, 6, "o")
    c.rect(int(hd[0]) - 2, int(hd[1]) - 4, 5, 5, "s")
    c.rect(int(hd[0]) - 2, int(hd[1]) - 9, 2, 6, "o"); c.rect(int(hd[0]) - 1, int(hd[1]) - 9, 2, 6, "s")   # polegar
    c.rect(int(hd[0]) - 2, int(hd[1]) - 1, 5, 1, "S")
    c.head("front", cx - 8, shy - 18, blink=blink)
    return c.finish()


# ------------------------------------------------------------- sentado
def sit(i):
    c = Cell()
    hips = [(32, 45), (31, 48), (30, 51), (30, 53)]
    leans = [5, 9, 11, 8]
    near = [(36, ANK), (38, ANK), (41, ANK), (43, ANK)]
    far = [(32, ANK), (34, ANK), (37, ANK), (40, ANK)]
    hip, lean = hips[i], leans[i]
    sh = _sh(hip, lean)
    hands = [((sh[0] + 9, sh[1] + 12), (sh[0] + 4, sh[1] + 12)), ((sh[0] + 12, sh[1] + 10), (sh[0] + 7, sh[1] + 11)),
             ((sh[0] + 15, sh[1] + 7), (sh[0] + 10, sh[1] + 8)), ((50, KB_Y), (47, KB_Y))]
    figure(c, hip, lean, head="34", near_hand=hands[i][0], far_hand=hands[i][1], near_ankle=near[i], far_ankle=far[i],
           leg_bend=-1, near_bend=1, far_bend=1, near_kind="keys" if i == 3 else "open", far_kind="keys" if i == 3 else "open")
    return c.finish()


def seated(kind="type", i=0, blink=False):
    c = Cell()
    hip = SEAT_HIP
    lean = 8
    head, hdx, hdy = "34", 0, 0
    near_hand = far_hand = None
    near_kind = far_kind = "keys"
    near_bend, far_bend = 1, 1
    sh = _sh(hip, lean)
    extras = None
    if kind == "type":
        seq = [((50, KB_Y), (47, KB_Y - 1)), ((49, KB_Y - 1), (48, KB_Y)), ((51, KB_Y), (46, KB_Y)), ((49, KB_Y), (48, KB_Y - 1)),
               ((50, KB_Y - 1), (47, KB_Y)), ((48, KB_Y), (49, KB_Y))]
        near_hand, far_hand = seq[i % len(seq)]
        hdy = 1 if i % 3 == 2 else 0
    elif kind == "idle":
        near_hand, far_hand = (50, KB_Y), (47, KB_Y)
        hdy = [0, 0, 1][i % 3]
        lean = [8, 9, 8][i % 3]
        sh = _sh(hip, lean)
    elif kind == "lean":
        lean = 15 + i
        sh = _sh(hip, lean)
        near_hand, far_hand = (52, KB_Y), (49, KB_Y)
        hdx, hdy = 2, 1
    elif kind == "think":
        head = "34u"
        near_hand = (sh[0] + 5, sh[1] - 4 + (i % 2) * 1)
        near_kind = "fist"
        near_bend = 1
        far_hand = (47, KB_Y)
        lean = 6
        sh = _sh(hip, lean)
        near_hand = (sh[0] + 7, sh[1] - 1 + (i % 2))
    elif kind == "scratch":
        t = [0, 1, 2, 1][i % 4]
        far_hand = (sh[0] - 9 + t * 0.5, sh[1] - 12 - (1 if t == 1 else 0))   # coça a nuca: braço de trás, cotovelo para cima/atrás
        far_kind = "open"
        far_bend = SCRATCH_BEND
        near_hand = (49, KB_Y)
        head = "34"
    elif kind == "phone_reach":
        r = [0.35, 0.7, 1.0][min(i, 2)]
        near_hand = (50 + (41 - 50) * r, KB_Y + (40 - KB_Y) * r)
        near_kind = "grip" if i == 2 else "open"
        far_hand = (47, KB_Y)
        head = "34d" if i >= 1 else "34"
    elif kind == "phone_up":
        t = [0.4, 0.75, 1.0][min(i, 2)]
        tx, ty = sh[0] + 14, sh[1] + 8
        near_hand = (41 + (tx - 41) * t, 40 + (ty - 40) * t)
        near_kind = "grip"
        far_hand = (47, KB_Y)
        head = "34d"
        hdx = 1
        extras = lambda cc, nh=near_hand: phone(cc, (nh[0] + 1, nh[1] - 1), ui=0)
    elif kind == "phone_look":
        near_hand = (sh[0] + 14, sh[1] + 8)
        near_kind = "grip"
        far_hand = (47, KB_Y)
        head = "34d"
        hdx = 1
        extras = lambda cc, nh=near_hand, ui=i: phone(cc, (nh[0] + 1, nh[1] - 1), ui=ui)
    elif kind == "phone_tap":
        near_hand = (sh[0] + 14, sh[1] + 8)
        near_kind = "grip"
        far_hand = (sh[0] + 13 + (i % 2), sh[1] + 11)
        far_kind = "open"
        far_bend = -1
        head = "34d"
        hdx = 1
        extras = lambda cc, nh=near_hand, ui=i: phone(cc, (nh[0] + 1, nh[1] - 1), ui=ui)
    elif kind == "success":
        t = [0, 2, 3, 2][i % 4]
        lean = 4
        sh = _sh(hip, lean)
        near_hand = (sh[0] + 12, sh[1] - 9 - t)          # soquinho no ar, para a frente (não cobre o rosto)
        near_kind = "fist"
        near_bend = 1
        far_hand = (47, KB_Y)
        head = "34"
    figure(c, hip, lean, head=head, hdx=hdx, hdy=hdy, near_hand=near_hand, far_hand=far_hand,
           near_ankle=(43, ANK), far_ankle=(40, ANK), leg_bend=-1, near_bend=near_bend, far_bend=far_bend,
           near_kind=near_kind, far_kind=far_kind, blink=blink, extras=extras)
    return c.finish()


ORDER = []


def add(name, cells):
    ORDER.append((name, cells))


add("front_idle", [front(), front(bob=1), front(blink=True)])
add("front_thumb", [front(thumb=0), front(thumb=-1), front(thumb=0, blink=True), front(thumb=-2)])
add("stand", [stand(), stand(blink=True)])
add("walk", [walk(i) for i in range(8)])
add("sit", [sit(i) for i in range(4)])
add("type", [seated("type", i) for i in range(6)])
add("seat_idle", [seated("idle", i) for i in range(3)] + [seated("idle", 0, blink=True)])
add("lean", [seated("lean", 0), seated("lean", 1)])
add("think", [seated("think", 0), seated("think", 1)])
add("scratch", [seated("scratch", i) for i in range(4)])
add("phone_reach", [seated("phone_reach", i) for i in range(3)])
add("phone_up", [seated("phone_up", i) for i in range(3)])
add("phone_look", [seated("phone_look", 0), seated("phone_look", 1)])
add("phone_tap", [seated("phone_tap", i) for i in range(2)])
add("success", [seated("success", i) for i in range(4)])
