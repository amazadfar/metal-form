import { chromium } from 'playwright';
const b=await chromium.launch();
const p=await(await b.newContext({viewport:{width:1440,height:900},colorScheme:'light'})).newPage();
p.on('pageerror', e=>console.log('PAGE ERR:', e.message));
p.on('console', m=>{ if(m.type()==='error') console.log('CONSOLE:', m.text()); });
await p.goto('http://localhost:4321'+process.argv[2],{waitUntil:'networkidle'});
await p.waitForTimeout(800);
console.log(await p.evaluate(()=>{
  const main=document.querySelector('main');
  const secs=[...main.querySelectorAll('section[id]')];
  const withH2=secs.filter(s=>s.querySelector('h2')?.textContent?.trim());
  const rail=document.querySelector('[data-chapter-index]');
  return JSON.stringify({sections:secs.length, withH2:withH2.length, railExists:!!rail, hidden:rail?.hidden, dataRail:rail?.dataset.rail, links:document.querySelectorAll('.cidx__link').length}, null, 1);
}));
await p.evaluate(()=>window.scrollTo(0, 4000));
await p.waitForTimeout(600);
console.log('after scroll:', await p.evaluate(()=>{const r=document.querySelector('[data-chapter-index]');return JSON.stringify({hidden:r?.hidden, dataRail:r?.dataset.rail, opacity:r?getComputedStyle(r).opacity:null, transform:r?getComputedStyle(r).transform:null});}));
await b.close();
