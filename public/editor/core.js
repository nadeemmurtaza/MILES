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
       addSpread, duplicateSpread, deleteSpread, moveSpread, setMeta, setStatus, plus the workspace ops used by the
       other editor pages: autoFill, autoLayout, setLayoutMany, deleteMany, setStyle, setCover, setStar, setNote,
       hidePhoto, addPhotos, replaceText, restoreVersion, reply, ...
     .preflight(book)         -> print check: issues with severity and an automatic fix where one exists
     .diff(spreadsA, spreadsB)-> what changed between two versions (added, removed, moved, changed)
     .textItems(book)         -> every caption / story text in the book, in reading order
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
  var photos = [], BASE = 36;   /* p1..p36 are in the book library; p37..p42 are the reserve that "Add photos" brings in */
  for (var i = 0; i < 42; i++) {
    var low = i === 7 || i === 19 || i === 30, portrait = i % 4 === 3;
    photos.push({
      id: 'p' + (i + 1), src: '/_blob/' + IMG[i % IMG.length], name: PLACES[i % PLACES.length] + (i >= 12 ? ' ' + (Math.floor(i / 12) + 1) : ''),
      low: low, star: i === 0 || i === 3 || i === 9, same: i % 12,     /* same: photos that share a file are possible duplicates */
      w: low ? 1100 : (portrait ? 3024 : 4032), h: low ? 825 : (portrait ? 4032 : 3024), reserve: i >= BASE
    });
  }

  /* ---------- layouts: how many frames a spread has, and which pages carry a caption ---------- */
  /* geo: each frame as [x, y, w, h] fractions of the whole spread (used for the print check's pixel density) */
  var T = 1 / 3, S6 = 1 / 6;
  var layouts = [
    { id: 'full', name: 'Full bleed', slots: 1, best: 'One hero photo across both pages', geo: [[0, 0, 1, 1]] },
    { id: 'pair', name: 'One each', slots: 2, best: 'Two photos, one per page', geo: [[0, 0, .5, 1], [.5, 0, .5, 1]] },
    { id: 'trio', name: 'Big + two', slots: 3, best: 'A big photo and two supporting ones', geo: [[0, 0, .5, 1], [.5, 0, .5, .5], [.5, .5, .5, .5]] },
    { id: 'quad', name: 'Four up', slots: 4, best: 'A tidy grid for four similar photos', geo: [[0, 0, .5, .5], [.5, 0, .5, .5], [0, .5, .5, .5], [.5, .5, .5, .5]] },
    { id: 'story', name: 'Story + photo', slots: 1, text: true, best: 'A paragraph of words beside one photo', geo: [[.5, 0, .5, 1]] },
    { id: 'collage', name: 'Collage', slots: 5, best: 'A busy day: five small photos', geo: [[0, 0, .5, 4 * S6], [0, 4 * S6, .5, 2 * S6], [.5, 0, .5, 2 * S6], [.5, 2 * S6, .5, 2 * S6], [.5, 4 * S6, .5, 2 * S6]] },
    { id: 'pano', name: 'Panorama', slots: 2, best: 'A wide view with a strip underneath', geo: [[0, 0, 1, 4 * S6], [0, 4 * S6, 1, 2 * S6]] },
    { id: 'six', name: 'Six up', slots: 6, best: 'Contact-sheet style, three down each page', geo: [[0, 0, .5, T], [0, T, .5, T], [0, 2 * T, .5, T], [.5, 0, .5, T], [.5, T, .5, T], [.5, 2 * T, .5, T]] },
    { id: 'heroR', name: 'Two + big', slots: 3, best: 'Mirror of Big + two, the big one on the right', geo: [[0, 0, .5, .5], [0, .5, .5, .5], [.5, 0, .5, 1]] }
  ];
  var LAY = {}; layouts.forEach(function (l) { LAY[l.id] = l; });

  /* ---------- page layouts: each of the two pages of a spread can have its own ----------
     cells: [col0, col1, row0, row1] on the page's own grid (2 columns x 6 rows), 1-based like CSS grid lines.
     A spread is either one of the layouts above (they can run across both pages) or 'split': sp.pg = [leftId, rightId]
     and sp.slots = the left page's frames followed by the right page's frames. */
  var pageLayouts = [
    { id: 'p1', name: 'Full page', best: 'One photo filling the page', cells: [[1, 3, 1, 7]] },
    { id: 'p2', name: 'Two stacked', best: 'Two photos, one above the other', cells: [[1, 3, 1, 4], [1, 3, 4, 7]] },
    { id: 'p2s', name: 'Side by side', best: 'Two tall photos next to each other', cells: [[1, 2, 1, 7], [2, 3, 1, 7]] },
    { id: 'p3', name: 'Big + two', best: 'A big photo over two small ones', cells: [[1, 3, 1, 5], [1, 2, 5, 7], [2, 3, 5, 7]] },
    { id: 'p3s', name: 'Three stacked', best: 'Three wide strips', cells: [[1, 3, 1, 3], [1, 3, 3, 5], [1, 3, 5, 7]] },
    { id: 'p4', name: 'Four up', best: 'A tidy grid of four', cells: [[1, 2, 1, 4], [2, 3, 1, 4], [1, 2, 4, 7], [2, 3, 4, 7]] },
    { id: 'p6', name: 'Six up', best: 'Contact-sheet grid of six', cells: [[1, 2, 1, 3], [2, 3, 1, 3], [1, 2, 3, 5], [2, 3, 3, 5], [1, 2, 5, 7], [2, 3, 5, 7]] },
    { id: 'text', name: 'Story text', best: 'A whole page of words', cells: [], text: true },
    { id: 'blank', name: 'Blank', best: 'An empty page to breathe', cells: [] }
  ];
  var PL = {}; pageLayouts.forEach(function (p) { p.slots = p.cells.length; PL[p.id] = p; });
  /* an older single-layout spread, expressed as two pages (slot order after the move) */
  var TO_SPLIT = {
    full: { p: ['p1', 'p1'], order: [0, null] }, pair: { p: ['p1', 'p1'], order: [0, 1] }, trio: { p: ['p1', 'p2'], order: [0, 1, 2] },
    quad: { p: ['p2', 'p2'], order: [0, 2, 1, 3] }, story: { p: ['text', 'p1'], order: [0] }, collage: { p: ['p2', 'p3s'], order: [0, 1, 2, 3, 4] },
    pano: { p: ['p1', 'p1'], order: [0, 1] }, six: { p: ['p3s', 'p3s'], order: [0, 1, 2, 3, 4, 5] }, heroR: { p: ['p2', 'p1'], order: [0, 1, 2] }
  };
  /* the layout of any spread, whatever kind: { id, name, slots, text, textL, textR, best, split } */
  function lay(sp) {
    if (sp.lay !== 'split') { var l = LAY[sp.lay]; return { id: l.id, name: l.name, slots: l.slots, text: !!l.text, textL: !!l.text, textR: false, best: l.best, split: false }; }
    var a = PL[sp.pg[0]], c = PL[sp.pg[1]];
    return { id: 'split', name: a.id === c.id ? a.name + ' on both pages' : a.name + ' + ' + c.name, slots: a.slots + c.slots, text: !!(a.text || c.text), textL: !!a.text, textR: !!c.text, best: '', split: true, left: a, right: c };
  }
  function slotRect(sp, i) {            /* split spreads: grid lines of frame i on the spread's 4-column grid */
    var a = PL[sp.pg[0]], c = PL[sp.pg[1]], g = i < a.slots ? a.cells[i] : c.cells[i - a.slots], off = i < a.slots ? 0 : 2;
    return g ? [g[0] + off, g[1] + off, g[2], g[3]] : null;
  }
  function slotCls(sp, i) { if (sp.lay !== 'split') return ''; var r = slotRect(sp, i); return r ? 'gc' + r[0] + '_' + r[1] + ' gr' + r[2] + '_' + r[3] : ''; }
  function slotGeo(sp, i) {             /* [x, y, w, h] as fractions of the spread */
    if (sp.lay !== 'split') return LAY[sp.lay].geo[i];
    var r = slotRect(sp, i); return r ? [(r[0] - 1) / 4, (r[2] - 1) / 6, (r[1] - r[0]) / 4, (r[3] - r[2]) / 6] : null;
  }
  /* what a thumbnail draws for a spread: one cell per frame (with its grid class) plus a text block for each story page */
  function cellsFor(sp, photoOf) {
    var out = sp.slots.map(function (t, i) { var p = t.p ? photoOf(t.p) : null; return { src: p ? p.src : '', has: !!p, cls: slotCls(sp, i) }; });
    if (sp.lay === 'split') [0, 1].forEach(function (side) { if (PL[sp.pg[side]].text) out.push({ src: '', has: false, cls: 'txt gc' + (1 + side * 2) + '_' + (3 + side * 2) + ' gr1_7' }); });
    return out;
  }

  function newSlot(p) { return { p: p || null, z: 1, x: 50, y: 50, b: 100 }; }
  function uid() { return 's' + Math.random().toString(36).slice(2, 8); }
  function blankSpread(lay, ids) {
    var n = LAY[lay].slots, slots = [];
    for (var i = 0; i < n; i++) slots.push(newSlot(ids && ids[i]));
    return { id: uid(), lay: lay, slots: slots, caps: ['', ''] };
  }
  function clone(o) { return JSON.parse(JSON.stringify(o)); }

  /* ---------- the book's own look: page colours, caption type, photo frames, cover ---------- */
  var THEMES = [
    { id: 'cream', name: 'Classic cream', bg: '#f6f0e3', ink: '#2a2623', frame: '#ffffff', font: 'serif' },
    { id: 'gallery', name: 'Gallery white', bg: '#ffffff', ink: '#1d1d1f', frame: '#ffffff', font: 'sans' },
    { id: 'sand', name: 'Warm sand', bg: '#e9dcc3', ink: '#3a2e22', frame: '#f6f0e3', font: 'serif' },
    { id: 'sage', name: 'Sage', bg: '#dfe6da', ink: '#26332a', frame: '#f4f7f1', font: 'sans' },
    { id: 'midnight', name: 'Midnight', bg: '#1f2530', ink: '#f1ece2', frame: '#2d3441', font: 'sans' }
  ];
  var FONTS = { sans: 'Manrope, sans-serif', serif: 'Fraunces, Georgia, serif', script: 'Fraunces, Georgia, serif' };
  var COVER_COLOURS = [['Dusty blue', '#7f9bb3'], ['Forest', '#2f4a3c'], ['Terracotta', '#b4553a'], ['Charcoal', '#2b2b2e'], ['Sand', '#d8c7a8'], ['Plum', '#5b3a52'], ['Navy', '#1f3350'], ['Blush', '#e5c4bd']];
  var FOILS = [['Gold', '#c9a24b'], ['Silver', '#c4c9ce'], ['Rose gold', '#d29a89'], ['White', '#f6f2ea'], ['None', '']];
  var DEFAULT_STYLE = { theme: 'cream', bg: '#f6f0e3', ink: '#2a2623', frame: '#ffffff', margin: 2.4, gap: 1, radius: 2, border: 0, font: 'sans', size: 1, align: 'center' };
  var DEFAULT_COVER = { color: 'Dusty blue', foil: 'Gold', kind: 'window', photo: 'p1', title: 'Maldives', subtitle: 'March 2022', spine: true, back: 'Two weeks, one island, and far too many sunsets.', logo: true };

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
    var day = 86400000, now = Date.now();
    /* earlier proof rounds keep a copy of the spreads, so History can show what changed and restore it */
    var r1 = clone(sp.slice(0, 4)); r1[1].caps = ['', 'Salt on everything']; r1[2].slots[2].p = null; r1[3].caps = ['We said we would do nothing for a week.', ''];
    var r2 = clone(sp.slice(0, 5)); r2[4].slots[3].p = null; r2[4].caps = ['', ''];
    return {
      v: 1, title: 'Maldives', dates: 'March 2022', cover: 'Dusty blue', size: 'portrait', pagesTotal: 40,
      owner: 'Sara A.', order: 'MR-1042', round: 2, status: 'draft',        /* draft | proof-requested | proof-sent | locked */
      spreads: sp, comments: [
        { id: 'c1', sp: 0, who: 'Sara', t: 'Can the sunset photo fill the whole left page?', done: true, at: now - day * 4, re: [{ who: 'Rameen', t: 'Done in round 2: it now runs across both pages.', at: now - day * 2 }] },
        { id: 'c2', sp: 1, who: 'Sara', t: 'Please brighten this one a little.', done: false, at: now - day, re: [] },
        { id: 'c3', sp: 3, who: 'Sara', t: 'Love this now. Maybe add our wedding date in the corner?', done: false, at: now - 3600000 * 5, re: [] }
      ],
      versions: [
        { id: 'v1', label: 'Proof round 1', at: now - day * 5, by: 'Rameen', snap: r1 },
        { id: 'v2', label: 'Proof round 2', at: now - day * 2, by: 'Rameen', snap: r2 }
      ],
      notes: 'Cover photo: jetty sunset. Two more resort photos still to come.',
      style: clone(DEFAULT_STYLE), coverDesign: clone(DEFAULT_COVER),
      stars: {}, memo: {}, hidden: {}, extra: 0, ready: false, sendNote: '',
      activity: [
        { id: 'a1', t: now - day * 2, by: 'Rameen', msg: 'Proof round 2 sent to Sara A. on WhatsApp' },
        { id: 'a2', t: now - day * 4, by: 'Sara', msg: 'Left 3 comments on the proof' },
        { id: 'a3', t: now - day * 5, by: 'Rameen', msg: 'Proof round 1 sent to Sara A. on WhatsApp' }
      ],
      saved: now, rev: 1
    };
  }
  /* books saved by an earlier build lack the newer fields: fill them in, never overwrite */
  function migrate(b) {
    var d = seed();
    ['style', 'coverDesign', 'stars', 'memo', 'hidden', 'extra', 'ready', 'sendNote', 'activity'].forEach(function (k) { if (b[k] == null) b[k] = d[k]; });
    b.style = Object.assign({}, DEFAULT_STYLE, b.style); b.coverDesign = Object.assign({}, DEFAULT_COVER, b.coverDesign);
    b.comments.forEach(function (c) { if (!c.re) c.re = []; if (!c.at) c.at = Date.now() - 86400000; });
    b.versions.forEach(function (v) { if (!v.snap) v.snap = clone(b.spreads); });
    return b;
  }

  function load() {
    try { var raw = localStorage.getItem(KEY); if (raw) { var b = JSON.parse(raw); if (b && b.v === 1) return migrate(b); } } catch (e) {}
    return seed();
  }
  function save(book, opts) {
    var b = clone(book); b.saved = Date.now(); b.rev = (book.rev || 0) + 1;
    try { localStorage.setItem(KEY, JSON.stringify(b)); } catch (e) {}
    return b;
  }
  function reset() { try { localStorage.removeItem(KEY); } catch (e) {} return seed(); }

  /* ---------- the photo library of this book ---------- */
  function inLibrary(b) { return photos.filter(function (p) { return !p.reserve || photos.indexOf(p) - BASE < (b.extra || 0); }); }
  function visible(b) { return inLibrary(b).filter(function (p) { return !b.hidden[p.id]; }); }
  function isStar(b, p) { return b.stars && b.stars[p.id] != null ? !!b.stars[p.id] : !!p.star; }
  function photoById(id) { for (var i = 0; i < photos.length; i++) if (photos[i].id === id) return photos[i]; return null; }
  function usedMap(b) { var m = {}; b.spreads.forEach(function (sp, i) { sp.slots.forEach(function (s) { if (s.p) m[s.p] = i + 1; }); }); return m; }

  /* ---------- operations: pure, return a new book ---------- */
  function edit(book, fn) { var b = clone(book); fn(b); return b; }
  function ensureSlots(sp) {   /* keep slot count in step with the layout */
    var n = lay(sp).slots;
    while (sp.slots.length < n) sp.slots.push(newSlot());
    if (sp.slots.length > n) sp.slots.length = n;
  }
  function reset1(s) { s.z = 1; s.x = 50; s.y = 50; s.b = 100; }
  function toPages(sp, side, id) {
    if (sp.lay !== 'split') {                       /* first per-page change: rewrite the single layout as two pages */
      var t = TO_SPLIT[sp.lay], old = sp.slots, slots = t.order.map(function (k) { return k == null ? newSlot() : old[k]; });
      sp.pg = t.p.slice(); sp.slots = slots; sp.lay = 'split';
    }
    var nL = PL[sp.pg[0]].slots, L = sp.slots.slice(0, nL), R = sp.slots.slice(nL), cur = side ? R : L, n = PL[id].slots;
    while (cur.length < n) cur.push(newSlot());
    cur.length = n; sp.pg[side] = id; sp.slots = L.concat(R);
  }
  var ops = {
    place: function (b, si, sl, pid) { return edit(b, function (x) { var s = x.spreads[si].slots[sl]; if (!s) return; /* a photo is used once: lift it from where it was */ x.spreads.forEach(function (sp) { sp.slots.forEach(function (t) { if (t.p === pid && t !== s) { t.p = null; } }); }); s.p = pid; s.z = 1; s.x = 50; s.y = 50; s.b = 100; }); },
    clearSlot: function (b, si, sl) { return edit(b, function (x) { var s = x.spreads[si].slots[sl]; if (s) { s.p = null; s.z = 1; s.x = 50; s.y = 50; s.b = 100; } }); },
    swapSlots: function (b, si, a, c) { return edit(b, function (x) { var s = x.spreads[si].slots, t = s[a]; s[a] = s[c]; s[c] = t; }); },
    adjust: function (b, si, sl, patch) { return edit(b, function (x) { var s = x.spreads[si].slots[sl]; if (!s) return; Object.keys(patch).forEach(function (k) { s[k] = patch[k]; }); }); },
    setLayout: function (b, si, lay) { return edit(b, function (x) { var sp = x.spreads[si]; sp.lay = lay; delete sp.pg; ensureSlots(sp); }); },
    setLayoutMany: function (b, idxs, lay) { return edit(b, function (x) { idxs.forEach(function (i) { var sp = x.spreads[i]; if (sp) { sp.lay = lay; delete sp.pg; ensureSlots(sp); } }); }); },
    /* give one page (side 0 = left, 1 = right) its own layout; the other page keeps what it has. Photos that no longer fit go back to the library */
    setPageLayout: function (b, si, side, id) { return edit(b, function (x) { toPages(x.spreads[si], side, id); }); },
    setPageLayoutMany: function (b, idxs, side, id) { return edit(b, function (x) { idxs.forEach(function (i) { if (x.spreads[i]) toPages(x.spreads[i], side, id); }); }); },
    setCaption: function (b, si, side, text) { return edit(b, function (x) { x.spreads[si].caps[side] = text; }); },
    addSpread: function (b, after, lay) { return edit(b, function (x) { x.spreads.splice(after + 1, 0, blankSpread(lay || 'pair')); }); },
    duplicateSpread: function (b, si) { return edit(b, function (x) { var c = clone(x.spreads[si]); c.id = uid(); c.slots.forEach(function (s) { s.p = null; }); x.spreads.splice(si + 1, 0, c); }); },
    deleteSpread: function (b, si) { return edit(b, function (x) { if (x.spreads.length > 1) x.spreads.splice(si, 1); }); },
    deleteMany: function (b, idxs) { return edit(b, function (x) { var keep = x.spreads.filter(function (s, i) { return idxs.indexOf(i) < 0; }); if (keep.length) x.spreads = keep; }); },
    moveSpread: function (b, si, to) { return edit(b, function (x) { if (to < 0 || to >= x.spreads.length) return; var s = x.spreads.splice(si, 1)[0]; x.spreads.splice(to, 0, s); }); },
    setMeta: function (b, patch) { return edit(b, function (x) { Object.keys(patch).forEach(function (k) { x[k] = patch[k]; }); }); },
    setStatus: function (b, status) { return edit(b, function (x) { x.status = status; if (status === 'proof-sent') { x.round = (x.round || 1) + 1; x.versions.push({ id: uid(), label: 'Proof round ' + x.round, at: Date.now(), by: 'Studio', snap: clone(x.spreads) }); } }); },
    resolve: function (b, id, done) { return edit(b, function (x) { x.comments.forEach(function (c) { if (c.id === id) c.done = done; }); }); },
    addComment: function (b, si, who, t) { return edit(b, function (x) { x.comments.push({ id: uid(), sp: si, who: who, t: t, done: false, at: Date.now(), re: [] }); }); },
    reply: function (b, id, who, t) { return edit(b, function (x) { x.comments.forEach(function (c) { if (c.id === id) c.re.push({ who: who, t: t, at: Date.now() }); }); }); },
    saveVersion: function (b, label, by) { return edit(b, function (x) { x.versions.push({ id: uid(), label: label, at: Date.now(), by: by || 'Studio', snap: clone(x.spreads) }); }); },
    restoreVersion: function (b, id) { return edit(b, function (x) { x.versions.forEach(function (v) { if (v.id === id && v.snap) x.spreads = clone(v.snap); }); }); },
    deleteVersion: function (b, id) { return edit(b, function (x) { x.versions = x.versions.filter(function (v) { return v.id !== id; }); }); },
    log: function (b, by, msg) { return edit(b, function (x) { x.activity.unshift({ id: uid(), t: Date.now(), by: by, msg: msg }); x.activity.length = Math.min(x.activity.length, 40); }); },

    /* the other editor pages */
    setStyle: function (b, patch) { return edit(b, function (x) { Object.keys(patch).forEach(function (k) { x.style[k] = patch[k]; }); }); },
    applyTheme: function (b, id) { return edit(b, function (x) { THEMES.forEach(function (t) { if (t.id === id) { x.style.theme = t.id; x.style.bg = t.bg; x.style.ink = t.ink; x.style.frame = t.frame; x.style.font = t.font; } }); }); },
    setCover: function (b, patch) { return edit(b, function (x) { Object.keys(patch).forEach(function (k) { x.coverDesign[k] = patch[k]; }); x.cover = x.coverDesign.color; x.title = x.coverDesign.title; }); },
    setStar: function (b, pid, on) { return edit(b, function (x) { x.stars[pid] = !!on; }); },
    setNote: function (b, pid, t) { return edit(b, function (x) { x.memo[pid] = t; }); },
    hidePhoto: function (b, pid, on) { return edit(b, function (x) { if (on) { x.hidden[pid] = true; x.spreads.forEach(function (sp) { sp.slots.forEach(function (s) { if (s.p === pid) { s.p = null; reset1(s); } }); }); } else delete x.hidden[pid]; }); },
    addPhotos: function (b, n) { return edit(b, function (x) { x.extra = Math.min(photos.length - BASE, (x.extra || 0) + n); }); },
    /* fill every empty frame, in reading order, with the next photo not yet used (soft photos last) */
    autoFill: function (b) {
      return edit(b, function (x) {
        var used = usedMap(x), pool = visible(x).filter(function (p) { return !used[p.id]; });
        pool.sort(function (a, c) { return (a.low ? 1 : 0) - (c.low ? 1 : 0) || photos.indexOf(a) - photos.indexOf(c); });
        x.spreads.forEach(function (sp) { sp.slots.forEach(function (s) { if (!s.p && pool.length) { s.p = pool.shift().id; reset1(s); } }); });
      });
    },
    /* turn the photos not used yet into new spreads at the end: `per` photos each, with the layout that fits */
    autoLayout: function (b, per) {
      return edit(b, function (x) {
        var map = { 1: 'full', 2: 'pair', 3: 'trio', 4: 'quad', 5: 'collage', 6: 'six' }, used = usedMap(x);
        var pool = visible(x).filter(function (p) { return !used[p.id] && !p.low; });
        while (pool.length) { var take = pool.splice(0, per), sp = blankSpread(map[take.length] || 'pair', take.map(function (p) { return p.id; })); x.spreads.push(sp); }
      });
    },
    replaceText: function (b, find, rep, matchCase) {
      return edit(b, function (x) {
        if (!find) return;
        var re = new RegExp(find.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), matchCase ? 'g' : 'gi');
        x.spreads.forEach(function (sp) { sp.caps = sp.caps.map(function (t) { return t.replace(re, rep); }); });
      });
    },
    trimCaption: function (b, si, side, max) {
      return edit(b, function (x) { var t = x.spreads[si].caps[side]; if (t.length > max) { var cut = t.slice(0, max); var k = cut.lastIndexOf(' '); x.spreads[si].caps[side] = (k > max * .6 ? cut.slice(0, k) : cut).replace(/[ ,;:\-]+$/, '') + '…'; } });
    }
  };

  /* ---------- derived numbers ---------- */
  function stats(b) {
    var used = {}, empty = 0, low = 0, frames = 0, lib = visible(b);
    b.spreads.forEach(function (sp) {
      sp.slots.forEach(function (s) {
        frames++;
        if (!s.p) { empty++; return; }
        used[s.p] = 1;
        var ph = photoById(s.p);
        if (ph && ph.low) low++;
      });
    });
    var usedN = Object.keys(used).length;
    var open = b.comments.filter(function (c) { return !c.done; }).length;
    return { used: usedN, unused: Math.max(0, lib.length - usedN), frames: frames, empty: empty, low: low, pages: b.spreads.length * 2, total: b.pagesTotal, openComments: open, library: lib.length };
  }

  /* ---------- print check ---------- */
  var SPREAD_IN = [16, 10];     /* an 8 x 10 portrait book opens to 16 x 10 inches */
  function dpi(sp, i) {
    var s = sp.slots[i], ph = s && s.p ? photoById(s.p) : null, g = slotGeo(sp, i);
    if (!ph || !g) return 0;
    var fw = g[2] * SPREAD_IN[0], fh = g[3] * SPREAD_IN[1];
    return Math.round(Math.min(ph.w / fw, ph.h / fh) / (s.z || 1));
  }
  function preflight(b) {
    var out = [], n = 0;
    function add(cat, sev, sp, slot, text, fix, fixLabel) { out.push({ id: 'i' + (n++), cat: cat, sev: sev, sp: sp, slot: slot, text: text, fix: fix || '', fixLabel: fixLabel || '' }); }
    var seen = {};
    b.spreads.forEach(function (sp, si) {
      sp.slots.forEach(function (s, i) {
        var where = 'Spread ' + (si + 1) + ', frame ' + (i + 1);
        if (!s.p) { add('Photos', 'warn', si, i, where + ' is empty and would print as a blank box.', 'fill', 'Fill with next unused photo'); return; }
        var ph = photoById(s.p), d = dpi(sp, i);
        if (b.hidden[s.p]) add('Photos', 'bad', si, i, where + ' uses a photo you removed from the library.', 'remove', 'Remove photo');
        if (d < 150) add('Photos', 'bad', si, i, where + ': ' + (ph ? ph.name : 'photo') + ' is only ' + d + ' dpi at this size and will print soft.', 'remove', 'Remove photo');
        else if (d < 200) add('Photos', 'warn', si, i, where + ': ' + (ph ? ph.name : 'photo') + ' is ' + d + ' dpi. Fine for small frames, soft on large ones.', 'jump', 'Open spread');
        if (s.z > 2.4) add('Photos', 'warn', si, i, where + ' is zoomed to ' + Math.round(s.z * 100) + '%. Heavy cropping lowers print quality.', 'resetZoom', 'Reset zoom');
        if (seen[s.p]) add('Photos', 'warn', si, i, where + ' repeats a photo already used on spread ' + seen[s.p] + '.', 'jump', 'Open spread');
        seen[s.p] = si + 1;
      });
      sp.caps.forEach(function (t, side) {
        var lim = (side === 0 ? lay(sp).textL : lay(sp).textR) ? 240 : 90;
        if (t.length > lim) add('Text', 'bad', si, null, 'Spread ' + (si + 1) + ': the ' + (side ? 'right' : 'left') + ' text is ' + t.length + ' characters. ' + lim + ' fit inside the safe area.', 'trim:' + side, 'Shorten to fit');
        if (/ {2,}/.test(t)) add('Text', 'warn', si, null, 'Spread ' + (si + 1) + ' has a double space in the ' + (side ? 'right' : 'left') + ' text.', 'jump', 'Open spread');
      });
      [0, 1].forEach(function (side) { if ((side ? lay(sp).textR : lay(sp).textL) && !sp.caps[side].trim()) add('Text', 'warn', si, null, 'Spread ' + (si + 1) + ': the ' + (side ? 'right' : 'left') + ' page is a story page with no story yet.', 'jump', 'Open spread'); });
    });
    var pages = b.spreads.length * 2;
    if (pages > b.pagesTotal) add('Book', 'bad', null, null, 'You have designed ' + pages + ' pages but ordered ' + b.pagesTotal + '. Delete a spread or add pages to the order.', '', '');
    else if (pages < b.pagesTotal) add('Book', 'warn', null, null, pages + ' of ' + b.pagesTotal + ' pages designed. The rest print blank unless you add spreads.', 'addSpread', 'Add a spread');
    var cv = b.coverDesign;
    if (!cv.title.trim()) add('Cover', 'bad', null, null, 'The cover has no title.', '', '');
    if (cv.title.length > 28) add('Cover', 'warn', null, null, 'The cover title is ' + cv.title.length + ' characters. Long titles shrink to fit on the spine.', '', '');
    var open = b.comments.filter(function (c) { return !c.done; }).length;
    if (open) add('Review', 'warn', null, null, open + ' comment' + (open === 1 ? '' : 's') + ' not marked fixed.', '', '');
    var bad = out.filter(function (x) { return x.sev === 'bad'; }).length, warn = out.length - bad;
    var score = Math.max(0, 100 - bad * 12 - warn * 4);
    return { issues: out, bad: bad, warn: warn, score: score, ready: bad === 0, checked: Object.keys(LAY).length };
  }

  /* ---------- compare two versions ---------- */
  function sameSpread(a, c) { return JSON.stringify([a.lay, a.slots, a.caps]) === JSON.stringify([c.lay, c.slots, c.caps]); }
  function diff(older, newer) {
    var oid = {}, nid = {}, rows = [];
    older.forEach(function (s, i) { oid[s.id] = i; });
    newer.forEach(function (s, i) { nid[s.id] = i; });
    newer.forEach(function (s, i) {
      if (oid[s.id] == null) { rows.push({ kind: 'added', n: i + 1, text: 'Spread ' + (i + 1) + ' is new' }); return; }
      var o = older[oid[s.id]], parts = [];
      if (lay(o).name !== lay(s).name) parts.push('layout ' + lay(o).name + ' → ' + lay(s).name);
      var op = o.slots.map(function (t) { return t.p; }).join(), np = s.slots.map(function (t) { return t.p; }).join();
      if (op !== np) parts.push('photos changed');
      else if (JSON.stringify(o.slots) !== JSON.stringify(s.slots)) parts.push('photo crop or brightness changed');
      if (o.caps.join('|') !== s.caps.join('|')) parts.push('text changed');
      if (parts.length) rows.push({ kind: 'changed', n: i + 1, text: 'Spread ' + (i + 1) + ': ' + parts.join(', ') });
      else if (oid[s.id] !== i) rows.push({ kind: 'moved', n: i + 1, text: 'Spread ' + (i + 1) + ' moved (was ' + (oid[s.id] + 1) + ')' });
    });
    older.forEach(function (s, i) { if (nid[s.id] == null) rows.push({ kind: 'removed', n: i + 1, text: 'Old spread ' + (i + 1) + ' was removed' }); });
    return rows;
  }

  /* ---------- text: every caption in reading order, plus a small proof-reader ---------- */
  function textItems(b) {
    var out = [];
    b.spreads.forEach(function (sp, si) {
      var L = lay(sp);
      [0, 1].forEach(function (side) {
        var story = side ? L.textR : L.textL;
        out.push({ key: si + ':' + side, sp: si, side: side, story: story, limit: story ? 240 : 90, text: sp.caps[side] || '',
          label: 'Spread ' + (si + 1) + ' · ' + (story ? (side ? 'right page story' : 'story') : (side ? 'right page' : 'left page')) });
      });
    });
    return out;
  }
  function proof(text) {
    var out = [], t = text || '';
    if (/ {2,}/.test(t)) out.push({ id: 'dbl', msg: 'Double space', fix: function (s) { return s.replace(/ {2,}/g, ' '); } });
    if (/\b(\w+)\s+\1\b/i.test(t.replace(/[.,]/g, ''))) out.push({ id: 'rep', msg: 'Repeated word', fix: function (s) { return s.replace(/\b(\w+)\s+\1\b/gi, '$1'); } });
    if (t && /^[a-z]/.test(t.trim())) out.push({ id: 'cap', msg: 'Starts with a lower-case letter', fix: function (s) { return s.replace(/^\s*([a-z])/, function (m, c) { return c.toUpperCase(); }); } });
    if (/\s[,.;:!?]/.test(t)) out.push({ id: 'sp', msg: 'Space before punctuation', fix: function (s) { return s.replace(/\s+([,.;:!?])/g, '$1'); } });
    if (/\.\.\.(?!\.)/.test(t)) out.push({ id: 'dots', msg: 'Three dots instead of …', fix: function (s) { return s.replace(/\.\.\./g, '…'); } });
    return out;
  }
  function csv(b) {
    var rows = [['spread', 'page side', 'text']];
    textItems(b).forEach(function (x) { rows.push([x.sp + 1, x.story ? 'story' : (x.side ? 'right' : 'left'), x.text]); });
    return rows.map(function (r) { return r.map(function (c) { return '"' + String(c).replace(/"/g, '""') + '"'; }).join(','); }).join('\r\n');
  }

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
    KEY: KEY, load: load, save: save, reset: reset, layouts: layouts, layout: function (id) { return LAY[id]; }, lay: lay, pageLayouts: pageLayouts, pageLayout: function (id) { return PL[id]; }, slotCls: slotCls, cellsFor: cellsFor, photos: photos, photoById: photoById,
    ops: ops, stats: stats, usedMap: usedMap, History: History, timeLabel: timeLabel, ago: ago, clone: clone,
    themes: THEMES, fonts: FONTS, coverColours: COVER_COLOURS, foils: FOILS, defaults: { style: DEFAULT_STYLE, cover: DEFAULT_COVER },
    library: visible, inLibrary: inLibrary, isStar: isStar, dpi: dpi, preflight: preflight, diff: diff, textItems: textItems, proof: proof, csv: csv, base: BASE
  };
})();
