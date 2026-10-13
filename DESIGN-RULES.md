# Design rules — Miles Retold

Every design rule given for this project, in one place: what it says, how it is applied to the site, and how to check it.
Rules came from the client brief and from the reference sheets/posts supplied while building (sources are named in each section).
"Status" is honest: **Applied** (done and checked), **Partly** (done where it can be, gap named), **Open** (needs a decision).

Where the checks live: `scripts/check-palette.mjs` (colour palette), `scripts/sync-chrome.mjs` (one header/footer), `scripts/build-i18n.mjs`
(Arabic), `public/site.css` (tokens + shared rules), `public/pricing.js` (prices). `README.md` explains the build.

---

## 1. How a decision gets made — 20 principles, each with a test
Source: the "How a decision gets made" sheet (twenty principles, the order that settles a conflict, the numbers that cap complexity).

| # | Principle | Rule | Test | Status in this repo |
| --- | --- | --- | --- | --- |
| 1 | Simplicity | The product feels like a few features. | Cover the page with your hand except one third: can you say its job? | Applied — each page has one job and one primary action. |
| 2 | Clarity | Say what it is and what it does. | A person who has never seen the page names its purpose in five seconds. | Applied. |
| 3 | Consistency | The same thing looks and acts the same everywhere. | Search the boards for the component; every instance shares its class. | Applied for chrome (one shared header/footer stamped by `sync-chrome.mjs`, identical menu on every page). Partly for components: each page still carries its own copy of the button/card CSS. |
| 4 | Predictability | A control does what its label says and nothing else. | Read each button aloud: the result matches. | Partly — the studio buttons "Resend payment link", "Send balance link", "Mark wrapped" open a customer page instead of acting. **Open:** needs a "Sent (demo)" confirmation. |
| 5 | Accessibility | Everyone can finish the task. | The accessibility test script passes. | Applied — axe-core over all 49 pages: 1 finding left (the 10px tagline on the illustrated book-cover mock-up, which is artwork). Landmarks, labels, contrast, focus rings, reduced-motion; on phones every control has a 44px hit area (small switches, pins and stars extend theirs with a transparent `::before`) and text is at least 12px (the logo tagline and the illustrated book/gift-card artwork are the only exceptions). |
| 6 | Efficiency | The common task costs the fewest steps. | Count clicks for the top three tasks; none rose. | Applied — start a book to confirmed: 4 clicks; track an order: 1; sign in: 1. Home, Books and Lookbook now open the builder with the choice already made (`?type=&size=`). |
| 7 | Reliability | Work is never lost and never doubled. | Kill the network mid-save: nothing lost; click Save twice: one record. | Partly — prototype with no backend; state lives in `localStorage` (cart, language, currency, sign-in). Nothing doubles on repeat clicks. |
| 8 | Visual hierarchy | The eye stops at most three times on its way to the action. | Squint: the headline, the content, the one primary. | Applied — see the 60/30/10 colour system and the isolation effect below. |
| 9 | Progressive disclosure | Power moves down a level, it is never removed. | Every removed control is reachable in two clicks. | Applied — accordions, drawers, "Preview" states. |
| 10 | Error prevention | The wrong thing is hard to do. | Every irreversible action has friction matched to its blast radius. | Applied — studio "Cancel & refund" has a two-step confirm; forms validate before sending. |
| 11 | Reversibility | Prefer undo to confirm. | List the actions with neither: each is justified in writing. | Applied — cart "Remove" and address "Remove" have Undo (also from the empty cart); "Make default" is hidden on the default address and Remove/Undo keep the default correct. |
| 12 | Feedback | The system says what happened, to which thing. | Every action has a visible result within 100 ms or a status within 400 ms. | Applied — undo bars, saved/sent states, live regions (`role="status"`). |
| 13 | Low cognitive load | One decision at a time. | No screen asks more than one new question. | Partly — checkout and upload are stepwise; the builder shows its five choices on one page by design. |
| 14 | Information density | As dense as the person can read, no denser. | A power user and a new user can both finish; compact is opt-in. | Applied — customer pages airy, studio pages dense. |
| 15 | Reusability | Build once, from tokens and components. | No colour, spacing or radius literal outside the token files. | Applied for colour — every colour is defined once, as a token in the `:root` block of `public/site.css`; pages, the shared header/footer, `chrome.js` and the 404 page use `var(--token)` / `color-mix()`, and `check-palette.mjs` fails on any palette hex outside that block (product colours such as book covers are content and exempt). Radius, shadow and section-spacing tokens exist and every customer page's section padding now uses `--sp-section-s/m/l/xl` (64/80/96/120 on desktop, 40/48/56/64 on phones, all multiples of 8); a few small card paddings are still literal pixels. |
| 16 | Responsiveness | Seven widths, no dead space. | The overflow check passes at 280, 380, 640, 768, 1024, 1280, 1536. | Applied — passes at every width from 280 up on the customer pages, in English and Arabic, portrait and landscape; every block is also sized to the screen height (`svh`), not a fixed canvas height. Phones are audited, not assumed: `node scripts/mobile-audit.mjs` (overflow, clipped or overlapping text across a scroll sweep, sticky blocks, tap targets) and `node scripts/rules-audit.mjs` (typefaces, text size, uppercase, radii, touch targets, spacing). |
| 17 | Performance | The product feels fast before it is fast. | Skeleton after 200 ms; progress after 10 s. | Partly — home page ≈ 935 KB on first load, images already 1080px, Arabic fonts self-hosted and only downloaded when used. No skeletons. |
| 18 | Maintainability | A change is a diff, not a hunt. | A rebrand edits one file. | Applied for colour — a rebrand edits the token block in `public/site.css`. Prices are one file (`pricing.js`), the header/footer one file each, translations one folder. Spacing and radius literals in pages are the remaining gap. |
| 19 | Adaptability | A new sector, brand or branch is a new file. | No `if (sector === …)` and no per-client fork. | Partly — no forks; per-page CSS duplication remains. |
| 20 | Trustworthiness | The product never claims what it has not done. | "Saved" appears only after the save succeeded. | Partly — it is a prototype: screens such as "Paid in full" show demo states. The site is `noindex`; sample numbers and wording are listed in `README.md` ("Sample data to confirm"); no invented contact details, legal numbers or client reviews. |

### When two principles conflict — settle it in this order
1. User safety and data integrity
2. Correctness and accessibility
3. Task completion
4. Comprehension and clarity
5. (the sheet is cropped here — add the remaining tiers when the full sheet is available)

| The argument | Higher wins | The result |
| --- | --- | --- |
| A calmer dashboard, or the low-stock alert? | Task completion over aesthetic | The alert stays. |
| Fewer taps at the till, or confirm the refund? | Safety over efficiency | The refund keeps its hold-to-confirm. |
| A custom checkbox that matches the brand, or a native input? | Accessibility over consistency of one detail | A native input, restyled. |
| "Delete" here and "Remove" there read nicely, or one word? | Clarity over variety | One word per concept. |
| A full-bleed hero, or the product visible without scrolling? | Task completion over decoration | The cloth first. (First-screen buttons are never cropped: heroes are sized with `svh`.) |

---

## 2. Human-designed vs AI-generated UI — nine rules
Source: the "Human-Designed UI vs AI-Generated UI" comparison. Aim for the left column on every page.

| # | Rule | Human-designed (do this) | AI-generated (avoid) | How it is applied |
| --- | --- | --- | --- | --- |
| 1 | Visual hierarchy | Clear flow. One primary focus per section. | Competing elements; everything gets equal attention. | One filled accent button per section, secondary actions are outlined; one highlighted word per headline; every page has exactly one `<h1>`. |
| 2 | Content & copy | Specific, on-brand copy for a real audience. | Generic, placeholder-like copy that sounds AI-written. | Copy is about trips, hand-made books, deposits and proofs. No `[bracket]` placeholders on customer pages; unconfirmed facts are removed, not invented. |
| 3 | Spacing & layout | Intentional spacing. Sections breathe. | Irregular spacing; cramped or inconsistent. | Section padding snaps to 64 / 80 / 96 / 120; blocks are sized to width and height of the screen. |
| 4 | Images & visuals | Relevant, high-quality, contextual imagery. | Generic or stock-like visuals that do not match the content. | Only the studio's own books, spreads and photos (lookbook, hero, sign-in). |
| 5 | Components | Custom, cohesive components that fit the brand. | Repeated, generic components with default styles. | Polaroids, linen-cover book mock-ups, the drawn "how it works" path, wine/ivory buttons and chips. |
| 6 | Data & information | Simplified and easy to understand. | Irrelevant or filler information; key details hard to find. | One price list; the total, the 50% due today and the balance are always shown together. |
| 7 | Brand identity | Distinctive visual language and consistent branding. | A generic layout that could belong to any brand. | Wine + ivory + charcoal, Fraunces + Manrope, one logo lockup everywhere. |
| 8 | User-experience flow | Natural storytelling that guides the user. | Sections feel disconnected with no clear flow. | Home page tells the 5-step story (design, pay half, upload, approve, unwrap); every page ends in the next step. |
| 9 | Overall polish | Feels intentional, thoughtful, refined by a human. | Looks generic, templated and unfinished. | Motion, hover states, undo bars, RTL Arabic, soft shadows, no dead links or buttons. |

---

## 3. Visual design rules

### Horizontal logo balance
Stop eyeballing the icon-to-text ratio. Divide the wordmark into **four equal sections**, add **one equal section above and below**, size the icon **between those outer guides** (icon = 6 units), and reuse **one section as the gap**. Then make the final adjustment optically if needed. (Applies to a horizontal logo.)
- **Applied** — header, footer and 404 use the same lockup: wordmark = 4 units, icon = 6 units, gap = 1 unit (`.lg` in `public/site.css`; `--fs` is the size of "MiLes", one unit = 0.28 × `--fs`). Measured on the rendered pixels: icon ÷ wordmark ≈ 1.47–1.51, equal margin above and below the wordmark. Optical tweak: unit coefficient set from 0.277 to 0.28 so the rounded-square icon does not read small.

### Uppercase
If a headline or caption is longer than 5–6 words, do not set it in uppercase (lowercase reads about 13% faster; studies 1955–2019).
- **Applied** — uppercase is only used for 1–3 word labels. The one long case (the 8-word rotating "Unlimited revisions ✦ until you love it ✦" badge) is now sentence case.

### Use fewer fonts
Two typefaces, with variations (bold, italic). Too many typefaces make the design messy.
- **Applied** — Fraunces (display) + Manrope (text). The monospace face for order numbers was dropped: numbers use Manrope with tabular figures. Arabic uses one script-matched pair for the same two roles: Amiri (display) + IBM Plex Sans Arabic (text), self-hosted in `public/fonts/` and only downloaded when Arabic is shown.

### Isolation effect (Von Restorff)
We notice and remember what is different. Highlight the main element with a different shape, size or colour.
- **Applied** — the primary button is the only filled wine pill in its section (secondary actions are outlined); the selected option, the "Pay today (50%)" box and the total are the only tinted/accented items in their group; status colours appear only on status.

### Softer shadows
Harsh, high-contrast, short shadows look amateur. Blur and lower the opacity, and never use pure black — tint with the main colour.
- **Applied** — all shadows are long and blurred (blur ≥ 16px) with opacity ≤ 0.5 (≤ 0.6 on the charcoal bands), tinted wine/ink (`rgba(60,20,30,…)`, `rgba(31,20,24,…)`, `rgba(125,18,56,…)`), never `rgba(0,0,0,…)`. Spine edges on book mock-ups are soft insets. Shadow tokens: `--shadow-sm/md/lg`.

### Negative space
Creative negative space makes a design look instantly creative (a silhouette inside the design). Not the same as white space.
- **Partly** — the logo mark already cuts a flight path and a paper plane out of the open-book silhouette. No further silhouette artwork was added.

### Rhythm
Our brains love rhythm. If a layout feels random, repeat something: colours, styles, shapes.
- **Applied** — a short radius scale (8 / 12 / 16 / 24 / pill / circle; `--r-*`), an 8-based vertical rhythm for sections (64 / 80 / 96 / 120; `--sp-section-*`), the same card, chip and button shapes on every page, and the same five-step path motif.

### Overshooting
Optical balance between shapes: the same-size circle looks smaller than a square, so scale the circle up about 5% next to squares/rectangles.
- **Applied** — the language-switch circle in the header is 46px next to the 44px-high square-ish controls and the logo icon.

### Face priority
Faces are the first thing people notice; use a human image in ads when possible.
- **Applied** — the home hero leads with a photo of the two founders' clients, the story and sign-in pages use faces/hand-written notes. Face-led imagery should also be used for any ad or social creative made from this site.

### 2 colours as 1 (Albers, *Interaction of Color*)
A brand colour must be adjusted in shade to look the same on lighter and darker backgrounds.
- **Applied** — on ivory the brand colour is wine `#7D1238`; on the charcoal bands the same job is done by gold `#F2B880` (never wine on charcoal); on wine bands text is warm white `#FFF6F0`. Deep wine `#5E0D2A` is the hover/pressed shade.

### 60 / 30 / 10 colour rule
60% background, 30% content on top, 10% for important highlights. Do not use every colour; colours have jobs, and the design feels intentional.

| Share | Role | Colours | Used for |
| --- | --- | --- | --- |
| 60 | Canvas | ivory `#F6F1EA`, deeper band `#EFE5DA`, paper `#FBF7F1` | the page itself; photos and books carry the colour |
| 30 | Surface + ink | white, charcoal `#1F1418`, greys `#5C4B50` `#6B5A5F`, hairlines `#E7DDD4` `#CBB8AD` | cards, fields, text, dark bands (footer, proof, finale) |
| 10 | Accent | wine `#7D1238` (deeper `#5E0D2A` on hover, blush `#F5E4DF` for selected backgrounds); gold `#F2B880` on charcoal only | the primary button, the one highlighted word in a headline, the selected/current state, links, the total |
| – | Status | green `#2B6B55` (done, paid), amber `#9A5A0B` (due), red `#A3123F` (error) | status only, never decoration |
| – | Product | book covers, gift-card designs, paper | content, not interface |

- **Surfaces are tonal gradients, not flat fills — and they move, slowly** — a static base per role from four tokens in `public/site.css` (`--bg-page` ivory easing to sand, `--bg-band` the deeper bands, `--bg-ink` charcoal, `--bg-wine` wine to deep wine) plus soft light drawn on top: a fixed pair of layers behind every page (paper-white and a blush halo), and a layer inside each band, the charcoal footer / dark sections / studio sidebar (a faint wine glow) and the wine finale band. The light drifts with 80–110 s compositor-only transforms (`lightA` / `lightB`), so it is smooth, costs almost no CPU, and stops under `prefers-reduced-motion`; on phones only one page layer runs. Only palette tokens, single hue per surface, text contrast unchanged. Cards, fields and buttons stay flat; pages use the tokens and never their own gradient.
- **The pointer adapts to what is behind it** — `public/pointer.js` + the `.px-*` rules in `site.css`: a dot and a ring that show the page behind them inverted and desaturated (`backdrop-filter: grayscale(1) invert(1) contrast(4)`), so the pointer is dark over ivory/sand and light over charcoal/wine/photos, with no per-section colour list. It grows into a ring over links and buttons, steps aside for the normal text cursor over fields, is off on touch screens and in forced-colors mode, and the system cursor returns if the script does not run.
- **Applied** — 65 hex values folded to 38; wine→red→copper gradients are single-hue; copper removed; WhatsApp button and toggles use the accent; one icon tint; one backdrop per book type; the sign-in panel is the deeper ivory band; confetti is wine + gold. Tokens are at the top of `public/site.css`; `node scripts/check-palette.mjs` fails if a customer page uses a colour outside the palette.

### On phones — the same rules, nothing relaxed
Every rule above applies at phone width. These are the places where a phone needs a different layout to keep a rule true:
- **Hit areas (accessibility)** — every button, chip, tab and field is at least 44px tall; switches, photo stars and proof pins keep their look and get a larger invisible hit area.
- **Text size** — body 16px, secondary 14px, nothing under 12px.
- **Spacing rhythm** — sections use the same four steps at 40 / 48 / 56 / 64px (`--sp-section-*` switches at 700px), still multiples of 8; side gutters 16–22px.
- **Hierarchy and isolation** — one filled accent button per screen; the rest stay outlined. Nothing is sticky in the middle of the content (the FAQ heading un-sticks), so a block never covers the one below it.
- **Nothing overlaps, nothing is clipped** — a 9-step order tracker becomes a 3 × 3 grid (labels never touch), wide tables become labelled cards (Date / Order / Amount / Status per row), the account tabs become a 2 × 2 grid instead of a clipped scroller, the 3D book preview scales to fit its stage, the gift card grows taller on very narrow screens.
- **Scroll stories** — see brief rule 13.
- **Studio** — below 900px the sidebar becomes a top bar with a menu drawer (one source of navigation), so no studio page is a dead end on a phone.
- **Same system** — same two typefaces, same palette tokens, same radius scale, same soft tinted shadows, same logo lockup. Phone CSS only changes layout and size, never colour or type family.

---

## 4. Rules from the project brief (the client's and the team's directions)
1. **Host only the latest "D" variant** (storefront + customer flow + studio) — no canvas, no A/B/C variants. Hosting is Cloudflare Workers Static Assets (`wrangler.jsonc`, `public/_redirects`, `_headers`); `vercel.json` is kept in sync; old variants live in `archive/` and are not deployed.
2. **No dead link, no missing link, every button works.** Audited: every link and button on every page (1,326 links, 495 buttons, 0 bad); unknown URLs show `public/404.html`.
3. **Every block is sized to the screen, width and height** — `svh`/`clamp()`/`min()` instead of fixed pixel heights; first-screen buttons are never cropped; layouts checked at 280–1536px.
4. **One header and one footer on every customer page** — same menu everywhere (only the Sign in / Account label varies with state), stamped from `shared/header.html` and `shared/footer.html` by `node scripts/sync-chrome.mjs`. Header collapses to the menu button at 1024px so it never wraps.
5. **Buttons do what their label says** — the translate button translates the site; **Track** opens a page to enter an order number (plus Sign in); **Account** opens the account overview; the intro-curtain logo is centred.
6. **Arabic (RTL), done properly** — formal Modern Standard Arabic with one term per concept (اعتماد = approve, المسودة = proof, العربون = deposit, الصفحة المزدوجة = spread, سلة التسوق = cart); correct plural forms; every label, placeholder, option, aria-label and message translated; no italics and no letter-spacing in Arabic; marquees/carousels keep running left-to-right inside an RTL page; the "how it works" path is mirrored; fields use per-value direction so names, phones and e-mails keep their order. Sources: `i18n-src/` → `public/i18n/ar.js` (`node scripts/build-i18n.mjs`).
7. **Premium Arabic type** — IBM Plex Sans Arabic + Amiri, self-hosted (SIL OFL licences in `public/fonts/`); every element's font stack names them so no Arabic text falls back to a system font. Do not declare them as extra faces of Manrope/Fraunces (it breaks weight matching for Latin text).
8. **Hover states keep their text readable** — an inline style beats a class rule, so hover rules that change colour use `!important` when the element has inline colours. Audited: every `:hover` rule on every page, English and Arabic, 0 contrast regressions.
9. **No placeholders, no invented facts** — no `[brackets]` on customer pages. Prices come from `public/pricing.js`; contact details, CR/VAT numbers, delivery times and client reviews are not invented (see "Sample data to confirm" in `README.md`).
10. **One price list** — builder, cart, checkout, balance, order, gift cards, books and home page read `window.milesPricing`; the chosen currency (SAR/PKR) is remembered across pages.
11. **Make the visitor's choice travel** — the builder opens with the type/size chosen elsewhere (`?type=honeymoon&size=landscape`).
12. **Don't hide failures** — show errors, undo, and state; a "Saved/Paid" screen is labelled demo wherever there is no backend.
13. **Scroll stories work on phones too** — a pinned, scroll-driven section (the "Your camera roll → Curated by hand → Yours to keep" book on the home page) is built for the phone first: book on top, words below, one sticky screen (`100svh`); the closed book and the open spread are both centred (the book only slides to centre while the cover swings open); each caption's kicker, headline and button arrive one after another. Where scroll-driven animation is unsupported, or the screen is too short (landscape phones), or the visitor prefers reduced motion, the same content is a plain stack with the book already open - never a hidden or broken block.

---

## 5. Adding or changing something — checklist
- Colour: use a role from section 3; run `node scripts/check-palette.mjs`. Big surfaces take `--bg-page` / `--bg-band` / `--bg-ink` / `--bg-wine`, not a flat colour; new dark/wine/band sections get their moving light from the same selectors in `site.css`.
- Type: Fraunces + Manrope only (Arabic pair for Arabic); no all-caps over 5 words.
- Shape/space: pick from the radius and section-spacing scales; soft, tinted shadows.
- Copy: add the Arabic (`i18n-src/`) and rebuild; keep one term per concept.
- Prices and facts: change `public/pricing.js` or the README list, never a literal in a page.
- Header/footer: edit `shared/` then `node scripts/sync-chrome.mjs`.
- Phones: `node scripts/serve.mjs &` then `W=390,360 CUST=1 node scripts/mobile-audit.mjs` and `W=390 node scripts/rules-audit.mjs` (add `LANGS=en,ar` / `LANG2=ar`); look at a full-page screenshot of anything you touched.
- Before shipping: links/buttons audit, overflow at the seven widths, axe, language toggle, hover audit.
