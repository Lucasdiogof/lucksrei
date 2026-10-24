"""Grava os pôsteres capturados (tools/hero3/qa/posters.cjs) em assets/img/hero/, com paleta só se for idêntica."""
import os
import sys
from PIL import Image

src = sys.argv[1]
dst = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "..", "..", "assets", "img", "hero")
for n in ("poster-empty", "poster-final"):
    im = Image.open(os.path.join(src, n + ".png")).convert("RGB")
    q = im.quantize(colors=256, method=Image.Quantize.MEDIANCUT, dither=Image.Dither.NONE)
    out = q if list(q.convert("RGB").getdata()) == list(im.getdata()) else im
    out.save(os.path.join(dst, n + ".png"), optimize=True)
    print(n, os.path.getsize(os.path.join(dst, n + ".png")), "bytes")
