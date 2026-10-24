"""Hero v3 — rig 3D mínimo do Lucas que vira pixel art NO ESTILO DO PERSONAGEM ATUAL (um modelo → todas as vistas).

Referência visual = os sprites que já estão no site (assets/img/hero/sprites.png, gerados por tools/hero_char.py):
mesma paleta (PAL/FRONT_PAL), mesmas proporções (≈65 px de altura, cabeça 16×16), moletom azul-marinho com cordões e
bolso canguru, calça escura, tênis brancos, óculos com “olhos brancos” e lente clara embaixo, sorriso com dentes,
barba castanha. O que muda é a CONSISTÊNCIA: na v2 frente, perfil e caminhada eram três desenhos diferentes; aqui é um
boneco só (SDFs sobre um esqueleto) visto de θ, então cabeça, óculos, nariz, barba e ombros batem em todo ângulo.

Esqueleto (pose = dict de juntas em coordenadas locais; pés em y=0, y para cima, +z para a frente do personagem):
pelve, pescoço, ombros, cotovelos, punhos, quadris, joelhos, tornozelos + yaw/pitch da cabeça, olhar, piscada, caneca.
O tronco se orienta pela linha pelve→pescoço e pela linha dos ombros (inclina, senta); a cabeça segue o pescoço.

Do 3D ao pixel:
- ray marching com superamostragem SS×SS; cada pixel fica com o MATERIAL de maior cobertura ponderada;
- luz em faixas fixas (sombra / base / luz) com a paleta da v2, sem dithering; luz de cima/direita (monitor);
- contorno escuro externo de 1 px (v2), filete escuro entre braço e tronco (v2) e nas dobras de profundidade;
- rosto por CARIMBOS no desenho da v2 (aro de 1 px, linha branca com pupila, lente clara, ponte, sorriso “mttttm”),
  posicionados e encurtados pelos pontos projetados do rig;
- `shift` subpixel: o gerador de animações desloca o render para o pé de apoio cair sempre no mesmo pixel (sem tremer);
- `shear`: projeção oblíqua só das pernas (pé mais ao fundo desenhado mais acima), para caminhar em perspectiva na cena
  sem o pé de apoio deslizar; de perfil puro não tem efeito, então o andar lateral continua igual ao da v2.

render() devolve também o mapa de PARTES por pixel: o gerador separa a camada “sobre a mesa” (antebraços, mãos,
caneca), como a v2 fazia com a 2ª metade da folha.

Unidades: 1 = 1 pixel lógico da cena atual (240×150). θ=0 de frente, θ=90 virado para a direita da tela, 180 de costas.
Uso: python3 tools/hero3/rig.py   (gera tools/hero3/out/turnaround.png)
"""
import math
import os

import numpy as np
from PIL import Image

np.seterr(all="ignore")       # Accelerate (macOS) emite avisos espúrios em matmul

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(HERE, "out")
SS = 4                        # superamostragem por eixo


def cell_for(scale=1):
    """Célula (largura, altura) e pé (x, y) em pixels de saída — a 1× igual à v2 (72×72, pé em (32, 68))."""
    return (int(72 * scale), int(72 * scale)), (32 * scale, 68 * scale + scale - 1)


# ---------------------------------------------------------------- paleta (da v2: tools/hero_char.py PAL/FRONT_PAL)
MAT = {                                   # sombra, base, luz
    "skin":   [(200, 134, 92), (232, 171, 126), (246, 196, 152)],
    "ear":    [(176, 112, 76), (200, 134, 92), (232, 171, 126)],
    "hair":   [(42, 28, 26), (66, 44, 34), (104, 70, 50)],
    "beard":  [(46, 30, 24), (70, 46, 34), (88, 58, 42)],
    "frame":  [(16, 16, 26), (16, 16, 26), (40, 44, 60)],
    "hoodie": [(19, 31, 75), (28, 45, 100), (40, 63, 138)],
    "rib":    [(14, 23, 58), (19, 31, 75), (28, 45, 100)],     # punho, barra, bolso: um tom abaixo
    "pants":  [(28, 32, 48), (40, 44, 60), (54, 58, 76)],
    "shoe":   [(140, 146, 170), (214, 218, 230), (238, 240, 246)],
    "sole":   [(110, 116, 140), (140, 146, 170), (170, 176, 196)],
    # caneca da v2 (tools/make-hero-scene.py mug_layer): branca com faixa verde, café por cima
    "mug":    [(214, 208, 194), (245, 240, 228), (255, 252, 244)],
    "band":   [(31, 106, 80), (47, 143, 106), (79, 192, 138)],
    "coffee": [(58, 38, 26), (78, 52, 35), (78, 52, 35)],
}
RIM = {"hoodie": (52, 80, 160)}          # 4º tom: borda de luz forte
NAMES = list(MAT)
MID = {n: i for i, n in enumerate(NAMES)}
WEIGHT = np.ones(len(NAMES))
WEIGHT[MID["frame"]] = 3.0
WEIGHT[MID["band"]] = 1.6
OUTLINE = (14, 12, 20)
MUG_INK = (7, 10, 22)
FACE = {"g": (16, 16, 26), "w": (244, 240, 232), "e": (40, 28, 26), "l": (196, 210, 230),
        "t": (252, 250, 244), "m": (150, 70, 60), "c": (120, 132, 176)}

# partes (camadas e separação braço/tronco)
PARTS = ["none", "head", "torso", "uarm_l", "uarm_r", "farm_l", "farm_r", "hand_l", "hand_r", "legs", "shoes", "mug"]
PID = {n: i for i, n in enumerate(PARTS)}
ARM_PARTS = {PID[n] for n in ("uarm_l", "uarm_r", "farm_l", "farm_r", "hand_l", "hand_r")}
OVER_PARTS = {PID[n] for n in ("farm_l", "farm_r", "hand_l", "hand_r", "mug")}


# ---------------------------------------------------------------- SDFs (p: array (...,3))
def sd_ellipsoid(p, c, r):
    q = (p - c) / r
    k0 = np.linalg.norm(q, axis=-1)
    k1 = np.linalg.norm(q / r, axis=-1)
    return k0 * (k0 - 1.0) / np.maximum(k1, 1e-6)


def sd_capsule(p, a, b, ra, rb=None):
    rb = ra if rb is None else rb
    pa, ba = p - a, b - a
    h = np.clip((pa @ ba) / max(ba @ ba, 1e-9), 0.0, 1.0)
    return np.linalg.norm(pa - h[..., None] * ba, axis=-1) - (ra + (rb - ra) * h)


def sd_rbox(p, c, half, rad):
    q = np.abs(p - c) - (np.asarray(half) - rad)
    return np.linalg.norm(np.maximum(q, 0.0), axis=-1) + np.minimum(np.max(q, axis=-1), 0.0) - rad


def sd_cyl(p, c, up, r, hh):
    """Cilindro tampado (eixo `up`, raio r, meia altura hh)."""
    d = p - c
    y = d @ up
    rad = np.linalg.norm(d - y[..., None] * up, axis=-1)
    q = np.stack([rad - r, np.abs(y) - hh], -1)
    return np.minimum(np.maximum(q[..., 0], q[..., 1]), 0.0) + np.linalg.norm(np.maximum(q, 0.0), axis=-1)


def smin(a, b, k):
    h = np.clip(0.5 + 0.5 * (b - a) / k, 0.0, 1.0)
    return b + (a - b) * h - k * h * (1.0 - h)


def norm(v):
    v = np.asarray(v, float)
    return v / max(np.linalg.norm(v), 1e-9)


def rot_y(theta_deg):
    t = math.radians(theta_deg)
    c, s = math.cos(t), math.sin(t)
    return np.array([[c, 0, s], [0, 1, 0], [-s, 0, c]])


def rot_x(deg):
    t = math.radians(deg)
    c, s = math.cos(t), math.sin(t)
    return np.array([[1, 0, 0], [0, c, -s], [0, s, c]])


def rot_z(deg):
    t = math.radians(deg)
    c, s = math.cos(t), math.sin(t)
    return np.array([[c, -s, 0], [s, c, 0], [0, 0, 1]])


# ---------------------------------------------------------------- esqueleto (proporções da v2)
# v2 de frente: topo da cabeça a 65 px do chão, cabeça 16×16, moletom até ~24 px, tênis com 4 px.
NECK0 = np.array([0.0, 47.0, 0.0])
HEAD_C = np.array([0.0, 56.6, 0.3])        # no referencial da cabeça (pescoço em NECK0)
HEAD_R = np.array([7.0, 7.9, 7.2])
PIV0 = NECK0 + [0.0, 2.0, 0.0]             # pivô da cabeça (topo do pescoço)
LENS_X, LENS_Y = 3.5, 0.4                  # centro das lentes (relativo a HEAD_C)
MOUTH_Y = -4.6
UARM, FARM = 8.9, 7.8                       # ombro→cotovelo, cotovelo→punho
THIGH, SHIN = 10.6, 9.9


def stand_pose():
    """Juntas em coordenadas locais do personagem (pés no chão, y para cima, +z para a frente)."""
    return {
        "neck": np.array([0.0, 47.0, 0.0]), "pelvis": np.array([0.0, 24.0, 0.0]),
        "sh_l": np.array([-9.2, 43.2, 0.0]), "sh_r": np.array([9.2, 43.2, 0.0]),
        "el_l": np.array([-11.0, 34.4, -0.4]), "el_r": np.array([11.0, 34.4, -0.4]),
        "wr_l": np.array([-11.2, 26.6, 0.6]), "wr_r": np.array([11.2, 26.6, 0.6]),
        "hip_l": np.array([-4.3, 23.5, 0.0]), "hip_r": np.array([4.3, 23.5, 0.0]),
        "kn_l": np.array([-4.4, 13.2, 0.4]), "kn_r": np.array([4.4, 13.2, 0.4]),
        "an_l": np.array([-4.4, 4.0, 0.0]), "an_r": np.array([4.4, 4.0, 0.0]),
        "head_yaw": 0.0, "head_pitch": 0.0, "head_roll": 0.0, "look": (0, 0), "blink": False,
        "mug": None, "fist_l": False, "fist_r": False,
    }


def two_bone(a, target, l1, l2, pole):
    """IK de dois ossos: junta do meio entre `a` e `target`, dobrando para o lado de `pole` (vetor)."""
    d = np.asarray(target, float) - a
    L = np.linalg.norm(d)
    L = min(max(L, abs(l1 - l2) + 1e-3), l1 + l2 - 1e-3)
    u = d / max(np.linalg.norm(d), 1e-9)
    x = (l1 ** 2 - l2 ** 2 + L ** 2) / (2 * L)
    h = math.sqrt(max(l1 ** 2 - x ** 2, 0.0))
    pv = np.asarray(pole, float)
    pv = pv - (pv @ u) * u
    pv = norm(pv) if np.linalg.norm(pv) > 1e-6 else norm(np.cross(u, [1.0, 0, 0]))
    mid = a + u * x + pv * h
    end = a + u * L
    return mid, end


def torso_frame(P):
    """Base ortonormal do tronco (colunas: direita, cima, frente) a partir da pelve, pescoço e ombros."""
    up = norm(P["neck"] - P["pelvis"])
    right = P["sh_r"] - P["sh_l"]
    right = norm(right - (right @ up) * up)
    fwd = np.cross(right, up)
    return np.stack([right, up, fwd], 1)


def interp_az(phi_deg, xs, ys):
    return np.interp(np.abs(phi_deg), xs, ys)


class Body:
    """SDF do personagem numa pose: distância, material e parte de cada ponto."""

    def __init__(self, pose):
        self.P = P = pose
        self.T = torso_frame(P)
        self.head_rot = self.T @ rot_y(P.get("head_yaw", 0.0)) @ rot_x(-P.get("head_pitch", 0.0)) @ rot_z(P.get("head_roll", 0.0))
        self.head_pivot = P["neck"] + self.T[:, 1] * 2.0
        self.mug = P.get("mug")

    # cabeça: referencial próprio (pescoço em NECK0), rotação do tronco + yaw/pitch
    def to_head(self, p):
        return (p - self.head_pivot) @ self.head_rot + PIV0

    def from_head(self, q):
        return (np.asarray(q) - PIV0) @ self.head_rot.T + self.head_pivot

    def head(self, p):
        q = self.to_head(p)
        rel = q - HEAD_C
        phi = np.degrees(np.arctan2(rel[..., 0], rel[..., 2]))           # 0 = frente, ±90 = lados
        yy = rel[..., 1]
        t = np.clip(-yy / HEAD_R[1], 0.0, 1.0) ** 1.6                    # mandíbula estreita
        qd = q.copy()
        qd[..., 0] = HEAD_C[0] + rel[..., 0] / (1.0 - 0.16 * t)
        qd[..., 2] = HEAD_C[2] + rel[..., 2] / (1.0 - 0.08 * t)
        skull = sd_ellipsoid(qd, HEAD_C, HEAD_R)
        nose = sd_ellipsoid(q, HEAD_C + [0.0, -1.5, 7.2], np.array([1.0, 1.8, 1.75]))
        ears = np.minimum(sd_ellipsoid(q, HEAD_C + [-6.3, -0.6, -0.6], np.array([0.8, 1.8, 1.2])),
                          sd_ellipsoid(q, HEAD_C + [6.3, -0.6, -0.6], np.array([0.8, 1.8, 1.2])))
        face = smin(smin(skull, nose, 0.5), ears, 0.4)
        # cabelo curto da v2: testa a ~4 px do topo, lado cobre até a orelha, nuca baixa; casca fina e uniforme
        # (mesma espessura em todo ângulo, para o volume não “crescer” de costas)
        # lateral como no perfil da v2: cabelo acima da orelha, costeleta fina, bochecha e orelha à mostra
        hairline = interp_az(phi, [0, 25, 45, 60, 70, 75, 80, 84, 98, 104, 110, 125, 150, 180],
                             [3.3, 3.1, 2.6, 1.8, 1.5, -0.8, -0.8, 2.0, 2.0, 1.4, -0.6, -2.6, -4.2, -4.7])
        hair = np.maximum(sd_ellipsoid(qd, HEAD_C + [0, 0.35, 0.05], HEAD_R + [0.4, 0.55, 0.3]), hairline - yy)
        beardline = interp_az(phi, [0, 18, 32, 50, 66, 76, 82, 90, 100, 112], [-3.0, -3.0, -3.3, -3.4, -3.2, -2.4, -1.2, -2.0, -4.0, -7.0])
        beard = np.maximum(sd_ellipsoid(qd, HEAD_C, HEAD_R + 0.3), yy - beardline)
        beard = np.maximum(beard, np.abs(phi) - 112.0)
        frame = np.full(face.shape, 1e3)                                  # só as hastes (aros são carimbos)
        for s in (-1.0, 1.0):
            frame = np.minimum(frame, sd_capsule(q, HEAD_C + [s * 5.6, 0.9, 6.0], HEAD_C + [s * 6.9, 0.8, -0.4], 0.24))
        d = np.minimum(np.minimum(face, hair), np.minimum(beard, frame))
        return d, dict(face=face, hair=hair, beard=beard, frame=frame, ears=ears, rel=rel)

    def arm(self, p, s):
        P = self.P
        sh, el, wr = P["sh_" + s], P["el_" + s], P["wr_" + s]
        # manga “fofa” da v2: grossa no ombro, cheia no cotovelo, afunila até o punho canelado
        up = sd_capsule(p, sh, el, 3.7, 3.2)
        fa = sd_capsule(p, el, wr, 3.2, 2.7)
        d = norm(wr - el)
        side = np.cross(d, self.T[:, 1])
        side = norm(side) if np.linalg.norm(side) > 0.2 else norm(np.cross(d, [0, 0, 1.0]))
        thick = np.cross(side, d)
        hc = wr + d * 1.7
        q = np.stack([(p - hc) @ side, (p - hc) @ d, (p - hc) @ thick], -1)
        fist = P.get("fist_" + s, False)
        hand = sd_ellipsoid(q, np.zeros(3), np.array([2.0, 2.0 if fist else 2.4, 1.6]))
        hand = smin(hand, sd_ellipsoid(q, np.array([1.5, -0.3, 0.6]), np.array([0.9, 1.2, 0.9])), 0.5)   # polegar
        return up, fa, hand

    def body(self, p):
        P, T = self.P, self.T
        tp = (p - P["pelvis"]) @ T                                         # coordenadas do tronco
        torso = sd_rbox(tp, np.array([0, 9.8, 0]), [8.4, 11.0, 5.0], 3.6)
        torso = smin(torso, sd_capsule(p, P["sh_l"] + T[:, 0] * 1.4 - T[:, 1] * 0.8, P["sh_r"] - T[:, 0] * 1.4 - T[:, 1] * 0.8, 3.4), 1.6)
        npnt = (p - P["neck"]) @ T
        hood = sd_ellipsoid(npnt, np.array([0, -1.6, -2.6]), np.array([5.6, 1.8, 2.8]))   # só uma dobra na nuca (v2)
        collar = sd_capsule(npnt, np.array([-3.6, -1.2, 1.6]), np.array([3.6, -1.2, 1.6]), 1.4)
        torso = smin(torso, np.minimum(hood, collar), 0.8)
        ul, fl, hl = self.arm(p, "l")
        ur, fr, hr = self.arm(p, "r")
        neck = sd_capsule(npnt, np.array([0, -1.5, 0.3]), np.array([0, 3.5, 0.3]), 2.5)
        pelvis = sd_rbox(tp, np.array([0, -1.4, 0]), [7.0, 3.0, 4.2], 2.6)
        # pernas um pouco mais finas que o vão entre elas: de frente fica a linha escura entre as pernas da v2
        legs = np.minimum(sd_capsule(p, P["hip_l"], P["kn_l"], 3.5, 3.0), sd_capsule(p, P["hip_r"], P["kn_r"], 3.5, 3.0))
        legs = np.minimum(legs, np.minimum(sd_capsule(p, P["kn_l"], P["an_l"], 3.0, 2.8), sd_capsule(p, P["kn_r"], P["an_r"], 3.0, 2.8)))
        legs = smin(pelvis, legs, 1.2)
        shoes = np.minimum(self.shoe(p, "l"), self.shoe(p, "r"))
        parts = dict(torso=torso, neck=neck, uarm_l=ul, uarm_r=ur, farm_l=fl, farm_r=fr, hand_l=hl, hand_r=hr,
                     legs=legs, shoes=shoes, tp=tp)
        if self.mug is not None:
            parts["mug"] = self.mug_sdf(p)
        d = np.minimum.reduce([v for k, v in parts.items() if k != "tp"])
        return d, parts

    def shoe(self, p, s):
        P = self.P
        an = P["an_" + s]
        fwd = P.get("foot_dir_" + s)
        fwd = norm([0, 0, 1.0] if fwd is None else fwd)
        side = norm(np.cross([0, 1.0, 0], fwd))
        c = an + np.array([0, -2.0, 0]) + fwd * 1.2
        q = np.stack([(p - c) @ side, (p - c)[..., 1], (p - c) @ fwd], -1)
        return sd_rbox(q, np.zeros(3), [2.7, 2.0, 3.9], 1.4)

    def mug_sdf(self, p):
        c, up = np.asarray(self.mug["pos"], float), norm(self.mug.get("up", (0, 1, 0)))
        body = sd_cyl(p, c, up, 2.0, 2.4)
        hd = norm(self.mug.get("handle", (-1, 0, 0)))
        handle = sd_capsule(p, c + hd * 2.3 + up * 1.0, c + hd * 2.3 - up * 1.0, 0.6)
        return np.minimum(body, handle)

    def sdf(self, p):
        return np.minimum(self.head(p)[0], self.body(p)[0])

    def classify(self, p):
        """Material e parte de cada ponto (da superfície)."""
        _, H = self.head(p)
        _, B = self.body(p)
        cand = [("face", H["face"], "skin", "head"), ("hair", H["hair"], "hair", "head"), ("beard", H["beard"], "beard", "head"),
                ("frame", H["frame"], "frame", "head"), ("torso", B["torso"], "hoodie", "torso"), ("neck", B["neck"], "skin", "torso"),
                ("uarm_l", B["uarm_l"], "hoodie", "uarm_l"), ("uarm_r", B["uarm_r"], "hoodie", "uarm_r"),
                ("farm_l", B["farm_l"], "hoodie", "farm_l"), ("farm_r", B["farm_r"], "hoodie", "farm_r"),
                ("hand_l", B["hand_l"], "skin", "hand_l"), ("hand_r", B["hand_r"], "skin", "hand_r"),
                ("legs", B["legs"], "pants", "legs"), ("shoes", B["shoes"], "shoe", "shoes")]
        if "mug" in B:
            cand.append(("mug", B["mug"], "mug", "mug"))
        k = np.argmin(np.stack([c[1] for c in cand], -1), -1)
        m = np.zeros(k.shape, int)
        part = np.zeros(k.shape, int)
        for i, (_, _, mat, pt) in enumerate(cand):
            m[k == i] = MID[mat]
            part[k == i] = PID[pt]
        m[(k == 0) & (H["ears"] < -0.05) & (np.abs(H["rel"][..., 0]) > 6.2)] = MID["ear"]     # só a concha da orelha
        P = self.P
        hoodie = m == MID["hoodie"]
        # punhos: último trecho do antebraço
        for s in ("l", "r"):
            a, b = P["el_" + s], P["wr_" + s]
            h = np.clip(((p - a) @ (b - a)) / max((b - a) @ (b - a), 1e-9), 0, 1)
            m[hoodie & (part == PID["farm_" + s]) & (h > 0.8)] = MID["rib"]
        tp = B["tp"]
        tx, ty, tz = tp[..., 0], tp[..., 1], tp[..., 2]
        m[hoodie & (part == PID["torso"]) & (ty < 0.2)] = MID["rib"]                       # barra

        def in_pocket(ax, yy, inset):                       # bolso canguru: U invertido com cantos chanfrados
            return (ax < 6.0 - inset - 0.7 * np.clip(yy - 7.0, 0, 9)) & (yy > 1.6 + inset) & (yy < 9.2 - inset)
        ax = np.abs(tx)
        m[hoodie & (part == PID["torso"]) & (tz > 3.0) & in_pocket(ax, ty, 0.0) & ~in_pocket(ax, ty, 1.1) & (ty > 2.2)] = MID["rib"]
        m[(m == MID["shoe"]) & (p[..., 1] < 1.0)] = MID["sole"]
        self.far = np.zeros(k.shape, bool)
        if getattr(self, "R", None) is not None:
            dv = p @ self.R[2]                                       # profundidade na vista (+ = para a câmera)
            dc = P["pelvis"] @ self.R[2]
            limb = np.isin(part, [PID[n] for n in ("uarm_l", "uarm_r", "farm_l", "farm_r", "legs", "shoes")])
            self.far = limb & (dv < dc - 1.8)
        if "mug" in B:
            c, up = np.asarray(self.mug["pos"], float), norm(self.mug.get("up", (0, 1, 0)))
            y = (p - c) @ up
            mug = part == PID["mug"]
            m[mug & (np.abs(y + 0.2) < 0.75)] = MID["band"]
            m[mug & (y > 2.1)] = MID["coffee"]
        return m, part


# ---------------------------------------------------------------- render
def apply_shear(pose, R, shear):
    """Projeção oblíqua só das pernas: desloca joelho/tornozelo pela profundidade (z local) do pé, em pixels de tela.

    shear = (ex, ey) em px de VISTA por unidade de z local do tornozelo. O deslocamento é aplicado em coordenadas locais
    (convertido de vista) e não muda a forma do sapato: só onde cada pé é desenhado.
    """
    if not shear or (abs(shear[0]) < 1e-9 and abs(shear[1]) < 1e-9):
        return pose
    P = dict(pose)
    e_loc = np.array([shear[0], shear[1], 0.0]) @ R          # vista → local
    for s in ("l", "r"):
        dz = P["an_" + s][2] - P["pelvis"][2]
        off = e_loc * dz
        P["an_" + s] = P["an_" + s] + off
        P["kn_" + s] = P["kn_" + s] + off * 0.5
    return P


def apply_arm_shear(pose):
    """Perspectiva dos braços (poses.use_arm_perspective): cotovelo, punho e caneca na mão descem/vão à direita na tela
    conforme a profundidade à frente dos ombros. As juntas mudam de lugar, as formas não (cápsulas rígidas)."""
    e = pose.get("arm_shear")
    if e is None:
        return pose
    P = dict(pose)
    e, zr = np.asarray(e, float), float(pose["arm_zref"])
    for k in ("el_l", "el_r", "wr_l", "wr_r"):
        P[k] = P[k] + e * (P[k][2] - zr)
    if P.get("mug") is not None:
        m = dict(P["mug"])
        m["pos"] = np.asarray(m["pos"], float) + e * (float(np.asarray(m["pos"])[2]) - zr)
        P["mug"] = m
    return P


HEAD_CHEAT = 18.0      # graus: nas vistas laterais a cabeça vira um pouco para a câmera (convenção de pixel art)


def head_view_angle(pose, R):
    b = Body(pose)
    f = (b.head_rot @ np.array([0, 0, 1.0])) @ R.T
    return math.degrees(math.atan2(f[0], f[2]))


def cheat_head(pose, R):
    """O perfil “matemático” de uma cabeça mostra pouco rosto (o perfil da v2, desenhado à mão, mostra ~60%). Como os
    ilustradores fazem, a cabeça vira até HEAD_CHEAT graus para a câmera nas vistas laterais, de forma CONTÍNUA
    (proporcional a sen²): 0° de frente e de costas, máximo de perfil — sem troca brusca de formato entre quadros."""
    a = head_view_angle(pose, R)
    target = -HEAD_CHEAT * math.sin(math.radians(a)) * abs(math.sin(math.radians(a)))
    if abs(target) < 0.05:
        return pose
    P = dict(pose)
    P["head_yaw"] = pose.get("head_yaw", 0.0) + 1.0
    d = head_view_angle(P, R) - a
    d = (d + 180) % 360 - 180
    P["head_yaw"] = pose.get("head_yaw", 0.0) + (target / d if abs(d) > 1e-3 else 0.0)
    return P


def project(p_local, theta, scale=1, shift=(0.0, 0.0)):
    """Ponto local → pixel (float) na célula."""
    (_, _), foot = cell_for(scale)
    v = np.asarray(p_local) @ rot_y(theta).T
    return foot[0] + v[0] * scale + shift[0], foot[1] + 1 - v[1] * scale - shift[1]


def render(pose, theta, scale=1, light=(0.50, 0.62, 0.60), shift=(0.0, 0.0), shear=None):
    """Rasteriza a pose vista de θ. Devolve dict: img (RGBA), part (ids por pixel), solid."""
    (W, H), foot = cell_for(scale)
    foot = (int(round(foot[0])), int(round(foot[1])))
    R = rot_y(theta)
    pose = cheat_head(apply_arm_shear(apply_shear(pose, R, shear)), R)
    body = Body(pose)
    xs = ((np.arange(W * SS) + 0.5) / SS - foot[0] - shift[0]) / scale
    ys = (foot[1] + 1 - (np.arange(H * SS) + 0.5) / SS - shift[1]) / scale
    X, Y = np.meshgrid(xs, ys)
    Z0 = 30.0
    pos = np.stack([X, Y, np.full_like(X, Z0)], -1)
    t = np.zeros(X.shape)
    hit = np.zeros(X.shape, bool)
    alive = np.ones(X.shape, bool)
    for _ in range(100):
        idx = np.nonzero(alive)
        if not idx[0].size:
            break
        pv = pos[idx].copy()
        pv[:, 2] -= t[idx]
        d = body.sdf(pv @ R)
        t[idx] += d * 0.9
        h = d < 0.02
        hit[idx[0][h], idx[1][h]] = True
        dead = h | (t[idx] > 2 * Z0)
        alive[idx[0][dead], idx[1][dead]] = False
    pv = pos.copy()
    pv[..., 2] -= t
    pl = pv @ R
    mat = np.full(X.shape, -1)
    prt = np.zeros(X.shape, int)
    nrm = np.zeros(X.shape + (3,))
    farm = np.zeros(X.shape, bool)
    if hit.any():
        hp = pl[hit]
        body.R = R
        mat[hit], prt[hit] = body.classify(hp)
        farm = np.zeros(X.shape, bool)
        farm[hit] = body.far
        e = 0.12
        g = np.stack([body.sdf(hp + [e, 0, 0]) - body.sdf(hp - [e, 0, 0]),
                      body.sdf(hp + [0, e, 0]) - body.sdf(hp - [0, e, 0]),
                      body.sdf(hp + [0, 0, e]) - body.sdf(hp - [0, 0, e])], -1)
        g /= np.maximum(np.linalg.norm(g, axis=-1, keepdims=True), 1e-6)
        nrm[hit] = g @ R.T
    depth = np.where(hit, (Z0 - t) * scale, -1e3)

    n_m = len(NAMES)
    cov = np.stack([(mat == k).reshape(H, SS, W, SS).mean(axis=(1, 3)) for k in range(n_m)], -1)
    solid = hit.reshape(H, SS, W, SS).mean(axis=(1, 3)) >= 0.45
    best = np.argmax(cov * WEIGHT, -1)
    nsum = np.zeros((H, W, 3))
    dpx = np.full((H, W), -1e3)
    ppx = np.zeros((H, W), int)
    for k in range(n_m):
        sel = mat == k
        if not sel.any():
            continue
        cnt = sel.reshape(H, SS, W, SS).sum(axis=(1, 3))
        ns = (nrm * sel[..., None]).reshape(H, SS, W, SS, 3).sum(axis=(1, 3))
        ds = np.where(sel, depth, -1e3).reshape(H, SS, W, SS).max(axis=(1, 3))
        pick = best == k
        nsum[pick] = ns[pick] / np.maximum(cnt[pick], 1)[:, None]
        dpx[pick] = ds[pick]
    # parte por pixel: a mais frequente entre as subamostras
    bestc = np.zeros((H, W), int)
    for k in range(1, len(PARTS)):
        c = ((prt == k) & hit).reshape(H, SS, W, SS).sum(axis=(1, 3))
        upd = c > bestc
        ppx[upd] = k
        bestc = np.maximum(bestc, c)
    L = np.array(light) / np.linalg.norm(light)
    lam = nsum @ L
    # como na v2: quase tudo no tom base; o tom claro só onde a luz bate quase de frente (borda iluminada)
    band = np.where(lam > 0.72, 2, np.where(lam > 0.05, 1, 0))
    far_px = farm.reshape(H, SS, W, SS).mean(axis=(1, 3)) > 0.5
    band = np.where(far_px & (best != MID["shoe"]), np.maximum(band - 1, 0), band)
    hair = best == MID["hair"]                           # cabelo da v2: quase todo no tom base, só um fio de brilho
    band[hair] = np.where(lam[hair] > 0.975, 2, np.where(lam[hair] > -0.62, 1, 0))
    # pele e barba como na v2: quase tudo no tom base, realce só onde a luz bate de frente, sombra só no avesso
    for n, hi, lo in (("skin", 0.8, -0.05), ("beard", 0.92, -0.45), ("ear", 2.0, -0.3)):
        sel = best == MID[n]
        band[sel] = np.where(lam[sel] > hi, 2, np.where(lam[sel] > lo, 1, 0))
    img = np.zeros((H, W, 4), np.uint8)
    for k, n in enumerate(NAMES):
        for b in range(3):
            sel = solid & (best == k) & (band == b)
            img[sel, :3] = MAT[n][b]
            img[sel, 3] = 255
        if n in RIM:
            sel = solid & (best == k) & (lam > 0.86)
            img[sel, :3] = RIM[n]
    img = outline(img, solid, best, dpx, ppx, scale)
    stamp_face(img, body, R, foot, dpx, scale, shift)
    return {"img": img, "part": np.where(solid, ppx, 0), "solid": solid, "depth": dpx}


def outline(img, solid, best, depth, part, scale):
    out = img.copy()
    pad = np.pad(solid, 1)
    neigh = pad[:-2, 1:-1] | pad[2:, 1:-1] | pad[1:-1, :-2] | pad[1:-1, 2:]
    out[(~solid) & neigh] = OUTLINE + (255,)
    dpad = np.pad(depth, 1, constant_values=-1e3)
    ppad = np.pad(part, 1)
    nb = [(dpad[:-2, 1:-1], ppad[:-2, 1:-1]), (dpad[2:, 1:-1], ppad[2:, 1:-1]), (dpad[1:-1, :-2], ppad[1:-1, :-2]), (dpad[1:-1, 2:], ppad[1:-1, 2:])]
    arm = np.array(sorted(ARM_PARTS))
    # separação braço × tronco (v2): o pixel de trás, vizinho de um pixel de outra parte que está na frente, escurece
    sep = np.zeros(solid.shape, bool)
    for dn, pn in nb:
        diff_part = (pn != part) & (pn > 0) & (np.isin(pn, arm) | np.isin(part, arm))
        # manga encostada no tronco na mesma profundidade (de frente): a v2 contorna a manga — escurece o lado do tronco
        side_by_side = (part == PID["torso"]) & np.isin(pn, arm) & (np.abs(dn - depth) <= 0.8 * scale)
        sep |= solid & diff_part & ((dn - depth > 0.8 * scale) | side_by_side) & (part != PID["head"]) & (pn != PID["mug"])
    # dobra de profundidade grande (queixo sobre o pescoço, perna da frente sobre a de trás)
    front = np.maximum.reduce([d for d, _ in nb])
    fold = solid & (front - depth > 3.2 * scale) & (best != MID["frame"])
    for k, n in enumerate(NAMES):
        for msk, w in ((fold, 0.45), (sep, 0.75)):            # braço na frente do tronco: contorno quase preto (v2)
            sel = msk & (best == k)
            if n in ("skin", "ear"):
                out[sel, :3] = MAT[n][0]
            else:
                out[sel, :3] = (np.array(MAT[n][0]) * (1 - w) + np.array(OUTLINE) * w).astype(np.uint8)
    return out


def stamp_face(img, body, R, foot, depth, scale, shift=(0.0, 0.0)):
    """Óculos, olhos, cordões e sorriso no desenho da v2, presos à geometria (giram e encurtam com a cabeça).

    Lente de frente (1×): 5×4 com aro de 1 px; dentro, linha de cima branca com a pupila e linha de baixo de lente
    clara; ponte de 2 px na linha da pupila. Sorriso: “mttttm” e lábio “mmmm” embaixo.
    """
    H, W = depth.shape
    S = max(1, int(round(scale)))
    P = body.P

    def px(v):
        return (int(math.floor(v[0] * scale + foot[0] + shift[0])), int(math.floor(foot[1] + 1 - v[1] * scale - shift[1])))

    def vis(v, x, y, tol=1.5):
        return 0 <= x < W and 0 <= y < H and depth[y, x] < (v[2] + tol) * scale

    def put(x, y, c):
        if 0 <= x < W and 0 <= y < H and img[y, x, 3]:
            img[y, x, :3] = c

    hr = body.head_rot
    ax_x = (hr @ np.array([1.0, 0, 0])) @ R.T
    fwd = (hr @ np.array([0, 0, 1.0])) @ R.T
    look = P.get("look", (0, 0))
    lenses = []
    cs = [body.from_head(HEAD_C + [s * LENS_X, LENS_Y, 7.2]) @ R.T for s in (-1.0, 1.0)]
    near = 0 if cs[0][2] >= cs[1][2] else 1
    for i, c in enumerate(cs):
        if fwd[2] < -0.3 or (i != near and fwd[2] < 0.5):
            continue
        x, y = px(c)
        if not (0 <= x < W and 0 <= y < H):
            continue
        cosx = abs(ax_x[0])
        hw = max(2.5 * cosx, 2.0 if i == near else 1.5) * S       # de perfil a lente de perto tem 4 px (v2: “gweg”)
        if i == near and abs(fwd[0]) > 0.5:
            x -= int(round(np.sign(fwd[0]) * (2.0 if abs(fwd[0]) > 0.85 else 1.0) * S))
        x0, x1 = int(round(x + 0.5 - hw)), int(round(x + 0.5 + hw)) - 1
        x1 = max(x1, x0)
        hh = 2 * S
        y0, y1 = y - hh + 1, y + hh
        for xx in range(x0, x1 + 1):
            put(xx, y0, FACE["g"])
            put(xx, y1, FACE["g"])
        for yy in range(y0, y1 + 1):
            put(x0, yy, FACE["g"])
            put(x1, yy, FACE["g"])
        iw = x1 - x0 - 1
        if iw >= 1:
            mid = (y0 + y1) // 2
            if not P.get("blink"):
                for xx in range(x0 + 1, x1):
                    for yy in range(y0 + 1, y1):
                        put(xx, yy, FACE["w"] if yy <= mid else FACE["l"])
                pw = S
                lx = look[0]
                pc = x0 + 1 + (iw - pw) // 2 + int(round(lx * (iw - pw) / 2 + (0.49 * np.sign(lx) if iw - pw == 1 else 0)))
                pc = min(max(pc, x0 + 1), x1 - pw)
                pr = y0 + 1 + (1 if look[1] > 0 else 0) * S
                for dx in range(pw):
                    for dy in range(pw):
                        put(pc + dx, pr + dy, FACE["e"])
            else:                                         # piscada: pálpebra (pele) com o vinco embaixo
                for xx in range(x0 + 1, x1):
                    for yy in range(y0 + 1, y1):
                        put(xx, yy, MAT["skin"][0] if yy == mid + (1 if S == 1 else 0) else MAT["skin"][1])
        lenses.append((x0, x1, y0))
        if i == near and abs(fwd[0]) > 0.45:
            ear = body.from_head(HEAD_C + [(-1.0 if i == 0 else 1.0) * 6.6, 0.6, -0.6]) @ R.T
            ex, _ = px(ear)
            back = x0 if fwd[0] > 0 else x1
            step = -1 if fwd[0] > 0 else 1
            for xx in range(back + step, ex, step):
                if 0 <= xx < W and depth[y0 + S, xx] < (c[2] + 3.0) * scale:
                    put(xx, y0 + S, FACE["g"])
    if len(lenses) == 2:                                      # ponte na linha da pupila
        (a0, a1, ya), (b0, b1, yb) = sorted(lenses)
        for xx in range(a1 + 1, b0):
            for k in range(S):
                put(xx, min(ya, yb) + 1 + k, FACE["g"])
    # sorriso (de perfil vira dentes na borda do rosto, como na v2); some quando a caneca está na boca
    if fwd[2] > -0.1 and not (P.get("mug") and P["mug"].get("at_mouth")):
        mc = body.from_head(HEAD_C + [0.0, MOUTH_Y, 6.6]) @ R.T
        mx, my = px(mc)
        hw = (3 if fwd[2] > 0.85 else 2 if fwd[2] > 0.35 else 1) * S
        mx -= int(round(fwd[0] * (1.0 if fwd[2] > 0.35 else 1.6) * S))
        if hw == S and vis(mc, mx, my, 3.0):              # de perfil (v2): “m” atrás e dois dentes na frente
            sg = 1 if fwd[0] >= 0 else -1
            for j, col in ((-1, FACE["m"]), (0, FACE["t"]), (1, FACE["t"])):
                for k in range(S):
                    put(mx + j * sg * S, my + k, col)
            for k in range(S):
                put(mx, my + S + k, FACE["m"])
        elif vis(mc, mx, my, 3.0):
            for xx in range(mx - hw, mx + hw):
                edge = xx in (mx - hw, mx + hw - 1)
                for k in range(S):
                    put(xx, my + k, FACE["m"] if edge else FACE["t"])
            for xx in range(mx - hw + S, mx + hw - S):
                for k in range(S):
                    put(xx, my + S + k, FACE["m"])
    # cordões do capuz: dois filetes claros no peito, só de frente/3/4
    T = body.T
    nz = (P["neck"] @ R.T)[2]
    for s in (-1.0, 1.0):
        a = (P["neck"] + T @ np.array([s * 1.6, -2.6, 4.6])) @ R.T
        b = (P["neck"] + T @ np.array([s * 1.6, -8.2, 5.2])) @ R.T
        if a[2] - nz < 1.0:
            if s > 0 and abs(R[0, 0]) < 0.6:                   # de perfil: só o cordão de perto, na frente do peito
                f = (P["neck"] + T @ np.array([0.0, -2.6, 5.4])) @ R.T
                g = (P["neck"] + T @ np.array([0.0, -8.0, 5.8])) @ R.T
                xa, ya = px(f)
                _, yb = px(g)
                xa -= int(np.sign((T @ np.array([0, 0, 1.0])) @ R.T)[0])
                for yy in range(ya, yb + 1):
                    if 0 <= xa < W and 0 <= yy < H and img[yy, xa, 3] and tuple(img[yy, xa, :3]) in [MAT["hoodie"][b] for b in range(3)] + [RIM["hoodie"]]:
                        put(xa, yy, FACE["c"])
            continue
        xa, ya = px(a)
        xb, yb = px(b)
        zc = (a[2] + b[2]) / 2
        for yy in range(ya, yb + 1):
            xx = xa + (xb - xa) * (yy - ya) // max(1, yb - ya)
            if 0 <= xx < W and 0 <= yy < H and (zc - 2.2) * scale < depth[yy, xx] < (zc + 1.8) * scale:
                put(xx, yy, FACE["c"])


# ---------------------------------------------------------------- folhas de revisão
def strip(frames, scale=1, bg=(52, 56, 78, 255), zoom=6):
    (W, H), _ = cell_for(scale)
    sheet = Image.new("RGBA", (len(frames) * W, H), bg)
    for i, f in enumerate(frames):
        sheet.alpha_composite(Image.fromarray(f), (i * W, 0))
    return sheet.resize((sheet.width * zoom, sheet.height * zoom), Image.NEAREST) if zoom > 1 else sheet


def guides(im, zoom, scale=1):
    """Linhas tracejadas em topo do cabelo, linha das lentes, queixo, ombros e chão (mesma altura em todos os ângulos)."""
    _, foot = cell_for(scale)
    px = im.load()
    for gy, col in ((HEAD_C[1] + HEAD_R[1] + 0.6, (255, 210, 90, 255)), (HEAD_C[1] + LENS_Y, (90, 200, 255, 255)),
                    (HEAD_C[1] - HEAD_R[1], (255, 120, 160, 255)), (43.2, (160, 255, 150, 255)), (0, (255, 255, 255, 255))):
        y = int(round((foot[1] + 1 - gy * scale) * zoom))
        for x in range(0, im.width, 3):
            if 0 <= y < im.height:
                px[x, y] = col
    return im


if __name__ == "__main__":
    os.makedirs(OUT, exist_ok=True)
    thetas = [i * 22.5 for i in range(16)]
    guides(strip([render(stand_pose(), th)["img"] for th in thetas]), 6).save(os.path.join(OUT, "turnaround.png"))
    print("ok", OUT)
