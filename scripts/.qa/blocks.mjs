import { chromium } from 'playwright';
const b=await chromium.launch();
const ctx=await b.newContext({viewport:{width:1280,height:900},colorScheme:'light'});
for(const ch of process.argv.slice(2)){
  const p=await ctx.newPage();
  await p.goto('http://localhost:4321/en/industries/'+ch+'/',{waitUntil:'networkidle'});
  await p.evaluate(()=>document.fonts.ready);
  console.log('\n════════ '+ch);
  console.log(await p.evaluate(()=>{
    const main=document.querySelector('main');
    const out=[];
    const words=el=>el.innerText.replace(/\s+/g,' ').trim().split(' ').filter(Boolean).length;
    for(const s of main.querySelectorAll('section[id]')){
      const h2=s.querySelector('h2')?.textContent?.trim().slice(0,42)||'';
      out.push(`\n  §${s.id}  ${Math.round(s.getBoundingClientRect().height)}px ${words(s)}w   “${h2}”`);
      // direct grandchildren of the section's shell: the real blocks
      let shells=[...s.children].flatMap(c=>c.className&&/shell/.test(''+c.className)?[...c.children]:[c]);
      // Some chapters wrap a whole section in one body div; descend into it.
      for(let d=0; d<2; d++){
        const big=shells.filter(c=>words(c)>=40);
        if(big.length===1 && big[0].children.length>1) shells=[...big[0].children];
        else break;
      }
      for(const c of shells){
        const cs=getComputedStyle(c); if(cs.display==='none') continue;
        const w=words(c); if(w<8) continue;
        const head=c.querySelector('h3,h4,h5')?.textContent?.trim().slice(0,40)||'';
        const cls=(''+c.className).split(/\s+/).filter(Boolean).slice(0,2).join('.');
        out.push(`      ${String(Math.round(c.getBoundingClientRect().height)).padStart(5)}px ${String(w).padStart(4)}w  ${c.tagName.toLowerCase()}.${cls.padEnd(26)} ${head}`);
      }
    }
    return out.join('\n');
  }));
  await p.close();
}
await b.close();
