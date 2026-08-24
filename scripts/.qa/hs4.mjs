import { chromium } from 'playwright';
const b=await chromium.launch();
const p=await(await b.newContext({viewport:{width:390,height:800},colorScheme:'light'})).newPage();
await p.goto('http://localhost:4321'+process.argv[2],{waitUntil:'networkidle'});
await p.evaluate(()=>document.fonts.ready);
await p.waitForTimeout(400);
console.log(await p.evaluate((sel)=>{
  const root=document.querySelector(sel);
  const out=[];
  for(const c of root.querySelectorAll('*')){
    const cs=getComputedStyle(c); if(cs.display==='none') continue;
    const r=c.getBoundingClientRect();
    const rootR=root.getBoundingClientRect();
    const past=Math.round(Math.max(r.right-rootR.right, rootR.left-r.left));
    if(past>2 && r.width>4 && !(function(e){for(let q=e.parentElement;q&&q!==root;q=q.parentElement){const o=getComputedStyle(q).overflowX; if(['auto','scroll','hidden','clip'].includes(o)) return true;} return false;})(c)) out.push({t:c.tagName.toLowerCase()+'.'+(''+c.className).split(/\s+/).slice(0,2).join('.'), past, w:Math.round(r.width), ox:cs.overflowX, minW:cs.minWidth});
  }
  // outermost only
  const els=[...root.querySelectorAll('*')];
  return JSON.stringify(out.slice(0,10),null,1);
}, process.argv[3]));
await b.close();
