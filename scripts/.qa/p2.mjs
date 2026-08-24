import { chromium } from 'playwright';
const b=await chromium.launch();const p=await(await b.newContext({viewport:{width:1512,height:950},colorScheme:'light'})).newPage();
await p.goto('http://localhost:4321/en/',{waitUntil:'networkidle'});
console.log(await p.evaluate(()=>{
 const h=document.querySelector('.hero');const btn=document.querySelector('.hero .btn--whatsapp');const wm=document.querySelector('.hdr .wm');
 const cs=getComputedStyle(h);
 return JSON.stringify({ink:cs.getPropertyValue('--ink'), btnBg:cs.getPropertyValue('--btn-bg'),
  btnComputed:getComputedStyle(btn).backgroundColor, btnColor:getComputedStyle(btn).color,
  wmColor:wm?getComputedStyle(wm).color:null, hdrClass:document.querySelector('.hdr').className},null,1);
}));
await b.close();
