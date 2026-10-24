"""Hero v3 híbrido — todos os quadros do personagem com a ARTE DA V2.

Regra: quando a v2 tem o quadro, ele é usado LITERALMENTE (mesmo código de assets/img/hero/sprites.png): de frente,
perfil parado, caminhada de perfil, sentar, levantar e as poses sentado da v2. O que a v2 não tinha (intermediários do
giro, começar/parar de andar, andar de costas, puxar a cadeira, ações novas sentado) é desenhado com as MESMAS
primitivas da v2 (hero_char.Cell: cápsulas nos tons da manga/calça, mãos e tênis da v2, contorno e realce do finish())
e as cabeças da série desenhada à mão (v2art.py). O rig (tools/hero3/poses.py) só serviu para validar alcances e
trajetórias: as posições finais dos braços sentado partem das poses da v2.

Cada função devolve (base, over): imagens RGBA 72×72 com os pés em (32, 68); `over` = braços/caneca por cima da mesa.
Ângulo a: 0 de frente, 90 perfil à direita, 180 de costas; negativos = espelho (como a v2 faz no andar para a esquerda).
"""
import math
import os
import sys

from PIL import Image

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
sys.path.insert(0, os.path.dirname(HERE))
import hero_char as hc  # noqa: E402
import hero_frames as hf  # noqa: E402
import hero_side as hs  # noqa: E402
import hybrid as hy  # noqa: E402
import v2art  # noqa: E402

CX, SHY, HIPY = hy.CX, hy.SHY, hy.HIPY
EMPTY = None


def lerp(a, b, t):
    return a + (b - a) * t


def img(cell):
    return cell.image()


def mirror(im):
    """Espelho mantendo a âncora dos pés em x=32 (o mesmo que a v2 faz para walk_l/stand_l/turn_l)."""
    if im is None:
        return None
    m = im.transpose(Image.FLIP_LEFT_RIGHT)
    out = Image.new("RGBA", m.size, (0, 0, 0, 0))
    out.alpha_composite(m, (-(hc.CW - 1 - 2 * hc.FX), 0))
    return out


# ================================================================ v2 literal
def v2_front(bob=0, blink=False):
    return img(hf.front(bob=bob, blink=blink)), None


def v2_stand(blink=False):
    return img(hs.side(0, stand=True, blink=blink)), None


def v2_walk(i):
    return img(hs.side(i % 8)), None


def v2_sit(i):
    b, o = hf.path_frames(hf.SIT_PATH)[i]
    return img(b), (img(o) if o is not None else None)


def v2_standup(i):
    b, o = hf.path_frames(hf.STAND_PATH)[i]
    return img(b), (img(o) if o is not None else None)


# ================================================================ corpo em qualquer ângulo (giro, costas)
def _torso_any(cell, a):
    """Moletom no ângulo a ∈ [0, 180]: frente da v2 → perfil da v2 → costas (mesma silhueta da frente)."""
    c, s = math.cos(math.radians(a)), math.sin(math.radians(a))
    ac = abs(c)
    rows = hy.torso_rows(a if a <= 90 else 180 - a)
    w = 1 - ac
    top = min(rows)
    dw, lw = max(1, round(lerp(3, 1, s))), max(1, round(lerp(3, 1, s)))
    for y, (xl, xr) in rows.items():
        for x in range(xl, xr + 1):
            k = "T"
            if y - top <= 1 and s > 0.5:
                k = "L"
            elif x < xl + dw and y > top + 2:
                k = "D"
            elif x > xr - lw and y > top + 3:
                k = "L"
            cell.put(x, y, k)
    hy_ = HIPY + (1 if w > 0.5 else 0)
    for yy in (hy_, hy_ + 1):
        if yy in rows:
            for x in range(rows[yy][0], rows[yy][1] + 1):
                cell.put(x, yy, "D")
    if a <= 95:                                       # frente/lado: bolso, cordões, gola (como hy.torso_mid)
        pl, pr, pt = round(lerp(28, 34, w)), round(lerp(36, 37, w)), round(lerp(36, 37, w))
        for x in range(pl, pr + 1):
            cell.put(x, pt, "D")
        for y in range(pt, pt + 6):
            cell.put(pl, y, "D")
            if w < 0.5:
                cell.put(pr, y, "D")
        x1, x2 = round(lerp(30, 35, w)), round(lerp(34, 36, w))
        for y in range(SHY + 1, SHY + 7 + (1 if w < 0.5 else 0)):
            if w < 0.6:
                cell.put(x1, y, "c")
            cell.put(x2, y, "c")
        gl, gr = round(lerp(27, 32, w)), round(lerp(37, 34, w))
        for y in range(SHY - 2, SHY + 1 if w < 0.5 else SHY - 1):
            for x in range(gl, gr + 1):
                cell.put(x, y, "L" if (y == SHY - 2 and w < 0.5 and gl < x < gr) else "D")
        if w >= 0.4:
            for p in ((28, SHY), (29, SHY), (27, SHY + 1), (28, SHY + 1)):
                cell.put(p[0], p[1], "D")
    else:                                            # costas: capuz caído nas costas (forma arredondada, mais escura)
        cxh = round(lerp(29, CX, ac))
        half0 = lerp(3, 5, ac)
        for i, y in enumerate(range(SHY - 1, SHY + 6)):
            hw = half0 - max(0, i - 2) * 0.9
            for x in range(round(cxh - hw), round(cxh + hw) + 1):
                cell.put(x, y, "L" if i == 0 else ("D" if (i == 5 or x in (round(cxh - hw), round(cxh + hw))) else "T"))


def _arm_any(cell, a, near, swing=0.0, hand_kind=None):
    """Braço solto ao lado do corpo em qualquer ângulo; swing (px) leva a mão para a frente/trás do movimento."""
    c, s = math.cos(math.radians(a)), math.sin(math.radians(a))
    w = 1 - abs(c)
    if near:
        if a <= 90:
            fx = lambda f, p: lerp(CX - f, CX - p, s)      # noqa: E731
        else:
            fx = lambda f, p: lerp(CX + f, CX - p, s)      # noqa: E731
        sh = (fx(9, 1), lerp(SHY + 3, SHY + 2, w))
        el = (fx(11, 1.6), lerp(SHY + 13, SHY + 11.5, w))
        hd = (fx(10, 0.4) + swing, lerp(SHY + 19, SHY + 18.5, w) - abs(swing) * 0.2)
    else:
        sh = (CX + 9 * c - 1 * s, lerp(SHY + 3, SHY + 2, w))
        el = (CX + 11 * c - 1.6 * s, lerp(SHY + 13, SHY + 11.5, w))
        hd = (CX + 10 * c - 0.4 * s - swing, lerp(SHY + 19, SHY + 18.5, w) - abs(swing) * 0.2)
    tones = ("L", "T", "D") if near else ("T", "D", "D")
    cell.capsule(sh, el, lerp(5.6, 4.8, w), tones)
    cell.capsule(el, hd, lerp(5.0, 4.2, w), tones)
    skin = "s" if near else "S"
    if w < 0.5:
        cell.disc(hd[0], hd[1] + 2, 2.3, skin, halo=True)
    else:
        hx, hy_ = int(round(hd[0])), int(round(hd[1]))
        for x in range(hx - 1, hx + 2):
            cell.put(x, hy_ - 1, "D")
        shape = [(hx + x, hy_ + y) for y in range(3) for x in range(-1, 2)]
        for (x, y) in shape:
            for ddx, ddy in ((1, 0), (-1, 0), (0, 1), (0, -1)):
                if (x + ddx, y + ddy) not in shape:
                    cell.put(x + ddx, y + ddy, "o")
        for (x, y) in shape:
            cell.put(x, y, skin)


def _shoe_back(cell, ankle):
    """Tênis visto de trás (calcanhar): o tênis de frente da v2 sem o realce da ponta."""
    hc.shoe(cell, ankle)
    x, y = int(round(ankle[0])), int(round(ankle[1]))
    cell.put(x + 3, y, "F")


def _legs_any(cell, a, legs=None):
    """Pernas paradas no ângulo a, ou `legs` = [(ankle_x, ankle_y, near), ...] dados (andar de costas)."""
    c, s = math.cos(math.radians(a)), math.sin(math.radians(a))
    w = 1 - abs(c)
    back = a > 95
    if legs is None:
        legs = []
        for near in (False, True):
            side = -1 if near else 1
            ax = CX + side * 4 * c + (2 if near else -2) * s
            legs.append((ax, hf.ANK - 2, near))
    # de trás para a frente: o pé mais ao fundo (mais alto na tela) primeiro
    for ax, ay, near in sorted(legs, key=lambda l: l[1]):
        side = -1 if near else 1
        hip = (CX + side * 4 * c, HIPY + 2)
        tones = ("p", "P", "Q") if near or w < 0.3 else ("P", "Q", "Q")
        # vista de trás/3/4 de trás: a perna fica reta (o joelho dobra para longe da câmera); o pé só sobe
        cell.capsule(hip, (ax, ay), lerp(6.4, 5.4, w) if not back else 5.8, tones)
        if back:
            _shoe_back(cell, (ax - 2, ay + 2))
        elif w < 0.55:
            hc.shoe(cell, (ax - 2, ay + 2))
        else:
            hs.shoe(cell, int(round(ax)), int(round(ay)) + 2 - (len(hs.SHOES["flat"]) - 1) + 2, "flat")


def _neck_any(cell, a):
    w = 1 - abs(math.cos(math.radians(a)))
    x0, y0 = round(lerp(31, 29, w)), round(lerp(21, 17, w))
    for y in range(y0, SHY):
        for x in range(x0, 34):
            cell.put(x, y, "S" if (w > 0.4 and x < 32) or (w <= 0.4) else "s")


def body(a, head_angle=None, look=None, closed=False, legs=None, swing=0.0, bob=0):
    """Quadro em pé no ângulo a ∈ [-180, 180] (negativo = espelho)."""
    neg = a < 0
    a = abs(a)
    ha = abs(a if head_angle is None else head_angle)
    cell = hc.Cell()
    _arm_any(cell, a, near=False, swing=swing)
    _legs_any(cell, a, legs)
    _torso_any(cell, a)
    _neck_any(cell, a)
    rows = v2art.head_for(ha, closed=closed, look=look)
    hx = 24 if ha < 30 or ha > 160 else 25
    for ry, row in enumerate(rows):
        for rx, ch in enumerate(row):
            if ch != ".":
                cell.put(hx + rx, 6 + ry + bob, v2art.PAL[ch])
    _arm_any(cell, a, near=True, swing=swing)
    im = cell.finish().image()
    if bob:
        im2 = Image.new("RGBA", im.size, (0, 0, 0, 0))     # o corpo desce junto com a cabeça (pés no lugar)
        top = im.crop((0, 0, 72, 60))
        im2.alpha_composite(im.crop((0, 60, 72, 72)), (0, 60))
        im2.alpha_composite(top, (0, bob))
        im = im2
    return (mirror(im) if neg else im), None


# ================================================================ andar: começar, parar, de costas
def side_pose(near, far, swing=0.0, bob=0, blink=False, arms=None):
    """Perfil da v2 com pernas/braços dados: near/far = (dx do tornozelo, tipo de tênis, altura do pé).
    arms = ((mão perto), (mão longe)) em coordenadas da célula para alcançar algo (puxar a cadeira)."""
    c = hc.Cell()
    hip = (hs.HIP[0], hs.HIP[1] + bob)
    shy = hip[1] - 22
    sh = (31, shy + 2)
    if arms:
        _reach_arm(c, (sh[0] - 0.5, sh[1]), arms[1], near=False)
    else:
        hs.arm(c, sh, -swing, near=False)
    for (dx, kind, lift), nr in ((far, False), (near, True)):
        ax = hip[0] + dx
        ay = hs.shoe_ankle_y(kind) - lift
        hs.leg(c, (hip[0] + (0 if nr else -1), hip[1]), (ax, ay), nr, support=lift == 0)
        hs.shoe(c, ax, ay, kind)
    hs.pelvis(c, hip)
    hs.torso(c, shy)
    for y in range(shy - 7, shy):
        for x in range(29, 34):
            c.put(x, y, "S" if x < 32 else "s")
    hs.head(c, hs.HEAD_X, shy - 18, blink=blink)
    if arms:
        _reach_arm(c, sh, arms[0], near=True)
    else:
        hs.arm(c, sh, swing, near=True)
    return img(c.finish()), None


def _reach_arm(c, sh, hand, near):
    """Braço de perfil da v2 (taper fino) estendido até `hand`, cotovelo por IK (dobra para baixo)."""
    el = hc.ik(sh, hand, 9.5, 9.0, 1)
    tones = ("L", "T", "D") if near else ("T", "D", "D")
    hs.taper(c, sh, el, 4.8, 4.2, tones)
    hs.taper(c, el, hand, 4.2, 3.8, tones)
    hx, hy_ = int(round(hand[0])), int(round(hand[1]))
    s = "s" if near else "S"
    shape = [(hx + x, hy_ + y) for y in range(-1, 2) for x in range(0, 3)]
    for (x, y) in shape:
        for ddx, ddy in ((1, 0), (-1, 0), (0, 1), (0, -1)):
            if (x + ddx, y + ddy) not in shape:
                c.put(x + ddx, y + ddy, "o")
    for (x, y) in shape:
        c.put(x, y, s)


# começar e parar (perfil, para a direita): (quadro, avanço em px do personagem desde o quadro anterior)
def walk_start():
    """Parado → 1º passo: o pé de perto sai do chão e vai à frente enquanto o de trás fica plantado; termina no
    contato do quadro 0 da v2. Avanços: +3 até o passo, +1 até o contato."""
    return [(side_pose(near=(4, "flat", 2), far=(-5, "heel_up", 0), swing=1.0), 3)]


def walk_stop():
    """A partir do quadro 4 da v2 (pé de longe toca à frente): o pé de trás vem junto num passo curto e o corpo
    assenta sobre os pés. Avanços: +3, +3, +2."""
    return [(side_pose(near=(0, "heel_up", 2), far=(3, "flat", 0), swing=0.8), 3),
            (side_pose(near=(2, "flat", 1), far=(0, "flat", 0), swing=0.3, bob=1), 3),
            (v2_stand(), 2)]


# andar de costas em 3/4 (135°, para o fundo-direita): ciclo de 8 quadros, pé de apoio parado na tela
BACK_STEP = (2.0, -1.667)                     # deslocamento do personagem por quadro (px na tela): 9 quadros = (18, -15)
_STANCE = [2, 1, 0, -1, -2]                    # múltiplos de BACK_STEP do tornozelo no apoio (5 quadros)
_SWING = [(-1.0, 1), (0.5, 2), (1.5, 1)]       # (múltiplo, altura) no balanço (3 quadros)


def back_walk(i, a=135.0):
    """Quadro i do andar de costas: tornozelos nas posições do ciclo (o de apoio recua exatamente BACK_STEP por
    quadro), braços em oposição, 1 px de queda no contato."""
    legs = []
    c = math.cos(math.radians(a))
    for near, ph in ((True, 0), (False, 4)):
        k = (i + ph) % 8
        m, lift = (_STANCE[k], 0) if k < 5 else _SWING[k - 5]
        lateral = (-1 if near else 1) * 4 * c
        ax = CX + lateral + m * BACK_STEP[0]
        ay = hf.ANK - 2 + m * BACK_STEP[1] - lift
        legs.append((ax, ay, near))
    near_k = i % 8
    swing = -1.2 * (_STANCE[near_k] if near_k < 5 else _SWING[near_k - 5][0])
    return body(a, legs=legs, swing=swing * 0.6, bob=1 if i % 4 == 0 else 0)


# ================================================================ sentado (v2 + braços corrigidos)
REST = hf.REST


def seated(L, R, head_rows=None, head="frontd", hdx=0, hdy=0, blink=False, mug=None, look=None, hip=hf.SEAT_HIP_CELL):
    """hf.seated da v2 com cabeça da série (head_rows) e olhar; L/R = (cotovelo, mão, tipo) em coordenadas da célula."""
    cx, hipy = hip
    shy = hipy - 20
    base = hc.Cell()
    fx = hf.FEET_CX
    for dx in (-4, 4):
        base.capsule((cx + dx, hipy + 1), (fx + dx + 1, hipy + 6), 6.6, ("p", "P", "Q"))
        base.capsule((fx + dx + 1, hipy + 6), (fx + dx, hf.ANK - 2), 5.6, ("p", "P", "Q"))
        hf.shoe(base, (fx + dx - 2, hf.ANK))
    hf.torso_front(base, cx, shy, hipy)
    if head_rows is None:
        base.head(head, cx - (8 if head in ("front", "frontd") else 7) + hdx, shy - 18 + hdy, blink=blink)
    else:
        rows = v2art.eyes(head_rows, look, blink)
        # a v2 desenha a cabeça de frente em cx−8 e a 3/4 em cx−7 (seated): mesma regra para a série
        x0 = cx - (7 if head_rows in (v2art.THREEQ, v2art.HEAD_67) else 8) + hdx
        for ry, row in enumerate(rows):
            for rx, ch in enumerate(row):
                if ch != ".":
                    base.put(x0 + rx, shy - 18 + hdy + ry, v2art.PAL[ch])
    over = hc.Cell()
    shL, shR = (cx - 9, shy + 3), (cx + 9, shy + 3)
    for cell in (base, over):
        hf.arm3(cell, shL, L[0], L[1], hf.ARM_SHADE, L[2])
        hf.arm3(cell, shR, R[0], R[1], hf.ARM_LIT, R[2])
        if mug:
            hf.mug(cell, *mug)
    return img(base.finish()), img(over)


def arm_mix(A, B, t):
    """Mistura dois braços (cotovelo, mão, tipo) — posições arredondadas ao pixel, tipo de B a partir da metade."""
    e = (lerp(A[0][0], B[0][0], t), lerp(A[0][1], B[0][1], t))
    h = (lerp(A[1][0], B[1][0], t), lerp(A[1][1], B[1][1], t))
    return ((round(e[0]), round(e[1])), (round(h[0]), round(h[1])), B[2] if t >= 0.5 else A[2])


def rest_arms():
    le, lh, re, rh = REST
    return (le, lh, "keys"), (re, rh, "keys")


def type_arms(i):
    le, lh, re, rh = hf.KEYS[i % 4]
    return (le, lh, "keys"), (re, rh, "keys")
