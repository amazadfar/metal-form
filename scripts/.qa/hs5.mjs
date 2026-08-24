import { chromium } from 'playwright';
const b=await chromium.launch();
const p=await(await b.newContext({viewport:{width:390,height:800},colorScheme:'light'})).newPage();
await p.goto('http://localhost:4321'+process.argv[2],{waitUntil:'networkidle'});
await p.evaluate(()=>document.fonts.ready);
await p.waitForTimeout(400);
console.log(await p.evaluate((sel)=>{
  let root=document.querySelector(sel); const path=[];
  for(let i=0;i<8;i++){
    const rr=root.getBoundingClientRect();
    path.push(`${root.tagName.toLowerCase()}.${(''+root.className).split(/\s+/).slice(0,2).join('.')} clientW=${root.clientWidth} scrollW=${root.scrollWidth} left=${Math.round(rr.left)} right=${Math.round(rr.right)}`);
    let next=null, worst=0;
    for(const c of root.children){
      const cs=getComputedStyle(c); if(cs.display==='none') continue;
      const r=c.getBoundingClientRect(); const rr2=root.getBoundingClientRect();
      const past=Math.max(r.right-rr2.right, rr2.left-r.left);
      if(past>worst && r.width>1){ worst=past; next=c; }
    }
    if(!next) break;
    root=next;
  }
  return path.join('\n');
}, process.argv[3]));
await b.close();
