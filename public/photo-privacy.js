/* Miles Retold · privacy setting for photo details: what is removed automatically when photos are added.
   Same stored choice the live editor reads (localStorage 'miles.photoMeta'). The editor still shows each batch before adding it. */
(function () {
  'use strict';
  var KEY = 'miles.photoMeta', ROWS = [['date', 'Remove the date and time', 'The day and time each photo was taken.'], ['location', 'Remove the location', 'Where each photo was taken (GPS).'], ['camera', 'Remove phone or camera details', 'The make and model of your phone or camera.'], ['other', 'Remove other details', 'Software, lens and other technical notes.']];
  var load = function () { try { var v = JSON.parse(localStorage.getItem(KEY) || 'null'); if (v) return { date: v.date !== false, location: v.location !== false, camera: v.camera !== false, other: v.other !== false }; } catch (e) {} return { date: true, location: true, camera: true, other: true }; };
  var save = function (v) { try { localStorage.setItem(KEY, JSON.stringify(v)); } catch (e) {} };
  var css = '@layer g{.pp{display:grid;gap:12px}.pp-r{display:flex;align-items:center;gap:14px;justify-content:space-between;padding:14px 0;border-block-end:1px solid var(--e-line,rgb(0 0 0/.12))}.pp-r:last-of-type{border:0}.pp-r b{display:block}.pp-r small{opacity:.7;font-size:14px}.pp-all{padding:12px 14px;border-radius:14px;background:var(--e-glass,rgb(0 0 0/.05))}.pp-note{margin:0;font-size:14px;opacity:.75}}';
  var st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);
  function draw() {
    var head = document.querySelector('.dp .dp-head'); if (!head || document.getElementById('pp')) return;
    var v = load(), sec = document.createElement('section'); sec.id = 'pp'; sec.className = 'ed-panel pp';
    var all = function () { return ROWS.every(function (r) { return v[r[0]]; }); };
    var row = function (k, t, d, cls) { return '<div class="pp-r ' + (cls || '') + '"><div><b>' + t + '</b><small>' + d + '</small></div><button type="button" class="ew-sw2" data-k="' + k + '" aria-pressed="' + (k === 'all' ? all() : v[k]) + '" aria-label="' + t + '"></button></div>'; };
    sec.innerHTML = '<h2 class="dp-h2">When you add photos</h2><p class="ed-muted">Choose what we clean off your photos automatically. Switched on means removed. These are the starting choices; you still see what each batch carries before it is added, and can change it then.</p>' +
      row('all', 'Remove all details', 'Date, location, phone and every other hidden detail.', 'pp-all') + ROWS.map(function (r) { return row(r[0], r[1], r[2]); }).join('') +
      '<p class="pp-note" role="status" aria-live="polite" id="pp-s"></p>';
    head.parentNode.insertBefore(sec, head.nextSibling);
    var msg = document.getElementById('pp-s');
    sec.addEventListener('click', function (e) {
      var b = e.target.closest('button[data-k]'); if (!b) return;
      var k = b.getAttribute('data-k');
      if (k === 'all') { var to = !all(); ROWS.forEach(function (r) { v[r[0]] = to; }); } else v[k] = !v[k];
      save(v);
      sec.querySelectorAll('button[data-k]').forEach(function (x) { var kk = x.getAttribute('data-k'); x.setAttribute('aria-pressed', String(kk === 'all' ? all() : v[kk])); });
      msg.textContent = all() ? 'Everything is removed from new photos.' : (ROWS.some(function (r) { return v[r[0]]; }) ? 'Saved. Some details are kept.' : 'Saved. Nothing is removed unless you choose so when adding.');
    });
  }
  var go = function () { draw(); if (window.MutationObserver) new MutationObserver(draw).observe(document.body, { childList: true, subtree: true }); };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', go); else go();
})();
