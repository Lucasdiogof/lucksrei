"""Hero v3 — biblioteca de poses do Lucas (em pé, andando, sentado e ações na mesa), todas sobre o mesmo esqueleto.

Coordenadas locais do personagem: pés na origem (ponto âncora da cena), y para cima, +z para a frente. Sentado, a
âncora é SLOT da v2 (pés diante da cadeira) e as alturas batem com a cena atual: quadril no assento (SEAT, 16 px
acima dos pés), ombros a ~34 px, mãos no teclado a ~17 px, caneca da mesa em (-17, 14) — os mesmos pontos usados pelos
sprites da v2 (tools/hero_frames.py), convertidos da célula para coordenadas locais.

Cada função devolve um dict de pose (rig.stand_pose() alterado). Nada aqui desenha: rig.render() faz isso.
"""
import math

import numpy as np

import rig


def ease(t):
    """Suave na entrada e na saída (smoothstep)."""
    t = min(max(t, 0.0), 1.0)
    return t * t * (3 - 2 * t)


def ease_out(t):
    t = min(max(t, 0.0), 1.0)
    return 1 - (1 - t) ** 2


def ease_in(t):
    t = min(max(t, 0.0), 1.0)
    return t * t


def lerp(a, b, t):
    return np.asarray(a, float) + (np.asarray(b, float) - np.asarray(a, float)) * t


def blend(A, B, t):
    """Mistura duas poses (juntas e parâmetros numéricos); flags vêm de A até a metade e de B depois."""
    out = {}
    for k, va in A.items():
        if k.startswith("_"):
            continue
        vb = B.get(k, va)
        if isinstance(va, np.ndarray):
            out[k] = lerp(va, vb, t)
        elif isinstance(va, (int, float)) and not isinstance(va, bool) and isinstance(vb, (int, float)):
            out[k] = va + (vb - va) * t
        elif isinstance(va, tuple) and isinstance(vb, tuple) and len(va) == len(vb) and all(isinstance(x, (int, float)) for x in va + vb):
            out[k] = tuple(x + (y - x) * t for x, y in zip(va, vb))
        else:
            out[k] = va if t < 0.5 else vb
    for k, vb in B.items():
        if not k.startswith("_"):
            out.setdefault(k, vb)
    return out


# ---------------------------------------------------------------- braços por IK (com perspectiva e limites)
POLE = {"l": np.array([-0.55, -0.35, -0.75]), "r": np.array([0.55, -0.35, -0.75])}   # cotovelo para fora/trás/baixo
SEAT_THETA = 6.0              # sentado: quase de frente, levemente virado para os monitores (o gerador usa o mesmo)
ARM_C = 0.4                   # perspectiva dos braços: 1 px para a frente = 0,4 px para baixo e para a direita na tela
ELBOW_MIN, ELBOW_MAX = 25.0, 165.0     # flexão do cotovelo (graus entre braço e antebraço): nunca travado reto
TORSO_CLEAR = 8.4 + 2.4                # o cotovelo fica fora do tronco (meia largura + manga)


def arm_shear_local(theta=SEAT_THETA, c=ARM_C):
    """Vetor (local) somado ao cotovelo/punho/caneca por px de profundidade à frente dos ombros.

    A cena é vista de cima/frente-esquerda: o tampo da mesa recua a 45° para cima-esquerda (make-hero-scene.py).
    O que está mais perto da câmera aparece mais abaixo e à direita — o teclado, à frente do Lucas, aparece mais baixo
    que a altura real das mãos. Sem isso, as mãos eram puxadas para baixo/para dentro até o ponto de tela do teclado:
    braço esticado, cotovelo dentro do peito. Com isso, o braço vai para a FRENTE e a tela mostra a mão no teclado.
    """
    th = math.radians(theta)
    e_view = np.array([c * math.cos(th), -c * math.cos(th), 0.0])
    return e_view @ rig.rot_y(theta)


def use_arm_perspective(P, k=1.0):
    P["arm_shear"] = arm_shear_local() * k
    P["arm_zref"] = float((P["sh_l"][2] + P["sh_r"][2]) / 2)
    return P


def visual_to_true(P, v):
    """Ponto desejado NA TELA (x, y) com profundidade real z → ponto 3D que, com a perspectiva dos braços, cai lá."""
    v = np.asarray(v, float)
    e = P.get("arm_shear")
    if e is None:
        return v
    return v - np.asarray(e) * (v[2] - P["arm_zref"])


def _elbow_angle(sh, el, wr):
    return math.degrees(math.acos(np.clip(np.dot(rig.norm(sh - el), rig.norm(wr - el)), -1, 1)))


def arm_to(P, side, hand, pole=None, visual=True):
    """Cotovelo e punho para a MÃO (centro da palma) chegar em `hand` — por padrão um alvo VISUAL (tela + profundidade).

    Limites: o cotovelo nunca entra no tronco (testa polos cada vez mais para fora/baixo) e o braço nunca trava reto
    (se o alvo estiver além do alcance, a mão para antes e a pose é marcada em P["_strain"] para o relatório de QA;
    quem chama deve aproximar o tronco do alvo, como uma pessoa faz).
    """
    sh = P["sh_" + side]
    tgt = visual_to_true(P, hand) if visual else np.asarray(hand, float)
    T = rig.torso_frame(P)
    out = -1.0 if side == "l" else 1.0
    base = POLE[side] if pole is None else np.asarray(pole, float)
    cands = [base] + [rig.norm(base + T[:, 0] * out * k - T[:, 1] * 0.3 * k) for k in (0.5, 1.0, 1.8, 3.0)]
    reach = rig.UARM + rig.FARM
    best = None
    for pv in cands:
        wr = tgt - rig.norm(tgt - sh) * 1.7
        for _ in range(3):                                   # a mão fica 1,7 px além do punho, na linha do antebraço
            d = wr - sh
            L = np.linalg.norm(d)
            # limite de extensão: no máximo ELBOW_MAX (distância ombro→punho correspondente)
            Lmax = math.sqrt(rig.UARM ** 2 + rig.FARM ** 2 - 2 * rig.UARM * rig.FARM * math.cos(math.radians(ELBOW_MAX)))
            Lmin = math.sqrt(rig.UARM ** 2 + rig.FARM ** 2 - 2 * rig.UARM * rig.FARM * math.cos(math.radians(ELBOW_MIN)))
            wr_c = sh + rig.norm(d) * min(max(L, Lmin), Lmax)
            el, wr2 = rig.two_bone(sh, wr_c, rig.UARM, rig.FARM, pv)
            wr = tgt - rig.norm(tgt - el) * 1.7
        te = (el - P["pelvis"]) @ T
        inside = abs(te[0]) < TORSO_CLEAR and -6.5 < te[2] < 6.5 and te[1] < 21.0
        handp = wr2 + rig.norm(wr2 - el) * 1.7
        miss = float(np.linalg.norm(handp - tgt))
        score = miss + (100.0 if inside else 0.0)
        if best is None or score < best[0]:
            best = (score, el, wr2, miss, inside)
        if not inside and miss < 0.3:
            break
    _, el, wr, miss, inside = best
    P["el_" + side], P["wr_" + side] = el, wr
    strain = P.setdefault("_strain", {})
    strain[side] = {"miss": round(miss, 2), "elbow_in_torso": bool(inside), "angle": round(_elbow_angle(sh, el, wr), 1),
                    "reach": round(float(np.linalg.norm(tgt - sh)) / (reach + 1.7), 2)}
    return P


def legs_to(P, ankles=None, pole=(0.0, 0.25, 1.0)):
    """Joelhos por IK (dobram para a frente) para os tornozelos atuais (ou os dados)."""
    for s in ("l", "r"):
        if ankles:
            P["an_" + s] = np.asarray(ankles[s], float)
        P["kn_" + s], P["an_" + s] = rig.two_bone(P["hip_" + s], P["an_" + s], rig.THIGH, rig.SHIN, np.asarray(pole))
    return P


def set_torso(P, pelvis, lean=0.0, side_lean=0.0, twist=0.0, drop=0.0):
    """Coloca pelve, pescoço e ombros: inclinação para a frente (graus), lateral e torção dos ombros (yaw)."""
    pelvis = np.asarray(pelvis, float)
    a, b = math.radians(lean), math.radians(side_lean)
    up = rig.norm([math.sin(b), math.cos(a) * math.cos(b), math.sin(a)])
    P["pelvis"] = pelvis
    P["neck"] = pelvis + up * (23.0 - drop)
    right = rig.norm(np.cross(up, [0, 0, 1.0]))
    tw = math.radians(twist)                                  # twist > 0: ombro direito vai para trás (vira à direita)
    right = rig.norm(right * math.cos(tw) + np.cross(up, right) * math.sin(tw))
    shc = P["neck"] - up * 3.8
    P["sh_l"], P["sh_r"] = shc - right * 9.2, shc + right * 9.2
    hip_right = rig.norm([1.0, 0, 0])
    P["hip_l"], P["hip_r"] = pelvis - hip_right * 4.3 - [0, 0.5, 0], pelvis + hip_right * 4.3 - [0, 0.5, 0]
    return P


def hang_arms(P, swing_l=0.0, swing_r=0.0, bend=0.12):
    """Braços soltos ao lado do corpo (balanço em graus para a frente)."""
    T = rig.torso_frame(P)
    for s, sw in (("l", swing_l), ("r", swing_r)):
        sh = P["sh_" + s]
        out = -1 if s == "l" else 1
        a = math.radians(sw)
        d1 = rig.norm(-T[:, 1] * math.cos(a) + T[:, 2] * math.sin(a) + T[:, 0] * out * 0.2)
        el = sh + d1 * rig.UARM
        a2 = a + bend + (math.radians(10) if sw > 0 else 0)
        d2 = rig.norm(-T[:, 1] * math.cos(a2) + T[:, 2] * math.sin(a2) + T[:, 0] * out * 0.03)
        P["el_" + s], P["wr_" + s] = el, el + d2 * rig.FARM
    return P


# ---------------------------------------------------------------- em pé
def stand(breath=0.0, look=(0, 0), blink=False, yaw=0.0, pitch=0.0, sway=0.0):
    """Parado: respiração sobe ombros/peito até ~0,5 px; `sway` desloca o peso de leve (quadril)."""
    P = rig.stand_pose()
    b = 0.5 * math.sin(breath * 2 * math.pi)
    set_torso(P, [sway * 0.6, 24.0, 0.0], lean=0.0, side_lean=-sway * 1.5)
    P["neck"] = P["neck"] + [0, b * 0.6, 0]
    P["sh_l"] = P["sh_l"] + [0, b, 0]
    P["sh_r"] = P["sh_r"] + [0, b, 0]
    hang_arms(P, 2.0, 2.0)
    # pés levemente desencontrados (v2: de perfil as duas pernas aparecem, 4 px entre os tênis)
    P["an_l"] = P["an_l"] + [0, 0, -1.6]
    P["an_r"] = P["an_r"] + [0, 0, 1.6]
    legs_to(P)
    P.update(look=look, blink=blink, head_yaw=yaw, head_pitch=pitch)
    return P


# ---------------------------------------------------------------- caminhada
STRIDE = 10.0                 # avanço do tornozelo de apoio por ciclo; 8 quadros por ciclo, apoio = 5/8
STANCE = 5 / 8
CYCLE = 8
WALK_PX = STRIDE / STANCE     # 16 px por ciclo = 2 px por quadro: inteiro, o pé de apoio cai sempre no mesmo pixel


def walk(t, arm_amp=18.0):
    """Ciclo em t∈[0,1): contato (0) → apoio → impulso → recuperação; perna direita defasada meio ciclo.

    Devolve (pose, plantado) — `plantado` = conjunto de pés com o tornozelo no chão neste instante.
    """
    P = rig.stand_pose()
    bob = -0.6 * math.cos(4 * math.pi * t)                     # baixo no contato, alto no apoio médio
    set_torso(P, [0.0, 24.0 + bob, 0.0], lean=3.0, twist=4.0 * math.sin(2 * math.pi * t))
    planted = set()
    for side, ph in (("l", 0.0), ("r", 0.5)):
        u = (t + ph) % 1.0
        if u < STANCE - 1e-9:
            z, lift = STRIDE / 2 - STRIDE * (u / STANCE), 0.0
            planted.add(side)
        else:
            v = (u - STANCE) / (1 - STANCE)
            z = -STRIDE / 2 + STRIDE * (0.5 - 0.5 * math.cos(math.pi * v))
            lift = 2.4 * math.sin(math.pi * v) ** 1.2
        P["an_" + side] = np.array([P["an_" + side][0], 4.0 + lift, z])
    legs_to(P, pole=(0.0, 0.1, 1.0))
    # braços em oposição: o do lado da perna que está atrás vai para a frente
    zl, zr = P["an_l"][2], P["an_r"][2]
    hang_arms(P, -arm_amp * zl / (STRIDE / 2), -arm_amp * zr / (STRIDE / 2), bend=0.22)
    return P, planted


def walk_stop(k):
    """Parada em k∈[0,1] a partir do contato da direita (walk(0.5)): o pé direito fica plantado (z=+5), o esquerdo
    vem de trás num passo curto e o corpo avança sobre os pés; termina = stand() deslocado +5 em z, com um leve
    assentamento (o quadril desce 0,5 px e volta)."""
    P0, _ = walk(0.5)
    S = stand()
    for key in ("neck", "pelvis", "sh_l", "sh_r", "el_l", "el_r", "wr_l", "wr_r", "hip_l", "hip_r", "kn_l", "kn_r", "an_l", "an_r"):
        S[key] = S[key] + [0, 0, STRIDE / 2]
    e = ease(k)
    P = blend(P0, S, e)
    lift = 2.0 * math.sin(math.pi * min(k * 1.2, 1.0))
    P["an_l"] = lerp(P0["an_l"], S["an_l"], ease_out(min(k * 1.2, 1.0))) + [0, lift if k < 0.83 else 0, 0]
    P["an_r"] = P0["an_r"].copy()
    P["pelvis"] = P["pelvis"] + [0, -0.5 * math.sin(math.pi * k), 0]
    legs_to(P)
    return P, ({"r"} if k < 0.83 else {"l", "r"})


def walk_start(k=0.5):
    """Primeiro passo a partir de parado: meio caminho entre stand() e walk(0.875) (esquerda em balanço à frente)."""
    P1, _ = walk(0.875)
    P = blend(stand(), P1, k)
    P["an_r"] = P1["an_r"].copy()
    legs_to(P)
    return P, {"r"}


# ---------------------------------------------------------------- sentado (âncora = SLOT da v2)
SEAT_PELVIS = np.array([2.0, 15.5, -7.0])
FEET_SEAT = {"l": np.array([-4.2, 4.0, 0.6]), "r": np.array([4.6, 4.0, 0.6])}
MUG_DESK = np.array([-16.5, 14.5, 4.0])         # centro da caneca na mesa (v2: MUG=(95,111) → local (-17, 14))
MOUTH = np.array([-0.5, 41.5, 6.5])


def seated(lean=9.0, breath=0.0, look=(0.6, 1), blink=False, yaw=4.0, pitch=-2.0, side_lean=0.0, twist=0.0):
    P = rig.stand_pose()
    b = 0.35 * math.sin(breath * 2 * math.pi)
    set_torso(P, SEAT_PELVIS, lean=lean, side_lean=side_lean, twist=twist, drop=1.0)
    P["neck"] = P["neck"] + [0, b * 0.5, 0]
    P["sh_l"] = P["sh_l"] + [0, b, 0]
    P["sh_r"] = P["sh_r"] + [0, b, 0]
    for s in ("l", "r"):
        P["an_" + s] = FEET_SEAT[s].copy()
    legs_to(P, pole=(0.0, 0.6, 1.0))
    # a cabeça fica nivelada quando o tronco inclina (como uma pessoa faz): contra-rola a inclinação lateral e
    # levanta o queixo na inclinação frontal além da de digitar — senão o rosto entorta e os óculos desalinham
    P.update(look=look, blink=blink, head_yaw=yaw, head_pitch=pitch + max(0.0, lean - 9.0) * 0.7,
             head_roll=-side_lean * 0.9)
    use_arm_perspective(P)
    return P


# mãos no teclado (centro da palma): a parte visível do teclado fica entre x≈-12 e +1 (o resto atrás do monitor)
KEYS_L = np.array([-5.5, 18.0, 6.0])     # alvo VISUAL: parte do teclado à esquerda do monitor
KEYS_R = np.array([11.0, 18.5, 6.0])     # atrás do monitor da esquerda (o teclado continua ali)


def typing(i, speed=1.0, **kw):
    """Quadro i da digitação: cada mão sobe/desce 1 px fora de fase, com pequeno deslocamento lateral."""
    P = seated(**kw)
    seq_l = [(0, 0.0), (0.4, 0.9), (0.2, 0.0), (-0.3, 0.6)]
    seq_r = [(-0.3, 0.7), (0.0, 0.0), (0.5, 0.8), (0.1, 0.0)]
    dl, ul = seq_l[i % 4]
    dr, ur = seq_r[i % 4]
    arm_to(P, "l", KEYS_L + [dl, ul * speed, 0])
    arm_to(P, "r", KEYS_R + [dr, ur * speed, 0])
    return P


def rest_hands(P, dl=(0, 0, 0), dr=(0, 0, 0)):
    arm_to(P, "l", KEYS_L + np.asarray(dl, float))
    arm_to(P, "r", KEYS_R + np.asarray(dr, float))
    return P


# ---------------------------------------------------------------- ações sentado (alvos tirados do próprio rig)
def head_pt(P, hp):
    """Ponto no espaço da cabeça → local (segue o pescoço e o giro da cabeça da pose)."""
    return rig.Body(P).from_head(np.asarray(hp, float))


def mouse(i, **kw):
    """Mão direita no mouse (à direita do teclado, atrás do monitor): pequenos movimentos em laço."""
    P = seated(look=(1, 0), yaw=22.0, pitch=-2.0, **kw)
    ang = i * math.pi / 3
    arm_to(P, "l", KEYS_L + [0.3, 0.2, 0])
    arm_to(P, "r", np.array([15.5, 18.8, 5.5]) + [0.9 * math.cos(ang), 0.5 * math.sin(ang), 0.5 * math.sin(ang)])
    return P


def look_monitors(yaw, look_x, **kw):
    P = seated(look=(look_x, 0), yaw=yaw, pitch=-2.0, **kw)
    return rest_hands(P)


MUG_VIS = np.array([-15.4, 12.6, 4.0])           # caneca da mesa: ponto VISUAL (pixel da v2) + profundidade real
REACH_BODY = dict(lean=17.0, side_lean=-15.0, twist=5.0)   # inclina para a caneca (ela fica na beira esquerda da mesa)
UPRIGHT_BODY = dict(lean=5.0, side_lean=0.0, twist=0.0)    # beber: tronco quase reto
TYPE_BODY = dict(lean=9.0, side_lean=0.0, twist=0.0)


def _body(e_reach, e_up=0.0, **kw):
    """Sentado com o tronco misturado entre digitar, inclinar para a caneca (e_reach) e ficar reto (e_up)."""
    p = {k: TYPE_BODY[k] + (REACH_BODY[k] - TYPE_BODY[k]) * e_reach for k in TYPE_BODY}
    p = {k: p[k] + (UPRIGHT_BODY[k] - p[k]) * e_up for k in p}
    return seated(lean=p["lean"], side_lean=p["side_lean"], twist=p["twist"], **kw)


def protract(P, side, target, amount):
    """Escápula: o ombro avança até `amount` px na direção do alvo antes do braço esticar (alcance natural)."""
    sh = P["sh_" + side]
    P["sh_" + side] = sh + rig.norm(np.asarray(target) - sh) * amount
    return P


def mug_pose(P, mug_true, up=(0.0, 1.0, 0.0), at_mouth=False, protraction=0.0):
    """Caneca na mão esquerda, pela alça (à esquerda da caneca)."""
    up = rig.norm(up)
    hand = np.asarray(mug_true, float) + np.array([-3.1, -0.2, 0.0])
    if protraction:
        protract(P, "l", hand, protraction)
    arm_to(P, "l", hand, pole=np.array([-0.7, -0.6, -0.2]), visual=False)
    P["mug"] = {"pos": np.asarray(mug_true, float), "up": up, "handle": (-1.0, 0.0, 0.0), "at_mouth": at_mouth}
    return P


def _mouth_true(P):
    v = head_pt(P, rig.HEAD_C + [0.0, rig.MOUTH_Y + 0.5, 7.4])          # 2 px à frente da boca (visual = real na cabeça)
    return visual_to_true(P, v)


def coffee(stage, k=1.0, **kw):
    """Café: 'look' → 'reach' → 'lift' → 'mouth' → 'sip' → 'lower' → 'place' → 'back'.

    O corpo participa: inclina para a caneca ao pegar/devolver (lateral, à frente e com a escápula), volta quase reto
    para beber. A mão sai do teclado num arco (sobe ~2 px e desce na alça), não em linha reta.
    """
    e = ease(k)
    if stage == "look":
        P = seated(look=(-1, 1), yaw=10.0 * (1 - e), pitch=-2.0 - 4.0 * e, **kw)
        return rest_hands(P)
    if stage in ("reach", "back"):
        kk = e if stage == "reach" else 1 - e
        P = _body(kk, look=(-1, 1), yaw=-6.0 * kk + 10.0 * (1 - kk), pitch=-6.0, **kw)
        arm_to(P, "r", KEYS_R)
        grip = visual_to_true(P, MUG_VIS) + [-3.1, -0.2, 0.0]
        start = visual_to_true(P, KEYS_L)
        hand = lerp(start, grip, kk) + [0, 2.2 * math.sin(math.pi * kk), 0]
        protract(P, "l", hand, 2.0 * kk)
        arm_to(P, "l", hand, pole=np.array([-0.7, -0.6, -0.2]), visual=False)
        return P
    if stage == "lift":                                   # sai da mesa, começa a endireitar
        P = _body(1.0 - 0.4 * e, look=(-0.5 * (1 - e), 1 if e < 0.5 else 0), yaw=-6.0 * (1 - e), pitch=-6.0 * (1 - e), **kw)
        arm_to(P, "r", KEYS_R)
        desk = visual_to_true(P, MUG_VIS)
        return mug_pose(P, desk + [0.0, 3.5 * ease_out(k), 1.0 * e], protraction=2.0 * (1 - 0.5 * e))
    if stage == "mouth":
        P = _body(0.6 * (1 - e), e_up=e, look=(0, 0), yaw=0.0, pitch=0.0, **kw)
        arm_to(P, "r", KEYS_R)
        lifted = visual_to_true(P, MUG_VIS) + [0.0, 3.5, 1.0]
        return mug_pose(P, lerp(lifted, _mouth_true(P), e), up=lerp((0, 1, 0), (0, 0.75, -0.66), e), at_mouth=k > 0.85,
                        protraction=1.0 * (1 - e))
    if stage == "sip":
        P = _body(0.0, e_up=1.0, look=(0, 0), yaw=0.0, pitch=7.0 * k, **kw)
        P["blink"] = k > 0.3
        arm_to(P, "r", KEYS_R)
        return mug_pose(P, _mouth_true(P), up=(0, 0.6, -0.8), at_mouth=True)
    if stage == "lower":
        P = _body(0.6 * e, e_up=1 - e, look=(-0.5, 1), yaw=-2.0 * e, pitch=0.0, **kw)
        arm_to(P, "r", KEYS_R)
        lifted = visual_to_true(P, MUG_VIS) + [0.0, 3.5, 1.0]
        return mug_pose(P, lerp(_mouth_true(P), lifted, e), up=lerp((0, 0.75, -0.66), (0, 1, 0), e), at_mouth=k < 0.15,
                        protraction=1.0 * e)
    if stage == "place":
        P = _body(0.6 + 0.4 * e, look=(-1, 1), yaw=-2.0 - 4.0 * e, pitch=-6.0 * e, **kw)
        arm_to(P, "r", KEYS_R)
        desk = visual_to_true(P, MUG_VIS)
        return mug_pose(P, desk + [0.0, 3.5 * (1 - ease_in(k)), 1.0 * (1 - e)], protraction=1.0 + 1.0 * e)
    raise ValueError(stage)


def scratch_head(k, phase=0, **kw):
    """Mão esquerda sobe e coça o lado da cabeça (k: subida 0→1); phase alterna o vaivém dos dedos."""
    P = seated(look=(0.4, -1), yaw=14.0, pitch=4.0, **kw)
    P["head_roll"] = 4.0 * k
    arm_to(P, "r", KEYS_R)
    tgt = head_pt(P, rig.HEAD_C + [-6.6, 3.2 + 0.7 * (phase % 2), -0.6 - 0.6 * (phase % 2)])
    arm_to(P, "l", lerp(KEYS_L, tgt, ease(k)), pole=np.array([-0.9, -0.2, 0.0]))
    P["fist_l"] = True
    return P


def scratch_neck(k, phase=0, **kw):
    P = seated(look=(0.3, 1), yaw=6.0, pitch=-12.0 * k, **kw)
    arm_to(P, "r", KEYS_R)
    tgt = head_pt(P, rig.HEAD_C + [-4.8 - 0.5 * (phase % 2), -7.4 + 0.6 * (phase % 2), -2.8])
    arm_to(P, "l", lerp(KEYS_L, tgt, ease(k)), pole=np.array([-0.9, 0.1, 0.1]))
    P["fist_l"] = True
    return P


def celebrate(k, pump=0.0, **kw):
    """Soquinho discreto com a esquerda: sobe até a altura do ombro e dá um tranco curto (pump 0→1)."""
    P = seated(look=(0.6, 0), yaw=16.0, pitch=3.0 * k, **kw)
    arm_to(P, "r", KEYS_R)
    sh = P["sh_l"]
    tgt = sh + np.array([-4.2, 6.0 + 2.0 * pump, 2.5])        # ao lado da cabeça, não na frente do rosto (v2)
    arm_to(P, "l", lerp(KEYS_L, tgt, ease(k)), pole=np.array([-0.6, -0.8, 0.0]))
    P["fist_l"] = k > 0.4
    return P


def lean_back(k, **kw):
    """Recosta e respira fundo (variação sentado): tronco vai para trás, mãos ficam na beira da mesa."""
    P = seated(lean=7.0 - 9.0 * ease(k), look=(0.5, -1 if k > 0.6 else 0), yaw=12.0, pitch=4.0 * ease(k), **kw)
    # mãos escorregam para a beira da mesa; a direita abre um pouco para o cotovelo não entrar no tronco
    rest_hands(P, dl=(-0.5, -1.0 * ease(k), -2.0 * ease(k)), dr=(2.0 * ease(k), -1.0 * ease(k), -2.0 * ease(k)))
    return P


# ---------------------------------------------------------------- sentar / levantar / puxar a cadeira
def sit(k, theta_hint=0.0):
    """Sentar em k∈[0,1]: inclina para a frente, o quadril desce e vai para trás até o assento, o tronco volta a ficar
    quase reto e as mãos chegam ao teclado. Pés parados (mesmos tornozelos do começo ao fim)."""
    S = stand()
    k1 = ease(k)
    pel = lerp(S["pelvis"], SEAT_PELVIS, k1)
    pel = pel + [0, -0.8 * math.sin(math.pi * k), -1.2 * math.sin(math.pi * k)]     # passa um pouco do ponto e assenta
    lean = 20.0 * math.sin(math.pi * min(k * 1.15, 1.0)) + 7.0 * k1 * (1 - math.sin(math.pi * min(k * 1.15, 1.0)))
    P = rig.stand_pose()
    set_torso(P, pel, lean=lean, drop=1.0 * k1)
    for s in ("l", "r"):
        P["an_" + s] = lerp(S["an_" + s], FEET_SEAT[s], k1)
    legs_to(P, pole=(0.0, 0.6, 1.0))
    # mãos: soltas → apoiam nas coxas no meio → teclado no fim (a perspectiva dos braços entra junto com a descida)
    if k < 0.55:
        hang_arms(P, 8.0 + 30 * k, 8.0 + 30 * k, bend=0.3 + k)
    else:
        use_arm_perspective(P, k1)
        kk = ease((k - 0.55) / 0.45)
        for side, keys in (("l", KEYS_L), ("r", KEYS_R)):
            out = -1.0 if side == "l" else 1.0                # mão na lateral de cima da coxa, cotovelo para fora
            thigh = (P["hip_" + side] + P["kn_" + side]) / 2 + [out * 2.2, 3.5, 3.0]
            arm_to(P, side, lerp(thigh, visual_to_true(P, keys), kk), visual=False)
    P.update(look=(0.3, 1 if k > 0.5 else 0), head_yaw=10.0 * k1, head_pitch=-4.0 * math.sin(math.pi * k) - 2.0 * k1)
    return P


def stand_up(k):
    """Levantar: inclina à frente primeiro (mãos empurram a mesa), depois sobe; não é o sentar ao contrário."""
    k2 = min(1.0, max(0.0, (k - 0.2) / 0.8))
    P = sit(1.0 - ease(k2))
    lean_extra = 10.0 * math.sin(math.pi * min(k / 0.6, 1.0))
    set_torso(P, P["pelvis"], lean=min(28.0, (9.0 if k < 0.2 else 0) + lean_extra + 14.0 * (1 - ease(k2))))
    legs_to(P, pole=(0.0, 0.6, 1.0))
    use_arm_perspective(P, 1.0 - ease(k2))
    if k < 0.45:
        push = ease(k / 0.45)
        arm_to(P, "l", KEYS_L + [-1.0, -1.5 * push, -1.0 * push])
        arm_to(P, "r", KEYS_R + [1.0, -1.5 * push, -1.0 * push])
    else:
        hang_arms(P, 10.0 * (1 - ease((k - 0.45) / 0.55)), 10.0 * (1 - ease((k - 0.45) / 0.55)), bend=0.3)
    P.update(look=(0, 0), head_yaw=10.0 * (1 - ease(k2)), head_pitch=-8.0 * math.sin(math.pi * k))
    return P


def pull_chair(k, release=0.0):
    """De perfil (θ=90, cadeira à direita): estende as mãos até o encosto, puxa ~5 px para si inclinando o tronco
    para trás e solta. k = puxada (0→1), release = mãos voltando (0→1). Devolve (pose, deslocamento das mãos em z)."""
    P = stand()
    reach_z = 9.0 - 5.0 * ease(k)
    set_torso(P, [0.0, 24.0 - 0.6 * ease(k), -0.8 * ease(k)], lean=6.0 - 9.0 * ease(k))
    legs_to(P)
    hands = {"l": np.array([-2.6, 35.0, reach_z]), "r": np.array([2.6, 35.0, reach_z])}
    if release > 0:
        H = stand()
        for s in ("l", "r"):
            arm_to(P, s, lerp(hands[s], H["wr_" + s] + rig.norm(H["wr_" + s] - H["el_" + s]) * 1.7, ease(release)))
    else:
        for s in ("l", "r"):
            arm_to(P, s, hands[s], pole=np.array([1.0 if s == "r" else -1.0, -0.6, -0.4]))
    return P, reach_z
