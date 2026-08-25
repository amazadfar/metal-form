import { chromium } from 'playwright';
const ALL=['beverage','automotive','cosmetics','appliances','chemical','electrical',
  'consumer-products','agriculture','plumbing','furniture','marine','custom-projects'];
const FILE={beverage:'Beverage',automotive:'Automotive',cosmetics:'Cosmetics',appliances:'Appliances',
  chemical:'Chemical',electrical:'Electrical','consumer-products':'Toys',agriculture:'Agriculture',
  plumbing:'Plumbing',furniture:'Furniture',marine:'Marine','custom-projects':'Custom'};
// Never collapse: the heading, the lead, the line that says what Metal Form
// does about the problem, source attributions, the responsibility boundary,
// or a block that is already an accordion.
const KEEP=/head|close|src|source|bound|scope|statement|facts|panels|disc|cta|lede|kick|lead|^h[1-6]$/i;
const b=await chromium.launch();
const ctx=await b.newContext({viewport:{width:1280,height:900},colorScheme:'light'});
const cmds=[];
for(const ch of (process.argv.slice(2).length?process.argv.slice(2):ALL)){
  const p=await ctx.newPage();
  await p.goto('http://localhost:4321/en/industries/'+ch+'/',{waitUntil:'networkidle'});
  await p.evaluate(()=>document.fonts.ready);
  const rows=await p.evaluate((keepSrc)=>{
    const KEEP=new RegExp(keepSrc,'i');
    const AGGRESSIVE=true;
    const main=document.querySelector('main'); const out=[];
    const words=el=>el.innerText.replace(/\s+/g,' ').trim().split(' ').filter(Boolean).length;
    for(const s of main.querySelectorAll('section[id]')){
      if(s.id==='contact') continue;
      let shells=[...s.children].flatMap(c=>c.className&&/shell/.test(''+c.className)?[...c.children]:[c]);
      for(let d=0;d<2;d++){
        const big=shells.filter(c=>words(c)>=40);
        if(big.length===1&&big[0].children.length>1) shells=[...big[0].children]; else break;
      }
      const cand=shells.filter(c=>{
        if(getComputedStyle(c).display==='none') return false;
        if(c.closest('details')) return false;
        if(words(c)<35) return false;
        const cls=(''+c.className).split(/\s+/).filter(Boolean);
        if(!cls.length) return false;
        return !cls.some(x=>KEEP.test(x));
      });
      let maxI=0,maxW=0;
      cand.forEach((c,i)=>{const w=words(c); if(w>maxW){maxW=w;maxI=i;}});
      // A block that drives a scroll-linked figure cannot be collapsed: shut,
      // it never enters the reading window and the drawing never advances.
      const drives = c => !!c.querySelector('[data-station-step]') || c.hasAttribute('data-station-step');
      cand.forEach((c,i)=>{
        if(drives(c)) return;
        if(i===maxI && !AGGRESSIVE) return;     // the artefact stays
        const cls=(''+c.className).split(/\s+/).filter(Boolean)[0];
        out.push({sec:s.id, cls, w:words(c)});
      });
    }
    return out;
  }, KEEP.source);
  const seen=new Set();
  rows.forEach(r=>{ if(seen.has(r.cls))return; seen.add(r.cls);
    cmds.push(`node scripts/collapse-block.mjs ${FILE[ch]}.astro ${r.cls} ${r.w>90?'reasoning':'detail'} --all   # §${r.sec} ${r.w}w`); });
  await p.close();
}
await b.close();
console.log(cmds.join('\n'));
