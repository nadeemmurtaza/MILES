/* Miles Retold · live book editor core.
   One book document, shared by the customer editor (G23 / GL23) and the studio editor (G70 / GL70).
   The document lives in localStorage ('miles.editor.v1'); a change made in one tab shows up live in the other
   through the `storage` event. This is a prototype: there is no server, photos are sample images.

   window.MilesEditor
     .load()                  -> book (seeded on first run)
     .save(book, opts)        -> writes + stamps `saved`
     .layouts                 -> [{ id, name, slots, pages }]
     .photos                  -> sample photo library
     ops (all return a NEW book, never mutate): place, clearSlot, swapSlots, adjust, setLayout, setCaption,
       addSpread, duplicateSpread, deleteSpread, moveSpread, setMeta, setStatus
     .stats(book)             -> counts used by both editors (used photos, empty frames, low-res, ...)
     .History                 -> small undo / redo stack                                              */
(function () {
  'use strict';
  var KEY = 'miles.editor.v1';

  /* ---------- sample photo library (the images the site already ships) ---------- */
  var IMG = ['1bebe18032c3ba7f722debbe5fa70f36', 'd79cb5916bf021b810ad3e0168beec13', '6dc6964be6ca87733a870c819d870936',
    '40f21930485ef5903566224ed85a9273', '44c3ed2b417e619b81afb56289c69c25', 'd4b2aafa1f1446ed8701326e3284b455',
    '3936155b1de2d6f9d237753228c056d0', '6b43c91be8c10d0cbed5dc2520dde00d', '8384abb23ebdfeb24e7152bf3fdd1a9b',
    'b305aa7d0c1ed679fe60219a9e088e10', '2523c5562a95c13a7e6113539f573d2d', 'ae8f12954b4a72155451fa4ddff588b7'];
  var PLACES = ['Jetty sunset', 'Beach walk', 'Dinner by the water', 'Boat ride', 'Market stall', 'Old town street', 'Rooftop view',
    'Coffee stop', 'Postcard wall', 'Train platform', 'Night lights', 'Handwritten note'];
  var photos = [];
  for (var i = 0; i < 36; i++) {
    photos.push({
      id: 'p' + (i + 1), src: '/_blob/' + IMG[i % IMG.length], name: PLACES[i % PLACES.length] + (i >= 12 ? ' ' + (Math.floor(i / 12) + 1) : ''),
      low: i === 7 || i === 19 || i === 30, star: i === 0 || i === 3 || i === 9
    });
  }

  /* ---------- layouts: how many frames a spread has, and which pages carry a caption ---------- */
  var layouts = [
    { id: 'full', name: 'Full bleed', slots: 1 },
    { id: 'pair', name: 'One each', slots: 2 },
    { id: 'trio', name: 'Big + two', slots: 3 },
    { id: 'quad', name: 'Four up', slots: 4 },
    { id: 'story', name: 'Story + photo', slots: 1, text: true },
    { id: 'collage', name: 'Collage', slots: 5 }
  ];
  var LAY = {}; layouts.forEach(function (l) { LAY[l.id] = l; });

  function newSlot(p) { return { p: p || null, z: 1, x: 50, y: 50, b: 100 }; }
  function uid() { return 's' + Math.random().toString(36).slice(2, 8); }
  function blankSpread(lay, ids) {
    var n = LAY[lay].slots, slots = [];
    for (var i = 0; i < n; i++) slots.push(newSlot(ids && ids[i]));
    return { id: uid(), lay: lay, slots: slots, caps: ['', ''] };
  }
  function clone(o) { return JSON.parse(JSON.stringify(o)); }

  function seed() {
    var sp = [
      blankSpread('full', ['p1']),
      blankSpread('pair', ['p2', 'p3']),
      blankSpread('trio', ['p4', 'p5', 'p6']),
      blankSpread('story', ['p7']),
      blankSpread('quad', ['p8', 'p9', 'p10', 'p11']),
      blankSpread('collage', ['p12', 'p13', 'p14', null, null])
    ];
    sp[0].caps = ['', 'March 2022 · Maldives'];
    sp[1].caps = ['The first morning', 'Salt on everything'];
    sp[2].caps = ['Dinner by the water', ''];
    sp[3].caps = ['We said we would do nothing for a week. We did not manage it on day two.', 'Boat ride, 4 pm'];
    sp[4].caps = ['', 'Four small things we keep thinking about'];
    return {
      v: 1, title: 'Maldives', dates: 'March 2022', cover: 'Dusty blue', size: 'portrait', pagesTotal: 40,
      owner: 'Sara A.', order: 'MR-1042', round: 2, status: 'draft',        /* draft | proof-requested | proof-sent | locked */
      spreads: sp, comments: [
        { id: 'c1', sp: 0, who: 'Sara', t: 'Can the sunset photo fill the whole left page?', done: true },
        { id: 'c2', sp: 1, who: 'Sara', t: 'Please brighten this one a little.', done: false },
        { id: 'c3', sp: 3, who: 'Sara', t: 'Love this now. Maybe add our wedding date in the corner?', done: false }
      ],
      versions: [{ id: 'v1', label: 'Proof round 1', at: Date.now() - 86400000 * 5, by: 'Rameen' }, { id: 'v2', label: 'Proof round 2', at: Date.now() - 86400000 * 2, by: 'Rameen' }],
      notes: 'Cover photo: jetty sunset. Two more resort photos still to come.', saved: Date.now(), rev: 1
    };
  }

  function load() {
    try { var raw = localStorage.getItem(KEY); if (raw) { var b = JSON.parse(raw); if (b && b.v === 1) return b; } } catch (e) {}
    return seed();
  }
  function save(book, opts) {
    var b = clone(book); b.saved = Date.now(); b.rev = (book.rev || 0) + 1;
    try { localStorage.setItem(KEY, JSON.stringify(b)); } catch (e) {}
    return b;
  }
  function reset() { try { localStorage.removeItem(KEY); } catch (e) {} return seed(); }

  /* ---------- operations: pure, return a new book ---------- */
  function edit(book, fn) { var b = clone(book); fn(b); return b; }
  function ensureSlots(sp) {   /* keep slot count in step with the layout */
    var n = LAY[sp.lay].slots;
    while (sp.slots.length < n) sp.slots.push(newSlot());
    if (sp.slots.length > n) sp.slots.length = n;
  }
  var ops = {
    place: function (b, si, sl, pid) { return edit(b, function (x) { var s = x.spreads[si].slots[sl]; if (!s) return; /* a photo is used once: lift it from where it was */ x.spreads.forEach(function (sp) { sp.slots.forEach(function (t) { if (t.p === pid && t !== s) { t.p = null; } }); }); s.p = pid; s.z = 1; s.x = 50; s.y = 50; s.b = 100; }); },
    clearSlot: function (b, si, sl) { return edit(b, function (x) { var s = x.spreads[si].slots[sl]; if (s) { s.p = null; s.z = 1; s.x = 50; s.y = 50; s.b = 100; } }); },
    swapSlots: function (b, si, a, c) { return edit(b, function (x) { var s = x.spreads[si].slots, t = s[a]; s[a] = s[c]; s[c] = t; }); },
    adjust: function (b, si, sl, patch) { return edit(b, function (x) { var s = x.spreads[si].slots[sl]; if (!s) return; Object.keys(patch).forEach(function (k) { s[k] = patch[k]; }); }); },
    setLayout: function (b, si, lay) { return edit(b, function (x) { var sp = x.spreads[si]; sp.lay = lay; ensureSlots(sp); }); },
    setCaption: function (b, si, side, text) { return edit(b, function (x) { x.spreads[si].caps[side] = text; }); },
    addSpread: function (b, after) { return edit(b, function (x) { x.spreads.splice(after + 1, 0, blankSpread('pair')); }); },
    duplicateSpread: function (b, si) { return edit(b, function (x) { var c = clone(x.spreads[si]); c.id = uid(); c.slots.forEach(function (s) { s.p = null; }); x.spreads.splice(si + 1, 0, c); }); },
    deleteSpread: function (b, si) { return edit(b, function (x) { if (x.spreads.length > 1) x.spreads.splice(si, 1); }); },
    moveSpread: function (b, si, to) { return edit(b, function (x) { if (to < 0 || to >= x.spreads.length) return; var s = x.spreads.splice(si, 1)[0]; x.spreads.splice(to, 0, s); }); },
    setMeta: function (b, patch) { return edit(b, function (x) { Object.keys(patch).forEach(function (k) { x[k] = patch[k]; }); }); },
    setStatus: function (b, status) { return edit(b, function (x) { x.status = status; if (status === 'proof-sent') { x.round = (x.round || 1) + 1; x.versions.push({ id: uid(), label: 'Proof round ' + x.round, at: Date.now(), by: 'Studio' }); } }); },
    resolve: function (b, id, done) { return edit(b, function (x) { x.comments.forEach(function (c) { if (c.id === id) c.done = done; }); }); },
    addComment: function (b, si, who, t) { return edit(b, function (x) { x.comments.push({ id: uid(), sp: si, who: who, t: t, done: false }); }); },
    saveVersion: function (b, label) { return edit(b, function (x) { x.versions.push({ id: uid(), label: label, at: Date.now(), by: 'Studio' }); }); }
  };

  /* ---------- derived numbers ---------- */
  function stats(b) {
    var used = {}, empty = 0, low = 0, frames = 0;
    b.spreads.forEach(function (sp) {
      sp.slots.forEach(function (s) {
        frames++;
        if (!s.p) { empty++; return; }
        used[s.p] = 1;
        var ph = photos.filter(function (p) { return p.id === s.p; })[0];
        if (ph && ph.low) low++;
      });
    });
    var usedN = Object.keys(used).length;
    var open = b.comments.filter(function (c) { return !c.done; }).length;
    return { used: usedN, unused: photos.length - usedN, frames: frames, empty: empty, low: low, pages: b.spreads.length * 2, total: b.pagesTotal, openComments: open };
  }
  function photoById(id) { for (var i = 0; i < photos.length; i++) if (photos[i].id === id) return photos[i]; return null; }
  function usedMap(b) { var m = {}; b.spreads.forEach(function (sp, i) { sp.slots.forEach(function (s) { if (s.p) m[s.p] = i + 1; }); }); return m; }

  /* ---------- undo / redo ---------- */
  function History(limit) { this.past = []; this.future = []; this.limit = limit || 60; }
  History.prototype.push = function (book) { this.past.push(clone(book)); if (this.past.length > this.limit) this.past.shift(); this.future = []; };
  History.prototype.undo = function (cur) { if (!this.past.length) return null; this.future.push(clone(cur)); return this.past.pop(); };
  History.prototype.redo = function (cur) { if (!this.future.length) return null; this.past.push(clone(cur)); return this.future.pop(); };
  History.prototype.can = function () { return { undo: this.past.length > 0, redo: this.future.length > 0 }; };

  function timeLabel(ts) {
    var d = new Date(ts), h = d.getHours(), m = d.getMinutes();
    return (h < 10 ? '0' : '') + h + ':' + (m < 10 ? '0' : '') + m;
  }
  function ago(ts) {
    var s = Math.max(0, Math.round((Date.now() - ts) / 1000));
    if (s < 10) return 'just now'; if (s < 60) return s + ' s ago';
    var m = Math.round(s / 60); if (m < 60) return m + ' min ago';
    var h = Math.round(m / 60); if (h < 24) return h + ' h ago';
    return Math.round(h / 24) + ' days ago';
  }

  window.MilesEditor = {
    KEY: KEY, load: load, save: save, reset: reset, layouts: layouts, layout: function (id) { return LAY[id]; }, photos: photos, photoById: photoById,
    ops: ops, stats: stats, usedMap: usedMap, History: History, timeLabel: timeLabel, ago: ago, clone: clone
  };
})();
