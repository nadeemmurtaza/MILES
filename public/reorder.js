/* Miles Retold · one book from "My books": its facts, its invoice, and "order more copies" that goes to the cart.
   The book comes from ?o=MR-0877. Prototype data; the cart reads localStorage['miles.reorder']. */
(function () {
  'use strict';
  var E = (document.getElementById('bd-root') || document.body).getAttribute('data-e') || (/\/G\d/.test(location.pathname) ? 'G' : 'GL');
  function draw() {
  var root = document.getElementById('bd-root'); if (!root || root.querySelector('.bd-top, .bd-miss')) return;
  var BOOKS = {
    'MR-1042': { t: 'Honeymoon · Maldives', s: 'Portrait 8 × 10 · 40 pages · linen hardcover', st: 'Proof ready', d: 'Ordered 14 Sep 2026', unit: 209, img: '/_blob/6dc6964be6ca87733a870c819d870936', cur: true },
    'MR-0877': { t: 'London · April 2024', s: 'Landscape 10 × 8 · 32 pages · linen hardcover', st: 'Delivered', d: 'Delivered 2 May 2024', unit: 187, img: '/_blob/1bebe18032c3ba7f722debbe5fa70f36' },
    'MR-0731': { t: 'Paris · July 2023', s: 'Portrait 8 × 10 · 28 pages · linen hardcover', st: 'Delivered', d: 'Delivered 14 Aug 2023', unit: 171, img: '/_blob/6b43c91be8c10d0cbed5dc2520dde00d' },
    'MR-0512': { t: 'Our wedding', s: 'Square 10 × 10 · 48 pages · linen hardcover', st: 'Delivered', d: 'Delivered 20 Jan 2023', unit: 231, img: '' }
  };
  var no = (new URLSearchParams(location.search).get('o') || 'MR-1042').toUpperCase(), B = BOOKS[no];
  var cur = 'SAR'; try { cur = localStorage.getItem('mr-cur') === 'PKR' ? 'PKR' : 'SAR'; } catch (e) {}
  var rate = cur === 'PKR' ? 74 : 1, money = function (n) { return cur + ' ' + Math.round(n * rate).toLocaleString('en-US'); };
  var h = function (tag, attrs) {
    var el = document.createElement(tag); attrs = attrs || {};
    Object.keys(attrs).forEach(function (k) { if (k === 'text') el.textContent = attrs[k]; else if (k === 'on') Object.keys(attrs.on).forEach(function (e) { el.addEventListener(e, attrs.on[e]); }); else el.setAttribute(k, attrs[k]); });
    var add = function (c) { if (!c) return; if (Array.isArray(c)) c.forEach(add); else el.appendChild(typeof c === 'string' ? document.createTextNode(c) : c); };
    for (var i = 2; i < arguments.length; i++) add(arguments[i]);
    return el;
  };
  if (!B) { root.textContent = ''; root.appendChild(h('p', { class: 'ed-muted bd-miss', text: 'We could not find that book.' })); root.appendChild(h('a', { class: 'ed-btn', href: E + '143-OrderHistory.dc.html', text: 'Back to My books' })); return; }
  document.title = (E === 'GL' ? 'Light · ' : '') + B.t + ' · Miles Retold';
  var h1 = document.querySelector('.dp-h1'); if (h1) h1.textContent = B.t;
  var lead = document.querySelector('.dp-lead'); if (lead) lead.textContent = 'Order ' + no + ' · ' + B.d;

  var copies = 1, tot = h('b', { class: 'bd-tot' }), cnt = h('output', { class: 'bd-n', 'aria-live': 'polite' }), minus, plus;
  var paint = function () { cnt.textContent = copies + (copies === 1 ? ' copy' : ' copies'); tot.textContent = money(B.unit * copies); minus.disabled = copies <= 1; plus.disabled = copies >= 50; };
  var set = function (n) { copies = Math.max(1, Math.min(50, n)); paint(); };
  minus = h('button', { type: 'button', class: 'ed-btn sq', 'aria-label': 'One copy fewer', text: '−', on: { click: function () { set(copies - 1); } } });
  plus = h('button', { type: 'button', class: 'ed-btn sq', 'aria-label': 'One copy more', text: '+', on: { click: function () { set(copies + 1); } } });
  var quick = h('div', { class: 'bd-q', role: 'group', 'aria-label': 'Quick choice' }, [1, 2, 3, 5, 10].map(function (n) { return h('button', { type: 'button', class: 'ed-btn sm', text: n === 1 ? 'One copy' : n + ' copies', on: { click: function () { set(n); } } }); }));
  var go = h('button', { type: 'button', class: 'ed-btn pri', text: 'Continue to cart and payment', on: { click: function () {
    try { localStorage.setItem('miles.reorder', JSON.stringify({ no: no, title: B.t, spec: B.s, unit: B.unit, copies: copies, img: B.img })); } catch (e) {}
    location.href = E + '4-Cart.dc.html';
  } } });

  var cover = B.img ? h('img', { class: 'bd-cover', src: B.img, alt: 'Cover of ' + B.t }) : h('div', { class: 'bd-cover bd-none', 'aria-hidden': 'true' });
  var facts = h('div', { class: 'bd-facts' },
    h('div', null, h('small', { text: 'Status' }), h('b', { text: B.st })),
    h('div', null, h('small', { text: 'Details' }), h('b', { text: B.s })),
    h('div', null, h('small', { text: 'Order' }), h('b', { text: no })));
  var links = h('div', { class: 'bd-links' },
    h('a', { class: 'ed-btn', href: E + '24-Invoices.dc.html', text: 'Invoice and download' }),
    B.cur ? h('a', { class: 'ed-btn', href: E + '13-Tracking.dc.html', text: 'Track this order' }) : null,
    B.cur ? h('a', { class: 'ed-btn', href: E + '10-Order.dc.html', text: 'Order details' }) : null);
  var again = h('div', { class: 'bd-again' },
    h('h2', { class: 'dp-h2', text: B.cur ? 'Order extra copies' : 'Order this book again' }),
    h('p', { class: 'ed-muted', text: 'Same design, printed again. Choose one copy or as many as you need. Each copy is ' + money(B.unit) + '; shipping is added in the cart.' }),
    quick,
    h('div', { class: 'bd-step' }, minus, cnt, plus, h('span', { class: 'bd-sp' }), tot),
    h('div', { class: 'ew-actions' }, go));
  root.textContent = '';
  root.appendChild(h('div', { class: 'bd-top' }, cover, h('div', null, facts, links)));
  root.appendChild(again);
  root.appendChild(h('p', { class: 'bd-back' }, h('a', { href: E + '143-OrderHistory.dc.html', text: '← All my books' })));
  paint();
  }
  var go2 = function () { draw(); if (window.MutationObserver) new MutationObserver(draw).observe(document.body, { childList: true, subtree: true }); };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', go2); else go2();
})();
