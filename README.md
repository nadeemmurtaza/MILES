# Miles Retold — storefront (variant D)

> All design rules for this project (principles, the human-vs-AI checklist, logo/type/shadow/colour rules, brief) and how each is applied: **[DESIGN-RULES.md](DESIGN-RULES.md)**.

Static site served from `public/` (Cloudflare Workers static assets via `wrangler.jsonc`, or Vercel via `public/vercel.json`).
`/` redirects to the storefront (`D1-Motion`), `/studio` to the studio back-office. `archive/` holds the older concepts and is not deployed.

## One header and one footer, everywhere
The customer pages (D1–D7, D11–D16, D19–D25) share a single header and footer.

* Edit `shared/header.html` / `shared/footer.html` (and the `.sh-*` / `.sf-*` rules in `public/site.css`).
* Then run `node scripts/sync-chrome.mjs` — it stamps the blocks into every page between `<!--chrome:header-->` / `<!--chrome:footer-->` markers (safe to re-run).
* Needs `parse5`: `npm i --no-save parse5`.
* Behaviour (language switch, cart count, signed-in label, newsletter form) lives in `public/chrome.js`.

## Studio (admin) pages on phones
The studio pages (`public/D8-*.dc.html`: pipeline, stage pages, orders, customers, payments, print queue, shipping, reviews, calendar, codes, reports, settings, team, sign-in) have their own dark sidebar (`aside.rail`), not the customer header.

* Run `node scripts/sync-studio.mjs` — it stamps `<link rel="stylesheet" href="/studio.css">` and `<script src="/studio.js" defer></script>` into the `<head>` of every studio page between `<!--studio:chrome-->` markers (safe to re-run; no dependencies). Run it after adding a studio page.
* At 900px and below, `public/studio.js` adds a sticky top bar (logo -> pipeline, the page title, a 44px menu button) and turns the page's **own** sidebar into a slide-in drawer, so there is one list of navigation links to maintain (the `<aside class="rail">` in each page). It waits for the x-dc runtime to render the sidebar, never moves framework nodes, and does nothing above 900px. Esc, the scrim and the close button close it; focus moves into the drawer and back; the page behind does not scroll.
* **Settings → Team members** (`public/D8-A7b-Team.dc.html`): the team list (Tazmeen and Rameen are the two owners), an add-a-member form (name, WhatsApp number or email, role) with validation, resend / cancel-invite with Undo, and a "who can open what" summary per role (Owner, Designer, Print & shipping, Customer support, Finance). It is a prototype: no invitation is sent and nothing is stored. The Settings page links to it from the header and from its Team tab.
* `public/studio.css` holds the phone rules the studio pages share (swipeable filter strips with an edge fade, table rows that become labelled cards, 44px targets, stat-card and tracker layouts). Colours, radii and shadows there and in the pages are the `var(--token)`s from `site.css`; `node scripts/check-palette.mjs` checks the studio pages too.

## Surfaces and pointer
* `public/site.css`: `--bg-page`, `--bg-band`, `--bg-ink`, `--bg-wine` are the static bases; the slow-moving light is the `body::before/::after` layers and the `::before` layer inside any element whose inline style uses a `--bg-*` token (plus `.sf` and `.rail`). Keep `background: var(--bg-…)` on a section and it drifts automatically; the page wrapper stays `background: transparent`.
* `public/merge.js` (stamped the same way): fuses adjacent cards into one sheet at runtime and marks plain cards so the background light shows through; `data-doc` on a grid makes main + side a single sheet; `data-nomerge` opts out. Section edges are feathered by `--feather` in `site.css`.
* `public/pointer.js` (stamped into every page by `sync-chrome.mjs` / `sync-studio.mjs`, and in `404.html`): the adaptive pointer described in `DESIGN-RULES.md`. To turn it off on a page, drop the script tag; nothing else depends on it.

## Arabic (RTL)
The language button (and Account → Language) switches the whole site between English and Arabic; the choice is remembered.

* Source strings and translations: `i18n-src/` — `keys.json` (English, numbered), `part-*.json` (first-pass Arabic by index), `fix-*.json` (professional-register Arabic, applied over the parts — edit these), `extra.json` (strings built in code), `scoped.json` (per-page overrides), `patterns.json` (strings with live values; `@1[zero|one|two|few|many]` picks the Arabic plural form for capture 1). Rebuild with `node scripts/build-i18n.mjs`.
* Build: `node scripts/build-i18n.mjs` → `public/i18n/ar.js`.
* Type: **IBM Plex Sans Arabic** for text and **Amiri** for display, both SIL Open Font License, self-hosted in `public/fonts/` (Arabic glyphs only; licences alongside). Latin letters, digits and prices stay Manrope / Fraunces so they look the same in both languages. The `@font-face` rules and the `--ar-font` / `--ar-display` stacks are at the top and in the "Arabic / right-to-left" block of `public/site.css` — to use a commercially licensed face instead, change those two variables and the `@font-face` sources.
* Arabic never gets italics or letter-spacing (both break the script); `public/site.css` switches them off under `html.is-ar`.
* A sentence is matched as a whole (live values and inline elements are `{0}`, `{1}` slots), so Arabic word order is kept while the page's own bindings keep working.

## Colour system (60 / 30 / 10)
Colour has a job; nothing is coloured just to be colourful. The tokens and rules are documented at the top of `public/site.css`, and `node scripts/check-palette.mjs` fails if a customer page uses a colour outside the palette.

| Share | Role | Colours | Used for |
| --- | --- | --- | --- |
| 60 | Canvas | ivory `#F6F1EA`, deeper band `#EFE5DA` | the page itself; photos and books carry the colour |
| 30 | Surface + ink | white, charcoal `#1F1418`, greys `#5C4B50` `#6B5A5F`, hairlines `#E7DDD4` `#CBB8AD` | cards, fields, text, dark bands (footer, proof, finale) |
| 10 | Accent | wine `#7D1238` (deeper `#5E0D2A` on hover, blush `#F5E4DF` for selected backgrounds); gold `#F2B880` on charcoal only | the primary button, the one highlighted word in a headline, the selected / current state, links, the price total |
| – | Status | green (done / paid), amber (due), red (error) | status only, never decoration |
| – | Product | book covers, gift-card designs, paper | content, not interface |

Removed in this pass: the wine → red → copper gradients (progress bars, shimmering headline words), copper (step 5, ratings, dots), the green WhatsApp button and toggles (accent now), the pastel icon bubbles (one tint), the per-type pastel backdrops on the Books page, the wine sign-in panel (now the deeper ivory band) and the multicolour confetti.

## Sample data to confirm with the studio
Nothing on the customer pages shows `[brackets]` any more, but some content is sample wording or numbers until Tazmeen & Rameen confirm it:

* **Prices** — all in `public/pricing.js` (builder, cart, checkout, balance, order, gift cards and book pages read it). Change a number there and every page follows. PKR = SAR × `rate`. The chosen currency is remembered (`miles.cur`) across pages.
* **Contact details** — the footer and Help page no longer show a WhatsApp number, e-mail address, CR number or VAT number (none were confirmed). Add them back where you see "Message us" / the invoice line: Help page contact cards (`public/D15-Help.dc.html`, the WhatsApp card links to the form until a `https://wa.me/<number>` link is set) and `shared/footer.html` (then `node scripts/sync-chrome.mjs`).
* **Policies** — the three summaries on the Help page (refunds, terms, privacy) are plain-language drafts built only from facts already on the site (50% deposit, pay the rest after approval, made to order). The studio should review or replace them.
* **Reviews** — only the one real quote (Lens & Lights Studio) is shown; the home page rail shows real books from the lookbook instead of review cards. Add real client quotes to `D15-Help.dc.html` (#reviews) when available.
* **Sample order** — MR-1042 (dates 14 Sep → 29 Oct estimated delivery, SMSA tracking no.) is demo data used by the tracking, portal, balance and order pages.
* **Deep links** — `D2-Builder.dc.html?type=honeymoon&size=landscape` opens the builder with that choice made (`type`: travel, wedding, honeymoon, love-story, multi-city, camera-roll; `size`: portrait, landscape, square). The home page, Books page and Lookbook use these.

## Preview locally
`npx wrangler dev` (serves `public/` with the same redirect/headers rules as production).
