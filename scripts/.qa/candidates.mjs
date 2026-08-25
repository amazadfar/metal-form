import { chromium } from 'playwright';
const ALL=['beverage','cosmetics','appliances','chemical','electrical','consumer-products',
  'agriculture','plumbing','furniture','marine','custom-projects'];
const b=await chromium.launch();
const ctx=await b.newContext({viewport:{width:1280,height:900},colorScheme:'light'});
for(const ch of (process.argv.slice(2).length?process.argv.slice(2):ALL)){
  const p=await ctx.newPage();
  await p.goto('http://localhost:4321/en/industries/'+ch+'/',{waitUntil:'networkidle'});
  await p.evaluate(()=>document.fonts.ready);
  const rows=await p.evaluate(()=>{
    const main=document.querySelector('main'); const out=[];
    const words=el=>el.innerText.replace(/\s+/g,' ').trim().split(' ').filter(Boolean).length;
    for(const s of main.querySelectorAll('section[id]')){
      const kids=[...s.children].flatMap(c=>c.className&&/shell/.test(''+c.className)?[...c.children]:[c]);
      const blocks=kids.filter(c=>getComputedStyle(c).display!=='none'&&words(c)>=40);
      // the biggest block is the section's artefact; everything after it is a candidate
      let maxI=0,maxW=0;
      blocks.forEach((c,i)=>{const w=words(c); if(w>maxW){maxW=w;maxI=i;}});
      blocks.forEach((c,i)=>{
        if(i<=maxI) return;
        const cls=(''+c.className).split(/\s+/).filter(Boolean)[0]||c.tagName.toLowerCase();
        out.push({sec:s.id, cls, w:words(c), h:Math.round(c.getBoundingClientRect().height),
                  head:c.querySelector('h3,h4,h5')?.textContent?.trim().slice(0,34)||''});
      });
    }
    return out;
  });
  console.log('\n════ '+ch);
  rows.forEach(r=>console.log(`   §${r.sec.padEnd(13)} .${r.cls.padEnd(24)} ${String(r.w).padStart(4)}w ${String(r.h).padStart(5)}px  ${r.head}`));
  await p.close();
}
await b.close();
