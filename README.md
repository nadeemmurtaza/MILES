# Miles Retold — Option G

Static site served from `public/` (Cloudflare Workers static assets via `wrangler.jsonc`, or Vercel via `public/vercel.json`).
**Only option G is deployed.** Every other option is kept in `archive/` and is not reachable on the live site.

| Path | What |
| --- | --- |
| `/` | G1 · Home (dark edition) |
| `/studio` | G30 · Studio pipeline (back-office) |
| `public/G*.dc.html` | dark edition: customer pages `G0`–`G22`, studio `G30`–`G69` |
| `public/GL*.dc.html` | the same pages in the light edition (the moon / sun button in the header switches between them) |
| `public/theme.css` | **every colour and the glass intensity**, as variables (see below) |
| `public/css/` | all page CSS: `g.css` + `b-*.css` (shared), `p/<page>.css` (per page), `utilities.css` (what used to be `style=""`) |
| `public/smooth.css`, `public/smooth.js` | shared motion layer, linked from every G / GL page |
| `archive/concepts/` | options A–F (see `archive/README.md`) |

The pages are Design Component files (`<x-dc>` + `public/support.js`), styled only by the global CSS above, Google Fonts, photos at `/_blob/<id>` (rewritten to `public/assets/` by `public/_redirects`).

## Global CSS (no `<style>`, no inline `style=""`)
* **Colours: edit `public/theme.css`.** Each colour used by the G and GL pages is one variable (`--gold`, `--ivory`, `--ink`, `--rust`, ...). Change a hex and the whole site follows. Transparent versions are derived from the same variable (`rgb(from var(--gold) r g b / .3)`), so there is nothing to keep in sync. Needs Chrome 119+, Safari 16.4+, Firefox 128+.
* **Glass: edit `--glass-blur` / `--glass-sat` in `theme.css`.** Every `backdrop-filter` in `css/` reads them, so panels, bars, menus, inputs and toasts frost identically on every page (28px / 1.9 on desktop, 14px on phones). The cursor's invert filter and the two small modal scrims are deliberately not glass.
* **Where a rule lives.** Each page links `theme.css`, `css/g.css`, any `css/b-*.css` bundle (rules shared by a whole family of pages: dark/light x customer/studio), `css/p/<page>.css`, `css/utilities.css`. Page rules sit in `@layer g`; `utilities.css` is unlayered, so it wins over them exactly as the old inline style did.
* **Utilities.** Every static `style=""` became a class `uXXXXXXX` (a hash of its declarations, shared across pages). Edit the declarations in `css/utilities.css`.
* **What is still inline.** Only values the page computes at runtime (`width: {{pct}}%`, a chart's `background: {{colour}}`, ...): about 380 attributes. They cannot be a class. They use the colour variables where the colour is fixed.
* Checked: computed styles (25 properties, every element) are identical to the previous build on all 124 pages, apart from the intended glass unification.

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
