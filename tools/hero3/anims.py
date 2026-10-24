"""Hero v3 — trilhas da animação (intro + loop sentado) e atlas de quadros do personagem.

Em vez de animações soltas com deslocamentos aproximados, a cena é uma TRILHA a 12 tiques/s: cada tique diz qual quadro
desenhar, onde (posição exata no mundo 240×150), onde está a cadeira, se a caneca está na mesa ou na mão e qual fala
está visível. O runtime (assets/js/hero-v3.js) só toca a trilha.

Pés sem deslizar (solver de raiz): quando um pé está apoiado no quadro anterior e no atual, a posição do personagem no
mundo é ajustada para esse pé ficar exatamente no mesmo ponto; o resto (giro, sentar) mantém a pelve ou um ponto fixo.
O render recebe a parte fracionária da posição (`shift`, em 1/4 px) e o quadro é colocado em pixel inteiro: o pé de
apoio cai sempre no mesmo pixel, sem tremer.

Quadros iguais (mesma pose, ângulo e deslocamento) são renderizados uma vez só (cache em out/cache/).
Saídas: assets/img/hero/v3/actor.png + actor.json (consumidos por hero-v3.js); folhas de revisão em tools/hero3/out/.
Uso: python3 tools/hero3/anims.py
"""
import hashlib
import json
import math
import os
import sys

import numpy as np
from PIL import Image

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import poses as po  # noqa: E402
import rig  # noqa: E402
import scene3  # noqa: E402

TICK = 12                                   # tiques por segundo
CACHE = os.path.join(rig.OUT, "cache")
ASSETS = os.path.join(scene3.ROOT, "assets", "img", "hero", "v3")
SLOT = np.array(scene3.SLOT, float)         # pés diante da cadeira (âncora sentado), igual à v2
SEAT_THETA = po.SEAT_THETA                  # sentado: quase de frente, levemente virado para os monitores
DEPTH_C = 0.7                               # profundidade da cena: 1 px para o fundo sobe/esquerda 0,7 px


def shear_for(theta):
    """Projeção oblíqua das pernas para andar em diagonal na cena (0 de perfil puro)."""
    c = math.cos(math.radians(theta))
    return (DEPTH_C * c, -DEPTH_C * c) if abs(c) > 1e-6 else None


class Spec:
    __slots__ = ("pose", "theta", "planted", "mode", "shear", "over", "mug", "chair", "talk", "hold", "fix")

    def __init__(self, pose, theta, planted=frozenset(("l", "r")), mode="feet", shear=None, over=False, mug="desk",
                 chair=0.0, talk=0, hold=1, fix=None):
        self.pose, self.theta, self.planted, self.mode, self.shear = pose, theta, frozenset(planted), mode, shear
        self.over, self.mug, self.chair, self.talk, self.hold, self.fix = over, mug, chair, talk, hold, fix


# ---------------------------------------------------------------- solver de raiz
def foot_rel(P, theta, shear):
    """Tornozelos e pelve projetados (tela: x à direita, y para baixo), relativos à âncora do quadro."""
    R = rig.rot_y(theta)
    Q = rig.apply_shear(P, R, shear)
    out = {}
    for k, j in (("l", "an_l"), ("r", "an_r"), ("pelvis", "pelvis")):
        v = Q[j] @ R.T
        out[k] = np.array([v[0], -v[1]])
    return out


def solve(specs, start):
    """Posição no mundo (float) de cada spec: pé apoiado fixo, pelve fixa ou ponto dado."""
    W = np.array(start, float)
    prev, prev_rel, age = None, None, {"l": 0, "r": 0}
    pos = []
    for sp in specs:
        rel = foot_rel(sp.pose, sp.theta, sp.shear)
        if sp.fix is not None:
            W = np.array(sp.fix, float)
        elif prev is not None:
            if sp.mode == "feet":
                common = sp.planted & prev.planted
                if common:
                    f = max(common, key=lambda s: age[s])
                    W = W + prev_rel[f] - rel[f]
            elif sp.mode == "pelvis":
                W = W + np.array([prev_rel["pelvis"][0] - rel["pelvis"][0], 0.0])
        for s in ("l", "r"):
            age[s] = age[s] + 1 if s in sp.planted else 0
        pos.append(W.copy())
        prev, prev_rel = sp, rel
    return pos


# ---------------------------------------------------------------- render com cache
RIG_VER = hashlib.sha1(open(rig.__file__, "rb").read()).hexdigest()[:8]     # mudou o rig → quadros novos


def _key(P, theta, shift, shear, over):
    parts = [RIG_VER]
    for k in sorted(P):
        if k.startswith("_"):
            continue
        v = P[k]
        if isinstance(v, np.ndarray):
            parts.append((k, tuple(np.round(v, 3))))
        elif isinstance(v, dict):
            parts.append((k, tuple((kk, tuple(np.round(np.asarray(vv, float), 3)) if not isinstance(vv, bool) else vv) for kk, vv in sorted(v.items()))))
        else:
            parts.append((k, v))
    s = repr((parts, round(theta, 3), tuple(np.round(shift, 3)), None if shear is None else tuple(np.round(shear, 4)), over))
    return hashlib.sha1(s.encode()).hexdigest()[:16]


def over_layer(r):
    """Antebraços, mãos e caneca + o contorno colado neles (vão por cima da mesa)."""
    img, part, solid = r["img"], r["part"], r["solid"]
    m = np.isin(part, list(rig.OVER_PARTS)) & solid
    pad = np.pad(m, 1)
    near = pad[:-2, 1:-1] | pad[2:, 1:-1] | pad[1:-1, :-2] | pad[1:-1, 2:]
    keep = m | (near & (img[..., 3] > 0) & ~solid)
    out = img.copy()
    out[~keep] = 0
    return out


def render_cached(P, theta, shift, shear, over):
    os.makedirs(CACHE, exist_ok=True)
    k = _key(P, theta, shift, shear, over)
    fn = os.path.join(CACHE, k + ".npz")
    if os.path.exists(fn):
        d = np.load(fn)
        return k, d["base"], (d["over"] if d["over"].size else None)
    r = rig.render(P, theta, shift=(shift[0], -shift[1]), shear=shear)
    o = over_layer(r) if over else None
    np.savez_compressed(fn, base=r["img"], over=o if o is not None else np.zeros(0))
    return k, r["img"], o


# ---------------------------------------------------------------- roteiro: intro
def hold_list(specs, items):
    for it in items:
        specs.append(it)


def walk_frames(theta, t0, n, talk=0, shear="auto"):
    sh = shear_for(theta) if shear == "auto" else shear
    out = []
    for i in range(n):
        P, planted = po.walk((t0 + i / po.CYCLE) % 1.0)
        out.append(Spec(P, theta, planted, "feet", sh, talk=talk))
    return out


def stop_frames(theta, talk=0):
    out = []
    for k, h in ((0.2, 1), (0.4, 1), (0.6, 1), (0.8, 1), (1.0, 2)):
        P, planted = po.walk_stop(k)
        out.append(Spec(P, theta, planted, "feet", shear_for(theta), talk=talk, hold=h))
    return out


def start_frame(theta, talk=0, chair=0.0):
    P, planted = po.walk_start(0.5)
    return Spec(P, theta, planted, "feet", shear_for(theta), talk=talk, chair=chair)


def turn_frames(thetas, base=None, lead=0.3, talk=0, fix_to=None, start=None, holds=None):
    """Giro no lugar: θ por quadro, cabeça adiantada (`lead` × o quanto falta girar) e um pé que sobe 1 px no meio."""
    out = []
    end = thetas[-1]
    n = len(thetas)
    for i, th in enumerate(thetas):
        P = po.stand() if base is None else base()
        P["head_yaw"] = max(-28.0, min(28.0, (end - th) * lead))
        P["look"] = (1 if end > th else -1 if end < th else 0, 0) if i < n - 1 else (0, 0)
        if 0 < i < n - 1:
            s = "l" if i % 2 else "r"
            P["an_" + s] = P["an_" + s] + [0, 0.9 * math.sin(math.pi * i / (n - 1)), 0]
            po.legs_to(P)
        sp = Spec(P, th, {"l", "r"}, "pelvis", None, talk=talk, hold=(holds[i] if holds else 1))
        if fix_to is not None and start is not None:
            k = po.ease((i + 1) / n)
            sp.fix = tuple(np.asarray(start) + (np.asarray(fix_to) - np.asarray(start)) * k)
        out.append(sp)
    return out


def idle_frames(ticks, talk=0, theta=0.0, looks=None):
    """Parado respirando (ciclo de 2 s), piscadas a cada ~2,5 s e olhares ocasionais."""
    out = []
    i = 0
    while i < ticks:
        ph = (i / TICK) / 2.0
        blink = (i % 31) in (0, 1) and i > 4
        look = (0, 0)
        if looks:
            for a, b, lk in looks:
                if a <= i < b:
                    look = lk
        P = po.stand(breath=round(ph * 4) / 4, look=look, blink=blink)
        out.append(Spec(P, theta, {"l", "r"}, "fix", talk=talk, hold=1))
        i += 1
    return out


DIAG_THETA = 135.0                                # 3/4 de costas: anda para o fundo-direita
DIAG_N = 13
DIAG_TURN = [4, 20, 45, 70, 95, 115, 135]
STRAIGHTEN = (124, 112, 100, 92)


def intro():
    S = []
    # 1) entra pela esquerda andando (5 ciclos e meio) e para
    entry = (-25.0, float(scene3.PRESENT[1]))
    S += walk_frames(90, 0.0, 44)
    S += stop_frames(90)
    # 2) vira para o visitante com a cabeça adiantada; parado, respira, pisca; 1ª fala
    S += turn_frames([84, 72, 56, 38, 22, 10, 3, 0])
    S += idle_frames(int(5.6 * TICK), talk=1, looks=[(30, 40, (0.6, 0)), (40, 44, (0.3, 0))])
    # 3) vira para a mesa (para o fundo-direita) e anda em diagonal até o fundo, depois de lado até a cadeira
    S += turn_frames(DIAG_TURN, lead=0.3, talk=2)
    S.append(start_frame(DIAG_THETA, talk=2))
    S += walk_frames(DIAG_THETA, 0.875, DIAG_N, talk=2)
    t = (0.875 + DIAG_N / 8) % 1.0
    for th in STRAIGHTEN:                                  # endireita para a horizontal sem parar de andar
        S += walk_frames(th, t, 1, talk=2)
        t = (t + 1 / 8) % 1.0
    return entry, S, t




def finish_intro(entry, S, t_next):
    """Completa a intro depois de saber onde a diagonal terminou: anda até o ponto de puxar a cadeira, puxa, anda até
    SLOT, vira para a mesa e senta."""
    # anda na horizontal até ficar a ~5 px (a parada avança 5) de PULL_X, terminando em t≡0.375 (antes do contato)
    PULL_X = 94.0
    pos = solve(S, entry)
    n = 1
    while True:
        tl = (t_next + (n - 1) / 8) % 1.0
        trial = S + walk_frames(90, t_next, n, talk=2)
        if abs(tl - 0.375) < 1e-6:
            px = solve(trial + stop_frames(90, talk=2), entry)[-1][0]
            if px >= PULL_X - 1:
                break
        n += 1
        if n > 60:
            break
    S += walk_frames(90, t_next, n, talk=2)
    S += stop_frames(90, talk=2)
    pos = solve(S, entry)
    here = pos[-1]
    # 4) puxa a cadeira: o encosto estava 5 px mais para a direita (para dentro), vem junto com as mãos
    hand_x = here[0] + 9.0 + 1.7
    chair_final = 0.0
    reach_end = 4.0
    chair_start = chair_final + (9.0 - reach_end)
    for r in (0.35, 0.7, 1.0):                                       # estende as mãos até o encosto
        P, _ = po.pull_chair(0.0, release=1.0 - r)
        S.append(Spec(P, 90, {"l", "r"}, "pelvis", chair=chair_start, talk=2, hold=1))
    S[-1].hold = 2
    for k in (0.2, 0.45, 0.7, 0.9, 1.0):
        P, rz = po.pull_chair(k)
        S.append(Spec(P, 90, {"l", "r"}, "pelvis", chair=chair_final + (rz - reach_end), talk=2, hold=1))
    S[-1].hold = 2
    for r in (0.35, 0.7, 1.0):
        P, _ = po.pull_chair(1.0, release=r)
        S.append(Spec(P, 90, {"l", "r"}, "pelvis", chair=chair_final, talk=2))
    # 5) dois passos até a frente da cadeira (SLOT) e para
    S.append(start_frame(90, talk=2, chair=chair_final))
    S += [Spec(sp.pose, sp.theta, sp.planted, sp.mode, sp.shear, chair=chair_final, talk=2) for sp in walk_frames(90, 0.875, 5)]
    S += [Spec(sp.pose, sp.theta, sp.planted, sp.mode, sp.shear, chair=chair_final, talk=2, hold=sp.hold) for sp in stop_frames(90)]
    pos = solve(S, entry)
    # 6) vira de frente para a mesa e, no giro, acerta o passo até SLOT exato (correção ≤ 2 px)
    S += turn_frames([82, 68, 50, 32, 18, 9, SEAT_THETA], lead=0.25, talk=2, fix_to=SLOT, start=pos[-1])
    for sp in S[-7:]:
        sp.chair = chair_final
    # 7) senta (pés fixos em SLOT); as mãos passam por cima da mesa só quando chegam ao tampo
    for k, h in ((0.1, 1), (0.22, 1), (0.36, 1), (0.5, 1), (0.62, 1), (0.74, 1), (0.84, 1), (0.92, 1), (1.0, 2)):
        S.append(Spec(po.sit(k), SEAT_THETA, {"l", "r"}, "fix", over=k > 0.8, chair=chair_final, talk=2 if k < 0.9 else 0, hold=h, fix=tuple(SLOT)))
    for i in range(6):
        S.append(Spec(po.typing(0) if i > 3 else po.rest_hands(po.seated(breath=i / 6)), SEAT_THETA, over=True, chair=chair_final, hold=2, fix=tuple(SLOT)))
    return S, {"chair_start": chair_start, "chair_final": chair_final, "pull_x": float(here[0]), "hand_x": float(hand_x)}


# ---------------------------------------------------------------- roteiro: loop sentado (~40 s)
def seat_spec(P, hold=1, mug="desk"):
    return Spec(P, SEAT_THETA, {"l", "r"}, "fix", over=True, mug=mug, hold=hold, fix=tuple(SLOT))


def typing_block(seconds, fps=6, variant="normal", blink_every=2.6):
    out = []
    n = int(seconds * fps)
    hold = max(1, round(TICK / fps))
    for i in range(n):
        t = i / fps
        kw = {}
        if variant == "down":
            kw = dict(pitch=-5.0, look=(0.2, 1))           # olha o teclado com os olhos, a cabeça baixa pouco (v2)
        elif variant == "fast":
            kw = dict(look=(0.8, 0))
        blink = (t % blink_every) < 1 / fps and t > 0.5
        out.append(seat_spec(po.typing(i, speed=1.2 if variant == "fast" else 1.0, blink=blink, breath=(t / 3.0) % 1, **kw), hold))
    return out


def loop():
    L = []
    L += typing_block(3.0)
    # olha de um monitor para o outro (cabeça e olhos), volta
    for yaw, lx, h in ((14, 1, 2), (22, 1, 2), (30, 1, 4), (36, 1, 8), (30, 0, 2), (20, -1, 3), (12, -1, 6), (10, 0, 2)):
        L.append(seat_spec(po.look_monitors(yaw, lx), h))
    L += typing_block(2.0, fps=12, variant="fast")
    L += typing_block(1.6, variant="down")
    # mouse
    for i in range(12):
        L.append(seat_spec(po.mouse(i % 6), 2))
    L += typing_block(2.4)
    # comemora discretamente: percebe, soquinho curto, volta
    L.append(seat_spec(po.look_monitors(24, 1), 4))
    for k in (0.35, 0.7, 1.0):
        L.append(seat_spec(po.celebrate(k), 1))
    for pump, h in ((1.0, 2), (0.0, 2), (1.0, 2), (0.0, 3)):
        L.append(seat_spec(po.celebrate(1.0, pump), h))
    for k in (0.7, 0.35):
        L.append(seat_spec(po.celebrate(k), 1))
    L += typing_block(3.0)
    # café: olha a caneca, pega, leva à boca, bebe, desce, devolve no mesmo lugar, volta ao teclado
    for k in (0.5, 1.0):
        L.append(seat_spec(po.coffee("look", k), 2))
    for k in (0.3, 0.6, 0.85, 1.0):
        L.append(seat_spec(po.coffee("reach", k), 1))
    L[-1].hold = 3
    for k in (0.4, 0.8, 1.0):
        L.append(seat_spec(po.coffee("lift", k), 1, mug="hand"))
    for k in (0.3, 0.6, 0.85, 1.0):
        L.append(seat_spec(po.coffee("mouth", k), 1, mug="hand"))
    for k, h in ((0.5, 2), (1.0, 10), (0.6, 2)):
        L.append(seat_spec(po.coffee("sip", k), h, mug="hand"))
    for k in (0.3, 0.6, 1.0):
        L.append(seat_spec(po.coffee("lower", k), 1, mug="hand"))
    for k in (0.5, 1.0):
        L.append(seat_spec(po.coffee("place", k), 1, mug="hand"))
    L[-1].hold = 3
    for k in (0.3, 0.6, 1.0):
        L.append(seat_spec(po.coffee("back", k), 1))
    L += typing_block(3.0)
    # coça a cabeça (algo não funcionou)
    L.append(seat_spec(po.look_monitors(26, 1), 5))
    for k in (0.35, 0.7, 1.0):
        L.append(seat_spec(po.scratch_head(k), 1))
    for ph in range(6):
        L.append(seat_spec(po.scratch_head(1.0, ph), 2))
    for k in (0.7, 0.35):
        L.append(seat_spec(po.scratch_head(k), 1))
    L += typing_block(2.4, variant="down")
    L += typing_block(2.0)
    # coça a nuca
    for k in (0.35, 0.7, 1.0):
        L.append(seat_spec(po.scratch_neck(k), 1))
    for ph in range(5):
        L.append(seat_spec(po.scratch_neck(1.0, ph), 2))
    for k in (0.7, 0.35):
        L.append(seat_spec(po.scratch_neck(k), 1))
    L += typing_block(3.0)
    # recosta, respira, volta
    for k in (0.25, 0.5, 0.75, 1.0):
        L.append(seat_spec(po.lean_back(k), 2))
    L.append(seat_spec(po.lean_back(1.0), 10))
    L[-1].pose["blink"] = False
    L.append(seat_spec(dict(po.lean_back(1.0), blink=True), 2))
    for k in (0.75, 0.5, 0.25):
        L.append(seat_spec(po.lean_back(k), 2))
    L += typing_block(2.0)
    return L


# ---------------------------------------------------------------- atlas + trilhas
def build_track(specs, start, frames, keys):
    pos = solve(specs, start)
    track = []
    for sp, W in zip(specs, pos):
        O = np.floor(W + 0.5)
        shift = np.round((W - O) * 4) / 4                    # 1/4 px (= superamostragem)
        O = O.astype(int)
        k, base, over = render_cached(sp.pose, sp.theta, shift, sp.shear, sp.over)
        if k not in keys:
            keys[k] = len(frames)
            frames.append((base, over))
        idx = keys[k]
        rec = [idx, int(O[0]), int(O[1]), int(round(sp.chair)), 1 if sp.mug == "hand" else 0, sp.talk]
        for _ in range(sp.hold):
            track.append(rec)
    return track


def runs(track):
    out = []
    for rec in track:
        if out and out[-1][1:] == rec:
            out[-1][0] += 1
        else:
            out.append([1] + rec)
    return out


def trim(im):
    a = im[..., 3]
    ys, xs = np.nonzero(a)
    if not len(xs):
        return None
    return xs.min(), ys.min(), xs.max() + 1, ys.max() + 1


def pack(frames):
    """Empacota base e camada sobre a mesa recortadas (prateleiras de largura fixa)."""
    _, foot = rig.cell_for(1)
    items = []
    for i, (b, o) in enumerate(frames):
        for layer, im in (("b", b), ("o", o)):
            if im is None:
                continue
            bb = trim(im)
            if bb:
                items.append((i, layer, im[bb[1]:bb[3], bb[0]:bb[2]], bb[0] - foot[0], bb[1] - foot[1]))
    items.sort(key=lambda it: -it[2].shape[0])
    WMAX, x, y, rowh = 1024, 0, 0, 0
    placed = []
    for it in items:
        h, w = it[2].shape[:2]
        if x + w > WMAX:
            x, y, rowh = 0, y + rowh + 1, 0
        placed.append((it, x, y))
        x += w + 1
        rowh = max(rowh, h)
    atlas = np.zeros((y + rowh, WMAX, 4), np.uint8)
    meta = [{"b": None, "o": None} for _ in frames]
    for (i, layer, im, ox, oy), x, y in placed:
        h, w = im.shape[:2]
        atlas[y:y + h, x:x + w] = im
        meta[i][layer] = [x, y, w, h, int(ox), int(oy)]
    used = max(y + it[2].shape[0] for it, x, y in placed)
    return atlas[:used], meta


def arm_report(specs, label):
    """QA das poses: mão que não chega ao alvo, cotovelo dentro do tronco, braço travado reto ou dobrado demais."""
    bad = 0
    for i, sp in enumerate(specs):
        for side, st in (sp.pose.get("_strain") or {}).items():
            if st["miss"] > 0.35 or st["elbow_in_torso"] or st["angle"] > po.ELBOW_MAX - 0.5 or st["angle"] < po.ELBOW_MIN + 0.5:
                bad += 1
                print("  [braço] %s #%d lado %s: %s" % (label, i, side, st))
    print("braços %s: %d problema(s) em %d poses" % (label, bad, len(specs)))
    return bad


def build():
    entry, S, t = intro()
    S, info = finish_intro(entry, S, t)
    L = loop()
    arm_report(S, "intro")
    arm_report(L, "loop")
    frames, keys = [], {}
    t_intro = build_track(S, entry, frames, keys)
    t_loop = build_track(L, tuple(SLOT), frames, keys)
    atlas, meta = pack(frames)
    os.makedirs(ASSETS, exist_ok=True)
    Image.fromarray(atlas).save(os.path.join(ASSETS, "actor.png"), optimize=True)
    data = {"tick": TICK, "frames": meta, "intro": runs(t_intro), "loop": runs(t_loop), "slot": SLOT.tolist(),
            "mug": list(scene3.MUG), "monitors": scene3.monitor_rims(), "info": info}
    # camadas do quarto atual (idênticas à v2, cadeira separada) e pôster v3 (sentado digitando) para movimento reduzido
    L = scene3.layers()
    for name in ("bg", "chair", "desk", "monitors", "mug"):
        im = L[name].convert("RGB") if name == "bg" else L[name]
        im.save(os.path.join(ASSETS, name + ".png"), optimize=True)
    import preview
    rec = t_loop[0]
    preview.compose(L, frames, rec).convert("RGB").save(os.path.join(ASSETS, "poster-final.png"), optimize=True)
    with open(os.path.join(ASSETS, "actor.json"), "w") as f:
        json.dump(data, f, separators=(",", ":"))
    print("quadros únicos:", len(frames), " intro: %.1f s" % (len(t_intro) / TICK), " loop: %.1f s" % (len(t_loop) / TICK),
          " atlas:", atlas.shape[1], "x", atlas.shape[0], os.path.getsize(os.path.join(ASSETS, "actor.png")), "bytes")
    return data, frames, t_intro, t_loop


if __name__ == "__main__":
    build()
