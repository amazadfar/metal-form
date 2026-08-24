import { chromium } from 'playwright';
const b=await chromium.launch();
const p=await(await b.newContext({viewport:{width:1512,height:950},colorScheme:'light'})).newPage();
await p.goto('http://localhost:4321/',{waitUntil:'networkidle'});
await p.evaluate(()=>document.fonts.ready);
await p.waitForTimeout(600);
console.log(await p.evaluate(()=>{
 const t=[...document.querySelectorAll('.tile')].map(e=>Math.round(e.getBoundingClientRect().height));
 return 'row heights: '+[t[0],t[3],t[6]].join(' / ')+'  all: '+t.join(',');
}));
await b.close();
