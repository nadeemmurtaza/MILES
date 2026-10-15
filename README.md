# Miles Retold — Option G

Static site served from `public/` (Cloudflare Workers static assets via `wrangler.jsonc`, or Vercel via `public/vercel.json`).
**Only option G is deployed.** Every other option is kept in `archive/` and is not reachable on the live site.

| Path | What |
| --- | --- |
| `/` | GL1 · Home (light edition is the default; the moon button switches to dark) |
| `/studio` | GL30 · Studio pipeline (back-office, light by default) |
| `public/G*.dc.html` | dark edition: customer pages `G0`–`G22`, studio `G30`–`G69` |
| `public/GL*.dc.html` | the same pages in the light edition (the moon / sun button in the header switches between them) |
| `public/theme.css` | **every colour and the glass intensity**, as variables (see below) |
| `public/css/` | all page CSS: `g.css` + `b-*.css` (shared), `p/<page>.css` (per page), `utilities.css` (what used to be `style=""`) |
| `public/smooth.css`, `public/smooth.js` | shared motion layer, linked from every G / GL page |
| `public/i18n.js`, `public/i18n/ar.js`, `css/i18n.css` | Arabic (RTL) for the customer pages and the customer editor (see below) |
| `public/editor/`, `css/editor.css` | live book editor: `G23` / `GL23` (customer), `G70` / `GL70` (studio) |
| `G71`–`G75`, `GL71`–`GL75` | team & permissions demo: members, invite, roles matrix, profile, activity log (design only) |
| `archive/concepts/` | options A–F (see `archive/README.md`) |

The pages are Design Component files (`<x-dc>` + `public/support.js`), styled only by the global CSS above, Google Fonts, photos at `/_blob/<id>` (rewritten to `public/assets/` by `public/_redirects`).

## Global CSS (no `<style>`, no inline `style=""`)
* **Colours: edit `public/theme.css`.** Each colour used by the G and GL pages is one variable (`--gold`, `--ivory`, `--ink`, `--rust`, ...). Change a hex and the whole site follows. Transparent versions are derived from the same variable (`rgb(from var(--gold) r g b / .3)`), so there is nothing to keep in sync. Needs Chrome 119+, Safari 16.4+, Firefox 128+.
* **Glass: edit `--glass-blur` / `--glass-sat` in `theme.css`.** Every `backdrop-filter` in `css/` reads them, so panels, bars, menus, inputs and toasts frost identically on every page (28px / 1.9 on desktop, 14px on phones). The cursor's invert filter and the two small modal scrims are deliberately not glass.
* **Where a rule lives.** Each page links `theme.css`, `css/g.css`, any `css/b-*.css` bundle (rules shared by a whole family of pages: dark/light x customer/studio), `css/p/<page>.css`, `css/utilities.css`. Page rules sit in `@layer g`; `utilities.css` is unlayered, so it wins over them exactly as the old inline style did.
* **Utilities.** Every static `style=""` became a class `uXXXXXXX` (a hash of its declarations, shared across pages). Edit the declarations in `css/utilities.css`.
* **What is still inline.** Only values the page computes at runtime (`width: {{pct}}%`, a chart's `background: {{colour}}`, ...): about 380 attributes. They cannot be a class. They use the colour variables where the colour is fixed.
* Checked: computed styles (25 properties, every element) are identical to the previous build on all 124 pages, apart from the intended glass unification.

## Arabic (RTL)
The ع / EN button in the header of every customer page (G1–G23, dark and light) switches the page to Arabic and back; the choice is remembered (`miles.lang`). The studio pages stay English.

* **Translation** happens in the browser (`public/i18n.js`): the page's English text is looked up in `public/i18n/ar.js` and swapped in; switching back restores the English exactly. Headlines split into one span per word are matched as a whole sentence. Sources are in `i18n-src/` (`ar-g.json` for option G, `ar-d.json` from the earlier storefront); rebuild with `node scripts/build-i18n.mjs`. Patterns handle live values (`SAR 140 today`, `Spread 2 of 6`), with Arabic plural forms.
* **Layout** mirrors through `<html dir="rtl">` and logical CSS properties (`margin-inline-start`, `inset-inline-end` ... in `css/`), checked to give identical results in English. The hero keeps its photo un-mirrored: the dark fade moves to the right and the photo shows on the left. Arrow icons mirror, photos and logos never do.
* **Type**: IBM Plex Sans Arabic for text, Amiri for display (SIL OFL, `public/fonts/`). No italics or letter-spacing in Arabic.
* **To add or fix a sentence**: open the page in Arabic, run `milesI18n.keys()` in the console to see the English keys the page asks for, add the Arabic to `i18n-src/ar-g.json`, rebuild. A native reader should review the wording before launch.

## Live book editor
`G23-Editor` (customer, linked from Account, Order, Upload) and `G70-Editor` (studio, linked from the Design stage) edit the same sample book: six layouts, drag and drop or tap to place photos, zoom / move / brighten, captions, add / duplicate / move / delete spreads, undo / redo, filmstrip, preview, safe-area overlay. Changes autosave to `localStorage` and show up live in the other editor (customer "Send to proof" appears in the studio at once). The studio side adds customer comments, print checks, versions and "Send proof round N". It is a prototype: no server, photos are the site's sample images.

## Team & permissions (demo)
Design-only pages for showing a client: Members, Invite a user, Roles & permissions matrix, a member profile, and the activity log (`G71`–`G75`, linked from Studio settings → Team). Nothing is saved.

## Smooth motion
Applied to all G / GL pages:

* **No layout thrash on scroll.** `update()` reads every rect first, then writes custom properties (it used to interleave them, forcing a style + layout pass per element per frame).
* **Scoped custom properties.** The scroll-progress value is set on `.sprog` and each pinned scene's progress on its own section, not on the page root, so a scroll tick no longer re-styles the whole tree (style recalculation while scrolling in a headless run: home 3.4 s → 0.7 s, Builder 228 → 45 ms, Tracking 264 → 29 ms).
* **Cached marquee / cursor nodes and sizes** in the animation loop (no per-frame `querySelector` / `scrollWidth`); the pointless 6.5 s re-render timer on the home page is removed.
* **Scroll-linked word reveal** no longer carries a transition on top of the scroll value (`.wr .w`), so words follow the scroll instead of lagging and restarting.
* **Off-screen loops pause** (`smooth.js`: orbs, marquees, floating books, shimmer); the glass blur is lighter at 900px and below (`--glass-blur` in `theme.css`).
* **Page-to-page cross-fade** with `@view-transition` (Chromium, Safari 18+; ignored elsewhere, off under `prefers-reduced-motion`).

Forcing compositor layers (`will-change` on the blurred orbs) was tried and made scrolling slower, so it is not used.

## Preview locally
`node scripts/serve.mjs` (http://127.0.0.1:8792, same `/_blob` rewrites as production) or `npx wrangler dev`.

## Deploy
`wrangler deploy` (or the Cloudflare Workers Git integration) publishes `public/` only. Nothing under `archive/` is uploaded.

## Previous option D
The D storefront, studio, Arabic (RTL) build, shared header/footer scripts and `DESIGN-RULES.md` live in `archive/concepts/D/`; `archive/README.md` explains how to put it back.

## Invoices and tax integrations (demo)

Pages `G24/GL24` (my invoices), `G77/GL77` (invoice document), `G76/GL76` (studio invoices) and `G78/GL78` (ZATCA / FBR connections) show invoice records with open, download (XML/CSV), print and a simulated send to the Saudi ZATCA and Pakistan FBR systems. See `docs/invoicing-integration.md` for what a live connection needs.

Every page is reachable from a nav: the studio side menu, the Money and Team sub-menus, and the customer footer.
