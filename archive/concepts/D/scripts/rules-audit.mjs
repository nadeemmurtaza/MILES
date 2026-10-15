#!/usr/bin/env node
/* Design-rules audit at phone width (see DESIGN-RULES.md): typefaces in use, text under 12px, uppercase longer than 5 words, border-radius
 * values, controls under 40px tall, section padding that is not a multiple of 8.
 *   node scripts/serve.mjs &   then   W=390 node scripts/rules-audit.mjs        (STUDIO=1 for the studio pages, ONLY=D5 to filter, LANG2=ar)
 * Known, accepted hits: the 8.4px "RETOLD" tagline inside the logo, the illustrated book-cover / gift-card artwork, toggles/pins/stars whose touch area is
 * extended with a transparent ::before, and the home hero whose padding is a fluid clamp(). */
import { chromium } from 'playwright-core'; import fs from 'fs'; import path from 'path'; import { fileURLToPath } from 'url';
const DIR=path.join(path.dirname(fileURLToPath(import.meta.url)),'..','public'), W=+process.env.W||390, LANG=process.env.LANG2||'en';
const only=process.env.ONLY?process.env.ONLY.split(','):null; const incl=process.env.STUDIO?/^D8-/:/^D(?!8-|0-|9-|10-|17-|18-)/;
const pages=fs.readdirSync(DIR).filter(f=>/\.dc\.html$/.test(f)&&incl.test(f)&&(!only||only.some(o=>f.includes(o)))).sort();
const b=await chromium.launch({executablePath:process.env.CHROMIUM||undefined,args:['--no-sandbox']});
const agg={fonts:{},small:{},upper:{},radii:{},shadow:{},touch:{},space:{}}; const per={};
const add=(k,key,pg)=>{ const o=agg[k][key]||(agg[k][key]=new Set()); o.add(pg); };
for(const f of pages){
  const ctx=await b.newContext({viewport:{width:W,height:W<400?740:844},isMobile:true,hasTouch:true,reducedMotion:'reduce'}); await ctx.addInitScript(l=>{try{localStorage.setItem('miles.lang',l);}catch(e){}},LANG);
  const p=await ctx.newPage(); await p.goto(''+(process.env.BASE||'http://127.0.0.1:8792')+'/'+f); await p.waitForTimeout(1800);
  const h=await p.evaluate(()=>document.documentElement.scrollHeight); for(let y=0;y<h;y+=500){await p.evaluate(yy=>scrollTo(0,yy),y);await p.waitForTimeout(40);} await p.evaluate(()=>scrollTo(0,0));
  const r=await p.evaluate(()=>{
    const out={fonts:{},small:[],upper:[],radii:{},shadow:[],touch:[],space:[]};
    const vis=e=>{const cs=getComputedStyle(e); if(cs.display==='none'||cs.visibility==='hidden'||+cs.opacity<.05)return false; const r=e.getBoundingClientRect(); return r.width>1&&r.height>1;};
    const hidden=e=>{ for(let p=e;p&&p!==document.body;p=p.parentElement){ const cs=getComputedStyle(p); if(cs.display==='none'||cs.visibility==='hidden')return true; const d=p.closest&&p.closest('details:not([open])'); if(d&&!p.closest('summary')&&p!==d) return true;} return false; };
    const desc=e=>e.tagName.toLowerCase()+(e.className&&typeof e.className==='string'?'.'+e.className.split(/\s+/)[0]:'')+' "'+(e.innerText||'').trim().replace(/\s+/g,' ').slice(0,24)+'"';
    const skip=e=>e.closest('.cvF,.cover,.pgR,svg,[aria-hidden="true"]');
    const w=document.createTreeWalker(document.body,NodeFilter.SHOW_TEXT); let n;
    while(n=w.nextNode()){ const t=n.nodeValue.trim(); if(!t)continue; const e=n.parentElement; if(!e||/^(SCRIPT|STYLE|NOSCRIPT)$/.test(e.tagName)||hidden(e)||!vis(e))continue; const cs=getComputedStyle(e);
      const fam=cs.fontFamily.split(',')[0].replace(/["']/g,'').trim(); out.fonts[fam]=(out.fonts[fam]||0)+1;
      const fs_=parseFloat(cs.fontSize); if(fs_<12&&!skip(e)) out.small.push(fs_+'px '+desc(e));
      const up=cs.textTransform==='uppercase'||(/[A-Z]{3}/.test(t)&&t===t.toUpperCase()&&/[A-Z]/.test(t)); const wc=t.split(/\s+/).filter(x=>/[A-Za-z]/.test(x)).length; if(up&&wc>5) out.upper.push(wc+'w '+desc(e)); }
    for(const e of document.querySelectorAll('body *')){ if(hidden(e)||!vis(e))continue; const cs=getComputedStyle(e);
      const bg=cs.backgroundColor!=='rgba(0, 0, 0, 0)'||cs.borderTopWidth!=='0px'||cs.backgroundImage!=='none'||e.tagName==='IMG'; if(bg&&!skip(e)&&!e.closest('svg')){ const rd=[cs.borderTopLeftRadius,cs.borderTopRightRadius,cs.borderBottomRightRadius,cs.borderBottomLeftRadius]; if(new Set(rd).size===1){ let v=rd[0]; if(v!=='0px'){ const num=parseFloat(v); const key=v.includes('%')?v:(num>=200?'pill':num+'px'); out.radii[key]=(out.radii[key]||[]); if(out.radii[key].length<3) out.radii[key].push(desc(e)); } } }
      if(cs.boxShadow!=='none'&&!skip(e)){ const sh=cs.boxShadow; const parts=sh.match(/rgba?\([^)]*\)[^,]*?(?:,(?![^(]*\))|$)/g)||[sh]; if(/rgba?\(0, 0, 0/.test(sh)) out.shadow.push('black '+desc(e)); const nums=sh.replace(/rgba?\([^)]*\)/g,'').trim().split(/\s+/).map(parseFloat).filter(x=>!isNaN(x)); if(nums.length>=3&&nums[2]<12&&!/inset/.test(sh)&&!/0px 0px 0px/.test(sh)) out.shadow.push('blur'+nums[2]+' '+desc(e)); }
      if(/^(A|BUTTON|INPUT|SELECT|TEXTAREA|SUMMARY)$/.test(e.tagName)||e.getAttribute('role')==='button'){ if(e.type==='hidden'||e.type==='checkbox'||e.type==='radio'&&false)continue; const r=e.getBoundingClientRect(); const inline=e.tagName==='A'&&cs.display==='inline'; if(!inline&&r.height<40&&!skip(e)) out.touch.push(Math.round(r.width)+'x'+Math.round(r.height)+' '+desc(e)); } }
    for(const e of document.querySelectorAll('main > *, body > x-dc > div > *, section')){ if(!vis(e))continue; const cs=getComputedStyle(e); for(const s of ['paddingTop','paddingBottom']){ const v=parseFloat(cs[s]); if(v>24&&v%8!==0) out.space.push(Math.round(v)+'px '+s+' '+desc(e)); } }
    return out; });
  per[f]=r;
  for(const [k,v] of Object.entries(r.fonts)) add('fonts',k,f); r.small.forEach(x=>add('small',x,f)); r.upper.forEach(x=>add('upper',x,f)); for(const k of Object.keys(r.radii)) add('radii',k+' e.g. '+r.radii[k][0],f); r.shadow.forEach(x=>add('shadow',x,f)); r.touch.forEach(x=>add('touch',x,f)); r.space.forEach(x=>add('space',x,f));
  await ctx.close(); process.stderr.write('.');
}
await b.close(); console.log('\n=== fonts'); for(const [k,v] of Object.entries(agg.fonts)) console.log(k,[...v].length+' pages');
for(const k of ['upper','shadow','small']){ console.log('\n=== '+k); for(const [x,v] of Object.entries(agg[k]).slice(0,40)) console.log(x,'|',[...v].map(s=>s.replace('.dc.html','')).slice(0,4).join(',')); }
console.log('\n=== radii'); for(const [x,v] of Object.entries(agg.radii)) console.log(x,'|',[...v].length+' pages');
console.log('\n=== touch (<40px tall), '+Object.keys(agg.touch).length+' distinct'); for(const [x,v] of Object.entries(agg.touch).slice(0,45)) console.log(x,'|',[...v].map(s=>s.replace('.dc.html','')).slice(0,3).join(','));
console.log('\n=== spacing (not multiple of 8), '+Object.keys(agg.space).length+' distinct'); for(const [x,v] of Object.entries(agg.space).slice(0,30)) console.log(x,'|',[...v].map(s=>s.replace('.dc.html','')).slice(0,3).join(','));
if(process.env.OUT) fs.writeFileSync(process.env.OUT,JSON.stringify(per));
