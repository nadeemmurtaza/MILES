/* Miles Retold · home page print-detail loupe: a magnifier follows the pointer or finger over the photo. */
(function () {
  'use strict';
  var ZOOM = 5;
  function wire(box) {
    if (box.__pq) return; box.__pq = true;
    var img = box.querySelector('img'), lens = box.querySelector('.pq-lens'); if (!img || !lens) return;
    var set = function (x, y) {
      var r = box.getBoundingClientRect(); x = Math.max(0, Math.min(r.width, x)); y = Math.max(0, Math.min(r.height, y));
      box.style.setProperty('--lx', x + 'px'); box.style.setProperty('--ly', y + 'px');
      var lw = lens.offsetWidth;
      lens.style.backgroundImage = 'url("' + img.currentSrc + '")';
      lens.style.backgroundSize = (r.width * ZOOM) + 'px ' + (r.height * ZOOM) + 'px';
      lens.style.backgroundPosition = (lw / 2 - x * ZOOM) + 'px ' + (lw / 2 - y * ZOOM) + 'px';
    };
    var go = function (e) { var r = box.getBoundingClientRect(); set(e.clientX - r.left, e.clientY - r.top); };
    box.addEventListener('pointermove', go); box.addEventListener('pointerdown', go);
    var start = function () { var r = box.getBoundingClientRect(); set(r.width * .62, r.height * .4); };
    if (img.complete) start(); else img.addEventListener('load', start, { once: true });
    window.addEventListener('resize', start);
  }
  /* "Why a book": on desktop the photo follows the caption that is showing; on phones every caption and photo rises into view as it is scrolled to,
     and the side rail fills with how far through the section you are */
  var small = window.matchMedia && matchMedia('(max-width: 900px)');
  function why() {
    var sec = document.querySelector('section.pin[data-key="o"]'); if (!sec) return;
    var pqs = sec.querySelector('.pqs');
    if (!small.matches) {
      var caps = [].slice.call(sec.querySelectorAll('.cx'));
      if (pqs && !sec.__obs && window.MutationObserver) {
        var sync = function () { var i = caps.findIndex(function (c) { return c.classList.contains('on'); }); if (i > -1 && pqs.getAttribute('data-i') !== String(i)) pqs.setAttribute('data-i', String(i)); };
        sec.__obs = new MutationObserver(sync); sec.__obs.observe(sec, { subtree: true, attributes: true, attributeFilter: ['class'] }); sync();
      }
      document.documentElement.classList.remove('pq-js'); return;
    }
    document.documentElement.classList.add('pq-js');
    if (sec.__io) return;
    var io = 'IntersectionObserver' in window ? new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) { e.target.setAttribute('data-pq-in', ''); io.unobserve(e.target); } }); }, { threshold: 0.2 }) : null;
    [].forEach.call(sec.querySelectorAll('.cx, .pqs .pq-photo'), function (el) { if (io) io.observe(el); else el.setAttribute('data-pq-in', ''); });
    sec.__io = io;
    var rail = function () { var r = sec.getBoundingClientRect(), vh = window.innerHeight; var p = Math.max(0, Math.min(1, (vh * 0.8 - r.top) / (r.height + vh * 0.2))); sec.style.setProperty('--po', p.toFixed(3)); };
    window.addEventListener('scroll', rail, { passive: true }); rail();
  }
  function scan() { [].forEach.call(document.querySelectorAll('.pq-lo'), wire); why(); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', scan); else scan();
  if (window.MutationObserver) new MutationObserver(scan).observe(document.documentElement, { childList: true, subtree: true });
})();
