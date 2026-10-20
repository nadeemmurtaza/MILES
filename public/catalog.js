/* Miles Retold · the book catalog: the sizes, page counts, layouts and price formula the studio offers.
   One shared record in localStorage ('miles.catalog.v1'). The studio edits it on the Catalog & pricing pages (catalog-admin.js);
   the live editor reads it (sizes and page counts in the first steps, layouts in the page designer, the price under the book).
   Nothing here talks to a server: it is the prototype of the setting, the record would move to the backend later. */
(function () {
  'use strict';
  var KEY = 'miles.catalog.v1';
  var DEF = {
    v: 1,
    sizes: [
      { id: 'portrait', name: 'Portrait', w: 8, h: 10, on: true, base: 64, per: 6 },
      { id: 'landscape', name: 'Landscape', w: 11, h: 8.5, on: true, base: 84, per: 7 },
      { id: 'square', name: 'Square', w: 10, h: 10, on: true, base: 74, per: 6.5 }
    ],
    pages: [{ n: 20, on: true }, { n: 30, on: true }, { n: 40, on: true, pop: true }, { n: 50, on: true }, { n: 60, on: true }, { n: 80, on: true }],
    layouts: { off: [], custom: [] },
    pricing: { currency: 'SAR', margin: 0, vat: 0, shipping: 0, minimum: 0, step: 1, deposit: 50 },
    saved: 0
  };
  var clone = function (o) { return JSON.parse(JSON.stringify(o)); };
  var num = function (v, d) { v = parseFloat(v); return isFinite(v) ? v : d; };

  function clean(c) {
    var d = clone(DEF);
    if (!c || c.v !== 1) return d;
    var out = clone(d);
    if (Array.isArray(c.sizes) && c.sizes.length) out.sizes = c.sizes.map(function (s, i) {
      return { id: String(s.id || 's' + i), name: String(s.name || 'Size').slice(0, 24), w: Math.max(4, Math.min(24, num(s.w, 8))), h: Math.max(4, Math.min(24, num(s.h, 10))), on: s.on !== false, base: Math.max(0, num(s.base, 0)), per: Math.max(0, num(s.per, 0)) };
    });
    if (Array.isArray(c.pages) && c.pages.length) out.pages = c.pages.map(function (p) { return { n: Math.round(num(p.n, 40)), on: p.on !== false, pop: !!p.pop }; }).filter(function (p) { return p.n >= 10 && p.n <= 200 && p.n % 2 === 0; });
    if (!out.pages.length) out.pages = clone(DEF.pages);
    if (c.layouts) out.layouts = { off: Array.isArray(c.layouts.off) ? c.layouts.off.map(String) : [], custom: Array.isArray(c.layouts.custom) ? c.layouts.custom : [] };
    if (c.pricing) Object.keys(DEF.pricing).forEach(function (k) { out.pricing[k] = k === 'currency' ? String(c.pricing[k] || DEF.pricing[k]).slice(0, 4) : Math.max(0, num(c.pricing[k], DEF.pricing[k])); });
    out.pricing.step = Math.max(1, out.pricing.step); out.pricing.deposit = Math.min(100, out.pricing.deposit);
    out.saved = num(c.saved, 0);
    return out;
  }
  function get() { try { return clean(JSON.parse(localStorage.getItem(KEY) || 'null')); } catch (e) { return clean(null); } }
  function save(c) { c = clean(c); c.saved = Date.now(); try { localStorage.setItem(KEY, JSON.stringify(c)); } catch (e) {} return c; }
  function reset() { try { localStorage.removeItem(KEY); } catch (e) {} return get(); }

  /* the price formula, in one place: (base + per page x pages) -> at least the minimum -> margin -> shipping -> VAT -> rounded up to the step */
  function price(c, sizeId, pages) {
    var s = (c.sizes.filter(function (x) { return x.id === sizeId; })[0]) || c.sizes[0], p = c.pricing;
    var raw = s.base + s.per * pages, floor = Math.max(raw, p.minimum), withMargin = floor * (1 + p.margin / 100), withShip = withMargin + p.shipping, withVat = withShip * (1 + p.vat / 100);
    var total = Math.ceil(withVat / p.step - 1e-9) * p.step;
    return { raw: raw, floor: floor, margin: withMargin - floor, shipping: p.shipping, vat: withVat - withShip, total: total, deposit: Math.round(total * p.deposit / 100), currency: p.currency, minApplied: p.minimum > raw };
  }
  var fmt = function (n) { return (Math.round(n * 100) / 100).toLocaleString('en', { maximumFractionDigits: 2 }); };
  var label = function (s) { return s.w + ' × ' + s.h + ' in'; };

  window.MilesCatalog = {
    KEY: KEY, DEF: DEF, get: get, save: save, reset: reset, price: price, fmt: fmt, label: label, clean: clean,
    sizes: function () { var c = get(); var on = c.sizes.filter(function (s) { return s.on; }); return on.length ? on : c.sizes.slice(0, 1); },
    pageOptions: function () { var c = get(); var on = c.pages.filter(function (p) { return p.on; }); return on.length ? on : c.pages.slice(0, 1); }
  };
})();
