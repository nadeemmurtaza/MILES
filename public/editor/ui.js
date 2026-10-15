/* Miles Retold · live book editor UI layer. Binds window.MilesEditor (core.js) to a Design Component.
   Usage inside the page's Component:
     constructor: this.ed = MilesEditorUI.create(this, { studio: false });   this.state = this.ed.initial();
     componentDidMount: this.ed.mount();      componentWillUnmount: this.ed.unmount();
     renderVals: Object.assign(header values, this.ed.vals())                                                */
(function () {
  'use strict';
  var E = window.MilesEditor;
  var CELLS = { full: 1, pair: 2, trio: 3, quad: 4, story: 1, collage: 5 };
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

    function commit(next, msg) {
      hist.push(book());
      var saved = E.save(next);
      set({ book: saved, tick: Date.now() });
      if (msg) toast(msg);
    }
    function toast(m) {
      set({ toast: m });
      clearTimeout(toastT); toastT = setTimeout(function () { set({ toast: '' }); }, 3200);
    }
    function clampSp(b, i) { return Math.max(0, Math.min(b.spreads.length - 1, i)); }
    function go(i) { var b = book(); set({ sp: clampSp(b, i), slot: null, flip: true }); setTimeout(function () { set({ flip: false }); }, 280); }
    function place(pid) {
      var s = S(), b = book(), sp = b.spreads[s.sp], idx = s.slot;
      if (idx == null) { for (var i = 0; i < sp.slots.length; i++) if (!sp.slots[i].p) { idx = i; break; } }
      if (idx == null) { toast('Pick a frame first, or clear one.'); return; }
      commit(E.ops.place(b, s.sp, idx, pid)); set({ slot: idx });
    }
    function adj(patch) { var s = S(); if (s.slot == null) return; commit(E.ops.adjust(book(), s.sp, s.slot, patch)); }

    self.initial = function () {
      return { book: E.load(), sp: 0, slot: null, flt: 'all', over: -1, drag: '', toast: '', preview: false, tick: Date.now(), flip: false, safe: false, tab: 'comments', cmDraft: '', note: '' };
    };

    self.mount = function () {
      self._key = function (e) {
        var t = e.target, typing = t && (/^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName) && t.type !== 'range' || t.isContentEditable);
        var rtl = document.documentElement.dir === 'rtl';
        if ((e.metaKey || e.ctrlKey) && (e.key === 'z' || e.key === 'Z')) { e.preventDefault(); if (e.shiftKey) self.redo(); else self.undo(); return; }
        if (typing) return;
        if (e.key === 'ArrowRight') go(S().sp + (rtl ? -1 : 1));
        else if (e.key === 'ArrowLeft') go(S().sp + (rtl ? 1 : -1));
        else if (e.key === 'Escape' && S().preview) set({ preview: false });
        else if ((e.key === 'Delete' || e.key === 'Backspace') && S().slot != null) { commit(E.ops.clearSlot(book(), S().sp, S().slot)); }
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
      var tilePhotos = E.photos.filter(function (p) {
        if (s.flt === 'unused') return !used[p.id];
        if (s.flt === 'star') return p.star;
        if (s.flt === 'low') return p.low;
        return true;
      });
      function slotView(sl, i) {
        var ph = sl.p ? E.photoById(sl.p) : null;
        var full = sp.lay === 'full';
        return {
          i: i, has: !!ph, empty: !ph, src: ph ? ph.src : '', alt: ph ? ph.name : '',
          cls: 'ed-slot' + (s.slot === i ? ' sel' : '') + (s.over === i ? ' over' : '') + (full ? ' full' : ''),
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
      var lay = E.layout(sp.lay);
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
      var v = {
        // header / meta
        edCls: 'ed' + (opts.light ? ' ed-light' : '') + (studio ? ' ed-studio' : ''),
        title: b.title, onTitle: function (e) { commit(E.ops.setMeta(b, { title: e.target.value })); },
        dates: b.dates, owner: b.owner, order: b.order, round: b.round,
        saveLabel: 'Saved ' + E.ago(b.saved), statusLabel: stat[0], statusCls: 'ed-chip ' + stat[1],
        canUndo: can.undo, canRedo: can.redo, undo: self.undo, redo: self.redo, noUndo: !can.undo, noRedo: !can.redo,
        // stage
        spIdx: s.sp + 1, spTotal: b.spreads.length, spCount: 'Spread ' + (s.sp + 1) + ' of ' + b.spreads.length, pagesLabel: 'pages ' + (s.sp * 2 + 1) + '–' + (s.sp * 2 + 2),
        prevSp: function () { go(s.sp - 1); }, nextSp: function () { go(s.sp + 1); }, noPrev: s.sp === 0, noNext: s.sp === b.spreads.length - 1,
        spreadCls: 'ed-spread' + (s.flip ? ' flip' : ''), lay: sp.lay, slots: slots, isStory: !!lay.text, storyText: sp.caps[0],
        onStory: function (e) { commit(E.ops.setCaption(b, s.sp, 0, e.target.value)); },
        capL: sp.caps[0], capR: sp.caps[1], showCapL: !lay.text,
        onCapL: function (e) { commit(E.ops.setCaption(b, s.sp, 0, e.target.value)); }, onCapR: function (e) { commit(E.ops.setCaption(b, s.sp, 1, e.target.value)); },
        pgL: s.sp * 2 + 1, pgR: s.sp * 2 + 2, safeCls: 'ed-safe' + (s.safe ? ' on' : ''), safeOn: s.safe ? 'true' : 'false', toggleSafe: function () { set({ safe: !s.safe }); },
        // filmstrip
        film: b.spreads.map(function (x, i) {
          var cells = x.slots.map(function (t) { var p = t.p ? E.photoById(t.p) : null; return { src: p ? p.src : '', has: !!p }; });
          var miss = x.slots.filter(function (t) { return !t.p; }).length;
          return { i: i, n: i + 1, lay: x.lay, cells: cells, miss: miss, missLabel: miss ? miss + ' empty' : '', cur: i === s.sp ? 'true' : 'false', go: function () { go(i); }, label: 'Go to spread ' + (i + 1) };
        }),
        addSpread: function () { var n = E.ops.addSpread(b, s.sp); commit(n, 'Spread added'); set({ sp: s.sp + 1, slot: null }); },
        dupSpread: function () { commit(E.ops.duplicateSpread(b, s.sp), 'Spread duplicated (photos not copied)'); set({ sp: s.sp + 1, slot: null }); },
        delSpread: function () { if (b.spreads.length < 2) return; commit(E.ops.deleteSpread(b, s.sp), 'Spread deleted'); set({ sp: clampSp(b, Math.min(s.sp, b.spreads.length - 2)), slot: null }); },
        moveL: function () { commit(E.ops.moveSpread(b, s.sp, s.sp - 1)); set({ sp: Math.max(0, s.sp - 1) }); },
        moveR: function () { commit(E.ops.moveSpread(b, s.sp, s.sp + 1)); set({ sp: Math.min(b.spreads.length - 1, s.sp + 1) }); },
        canDel: b.spreads.length > 1, noMoveL: s.sp === 0, noMoveR: s.sp === b.spreads.length - 1,
        // tray
        tray: tilePhotos.map(function (p) {
          return {
            id: p.id, src: p.src, name: p.name, low: p.low, star: p.star, n: used[p.id] || '', usedCls: 'ed-ph' + (used[p.id] ? ' used' : ''), hasN: !!used[p.id],
            label: p.name + (used[p.id] ? ', used on spread ' + used[p.id] : ''),
            pick: function () { place(p.id); },
            dragStart: function (e) { try { e.dataTransfer.setData('text/plain', p.id); e.dataTransfer.effectAllowed = 'copyMove'; } catch (x) {} }
          };
        }),
        fltAll: s.flt === 'all' ? 'true' : 'false', fltUn: s.flt === 'unused' ? 'true' : 'false', fltSt: s.flt === 'star' ? 'true' : 'false', fltLo: s.flt === 'low' ? 'true' : 'false',
        setAll: function () { set({ flt: 'all' }); }, setUn: function () { set({ flt: 'unused' }); }, setSt: function () { set({ flt: 'star' }); }, setLo: function () { set({ flt: 'low' }); },
        trayCount: tilePhotos.length + ' of ' + E.photos.length + ' photos',
        // inspector
        layouts: E.layouts.map(function (l) {
          var cells = []; for (var i = 0; i < CELLS[l.id]; i++) cells.push({ k: i });
          return { id: l.id, name: l.name, cells: cells, on: sp.lay === l.id ? 'true' : 'false', pick: function () { commit(E.ops.setLayout(b, s.sp, l.id)); set({ slot: null }); } };
        }),
        hasSel: !!sel, hasPhoto: !!selPhoto, noSel: !sel, selName: selPhoto ? selPhoto.name : (sel ? 'Empty frame' : ''), selNo: s.slot != null ? s.slot + 1 : 0,
        selLow: !!(selPhoto && selPhoto.low),
        zoom: sel ? sel.z : 1, px: sel ? sel.x : 50, py: sel ? sel.y : 50, br: sel ? sel.b : 100,
        zoomL: sel ? Math.round(sel.z * 100) + '%' : '', pxL: sel ? sel.x + '%' : '', pyL: sel ? sel.y + '%' : '', brL: sel ? sel.b + '%' : '',
        onZoom: function (e) { adj({ z: +e.target.value }); }, onPx: function (e) { adj({ x: +e.target.value }); }, onPy: function (e) { adj({ y: +e.target.value }); }, onBr: function (e) { adj({ b: +e.target.value }); },
        resetAdj: function () { adj({ z: 1, x: 50, y: 50, b: 100 }); }, clearSel: function () { commit(E.ops.clearSlot(b, s.sp, s.slot)); },
        // stats
        st: st, stUsed: st.used, stUnused: st.unused, stEmpty: st.empty, stLow: st.low, stPages: st.pages, stTotal: st.total, stOpen: st.openComments,
        prog: Math.min(1, st.pages / st.total).toFixed(3), progLabel: st.pages + ' of ' + st.total + ' pages designed',
        emptyWarn: st.empty > 0 ? 'is-warn' : '', lowWarn: st.low > 0 ? 'is-warn' : '',
        // actions
        preview: s.preview, openPreview: function () { set({ preview: true, flip: false }); }, closePreview: function () { set({ preview: false }); },
        toast: s.toast, hasToast: !!s.toast,
        requestProof: function () { commit(E.ops.setStatus(b, 'proof-requested'), 'Sent. Rameen will review your changes and send proof round ' + (b.round + 1) + ' within 2 days.'); },
        canRequest: b.status === 'draft' || b.status === 'proof-sent', requestLabel: b.status === 'proof-requested' ? 'Proof requested' : 'Send to proof',
        resetDemo: function () { var f = E.reset(); hist.past = []; hist.future = []; set({ book: E.save(f), sp: 0, slot: null, tick: Date.now() }); toast('Demo book reset'); },
        // studio
        tabC: s.tab === 'comments' ? 'true' : 'false', tabK: s.tab === 'checks' ? 'true' : 'false', tabH: s.tab === 'history' ? 'true' : 'false',
        showC: s.tab === 'comments', showK: s.tab === 'checks', showH: s.tab === 'history',
        goC: function () { set({ tab: 'comments' }); }, goK: function () { set({ tab: 'checks' }); }, goH: function () { set({ tab: 'history' }); },
        comments: comments, spComments: spComments, hasSpComments: spComments.length > 0, noSpComments: spComments.length === 0, cmDraft: s.cmDraft,
        onCmDraft: function (e) { set({ cmDraft: e.target.value }); },
        addComment: function () { var t = (s.cmDraft || '').trim(); if (!t) return; commit(E.ops.addComment(b, s.sp, opts.studio ? 'Rameen' : 'Sara', t)); set({ cmDraft: '' }); },
        checks: checks, allGood: checks.every(function (x) { return x.ok; }),
        versions: b.versions.slice().reverse().map(function (x) { return { id: x.id, label: x.label, by: x.by, when: E.ago(x.at) }; }),
        saveVersion: function () { commit(E.ops.saveVersion(b, 'Saved version ' + (b.versions.length + 1)), 'Version saved'); },
        sendProof: function () { commit(E.ops.setStatus(b, 'proof-sent'), 'Proof round ' + (b.round + 1) + ' sent to ' + b.owner + ' on WhatsApp'); },
        lockDesign: function () { commit(E.ops.setStatus(b, 'locked'), 'Design locked. Balance link sent.'); },
        notes: b.notes, onNotes: function (e) { commit(E.ops.setMeta(b, { notes: e.target.value })); },
        isLocked: b.status === 'locked', canSend: b.status !== 'locked', requested: b.status === 'proof-requested',
        sendLabel: 'Send proof round ' + (b.round + 1), nextRound: b.round + 1
      };
      return v;
    };
    return self;
  }
  window.MilesEditorUI = { create: create };
})();
