// Capturas do BusãoGyn (build web do app real, API real) em pt, en e es.
// uso: PW_DIR=<pasta com node_modules/playwright-core> BG_REPO=<repo busaogyn> BG_OUT=<saida> BG_PORT=8781 \
//      node capture.cjs <pt|en|es> [tela,tela]
// Serve o build web (BG_WEB) em BG_PORT antes de rodar. Viewport 390×792 @2x, que o statusbar.py completa para 738×1597.
const {chromium}=require((process.env.PW_DIR||'.')+'/node_modules/playwright-core');
const fs=require('fs');
const lang=process.argv[2]||'pt'; const only=(process.argv[3]||'').split(',').filter(Boolean);
const PORT=process.env.BG_PORT||'8781';
const OUTD=(process.env.BG_OUT||'/tmp/bg_out')+'/'; fs.mkdirSync(OUTD,{recursive:true});
const REPO=process.env.BG_REPO||'../../../../busaogyn';
const ARB=JSON.parse(fs.readFileSync(`${REPO}/app/lib/l10n/app_${lang}.arb`,'utf8'));
const T=(key,vars={})=>ARB[key].replace(/\{(\w+)\}/g,(_,n)=>vars[n]);
const STOP='30402';
const LOCALE={pt:'pt-BR',en:'en-US',es:'es-ES'}[lang];

async function open(dark){
  const b=await chromium.launch({args:['--use-gl=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist']});
  const c=await b.newContext({viewport:{width:390,height:792},deviceScaleFactor:2,isMobile:true,hasTouch:true,locale:LOCALE,colorScheme:dark?'dark':'light',timezoneId:'America/Sao_Paulo'});
  const p=await c.newPage();
  await p.goto('http://127.0.0.1:'+PORT+'/');await p.waitForTimeout(8000);
  await p.evaluate(()=>{const e=document.querySelector('flt-semantics-placeholder'); if(e){e.click();}});
  await p.waitForTimeout(1200);
  return {b,p};
}
const nodes=p=>p.evaluate(()=>[...document.querySelectorAll('flt-semantics')].map(e=>{const r=e.getBoundingClientRect();return {role:e.getAttribute('role'),label:(e.getAttribute('aria-label')||e.textContent||'').replace(/\s+/g,' ').trim(),x:r.x,y:r.y,w:r.width,h:r.height}}).filter(n=>n.w>0&&n.h>0&&n.y<900&&n.label));
async function dump(p){const n=await nodes(p);console.log(n.map(x=>`${x.role||'-'}|${x.label.slice(0,70)}|${Math.round(x.x)},${Math.round(x.y)} ${Math.round(x.w)}x${Math.round(x.h)}`).join('\n'));}
async function tap(p,text,{exact=false,idx=0,role,wait=1500}={}){
  const n=await nodes(p);
  let m=n.filter(x=>(!role||x.role===role)&&(exact?x.label===text:x.label.toLowerCase().includes(text.toLowerCase())));
  m.sort((a,b)=>a.w*a.h-b.w*b.h);
  if(!m.length) throw new Error('no node: '+text);
  const t=m[idx]; await p.mouse.click(t.x+t.w/2,t.y+t.h/2); await p.waitForTimeout(wait); await p.mouse.move(389,300); return t;
}
async function shot(p,id){await p.mouse.move(389,300);await p.waitForTimeout(900);await p.screenshot({path:OUTD+id+'-'+lang+'.png'});console.log('  shot',id);}
async function search(p,code){
  await p.mouse.click(150,92);await p.waitForTimeout(500);
  await p.keyboard.type(code,{delay:60});await p.keyboard.press('Enter');
  await p.waitForTimeout(6000);
}
async function flow(name,fn,dark=false){
  if(only.length&&!only.includes(name))return;
  console.log('==',lang,name);const {b,p}=await open(dark);
  try{await fn(p)}catch(e){console.log('  ERR',name,e.message);await dump(p);await shot(p,'err-'+name)}
  await b.close();
}
const DOCK={lines:T('dockLines'),stops:T('dockStops'),fav:T('dockFavorites'),track:T('dockTracking')};
const followLabel=new RegExp('^'+T('trackBus',{number:'\\d+'}).replace(/[()]/g,'\\$&')+'$');
async function trackFirst(p){
  const n=await nodes(p);
  const t=n.filter(x=>x.role==='button'&&followLabel.test(x.label)).sort((a,b)=>a.y-b.y)[0];
  if(!t) throw new Error('nenhum ônibus em tempo real para acompanhar');
  await p.mouse.click(t.x+t.w/2,t.y+t.h/2);await p.waitForTimeout(2500);
  await tap(p,DOCK.track,{role:'button'});await p.waitForTimeout(9000);
}
(async()=>{
await flow('search',async p=>{await shot(p,'search')});
await flow('arrivals',async p=>{await search(p,STOP);await shot(p,'arrivals');
  // painel aberto: arrasta a alça para cima
  await p.mouse.move(195,447);await p.mouse.down();await p.mouse.move(195,330,{steps:8});await p.mouse.move(195,120,{steps:10});await p.mouse.up();await p.waitForTimeout(1200);await shot(p,'arrivals-list');});
await flow('tracking',async p=>{await search(p,STOP);await trackFirst(p);await shot(p,'tracking');});
await flow('night',async p=>{await search(p,STOP);await shot(p,'night-arrivals');await trackFirst(p);await shot(p,'night-tracking');},true);
await flow('favorites',async p=>{await search(p,STOP);
  await tap(p,T('favoriteStopAdd',{code:STOP}),{role:'button'});
  await tap(p,DOCK.fav,{role:'button',exact:true});await p.waitForTimeout(6000);await shot(p,'favorites');
  await tap(p,DOCK.lines,{role:'button',exact:true});await shot(p,'lines');});
await flow('settings',async p=>{await tap(p,T('settings'),{role:'button'});await shot(p,'settings');});
})();
