import numpy as np
from PIL import Image, ImageDraw, ImageFilter
# Rebuilds assets/rig/farm_body.png from the Aprovaura app's neutral_wave kit (Lucasdiogof/aura).
D='../../../../aura/lib/assets/mascot/neutral_wave/'   # adjust to your aura checkout
out='assets/rig/'
L=lambda n: np.array(Image.open(D+f'aurudo_neutral_wave_{n}.webp').convert('RGBA')).astype(np.float32)
base=L('base'); H,W=base.shape[:2]; yy,xx=np.mgrid[0:H,0:W]; xs=np.clip(824-xx,0,W-1)
def propagate(img,todo,known):
    col=img[...,:3].copy(); col[~known]=0; k=known.astype(np.float32)
    for it in range(500):
        if not todo.any(): break
        s=np.zeros_like(col); c=np.zeros_like(k)
        for dy,dx in [(-1,0),(1,0),(0,-1),(0,1),(-1,-1),(1,1),(-1,1),(1,-1)]:
            s+=np.roll(np.roll(col*k[...,None],dy,0),dx,1); c+=np.roll(np.roll(k,dy,0),dx,1)
        new=todo&(c>0); col[new]=s[new]/c[new][:,None]; k[new]=1; todo=todo&~new
    return col
armA=np.maximum.reduce([L('forearm')[...,3],L('hand')[...,3],L('cuff')[...,3]])
holeR=np.array(Image.fromarray((armA>4).astype(np.uint8)*255).filter(ImageFilter.MaxFilter(11)))>0
poly=[(197,478),(220,462),(253,440),(297,436),(312,452),(312,520),(300,570),(275,575),(266,590),(263,612),(243,624),(210,640),(170,630),(146,610),(141,588),(158,552),(165,535),(176,506)]
m=Image.new('L',(W,H),0);ImageDraw.Draw(m).polygon(poly,fill=255);holeL=np.array(m.filter(ImageFilter.MaxFilter(11)))>0
img=base.copy(); img[holeR|holeL,3]=0
# ---- left flank
rest=holeL&(yy<452); img[rest]=base[rest]
mo=base[yy,xs]; mok=(mo[...,3]>200)&~holeR[yy,xs]
hood=holeL&~rest&(xx>=250)&(yy<=640)&mok; img[hood]=mo[hood]
bp=holeL&~rest&~hood&(yy<=556)&((((xx-200)/64.0)**2+((yy-492)/80.0)**2)<=1)
known=(img[...,3]>200)&~(holeL&~rest&~hood)
col=propagate(img,bp.copy(),known); img[bp,:3]=col[bp]; img[bp,3]=255
gap=holeL&~rest&~hood&~bp&(xx>=236)&(yy<=556)
col=propagate(img,gap.copy(),(img[...,3]>200)&~gap); img[gap,:3]=col[gap]; img[gap,3]=255
pat=np.array(Image.fromarray(img.astype(np.uint8)).filter(ImageFilter.GaussianBlur(2.2))).astype(np.float32)
sm=np.array(Image.fromarray(((bp|gap)).astype(np.uint8)*255).filter(ImageFilter.MaxFilter(5)))>0
img[sm&(img[...,3]>0),:3]=pat[sm&(img[...,3]>0),:3]
sliver=holeL&~rest&~hood&~bp&~gap&(xx>=286)&(yy>=440)&(yy<=566)
col=propagate(img,sliver.copy(),(img[...,3]>200)&~sliver); img[sliver,:3]=col[sliver]; img[sliver,3]=255
img[holeL&~rest&~hood&~bp&~gap&~sliver,3]=0
# left hem corner from the mirrored original right hem
hem=(xx>=232)&(xx<=304)&(yy>=548)&(yy<=604)
wv=np.clip((xx-232)/10.0,0,1)*np.clip((304-xx)/10.0,0,1)*np.clip((yy-548)/8.0,0,1)*hem*(mo[...,3]>200)
img=img*(1-wv[...,None])+mo*wv[...,None]
# ---- right flank below the orbit band: mirror of the finished left flank (feathered)
mir=img[yy,xs].copy()
w=np.clip((xx-512)/24.0,0,1)*np.clip((598-yy)/14.0,0,1)*np.clip((yy-430)/14.0,0,1)*(yy>=430)*(yy<=598)
img=img*(1-w[...,None])+mir*w[...,None]
# right band 372..430 where the old arm root was: smooth propagation from its surroundings
band=holeR&(yy>=372)&(yy<444)
mb=img[yy,xs]
lumb=mb[...,:3].mean(-1); bpk=(mb[...,3]>200)&(lumb<150)&(mb[...,2]>mb[...,1]+30)   # backpack/strap purple only, no ring glow
img[band]=0
selm=np.array(Image.fromarray((band&bpk).astype(np.uint8)*255).filter(ImageFilter.MaxFilter(7)).filter(ImageFilter.MinFilter(7)))>0
sel=band&selm; img[sel]=mb[sel]; img[sel,3]=255
al=np.array(Image.fromarray(np.clip(img[...,3],0,255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(2.4))).astype(np.float32)
img[band,3]=al[band]
# everything else of the old raised arm stays transparent; drop dark specks around the old hand
rem=holeR&~band&~((xx>=512)&(yy>=430)&(yy<=598)); img[rem,3]=0
box=img[280:380,590:720]; lum=box[...,:3].mean(-1); box[(lum<95)&(box[...,3]>0),3]=0; img[280:380,590:720]=box
Image.fromarray(np.clip(img,0,255).astype(np.uint8)).save(out+'farm_body.png'); print('ok')
