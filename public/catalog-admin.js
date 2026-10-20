/* Miles Retold · studio "Catalog & pricing" pages: book sizes, page counts, layouts and the price formula.
   Draws the body of the page into #cat-root (data-page = sizes | pages | layouts | pricing). Every change is saved at once to the shared
   catalog record (catalog.js), which the live editor reads. Prototype: it is a browser setting, not yet a server one. */
(function () {
  'use strict';
  var C = window.MilesCatalog; if (!C) return;
  var css = document.createElement('link'); css.rel = 'stylesheet'; css.href = '/css/catalog-admin.css'; document.head.appendChild(css);

  function h(tag, a) {
    var el = document.createElement(tag), kids = Array.prototype.slice.call(arguments, 2);
    Object.keys(a || {}).forEach(function (k) {
      var v = a[k]; if (v == null || v === false) return;
      if (k === 'class') el.className = v; else if (k === 'text') el.textContent = v; else if (k.slice(0, 2) === 'on') el.addEventListener(k.slice(2), v); else if (k === 'value') el.value = v; else el.setAttribute(k, v === true ? '' : v);
    });
    kids.forEach(function (k) { if (k == null || k === false) return; (Array.isArray(k) ? k : [k]).forEach(function (x) { el.appendChild(typeof x === 'string' ? document.createTextNode(x) : x); }); });
    return el;
  }
  var uid = function () { return Math.random().toString(36).slice(2, 8); };
  var slug = function (s) { return String(s).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'size'; };
  var shape = function (s) { return s.w === s.h ? 'Square' : (s.h > s.w ? 'Portrait' : 'Landscape'); };
  var toast = function (t) { var m = document.getElementById('ca-toast'); if (!m) { m = h('div', { id: 'ca-toast', class: 'ed-toast ca-toast', role: 'status' }); document.body.appendChild(m); } m.textContent = t; m.classList.add('on'); clearTimeout(toast.t); toast.t = setTimeout(function () { m.classList.remove('on'); }, 2200); };
  var ask = function (o) { return window.MilesUI && window.MilesUI.confirm ? window.MilesUI.confirm(o) : Promise.resolve(window.confirm(o.title)); };
  var panel = function (title, lead) { var kids = Array.prototype.slice.call(arguments, 2); return h('section', { class: 'ed-panel ca-p' }, title ? h('h2', { class: 'dp-h2', text: title }) : null, lead ? h('p', { class: 'ed-muted', text: lead }) : null, kids); };
  var sw = function (on, label, fn) { return h('button', { type: 'button', class: 'ew-sw2', 'aria-pressed': String(!!on), 'aria-label': label, onclick: fn }); };
  var field = function (label, input, hint) { return h('label', { class: 'ca-f' }, h('span', { text: label }), input, hint ? h('small', { text: hint }) : null); };
  var inp = function (type, v, on, o) { var el = h('input', Object.assign({ type: type, value: v, autocomplete: 'off' }, o || {})); el.addEventListener('change', function () { on(el.value, el); }); return el; };

  var root, E, c, page, stamp;
  function commit(msg, noPaint) { C.save(c); if (stamp) stamp.textContent = 'Saved just now'; if (msg) toast(msg); if (!noPaint) paint(); }

  /* ------------------------------------------------------------------ sizes */
  function sizes() {
    var rows = c.sizes.map(function (s, i) {
      var onCount = c.sizes.filter(function (x) { return x.on; }).length;
      var thumb = h('i', { style: 'aspect-ratio:' + s.w + '/' + s.h }), meta = h('div', { class: 'ca-meta' }, h('b', { text: shape(s) }), h('small', { text: C.label(s) }));
      var upd = function () { thumb.setAttribute('style', 'aspect-ratio:' + s.w + '/' + s.h); meta.firstChild.textContent = shape(s); meta.lastChild.textContent = C.label(s); };
      return h('li', { class: 'ca-row' + (s.on ? '' : ' off') },
        h('div', { class: 'ca-sh', 'aria-hidden': 'true' }, thumb),
        h('div', { class: 'ca-grow' },
          field('Name', inp('text', s.name, function (v) { s.name = v.trim() || s.name; commit('Name saved', true); }, { maxlength: 24 })),
          field('Width (in)', inp('number', s.w, function (v, el) { s.w = Math.max(4, Math.min(24, parseFloat(v) || s.w)); el.value = s.w; commit('Size saved', true); upd(); }, { min: 4, max: 24, step: 0.5, inputmode: 'decimal' })),
          field('Height (in)', inp('number', s.h, function (v, el) { s.h = Math.max(4, Math.min(24, parseFloat(v) || s.h)); el.value = s.h; commit('Size saved', true); upd(); }, { min: 4, max: 24, step: 0.5, inputmode: 'decimal' }))),
        meta,
        h('div', { class: 'ca-act' }, h('label', { class: 'ca-sw' }, sw(s.on, 'Show ' + s.name + ' to customers', function () { if (s.on && onCount < 2) return toast('Keep at least one size on'); s.on = !s.on; commit(s.on ? s.name + ' is shown' : s.name + ' is hidden'); }), h('span', { text: s.on ? 'Shown' : 'Hidden' })),
          h('button', { type: 'button', class: 'ed-btn sm', disabled: c.sizes.length < 2, onclick: function () {
            ask({ title: 'Delete ' + s.name + '?', body: 'Customers will no longer see it. Books already started in this size keep it.', confirmLabel: 'Delete', danger: true }).then(function (ok) { if (ok) { c.sizes.splice(i, 1); commit('Size deleted'); } });
          } }, 'Delete')));
    });
    var nm = inp('text', '', function () {}, { maxlength: 24, placeholder: 'For example Mini' }), w = inp('number', '', function () {}, { min: 4, max: 24, step: 0.5, placeholder: '6' }), hh = inp('number', '', function () {}, { min: 4, max: 24, step: 0.5, placeholder: '6' }), err = h('p', { class: 'ew-note is-bad ca-err', role: 'alert', hidden: true });
    var add = h('form', { class: 'ca-add', onsubmit: function (e) {
      e.preventDefault(); var n = nm.value.trim(), W = parseFloat(w.value), H = parseFloat(hh.value);
      var bad = !n ? 'Give the size a name.' : (!(W >= 4 && W <= 24 && H >= 4 && H <= 24) ? 'Width and height must be between 4 and 24 inches.' : (c.sizes.some(function (s) { return s.name.toLowerCase() === n.toLowerCase(); }) ? 'A size with that name already exists.' : ''));
      err.hidden = !bad; err.textContent = bad; if (bad) return;
      var id = slug(n); while (c.sizes.some(function (s) { return s.id === id; })) id += '-' + uid().slice(0, 2);
      c.sizes.push({ id: id, name: n, w: W, h: H, on: true, base: 0, per: 0 }); commit(n + ' added. Set its price next.');
    } }, field('Name', nm), field('Width (in)', w), field('Height (in)', hh), h('button', { type: 'submit', class: 'ed-btn pri' }, 'Add size'), err);
    return [panel('Sizes customers can choose', 'Each size is one shape of page. Hide a size to stop offering it; the books already started keep theirs. Changes reach the live editor at once.', h('ul', { class: 'ca-list' }, rows)),
      panel('Add a size', 'Width and height of one page, in inches. A new size has no price until you set it on the pricing page.', add)];
  }

  /* ------------------------------------------------------------------ page counts */
  function pages() {
    var onN = c.pages.filter(function (p) { return p.on; }).length;
    var rows = c.pages.map(function (p, i) {
      return h('li', { class: 'ca-row ca-pg' + (p.on ? '' : ' off') },
        h('div', { class: 'ca-n' }, h('b', { text: String(p.n) }), h('small', { text: 'pages' })),
        h('div', { class: 'ca-meta' }, h('b', { text: p.n / 2 + ' spreads' }), h('small', { text: 'plus the covers' })),
        h('div', { class: 'ca-act' },
          h('button', { type: 'button', class: 'ed-btn sm' + (p.pop ? ' pri' : ''), 'aria-pressed': String(!!p.pop), onclick: function () { var was = p.pop; c.pages.forEach(function (q) { q.pop = false; }); p.pop = !was; commit(p.pop ? p.n + ' pages is marked Most chosen' : 'No page count is marked Most chosen'); } }, p.pop ? 'Most chosen' : 'Mark most chosen'),
          h('label', { class: 'ca-sw' }, sw(p.on, 'Offer ' + p.n + ' pages', function () { if (p.on && onN < 2) return toast('Keep at least one page count on'); p.on = !p.on; if (!p.on) p.pop = false; commit(p.n + ' pages ' + (p.on ? 'offered' : 'hidden')); }), h('span', { text: p.on ? 'Offered' : 'Hidden' })),
          h('button', { type: 'button', class: 'ed-btn sm', disabled: c.pages.length < 2, onclick: function () { ask({ title: 'Delete ' + p.n + ' pages?', body: 'It is no longer offered. Books already started with it keep their pages.', confirmLabel: 'Delete', danger: true }).then(function (ok) { if (ok) { c.pages.splice(i, 1); commit('Page count deleted'); } }); } }, 'Delete')));
    });
    var n = inp('number', '', function () {}, { min: 10, max: 200, step: 2, placeholder: '48' }), err = h('p', { class: 'ew-note is-bad ca-err', role: 'alert', hidden: true });
    var add = h('form', { class: 'ca-add', onsubmit: function (e) {
      e.preventDefault(); var v = parseInt(n.value, 10);
      var bad = !(v >= 10 && v <= 200) ? 'Choose a number from 10 to 200.' : (v % 2 ? 'Pages come in pairs: use an even number.' : (c.pages.some(function (p) { return p.n === v; }) ? v + ' pages is already in the list.' : ''));
      err.hidden = !bad; err.textContent = bad; if (bad) return;
      c.pages.push({ n: v, on: true }); c.pages.sort(function (a, b) { return a.n - b.n; }); commit(v + ' pages added');
    } }, field('Number of pages', n, 'Even numbers only: pages are printed in pairs.'), h('button', { type: 'submit', class: 'ed-btn pri' }, 'Add page count'), err);
    return [panel('Page counts customers can choose', 'The pages inside the book, not counting the covers. The one marked Most chosen carries that label in the editor.', h('ul', { class: 'ca-list' }, rows)), panel('Add a page count', '', add)];
  }

  /* ------------------------------------------------------------------ layouts */
  var KINDS = [['cover', 'Cover'], ['page', 'Pages'], ['spread', 'Across two pages'], ['back', 'Back cover']];
  var ARR = {
    cover: [['full', 'One full photo', [[0, 0, 100, 100]]], ['framed', 'One framed photo', [[12, 10, 76, 58]]], ['top', 'Photo on top', [[0, 0, 100, 62]]], ['none', 'No photo', []]],
    page: [['full', 'One full photo', [[0, 0, 100, 100]]], ['framed', 'One framed photo', [[8, 8, 84, 70]]], ['two', 'Two, stacked', [[8, 6, 84, 42], [8, 52, 84, 42]]], ['side', 'Two, side by side', [[6, 22, 41, 56], [53, 22, 41, 56]]], ['three', 'Three', [[8, 6, 84, 44], [8, 54, 40, 40], [52, 54, 40, 40]]], ['four', 'Four, in a grid', [[6, 6, 41, 41], [53, 6, 41, 41], [6, 53, 41, 41], [53, 53, 41, 41]]], ['six', 'Six, in a grid', [[6, 6, 41, 28], [53, 6, 41, 28], [6, 36, 41, 28], [53, 36, 41, 28], [6, 66, 41, 28], [53, 66, 41, 28]]], ['none', 'No photo', []]],
    spread: [['full', 'Full bleed', [[0, 0, 100, 100]]], ['wide', 'Panorama', [[0, 26, 100, 48]]], ['framed', 'Framed', [[7, 8, 86, 84]]]],
    back: [['small', 'Small photo', [[30, 28, 40, 40]]], ['none', 'No photo', []]]
  };
  var T = function (x, y, w, text, size, o) { return Object.assign({ t: 'text', x: x, y: y, w: w, h: 0, text: text, size: size, align: 'center', font: 'Fraunces', weight: 400 }, o || {}); };
  function build(kind, arr, title, caption) {
    var rects = ARR[kind].filter(function (a) { return a[0] === arr; })[0][2];
    if (kind === 'spread') return { span: { x: rects[0][0], y: rects[0][1], w: rects[0][2], h: rects[0][3] } };
    var items = rects.map(function (r) { return { t: 'img', x: r[0], y: r[1], w: r[2], h: r[3] }; });
    var bottom = rects.reduce(function (m, r) { return Math.max(m, r[1] + r[3]); }, 0), y = rects.length ? Math.min(bottom + 5, 82) : 36;
    if (title) { items.push(T(8, y, 84, '{title}', 8)); y += 14; }
    if (caption) items.push(T(8, Math.min(y, 90), 84, 'Write a caption', 3.6, { font: 'Manrope' }));
    return { items: items };
  }
  function mini(lay, ratio) {
    var m = h('span', { class: 'ca-mini' + (lay.span ? ' two' : ''), style: 'aspect-ratio:' + (lay.span ? ratio * 2 : ratio) });
    var pos = function (x, y, w, hgt) { return 'left:' + x + '%;top:' + y + '%;width:' + w + '%;height:' + hgt + '%'; };
    if (lay.span) { m.appendChild(h('i', { class: 'img', style: pos(lay.span.x, lay.span.y, lay.span.w, lay.span.h) })); m.appendChild(h('i', { class: 'fold' })); return m; }
    (lay.items || []).forEach(function (it) { m.appendChild(h('i', { class: it.t, style: pos(it.x, it.y, it.w, it.t === 'img' ? it.h : 7) })); });
    return m;
  }
  var kindNow = 'cover';
  function layouts() {
    var B = window.MilesBook, built = (B && B.BUILTIN) || {}, ratio = 0.8;
    var off = c.layouts.off, custom = c.layouts.custom;
    var tabs = h('div', { class: 'ed-seg', role: 'group', 'aria-label': 'Where the layout is used' }, KINDS.map(function (k) {
      var n = (built[k[0]] || []).length + custom.filter(function (x) { return x.kind === k[0]; }).length;
      return h('button', { type: 'button', 'aria-pressed': String(kindNow === k[0]), onclick: function () { kindNow = k[0]; paint(); } }, k[1], h('span', { class: 'ew-n', text: String(n) }));
    }));
    var list = (built[kindNow] || []).map(function (l) { return { l: l, custom: false }; }).concat(custom.filter(function (x) { return x.kind === kindNow; }).map(function (l) { return { l: l, custom: true }; }));
    var shown = list.filter(function (x) { return off.indexOf(x.l.id) < 0; }).length;
    var rows = list.map(function (x) {
      var l = x.l, on = off.indexOf(l.id) < 0, n = l.span ? 1 : (l.items || []).filter(function (i) { return i.t === 'img'; }).length;
      return h('li', { class: 'ca-row ca-ly' + (on ? '' : ' off') }, mini(l, ratio),
        h('div', { class: 'ca-grow1' }, x.custom ? field('Name', inp('text', l.name, function (v) { l.name = v.trim() || l.name; commit('Name saved', true); }, { maxlength: 30 })) : h('b', { text: l.name }), h('small', { text: (n === 0 ? 'No photo' : n + (n === 1 ? ' photo' : ' photos')) + (x.custom ? ' · yours' : ' · built in') })),
        h('div', { class: 'ca-act' }, h('label', { class: 'ca-sw' }, sw(on, (on ? 'Hide ' : 'Show ') + l.name, function () { if (on && shown < 2) return toast('Keep at least one layout on for this part of the book'); if (on) off.push(l.id); else off.splice(off.indexOf(l.id), 1); commit(l.name + (on ? ' is hidden' : ' is shown')); }), h('span', { text: on ? 'Shown' : 'Hidden' })),
          x.custom ? h('button', { type: 'button', class: 'ed-btn sm', onclick: function () { ask({ title: 'Delete ' + l.name + '?', body: 'Pages already using it keep how they look.', confirmLabel: 'Delete', danger: true }).then(function (ok) { if (ok) { custom.splice(custom.indexOf(l), 1); commit('Layout deleted'); } }); } }, 'Delete') : null));
    });
    /* add a layout */
    var nm = inp('text', '', function () {}, { maxlength: 30, placeholder: 'For example Two and a caption' });
    var kind = h('select', { 'aria-label': 'Where it is used' }, KINDS.map(function (k) { return h('option', { value: k[0], text: k[1] }); })); kind.value = kindNow;
    var arr = h('select', { 'aria-label': 'Photo arrangement' }), tit = h('input', { type: 'checkbox' }), cap = h('input', { type: 'checkbox' }), prev = h('div', { class: 'ca-prev' }), err = h('p', { class: 'ew-note is-bad ca-err', role: 'alert', hidden: true });
    var tw = h('label', { class: 'ca-chk' }, tit, h('span', { text: 'Add a title line' })), cw = h('label', { class: 'ca-chk' }, cap, h('span', { text: 'Add a caption line' }));
    var refill = function () {
      arr.textContent = ''; ARR[kind.value].forEach(function (a) { arr.appendChild(h('option', { value: a[0], text: a[1] })); });
      tw.hidden = cw.hidden = kind.value === 'spread'; show();
    };
    var show = function () { prev.textContent = ''; prev.appendChild(mini(build(kind.value, arr.value, tit.checked && kind.value !== 'spread', cap.checked && kind.value !== 'spread'), ratio)); };
    kind.addEventListener('change', refill); arr.addEventListener('change', show); tit.addEventListener('change', show); cap.addEventListener('change', show); refill();
    var add = h('form', { class: 'ca-add ca-addl', onsubmit: function (e) {
      e.preventDefault(); var n = nm.value.trim(); var bad = !n ? 'Give the layout a name.' : '';
      err.hidden = !bad; err.textContent = bad; if (bad) return;
      var b = build(kind.value, arr.value, tit.checked && kind.value !== 'spread', cap.checked && kind.value !== 'spread');
      custom.push(Object.assign({ id: 'u-' + uid(), name: n, kind: kind.value }, b)); kindNow = kind.value; nm.value = ''; commit(n + ' added. It is in the editor now.');
    } }, field('Name', nm), field('Used for', kind), field('Photos', arr), h('div', { class: 'ca-chks' }, tw, cw), h('div', { class: 'ca-pv' }, h('small', { text: 'Preview' }), prev), h('button', { type: 'submit', class: 'ed-btn pri' }, 'Add layout'), err);
    return [panel('Layouts in the editor', 'Where a page starts. Customers can still move, resize and turn everything afterwards. Hide a layout to stop offering it.', tabs, h('p', { class: 'ed-muted ca-count', text: shown + ' of ' + list.length + ' shown' }), h('ul', { class: 'ca-list' }, rows)),
      panel('Add a layout', 'Choose where it is used and how the photos are arranged. It appears in the page designer at once.', add)];
  }

  /* ------------------------------------------------------------------ pricing */
  function pricing() {
    var p = c.pricing, cur = p.currency, money = function (n) { return cur + ' ' + C.fmt(n); };
    var derived = function () { C.save(c); if (stamp) stamp.textContent = 'Saved just now'; fillTable(); calc(); };   /* only the tables below change: the field you are typing in keeps its focus */
    var set = function (k) { return function (v, el) { p[k] = Math.max(0, parseFloat(v) || 0); if (k === 'step') p[k] = Math.max(1, p[k]); if (k === 'deposit') p[k] = Math.min(100, p[k]); el.value = p[k]; derived(); }; };
    var inputs = h('div', { class: 'ca-grid' },
      field('Currency', inp('text', p.currency, function (v, el) { p.currency = (v.trim() || 'SAR').toUpperCase().slice(0, 4); el.value = p.currency; commit('Saved'); }, { maxlength: 4 })),
      field('Margin (%)', inp('number', p.margin, set('margin'), { min: 0, step: 1, inputmode: 'decimal' }), 'Added on top of the print cost.'),
      field('Shipping (flat)', inp('number', p.shipping, set('shipping'), { min: 0, step: 1, inputmode: 'decimal' }), 'One amount per book.'),
      field('VAT (%)', inp('number', p.vat, set('vat'), { min: 0, step: 1, inputmode: 'decimal' }), 'Zero if prices already include it.'),
      field('Lowest price', inp('number', p.minimum, set('minimum'), { min: 0, step: 1, inputmode: 'decimal' }), 'Before margin and VAT.'),
      field('Round up to', inp('number', p.step, set('step'), { min: 1, step: 1, inputmode: 'decimal' }), 'The price ends on a multiple of this.'),
      field('Deposit (%)', inp('number', p.deposit, set('deposit'), { min: 0, max: 100, step: 5, inputmode: 'decimal' }), 'Paid when the order starts.'));
    var rows = c.sizes.map(function (s) {
      return h('tr', null, h('th', { scope: 'row' }, h('b', { text: s.name }), h('small', { text: C.label(s) + (s.on ? '' : ' · hidden') })),
        h('td', null, inp('number', s.base, function (v, el) { s.base = Math.max(0, parseFloat(v) || 0); el.value = s.base; derived(); }, { min: 0, step: 1, 'aria-label': 'Base price for ' + s.name, inputmode: 'decimal' })),
        h('td', null, inp('number', s.per, function (v, el) { s.per = Math.max(0, parseFloat(v) || 0); el.value = s.per; derived(); }, { min: 0, step: 0.5, 'aria-label': 'Price per page for ' + s.name, inputmode: 'decimal' })));
    });
    var per = h('div', { class: 'ca-tw' }, h('table', { class: 'ca-t' }, h('thead', null, h('tr', null, h('th', { text: 'Size' }), h('th', { text: 'Base (' + cur + ')' }), h('th', { text: 'Per page (' + cur + ')' }))), h('tbody', null, rows)));
    var counts = c.pages.filter(function (x) { return x.on; });
    var tbl = h('div', { class: 'ca-tw' });
    var fillTable = function () {
      tbl.textContent = '';
      tbl.appendChild(h('table', { class: 'ca-t ca-pt' }, h('thead', null, h('tr', null, h('th', { text: 'Size' }), counts.map(function (x) { return h('th', { text: x.n + ' pages' }); }))),
        h('tbody', null, c.sizes.map(function (s) { return h('tr', { class: s.on ? '' : 'off' }, h('th', { scope: 'row', text: s.name }), counts.map(function (x) { return h('td', { text: C.fmt(C.price(c, s.id, x.n).total) }); })); }))));
    };
    fillTable();
    var selS = h('select', { 'aria-label': 'Size' }, c.sizes.map(function (s) { return h('option', { value: s.id, text: s.name + ' ' + C.label(s) }); })), selP = h('select', { 'aria-label': 'Pages' }, counts.map(function (x) { return h('option', { value: x.n, text: x.n + ' pages' }); })), out = h('dl', { class: 'ca-calc', 'aria-live': 'polite' });
    if (counts.some(function (x) { return x.n === 40; })) selP.value = 40;
    var calc = function () {
      var s = c.sizes.filter(function (z) { return z.id === selS.value; })[0], n = +selP.value, q = C.price(c, s.id, n); out.textContent = '';
      var line = function (k, v, cls) { out.appendChild(h('div', { class: cls || '' }, h('dt', { text: k }), h('dd', { text: v }))); };
      line('Base for ' + s.name, money(s.base)); line(n + ' pages × ' + C.fmt(s.per), money(s.per * n));
      if (q.minApplied) line('Raised to the lowest price', money(q.floor));
      if (p.margin) line('Margin ' + p.margin + '%', money(q.margin)); if (p.shipping) line('Shipping', money(q.shipping)); if (p.vat) line('VAT ' + p.vat + '%', money(q.vat));
      line('Price to the customer', money(q.total), 'tot'); line('Deposit ' + p.deposit + '%, paid first', money(q.deposit));
    };
    selS.addEventListener('change', calc); selP.addEventListener('change', calc); calc();
    return [
      panel('How the price is worked out', '', h('ol', { class: 'ca-steps' }, ['Base for the size, plus the price per page times the number of pages.', 'At least the lowest price.', 'Add the margin, then the flat shipping, then VAT.', 'Round up to the step you chose.'].map(function (t) { return h('li', { text: t }); }))),
      panel('Settings', 'These apply to every size.', inputs),
      panel('Price by size', 'Set the base price and the price of each page for each size.', per),
      panel('What customers pay', 'Worked out from the settings above, for every size and page count you offer.', tbl),
      panel('Try a price', 'Pick a size and a number of pages to see each step.', h('div', { class: 'ca-try' }, field('Size', selS), field('Pages', selP)), out)];
  }

  /* ------------------------------------------------------------------ boot */
  var BODY = { sizes: sizes, pages: pages, layouts: layouts, pricing: pricing };
  function paint() {
    c = C.get(); root.textContent = '';
    var foot = h('div', { class: 'ca-foot' }, stamp = h('span', { class: 'ed-muted', id: 'ca-stamp', text: c.saved ? 'Saved' : 'Using the studio defaults' }),
      h('button', { type: 'button', class: 'ed-btn sm', onclick: function () { ask({ title: 'Reset the whole catalog?', body: 'Sizes, page counts, layouts and prices go back to the studio defaults. Books already started keep what they have.', confirmLabel: 'Reset', danger: true }).then(function (ok) { if (ok) { C.reset(); paint(); toast('Back to the defaults'); } }); } }, 'Reset all to defaults'));
    BODY[page]().concat([foot]).forEach(function (n) { root.appendChild(n); });
  }
  function draw() {
    var r = document.getElementById('cat-root'); if (!r || r.dataset.drawn) return;
    root = r; r.dataset.drawn = '1'; page = r.dataset.page; E = r.dataset.e || 'GL';
    if (!BODY[page]) return; paint();
  }
  var go = function () { draw(); if (window.MutationObserver) new MutationObserver(draw).observe(document.body, { childList: true, subtree: true }); };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', go); else go();
})();
