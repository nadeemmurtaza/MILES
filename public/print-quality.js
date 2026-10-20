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
  function scan() { [].forEach.call(document.querySelectorAll('.pq-lo'), wire); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', scan); else scan();
  if (window.MutationObserver) new MutationObserver(scan).observe(document.documentElement, { childList: true, subtree: true });
})();
