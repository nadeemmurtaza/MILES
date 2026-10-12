#!/usr/bin/env node
/* Guards the colour system (60 canvas / 30 surface + ink / 10 accent, see DESIGN-RULES.md and the top of public/site.css).
 *   node scripts/check-palette.mjs
 * Rules:
 *   1. Colours are defined once, as tokens in the `:root{}` block at the top of public/site.css. A rebrand edits that block.
 *   2. Pages, the shared header/footer, chrome.js and the 404 page use `var(--token)` / `color-mix(...)`, never a palette hex.
 *   3. The only hex literals allowed outside the token block are product colours (book covers, gift-card designs, paper) - they are content.
 * The studio pages (D8-*) and their shared layer (public/studio.css, public/studio.js) follow the same rules, and also may not use rgb()/rgba()
 * literals (use color-mix(in srgb, var(--token) N%, transparent)). Only the design artboards (D0, D9, D10, D17, D18) are not checked. */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const TOKENS = {
  'canvas (60)': ['#F6F1EA', '#EFE5DA', '#FBF7F1'],
  'surface / ink / lines (30)': ['#FFF', '#FFFFFF', '#FFF6F0', '#1F1418', '#2A1D22', '#3A2830', '#5C4B50', '#6B5A5F', '#E7DDD4', '#CBB8AD', '#000', '#000000'],
  'accent (10)': ['#7D1238', '#5E0D2A', '#F5E4DF', '#F2B880'],
  'shadow tints': ['#3C141E', '#0E060A'],
  'status only': ['#2B6B55', '#E4F1EA', '#BFDCCB', '#3E5E4C', '#9A5A0B', '#FFF4E6', '#A3123F'],
};
// '#C4661A' is the copper linen cover of one book in the studio print queue (D8-A4-Print) - product, not interface
const PRODUCT = ['#C4661A', '#7E9CC0', '#5E7FA6', '#6E8FB6', '#6F8FB6', '#D9A3AE', '#E8C96E', '#94A88A', '#7A2B33', '#24365C', '#E9E1D3', '#E4D5C6', '#F3EBDD', '#EDE3D6', '#E9CDA8'];
const tokenHex = new Set(Object.values(TOKENS).flat().map((h) => h.toUpperCase()));
const productHex = new Set(PRODUCT.map((h) => h.toUpperCase()));
const pub = path.join(ROOT, 'public');
const pages = fs.readdirSync(pub).filter((f) => /^D.*\.dc\.html$/.test(f) && !/^D(0|9|10|17|18)-/.test(f)).map((f) => path.join(pub, f))
  .concat([path.join(ROOT, 'shared/header.html'), path.join(ROOT, 'shared/footer.html'), path.join(pub, '404.html'), path.join(pub, 'chrome.js'), path.join(pub, 'studio.css'), path.join(pub, 'studio.js')]);
const HEX = /(?<![\w&#/-])#(?:[0-9A-Fa-f]{8}|[0-9A-Fa-f]{6}|[0-9A-Fa-f]{3})(?![\w-])/g;
let bad = 0, product = 0;
const report = (f, h, why) => { bad++; console.log(`${path.relative(ROOT, f)}: ${h} ${why}`); };
const RGBA = /rgba?\(\s*\d/g;
const studioFile = (f) => /(^|\/)(D8-[^/]*\.dc\.html|studio\.(css|js))$/.test(f);
for (const f of pages) {
  for (const line of fs.readFileSync(f, 'utf8').split('\n')) {
    if (line.includes('theme-color')) continue;
    if (studioFile(f)) for (const m of line.matchAll(RGBA)) report(f, m[0] + '…)', '-> use color-mix(in srgb, var(--token) N%, transparent)');
    for (const m of line.matchAll(HEX)) {
      const h = m[0].toUpperCase();
      if (productHex.has(h)) { product++; continue; }
      if (tokenHex.has(h)) report(f, m[0], '-> use var(--token), colours are defined only in public/site.css');
      else report(f, m[0], 'is not in the palette');
    }
  }
}
const css = fs.readFileSync(path.join(pub, 'site.css'), 'utf8');
const start = css.indexOf('/* ============ Colour system');
const rootEnd = css.indexOf('\n}\n', css.indexOf(':root{', start)) + 3;
const outside = css.slice(0, start) + css.slice(rootEnd);
for (const m of outside.matchAll(HEX)) {
  const h = m[0].toUpperCase();
  if (productHex.has(h)) continue;
  report(path.join(pub, 'site.css'), m[0], tokenHex.has(h) ? '-> outside the :root token block, use var(--token)' : 'is not in the palette');
}
const defined = [...css.slice(start, rootEnd).matchAll(HEX)].map((m) => m[0].toUpperCase());
const unknown = defined.filter((h) => !tokenHex.has(h));
unknown.forEach((h) => report(path.join(pub, 'site.css'), h, 'is defined as a token but not listed in scripts/check-palette.mjs'));
console.log(`token block: ${defined.length} colour definitions; product colours used as content: ${product}`);
console.log(bad ? `\n${bad} colour problem(s)` : '\npalette ok');
process.exit(bad ? 1 : 0);
