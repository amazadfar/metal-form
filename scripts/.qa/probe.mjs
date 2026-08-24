import { chromium } from 'playwright';
const BASE='http://localhost:4321';
const [path, sel, waitMs] = process.argv.slice(2);
const b = await chromium.launch();
const p = await (await b.newContext({viewport:{width:1512,height:950},colorScheme:'light'})).newPage();
p.on('console', m=>{ if(m.type()==='error') console.log('CONSOLE ERR:', m.text()); });
p.on('pageerror', e=>console.log('PAGE ERR:', e.message));
await p.goto(BASE+path,{waitUntil:'networkidle'});
await p.waitForTimeout(Number(waitMs||1500));
const out = await p.evaluate((s)=>{
  const els=[...document.querySelectorAll(s)].slice(0,4);
  return els.map(e=>{const c=getComputedStyle(e);return {cls:e.className, op:c.opacity, an:c.animationName, del:c.animationDelay, dur:c.animationDuration, fill:c.animationFillMode, tr:c.transform, disp:c.display};});
},sel);
console.log(JSON.stringify(out,null,1));
await b.close();
