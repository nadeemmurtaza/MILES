/* Miles Retold · customer account sidebars (desktop only).
   1st bar: the main sections, as a slim icon rail.  2nd bar: the pages of the section you are in.
   Built here once for every account page, so the links stay in one place. Light/dark twin and Arabic are followed. */
(function () {
  'use strict';
  var m = location.pathname.match(/\/(GL?)(\d+)-[^\/]*\.dc\.html$/);
  if (!m) return;
  var ed = m[1], cur = +m[2], KEY = 'miles.acct.sub';
  var N = {
    9: ['Account', 'Overview'], 10: ['Order', 'Order details'], 13: ['Order', 'Tracking'], 11: ['Order', 'Proof'], 7: ['Book', 'Photos'], 23: ['Book', 'Live editor'],
    22: ['Messages', 'Messages'], 17: ['Messages', 'Help'], 12: ['Billing', 'Balance'], 24: ['Billing', 'Invoices'], 77: ['Billing', 'Invoice'], 14: ['Settings', 'Settings']
  };
  var FILE = { 9: 'Account', 10: 'Order', 13: 'Tracking', 11: 'Proof', 7: 'Upload', 23: 'Editor', 22: 'Messages', 17: 'Help', 12: 'Balance', 24: 'Invoices', 77: 'Invoice', 14: 'Settings',
    80: 'EdStoryboard', 81: 'EdPhotos', 82: 'EdLayouts', 83: 'EdText', 84: 'EdCover', 85: 'EdStyle', 86: 'EdFlipbook', 87: 'EdPrintCheck', 88: 'EdHistory', 89: 'EdSend', 100: 'EasyHome',
    120: 'Privacy', 121: 'PrivateUpload', 122: 'ShareLinks', 123: 'Consent', 124: 'DeleteData', 125: 'AccessLog', 126: 'Security', 127: 'SmartAssist', 128: 'Approvals', 129: 'ArabicText', 130: 'TripMap', 131: 'Shortcuts', 8: 'SignIn', 1: 'Home' };
  var href = function (n) { return ed + n + '-' + FILE[n] + '.dc.html'; };
  var I = {
    home: '<path d="M4 11l8-7 8 7v9H4z"/><path d="M10 20v-6h4v6"/>',
    box: '<path d="M4 8l8-4 8 4v8l-8 4-8-4z"/><path d="M4 8l8 4 8-4M12 12v8"/>',
    book: '<path d="M4 5.5c3-1.4 5.7-1.2 8 .8v12.7c-2.3-2-5-2.2-8-.8z"/><path d="M20 5.5c-3-1.4-5.7-1.2-8 .8v12.7c2.3-2 5-2.2 8-.8z"/>',
    chat: '<path d="M4 5h16v11H9l-5 4z"/>', card: '<rect x="3" y="6" width="18" height="13" rx="2"/><path d="M3 10h18"/>',
    lock: '<rect x="5" y="11" width="14" height="9" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/>',
    gear: '<circle cx="12" cy="12" r="3"/><path d="M19 12a7 7 0 0 0-.1-1.2l2-1.6-2-3.4-2.4 1a7 7 0 0 0-2-1.2L14 3h-4l-.5 2.6a7 7 0 0 0-2 1.2l-2.4-1-2 3.4 2 1.6A7 7 0 0 0 5 12c0 .4 0 .8.1 1.2l-2 1.6 2 3.4 2.4-1c.6.5 1.3.9 2 1.2L10 21h4l.5-2.6c.7-.3 1.4-.7 2-1.2l2.4 1 2-3.4-2-1.6c.1-.4.1-.8.1-1.2z"/>',
    sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2.5v2M12 19.5v2M4.6 4.6L6 6M18 18l1.4 1.4M2.5 12h2M19.5 12h2M4.6 19.4L6 18M18 6l1.4-1.4"/>',
    moon: '<path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5z"/>', out: '<path d="M15 4h4v16h-4M10 8l-4 4 4 4M6 12h11"/>', site: '<path d="M3 12h18M12 3c3 3 3 15 0 18M12 3c-3 3-3 15 0 18"/><circle cx="12" cy="12" r="9"/>',
    next: '<path d="M9 6l6 6-6 6"/>', back: '<path d="M15 6l-6 6 6 6"/>'
  };
  var svg = function (k, s) { return '<svg width="' + (s || 18) + '" height="' + (s || 18) + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + I[k] + '</svg>'; };
  var L = function (list) { return list.map(function (n) { return [n, (N[n] || EXTRA[n])[1]]; }); };
  var EXTRA = {
    80: ['', 'Storyboard'], 81: ['', 'Photos'], 82: ['', 'Layouts'], 83: ['', 'Text'], 84: ['', 'Cover'], 85: ['', 'Style'], 86: ['', 'Flipbook'], 87: ['', 'Print check'], 88: ['', 'History'], 89: ['', 'Send'], 100: ['', 'Step by step'],
    120: ['', 'Overview'], 121: ['', 'Protected upload'], 122: ['', 'Sharing'], 123: ['', 'Your choices'], 124: ['', 'Delete data'], 125: ['', 'Who has looked'], 126: ['', 'Sign-in & devices'],
    127: ['', 'Smart help'], 128: ['', 'Approvals'], 129: ['', 'Arabic captions'], 130: ['', 'Trip map'], 131: ['', 'Shortcuts & access']
  };
  /* rail: key, label, icon, first page, sub-menu title, groups of [page, label] */
  var S = [
    ['order', 'Order', 'box', 9, 'My order', [['Overview', L([9, 10, 13, 11])]]],
    ['book', 'My book', 'book', 7, 'My book', [['Make the book', L([7, 23, 100])], ['Editor pages', L([80, 81, 82, 83, 84, 85, 86, 87, 88, 89])], ['Editor extras', L([127, 128, 129, 130, 131])]]],
    ['msg', 'Messages', 'chat', 22, 'Messages', [['Talk to us', L([22, 17])]]],
    ['bill', 'Billing', 'card', 12, 'Billing', [['Payments', L([12, 24, 77])]]],
    ['priv', 'Privacy', 'lock', 120, 'Privacy & security', [['Your photos', L([120, 121, 122, 123, 124, 125, 126])]]],
    ['set', 'Settings', 'gear', 14, 'Settings', [['Account', L([14])]]]
  ];
  var cs = null;
  S.forEach(function (s) { s[5].forEach(function (g) { g[1].forEach(function (p) { if (p[0] === cur) cs = s; }); }); });
  if (!cs) return;
  var get = function () { try { return localStorage.getItem(KEY); } catch (e) { return null; } };
  var put = function (v) { try { localStorage.setItem(KEY, v); } catch (e) {} };
  var wide = cur === 23 || (cur >= 80 && cur <= 89);   /* editor screens need the room: second bar starts closed there */
  var open = function () { var v = get(); return v === null ? !wide : v === '1'; };

  var twin = (ed === 'GL' ? 'G' : 'GL') + cur + '-' + FILE[cur] + '.dc.html';
  var dark = ed === 'G';
  var root = document.createElement('div');
  root.className = 'an';
  root.innerHTML =
    '<aside class="an-rail" aria-label="Account sections">' +
    S.map(function (s) { return '<a class="an-rl' + (s === cs ? ' on' : '') + '" href="' + href(s[3]) + '"' + (s === cs ? ' aria-current="true"' : '') + ' title="' + s[1] + '">' + svg(s[2]) + '<span>' + s[1] + '</span></a>'; }).join('') +
    '<span class="an-gap"></span>' +
    '<button type="button" class="an-rl an-tog" aria-expanded="true" title="Show or hide the page list">' + svg('next') + '<span>Pages</span></button>' +
    '<a class="an-rl" href="' + twin + '" title="' + (dark ? 'Light theme' : 'Dark theme') + '">' + svg(dark ? 'sun' : 'moon') + '<span>' + (dark ? 'Light theme' : 'Dark theme') + '</span></a>' +
    '<a class="an-rl" href="' + href(1) + '" title="Back to the shop">' + svg('site') + '<span>Shop</span></a>' +
    '<a class="an-rl" href="' + href(8) + '" title="Sign out">' + svg('out') + '<span>Sign out</span></a>' +
    '</aside>' +
    '<nav class="an-sub" aria-label="' + cs[4] + ' pages"><div class="an-sh"><b>' + cs[4] + '</b><button type="button" class="an-x" aria-label="Hide the page list" title="Hide the page list">' + svg('back') + '</button></div>' +
    cs[5].map(function (g) { return '<div class="an-sg">' + g[0] + '</div>' + g[1].map(function (p) { return '<a href="' + href(p[0]) + '"' + (p[0] === cur ? ' class="on" aria-current="page"' : '') + '>' + p[1] + '</a>'; }).join(''); }).join('') +
    '</nav>';

  var apply = function () {
    var o = open();
    document.body.classList.toggle('an-sub-on', o);
    var t = root.querySelector('.an-tog');
    t.setAttribute('aria-expanded', o ? 'true' : 'false');
    t.classList.toggle('on', o);
  };
  var go = function () {
    document.body.appendChild(root);
    document.body.classList.add('an-on');
    if (ed === 'GL') document.body.classList.add('an-light');
    apply();
    root.addEventListener('click', function (e) {
      if (e.target.closest('.an-tog')) { put(open() ? '0' : '1'); apply(); }
      else if (e.target.closest('.an-x')) { put('0'); apply(); }
    });
  };
  if (document.body) go(); else document.addEventListener('DOMContentLoaded', go);
})();
