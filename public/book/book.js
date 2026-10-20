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

  var S = { doc: null, screen: 'design', si: 0, ap: 0, sel: null, editing: null, turning: false, sheet: null, undo: [], redo: [], snap: '', saved: '', compact: false, flow: null, picks: [], tab: 'all', crop: null, draw: { on: false, color: '#12342b', w: 1.2 }, lib: { tab: 'stored', selecting: false, picked: [] } };
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
    send: '<path d="M21 3L10 14M21 3l-7 18-4-7-7-4z"/>', star: '<path d="M12 3l2.700 5.600 6.100.8-4.500 4.200 1.100 6.100L12 16.800 6.600 19.700l1.100-6.100L3.200 9.400l6.100-.8z"/>', note: '<path d="M4 5h16v11H9l-5 4z"/>', gear: '<path d="M12 2.500l1.600 2.300 2.700-.6.900 2.600 2.600.9-.6 2.700 2.300 1.600-2.300 1.600.6 2.700-2.600.9-.9 2.600-2.700-.6L12 21.500l-1.600-2.300-2.700.6-.9-2.600-2.600-.9.600-2.700L2.500 12l2.300-1.600-.6-2.700 2.600-.9.900-2.600 2.700.6z"/><circle cx="12" cy="12" r="3"/>',
    lock: '<rect x="5" y="11" width="14" height="9" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/>',
    pencil: '<path d="M4 20l1-4L16 5l3 3L8 19z"/><path d="M14 7l3 3"/>', shape: '<circle cx="8" cy="8" r="4.5"/><rect x="12" y="12" width="8" height="8" rx="1.5"/>', crop: '<path d="M7 3v14h14M3 7h14v14"/>', minus: '<path d="M5 12h14"/>',
    pin: '<path d="M12 21s6-5.400 6-10.500a6 6 0 0 0-12 0C6 15.600 12 21 12 21z"/><circle cx="12" cy="10.500" r="2.200"/>', clock: '<circle cx="12" cy="12" r="8.500"/><path d="M12 7.500V12l3 2"/>', camera: '<path d="M4 8h3l1.500-2.500h7L17 8h3v11H4z"/><circle cx="12" cy="13" r="3.500"/>', info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v6M12 7.500v.1"/>', cross: '<path d="M6 6l12 12M18 6L6 18"/>',
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
    if (it.t === 'img' || it.h > 0) s += 'height:' + it.h + '%;';
    return s;
  }
  /* a photo: shape (clip) and frame around it, zoom and focus inside it */
  var SHAPES = [['rect', 'Rectangle'], ['rounded', 'Rounded'], ['circle', 'Circle'], ['oval', 'Oval'], ['arch', 'Arch'], ['heart', 'Heart'], ['star', 'Star'], ['hexagon', 'Hexagon'], ['diamond', 'Diamond'], ['triangle', 'Triangle'], ['blob', 'Soft blob'], ['pill', 'Pill'], ['bubble', 'Speech bubble'], ['burst', 'Burst'], ['ribbon', 'Ribbon']];
  var AR = { circle: 1, oval: 1.45, arch: .85, heart: 1.05, star: 1, hexagon: 1.12, diamond: 1, triangle: 1.1, blob: 1.1, bubble: 1.35, burst: 1 };   /* shapes that keep a shape of their own when a text box is set to them */
  var FILLS = ['#fffcf6', '#f1e7d8', '#f4c9b8', '#e0a030', '#d9e4d4', '#bcd4de', '#12342b', '#7a2e2e', '#2b2b2b', '#ffffff'];
  var FRAMES = [['none', 'No frame'], ['border', 'White border'], ['line', 'Thin line'], ['polaroid', 'Polaroid'], ['shadow', 'Shadow']];
  function imgNode(it, src) {
    var im = h('img', { src: src, alt: '', draggable: 'false', style: { objectFit: it.fit === 'contain' ? 'contain' : 'cover', objectPosition: (it.fx == null ? 50 : it.fx) + '% ' + (it.fy == null ? 50 : it.fy) + '%', transformOrigin: (it.fx == null ? 50 : it.fx) + '% ' + (it.fy == null ? 50 : it.fy) + '%', transform: 'scale(' + (it.zoom || 1) + ')' } });
    im.addEventListener('error', function () { im.src = PLACE(it.gid); }, { once: true });
    return h('div', { class: 'fr fr-' + (it.frame || 'none') + ' sh-' + (it.shape || 'rect') }, h('div', { class: 'cl' }, im));
  }
  function itemEl(it, pi, live) {
    var el, isSel = live && S.sel === it.id, isSpan = pi === 'span';
    if (it.t === 'img') {
      var g = gal(it.gid), src = g ? B.url(g) : '';
      el = h('div', { class: 'it it-img' + (it.gid ? '' : ' empty') + (isSpan ? ' span' : '') + (live && S.crop === it.id ? ' cropping' : ''), 'data-id': it.id, 'data-p': pi, style: itemStyle(it), tabindex: live ? '0' : '-1', role: live ? 'group' : null, 'aria-label': live ? (isSpan ? 'Photo across both pages' : (g ? 'Photo: ' + g.name : 'Empty photo spot, press Enter to choose a photo')) : null });
      if (src) el.appendChild(imgNode(it, src)); else el.appendChild(h('span', { class: 'ph' }, ic('plus', 22), live ? h('b', null, 'Add photo') : null));
    } else {
      var editing = live && S.editing === it.id;
      var shp = it.shape && it.shape !== 'none' ? it.shape : '';
      el = h('div', { class: 'it it-text' + (editing ? ' editing' : '') + (shp ? ' shaped sh-' + shp : ''), 'data-id': it.id, 'data-p': pi, tabindex: live ? '0' : '-1', role: live ? 'group' : null, 'aria-label': live ? 'Text box, press Enter to edit' : null,
        style: itemStyle(it) + 'font-size:' + it.size + 'cqw;color:' + it.color + ';text-align:' + (it.align || 'center') + ';font-family:' + (FONT[it.font] || FONT.Fraunces) + ';font-weight:' + (it.bold ? 700 : (it.weight || 400)) + ';font-style:' + (it.italic ? 'italic' : 'normal') + (it.shadow ? ';text-shadow:0 .1em .4em rgba(0,0,0,.45)' : '') });
      var tx = h('div', { class: 'tx' }, it.text);
      if (editing) { tx.setAttribute('contenteditable', 'plaintext-only'); if (tx.contentEditable !== 'plaintext-only') tx.setAttribute('contenteditable', 'true'); tx.setAttribute('aria-label', 'Edit text'); }
      if (shp) el.appendChild(h('div', { class: 'tbg ln-' + (it.line || 0) }, h('div', { class: 'cl', style: { background: it.fill || '#fffcf6' } })));
      el.appendChild(tx);
    }
    if (isSel && !(it.t === 'text' && S.editing === it.id) && !(S.crop === it.id)) {
      ['nw', 'ne', 'sw', 'se'].concat(it.t === 'text' && !(it.h > 0) ? ['w', 'e'] : []).forEach(function (k) { el.appendChild(h('i', { class: 'hd ' + k, 'data-h': k })); });
      el.appendChild(h('i', { class: 'hd rot', 'data-h': 'rot', title: 'Turn' }));
    }
    if (isSel) el.classList.add('is-sel');
    return el;
  }
  /* pencil doodles: one drawing layer per page, in page units (the page is 100 wide) so it scales with the page */
  var INKS = ['#12342b', '#fffcf6', '#c0392b', '#e0a030', '#2a6fb0', '#2e8b57', '#8a4fbf'], NIBS = [['Thin', .55], ['Medium', 1.2], ['Thick', 2.6]];
  function pathD(pts) {
    if (pts.length === 1) return 'M' + pts[0][0] + ' ' + pts[0][1] + 'l.01 0';
    var d = 'M' + pts[0][0] + ' ' + pts[0][1];
    for (var i = 1; i < pts.length - 1; i++) d += 'Q' + pts[i][0] + ' ' + pts[i][1] + ' ' + ((pts[i][0] + pts[i + 1][0]) / 2).toFixed(2) + ' ' + ((pts[i][1] + pts[i + 1][1]) / 2).toFixed(2);
    var l = pts[pts.length - 1]; return d + 'L' + l[0] + ' ' + l[1];
  }
  function doodleEl(p) {
    var ns = 'http://www.w3.org/2000/svg', svg = document.createElementNS(ns, 'svg');
    svg.setAttribute('class', 'dd'); svg.setAttribute('viewBox', '0 0 100 ' + (100 / S.doc.ratio).toFixed(3)); svg.setAttribute('aria-hidden', 'true');
    (p.doodle || []).forEach(function (st) { var pa = document.createElementNS(ns, 'path'); pa.setAttribute('d', pathD(st.pts)); pa.setAttribute('stroke', st.c); pa.setAttribute('stroke-width', st.w); pa.setAttribute('fill', 'none'); pa.setAttribute('stroke-linecap', 'round'); pa.setAttribute('stroke-linejoin', 'round'); svg.appendChild(pa); });
    return svg;
  }
  /* a photo that runs across both pages is drawn once in the editor (see .spanl); everywhere else each page shows its half */
  function spanClone(it, side) {
    var el = h('div', { class: 'it it-img spanc', style: 'left:' + (it.x * 2 - (side === 'r' ? 100 : 0)) + '%;top:' + it.y + '%;width:' + (it.w * 2) + '%;height:' + it.h + '%;transform:rotate(' + (it.r || 0) + 'deg);', 'aria-hidden': 'true' }), g = gal(it.gid), src = g ? B.url(g) : '';
    if (src) el.appendChild(imgNode(it, src)); return el;
  }
  function pageEl(i, live, noSpan) {
    var p = S.doc.pages[i], last = S.doc.pages.length - 1, inner = i > 0 && i < last, sp = inner ? (S.doc.spans[Math.ceil(i / 2)] || []) : [];
    var el = h('div', { class: 'bpg' + (live && S.ap === i ? ' is-active' : ''), 'data-i': i, style: { background: p.bg, color: B.ink(p.bg) } });
    var c = h('div', { class: 'pgc' }); el.appendChild(c);
    if (!noSpan) sp.forEach(function (it) { c.appendChild(spanClone(it, i % 2 === 1 ? 'l' : 'r')); });
    p.items.forEach(function (it) { c.appendChild(itemEl(it, i, live)); });
    c.appendChild(doodleEl(p));
    if (live && !p.layout && !p.items.length && !(p.doodle || []).length && !sp.length) c.appendChild(h('button', { type: 'button', class: 'cta', 'data-act': 'flow', 'data-p': i }, ic('palette', 22), h('b', null, 'Design ' + (i === 0 ? 'the cover' : (i === last ? 'the back cover' : 'this page'))), h('small', null, 'Colour, layout, photos')));
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
      h('div', { class: 'sp' }),
      !wizard ? h('div', { class: 'tt' }, btn('', function () { restore(S.undo, S.redo); }, { icon: 'undo', aria: 'Undo', dis: !S.undo.length, cls: 'sq' }), btn('', function () { restore(S.redo, S.undo); }, { icon: 'redo', aria: 'Redo', dis: !S.redo.length, cls: 'sq' }),
        btn('Overview', function () { openSheet('overview'); }, { icon: 'grid', dis: S.screen !== 'design', title: S.screen !== 'design' ? 'Available once you reach the Design step' : undefined }), btn('Photos', function () { openSheet('gallery'); }, { icon: 'photo' }), btn('', function () { openSheet('notes'); }, { icon: 'note', aria: 'Notes', cls: 'sq' + (d.notes.length ? ' dot' : '') }), btn('', function () { openSheet('settings'); }, { icon: 'gear', aria: 'Book settings', cls: 'sq' }),
        btn('', function () { var t = theme === 'dark' ? 'light' : 'dark'; try { localStorage.setItem('miles.theme', t); } catch (e) {} setTheme(t); render(); }, { icon: theme === 'dark' ? 'sun' : 'moon', aria: theme === 'dark' ? 'Light theme' : 'Dark theme', cls: 'sq' })) : btn('', function () { var t = theme === 'dark' ? 'light' : 'dark'; try { localStorage.setItem('miles.theme', t); } catch (e) {} setTheme(t); render(); }, { icon: theme === 'dark' ? 'sun' : 'moon', aria: theme === 'dark' ? 'Light theme' : 'Dark theme', cls: 'sq' }),
      !wizard ? (ROLE === 'studio' ? h('button', { type: 'button', class: 'bt pri send', onclick: function () { openSheet('review'); } }, ic('tick'), h('span', null, 'Review')) : h('button', { type: 'button', class: 'bt pri send', disabled: S.screen !== 'design', title: S.screen !== 'design' ? 'Finish the steps and design your book first' : null, onclick: sendToStudio }, ic('send'), h('span', { class: 'lbl-l' }, 'Send to the studio'), h('span', { class: 'lbl-s' }, 'Send'))) : null);
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
  /* ------------------------------------------------------------ the start: small steps, a 3D book that follows the answers */
  var WSTEPS = [['event', 'Occasion'], ['size', 'Size'], ['pages', 'Pages'], ['title', 'Title'], ['dedication', 'Dedication'], ['gallery', 'Photos'], ['design', 'Design']];
  var WS = WSTEPS.map(function (x) { return x[0]; });
  var COVERS = [['forest', 'Forest', '#12342b', '#fff6f0'], ['wine', 'Wine', '#5a1830', '#f7ecdf'], ['blue', 'Dusty blue', '#5e7fa6', '#ffffff'], ['sand', 'Sand', '#e4d5c6', '#5a1830'], ['ink', 'Ink', '#2a1d22', '#e0a030']];
  function signedIn() { try { return localStorage.getItem('miles.auth') === 'in'; } catch (e) { return false; } }
  function signInUrl() { var g = 'GL'; try { g = localStorage.getItem('miles.theme') === 'dark' ? 'G' : 'GL'; } catch (e) {} return '/' + g + '8-SignIn.dc.html'; }
  function toSignIn() { try { localStorage.setItem('miles.next', '/book/editor.html?as=customer'); } catch (e) {} location.href = signInUrl(); }
  function wgo(step) {   /* go to a step; the step is saved, so closing the tab and coming back resumes here */
    S.doc.step = step; S.screen = step; persist(false);
    try { if (location.hash !== '#' + step) history.pushState({ s: step }, '', '#' + step); } catch (e) {}
    render(); try { window.scrollTo(0, 0); } catch (e) {}
  }
  function wizBook() {
    var d = S.doc, idx = Math.max(0, WS.indexOf(S.screen)), prog = idx / (WSTEPS.length - 1), back = S.screen === 'dedication';   /* the name step shows the back cover */
    var cv = COVERS.filter(function (c) { return c[0] === d.cover; })[0] || (d.pages[0].bg ? ['custom', 'Custom', d.pages[0].bg, B.ink(d.pages[0].bg)] : COVERS[0]), ev = EVENTS.filter(function (e) { return e[0] === d.event; })[0];
    var cp = (d.pages[0].items.filter(function (i) { return i.t === 'img' && i.gid; })[0] || {}).gid, cg = cp && d.gallery.filter(function (g) { return g.id === cp; })[0];
    var size = SIZES.filter(function (z) { return z[0] === d.size; })[0];
    var cap = [ev ? ev[1] : 'Your book', size ? size[1] + ' ' + size[2] : null, d.count + ' pages'].filter(Boolean).join(' · ');
    var book = window.MilesBook3D.el({ ratio: d.ratio || 0.8, pages: d.count || 40, width: (S.compact || window.innerWidth < 1000) ? 118 : 168, cover: cv[2], ink: cv[3], title: d.title || (ev ? ev[4] : 'Your title'), sub: d.sub || '', img: cg ? B.url(cg) : (ev ? ev[3] : ''), ry: back ? 152 : Math.round(-48 + prog * 30), rx: 8, back: d.author || '', scroll: back ? false : 'page', photos: d.gallery.filter(function (g) { return !g.sample || g.src; }).slice(0, 9).map(function (g) { return B.url(g); }).concat(EVENTS.map(function (e) { return e[3]; })), 'aria-label': (back ? 'The back cover of your book: ' : 'Your book so far: ') + cap });
    return h('div', { class: 'wb' }, book, h('p', { class: 'wb-c' }, cap));
  }
  function refreshBook() { var el = document.querySelector('.wbk'); if (el) { el.textContent = ''; el.appendChild(wizBook()); } }
  /* one progress header for the whole journey, from the first question to the last page; a step already reached can be reopened from it */
  function stepHeader(step) {
    var idx = WS.indexOf(step), pct = Math.round((idx + 1) / WSTEPS.length * 100), at = WS.indexOf(S.doc.step), reach = Math.max(idx, at > -1 ? at : 0);
    return h('div', { class: 'wzh' },
      h('div', { class: 'wp' }, h('b', null, 'Step ' + (idx + 1) + ' of ' + WSTEPS.length), h('div', { class: 'wpbar', role: 'progressbar', 'aria-label': 'Progress', 'aria-valuemin': '0', 'aria-valuemax': '100', 'aria-valuenow': String(pct) }, h('i', { style: { inlineSize: pct + '%' } })), h('span', { class: 'sv' }, ic('lock', 14), h('span', { id: 'savedat' }, (S.saved || 'Saved') + (signedIn() ? ' · in your account' : ' · on this device')))),
      h('ol', { class: 'steps', 'aria-label': 'Steps' }, WSTEPS.map(function (t, i) { return h('li', { class: i === idx ? 'now' : (i < idx ? 'done' : ''), 'aria-current': i === idx ? 'step' : null }, h('button', { type: 'button', class: 'stp', disabled: i === idx || i > reach, 'aria-label': 'Step ' + (i + 1) + ': ' + t[1], onclick: function () { wgo(t[0]); } }, h('i', null, i < idx ? ic('check', 14) : String(i + 1)), h('span', null, t[1]))); })));
  }
  function wizardShell(step, title, lead, body, foot) {
    return h('div', { class: 'app wiz' }, topbar(false), h('main', { class: 'wz', id: 'main' },
      stepHeader(step),
      h('div', { class: 'wgrid' }, h('aside', { class: 'wbk' }, wizBook()), h('section', { class: 'wbody' }, h('h1', null, title), h('p', { class: 'lead' }, lead), body)),
      h('div', { class: 'foot' }, foot)));   /* the bar spans the whole page, so Back sits in the left corner and Next in the right */
  }
  /* steps 1 and 2: what the book is for, and its shape (this replaces the old Start a book page) */
  var EVENTS = [['travel', 'Travel journey', 'One trip, one place', '/_blob/1bebe18032c3ba7f722debbe5fa70f36', 'Maldives'], ['wedding', 'Wedding', 'The day itself', '/_blob/d79cb5916bf021b810ad3e0168beec13', 'Our wedding'], ['honeymoon', 'Honeymoon', 'Often a surprise', '/_blob/6dc6964be6ca87733a870c819d870936', 'Honeymoon'], ['love', 'Love story', 'Anniversaries', '/_blob/40f21930485ef5903566224ed85a9273', 'Our story'], ['multi', 'Multi-city', 'Several stops', '/_blob/44c3ed2b417e619b81afb56289c69c25', 'Europe'], ['roll', 'Camera roll', 'A year or season', '/_blob/6b43c91be8c10d0cbed5dc2520dde00d', 'Our year']];
  var SIZES = [['portrait', 'Portrait', '8 \u00d7 10 in', 0.8, 8], ['landscape', 'Landscape', '11 \u00d7 8.5 in', 1.294, 11], ['square', 'Square', '10 \u00d7 10 in', 1, 10]];
  function screenEvent() {
    var d = S.doc;
    var body = h('div', { class: 'opts ev', role: 'radiogroup', 'aria-label': 'What the book is for' }, EVENTS.map(function (e) {
      var im = h('img', { src: e[3], alt: '', loading: 'lazy' }); im.addEventListener('error', function () { im.remove(); }, { once: true });
      return h('button', { type: 'button', class: 'opt evc' + (d.event === e[0] ? ' on' : ''), role: 'radio', 'aria-checked': String(d.event === e[0]), onclick: function () { d.event = e[0]; persist(false); render(); } }, im, h('b', null, e[1]), h('small', null, e[2]));
    }));
    return wizardShell('event', 'What is the book for?', 'Pick the one that fits best. Everything can change later with the studio.', body,
      [h('span', { class: 'hint' }, d.event ? 'Good. Next is the size.' : 'Choose one to continue.'), btn('Next', function () { if (!d.event) { toast('Pick what the book is for', { kind: 'bad' }); return; } wgo('size'); }, { cls: 'pri big', icon: 'next', dis: !d.event })]);
  }
  function screenSize() {
    var d = S.doc;
    var body = h('div', { class: 'opts sz', role: 'radiogroup', 'aria-label': 'Size of the book' }, SIZES.map(function (z) {
      var w = z[3] >= 1 ? 66 : Math.round(66 * z[3]), hh = z[3] >= 1 ? Math.round(66 / z[3]) : 66;
      return h('button', { type: 'button', class: 'opt szc' + (d.size === z[0] ? ' on' : ''), role: 'radio', 'aria-checked': String(d.size === z[0]), onclick: function () { d.size = z[0]; d.ratio = z[3]; d.inches = z[4]; persist(false); render(); } },
        h('span', { class: 'szp', 'aria-hidden': 'true' }, h('i', { style: { inlineSize: w + 'px', blockSize: hh + 'px' } })), h('b', null, z[1]), h('small', null, z[2]));
    }));
    return wizardShell('size', 'What size?', 'The shape of every page. Portrait suits portraits and trips, landscape suits wide views, square suits a bit of both.', body,
      [btn('Back', function () { wgo('event'); }, { icon: 'back' }), h('span', { class: 'hint' }, d.size ? 'Next you choose the number of pages.' : 'Choose one to continue.'), btn('Next', function () { if (!d.size) { toast('Pick a size', { kind: 'bad' }); return; } wgo('pages'); }, { cls: 'pri big', icon: 'next', dis: !d.size })]);
  }
  function screenPages() {
    var d = S.doc, counts = [20, 30, 40, 50, 60, 80], sel = d.count;
    var body = h('div', { class: 'opts', role: 'radiogroup', 'aria-label': 'Number of pages' }, counts.map(function (n) {
      return h('button', { type: 'button', class: 'opt' + (n === sel ? ' on' : ''), role: 'radio', 'aria-checked': String(n === sel), onclick: function () { if (S.doc.count !== n) B.resize(S.doc, n); persist(false); render(); } }, h('b', null, String(n)), h('small', null, n / 2 + ' spreads'), n === 40 ? h('em', null, 'Most chosen') : null);
    }));
    return wizardShell('pages', 'How many pages?', 'Pages are inside the book, not counting the covers. You can change this later.', body,
      [btn('Back', function () { wgo('size'); }, { icon: 'back' }), h('span', { class: 'hint' }, sel + ' pages = ' + sel / 2 + ' spreads, plus the covers.'), btn('Next', function () { S.doc.setup = Math.max(S.doc.setup, 1); wgo('title'); }, { cls: 'pri big', icon: 'next' })]);
  }
  function wfield(key, label, ph, area) {
    var d = S.doc, inp = h(area ? 'textarea' : 'input', { id: 'f-' + key, value: d[key], placeholder: ph, maxlength: area ? 160 : 60, rows: area ? 3 : null, autocomplete: 'off', oninput: function () { d[key] = inp.value; persist(false); refreshBook(); var t = document.querySelector('.ttl b'); if (t && key === 'title') t.textContent = d.title || 'My book'; } });
    inp.value = d[key] || ''; return h('label', { class: 'fld' }, h('span', null, label), inp);
  }
  function screenTitle() {
    var d = S.doc, ev = EVENTS.filter(function (e) { return e[0] === d.event; })[0] || [0, 0, 0, 0, 'Maldives'];
    return wizardShell('title', 'Name your book', 'The title and the line under it go on the cover. You can change them any time.', h('div', { class: 'form' }, wfield('title', 'Book title', ev[4], false), wfield('sub', 'Caption under the title', 'March 2022 · two sisters, one island', false)),
      [btn('Back', function () { wgo('pages'); }, { icon: 'back' }), btn('Next', function () { d.setup = Math.max(d.setup, 2); wgo('dedication'); }, { cls: 'pri big', icon: 'next' })]);
  }
  function screenDedication() {
    var d = S.doc;
    return wizardShell('dedication', 'Who is it for?', 'A dedication for the first page and your name for the back. Both are optional, you can skip them.', h('div', { class: 'form' }, wfield('dedication', 'Dedication (optional)', 'For Mama, who said yes to the trip', true), wfield('author', 'Your name on the back (optional)', 'Sara and Noor', false)),
      [btn('Back', function () { wgo('title'); }, { icon: 'back' }), btn('Next', function () { wgo('gallery'); }, { cls: 'pri big', icon: 'next' })]);
  }
  /* the privacy choice for photo details, right where photos are added (same stored choice as the privacy settings page) */
  function metaPanel() {
    var prefs = B.metaPrefs(), rows = [['date', 'Date and time', 'clock'], ['location', 'Location', 'pin'], ['camera', 'Phone or camera', 'camera'], ['other', 'Other details', 'info']];
    var all = function () { return rows.every(function (r) { return prefs[r[0]]; }); };
    var box = h('section', { class: 'mpp', 'aria-label': 'Hidden details in your photos' });
    var paint = function () {
      box.textContent = '';
      box.appendChild(h('div', { class: 'mpp-h' }, ic('lock', 22), h('div', null, h('b', null, 'Hidden details in your photos'), h('p', { class: 'ed-muted' }, 'Phone photos can carry the date, the place and the phone. Choose what we remove. You will see what each batch carries before it is added.'))));
      /* one full-width row per detail: what it is, and a two-way choice with the current one filled in */
      var info = { all: 'Date, place, phone and every other hidden detail.', date: 'The day and time each photo was taken.', location: 'Where each photo was taken (GPS).', camera: 'The make and model of your phone or camera.', other: 'Software, lens and other technical notes.' };
      var sw = function (key, label, icon, on, set) {
        var pick = function (to) { return function () { if (to !== on) { set(); paint(); } }; };
        var opt = function (to, text) { return h('button', { type: 'button', role: 'radio', 'aria-checked': String(on === to), class: 'mpp-o' + (on === to ? ' on' : '') + (to ? ' rm' : ' kp'), onclick: pick(to) }, text); };
        return h('div', { class: 'mpp-r ' + (on ? 'gone' : 'kept') + (key === 'all' ? ' all' : ''), role: 'radiogroup', 'aria-label': label }, ic(icon, 20), h('span', null, h('em', null, label), h('small', null, info[key])), h('div', { class: 'mpp-sg' }, opt(true, 'Remove'), opt(false, 'Keep')));
      };
      var line = h('div', { class: 'mpp-g' }, sw('all', 'All details', 'trash', all(), function () { var to = !all(); rows.forEach(function (r) { prefs[r[0]] = to; }); B.setMetaPrefs(prefs); }));
      rows.forEach(function (r) { line.appendChild(sw(r[0], r[1], r[2], prefs[r[0]], function () { prefs[r[0]] = !prefs[r[0]]; B.setMetaPrefs(prefs); })); });
      box.appendChild(line);
      box.appendChild(h('p', { class: 'mpp-n' }, ic('lock', 14), h('span', null, all() ? 'Everything is removed from new photos. Only the picture is kept.' : 'Some details are kept. You can change this any time in your privacy settings.')));
    };
    paint(); return box;
  }
  function screenGallery() {
    if (ROLE === 'customer' && !signedIn()) {   /* to keep the book, and to add photos safely, an account is needed */
      var gate = h('div', { class: 'gate' }, ic('lock', 28), h('b', null, 'Sign in to keep your book'),
        h('p', null, 'Everything you chose so far is saved on this device. To add your photos and keep the book safe, sign in or create a free account. You will come straight back to this step.'),
        btn('Sign in or create an account', toSignIn, { cls: 'pri big', icon: 'next' }));
      return wizardShell('gallery', 'Your photos', 'Photos are kept private to you and the studio, so this step needs an account.', gate, [btn('Back', function () { wgo('dedication'); }, { icon: 'back' })]);
    }
    var body = h('div', { class: 'gstep' }, galleryBody(false));
    var shell = wizardShell('gallery', 'Add your photos', 'Add the photos you want to choose from. Everything stays private to you and the studio.', body,
      [btn('Back', function () { wgo('dedication'); }, { icon: 'back' }), h('span', { class: 'hint' }, S.doc.gallery.length + (S.doc.gallery.length === 1 ? ' photo' : ' photos')), btn('Next: design your book', function () { var d0 = S.doc; d0.setup = 3; S.si = 0;
        var c0 = d0.pages[0]; if (!c0.items.length) { var lay0 = B.LAYOUTS.cover[1 % B.LAYOUTS.cover.length], g0 = d0.gallery[0]; c0.layout = lay0.id; c0.items = B.buildItems(d0, lay0, c0.bg, g0 ? [g0.id] : []); persist(false); }   /* the cover starts with the title and the first photo; it is designed with the rest of the book */
 var sp0 = B.spreadPages(d0, 0); S.ap = sp0.l != null ? sp0.l : sp0.r; wgo('design'); }, { cls: 'pri big', icon: 'next' })]);
    shell.querySelector('.wbk').appendChild(metaPanel());   /* the hidden-details choice lives under the 3D book, beside the photos */
    return shell;
  }

  /* ------------------------------------------------------------ gallery (wizard, sheet and picker share this) */
  function usage(id) { var n = 0; S.doc.pages.forEach(function (p) { if (p.items.some(function (i) { return i.gid === id; })) n++; }); Object.keys(S.doc.spans || {}).forEach(function (k) { if (S.doc.spans[k].some(function (i) { return i.gid === id; })) n++; }); return n; }
  /* what each photo can carry, and the choice shown before anything is added */
  var META_ROWS = [['date', 'Date and time taken', 'clock', function (m) { return m.date; }], ['location', 'Where it was taken', 'pin', function (m) { return m.place; }], ['camera', 'Phone or camera', 'camera', function (m) { return m.camera; }], ['other', 'Other details', 'info', function (m) { return m.other && m.other.length ? m.other.join(', ') : ''; }]];
  function runImport(files, metas, keep) {
    var done = 0, kill = toast('Adding ' + files.length + (files.length === 1 ? ' photo' : ' photos') + '…', { ms: 20000 });
    return files.reduce(function (p, f, i) { return p.then(function () { return B.importFile(f, keep, metas[i]).then(function (g) { S.doc.gallery.push(g); done++; }, function () {}); }); }, Promise.resolve()).then(function () {
      kill(); persist(); toast(done + (done === 1 ? ' photo added' : ' photos added'), { kind: 'good' }); S.afterAdd && S.afterAdd(); render();
    });
  }
  function askMeta(files, metas, resolve) {
    var rm = B.metaPrefs(), remember = h('input', { type: 'checkbox', id: 'mp-rem' }), N = files.length, thumbs = [];
    var rows = META_ROWS.map(function (r) { var have = metas.filter(function (m) { return r[3](m); }); return have.length ? { k: r[0], label: r[1], icon: r[2], n: have.length, ex: r[3](have[0]) } : null; }).filter(Boolean);
    var sample = metas.slice().sort(function (a, b) { return META_ROWS.filter(function (r) { return r[3](b); }).length - META_ROWS.filter(function (r) { return r[3](a); }).length; })[0];
    var before = h('ul', { class: 'mp-l' }), after = h('ul', { class: 'mp-l' }), list = h('div', { class: 'mp-rows' }), sum = h('p', { class: 'mp-sum', 'aria-live': 'polite' });
    var strip = h('div', { class: 'mp-th', 'aria-hidden': 'true' }, files.slice(0, 5).map(function (f) { var u = URL.createObjectURL(f); thumbs.push(u); return h('img', { src: u, alt: '' }); }), N > 5 ? h('span', null, '+' + (N - 5)) : null);
    var paint = function () {
      before.innerHTML = ''; after.innerHTML = ''; list.innerHTML = '';
      META_ROWS.forEach(function (r) {
        var v = sample && r[3](sample); if (!v) return;
        before.appendChild(h('li', null, ic(r[2], 16), h('span', null, v)));
        after.appendChild(h('li', { class: rm[r[0]] ? 'gone' : 'kept' }, ic(r[2], 16), h('span', null, v), h('b', null, rm[r[0]] ? 'Removed' : 'Kept')));
      });
      after.appendChild(h('li', { class: 'kept always' }, ic('photo', 16), h('span', null, 'The picture, colours and size'), h('b', null, 'Kept')));
      rows.forEach(function (r) {
        var on = rm[r.k];
        list.appendChild(h('div', { class: 'mp-r ' + (on ? 'gone' : 'kept') },
          h('div', { class: 'mp-i' }, ic(r.icon, 20)),
          h('div', { class: 'mp-t' }, h('b', null, r.label), h('small', null, 'Found in ' + r.n + ' of ' + N + (N === 1 ? ' photo' : ' photos') + ' \u00b7 e.g. ' + r.ex)),
          h('div', { class: 'mp-sg', role: 'group', 'aria-label': r.label }, [['Keep', false], ['Remove', true]].map(function (o) { return h('button', { type: 'button', class: o[1] === on ? 'on' : '', 'aria-pressed': String(o[1] === on), onclick: function () { rm[r.k] = o[1]; paint(); } }, o[0]); }))));
      });
      var gone = rows.filter(function (r) { return rm[r.k]; }).length;
      sum.textContent = gone === rows.length ? 'Everything will be removed. Only the picture is kept.' : (gone === 0 ? 'Everything will be kept with your photos.' : gone + ' of ' + rows.length + ' kinds of detail will be removed.');
    };
    var finish = function (go) {
      thumbs.forEach(function (u) { URL.revokeObjectURL(u); }); closeDlg();
      if (!go) return resolve();
      var keep = { date: !rm.date, location: !rm.location, camera: !rm.camera, other: !rm.other };
      if (remember.checked) B.setMetaPrefs(rm);
      resolve(runImport(files, metas, keep));
    };
    var setAll = function (v) { rows.forEach(function (r) { rm[r.k] = v; }); META_ROWS.forEach(function (r) { rm[r[0]] = v; }); paint(); };
    paint();
    var body = h('div', { class: 'dl-s mp' }, strip,
      h('p', { class: 'ed-muted' }, 'Photos from a phone carry hidden details. Choose what we keep. The picture itself is never changed.'),
      h('div', { class: 'mp-q' }, btn('Remove all details', function () { setAll(true); }, { icon: 'trash' }), btn('Keep all details', function () { setAll(false); }, { icon: 'tick' })),
      list,
      h('div', { class: 'mp-ba' }, h('div', null, h('h3', null, 'As it comes from your phone'), before), h('div', null, h('h3', null, 'As we keep it'), after)), sum,
      h('label', { class: 'mp-rm', for: 'mp-rem' }, remember, h('span', null, 'Use these choices every time. You can change them in '), h('a', { href: (document.documentElement.getAttribute('data-theme') === 'dark' ? '/G' : '/GL') + '121-PrivateUpload.dc.html', target: '_blank', rel: 'noopener' }, 'privacy settings')));
    dialog('Before we add your ' + (N === 1 ? 'photo' : 'photos'), body, [btn('Cancel', function () { finish(false); }), btn('Add ' + N + (N === 1 ? ' photo' : ' photos'), function () { finish(true); }, { cls: 'pri', icon: 'plus' })], { wide: true, onclose: function () { thumbs.forEach(function (u) { URL.revokeObjectURL(u); }); resolve(); } });
  }
  function addFiles(files) {
    files = [].slice.call(files).filter(function (f) { return /^image\//.test(f.type) || /\.(jpe?g|png|webp|gif|heic)$/i.test(f.name); });
    if (!files.length) { toast('Pick photos (JPG, PNG or WebP)', { kind: 'bad' }); return Promise.resolve(); }
    return Promise.all(files.map(function (f) { return B.readMeta(f); })).then(function (metas) {
      var any = metas.some(function (m) { return m.date || m.place || m.camera || (m.other && m.other.length); });
      if (!any) return runImport(files, metas, {});   /* nothing hidden in these files */
      return new Promise(function (resolve) { askMeta(files, metas, resolve); });
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
  function pagesUsing(ids) {
    var n = 0;
    S.doc.pages.forEach(function (p) { if (p.items.some(function (i) { return ids.indexOf(i.gid) > -1; })) n++; });
    Object.keys(S.doc.spans || {}).forEach(function (k) { if (S.doc.spans[k].some(function (i) { return ids.indexOf(i.gid) > -1; })) n++; });
    return n;
  }
  function deletePhotos(ids, how) {
    var now = Date.now();
    ids.forEach(function (id) {
      var g = gal(id); if (!g) return;
      var n = usage(id);
      S.doc.deleted.push({ id: B.uid('d'), name: g.name, w: g.w, h: g.h, sample: !!g.sample, t: now, how: how, pages: n });
      if (!g.sample) B.delBlob(g.id).catch(function () {});
    });
    S.doc.pages.forEach(function (p) { p.items.forEach(function (i) { if (ids.indexOf(i.gid) > -1) i.gid = null; }); });
    Object.keys(S.doc.spans || {}).forEach(function (k) { S.doc.spans[k].forEach(function (i) { if (ids.indexOf(i.gid) > -1) i.gid = null; }); });
    S.doc.gallery = S.doc.gallery.filter(function (g) { return ids.indexOf(g.id) < 0; });
    S.lib.picked = S.lib.picked.filter(function (id) { return ids.indexOf(id) < 0; });
    persist(); render();
  }
  function removePhoto(g) {
    var n = usage(g.id);
    window.MilesUI.confirm({ title: 'Delete this photo?', body: (n ? 'It is used on ' + n + (n === 1 ? ' page' : ' pages') + '. Those spots become empty, ready for another photo. ' : '') + 'The file is removed from our storage and cannot be brought back.', confirmLabel: 'Yes, delete it', danger: true }).then(function (ok) { if (ok) { deletePhotos([g.id], 'one'); toast('Photo deleted'); } });
  }
  function togglePick(id) {
    var i = S.picks.indexOf(id), max = S.pickMax || 1;
    if (i > -1) S.picks.splice(i, 1); else if (max === 1) S.picks = [id]; else if (S.picks.length < max) S.picks.push(id); else { toast('This layout has ' + max + (max === 1 ? ' photo' : ' photos') + '. Tap one to swap it out.'); return; }
    var m = document.querySelector('dialog.dlg'); var keep = m && m.querySelector('.gl'); if (keep) { var fresh = galleryBody(true); keep.replaceWith(fresh); var c = document.getElementById('pickcount'); if (c) c.textContent = pickLabel(); var sv = document.getElementById('picksave'); if (sv) sv.disabled = S.pickNeed && !S.picks.length; }
  }
  var pickLabel = function () { var max = S.pickMax || 1; return S.picks.length + (max > 1 ? ' of ' + max : '') + ' selected'; };

  /* ------------------------------------------------------------ photo gallery and privacy: what we hold, what was deleted, delete some or all */
  function when(t) { return new Date(t).toLocaleString([], { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }); }
  function saveCopy(g) {
    B.blobOf(g).then(function (b) { if (!b) return toast('That file is not available to download', { kind: 'bad' }); var u = URL.createObjectURL(b), a = document.createElement('a'); a.href = u; a.download = (g.name || 'photo') + '.jpg'; document.body.appendChild(a); a.click(); a.remove(); setTimeout(function () { URL.revokeObjectURL(u); }, 4000); }).catch(function () { toast('Could not download that photo', { kind: 'bad' }); });
  }
  function typedConfirm(o) {
    var inp = h('input', { type: 'text', autocomplete: 'off', 'aria-label': 'Type ' + o.word + ' to confirm', placeholder: o.word, maxlength: 12 });
    var go = btn(o.label, function () { closeDlg(); o.ok(); }, { cls: 'pri danger-b', icon: 'trash' }); go.disabled = true;
    inp.addEventListener('input', function () { go.disabled = inp.value.trim().toUpperCase() !== o.word; });
    dialog(o.title, h('div', { class: 'dl-s' }, h('p', { class: 'warn' }, o.body), o.list ? h('ul', { class: 'wl' }, o.list.map(function (x) { return h('li', null, x); })) : null, h('label', { class: 'fld' }, h('span', null, 'Type ' + o.word + ' to confirm'), inp)), [btn('Keep my photos', function () { closeDlg(); }), go]);
    inp.focus();
  }
  function askDelete(ids, all) {
    var n = ids.length, used = pagesUsing(ids);
    var impact = [n + (n === 1 ? ' photo is' : ' photos are') + ' removed from our storage. We do not keep a copy.', used ? used + (used === 1 ? ' page uses' : ' pages use') + ' ' + (n === 1 ? 'it' : 'them') + ': ' + (used === 1 ? 'that spot becomes' : 'those spots become') + ' empty. Your text and layouts stay.' : 'None of them is used on a page, so your book does not change.', 'This cannot be undone. Download a copy first if you want to keep ' + (n === 1 ? 'it' : 'them') + '.'];
    if (all) typedConfirm({ title: 'Delete all ' + n + ' photos?', body: 'This removes every photo we hold for your book.', list: impact, word: 'DELETE', label: 'Delete all photos', ok: function () { deletePhotos(ids, 'all'); toast('All photos deleted'); } });
    else window.MilesUI.confirm({ title: 'Delete ' + n + (n === 1 ? ' photo?' : ' photos?'), body: impact.join(' '), confirmLabel: 'Yes, delete ' + (n === 1 ? 'it' : 'them'), danger: true }).then(function (ok) { if (ok) { S.lib.selecting = false; deletePhotos(ids, 'selected'); toast(n + (n === 1 ? ' photo deleted' : ' photos deleted')); } });
  }
  function metaLine(g) {   /* what we kept and what we removed when this photo was added */
    if (g.sample || (!g.meta && !g.stripped)) return null;
    var nm = { date: 'date and time', place: 'location', camera: 'phone or camera', other: 'other details', location: 'location' }, kept = Object.keys(g.meta || {}), gone = g.stripped || [];
    return h('p', { class: 'mp-line' }, ic(gone.length || !kept.length ? 'lock' : 'info', 16), h('span', null, !kept.length && !gone.length ? 'No hidden details were found in this photo.' : (gone.length ? 'Removed: ' + gone.map(function (k) { return nm[k]; }).join(', ') + '. ' : '') + (kept.length ? 'Kept: ' + kept.map(function (k) { return nm[k] + ' (' + g.meta[k] + ')'; }).join('; ') + '.' : (gone.length ? 'Nothing else is stored with it.' : ''))));
  }
  function photoDialog(g) {
    var n = usage(g.id), src = B.url(g), im = h('img', { src: src, alt: g.name, class: 'big' }); im.addEventListener('error', function () { im.src = PLACE(g.id); }, { once: true });
    dialog(g.name, h('div', { class: 'dl-s' }, im, h('p', { class: 'ed-muted' }, (g.w ? g.w + ' \u00d7 ' + g.h + ' px \u00b7 ' : '') + (n ? 'used on ' + n + (n === 1 ? ' page' : ' pages') : 'not used on any page') + (g.sample ? ' \u00b7 sample photo' : '')), metaLine(g)),
      [btn('Download a copy', function () { saveCopy(g); }, { icon: 'down' }), ROLE === 'studio' ? null : btn('Delete this photo', function () { closeDlg(); removePhoto(g); }, { icon: 'trash', cls: 'danger' }), btn('Close', function () { closeDlg(); }, { cls: 'pri' })]);
  }
  function screenLibrary() {
    var d = S.doc, L = S.lib, customer = ROLE === 'customer', only = S.only;
    if (only) L.tab = 'stored';
    var inBook = d.gallery.filter(function (g) { return usage(g.id) > 0; }).length, unused = d.gallery.length - inBook;
    var stat = function (n, label) { return h('div', { class: 'stat' }, h('b', null, String(n)), h('span', null, label)); };
    var tabs = h('div', { class: 'tabs', role: 'tablist' }, [['stored', 'What we hold ' + d.gallery.length], ['deleted', 'Deleted ' + d.deleted.length]].map(function (t) { return h('button', { type: 'button', role: 'tab', 'aria-selected': String(L.tab === t[0]), class: L.tab === t[0] ? 'on' : '', onclick: function () { L.tab = t[0]; render(); } }, t[1]); }));
    var body;
    if (L.tab === 'deleted') {
      body = d.deleted.length ? h('ul', { class: 'dlog' }, d.deleted.slice().reverse().map(function (x) { return h('li', null, h('span', { class: 'gone', 'aria-hidden': 'true' }, ic('trash', 20)), h('div', null, h('b', null, x.name), h('small', null, 'Deleted ' + when(x.t) + ' \u00b7 ' + (x.how === 'all' ? 'with Delete all' : (x.how === 'selected' ? 'selected by you' : 'deleted one by one')) + (x.pages ? ' \u00b7 it was on ' + x.pages + (x.pages === 1 ? ' page' : ' pages') : ' \u00b7 it was not on a page') + (x.sample ? ' \u00b7 sample photo' : '')))); })) : h('p', { class: 'empty' }, 'Nothing has been deleted. When you delete a photo, it is listed here with the date.');
      if (d.deleted.length) body = h('div', null, h('p', { class: 'ed-muted' }, 'The photo files are gone from our storage. This list only keeps the name and the date, so you can see what was removed.'), body);
    } else {
      var ids = d.gallery.map(function (g) { return g.id; });
      var bar = h('div', { class: 'libbar' },
        !customer ? h('p', { class: 'ed-muted' }, 'Studio view: you can see and download the photos for this order. Only the customer can delete them.') : [
          L.selecting ? [btn('Select all', function () { L.picked = ids.slice(); render(); }, { icon: 'tick' }), btn('Delete selected (' + L.picked.length + ')', function () { if (L.picked.length) askDelete(L.picked.slice(), L.picked.length === ids.length && ids.length > 1); }, { icon: 'trash', cls: 'danger', dis: !L.picked.length }), btn('Cancel', function () { L.selecting = false; L.picked = []; render(); }, {})]
            : [btn('Select photos', function () { L.selecting = true; L.picked = []; render(); }, { icon: 'tick', dis: !ids.length }), btn('Add photos', function () { openSheet('gallery'); }, { icon: 'plus' }), h('span', { class: 'sp' }), btn('Delete all photos', function () { askDelete(ids, true); }, { icon: 'trash', cls: 'danger', dis: !ids.length })]]);
      var grid = h('ul', { class: 'gal lg' }, d.gallery.map(function (g) {
        var n = usage(g.id), on = L.picked.indexOf(g.id) > -1, src = B.url(g), im = h('img', { src: src, alt: '', loading: 'lazy', draggable: 'false' }); im.addEventListener('error', function () { im.src = PLACE(g.id); }, { once: true });
        return h('li', null, h('button', { type: 'button', class: 'tl' + (on ? ' on' : ''), 'aria-pressed': L.selecting ? String(on) : null, 'aria-label': g.name + (n ? ', used on ' + n + ' pages' : ', not used') + (L.selecting && on ? ', selected' : ''), onclick: function () { if (L.selecting) { var i = L.picked.indexOf(g.id); if (i > -1) L.picked.splice(i, 1); else L.picked.push(g.id); render(); } else photoDialog(g); } }, im, on ? h('i', { class: 'pk' }, '\u2713') : null, h('small', { class: 'used' }, n ? n + (n === 1 ? ' page' : ' pages') : 'not used')), h('span', { class: 'nm' }, g.name));
      }));
      body = h('div', null, bar, d.gallery.length ? grid : h('p', { class: 'empty' }, 'No photos are stored. Add photos from the editor when you are ready.'));
    }
    return h('div', { class: 'app' }, topbar(true), h('main', { class: 'lb', id: 'main' },
      h('h1', null, only ? 'Gallery' : (ROLE === 'studio' ? 'Customer photo gallery' : 'Your photo gallery')),
      only ? h('p', { class: 'lead' }, d.gallery.length + (d.gallery.length === 1 ? ' photo' : ' photos') + '. Tap Select photos to delete some, or Delete all photos to clear the gallery. Deleting removes the file from our storage for good.') : null,
      only ? null : h('p', { class: 'lead' }, 'Every photo we hold for this book, what has been deleted, and how to remove photos. Your photos are private to you' + (customer ? ' and the studio.' : ' and the studio; this view is for the order only.')),
      only ? null : h('div', { class: 'stats' }, stat(d.gallery.length, 'photos we hold'), stat(inBook, 'used in the book'), stat(unused, 'not used yet'), stat(d.deleted.length, 'deleted')),
      only ? null : h('p', { class: 'priv' }, ic('lock', 18), h('span', null, 'Deleting a photo removes the file from our storage. It is not kept in a bin. The pages that used it keep their text and layout, and the photo spot becomes empty.')),
      only ? null : tabs, body,
      h('div', { class: 'foot' }, only ? h('a', { class: 'bt', href: '/GL9-Account.dc.html' }, ic('back'), h('span', null, 'Back to my account')) : h('a', { class: 'bt', href: '/book/editor.html?as=' + ROLE }, ic('back'), h('span', null, 'Back to the editor')))));
  }

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
    var w = h('span', { class: 'mini' + (l.span ? ' two' : '') });
    if (l.span) { w.appendChild(h('i', { class: 'img', style: { left: l.span.x + '%', top: l.span.y + '%', width: l.span.w + '%', height: l.span.h + '%' } })); w.appendChild(h('i', { class: 'fold' })); return w; }
    l.items.forEach(function (it) { w.appendChild(h('i', { class: it.t, style: { left: it.x + '%', top: it.y + '%', width: it.w + '%', height: (it.t === 'img' ? it.h : 8) + '%' } })); });
    return w;
  }
  function stepOne(cur, kind) {
    var own = B.LAYOUTS[kind], canBoth = kind === 'page' && B.canSpan(S.doc, B.spreadOf(S.doc, cur.pi)), both = canBoth ? B.LAYOUTS.spread : [], lays = own.concat(both), lay = function () { return lays.filter(function (l) { return l.id === cur.lay; })[0] || own[0]; };
    var sw = h('div', { class: 'sw', role: 'radiogroup', 'aria-label': 'Page colour' }, B.COLORS.map(function (c) { return h('button', { type: 'button', role: 'radio', 'aria-checked': String(c.toLowerCase() === cur.bg.toLowerCase()), 'aria-label': 'Colour ' + c, class: c.toLowerCase() === cur.bg.toLowerCase() ? 'on' : '', style: { background: c }, onclick: function () { cur.bg = c; stepOne(cur, kind); } }); }), h('label', { class: 'custom', title: 'Pick any colour' }, h('span', { class: 'ed-vh' }, 'Custom colour'), h('input', { type: 'color', value: /^#[0-9a-f]{6}$/i.test(cur.bg) ? cur.bg : '#ffffff', oninput: function (e) { cur.bg = e.target.value; document.querySelectorAll('dialog.dlg .lay .mini').forEach(function (m) { m.style.background = cur.bg; }); } }), '+'));
    var mk = function (l) { var mini = layMini(l); mini.style.background = cur.bg; return h('button', { type: 'button', class: 'lay' + (l.id === cur.lay ? ' on' : ''), role: 'radio', 'aria-checked': String(l.id === cur.lay), onclick: function () { cur.lay = l.id; stepOne(cur, kind); } }, mini, h('small', null, l.name)); };
    var lg = h('div', { class: 'lays', role: 'radiogroup', 'aria-label': 'Layout' }, own.map(mk)), lg2 = both.length ? h('div', { class: 'lays two', role: 'radiogroup', 'aria-label': 'Across both pages' }, both.map(mk)) : null;
    var slots = B.slotsOf(lay());
    dialog(B.pageLabel(S.doc, cur.pi) + ': colour and layout', h('div', { class: 'dl-s' }, h('p', { class: 'ed-muted' }, 'Pick a background colour, then a starting layout. Nothing is fixed: you can move, resize or turn everything afterwards.'), h('h3', null, 'Colour'), sw, h('h3', null, both.length ? 'This page' : 'Layout'), lg, lg2 ? [h('h3', null, 'Across both pages'), h('p', { class: 'ed-muted' }, 'One photo that runs over the fold with no break in the middle.'), lg2] : (kind === 'page' ? h('p', { class: 'ed-muted spanno' }, ic('lock', 14), h('span', null, 'These two pages cannot share one photo. A photo can run across pages ' + B.spanSpreads(S.doc).slice(0, 4).map(function (s) { return (2 * s - 1) + ' and ' + 2 * s; }).join(', ') + ' and so on.')) : null)),
      [btn('Cancel', function () { closeDlg(); }), slots ? btn('Next: choose photos', function () { stepTwo(cur, kind, lay()); }, { cls: 'pri', icon: 'next' }) : btn('Save', function () { applyFlow(cur, lay(), []); }, { cls: 'pri', icon: 'check' })], { wide: true, onclose: function () { S.flow = null; } });
  }
  function stepTwo(cur, kind, lay) {
    var n = B.slotsOf(lay);
    S.picks = []; S.pickMax = n; S.pickNeed = false; S.tab = 'all';
    var body = h('div', { class: 'dl-s' }, h('p', { class: 'ed-muted' }, n === 1 ? (lay.span ? 'Choose the photo that runs across both pages.' : 'Choose the photo for this page.') : 'Choose up to ' + n + ' photos. They fill the spots in the order you tap them. Leave any out and add them later.'), h('p', { class: 'pc', id: 'pickcount', 'aria-live': 'polite' }, pickLabel()), galleryBody(true));
    S.afterAdd = function () { var m = document.querySelector('dialog.dlg .gl'); if (m) m.replaceWith(galleryBody(true)); };
    dialog(B.pageLabel(S.doc, cur.pi) + ': choose photos', body, [btn('Back', function () { stepOne(cur, kind); }, { icon: 'back' }), btn('Save', function () { applyFlow(cur, lay, S.picks.slice()); }, { cls: 'pri', icon: 'check' })].map(function (b, i) { if (i === 1) b.id = 'picksave'; return b; }), { wide: true, onclose: function () { S.flow = null; S.afterAdd = null; } });
  }
  function applyFlow(cur, lay, picks) {
    var p = S.doc.pages[cur.pi], last = S.doc.pages.length - 1, inner = cur.pi > 0 && cur.pi < last, si = Math.ceil(cur.pi / 2), spread = [2 * si - 1, 2 * si].filter(function (i) { return i > 0 && i < last; });
    var hadSpan = inner && (S.doc.spans[si] || []).length, go = function () {
      if (lay.span) {
        spread.forEach(function (i) { var q = S.doc.pages[i]; q.bg = cur.bg; q.layout = lay.id; q.items = []; q.doodle = q.doodle || []; });
        S.doc.spans[si] = [B.spanItem(lay, picks[0])];
      } else {
        if (hadSpan) delete S.doc.spans[si];
        p.bg = cur.bg; p.layout = lay.id; p.items = B.buildItems(S.doc, lay, cur.bg, picks);
      }
      S.sel = null; S.crop = null; S.afterAdd = null;
      closeDlg(); persist(); render(); toast((lay.span ? 'Pages ' + spread[0] + ' and ' + spread[1] : B.pageLabel(S.doc, cur.pi)) + ' saved', { kind: 'good' });
    };
    var busy = lay.span ? spread.some(function (i) { return S.doc.pages[i].items.length; }) || hadSpan : (p.items.length && p.layout !== lay.id) || hadSpan;
    if (busy && (lay.span ? true : (p.layout !== lay.id || hadSpan))) window.MilesUI.confirm({ title: lay.span ? 'Replace both pages?' : 'Replace what is on this page?', body: lay.span ? 'The photos and text on these two pages will be swapped for one photo across both. You can undo this.' : (hadSpan ? 'The photo across both pages will be removed and this page gets the new layout. You can undo this.' : 'The photos and text on it now will be swapped for the new layout. You can undo this.'), confirmLabel: 'Replace' }).then(function (ok) { if (ok) go(); }); else go();
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
      title = 'Your photos'; S.picks = []; body = h('div', null, galleryBody(false), h('p', { class: 'libl' }, h('a', { href: '/book/editor.html?as=' + ROLE + '&view=gallery' }, 'See everything we hold, what was deleted, and delete photos'))); S.afterAdd = function () { var el = document.querySelector('#sheet .gl'); if (el) el.replaceWith(galleryBody(false)); };
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
        h('hr'), btn('Start the steps again', function () { closeSheet(); wgo('event'); }, { icon: 'back' }));
    }
    var sh = h('div', { id: 'sheet', class: 'sheet-w' }, h('div', { class: 'scrim', onclick: closeSheet }), h('section', { class: 'sheet', role: 'dialog', 'aria-modal': 'true', 'aria-label': title }, h('div', { class: 'dl-h' }, h('b', null, title), h('button', { type: 'button', class: 'sq', 'aria-label': 'Close', onclick: closeSheet }, ic('close'))), h('div', { class: 'dl-b' }, body)));
    document.body.appendChild(sh);
    var f = sh.querySelector('.dl-h .sq'); if (f) f.focus();
  }
  function sendToStudio() {
    if (ROLE === 'customer' && !signedIn()) { toast('Sign in to send your book to the studio', { kind: 'bad' }); setTimeout(toSignIn, 900); return; }
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
  function goto(s) { S.si = clamp(s, 0, B.spreadCount(S.doc) - 1); var sp = B.spreadPages(S.doc, S.si); S.ap = sp.r != null ? sp.r : sp.l; if (S.compact && sp.l != null && sp.r != null) S.ap = sp.l; S.sel = null; S.crop = null; render(); }
  /* phones show one page, except while the spread has a photo across both pages: then both pages show together */
  function one() { if (!S.compact) return false; var sp = B.spreadPages(S.doc, S.si); return !(sp.l != null && sp.r != null && (S.doc.spans[S.si] || []).length); }
  function shift(sp) { return sp.l == null ? -25 : (sp.r == null ? 25 : 0); }
  function turn(dir) {
    if (S.turning) return;
    if (S.compact) { var cs = B.spreadPages(S.doc, S.si), np = clamp(one() ? S.ap + dir : (dir > 0 ? cs.r + 1 : cs.l - 1), 0, S.doc.pages.length - 1); if (np === S.ap || (!one() && (np === cs.l || np === cs.r))) return; S.ap = np; S.si = B.spreadOf(S.doc, np); S.sel = null; S.crop = null; render(); return; }
    var ns = S.si + dir; if (ns < 0 || ns >= B.spreadCount(S.doc)) return;
    var bk = document.querySelector('.bk'); if (!bk || reduce() || S.compact) { goto(ns); return; }
    S.turning = true; S.sel = null; S.editing = null; S.crop = null;
    var cur = B.spreadPages(S.doc, S.si), nxt = B.spreadPages(S.doc, ns), inner = bk.querySelector('.bk-in');
    var side = function (i) { return i == null ? h('div', { class: 'bpg blank' }) : pageEl(i, false); };
    var L = bk.querySelector('.side.l'), R = bk.querySelector('.side.r');
    var leaf = h('div', { class: 'leaf ' + (dir > 0 ? 'fw' : 'bw') }, h('div', { class: 'face f' }, side(dir > 0 ? cur.r : cur.l)), h('div', { class: 'face b' }, side(dir > 0 ? nxt.l : nxt.r)), h('div', { class: 'shade' }));
    var sl = bk.querySelector('.spanl'); if (sl) sl.remove();
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
  function spanHolder(k) { var o = {}; Object.defineProperty(o, 'items', { get: function () { return S.doc.spans[k]; }, set: function (v) { if (v.length) S.doc.spans[k] = v; else delete S.doc.spans[k]; } }); return o; }
  function findItem(id) {
    var out = null;
    S.doc.pages.forEach(function (p, i) { p.items.forEach(function (it) { if (it.id === id) out = { it: it, pi: i, page: p }; }); });
    Object.keys(S.doc.spans || {}).forEach(function (k) { S.doc.spans[k].forEach(function (it) { if (it.id === id) out = { it: it, pi: 'span', page: spanHolder(k) }; }); });
    return out;
  }
  function selItem() { return S.sel ? findItem(S.sel) : null; }

  function spanLayer(sp) {
    var list = sp.l != null && sp.r != null ? (S.doc.spans[S.si] || []) : [];
    if (!list.length) return null;
    var el = h('div', { class: 'spanl' }); list.forEach(function (it) { el.appendChild(itemEl(it, 'span', true)); }); return el;
  }
  function screenDesign() {
    var d = S.doc, tot = B.spreadCount(d), sp = B.spreadPages(d, S.si), o1 = one(), done = d.pages.filter(function (p) { return p.done; }).length;
    var heading = o1 ? B.pageLabel(d, S.ap) : (S.si === 0 ? 'The cover' : (S.si === tot - 1 ? 'The back cover' : 'Pages ' + sp.l + ' and ' + sp.r));
    var bk = h('div', { class: 'bk' + (S.draw.on ? ' draw-on' : '') + (o1 ? ' single' : '') + (S.si === 0 ? ' closed r' : (S.si === tot - 1 ? ' closed l' : '')), style: { '--ratio': d.ratio, '--stack': Math.round(3 + (d.count || 40) / 8) + 'px' } },
      h('div', { class: 'bk-in', style: o1 ? null : { transform: 'translateX(' + shift(sp) + '%)' } },
        o1 ? h('div', { class: 'side one' }, pageEl(S.ap, true))
          : [h('div', { class: 'side l' + (sp.l == null ? ' none' : '') }, sp.l != null ? pageEl(sp.l, true, true) : null), h('div', { class: 'side r' + (sp.r == null ? ' none' : '') }, sp.r != null ? pageEl(sp.r, true, true) : null), spanLayer(sp), h('div', { class: 'spine', 'aria-hidden': 'true' })]));
    wire(bk);
    var pgOnScreen = o1 ? [S.ap] : [sp.l, sp.r].filter(function (x) { return x != null; });
    var allDone = pgOnScreen.every(function (i) { return d.pages[i].done; });
    var nextLabel = S.si >= tot - 1 && !o1 ? null : (o1 ? 'Next page' : 'Next pages');
    return h('div', { class: 'app' }, topbar(false), banner(),
      h('main', { class: 'ds', id: 'main' }, stepHeader('design'),
        h('div', { class: 'dh' }, h('div', null, h('h1', null, heading), h('p', { class: 'ed-muted' }, o1 ? 'Page ' + (S.ap + 1) + ' of ' + d.pages.length : 'Spread ' + (S.si + 1) + ' of ' + tot)), h('div', { class: 'pr' }, h('span', null, done + ' of ' + d.pages.length + ' pages done'), h('div', { class: 'pgbar', role: 'progressbar', 'aria-label': 'Pages done', 'aria-valuemin': '0', 'aria-valuemax': String(d.pages.length), 'aria-valuenow': String(done) }, h('i', { style: { inlineSize: Math.round(done / d.pages.length * 100) + '%' } })))),
        h('div', { class: 'stage' }, h('button', { type: 'button', class: 'turn prev', 'aria-label': o1 ? 'Previous page' : 'Turn back', onclick: function () { turn(-1); }, disabled: o1 ? S.ap === 0 : S.si === 0 }, ic('back', 26)), bk, h('button', { type: 'button', class: 'turn next', 'aria-label': o1 ? 'Next page' : 'Turn the page', onclick: function () { turn(1); }, disabled: o1 ? S.ap >= d.pages.length - 1 : S.si >= tot - 1 }, ic('next', 26))),
        toolbar(),
        h('div', { class: 'nav' }, btn('Back', function () { wgo('gallery'); }, { icon: 'back', title: 'Back to your photos' }), btn(allDone ? 'Done' : 'Mark done', function () { pgOnScreen.forEach(function (i) { d.pages[i].done = !allDone; }); persist(); render(); }, { icon: 'check', pressed: allDone, cls: allDone ? 'on' : '' }), nextLabel ? btn(nextLabel, function () { pgOnScreen.forEach(function (i) { d.pages[i].done = true; }); persist(false); turn(1); }, { cls: 'pri', icon: 'next', title: 'Mark done and turn to the next pages' }) : null)));
  }

  /* contextual toolbar */
  /* which of the two pages the tools below act on (a photo across both pages covers the page, so tapping it would not say) */
  function pageSwitch() {
    var sp = B.spreadPages(S.doc, S.si); if (one() || sp.l == null || sp.r == null) return null;
    return h('div', { class: 'pgsw', role: 'group', 'aria-label': 'Page to work on' }, [[sp.l, 'Left page'], [sp.r, 'Right page']].map(function (x) { return h('button', { type: 'button', class: 'bt' + (S.ap === x[0] ? ' on' : ''), 'aria-pressed': String(S.ap === x[0]), onclick: function () { S.ap = x[0]; S.sel = null; render(); } }, h('span', null, x[1])); }));
  }
  function toolbar() {
    var d = S.doc, s = selItem(), t = h('div', { class: 'tools', role: 'toolbar', 'aria-label': 'Page tools' });
    var upd = function (f) { return function () { var c = selItem(); if (!c) return; f(c.it, c); persist(); render(); }; };
    if (S.draw.on) { var sw0 = pageSwitch(); if (sw0) t.appendChild(sw0); drawBar(t); return t; }
    if (!s) {
      var sw1 = pageSwitch(); if (sw1) t.appendChild(sw1);
      t.appendChild(btn('Colour & layout', function () { openFlow(S.ap); }, { icon: 'palette' }));
      t.appendChild(btn('Add photo', function () { pickOne(function (id) { addItem({ t: 'img', x: 20, y: 20, w: 50, h: 45, gid: id, fit: 'cover', r: 0, shape: 'rect', frame: 'none', zoom: 1, fx: 50, fy: 50 }); }); }, { icon: 'photo' }));
      t.appendChild(btn('Draw', function () { S.draw.on = true; S.sel = null; S.editing = null; render(); }, { icon: 'pencil' }));
      if (one() && (d.spans[S.si] || []).length) t.appendChild(btn('Spread photo', function () { S.sel = d.spans[S.si][0].id; render(); }, { icon: 'photo' }));
      t.appendChild(btn('Shape text', function () { var p = d.pages[S.ap]; addItem({ t: 'text', x: 25, y: 30, w: 50, h: 40, text: 'Your words', size: 5, align: 'center', font: 'Fraunces', weight: 500, color: B.ink('#e0a030'), r: 0, shape: 'circle', fill: '#e0a030', line: 0 }, false); openShape(); }, { icon: 'shape' }));
      t.appendChild(btn('Add text', function () { var p = d.pages[S.ap]; addItem({ t: 'text', x: 15, y: 40, w: 70, h: 0, text: 'Type here', size: 5, align: 'center', font: 'Fraunces', weight: 400, color: B.ink(p.bg), r: 0 }, true); }, { icon: 'text' }));
      if (!sw1) t.appendChild(h('span', { class: 'hint' }, 'Tap a photo or text to move, resize or turn it. ' + B.pageLabel(d, S.ap) + ' is selected.'));
      return t;
    }
    var it = s.it;
    t.appendChild(btn('Done', function () { S.sel = null; S.editing = null; S.crop = null; render(); }, { icon: 'check', cls: 'ghost' }));
    if (it.t === 'img' && S.crop === it.id) {   /* crop: drag the photo inside its frame, zoom with the buttons */
      t.appendChild(h('span', { class: 'hint' }, 'Drag the photo inside the frame.'));
      t.appendChild(btn('', upd(function (i) { i.zoom = clamp(+((i.zoom || 1) - .2).toFixed(2), 1, 4); }), { aria: 'Zoom out', cls: 'sq', icon: 'minus' }));
      t.appendChild(h('span', { class: 'sz' }, Math.round((it.zoom || 1) * 100) + '%'));
      t.appendChild(btn('', upd(function (i) { i.zoom = clamp(+((i.zoom || 1) + .2).toFixed(2), 1, 4); }), { aria: 'Zoom in', cls: 'sq', icon: 'plus' }));
      t.appendChild(btn('Reset', upd(function (i) { i.zoom = 1; i.fx = 50; i.fy = 50; }), {}));
      t.appendChild(btn('Finish crop', function () { S.crop = null; render(); }, { icon: 'check', cls: 'pri' }));
      return t;
    }
    if (it.t === 'text') {
      t.appendChild(btn('Edit', function () { S.editing = it.id; render(); focusEdit(); }, { icon: 'edit', cls: S.editing === it.id ? 'on' : '' }));
      t.appendChild(btn('Shape', openShape, { icon: 'shape' }));
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
      if (it.gid) {
        t.appendChild(btn('Shape & frame', openShape, { icon: 'shape' }));
        t.appendChild(btn('Crop', function () { S.crop = it.id; render(); }, { icon: 'crop' }));
        t.appendChild(btn(it.fit === 'contain' ? 'Fill frame' : 'Fit whole photo', upd(function (i) { i.fit = i.fit === 'contain' ? 'cover' : 'contain'; }), {}));
      }
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
      var hd = e.target.closest('.hd'), itEl = e.target.closest('.it'), pgEl = e.target.closest('.bpg'), cta = e.target.closest('.cta'), spEl = itEl && itEl.closest('.spanl');
      if (cta) { S.ap = +cta.dataset.p; S.sel = null; S.editing = null; return; }
      if (S.draw.on) { if (pgEl && pgEl.dataset.i) { e.preventDefault(); startDraw(e, pgEl); } return; }
      if (!spEl && (!pgEl || !pgEl.dataset.i)) return;
      var pi = pgEl ? +pgEl.dataset.i : S.ap;
      if (!itEl) { if (S.ap !== pi || S.sel) { S.ap = pi; S.sel = null; S.editing = null; S.crop = null; render(); } return; }
      if (S.editing === itEl.dataset.id) return;
      var found = findItem(itEl.dataset.id); if (!found) return; var it = found.it;
      var wasSel = S.sel === it.id; if (!spEl) S.ap = pi;
      if (!wasSel) { S.sel = it.id; S.editing = null; S.crop = null; }
      e.preventDefault();
      beginDrag(e, itEl, spEl || pgEl, it, hd ? hd.dataset.h : null, wasSel);
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
    var crop = S.crop === it.id && it.t === 'img', f0 = { x: it.fx == null ? 50 : it.fx, y: it.fy == null ? 50 : it.fy };
    function mv(ev) {
      var dx = ev.clientX - sx, dy = ev.clientY - sy;
      if (!moved && Math.hypot(dx, dy) < 4) return; moved = true; S.dragMoved = true;
      if (crop) {   /* pan the photo inside its frame */
        var z = Math.max((it.zoom || 1) - 1, .35), ew = Math.max(el.offsetWidth, 1), eh = Math.max(el.offsetHeight, 1);
        it.fx = clamp(f0.x - dx / ew * 100 / z, 0, 100); it.fy = clamp(f0.y - dy / eh * 100 / z, 0, 100);
        var im = el.querySelector('img'); if (im) { var pos = it.fx + '% ' + it.fy + '%'; im.style.objectPosition = pos; im.style.transformOrigin = pos; }
        return;
      }
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
        if (it.t === 'text' && !(it.h > 0)) {
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

  /* ------------------------------------------------------------ pencil */
  function drawBar(t) {
    t.appendChild(btn('Done', function () { S.draw.on = false; render(); }, { icon: 'check', cls: 'pri' }));
    t.appendChild(h('div', { class: 'inks', role: 'radiogroup', 'aria-label': 'Pencil colour' }, INKS.map(function (c) { return h('button', { type: 'button', role: 'radio', 'aria-checked': String(S.draw.color === c), 'aria-label': 'Colour ' + c, class: S.draw.color === c ? 'on' : '', style: { background: c }, onclick: function () { S.draw.color = c; render(); } }); })));
    NIBS.forEach(function (n) { t.appendChild(btn(n[0], function () { S.draw.w = n[1]; render(); }, { pressed: S.draw.w === n[1], cls: 'nib' })); });
    var p = S.doc.pages[S.ap];
    t.appendChild(btn('Undo stroke', function () { if (p.doodle.length) { p.doodle.pop(); persist(); render(); } }, { icon: 'undo', dis: !(p.doodle || []).length }));
    t.appendChild(btn('Clear page doodles', function () { if (p.doodle.length) { p.doodle = []; persist(); render(); } }, { icon: 'trash', dis: !(p.doodle || []).length }));
    t.appendChild(h('span', { class: 'hint' }, 'Draw on ' + B.pageLabel(S.doc, S.ap).toLowerCase() + ' with your finger, a pencil or the mouse.'));
  }
  function startDraw(e, pgEl) {
    var pi = +pgEl.dataset.i, p = S.doc.pages[pi], r = pgEl.getBoundingClientRect(), H = 100 / S.doc.ratio, pts = [], ns = 'http://www.w3.org/2000/svg';
    S.ap = pi; var svg = pgEl.querySelector('.dd'), path = document.createElementNS(ns, 'path');
    path.setAttribute('stroke', S.draw.color); path.setAttribute('stroke-width', S.draw.w); path.setAttribute('fill', 'none'); path.setAttribute('stroke-linecap', 'round'); path.setAttribute('stroke-linejoin', 'round'); svg.appendChild(path);
    var add = function (ev) { var x = (ev.clientX - r.left) / r.width * 100, y = (ev.clientY - r.top) / r.height * H, l = pts[pts.length - 1]; if (!l || Math.hypot(x - l[0], y - l[1]) > .3) { pts.push([+x.toFixed(2), +y.toFixed(2)]); path.setAttribute('d', pathD(pts)); } };
    add(e); S.dragging = true;
    var up = function () { window.removeEventListener('pointermove', add); window.removeEventListener('pointerup', up); window.removeEventListener('pointercancel', up); S.dragging = false; if (pts.length) { p.doodle.push({ pts: pts, c: S.draw.color, w: S.draw.w }); persist(); } render(); if (S.pending) applyRemote(S.pending); };
    window.addEventListener('pointermove', add); window.addEventListener('pointerup', up); window.addEventListener('pointercancel', up);
  }
  /* shape and frame for a photo */
  function openShape() {
    var c = selItem(); if (!c) return; var it = c.it, isText = it.t === 'text';
    var set = function (f) { var q = selItem(); if (!q) return; f(q.it); persist(); openShape(); render(); };
    var cur = isText ? (it.shape || 'none') : (it.shape || 'rect');
    var list = isText ? [['none', 'No shape']].concat(SHAPES.filter(function (x) { return x[0] !== 'rect'; }).concat([['rect', 'Box']])) : SHAPES;
    var pickShape = function (v) {
      set(function (i) {
        i.shape = v;
        if (i.t !== 'text') return;
        if (v === 'none') { i.h = 0; return; }
        if (!i.fill) { i.fill = '#e0a030'; i.color = B.ink(i.fill); }
        i.h = AR[v] ? +(i.w * S.doc.ratio / AR[v]).toFixed(2) : 0;   /* shapes with a shape of their own get a height; boxes and ribbons grow with the words */
      });
    };
    var sh = h('div', { class: 'shapes', role: 'radiogroup', 'aria-label': 'Shape' }, list.map(function (x) { var on = cur === x[0]; return h('button', { type: 'button', role: 'radio', 'aria-checked': String(on), class: 'shp' + (on ? ' on' : ''), onclick: function () { pickShape(x[0]); } }, x[0] === 'none' ? h('span', { class: 'fr none' }, 'Aa') : h('span', { class: 'fr sh-' + x[0] }, h('span', { class: 'cl' })), h('small', null, x[1])); }));
    var body = [h('h3', null, 'Shape'), sh];
    if (isText) {
      var fills = h('div', { class: 'sw', role: 'radiogroup', 'aria-label': 'Fill colour' }, FILLS.map(function (f) { return h('button', { type: 'button', role: 'radio', 'aria-checked': String((it.fill || '').toLowerCase() === f), 'aria-label': 'Fill ' + f, class: (it.fill || '').toLowerCase() === f ? 'on' : '', style: { background: f }, onclick: function () { set(function (i) { i.fill = f; i.color = B.ink(f); if (!i.shape || i.shape === 'none') { i.shape = 'rect'; i.h = 0; } }); } }); }),
        h('label', { class: 'custom', title: 'Pick any colour' }, h('span', { class: 'ed-vh' }, 'Custom fill'), h('input', { type: 'color', value: /^#[0-9a-f]{6}$/i.test(it.fill || '') ? it.fill : '#e0a030', onchange: function (e) { set(function (i) { i.fill = e.target.value; i.color = B.ink(i.fill); if (!i.shape || i.shape === 'none') { i.shape = 'rect'; i.h = 0; } }); } }), '+'));
      var lines = h('div', { class: 'frames', role: 'radiogroup', 'aria-label': 'Outline' }, [[0, 'No outline'], [1, 'Thin'], [2, 'Thick']].map(function (x) { var on = (it.line || 0) === x[0]; return h('button', { type: 'button', role: 'radio', 'aria-checked': String(on), class: 'frm' + (on ? ' on' : ''), onclick: function () { set(function (i) { i.line = x[0]; }); } }, x[1]); }));
      body = body.concat([h('h3', null, 'Fill'), fills, h('h3', null, 'Outline'), lines, h('p', { class: 'ed-muted' }, 'Drag the box anywhere, resize it from the corners, turn it with the round handle. The words stay editable: double-tap to type.')]);
    } else {
      var fr = h('div', { class: 'frames', role: 'radiogroup', 'aria-label': 'Frame' }, FRAMES.map(function (x) { var on = (it.frame || 'none') === x[0]; return h('button', { type: 'button', role: 'radio', 'aria-checked': String(on), class: 'frm' + (on ? ' on' : ''), onclick: function () { set(function (i) { i.frame = x[0]; }); } }, x[1]); }));
      body = body.concat([h('h3', null, 'Frame'), fr, h('p', { class: 'ed-muted' }, 'The photo is cropped to the shape. Use Crop to choose which part shows.')]);
    }
    dialog(isText ? 'Text shape' : 'Shape and frame', h('div', { class: 'dl-s' }, body), [btn('Done', function () { closeDlg(); }, { cls: 'pri', icon: 'check' })], { wide: true });
  }

  /* the top bar and the Back / Next bar are fixed to the screen; the page leaves room for the top bar whatever height it wraps to */
  var topRO = null;
  function pinBars() {
    var top = document.querySelector('.top'); if (!top) return;
    var set = function () { document.documentElement.style.setProperty('--topH', (top.offsetHeight + 20) + 'px'); };
    set(); if (window.ResizeObserver) { if (topRO) topRO.disconnect(); topRO = new ResizeObserver(set); topRO.observe(top); }
  }
  /* ------------------------------------------------------------ main render and boot */
  function render() {
    if (S.turning) return;
    var screen = S.screen;
    var node = screen === 'library' ? screenLibrary() : screen === 'event' ? screenEvent() : screen === 'size' ? screenSize() : screen === 'pages' ? screenPages() : screen === 'title' ? screenTitle() : screen === 'dedication' ? screenDedication() : screen === 'gallery' ? screenGallery() : screenDesign();
    app.replaceChildren(node);
    pinBars();
    document.title = (S.doc.title || 'My book') + ' · Live editor · Miles Retold';
    if (S.sheet) { /* keep an open sheet in step with the book */ var old = document.getElementById('sheet'); if (old && S.sheet !== 'gallery') renderSheet(); }
  }
  document.addEventListener('keydown', function (e) {
    if (S.screen !== 'design' || S.editing || S.turning || /^(INPUT|TEXTAREA|SELECT)$/.test((e.target || {}).tagName) || document.querySelector('dialog.dlg[open]') || S.sheet) return;
    if (e.key === 'Escape' && (S.draw.on || S.crop)) { S.draw.on = false; S.crop = null; render(); return; }
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
  S.snap = JSON.stringify(S.doc); S.screen = S.doc.step === 'cover' ? 'design' : WS.indexOf(S.doc.step) > -1 ? S.doc.step : (S.doc.setup >= 3 ? 'design' : ['event', 'title', 'gallery'][Math.max(0, Math.min(2, S.doc.setup))]);
  if (q.get('view') === 'gallery') S.screen = 'library';
  if (q.get('view') === 'photos') { S.screen = 'library'; S.only = true; }
  var startNew = function () { S.doc = B.newDoc(40); S.doc.step = 'event'; S.screen = 'event'; B.write(S.doc); S.snap = JSON.stringify(S.doc); clampView(); render(); };
  var inProgress = existing && existing.v === 1 && (existing.setup >= 1 || existing.event || existing.gallery.length || existing.pages.some(function (p) { return p.items.length; }));
  if (q.get('start') === 'new' && !inProgress) { S.doc = B.newDoc(40); S.doc.step = 'event'; S.screen = 'event'; B.write(S.doc); S.snap = JSON.stringify(S.doc); }
  var dropped = B.cleanSpans(S.doc); if (dropped) { B.write(S.doc); S.snap = JSON.stringify(S.doc); }
  clampView(); render();
  if (dropped) setTimeout(function () { toast('A photo that crossed two pages was removed: those pages cannot share one photo', { kind: 'bad' }); }, 600);
  B.loadUrls(S.doc).then(function () { render(); });
  if (q.get('start') === 'new' && inProgress && window.MilesUI) window.MilesUI.confirm({ title: 'You already have a book in progress', body: 'Start a new book, or keep working on this one? A new book replaces the one you have now (your photos stay in the gallery only if you keep the old book).', confirmLabel: 'Start a new book', cancelLabel: 'Keep my book' }).then(function (ok) { if (ok) startNew(); });
  window.addEventListener('popstate', function () { var st = (location.hash || '').slice(1); if (S.doc && st !== 'design' && WS.indexOf(st) > -1 && S.screen !== 'design') { S.screen = st; S.doc.step = st; render(); } });
  window.__book = { S: S, B: B, render: render, openFlow: openFlow, turn: turn };
})();
