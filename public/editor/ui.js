/* Miles Retold · live book editor UI layer. Binds window.MilesEditor (core.js) to a Design Component.
   Usage inside the page's Component:
     constructor: this.ed = MilesEditorUI.create(this, { studio: false });   this.state = this.ed.initial();
   Besides vals(), the object returned by create() exposes what the other editor pages (editor/pages.js) build on:
     commit(next, toast, coalesceKey, logLine)  save a new book (undo step, autosave, toast, activity log line)
     book(), go(i), jump(i, slot, href)         read the book, change spread, open the canvas on a spread/frame
     componentDidMount: this.ed.mount();      componentWillUnmount: this.ed.unmount();
     renderVals: Object.assign(header values, this.ed.vals())                                                */
(function () {
  'use strict';
  var E = window.MilesEditor;
  var CELLS = { full: 1, pair: 2, trio: 3, quad: 4, story: 1, collage: 5, pano: 2, six: 6, heroR: 3 };
  var STATUS = {
    draft: ['Draft', ''], 'proof-requested': ['Proof requested', 'is-acc'], 'proof-sent': ['Proof sent to customer', 'is-ok'], locked: ['Design locked', 'is-ok']
  };

  function create(c, opts) {
    opts = opts || {};
    var studio = !!opts.studio;
    var hist = new E.History(80);
    var self = {};
    var toastT = 0;

    function S() { return c.state; }
    function set(o) { c.setState(o); }
    function book() { return S().book; }
    function curSel() { var s = S(); return { sp: s.sp, slot: s.slot }; }

    var POS = 'miles.editor.pos.' + (studio ? 's' : 'c'), lastKey = '', lastAt = 0, who = studio ? 'Rameen' : 'Sara';
    function remember(sp, slot) { try { localStorage.setItem(POS, JSON.stringify({ sp: sp, slot: slot == null ? null : slot })); } catch (e) {} }
    function recall() { try { var p = JSON.parse(localStorage.getItem(POS) || 'null'); if (p && typeof p.sp === 'number') return p; } catch (e) {} return null; }
    /* coalesceKey: typing in one field is one undo step, not one per letter */
    function commit(next, msg, key, logLine) {
      var now = Date.now();
      if (!(key && key === lastKey && now - lastAt < 1500)) hist.push(book());
      lastKey = key || ''; lastAt = now;
      if (logLine) next = E.ops.log(next, who, logLine);
      var saved = E.save(next);
      set({ book: saved, tick: Date.now() });
      if (msg) toast(msg);
    }
    function toast(m) {
      set({ toast: m });
      clearTimeout(toastT); toastT = setTimeout(function () { set({ toast: '' }); }, 3200);
    }
    function clampSp(b, i) { return Math.max(0, Math.min(b.spreads.length - 1, i)); }
    function go(i) { var b = book(), n = clampSp(b, i); remember(n, null); set({ sp: n, slot: null, flip: true }); setTimeout(function () { set({ flip: false }); }, 280); }
    function jump(i, slot, href) { remember(clampSp(book(), i), slot); if (href) location.href = href; else set({ sp: clampSp(book(), i), slot: slot == null ? null : slot }); }
    function place(pid) {
      var s = S(), b = book(), sp = b.spreads[s.sp], idx = s.slot;
      if (idx == null) { for (var i = 0; i < sp.slots.length; i++) if (!sp.slots[i].p) { idx = i; break; } }
      if (idx == null) { toast('Pick a frame first, or clear one.'); return; }
      commit(E.ops.place(b, s.sp, idx, pid)); set({ slot: idx });
    }
    self.commit = commit; self.toast = toast; self.go = go; self.jump = jump; self.book = book; self.set = set; self.hist = hist; self.who = who; self.studio = studio;
    function adj(patch, key) { var s = S(); if (s.slot == null) return; commit(E.ops.adjust(book(), s.sp, s.slot, patch), '', key ? 'adj:' + s.sp + ':' + s.slot + ':' + key : ''); }

    function pressed(on) { return on ? 'true' : 'false'; }
    function lt() { return S().lt || 'both'; }
    function plural(n, w) { return n + ' ' + w + (n === 1 ? '' : 's'); }
    /* the layouts offered for spread `spi`: spread layouts when the target is both pages, page layouts for the left or right page */
    function choices(spi) {
      var b = book(), sp = b.spreads[spi], t = lt(), L = E.lay(sp), side = t === 'left' ? 0 : 1;
      function placed(x) { return x.spreads[spi].slots.filter(function (z) { return z.p; }).length; }
      var before = placed(b);
      if (t === 'both') return E.layouts.map(function (l) {
        var cells = []; for (var i = 0; i < CELLS[l.id]; i++) cells.push({ k: i, cls: '' });
        return { id: l.id, name: l.name, best: l.best, mini: l.id, cells: cells, on: sp.lay === l.id, frames: plural(l.slots, 'frame') + (l.text ? ' + text' : ''), lose: before - placed(E.ops.setLayout(b, spi, l.id)) };
      });
      var page = L.split ? (side ? L.right : L.left) : null;
      return E.pageLayouts.map(function (l) {
        var cells = l.cells.map(function (c, i) { return { k: i, cls: 'gc' + c[0] + '_' + c[1] + ' gr' + c[2] + '_' + c[3] }; });
        if (l.text) cells.push({ k: 0, cls: 'txt gc1_3 gr1_7' });
        return { id: l.id, name: l.name, best: l.best, mini: 'pagei', cells: cells, on: !!page && page.id === l.id, frames: plural(l.slots, 'frame') + (l.text ? ' of text' : ''), lose: before - placed(E.ops.setPageLayout(b, spi, side, l.id)) };
      });
    }
    /* apply layout `id` to the chosen spreads, for the current target (both pages, left page, right page) */
    function applyLayout(id, idxs) {
      var b = book(), t = lt(), name, nb;
      if (t === 'both') { nb = E.ops.setLayoutMany(b, idxs, id); name = E.layout(id).name; }
      else { nb = E.ops.setPageLayoutMany(b, idxs, t === 'left' ? 0 : 1, id); name = E.pageLayout(id).name + ' on the ' + t + ' page'; }
      var what = idxs.length === 1 ? 'Spread ' + (idxs[0] + 1) : plural(idxs.length, 'spread');
      commit(nb, what + ' set to ' + name, '', 'Changed ' + what.toLowerCase() + ' to ' + name);
    }
    self.layoutChoices = choices; self.applyLayout = applyLayout; self.target = lt;
    self.initial = function () {
      var bk = E.load(), pos = recall(), sp0 = pos ? Math.max(0, Math.min(bk.spreads.length - 1, pos.sp)) : 0;
      return { book: bk, sp: sp0, slot: pos && pos.slot != null && bk.spreads[sp0] && bk.spreads[sp0].slots[pos.slot] ? pos.slot : null, flt: 'all', over: -1, drag: '', toast: '', preview: false, tick: Date.now(), flip: false, safe: false, tab: 'comments', cmDraft: '', note: '', lt: 'both' };
    };

    self.mount = function () {
      /* phones get the step-by-step editor unless they chose the full one (?full=1 remembers that for the session) */
      if (opts.easy && !studio) {
        try {
          var phone = window.matchMedia && window.matchMedia('(max-width: 700px)').matches, off = sessionStorage.getItem('miles.easy.off') === '1';
          if (/[?&]full=1/.test(location.search)) { sessionStorage.setItem('miles.easy.off', '1'); off = true; }
          if (phone && !off) { location.replace(opts.easy); return; }
        } catch (e) {}
      }
      self._key = function (e) {
        var t = e.target, typing = t && (/^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName) && t.type !== 'range' || t.isContentEditable);
        var rtl = document.documentElement.dir === 'rtl';
        if ((e.metaKey || e.ctrlKey) && (e.key === 'z' || e.key === 'Z')) { e.preventDefault(); if (e.shiftKey) self.redo(); else self.undo(); return; }
        if (typing) return;
        if (e.key === 'ArrowRight' && !opts.noArrows) go(S().sp + (rtl ? -1 : 1));
        else if (e.key === 'ArrowLeft' && !opts.noArrows) go(S().sp + (rtl ? 1 : -1));
        else if (e.key === 'Escape' && S().preview) set({ preview: false });
        else if (!opts.noArrows && (e.key === 'Delete' || e.key === 'Backspace') && S().slot != null) { commit(E.ops.clearSlot(book(), S().sp, S().slot)); }
      };
      self._store = function (e) { if (e.key === E.KEY) set({ book: E.load(), tick: Date.now() }); };
      document.addEventListener('keydown', self._key);
      window.addEventListener('storage', self._store);
      self._iv = setInterval(function () { set({ clock: Date.now() }); }, 15000);
    };
    self.unmount = function () {
      document.removeEventListener('keydown', self._key); window.removeEventListener('storage', self._store); clearInterval(self._iv); clearTimeout(toastT);
    };
    self.undo = function () { var p = hist.undo(book()); if (p) { var b = E.save(p); set({ book: b, tick: Date.now(), sp: clampSp(b, S().sp), slot: null }); } };
    self.redo = function () { var p = hist.redo(book()); if (p) { var b = E.save(p); set({ book: b, tick: Date.now(), sp: clampSp(b, S().sp), slot: null }); } };

    self.vals = function () {
      var s = S(), b = s.book, st = E.stats(b), sp = b.spreads[s.sp], used = E.usedMap(b), can = hist.can();
      var sel = s.slot != null ? sp.slots[s.slot] : null;
      var selPhoto = sel && sel.p ? E.photoById(sel.p) : null;
      var lib = E.library(b);
      var tilePhotos = lib.filter(function (p) {
        if (s.flt === 'unused') return !used[p.id];
        if (s.flt === 'star') return E.isStar(b, p);
        if (s.flt === 'low') return p.low;
        return true;
      });
      function slotView(sl, i) {
        var ph = sl.p ? E.photoById(sl.p) : null;
        var full = sp.lay === 'full';
        return {
          i: i, has: !!ph, empty: !ph, src: ph ? ph.src : '', alt: ph ? ph.name : '',
          cls: 'ed-slot' + (s.slot === i ? ' sel' : '') + (s.over === i ? ' over' : '') + (full ? ' full' : '') + ' ' + E.slotCls(sp, i),
          img: ph ? 'object-position:' + sl.x + '% ' + sl.y + '%;transform:scale(' + sl.z + ');filter:brightness(' + (sl.b / 100) + ')' : '',
          low: !!(ph && ph.low), label: 'Frame ' + (i + 1) + (ph ? ': ' + ph.name : ': empty'),
          pick: function () { set({ slot: s.slot === i ? null : i }); },
          key: function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); set({ slot: s.slot === i ? null : i }); } },
          clear: function (e) { if (e && e.stopPropagation) e.stopPropagation(); commit(E.ops.clearSlot(b, s.sp, i)); },
          dragStart: function (e) { if (!ph) { e.preventDefault(); return; } try { e.dataTransfer.setData('text/plain', 'slot:' + i); e.dataTransfer.effectAllowed = 'move'; } catch (x) {} },
          dragOver: function (e) { e.preventDefault(); if (s.over !== i) set({ over: i }); },
          dragLeave: function () { if (s.over === i) set({ over: -1 }); },
          drop: function (e) {
            e.preventDefault(); var d = ''; try { d = e.dataTransfer.getData('text/plain'); } catch (x) {}
            set({ over: -1, drag: '' });
            if (!d) return;
            if (d.indexOf('slot:') === 0) { var from = +d.slice(5); if (from !== i) { commit(E.ops.swapSlots(b, s.sp, from, i)); set({ slot: i }); } }
            else { commit(E.ops.place(b, s.sp, i, d)); set({ slot: i }); }
          }
        };
      }
      var slots = sp.slots.map(slotView);
      var lay = E.lay(sp);
      var comments = b.comments.map(function (cm) {
        return {
          id: cm.id, who: cm.who, t: cm.t, where: 'Spread ' + (cm.sp + 1), cls: 'ed-cm' + (cm.done ? ' done' : ''), done: cm.done, label: cm.done ? 'Reopen' : 'Mark fixed',
          toggle: function () { commit(E.ops.resolve(b, cm.id, !cm.done)); },
          jump: function () { go(cm.sp); }
        };
      });
      var spComments = comments.filter(function (cm, i) { return b.comments[i].sp === s.sp; });
      var checks = [
        { ok: st.empty === 0, t: st.empty === 0 ? 'Every frame has a photo' : st.empty + ' empty frame' + (st.empty === 1 ? '' : 's') + ' to fill' },
        { ok: st.low === 0, t: st.low === 0 ? 'No low-resolution photos' : st.low + ' photo' + (st.low === 1 ? '' : 's') + ' may print soft' },
        { ok: st.openComments === 0, t: st.openComments === 0 ? 'All customer comments fixed' : st.openComments + ' customer comment' + (st.openComments === 1 ? '' : 's') + ' still open' },
        { ok: b.spreads.every(function (x) { return x.caps[0].length < 90 && x.caps[1].length < 90; }), t: 'Captions fit inside the safe area' },
        { ok: b.spreads.length * 2 <= b.pagesTotal, t: 'Pages designed: ' + b.spreads.length * 2 + ' of ' + b.pagesTotal }
      ].map(function (x) { return { cls: 'ed-ck ' + (x.ok ? 'is-ok' : 'is-bad'), ok: x.ok, t: x.t }; });
      var stat = STATUS[b.status] || STATUS.draft;
      var rtl = typeof document !== 'undefined' && document.documentElement.dir === 'rtl';
      var stl = b.style, pf = E.preflight(b);
      var styleVars = '--pg-bg:' + stl.bg + ';--pg-ink:' + stl.ink + ';--pg-frame:' + stl.frame + ';--mx:' + stl.margin + '%;--gapk:' + stl.gap + ';--rad:' + stl.radius + 'px;--bw:' + stl.border + 'px;--cap-font:' + E.fonts[stl.font] + ';--cap-k:' + stl.size + ';--cap-align:' + stl.align + ';--cap-style:' + (stl.font === 'script' ? 'italic' : 'normal');
      var v = {
        styleVars: styleVars, userName: who, badgeCheck: pf.issues.length, hasBadgeCheck: pf.issues.length > 0, badgeCheckCls: 'ed-badge' + (pf.bad ? ' is-bad' : ''), badgeHist: st.openComments, hasBadgeHist: st.openComments > 0,
        // header / meta
        edCls: 'ed' + (opts.light ? ' ed-light' : '') + (studio ? ' ed-studio' : ''),
        title: b.title, onTitle: function (e) { commit(E.ops.setCover(E.ops.setMeta(b, { title: e.target.value }), { title: e.target.value }), '', 'title'); },
        dates: b.dates, owner: b.owner, order: b.order, round: b.round,
        saveLabel: 'Saved ' + E.ago(b.saved), statusLabel: stat[0], statusCls: 'ed-chip ' + stat[1],
        canUndo: can.undo, canRedo: can.redo, undo: self.undo, redo: self.redo, noUndo: !can.undo, noRedo: !can.redo,
        // stage
        spIdx: s.sp + 1, spTotal: b.spreads.length, spCount: 'Spread ' + (s.sp + 1) + ' of ' + b.spreads.length, pagesLabel: 'pages ' + (s.sp * 2 + 1) + '–' + (s.sp * 2 + 2),
        prevSp: function () { go(s.sp - 1); }, nextSp: function () { go(s.sp + 1); }, noPrev: s.sp === 0, noNext: s.sp === b.spreads.length - 1,
        spreadCls: 'ed-spread' + (s.flip ? ' flip' : ''), lay: sp.lay, slots: slots, isStory: lay.textL, storyText: sp.caps[0], isStoryR: lay.textR, storyTextR: sp.caps[1], showCapR: !lay.textR,
        onStoryR: function (e) { commit(E.ops.setCaption(b, s.sp, 1, e.target.value), '', 'cap:' + s.sp + ':1'); },
        onStory: function (e) { commit(E.ops.setCaption(b, s.sp, 0, e.target.value), '', 'cap:' + s.sp + ':0'); },
        capL: sp.caps[0], capR: sp.caps[1], showCapL: !lay.textL,
        onCapL: function (e) { commit(E.ops.setCaption(b, s.sp, 0, e.target.value), '', 'cap:' + s.sp + ':0'); }, onCapR: function (e) { commit(E.ops.setCaption(b, s.sp, 1, e.target.value), '', 'cap:' + s.sp + ':1'); },
        pgL: s.sp * 2 + 1, pgR: s.sp * 2 + 2, safeCls: 'ed-safe' + (s.safe ? ' on' : ''), safeOn: s.safe ? 'true' : 'false', toggleSafe: function () { set({ safe: !s.safe }); },
        // filmstrip
        film: b.spreads.map(function (x, i) {
          var cells = E.cellsFor(x, E.photoById);
          var miss = x.slots.filter(function (t) { return !t.p; }).length;
          return { i: i, n: i + 1, lay: x.lay, cells: cells, miss: miss, missLabel: miss ? miss + ' empty' : '', cur: i === s.sp ? 'true' : 'false', go: function () { go(i); }, label: 'Go to spread ' + (i + 1) };
        }),
        addSpread: function () { var n = E.ops.addSpread(b, s.sp); commit(n, 'Spread added', '', 'Added spread ' + (s.sp + 2)); set({ sp: s.sp + 1, slot: null }); },
        dupSpread: function () { commit(E.ops.duplicateSpread(b, s.sp), 'Spread duplicated (photos not copied)', '', 'Duplicated spread ' + (s.sp + 1)); set({ sp: s.sp + 1, slot: null }); },
        delSpread: function () { if (b.spreads.length < 2) return; commit(E.ops.deleteSpread(b, s.sp), 'Spread deleted', '', 'Deleted spread ' + (s.sp + 1)); set({ sp: clampSp(b, Math.min(s.sp, b.spreads.length - 2)), slot: null }); },
        moveL: function () { commit(E.ops.moveSpread(b, s.sp, s.sp - 1)); set({ sp: Math.max(0, s.sp - 1) }); },
        moveR: function () { commit(E.ops.moveSpread(b, s.sp, s.sp + 1)); set({ sp: Math.min(b.spreads.length - 1, s.sp + 1) }); },
        canDel: b.spreads.length > 1, noMoveL: s.sp === 0, noMoveR: s.sp === b.spreads.length - 1,
        // tray
        tray: tilePhotos.map(function (p) {
          return {
            id: p.id, src: p.src, name: p.name, low: p.low, star: E.isStar(b, p), n: used[p.id] || '', usedCls: 'ed-ph' + (used[p.id] ? ' used' : ''), hasN: !!used[p.id],
            label: p.name + (used[p.id] ? ', used on spread ' + used[p.id] : ''),
            pick: function () { place(p.id); },
            dragStart: function (e) { try { e.dataTransfer.setData('text/plain', p.id); e.dataTransfer.effectAllowed = 'copyMove'; } catch (x) {} }
          };
        }),
        fltAll: s.flt === 'all' ? 'true' : 'false', fltUn: s.flt === 'unused' ? 'true' : 'false', fltSt: s.flt === 'star' ? 'true' : 'false', fltLo: s.flt === 'low' ? 'true' : 'false',
        setAll: function () { set({ flt: 'all' }); }, setUn: function () { set({ flt: 'unused' }); }, setSt: function () { set({ flt: 'star' }); }, setLo: function () { set({ flt: 'low' }); },
        trayCount: tilePhotos.length + ' of ' + lib.length + ' photos',
        // inspector
        layouts: choices(s.sp).map(function (l) { return { id: l.id, name: l.name, mini: l.mini, cells: l.cells, on: l.on ? 'true' : 'false', pick: function () { applyLayout(l.id, [s.sp]); set({ slot: null }); } }; }),
        ltBoth: pressed(lt() === 'both'), ltLeft: pressed(lt() === 'left'), ltRight: pressed(lt() === 'right'),
        setLtBoth: function () { set({ lt: 'both' }); }, setLtLeft: function () { set({ lt: 'left' }); }, setLtRight: function () { set({ lt: 'right' }); },
        ltHint: lt() === 'both' ? 'These layouts can run across both pages.' : 'Only the ' + lt() + ' page changes. The other page keeps its layout.',
        layName: lay.name,
        hasSel: !!sel, hasPhoto: !!selPhoto, noSel: !sel, selName: selPhoto ? selPhoto.name : (sel ? 'Empty frame' : ''), selNo: s.slot != null ? s.slot + 1 : 0,
        selLow: !!(selPhoto && selPhoto.low),
        zoom: sel ? sel.z : 1, px: sel ? sel.x : 50, py: sel ? sel.y : 50, br: sel ? sel.b : 100,
        zoomL: sel ? Math.round(sel.z * 100) + '%' : '', pxL: sel ? sel.x + '%' : '', pyL: sel ? sel.y + '%' : '', brL: sel ? sel.b + '%' : '',
        onZoom: function (e) { adj({ z: +e.target.value }, 'z'); }, onPx: function (e) { adj({ x: +e.target.value }, 'x'); }, onPy: function (e) { adj({ y: +e.target.value }, 'y'); }, onBr: function (e) { adj({ b: +e.target.value }, 'b'); },
        resetAdj: function () { adj({ z: 1, x: 50, y: 50, b: 100 }); }, clearSel: function () { commit(E.ops.clearSlot(b, s.sp, s.slot)); },
        // stats
        st: st, stUsed: st.used, stUnused: st.unused, stEmpty: st.empty, stLow: st.low, stPages: st.pages, stTotal: st.total, stOpen: st.openComments,
        prog: Math.min(1, st.pages / st.total).toFixed(3), progLabel: st.pages + ' of ' + st.total + ' pages designed',
        emptyWarn: st.empty > 0 ? 'is-warn' : '', lowWarn: st.low > 0 ? 'is-warn' : '',
        // actions
        preview: s.preview, openPreview: function () { set({ preview: true, flip: false }); }, closePreview: function () { set({ preview: false }); },
        toast: s.toast, hasToast: !!s.toast,
        requestProof: function () { commit(E.ops.setStatus(b, 'proof-requested'), 'Sent. Rameen will review your changes and send proof round ' + (b.round + 1) + ' within 2 days.', '', 'Asked for proof round ' + (b.round + 1)); },
        canRequest: b.status === 'draft' || b.status === 'proof-sent', requestLabel: b.status === 'proof-requested' ? 'Proof requested' : 'Send to proof',
        resetDemo: function () { var f = E.reset(); hist.past = []; hist.future = []; set({ book: E.save(f), sp: 0, slot: null, tick: Date.now() }); toast('Demo book reset'); },
        // studio
        tabC: s.tab === 'comments' ? 'true' : 'false', tabK: s.tab === 'checks' ? 'true' : 'false', tabH: s.tab === 'history' ? 'true' : 'false',
        showC: s.tab === 'comments', showK: s.tab === 'checks', showH: s.tab === 'history',
        goC: function () { set({ tab: 'comments' }); }, goK: function () { set({ tab: 'checks' }); }, goH: function () { set({ tab: 'history' }); },
        comments: comments, spComments: spComments, hasSpComments: spComments.length > 0, noSpComments: spComments.length === 0, cmDraft: s.cmDraft,
        onCmDraft: function (e) { set({ cmDraft: e.target.value }); },
        addComment: function () { var t = (s.cmDraft || '').trim(); if (!t) return; commit(E.ops.addComment(b, s.sp, who, t), '', '', 'Commented on spread ' + (s.sp + 1)); set({ cmDraft: '' }); },
        checks: checks, allGood: checks.every(function (x) { return x.ok; }),
        versions: b.versions.slice().reverse().map(function (x) { return { id: x.id, label: x.label, by: x.by, when: E.ago(x.at) }; }),
        saveVersion: function () { commit(E.ops.saveVersion(b, 'Saved version ' + (b.versions.length + 1), who), 'Version saved', '', 'Saved version ' + (b.versions.length + 1)); },
        sendProof: function () { commit(E.ops.setStatus(b, 'proof-sent'), 'Proof round ' + (b.round + 1) + ' sent to ' + b.owner + ' on WhatsApp', '', 'Proof round ' + (b.round + 1) + ' sent to ' + b.owner + ' on WhatsApp'); },
        lockDesign: function () { commit(E.ops.setStatus(b, 'locked'), 'Design locked. Balance link sent.', '', 'Locked the design'); },
        notes: b.notes, onNotes: function (e) { commit(E.ops.setMeta(b, { notes: e.target.value }), '', 'notes'); },
        isLocked: b.status === 'locked', canSend: b.status !== 'locked', requested: b.status === 'proof-requested',
        sendLabel: 'Send proof round ' + (b.round + 1), nextRound: b.round + 1
      };
      return v;
    };
    return self;
  }
  window.MilesEditorUI = { create: create };
})();
