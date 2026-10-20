"""Acrescenta a barra de status do iPhone (hora, sino mudo, sinal, wifi, bateria) no topo de uma captura,
no mesmo padrão dos prints reais dos outros produtos (738 px de largura). A faixa é a primeira linha da captura
esticada, então o fundo continua sem emenda. uso: python3 statusbar.py <in.png> <out.webp> [hora] [bateria]"""
import sys
from PIL import Image, ImageDraw, ImageFont

BAND = 104          # px a 780 de largura (52 pt)
K = 4               # supersampling

def lum(c): return 0.299*c[0]+0.587*c[1]+0.114*c[2]

def draw_bar(w, fg, time_txt, batt):
    W, H = w*K, BAND*K
    im = Image.new('RGBA', (W, H), (0, 0, 0, 0)); d = ImageDraw.Draw(im)
    f = ImageFont.truetype('/System/Library/Fonts/SFNS.ttf', 37*K)
    try: f.set_variation_by_axes([100, 28, 400, 590])
    except Exception: pass
    cy = 50*K
    d.text((62*K, cy), time_txt, font=f, fill=fg, anchor='lm')
    tw = d.textlength(time_txt, font=f)
    # sino mudo
    bx = 62*K + tw + 18*K; s = K
    d.polygon([(bx+4*s, cy+10*s), (bx+8*s, cy-4*s), (bx+14*s, cy-12*s), (bx+22*s, cy-12*s), (bx+28*s, cy-4*s), (bx+32*s, cy+10*s)], fill=fg)
    d.rectangle([bx+2*s, cy+10*s, bx+34*s, cy+14*s], fill=fg)
    d.pieslice([bx+12*s, cy+10*s, bx+24*s, cy+22*s], 0, 180, fill=fg)
    d.line([(bx-2*s, cy-14*s), (bx+38*s, cy+22*s)], fill=fg, width=int(4.5*s))
    # bateria
    rx = (w-62)*K; bw, bh = 66*s, 32*s
    x0 = rx-bw-5*s
    track = fg[:3] + (95,)
    d.rounded_rectangle([x0, cy-bh/2, x0+bw, cy+bh/2], radius=9*s, fill=track)
    d.rounded_rectangle([x0, cy-bh/2, x0+bw*batt/100, cy+bh/2], radius=9*s, fill=fg)
    d.rounded_rectangle([x0+bw+2*s, cy-6*s, x0+bw+5*s, cy+6*s], radius=2*s, fill=fg)
    fb = ImageFont.truetype('/System/Library/Fonts/SFNS.ttf', 25*K)
    try: fb.set_variation_by_axes([100, 17, 400, 700])
    except Exception: pass
    d.text((x0+bw/2, cy+1*s), str(batt), font=fb, fill=(17, 17, 17, 255) if fg[0] > 128 else (255, 255, 255, 255), anchor='mm')
    # wifi
    wx = x0-34*s; wy = cy+11*s
    for r in (30, 20, 10):
        d.arc([wx-r*s, wy-r*s, wx+r*s, wy+r*s], 225, 315, fill=fg, width=int(5*s))
    d.ellipse([wx-4*s, wy-4*s, wx+4*s, wy+4*s], fill=fg)
    # sinal
    sx = wx-48*s
    for i, h in enumerate((9, 15, 21, 27)):
        x = sx-38*s+ i*10*s
        d.rounded_rectangle([x, cy+13*s-h*s, x+6*s, cy+13*s], radius=2*s, fill=fg)
    return im.resize((w, BAND), Image.LANCZOS)

def run(src, dst, time_txt='9:41', batt=90):
    im = Image.open(src).convert('RGB'); w, h = im.size
    top = im.crop((0, 0, w, 1)).resize((w, BAND), Image.NEAREST)
    avg = im.crop((0, 0, w, 24)).resize((1, 1), Image.BOX).getpixel((0, 0))
    fg = (255, 255, 255, 255) if lum(avg) < 140 else (17, 17, 17, 255)
    out = Image.new('RGB', (w, h+BAND)); out.paste(top, (0, 0)); out.paste(im, (0, BAND))
    bar = draw_bar(w, fg, time_txt, batt)
    out.paste(bar, (0, 0), bar)
    W2 = 738; H2 = round(out.height*W2/out.width)
    out.resize((W2, H2), Image.LANCZOS).save(dst, quality=80, method=6)
    return (W2, H2)

if __name__ == '__main__':
    print(run(sys.argv[1], sys.argv[2], *(sys.argv[3:4] or ['9:41']), *(int(x) for x in sys.argv[4:5] or [90])))
