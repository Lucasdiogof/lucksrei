"""Prévias do personagem híbrido que não estão na trilha do site: rotação completa nos dois sentidos, caminhada para
os dois lados (com começar/parar) e sentar → digitar → levantar. Tamanho real (2×) e ampliado.
Uso: python3 tools/hero3/hybrid_preview.py  → tools/hero3/out/preview/hibrido-*.mp4|gif"""
import os
import sys

from PIL import Image, ImageDraw

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import hybrid_anims as A  # noqa: E402
import hybrid_frames as H  # noqa: E402
import preview  # noqa: E402
import scene3  # noqa: E402

OUT = preview.OUT


def neutral(reg, track, size=(200, 90), ground=82):
    imgs = []
    for idx, x, y, *_ in track:
        im = Image.new("RGBA", size, (34, 38, 54, 255))
        d = ImageDraw.Draw(im)
        d.line([(0, ground + 1), (size[0], ground + 1)], fill=(60, 66, 92))
        for gx in range(0, size[0], 8):
            d.point((gx, ground + 2), fill=(90, 98, 130))
        b, o = reg.frames[idx]
        preview.place(im, b, x, y)
        preview.place(im, o, x, y)
        imgs.append(im)
    return imgs


if __name__ == "__main__":
    # 1) rotação completa: 0 → 180 (direita) → 0 → −180 (esquerda, espelho) → 0, cabeça um passo à frente
    reg = A.Reg()
    T = A.Track(reg)
    T.x, T.y = 100, 82
    A.idle_front(T, 10)
    ang = [22.5, 45, 67.5, 90, 112.5, 135, 157.5, 180]
    A.turn(T, ang, ang[1:] + [180], 3)
    A.turn(T, ang[::-1][1:] + [0], ang[::-1][2:] + [0, 0], 3)
    A.idle_front(T, 8)
    neg = [-a for a in ang]
    for a, h in zip(neg, neg[1:] + [-180]):
        T.put(("body", a, h), lambda a=a, h=h: H.body(a, head_angle=h), 3)
    for a, h in zip(neg[::-1][1:] + [0], neg[::-1][2:] + [0, 0]):
        if a == 0:
            T.put(("front", 0), lambda: H.v2_front(), 3)
        else:
            T.put(("body", a, h), lambda a=a, h=h: H.body(a, head_angle=h), 3)
    A.idle_front(T, 10)
    imgs = neutral(reg, T.t)
    preview.write_video(imgs, os.path.join(OUT, "hibrido-rotacao-2x"), A.TICK, 2)
    preview.write_video(imgs, os.path.join(OUT, "hibrido-rotacao-5x"), A.TICK, 5)

    # 2) caminhada nos dois lados: para → começa → anda → para → vira (pela frente) → anda para a esquerda → para
    reg2 = A.Reg()
    T = A.Track(reg2)
    T.x, T.y = 30, 82
    T.put(("stand",), lambda: H.v2_stand(), 8)
    A.start_right(T)
    A.walk_right(T, range(0, 13))
    A.stop_right(T)
    T.put(("stand",), lambda: H.v2_stand(), 6)
    A.turn(T, [67.5, 45, 22.5, 0, -22.5, -45, -67.5], [45, 22.5, 0, 0, -22.5, -45, -67.5])
    T.put(("stand_l",), lambda: (H.mirror(H.v2_stand()[0]), None), 6)
    for (fr, adv), j in zip(H.walk_start(), range(9)):
        T.x -= adv
        T.put(("start_l", j), lambda fr=fr: (H.mirror(fr[0]), None), T.walk_tick())
    T.x -= 1 - 3
    for i in range(0, 13):
        T.x -= 3
        T.put(("walk_l", i % 8), lambda i=i: (H.mirror(H.v2_walk(i)[0]), None), T.walk_tick())
    for (fr, adv), j in zip(H.walk_stop(), range(9)):
        T.x -= adv
        T.put(("stop_l", j), lambda fr=fr: (H.mirror(fr[0]), None), T.walk_tick())
    T.put(("stand_l",), lambda: None, 10)
    imgs = neutral(reg2, T.t)
    preview.write_video(imgs, os.path.join(OUT, "hibrido-andar-dois-lados-2x"), A.TICK, 2)
    preview.write_video(imgs, os.path.join(OUT, "hibrido-andar-dois-lados-4x"), A.TICK, 4)

    # 3) no quarto: vira para a mesa, senta (v2), digita, levanta (v2) e fica de frente
    reg3 = A.Reg()
    T = A.Track(reg3)
    T.x, T.y = A.SLOT
    T.put(("stand",), lambda: H.v2_stand(), 6)
    A.turn(T, [67.5, 45, 22.5], [67.5, 45, 45])
    for i, h in zip(range(8), [2, 2, 1, 1, 1, 1, 2, 3]):
        T.put(("sit", i), lambda i=i: H.v2_sit(i), h)
    A.typing(T, 2.5)
    for i, h in zip(range(7), [2, 2, 1, 1, 1, 2, 3]):
        T.put(("up", i), lambda i=i: H.v2_standup(i), h, x=A.SLOT[0], y=A.SLOT[1])
    A.turn(T, [22.5], [0])
    A.idle_front(T, 14)
    L = scene3.layers()
    imgs = [preview.compose(L, reg3.frames, r) for r in T.t]
    preview.write_video(imgs, os.path.join(OUT, "hibrido-sentar-digitar-levantar-2x"), A.TICK, 2)
    preview.write_video([im.crop((70, 50, 160, 140)) for im in imgs], os.path.join(OUT, "hibrido-sentar-digitar-levantar-zoom4x"), A.TICK, 4)
    print("ok")
