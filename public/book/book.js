/* Miles Retold · the live book editor (one editor, used by the customer and by the studio).
   Open it as /book/editor.html?as=customer or ?as=studio. Both sides edit the same book (see store.js).
   One job per screen: how many pages -> title and caption -> your photos -> design the book, two pages at a time:
   tap a page, pick a colour and a layout in one popup, pick photos in the next, save, turn the page.
   Everything on a page is free-form: photos and text boxes can be dragged anywhere, resized and turned. */
(function () {
  'use strict';
  var B = window.MilesBook;
  var q = new URLSearchParams(location.search);
  var ROLE = q.get('as') === 'studio' ? 'studio' : 'customer';
  B.setWho(ROLE);

  var S = { doc: null, screen: 'design', si: 0, ap: 0, sel: null, editing: null, turning: false, sheet: null, undo: [], redo: [], snap: '', saved: '', compact: false, flow: null, picks: [], tab: 'all' };
  var app = document.getElementById('app');
  var clamp = function (v, a, b) { return Math.max(a, Math.min(b, v)); };
  var reduce = function () { return matchMedia('(prefers-reduced-motion: reduce)').matches; };
  var toast = function (m, o) { return window.MilesUI ? window.MilesUI.toast(m, o) : function () {}; };

  /* ------------------------------------------------------------ tiny DOM helper */
  function h(tag, a) {
    var el = document.createElement(tag), kids = [].slice.call(arguments, 2);
    for (var k in (a || {})) {
      var v = a[k]; if (v == null || v === false) continue;
      if (k === 'class') el.className = v; else if (k === 'style' && typeof v === 'object') { for (var sk in v) { if (sk.slice(0, 2) === '--') el.style.setProperty(sk, v[sk]); else el.style[sk] = v[sk]; } }
      else if (k.slice(0, 2) === 'on') el.addEventListener(k.slice(2), v);
      else if (k === 'html') el.innerHTML = v; else if (v === true) el.setAttribute(k, ''); else el.setAttribute(k, v);
    }
    (function add(list) { list.forEach(function (c) { if (c == null || c === false) return; if (Array.isArray(c)) return add(c); el.appendChild(c.nodeType ? c : document.createTextNode(c)); }); })(kids);
    return el;
  }
  var ICON = {
    back: '<path d="M15 6l-6 6 6 6"/>', next: '<path d="M9 6l6 6-6 6"/>', undo: '<path d="M9 14L4 9l5-5M4 9h10a6 6 0 0 1 0 12h-3"/>', redo: '<path d="M15 14l5-5-5-5M20 9H10a6 6 0 0 0 0 12h3"/>',
    grid: '<rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/>',
    photo: '<rect x="3" y="5" width="18" height="14" rx="2"/><circle cx="9" cy="10" r="1.8"/><path d="M4 18l5-5 4 4 3-3 4 4"/>', text: '<path d="M5 6V4h14v2M12 4v16M9 20h6"/>', palette: '<path d="M12 3a9 9 0 1 0 0 18c1.500 0 2-1 1.500-2s0-2 1.500-2h2a3 3 0 0 0 3-3A9 9 0 0 0 12 3z"/><circle cx="7.500" cy="11" r="1"/><circle cx="10" cy="7" r="1"/><circle cx="15" cy="7" r="1"/>',
    trash: '<path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13"/>', copy: '<rect x="8" y="8" width="12" height="12" rx="2"/><path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2"/>', tick: '<path d="M5 12.500l4.500 4.500L19 7.500"/>', plus: '<path d="M12 5v14M5 12h14"/>',
    send: '<path d="M21 3L10 14M21 3l-7 18-4-7-7-4z"/>', star: '<path d="M12 3l2.700 5.600 6.100.8-4.500 4.200 1.100 6.100L12 16.800 6.600 19.700l1.100-6.100L3.200 9.400l6.100-.8z"/>', note: '<path d="M4 5h16v11H9l-5 4z"/>', gear: '<circle cx="12" cy="12" r="3"/><path d="M12 3v3M12 18v3M3 12h3M18 12h3M5.600 5.600l2.100 2.100M16.300 16.300l2.100 2.100M5.600 18.400l2.100-2.100M16.300 7.700l2.100-2.100"/>',
    up: '<path d="M6 15l6-6 6 6"/>', down: '<path d="M6 9l6 6 6-6"/>', alignL: '<path d="M4 6h16M4 10h10M4 14h16M4 18h10"/>', alignC: '<path d="M4 6h16M7 10h10M4 14h16M7 18h10"/>', alignR: '<path d="M4 6h16M10 10h10M4 14h16M10 18h10"/>', sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2.500v2M12 19.500v2M4.600 4.600L6 6M18 18l1.400 1.400M2.500 12h2M19.500 12h2M4.600 19.400L6 18M18 6l1.400-1.400"/>', moon: '<path d="M20 14.500A8 8 0 0 1 9.500 4a8 8 0 1 0 10.500 10.500z"/>', edit: '<path d="M4 20h4L19 9l-4-4L4 16z"/>', check: '<path d="M5 12.500l4.500 4.500L19 7.500"/>', close: '<path d="M6 6l12 12M18 6L6 18"/>'
  };
  var ic = function (n, s) { return h('span', { class: 'ico', 'aria-hidden': 'true', html: '<svg width="' + (s || 20) + '" height="' + (s || 20) + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round">' + (ICON[n] || '').replace(/(\d)\.(\d)00\b/g, '$1.$2') + '</svg>' }); };
  var btn = function (label, on, o) { o = o || {}; return h('button', { type: 'button', class: 'bt' + (o.cls ? ' ' + o.cls : ''), onclick: on, 'aria-label': o.aria || null, title: o.title || o.aria || null, disabled: o.dis, 'aria-pressed': o.pressed == null ? null : String(!!o.pressed) }, o.icon ? ic(o.icon) : null, label ? h('span', null, label) : null); };

  /* ------------------------------------------------------------ document: save, history, sync */
  function persist(label) {
    var s = JSON.stringify(S.doc);
    if (label !== false) { if (S.snap && S.snap !== s) { S.undo.push(S.snap); if (S.undo.length > 60) S.undo.shift(); S.redo = []; } S.snap = s; }
    var ok = B.write(S.doc); S.saved = ok ? 'Saved just now' : 'Could not save (storage is full)';
    var el = document.getElementById('savedat'); if (el) el.textContent = S.saved;
  }
  function restore(from, to) {
    if (!from.length) return;
    to.push(JSON.stringify(S.doc)); S.doc = JSON.parse(from.pop()); S.snap = JSON.stringify(S.doc); S.sel = null;
    clampView(); B.write(S.doc); render();
  }
  function clampView() { var n = B.spreadCount(S.doc); S.si = clamp(S.si, 0, n - 1); S.ap = clamp(S.ap, 0, S.doc.pages.length - 1); }
  B.onRemote(function (d) {
    if (S.editing || S.dragging || S.flow) { S.pending = d; return; }
    applyRemote(d);
  });
  function applyRemote(d) {
    S.pending = null; var by = d.rev && d.rev.by;
    S.doc = d; S.snap = JSON.stringify(d); S.sel = null; clampView();
    B.loadUrls(d).then(function () { render(); }); render();
    if (by && by !== ROLE) toast((by === 'studio' ? 'The studio' : 'The customer') + ' just changed this book');
  }
  function status() { return { draft: 'Draft', sent: 'Sent to the studio', changes: 'Studio asked for changes', ready: 'Ready for print' }[S.doc.status] || 'Draft'; }

  /* ------------------------------------------------------------ page rendering (the same for the editor, the 3D turn and thumbnails) */
  var FONT = { Fraunces: 'Fraunces, Georgia, serif', Manrope: 'Manrope, Arial, sans-serif', Classic: 'Georgia, "Times New Roman", serif', Typewriter: '"Courier New", Courier, monospace', Handwritten: '"Brush Script MT", "Segoe Script", cursive' };
  var FONTS = Object.keys(FONT);
  var PLACE = function (id) { var n = 0; for (var i = 0; i < id.length; i++) n += id.charCodeAt(i); var a = n % 360; return 'data:image/svg+xml,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="hsl(' + a + ',45%,72%)"/><stop offset="1" stop-color="hsl(' + ((a + 50) % 360) + ',50%,45%)"/></linearGradient></defs><rect width="400" height="300" fill="url(#g)"/></svg>'); };
  function gal(id) { return S.doc.gallery.filter(function (g) { return g.id === id; })[0]; }
  function itemStyle(it) {
    var s = 'left:' + it.x + '%;top:' + it.y + '%;width:' + it.w + '%;transform:rotate(' + (it.r || 0) + 'deg);';
    if (it.t === 'img') s += 'height:' + it.h + '%;';
    return s;
  }
  function itemEl(it, pi, live) {
    var el, isSel = live && S.sel === it.id;
    if (it.t === 'img') {
      var g = gal(it.gid), src = g ? B.url(g) : '';
      el = h('div', { class: 'it it-img' + (it.gid ? '' : ' empty'), 'data-id': it.id, 'data-p': pi, style: itemStyle(it), tabindex: live ? '0' : '-1', role: live ? 'group' : null, 'aria-label': live ? (g ? 'Photo: ' + g.name : 'Empty photo spot, press Enter to choose a photo') : null });
      if (src) {
        var im = h('img', { src: src, alt: '', draggable: 'false', style: { objectFit: it.fit === 'contain' ? 'contain' : 'cover', objectPosition: (it.fx == null ? 50 : it.fx) + '% ' + (it.fy == null ? 50 : it.fy) + '%' } });
        im.addEventListener('error', function () { im.src = PLACE(it.gid); }, { once: true });
        el.appendChild(im);
      } else el.appendChild(h('span', { class: 'ph' }, ic('plus', 22), live ? h('b', null, 'Add photo') : null));
    } else {
      var editing = live && S.editing === it.id;
      el = h('div', { class: 'it it-text' + (editing ? ' editing' : ''), 'data-id': it.id, 'data-p': pi, tabindex: live ? '0' : '-1', role: live ? 'group' : null, 'aria-label': live ? 'Text box, press Enter to edit' : null,
        style: itemStyle(it) + 'font-size:' + it.size + 'cqw;color:' + it.color + ';text-align:' + (it.align || 'center') + ';font-family:' + (FONT[it.font] || FONT.Fraunces) + ';font-weight:' + (it.bold ? 700 : (it.weight || 400)) + ';font-style:' + (it.italic ? 'italic' : 'normal') + (it.shadow ? ';text-shadow:0 .1em .4em rgba(0,0,0,.45)' : '') });
      var tx = h('div', { class: 'tx' }, it.text);
      if (editing) { tx.setAttribute('contenteditable', 'plaintext-only'); if (tx.contentEditable !== 'plaintext-only') tx.setAttribute('contenteditable', 'true'); tx.setAttribute('aria-label', 'Edit text'); }
      el.appendChild(tx);
    }
    if (isSel && !(it.t === 'text' && S.editing === it.id)) {
      ['nw', 'ne', 'sw', 'se'].concat(it.t === 'text' ? ['w', 'e'] : []).forEach(function (k) { el.appendChild(h('i', { class: 'hd ' + k, 'data-h': k })); });
      el.appendChild(h('i', { class: 'hd rot', 'data-h': 'rot', title: 'Turn' }));
      el.classList.add('is-sel');
    }
    return el;
  }
  function pageEl(i, live) {
    var p = S.doc.pages[i];
    var el = h('div', { class: 'bpg' + (live && S.ap === i ? ' is-active' : ''), 'data-i': i, style: { background: p.bg, color: B.ink(p.bg) } });
    var c = h('div', { class: 'pgc' }); el.appendChild(c);
    p.items.forEach(function (it) { c.appendChild(itemEl(it, i, live)); });
    if (live && !p.layout && !p.items.length) c.appendChild(h('button', { type: 'button', class: 'cta', 'data-act': 'flow', 'data-p': i }, ic('palette', 22), h('b', null, 'Design ' + (i === 0 ? 'the cover' : (i === S.doc.pages.length - 1 ? 'the back cover' : 'this page'))), h('small', null, 'Colour, layout, photos')));
    return el;
  }

  /* ------------------------------------------------------------ chrome */
  function topbar(wizard) {
    var d = S.doc, back = ROLE === 'studio' ? '/GL30-Studio.dc.html' : '/GL9-Account.dc.html';
    try { var pref = localStorage.getItem('miles.theme') || 'light'; back = (ROLE === 'studio' ? '/' + (pref === 'dark' ? 'G' : 'GL') + '30-Studio.dc.html' : '/' + (pref === 'dark' ? 'G' : 'GL') + '9-Account.dc.html'); } catch (e) {}
    var theme = document.documentElement.dataset.theme;
    return h('header', { class: 'top' },
      h('a', { class: 'bt ghost', href: back, 'aria-label': ROLE === 'studio' ? 'Back to the studio' : 'Back to my account' }, ic('back'), h('span', { class: 'hide-s' }, ROLE === 'studio' ? 'Studio' : 'My account')),
      h('div', { class: 'ttl' }, h('b', null, d.title || 'My book'), h('small', null, (ROLE === 'studio' ? 'Studio view · ' + d.customer + ' · ' : '') + 'Order ' + d.order + (wizard ? '' : ' · ' + d.count + ' pages'))),
      !wizard ? h('span', { class: 'chip st-' + d.status }, status()) : null,
      !wizard ? h('span', { id: 'savedat', class: 'saved hide-s', 'aria-live': 'polite' }, S.saved) : null,
      h('div', { class: 'sp' }),
      !wizard ? h('div', { class: 'tt' }, btn('', function () { restore(S.undo, S.redo); }, { icon: 'undo', aria: 'Undo', dis: !S.undo.length, cls: 'sq' }), btn('', function () { restore(S.redo, S.undo); }, { icon: 'redo', aria: 'Redo', dis: !S.redo.length, cls: 'sq' }),
        btn('Overview', function () { openSheet('overview'); }, { icon: 'grid' }), btn('Photos', function () { openSheet('gallery'); }, { icon: 'photo' }), btn('', function () { openSheet('notes'); }, { icon: 'note', aria: 'Notes', cls: 'sq' + (d.notes.length ? ' dot' : '') }), btn('', function () { openSheet('settings'); }, { icon: 'gear', aria: 'Book settings', cls: 'sq' }),
        btn('', function () { var t = theme === 'dark' ? 'light' : 'dark'; try { localStorage.setItem('miles.theme', t); } catch (e) {} setTheme(t); render(); }, { icon: theme === 'dark' ? 'sun' : 'moon', aria: theme === 'dark' ? 'Light theme' : 'Dark theme', cls: 'sq' })) : btn('', function () { var t = theme === 'dark' ? 'light' : 'dark'; try { localStorage.setItem('miles.theme', t); } catch (e) {} setTheme(t); render(); }, { icon: theme === 'dark' ? 'sun' : 'moon', aria: theme === 'dark' ? 'Light theme' : 'Dark theme', cls: 'sq' }),
      !wizard ? (ROLE === 'studio' ? h('button', { type: 'button', class: 'bt pri send', onclick: function () { openSheet('review'); } }, ic('tick'), h('span', null, 'Review')) : h('button', { type: 'button', class: 'bt pri send', onclick: sendToStudio }, ic('send'), h('span', { class: 'lbl-l' }, 'Send to the studio'), h('span', { class: 'lbl-s' }, 'Send'))) : null);
  }
  function setTheme(t) { document.documentElement.dataset.theme = t; document.documentElement.dataset.mui = t; }
  function banner() {
    var d = S.doc; if (d.status === 'draft') return null;
    var last = d.notes.slice().reverse().filter(function (n) { return n.by === 'studio'; })[0];
    var msg = d.status === 'sent' ? (ROLE === 'studio' ? d.customer + ' sent this book for a proof. Open Review to check it.' : 'Sent. The studio will check your book and write to you. You can keep editing; they see every change.')
      : d.status === 'changes' ? (ROLE === 'studio' ? 'You asked for changes. They show in Notes.' : 'The studio asked for changes' + (last ? ': “' + last.text + '”' : '.'))
        : (ROLE === 'studio' ? 'Marked ready for print.' : 'The studio marked your book ready for print. Thank you!');
    return h('p', { class: 'banner st-' + d.status, role: 'status' }, msg);
  }

  /* ------------------------------------------------------------ wizard screens */
  function wizardShell(step, title, lead, body, foot) {
    return h('div', { class: 'app wiz' }, topbar(true), h('main', { class: 'wz', id: 'main' },
      h('ol', { class: 'steps', 'aria-label': 'Steps' }, ['Pages', 'Title', 'Photos', 'Design'].map(function (t, i) { return h('li', { class: i + 1 === step ? 'now' : (i + 1 < step ? 'done' : ''), 'aria-current': i + 1 === step ? 'step' : null }, h('i', null, i + 1 < step ? ic('check', 14) : String(i + 1)), h('span', null, t)); })),
      h('h1', null, title), h('p', { class: 'lead' }, lead), body, h('div', { class: 'foot' }, foot)));
  }
  function screenPages() {
    var d = S.doc, counts = [20, 30, 40, 50, 60, 80], sel = d.count;
    var body = h('div', { class: 'opts', role: 'radiogroup', 'aria-label': 'Number of pages' }, counts.map(function (n) {
      return h('button', { type: 'button', class: 'opt' + (n === sel ? ' on' : ''), role: 'radio', 'aria-checked': String(n === sel), onclick: function () { if (S.doc.count !== n) B.resize(S.doc, n); persist(false); render(); } }, h('b', null, String(n)), h('small', null, n / 2 + ' spreads'), n === 40 ? h('em', null, 'Most chosen') : null);
    }));
    return wizardShell(1, 'How many pages?', 'Pages are inside the book, not counting the covers. You can change this later.', body,
      [h('span', { class: 'hint' }, sel + ' pages = ' + sel / 2 + ' spreads, plus the covers.'), btn('Next', function () { S.doc.setup = Math.max(S.doc.setup, 1); persist(false); S.screen = 'title'; render(); }, { cls: 'pri big', icon: 'next' })]);
  }
  function screenTitle() {
    var d = S.doc;
    var f = function (key, label, ph, area) { var inp = h(area ? 'textarea' : 'input', { id: 'f-' + key, value: d[key], placeholder: ph, maxlength: area ? 160 : 60, rows: area ? 2 : null, autocomplete: 'off', oninput: function () { d[key] = inp.value; var pv = document.getElementById('pv'); if (pv) pv.replaceWith(preview()); } }); inp.value = d[key] || ''; return h('label', { class: 'fld' }, h('span', null, label), inp); };
    var preview = function () { return h('div', { id: 'pv', class: 'cvp', 'aria-label': 'Cover preview' }, h('b', null, d.title || 'Your title'), h('small', null, d.sub || 'Your caption')); };
    var body = h('div', { class: 'two' }, h('div', { class: 'form' }, f('title', 'Book title', 'Maldives', false), f('sub', 'Caption under the title', 'March 2022 · two sisters, one island', false), f('dedication', 'Dedication (optional)', 'For Mama, who said yes to the trip', true), f('author', 'Your name on the back (optional)', 'Sara and Noor', false)), preview());
    return wizardShell(2, 'Name your book', 'These words go on the cover and the title page. You can change them any time.', body,
      [btn('Back', function () { S.screen = 'pages'; render(); }, { icon: 'back' }), btn('Next', function () { d.setup = Math.max(d.setup, 2); persist(false); S.screen = 'gallery'; render(); }, { cls: 'pri big', icon: 'next' })]);
  }
  function screenGallery() {
    var body = galleryBody(false);
    return wizardShell(3, 'Your photos', 'Add the photos you want to choose from. Everything stays private to you and the studio.', body,
      [btn('Back', function () { S.screen = 'title'; render(); }, { icon: 'back' }), h('span', { class: 'hint' }, S.doc.gallery.length + ' photos'), btn('Start designing', function () { S.doc.setup = 3; persist(false); S.screen = 'design'; S.si = 0; S.ap = 0; render(); }, { cls: 'pri big', icon: 'next' })]);
  }

  /* ------------------------------------------------------------ gallery (wizard, sheet and picker share this) */
  function usage(id) { var n = 0; S.doc.pages.forEach(function (p) { if (p.items.some(function (i) { return i.gid === id; })) n++; }); return n; }
  function addFiles(files) {
    files = [].slice.call(files).filter(function (f) { return /^image\//.test(f.type) || /\.(jpe?g|png|webp|gif|heic)$/i.test(f.name); });
    if (!files.length) { toast('Pick photos (JPG, PNG or WebP)', { kind: 'bad' }); return Promise.resolve(); }
    var done = 0, kill = toast('Adding ' + files.length + (files.length === 1 ? ' photo' : ' photos') + '…', { ms: 20000 });
    return files.reduce(function (p, f) { return p.then(function () { return B.importFile(f).then(function (g) { S.doc.gallery.push(g); done++; }, function () {}); }); }, Promise.resolve()).then(function () {
      kill(); persist(); toast(done + (done === 1 ? ' photo added' : ' photos added'), { kind: 'good' }); S.afterAdd && S.afterAdd(); render();
    });
  }
  function galleryBody(picker) {
    var d = S.doc, tab = S.tab, list = d.gallery.filter(function (g) { return tab === 'fav' ? g.fav : (tab === 'unused' ? !usage(g.id) : true); });
    var input = h('input', { type: 'file', accept: 'image/*', multiple: true, class: 'ed-vh', 'aria-label': 'Choose photos from your device', onchange: function () { addFiles(input.files); } });
    var drop = h('div', { class: 'drop', ondragover: function (e) { e.preventDefault(); drop.classList.add('over'); }, ondragleave: function () { drop.classList.remove('over'); }, ondrop: function (e) { e.preventDefault(); drop.classList.remove('over'); addFiles(e.dataTransfer.files); } },
      h('div', { class: 'dr-t' }, ic('photo', 26), h('b', null, 'Add photos'), h('small', null, 'Tap to choose, or drop them here')), input,
      h('div', { class: 'dr-b' }, btn('Choose photos', function () { input.click(); }, { cls: 'pri', icon: 'plus' }), d.gallery.some(function (g) { return g.sample; }) ? null : btn('Use sample photos', function () { S.doc.gallery = S.doc.gallery.concat(B.samples()); persist(); render(); }, {})));
    var tabs = h('div', { class: 'tabs', role: 'tablist' }, [['all', 'All ' + d.gallery.length], ['fav', 'Favourites ' + d.gallery.filter(function (g) { return g.fav; }).length], ['unused', 'Not used ' + d.gallery.filter(function (g) { return !usage(g.id); }).length]].map(function (t) { return h('button', { type: 'button', role: 'tab', 'aria-selected': String(tab === t[0]), class: tab === t[0] ? 'on' : '', onclick: function () { S.tab = t[0]; render(); } }, t[1]); }));
    var grid = h('ul', { class: 'gal' }, list.map(function (g) {
      var on = picker && S.picks.indexOf(g.id) > -1, n = usage(g.id);
      var src = B.url(g), im = h('img', { src: src, alt: g.name, loading: 'lazy', draggable: 'false' });
      im.addEventListener('error', function () { im.src = PLACE(g.id); }, { once: true });
      var tile = h('button', { type: 'button', class: 'tl' + (on ? ' on' : ''), 'aria-pressed': picker ? String(on) : null, 'aria-label': g.name + (picker ? (on ? ', selected' : '') : ''), onclick: function () { if (picker) togglePick(g.id); else S.sheet === 'gallery' || true; } }, im, on ? h('i', { class: 'pk' }, String(S.picks.indexOf(g.id) + 1)) : null, n ? h('small', { class: 'used' }, n + (n === 1 ? ' page' : ' pages')) : null);
      return h('li', null, tile, picker ? null : h('div', { class: 'tl-a' },
        h('button', { type: 'button', class: 'sq' + (g.fav ? ' fav' : ''), 'aria-label': (g.fav ? 'Remove from favourites: ' : 'Favourite: ') + g.name, 'aria-pressed': String(!!g.fav), onclick: function () { g.fav = !g.fav; persist(); render(); } }, ic('star', 18)),
        h('button', { type: 'button', class: 'sq', 'aria-label': 'Remove ' + g.name, onclick: function () { removePhoto(g); } }, ic('trash', 18))));
    }));
    return h('div', { class: 'gl' }, drop, d.gallery.length ? [tabs, list.length ? grid : h('p', { class: 'empty' }, tab === 'fav' ? 'No favourites yet. Tap the star on a photo.' : 'Every photo is already in your book.')] : h('p', { class: 'empty' }, 'No photos yet. Add some above, or use the sample photos to try the editor.'));
  }
  function removePhoto(g) {
    var n = usage(g.id);
    window.MilesUI.confirm({ title: 'Remove this photo?', body: n ? 'It is used on ' + n + (n === 1 ? ' page' : ' pages') + '. Those spots will become empty, ready for another photo.' : 'It is not used on any page.', confirmLabel: 'Yes, remove', danger: true }).then(function (ok) {
      if (!ok) return;
      S.doc.pages.forEach(function (p) { p.items.forEach(function (i) { if (i.gid === g.id) i.gid = null; }); });
      S.doc.gallery = S.doc.gallery.filter(function (x) { return x.id !== g.id; }); if (!g.sample) B.delBlob(g.id).catch(function () {});
      persist(); render();
    });
  }
  function togglePick(id) {
    var i = S.picks.indexOf(id), max = S.pickMax || 1;
    if (i > -1) S.picks.splice(i, 1); else if (max === 1) S.picks = [id]; else if (S.picks.length < max) S.picks.push(id); else { toast('This layout has ' + max + (max === 1 ? ' photo' : ' photos') + '. Tap one to swap it out.'); return; }
    var m = document.querySelector('dialog.dlg'); var keep = m && m.querySelector('.gl'); if (keep) { var fresh = galleryBody(true); keep.replaceWith(fresh); var c = document.getElementById('pickcount'); if (c) c.textContent = pickLabel(); var sv = document.getElementById('picksave'); if (sv) sv.disabled = S.pickNeed && !S.picks.length; }
  }
  var pickLabel = function () { var max = S.pickMax || 1; return S.picks.length + (max > 1 ? ' of ' + max : '') + ' selected'; };

  /* ------------------------------------------------------------ popups */
  function dialog(title, body, foot, o) {
    o = o || {};
    var d = h('dialog', { class: 'dlg' + (o.wide ? ' wide' : ''), 'aria-label': title }, h('div', { class: 'dl-h' }, h('b', null, title), h('button', { type: 'button', class: 'sq', 'aria-label': 'Close', onclick: function () { closeDlg(); if (o.onclose) o.onclose(); } }, ic('close'))), h('div', { class: 'dl-b' }, body), h('div', { class: 'dl-f' }, foot));
    d.addEventListener('cancel', function (e) { e.preventDefault(); closeDlg(); if (o.onclose) o.onclose(); });
    var old = document.querySelector('dialog.dlg'); if (old) { old.close(); old.remove(); }
    document.body.appendChild(d); if (d.showModal) d.showModal(); else d.setAttribute('open', '');
    var first = d.querySelector('.dl-b button, .dl-b input'); if (first) first.focus();
    return d;
  }
  function closeDlg() { var d = document.querySelector('dialog.dlg'); if (d) { if (d.open) d.close(); d.remove(); } S.flow = null; if (S.pending) applyRemote(S.pending); else if (S.doc) render(); }

  /* the page flow: popup 1 colour and layout, popup 2 photos, then save */
  function openFlow(pi) {
    var d = S.doc, p = d.pages[pi], kind = B.kindOf(d, pi);
    var cur = { pi: pi, bg: p.bg, lay: p.layout || B.LAYOUTS[kind][1 % B.LAYOUTS[kind].length].id };
    S.flow = cur; S.ap = pi;
    stepOne(cur, kind);
  }
  function layMini(l) {
    var w = h('span', { class: 'mini' });
    l.items.forEach(function (it) { w.appendChild(h('i', { class: it.t, style: { left: it.x + '%', top: it.y + '%', width: it.w + '%', height: (it.t === 'img' ? it.h : 8) + '%' } })); });
    return w;
  }
  function stepOne(cur, kind) {
    var lays = B.LAYOUTS[kind], lay = function () { return lays.filter(function (l) { return l.id === cur.lay; })[0]; };
    var sw = h('div', { class: 'sw', role: 'radiogroup', 'aria-label': 'Page colour' }, B.COLORS.map(function (c) { return h('button', { type: 'button', role: 'radio', 'aria-checked': String(c.toLowerCase() === cur.bg.toLowerCase()), 'aria-label': 'Colour ' + c, class: c.toLowerCase() === cur.bg.toLowerCase() ? 'on' : '', style: { background: c }, onclick: function () { cur.bg = c; stepOne(cur, kind); } }); }), h('label', { class: 'custom', title: 'Pick any colour' }, h('span', { class: 'ed-vh' }, 'Custom colour'), h('input', { type: 'color', value: /^#[0-9a-f]{6}$/i.test(cur.bg) ? cur.bg : '#ffffff', oninput: function (e) { cur.bg = e.target.value; document.querySelectorAll('dialog.dlg .lay .mini').forEach(function (m) { m.style.background = cur.bg; }); } }), '+'));
    var lg = h('div', { class: 'lays', role: 'radiogroup', 'aria-label': 'Layout' }, lays.map(function (l) { var mini = layMini(l); mini.style.background = cur.bg; return h('button', { type: 'button', class: 'lay' + (l.id === cur.lay ? ' on' : ''), role: 'radio', 'aria-checked': String(l.id === cur.lay), onclick: function () { cur.lay = l.id; stepOne(cur, kind); } }, mini, h('small', null, l.name)); }));
    var slots = B.slotsOf(lay());
    dialog(B.pageLabel(S.doc, cur.pi) + ': colour and layout', h('div', { class: 'dl-s' }, h('p', { class: 'ed-muted' }, 'Pick a background colour, then a starting layout. Nothing is fixed: you can move, resize or turn everything afterwards.'), h('h3', null, 'Colour'), sw, h('h3', null, 'Layout'), lg),
      [btn('Cancel', function () { closeDlg(); }), slots ? btn('Next: choose photos', function () { stepTwo(cur, kind, lay()); }, { cls: 'pri', icon: 'next' }) : btn('Save', function () { applyFlow(cur, lay(), []); }, { cls: 'pri', icon: 'check' })], { wide: true, onclose: function () { S.flow = null; } });
  }
  function stepTwo(cur, kind, lay) {
    var n = B.slotsOf(lay);
    S.picks = []; S.pickMax = n; S.pickNeed = false; S.tab = 'all';
    var body = h('div', { class: 'dl-s' }, h('p', { class: 'ed-muted' }, n === 1 ? 'Choose the photo for this page.' : 'Choose up to ' + n + ' photos. They fill the spots in the order you tap them. Leave any out and add them later.'), h('p', { class: 'pc', id: 'pickcount', 'aria-live': 'polite' }, pickLabel()), galleryBody(true));
    S.afterAdd = function () { var m = document.querySelector('dialog.dlg .gl'); if (m) m.replaceWith(galleryBody(true)); };
    dialog(B.pageLabel(S.doc, cur.pi) + ': choose photos', body, [btn('Back', function () { stepOne(cur, kind); }, { icon: 'back' }), btn('Save', function () { applyFlow(cur, lay, S.picks.slice()); }, { cls: 'pri', icon: 'check' })].map(function (b, i) { if (i === 1) b.id = 'picksave'; return b; }), { wide: true, onclose: function () { S.flow = null; S.afterAdd = null; } });
  }
  function applyFlow(cur, lay, picks) {
    var p = S.doc.pages[cur.pi], go = function () {
      p.bg = cur.bg; p.layout = lay.id; p.items = B.buildItems(S.doc, lay, cur.bg, picks); S.sel = null; S.afterAdd = null;
      closeDlg(); persist(); render(); toast(B.pageLabel(S.doc, cur.pi) + ' saved', { kind: 'good' });
    };
    if (p.items.length && p.layout !== lay.id) window.MilesUI.confirm({ title: 'Replace what is on this page?', body: 'The photos and text on it now will be swapped for the new layout. You can undo this.', confirmLabel: 'Replace' }).then(function (ok) { if (ok) go(); }); else go();
  }
  /* pick one photo for an item (or add a new photo item) */
  function pickOne(done) {
    S.picks = []; S.pickMax = 1; S.pickNeed = true; S.tab = 'all';
    var body = h('div', { class: 'dl-s' }, h('p', { class: 'pc', id: 'pickcount', 'aria-live': 'polite' }, pickLabel()), galleryBody(true));
    S.afterAdd = function () { var m = document.querySelector('dialog.dlg .gl'); if (m) m.replaceWith(galleryBody(true)); };
    S.flow = { pick: true };
    var save = btn('Use this photo', function () { var id = S.picks[0]; S.afterAdd = null; closeDlg(); if (id) done(id); }, { cls: 'pri', icon: 'check' }); save.id = 'picksave'; save.disabled = true;
    dialog('Choose a photo', body, [btn('Cancel', function () { S.afterAdd = null; closeDlg(); }), save], { wide: true, onclose: function () { S.afterAdd = null; } });
  }

  /* ------------------------------------------------------------ sheets: overview, gallery, notes, review, settings */
  function openSheet(name) { S.sheet = name; S.tab = 'all'; renderSheet(); }
  function closeSheet() { S.sheet = null; renderSheet(); }
  function renderSheet() {
    var old = document.getElementById('sheet'); if (old) old.remove(); document.body.classList.toggle('sheet-on', !!S.sheet);
    if (!S.sheet) return;
    var d = S.doc, body, title;
    if (S.sheet === 'overview') {
      title = 'All pages'; var tot = B.spreadCount(d);
      body = h('div', null, h('p', { class: 'ed-muted' }, 'Tap two pages to open them. A tick means you marked them done.'), h('ul', { class: 'ov' }, Array.apply(null, Array(tot)).map(function (_, s) {
        var sp = B.spreadPages(d, s), done = [sp.l, sp.r].filter(function (x) { return x != null; }).every(function (x) { return d.pages[x].done; });
        var label = s === 0 ? 'Cover' : (s === tot - 1 ? 'Back' : (2 * s - 1) + '–' + 2 * s);
        return h('li', null, h('button', { type: 'button', class: 'ovb' + (s === S.si ? ' on' : ''), 'aria-label': 'Open ' + (s === 0 ? 'the cover' : s === tot - 1 ? 'the back cover' : 'pages ' + label) + (done ? ', done' : ''), onclick: function () { closeSheet(); goto(s); } }, h('span', { class: 'pair' }, sp.l != null ? pageEl(sp.l, false) : h('span', { class: 'bpg blank' }), sp.r != null ? pageEl(sp.r, false) : h('span', { class: 'bpg blank' })), h('small', null, label, done ? h('i', { class: 'dn' }, ic('check', 12)) : null)));
      })));
    } else if (S.sheet === 'gallery') {
      title = 'Your photos'; S.picks = []; body = galleryBody(false); S.afterAdd = function () { var el = document.querySelector('#sheet .gl'); if (el) el.replaceWith(galleryBody(false)); };
    } else if (S.sheet === 'notes') {
      title = 'Notes'; var ta = h('textarea', { rows: 3, maxlength: 400, placeholder: ROLE === 'studio' ? 'Write to ' + d.customer + ' about ' + B.pageLabel(d, S.ap).toLowerCase() : 'Write to the studio about ' + B.pageLabel(d, S.ap).toLowerCase(), 'aria-label': 'New note' });
      body = h('div', { class: 'nt' }, d.notes.length ? h('ul', { class: 'nl' }, d.notes.map(function (n) { return h('li', { class: n.by }, h('b', null, (n.by === 'studio' ? 'Studio' : d.customer), h('small', null, ' · ' + B.pageLabel(d, n.page) + ' · ' + new Date(n.t).toLocaleString([], { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }))), h('p', null, n.text)); })) : h('p', { class: 'empty' }, 'No notes yet.'),
        h('div', { class: 'addnote' }, ta, btn('Add note', function () { if (!ta.value.trim()) return; d.notes.push({ id: B.uid('n'), by: ROLE, page: S.ap, text: ta.value.trim(), t: Date.now() }); persist(false); renderSheet(); render(); }, { cls: 'pri', icon: 'send' })));
    } else if (S.sheet === 'review') {
      title = 'Review for print'; var r = B.review(d);
      var li = function (ok, t, sub) { return h('li', { class: ok ? 'ok' : 'bad' }, ic(ok ? 'check' : 'close', 18), h('div', null, h('b', null, t), sub ? h('small', null, sub) : null)); };
      body = h('div', { class: 'rv' }, h('ul', { class: 'rl' }, li(!r.empty.length, r.empty.length ? r.empty.length + ' empty pages' : 'No empty pages', r.empty.slice(0, 8).map(function (i) { return B.pageLabel(d, i); }).join(', ')),
        li(!r.missing.length, r.missing.length ? r.missing.length + ' photo spots have no photo' : 'Every photo spot is filled', r.missing.slice(0, 8).map(function (i) { return B.pageLabel(d, i); }).join(', ')),
        li(!r.soft.length, r.soft.length ? r.soft.length + ' photos may print soft' : 'All photos are sharp enough', r.soft.slice(0, 4).map(function (s) { return B.pageLabel(d, s.page) + ' · ' + s.name + ' · ' + s.dpi + ' dpi'; }).join('; ')),
        li(r.notDone === 0, r.notDone ? r.notDone + ' pages not marked done' : 'Every page is marked done', null)),
        h('div', { class: 'rv-a' }, btn('Ask for changes', askChanges, { icon: 'note' }), btn('Mark ready for print', markReady, { cls: 'pri', icon: 'check', dis: d.status === 'ready' })));
    } else {
      title = 'Book settings';
      var cnt = h('select', { 'aria-label': 'Number of pages' }, [20, 30, 40, 50, 60, 80].map(function (n) { return h('option', { value: n, selected: n === d.count }, n + ' pages'); }));
      var tt = h('input', { value: d.title, 'aria-label': 'Book title' }), ss = h('input', { value: d.sub, 'aria-label': 'Caption' });
      body = h('div', { class: 'st' }, h('label', { class: 'fld' }, h('span', null, 'Book title'), tt), h('label', { class: 'fld' }, h('span', null, 'Caption'), ss), h('label', { class: 'fld' }, h('span', null, 'Pages'), cnt),
        btn('Save settings', function () {
          var n = +cnt.value, go = function () { d.title = tt.value; d.sub = ss.value; if (n !== d.count) B.resize(d, n); clampView(); persist(); closeSheet(); render(); };
          var lost = n < d.count && d.pages.slice(n + 1, d.pages.length - 1).some(function (p) { return p.items.length; });
          if (lost) window.MilesUI.confirm({ title: 'Remove the last pages?', body: 'Pages after page ' + n + ' have designs on them. They would be removed.', confirmLabel: 'Remove them', danger: true }).then(function (ok) { if (ok) go(); }); else go();
        }, { cls: 'pri', icon: 'check' }),
        h('hr'), btn('Start the steps again', function () { closeSheet(); S.screen = 'pages'; render(); }, { icon: 'back' }));
    }
    var sh = h('div', { id: 'sheet', class: 'sheet-w' }, h('div', { class: 'scrim', onclick: closeSheet }), h('section', { class: 'sheet', role: 'dialog', 'aria-modal': 'true', 'aria-label': title }, h('div', { class: 'dl-h' }, h('b', null, title), h('button', { type: 'button', class: 'sq', 'aria-label': 'Close', onclick: closeSheet }, ic('close'))), h('div', { class: 'dl-b' }, body)));
    document.body.appendChild(sh);
    var f = sh.querySelector('.dl-h .sq'); if (f) f.focus();
  }
  function sendToStudio() {
    var r = B.review(S.doc), empty = r.empty.length;
    window.MilesUI.confirm({ title: 'Send your book to the studio?', body: (empty ? empty + ' pages are still empty. ' : '') + 'The studio will check it and write back. You can keep editing, and they see every change.', confirmLabel: 'Send' }).then(function (ok) {
      if (!ok) return; S.doc.status = 'sent'; S.doc.notes.push({ id: B.uid('n'), by: 'customer', page: 0, text: 'Sent for a proof.', t: Date.now() }); persist(false); render(); toast('Sent to the studio', { kind: 'good' });
    });
  }
  function askChanges() {
    var ta = h('textarea', { rows: 4, maxlength: 400, placeholder: 'What should ' + S.doc.customer + ' change?', 'aria-label': 'What should change' });
    closeSheet();
    dialog('Ask for changes', h('div', { class: 'dl-s' }, ta), [btn('Cancel', closeDlg), btn('Send note', function () { if (!ta.value.trim()) return; S.doc.notes.push({ id: B.uid('n'), by: 'studio', page: S.ap, text: ta.value.trim(), t: Date.now() }); S.doc.status = 'changes'; closeDlg(); persist(false); render(); toast('Sent to ' + S.doc.customer, { kind: 'good' }); }, { cls: 'pri', icon: 'send' })]);
  }
  function markReady() {
    window.MilesUI.confirm({ title: 'Mark this book ready for print?', body: 'The customer is told it is ready. Nothing is sent to the printer from this prototype.', confirmLabel: 'Mark ready' }).then(function (ok) { if (!ok) return; S.doc.status = 'ready'; persist(false); closeSheet(); render(); toast('Marked ready for print', { kind: 'good' }); });
  }

  /* ------------------------------------------------------------ design screen */
  function goto(s) { S.si = clamp(s, 0, B.spreadCount(S.doc) - 1); var sp = B.spreadPages(S.doc, S.si); S.ap = sp.r != null ? sp.r : sp.l; if (S.compact && sp.l != null && sp.r != null) S.ap = sp.l; S.sel = null; render(); }
  function shift(sp) { return sp.l == null ? -25 : (sp.r == null ? 25 : 0); }
  function turn(dir) {
    if (S.turning) return;
    if (S.compact) { var np = clamp(S.ap + dir, 0, S.doc.pages.length - 1); if (np === S.ap) return; S.ap = np; S.si = B.spreadOf(S.doc, np); S.sel = null; render(); return; }
    var ns = S.si + dir; if (ns < 0 || ns >= B.spreadCount(S.doc)) return;
    var bk = document.querySelector('.bk'); if (!bk || reduce()) { goto(ns); return; }
    S.turning = true; S.sel = null; S.editing = null;
    var cur = B.spreadPages(S.doc, S.si), nxt = B.spreadPages(S.doc, ns), inner = bk.querySelector('.bk-in');
    var side = function (i) { return i == null ? h('div', { class: 'bpg blank' }) : pageEl(i, false); };
    var L = bk.querySelector('.side.l'), R = bk.querySelector('.side.r');
    var leaf = h('div', { class: 'leaf ' + (dir > 0 ? 'fw' : 'bw') }, h('div', { class: 'face f' }, side(dir > 0 ? cur.r : cur.l)), h('div', { class: 'face b' }, side(dir > 0 ? nxt.l : nxt.r)), h('div', { class: 'shade' }));
    R.innerHTML = ''; L.innerHTML = '';
    if (dir > 0) { L.appendChild(side(cur.l)); R.appendChild(side(nxt.r)); } else { L.appendChild(side(nxt.l)); R.appendChild(side(cur.r)); }
    L.classList.toggle('none', false); R.classList.toggle('none', false);
    inner.appendChild(leaf);
    inner.style.transform = 'translateX(' + shift(cur) + '%)';
    void leaf.offsetWidth;
    inner.style.transform = 'translateX(' + shift(nxt) + '%)'; leaf.classList.add('go');
    var fin = function () { if (!S.turning) return; S.turning = false; leaf.remove(); S.si = ns; var sp = B.spreadPages(S.doc, ns); S.ap = sp.r != null ? sp.r : sp.l; render(); };
    leaf.addEventListener('transitionend', function (e) { if (e.target === leaf && e.propertyName === 'transform') fin(); }); setTimeout(fin, 1100);
  }
  function selItem() { if (!S.sel) return null; var out = null; S.doc.pages.forEach(function (p, i) { p.items.forEach(function (it) { if (it.id === S.sel) out = { it: it, pi: i, page: p }; }); }); return out; }

  function screenDesign() {
    var d = S.doc, tot = B.spreadCount(d), sp = B.spreadPages(d, S.si), done = d.pages.filter(function (p) { return p.done; }).length;
    var heading = S.compact ? B.pageLabel(d, S.ap) : (S.si === 0 ? 'The cover' : (S.si === tot - 1 ? 'The back cover' : 'Pages ' + sp.l + ' and ' + sp.r));
    var bk = h('div', { class: 'bk' + (S.compact ? ' single' : '') + (S.si === 0 ? ' closed r' : (S.si === tot - 1 ? ' closed l' : '')), style: { '--ratio': d.ratio } },
      h('div', { class: 'bk-in', style: S.compact ? null : { transform: 'translateX(' + shift(sp) + '%)' } },
        S.compact ? h('div', { class: 'side one' }, pageEl(S.ap, true))
          : [h('div', { class: 'side l' + (sp.l == null ? ' none' : '') }, sp.l != null ? pageEl(sp.l, true) : null), h('div', { class: 'side r' + (sp.r == null ? ' none' : '') }, sp.r != null ? pageEl(sp.r, true) : null), h('div', { class: 'spine', 'aria-hidden': 'true' })]));
    wire(bk);
    var pgOnScreen = S.compact ? [S.ap] : [sp.l, sp.r].filter(function (x) { return x != null; });
    var allDone = pgOnScreen.every(function (i) { return d.pages[i].done; });
    var nextLabel = S.si >= tot - 1 && !S.compact ? null : (S.compact ? 'Next page' : 'Next pages');
    return h('div', { class: 'app' }, topbar(false), banner(),
      h('main', { class: 'ds', id: 'main' },
        h('div', { class: 'dh' }, h('div', null, h('h1', null, heading), h('p', { class: 'ed-muted' }, S.compact ? 'Page ' + (S.ap + 1) + ' of ' + d.pages.length : 'Spread ' + (S.si + 1) + ' of ' + tot)), h('div', { class: 'pr' }, h('span', null, done + ' of ' + d.pages.length + ' pages done'), h('div', { class: 'pgbar', role: 'progressbar', 'aria-label': 'Pages done', 'aria-valuemin': '0', 'aria-valuemax': String(d.pages.length), 'aria-valuenow': String(done) }, h('i', { style: { inlineSize: Math.round(done / d.pages.length * 100) + '%' } })))),
        h('div', { class: 'stage' }, h('button', { type: 'button', class: 'turn prev', 'aria-label': S.compact ? 'Previous page' : 'Turn back', onclick: function () { turn(-1); }, disabled: S.compact ? S.ap === 0 : S.si === 0 }, ic('back', 26)), bk, h('button', { type: 'button', class: 'turn next', 'aria-label': S.compact ? 'Next page' : 'Turn the page', onclick: function () { turn(1); }, disabled: S.compact ? S.ap >= d.pages.length - 1 : S.si >= tot - 1 }, ic('next', 26))),
        toolbar(),
        h('div', { class: 'nav' }, btn(allDone ? 'Done' : 'Mark done', function () { pgOnScreen.forEach(function (i) { d.pages[i].done = !allDone; }); persist(); render(); }, { icon: 'check', pressed: allDone, cls: allDone ? 'on' : '' }), nextLabel ? btn(nextLabel, function () { pgOnScreen.forEach(function (i) { d.pages[i].done = true; }); persist(false); turn(1); }, { cls: 'pri', icon: 'next', title: 'Mark done and turn to the next pages' }) : null)));
  }

  /* contextual toolbar */
  function toolbar() {
    var d = S.doc, s = selItem(), t = h('div', { class: 'tools', role: 'toolbar', 'aria-label': 'Page tools' });
    var upd = function (f) { return function () { var c = selItem(); if (!c) return; f(c.it, c); persist(); render(); }; };
    if (!s) {
      t.appendChild(btn('Colour & layout', function () { openFlow(S.ap); }, { icon: 'palette' }));
      t.appendChild(btn('Add photo', function () { pickOne(function (id) { addItem({ t: 'img', x: 20, y: 20, w: 50, h: 45, gid: id, fit: 'cover', r: 0 }); }); }, { icon: 'photo' }));
      t.appendChild(btn('Add text', function () { var p = d.pages[S.ap]; addItem({ t: 'text', x: 15, y: 40, w: 70, h: 0, text: 'Type here', size: 5, align: 'center', font: 'Fraunces', weight: 400, color: B.ink(p.bg), r: 0 }, true); }, { icon: 'text' }));
      t.appendChild(h('span', { class: 'hint' }, 'Tap a photo or text to move, resize or turn it. ' + B.pageLabel(d, S.ap) + ' is selected.'));
      return t;
    }
    var it = s.it;
    t.appendChild(btn('Done', function () { S.sel = null; S.editing = null; render(); }, { icon: 'check', cls: 'ghost' }));
    if (it.t === 'text') {
      t.appendChild(btn('Edit', function () { S.editing = it.id; render(); focusEdit(); }, { icon: 'edit', cls: S.editing === it.id ? 'on' : '' }));
      var fs = h('select', { 'aria-label': 'Font', onchange: upd(function (i) { i.font = fs.value; }) }, FONTS.map(function (f) { return h('option', { value: f, selected: f === (it.font || 'Fraunces') }, f); }));
      t.appendChild(fs);
      t.appendChild(btn('', upd(function (i) { i.size = clamp(+(i.size * .9).toFixed(2), 1.5, 40); }), { aria: 'Smaller text', cls: 'sq', icon: 'down' }));
      t.appendChild(h('span', { class: 'sz' }, String(Math.round(it.size * 10) / 10)));
      t.appendChild(btn('', upd(function (i) { i.size = clamp(+(i.size * 1.1).toFixed(2), 1.5, 40); }), { aria: 'Bigger text', cls: 'sq', icon: 'up' }));
      var col = h('input', { type: 'color', value: /^#[0-9a-f]{6}$/i.test(it.color) ? it.color : '#12342b', 'aria-label': 'Text colour', onchange: upd(function (i) { i.color = col.value; }) });
      t.appendChild(h('label', { class: 'sq colr', title: 'Text colour' }, col));
      t.appendChild(btn('', upd(function (i) { i.bold = !i.bold; }), { aria: 'Bold', cls: 'sq b', pressed: !!it.bold, icon: null, title: 'Bold' })); t.lastChild.textContent = 'B';
      t.appendChild(btn('', upd(function (i) { i.italic = !i.italic; }), { aria: 'Italic', cls: 'sq i', pressed: !!it.italic, title: 'Italic' })); t.lastChild.textContent = 'I';
      ['alignL:left', 'alignC:center', 'alignR:right'].forEach(function (a) { var k = a.split(':'); t.appendChild(btn('', upd(function (i) { i.align = k[1]; }), { aria: 'Align ' + k[1], cls: 'sq', icon: k[0], pressed: (it.align || 'center') === k[1] })); });
    } else {
      t.appendChild(btn(it.gid ? 'Change photo' : 'Choose photo', function () { pickOne(function (id) { var c = selItem(); if (c) { c.it.gid = id; persist(); render(); } }); }, { icon: 'photo' }));
      if (it.gid) t.appendChild(btn(it.fit === 'contain' ? 'Fill frame' : 'Fit whole photo', upd(function (i) { i.fit = i.fit === 'contain' ? 'cover' : 'contain'; }), {}));
    }
    t.appendChild(btn('', upd(function (i, c) { var a = c.page.items, k = a.indexOf(i); if (k < a.length - 1) { a.splice(k, 1); a.splice(k + 1, 0, i); } }), { aria: 'Bring forward', cls: 'sq', icon: 'up', title: 'Bring forward' }));
    t.appendChild(btn('', upd(function (i, c) { var a = c.page.items, k = a.indexOf(i); if (k > 0) { a.splice(k, 1); a.splice(k - 1, 0, i); } }), { aria: 'Send back', cls: 'sq', icon: 'down', title: 'Send back' }));
    t.appendChild(btn('', upd(function (i, c) { var cp = B.clone(i); cp.id = B.uid('t'); cp.x = clamp(cp.x + 4, 0, 90); cp.y = clamp(cp.y + 4, 0, 90); c.page.items.push(cp); S.sel = cp.id; }), { aria: 'Duplicate', cls: 'sq', icon: 'copy', title: 'Duplicate' }));
    t.appendChild(btn('', removeSel, { aria: 'Delete', cls: 'sq danger', icon: 'trash', title: 'Delete' }));
    return t;
  }
  function removeSel() { var c = selItem(); if (!c) return; c.page.items = c.page.items.filter(function (x) { return x !== c.it; }); S.sel = null; S.editing = null; persist(); render(); }
  function addItem(it, edit) {
    it.id = B.uid('t'); var p = S.doc.pages[S.ap]; p.items.push(it); S.sel = it.id; S.editing = edit ? it.id : null; persist(); render(); if (edit) focusEdit();
  }
  function focusEdit() {
    setTimeout(function () { var tx = document.querySelector('.it.editing .tx'); if (!tx) return; tx.focus(); var r = document.createRange(); r.selectNodeContents(tx); var s = getSelection(); s.removeAllRanges(); s.addRange(r); }, 30);
  }

  /* ------------------------------------------------------------ pointer: select, drag, resize, turn */
  function wire(bk) {
    bk.addEventListener('pointerdown', function (e) {
      var hd = e.target.closest('.hd'), itEl = e.target.closest('.it'), pgEl = e.target.closest('.bpg'), cta = e.target.closest('.cta');
      if (cta) { S.ap = +cta.dataset.p; S.sel = null; S.editing = null; return; }
      if (!pgEl || !pgEl.dataset.i) return;
      var pi = +pgEl.dataset.i;
      if (!itEl) { if (S.ap !== pi || S.sel) { S.ap = pi; S.sel = null; S.editing = null; render(); } return; }
      if (S.editing === itEl.dataset.id) return;
      var page = S.doc.pages[+itEl.dataset.p], it = page.items.filter(function (x) { return x.id === itEl.dataset.id; })[0]; if (!it) return;
      var wasSel = S.sel === it.id; S.ap = pi;
      if (!wasSel) { S.sel = it.id; S.editing = null; }
      e.preventDefault();
      beginDrag(e, itEl, pgEl, it, hd ? hd.dataset.h : null, wasSel);
    });
    bk.addEventListener('click', function (e) {
      var cta = e.target.closest('.cta'); if (cta) { openFlow(+cta.dataset.p); return; }
      var itEl = e.target.closest('.it.empty');
      if (itEl && S.sel === itEl.dataset.id && !S.dragMoved) { pickOne(function (id) { var c = selItem(); if (c) { c.it.gid = id; persist(); render(); } }); }
    });
    bk.addEventListener('dblclick', function (e) { var itEl = e.target.closest('.it-text'); if (itEl) { S.sel = itEl.dataset.id; S.editing = itEl.dataset.id; render(); focusEdit(); } });
    bk.addEventListener('keydown', function (e) {
      var itEl = e.target.closest('.it'); if (!itEl) return; var c = selItem(); if (S.editing) { if (e.key === 'Escape') { e.preventDefault(); endEdit(); } return; }
      if (!c || c.it.id !== itEl.dataset.id) { S.sel = itEl.dataset.id; c = selItem(); }
      if (!c) return; var it = c.it, st = e.shiftKey ? 3 : .5;
      if (e.key === 'Enter') { e.preventDefault(); if (it.t === 'text') { S.editing = it.id; render(); focusEdit(); } else pickOne(function (id) { it.gid = id; persist(); render(); }); }
      else if (e.key === 'Delete' || e.key === 'Backspace') { e.preventDefault(); removeSel(); }
      else if (/^Arrow/.test(e.key)) { e.preventDefault(); e.stopPropagation(); if (e.key === 'ArrowLeft') it.x -= st; else if (e.key === 'ArrowRight') it.x += st; else if (e.key === 'ArrowUp') it.y -= st; else it.y += st; itEl.style.left = it.x + '%'; itEl.style.top = it.y + '%'; clearTimeout(S.kt); S.kt = setTimeout(function () { persist(); }, 400); }
    });
    bk.addEventListener('focusout', function (e) { var tx = e.target.closest && e.target.closest('.it.editing .tx'); if (tx) endEdit(); });
  }
  function endEdit() {
    var tx = document.querySelector('.it.editing .tx'), c = selItem(); if (!tx || !c) { S.editing = null; return; }
    var v = tx.innerText.replace(/ /g, ' ').replace(/\n+$/, ''); S.editing = null;
    if (v !== c.it.text) { c.it.text = v || 'Type here'; persist(); } render();
  }
  function beginDrag(e, el, pgEl, it, handle, wasSel) {
    var rect = pgEl.getBoundingClientRect(), sx = e.clientX, sy = e.clientY, moved = false;
    var o = { x: it.x, y: it.y, w: it.w, h: it.h, r: it.r || 0, size: it.size };
    var elw = el.offsetWidth, elh = el.offsetHeight, rad = o.r * Math.PI / 180;
    var cx0 = rect.left + (it.x + it.w / 2) * rect.width / 100, cy0 = rect.top + (it.y * rect.height / 100) + elh / 2;
    S.dragging = true; S.dragMoved = false; try { el.setPointerCapture(e.pointerId); } catch (x) {}
    function mv(ev) {
      var dx = ev.clientX - sx, dy = ev.clientY - sy;
      if (!moved && Math.hypot(dx, dy) < 4) return; moved = true; S.dragMoved = true;
      if (!handle) {
        it.x = clamp(o.x + dx / rect.width * 100, -it.w / 2, 100 - it.w / 2);
        it.y = clamp(o.y + dy / rect.height * 100, -(elh / rect.height * 50), 100 - (elh / rect.height * 50));
      } else if (handle === 'rot') {
        var a = Math.atan2(ev.clientY - cy0, ev.clientX - cx0) * 180 / Math.PI + 90; a = ((a % 360) + 540) % 360 - 180;
        [0, 90, -90, 180, -180].forEach(function (s) { if (Math.abs(a - s) < 4) a = s; }); it.r = Math.round(a * 10) / 10;
      } else {
        var cos = Math.cos(-rad), sin = Math.sin(-rad), lx = dx * cos - dy * sin, ly = dx * sin + dy * cos;
        var sxg = /e/.test(handle) ? 1 : (/w/.test(handle) ? -1 : 0), syg = /s/.test(handle) ? 1 : (/n/.test(handle) ? -1 : 0);
        var wpx = o.w / 100 * rect.width, hpx = elh;
        if (it.t === 'text') {
          var nw = Math.max(rect.width * .06, wpx + sxg * lx), f = nw / wpx; if (syg && sxg) { it.size = clamp(+(o.size * f).toFixed(2), 1.5, 40); }
          var cxl = sxg * (nw - wpx) / 2, cyl = 0, ccx = cx0 + cxl * Math.cos(rad) - cyl * Math.sin(rad), ccy = cy0 + cxl * Math.sin(rad) + cyl * Math.cos(rad);
          it.w = nw / rect.width * 100; it.x = (ccx - nw / 2 - rect.left) / rect.width * 100; it.y = (ccy - (hpx * (syg && sxg ? f : 1)) / 2 - rect.top) / rect.height * 100;
        } else {
          var nW = Math.max(rect.width * .05, wpx + sxg * lx), nH = Math.max(rect.height * .05, o.h / 100 * rect.height + syg * ly);
          var cxl2 = sxg * (nW - wpx) / 2, cyl2 = syg * (nH - o.h / 100 * rect.height) / 2;
          var ccx2 = cx0 + cxl2 * Math.cos(rad) - cyl2 * Math.sin(rad), ccy2 = cy0 + cxl2 * Math.sin(rad) + cyl2 * Math.cos(rad);
          it.w = nW / rect.width * 100; it.h = nH / rect.height * 100; it.x = (ccx2 - nW / 2 - rect.left) / rect.width * 100; it.y = (ccy2 - nH / 2 - rect.top) / rect.height * 100;
        }
      }
      el.style.left = it.x + '%'; el.style.top = it.y + '%'; el.style.width = it.w + '%'; el.style.transform = 'rotate(' + (it.r || 0) + 'deg)';
      if (it.t === 'img') el.style.height = it.h + '%'; else el.style.fontSize = it.size + 'cqw';
    }
    function up() {
      window.removeEventListener('pointermove', mv); window.removeEventListener('pointerup', up); window.removeEventListener('pointercancel', up);
      S.dragging = false;
      if (moved) { persist(); render(); } else if (!wasSel) { render(); } else if (it.t === 'text' && !handle) { S.editing = it.id; render(); focusEdit(); }
      setTimeout(function () { S.dragMoved = false; }, 50);
      if (S.pending) applyRemote(S.pending);
    }
    window.addEventListener('pointermove', mv); window.addEventListener('pointerup', up); window.addEventListener('pointercancel', up);
  }

  /* ------------------------------------------------------------ main render and boot */
  function render() {
    if (S.turning) return;
    var screen = S.screen;
    var node = screen === 'pages' ? screenPages() : screen === 'title' ? screenTitle() : screen === 'gallery' ? screenGallery() : screenDesign();
    app.replaceChildren(node);
    document.title = (S.doc.title || 'My book') + ' · Live editor · Miles Retold';
    if (S.sheet) { /* keep an open sheet in step with the book */ var old = document.getElementById('sheet'); if (old && S.sheet !== 'gallery') renderSheet(); }
  }
  document.addEventListener('keydown', function (e) {
    if (S.screen !== 'design' || S.editing || S.turning || /^(INPUT|TEXTAREA|SELECT)$/.test((e.target || {}).tagName) || document.querySelector('dialog.dlg[open]') || S.sheet) return;
    if (e.target.closest && e.target.closest('.it')) return;
    if (e.key === 'ArrowRight') { e.preventDefault(); turn(1); } else if (e.key === 'ArrowLeft') { e.preventDefault(); turn(-1); }
    else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') { e.preventDefault(); restore(e.shiftKey ? S.redo : S.undo, e.shiftKey ? S.undo : S.redo); }
  });
  var mq = matchMedia('(max-width: 760px)');
  S.compact = mq.matches; mq.addEventListener('change', function () { S.compact = mq.matches; if (S.compact) { var sp = B.spreadPages(S.doc, S.si); if (sp.l != null && sp.r != null && S.ap !== sp.l && S.ap !== sp.r) S.ap = sp.l; } render(); });

  var pref = 'light'; try { pref = localStorage.getItem('miles.theme') || 'light'; } catch (e) {}
  setTheme(pref === 'dark' ? 'dark' : 'light');
  var existing = B.read();
  S.doc = existing && existing.v === 1 ? existing : B.newDoc(40);
  if (!existing) { B.write(S.doc); }
  S.snap = JSON.stringify(S.doc); S.screen = S.doc.setup >= 3 ? 'design' : ['pages', 'title', 'gallery'][Math.max(0, S.doc.setup)] || 'pages';
  if (q.get('start') === 'new') { S.doc = B.newDoc(40); S.screen = 'pages'; B.write(S.doc); S.snap = JSON.stringify(S.doc); }
  clampView(); render();
  B.loadUrls(S.doc).then(function () { render(); });
  window.__book = { S: S, B: B, render: render, openFlow: openFlow, turn: turn };
})();
