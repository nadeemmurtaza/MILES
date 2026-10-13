#!/usr/bin/env node
/* Stamps the shared studio mobile layer (public/studio.css + public/studio.js) into the <head> of every studio page.
 *
 *   node scripts/sync-studio.mjs
 *
 * The studio pages (public/D8-*.dc.html) each carry their own sidebar (`aside.rail`), which their own CSS hides at <= 900px.
 * studio.css / studio.js add the phone top bar and turn that same sidebar into a slide-in drawer, so there is one source of
 * navigation. Edit those two files, not the pages.
 *
 * Idempotent: the tags sit between <!--studio:chrome--> / <!--/studio:chrome--> markers and are replaced on every run.
 * No dependencies.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const PUBLIC = path.join(ROOT, 'public');

// Every studio page gets the layer. The sign-in screen has no sidebar by design, so studio.js builds no bar there; it still takes
// the shared phone rules from studio.css.
const SKIP = new Set();
const PAGES = fs.readdirSync(PUBLIC).filter((f) => /^D8-.*\.dc\.html$/.test(f) && !SKIP.has(f.replace('.dc.html', ''))).sort();

const BLOCK = '<!--studio:chrome-->\n<link rel="stylesheet" href="/studio.css">\n<script src="/studio.js" defer></script>\n<script src="/pointer.js" defer></script>\n<!--/studio:chrome-->';
const BLOCK_RE = /<!--studio:chrome-->[\s\S]*?<!--\/studio:chrome-->/;
const SITE_CSS = '<link rel="stylesheet" href="/site.css">';

let changed = 0;
for (const f of PAGES) {
  const file = path.join(PUBLIC, f);
  const original = fs.readFileSync(file, 'utf8');
  let src = original;
  if (BLOCK_RE.test(src)) {
    src = src.replace(BLOCK_RE, () => BLOCK);
  } else if (src.includes(SITE_CSS)) {
    // right after site.css, so the studio layer loads in the same place on every page
    src = src.replace(SITE_CSS, () => SITE_CSS + '\n' + BLOCK);
  } else {
    // no site.css link: put it at the end of <head>
    src = src.replace('</head>', () => BLOCK + '\n</head>');
  }
  if (!src.includes('/studio.css') || !src.includes('/studio.js')) throw new Error(`could not stamp ${f}`);
  if (src !== original) { fs.writeFileSync(file, src); changed++; console.log('stamped', f); }
}
console.log(`\n${changed} page(s) updated, ${PAGES.length} studio pages total`);
