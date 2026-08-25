import { chromium } from 'playwright';
const b=await chromium.launch();
const p=await(await b.newContext({viewport:{width:390,height:844},colorScheme:'light'})).newPage();
await p.goto('http://localhost:4321/en/industries/plumbing/',{waitUntil:'networkidle'});
await p.evaluate(()=>document.fonts.ready);
await p.evaluate(()=>window.scrollTo(0,4000)); await p.waitForTimeout(700);
console.log(await p.evaluate(()=>{
  const d=document.querySelector('.rfq-dock'), r=document.querySelector('[data-chapter-index]');
  return `dock ${Math.round(d.getBoundingClientRect().height)}px (${((d.getBoundingClientRect().height/844)*100).toFixed(1)}% of viewport) · rail ${Math.round(r.getBoundingClientRect().height)}px`;
}));
await b.close();
