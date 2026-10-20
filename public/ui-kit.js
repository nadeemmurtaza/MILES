/* Miles Retold · shared UI helpers: MilesUI.confirm() and MilesUI.toast(). Pair with /css/ui-kit.css.
   - confirm: native <dialog> (focus trapped, Esc closes, focus returns), resolves true/false; use before anything that cannot be undone.
   - toast: one polite live region, auto-dismisses after 4s (6s for errors), pauses while hovered or focused, never blocks.
   - [data-confirm="Question?"] on a button or link asks first; add data-confirm-body for the detail and data-danger for a red button. */
(function () {
  'use strict';
  var m = location.pathname.match(/\/(GL?)\d/);
  document.documentElement.dataset.mui = m && m[1] === 'GL' ? 'light' : (m ? 'dark' : (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'));
  var el = function (t, c, x) { var e = document.createElement(t); if (c) e.className = c; if (x != null) e.textContent = x; return e; };
  var reduce = function () { return matchMedia('(prefers-reduced-motion: reduce)').matches; };

  function confirmBox(o) {
    o = typeof o === 'string' ? { title: o } : (o || {});
    return new Promise(function (resolve) {
      var last = document.activeElement, d = el('dialog', 'mui-dlg'), id = 'mui-' + Math.random().toString(36).slice(2, 8);
      d.setAttribute('aria-labelledby', id + 't'); if (o.body) d.setAttribute('aria-describedby', id + 'b');
      var h = el('h2', '', o.title || 'Are you sure?'); h.id = id + 't'; d.appendChild(h);
      if (o.body) { var p = el('p', '', o.body); p.id = id + 'b'; d.appendChild(p); }
      var act = el('div', 'mui-act'), no = el('button', 'mui-btn', o.cancelLabel || 'Cancel'), yes = el('button', 'mui-btn ' + (o.danger ? 'danger' : 'pri'), o.confirmLabel || 'Confirm');
      no.type = yes.type = 'button'; act.appendChild(no); act.appendChild(yes); d.appendChild(act);
      var done = function (v) { if (d.open) d.close(); d.remove(); if (last && last.focus && document.contains(last)) last.focus(); resolve(v); };
      yes.onclick = function () { done(true); }; no.onclick = function () { done(false); };
      d.addEventListener('cancel', function (e) { e.preventDefault(); done(false); });
      d.addEventListener('click', function (e) { if (e.target === d) done(false); });
      document.body.appendChild(d);
      if (d.showModal) d.showModal(); else d.setAttribute('open', '');
      (o.danger ? no : yes).focus();   /* a destructive question starts on the safe answer */
    });
  }

  var stack;
  function toast(msg, o) {
    o = o || {};
    if (!stack) { stack = el('div', 'mui-toasts'); stack.setAttribute('role', 'status'); stack.setAttribute('aria-live', 'polite'); stack.setAttribute('aria-atomic', 'false'); document.body.appendChild(stack); }
    var t = el('div', 'mui-toast ' + (o.kind || ''), ''), s = el('span', '', msg); t.appendChild(s);
    if (o.kind === 'bad') t.setAttribute('role', 'alert');
    var x = el('button', '', o.action || 'Dismiss'); x.type = 'button'; t.appendChild(x);
    var timer, left = o.ms || (o.kind === 'bad' ? 6000 : 4000), started;
    var kill = function () { clearTimeout(timer); t.remove(); };
    var run = function () { started = Date.now(); timer = setTimeout(kill, left); };
    var pause = function () { clearTimeout(timer); left -= Date.now() - started; if (left < 1200) left = 1200; };
    t.addEventListener('mouseenter', pause); t.addEventListener('mouseleave', run); t.addEventListener('focusin', pause); t.addEventListener('focusout', run);
    x.onclick = function () { if (o.onAction) o.onAction(); kill(); };
    stack.appendChild(t); while (stack.children.length > 3) stack.firstChild.remove();
    run();
    return kill;
  }

  /* ask first: <button data-confirm="Remove this book?" data-confirm-body="..." data-danger> */
  document.addEventListener('click', function (e) {
    var a = e.target.closest ? e.target.closest('[data-confirm]') : null;
    if (!a || a.__ok) return;
    e.preventDefault(); e.stopImmediatePropagation();
    confirmBox({ title: a.getAttribute('data-confirm'), body: a.getAttribute('data-confirm-body') || '', danger: a.hasAttribute('data-danger'), confirmLabel: a.getAttribute('data-confirm-label') || (a.hasAttribute('data-danger') ? 'Yes, remove' : 'Confirm') }).then(function (ok) { if (!ok) return; a.__ok = true; a.click(); a.__ok = false; });
  }, true);


  /* ---- site-wide basics from the UX audit: skip link, main landmark, live region, autocomplete ---- */
  var AUTO = [[/e-?mail/i, 'email'], [/phone|mobile|tel\b|whatsapp/i, 'tel'], [/first.?name|given/i, 'given-name'], [/last.?name|family|surname/i, 'family-name'], [/full.?name|your name|^name$/i, 'name'], [/postal|zip|post.?code/i, 'postal-code'], [/city|town/i, 'address-level2'], [/street|address/i, 'street-address'], [/one.?time|otp|code/i, 'one-time-code']];
  function basics() {
    if (!document.body) return;
    if (!stack) { stack = el('div', 'mui-toasts'); stack.setAttribute('role', 'status'); stack.setAttribute('aria-live', 'polite'); stack.setAttribute('aria-atomic', 'false'); document.body.appendChild(stack); }
    var main = document.querySelector('main,[role="main"]');
    if (!main) {   /* studio pages: the block that holds the page heading is the main content */
      var h = document.querySelector('h1'), gs = document.querySelector('.gs');
      var c = h && gs ? h.closest('.gs > *') : null;
      if (c && !/^(ASIDE|NAV|HEADER|INPUT)$/.test(c.tagName)) { c.setAttribute('role', 'main'); main = c; }
    }
    if (main && !document.getElementById('main')) { main.id = 'main'; }
    if (main && !main.hasAttribute('tabindex')) main.setAttribute('tabindex', '-1');
    if (main && !document.querySelector('a.skip,a.mui-skip,a[href="#main"]')) {
      var a = el('a', 'mui-skip', 'Skip to content'); a.href = '#main';
      a.addEventListener('click', function (e) { var t = document.getElementById('main'); if (t) { e.preventDefault(); t.focus(); t.scrollIntoView({ block: 'start' }); } });
      document.body.insertBefore(a, document.body.firstChild);
    }
    document.querySelectorAll('input:not([autocomplete]):not([type="checkbox"]):not([type="radio"]):not([type="hidden"]),textarea:not([autocomplete])').forEach(function (i) {
      var k = (i.name || '') + ' ' + (i.id || '') + ' ' + (i.placeholder || '') + ' ' + (i.getAttribute('aria-label') || '');
      if (i.type === 'email') return i.setAttribute('autocomplete', 'email');
      if (i.type === 'tel') return i.setAttribute('autocomplete', 'tel');
      for (var n = 0; n < AUTO.length; n++) if (AUTO[n][0].test(k)) { i.setAttribute('autocomplete', AUTO[n][1]); if (AUTO[n][1] === 'email' && i.type === 'text') i.type = 'email'; break; }
    });
  }
  /* icon-only buttons get a tooltip from their accessible name (hover and keyboard focus; touch keeps the name for screen readers) */
  function tips() {
    document.querySelectorAll('button[aria-label]:not([data-tip]):not([title]),a[aria-label]:not([data-tip]):not([title])').forEach(function (b) {
      if ((b.textContent || '').trim().length || b.closest('.an-tabs,.an-rail,.an-sheet,.mui-toast,.nav')) return;
      b.setAttribute('data-tip', b.getAttribute('aria-label'));
    });
  }
  /* one live editor for everyone: every link to the old customer canvas (23) or studio canvas (70) opens the new editor instead.
     Pages that belong to the classic editor, and links marked data-keep, stay as they are. */
  function reroute() {
    var m = location.pathname.match(/GL?(\d+)-/), n = m ? +m[1] : 0;
    if (n !== 3) document.querySelectorAll('a[href]').forEach(function (a) { if (/(^|\/)GL?3-Builder\.dc\.html(#.*)?$/.test(a.getAttribute('href') || '')) a.setAttribute('href', '/book/editor.html?as=customer&start=new'); });   /* Start a book opens the live editor */
    if (n === 23 || n === 70 || (n >= 80 && n <= 104) || (n >= 110 && n <= 114)) return;
    document.querySelectorAll('a[href]:not([data-keep])').forEach(function (a) {
      var h = a.getAttribute('href') || '';
      if (/(^|\/)GL?23-Editor\.dc\.html(#.*)?$/.test(h)) a.setAttribute('href', '/book/editor.html?as=customer');
      else if (/(^|\/)GL?70-Editor\.dc\.html(#.*)?$/.test(h)) a.setAttribute('href', '/book/editor.html?as=studio');
    });
  }
/* the footer of every page gets an "All pages" link, next to "Design audit" */
  function footerLink() {
    var a = document.querySelector('.ft a[href$="0-Audit.dc.html"], footer a[href$="0-Audit.dc.html"]');
    if (!a || document.querySelector('.ft a[data-allpages], footer a[data-allpages]')) return;
    var m = (a.getAttribute('href') || '').match(/(GL?)0-Audit\.dc\.html$/); if (!m) return;
    var n = a.cloneNode(true); n.setAttribute('href', m[1] + '140-SiteMap.dc.html'); n.setAttribute('data-allpages', ''); n.removeAttribute('aria-current');
    var t = n.querySelector('span') || n; if (t.firstChild && t.firstChild.nodeType === 3) t.firstChild.textContent = 'All pages'; else t.textContent = 'All pages';
    a.parentNode.insertBefore(n, a.nextSibling);
  }
  function studioLink() {   /* the studio has no footer: its second sidebar gets the link */
    var s = document.querySelector('nav.sub2'); if (!s || s.querySelector('a[data-allpages]')) return;
    var m = location.pathname.match(/\/(GL?)\d+-/); if (!m) return;
    var a = document.createElement('a'); a.href = m[1] + '140-SiteMap.dc.html'; a.textContent = 'All pages'; a.setAttribute('data-allpages', ''); s.appendChild(a);
  }
  /* prototype sign-in state: the sign-in page means signed out; pressing its buttons signs in. Private bars key off this. */
  function auth() {
    var set = function (v) { try { localStorage.setItem('miles.auth', v); } catch (e) {} };
    var get = function () { try { return localStorage.getItem('miles.auth'); } catch (e) { return null; } };
    if (/\/GL?8-SignIn\.dc\.html$/.test(location.pathname)) {
      set('out');
      document.addEventListener('click', function (e) { var t = e.target.closest && e.target.closest('main button, main a[href*="9-Account"], form button'); if (t) set('in'); }, true);
      document.addEventListener('submit', function () { set('in'); }, true);
      /* a visitor sent here from the book start goes back there once signed in */
      var back = function () { var nx = null; try { nx = localStorage.getItem('miles.next'); } catch (e) {} if (!nx) return; document.querySelectorAll('main a[href*="9-Account"]').forEach(function (a) { a.setAttribute('href', nx); }); };
      back(); setTimeout(back, 600); setTimeout(back, 1500);
      document.addEventListener('click', function () { setTimeout(back, 50); setTimeout(back, 500); }, true);
      document.addEventListener('click', function (e) { var a = e.target.closest && e.target.closest('main a[href]'); if (a && a.getAttribute('href') === (function () { try { return localStorage.getItem('miles.next'); } catch (e2) { return null; } })()) { try { localStorage.removeItem('miles.next'); } catch (e3) {} } }, true);
    }
    if (get() === 'in') document.querySelectorAll('a[href$="8-SignIn.dc.html"]').forEach(function (a) {
      if (a.closest('.an, .an-m')) return;
      var m = (a.getAttribute('href') || '').match(/^(GL?)8-/); if (!m) return;
      a.setAttribute('href', m[1] + '9-Account.dc.html');
      var t = a.querySelector('span') || a; var n = Array.prototype.filter.call(t.childNodes, function (c) { return c.nodeType === 3 && /sign in/i.test(c.textContent); })[0];
      if (n) n.textContent = n.textContent.replace(/sign in/i, 'My account');
    });
  }
  var again = function () { basics(); auth(); tips(); reroute(); footerLink(); studioLink(); setTimeout(function () { footerLink(); studioLink(); }, 700); setTimeout(footerLink, 2200); setTimeout(auth, 900); setTimeout(reroute, 500); setTimeout(reroute, 1500); setTimeout(reroute, 3000); setTimeout(tips, 900); setTimeout(tips, 2500); setTimeout(basics, 700); setTimeout(basics, 2000); };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', again); else again();

  /* [data-toast="Message"] on any button shows a toast (data-toast-kind="good|bad") */
  document.addEventListener('click', function (e) {
    var a = e.target.closest ? e.target.closest('[data-toast]') : null;
    if (a) toast(a.getAttribute('data-toast'), { kind: a.getAttribute('data-toast-kind') || '' });
  });

  window.MilesUI = { confirm: confirmBox, toast: toast, reducedMotion: reduce };
})();
