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
| `public/editor/`, `css/editor*.css` | live book editor workspace: `G23` / `G80`–`G89` (customer), `G70` / `G90`–`G99` (studio), see below |
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
An eleven-page workspace per side, all editing the same sample book. Customer: `G23` canvas + `G80`–`G89`; studio: `G70` canvas + `G90`–`G99` (each with a `GL` light twin).

| Page | Customer | Studio | What it does |
| --- | --- | --- | --- |
| Canvas | `23` | `70` | drag and drop / tap to place photos, zoom, move, brighten, captions, 9 layouts, undo / redo, filmstrip, safe area |
| Storyboard | `80` | `90` | every spread as a card: drag to reorder, multi-select, bulk layout / duplicate / delete, filters, flat plan by printed signature, print overview |
| Photos | `81` | `91` | library: search, sort, filters, stars, notes, usage, possible duplicates, remove / restore, simulated upload |
| Layouts | `82` | `92` | **per-page layouts**: choose Both pages / Left page / Right page, then a layout for that target (9 spread layouts that can run across both pages, 9 one-page layouts incl. story text and blank); apply to one or many spreads, fill empty frames, build spreads from unused photos |
| Text | `83` | `93` | every caption in one list, proof-reader (double spaces, repeated words, ...), find and replace, caption font / size / alignment, CSV export |
| Cover | `84` | `94` | live front / spine / back / open-flat cover: colour, foil, photo, title, back text |
| Style | `85` | `95` | themes, page and text colour, margin, photo spacing, corners, photo border (the canvas, storyboard and flipbook follow) |
| Flipbook | `86` | `96` | cover to cover reader: arrow keys, autoplay, zoom, full screen |
| Print check | `87` | `97` | score, issues with one-tap fixes, pixel density per frame (studio can mark the book print-ready), CSV / JSON export |
| History | `88` | `98` | saved versions (compare, restore with a safety copy), comments with replies, activity log |
| Send / Hand-off | `89` | `99` | customer: checklist, diff since last proof, note, "Send to proof"; studio: print pack, send proof, lock design |

* **Per page layouts.** A spread is either one of the nine spread layouts (`lay`) or `lay: 'split'` with `pg: [leftId, rightId]` and the left page's frames followed by the right page's. Changing one page keeps the other, and photos that no longer fit go back to the library. The same Both / Left / Right choice is on the canvas, the storyboard and the layouts page; the print check, text list, flipbook and thumbnails understand split spreads.
* **One document.** `public/editor/core.js` holds the book (`localStorage` key `miles.editor.v1`) and every operation (pure functions returning a new book), plus the print check (`preflight`), version `diff`, text helpers and CSV. Customer and studio tabs see each other's changes live through the `storage` event.
* **UI layer.** `editor/ui.js` (shared header values, undo / redo with typing coalesced into one step, activity log) and `editor/pages.js` (state and values for each workspace page).
* **Pages are generated.** `node scripts/build-editor-pages.mjs` writes all 40 workspace pages (dark and light, both sides) from one source and patches the tab bar into the four canvas pages. Header, menus and footer are copied from `G23` / `GL23` and `G70` / `GL70`. Edit the script, not the generated files. It refuses static `style=""` (use a utility class in `css/editor-pages.css`).
* **Styles.** `css/editor.css` (canvas) and `css/editor-pages.css` (workspace, tab bar, the book-look variables the canvas honours).
* It is a prototype: no server, photos are the site's sample images, the print-check pixel sizes are sample metadata, and "upload" adds sample photos.

### Step-by-step mode (phones)
Customer: `G100`–`G104` / `GL100`–`GL104`. Studio: `G110`–`G114` / `GL110`–`GL114`. Five screens each: **Home**, **Photos**, **Page** (one screen per book page, `?n=5`), **Cover**, and **Send** (customer) / **Hand-off** (studio). One job per screen, big touch targets (44 px minimum, 16 px fields), a Back / Next bar, a four-step progress bar and an **overview of every page** (done / still to do, tap to jump) at the bottom of every screen. On the Page screen you pick a layout for that single page, tap a frame to choose a photo from a bottom sheet, zoom, and write the caption.
* **Studio extras.** The Page screen lists the customer's open comments on that spread with a "Mark fixed" button, and shows the print sharpness (dpi) of the selected photo. Hand-off shows the print pack and checks, a note from the customer, and the actions: send the next proof, mark print-ready, lock the design (only once the print check is clear).
* A phone (viewport 700 px or narrower) that opens a canvas (`G23` / `GL23` customer, `G70` / `GL70` studio) is sent to that side's Step-by-step. "Use the full editor instead" (`?full=1`) is remembered for the browser session; the "Step by step" tab and the phone hint on every full-editor page go back.
* Same book, same `localStorage` document as the full editor: anything done in step-by-step shows in the full editor and on the other side. The current page is kept per side in `miles.editor.easy.n.c` / `.s` and in the URL.
* Logic: `easy*` builders in `editor/pages.js`; styles: the `.ez-*` blocks at the end of `css/editor-pages.css`; pages are generated by `scripts/build-editor-pages.mjs` like the others.

### Photo gestures and two pages at once
* **Drag to choose what shows.** Select a frame (click or tap), then drag the photo: the part of the photo inside the frame follows your finger or mouse. The zoom grows around that focus point (`transform-origin` + `object-position` carry the same x / y), so at any zoom every part of the photo can be reached.
* **Pinch to zoom** with two fingers (and pan with the midpoint). On a trackpad or with a mouse, **Ctrl + scroll** zooms the selected frame. The Zoom buttons and sliders still work.
* **Rearrange by dragging.** On a mouse, drag a photo onto another frame to swap them. On touch, press and hold a photo, then drag it onto another frame (a swipe on an unselected photo still scrolls the page). Photos can also be dragged in from the photo tray.
* All of it lives in `editor/gestures.js` (pointer events: one code path for mouse, pen and touch; frames carry `data-gf`, `data-si`, `data-fi`, `data-has`, `data-sel`, `data-src`). A whole drag is one undo step.
* **Two pages at once.** The canvas always shows the whole spread. In Step-by-step, **Two pages together** shows both pages side by side, with the spread layouts and an **One photo across both pages** button (Full bleed: one frame over the fold, no break). Back / Next then move a spread at a time.

## Privacy, security and editor extras (design only)
Seventeen pages that show a client how privacy and the next editor features could look. **None of it protects anything yet**: there is no server, no real upload, no real sign-in, and nothing is stored or enforced. Every page carries a "Design preview" banner for that reason, and the controls only change what is on the page (a reload resets it). Do not put these pages in front of real customers as if the protections existed. The compliance checklist starts with every control marked "To do" for the same reason.

| Group | Pages (customer, `G` dark / `GL` light) | Where they are linked from |
| --- | --- | --- |
| Privacy & security | `120` Overview · `121` Protected upload (what happens to a photo, location removal) · `122` Sharing (expiring, watermarked links) · `123` Your choices (consent) · `124` Keep or delete · `125` Who has looked · `126` Sign-in & devices | the "Privacy" pill in the account sub-navigation |
| Editor extras | `127` Smart help (on-device: chapters by day, duplicates, faces kept in frame) · `128` Pinned comments and approving one spread at a time · `129` Arabic and two-language captions · `130` Trip map · `131` Keyboard and accessibility | the "Extras" tab of the live editor |
| Studio: Privacy & data | `132` Who can open customer photos (roles x actions, temporary access) · `133` Access log · `134` Retention and deletion requests · `135` Privacy checklist (with questions for a lawyer) · `136` Print-ready export | the "Privacy & data" group in the studio menus, and the editor's "Privacy & data" tab |

* Generated by `node scripts/build-design-pages.mjs` (idempotent; it also adds the links above to the existing pages). Demo behaviour: `public/editor/design.js`. Styles: `public/css/design-pages.css`.
* What building these for real would need (private storage with short-lived links, location removal on upload, per-order access control, logging, deletion, a real sign-in code) is the backend plan, not these pages.

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

## Customer account sidebars

On screens 1100px and wider, every customer account page (account, order, proof, billing, messages, settings, live editor and its workspace pages, privacy and extras pages) gets two sidebars under the header, like the studio: a slim rail of sections, then a second bar with the pages of the section you are in. The second bar can be hidden (remembered per browser; it starts closed on editor screens). On phones the original pill row stays.
`public/account-nav.js` holds the links in one place; `node scripts/add-account-nav.mjs` adds it to the pages (safe to run again).

On phones and small tablets (under 1100px) the two bars become one floating glass tab bar (52px, same look as the header) (Order, My book, Messages, Billing, More) plus a chip above it that opens a bottom sheet with the pages of the current section. The tab bar is the same on every account page, including Proof, Balance, the live editor pages and step-by-step editing (whose Back/Next bar sits just above it). The chip is left off the editor screens so it never covers their tools.

The storefront pages (home, books, builder, cart, checkout, confirmed, sign-in, story, lookbook, help, gifts, project) get the same bottom bar on phones with shop links: Home, Books, Cart (with the live count), Account and More. It comes from `public/shop-nav.js`; the shop step row stays at the top of those pages.
