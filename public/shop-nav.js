/* Miles Retold · storefront bottom tab bar (phones and small tablets).
   Same bar, sheet and look as the account pages (css/account-nav.css); only the links differ. */
(function () {
  'use strict';
  var m = location.pathname.match(/\/(GL?)(\d+)-[^\/]*\.dc\.html$/);
  if (!m) return;
  var ed = m[1], cur = +m[2], dark = ed === 'G';
  var FILE = { 1: 'Home', 2: 'Books', 3: 'Builder', 4: 'Cart', 5: 'Checkout', 6: 'Confirmed', 8: 'SignIn', 9: 'Account', 15: 'Story', 16: 'Lookbook', 17: 'Help', 18: 'Gifts', 19: 'Project195' };
  var href = function (n) { return ed + n + '-' + FILE[n] + '.dc.html'; };
  var I = {
    home: '<path d="M4 11l8-7 8 7v9H4z"/><path d="M10 20v-6h4v6"/>',
    book: '<path d="M4 5.5c3-1.4 5.7-1.2 8 .8v12.7c-2.3-2-5-2.2-8-.8z"/><path d="M20 5.5c-3-1.4-5.7-1.2-8 .8v12.7c2.3-2 5-2.2 8-.8z"/>',
    bag: '<path d="M5 8h14l-1.2 11.2a2 2 0 0 1-2 1.8H8.2a2 2 0 0 1-2-1.8z"/><path d="M9 8V6a3 3 0 0 1 6 0v2"/>',
    user: '<circle cx="12" cy="8" r="3.6"/><path d="M5 20c1-3.6 3.8-5.4 7-5.4s6 1.8 7 5.4"/>',
    dots: '<circle cx="5" cy="12" r="1.6"/><circle cx="12" cy="12" r="1.6"/><circle cx="19" cy="12" r="1.6"/>',
    close: '<path d="M6 6l12 12M18 6L6 18"/>'
  };
  var svg = function (k, s) { return '<svg width="' + (s || 22) + '" height="' + (s || 22) + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + I[k] + '</svg>'; };
  var TABS = [['home', 'Home', 1, [1]], ['book', 'Books', 2, [2, 3]], ['bag', 'Cart', 4, [4, 5, 6]], ['user', 'Account', 9, [8, 9]]];
  var MORE = [16, 15, 18, 17, 19], LABEL = { 16: 'Lookbook', 15: 'Our story', 18: 'Gifts', 17: 'Help', 19: 'Project 195', 3: 'Start a book', 8: 'Sign in' };
  var inMore = MORE.indexOf(cur) > -1;
  var twin = (dark ? 'GL' : 'G') + cur + '-' + FILE[cur] + '.dc.html';
  var link = function (n, on) { return '<a href="' + href(n) + '"' + (on ? ' class="on" aria-current="page"' : '') + '>' + LABEL[n] + '</a>'; };
  var moreHtml = '<div class="an-sg">Explore</div>' + MORE.map(function (n) { return link(n, n === cur); }).join('') +
    '<div class="an-sg">Your book</div>' + link(3, false) + link(8, false) +
    '<div class="an-sg">Elsewhere</div><a href="' + twin + '">' + (dark ? 'Light theme' : 'Dark theme') + '</a>';
  var root = document.createElement('div');
  root.className = 'an-m';
  root.innerHTML =
    '<nav class="an-tabs" aria-label="Shop sections">' +
    TABS.map(function (t) { var on = t[3].indexOf(cur) > -1; return '<a href="' + href(t[2]) + '"' + (on ? ' class="on" aria-current="page"' : '') + '>' + svg(t[0]) + (t[1] === 'Cart' ? '<i class="an-badge" hidden></i>' : '') + '<span>' + t[1] + '</span></a>'; }).join('') +
    '<button type="button" class="an-more' + (inMore ? ' on' : '') + '" aria-haspopup="dialog">' + svg('dots') + '<span>More</span></button></nav>' +
    '<div class="an-scrim" hidden></div><div class="an-sheet" role="dialog" aria-modal="true" aria-label="More" hidden><div class="an-sh"><b>More</b><button type="button" class="an-x" aria-label="Close">' + svg('close', 18) + '</button></div><div class="an-sl">' + moreHtml + '</div></div>';
  var sheet, scrim, last;
  var open = function () { last = document.activeElement; sheet.hidden = scrim.hidden = false; requestAnimationFrame(function () { document.body.classList.add('an-sheet-on'); }); sheet.querySelector('.an-x').focus(); };
  var close = function () { document.body.classList.remove('an-sheet-on'); setTimeout(function () { sheet.hidden = scrim.hidden = true; }, 260); if (last && last.focus) last.focus(); };
  var go = function () {
    document.body.appendChild(root);
    sheet = root.querySelector('.an-sheet'); scrim = root.querySelector('.an-scrim');
    document.body.classList.add('an-m-on', 'an-tabs-on', 'an-shop');
    if (ed === 'GL') document.body.classList.add('an-light');
    root.addEventListener('click', function (e) {
      if (e.target.closest('.an-more')) open();
      else if (e.target.closest('.an-x') || e.target === scrim) close();
    });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && !sheet.hidden) close(); });
    /* mirror the cart count the page header shows */
    var badge = root.querySelector('.an-badge'), tries = 0, watching = false;
    var sync = function () {
      var b = document.querySelector('.nav .cart b'), n = b ? b.textContent.trim() : '';
      if (/^\d+$/.test(n) && n !== '0') { badge.textContent = n; badge.hidden = false; } else badge.hidden = true;
      if (b && !watching) { watching = true; new MutationObserver(sync).observe(b, { childList: true, characterData: true, subtree: true }); }
      if (!/^\d+$/.test(n) && ++tries < 40) setTimeout(sync, 250);
    };
    sync();
  };
  if (document.body) go(); else document.addEventListener('DOMContentLoaded', go);
})();
