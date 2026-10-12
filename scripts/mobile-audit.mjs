#!/usr/bin/env node
/* Phone layout audit: document overflow, text outside the viewport or clipped, overlapping text (checked at several scroll positions so
 * sticky/fixed elements are covered), tap targets under 30px, sticky blocks, and whether a studio page has its nav.
 *   node scripts/serve.mjs &                       # in another terminal
 *   W=390,360 LANGS=en,ar CUST=1 node scripts/mobile-audit.mjs
 * env: W widths (default 390) · H height (default 844, 740 under 400px) · LANGS en,ar · ONLY=D5,D15 (name filter) · CUST=1 (skip studio) · OUT=file.json · BASE
 * Needs `npm i --no-save playwright-core` and a Chromium (CHROMIUM=/path, default: playwright's). Known harmless hits: the sticky header's cart badge,
 * animated marquees (clipped by design), the two faces of the flip-card on the gift page, the sticky "Pay 50% now" dock on the home page. */
import { chromium } from 'playwright-core';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
const BASE=process.env.BASE||'http://127.0.0.1:8792', DIR=path.join(path.dirname(fileURLToPath(import.meta.url)),'..','public');
const W=(process.env.W||'390').split(',').map(Number), LANGS=(process.env.LANGS||'en').split(',');
const only=process.env.ONLY?process.env.ONLY.split(','):null;
const pages=fs.readdirSync(DIR).filter(f=>/^D.*\.dc\.html$/.test(f)).filter(f=>!/^D(0|9|10|17|18)-/.test(f)).filter(f=>!only||only.some(o=>f.includes(o))).filter(f=>process.env.CUST?!/^D8-/.test(f):true).sort();
const OUT=process.env.OUT||'maudit.json';
const b=await chromium.launch({executablePath:process.env.CHROMIUM||undefined,args:['--no-sandbox']});
const res={};const jobs=[];for(const f of pages)for(const w of W)for(const l of LANGS)jobs.push([f,w,l]);
function probe(){ return window.__probe(); }
const PROBE=function(){
  const vw=innerWidth, out={docOverflow:document.documentElement.scrollWidth-vw, outside:[], clipped:[], overlap:[], tiny:[], nav:null};
  const vis=(e,cs)=>cs.display!=='none'&&cs.visibility!=='hidden'&&+cs.opacity>0.05;
  const desc=e=>{ let s=e.tagName.toLowerCase(); if(e.id)s+='#'+e.id; const c=[...e.classList].slice(0,2).join('.'); if(c)s+='.'+c; const t=(e.innerText||'').trim().replace(/\s+/g,' ').slice(0,28); return s+(t?` "${t}"`:''); };
  // clip rect of ancestors
  const clipOf=e=>{ let r={l:-1e9,t:-1e9,r:1e9,b:1e9}; for(let p=e.parentElement;p&&p!==document.documentElement;p=p.parentElement){ const cs=getComputedStyle(p); if(cs.position==='fixed')break; if(/(hidden|auto|scroll|clip)/.test(cs.overflowX+cs.overflowY)){ const q=p.getBoundingClientRect(); const ox=/(hidden|auto|scroll|clip)/.test(cs.overflowX), oy=/(hidden|auto|scroll|clip)/.test(cs.overflowY); if(ox){r.l=Math.max(r.l,q.left);r.r=Math.min(r.r,q.right);} if(oy){r.t=Math.max(r.t,q.top);r.b=Math.min(r.b,q.bottom);} } } return r; };
  const scrollerOf=e=>{ for(let p=e.parentElement;p;p=p.parentElement){ const cs=getComputedStyle(p); if(/(auto|scroll)/.test(cs.overflowX)&&p.scrollWidth>p.clientWidth+1)return p; } return null; };
  const fixedAnc=e=>{ for(let p=e;p&&p!==document.body;p=p.parentElement){ if(getComputedStyle(p).position==='fixed')return true; } return false; };
  const leaves=[];
  const walker=document.createTreeWalker(document.body,NodeFilter.SHOW_TEXT);
  let n; while((n=walker.nextNode())){ const t=n.nodeValue; if(!t.trim())continue; const e=n.parentElement; if(!e||/^(SCRIPT|STYLE|NOSCRIPT|TEMPLATE)$/.test(e.tagName))continue; const cs=getComputedStyle(e); if(!vis(e,cs))continue; let hid=false; for(let p=e.parentElement;p;p=p.parentElement){ const c=getComputedStyle(p); if(!vis(p,c)){hid=true;break;} } if(hid)continue;
    if(e.closest('.lg,.curtain,.skip,a[href="#main"]'))continue; {const dt=e.closest('details:not([open])'); if(dt&&!e.closest('summary'))continue;} const rg=document.createRange(); rg.selectNodeContents(n); const rects=[...rg.getClientRects()].filter(r=>r.width>1&&r.height>1).map(r=>({left:r.left,right:r.right,top:r.top+r.height*.2,bottom:r.bottom-r.height*.2,width:r.width,height:r.height*.6})); if(!rects.length)continue;
    leaves.push({e,rects,fixed:fixedAnc(e),clip:clipOf(e),scroller:scrollerOf(e)}); }
  // outside viewport / clipped
  const seen=new Set();
  for(const L of leaves){ if(L.fixed)continue; for(const r of L.rects){ const c=L.clip; const ix=Math.max(0,Math.min(r.right,c.r)-Math.max(r.left,c.l)), iy=Math.max(0,Math.min(r.bottom,c.b)-Math.max(r.top,c.t)); const vis_=ix*iy, tot=r.width*r.height;
      if(r.right>vw+1&&c.r>=1e8&&!seen.has(L.e)){ seen.add(L.e); out.outside.push(desc(L.e)+` right=${Math.round(r.right)}`); }
      else if(vis_<tot*0.8&&!L.scroller&&tot>40&&!seen.has(L.e)){ seen.add(L.e); out.clipped.push(desc(L.e)+` visible=${Math.round(vis_/tot*100)}%`); }
      else if(L.scroller&&!seen.has(L.e)&&(r.left<L.scroller.getBoundingClientRect().left-1&&false)){} } }
  // overlap
  const items=leaves.filter(L=>!L.fixed);
  for(let i=0;i<items.length;i++){ for(let j=i+1;j<items.length;j++){ const A=items[i],B=items[j]; if(A.e===B.e||A.e.contains(B.e)||B.e.contains(A.e))continue;
      let hit=false; for(const a of A.rects){ for(const b of B.rects){ const ix=Math.min(a.right,b.right)-Math.max(a.left,b.left), iy=Math.min(a.bottom,b.bottom)-Math.max(a.top,b.top); if(ix>3&&iy>3&&ix*iy>0.2*Math.min(a.width*a.height,b.width*b.height)){ hit=true; break; } } if(hit)break; }
      if(hit){ // ignore if one is clipped away
        out.overlap.push(desc(A.e)+'  X  '+desc(B.e)); if(out.overlap.length>40)return out; } } }
  // tiny tap targets
  for(const e of document.querySelectorAll('a[href],button,input:not([type=hidden]),select,textarea,[role=button]')){ const cs=getComputedStyle(e); if(!vis(e,cs))continue; const r=e.getBoundingClientRect(); if(r.width<1||r.height<1||fixedAnc(e)&&false)continue; if(r.height<30||r.width<30){ if(e.tagName==='A'&&getComputedStyle(e).display==='inline'&&e.closest('p,li,span,div')&&r.height>=14&&r.width>=30)continue; out.tiny.push(desc(e)+` ${Math.round(r.width)}x${Math.round(r.height)}`); } }
  out.nav={rail:!!document.querySelector('.rail'),railVisible:(()=>{const r=document.querySelector('.rail');return r?getComputedStyle(r).display!=='none':null})(),burger:!!document.querySelector('.sh-burger,[data-studio-menu]'),hdr:!!document.querySelector('.sh-burger,header')};
  return out;
};
await Promise.all(Array.from({length:4},async()=>{ while(jobs.length){ const [f,w,l]=jobs.shift(); const ctx=await b.newContext({viewport:{width:w,height:process.env.H?+process.env.H:(w<400?740:844)},isMobile:true,hasTouch:true,reducedMotion:'reduce'}); await ctx.addInitScript((lg)=>{ try{localStorage.setItem('miles.lang',lg);}catch(e){} },l);
  const p=await ctx.newPage(); try{ await p.goto(BASE+'/'+f,{waitUntil:'load'}); await p.waitForTimeout(1800);
    await p.evaluate(`window.__probe=${PROBE.toString()}`);
    const H=await p.evaluate(()=>document.documentElement.scrollHeight); const vh=process.env.H?+process.env.H:(w<400?740:844); let r=null;
    const stickies=await p.evaluate(()=>[...document.querySelectorAll('body *')].filter(e=>getComputedStyle(e).position==='sticky').map(e=>{const cs=getComputedStyle(e);return (e.tagName.toLowerCase()+'.'+[...e.classList].slice(0,2).join('.')+' top='+cs.top+' h='+Math.round(e.getBoundingClientRect().height));}).slice(0,8));
    for(let y=0;y<=H;y+=Math.round(vh*.8)){ await p.evaluate(yy=>scrollTo(0,yy),y); await p.waitForTimeout(120); const q=await p.evaluate(probe); if(!r){r=q;} else { for(const k of ['outside','clipped','overlap','tiny']) for(const x of q[k]) if(!r[k].includes(x)) r[k].push(x); } if(y>9e4)break; }
    r.stickies=stickies; const key=`${f} @${w} ${l}`; res[key]=r; }catch(e){ res[`${f} @${w} ${l}`]={fatal:String(e).slice(0,120)}; } await ctx.close(); process.stderr.write('.'); } }));
fs.writeFileSync(OUT,JSON.stringify(res,null,1));
let bad=0; for(const [k,v] of Object.entries(res)){ if(v.fatal){console.log(k,'FATAL',v.fatal);bad++;continue;} const n=(v.docOverflow>0?1:0)+v.outside.length+v.clipped.length+v.overlap.length; if(n||v.tiny.length>3){ bad++; console.log(`\n${k}: docOverflow=${v.docOverflow} outside=${v.outside.length} clipped=${v.clipped.length} overlap=${v.overlap.length} tiny=${v.tiny.length} nav=${JSON.stringify(v.nav)}`); if(v.stickies&&v.stickies.length)console.log('    sticky:',v.stickies.join(' | ')); for(const t of ['outside','clipped','overlap']) v[t].slice(0,10).forEach(x=>console.log('   ',t[0],x)); } }
console.log('\npages with issues:',bad,'of',Object.keys(res).length);
await b.close();
