"""Dados da página de comparação no navegador (tools/hero3/qa/perfil.html): v2 × v3 anterior × v3 corrigida.

Gera tools/hero3/qa/rot.png+json (v3 corrigida: rotação completa de 16 ângulos e caminhada para os dois lados, para o
modo “giro”) e qa/data.json (frames da v2 lidos do bloco FRAMES de assets/js/hero-scene.js).
Uso: python3 tools/hero3/qa_build.py   e abrir http://localhost:8765/tools/hero3/qa/perfil.html
"""
import json
import os
import re
import sys

import numpy as np
from PIL import Image

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import anims  # noqa: E402
import poses as po  # noqa: E402
import scene3  # noqa: E402

QA = os.path.join(os.path.dirname(os.path.abspath(__file__)), "qa")

if __name__ == "__main__":
    os.makedirs(QA, exist_ok=True)
    src = open(os.path.join(scene3.ROOT, "assets", "js", "hero-scene.js"), encoding="utf-8").read()
    v2 = json.loads(re.search(r"/\*FRAMES\*/ (.*?) /\*END-FRAMES\*/", src, re.S).group(1))
    # rotação completa (16 ângulos, parado, 3 tiques cada) e caminhada à direita/esquerda, no ponto PRESENT
    S = [anims.Spec(po.stand(), i * 22.5, mode="fix", hold=3, fix=(66, 140)) for i in range(17)]
    S += [anims.Spec(po.stand(), 0, mode="fix", hold=6, fix=(66, 140))]
    frames, keys = [], {}
    rot = anims.build_track(S, (66, 140), frames, keys)
    W = anims.walk_frames(90, 0.0, 24) + anims.stop_frames(90) + anims.turn_frames([82, 66, 48, 30, 14, 4, 0, -4, -14, -30, -48, -66, -82, -90])
    W += [anims.start_frame(-90)] + anims.walk_frames(-90, 0.875, 25) + anims.stop_frames(-90)
    walk = anims.build_track(W, (20, 140), frames, keys)
    atlas, meta = anims.pack(frames)
    Image.fromarray(atlas).save(os.path.join(QA, "rot.png"))
    json.dump({"frames": meta, "rot": anims.runs(rot), "walk": anims.runs(walk), "tick": anims.TICK, "v2": v2},
              open(os.path.join(QA, "data.json"), "w"), separators=(",", ":"))
    print("ok", len(frames), "quadros")
