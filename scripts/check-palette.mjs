#!/usr/bin/env node
/* Guards the colour system (60 canvas / 30 surface + ink / 10 accent, see the top of public/site.css).
 *   node scripts/check-palette.mjs
 * Fails if a customer page, the shared header/footer or site.css uses a hex colour that has no job in the system.
 * Studio pages (D8-*) and the design artboards (D0, D9, D10, D17, D18) are not checked. */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const ROLES = {
  'canvas (60)': ['#F6F1EA', '#EFE5DA', '#FBF7F1'],
  'surface / ink / lines (30)': ['#FFF', '#FFFFFF', '#FFF6F0', '#1F1418', '#2A1D22', '#3A2830', '#5C4B50', '#6B5A5F', '#E7DDD4', '#CBB8AD', '#000', '#000000'],
  'accent (10)': ['#7D1238', '#5E0D2A', '#F5E4DF', '#F2B880'],
  'status only': ['#2B6B55', '#E4F1EA', '#BFDCCB', '#3E5E4C', '#9A5A0B', '#FFF4E6', '#A3123F'],
  'product (book covers, gift-card designs, paper)': ['#7E9CC0', '#5E7FA6', '#6E8FB6', '#6F8FB6', '#D9A3AE', '#E8C96E', '#94A88A', '#7A2B33', '#24365C', '#E9E1D3', '#E4D5C6', '#F3EBDD', '#EDE3D6', '#E9CDA8'],
};
const allowed = new Map();
for (const [role, list] of Object.entries(ROLES)) for (const h of list) allowed.set(h.toUpperCase(), role);
const pub = path.join(ROOT, 'public');
const files = fs.readdirSync(pub).filter((f) => /^D.*\.dc\.html$/.test(f) && !/^D(0|8|9|10|17|18)-/.test(f)).map((f) => path.join(pub, f))
  .concat([path.join(pub, 'site.css'), path.join(ROOT, 'shared/header.html'), path.join(ROOT, 'shared/footer.html')]);
let bad = 0; const used = new Map();
for (const f of files) {
  const src = fs.readFileSync(f, 'utf8');
  for (const m of src.matchAll(/#[0-9A-Fa-f]{3,8}\b/g)) {
    const h = m[0].toUpperCase();
    if (![4, 5, 7, 9].includes(h.length)) continue;
    if (/^#[0-9A-F]{3}$/.test(h) && !['#FFF', '#000'].includes(h) && /[0-9A-F]{3}/.test(h) && src.slice(Math.max(0, m.index - 1), m.index) !== ':' && !/[:\s(,"'=]$/.test(src.slice(Math.max(0, m.index - 1), m.index))) continue;
    if (/^#[0-9A-F]{8}$/.test(h)) continue;
    if (!allowed.has(h)) { bad++; console.log(`${path.relative(ROOT, f)}: ${m[0]} is not in the palette`); }
    else used.set(allowed.get(h), (used.get(allowed.get(h)) || 0) + 1);
  }
}
console.log([...used].map(([r, n]) => `${r}: ${n}`).join('\n'));
console.log(bad ? `\n${bad} colour(s) outside the palette` : '\npalette ok');
process.exit(bad ? 1 : 0);
