// FC-style chemistry (club 2/5/8, league 3/5/8, nation 2/5/8; icon/hero = 3 in position;
// icon counts +2 nation and +1 to every league; hero counts +2 league; manager +1 on nation/league match)
const P={
 RAP:{club:'BAR',lg:'LIGA',nat:'BRA'},ROD:{club:'RMA',lg:'LIGA',nat:'BRA'},BEL:{club:'RMA',lg:'LIGA',nat:'ENG'},
 KAR:{club:'PSG',lg:'ARK',nat:'FRA'},PIR:{icon:1,nat:'ITA'},DEJ:{club:'BAR',lg:'LIGA',nat:'NED'},BAC:{club:'OL',lg:'ARK',nat:'FRA'},
 KOU:{club:'BAR',lg:'LIGA',nat:'FRA'},LAC:{club:'CHE',lg:'PL',nat:'FRA'},VAL:{hero:1,lg:'PL',nat:'ECU'},MAR:{club:'CHE',lg:'PL',nat:'ARG'}};
const MGR={nat:'FRA',lg:'PL'};
function chem(ids,mgr){const c={},l={},n={};const lgs=new Set(ids.map(i=>P[i].lg).filter(Boolean));
 ids.forEach(i=>{const p=P[i];if(p.club)c[p.club]=(c[p.club]||0)+1;if(p.lg)l[p.lg]=(l[p.lg]||0)+(p.hero?2:1);n[p.nat]=(n[p.nat]||0)+(p.icon?2:1);if(p.icon)lgs.forEach(g=>l[g]=(l[g]||0)+1)});
 const th=(v,a)=>v>=a[2]?3:v>=a[1]?2:v>=a[0]?1:0;const out={};
 ids.forEach(i=>{const p=P[i];if(p.icon||p.hero){out[i]=3;return}
  let s=th(c[p.club]||0,[2,5,8])+th(l[p.lg]||0,[3,5,8])+th(n[p.nat]||0,[2,5,8]);if(mgr&&(mgr.nat===p.nat||mgr.lg===p.lg))s+=1;out[i]=Math.min(3,s)});return out}
if(typeof module!=='undefined'){const all=Object.keys(P);const r=chem(all,MGR);console.log(r,Object.values(r).reduce((a,b)=>a+b,0));
 const order=['RAP','MAR','KOU','LAC','BAC','VAL','DEJ','KAR','PIR','BEL','ROD'];const seq=[];for(let k=1;k<=order.length;k++){const ids=order.slice(0,k);const mg=k>=5?MGR:null;const r2=chem(ids,mg);seq.push(Object.values(r2).reduce((a,b)=>a+b,0))}console.log(seq)}
