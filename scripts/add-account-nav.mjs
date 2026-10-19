/* Adds the customer account sidebars (css + js) to every account page, dark and light. Safe to run again. */
import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
const dir = new URL('../public/', import.meta.url);
const WANT = /<nav class="subnav" aria-label="(My account|Privacy and security|Editor extras)"/;
let n = 0;
for (const f of readdirSync(dir).filter((x) => /^GL?\d+-.*\.dc\.html$/.test(x))) {
  let h = readFileSync(new URL(f, dir), 'utf8');
  if (!(WANT.test(h) || /^GL?10[0-4]-/.test(f)) || h.includes('/account-nav.js')) continue;
  if (!h.includes('<link rel="stylesheet" href="/css/subnav.css">')) throw new Error(`${f}: no subnav.css link to follow`);
  h = h.replace('<link rel="stylesheet" href="/css/subnav.css">', '<link rel="stylesheet" href="/css/subnav.css">\n<link rel="stylesheet" href="/css/account-nav.css">').replace('</head>', '<script src="/account-nav.js" defer></script>\n</head>');
  writeFileSync(new URL(f, dir), h); n++;
}

/* storefront pages: same bar, shop links (shop-nav.js) */
let k = 0;
for (const f of readdirSync(dir).filter((x) => /^GL?(1|2|3|4|5|6|8|15|16|17|18|19)-.*\.dc\.html$/.test(x))) {
  let h = readFileSync(new URL(f, dir), 'utf8');
  if (h.includes('/shop-nav.js')) continue;
  if (!h.includes('<link rel="stylesheet" href="/css/mobile.css">')) throw new Error(`${f}: no mobile.css link to follow`);
  h = h.replace('<link rel="stylesheet" href="/css/mobile.css">', '<link rel="stylesheet" href="/css/mobile.css">\n<link rel="stylesheet" href="/css/account-nav.css">').replace('</head>', '<script src="/shop-nav.js" defer></script>\n</head>');
  writeFileSync(new URL(f, dir), h); k++;
}
console.log(`added to ${n} account pages and ${k} storefront pages`);

/* every page, dark and light: shared UI kit (skeleton, tooltip, progress, confirm, toast) and the audit fixes */
let w = 0;
for (const f of readdirSync(dir).filter((x) => /^GL?\d+-.*\.dc\.html$/.test(x))) {
  let h = readFileSync(new URL(f, dir), 'utf8');
  if (h.includes('/ui-kit.js')) continue;
  if (!h.includes('</head>')) throw new Error(`${f}: no </head>`);
  h = h.replace('</head>', '<link rel="stylesheet" href="/css/ui-kit.css">\n<script src="/ui-kit.js" defer></script>\n</head>');
  writeFileSync(new URL(f, dir), h); w++;
}
console.log(`ui kit added to ${w} pages`);
