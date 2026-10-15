#!/usr/bin/env node
/* Stamps the shared header + footer (shared/header.html, shared/footer.html) into every customer page.
 *
 *   node scripts/sync-chrome.mjs
 *
 * Idempotent: the stamped blocks sit between <!--chrome:header--> / <!--chrome:footer--> markers and are
 * replaced on every run. Edit /shared (and the .sh-/.sf- rules in public/site.css), then re-run this.
 * Needs `parse5` (npm i -D parse5).
 */
import { parse } from 'parse5';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const PUBLIC = path.join(ROOT, 'public');
const header = fs.readFileSync(path.join(ROOT, 'shared/header.html'), 'utf8').trim() + '\n';
const footer = fs.readFileSync(path.join(ROOT, 'shared/footer.html'), 'utf8').trim() + '\n';

// Customer pages that get the shared chrome (studio D8-*, and the design artboards D0/D9/D10/D17/D18, do not).
const PAGES = fs.readdirSync(PUBLIC).filter((f) => /^D.*\.dc\.html$/.test(f) && !/^D(0|8|9|10|17|18)-/.test(f)).sort();

// Pages whose own top bar is functional (checkout steps, proof toolbar): keep it as a sub-bar under the shared header.
const SUBBAR = {
  'D2-Builder': { tag: 'nav', label: 'Order steps' },
  'D3-Checkout': { tag: 'nav', label: 'Order steps' },
  'D4-Upload': { tag: 'nav', label: 'Order steps', dropLinks: ['D5-Portal.dc.html'] },
  'D6-Proof': { tag: 'section', label: 'Proof tools', dark: true },
};
// Pages with no top-level header/footer slot of their own.
const WRAP = new Set(['D11-SignIn']);

const kids = (n) => (n.childNodes || []).filter((c) => c.nodeName && !c.nodeName.startsWith('#'));
const find = (n, name) => { if (n.nodeName === name) return n; for (const c of n.childNodes || []) { const r = find(c, name); if (r) return r; } return null; };
const attr = (n, k) => (n.attrs || []).find((a) => a.name === k)?.value || '';
const walk = (n, fn) => { fn(n); for (const c of n.childNodes || []) walk(c, fn); };

const HDR_RE = /<!--chrome:header-->[\s\S]*?<!--\/chrome:header-->\n?/;
const FTR_RE = /<!--chrome:footer-->[\s\S]*?<!--\/chrome:footer-->\n?/;

let changed = 0;
for (const f of PAGES) {
  const key = f.replace('.dc.html', '');
  const file = path.join(PUBLIC, f);
  let src = fs.readFileSync(file, 'utf8');
  const original = src;
  const hdrHtml = SUBBAR[key]?.dark ? header.replace('<header class="sh"', '<header class="sh sh--dark"') : header;
  // already stamped? refresh the blocks in place (keeps their position) and only stamp what is missing
  const hadHdr = HDR_RE.test(src), hadFtr = FTR_RE.test(src);
  if (hadHdr) src = src.replace(HDR_RE, () => hdrHtml);
  if (hadFtr) src = src.replace(FTR_RE, () => footer);

  const doc = parse(src, { sourceCodeLocationInfo: true });
  const xdc = find(doc, 'x-dc');
  const root = kids(xdc).filter((k) => !['helmet', 'script', 'style'].includes(k.nodeName))[0];
  const ch = kids(root);
  const hdr = ch.find((c) => c.nodeName === 'header');
  const ftr = ch.find((c) => c.nodeName === 'footer');
  const edits = []; // {start,end,text}

  if (hadHdr && hadFtr) {
    // nothing to insert
  } else if (WRAP.has(key)) {
    const s = root.sourceCodeLocation.startOffset, e = root.sourceCodeLocation.endOffset;
    edits.push({ start: s, end: s, text: '<div>\n' + hdrHtml });
    edits.push({ start: e, end: e, text: footer + '</div>' });
  } else {
    if (hadHdr) {
      // header already stamped
    } else if (hdr) {
      const L = hdr.sourceCodeLocation;
      if (SUBBAR[key]) {
        // keep the page's own bar, demoted to a sub-bar; drop its logo / duplicate account link
        edits.push({ start: L.startTag.startOffset, end: L.startTag.endOffset, text: src.slice(L.startTag.startOffset, L.startTag.endOffset).replace('<header', `<${SUBBAR[key].tag} class="sh-sub" aria-label="${SUBBAR[key].label}"`) });
        edits.push({ start: L.endTag.startOffset, end: L.endTag.endOffset, text: `</${SUBBAR[key].tag}>` });
        walk(hdr, (n) => {
          if (n.nodeName !== 'a' || !n.sourceCodeLocation) return;
          const cls = attr(n, 'class'), href = attr(n, 'href');
          if (/\blg\b/.test(cls) || (SUBBAR[key].dropLinks || []).includes(href)) edits.push({ start: n.sourceCodeLocation.startOffset, end: n.sourceCodeLocation.endOffset, text: '' });
        });
        edits.push({ start: L.startOffset, end: L.startOffset, text: hdrHtml });
      } else {
        edits.push({ start: L.startOffset, end: L.endOffset, text: hdrHtml });
      }
    } else {
      const first = ch[0];
      edits.push({ start: first.sourceCodeLocation.startOffset, end: first.sourceCodeLocation.startOffset, text: hdrHtml });
    }
    if (hadFtr) {
      // footer already stamped
    } else if (ftr) edits.push({ start: ftr.sourceCodeLocation.startOffset, end: ftr.sourceCodeLocation.endOffset, text: footer });
    else edits.push({ start: root.sourceCodeLocation.endTag.startOffset, end: root.sourceCodeLocation.endTag.startOffset, text: footer });
  }

  // apply from the end so earlier offsets stay valid
  edits.sort((a, b) => b.start - a.start || b.end - a.end);
  for (const e of edits) src = src.slice(0, e.start) + e.text + src.slice(e.end);

  // page head: shared script
  if (!src.includes('src="/chrome.js"')) src = src.replace('<link rel="stylesheet" href="/site.css">', '<link rel="stylesheet" href="/site.css">\n<script src="/chrome.js" defer></script>');
  // sample price list (window.milesPricing), synchronous so component scripts can read it while rendering
  if (!src.includes('src="/pricing.js"')) src = src.replace('<script src="/chrome.js" defer></script>', '<script src="/pricing.js"></script>\n<script src="/chrome.js" defer></script>');
  // adaptive pointer (inverts against whatever is behind it)
  if (!src.includes('src="/pointer.js"')) src = src.replace('<script src="/chrome.js" defer></script>', '<script src="/chrome.js" defer></script>\n<script src="/pointer.js" defer></script>');
  // keep the D11 grid exactly one screen below the header
  if (key === 'D11-SignIn') src = src.replace('min-height: 100vh; min-height: 100svh">', 'min-height: calc(100vh - 79px); min-height: calc(100svh - 79px)">');

  if (src !== original) { fs.writeFileSync(file, src); changed++; console.log('stamped', f); }
}
console.log(`\n${changed} page(s) updated, ${PAGES.length} customer pages total`);
