/* Miles Retold · storefront header on phones and small tablets (below 980px).
   The bar keeps what matters: logo, the "Start a book" button and the menu button.
   Language, dark mode and the cart move into the open menu. (No bottom bar on the storefront: see account-nav.js.) */
(function () {
  'use strict';
  var css = '@layer g{@media (max-width:980px){' +
    '.nv2 .nva>.nst{display:inline-flex!important;align-items:center;justify-content:center;min-height:44px;padding:0 16px;font-size:14px;white-space:nowrap}' +
    '.nv2 .nva>.thm,.nv2 .nva>.cart{display:none!important}' +
    '.nv2 .nva{gap:8px}' +
    '.mqk{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin:14px 0 6px}' +
    '.mqk a,.mqk button{position:relative;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:6px;min-height:72px;padding:10px 6px;border:0;border-radius:16px;background:rgb(from currentColor r g b / .07);box-shadow:inset 0 0 0 1px rgb(from currentColor r g b / .14);color:inherit;font:600 13px/1.2 inherit;text-decoration:none;cursor:pointer}' +
    '.mqk svg{width:22px;height:22px}.mqk b{position:absolute;inset-block-start:8px;inset-inline-end:calc(50% - 22px);min-width:18px;height:18px;padding:0 5px;border-radius:9px;background:var(--rust,#b5541f);color:#fff;font-size:11px;display:grid;place-items:center}' +
    '}@media (min-width:981px){.mqk{display:none}}}';
  var st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);

  var I = {
    globe: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c3 3 3 15 0 18M12 3c-3 3-3 15 0 18"/>',
    moon: '<path d="M20 14.5A8.5 8.5 0 0 1 9.5 4a8.5 8.5 0 1 0 10.5 10.5z"/>',
    sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2.5v2M12 19.5v2M4.6 4.6L6 6M18 18l1.4 1.4M2.5 12h2M19.5 12h2M4.6 19.4L6 18M18 6l1.4-1.4"/>',
    bag: '<path d="M5 8h14l-1.2 11.2a2 2 0 0 1-2 1.8H8.2a2 2 0 0 1-2-1.8z"/><path d="M9 8V6a3 3 0 0 1 6 0v2"/>'
  };
  var svg = function (k) { return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + I[k] + '</svg>'; };

  /* the big button at the bottom of the open menu is Sign in (My account when signed in); the header already has Start a book */
  function bigButton(mnu) {
    var b = mnu.querySelector(':scope > a.btn'), row = mnu.querySelector('nav a[href$="8-SignIn.dc.html"], nav a[href$="9-Account.dc.html"]');
    if (!b) return;
    var inn = false; try { inn = localStorage.getItem('miles.auth') === 'in'; } catch (e) {}
    var ed = /\/G\d/.test(location.pathname) ? 'G' : 'GL', label = inn ? 'My account' : 'Sign in', href = ed + (inn ? '9-Account' : '8-SignIn') + '.dc.html';
    if (b.getAttribute('href') !== href) b.setAttribute('href', href);
    var t = Array.prototype.filter.call(b.childNodes, function (c) { return c.nodeType === 3 && c.textContent.trim(); })[0];
    if (t && t.textContent.trim() !== label) t.textContent = label + ' ';
    if (row) row.style.display = 'none';
  }
  function fill() {
    var mnu = document.querySelector('.nv2 .mnu');
    if (mnu) bigButton(mnu);
    if (!mnu || mnu.querySelector('.mqk')) return;
    var nav = mnu.querySelector('nav'), thm = document.querySelector('.nv2 .nva a.thm'), cart = document.querySelector('.nv2 .nva a.cart'), lang = document.querySelector('.nv2 .nva [data-lang-toggle]');
    if (!nav) return;
    var row = document.createElement('div'); row.className = 'mqk'; row.setAttribute('role', 'group'); row.setAttribute('aria-label', 'Language, theme and cart');
    var count = cart && cart.querySelector('b') ? cart.querySelector('b').textContent.trim() : '';
    var dark = thm && /dark/i.test(thm.getAttribute('aria-label') || '');
    var ar = lang && /EN/.test(lang.textContent);
    row.innerHTML =
      '<button type="button" data-no-i18n data-mq="lang">' + svg('globe') + '<span>' + (ar ? 'English' : 'العربية') + '</span></button>' +
      (thm ? '<a href="' + thm.getAttribute('href') + '">' + svg(dark ? 'moon' : 'sun') + '<span>' + (dark ? 'Dark mode' : 'Light mode') + '</span></a>' : '') +
      (cart ? '<a href="' + cart.getAttribute('href') + '" aria-label="Cart, ' + (count || 0) + ' items">' + svg('bag') + (count && count !== '0' ? '<b aria-hidden="true">' + count + '</b>' : '') + '<span>Cart</span></a>' : '');
    nav.parentNode.insertBefore(row, nav.nextSibling);
    var lb = row.querySelector('[data-mq="lang"]');
    if (lb) lb.addEventListener('click', function () { var real = document.querySelector('.nv2 .nva [data-lang-toggle]'); if (real) real.click(); });
  }
  var go = function () {
    fill();
    if (window.MutationObserver) new MutationObserver(function () { fill(); }).observe(document.body, { childList: true, subtree: true });
  };
  if (document.body) go(); else document.addEventListener('DOMContentLoaded', go);
})();
