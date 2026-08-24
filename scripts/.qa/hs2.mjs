import { chromium } from 'playwright';
const b=await chromium.launch();
const p=await(await b.newContext({viewport:{width:390,height:800},colorScheme:'light'})).newPage();
await p.goto('http://localhost:4321/en/industries/plumbing/',{waitUntil:'networkidle'});
await p.evaluate(()=>document.fonts.ready);
await p.evaluate(()=>window.scrollTo(0,4000)); await p.waitForTimeout(400);
console.log(await p.evaluate(()=>{
  const de=document.documentElement;
  const before=de.scrollWidth;
  const rail=document.querySelector('[data-chapter-index]');
  const list=document.querySelector('[data-chapter-index-list]');
  const cs=list?getComputedStyle(list):null;
  const out={before, railW:rail?rail.getBoundingClientRect().width:null,
    listW:list?list.getBoundingClientRect().width:null, listScrollW:list?list.scrollWidth:null,
    overflowX:cs?cs.overflowX:null, maxInline:cs?cs.maxInlineSize:null, minInline:cs?cs.minInlineSize:null};
  rail?.remove();
  out.afterRemovingRail=de.scrollWidth;
  return JSON.stringify(out,null,1);
}));
await b.close();
