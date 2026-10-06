"""Folha de conferência dos frames (uso local, não vai para o site):
python tools/preview_frames.py saida.png [escala] [nomes,separados,por,virgula]
Cada célula mostra o frame (base + camada sobre a mesa) com o nome embaixo e uma linha no chão (y=68)."""
import os
import sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from PIL import Image, ImageDraw  # noqa: E402
import hero_char as hc  # noqa: E402
import hero_frames as hf  # noqa: E402

out = sys.argv[1]
S = int(sys.argv[2]) if len(sys.argv) > 2 else 4
only = sys.argv[3].split(",") if len(sys.argv) > 3 else None
cells = [(f"{n} {i + 1}", b, o) for n, fs in hf.ORDER for i, (b, o) in enumerate(fs) if (not only or n in only)]
cols = min(len(cells), 8)
rows = (len(cells) + cols - 1) // cols
LH = 14 * S // 4 + 6
sheet = Image.new("RGBA", (cols * hc.CW * S, rows * (hc.CH * S + LH)), (14, 18, 32, 255))
d = ImageDraw.Draw(sheet)
for i, (label, b, o) in enumerate(cells):
    x0, y0 = (i % cols) * hc.CW * S, (i // cols) * (hc.CH * S + LH)
    d.line([(x0, y0 + hc.FY * S + S), (x0 + hc.CW * S, y0 + hc.FY * S + S)], fill=(60, 70, 100, 255))
    im = b.image()
    if o is not None:
        im.alpha_composite(o.image())
    sheet.alpha_composite(im.resize((hc.CW * S, hc.CH * S), Image.NEAREST), (x0, y0))
    d.text((x0 + 6, y0 + hc.CH * S + 2), label, fill=(200, 210, 230, 255))
sheet.convert("RGB").save(out)
print(len(cells), sheet.size)
