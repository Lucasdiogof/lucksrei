// node render.cjs sheet <dir> t1,t2,...   |   node render.cjs frames <dir> <fps> <workers> <dsf> [t0] [t1]
const { chromium } = require('playwright');
const fs=require('fs'),path=require('path');
const url='http://127.0.0.1:8770/index.html';
async function page(browser,scale){const ctx=await browser.newContext({viewport:{width:720,height:720},deviceScaleFactor:scale});const p=await ctx.newPage();
  p.on('pageerror',e=>console.error('PAGEERR',e.message));p.on('console',m=>{if(m.type()==='error')console.error('CONSOLE',m.text())});
  await p.goto(url);await p.waitForFunction('window.READY===true');return p}
(async()=>{
const [mode,dir]=process.argv.slice(2);fs.mkdirSync(dir,{recursive:true});
const browser=await chromium.launch();
if(mode==='sheet'){const ts=process.argv[4].split(',').map(Number);const p=await page(browser,1);
  for(let i=0;i<ts.length;i++){await p.evaluate(t=>window.render(t),ts[i]);await p.screenshot({path:`${dir}/s${String(i).padStart(3,'0')}.png`})}}
else{const fps=+process.argv[4],W=+process.argv[5],dsf=+process.argv[6];const p0=await page(browser,1);const dur=await p0.evaluate('window.DURATION');
  const a=process.argv[7]?Math.round(+process.argv[7]*fps):0,b=process.argv[8]?Math.round(+process.argv[8]*fps):Math.round(dur*fps);
  await Promise.all([...Array(W).keys()].map(async w=>{const p=await page(browser,dsf);
    for(let i=a+w;i<b;i+=W){await p.evaluate(t=>window.render(t),i/fps);await p.screenshot({path:`${dir}/f${String(i).padStart(5,'0')}.jpg`,type:'jpeg',quality:93})}}));
  console.log('frames',b-a)}
await browser.close();})();
