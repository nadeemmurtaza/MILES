/* Adaptive pointer: a dot and a ring that show the page behind them inverted and desaturated, so the pointer is dark over light
   surfaces and light over dark ones (ivory, sand, charcoal, wine, photos) without any per-section colour list. Pure CSS does the inversion
   (backdrop-filter, see site.css .px-*); this script only moves the two elements and marks interactive / text targets.
   Fine pointers only (mouse, trackpad): touch screens keep their normal behaviour. The system cursor comes back over text fields,
   in forced-colors mode, and whenever this script does not run. */
(function () {
  'use strict';
  var mm = window.matchMedia;
  if (!mm || !mm('(hover:hover) and (pointer:fine)').matches || mm('(forced-colors:active)').matches) return;
  var de = document.documentElement;
  var reduce = mm('(prefers-reduced-motion:reduce)').matches;
  var HOT = 'a[href],button,summary,label,select,[role=button],[role=tab],[role=switch],[role=radio],[role=checkbox],input[type=checkbox],input[type=radio],input[type=submit],input[type=button],[onclick]';
  var TEXT = 'input:not([type=checkbox]):not([type=radio]):not([type=button]):not([type=submit]):not([type=range]):not([type=color]),textarea,[contenteditable=""],[contenteditable="true"]';
  var dot, ring, x = -100, y = -100, rx = -100, ry = -100, shown = false, raf = 0;

  function make(cls) { var d = document.createElement('div'); d.className = cls; d.setAttribute('aria-hidden', 'true'); return d; }
  function frame() {
    raf = 0;
    dot.style.transform = 'translate3d(' + x + 'px,' + y + 'px,0)';
    var k = reduce ? 1 : 0.22;
    rx += (x - rx) * k; ry += (y - ry) * k;
    ring.style.transform = 'translate3d(' + rx.toFixed(1) + 'px,' + ry.toFixed(1) + 'px,0)';
    if (Math.abs(x - rx) > 0.15 || Math.abs(y - ry) > 0.15) raf = requestAnimationFrame(frame);
  }
  function kick() { if (!raf) raf = requestAnimationFrame(frame); }
  function show(on) { if (shown === on) return; shown = on; de.classList.toggle('px-show', on); }
  function onMove(e) {
    if (e.pointerType && e.pointerType !== 'mouse') return;
    x = e.clientX; y = e.clientY;
    if (!shown) { rx = x; ry = y; }
    var t = e.target, el = t && t.closest ? t : null;
    var txt = !!(el && el.closest(TEXT));
    de.classList.toggle('px-hot', !txt && !!(el && el.closest(HOT)));
    de.classList.toggle('px-text', txt);
    show(true); kick();
  }
  function init() {
    if (!document.body) return;
    dot = make('px-dot'); ring = make('px-ring');
    document.body.appendChild(ring); document.body.appendChild(dot);
    de.classList.add('px-on');
    document.addEventListener('pointermove', onMove, { passive: true });
    document.addEventListener('pointerdown', function (e) { if (!e.pointerType || e.pointerType === 'mouse') de.classList.add('px-down'); }, { passive: true });
    document.addEventListener('pointerup', function () { de.classList.remove('px-down'); }, { passive: true });
    document.documentElement.addEventListener('mouseleave', function () { show(false); });
    window.addEventListener('blur', function () { show(false); });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
