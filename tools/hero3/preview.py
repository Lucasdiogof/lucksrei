"""Hero v3 — prévias animadas do personagem (no quarto atual e isolado) para revisão visual.

Compõe cada tique na MESMA ordem do runtime (bg → cadeira → corpo → mesa → caneca → braços sobre a mesa → monitores) e
grava MP4 (H.264) e GIF em tamanho real do site (480×300 = 2×) e ampliado. Também gera folhas quadro a quadro.

Uso: python3 tools/hero3/preview.py [cena|isolado|tudo]   (depois de tools/hero3/anims.py)
Saída: tools/hero3/out/preview/*.mp4|*.gif|*.png
"""
import math
import os
import subprocess
import sys

import numpy as np
from PIL import Image, ImageDraw

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import anims  # noqa: E402
import poses as po  # noqa: E402
import rig  # noqa: E402
import scene3  # noqa: E402

OUT = os.path.join(rig.OUT, "preview")
FFMPEG = os.environ.get("FFMPEG", "ffmpeg")
_, FOOT = rig.cell_for(1)


def place(canvas, im, x, y):
    if im is not None:
        canvas.alpha_composite(Image.fromarray(im), (int(x - FOOT[0]), int(y - FOOT[1])))


def compose(L, frames, rec, glow=True):
    idx, x, y, chair, mug_hand, talk = rec[:6]
    base, over = frames[idx]
    im = L["bg"].copy()
    ch = Image.new("RGBA", im.size, (0, 0, 0, 0))
    ch.alpha_composite(L["chair"], (int(chair), 0) if chair >= 0 else (0, 0)) if chair >= 0 else None
    if chair < 0:
        ch = L["chair"].transform(im.size, Image.AFFINE, (1, 0, -chair, 0, 1, 0))
    im.alpha_composite(ch)
    place(im, base, x, y)
    im.alpha_composite(L["desk"])
    if not mug_hand:
        im.alpha_composite(L["mug"])
    place(im, over, x, y)
    im.alpha_composite(L["monitors"])
    return im


def expand(runs):
    out = []
    for r in runs:
        out += [r[1:]] * r[0]
    return out


def write_video(imgs, path, fps, scale):
    """MP4 H.264 (pixel exato, vizinho mais próximo) e GIF com a mesma escala."""
    w, h = imgs[0].size
    W, H = w * scale, h * scale
    W += W % 2
    H += H % 2
    p = subprocess.Popen([FFMPEG, "-v", "error", "-y", "-f", "rawvideo", "-pix_fmt", "rgb24", "-s", f"{W}x{H}", "-r", str(fps),
                          "-i", "-", "-c:v", "libx264", "-pix_fmt", "yuv420p", "-crf", "14", "-preset", "slow",
                          "-movflags", "+faststart", path + ".mp4"], stdin=subprocess.PIPE)
    for im in imgs:
        big = Image.new("RGB", (W, H))
        big.paste(im.convert("RGB").resize((w * scale, h * scale), Image.NEAREST))
        p.stdin.write(big.tobytes())
    p.stdin.close()
    p.wait()
    gif = [im.convert("RGB").resize((w * scale, h * scale), Image.NEAREST).convert("P", palette=Image.ADAPTIVE, colors=255) for im in imgs]
    gif[0].save(path + ".gif", save_all=True, append_images=gif[1:], duration=round(1000 / fps), loop=0, optimize=False, disposal=1)


def sheet(imgs, path, cols=8, label=None, scale=3):
    w, h = imgs[0].size
    rows = math.ceil(len(imgs) / cols)
    S = Image.new("RGB", (cols * w * scale, rows * (h * scale + 12)), (18, 20, 28))
    d = ImageDraw.Draw(S)
    for i, im in enumerate(imgs):
        x, y = (i % cols) * w * scale, (i // cols) * (h * scale + 12)
        S.paste(im.convert("RGB").resize((w * scale, h * scale), Image.NEAREST), (x, y + 12))
        d.text((x + 3, y), label(i) if label else str(i), fill=(255, 220, 90))
    S.save(path)


# ---------------------------------------------------------------- isolado (fundo neutro com linha de chão)
def neutral_track(specs, start, frames, keys):
    return anims.build_track(specs, start, frames, keys)


def neutral_frames(track, frames, size=(200, 90), ground=80, cam=None):
    out = []
    for rec in track:
        idx, x, y = rec[:3]
        im = Image.new("RGBA", size, (34, 38, 54, 255))
        d = ImageDraw.Draw(im)
        d.line([(0, ground + 1), (size[0], ground + 1)], fill=(60, 66, 92))
        for gx in range(0, size[0], 8):                      # marcas no chão: mostram se o pé desliza
            d.point((gx, ground + 2), fill=(90, 98, 130))
        cx = 0 if cam is None else cam(x)
        base, over = frames[idx]
        place(im, base, x - cx, y)
        place(im, over, x - cx, y)
        out.append(im)
    return out


def scenario_rotation():
    S = []
    for i in range(17):
        th = i * 22.5
        S.append(anims.Spec(po.stand(), th, mode="fix", hold=3, fix=(100, 80)))
    for i in range(4):
        S.append(anims.Spec(po.stand(blink=i == 2), 0, mode="fix", hold=3, fix=(100, 80)))
    return S, (100, 80)


def scenario_walk_both():
    S = []
    S += anims.walk_frames(90, 0.0, 20)
    S += anims.stop_frames(90)
    S += anims.turn_frames([82, 66, 48, 30, 14, 4, 0, -4, -14, -30, -48, -66, -82, -90])
    S.append(anims.start_frame(-90))
    S += anims.walk_frames(-90, 0.875, 21)
    S += anims.stop_frames(-90)
    S += anims.idle_frames(12, theta=-90)
    for sp in S[-12:]:
        sp.mode = "pelvis"
    return S, (20, 80)


def scenario_walk_stop_turn():
    S = []
    S += anims.walk_frames(90, 0.0, 20)
    S += anims.stop_frames(90)
    S += anims.turn_frames([84, 72, 56, 38, 22, 10, 3, 0])
    S += anims.idle_frames(36, looks=[(10, 20, (0.6, 0))])
    for sp in S[-36:]:
        sp.mode = "pelvis"
    S += anims.turn_frames([4, 20, 45, 70, 95, 115, 135], lead=0.3)
    S.append(anims.start_frame(135))
    S += anims.walk_frames(135, 0.875, 13)
    return S, (20, 84)


def isolated():
    frames, keys = [], {}
    os.makedirs(OUT, exist_ok=True)
    for name, fn, cam in (("rotacao", scenario_rotation, None), ("andar-dois-lados", scenario_walk_both, None),
                          ("andar-parar-virar", scenario_walk_stop_turn, None)):
        S, start = fn()
        track = anims.build_track(S, start, frames, keys)
        size = (200, 90)
        imgs = neutral_frames(track, frames, size=size, ground=start[1])
        write_video(imgs, os.path.join(OUT, name + "-2x"), anims.TICK, 2)
        write_video(imgs, os.path.join(OUT, name + "-5x"), anims.TICK, 5)
        uniq = [imgs[i] for i in range(len(imgs)) if i == 0 or track[i] != track[i - 1]]
        sheet(uniq, os.path.join(OUT, name + "-quadros.png"), cols=10, scale=3)
        print(name, len(imgs), "tiques")


def in_scene():
    data, frames, t_intro, t_loop = anims.build()
    L = scene3.layers()
    os.makedirs(OUT, exist_ok=True)
    intro = [compose(L, frames, r) for r in t_intro]
    loop = [compose(L, frames, r) for r in t_loop]
    write_video(intro + loop, os.path.join(OUT, "cena-completa-2x"), anims.TICK, 2)
    crop = (40, 50, 180, 150)
    zoom = [im.crop(crop) for im in intro + loop]
    write_video(zoom, os.path.join(OUT, "cena-completa-zoom4x"), anims.TICK, 4)
    # recortes temáticos
    n_int = len(intro)

    def seg(a, b):
        return (intro + loop)[a:b]
    write_video([im.crop(crop) for im in seg(n_int - 75, n_int + 36)], os.path.join(OUT, "puxar-cadeira-sentar-zoom4x"), anims.TICK, 4)
    cof = next(i for i, r in enumerate(t_loop) if r[4] == 1)
    write_video([im.crop(crop) for im in loop[cof - 30:cof + 60]], os.path.join(OUT, "cafe-zoom4x"), anims.TICK, 4)
    # sentar, digitar e levantar (levantar não entra na trilha do site: o loop fica sentado, como na v2)
    S = anims.turn_frames([82, 68, 50, 32, 18, 9, anims.SEAT_THETA], lead=0.25)
    for sp in S:
        sp.mode, sp.fix = "fix", tuple(anims.SLOT)
    for k, h in ((0.1, 1), (0.22, 1), (0.36, 1), (0.5, 1), (0.62, 1), (0.74, 1), (0.84, 1), (0.92, 1), (1.0, 2)):
        S.append(anims.Spec(po.sit(k), anims.SEAT_THETA, mode="fix", over=k > 0.8, hold=h, fix=tuple(anims.SLOT)))
    S += anims.typing_block(2.5)
    for k in (0.1, 0.2, 0.3, 0.42, 0.55, 0.66, 0.78, 0.9, 1.0):
        S.append(anims.Spec(po.stand_up(k), anims.SEAT_THETA, mode="fix", over=k < 0.45, hold=1, fix=tuple(anims.SLOT)))
    S += [anims.Spec(sp.pose, anims.SEAT_THETA, mode="fix", hold=1, fix=tuple(anims.SLOT)) for sp in anims.idle_frames(18, theta=anims.SEAT_THETA)]
    fr2, k2 = [], {}
    tr = anims.build_track(S, tuple(anims.SLOT), fr2, k2)
    write_video([compose(L, fr2, r).crop(crop) for r in tr], os.path.join(OUT, "sentar-digitar-levantar-zoom4x"), anims.TICK, 4)
    write_video([compose(L, fr2, r) for r in tr], os.path.join(OUT, "sentar-digitar-levantar-2x"), anims.TICK, 2)
    # folhas quadro a quadro (só quando muda algo)
    allr = t_intro + t_loop
    allim = intro + loop
    uniq = [i for i in range(len(allr)) if i == 0 or allr[i] != allr[i - 1]]
    for part in range(0, len(uniq), 80):
        ids = uniq[part:part + 80]
        sheet([allim[i].crop(crop) for i in ids], os.path.join(OUT, "cena-quadros-%02d.png" % (part // 80)), cols=10,
              label=lambda k, ids=ids: "%.2fs" % (ids[k] / anims.TICK), scale=2)
    print("cena", len(allim), "tiques", len(uniq), "mudanças")


if __name__ == "__main__":
    what = sys.argv[1] if len(sys.argv) > 1 else "tudo"
    if what in ("isolado", "tudo"):
        isolated()
    if what in ("cena", "tudo"):
        in_scene()
