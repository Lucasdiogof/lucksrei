from PIL import Image, ImageDraw
import numpy as np, json
im=np.array(Image.open('ref/squad-294239-screenshot.webp').convert('RGB')).astype(int)
R={'RAP':(299,88,423,233),'ROD':(625,85,750,232),'BEL':(462,160,588,312),'KAR':(180,255,305,400),'PIR':(740,255,865,400),'DEJ':(462,375,588,520),
'BAC':(92,440,218,585),'KOU':(302,455,428,600),'LAC':(622,455,750,600),'VAL':(835,440,960,585),'MAR':(462,590,590,735)}
def green(p):r,g,b=p;return g>r+12 and g>b+8 and g>60
out={}
for k,(a,b,c,d) in R.items():
  ys=int(b+(d-b)*.80); # stats row
  # left edge
  L=next(x for x in range(a-15,a+15) if not green(im[ys,x]))
  Rr=next(x for x in range(c+15,c-15,-1) if not green(im[ys,x]))
  xc=(L+Rr)//2
  # top: scan down at column L+2 from b-14: first non-green after a green run
  col=L+3; T=None
  for y in range(b-6,b+20):
    if not green(im[y,col]) and green(im[y-1,col]): T=y;break
  if T is None:T=b
  # bottom: scan down from center at xc until green
  B=T+149
  out[k]=[L,T,Rr,B]
  print(k,out[k],Rr-L+1,B-T)
json.dump(out,open('bounds.json','w'))
img=Image.open('ref/squad-294239-screenshot.webp').convert('RGB');dr=ImageDraw.Draw(img)
for k,(L,T,Rr,B) in out.items(): dr.rectangle([L,T,Rr,B],outline=(255,0,255))
img.save('bounds.png')
