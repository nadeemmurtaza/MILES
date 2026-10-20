/* Miles Retold · the one 3D book (css/book3d.css). Two ways in:
     MilesBook3D.el({ ratio, pages, cover, ink, spine, title, sub, img, width, hero }) returns a book element;
     any <div class="b3" data-b3 data-title=".." data-sub=".." data-img=".."> on a page is filled in the same way and kept in sync
     when those attributes change (the storefront pages bind them to their state). Colours and size go on the element as --cv, --ci, --sp, --bw, --ratio, --pg. */
(function () {
  'use strict';
  var PARTS = ['b3-k', 'b3-et b3-e b3-edge', 'b3-eb b3-e b3-edge', 'b3-er b3-e b3-edge', 'b3-pr', 'b3-pt', 'b3-pb', 'b3-sp', 'b3-ft b3-e b3-edge', 'b3-fb b3-e b3-edge', 'b3-fr b3-e b3-edge'];
  function mk(cls, tag) { var e = document.createElement(tag || 'div'); e.className = cls; return e; }
  function fill(root) {
    var inner = root.querySelector(':scope > .b3-in');
    if (!inner) { inner = mk('b3-in'); inner.setAttribute('aria-hidden', 'true'); PARTS.forEach(function (c) { inner.appendChild(mk(c)); }); var f = mk('b3-f'); f.appendChild(mk('b3-ph')); f.appendChild(mk('b3-t')); f.appendChild(mk('b3-s')); inner.appendChild(f); inner.querySelector('.b3-sp').appendChild(mk('', 'i')); root.textContent = ''; root.appendChild(inner); }
    var d = root.dataset, ph = inner.querySelector('.b3-ph'), t = inner.querySelector('.b3-t'), s = inner.querySelector('.b3-s'), sp = inner.querySelector('.b3-sp i');
    if (t.textContent !== (d.title || '')) t.textContent = d.title || '';
    if (s.textContent !== (d.sub || '')) s.textContent = d.sub || '';
    if (sp.textContent !== (d.title || '')) sp.textContent = d.title || '';
    var src = d.img || '', im = ph.querySelector('img');
    if (!src) { if (im) im.remove(); } else if (!im || im.getAttribute('src') !== src) { if (im) im.remove(); im = document.createElement('img'); im.alt = ''; im.addEventListener('error', function () { im.remove(); }, { once: true }); im.src = src; ph.appendChild(im); }
  }
  function mount(root) {
    if (root.__b3) return; root.__b3 = true; fill(root);
    if (window.MutationObserver) new MutationObserver(function () { fill(root); }).observe(root, { attributes: true, childList: true });
  }
  function el(o) {
    o = o || {}; var r = mk('b3' + (o.hero ? ' b3-hero' : '')), st = r.style;
    r.setAttribute('role', 'img'); r.setAttribute('aria-label', o['aria-label'] || 'Your book');
    if (o.ratio) st.setProperty('--ratio', o.ratio); if (o.pages) st.setProperty('--pg', o.pages); if (o.width) st.setProperty('--bw', o.width + 'px');
    if (o.cover) st.setProperty('--cv', o.cover); if (o.ink) st.setProperty('--ci', o.ink); if (o.spine) st.setProperty('--sp', o.spine);
    ['--ry', '--rx', '--rz'].forEach(function (k, i) { var v = [o.ry, o.rx, o.rz][i]; if (v != null) st.setProperty(k, v + 'deg'); });
    r.dataset.title = o.title || ''; r.dataset.sub = o.sub || ''; r.dataset.img = o.img || ''; mount(r); return r;
  }
  function scan() { [].forEach.call(document.querySelectorAll('.b3[data-b3]'), mount); }
  window.MilesBook3D = { el: el, mount: mount, scan: scan };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', scan); else scan();
  if (window.MutationObserver) new MutationObserver(scan).observe(document.documentElement, { childList: true, subtree: true });
})();
