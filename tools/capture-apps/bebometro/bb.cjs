const {chromium}=require((process.env.PW_DIR||'.')+'/node_modules/playwright');
const OUT=process.env.BB_TMP||'/tmp/bb_tmp';require('fs').mkdirSync(OUT,{recursive:true});
async function open(lang,{w=390,h=844,q='',port=8775}={}){
  const b=await chromium.launch({args:['--use-gl=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist']});
  const c=await b.newContext({viewport:{width:w,height:h},deviceScaleFactor:2,isMobile:true,hasTouch:true,locale:lang==='pt'?'pt-BR':lang});
  const p=await c.newPage();
  await p.goto('http://127.0.0.1:'+port+'/?lang='+lang+q);await p.waitForTimeout(7000);
  await p.evaluate(()=>{const e=document.querySelector('flt-semantics-placeholder'); if(e){e.click();}});
  await p.waitForTimeout(1200);
  return {b,c,p};
}
async function nodes(p){return p.evaluate(()=>[...document.querySelectorAll('flt-semantics')].map(e=>{const r=e.getBoundingClientRect();return {role:e.getAttribute('role'),label:(e.getAttribute('aria-label')||e.textContent||'').replace(/\s+/g,' ').trim(),x:r.x,y:r.y,w:r.width,h:r.height}}).filter(n=>n.w>0&&n.h>0&&n.y<900&&n.label));}
async function dump(p){const n=await nodes(p);console.log(n.map(x=>`${x.role||'-'}|${x.label.slice(0,60)}|${Math.round(x.x)},${Math.round(x.y)} ${Math.round(x.w)}x${Math.round(x.h)}`).join('\n'));}
async function tap(p,text,{exact=false,idx=0,role}={}){
  const n=await nodes(p);
  let m=n.filter(x=>(!role||x.role===role)&&(exact?x.label===text:x.label.toLowerCase().includes(text.toLowerCase())));
  m.sort((a,b)=>a.w*a.h-b.w*b.h); if(m.length){const lab=m[0].label; const same=m.filter(x=>x.label===lab); same.sort((a,b)=>{const ia=(a.y+a.h/2>=0&&a.y+a.h/2<=715)?0:1, ib=(b.y+b.h/2>=0&&b.y+b.h/2<=715)?0:1; return ia-ib||a.w*a.h-b.w*b.h;}); m=same.concat(m.filter(x=>x.label!==lab));}
  if(!m.length) throw new Error('no node: '+text);
  const t=m[idx]; await p.mouse.click(t.x+t.w/2,t.y+t.h/2); await p.waitForTimeout(900); await p.mouse.move(389,440); return t;
}
async function scroll(p,dy,x=195,y=500){await p.mouse.move(x,y);await p.mouse.wheel(0,dy);await p.waitForTimeout(700);}
async function tapAt(p,x,y){await p.mouse.click(x,y);await p.waitForTimeout(900);}
async function shot(p,name){await p.mouse.move(389,440);await p.waitForTimeout(700);await p.screenshot({path:`${OUT}/${name}.png`});}
async function tapS(p,text,o={}){ // rola até o item ficar acima da barra inferior e toca
  for(let i=0;i<8;i++){
    const n=await nodes(p);const exact=o.exact;
    let m=n.filter(x=>(!o.role||x.role===o.role)&&(exact?x.label===text:x.label.toLowerCase().includes(text.toLowerCase())));
    m.sort((a,b)=>a.w*a.h-b.w*b.h);
    if(m.length){const t=m[o.idx||0];const cy=t.y+t.h/2; if(cy>=70&&cy<=(o.max||712)){await p.mouse.click(t.x+t.w/2,cy);await p.waitForTimeout(900);await p.mouse.move(389,440);return t;}
      await scroll(p,cy>690?Math.min(400,cy-450):-300);continue;}
    await scroll(p,350);
  }
  throw new Error('no node (scroll): '+text);
}
module.exports={tapS,open,dump,tap,tapAt,shot,nodes,scroll,OUT};
// tradução de rótulos: escreve-se em pt e resolve-se pela chave do ARB
const fs=require('fs');
const ARB={};for(const l of ['pt','en','es'])ARB[l]=JSON.parse(fs.readFileSync(`${process.env.BB_REPO||'../bebometro'}/lib/l10n/app_${l}.arb`,'utf8'));
module.exports.L=function(lang,pt){
  if(lang==='pt')return pt.split('{')[0].trim()||pt;
  const keys=Object.keys(ARB.pt).filter(k=>!k.startsWith('@'));
  let k=keys.find(k=>ARB.pt[k]===pt)||keys.find(k=>typeof ARB.pt[k]==='string'&&ARB.pt[k].split('{')[0].trim()===pt)||keys.find(k=>typeof ARB.pt[k]==='string'&&ARB.pt[k].startsWith(pt));
  if(!k)throw new Error('sem chave arb para: '+pt);
  const v=ARB[lang][k];return String(v).split('{')[0].trim();
};
