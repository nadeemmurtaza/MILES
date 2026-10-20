/* Miles Retold · the one 3D book (css/book3d.css). Two ways in:
     MilesBook3D.el({ ratio, pages, cover, ink, spine, title, sub, img, width, hero, scroll }) returns a book element;
     any <div class="b3" data-b3 data-title=".." data-sub=".." data-img=".."> on a page is filled in the same way and kept in sync
     when those attributes change (the storefront pages bind them to their state). Colours and size go on the element as --cv, --ci, --sp, --bw, --ratio, --pg.
   Opening: data-open="0..1" sets how far the book is open; data-scroll-open opens it as it scrolls into view, and
   data-scroll-open="page" opens it with how far the page is scrolled (for a book that stays in place). */
(function () {
  'use strict';
  var RM = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  function mk(cls, tag) { var e = document.createElement(tag || 'div'); e.className = cls || ''; return e; }
  function layers(pg) { return Math.max(8, Math.min(36, Math.round((pg || 40) * 0.45))); }
  function build(root, lay) {
    var sr = root.shadowRoot, inner = mk('b3-in'); inner.setAttribute('aria-hidden', 'true');
    while (sr.firstChild) sr.removeChild(sr.firstChild);
    var hide = document.createElement('style'); hide.textContent = ':host{visibility:hidden}'; sr.appendChild(hide);
    var link = document.createElement('link'); link.rel = 'stylesheet'; link.href = '/css/book3d.css'; sr.appendChild(link);
    sr.appendChild(mk('b3-sh')); sr.appendChild(inner);
    inner.appendChild(mk('b3-k'));
    for (var j = 0; j < 3; j++) { var bl = mk('b3-bl'); bl.style.setProperty('--j', j); inner.appendChild(bl); }
    for (var i = 0; i < lay; i++) { var p = mk('b3-pg' + (i === lay - 1 ? ' b3-last' : '')); p.style.setProperty('--i', i); inner.appendChild(p); }
    var p1 = mk('b3-p1'); p1.appendChild(mk('b3-pimg-w')); inner.appendChild(p1);
    for (var n = 0; n < 4; n++) { var lf = mk('b3-lf'); lf.style.setProperty('--n', n); var fa = mk(''), fb = mk(''); fa.appendChild(mk('b3-pimg-w b3-lfa ' + (n % 2 ? 'b3-land' : 'b3-port'))); if (n === 3) { var tx = mk('b3-ltxt'); tx.appendChild(mk('', 'b')); tx.appendChild(mk('', 'i')); tx.appendChild(mk('', 'small')); fb.appendChild(tx); } else fb.appendChild(mk('b3-pimg-w b3-lfb ' + (n % 2 ? 'b3-port' : 'b3-land'))); lf.appendChild(fa); lf.appendChild(fb); inner.appendChild(lf); }
    var door = mk('b3-door');
    for (var k = 0; k < 4; k++) { var dl = mk('b3-dl'); dl.style.setProperty('--j', k); door.appendChild(dl); }
    door.appendChild(mk('b3-ep'));
    var f = mk('b3-f'); f.appendChild(mk('b3-ph')); f.appendChild(mk('b3-t')); f.appendChild(mk('b3-s')); door.appendChild(f);
    inner.appendChild(door);
    var sp = mk('b3-sp'); sp.appendChild(mk('', 'i')); inner.appendChild(sp);
    root.__lay = lay;
  }
  function fill(root) {
    var pg = parseFloat(getComputedStyle(root).getPropertyValue('--pg')) || 40, lay = layers(pg);
    var sr0 = root.shadowRoot; if (!sr0.querySelector('.b3-in') || root.__lay !== lay) { build(root, lay); root.style.setProperty('--lay', lay); }
    var d = root.dataset, inner = root.shadowRoot.querySelector('.b3-in');
    var set = function (sel, v) { var e = inner.querySelector(sel); if (e && e.textContent !== v) e.textContent = v; };
    set('.b3-t', d.title || ''); set('.b3-s', d.sub || ''); set('.b3-sp i', d.title || ''); set('.b3-ltxt b', d.title || ''); set('.b3-ltxt small', d.sub || '');
    var photo = function (host, url) { if (!host) return; var im = host.querySelector('img'); if (!url) { if (im) im.remove(); return; } if (!im || im.getAttribute('src') !== url) { if (im) im.remove(); im = document.createElement('img'); im.alt = ''; im.addEventListener('error', function () { im.remove(); }, { once: true }); im.src = url; host.appendChild(im); } };
    var pool = (d.photos ? d.photos.split('|') : []).filter(Boolean); if (!pool.length) pool = [d.p1, d.p0, d.img].filter(Boolean);
    var pick = function (i) { return pool.length ? pool[i % pool.length] : ''; };
    photo(inner.querySelector('.b3-p1 .b3-pimg-w'), pick(0));
    [].forEach.call(inner.querySelectorAll('.b3-lf'), function (lf, n) { photo(lf.children[0].firstChild, pick(2 * n + 1)); if (n !== 3) photo(lf.children[1].firstChild, pick(2 * n + 2)); });
    var ph = inner.querySelector('.b3-ph'), src = d.img || '', im = ph.querySelector('img');
    if (!src) { if (im) im.remove(); } else if (!im || im.getAttribute('src') !== src) { if (im) im.remove(); im = document.createElement('img'); im.alt = ''; im.addEventListener('error', function () { im.remove(); }, { once: true }); im.src = src; ph.appendChild(im); }
    if (d.open != null && d.open !== '') root.style.setProperty('--o', String(Math.max(0, Math.min(1, +d.open || 0))));
  }
  var live = [], ticking = false;
  function clamp(x) { return Math.max(0, Math.min(1, x)); }
  function update() {
    ticking = false; var vh = window.innerHeight || 800;
    live.forEach(function (root) {
      if (!root.isConnected) return;
      var o;
      if (root.dataset.scrollOpen === 'page') { var h = document.documentElement.scrollHeight - vh; o = h > 60 ? clamp(window.pageYOffset / Math.min(h, 520)) : 0; }
      else { var r = root.getBoundingClientRect(); o = clamp((vh * 0.92 - r.top) / (vh * 0.62)); }   /* closed as it enters, open once it is well in view */
      if (RM) o = 0;
      var cur = +root.style.getPropertyValue('--o') || 0; if (Math.abs(cur - o) > 0.002) root.style.setProperty('--o', o.toFixed(3));
    });
  }
  function onScroll() { if (!ticking) { ticking = true; requestAnimationFrame(update); } }
  function mount(root) {
    if (root.__b3) return; root.__b3 = true; if (!root.shadowRoot) root.attachShadow({ mode: 'open' }); fill(root);
    if (root.hasAttribute('data-scroll-open')) { root.classList.add('b3-live'); live.push(root); onScroll(); }
    var sig = function () { var d = root.dataset; return [root.style.getPropertyValue('--pg'), d.title, d.sub, d.img, d.p0, d.p1, d.photos, d.open, root.shadowRoot && root.shadowRoot.querySelector('.b3-in') ? 1 : 0].join('|'); }, last = sig();
    if (window.MutationObserver) new MutationObserver(function () { var n = sig(); if (n !== last) { last = n; fill(root); last = sig(); } }).observe(root, { attributes: true, attributeFilter: ['data-title', 'data-sub', 'data-img', 'data-p0', 'data-p1', 'data-photos', 'data-open', 'style'], childList: false });
  }
  function el(o) {
    o = o || {}; var r = mk('b3' + (o.hero ? ' b3-hero' : '')), st = r.style;
    r.setAttribute('role', 'img'); r.setAttribute('aria-label', o['aria-label'] || 'Your book');
    if (o.ratio) st.setProperty('--ratio', o.ratio); if (o.pages) st.setProperty('--pg', o.pages); if (o.width) st.setProperty('--bw', o.width + 'px');
    if (o.cover) st.setProperty('--cv', o.cover); if (o.ink) st.setProperty('--ci', o.ink); if (o.spine) st.setProperty('--sp', o.spine);
    ['--ry', '--rx', '--rz'].forEach(function (k, i) { var v = [o.ry, o.rx, o.rz][i]; if (v != null) st.setProperty(k, v + 'deg'); });
    r.dataset.title = o.title || ''; r.dataset.sub = o.sub || ''; r.dataset.img = o.img || ''; if (o.p0) r.dataset.p0 = o.p0; if (o.p1) r.dataset.p1 = o.p1; if (o.photos && o.photos.length) r.dataset.photos = o.photos.join('|');
    if (o.scroll) r.setAttribute('data-scroll-open', o.scroll === true ? '' : o.scroll);
    if (o.open != null) r.dataset.open = o.open;
    mount(r); return r;
  }
  function scan() { [].forEach.call(document.querySelectorAll('.b3[data-b3]'), mount); }
  window.MilesBook3D = { el: el, mount: mount, scan: scan };
  window.addEventListener('scroll', onScroll, { passive: true }); window.addEventListener('resize', onScroll);
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', scan); else scan();
  if (window.MutationObserver) new MutationObserver(scan).observe(document.documentElement, { childList: true, subtree: true });
})();
