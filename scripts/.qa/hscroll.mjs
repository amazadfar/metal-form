import { chromium } from 'playwright';
const b=await chromium.launch();
for (const r of process.argv.slice(2)) {
  const p=await(await b.newContext({viewport:{width:390,height:800},colorScheme:'light'})).newPage();
  await p.goto('http://localhost:4321'+r,{waitUntil:'networkidle'});
  await p.evaluate(()=>document.fonts.ready);
  await p.waitForTimeout(400);
  await p.evaluate(()=>window.scrollTo(0,4000));
  await p.waitForTimeout(500);
  console.log(r, await p.evaluate(()=>{
    const de=document.documentElement;
    const info={scrollW:de.scrollWidth, clientW:de.clientWidth, bodyScrollW:document.body.scrollWidth, scrollX:(window.scrollTo(600,4000),window.scrollX)};
    window.scrollTo(0,4000);
    // who is widest / furthest out
    const vw=de.clientWidth; const bad=[];
    for(const el of document.querySelectorAll('body *')){
      const cs=getComputedStyle(el); if(cs.display==='none') continue;
      const rr=el.getBoundingClientRect(); if(!rr.width) continue;
      const past=Math.max(0, Math.round(rr.right-vw), Math.round(-rr.left));
      if(past>2) bad.push({t:el.tagName.toLowerCase()+'.'+(''+el.className).split(/\s+/).slice(0,2).join('.'), past, pos:cs.position});
    }
    info.worst = bad.sort((a,b)=>b.past-a.past).slice(0,5);
    return JSON.stringify(info);
  }));
  await p.close();
}
await b.close();
