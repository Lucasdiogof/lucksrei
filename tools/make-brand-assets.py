"""Gera favicon, apple-touch-icon e a imagem social (OG 1200x630) a partir da logo Royal Tech ORIGINAL.

Uso: python tools/make-brand-assets.py <logo-original.webp>
A logo nunca é redesenhada: só recortada (coroa) e redimensionada. Fontes: Segoe UI / Consolas (Windows).
"""
import os
import sys
from PIL import Image, ImageDraw, ImageFilter, ImageFont

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
IMG = os.path.join(ROOT, "assets", "img")
src = Image.open(sys.argv[1]).convert("RGBA")
logo = src.crop(src.getbbox())
crown = src.crop((1735, 70, 1975, 225))
crown = crown.crop(crown.getbbox())

BG_VOID, BG, GOLD, IVORY, DIM = (5, 6, 7), (8, 10, 14), (214, 167, 44), (245, 245, 242), (174, 180, 191)


def glow(size, center, radius, color, alpha):
    layer = Image.new("RGBA", size, (0, 0, 0, 0))
    d = ImageDraw.Draw(layer)
    d.ellipse([center[0] - radius, center[1] - radius, center[0] + radius, center[1] + radius], fill=color + (alpha,))
    return layer.filter(ImageFilter.GaussianBlur(radius * 0.55))


def fit(im, w=None, h=None):
    if w:
        h = round(im.height * w / im.width)
    else:
        w = round(im.width * h / im.height)
    return im.resize((w, h), Image.LANCZOS)


# ---------- ícones: coroa (recorte da logo) sobre fundo escuro ----------
def icon(px, rounded):
    big = px * 4
    base = Image.new("RGBA", (big, big), BG + (255,))
    base.alpha_composite(glow((big, big), (big // 2, big // 2), int(big * 0.34), GOLD, 46))
    c = fit(crown, w=int(big * 0.66))
    base.alpha_composite(c, ((big - c.width) // 2, (big - c.height) // 2 + int(big * 0.02)))
    if rounded:
        mask = Image.new("L", (big, big), 0)
        ImageDraw.Draw(mask).rounded_rectangle([0, 0, big - 1, big - 1], radius=int(big * 0.22), fill=255)
        base.putalpha(mask)
    else:
        base = base.convert("RGB")
    return base.resize((px, px), Image.LANCZOS)


icon(32, True).save(os.path.join(IMG, "favicon-32.png"), optimize=True)
icon(192, True).save(os.path.join(IMG, "favicon-192.png"), optimize=True)
icon(180, False).save(os.path.join(IMG, "apple-touch-icon.png"), optimize=True)
ico = icon(48, True)
ico.save(os.path.join(ROOT, "favicon.ico"), sizes=[(16, 16), (32, 32), (48, 48)])

# ---------- OG 1200x630 ----------
W, H = 1200, 630
og = Image.new("RGBA", (W, H), BG_VOID + (255,))
# gradiente diagonal discreto
grad = Image.new("RGBA", (W, H))
gp = grad.load()
for y in range(H):
    for x in range(W):
        t = (x / W * 0.55 + y / H * 0.45)
        gp[x, y] = (int(5 + 6 * t), int(6 + 8 * t), int(7 + 12 * t), 255)
og.alpha_composite(grad)
og.alpha_composite(glow((W, H), (230, 120), 330, GOLD, 34))
og.alpha_composite(glow((W, H), (1010, 250), 280, (60, 130, 255), 30))
# malha técnica quase invisível
grid = Image.new("RGBA", (W, H), (0, 0, 0, 0))
gd = ImageDraw.Draw(grid)
for x in range(0, W, 64):
    gd.line([(x, 0), (x, H)], fill=(214, 190, 130, 9))
for y in range(0, H, 64):
    gd.line([(0, y), (W, y)], fill=(214, 190, 130, 9))
og.alpha_composite(grid)

lg = fit(logo, w=640)
lx, ly = (W - lg.width) // 2, 92
og.alpha_composite(glow((W, H), (W // 2, ly + lg.height // 2), 230, GOLD, 26))
og.alpha_composite(lg, (lx, ly))

d = ImageDraw.Draw(og)
cy = ly + lg.height + 46
# divisor: ──── ◇ ────
d.line([(W // 2 - 190, cy), (W // 2 - 14, cy)], fill=GOLD + (120,), width=1)
d.line([(W // 2 + 14, cy), (W // 2 + 190, cy)], fill=GOLD + (120,), width=1)
d.polygon([(W // 2, cy - 5), (W // 2 + 5, cy), (W // 2, cy + 5), (W // 2 - 5, cy)], fill=GOLD + (255,))


def font(name, size):
    return ImageFont.truetype(os.path.join(os.environ.get("WINDIR", "C:\\Windows"), "Fonts", name), size)


def centered(text, y, f, fill, spacing=0):
    if spacing:
        w = sum(d.textlength(ch, font=f) + spacing for ch in text) - spacing
        x = (W - w) / 2
        for ch in text:
            d.text((x, y), ch, font=f, fill=fill)
            x += d.textlength(ch, font=f) + spacing
    else:
        w = d.textlength(text, font=f)
        d.text(((W - w) / 2, y), text, font=f, fill=fill)


centered("Lucas Diogo", cy + 34, font("segoeuib.ttf", 50), IVORY)
centered("Senior Mobile Developer  ·  Mobile Engineering", cy + 106, font("segoeui.ttf", 28), DIM)
centered("LUCKSREI.COM", H - 56, font("consola.ttf", 17), (116, 123, 136), spacing=5)

og.convert("RGB").save(os.path.join(IMG, "og", "lucksrei-og.jpg"), quality=90, optimize=True, progressive=True)
print("ok")
