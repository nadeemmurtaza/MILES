/* Miles Retold · live book editor, photo gestures (mouse, pen and touch, one code path).
   A frame that can be touched carries data-gf plus data-si (spread), data-fi (frame), data-has ("1" when it holds a photo),
   data-sel ("1" when it is the selected frame) and data-src (the photo, for the drag picture).

     selected frame, one finger / mouse drag    pan: choose which part of the photo shows (the focus area)
     selected frame, two fingers                pinch to zoom (and pan with the midpoint)
     selected frame, Ctrl + wheel / trackpad    zoom
     other frame, press and hold (touch) or drag (mouse), drop on another frame    swap the two photos
     keyboard, selected frame focused   arrows pan (Shift = bigger steps), + / - zoom, 0 resets, Alt + arrows swap with the neighbouring frame

   The page gives it four callbacks: MilesGestures.attach({ getSlot(si, fi) -> {z,x,y}, adjust(si, fi, patch),
   swap(si, a, b), afterSwap(si, a, b) }). attach() returns a function that removes every listener.
   Unselected frames keep touch-action: pan-y so a finger on a photo still scrolls the page; only the selected frame owns the gesture. */
(function () {
  'use strict';
  var HOLD = 380, SLOP = 8, MAXZ = 4;

  function attach(h) {
    var st = null, raf = 0, patch = null, ghost = null, over = null, blockUntil = 0;

    function frameOf(t) { return t && t.closest ? t.closest('[data-gf]') : null; }
    function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
    function dist(a, b) { return Math.hypot(a.x - b.x, a.y - b.y); }
    function pts() { return Object.keys(st.ptrs).map(function (k) { return st.ptrs[k]; }); }
    function mid() { var p = pts(); return p.length > 1 ? { x: (p[0].x + p[1].x) / 2, y: (p[0].y + p[1].y) / 2 } : p[0]; }

    /* write at most once per frame: a drag makes dozens of events, the book is saved (and one undo step kept) per frame */
    function push(p) {
      patch = Object.assign(patch || {}, p);
      if (!raf) raf = requestAnimationFrame(function () { raf = 0; var q = patch; patch = null; if (q && st) h.adjust(st.si, st.fi, q); else if (q) h.adjust(lastSi, lastFi, q); });
    }
    var lastSi = 0, lastFi = 0;

    /* moving the photo by dx px should move the picture by dx: with a zoom of z the picture overflows its frame by (z - 1) frames,
       so the focus point moves (dx / frame) / (z - 1). Near 1x there is almost no overflow, so a small floor keeps it usable. */
    function panBy(dx, dy) {
      var r = Math.max(st.cur.z - 1, .35), w = st.rect.width || 1, ht = st.rect.height || 1;
      st.cur.x = clamp(st.cur.x - dx / w * 100 / r, 0, 100);
      st.cur.y = clamp(st.cur.y - dy / ht * 100 / r, 0, 100);
      push({ x: Math.round(st.cur.x * 10) / 10, y: Math.round(st.cur.y * 10) / 10, z: Math.round(st.cur.z * 100) / 100 });
    }
    function busy(on) { document.documentElement.classList.toggle('gx-active', !!on); }
    function noScroll(e) { if (st && (st.mode === 'pan' || st.mode === 'pinch' || st.mode === 'move') && e.cancelable) e.preventDefault(); }

    function startMove() {
      st.mode = 'move'; st.moved = true; busy(true);
      st.el.classList.add('gx-src');
      ghost = document.createElement('div'); ghost.className = 'gx-ghost'; ghost.setAttribute('aria-hidden', 'true');
      var src = st.el.getAttribute('data-src'); if (src) ghost.style.backgroundImage = 'url("' + src + '")';
      document.body.appendChild(ghost); moveGhost(st.last.x, st.last.y);
      try { if (navigator.vibrate) navigator.vibrate(12); } catch (e) {}
    }
    function moveGhost(x, y) {
      if (!ghost) return; ghost.style.transform = 'translate(' + (x - 48) + 'px,' + (y - 48) + 'px)';
      ghost.style.display = 'none'; var t = document.elementFromPoint(x, y); ghost.style.display = '';
      var f = frameOf(t); if (f && (f === st.el || f.dataset.si !== st.el.dataset.si)) f = null;
      if (f !== over) { if (over) over.classList.remove('gx-over'); over = f; if (over) over.classList.add('gx-over'); }
    }
    function end(cancelled) {
      if (!st) return;
      clearTimeout(st.timer);
      if (st.mode === 'move' && !cancelled && over) {
        var a = +st.el.dataset.fi, c = +over.dataset.fi, si = +st.el.dataset.si;
        h.swap(si, a, c); if (h.afterSwap) h.afterSwap(si, a, c);
      }
      if (st.moved) blockUntil = Date.now() + 450;          /* the click that follows a drag must not select / deselect */
      if (st.el) st.el.classList.remove('gx-src');
      if (over) over.classList.remove('gx-over'); over = null;
      if (ghost) { ghost.remove(); ghost = null; }
      busy(false); st = null;
    }

    function down(e) {
      if (e.pointerType === 'mouse' && e.button !== 0) return;
      var f = frameOf(e.target); if (!f || f.dataset.has !== '1') return;
      var p = { x: e.clientX, y: e.clientY };
      if (st && st.el === f && st.sel && Object.keys(st.ptrs).length === 1) {          /* a second finger: pinch */
        st.ptrs[e.pointerId] = p; st.mode = 'pinch'; st.moved = true; st.d0 = Math.max(dist.apply(null, pts()), 1); st.z0 = st.cur.z; st.mid = mid(); busy(true); return;
      }
      if (st) end(true);
      var si = +f.dataset.si, fi = +f.dataset.fi, s = h.getSlot(si, fi); if (!s) return;
      lastSi = si; lastFi = fi;
      st = { el: f, si: si, fi: fi, sel: f.dataset.sel === '1', ptrs: {}, mode: 'wait', moved: false, start: p, last: p, cur: { z: s.z || 1, x: s.x == null ? 50 : s.x, y: s.y == null ? 50 : s.y }, rect: f.getBoundingClientRect() };
      st.ptrs[e.pointerId] = p;
      if (!st.sel && e.pointerType !== 'mouse') st.timer = setTimeout(function () { if (st && st.mode === 'wait') startMove(); }, HOLD);
    }
    function move(e) {
      if (!st || !(e.pointerId in st.ptrs)) return;
      var p = { x: e.clientX, y: e.clientY }, prev = st.ptrs[e.pointerId]; st.ptrs[e.pointerId] = p;
      if (st.mode === 'pinch') {
        var ps = pts(); if (ps.length < 2) return;
        var m = mid(), z = clamp(st.z0 * dist(ps[0], ps[1]) / st.d0, 1, MAXZ);
        st.cur.z = z; panBy(m.x - st.mid.x, m.y - st.mid.y); st.mid = m; return;
      }
      st.last = p;
      if (st.mode === 'move') { moveGhost(p.x, p.y); if (e.cancelable) e.preventDefault(); return; }
      var far = Math.hypot(p.x - st.start.x, p.y - st.start.y) > SLOP;
      if (st.mode === 'wait' && far) {
        if (st.sel) { st.mode = 'pan'; st.moved = true; busy(true); }
        else if (e.pointerType === 'mouse') startMove();
        else { clearTimeout(st.timer); st = null; return; }           /* a swipe on an unselected photo is a page scroll */
      }
      if (st && st.mode === 'pan') { panBy(p.x - prev.x, p.y - prev.y); if (e.cancelable) e.preventDefault(); }
    }
    function up(e) {
      if (!st || !(e.pointerId in st.ptrs)) return;
      delete st.ptrs[e.pointerId];
      if (st.mode === 'pinch' && Object.keys(st.ptrs).length === 1) { st.mode = 'pan'; var r = pts()[0]; st.start = r; return; }   /* one finger left: keep panning */
      if (!Object.keys(st.ptrs).length) end(e.type === 'pointercancel');
    }
    function wheel(e) {
      if (!e.ctrlKey) return;
      var f = frameOf(e.target); if (!f || f.dataset.has !== '1' || f.dataset.sel !== '1') return;
      var si = +f.dataset.si, fi = +f.dataset.fi, s = h.getSlot(si, fi); if (!s) return;
      e.preventDefault(); lastSi = si; lastFi = fi;
      var z = clamp((s.z || 1) * Math.exp(-e.deltaY * .004), 1, MAXZ);
      if (st) { st.cur.z = z; } h.adjust(si, fi, { z: Math.round(z * 100) / 100 });
    }
    function click(e) { if (Date.now() < blockUntil && frameOf(e.target)) { e.stopPropagation(); e.preventDefault(); } }
    function ctx(e) { if (st && st.mode !== 'wait' && frameOf(e.target)) e.preventDefault(); }


    /* the same three moves without dragging: arrows pan, + and - zoom, 0 resets, Alt + arrow swaps with the next or previous frame */
    function keys(e) {
      var el = frameOf(e.target);
      if (!el || el.getAttribute('data-sel') !== '1' || el.getAttribute('data-has') !== '1' || e.ctrlKey || e.metaKey) return;
      var si = +el.getAttribute('data-si'), fi = +el.getAttribute('data-fi'), k = e.key, cur = h.getSlot(si, fi);
      if (!cur) return;
      var step = e.shiftKey ? 12 : 4, p = null;
      if (e.altKey && /^Arrow(Left|Right|Up|Down)$/.test(k)) {
        var peers = [].slice.call(document.querySelectorAll('[data-gf][data-si="' + si + '"]')), i = peers.indexOf(el), to = peers[i + (/Left|Up/.test(k) ? -1 : 1)];
        if (to) { e.preventDefault(); e.stopPropagation(); var b = +to.getAttribute('data-fi'); h.swap(si, fi, b); if (h.afterSwap) h.afterSwap(si, fi, b); }
        return;
      }
      if (k === 'ArrowLeft') p = { x: clamp(cur.x - step, 0, 100) }; else if (k === 'ArrowRight') p = { x: clamp(cur.x + step, 0, 100) };
      else if (k === 'ArrowUp') p = { y: clamp(cur.y - step, 0, 100) }; else if (k === 'ArrowDown') p = { y: clamp(cur.y + step, 0, 100) };
      else if (k === '+' || k === '=') p = { z: clamp(Math.round((cur.z + .1) * 100) / 100, 1, MAXZ) };
      else if (k === '-' || k === '_') p = { z: clamp(Math.round((cur.z - .1) * 100) / 100, 1, MAXZ) };
      else if (k === '0') p = { z: 1, x: 50, y: 50 };
      if (!p) return;
      e.preventDefault(); e.stopPropagation(); lastSi = si; lastFi = fi; h.adjust(si, fi, p);
    }
    document.addEventListener('keydown', keys, true);
    document.addEventListener('pointerdown', down, true);
    window.addEventListener('pointermove', move, { passive: false });
    window.addEventListener('pointerup', up); window.addEventListener('pointercancel', up);
    document.addEventListener('wheel', wheel, { passive: false });
    document.addEventListener('click', click, true);
    document.addEventListener('contextmenu', ctx);
    document.addEventListener('touchmove', noScroll, { passive: false });
    return function () {
      document.removeEventListener('keydown', keys, true); document.removeEventListener('pointerdown', down, true); window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up); window.removeEventListener('pointercancel', up);
      document.removeEventListener('wheel', wheel); document.removeEventListener('click', click, true);
      document.removeEventListener('contextmenu', ctx); document.removeEventListener('touchmove', noScroll);
      if (st) end(true); cancelAnimationFrame(raf);
    };
  }
  window.MilesGestures = { attach: attach };
})();
