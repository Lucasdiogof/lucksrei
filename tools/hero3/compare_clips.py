"""Clipes de comparação v2 × híbrido a partir das gravações reais do navegador (tools/hero3/capture_video.cjs).
Cada tema: trecho equivalente de cada versão, lado a lado, em tamanho real (480×300 por painel) e ampliado 2×.
Saída: tools/hero3/out/preview/v2-x-hibrido-*.mp4"""
import os
import subprocess

V = os.path.join(os.path.dirname(os.path.abspath(__file__)), "out", "video")
O = os.path.join(os.path.dirname(os.path.abspath(__file__)), "out", "preview")
FONT = "/System/Library/Fonts/Supplemental/Arial.ttf"

# (tema, [(início, fim) da v2], [(início, fim) do híbrido]) — segundos de cada gravação
CLIPS = [
    ("1-parado-girando-andando", [(0.0, 10.0)], [(0.0, 10.0)]),
    ("2-ate-a-mesa-e-sentar", [(9.4, 15.0)], [(9.3, 18.0)]),
    ("3-digitar-e-olhar-monitores", [(14.5, 22.5)], [(17.5, 27.0)]),
    ("4-cafe", [(35.8, 40.0)], [(36.2, 41.0)]),
    ("5-comemorar-e-cocar", [(24.4, 28.4), (49.8, 52.8)], [(31.4, 33.8), (42.5, 46.2), (47.2, 49.6)]),
    ("0-sequencia-completa", [(0.0, 60.0)], [(0.0, 60.0)]),
]


def chain(label, inp, segs, dur):
    parts = []
    for i, (a, b) in enumerate(segs):
        parts.append(f"[{inp}:v]trim={a}:{b},setpts=PTS-STARTPTS[{label}{i}]")
    cat = "".join(f"[{label}{i}]" for i in range(len(segs)))
    total = sum(b - a for a, b in segs)
    pad = max(0.0, dur - total)
    txt = "v2 (produção)" if label == "a" else "híbrido (?hero=v3)"
    lbl = 2 if label == "a" else 3                       # rótulo (PNG) como entrada extra: vstack em cima do vídeo
    parts.append(f"{cat}concat=n={len(segs)}:v=1:a=0,tpad=stop_mode=clone:stop_duration={pad:.2f}[{label}v]")
    parts.append(f"[{lbl}:v][{label}v]vstack=inputs=2:shortest=1[{label}]")
    return ";".join(parts)


def labels(w):
    from PIL import Image, ImageDraw, ImageFont
    font = ImageFont.truetype(FONT, 14)
    out = []
    for i, txt in enumerate(("v2 (produção)", "híbrido (?hero=v3)")):
        im = Image.new("RGB", (w, 22), (12, 14, 20))
        ImageDraw.Draw(im).text((6, 3), txt, fill=(255, 220, 90), font=font)
        fn = os.path.join(V, f"label{i}.png")
        im.save(fn)
        out.append(fn)
    return out


if __name__ == "__main__":
    import json
    import sys
    dev = sys.argv[1] if len(sys.argv) > 1 else ""          # "" = desktop, "-mob" = celular
    w = round(json.load(open(os.path.join(V, f"v2{dev}.json")))["box"]["width"])
    L0, L1 = labels(w)
    for name, sa, sb in CLIPS:
        dur = max(sum(b - a for a, b in sa), sum(b - a for a, b in sb))
        fc = chain("a", 0, sa, dur) + ";" + chain("b", 1, sb, dur) + ";[a][b]hstack=inputs=2[s]"
        for suffix, extra in (("", ""), ("-2x", ",scale=iw*2:ih*2:flags=neighbor")):
            out = os.path.join(O, f"v2-x-hibrido{dev}-{name}{suffix}.mp4")
            subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", os.path.join(V, f"v2{dev}.mp4"), "-i", os.path.join(V, f"hib{dev}.mp4"),
                            "-loop", "1", "-i", L0, "-loop", "1", "-i", L1, "-filter_complex", fc + ";[s]null" + extra + "[o]", "-map", "[o]", "-t", f"{dur:.2f}",
                            "-c:v", "libx264", "-pix_fmt", "yuv420p", "-crf", "16", "-movflags", "+faststart", out], check=True)
        print(name, "%.1fs" % dur)
