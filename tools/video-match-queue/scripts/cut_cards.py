import numpy as np, cv2, sys
from PIL import Image, ImageDraw
src=np.array(Image.open('ref/squad-294239-screenshot.webp').convert('RGB'))
W,H=126,149
# left, top ; overlay boxes in card-local px: (x0,y0,x1,y1)
C={
 'RAP':(299,88, [(110,14,126,104),(0,56,10,84),(0,133,17,149)]),
 'ROD':(626,85, [(110,14,126,104),(0,133,17,149)]),
 'BEL':(463,167,[(110,14,126,104),(0,56,10,84),(0,133,17,149)]),
 'KAR':(181,260,[(110,14,126,92),(0,133,17,149)]),
 'PIR':(742,259,[(108,10,126,40),(0,52,12,80),(0,133,17,149)]),
 'DEJ':(463,382,[(110,14,126,58),(0,58,12,84),(0,133,17,149)]),
 'BAC':(91,440, [(110,14,126,58),(0,56,10,84),(0,133,17,149)]),
 'KOU':(303,461,[(110,14,126,58),(0,133,17,149)]),
 'LAC':(626,458,[(112,0,126,16),(0,133,17,149)]),
 'VAL':(835,446,[(106,12,126,64),(112,0,126,14),(0,52,14,82),(0,133,17,149)]),
 'MAR':(463,596,[(0,52,14,84),(0,133,17,149)])}
SC=4
for k,(L,T,boxes) in C.items():
  crop=src[T:T+H,L:L+W].copy()
  m=np.zeros((H,W),np.uint8)
  for (x0,y0,x1,y1) in boxes: m[y0:y1,x0:x1]=255
  inp=cv2.inpaint(cv2.cvtColor(crop,cv2.COLOR_RGB2BGR),m,5,cv2.INPAINT_TELEA)
  inp=cv2.cvtColor(inp,cv2.COLOR_BGR2RGB)
  big=Image.fromarray(inp).resize((W*SC,H*SC),Image.LANCZOS)
  a=Image.new('L',(W*SC,H*SC),0);ImageDraw.Draw(a).rounded_rectangle([3,3,W*SC-4,H*SC-4],radius=12*SC,fill=255)
  # remove leftover pitch pixels at the rounded corners (flood fill from the border over green-ish pixels)
  gm=((inp[:,:,1].astype(int)>inp[:,:,0].astype(int)+6)&(inp[:,:,1].astype(int)>=inp[:,:,2].astype(int))&(inp.mean(axis=2)<140)).astype(np.uint8)*255
  ff=gm.copy();fm=np.zeros((H+2,W+2),np.uint8)
  for (x,y) in [(0,0),(W-1,0),(0,H-1),(W-1,H-1),(1,H-2),(W-2,H-2),(2,H-1),(W-3,H-1)]:
    if ff[y,x]==255: cv2.floodFill(ff,fm,(x,y),128)
  bg=Image.fromarray(np.where(ff==128,0,255).astype(np.uint8)).resize((W*SC,H*SC),Image.LANCZOS)
  from PIL import ImageChops
  a=ImageChops.multiply(a,bg)
  big.putalpha(a);big.save(f'cards/{k}.png')
  if k=='RAP':
    m2=np.zeros((H,W),np.uint8);m2[109:130,3:123]=255
    i2=cv2.cvtColor(cv2.inpaint(cv2.cvtColor(inp,cv2.COLOR_RGB2BGR),m2,7,cv2.INPAINT_TELEA),cv2.COLOR_BGR2RGB)
    b2=Image.fromarray(i2).resize((W*SC,H*SC),Image.LANCZOS);b2.putalpha(a);b2.save('cards/RAP_nostats.png')
# manager: shield card; background = non-gold pixels reachable from the crop border
mg=src[100:228,40:131].copy()
hsv=cv2.cvtColor(cv2.cvtColor(mg,cv2.COLOR_RGB2BGR),cv2.COLOR_BGR2HSV)
gold=((hsv[:,:,0]>=8)&(hsv[:,:,0]<=38)&(hsv[:,:,1]>55)&(hsv[:,:,2]>110)).astype(np.uint8)
ng=(1-gold).astype(np.uint8)*255
h,w=ng.shape;ff=ng.copy();fm=np.zeros((h+2,w+2),np.uint8)
for x in range(w):
  for y in (0,h-1):
    if ff[y,x]==255: cv2.floodFill(ff,fm,(x,y),128)
for y in range(h):
  for x in (0,w-1):
    if ff[y,x]==255: cv2.floodFill(ff,fm,(x,y),128)
alpha=np.where(ff==128,0,255).astype(np.uint8)
alpha=cv2.morphologyEx(alpha,cv2.MORPH_OPEN,np.ones((3,3),np.uint8))
big=Image.fromarray(mg).resize((w*SC,h*SC),Image.LANCZOS)
al=Image.fromarray(alpha).resize(big.size,Image.LANCZOS);big.putalpha(al)
big=big.crop(big.getbbox());big.save('cards/MGR.png')
print('ok',big.size)
