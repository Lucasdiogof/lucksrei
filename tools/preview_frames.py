"""Pré-visualização da folha de frames (uso local): python tools/preview_frames.py saida.png [escala] [nomes,separados,por,virgula]"""
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from PIL import Image
import hero_frames as hf
import hero_char as hc

out = sys.argv[1]
S = int(sys.argv[2]) if len(sys.argv) > 2 else 4
only = sys.argv[3].split(",") if len(sys.argv) > 3 else None
cells = [(n, c) for n, cs in hf.ORDER for c in cs if (not only or n in only)]
cols = min(len(cells), 8)
rows = (len(cells) + cols - 1) // cols
sheet = Image.new("RGBA", (cols * hc.CW * S, rows * hc.CH * S), (14, 18, 32, 255))
for i, (n, c) in enumerate(cells):
    sheet.alpha_composite(c.image().resize((hc.CW * S, hc.CH * S), Image.NEAREST), ((i % cols) * hc.CW * S, (i // cols) * hc.CH * S))
sheet.convert("RGB").save(out)
print(len(cells), sheet.size)
