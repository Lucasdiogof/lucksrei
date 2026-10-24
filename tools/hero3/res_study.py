"""Estudo: aumentar a resolução interna da cena ajuda? Mesmo tamanho de exibição do site (480×300 px CSS).

A — 240×150 a 2× (atual): cena atual + personagem v3 a 1×.
B — 480×300 a 1×, só o personagem refeito em 2× sobre o cenário atual ampliado: pixels de dois tamanhos na mesma cena.
C — 320×200 a 1,5×: escala não inteira; colunas/linhas de pixel ficam com 1 e 2 px alternados (tremula ao mover).
D — 480×300 a 1×, TUDO redesenhado em 2× (simulado: personagem a 2× sobre cenário a 2× suavizado só para mostrar a
    densidade): o pixel fica com metade do tamanho, a arte deixa de ler como a da v2.
Saída: tools/hero3/out/res-study.png (recortes ampliados lado a lado) e o peso de cada folha de sprites.
"""
import io
import os
import sys

from PIL import Image

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import poses as po  # noqa: E402
import rig  # noqa: E402

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
SCENE = Image.open(os.path.join(ROOT, "assets", "img", "hero", "poster-empty.png")).convert("RGBA")
FEET = (66, 140)                       # DATA.present da v2 (pés do Lucas de frente para o visitante)
CROP = (30, 60, 110, 150)              # região em px do mundo 240×150


def place(bg, spr, scale, feet):
    (_, _), foot = rig.cell_for(scale)
    out = bg.copy()
    out.alpha_composite(spr, (int(round(feet[0] * scale - foot[0])), int(round(feet[1] * scale - foot[1] - 1))))
    return out


def display(world, factor):
    """Mundo → pixels de tela 480×300 (vizinho mais próximo, como o canvas com imageSmoothingEnabled=false)."""
    return world.resize((round(world.width * factor), round(world.height * factor)), Image.NEAREST)


def crop_disp(img, factor_world_to_disp):
    x0, y0, x1, y1 = (round(v * factor_world_to_disp) for v in CROP)
    return img.crop((x0, y0, x1, y1))


def png_bytes(im):
    b = io.BytesIO()
    im.save(b, "PNG", optimize=True)
    return b.tell()


if __name__ == "__main__":
    body = po.stand()
    s1 = Image.fromarray(rig.render(body, 0, scale=1)["img"])
    s2 = Image.fromarray(rig.render(body, 0, scale=2)["img"])
    s43 = Image.fromarray(rig.render(body, 0, scale=4 / 3)["img"])

    A = display(place(SCENE, s1, 1, FEET), 2)
    B = display(place(SCENE.resize((480, 300), Image.NEAREST), s2, 2, FEET), 1)
    C = display(place(SCENE.resize((320, 200), Image.NEAREST), s43, 4 / 3, FEET), 1.5)
    D = display(place(SCENE.resize((480, 300), Image.BICUBIC), s2, 2, FEET), 1)
    tiles = [crop_disp(im, 2) for im in (A, B, C, D)]
    Z = 3
    w, h = tiles[0].size
    sheet = Image.new("RGBA", (4 * w * Z + 3 * 16, h * Z), (20, 22, 30, 255))
    for i, t in enumerate(tiles):
        sheet.alpha_composite(t.resize((w * Z, h * Z), Image.NEAREST), (i * (w * Z + 16), 0))
    sheet.save(os.path.join(rig.OUT, "res-study.png"))

    # peso: 1 quadro a 1× e a 2× (a folha inteira escala ~igual)
    print("bytes por quadro  1x:", png_bytes(s1), " 2x:", png_bytes(s2), " 4/3x:", png_bytes(s43))
