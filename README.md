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

## Added from the library audit

The shared UX library (`nadeemmurtaza/library`, 119 UX guidelines, 61 component styles) was run against the pages:

- **Audit fixes, every page:** scroll padding under the sticky header and tab bar, a skip link and `main` landmark where one was missing, an always-present polite live region, `autocomplete` hints on fields, 16px form fields on phones (no iOS zoom), 24px+ tap targets on table and row links, named calendar cells, one `h1` per editor page, and a keyboard way to do everything dragging does in the editor (arrows pan, `+` `-` zoom, `0` resets, `Alt` + arrow swaps frames).
- **Shared UI kit** (`css/ui-kit.css`, `ui-kit.js`, loaded on every page): skeleton placeholders (`.sk`), tooltips (`data-tip`), progress bars (`.pg`), a confirm dialog (`MilesUI.confirm`, or `data-confirm="Question?"` on a button, `data-danger` for red) and toasts (`MilesUI.toast`, or `data-toast="Message"`). Remove-from-cart, remove-address and turn-off-link now ask first. Reference page: **Interface kit** (G/GL139).
- **Third-level bar:** where a section has a group of related pages, they sit in a horizontal bar right under the header instead of a third sidebar (editor pages and editor extras; the Print check count is kept).
- **New pages (design-only):** **Notifications** (G/GL137: latest updates plus a channel-by-event preference grid, offers off by default) and **Email previews** (G/GL138).
- **Email templates:** `public/emails/*.html` (+ `.txt`): order confirmed, proof ready, balance due, shipped. Table-based, inline styles, `{{placeholders}}` (`customer_name`, `order_no`, `proof_url`, ...). `public/emails/preview/` has the same emails filled with sample values. Sending needs the backend; `node scripts/build-library-pages.mjs` rebuilds all of it.

## One live editor for the customer and the studio

`public/book/editor.html` is the only editor to link to now. Open it as `?as=customer` or `?as=studio`; both sides edit **the same book** (the book is kept in `localStorage` under `miles.book.v1`, photos in IndexedDB, so a change on one side shows on the other, in another tab, straight away). Every old "Live editor" / "Book editor" link on the customer and studio pages opens it (swapped at load in `ui-kit.js`); the classic editor is still there, under **Classic editor** in the second sidebar and the studio's More menu.

The flow, one job per screen:

1. **How many pages?** (20 to 80, the covers are extra).
2. **Name your book:** title, caption, dedication, author line.
3. **Your photos:** the gallery. Add photos, favourite them, remove them. It is also open at any time from the top bar.
4. **Design the book, two pages at a time.** A 3D book starts closed on the cover. Tap a page: popup 1 is colour and layout, popup 2 is the gallery (pick the photos), then Save. Turn the page (button, arrow keys) to the next two pages and do the same. Phones show one page at a time.

Everything on a page is free-form: photos and text boxes can be dragged anywhere, resized from the corners, turned with the round handle, brought forward or sent back. Text has font, size, colour, bold, italic and alignment. Arrow keys nudge a selected item, Enter edits it, Delete removes it. Overview shows all spreads with a tick for done ones; undo and redo cover everything.

Studio side: the same editor plus a **Review** panel (empty pages, empty photo spots, photos that would print soft, pages not marked done), **Ask for changes** and **Mark ready for print**. The customer has **Send to the studio**. Status, notes and the review are shared.

This is a prototype of the editor: nothing is sent to a server, and the sample photos only exist on the deployed site (offline they show as coloured blocks). The studio phone tab bar (`studio-nav.js`) is added the same way as the customer one.

### Editor: one photo across both pages, shapes and frames, pencil

- **Across both pages.** In the colour and layout popup, inner pages have a second group, *Across both pages*: **Full bleed**, **Panorama** and **Framed**. One photo runs over the fold with no break; it is drawn once over the spread (and each page shows its half when the book turns, in the overview and on a phone). It can be moved, resized, turned, cropped and shaped like any photo. The **Left page / Right page** switch in the toolbar says which page the other tools act on.
- **Shape and frame, crop.** Select a photo, then **Shape & frame**: rectangle, rounded, circle, oval, arch, heart, star, hexagon, diamond, triangle or soft blob, and a frame (white border, thin line, polaroid, shadow). **Crop** lets you drag the photo inside its frame and zoom 100 to 400%.
- **Pencil.** **Draw** puts the page in drawing mode: seven colours, three pencil sizes, undo stroke, clear. Doodles belong to the page and scale with it. Esc leaves drawing or crop mode.

### Photo gallery and privacy

`/book/editor.html?as=customer&view=gallery` is linked from the customer menus (My book > Photo gallery, Privacy > My photos and deletions, the phone sheet), from the Delete data page, and from the photos sheet in the editor. The studio's More menu has the same view (`?as=studio&view=gallery`, read-only). It shows what we hold (with where each photo is used), what has been deleted (name, date, how, which pages it was on), and lets the customer delete **one photo**, **selected photos** or **all photos**. Each delete says what it changes (the file is removed from storage, the spots on the pages become empty, it cannot be undone) and offers a download first; delete-all also asks the customer to type DELETE.

### Text in shapes

Select a text box and tap **Shape**, or tap **Shape text** to start one: circle, oval, heart, star, hexagon, diamond, triangle, soft blob, speech bubble, burst, ribbon, pill, arch, rounded or plain box, with a fill colour and a thin or thick outline. The shape can be dragged, resized, turned and typed into like any other box. Photos got four more shapes too (pill, speech bubble, burst, ribbon).

## All pages (site map)

`GL140-SiteMap.dc.html` lists every page in groups (shop, account, live editor and photos, messages, privacy, classic editor, studio, design references) with a filter box. It is linked from the Settings sidebar, the storefront and studio "More" sheets, the studio second bar and the footer of every page (`ui-kit.js`). Rebuild it with `node scripts/build-library-pages.mjs`; pages not listed in its groups still appear under "More".

## Private bottom bar

The phone tab bar is private. It only appears on the signed-in customer's own pages (account, orders, books, settings, messages, billing, privacy) with Account, Orders, Books, Gallery, Settings and More. The storefront (home, books, lookbook, story, cart, help) has no bottom bar: Home, Books, Cart and Track order are in the header menu. Sign-in state in the prototype is `localStorage['miles.auth']`: opening the sign-in page signs out (the bar disappears), pressing its buttons signs in (the header's "Sign in" becomes "My account"). See `account-nav.js` and `ui-kit.js`.

On desktop the same rule applies: the icon rail, page list and editor-page strip exist only on private pages. Signed out (`miles.auth` = `out`), any private page, and the customer editor/gallery, sends you to the sign-in page. The rail has a Gallery icon like the phone bar.

Private bar contents: tabs are Account, My books, Gallery and Profile, plus More (Invoices, Messages, Privacy and security, Photos, Live editor, sign out). Invoices is one page: the list, then one invoice with Download PDF (it is also the receipt, so there is no separate receipts page). My profile (`14-Settings`) holds name, email, phone, addresses, language and notifications; its sub menu is My profile and Addresses. My books (`143`) lists the current and previous books; opening one (`145-BookDetail?o=MR-0877`) shows its details, its invoice and "Order this book again": one copy or several, then to the cart (`miles.reorder` in localStorage) and payment.

Storefront header on phones and small tablets (below 980px): logo, the "Start a book" button and the menu button. Language, dark mode and the cart (with its count) sit in a row at the top of the open menu (`public/shop-nav.js`). Desktop keeps everything in the bar.

## Photo details at upload

When photos are added in the live editor (wizard, gallery, "Add photos"), the editor reads what each JPEG carries (date and time, GPS location, phone or camera, other notes) and shows a "Before we add your photos" step: one Keep or Remove choice per kind, "Remove all details" and "Keep all details" buttons, and a before and after list (removed lines struck through in red, kept lines in green). The saved file is always re-drawn, so it never carries EXIF; anything the customer keeps is stored as plain text beside the photo (`meta`, shown in the photo dialog). Starting choices come from the privacy settings, `Protected upload` (`121`), where each kind has a switch and a "Remove all details" master switch (`miles.photoMeta` in localStorage; `public/photo-privacy.js`). Files with no hidden details are added without asking.

## One start: occasion, size, pages, title, photos, design

The storefront "Start a book" page (`3-Builder`) now sends visitors straight to the live editor, whose start has six steps: Occasion (travel, wedding, honeymoon, love story, multi-city, camera roll), Size (portrait 8 × 10, landscape 11 × 8.5, square 10 × 10; sets the page shape), Pages, Title, Photos, then Design. If a book is already in progress, a confirm box offers to keep it or start a new one. Cover colour, extra copies, gift wrap and priority design from the old builder are not in the start any more; extra copies are ordered from My books, the rest belongs at checkout.

## The start in small steps, saved as you go

"Start a book" links open the live editor directly. The start is eight small steps (photos come before the cover; the Photos step has the same "hidden details" choices as the privacy settings, and each batch is checked before it is added) with their own addresses (`#event`, `#size`, `#pages`, `#title`, `#dedication`, `#gallery`, `#cover`, then the pages), so the browser's back button works. A 3D book beside every step follows the answers: its shape (size), thickness (pages), cover colour, title and caption, an occasion picture, and it turns a little more upright as the steps are completed. Every choice is saved on the spot on the device (even when not signed in) and the start resumes at the step you left. Photos, and sending the book to the studio, need an account: a guest sees "Sign in to keep your book" at the Photos step and is returned to it after signing in (`miles.next`).

## One 3D book

The 3D book is one component: `public/css/book3d.css` and `public/book3d.js`. The storefront hero and the live editor start both use it (`<div class="b3" data-b3 ...>` or `MilesBook3D.el({...})`). It has a hard board cover (front and back boards with real thickness, a hinge groove and linen texture), a spine, and the white page block between the boards, set back from the board edges with page lines on the fore edge, top and bottom. The thickness follows the page count (`--pg`): 20 pages is a slim book, 80 pages a thick one. In the editor's design view, a closed cover or back cover shows a stack of pages under it, thicker with more pages.

The 3D book is built from stacked layers (so corners and sides stay clean at any size), lives in a shadow root, and opens: the hard cover hinges open and white leaves turn, driven by scrolling (`data-scroll-open`: opens as the book scrolls into view; `data-scroll-open="page"` follows how far the page is scrolled, used in the start). `data-open="0..1"` sets it by hand.
