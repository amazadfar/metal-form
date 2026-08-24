import { chromium } from 'playwright';
const b=await chromium.launch();
const p=await(await b.newContext({viewport:{width:390,height:800},colorScheme:'light'})).newPage();
await p.goto('http://localhost:4321'+process.argv[2],{waitUntil:'networkidle'});
await p.evaluate(()=>document.fonts.ready);
await p.waitForTimeout(400);
console.log(await p.evaluate(()=>{
  const de=document.documentElement;
  const base=de.scrollWidth;
  const trail=[];
  let root=document.body;
  for(let d=0; d<12; d++){
    let culprit=null;
    for(const c of Array.from(root.children)){
      const cs=getComputedStyle(c); if(cs.display==='none') continue;
      const prev=c.style.display;
      c.style.display='none';
      const now=de.scrollWidth;
      c.style.display=prev;
      if(now < de.scrollWidth){ culprit=c; break; }
    }
    if(!culprit) break;
    trail.push(`${culprit.tagName.toLowerCase()}.${(''+culprit.className).split(/\s+/).slice(0,3).join('.')}  overflowX=${getComputedStyle(culprit).overflowX} w=${Math.round(culprit.getBoundingClientRect().width)} scrollW=${culprit.scrollWidth}`);
    root=culprit;
  }
  return `base=${base} client=${de.clientWidth}\n`+trail.join('\n  ↓ ');
}));
await b.close();
