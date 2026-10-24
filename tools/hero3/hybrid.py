"""Hero v3 HÍBRIDO — a arte da v2 como base; o rig/geometria só posiciona os quadros intermediários.

- Quadros-chave = sprites da v2 LITERAIS (mesmo código que gera assets/img/hero/sprites.png): de frente
  (tools/hero_frames.front), perfil parado e caminhada de perfil (tools/hero_side).
- Intermediários do giro (22,5°, 45°, 67,5°) desenhados com as MESMAS primitivas da v2 (hero_char.Cell: cápsulas com os
  tons da manga/calça, mãos e tênis da v2, contorno e realce do finish()): tronco com largura de elipse entre o
  tronco de frente e o de perfil da v2, bolso/cordões/gola/barra deslizando com o giro, braços e pernas com o lado
  variando por cos e a profundidade por sen; cabeças da série desenhada à mão (tools/hero3/v2art.py), com a cabeça
  um passo à frente do corpo no giro.
Prova de conceito: parado de frente → gira para o perfil → perfil → anda de perfil → volta para a frente.
Uso: python3 tools/hero3/hybrid.py   (gera tools/hero3/qa/poc.png + poc.json para qa/perfil.html?mode=poc)
"""
import json
import math
import os
import sys

import numpy as np
from PIL import Image

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
sys.path.insert(0, os.path.dirname(HERE))
import hero_char as hc  # noqa: E402
import hero_frames as hf  # noqa: E402
import hero_side as hs  # noqa: E402
import v2art  # noqa: E402

CX, SHY, HIPY = 32, 24, 44          # mesmos números da v2 de frente (hero_frames.front: cx=32, hipy=44, shy=hipy-20)


def lerp(a, b, t):
    return a + (b - a) * t


# ---------------------------------------------------------------- tronco: linhas (x esq., x dir.) da frente e do perfil
def _front_rows():
    """Linhas do moletom de frente da v2 (torso_front com cx=32, shy=24, hipy=44)."""
    rows = {}
    for y in range(SHY - 1, HIPY + 3):
        if y == SHY - 1:
            rows[y] = (CX - 6, CX + 5)
        elif y == SHY:
            rows[y] = (CX - 7, CX + 6)
        elif y == SHY + 1:
            rows[y] = (CX - 8, CX + 7)
        else:
            rows[y] = (CX - 9, CX + 8)
    return rows


def _side_rows():
    """Linhas do moletom de perfil da v2 (hero_side.TORSO, ombros em shy=24)."""
    return {SHY + ry: (xb, xf) for ry, xb, xf in hs.TORSO}


FR, SR = _front_rows(), _side_rows()


def torso_rows(a):
    """Largura de elipse entre a frente (largura) e o perfil (profundidade): sem “caixa” mais larga no 3/4."""
    c, s = abs(math.cos(math.radians(a))), abs(math.sin(math.radians(a)))
    rows = {}
    for y in sorted(set(FR) | set(SR)):
        if y in FR and y in SR:
            (fl, fr), (sb, sf) = FR[y], SR[y]
            hf_, cf = (fr - fl) / 2, (fl + fr) / 2
            hs_, cs = (sf - sb) / 2, (sb + sf) / 2
            half = math.sqrt((hf_ * c) ** 2 + (hs_ * s) ** 2)
            cen = CX + (cf - CX) * c + (cs - CX) * s
            rows[y] = (int(round(cen - half)), int(round(cen + half)))
        elif y in SR and s > 0.55:
            rows[y] = SR[y]
        elif y in FR and c > 0.55:
            rows[y] = FR[y]
    return rows


def torso_mid(cell, a):
    s = math.sin(math.radians(a))
    w = 1 - math.cos(math.radians(a))
    rows = torso_rows(a)
    top = min(rows)
    dw, lw = max(1, round(lerp(3, 1, s))), max(1, round(lerp(3, 1, s)))
    for y, (xl, xr) in rows.items():
        for x in range(xl, xr + 1):
            k = "T"
            if y - top <= 1 and s > 0.5:
                k = "L"                                          # luz de cima no ombro (perfil)
            elif x < xl + dw and y > top + 2:
                k = "D"
            elif x > xr - lw and y > top + 3:
                k = "L"
            cell.put(x, y, k)
    # barra canelada (2 linhas) — de frente em 44/45, de perfil em 45/46
    hy = HIPY + (1 if w > 0.5 else 0)
    for yy in (hy, hy + 1):
        if yy in rows:
            for x in range(rows[yy][0], rows[yy][1] + 1):
                cell.put(x, yy, "D")
    # bolso canguru: frente (28..36, topo 36) → perfil (34..37, topo 37)
    pl, pr, pt = round(lerp(28, 34, w)), round(lerp(36, 37, w)), round(lerp(36, 37, w))
    for x in range(pl, pr + 1):
        cell.put(x, pt, "D")
    for y in range(pt, pt + 6):
        cell.put(pl, y, "D")
        if w < 0.5:
            cell.put(pr, y, "D")
    # cordões: dois de frente (30 e 34) → um de perfil (36)
    x1, x2 = round(lerp(30, 35, w)), round(lerp(34, 36, w))
    for y in range(SHY + 1, SHY + 7 + (1 if w < 0.5 else 0)):
        if w < 0.6:
            cell.put(x1, y, "c")
        cell.put(x2, y, "c")
    # gola: capuz dobrado em volta do pescoço (frente, 3 linhas) → gola fina + dobra na nuca (perfil)
    gl, gr = round(lerp(27, 32, w)), round(lerp(37, 34, w))
    for y in range(SHY - 2, SHY + 1 if w < 0.5 else SHY - 1):
        for x in range(gl, gr + 1):
            cell.put(x, y, "L" if (y == SHY - 2 and w < 0.5 and gl < x < gr) else "D")
    if w >= 0.4:
        for p in ((28, SHY), (29, SHY), (27, SHY + 1), (28, SHY + 1)):
            cell.put(p[0], p[1], "D")


# ---------------------------------------------------------------- braços, pernas, pescoço (primitivas da v2)
def arm_mid(cell, a, near):
    """Braço solto ao lado do corpo: posição lateral ∝ cos, profundidade ∝ sen (de frente: hero_frames.front; de perfil:
    hero_side.arm). Mesmos tons da v2: perto = manga com luz, longe = manga na sombra."""
    c, s = math.cos(math.radians(a)), math.sin(math.radians(a))
    w = 1 - c
    side = -1 if near else 1                                    # girando para a direita, o braço da esquerda vem para perto
    # o braço de perto varre para o meio do tronco (onde a v2 o desenha de perfil) conforme sen(a): chega ao perfil sem
    # salto; o de longe some atrás do tronco
    if near:
        sh = (lerp(CX + side * 9, CX - 1, s), lerp(SHY + 3, SHY + 2, w))
        el = (lerp(CX + side * 11, CX - 1.6, s), lerp(SHY + 13, SHY + 11.5, w))
        hd = (lerp(CX + side * 10, CX - 0.4, s), lerp(SHY + 19, SHY + 18.5, w))
    else:                                                       # o de longe gira de verdade (cos) e sai de vista aos poucos
        sh = (CX + 9 * c - 1 * s, lerp(SHY + 3, SHY + 2, w))
        el = (CX + 11 * c - 1.6 * s, lerp(SHY + 13, SHY + 11.5, w))
        hd = (CX + 10 * c - 0.4 * s, lerp(SHY + 19, SHY + 18.5, w))
    tones = ("L", "T", "D") if near else ("T", "D", "D")
    cell.capsule(sh, el, lerp(5.6, 4.8, w), tones)
    cell.capsule(el, hd, lerp(5.0, 4.2, w), tones)
    skin = "s" if near else "S"
    if w < 0.5:
        cell.disc(hd[0], hd[1] + 2, 2.3, skin, halo=True)
    else:                                                       # mão da v2 de perfil (bloco 3×3 com punho)
        hx, hy = int(round(hd[0])), int(round(hd[1]))
        for x in range(hx - 1, hx + 2):
            cell.put(x, hy - 1, "D")
        shape = [(hx + x, hy + y) for y in range(3) for x in range(-1, 2)]
        for (x, y) in shape:
            for ddx, ddy in ((1, 0), (-1, 0), (0, 1), (0, -1)):
                if (x + ddx, y + ddy) not in shape:
                    cell.put(x + ddx, y + ddy, "o")
        for (x, y) in shape:
            cell.put(x, y, skin)


def legs_mid(cell, a):
    c, s = math.cos(math.radians(a)), math.sin(math.radians(a))
    w = 1 - c
    for near in (False, True):
        side = -1 if near else 1
        hip = (CX + side * 4 * c, HIPY + 2)
        ank = (CX + side * 4 * c + (2 if near else -2) * s, hf.ANK - 2)
        tones = ("p", "P", "Q") if near or w < 0.3 else ("P", "Q", "Q")
        cell.capsule(hip, ank, lerp(6.4, 5.4, w), tones)
        if w < 0.55:
            hc.shoe(cell, (ank[0] - 2, hf.ANK))
        else:
            hs.shoe(cell, int(round(ank[0])), hs.shoe_ankle_y("flat"), "flat")


def neck_mid(cell, a):
    w = 1 - math.cos(math.radians(a))
    x0, y0 = round(lerp(31, 29, w)), round(lerp(21, 17, w))
    for y in range(y0, SHY):
        for x in range(x0, 34):
            cell.put(x, y, "S" if (w > 0.4 and x < 32) or (w <= 0.4) else "s")


def turn_frame(a, head_angle=None, closed=False):
    """Quadro intermediário do giro no ângulo a (graus, para a direita), com a cabeça no ângulo head_angle."""
    cell = hc.Cell()
    arm_mid(cell, a, near=False)
    legs_mid(cell, a)
    torso_mid(cell, a)
    neck_mid(cell, a)
    ha = a if head_angle is None else head_angle
    rows = v2art.head_for(ha, closed)
    hx = 24 if abs(ha) < 30 else 25
    for ry, row in enumerate(rows):
        for rx, ch in enumerate(row):
            if ch != ".":
                cell.put(hx + rx, 6 + ry, v2art.PAL[ch])
    arm_mid(cell, a, near=True)
    return cell.finish().image()


# ---------------------------------------------------------------- prova de conceito: trilhas a 12 tiques/s
def v2_frames():
    """Quadros literais da v2 (o mesmo código de sprites.png)."""
    F = {"front": [hf.front(), hf.front(bob=1), hf.front(blink=True)], "turn": [hf.sit_frame((32, 44), hf.SIDES, head="34")[0]],
         "stand": hs.stand_frames(), "walk": hs.walk_frames()}
    return {k: [c.image() for c in v] for k, v in F.items()}


def build():
    V2 = v2_frames()
    imgs, tracks = [], {"v2": [], "hib": [], "v3": []}

    def add(im):
        imgs.append(im)
        return len(imgs) - 1

    fi = [add(im) for im in V2["front"]]
    turn_v2 = add(V2["turn"][0])
    st = [add(im) for im in V2["stand"]]
    wk = [add(im) for im in V2["walk"]]
    # intermediários híbridos: corpo em a, cabeça um passo à frente (vai) ou atrás (volta)
    go = [add(turn_frame(22.5, 45)), add(turn_frame(45, 67.5)), add(turn_frame(67.5, 90))]
    back = [add(turn_frame(67.5, 45)), add(turn_frame(45, 22.5)), add(turn_frame(22.5, 0))]
    X, Y = 8, 140                                  # anda da esquerda até ~x 80, antes da mesa

    def idle(tr, ticks, x):
        for i in range(ticks):
            f = fi[2] if (i % 30) in (20, 21) else (fi[1] if (i // 6) % 4 == 2 else fi[0])
            tr.append([f, x, Y])

    def walk(tr, x0, cycles):
        x = x0
        pattern = [1, 1, 1, 1, 2]                     # 10 quadros/s em 12 tiques/s (a v2 anda a 10 q/s, 3 px/quadro)
        n = 0
        for c in range(cycles):
            for i in range(8):
                for _ in range(pattern[n % 5]):
                    tr.append([wk[i], x, Y])
                n += 1
                x += hs.__dict__.get("STEP", 3) if hasattr(hs, "STEP") else 3
        return x

    for name in ("v2", "hib"):
        tr = tracks[name]
        idle(tr, 24, X)
        if name == "v2":                               # v2: 1 quadro de giro
            tr += [[turn_v2, X, Y]] * 3
        else:
            for f in go:
                tr += [[f, X, Y]] * 2
        tr += [[st[0], X, Y]] * 8
        x = walk(tr, X, 3)
        tr += [[st[0], x, Y]] * 8
        if name == "v2":
            tr += [[turn_v2, x, Y]] * 3
        else:
            for f in back:
                tr += [[f, x, Y]] * 2
        idle(tr, 24, x)
    # v3 atual (rig puro), mesma coreografia: parado de frente → giro → perfil → anda → volta
    import anims
    import poses as po
    S = anims.idle_frames(24, theta=0.0)
    for sp in S:
        sp.fix = (X, Y)
    S += anims.turn_frames([22.5, 45, 67.5, 90], holds=[2, 2, 2, 2])
    S += [anims.Spec(po.stand(), 90, mode="pelvis", hold=8)]
    S.append(anims.start_frame(90))
    S += anims.walk_frames(90, 0.875, 29) + anims.stop_frames(90)
    S += anims.turn_frames([67.5, 45, 22.5, 0], holds=[2, 2, 2, 2])
    S += anims.idle_frames(24, theta=0.0)
    for sp in S[-24:]:
        sp.mode = "pelvis"
    fr3, k3 = [], {}
    t3 = anims.build_track(S, (X, Y), fr3, k3)
    base_idx = {}
    for rec in t3:
        if rec[0] not in base_idx:
            base_idx[rec[0]] = add(Image.fromarray(fr3[rec[0]][0]))
    tracks["v3"] = [[base_idx[r[0]], r[1], r[2]] for r in t3]
    # atlas simples em grade de 72×72
    cols = 10
    rows_ = (len(imgs) + cols - 1) // cols
    atlas = Image.new("RGBA", (cols * 72, rows_ * 72), (0, 0, 0, 0))
    for i, im in enumerate(imgs):
        atlas.alpha_composite(im, ((i % cols) * 72, (i // cols) * 72))
    os.makedirs(os.path.join(HERE, "qa"), exist_ok=True)
    atlas.save(os.path.join(HERE, "qa", "poc.png"))
    json.dump({"cols": cols, "tick": 12, "tracks": tracks}, open(os.path.join(HERE, "qa", "poc.json"), "w"))
    return imgs, tracks, go, back


if __name__ == "__main__":
    imgs, tracks, go, back = build()
    print("ok", len(imgs), "quadros;", {k: len(v) for k, v in tracks.items()}, "tiques")
