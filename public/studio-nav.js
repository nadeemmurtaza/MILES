/* Miles Retold · studio bottom tab bar (phones, 900px and under). Same bar, sheet and look as the customer pages (css/account-nav.css).
   On wider screens the studio keeps its two sidebars, so this adds nothing there. */
(function () {
  'use strict';
  var m = location.pathname.match(/\/(GL?)(\d+)-[^\/]*\.dc\.html$/);
  if (!m) return;
  var ed = m[1], cur = +m[2], dark = ed === 'G';
  var FILE = { 30: 'Studio', 41: 'Customers', 42: 'Payments', 46: 'StudioSettings', 48: 'StudioSignIn', 49: 'Calendar', 54: 'Reports', 55: 'Inbox', 57: 'Insights', 70: 'Editor', 71: 'Users', 76: 'Invoices', 132: 'PhotoAccess' };
  var cur0 = cur, page = location.pathname.split('/').pop();
  var href = function (n) { return ed + n + '-' + FILE[n] + '.dc.html'; };
  var EDITOR = '/book/editor.html?as=studio';
  var SEC = { orders: [30, 31, 32, 33, 34, 35, 36, 37, 38, 40, 43, 44, 47], cal: [49, 50, 51, 52], cust: [41, 45, 55, 56], money: [42, 76, 77, 78, 79] };
  var inSec = function (k) { return SEC[k].indexOf(cur) > -1; };
  var I = {
    box: '<rect x="3" y="4" width="5" height="16" rx="1.5"/><rect x="10" y="4" width="5" height="11" rx="1.5"/><rect x="17" y="4" width="4" height="7" rx="1.5"/>',
    cal: '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/>',
    users: '<circle cx="9" cy="8" r="3.5"/><path d="M2 20c1-3.5 3.8-5.5 7-5.500s6 2 7 5.500M16 4.500a3.5 3.5 0 0 1 0 7M18 14.500c2 .6 3.4 2.4 4 5.5"/>',
    card: '<rect x="3" y="6" width="18" height="13" rx="2"/><path d="M3 10h18"/>',
    dots: '<circle cx="5" cy="12" r="1.6"/><circle cx="12" cy="12" r="1.6"/><circle cx="19" cy="12" r="1.6"/>', close: '<path d="M6 6l12 12M18 6L6 18"/>'
  };
  var svg = function (k, s) { return '<svg width="' + (s || 22) + '" height="' + (s || 22) + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + I[k] + '</svg>'; };
  var TABS = [['box', 'Orders', 30, 'orders'], ['cal', 'Calendar', 49, 'cal'], ['users', 'Customers', 55, 'cust'], ['card', 'Money', 42, 'money']];
  var onAny = TABS.some(function (t) { return inSec(t[3]); });
  var twin = (dark ? 'GL' : 'G') + page.replace(/^GL?/, '');
  var item = function (u, t, on) { return '<a href="' + u + '"' + (on ? ' class="on" aria-current="page"' : '') + '>' + t + '</a>'; };
  var moreHtml = '<div class="an-sg">Studio</div>' + item(EDITOR, 'Live editor', false).replace('<a ', '<a data-keep ') + item('/book/editor.html?as=studio&view=gallery', 'Customer photo gallery', false).replace('<a ', '<a data-keep ') + item(href(57), 'Insights', cur === 57) + item(href(54), 'Reports', cur === 54) + item(href(46), 'Settings', cur === 46) +
    '<div class="an-sg">Team</div>' + item(href(71), 'Team &amp; permissions', cur === 71) + item(href(76), 'Invoices', cur === 76) + item(href(132), 'Privacy &amp; data', cur === 132) +
    '<div class="an-sg">Elsewhere</div>' + item(ed + '140-SiteMap.dc.html', 'All pages', false) + item(ed + '70-Editor.dc.html', 'Classic editor', false).replace('<a ', '<a data-keep ') + item(twin, dark ? 'Light theme' : 'Dark theme', false) + item(href(48), 'Sign out', false);
  var root = document.createElement('div');
  root.className = 'an-m an-st';
  root.innerHTML = '<nav class="an-tabs" aria-label="Studio sections">' +
    TABS.map(function (t) { var on = inSec(t[3]); return '<a href="' + href(t[2]) + '"' + (on ? ' class="on" aria-current="page"' : '') + '>' + svg(t[0]) + '<span>' + t[1] + '</span></a>'; }).join('') +
    '<button type="button" class="an-more' + (onAny ? '' : ' on') + '" aria-haspopup="dialog">' + svg('dots') + '<span>More</span></button></nav>' +
    '<div class="an-scrim" hidden></div><div class="an-sheet" role="dialog" aria-modal="true" aria-label="More" hidden><div class="an-sh"><b>More</b><button type="button" class="an-x" aria-label="Close">' + svg('close', 18) + '</button></div><div class="an-sl">' + moreHtml + '</div></div>';
  var sheet, scrim, last;
  var open = function () { last = document.activeElement; sheet.hidden = scrim.hidden = false; requestAnimationFrame(function () { document.body.classList.add('an-sheet-on'); }); sheet.querySelector('.an-x').focus(); };
  var close = function () { document.body.classList.remove('an-sheet-on'); setTimeout(function () { sheet.hidden = scrim.hidden = true; }, 260); if (last && last.focus) last.focus(); };
  var go = function () {
    document.body.appendChild(root);
    sheet = root.querySelector('.an-sheet'); scrim = root.querySelector('.an-scrim');
    document.body.classList.add('an-m-on', 'an-tabs-on', 'an-studio');
    if (ed === 'GL') document.body.classList.add('an-light');
    root.addEventListener('click', function (e) {
      if (e.target.closest('.an-more')) open();
      else if (e.target.closest('.an-x') || e.target === scrim) close();
    });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && !sheet.hidden) close(); });
  };
  if (document.body) go(); else document.addEventListener('DOMContentLoaded', go);
})();
