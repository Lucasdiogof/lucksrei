"""Hero v3 híbrido — trilhas da intro e do loop com os quadros de hybrid_frames.py (arte da v2).

Mesma história e mesmos pontos da v2 (ENTRY → PRESENT, mesa, SLOT), com o que faltava na v2: giro com quadros
intermediários (cabeça um passo à frente do corpo), começar/parar de andar, andar em 3/4 de costas até o fundo,
sentar a partir do giro (sem puxar a cadeira), e um loop sentado mais rico — digitar (v2), olhar os monitores, mouse,
comemorar, café, coçar a cabeça e a nuca — com quadros intermediários entre as poses-chave da v2.
Velocidades da v2: andar 3 px por quadro a 10 quadros/s (padrão de tiques 1,1,1,1,2 a 12 tiques/s).

Saída no formato que assets/js/hero-v3.js lê: assets/img/hero/v3/actor.png + actor.json (+ camadas do quarto e pôster).
Uso: python3 tools/hero3/hybrid_anims.py
"""
import json
import os
import sys

import numpy as np
from PIL import Image

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
import anims  # noqa: E402  (empacotamento do atlas e trilhas: mesmo formato)
import hybrid_frames as H  # noqa: E402
import scene3  # noqa: E402
import v2art  # noqa: E402

TICK = 12
WALK_TICKS = [1, 1, 1, 1, 2]           # 10 quadros/s da v2 em 12 tiques/s
SLOT = tuple(scene3.SLOT)
OPENING = 0.6                                       # s de quarto vazio antes de ele entrar (era 3,5: demorava demais)
PRESENT = (66, 140)
HIP = (34, 52)                          # quadril sentado da v2 (SEAT_HIP_CELL)


class Reg:
    """Registro de quadros por chave (desenha uma vez só)."""

    def __init__(self):
        self.frames, self.keys = [], {}

    def get(self, key, fn):
        if key not in self.keys:
            b, o = fn()
            self.keys[key] = len(self.frames)
            self.frames.append((np.array(b), np.array(o) if o is not None else None))
        return self.keys[key]


class Track:
    def __init__(self, reg):
        self.reg, self.t = reg, []
        self.x, self.y, self.chair, self.mug, self.talk = 0, 0, 0, 0, 0
        # estado da luz das telas (o runtime do cenário v3 anima): 0 nenhum, 1 digitando, 2 build ok (verde),
        # 3 telas em espera (antes de sentar), 4 calmo (parado/café), 5 build rodando (pulso), 6 build falhou (âmbar),
        # 7 café olhando a janela (calmo + uma janela da cidade acende)
        self.fx = 3
        self.n_walk = 0

    def put(self, key, fn, ticks=1, x=None, y=None):
        if x is not None:
            self.x = x
        if y is not None:
            self.y = y
        idx = self.reg.get(key, fn)
        for _ in range(ticks):
            self.t.append([idx, int(round(self.x)), int(round(self.y)), int(round(self.chair)), self.mug, self.talk, self.fx])

    def walk_tick(self):
        k = WALK_TICKS[self.n_walk % 5]
        self.n_walk += 1
        return k


# ---------------------------------------------------------------- blocos de movimento
def turn(T, angles, heads, ticks=2):
    """Giro no lugar: corpo nos ângulos dados, cabeça nos ângulos `heads` (um passo à frente)."""
    for a, h in zip(angles, heads):
        if a == 0:
            T.put(("front", 0), lambda: H.v2_front(), ticks)
        elif a == 90 and h == 90:
            T.put(("stand",), lambda: H.v2_stand(), ticks)
        else:
            T.put(("body", a, h), lambda a=a, h=h: H.body(a, head_angle=h), ticks)


def idle_front(T, ticks):
    for i in range(ticks):
        if (i % 31) in (20, 21):
            T.put(("front", "blink"), lambda: H.v2_front(blink=True))
        elif (i // 6) % 4 == 2:
            T.put(("front", 1), lambda: H.v2_front(bob=1))
        else:
            T.put(("front", 0), lambda: H.v2_front())


def walk_right(T, frames):
    """Quadros da caminhada da v2 (i0..), 3 px por quadro."""
    for i in frames:
        T.x += 3
        T.put(("walk", i % 8), lambda i=i: H.v2_walk(i), T.walk_tick())


def start_right(T):
    for (fr, adv), j in zip(H.walk_start(), range(9)):
        T.x += adv
        T.put(("start", j), lambda fr=fr: fr, T.walk_tick())
    T.x += 1 - 3                                        # o quadro 0 da v2 vem logo depois (+1 desde o passo)


def stop_right(T):
    for (fr, adv), j in zip(H.walk_stop(), range(9)):
        T.x += adv
        T.put(("stop", j), lambda fr=fr: fr, T.walk_tick())


def back_walk(T, i0, n):
    for i in range(i0, i0 + n):
        T.x += H.BACK_STEP[0]
        T.y += H.BACK_STEP[1]
        T.put(("back", i % 8), lambda i=i: H.back_walk(i), T.walk_tick())


# ---------------------------------------------------------------- sentado: poses-chave da v2 e intermediários
REST_L, REST_R = H.rest_arms()
HEAD_22L = [r[::-1] for r in v2art.HEAD_22]          # cabeça a 22,5° para a ESQUERDA (olhar a janela)


def seat(T, L, R, ticks=1, head="frontd", rows=None, look=None, hdx=0, hdy=0, blink=False, mug=None, mug_hand=False):
    key = ("seat", L, R, head, None if rows is None else id(rows), look, hdx, hdy, blink, mug)
    T.mug = 1 if mug_hand else 0
    T.put(key, lambda: H.seated(L, R, head_rows=rows, head=head, hdx=hdx, hdy=hdy, blink=blink, mug=mug, look=look),
          ticks, x=SLOT[0], y=SLOT[1])


def ease(t):
    return t * t * (3 - 2 * t)


def tween_left(T, A, B, n, **kw):
    """n quadros do braço esquerdo de A para B (com suavização), braço direito em repouso."""
    for j in range(1, n + 1):
        seat(T, H.arm_mix(A, B, ease(j / n)), REST_R, **kw)


def typing(T, seconds, fps=6, head="frontd", hdy=0, blink_every=2.6):
    T.fx = 1
    hold = max(1, round(TICK / fps))
    n = int(seconds * fps)
    for i in range(n):
        t = i / fps
        L, R = H.type_arms(i)
        seat(T, L, R, hold, head=head, hdy=hdy, blink=(t % blink_every) < 1 / fps and t > 0.5)


def look_monitors(T):
    T.fx = 1
    series = [(v2art.FRONT, (0.6, 0), 2), (v2art.HEAD_22, (1, 0), 3), (v2art.THREEQ, (1, 0), 10),
              (v2art.HEAD_22, (1, 0), 3), (v2art.HEAD_22, (0, 0), 3), (v2art.FRONT, (0, 1), 3)]
    for rows, look, ticks in series:
        seat(T, REST_L, REST_R, ticks, rows=rows, look=look)


def mouse(T):
    """Mão direita do teclado até o mouse, que fica no vão do tampo embaixo do monitor da esquerda (ao lado do pé —
    visível no cenário v3), pequenos movimentos e cliques, e volta. O antebraço sai de baixo do monitor até a mão."""
    T.fx = 1
    MOUSE = ((44, 48), (34, 57), "keys")
    for j in (1, 2, 3):
        seat(T, REST_L, H.arm_mix(REST_R, MOUSE, ease(j / 3)), 1 if j < 3 else 2, rows=v2art.HEAD_22, look=(1, 1))
    for k in range(8):
        d = [(0, 0), (1, 0), (1, 0), (0, 1), (-1, 1), (-1, 0), (0, 0), (0, 0)][k]
        m = ((44, 48), (34 + d[0], 57 + d[1]), "keys")
        seat(T, REST_L, m, 2 if k < 6 else 3, rows=v2art.HEAD_22, look=(1, 0) if k % 3 else (1, 1))
    for j in (1, 2, 3):
        seat(T, REST_L, H.arm_mix(MOUSE, REST_R, ease(j / 3)), 1 if j < 3 else 2, rows=v2art.HEAD_22, look=(0.5, 1))


def celebrate(T):
    T.fx = 2
    K = [((20, 41), (21, 33), "fist"), ((19, 37), (21, 27), "fist"), ((20, 41), (21, 34), "fist")]
    seat(T, REST_L, REST_R, 4, head="front")
    tween_left(T, REST_L, K[0], 2, head="front")
    seat(T, K[1], REST_R, 2, head="front", hdy=-1)
    seat(T, K[2], REST_R, 2, head="front")
    seat(T, K[1], REST_R, 2, head="front", hdy=-1)
    seat(T, K[2], REST_R, 3, head="front")
    tween_left(T, K[2], REST_L, 3, head="front")


def coffee(T):
    T.fx = 4
    _coffee(T)


def _coffee(T, window=False):
    """Caneca da v2 em MUG (célula (15, 54)): olha, a mão vai em arco, pega pela alça, levanta, leva à boca, bebe,
    desce, devolve no mesmo lugar e volta ao teclado. Quadros-chave da v2 + intermediários."""
    R1 = ((21, 47), (19, 53), "open")
    R2 = ((20, 48), (15, 56), "grip")
    HOLD = ((20, 46), (15, 52), "grip")
    MID = ((19, 42), (22, 38), "grip")
    D1 = ((19, 37), (26, 30), "grip")
    D2 = ((19, 36), (27, 29), "grip")
    seat(T, REST_L, REST_R, 2, head="frontd", look=(-1, 1), rows=v2art.FRONT)
    seat(T, H.arm_mix(REST_L, R1, 0.5), REST_R, 1, rows=v2art.FRONT, look=(-1, 1), hdx=-1)
    seat(T, R1, REST_R, 1, rows=v2art.FRONT, look=(-1, 1), hdx=-1)
    seat(T, R2, REST_R, 3, rows=v2art.FRONT, look=(-1, 1), hdx=-1)
    seat(T, HOLD, REST_R, 2, rows=v2art.FRONT, look=(-0.5, 1), mug=(15, 50, 0), mug_hand=True)
    seat(T, H.arm_mix(HOLD, MID, 0.5), REST_R, 1, rows=v2art.FRONT, look=(0, 0), mug=(18, 44, 0), mug_hand=True)
    seat(T, MID, REST_R, 1, rows=v2art.FRONT, look=(0, 0), mug=(22, 36, 0), mug_hand=True)
    seat(T, D1, REST_R, 2, head="front", mug=(26, 26, 0), mug_hand=True)
    for _ in range(2):
        seat(T, D2, REST_R, 5, head="front", hdy=-1, blink=True, mug=(27, 25, 1), mug_hand=True)
        seat(T, D1, REST_R, 2, head="front", mug=(26, 26, 0), mug_hand=True)
    seat(T, MID, REST_R, 2, rows=v2art.FRONT, look=(-0.5, 1), mug=(22, 36, 0), mug_hand=True)
    if window:                                        # vira a cabeça para a janela (esquerda) com a caneca na mão
        seat(T, MID, REST_R, 2, rows=v2art.FRONT, look=(-1, -1), mug=(22, 36, 0), mug_hand=True)
        seat(T, MID, REST_R, int(1.6 * TICK), rows=HEAD_22L, look=(-1, -1), mug=(22, 36, 0), mug_hand=True)
        seat(T, MID, REST_R, 1, rows=HEAD_22L, look=(-1, -1), blink=True, mug=(22, 36, 0), mug_hand=True)
        seat(T, MID, REST_R, int(0.8 * TICK), rows=HEAD_22L, look=(-1, -1), mug=(22, 36, 0), mug_hand=True)
        seat(T, MID, REST_R, 2, rows=v2art.FRONT, look=(-0.5, 0), mug=(22, 36, 0), mug_hand=True)
    seat(T, H.arm_mix(MID, HOLD, 0.5), REST_R, 1, rows=v2art.FRONT, look=(-1, 1), mug=(18, 44, 0), mug_hand=True)
    seat(T, HOLD, REST_R, 2, rows=v2art.FRONT, look=(-1, 1), mug=(15, 50, 0), mug_hand=True)
    seat(T, R2, REST_R, 2, rows=v2art.FRONT, look=(-1, 1), hdx=-1)
    seat(T, R1, REST_R, 1, rows=v2art.FRONT, look=(-1, 1), hdx=-1)
    seat(T, H.arm_mix(R1, REST_L, 0.5), REST_R, 1, rows=v2art.FRONT, look=(0, 1))
    seat(T, REST_L, REST_R, 2)


def scratch_head(T, fx=1):
    T.fx = fx
    K = [((20, 30), (24, 23), "open"), ((19, 25), (27, 17), "open"), ((19, 26), (26, 18), "open")]
    seat(T, REST_L, REST_R, 4, rows=v2art.HEAD_22, look=(1, 0))
    seat(T, REST_L, REST_R, 3, rows=v2art.FRONT, look=(0.5, -1))
    tween_left(T, REST_L, K[0], 2, head="front", hdx=1)
    seat(T, K[0], REST_R, 1, head="front", hdx=1)
    for j in range(3):
        seat(T, K[1], REST_R, 2, head="front", hdx=1)
        seat(T, K[2], REST_R, 2, head="front", hdx=1, hdy=1)
    seat(T, K[0], REST_R, 1, head="front", hdx=1)
    tween_left(T, K[0], REST_L, 2, head="front")
    seat(T, REST_L, REST_R, 3, rows=v2art.HEAD_22, look=(1, 0))


def scratch_neck(T):
    K = [((18, 36), (25, 28), "open"), ((18, 33), (28, 25), "open"), ((18, 34), (27, 26), "open")]
    tween_left(T, REST_L, K[0], 2, head="front")
    for j in range(3):
        seat(T, K[1], REST_R, 2, head="front", hdy=1)
        seat(T, K[2], REST_R, 2, head="front", hdy=1)
    tween_left(T, K[0], REST_L, 2, head="front")


def seated_idle(T, ticks, fx=4):
    T.fx = fx
    for i in range(ticks):
        seat(T, REST_L, REST_R, 1, head="frontd", hdy=1 if (i // 8) % 3 == 1 else 0, blink=(i % 30) in (12, 13))


def wake_mouse(T):
    """Fase E: sentado com as telas em espera, a mão direita vai ao mouse; no toque as telas acordam (fx 3 → 1)."""
    MOUSE = ((44, 48), (34, 57), "keys")
    T.fx = 3
    for j in (1, 2, 3):
        seat(T, REST_L, H.arm_mix(REST_R, MOUSE, ease(j / 3)), 1 if j < 3 else 2, rows=v2art.HEAD_22, look=(1, 1))
    T.fx = 1
    for k in range(5):
        d = [(0, 0), (1, 0), (1, 1), (0, 1), (0, 0)][k]
        seat(T, REST_L, ((44, 48), (34 + d[0], 57 + d[1]), "keys"), 2, rows=v2art.HEAD_22, look=(1, 0) if k else (1, 1))
    seat(T, REST_L, MOUSE, 4, rows=v2art.HEAD_22, look=(1, 0))         # olha as telas acendendo
    for j in (1, 2, 3):
        seat(T, REST_L, H.arm_mix(MOUSE, REST_R, ease(j / 3)), 1 if j < 3 else 2, rows=v2art.HEAD_22, look=(0.5, 1))


def build_run(T, seconds=1.6):
    """Fase E: o build roda — ele para de digitar e olha o monitor; a luz pulsa devagar (fx 5)."""
    T.fx = 5
    seat(T, REST_L, REST_R, 2, rows=v2art.FRONT, look=(0.6, 0))
    seat(T, REST_L, REST_R, int(seconds * TICK) - 2, rows=v2art.HEAD_22, look=(1, 0))


def build_ok(T):
    build_run(T)
    celebrate(T)


def build_fail(T):
    build_run(T)
    T.fx = 6
    seat(T, REST_L, REST_R, 4, rows=v2art.HEAD_22, look=(1, 1), blink=True)
    scratch_head(T, fx=6)


def coffee_window(T):
    """Fase E: café olhando pela janela (à esquerda) — os olhos vão para a janela com a caneca no peito; uma janela
    da cidade acende (fx 7, runtime)."""
    T.fx = 7
    _coffee(T, window=True)


# ---------------------------------------------------------------- intro e loop
def intro(reg):
    T = Track(reg)
    # 0) abertura (Fase E): o quarto vazio à noite, telas em espera, vapor na caneca; ele ainda fora de quadro
    T.x, T.y = PRESENT[0] - 8 - 3 * 23 - 3 - 30, PRESENT[1]
    T.put(("walk", 0), lambda: H.v2_walk(0), int(OPENING * TICK))
    # 1) entra andando (quadros da v2), para com o passo de parada
    T.x, T.y = PRESENT[0] - 8 - 3 * 23 - 3, PRESENT[1]   # x = −14: começa logo fora da borda (entrada da v2)
    walk_right(T, range(5, 29))                       # termina no quadro 4 (pé de longe à frente), como antes
    stop_right(T)                                     # +3 +3 +2 → x = PRESENT
    T.put(("stand",), lambda: H.v2_stand(), 3)
    # 2) vira para o visitante (cabeça adiantada) e fala
    turn(T, [67.5, 45, 22.5, 0], [45, 22.5, 0, 0])
    T.talk = 1
    idle_front(T, int(5.6 * TICK))
    # 3) vira para o fundo-direita (passando pelo perfil) e anda em 3/4 de costas até o fundo
    T.talk = 2
    turn(T, [22.5, 45, 67.5, 90, 112.5, 135], [45, 67.5, 90, 112.5, 135, 135])
    back_walk(T, 2, 9)
    T.put(("body", 135, 135), lambda: H.body(135), 2)
    turn(T, [112.5, 90], [90, 90])
    # 4) anda até a cadeira (começa, 5 passos, para)
    start_right(T)
    walk_right(T, range(0, 5))
    stop_right(T)
    # 5) passo lateral até a frente da cadeira (SLOT), vira para a mesa e senta (quadros da v2). Sem puxar a cadeira:
    #    o gesto de puxar ficou duro (pedido do usuário), a cadeira já está no lugar.
    x0 = T.x
    T.put(("stand",), lambda: H.v2_stand(), 2)
    T.put(("side_step",), lambda: H.side_pose(near=(2, "flat", 1), far=(0, "flat", 0)), 2, x=x0 + 2)
    T.put(("stand",), lambda: H.v2_stand(), 2, x=SLOT[0], y=SLOT[1])
    turn(T, [67.5, 45, 22.5], [67.5, 45, 45])
    for i, h in zip(range(8), [2, 2, 1, 1, 1, 1, 2, 3]):
        T.put(("sit", i), lambda i=i: H.v2_sit(i), h)
    T.talk = 0
    seated_idle(T, 8, fx=3)                           # sentou com as telas ainda em espera
    wake_mouse(T)                                     # toca o mouse: as telas acordam (rampa no runtime)
    T.fx = 1
    return T.t


def loop(reg):
    """Duas tomadas que se alternam (Fase E): A — build passa (verde + comemoração), café olhando a janela;
    B — build falha (âmbar + coça a cabeça), café comum. Começa e termina digitando: emenda sem corte."""
    T = Track(reg)
    # tomada A
    typing(T, 3.0)
    seated_idle(T, 5)
    typing(T, 1.2, head="frontd", hdy=1)
    typing(T, 2.4, fps=7)
    look_monitors(T)
    typing(T, 2.0, fps=12)
    mouse(T)
    typing(T, 2.0)
    build_ok(T)
    typing(T, 2.4)
    typing(T, 1.0, head="frontd", hdy=1)
    coffee_window(T)
    typing(T, 3.0)
    scratch_neck(T)
    typing(T, 2.0, fps=7)
    seated_idle(T, 12)
    # tomada B
    typing(T, 2.6)
    look_monitors(T)
    typing(T, 2.4, fps=7)
    mouse(T)
    typing(T, 2.0, fps=12)
    build_fail(T)
    typing(T, 2.4)
    typing(T, 1.0, head="frontd", hdy=1)
    coffee(T)
    typing(T, 3.0)
    scratch_neck(T)
    typing(T, 2.0, fps=7)
    seated_idle(T, 12)
    return T.t


def build():
    reg = Reg()
    Track.fx_default = 3
    t_intro, t_loop = intro(reg), loop(reg)
    frames = reg.frames
    atlas, meta = anims.pack(frames)
    os.makedirs(anims.ASSETS, exist_ok=True)
    Image.fromarray(atlas).save(os.path.join(anims.ASSETS, "actor.png"), optimize=True)
    L = scene3.layers()
    for name in ("bg", "chair", "desk", "monitors", "mug"):
        (L[name].convert("RGB") if name == "bg" else L[name]).save(os.path.join(anims.ASSETS, name + ".png"), optimize=True)
    # os pôsteres da página (assets/img/hero/poster-*.png) saem do canvas da cena v3: tools/hero3/qa/posters.cjs
    data = {"tick": TICK, "frames": meta, "intro": anims.runs(t_intro), "loop": anims.runs(t_loop), "slot": list(SLOT),
            "mug": list(scene3.MUG), "monitors": scene3.monitor_rims(), "info": {"kind": "hybrid-v2"}}
    with open(os.path.join(anims.ASSETS, "actor.json"), "w") as f:
        json.dump(data, f, separators=(",", ":"))
    print("quadros únicos:", len(frames), " intro: %.1f s" % (len(t_intro) / TICK), " loop: %.1f s" % (len(t_loop) / TICK),
          " atlas:", atlas.shape[1], "x", atlas.shape[0], os.path.getsize(os.path.join(anims.ASSETS, "actor.png")), "bytes")
    return data, frames, t_intro, t_loop


if __name__ == "__main__":
    build()
