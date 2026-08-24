import { chromium } from 'playwright';
const [route='/en/', w='390', h='844'] = process.argv.slice(2);
const b=await chromium.launch();
const p=await(await b.newContext({viewport:{width:+w,height:+h},colorScheme:'light'})).newPage();
await p.goto('http://localhost:4321'+route,{waitUntil:'networkidle'});
await p.evaluate(()=>document.fonts.ready);
console.log(await p.evaluate(()=>{
  const out=[...document.querySelectorAll('main > section, main > *')].map(e=>{
    const r=e.getBoundingClientRect();
    return `${(e.id||e.className.split(/\s+/)[0]||e.tagName).padEnd(26)} ${Math.round(r.height)}px`;
  });
  return out.join('\n')+`\nTOTAL ${Math.round(document.documentElement.scrollHeight)}px`;
}));
await b.close();
