/* One system, not separate cards: finds runs of card-like blocks that sit directly next to each other (stacked, or side by side in a row of 2-4)
   and fuses each run into one sheet - shared hairline instead of a gap, outer corners kept, inner corners squared, no per-card shadow.
   It also marks every plain light card so the page's moving light shows through it (see [data-card] / [data-mg] in site.css).
   Pure progressive enhancement: without JS the cards stay as they are. Opt out with data-nomerge on a card or its container.
   Interactive cards (buttons, links, labels, radios - e.g. option tiles and carousels) are never merged. */
(function () {
  'use strict';
  var SKIP = 'a,button,label,summary,input,select,textarea,[role=button],[role=radio],[role=tab],[role=option],[data-nomerge]';
  var TAGS = { DIV: 1, SECTION: 1, ARTICLE: 1, ASIDE: 1, FORM: 1 };
  var NOCONTAINER = '.gtrack,.rqw,.mqw,.marq,[data-nomerge],svg,.rail,.st-bar';
  var DARK = '[style*="--bg-ink"],[style*="--bg-wine"],.sf,.rail,.curtain';
  var touched = [], timer = 0, busy = false;

  function isCard(el) {
    if (!TAGS[el.tagName] || el.matches(SKIP)) return false;
    var cs = getComputedStyle(el);
    if (cs.display === 'none' || cs.position === 'absolute' || cs.position === 'fixed' || cs.visibility === 'hidden') return false;
    if (!parseFloat(cs.borderTopWidth) || !(parseFloat(cs.borderTopLeftRadius) >= 12)) return false;
    if (/^rgba\(\s*0,\s*0,\s*0,\s*0\s*\)$|^transparent$/.test(cs.backgroundColor)) return false;
    var m = cs.transform; if (m && m !== 'none') { var v = m.match(/matrix\(([^)]+)\)/); if (v) { var n = v[1].split(',').map(parseFloat); if (Math.abs(n[1]) > 0.01 || Math.abs(n[2]) > 0.01) return false; } }
    return el.offsetWidth >= 220 && el.offsetHeight >= 56;
  }
  function isLight(el) {
    var c = getComputedStyle(el).backgroundColor.match(/[\d.]+/g); if (!c) return false;
    var a = c.length > 3 ? +c[3] : 1; return a > 0.9 && (+c[0] + +c[1] + +c[2]) / 3 > 215;
  }
  function reset() {
    touched.forEach(function (e) {
      e.removeAttribute('data-mg'); e.removeAttribute('data-card');
      if (e.__mgSet) { e.style.removeProperty('margin-top'); e.style.removeProperty('margin-left'); e.__mgSet = false; }
    });
    touched = [];
  }
  function mark(e, v) { e.setAttribute('data-mg', v); touched.push(e); }
  function pull(e, prop, amount) {
    var cur = parseFloat(getComputedStyle(e)[prop]) || 0;
    e.style.setProperty(prop === 'marginTop' ? 'margin-top' : 'margin-left', (cur - amount - 1) + 'px', 'important'); e.__mgSet = true;
  }
  function scan() {
    if (busy || !document.body) return; busy = true;
    try {
      reset();
      var all = document.body.querySelectorAll('div,section,main,aside,article,form');
      var plain = [];
      for (var i = 0; i < all.length; i++) {
        var box = all[i]; if (box.closest(NOCONTAINER)) continue;
        var kids = box.children; if (kids.length < 2) continue;
        var run = [], dir = '';
        for (var k = 0; k <= kids.length; k++) {
          var c = k < kids.length ? kids[k] : null, ok = c && isCard(c);
          if (ok && run.length) {
            var p = run[run.length - 1], gv = c.offsetTop - (p.offsetTop + p.offsetHeight), gh = c.offsetLeft - (p.offsetLeft + p.offsetWidth);
            var vert = gv >= -1 && gv <= 44 && Math.abs(c.offsetLeft - p.offsetLeft) <= 2 && Math.abs(c.offsetWidth - p.offsetWidth) <= 2;
            var horz = gh >= -1 && gh <= 44 && Math.abs(c.offsetTop - p.offsetTop) <= 2 && Math.abs(c.offsetHeight - p.offsetHeight) <= 6;
            var d = vert ? 'v' : horz ? 'h' : '';
            if (d && (!dir || dir === d)) { dir = d; run.push(c); continue; }
          }
          if (run.length >= 2 && (dir === 'v' || run.length <= 4)) fuse(run, dir);
          else if (run.length === 1 && isLight(run[0])) plain.push(run[0]);
          run = ok ? [c] : []; dir = '';
        }
      }
      plain.forEach(function (e) { if (!e.closest(DARK) && isLight(e)) { e.setAttribute('data-card', ''); touched.push(e); } });
    } catch (err) { /* never break the page over styling */ }
    busy = false;
  }
  function fuse(run, dir) {
    var gaps = [];
    for (var i = 1; i < run.length; i++) gaps.push(dir === 'v' ? run[i].offsetTop - (run[i - 1].offsetTop + run[i - 1].offsetHeight) : run[i].offsetLeft - (run[i - 1].offsetLeft + run[i - 1].offsetWidth));
    run.forEach(function (e, i) { mark(e, dir + '-' + (i === 0 ? 'first' : i === run.length - 1 ? 'last' : 'mid')); if (isLight(e) && !e.closest(DARK)) e.setAttribute('data-card', ''); });
    for (var j = 1; j < run.length; j++) pull(run[j], dir === 'v' ? 'marginTop' : 'marginLeft', gaps[j - 1]);
  }
  function later(ms) { clearTimeout(timer); timer = setTimeout(scan, ms || 90); }
  function init() {
    var mo = new MutationObserver(function () { later(90); });
    mo.observe(document.body, { childList: true, subtree: true });
    window.addEventListener('resize', function () { later(160); });
    window.addEventListener('load', function () { later(200); setTimeout(scan, 1500); setTimeout(scan, 4000); });
    document.addEventListener('miles:lang', function () { later(120); });
    later(300);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
