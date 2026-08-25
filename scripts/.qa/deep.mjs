import { chromium } from 'playwright';
const b=await chromium.launch();
const p=await(await b.newContext({viewport:{width:1280,height:900},colorScheme:'light'})).newPage();
await p.goto('http://localhost:4321/en/industries/'+process.argv[2]+'/',{waitUntil:'networkidle'});
await p.evaluate(()=>document.fonts.ready);
console.log(await p.evaluate((sel)=>{
  const root=document.querySelector(sel); if(!root) return 'not found';
  const words=el=>el.innerText.replace(/\s+/g,' ').trim().split(' ').filter(Boolean).length;
  return [...root.children].map(c=>`  ${c.tagName.toLowerCase()}.${(''+c.className).split(/\s+/)[0]}  ${words(c)}w ${Math.round(c.getBoundingClientRect().height)}px`).join('\n');
}, process.argv[3]));
await b.close();
