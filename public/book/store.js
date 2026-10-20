/* Miles Retold · the live book editor, data layer. One document shared by the customer and the studio side.
   - The book lives in localStorage ('miles.book.v1'); both sides open the same page, so a change on one shows on the other (storage event).
   - Photos live in IndexedDB (a phone photo is too big for localStorage). The book only keeps their ids and names.
   - Items on a page are free-form: every photo and text box has its own x, y, width, rotation. Coordinates are percentages of the page, so a page
     looks the same at any size (thumbnail, spread, full screen).
   Nothing here talks to a server: this is the prototype of the editor, the data would move to the backend later. */
(function () {
  'use strict';
  var KEY = 'miles.book.v1', DB = 'miles-book', ST = 'photos';
  var SAMPLE = ['1bebe18032c3ba7f722debbe5fa70f36', 'd79cb5916bf021b810ad3e0168beec13', '6dc6964be6ca87733a870c819d870936', '40f21930485ef5903566224ed85a9273', '44c3ed2b417e619b81afb56289c69c25', 'd4b2aafa1f1446ed8701326e3284b455', '3936155b1de2d6f9d237753228c056d0', '6b43c91be8c10d0cbed5dc2520dde00d', '8384abb23ebdfeb24e7152bf3fdd1a9b', 'b305aa7d0c1ed679fe60219a9e088e10', '2523c5562a95c13a7e6113539f573d2d', 'ae8f12954b4a72155451fa4ddff588b7'];
  var SAMPLE_NAMES = ['Jetty at sunset', 'Reef from above', 'Morning swim', 'Breakfast on the deck', 'Sandbank', 'Dhoni ride', 'Palm shade', 'Night sky', 'Market lane', 'Sisters at the pier', 'Blue hour', 'Last evening'];
  var COLORS = ['#fffcf6', '#f1e7d8', '#e8d5c0', '#f4c9b8', '#d9e4d4', '#bcd4de', '#12342b', '#1f4d5f', '#3b2f2a', '#7a2e2e', '#2b2b2b', '#ffffff'];
  var uid = function (p) { return (p || 'i') + Math.random().toString(36).slice(2, 9); };
  var clone = function (o) { return JSON.parse(JSON.stringify(o)); };

  /* ------------------------------------------------------------ colour helpers */
  function lum(hex) {
    var h = (hex || '#ffffff').replace('#', ''); if (h.length === 3) h = h.replace(/(.)/g, '$1$1');
    var c = [0, 2, 4].map(function (i) { var v = parseInt(h.substr(i, 2), 16) / 255; return v <= .03928 ? v / 12.92 : Math.pow((v + .055) / 1.055, 2.4); });
    return .2126 * c[0] + .7152 * c[1] + .0722 * c[2];
  }
  var ink = function (bg) { return lum(bg) > .42 ? '#12342b' : '#fffcf6'; };

  /* ------------------------------------------------------------ layouts: where things start; everything can be moved afterwards */
  var T = function (x, y, w, text, size, o) { return Object.assign({ t: 'text', x: x, y: y, w: w, h: 0, text: text, size: size, align: 'center', font: 'Fraunces', weight: 400 }, o || {}); };
  var P = function (x, y, w, h) { return { t: 'img', x: x, y: y, w: w, h: h }; };
  var LAYOUTS = {
    cover: [
      { id: 'c-photo', name: 'Full photo', items: [P(0, 0, 100, 100), T(8, 70, 84, '{title}', 10, { color: '#ffffff', shadow: 1, weight: 500 }), T(8, 86, 84, '{sub}', 4.4, { color: '#ffffff', shadow: 1, font: 'Manrope' })] },
      { id: 'c-frame', name: 'Framed photo', items: [P(12, 10, 76, 58), T(8, 73, 84, '{title}', 9), T(8, 87, 84, '{sub}', 4, { font: 'Manrope' })] },
      { id: 'c-split', name: 'Photo and title', items: [P(0, 0, 100, 62), T(8, 68, 84, '{title}', 10), T(8, 85, 84, '{sub}', 4.2, { font: 'Manrope' })] },
      { id: 'c-title', name: 'Title only', items: [T(8, 38, 84, '{title}', 13), T(8, 62, 84, '{sub}', 4.6, { font: 'Manrope' })] }
    ],
    page: [
      { id: 'p-blank', name: 'Blank', items: [] },
      { id: 'p-full', name: 'Full photo', items: [P(0, 0, 100, 100)] },
      { id: 'p-cap', name: 'Photo and caption', items: [P(8, 8, 84, 70), T(8, 83, 84, 'Write a caption', 3.6, { font: 'Manrope' })] },
      { id: 'p-two', name: 'Two photos', items: [P(8, 6, 84, 42), P(8, 52, 84, 42)] },
      { id: 'p-three', name: 'Three photos', items: [P(8, 6, 84, 44), P(8, 54, 40, 40), P(52, 54, 40, 40)] },
      { id: 'p-four', name: 'Four photos', items: [P(6, 6, 41, 41), P(53, 6, 41, 41), P(6, 53, 41, 41), P(53, 53, 41, 41)] },
      { id: 'p-story', name: 'Photo and story', items: [P(8, 8, 84, 40), T(8, 54, 84, 'Our story', 6, { align: 'left' }), T(8, 66, 84, 'Tell the story of this day in your own words.', 3.4, { align: 'left', font: 'Manrope' })] },
      { id: 'p-text', name: 'Words only', items: [T(10, 12, 80, 'A title', 8, { align: 'left' }), T(10, 28, 80, 'Write here. Drag this box anywhere, make it wider or narrower, turn it, or change the font.', 3.6, { align: 'left', font: 'Manrope' })] }
    ],
    spread: [   /* one photo across both pages, no break in the middle */
      { id: 's-full', name: 'Full bleed, both pages', span: { x: 0, y: 0, w: 100, h: 100 } },
      { id: 's-wide', name: 'Panorama', span: { x: 0, y: 26, w: 100, h: 48 } },
      { id: 's-frame', name: 'Framed, both pages', span: { x: 7, y: 8, w: 86, h: 84 } }
    ],
    back: [
      { id: 'b-blank', name: 'Blank', items: [] },
      { id: 'b-note', name: 'A note', items: [T(15, 42, 70, 'Made with love for the people in these pages.', 4.2, { font: 'Fraunces' }), T(15, 88, 70, 'Miles Retold', 3, { font: 'Manrope', weight: 700 })] },
      { id: 'b-photo', name: 'Small photo', items: [P(30, 28, 40, 40), T(15, 76, 70, '{title}', 4.6)] }
    ]
  };
  var kindOf = function (doc, i) { return i === 0 ? 'cover' : (i === doc.pages.length - 1 ? 'back' : 'page'); };
  function slotsOf(lay) { return lay.span ? 1 : lay.items.filter(function (x) { return x.t === 'img'; }).length; }
  function spanItem(lay, gid) { var a = lay.span; return { id: uid('t'), t: 'img', x: a.x, y: a.y, w: a.w, h: a.h, gid: gid || null, fit: 'cover', r: 0, shape: 'rect', frame: 'none', zoom: 1, fx: 50, fy: 50 }; }
  function buildItems(doc, lay, bg, photoIds) {
    var col = ink(bg), n = 0;
    return lay.items.map(function (s) {
      var it = clone(s); it.id = uid('t');
      if (it.t === 'img') { it.gid = (photoIds && photoIds[n]) || null; n++; it.fit = 'cover'; it.r = 0; it.shape = 'rect'; it.frame = 'none'; it.zoom = 1; it.fx = 50; it.fy = 50; }
      else {
        it.text = String(it.text).replace('{title}', doc.title || 'Your title').replace('{sub}', doc.sub || '');
        if (!it.color) it.color = col; it.r = 0;
      }
      return it;
    }).filter(function (it) { return !(it.t === 'text' && it.text === ''); });
  }

  /* ------------------------------------------------------------ the document */
  function newDoc(pageCount) {
    var n = pageCount || 40, pages = [];
    for (var i = 0; i < n + 2; i++) pages.push({ id: uid('p'), bg: i === 0 ? '#12342b' : '#fffcf6', items: [], doodle: [], layout: '', done: false });
    return { v: 1, order: 'MR-1042', customer: 'Sara', title: '', sub: '', dedication: '', author: '', ratio: 0.8, inches: 8, count: n, setup: 0, pages: pages, gallery: [], spans: {}, deleted: [], notes: [], status: 'draft', rev: { n: 0, by: 'customer', t: 0 } };
  }
  function resize(doc, n) {   /* change the number of inner pages; keeps the back cover last */
    var back = doc.pages.pop();
    while (doc.pages.length - 1 < n) doc.pages.push({ id: uid('p'), bg: '#fffcf6', items: [], doodle: [], layout: '', done: false });
    while (doc.pages.length - 1 > n) doc.pages.pop();
    doc.pages.push(back); doc.count = n;
    Object.keys(doc.spans || {}).forEach(function (k) { if (+k > n / 2) delete doc.spans[k]; });
    return doc;
  }
  var spreadCount = function (doc) { return doc.count / 2 + 2; };
  function spreadPages(doc, s) {   /* cover and back cover are shown alone: the book is closed */
    var last = spreadCount(doc) - 1;
    if (s <= 0) return { l: null, r: 0 };
    if (s >= last) return { l: doc.pages.length - 1, r: null };
    return { l: 2 * s - 1, r: 2 * s };
  }
  var spreadOf = function (doc, i) { var last = spreadCount(doc) - 1; return i <= 0 ? 0 : (i >= doc.pages.length - 1 ? last : Math.ceil(i / 2)); };
  var pageLabel = function (doc, i) { return i === 0 ? 'Cover' : (i === doc.pages.length - 1 ? 'Back cover' : 'Page ' + i); };

  /* ------------------------------------------------------------ persistence (+ other tab) */
  var who = 'customer', listeners = [];
  function read() {
    try {
      var s = localStorage.getItem(KEY), d = s ? JSON.parse(s) : null;
      if (d) { d.spans = d.spans || {}; d.deleted = d.deleted || []; d.pages.forEach(function (p) { p.doodle = p.doodle || []; }); }
      return d;
    } catch (e) { return null; }
  }
  function write(doc) {
    doc.rev = { n: (doc.rev && doc.rev.n || 0) + 1, by: who, t: Date.now() };
    try { localStorage.setItem(KEY, JSON.stringify(doc)); return true; } catch (e) { return false; }
  }
  window.addEventListener('storage', function (e) { if (e.key === KEY && e.newValue) { try { var d = JSON.parse(e.newValue); d.spans = d.spans || {}; d.deleted = d.deleted || []; d.pages.forEach(function (p) { p.doodle = p.doodle || []; }); listeners.forEach(function (f) { f(d); }); } catch (x) {} } });

  /* ------------------------------------------------------------ photos in IndexedDB */
  var dbp = null, urls = {};
  function db() {
    if (dbp) return dbp;
    dbp = new Promise(function (res, rej) {
      if (!window.indexedDB) return rej(new Error('no idb'));
      var r = indexedDB.open(DB, 1);
      r.onupgradeneeded = function () { r.result.createObjectStore(ST, { keyPath: 'id' }); };
      r.onsuccess = function () { res(r.result); }; r.onerror = function () { rej(r.error); };
    });
    return dbp;
  }
  function tx(mode, fn) { return db().then(function (d) { return new Promise(function (res, rej) { var t = d.transaction(ST, mode), s = t.objectStore(ST), r = fn(s); t.oncomplete = function () { res(r && r.result); }; t.onerror = function () { rej(t.error); }; }); }); }
  var putBlob = function (rec) { return tx('readwrite', function (s) { return s.put(rec); }); };
  var getBlob = function (id) { return tx('readonly', function (s) { return s.get(id); }); };
  var delBlob = function (id) { return tx('readwrite', function (s) { return s.delete(id); }); };
  function url(g) {   /* the address to show a gallery photo from */
    if (!g) return '';
    if (g.src) return g.src;
    return urls[g.id] || '';
  }
  function loadUrls(doc) {   /* turn stored blobs into object urls, once */
    return Promise.all(doc.gallery.filter(function (g) { return !g.src && !urls[g.id]; }).map(function (g) {
      return getBlob(g.id).then(function (rec) { if (rec && rec.blob) urls[g.id] = URL.createObjectURL(rec.blob); }).catch(function () {});
    }));
  }
  function blobOf(g) {   /* the photo as a file, to download a copy */
    if (g.src) return fetch(g.src).then(function (r) { return r.blob(); });
    return getBlob(g.id).then(function (rec) { return rec && rec.blob; });
  }
  function importFile(file) {   /* shrink to a print-friendly size, keep the original name */
    return new Promise(function (resolve, reject) {
      var u = URL.createObjectURL(file), im = new Image();
      im.onload = function () {
        var max = 2400, k = Math.min(1, max / Math.max(im.naturalWidth, im.naturalHeight)), w = Math.round(im.naturalWidth * k), h = Math.round(im.naturalHeight * k);
        var c = document.createElement('canvas'); c.width = w; c.height = h; c.getContext('2d').drawImage(im, 0, 0, w, h);
        c.toBlob(function (blob) {
          URL.revokeObjectURL(u);
          if (!blob) return reject(new Error('could not read'));
          var id = uid('g'); urls[id] = URL.createObjectURL(blob);
          putBlob({ id: id, blob: blob }).then(function () { resolve({ id: id, name: file.name.replace(/\.[^.]+$/, ''), w: im.naturalWidth, h: im.naturalHeight, fav: false, t: Date.now() }); }, reject);
        }, 'image/jpeg', .86);
      };
      im.onerror = function () { URL.revokeObjectURL(u); reject(new Error('not an image')); };
      im.src = u;
    });
  }
  function samples() { return SAMPLE.map(function (h, i) { return { id: 's' + h.slice(0, 6), name: SAMPLE_NAMES[i], w: 4032, h: 3024, fav: false, src: '/_blob/' + h, sample: true, t: Date.now() }; }); }

  /* ------------------------------------------------------------ the review the studio does (and the customer can see) */
  function review(doc) {
    var out = { empty: [], soft: [], missing: [], notDone: 0 };
    doc.pages.forEach(function (p, i) {
      if (!p.items.length && !(p.doodle && p.doodle.length) && !(i > 0 && i < doc.pages.length - 1 && (doc.spans[Math.ceil(i / 2)] || []).length)) out.empty.push(i);
      if (!p.done) out.notDone++;
      p.items.forEach(function (it) {
        if (it.t !== 'img') return;
        if (!it.gid) { out.missing.push(i); return; }
        var g = doc.gallery.filter(function (x) { return x.id === it.gid; })[0];
        if (g && g.w) { var dpi = g.w / ((it.w / 100) * doc.inches); if (dpi < 150) out.soft.push({ page: i, dpi: Math.round(dpi), name: g.name }); }
      });
    });
    Object.keys(doc.spans || {}).forEach(function (k) {
      (doc.spans[k] || []).forEach(function (it) {
        var pg = k * 2 - 1;
        if (!it.gid) { out.missing.push(pg); return; }
        var g = doc.gallery.filter(function (x) { return x.id === it.gid; })[0];
        if (g && g.w) { var dpi = g.w / ((it.w / 100) * doc.inches * 2); if (dpi < 150) out.soft.push({ page: pg, dpi: Math.round(dpi), name: g.name }); }
      });
    });
    return out;
  }

  window.MilesBook = {
    KEY: KEY, COLORS: COLORS, LAYOUTS: LAYOUTS, uid: uid, clone: clone, ink: ink, lum: lum,
    newDoc: newDoc, resize: resize, buildItems: buildItems, slotsOf: slotsOf, spanItem: spanItem, kindOf: kindOf,
    spreadCount: spreadCount, spreadPages: spreadPages, spreadOf: spreadOf, pageLabel: pageLabel,
    read: read, write: write, setWho: function (w) { who = w; }, onRemote: function (f) { listeners.push(f); },
    importFile: importFile, blobOf: blobOf, samples: samples, url: url, loadUrls: loadUrls, delBlob: delBlob, review: review
  };
})();
