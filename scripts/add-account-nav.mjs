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
console.log(`added to ${n} pages`);
