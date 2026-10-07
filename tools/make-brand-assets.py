"""Gera a logo do header, favicon, apple-touch-icon, favicon.ico e a imagem social (OG 1200x630) a partir da logo oficial (2026).

Uso: python tools/make-brand-assets.py
Fonte: tools/brand/lucksrei-logo-2026.png (logo com fundo transparente, extraída do arquivo enviado sobre preto).
A logo nunca é redesenhada: só recortada e redimensionada.
- Favicon (16/32/48): o "L" da logo (haste branca + corte dourado). A wordmark inteira vira mancha nesses tamanhos.
- Apple touch / 192: o mesmo "L" com a coroa da logo no vão superior direito do L.
Fontes: Segoe UI / Consolas (Windows).
"""
import os
import numpy as np
from PIL import Image, ImageDraw, ImageFilter, ImageFont

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
IMG = os.path.join(ROOT, "assets", "img")
logo = Image.open(os.path.join(ROOT, "tools", "brand", "lucksrei-logo-2026.png")).convert("RGBA")

crown = logo.crop((985, 0, logo.width, 53))
crown = crown.crop(crown.getbbox())

# o "L": recorte até o início do "u"; o branco do "u" que cai no recorte é apagado (o corte dourado do L encosta nele)
a = np.array(logo.crop((0, 0, 175, logo.height))).astype(int)
cols = np.arange(a.shape[1])[None, :].repeat(a.shape[0], 0)
a[..., 3][(cols >= 150) & ((a[..., 0] - a[..., 2]) < 40)] = 0
mono = Image.fromarray(a.astype(np.uint8))
mono = mono.crop(mono.getbbox())

BLACK, GOLD, IVORY, DIM = (6, 6, 8), (219, 178, 80), (246, 239, 224), (150, 150, 158)


def glow(size, center, radius, color, alpha):
    layer = Image.new("RGBA", size, (0, 0, 0, 0))
    ImageDraw.Draw(layer).ellipse([center[0] - radius, center[1] - radius, center[0] + radius, center[1] + radius], fill=color + (alpha,))
    return layer.filter(ImageFilter.GaussianBlur(radius * 0.55))


def fit(im, w=None, h=None):
    if w:
        h = round(im.height * w / im.width)
    else:
        w = round(im.width * h / im.height)
    return im.resize((w, h), Image.LANCZOS)


def icon(px, rounded, with_crown):
    big = 512
    base = Image.new("RGBA", (big, big), BLACK + (255,))
    if with_crown:
        base.alpha_composite(glow((big, big), (big // 2, big // 2), int(big * 0.34), GOLD, 22))
        g = fit(mono, h=int(big * 0.60))
        x, y = (big - g.width) // 2, (big - g.height) // 2 + int(big * 0.03)
        base.alpha_composite(g, (x, y))
        c = fit(crown, w=int(g.width * 0.50))
        base.alpha_composite(c, (x + g.width - c.width - int(g.width * 0.03), y + int(g.height * 0.08)))
    else:
        g = fit(mono, h=int(big * 0.70))      # grande: em 16 px a haste ainda fica com ~2 px
        base.alpha_composite(g, ((big - g.width) // 2 + int(big * 0.015), (big - g.height) // 2))
    if rounded:
        mask = Image.new("L", (big, big), 0)
        ImageDraw.Draw(mask).rounded_rectangle([0, 0, big - 1, big - 1], radius=int(big * 0.2), fill=255)
        base.putalpha(mask)
    else:
        base = base.convert("RGB")
    return base.resize((px, px), Image.LANCZOS)


icon(32, True, False).save(os.path.join(IMG, "favicon-32.png"), optimize=True)
icon(192, True, True).save(os.path.join(IMG, "favicon-192.png"), optimize=True)
icon(180, False, True).save(os.path.join(IMG, "apple-touch-icon.png"), optimize=True)
icon(256, True, False).save(os.path.join(ROOT, "favicon.ico"), sizes=[(16, 16), (32, 32), (48, 48)])

# logo do header (imagem única, coroa incluída) — 80 px de altura cobre 34 px em telas 2x
fit(logo, h=80).save(os.path.join(IMG, "brand", "lucksrei-sm.webp"), "WEBP", quality=92, method=6)

# ---------- OG 1200x630: preto, luz contida, a logo como peça central, um único acento dourado ----------
W, H = 1200, 630
og = Image.new("RGBA", (W, H), BLACK + (255,))
og.alpha_composite(glow((W, H), (W // 2, 270), 380, IVORY, 9))
og.alpha_composite(glow((W, H), (W // 2, 290), 230, GOLD, 14))
lg = fit(logo, w=660)
lx, ly = (W - lg.width) // 2, 196
og.alpha_composite(lg, (lx, ly))
cy = ly + lg.height + 58
# fio fino branco (translúcido, numa camada própria) com o corte dourado do "L" no centro (mesmo ângulo da logo)
lines = Image.new("RGBA", (W, H), (0, 0, 0, 0))
ld = ImageDraw.Draw(lines)
ld.line([(W // 2 - 210, cy), (W // 2 - 26, cy)], fill=(255, 255, 255, 40), width=1)
ld.line([(W // 2 + 26, cy), (W // 2 + 210, cy)], fill=(255, 255, 255, 40), width=1)
og.alpha_composite(lines)
d = ImageDraw.Draw(og)
d.polygon([(W // 2 - 18, cy - 3), (W // 2 + 8, cy - 3), (W // 2 + 18, cy + 3), (W // 2 - 8, cy + 3)], fill=GOLD + (255,))


def font(name, size):
    return ImageFont.truetype(os.path.join(os.environ.get("WINDIR", "C:\\Windows"), "Fonts", name), size)


def centered(text, y, f, fill, spacing=0):
    w = sum(d.textlength(ch, font=f) + spacing for ch in text) - spacing
    x = (W - w) / 2
    for ch in text:
        d.text((x, y), ch, font=f, fill=fill)
        x += d.textlength(ch, font=f) + spacing


centered("LUCAS DIOGO  ·  SENIOR MOBILE DEVELOPER", cy + 30, font("segoeui.ttf", 21), DIM, spacing=3)
centered("LUCKSREI.COM", H - 50, font("consola.ttf", 15), (96, 96, 104), spacing=5)
og.convert("RGB").save(os.path.join(IMG, "og", "lucksrei-og-2026.jpg"), quality=90, optimize=True, progressive=True)
print("ok")
