/* Sample price list: the single source for every amount shown on the site (builder, cart, checkout, balance, order, gift cards, books).
   All amounts are SAR; PKR = SAR x rate. The numbers below are the working sample prices from the builder - confirm or change them here
   and every page follows. Loaded synchronously in <head> so component scripts can use window.milesPricing while they render. */
(function () {
  'use strict';
  var P = {
    rate: { SAR: 1, PKR: 74 },
    bases: { portrait: 280, landscape: 320, square: 300, mini: 280 },   // SAR, at the minimum page count
    pagesMin: 30, pagesMax: 80, pageStep: 10, pageStepPrice: 40,        // + SAR 40 for every 10 pages above 30
    copyFactor: 0.6,                                                     // extra copies / reprints cost 60% of the book
    priority: 120,                                                       // priority design add-on
    ship: { SAR: { standard: 25, express: 45 }, PKR: { standard: 4, express: 8 } },   // in SAR-equivalent units (x rate = PKR)
    vat: 0.15
  };
  P.book = function (shape, pages) { return P.bases[shape] + (pages - P.pagesMin) / P.pageStep * P.pageStepPrice; };
  P.copy = function (shape, pages) { return Math.round(P.book(shape, pages) * P.copyFactor); };
  P.cur = function () { var c = null; try { c = localStorage.getItem('miles.cur'); } catch (e) {} return c === 'PKR' ? 'PKR' : 'SAR'; };
  P.setCur = function (c) {
    c = c === 'PKR' ? 'PKR' : 'SAR';
    try { localStorage.setItem('miles.cur', c); } catch (e) {}
    try { document.dispatchEvent(new CustomEvent('miles:cur', { detail: c })); } catch (e) {}
    return c;
  };
  P.fmt = function (sar, cur) { cur = cur || P.cur(); return cur + ' ' + Math.round(sar * P.rate[cur]).toLocaleString('en-US'); };
  P.from = function (cur) { return P.fmt(P.book('portrait', P.pagesMin), cur); };
  // gift-card tiers are priced as the book they buy
  P.tiers = { small: P.book('portrait', 30), popular: P.book('portrait', 40), large: P.book('landscape', 50) };
  // the sample order MR-1042 (Portrait 8 x 10, 40 pages, delivered by SMSA Express)
  P.order = { book: P.book('portrait', 40), ship: P.ship.SAR.standard };
  P.order.total = P.order.book + P.order.ship;
  P.order.deposit = P.order.book * 0.5 + P.order.ship;   // 50% of the book + delivery, paid up front
  P.order.balance = P.order.total - P.order.deposit;      // the other 50% of the book, after approval
  window.milesPricing = P;
})();
