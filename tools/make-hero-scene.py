"""Gera os assets do hero em pixel art (cenário, folha de sprites e pôsteres) e injeta o mapa de frames no JS.

Uso (na raiz do site):  python tools/make-hero-scene.py
Saída:  assets/img/hero/{scene.png, sprites.png, poster-empty.png, poster-final.png}
        + bloco FRAMES em assets/js/hero-scene.js (entre /*FRAMES*/ e /*END-FRAMES*/)
Mundo: 240 x 150 px lógicos. Chão do personagem em y=138. Tudo desenhado por código: nada de arte de terceiros.
"""
import json
import math
import os
import re
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from PIL import Image, ImageDraw  # noqa: E402

import hero_char as hc  # noqa: E402
import hero_frames as hf  # noqa: E402

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, "assets", "img", "hero")
os.makedirs(OUT, exist_ok=True)

W, H = 240, 150
FLOOR_Y = 138
CHAR_CX = 144           # x do mundo onde a célula de âncora (32) do sprite fica; quadril sentado = CHAR_CX - 2
DESK_X0, DESK_X1, DESK_TOP = 148, 238, 111
SCREEN_X0, SCREEN_X1 = 190, 220  # tela do monitor em perspectiva (26 colunas): ele está virado para o personagem


MUG_X = 230
PHONE = (148, 109, 6, 2)   # x, y, w, h do celular deitado na mesa


def rgb(h):
    return tuple(int(h[i:i + 2], 16) for i in (1, 3, 5))


C = {
    "wall_t": rgb("#0b1020"), "wall_b": rgb("#141b36"), "base": rgb("#1c2646"), "base_hi": rgb("#2b3a6a"),
    "floor": rgb("#141a30"), "floor2": rgb("#10162a"), "plank": rgb("#0c1122"), "floor_hi": rgb("#1b2342"),
    "rug": rgb("#18254f"), "rug2": rgb("#1f2f63"), "gold": rgb("#e8bc46"), "gold_d": rgb("#96681a"), "gold_l": rgb("#ffe078"),
    "wood": rgb("#5a4331"), "wood_hi": rgb("#7a5d44"), "wood_d": rgb("#3a2b21"), "wood_dd": rgb("#2a1f19"),
    "blue": rgb("#3c82ff"), "blue_l": rgb("#63b3ff"), "cyan": rgb("#46d9ff"), "ivory": rgb("#f5f0e4"),
    "navy": rgb("#0e1530"), "navy2": rgb("#18214a"), "metal": rgb("#2a3150"), "metal_hi": rgb("#434d7a"),
    "leaf": rgb("#2f8f6a"), "leaf_d": rgb("#1f6a50"), "leaf_l": rgb("#4fc08a"), "pot": rgb("#a35a3e"), "pot_d": rgb("#74402e"),
}


def lerp(a, b, t):
    return tuple(int(round(a[i] + (b[i] - a[i]) * t)) for i in range(3))


def px(d, x, y, c):
    d.point((x, y), fill=c + (255,))


def rect(d, x0, y0, x1, y1, c):
    d.rectangle([x0, y0, x1, y1], fill=c + (255,))


def build_bg():
    im = Image.new("RGBA", (W, H), (0, 0, 0, 255))
    d = ImageDraw.Draw(im)
    # parede: degradê em faixas (com dither xadrez entre faixas) até o rodapé
    bands = 14
    for y in range(0, 116):
        t = y / 115
        band = int(t * bands)
        c0 = lerp(C["wall_t"], C["wall_b"], band / bands)
        c1 = lerp(C["wall_t"], C["wall_b"], min(bands, band + 1) / bands)
        for x in range(W):
            frac = (t * bands) - band
            use1 = (x + y) % 2 == 0 and frac > 0.5 or ((x + y) % 4 == 0 and frac > 0.25)
            px(d, x, y, c1 if use1 else c0)
    # faixa de luz do monitor (azul) na parede à direita, bem discreta
    for y in range(40, 116):
        for x in range(150, 240):
            dist = math.hypot((x - 206) / 60, (y - 98) / 46)
            if dist < 1 and (x + y) % 2 == 0:
                base = im.getpixel((x, y))[:3]
                px(d, x, y, lerp(base, C["blue"], 0.10 * (1 - dist)))
    # rodapé
    rect(d, 0, 116, W - 1, 119, C["base"])
    rect(d, 0, 116, W - 1, 116, C["base_hi"])
    # chão: tábuas
    for y in range(120, H):
        for x in range(W):
            row = (y - 120) // 6
            c = C["floor"] if row % 2 == 0 else C["floor2"]
            if (y - 120) % 6 == 0:
                c = C["plank"]
            if (x + row * 37) % 59 == 0:
                c = C["plank"]
            px(d, x, y, c)
    # brilho do chão (luz da janela)
    for y in range(122, 146):
        for x in range(14, 78):
            if (x + y) % 2 == 0 and abs((x - 46) / 32) + abs((y - 134) / 14) < 1:
                base = im.getpixel((x, y))[:3]
                px(d, x, y, lerp(base, C["blue_l"], 0.12))
    # tapete sob a mesa (azul, filete dourado fino)
    for y in range(128, 148):
        for x in range(112, 232):
            inside = (x - 112) / 120, (y - 128) / 20
            c = C["rug"] if (x // 2 + y // 2) % 2 == 0 else C["rug2"]
            px(d, x, y, c)
    for x in range(112, 232):
        px(d, x, 128, C["gold_d"]); px(d, x, 147, C["gold_d"])
    for y in range(128, 148):
        px(d, 112, y, C["gold_d"]); px(d, 231, y, C["gold_d"])

    # ---------- janela (noite, cidade ao longe)
    rect(d, 19, 13, 67, 66, C["metal_hi"])
    rect(d, 20, 14, 66, 65, C["metal"])
    gx0, gy0, gx1, gy1 = 23, 17, 63, 61
    for y in range(gy0, gy1 + 1):
        t = (y - gy0) / (gy1 - gy0)
        for x in range(gx0, gx1 + 1):
            px(d, x, y, lerp(rgb("#0a1030"), rgb("#2a4a96"), t))
    for sx, sy in ((27, 21), (34, 25), (45, 20), (57, 24), (30, 33), (51, 31), (40, 38)):
        px(d, sx, sy, C["ivory"])
    # lua
    for yy in range(-5, 6):
        for xx in range(-5, 6):
            if xx * xx + yy * yy <= 20 and not ((xx + 2) ** 2 + (yy - 1) ** 2 <= 17):
                px(d, 52 + xx, 28 + yy, rgb("#f3eccd"))
    # skyline
    for bx, bw, bh in ((23, 6, 12), (30, 5, 17), (36, 7, 10), (44, 5, 19), (50, 6, 13), (57, 7, 16)):
        rect(d, bx, gy1 - bh + 1, bx + bw - 1, gy1, rgb("#0a1230"))
        for wy in range(gy1 - bh + 3, gy1 - 1, 4):
            for wx in range(bx + 1, bx + bw - 1, 3):
                if (wx * 7 + wy * 3) % 5 < 2:
                    px(d, wx, wy, C["gold"] if (wx + wy) % 4 else C["cyan"])
    # travessas
    rect(d, 43, 17, 43, 61, C["metal"])
    rect(d, 23, 39, 63, 39, C["metal"])
    rect(d, 17, 66, 69, 68, C["metal_hi"])
    rect(d, 17, 69, 69, 69, C["wood_dd"])

    # ---------- quadro da coroa (detalhe da marca, discreto)
    rect(d, 84, 20, 105, 42, C["gold_d"])
    rect(d, 85, 21, 104, 41, C["gold"])
    rect(d, 86, 22, 103, 40, C["navy"])
    crown = ["..G..G..G..", ".GG.GGG.GG.", ".GGGGGGGGG.", "GGGGGGGGGGG", "GlGGGlGGGlG", "GGGGGGGGGGG", "ddddddddddd"]
    cols = {"G": C["gold"], "l": C["gold_l"], "d": C["gold_d"]}
    for ry, row in enumerate(crown):
        for rx, ch in enumerate(row):
            if ch != ".":
                px(d, 89 + rx, 27 + ry, cols[ch])
    for rx in range(5):
        px(d, 91 + rx * 2, 36, C["gold_d"])

    # ---------- pôster de app (genérico): celular com UI abstrata
    rect(d, 112, 22, 128, 42, C["blue"])
    rect(d, 113, 23, 127, 41, C["navy2"])
    rect(d, 117, 26, 123, 38, rgb("#0a0f24"))
    rect(d, 118, 27, 122, 36, rgb("#1d3f8f"))
    rect(d, 118, 27, 122, 28, C["blue_l"])
    px(d, 120, 33, C["gold"]); px(d, 119, 31, C["cyan"]); px(d, 121, 31, C["cyan"])
    px(d, 120, 38, C["ivory"])

    # ---------- prateleira (livros, planta, controle)
    rect(d, 150, 56, 232, 58, C["wood"]); rect(d, 150, 56, 232, 56, C["wood_hi"]); rect(d, 150, 59, 232, 59, C["wood_dd"])
    for i, (bw, col) in enumerate([(4, "#3c82ff"), (3, "#18214a"), (4, "#e8bc46"), (3, "#2a3a7a"), (5, "#63b3ff"), (3, "#18214a")]):
        x0 = 154 + sum(b for b, _ in [(4, 0), (3, 0), (4, 0), (3, 0), (5, 0), (3, 0)][:i]) + i
        h = 12 + (i * 5) % 5
        rect(d, x0, 56 - h, x0 + bw - 1, 55, rgb(col))
        rect(d, x0, 56 - h, x0 + bw - 1, 56 - h, lerp(rgb(col), C["ivory"], 0.35))
    # planta pequena
    rect(d, 198, 49, 205, 55, C["pot"]); rect(d, 198, 49, 205, 50, C["pot_d"])
    for lx, ly in ((199, 44), (202, 41), (204, 45), (200, 47), (203, 47), (197, 46), (205, 43)):
        rect(d, lx, ly, lx + 1, ly + 2, C["leaf"] if (lx + ly) % 2 else C["leaf_l"])
    # controle (detalhe gamer discreto)
    rect(d, 214, 52, 226, 55, C["metal"]); rect(d, 215, 51, 218, 51, C["metal"]); rect(d, 222, 51, 225, 51, C["metal"])
    px(d, 217, 53, C["blue_l"]); px(d, 223, 53, C["gold"]); px(d, 221, 54, C["cyan"])

    # ---------- planta de chão (folhas arqueadas) + aparador baixo com abajur
    rect(d, 6, 118, 22, 134, C["pot"]); rect(d, 6, 118, 22, 120, C["pot_d"]); rect(d, 7, 134, 21, 135, C["pot_d"])
    fronds = [(-60, 26, 0.9), (-35, 30, 0.6), (-8, 32, 0.3), (18, 28, -0.4), (42, 24, -0.8), (-82, 18, 1.1), (66, 18, -1.0)]
    for ang, ln, curve in fronds:
        x, y = 14.0, 118.0
        for k in range(ln):
            t = k / ln
            a_ = math.radians(ang - 90 + curve * 40 * t)
            x += math.cos(a_) * 1.0
            y += math.sin(a_) * 1.0
            wid = max(1, int(round(3 * math.sin(math.pi * min(1, t * 1.15)))))
            for w_ in range(-(wid // 2), wid - wid // 2):
                col = C["leaf_l"] if w_ < 0 else (C["leaf"] if t < 0.7 else C["leaf_d"])
                px(d, int(round(x)) + w_, int(round(y)), col)
    rect(d, 92, 122, 121, 134, C["wood_d"]); rect(d, 92, 120, 121, 121, C["wood"]); rect(d, 92, 120, 121, 120, C["wood_hi"])
    rect(d, 95, 125, 118, 131, C["wood"]); rect(d, 105, 128, 108, 128, C["gold"])
    rect(d, 106, 112, 107, 119, C["metal"]); rect(d, 102, 105, 111, 111, rgb("#f0c968")); rect(d, 103, 105, 110, 106, rgb("#ffe9a8"))
    for y in range(84, 118):
        for x in range(84, 130):
            dist = math.hypot((x - 107) / 22, (y - 108) / 22)
            if dist < 1 and (x + y) % 3 == 0:
                base = im.getpixel((x, y))[:3]
                px(d, x, y, lerp(base, rgb("#f0c968"), 0.10 * (1 - dist)))

    # ---------- mesa
    rect(d, DESK_X0, DESK_TOP - 1, DESK_X1, DESK_TOP - 1, C["wood_hi"])
    rect(d, DESK_X0, DESK_TOP, DESK_X1, DESK_TOP + 3, C["wood"])
    rect(d, DESK_X0, DESK_TOP + 4, DESK_X1, DESK_TOP + 4, C["wood_dd"])
    rect(d, DESK_X0 + 2, DESK_TOP + 5, DESK_X0 + 5, 135, C["wood_d"])          # perna esquerda
    rect(d, 208, DESK_TOP + 5, DESK_X1 - 2, 135, C["wood_d"])                    # gaveteiro
    rect(d, 210, DESK_TOP + 8, DESK_X1 - 4, DESK_TOP + 16, C["wood"])
    rect(d, 210, DESK_TOP + 19, DESK_X1 - 4, DESK_TOP + 27, C["wood"])
    rect(d, 220, DESK_TOP + 12, 226, DESK_TOP + 12, C["gold"])
    rect(d, 220, DESK_TOP + 23, 226, DESK_TOP + 23, C["gold"])
    # ---------- cadeira (de perfil): quadril do personagem em x=CHAR_CX-2, y=123
    hx = CHAR_CX - 2
    rect(d, hx - 15, 96, hx - 10, 124, C["navy2"]); rect(d, hx - 15, 96, hx - 10, 96, C["blue"])   # encosto
    rect(d, hx - 15, 97, hx - 15, 124, C["metal_hi"])
    rect(d, hx - 11, 124, hx + 10, 127, C["navy2"]); rect(d, hx - 11, 124, hx + 10, 124, C["metal_hi"])  # assento
    rect(d, hx - 1, 128, hx + 1, 135, C["metal"])
    rect(d, hx - 12, 136, hx + 11, 136, C["metal"])
    for wx in (hx - 11, hx - 6, hx - 1, hx + 4, hx + 9):
        rect(d, wx, 137, wx + 1, 138, C["navy"])
    # ---------- teclado e mouse
    rect(d, 156, DESK_TOP - 2, 180, DESK_TOP - 1, C["metal"])
    for kx in range(157, 180, 2):
        px(d, kx, DESK_TOP - 2, C["metal_hi"])
    rect(d, 156, DESK_TOP, 180, DESK_TOP, C["blue"])
    rect(d, 183, DESK_TOP - 2, 186, DESK_TOP - 1, C["metal"])
    # ---------- brilho azul da tela caindo na mesa e na parede, em direção a ele (só um sopro, em dither)
    for y in range(80, 112):
        for x in range(150, 192):
            dist = math.hypot((x - 190) / 42, (y - 92) / 24)
            if dist < 1 and (x + y) % 3 == 0:
                base = im.getpixel((x, y))[:3]
                px(d, x, y, lerp(base, C["blue"], 0.10 * (1 - dist)))
    bezel(im)
    return im


SCREEN_TOP, SCREEN_SLOPE, SCREEN_H0, SCREEN_HSLOPE = 74, 0.2, 34, 0.3


def screen_columns():
    """(x, topo, altura) de cada coluna da tela em perspectiva: a borda esquerda (mais perto do personagem) é a mais alta."""
    return [(SCREEN_X0 + i, SCREEN_TOP + int(round(i * SCREEN_SLOPE)), int(round(SCREEN_H0 - i * SCREEN_HSLOPE))) for i in range(SCREEN_X1 - SCREEN_X0)]


def screen_quad(im, content):
    cols = screen_columns()
    n = len(cols)
    for j, (x, top, hgt) in enumerate(cols):
        sx = min(content.width - 1, int(j * content.width / n))
        col = content.crop((sx, 0, sx + 1, content.height)).resize((1, hgt), Image.NEAREST)
        im.alpha_composite(col.convert("RGBA"), (x, top))


def bezel(im):
    """Monitor virado para o personagem: moldura fina à esquerda/em cima/embaixo e o corpo do aparelho (profundidade) à direita."""
    d = ImageDraw.Draw(im)
    cols = screen_columns()
    (xl, tl, hl), (xr, tr, hr) = cols[0], cols[-1]
    # corpo/traseira (aparece atrás da tela, à direita): mais escuro, com borda superior clara
    back = [(xr + 1, tr - 2), (xr + 8, tr - 6), (xr + 8, tr + hr - 1), (xr + 1, tr + hr + 2)]
    d.polygon(back, fill=rgb("#1b2240") + (255,))
    d.line([back[0], back[1]], fill=C["metal_hi"] + (255,))
    d.line([back[1], back[2]], fill=rgb("#10152c") + (255,))
    # moldura da frente
    m = 2
    quad = [(xl - m, tl - m), (xr + 1, tr - m), (xr + 1, tr + hr + m), (xl - m, tl + hl + m)]
    d.polygon(quad, fill=C["metal"] + (255,))
    d.line([quad[0], quad[1]], fill=C["metal_hi"] + (255,))
    d.line([quad[0], quad[3]], fill=C["metal_hi"] + (255,))
    # tela apagada (a viva é desenhada por cima)
    for x, top, hgt in cols:
        d.line([(x, top), (x, top + hgt - 1)], fill=rgb("#070b1c") + (255,))
    # haste e base
    rect(d, xr + 2, tr + hr + 1, xr + 5, DESK_TOP - 3, C["metal"])
    rect(d, xl + 6, DESK_TOP - 3, xr + 12, DESK_TOP - 1, C["metal"]); rect(d, xl + 6, DESK_TOP - 3, xr + 12, DESK_TOP - 3, C["metal_hi"])


def static_screen(lines=True):
    s = Image.new("RGBA", (36, 24), rgb("#0a1028") + (255,))
    d = ImageDraw.Draw(s)
    rect(d, 0, 0, 35, 3, rgb("#161e3e"))
    for i, col in enumerate((C["gold"], C["blue_l"], C["ivory"])):
        px(d, 2 + i * 3, 1, col)
    rect(d, 0, 4, 6, 23, rgb("#0e1634"))
    if lines:
        spec = [(1, [("b", 9), ("g", 5)]), (2, [("c", 7), ("i", 8)]), (2, [("b", 12)]), (3, [("i", 6), ("c", 9)]), (2, [("g", 4), ("b", 10)]), (1, [("c", 11)]), (2, [("b", 8), ("i", 6)]), (3, [("i", 10)])]
        colmap = {"b": C["blue_l"], "g": C["gold"], "c": C["cyan"], "i": rgb("#8f9bc4")}
        for li, (ind, segs) in enumerate(spec):
            x = 8 + ind * 2
            y = 5 + li * 2
            for k, n in segs:
                rect(d, x, y, min(34, x + n - 1), y, colmap[k])
                x += n + 1
        rect(d, 8, 21, 20, 22, rgb("#13284f"))
        rect(d, 8, 21, 16, 22, C["blue"])
    return s


def draw_desk_props(im, phone=True):
    d = ImageDraw.Draw(im)
    if phone:
        rect(d, PHONE[0], PHONE[1], PHONE[0] + PHONE[2] - 1, PHONE[1] + 1, rgb("#242a44"))
        rect(d, PHONE[0] + 1, PHONE[1], PHONE[0] + PHONE[2] - 2, PHONE[1], C["blue_l"])
    # caneca
    rect(d, MUG_X, 104, MUG_X + 5, DESK_TOP - 2, C["ivory"]); rect(d, MUG_X, 106, MUG_X + 5, 106, C["gold"]); rect(d, MUG_X + 6, 106, MUG_X + 7, 108, C["ivory"])
    rect(d, MUG_X, 104, MUG_X + 5, 104, rgb("#a37a50"))


def build_sheet():
    cells = [(n, c) for n, cs in hf.ORDER for c in cs]
    cols = 10
    rows = (len(cells) + cols - 1) // cols
    sheet = Image.new("RGBA", (cols * hc.CW, rows * hc.CH), (0, 0, 0, 0))
    meta, idx = {}, 0
    for name, cs in hf.ORDER:
        meta[name] = [idx, len(cs)]
        for c in cs:
            sheet.alpha_composite(c.image(), ((idx % cols) * hc.CW, (idx // cols) * hc.CH))
            idx += 1
    return sheet, meta, cols


def main():
    bg = build_bg()
    bg.convert("RGB").save(os.path.join(OUT, "scene.png"), optimize=True)
    sheet, meta, cols = build_sheet()
    q = sheet.quantize(colors=48, method=Image.Quantize.FASTOCTREE, dither=Image.Dither.NONE) if False else sheet
    sheet.save(os.path.join(OUT, "sprites.png"), optimize=True)

    def poster(with_char):
        im = bg.copy().convert("RGBA")
        bezel(im)
        screen_quad(im, static_screen(lines=with_char))
        draw_desk_props(im)
        if with_char:
            start = meta["type"][0]
            cell = sheet.crop(((start % cols) * hc.CW, (start // cols) * hc.CH, (start % cols + 1) * hc.CW, (start // cols + 1) * hc.CH))
            im.alpha_composite(cell, (CHAR_CX - hc.FX, FLOOR_Y - hc.FY))
        return im.convert("RGB")

    poster(False).save(os.path.join(OUT, "poster-empty.png"), optimize=True)
    poster(True).save(os.path.join(OUT, "poster-final.png"), optimize=True)

    js = os.path.join(ROOT, "assets", "js", "hero-scene.js")
    if os.path.exists(js):
        s = open(js, encoding="utf-8", newline="").read()
        block = "/*FRAMES*/ " + json.dumps({"cell": [hc.CW, hc.CH], "anchor": [hc.FX, hc.FY], "cols": cols, "frames": meta, "floor": FLOOR_Y, "seatX": CHAR_CX, "cols_screen": [list(c) for c in screen_columns()], "phone": list(PHONE), "mug": [MUG_X, 104], "desk": [DESK_X0, DESK_X1, DESK_TOP]}, separators=(",", ":")) + " /*END-FRAMES*/"
        s2 = re.sub(r"/\*FRAMES\*/.*?/\*END-FRAMES\*/", lambda m: block, s, flags=re.S)
        open(js, "w", encoding="utf-8", newline="").write(s2)
    for f in ("scene.png", "sprites.png", "poster-empty.png", "poster-final.png"):
        print(f, os.path.getsize(os.path.join(OUT, f)), "bytes")
    print(json.dumps(meta))


if __name__ == "__main__":
    main()
