/* Studio mobile chrome, loaded by every studio (D8-*) page - stamped by scripts/sync-studio.mjs.
 *
 * At <= 900px the desktop sidebar (`aside.rail`) is hidden by each page's own CSS, which used to leave phones with no navigation.
 * This adds:  a sticky top bar (logo -> pipeline, current page title, menu button)  and turns the page's own `.rail` into a
 * slide-in drawer (styles in studio.css). The links come from the rail itself, so there is one source of navigation.
 *
 * It works with the x-dc runtime: the rail is rendered by React a moment after DOMContentLoaded, so we wait for it
 * (MutationObserver), never move or re-parent framework nodes (the rail is styled in place), and insert our own nodes as
 * siblings in front of the runtime's root in <body>. Idempotent. Above 900px nothing is built or shown.            */
(function () {
  'use strict';
  var doc = document, html = doc.documentElement, body = doc.body;
  var mq = window.matchMedia ? window.matchMedia('(max-width:900px)') : null;
  var reduce = window.matchMedia ? window.matchMedia('(prefers-reduced-motion:reduce)') : null;
  var bar, btn, scrim, closer, lastFocus = null, closeTimer = 0;
  var MENU = 'M4 7h16M4 12h16M4 17h16', X = 'M6 6l12 12M18 6L6 18';

  function rail() { return doc.querySelector('aside.rail'); }
  function isOpen() { return body.classList.contains('st-open'); }
  function icon(d) {
    return '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="' + d + '"></path></svg>';
  }
  // "Studio · Calendar — week" -> kicker "Calendar", title "Week"; everything else: kicker "Studio", title = the page name
  function pageTitle() {
    var t = (doc.title || '').replace(/^\s*(Studio|D)\s*[·|-]\s*/, '').trim();
    if (!t) { var h = doc.querySelector('h1'); t = (h && h.textContent.trim()) || 'Studio'; }
    var kick = 'Studio', m = t.split(/\s+[—–]\s+/);
    if (m.length > 1) { kick = m[0]; t = m.slice(1).join(' — '); t = t.charAt(0).toUpperCase() + t.slice(1); }
    return { kick: kick, page: t };
  }
  function paintTitle() {
    if (!bar) return;
    var t = pageTitle();
    bar.querySelector('.st-kick').textContent = t.kick;
    bar.querySelector('.st-page').textContent = t.page;
  }
  // a swipeable strip (stage pills, calendar tabs, filters) should open scrolled to the current item
  function revealCurrent() {
    var cur = doc.querySelectorAll('.steps .on, .steps [aria-current="page"], .cnav .on, .tabs .on');
    for (var i = 0; i < cur.length; i++) {
      var el = cur[i], sc = el.parentElement;
      if (!sc || sc.scrollWidth <= sc.clientWidth + 1) continue;
      var a = el.getBoundingClientRect(), b = sc.getBoundingClientRect();
      sc.scrollLeft += (a.left - b.left) - (b.width - a.width) / 2;
    }
  }

  function build(r) {
    if (doc.querySelector('.st-bar')) return;
    // The page marks its current link with .on; make sure assistive tech and our CSS see it as the current page too.
    var on = r.querySelectorAll('.rl.on:not([aria-current])');
    for (var i = 0; i < on.length; i++) on[i].setAttribute('aria-current', 'page');

    bar = doc.createElement('header');
    bar.className = 'st-bar';
    bar.setAttribute('data-studio-menu', '');
    bar.innerHTML =
      '<a class="st-logo" href="D8-Studio.dc.html" aria-label="Miles Retold studio - pipeline"></a>' +
      '<div class="st-title"><span class="st-kick">Studio</span><span class="st-page"></span></div>' +
      '<button type="button" class="st-menu" aria-label="Menu" aria-expanded="false" aria-controls="studio-menu">' + icon(MENU) + '</button>';
    // reuse the rail's own logo mark (a copy; the original stays where the framework put it)
    var mark = r.querySelector('svg.lgm');
    var logo = bar.firstChild;
    if (mark) { var c = mark.cloneNode(true); c.setAttribute('width', '34'); c.setAttribute('height', '34'); c.setAttribute('aria-hidden', 'true'); c.setAttribute('focusable', 'false'); logo.appendChild(c); }
    else logo.textContent = 'MiLes';
    paintTitle();

    scrim = doc.createElement('div');
    scrim.className = 'st-scrim';
    scrim.setAttribute('aria-hidden', 'true');

    closer = doc.createElement('button');
    closer.type = 'button';
    closer.className = 'st-close';
    closer.setAttribute('aria-label', 'Close menu');
    closer.innerHTML = icon(X);

    var anchor = doc.getElementById('dc-root') || doc.querySelector('x-dc') || body.firstChild;
    body.insertBefore(bar, anchor);
    body.insertBefore(scrim, anchor);
    body.insertBefore(closer, anchor);

    btn = bar.querySelector('.st-menu');
    btn.addEventListener('click', function () { isOpen() ? close(true) : open(); });
    revealCurrent(); window.setTimeout(revealCurrent, 400); window.addEventListener('load', revealCurrent);
    scrim.addEventListener('click', function () { close(true); });
    closer.addEventListener('click', function () { close(true); });
    doc.addEventListener('keydown', onKey);
    // delegated, so it survives the framework re-creating the rail: tapping the link to the page you are on just closes the drawer
    doc.addEventListener('click', function (e) {
      var a = e.target.closest ? e.target.closest('aside.rail a[aria-current="page"]') : null;
      if (a && isOpen()) { e.preventDefault(); close(true); }
    });
    if (mq) {
      var change = function (e) { if (!e.matches && isOpen()) close(false, true); };
      mq.addEventListener ? mq.addEventListener('change', change) : mq.addListener(change);
    }
    // coming back via the browser's back button can restore the page with the drawer still open
    window.addEventListener('pageshow', function (e) { if (e.persisted && isOpen()) close(false, true); });
  }

  function focusables() {
    var r = rail(), out = [closer];
    if (r) { var l = r.querySelectorAll('a[href],button:not([disabled])'); for (var i = 0; i < l.length; i++) out.push(l[i]); }
    return out.filter(function (n) { return n && n.offsetParent !== null || n === closer; });
  }

  function open() {
    var r = rail();
    if (!r || !bar) return;
    window.clearTimeout(closeTimer);
    if (!r.id) r.id = 'studio-menu';
    btn.setAttribute('aria-controls', r.id);
    paintTitle();
    lastFocus = doc.activeElement && doc.activeElement !== body ? doc.activeElement : btn;
    body.classList.remove('st-closing');
    body.classList.add('st-open');
    html.classList.add('st-lock');
    btn.setAttribute('aria-expanded', 'true');
    var cur = r.querySelector('a[aria-current="page"]') || r.querySelector('a[href]');
    if (cur) { try { cur.scrollIntoView({ block: 'nearest' }); } catch (e) {} }
    var t = cur || closer;
    try { t.focus({ preventScroll: true }); } catch (e) { t.focus(); }
  }

  function close(restore, now) {
    if (!isOpen()) return;
    btn.setAttribute('aria-expanded', 'false');
    html.classList.remove('st-lock');
    body.classList.remove('st-open');
    if (!now && !(reduce && reduce.matches)) {
      body.classList.add('st-closing');
      closeTimer = window.setTimeout(function () { body.classList.remove('st-closing'); }, 200);
    }
    if (restore) {
      var f = lastFocus && doc.contains(lastFocus) ? lastFocus : btn;
      try { f.focus({ preventScroll: true }); } catch (e) { f.focus(); }
    }
    lastFocus = null;
  }

  function onKey(e) {
    if (!isOpen()) return;
    if (e.key === 'Escape' || e.key === 'Esc') { e.preventDefault(); close(true); return; }
    if (e.key !== 'Tab') return;
    var f = focusables(); if (!f.length) return;
    var first = f[0], last = f[f.length - 1], a = doc.activeElement;
    var r = rail();
    if (!(r && r.contains(a)) && a !== closer) { e.preventDefault(); first.focus(); return; }
    if (e.shiftKey && a === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && a === last) { e.preventDefault(); first.focus(); }
  }

  function tryBuild() {
    var r = rail();
    if (r && r.querySelector('a[href]')) { build(r); return true; }
    return false;
  }

  function start() {
    if (tryBuild()) return;
    if (!window.MutationObserver) return;
    // the x-dc runtime renders the page after DOMContentLoaded: wait for the rail, then stop watching
    var mo = new MutationObserver(function () { if (tryBuild()) mo.disconnect(); });
    mo.observe(body, { childList: true, subtree: true });
    // pages without a rail (the sign-in screen) never build; stop watching a few seconds after load
    var giveUp = function () { window.setTimeout(function () { mo.disconnect(); }, 4000); };
    if (doc.readyState === 'complete') giveUp(); else window.addEventListener('load', giveUp);
  }

  if (doc.readyState === 'loading') doc.addEventListener('DOMContentLoaded', start); else start();
})();
