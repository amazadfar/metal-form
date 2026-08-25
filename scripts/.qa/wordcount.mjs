import { chromium } from 'playwright';
const IND=['medical','beverage','automotive','cosmetics','appliances','chemical','electrical','consumer-products','agriculture','plumbing','furniture','marine','custom-projects'];
const b=await chromium.launch();
const ctx=await b.newContext({viewport:{width:390,height:844},colorScheme:'light'});
console.log('chapter'.padEnd(20),'sections'.padStart(9),'words'.padStart(7),'para>4ln'.padStart(9),'height'.padStart(8));
for(const i of IND){
  const p=await ctx.newPage();
  await p.goto('http://localhost:4321/en/industries/'+i+'/',{waitUntil:'networkidle'});
  await p.evaluate(()=>document.fonts.ready);
  const r=await p.evaluate(()=>{
    const main=document.querySelector('main');
    const secs=main.querySelectorAll('section[id]').length;
    const text=main.innerText.replace(/\s+/g,' ').trim();
    const words=text.split(' ').length;
    let longParas=0;
    for(const el of main.querySelectorAll('p')){
      const cs=getComputedStyle(el); if(cs.display==='none') continue;
      const lh=parseFloat(cs.lineHeight)||20;
      const lines=Math.round(el.getBoundingClientRect().height/lh);
      if(lines>4) longParas++;
    }
    return {secs,words,longParas,h:document.documentElement.scrollHeight};
  });
  console.log(i.padEnd(20), String(r.secs).padStart(9), String(r.words).padStart(7), String(r.longParas).padStart(9), (r.h+'px').padStart(8));
  await p.close();
}
await b.close();
