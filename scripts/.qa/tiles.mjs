import { chromium } from 'playwright';
const [route='/en/', w='390'] = process.argv.slice(2);
const b=await chromium.launch();
const p=await(await b.newContext({viewport:{width:+w,height:900},colorScheme:'light'})).newPage();
await p.goto('http://localhost:4321'+route,{waitUntil:'networkidle'});
await p.evaluate(()=>document.fonts.ready);
console.log(await p.evaluate(()=>{
  const t=[...document.querySelectorAll('.bento__cell')].map(e=>Math.round(e.getBoundingClientRect().height));
  const head=document.querySelector('#industries .shell--wide');
  return 'tiles: '+t.join(',')+'\nsum: '+t.reduce((a,c)=>a+c,0)+'\nheader block: '+Math.round(head.getBoundingClientRect().height);
}));
await b.close();
