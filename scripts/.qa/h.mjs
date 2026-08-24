import { chromium } from 'playwright';
const b=await chromium.launch();
for (const [w,h] of [[1512,950],[1440,800],[1280,720],[390,844],[820,1180]]) {
  const p=await(await b.newContext({viewport:{width:w,height:h},colorScheme:'light'})).newPage();
  await p.goto('http://localhost:4321/',{waitUntil:'networkidle'});
  await p.evaluate(()=>document.fonts.ready);
  const r=await p.evaluate(()=>({doc:document.documentElement.scrollHeight, vis:window.innerHeight, x:document.documentElement.scrollWidth>window.innerWidth}));
  console.log(`${w}x${h}: page ${r.doc}px (viewport ${r.vis}) overflowY=${r.doc>r.vis+2} overflowX=${r.x}`);
  await p.close();
}
await b.close();
