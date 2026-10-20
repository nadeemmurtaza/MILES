#!/usr/bin/env node
/* Builds the studio "Catalog & pricing" pages, under Settings: the sizes, page counts, layouts and price formula the studio offers.
 *
 *   studio   G150-G153 / GL150-GL153   150 Book sizes -> 151 Page counts -> 152 Layouts -> 153 Pricing formula
 *
 * Each page is one small step with a tab bar (the sub menu) and Back / Next links, so the four read as one flow. They reuse the studio shell of
 * 136-PrintExport (menus, footer, theme twin), and the body is drawn by public/catalog-admin.js into #cat-root. The data is the shared catalog
 * record (public/catalog.js) that the live editor reads: sizes and page counts in its first steps, layouts in the page designer, the price under the book.
 * Styles: css/catalog-admin.css.
 *
 *   node scripts/build-design-pages.mjs && node scripts/build-catalog-pages.mjs && node scripts/build-library-pages.mjs
 *   (idempotent; also adds the "Catalog & pricing" group to the studio menus and to the Settings page) */
import fs from 'fs'; import path from 'path'; import { fileURLToPath } from 'url';
const PUB = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'public');
const rd = (f) => fs.readFileSync(path.join(PUB, f), 'utf8');
const wr = (f, s) => fs.writeFileSync(path.join(PUB, f), s);

/* key, number, file suffix, tab label, title, lead, page script */
const P = [
  ['sizes', 150, 'CatalogSizes', 'Sizes', 'Book sizes', 'The shapes of page customers can choose, and their size in inches.'],
  ['pages', 151, 'CatalogPages', 'Page counts', 'Page counts', 'How many pages a book can have, and which count is marked as the most chosen.'],
  ['layouts', 152, 'CatalogLayouts', 'Layouts', 'Layouts', 'Where each cover and page starts in the editor. Switch layouts on or off, or add your own.'],
  ['pricing', 153, 'CatalogPricing', 'Pricing', 'Pricing formula', 'How the price of a book follows its size and its number of pages.']
];
const file = (ed, k) => { const p = P.find((q) => q[0] === k); return `${ed}${p[1]}-${p[2]}.dc.html`; };
const X = '<path d="M6 6l12 12M18 6L6 18"/>';
const x = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${X}</svg>`;

const catBlock = (ed, cur) => `<!--cat--><span class="smh">Catalog &amp; pricing</span>${P.map((q) => `<a href="${file(ed, q[0])}"${q[0] === cur ? ' class="on" aria-current="page"' : ''}>${q[3]}</a>`).join('')}<!--/cat-->`;

function assemble(ed, key) {
  const i = P.findIndex((q) => q[0] === key), p = P[i], D = ed === 'G';
  const base = rd(`${ed}136-PrintExport.dc.html`);
  const mIdx = base.indexOf('<main id="main"'), eIdx = base.indexOf('</main>'), sIdx = base.indexOf('<script type="text/x-dc"');
  let top = base.slice(0, mIdx), tail = base.slice(eIdx, sIdx);
  top = top.replace(/<title>[\s\S]*?<\/title>/, `<title>${D ? '' : 'Light · '}Studio · ${p[4]}</title>`);
  top = top.replace('</head>', `<script src="/catalog.js" defer></script>\n${key === 'layouts' ? '<script src="/book/store.js" defer></script>\n' : ''}<script src="/catalog-admin.js" defer></script>\n</head>`);
  const twin = file(D ? 'GL' : 'G', key);
  top = top.replace(/(<a class="thm" href=")[^"]*(")/, `$1${twin}$2`).replace(/(<a class="rl thr" href=")[^"]*(")/, `$1${twin}$2`).replace(/(<a href=")[^"]*(">(?:Dark|Light) theme<\/a>)/, `$1${twin}$2`);
  // the phone menu: the privacy group loses its "on" mark, and the catalog group (this page marked) sits before Settings
  top = top.replace(/<!--pv-->[\s\S]*?<!--\/pv-->/, (m) => m.replace(/ class="on" aria-current="page"/g, ''));
  top = top.replace(/<!--cat-->[\s\S]*?<!--\/cat-->/, '').replace('<span class="smh">Settings</span>', `${catBlock(ed, key)}<span class="smh">Settings</span>`);
  top = top.replace(/<nav class="sub2 gl" aria-label="Privacy and data pages">[\s\S]*?<\/nav>/, `<nav class="sub2 gl" aria-label="Catalog and pricing pages"><div class="s2h"><b>Catalog &amp; pricing</b><label class="s2x" for="s2t" tabindex="0" role="button" aria-label="Hide the menu" title="Hide menu and show full sidebar">${x}</label></div><div class="s2g">What you offer</div>${P.map((q) => `<a href="${file(ed, q[0])}"${q[0] === key ? ' class="on" aria-current="page"' : ''}>${q[3]}</a>`).join('')}<div class="s2g">Elsewhere</div><a href="${ed}46-StudioSettings.dc.html">Settings</a><a href="${ed}70-Editor.dc.html">Book editor</a></nav>`);
  const prev = P[i - 1], next = P[i + 1];
  const tabs = `<nav class="ed-ws" aria-label="Catalog and pricing">${P.map((q) => `<a href="${file(ed, q[0])}"${q[0] === key ? ' aria-current="page"' : ''}>${q[3]}</a>`).join('')}</nav>`;
  const flow = `<nav class="ca-flow" aria-label="Catalog steps"><a class="ed-btn" href="${prev ? file(ed, prev[0]) : `${ed}46-StudioSettings.dc.html`}">${prev ? `Back: ${prev[3]}` : 'Back to Settings'}</a><span class="ed-muted">Step ${i + 1} of ${P.length}</span><a class="ed-btn pri" href="${next ? file(ed, next[0]) : `${ed}46-StudioSettings.dc.html`}">${next ? `Next: ${next[3]}` : 'Done, back to Settings'}</a></nav>`;
  const main = `<main id="main" class="{{edCls}} dpm dps">
<div class="dp">${tabs}
<header class="dp-head"><p class="ed-kicker"><a href="${ed}46-StudioSettings.dc.html">Settings</a> / Catalog &amp; pricing</p><h1 class="dp-h1">${p[4]}</h1><p class="dp-lead">${p[5]}</p></header>
<div id="cat-root" class="ca" data-page="${key}" data-e="${ed}"></div>
${flow}
</div>
`;
  const script = `<script type="text/x-dc" data-dc-script data-props='{"$preview":{"width":1440,"height":1100}}'>
class Component extends DCLogic {
  constructor(p) { super(p); this.state = {}; }
  renderVals() { return { edCls: 'ed${D ? '' : ' ed-light'} ed-studio' }; }
}
</script>
</body>
</html>
`;
  return top + main + tail + script;
}

/* ---------- the links that lead here, added to pages that already exist ---------- */
function patchNav() {
  let n = 0;
  for (const f of fs.readdirSync(PUB).filter((q) => /^GL?\d+-.*\.dc\.html$/.test(q))) {
    const ed = f.startsWith('GL') ? 'GL' : 'G', no = +f.match(/^GL?(\d+)-/)[1];
    if (no >= 150 && no <= 153) continue;                                  // these pages carry their own navigation
    let h = rd(f), o = h;
    // studio pages: the "Catalog & pricing" group in the phone menu, before Settings (rewritten each run, so the labels never go stale)
    if (/<!--cat-->/.test(h)) h = h.replace(/<!--cat-->[\s\S]*?<!--\/cat-->/, catBlock(ed, ''));
    else if (h.includes('<span class="smh">Settings</span>')) h = h.replace('<span class="smh">Settings</span>', `${catBlock(ed, '')}<span class="smh">Settings</span>`);
    // the Settings page side menu
    const cats = `<!--cats--><div class="s2g">Catalog &amp; pricing</div>${P.map((q) => `<a href="${file(ed, q[0])}">${q[3]}</a>`).join('')}<!--/cats-->`;
    if (/<!--cats-->/.test(h)) h = h.replace(/<!--cats-->[\s\S]*?<!--\/cats-->/, cats);
    else if (/aria-label="Settings pages"/.test(h)) h = h.replace(/(<a href="[^"]*StudioPhone\.dc\.html">Studio on phone<\/a>)/, `$1${cats}`);
    // the Settings page itself: a row of cards that open the four pages
    if (no === 46) {
      const cards = `<!--catcards--><section class="ed-panel ca-cards"><h2 class="dp-h2">Catalog &amp; pricing</h2><p class="ed-muted">What customers can choose, and what it costs. Four short pages, one after the other.</p><div class="dp-cards">${P.map((q, k) => `<a class="dp-card" href="${file(ed, q[0])}"><b>${k + 1}. ${q[3]}</b><span>${q[5]}</span></a>`).join('')}</div></section><!--/catcards-->`;
      if (/<!--catcards-->/.test(h)) h = h.replace(/<!--catcards-->[\s\S]*?<!--\/catcards-->/, cards);
      else h = h.replace('<div class="u4de99d3 tabs"', `${cards}<div class="u4de99d3 tabs"`);
    }
    if (h !== o) { wr(f, h); n++; }
  }
  return n;
}

let n = 0;
for (const ed of ['G', 'GL']) for (const q of P) { wr(file(ed, q[0]), assemble(ed, q[0])); n++; }
console.log(`built ${n} catalog pages, added links to ${patchNav()} existing pages`);
