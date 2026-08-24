import { chromium } from 'playwright';
const [route, sel] = process.argv.slice(2);
const b=await chromium.launch();
const p=await(await b.newContext({viewport:{width:390,height:900},colorScheme:'light'})).newPage();
await p.goto('http://localhost:4321'+route,{waitUntil:'networkidle'});
await p.evaluate(()=>document.fonts.ready);
console.log(await p.evaluate((s)=>{
  const el=document.querySelector(s);
  if(!el) return 'not found';
  const out=[];
  let n=el;
  while(n && n!==document.body){
    const r=n.getBoundingClientRect(); const c=getComputedStyle(n);
    out.push(`${n.tagName.toLowerCase()}.${(''+n.className).split(/\s+/).slice(0,2).join('.')}  w=${Math.round(r.width)} left=${Math.round(r.left)} right=${Math.round(r.right)} display=${c.display} cols=${c.gridTemplateColumns} overflowX=${c.overflowX} minW=${c.minWidth}`);
    n=n.parentElement;
  }
  // widest descendant
  const kids=[...el.querySelectorAll('*')].map(k=>({k,w:k.getBoundingClientRect().width})).sort((a,b)=>b.w-a.w).slice(0,4);
  out.push('--- widest descendants ---');
  kids.forEach(({k,w})=>out.push(`  ${k.tagName.toLowerCase()}.${(''+k.className).split(/\s+/).slice(0,2).join('.')} w=${Math.round(w)} minW=${getComputedStyle(k).minWidth} overflowX=${getComputedStyle(k).overflowX}`));
  return out.join('\n');
}, sel));
await b.close();
