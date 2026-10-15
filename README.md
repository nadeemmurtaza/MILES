# Miles Retold — Option G

Static site served from `public/` (Cloudflare Workers static assets via `wrangler.jsonc`, or Vercel via `public/vercel.json`).
**Only option G is deployed.** Every other option is kept in `archive/` and is not reachable on the live site.

| Path | What |
| --- | --- |
| `/` | G1 · Home (dark edition) |
| `/studio` | G30 · Studio pipeline (back-office) |
| `public/G*.dc.html` | dark edition: customer pages `G0`–`G22`, studio `G30`–`G69` |
| `public/GL*.dc.html` | the same pages in the light edition (the moon / sun button in the header switches between them) |
| `public/smooth.css`, `public/smooth.js` | shared motion layer, linked from every G / GL page |
| `archive/concepts/` | options A–F (see `archive/README.md`) |

The pages are Design Component files (`<x-dc>` + `public/support.js`), self-contained: inline styles, Google Fonts, photos at `/_blob/<id>` (rewritten to `public/assets/` by `public/_redirects`).

## Smooth motion
Applied to all G / GL pages:

* **No layout thrash on scroll.** `update()` reads every rect first, then writes custom properties (it used to interleave them, forcing a style + layout pass per element per frame).
* **Scoped custom properties.** The scroll-progress value is set on `.sprog` and each pinned scene's progress on its own section, not on the page root, so a scroll tick no longer re-styles the whole tree (style recalculation while scrolling in a headless run: home 3.4 s → 0.7 s, Builder 228 → 45 ms, Tracking 264 → 29 ms).
* **Cached marquee / cursor nodes and sizes** in the animation loop (no per-frame `querySelector` / `scrollWidth`); the pointless 6.5 s re-render timer on the home page is removed.
* **Scroll-linked word reveal** no longer carries a transition on top of the scroll value (`.wr .w`), so words follow the scroll instead of lagging and restarting.
* **Off-screen loops pause** (`smooth.js`: orbs, marquees, floating books, shimmer), and the frosted-glass blur is lighter at 900px and below.
* **Page-to-page cross-fade** with `@view-transition` (Chromium, Safari 18+; ignored elsewhere, off under `prefers-reduced-motion`).

Forcing compositor layers (`will-change` on the blurred orbs) was tried and made scrolling slower, so it is not used.

## Preview locally
`node scripts/serve.mjs` (http://127.0.0.1:8792, same `/_blob` rewrites as production) or `npx wrangler dev`.

## Deploy
`wrangler deploy` (or the Cloudflare Workers Git integration) publishes `public/` only. Nothing under `archive/` is uploaded.

## Previous option D
The D storefront, studio, Arabic (RTL) build, shared header/footer scripts and `DESIGN-RULES.md` live in `archive/concepts/D/`; `archive/README.md` explains how to put it back.
