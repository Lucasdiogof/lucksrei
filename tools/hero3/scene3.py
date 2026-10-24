"""Hero v3 — camadas do quarto ATUAL para testar o personagem v3 (nada redesenhado).

Reaproveita as funções de tools/make-hero-scene.py sem chamar o main() dele (que regravaria os assets de produção):
- bg sem a cadeira (a cadeira vira camada própria para poder ser puxada);
- cadeira, mesa (+ teclado), monitores e caneca exatamente como na v2.
Ordem de composição (igual à v2, com a cadeira separada): bg → cadeira → corpo → mesa → caneca → braços sobre a mesa →
monitores.
"""
import importlib.util
import os

from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
_spec = importlib.util.spec_from_file_location("make_hero_scene", os.path.join(ROOT, "tools", "make-hero-scene.py"))
mhs = importlib.util.module_from_spec(_spec)
_spec.loader.exec_module(mhs)

SLOT, SEAT, MUG, ENTRY, PRESENT = mhs.SLOT, mhs.SEAT, mhs.MUG, mhs.ENTRY, mhs.PRESENT
W, H = mhs.W, mhs.H


def layers():
    real_chair = mhs.chair
    mhs.chair = lambda cv: None
    try:
        bg = mhs.build_bg().convert("RGBA")
    finally:
        mhs.chair = real_chair
    cv = mhs.Canvas()
    mhs.chair(cv)
    chair = cv.im
    mug = mhs.Canvas()
    mhs.mug_layer(mug)
    return {"bg": bg, "chair": chair, "desk": mhs.build_desk(), "monitors": mhs.build_monitors(), "mug": mug.im}


def monitor_rims():
    """Filetes das bordas das telas (o runtime da v2 acende): (x, y, altura)."""
    return [[(m[1] + 1) if m[5] == "r" else (m[0] - 1), (m[3] if m[5] == "r" else m[2]) - m[4] - 1, m[4] - 4] for m in mhs.MONITORS]


if __name__ == "__main__":
    L = layers()
    im = L["bg"].copy()
    for k in ("chair", "desk", "mug", "monitors"):
        im.alpha_composite(L[k])
    ref = Image.open(os.path.join(ROOT, "assets", "img", "hero", "poster-empty.png")).convert("RGBA")
    diff = sum(1 for a, b in zip(im.getdata(), ref.getdata()) if a[:3] != b[:3])
    print("pixels diferentes do poster-empty da v2:", diff)
