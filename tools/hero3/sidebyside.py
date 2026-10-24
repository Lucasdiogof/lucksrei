"""Vídeos a partir das capturas do navegador (tools/hero3/capture.cjs): v2 × v3 lado a lado na mesma linha do tempo,
v3 desktop e v3 celular em tamanho real. Saída: tools/hero3/out/preview/navegador-*.mp4|gif."""
import glob
import json
import os
import subprocess
import sys

from PIL import Image, ImageDraw

HERE = os.path.dirname(os.path.abspath(__file__))
B = os.path.join(HERE, "out", "browser")
OUT = os.path.join(HERE, "out", "preview")


def load(name):
    meta = json.load(open(os.path.join(B, name, "meta.json")))
    return meta, sorted(glob.glob(os.path.join(B, name, "0*.png")))


def at(meta, files, t):
    """Captura mais próxima do instante t (s) do relógio da cena."""
    if meta["seek"]:
        i = round(t * 12)
    else:
        i = round((t - meta["t0"]) * meta["fps"])
    return files[max(0, min(len(files) - 1, i))]


def encode(frames, path, fps=12):
    w, h = frames[0].size
    w2, h2 = w + w % 2, h + h % 2
    p = subprocess.Popen(["ffmpeg", "-v", "error", "-y", "-f", "rawvideo", "-pix_fmt", "rgb24", "-s", f"{w2}x{h2}", "-r", str(fps), "-i", "-",
                          "-c:v", "libx264", "-pix_fmt", "yuv420p", "-crf", "14", "-movflags", "+faststart", path + ".mp4"], stdin=subprocess.PIPE)
    for im in frames:
        c = Image.new("RGB", (w2, h2))
        c.paste(im.convert("RGB"))
        p.stdin.write(c.tobytes())
    p.stdin.close()
    p.wait()
    pal = [im.convert("RGB").convert("P", palette=Image.ADAPTIVE, colors=255) for im in frames[::2]]
    pal[0].save(path + ".gif", save_all=True, append_images=pal[1:], duration=round(2000 / fps), loop=0)


if __name__ == "__main__":
    secs = float(sys.argv[1]) if len(sys.argv) > 1 else 40
    os.makedirs(OUT, exist_ok=True)
    m2, f2 = load("v2")
    m3, f3 = load("v3")
    frames = []
    for i in range(int(secs * 12)):
        t = i / 12
        a, b = Image.open(at(m2, f2, t)), Image.open(at(m3, f3, t))
        w, h = a.size
        c = Image.new("RGB", (w * 2 + 12, h + 20), (12, 14, 20))
        c.paste(a, (0, 20))
        c.paste(b, (w + 12, 20))
        d = ImageDraw.Draw(c)
        d.text((6, 4), "v2 (produção)", fill=(200, 200, 210))
        d.text((w + 18, 4), "v3 (?hero=v3)", fill=(255, 220, 90))
        d.text((w * 2 - 40, 4), "%5.1fs" % t, fill=(140, 140, 160))
        frames.append(c)
    encode(frames, os.path.join(OUT, "navegador-v2-x-v3"))
    for name in ("v3", "v3m"):
        m, f = load(name)
        encode([Image.open(x) for x in f], os.path.join(OUT, "navegador-" + name))
    print("ok")
