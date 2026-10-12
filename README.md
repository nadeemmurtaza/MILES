# Miles Retold — storefront (variant D)

Static site served from `public/` (Cloudflare Workers static assets via `wrangler.jsonc`, or Vercel via `public/vercel.json`).
`/` redirects to the storefront (`D1-Motion`), `/studio` to the studio back-office. `archive/` holds the older concepts and is not deployed.

## One header and one footer, everywhere
The customer pages (D1–D7, D11–D16, D19–D25) share a single header and footer.

* Edit `shared/header.html` / `shared/footer.html` (and the `.sh-*` / `.sf-*` rules in `public/site.css`).
* Then run `node scripts/sync-chrome.mjs` — it stamps the blocks into every page between `<!--chrome:header-->` / `<!--chrome:footer-->` markers (safe to re-run).
* Needs `parse5`: `npm i --no-save parse5`.
* Behaviour (language switch, cart count, signed-in label, newsletter form) lives in `public/chrome.js`.

## Arabic (RTL)
The language button (and Account → Language) switches the whole site between English and Arabic; the choice is remembered.

* Source strings and translations: `i18n-src/` — `keys.json` (English, numbered), `part-*.json` (first-pass Arabic by index), `fix-*.json` (professional-register Arabic, applied over the parts — edit these), `extra.json` (strings built in code), `scoped.json` (per-page overrides), `patterns.json` (strings with live values; `@1[zero|one|two|few|many]` picks the Arabic plural form for capture 1). Rebuild with `node scripts/build-i18n.mjs`.
* Build: `node scripts/build-i18n.mjs` → `public/i18n/ar.js`.
* Type: **IBM Plex Sans Arabic** for text and **Amiri** for display, both SIL Open Font License, self-hosted in `public/fonts/` (Arabic glyphs only; licences alongside). Latin letters, digits and prices stay Manrope / Fraunces so they look the same in both languages. The `@font-face` rules and the `--ar-font` / `--ar-display` stacks are at the top and in the "Arabic / right-to-left" block of `public/site.css` — to use a commercially licensed face instead, change those two variables and the `@font-face` sources.
* Arabic never gets italics or letter-spacing (both break the script); `public/site.css` switches them off under `html.is-ar`.
* A sentence is matched as a whole (live values and inline elements are `{0}`, `{1}` slots), so Arabic word order is kept while the page's own bindings keep working.

## Preview locally
`npx wrangler dev` (serves `public/` with the same redirect/headers rules as production).
