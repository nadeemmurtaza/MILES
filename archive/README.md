# Archive — not deployed

Only `public/` is hosted, so nothing here is reachable on the live site. Option G is the live design (see the root README).

| Folder | Option |
| --- | --- |
| `concepts/Main.dc.html`, `Postcard`, `Atlas` (+ `index.html`, `assets/`) | A–C · first website concepts, and the superseded `D1-Home` |
| `concepts/D/` | D · full commerce system: `public/` (pages, `site.css`, `chrome.js`, `pointer.js`, `studio.*`, fonts, Arabic `i18n/`), `scripts/` (sync-chrome, sync-studio, build-i18n, check-palette, audits), `shared/`, `i18n-src/`, `DESIGN-RULES.md` |
| `concepts/E/` | E · bold edition, eight home pages |
| `concepts/F/` | F · final edition (dark) |
| `concepts/FL/` | F · light edition |

To preview one, copy its pages (and the files they link to, plus `assets/`) back into `public/`.
To restore D: `cp -r archive/concepts/D/public/. public/`, `cp -r archive/concepts/D/{shared,i18n-src,DESIGN-RULES.md} .`, `cp archive/concepts/D/scripts/* scripts/`, and point `public/_redirects`, `public/vercel.json` and `scripts/serve.mjs` back at `D1-Motion.dc.html` and `D8-Studio.dc.html`.
