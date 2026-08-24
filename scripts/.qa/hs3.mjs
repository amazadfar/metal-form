import { chromium } from 'playwright';
const b=await chromium.launch();
const p=await(await b.newContext({viewport:{width:390,height:800},colorScheme:'light'})).newPage();
await p.goto('http://localhost:4321'+process.argv[2],{waitUntil:'networkidle'});
await p.evaluate(()=>document.fonts.ready);
await p.waitForTimeout(500);
console.log(await p.evaluate(()=>{
  const de=document.documentElement, body=document.body;
  const rows=[];
  const walk=(el,depth)=>{
    if(depth>6) return;
    for(const c of el.children){
      const cs=getComputedStyle(c);
      if(cs.display==='none'||cs.position==='fixed') continue;
      const sw=c.scrollWidth, cw=c.clientWidth;
      const r=c.getBoundingClientRect();
      if(sw>cw+2 && !['auto','scroll','hidden','clip'].includes(cs.overflowX)){
        rows.push(`${'  '.repeat(depth)}${c.tagName.toLowerCase()}.${(''+c.className).split(/\s+/).slice(0,2).join('.')} clientW=${cw} scrollW=${sw} rectW=${Math.round(r.width)} overflowX=${cs.overflowX}`);
        walk(c,depth+1);
      }
    }
  };
  walk(body,0);
  return `html scrollW=${de.scrollWidth} clientW=${de.clientWidth}\nbody scrollW=${body.scrollWidth} clientW=${body.clientWidth} overflowX=${getComputedStyle(body).overflowX}\n`+rows.slice(0,25).join('\n');
}));
await b.close();
