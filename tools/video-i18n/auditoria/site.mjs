import { createRequire } from 'node:module';
const require = createRequire('C:/Users/lucas/AndroidStudioProjects/samara-rubia-site/');
const { chromium } = require('playwright');
const OUT='C:/Users/lucas/AppData/Local/Temp/aud/shots';
const pages=[['home','/','aprovaura'],['aura','/projects/aura/','aprovaura'],['fan-hub','/projects/fan-hub/','goias-app'],['la-pelve','/projects/la-pelve/','la-pelve'],['match-queue','/projects/match-queue/','match-queue'],['bebometro','/projects/bebometro/','bebometro'],['orbijob','/projects/orbijob/','orbijob'],['busaogyn','/projects/busaogyn/','busaogyn'],['stockport','/projects/stockport/','stockport']];
const av1 = process.argv[2]!=='h264';
const browser = await chromium.launch({ args:['--autoplay-policy=no-user-gesture-required'] });
const res=[];
for (const [pg,path,app] of pages) {
  const ctx = await browser.newContext({ viewport:{width:1280,height:900}, locale:'pt-BR' });
  const p = await ctx.newPage();
  if(!av1) await p.addInitScript(()=>{const o=HTMLMediaElement.prototype.canPlayType;HTMLMediaElement.prototype.canPlayType=function(t){return /av01/.test(t)?'':o.call(this,t)}});
  const reqs=[]; p.on('request',r=>{if(/\/assets\/video\//.test(r.url()))reqs.push(r.url().replace('https://lucksrei.com',''))});
  const errs=[]; p.on('pageerror',e=>errs.push(String(e)));
  await p.addInitScript(()=>{window.__sw=[];document.addEventListener('lucksrei:video-swap',e=>window.__sw.push(e.detail))});
  await p.goto('https://lucksrei.com'+path,{waitUntil:'load'});
  const vids=()=>p.evaluate(a=>[...document.querySelectorAll('video[data-loop-video]')].filter(v=>v.dataset.loopVideo===a||a==='*').map(v=>({n:v.dataset.loopVideo,src:v.currentSrc.replace('https://lucksrei.com',''),poster:(v.poster||'').replace('https://lucksrei.com',''),t:+v.currentTime.toFixed(2),paused:v.paused,rs:v.readyState})), app);
  const row={page:pg,app,steps:[]};
  const seq=['pt-BR','en','es','pt-BR'];
  for (const [i,l] of seq.entries()) {
    if(i===0){ await p.evaluate(()=>{const b=document.querySelector('.lang-btn[data-locale="pt-BR"]'); if(b)b.click()}); }
    else await p.evaluate(x=>document.querySelector(`.lang-btn[data-locale="${x}"]`).click(), l);
    const n0=await p.evaluate(()=>window.__sw.length);
    // espera a troca terminar (ou 25s)
    await p.waitForFunction(([n,loc])=>window.__sw.length>n||[...document.querySelectorAll('video[data-loop-video]')].every(v=>v.currentSrc.includes('.'+loc+'.')||!v.currentSrc),[n0,l],{timeout:25000}).catch(()=>{});
    await p.waitForTimeout(1500);
    const v=await vids(); const sw=await p.evaluate(()=>window.__sw.slice(-1)[0]);
    await p.evaluate(a=>{const v=document.querySelector(`video[data-loop-video="${a}"]`); v&&v.scrollIntoView({block:'center'})},app);
    await p.waitForTimeout(800);
    await p.screenshot({path:`${OUT}/${av1?'av1':'h264'}-${pg}-${l}.png`});
    row.steps.push({l,ok:v.every(x=>x.src.includes('-loop.'+l+(av1?'.av1':'.')||'')),v:v.map(x=>x.src+' t='+x.t+(x.paused?' PAUSED':'')),sw:sw&&{ok:sw.ok,drift:sw.driftMs}});
  }
  row.reqs=reqs.length; row.errs=errs;
  // idioma guardado + idioma do navegador
  await ctx.close();
  res.push(row);
}
// carregamento inicial: idioma salvo e idioma do navegador
const init=[];
for (const [saved,nav] of [['es','pt-BR'],[null,'en-US'],[null,'es-ES'],[null,'pt-BR']]) {
  const ctx=await browser.newContext({locale:nav}); const p=await ctx.newPage();
  if(saved) await p.addInitScript(l=>localStorage.setItem('lucksrei.locale',l),saved);
  const reqs=[]; p.on('request',r=>{if(/\/assets\/video\//.test(r.url()))reqs.push(r.url().replace('https://lucksrei.com',''))});
  await p.goto('https://lucksrei.com/projects/aura/'); await p.waitForTimeout(4000);
  init.push({saved,nav,reqs,src:await p.evaluate(()=>[...document.querySelectorAll('video')].map(v=>v.currentSrc.replace('https://lucksrei.com','')))}); await ctx.close();
}
console.log(JSON.stringify({res,init},null,1));
await browser.close();
