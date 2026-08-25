import { chromium } from 'playwright';
const b=await chromium.launch();
const p=await(await b.newContext({viewport:{width:390,height:844},colorScheme:'light'})).newPage();
await p.goto('http://localhost:4321/en/industries/'+process.argv[2]+'/',{waitUntil:'networkidle'});
await p.evaluate(()=>document.fonts.ready);
console.log(await p.evaluate(()=>{
  const out=[];
  for(const s of document.querySelectorAll('main section[id]')){
    const r=s.getBoundingClientRect();
    const words=s.innerText.replace(/\s+/g,' ').trim().split(' ').length;
    const paras=[...s.querySelectorAll('p')].filter(e=>{
      const cs=getComputedStyle(e); if(cs.display==='none') return false;
      const lh=parseFloat(cs.lineHeight)||20;
      return Math.round(e.getBoundingClientRect().height/lh)>4;
    }).length;
    out.push(`${s.id.padEnd(14)} ${String(Math.round(r.height)).padStart(6)}px ${String(words).padStart(5)}w ${paras} long-paras`);
  }
  out.push('TOTAL '+document.documentElement.scrollHeight+'px');
  return out.join('\n');
}));
await b.close();
