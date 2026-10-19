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
    101: 'EasyPhotos', 102: 'EasyPage', 103: 'EasyCover', 104: 'EasySend', 80: 'EdStoryboard', 81: 'EdPhotos', 82: 'EdLayouts', 83: 'EdText', 84: 'EdCover', 85: 'EdStyle', 86: 'EdFlipbook', 87: 'EdPrintCheck', 88: 'EdHistory', 89: 'EdSend', 100: 'EasyHome',
    137: 'Notifications', 138: 'EmailPreviews', 139: 'UiKit', 120: 'Privacy', 121: 'PrivateUpload', 122: 'ShareLinks', 123: 'Consent', 124: 'DeleteData', 125: 'AccessLog', 126: 'Security', 127: 'SmartAssist', 128: 'Approvals', 129: 'ArabicText', 130: 'TripMap', 131: 'Shortcuts', 8: 'SignIn', 1: 'Home' };
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
    dots: '<circle cx="5" cy="12" r="1.6"/><circle cx="12" cy="12" r="1.6"/><circle cx="19" cy="12" r="1.6"/>', up: '<path d="M6 15l6-6 6 6"/>', close: '<path d="M6 6l12 12M18 6L6 18"/>',
    next: '<path d="M9 6l6 6-6 6"/>', back: '<path d="M15 6l-6 6 6 6"/>'
  };
  var svg = function (k, s) { return '<svg width="' + (s || 18) + '" height="' + (s || 18) + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + I[k] + '</svg>'; };
  var L = function (list) { return list.map(function (n) { return [n, (N[n] || EXTRA[n])[1]]; }); };
  var EXTRA = {
    80: ['', 'Storyboard'], 81: ['', 'Photos'], 82: ['', 'Layouts'], 83: ['', 'Text'], 84: ['', 'Cover'], 85: ['', 'Style'], 86: ['', 'Flipbook'], 87: ['', 'Print check'], 88: ['', 'History'], 89: ['', 'Send'], 100: ['', 'Step by step'],
    137: ['', 'Notifications'], 138: ['', 'Email previews'], 139: ['', 'Interface kit'],
    120: ['', 'Overview'], 121: ['', 'Protected upload'], 122: ['', 'Sharing'], 123: ['', 'Your choices'], 124: ['', 'Delete data'], 125: ['', 'Who has looked'], 126: ['', 'Sign-in & devices'],
    127: ['', 'Smart help'], 128: ['', 'Approvals'], 129: ['', 'Arabic captions'], 130: ['', 'Trip map'], 131: ['', 'Shortcuts & access']
  };
  /* rail: key, label, icon, first page, sub-menu title, groups of [page, label] */
  var S = [
    ['order', 'Order', 'box', 9, 'My order', [['Overview', L([9, 10, 13, 11])]]],
    ['book', 'My book', 'book', 7, 'My book', [['Make the book', [[7, 'Photos'], [23, 'Live editor'], [127, 'Editor extras']]]]],
    ['msg', 'Messages', 'chat', 22, 'Messages', [['Talk to us', L([22, 137, 138, 17])]]],
    ['bill', 'Billing', 'card', 12, 'Billing', [['Payments', L([12, 24, 77])]]],
    ['priv', 'Privacy', 'lock', 120, 'Privacy & security', [['Your photos', L([120, 121, 122, 123, 124, 125, 126])]]],
    ['set', 'Settings', 'gear', 14, 'Settings', [['Account', L([14, 139])]]]
  ];
  /* third level: pages that belong together under one entry of the second bar are shown as a horizontal bar under the header */
  var H3 = [
    { key: 'ed', label: 'Editor pages', entry: 23, pages: [[100, 'Step by step'], [23, 'Canvas'], [80, 'Storyboard'], [81, 'Photos'], [82, 'Layouts'], [83, 'Text'], [84, 'Cover'], [85, 'Style'], [86, 'Flipbook'], [87, 'Print check'], [88, 'History'], [89, 'Send']] },
    { key: 'ex', label: 'Editor extras', entry: 127, pages: [[127, 'Smart help'], [128, 'Approvals'], [129, 'Arabic captions'], [130, 'Trip map'], [131, 'Shortcuts & access']] }
  ];
  var EASY = cur >= 100 && cur <= 104;                  /* step-by-step editing: phone-first, so the tab bar only */
  var look = EASY ? 100 : cur;
  var h3 = null; H3.forEach(function (g) { g.pages.forEach(function (p) { if (p[0] === look) h3 = g; }); });
  var isOn = function (n) { return n === look || (h3 && n === h3.entry); };   /* the group's entry in the second bar lights up for any page inside it */
  var cs = null;
  S.forEach(function (s) { s[5].forEach(function (g) { g[1].forEach(function (p) { if (isOn(p[0])) cs = s; }); }); });
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
    cs[5].map(function (g) { return '<div class="an-sg">' + g[0] + '</div>' + g[1].map(function (p) { return '<a href="' + href(p[0]) + '"' + (isOn(p[0]) ? ' class="on" aria-current="page"' : '') + '>' + p[1] + '</a>'; }).join(''); }).join('') +
    '</nav>';

  var apply = function () {
    var o = open();
    document.body.classList.toggle('an-sub-on', o);
    var t = root.querySelector('.an-tog');
    t.setAttribute('aria-expanded', o ? 'true' : 'false');
    t.classList.toggle('on', o);
  };
  var go = function () {
    if (EASY) return;
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

  /* ---- phones and small tablets: one bottom tab bar (1st bar) + a "pages" sheet (2nd bar) ---- */
  var NOCHIP = EASY || cur === 23 || (cur >= 80 && cur <= 89);   /* screens with their own bottom tools: tab bar only, no floating chip */
  var pageName = '';
  cs[5].forEach(function (g) { g[1].forEach(function (p) { if (isOn(p[0])) pageName = h3 ? (h3.pages.filter(function (q) { return q[0] === look; })[0] || p)[1] : p[1]; }); });
  var TABS = S.slice(0, 4), MORE = S.slice(4), inMore = MORE.indexOf(cs) > -1;
  var mroot = document.createElement('div');
  mroot.className = 'an-m';
  var sheetLinks = function (groups) { return groups.map(function (g) { return '<div class="an-sg">' + g[0] + '</div>' + g[1].map(function (p) { return '<a href="' + href(p[0]) + '"' + (isOn(p[0]) ? ' class="on" aria-current="page"' : '') + '>' + p[1] + '</a>'; }).join(''); }).join(''); };
  var moreHtml = '<div class="an-sg">More</div>' + MORE.map(function (s) { return '<a href="' + href(s[3]) + '"' + (s === cs ? ' class="on" aria-current="page"' : '') + '>' + s[1] + '</a>'; }).join('') +
    '<div class="an-sg">Elsewhere</div><a href="' + twin + '">' + (dark ? 'Light theme' : 'Dark theme') + '</a><a href="' + href(1) + '">Back to the shop</a><a href="' + href(8) + '">Sign out</a>';
  mroot.innerHTML =
    (NOCHIP ? '' : '<button type="button" class="an-chip" aria-haspopup="dialog">' + '<span>' + cs[4] + '</span><b>' + pageName + '</b>' + svg('up', 16) + '</button>') +
    ('<nav class="an-tabs" aria-label="Account sections">' +
      TABS.map(function (s) { return '<a href="' + href(s[3]) + '"' + (s === cs ? ' class="on" aria-current="true"' : '') + '>' + svg(s[2], 22) + '<span>' + s[1] + '</span></a>'; }).join('') +
      '<button type="button" class="an-more' + (inMore ? ' on' : '') + '" aria-haspopup="dialog">' + svg('dots', 22) + '<span>More</span></button></nav>') +
    '<div class="an-scrim" hidden></div><div class="an-sheet" role="dialog" aria-modal="true" aria-label="Pages" hidden><div class="an-sh"><b></b><button type="button" class="an-x" aria-label="Close">' + svg('close') + '</button></div><div class="an-sl"></div></div>';

  var sheet, scrim, lastFocus;
  var openSheet = function (more) {
    lastFocus = document.activeElement;
    sheet.querySelector('.an-sh b').textContent = more ? 'More' : cs[4];
    sheet.querySelector('.an-sl').innerHTML = more ? moreHtml : sheetLinks(cs[5]);
    sheet.hidden = scrim.hidden = false;
    requestAnimationFrame(function () { document.body.classList.add('an-sheet-on'); });
    var cur2 = sheet.querySelector('a.on') || sheet.querySelector('a'); if (cur2) { cur2.scrollIntoView({ block: 'nearest' }); sheet.querySelector('.an-x').focus(); }
  };
  var closeSheet = function () {
    document.body.classList.remove('an-sheet-on');
    setTimeout(function () { sheet.hidden = scrim.hidden = true; }, 260);
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  };
  var goMobile = function () {
    document.body.appendChild(mroot);
    sheet = mroot.querySelector('.an-sheet'); scrim = mroot.querySelector('.an-scrim');
    document.body.classList.add('an-m-on');
    if (ed === 'GL') document.body.classList.add('an-light');
    document.body.classList.add('an-tabs-on');
    mroot.addEventListener('click', function (e) {
      if (e.target.closest('.an-chip')) openSheet(false);
      else if (e.target.closest('.an-more')) openSheet(true);
      else if (e.target.closest('.an-x') || e.target === scrim) closeSheet();
    });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && !sheet.hidden) closeSheet(); });
  };
  if (document.body) goMobile(); else document.addEventListener('DOMContentLoaded', goMobile);

  /* ---- third-level bar: a horizontal strip right under the header ---- */
  if (h3 && !EASY) {
    var hb = document.createElement('nav');
    hb.className = 'an-h3'; hb.setAttribute('aria-label', h3.label);
    hb.innerHTML = '<b>' + h3.label + '</b>' + h3.pages.map(function (p) { return '<a href="' + href(p[0]) + '"' + (p[0] === look ? ' aria-current="page"' : '') + '><span>' + p[1] + '</span><i class="an-h3b" hidden></i></a>'; }).join('');
    var mirror = function () {   /* the editor pages show a count on Print check; keep it on the strip */
      h3.pages.forEach(function (p, i) {
        var src = document.querySelector('.ed-ws a[href="' + href(p[0]) + '"] b'), dst = hb.querySelectorAll('a')[i].querySelector('.an-h3b');
        var t = src ? src.textContent.trim() : ''; dst.textContent = t; dst.hidden = !t;
      });
    };
    var goH = function () {
      document.body.appendChild(hb); document.body.classList.add('an-h3-on');
      var on = hb.querySelector('[aria-current]'); if (on && on.scrollIntoView) { try { on.scrollIntoView({ inline: 'center', block: 'nearest' }); } catch (e) { on.scrollIntoView(); } }
      mirror(); setTimeout(mirror, 600); setTimeout(mirror, 1800);
      var ws = document.querySelector('.ed-ws'); if (ws && window.MutationObserver) new MutationObserver(mirror).observe(ws, { childList: true, subtree: true, characterData: true });
    };
    if (document.body) goH(); else document.addEventListener('DOMContentLoaded', goH);
  }
})();
