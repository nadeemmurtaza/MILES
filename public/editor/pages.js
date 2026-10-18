/* Miles Retold · live book editor, workspace pages.
   Every page of the editor family (storyboard, photos, layouts, text, cover, style, flipbook, print check, history,
   send / handoff) is a Design Component that shares one book with the canvas (editor/core.js) and one UI layer
   (editor/ui.js). This file holds the page-specific state and the values each page template binds to.

   Usage inside a page's Component:
     constructor: this.ed = MilesEditorUI.create(this, { studio, light, noArrows });
                  this.pg = MilesEditorPages.create('storyboard', this.ed, this, { canvas: 'GL23-Editor.dc.html', studio, light });
                  this.state = Object.assign({}, this.ed.initial(), this.pg.initial());
     componentDidMount: this.ed.mount(); this.pg.mount();      componentWillUnmount: this.pg.unmount(); this.ed.unmount();
     renderVals: Object.assign(header values, this.ed.vals(), this.pg.vals())

   Pages: storyboard · photos · layouts · text · cover · style · flipbook · printcheck · history · send                  */
(function () {
  'use strict';
  var E = window.MilesEditor;

  /* ---------- helpers shared by the pages ---------- */
  function imgStyle(s) { return 'object-position:' + s.x + '% ' + s.y + '%;transform:scale(' + s.z + ');filter:brightness(' + (s.b / 100) + ')'; }
  /* a read-only picture of one spread: what the flipbook, the style preview and the cover page render */
  function view(b, sp) {
    var lay = E.lay(sp);
    return {
      lay: sp.lay, isStory: lay.textL, storyText: sp.caps[0], isStoryR: lay.textR, storyTextR: sp.caps[1], capL: sp.caps[0], capR: sp.caps[1], showCapL: !lay.textL, showCapR: !lay.textR,
      slots: sp.slots.map(function (s) { var p = s.p ? E.photoById(s.p) : null; return { has: !!p, empty: !p, src: p ? p.src : '', alt: p ? p.name : '', img: p ? imgStyle(s) : '', low: !!(p && p.low) }; })
    };
  }
  function cells(sp) { return E.cellsFor(sp, E.photoById); }
  function download(name, mime, text) {
    try {
      var a = document.createElement('a'), url = URL.createObjectURL(new Blob([text], { type: mime }));
      a.href = url; a.download = name; document.body.appendChild(a); a.click();
      setTimeout(function () { URL.revokeObjectURL(url); a.remove(); }, 500);
    } catch (e) {}
  }
  function plural(n, one, many) { return n + ' ' + (n === 1 ? one : (many || one + 's')); }
  function pressed(on) { return on ? 'true' : 'false'; }

  var builders = {};

  /* =========================================================================================================
     STORYBOARD: every spread at a glance. Reorder by dragging, select several, change layouts in bulk.
     ========================================================================================================= */
  builders.storyboard = function (x) {
    var S = x.S, set = x.set, ed = x.ed;
    return {
      initial: function () { return { sel: [], sbView: 'spreads', sbf: 'all', dragFrom: -1, dragOver: -1 }; },
      vals: function () {
        var s = S(), b = ed.book(), sel = s.sel.filter(function (i) { return i < b.spreads.length; });
        var cmBySp = {}; b.comments.forEach(function (cm) { if (!cm.done) cmBySp[cm.sp] = (cmBySp[cm.sp] || 0) + 1; });
        var all = b.spreads.map(function (sp, i) {
          var miss = sp.slots.filter(function (t) { return !t.p; }).length, low = sp.slots.some(function (t) { var p = t.p && E.photoById(t.p); return p && p.low; });
          return { sp: sp, i: i, miss: miss, low: low, cm: cmBySp[i] || 0 };
        });
        var counts = { all: all.length, empty: all.filter(function (a) { return a.miss; }).length, comments: all.filter(function (a) { return a.cm; }).length, low: all.filter(function (a) { return a.low; }).length };
        var shown = all.filter(function (a) { return s.sbf === 'all' || (s.sbf === 'empty' && a.miss) || (s.sbf === 'comments' && a.cm) || (s.sbf === 'low' && a.low); });
        function toggle(i) { var cur = S().sel.slice(), k = cur.indexOf(i); if (k < 0) cur.push(i); else cur.splice(k, 1); set({ sel: cur }); }
        function move(i, to) { if (to < 0 || to >= b.spreads.length) return; ed.commit(E.ops.moveSpread(b, i, to), 'Spread ' + (i + 1) + ' moved to position ' + (to + 1), '', 'Moved spread ' + (i + 1) + ' to ' + (to + 1)); set({ sel: [] }); }
        var cards = shown.map(function (a) {
          var i = a.i, on = sel.indexOf(i) >= 0;
          return {
            i: i, n: i + 1, lay: a.sp.lay, layName: E.lay(a.sp).name, cells: cells(a.sp), pages: 'Pages ' + (i * 2 + 1) + '–' + (i * 2 + 2),
            capL: a.sp.caps[0], capR: a.sp.caps[1], hasCap: !!(a.sp.caps[0] || a.sp.caps[1]), capText: (a.sp.caps[0] || a.sp.caps[1] || '').slice(0, 60),
            miss: a.miss, hasMiss: a.miss > 0, missLabel: a.miss + ' empty', low: a.low, cm: a.cm, hasCm: a.cm > 0, cmLabel: plural(a.cm, 'open comment'),
            cls: 'ew-card' + (on ? ' sel' : '') + (s.dragOver === i && s.dragFrom !== i ? ' over' : '') + (s.dragFrom === i ? ' drag' : ''), on: pressed(on),
            toggle: function () { toggle(i); }, open: function () { ed.jump(i, null, x.opts.canvas); },
            earlier: function () { move(i, i - 1); }, later: function () { move(i, i + 1); }, noEarlier: i === 0, noLater: i === b.spreads.length - 1,
            dup: function () { ed.commit(E.ops.duplicateSpread(b, i), 'Spread duplicated (photos not copied)', '', 'Duplicated spread ' + (i + 1)); },
            checkLabel: (on ? 'Deselect' : 'Select') + ' spread ' + (i + 1), openLabel: 'Open spread ' + (i + 1) + ' in the canvas',
            dragStart: function (e) { try { e.dataTransfer.setData('text/plain', 'sb:' + i); e.dataTransfer.effectAllowed = 'move'; } catch (z) {} set({ dragFrom: i }); },
            dragOver: function (e) { e.preventDefault(); if (S().dragOver !== i) set({ dragOver: i }); },
            dragEnd: function () { set({ dragFrom: -1, dragOver: -1 }); },
            drop: function (e) { e.preventDefault(); var from = S().dragFrom; set({ dragFrom: -1, dragOver: -1 }); if (from >= 0 && from !== i) move(from, i); }
          };
        });
        /* flat plan: page by page, sixteen pages to a printed signature */
        var pages = [];
        b.spreads.forEach(function (sp, i) {
          var cl = cells(sp);
          [0, 1].forEach(function (side) {
            var n = i * 2 + side + 1;
            pages.push({ n: n, lay: sp.lay, cells: cl, sideCls: 'ew-half ' + (side ? 'r' : 'l'), sig: Math.ceil(n / 16), first: (n - 1) % 16 === 0, sigLabel: 'Signature ' + Math.ceil(n / 16) + ' · pages ' + ((Math.ceil(n / 16) - 1) * 16 + 1) + '–' + Math.min(Math.ceil(n / 16) * 16, b.pagesTotal),
              spread: i + 1, go: function () { ed.jump(i, null, x.opts.canvas); }, label: 'Page ' + n + ', spread ' + (i + 1) });
          });
        });
        var lays = ed.layoutChoices(Math.min(sel.length ? sel[0] : 0, b.spreads.length - 1)).map(function (l) { return { id: l.id, name: l.name, mini: l.mini, cells: l.cells, pick: function () { if (!sel.length) return; ed.applyLayout(l.id, sel); } }; });
        var st = E.stats(b);
        return {
          sbCards: cards, sbPages: pages, sbSpreads: s.sbView === 'spreads', sbFlat: s.sbView === 'flat', sbNone: shown.length === 0,
          vSp: pressed(s.sbView === 'spreads'), vFl: pressed(s.sbView === 'flat'), setVSp: function () { set({ sbView: 'spreads' }); }, setVFl: function () { set({ sbView: 'flat' }); },
          sbAll: pressed(s.sbf === 'all'), sbEm: pressed(s.sbf === 'empty'), sbCm: pressed(s.sbf === 'comments'), sbLo: pressed(s.sbf === 'low'),
          fAll: function () { set({ sbf: 'all' }); }, fEm: function () { set({ sbf: 'empty' }); }, fCm: function () { set({ sbf: 'comments' }); }, fLo: function () { set({ sbf: 'low' }); },
          nAll: counts.all, nEm: counts.empty, nCm: counts.comments, nLo: counts.low,
          selN: sel.length, hasSel: sel.length > 0, noSel: sel.length === 0, selLabel: sel.length ? plural(sel.length, 'spread') + ' selected' : 'Tap the tick on a spread to select it',
          selectAll: function () { set({ sel: b.spreads.map(function (z, i) { return i; }) }); }, selectNone: function () { set({ sel: [] }); },
          sbLays: lays,
          dupSel: function () { var idx = sel.slice().sort(function (p, q) { return q - p; }), nb = b; idx.forEach(function (i) { nb = E.ops.duplicateSpread(nb, i); }); ed.commit(nb, plural(sel.length, 'spread') + ' duplicated', '', 'Duplicated ' + plural(sel.length, 'spread')); set({ sel: [] }); },
          delSel: function () { if (sel.length >= b.spreads.length) { ed.toast('A book needs at least one spread.'); return; } ed.commit(E.ops.deleteMany(b, sel), plural(sel.length, 'spread') + ' deleted', '', 'Deleted ' + plural(sel.length, 'spread')); set({ sel: [] }); },
          sbAdd: function () { ed.commit(E.ops.addSpread(b, b.spreads.length - 1), 'Spread added at the end', '', 'Added spread ' + (b.spreads.length + 1)); },
          sbPrint: function () { try { window.print(); } catch (z) {} },
          sbSpreadsN: b.spreads.length, sbPagesN: st.pages, sbOrdered: st.total, sbEmptyN: st.empty, sbLowN: st.low, sbOpenN: st.openComments,
          sbFill: Math.min(1, st.pages / st.total).toFixed(3), sbFillLabel: st.pages + ' of ' + st.total + ' pages designed'
        };
      }
    };
  };

  /* =========================================================================================================
     PHOTOS: the library of this book. Stars, notes, duplicates, usage, adding more.
     ========================================================================================================= */
  builders.photos = function (x) {
    var S = x.S, set = x.set, ed = x.ed, timer = 0;
    return {
      initial: function () { return { phf: 'all', phq: '', phSort: 'order', phSize: 120, phPick: 'p1', up: -1 }; },
      unmount: function () { clearInterval(timer); },
      vals: function () {
        var s = S(), b = ed.book(), used = E.usedMap(b), lib = E.library(b), hiddenList = E.inLibrary(b).filter(function (p) { return b.hidden[p.id]; });
        var groups = {}; lib.forEach(function (p) { (groups[p.same] = groups[p.same] || []).push(p); });
        var dupGroups = Object.keys(groups).map(function (k) { return groups[k]; }).filter(function (g) { return g.length > 1; });
        var dupIds = {}; dupGroups.forEach(function (g) { g.forEach(function (p, i) { if (i > 0) dupIds[p.id] = 1; }); });   /* the first copy is the original; only the extras are flagged */
        var q = (s.phq || '').toLowerCase();
        var list = (s.phf === 'hidden' ? hiddenList : lib).filter(function (p) {
          if (q && p.name.toLowerCase().indexOf(q) < 0 && (b.memo[p.id] || '').toLowerCase().indexOf(q) < 0) return false;
          if (s.phf === 'unused') return !used[p.id];
          if (s.phf === 'used') return !!used[p.id];
          if (s.phf === 'star') return E.isStar(b, p);
          if (s.phf === 'low') return p.low;
          if (s.phf === 'dupes') return !!dupIds[p.id];
          return true;
        });
        if (s.phSort === 'name') list = list.slice().sort(function (p, c) { return p.name.localeCompare(c.name); });
        if (s.phSort === 'used') list = list.slice().sort(function (p, c) { return (used[c.id] ? 1 : 0) - (used[p.id] ? 1 : 0) || E.photos.indexOf(p) - E.photos.indexOf(c); });
        var tiles = list.map(function (p) {
          return {
            id: p.id, src: p.src, name: p.name, low: p.low, star: E.isStar(b, p), n: used[p.id] || '', hasN: !!used[p.id], hid: !!b.hidden[p.id], dupe: !!dupIds[p.id],
            cls: 'ew-ph' + (s.phPick === p.id ? ' sel' : '') + (used[p.id] ? ' used' : ''), label: p.name + (used[p.id] ? ', used on spread ' + used[p.id] : ', not used') + (E.isStar(b, p) ? ', starred' : ''),
            pick: function () { set({ phPick: p.id }); },
            dragStart: function (e) { try { e.dataTransfer.setData('text/plain', p.id); e.dataTransfer.effectAllowed = 'copy'; } catch (z) {} }
          };
        });
        var sp = s.phPick ? E.photoById(s.phPick) : null, has = !!sp && (E.inLibrary(b).indexOf(sp) >= 0);
        var det = {};
        if (has) {
          var at = used[sp.id], mp = (sp.w * sp.h / 1e6).toFixed(1), wIn = (sp.w / 200).toFixed(1), hIn = (sp.h / 200).toFixed(1);
          var same = lib.filter(function (p) { return p.same === sp.same && p.id !== sp.id; });
          var empty = null; b.spreads.some(function (z, i) { return z.slots.some(function (t, k) { if (!t.p) { empty = { i: i, k: k }; return true; } return false; }); });
          det = {
            dSrc: sp.src, dName: sp.name, dDims: sp.w + ' × ' + sp.h + ' px · ' + mp + ' MP', dSharp: sp.low ? 'Soft: prints well only in a small frame' : 'Sharp up to ' + wIn + ' × ' + hIn + ' in at 200 dpi',
            dSharpCls: 'ew-note ' + (sp.low ? 'is-bad' : 'is-ok'), dUsed: at ? 'Used on spread ' + at : 'Not used yet', dIsUsed: !!at, dNotUsed: !at,
            dStar: E.isStar(b, sp), dStarLabel: E.isStar(b, sp) ? 'Starred' : 'Star', dStarOn: pressed(E.isStar(b, sp)),
            dMemo: b.memo[sp.id] || '', dHid: !!b.hidden[sp.id], dVisible: !b.hidden[sp.id],
            dSame: same.length ? 'Same file as ' + same.map(function (p) { return p.name; }).slice(0, 3).join(', ') : '', dHasSame: same.length > 0,
            toggleStar: function () { ed.commit(E.ops.setStar(b, sp.id, !E.isStar(b, sp))); },
            onMemo: function (e) { ed.commit(E.ops.setNote(b, sp.id, e.target.value), '', 'memo:' + sp.id); },
            hide: function () { ed.commit(E.ops.hidePhoto(b, sp.id, true), 'Photo removed from this book. It stays in the hidden list.', '', 'Removed ' + sp.name + ' from the library'); },
            unhide: function () { ed.commit(E.ops.hidePhoto(b, sp.id, false), 'Photo is back in the library', '', 'Restored ' + sp.name); },
            placeNext: function () { if (!empty) { ed.toast('No empty frame left. Add a spread first.'); return; } ed.commit(E.ops.place(b, empty.i, empty.k, sp.id), 'Placed on spread ' + (empty.i + 1), '', 'Placed ' + sp.name + ' on spread ' + (empty.i + 1)); },
            noEmpty: !empty, openAt: function () { ed.jump(at - 1, null, x.opts.canvas); }
          };
        }
        var dupRows = dupGroups.map(function (g) {
          return { n: g.length, name: g[0].name.replace(/ \d+$/, ''), thumbs: g.map(function (p) { return { src: p.src, cls: used[p.id] ? 'used' : '' }; }),
            label: g.length + ' copies of ' + g[0].name.replace(/ \d+$/, ''),
            fix: function () { var nb = b, drop = g.filter(function (p, i) { return i > 0 && !used[p.id]; }); drop.forEach(function (p) { nb = E.ops.hidePhoto(nb, p.id, true); }); if (!drop.length) { ed.toast('Every copy is already placed in the book.'); return; } ed.commit(nb, plural(drop.length, 'extra copy', 'extra copies') + ' removed', '', 'Removed ' + plural(drop.length, 'duplicate photo')); } };
        });
        var left = E.photos.length - E.base - (b.extra || 0);
        function runUpload() {
          if (s.up >= 0 || left <= 0) return;
          set({ up: 0 }); var n = Math.min(3, left);
          timer = setInterval(function () {
            var p = S().up + 12;
            if (p >= 100) { clearInterval(timer); set({ up: -1 }); ed.commit(E.ops.addPhotos(ed.book(), n), plural(n, 'photo') + ' added to the library', '', 'Added ' + plural(n, 'photo')); }
            else set({ up: p });
          }, 110);
        }
        var st = E.stats(b), starN = lib.filter(function (p) { return E.isStar(b, p); }).length;
        return Object.assign({
          phTiles: tiles, phNone: tiles.length === 0, phCount: tiles.length + ' of ' + (s.phf === 'hidden' ? hiddenList.length : lib.length) + ' photos',
          pAll: pressed(s.phf === 'all'), pUn: pressed(s.phf === 'unused'), pUs: pressed(s.phf === 'used'), pSt: pressed(s.phf === 'star'), pLo: pressed(s.phf === 'low'), pDu: pressed(s.phf === 'dupes'), pHi: pressed(s.phf === 'hidden'),
          fAll: function () { set({ phf: 'all' }); }, fUn: function () { set({ phf: 'unused' }); }, fUs: function () { set({ phf: 'used' }); }, fSt: function () { set({ phf: 'star' }); },
          fLo: function () { set({ phf: 'low' }); }, fDu: function () { set({ phf: 'dupes' }); }, fHi: function () { set({ phf: 'hidden' }); },
          nAll: lib.length, nUn: st.unused, nUs: st.used, nSt: starN, nLo: lib.filter(function (p) { return p.low; }).length, nDu: dupIds ? Object.keys(dupIds).length : 0, nHi: hiddenList.length,
          phQ: s.phq, onQ: function (e) { set({ phq: e.target.value }); },
          sOrder: pressed(s.phSort === 'order'), sName: pressed(s.phSort === 'name'), sUsed: pressed(s.phSort === 'used'),
          setSOrder: function () { set({ phSort: 'order' }); }, setSName: function () { set({ phSort: 'name' }); }, setSUsed: function () { set({ phSort: 'used' }); },
          phSize: s.phSize, onSize: function (e) { set({ phSize: +e.target.value }); }, phGrid: '--ph:' + s.phSize + 'px',
          hasPick: has, noPick: !has,
          dupRows: dupRows, hasDupes: dupRows.length > 0, dupN: dupRows.length,
          upBusy: s.up >= 0, upIdle: s.up < 0, upPct: Math.max(0, s.up), upBar: 'transform:scaleX(' + (Math.max(0, s.up) / 100).toFixed(2) + ')', upLeft: left, upDone: left <= 0,
          upLabel: left > 0 ? 'Add ' + Math.min(3, left) + ' photos' : 'All sample photos added', addPhotos: runUpload,
          upDrop: function (e) { e.preventDefault(); runUpload(); }, upOver: function (e) { e.preventDefault(); },
          phUsedN: st.used, phUnusedN: st.unused, phLowN: st.low
        }, det);
      }
    };
  };

  /* =========================================================================================================
     LAYOUTS: pick a layout for this spread or for many, fill empty frames, turn leftover photos into spreads.
     ========================================================================================================= */
  builders.layouts = function (x) {
    var S = x.S, set = x.set, ed = x.ed;
    return {
      initial: function () { return { lsel: [], per: 3 }; },
      vals: function () {
        var s = S(), b = ed.book(), cur = b.spreads[s.sp], sel = s.lsel.filter(function (i) { return i < b.spreads.length; }), st = E.stats(b);
        var used = E.usedMap(b), pool = E.library(b).filter(function (p) { return !used[p.id] && !p.low; }).length;
        var curN = cur.slots.length;
        var cards = ed.layoutChoices(s.sp).map(function (l) {
          return {
            id: l.id, name: l.name, best: l.best, mini: l.mini, cells: l.cells, frames: l.frames, on: pressed(l.on), isCur: l.on,
            lose: l.lose > 0, loseLabel: plural(l.lose, 'photo') + ' will go back to your library',
            pick: function () { ed.applyLayout(l.id, [s.sp]); set({ slot: null }); },
            applySel: function () { if (!sel.length) { ed.toast('Select some spreads below first.'); return; } ed.applyLayout(l.id, sel); },
            label: l.name + ': ' + l.best
          };
        });
        function tog(i) { var c = S().lsel.slice(), k = c.indexOf(i); if (k < 0) c.push(i); else c.splice(k, 1); set({ lsel: c }); }
        var strip = b.spreads.map(function (sp, i) {
          var on = sel.indexOf(i) >= 0;
          return { n: i + 1, lay: sp.lay, layName: E.lay(sp).name, cells: cells(sp), cur: pressed(i === s.sp), cls: 'ew-pick' + (on ? ' sel' : ''), on: pressed(on),
            go: function () { ed.go(i); }, toggle: function () { tog(i); }, label: 'Spread ' + (i + 1) + ', ' + E.lay(sp).name, tLabel: (on ? 'Deselect' : 'Select') + ' spread ' + (i + 1) };
        });
        var perOpts = [2, 3, 4].map(function (n) { return { n: n, label: n + ' per spread', on: pressed(s.per === n), pick: function () { set({ per: n }); } }; });
        var newN = Math.ceil(pool / s.per);
        return {
          lyCards: cards, lyStrip: strip, lyCur: s.sp + 1, lyCurName: E.lay(cur).name, lyCurLay: cur.lay, lyCurCells: cells(cur), lyFrames: plural(curN, 'frame'), lyTarget: ed.target() === 'both' ? 'Choose a layout below to change both pages of this spread.' : 'Choose a layout below for the ' + ed.target() + ' page only.',
          lyPrev: function () { ed.go(s.sp - 1); }, lyNext: function () { ed.go(s.sp + 1); }, lyNoPrev: s.sp === 0, lyNoNext: s.sp === b.spreads.length - 1,
          lySelN: sel.length, lyHasSel: sel.length > 0, lySelLabel: sel.length ? plural(sel.length, 'spread') + ' selected' : 'No spreads selected',
          lySelAll: function () { set({ lsel: b.spreads.map(function (z, i) { return i; }) }); }, lySelNone: function () { set({ lsel: [] }); },
          lyEmpty: st.empty, lyHasEmpty: st.empty > 0, lyNoEmpty: st.empty === 0, lyAvail: pool,
          lyFillLabel: st.empty ? 'Fill ' + plural(st.empty, 'empty frame') + ' with unused photos' : 'No empty frames',
          autoFill: function () { var before = E.stats(b).empty, nb = E.ops.autoFill(b), after = E.stats(nb).empty; ed.commit(nb, plural(before - after, 'frame') + ' filled' + (after ? ', ' + after + ' still empty (no photos left)' : ''), '', 'Auto-filled ' + plural(before - after, 'frame')); },
          perOpts: perOpts, lyNew: newN, lyHasPool: pool > 0, lyNoPool: pool === 0,
          lyNewLabel: pool ? plural(pool, 'unused photo') + ' become ' + plural(newN, 'new spread') + ', ' + s.per + ' to each (low-resolution photos are left out).' : 'Every sharp photo is already in the book.',
          lyOverflow: b.spreads.length * 2 + newN * 2 > b.pagesTotal && pool > 0,
          lyOverLabel: 'That would make ' + (b.spreads.length * 2 + newN * 2) + ' pages. Your order has ' + b.pagesTotal + '.',
          autoLayout: function () { var nb = E.ops.autoLayout(b, s.per), added = nb.spreads.length - b.spreads.length; ed.commit(nb, plural(added, 'spread') + ' added from unused photos', '', 'Added ' + plural(added, 'spread') + ' from unused photos'); }
        };
      }
    };
  };

  /* =========================================================================================================
     TEXT: every caption and story in one list, a proof-reader, find and replace, caption type.
     ========================================================================================================= */
  builders.text = function (x) {
    var S = x.S, set = x.set, ed = x.ed;
    return {
      initial: function () { return { tf: 'all', find: '', rep: '', mc: false }; },
      vals: function () {
        var s = S(), b = ed.book(), items = E.textItems(b).map(function (t) { t.issues = E.proof(t.text); return t; });
        var re = s.find ? new RegExp(s.find.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), s.mc ? 'g' : 'gi') : null;
        var matches = re ? items.reduce(function (n, t) { return n + (t.text.match(re) || []).length; }, 0) : 0;
        var counts = { all: items.length, empty: items.filter(function (t) { return !t.text.trim(); }).length, long: items.filter(function (t) { return t.text.length > t.limit; }).length, issues: items.filter(function (t) { return t.issues.length; }).length };
        var shown = items.filter(function (t) { return s.tf === 'all' || (s.tf === 'empty' && !t.text.trim()) || (s.tf === 'long' && t.text.length > t.limit) || (s.tf === 'issues' && t.issues.length); });
        var rows = shown.map(function (t) {
          var n = t.text.length, over = n > t.limit;
          return {
            key: t.key, label: t.label, n: t.sp + 1, text: t.text, count: n + ' / ' + t.limit, cls: 'ew-tx' + (over ? ' is-over' : ''), countCls: 'ew-count' + (over ? ' is-bad' : n > t.limit * .85 ? ' is-warn' : ''),
            rows: t.story ? 4 : 2, story: t.story, inLabel: t.label + ' text',
            onInput: function (e) { ed.commit(E.ops.setCaption(b, t.sp, t.side, e.target.value), '', 'tx:' + t.key); },
            open: function () { ed.jump(t.sp, null, x.opts.canvas); },
            issues: t.issues.map(function (is) { return { msg: is.msg, fixLabel: 'Fix', fix: function () { ed.commit(E.ops.setCaption(b, t.sp, t.side, is.fix(t.text)), 'Fixed: ' + is.msg.toLowerCase(), '', 'Fixed "' + is.msg.toLowerCase() + '" on spread ' + (t.sp + 1)); } }; }),
            hasIssues: t.issues.length > 0, trim: over ? function () { ed.commit(E.ops.trimCaption(b, t.sp, t.side, t.limit - 1), 'Shortened to fit'); } : function () {}, canTrim: over
          };
        });
        var st = b.style, FS = { sans: 'Manrope, sans-serif', serif: 'Fraunces, Georgia, serif', script: 'Fraunces, Georgia, serif' };
        function sty(patch, msg) { ed.commit(E.ops.setStyle(b, patch), '', 'style:' + Object.keys(patch).join()); }
        var sample = (items.filter(function (t) { return t.text.trim() && !t.story; })[0] || { text: 'Dinner by the water' }).text;
        return {
          txRows: rows, txNone: rows.length === 0, txTotal: counts.all, noFixAll: counts.issues === 0,
          tAll: pressed(s.tf === 'all'), tEm: pressed(s.tf === 'empty'), tLo: pressed(s.tf === 'long'), tIs: pressed(s.tf === 'issues'),
          fAll: function () { set({ tf: 'all' }); }, fEm: function () { set({ tf: 'empty' }); }, fLo: function () { set({ tf: 'long' }); }, fIs: function () { set({ tf: 'issues' }); },
          nAll: counts.all, nEm: counts.empty, nLo: counts.long, nIs: counts.issues,
          fixAll: function () {
            var nb = b, n = 0; E.textItems(nb).forEach(function (t) { var fixed = t.text; E.proof(t.text).forEach(function (is) { fixed = is.fix(fixed); }); if (fixed !== t.text) { nb = E.ops.setCaption(nb, t.sp, t.side, fixed); n++; } });
            if (!n) { ed.toast('Nothing to fix.'); return; } ed.commit(nb, plural(n, 'text') + ' tidied', '', 'Tidied ' + plural(n, 'text'));
          }, canFixAll: counts.issues > 0,
          find: s.find, rep: s.rep, onFind: function (e) { set({ find: e.target.value }); }, onRep: function (e) { set({ rep: e.target.value }); },
          mcOn: pressed(s.mc), toggleMc: function () { set({ mc: !s.mc }); },
          matchLabel: s.find ? plural(matches, 'match', 'matches') : 'Type a word or phrase to find', canReplace: matches > 0, noReplace: matches === 0,
          replaceAll: function () { ed.commit(E.ops.replaceText(b, s.find, s.rep, s.mc), plural(matches, 'replacement') + ' made', '', 'Replaced "' + s.find + '" with "' + s.rep + '" (' + matches + ')'); },
          fSans: pressed(st.font === 'sans'), fSerif: pressed(st.font === 'serif'), fScript: pressed(st.font === 'script'),
          setSans: function () { sty({ font: 'sans' }); }, setSerif: function () { sty({ font: 'serif' }); }, setScript: function () { sty({ font: 'script' }); },
          zS: pressed(st.size === .9), zM: pressed(st.size === 1), zL: pressed(st.size === 1.2), setZS: function () { sty({ size: .9 }); }, setZM: function () { sty({ size: 1 }); }, setZL: function () { sty({ size: 1.2 }); },
          aL: pressed(st.align === 'left'), aC: pressed(st.align === 'center'), aR: pressed(st.align === 'right'), setAL: function () { sty({ align: 'left' }); }, setAC: function () { sty({ align: 'center' }); }, setAR: function () { sty({ align: 'right' }); },
          txSample: sample, txSampleStory: 'We said we would do nothing for a week. We did not manage it on day two.',
          exportCsv: function () { download('captions-' + b.order + '.csv', 'text/csv', E.csv(b)); ed.toast('Captions downloaded as CSV'); }
        };
      }
    };
  };

  /* =========================================================================================================
     COVER: front, spine and back, live.
     ========================================================================================================= */
  builders.cover = function (x) {
    var S = x.S, set = x.set, ed = x.ed;
    function hex(list, name) { for (var i = 0; i < list.length; i++) if (list[i][0] === name) return list[i][1]; return ''; }
    return {
      initial: function () { return { face: 'front' }; },
      vals: function () {
        var s = S(), b = ed.book(), cv = b.coverDesign, ph = E.photoById(cv.photo), lib = E.library(b);
        function put(patch) { ed.commit(E.ops.setCover(b, patch), '', 'cover:' + Object.keys(patch).join()); }
        var foil = hex(E.foils, cv.foil), tl = cv.title.length;
        var photos = lib.filter(function (p) { return !p.low; }).slice(0, 12).map(function (p) { return { id: p.id, src: p.src, name: p.name, on: pressed(cv.photo === p.id), pick: function () { put({ photo: p.id }); }, label: 'Use ' + p.name + ' on the cover' }; });
        var kinds = [['window', 'Photo window'], ['full', 'Full photo'], ['type', 'Type only']].map(function (k) { return { id: k[0], name: k[1], on: pressed(cv.kind === k[0]), pick: function () { put({ kind: k[0] }); } }; });
        var faces = [['front', 'Front'], ['spine', 'Spine'], ['back', 'Back'], ['flat', 'Open flat']].map(function (f) { return { id: f[0], name: f[1], on: pressed(s.face === f[0]), pick: function () { set({ face: f[0] }); } }; });
        return {
          cvStyle: '--cv:' + hex(E.coverColours, cv.color) + ';--foil:' + (foil || 'rgb(255 255 255 / .78)'), cvFace: s.face, cvKind: cv.kind, cvSrc: ph ? ph.src : '', cvHasPhoto: !!ph && cv.kind !== 'type', cvFull: cv.kind === 'full', cvWin: cv.kind === 'window',
          cvFoilOn: !!foil, cvFoilCls: 'ew-cv' + (foil ? ' foil' : ''), cvTitle: cv.title, cvSub: cv.subtitle, cvBack: cv.back, cvSpine: cv.spine, cvLogo: cv.logo, cvShowSpineText: cv.spine,
          cvTitleSize: tl > 22 ? 'sm' : (tl > 14 ? 'md' : 'lg'), cvTitleLabel: tl + ' / 28 characters', cvTitleCls: 'ew-count' + (tl > 28 ? ' is-bad' : tl > 22 ? ' is-warn' : ''),
          onTitle: function (e) { put({ title: e.target.value }); }, onSub: function (e) { put({ subtitle: e.target.value }); }, onBack: function (e) { put({ back: e.target.value }); },
          spineOn: pressed(cv.spine), logoOn: pressed(cv.logo), toggleSpine: function () { put({ spine: !cv.spine }); }, toggleLogo: function () { put({ logo: !cv.logo }); },
          cvColours: E.coverColours.map(function (c) { return { name: c[0], sw: '--sw:' + c[1], on: pressed(cv.color === c[0]), pick: function () { put({ color: c[0] }); }, label: c[0] }; }),
          cvFoils: E.foils.map(function (f) { return { name: f[0], sw: '--sw:' + (f[1] || 'transparent'), cls: f[1] ? '' : 'none', on: pressed(cv.foil === f[0]), pick: function () { put({ foil: f[0] }); }, label: f[0] + ' foil' }; }),
          cvPhotos: photos, cvKinds: kinds, cvFaces: faces, cvColourName: cv.color, cvFoilName: cv.foil,
          cvReset: function () { ed.commit(E.ops.setCover(b, E.clone(E.defaults.cover)), 'Cover reset', '', 'Reset the cover'); },
          cvFlat: s.face === 'flat', cvSingle: s.face !== 'flat'
        };
      }
    };
  };

  /* =========================================================================================================
     STYLE: the look of the pages.
     ========================================================================================================= */
  builders.style = function (x) {
    var S = x.S, set = x.set, ed = x.ed;
    var BGS = ['#ffffff', '#f6f0e3', '#e9dcc3', '#dfe6da', '#e7ecf2', '#f1dfd9', '#1f2530', '#14110f'];
    var INKS = ['#1d1d1f', '#2a2623', '#3a2e22', '#26332a', '#f1ece2', '#ffffff'];
    return {
      initial: function () { return {}; },
      vals: function () {
        var s = S(), b = ed.book(), st = b.style, cur = b.spreads[s.sp];
        function put(patch, key) { ed.commit(E.ops.setStyle(b, patch), '', 'style:' + (key || Object.keys(patch).join())); }
        var gapName = st.gap < .4 ? 'None' : st.gap < .8 ? 'Tight' : st.gap < 1.3 ? 'Normal' : 'Roomy';
        var v = view(b, cur);
        return Object.assign({
          stThemes: E.themes.map(function (t) { return { id: t.id, name: t.name, sw: 'background:' + t.bg + ';color:' + t.ink + ';border-color:' + t.ink, on: pressed(st.theme === t.id), pick: function () { ed.commit(E.ops.applyTheme(b, t.id), '', '', 'Applied the ' + t.name + ' theme'); }, label: t.name + ' theme' }; }),
          stBgs: BGS.map(function (c) { return { c: c, sw: '--sw:' + c, on: pressed(st.bg === c), pick: function () { put({ bg: c, theme: 'custom' }, 'bg'); }, label: 'Page colour ' + c }; }),
          stInks: INKS.map(function (c) { return { c: c, sw: '--sw:' + c, on: pressed(st.ink === c), pick: function () { put({ ink: c, theme: 'custom' }, 'ink'); }, label: 'Text colour ' + c }; }),
          margin: st.margin, marginL: st.margin.toFixed(1) + '%', onMargin: function (e) { put({ margin: +e.target.value }, 'margin'); },
          gap: st.gap, gapL: gapName, onGap: function (e) { put({ gap: +e.target.value }, 'gap'); },
          radius: st.radius, radiusL: st.radius + ' px', onRadius: function (e) { put({ radius: +e.target.value }, 'radius'); },
          border: st.border, borderL: st.border ? st.border + ' px' : 'None', onBorder: function (e) { put({ border: +e.target.value }, 'border'); },
          stReset: function () { ed.commit(E.ops.setStyle(b, E.clone(E.defaults.style)), 'Style reset', '', 'Reset the page style'); },
          stN: s.sp + 1, stTotal: b.spreads.length, stPrev: function () { ed.go(s.sp - 1); }, stNext: function () { ed.go(s.sp + 1); }, stNoPrev: s.sp === 0, stNoNext: s.sp === b.spreads.length - 1,
          stThemeName: (E.themes.filter(function (t) { return t.id === st.theme; })[0] || { name: 'Custom' }).name
        }, { pvLay: v.lay, pvSlots: v.slots, pvStory: v.isStory, pvStoryText: v.storyText, pvStoryR: v.isStoryR, pvStoryTextR: v.storyTextR, pvCapL: v.capL, pvCapR: v.capR, pvShowCapL: v.showCapL, pvShowCapR: v.showCapR, pvPgL: s.sp * 2 + 1, pvPgR: s.sp * 2 + 2 });
      }
    };
  };

  /* =========================================================================================================
     FLIPBOOK: cover, every spread, back cover. Arrow keys, autoplay, zoom, full screen.
     ========================================================================================================= */
  builders.flipbook = function (x) {
    var S = x.S, set = x.set, ed = x.ed, timer = 0, el = null;
    function count() { return ed.book().spreads.length + 2; }
    function show(i) { var n = count(), k = (i + n) % n; set({ fi: k, turn: S().turn + 1 }); }
    function restart() { clearInterval(timer); timer = 0; if (S().auto) timer = setInterval(function () { show(S().fi + 1); }, S().speed); }
    return {
      initial: function () { return { fi: 0, auto: false, speed: 3500, zoomed: false, turn: 0, fs: false }; },
      mount: function () {
        var bk = ed.book(), start = Math.min(bk.spreads.length, (S().sp || 0) + 1); set({ fi: start });
        x.keys = function (e) {
          var t = e.target, typing = t && /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName); if (typing) return;
          var rtl = document.documentElement.dir === 'rtl';
          if (e.key === 'ArrowRight') show(S().fi + (rtl ? -1 : 1)); else if (e.key === 'ArrowLeft') show(S().fi + (rtl ? 1 : -1));
          else if (e.key === ' ') { e.preventDefault(); set({ auto: !S().auto }); setTimeout(restart, 0); }
        };
        x.fsc = function () { set({ fs: !!document.fullscreenElement }); };
        document.addEventListener('keydown', x.keys); document.addEventListener('fullscreenchange', x.fsc);
      },
      unmount: function () { clearInterval(timer); document.removeEventListener('keydown', x.keys); document.removeEventListener('fullscreenchange', x.fsc); },
      vals: function () {
        var s = S(), b = ed.book(), n = b.spreads.length, i = Math.min(s.fi, n + 1), isCover = i === 0, isBack = i === n + 1, sp = !isCover && !isBack ? b.spreads[i - 1] : null;
        var v = sp ? view(b, sp) : { lay: 'full', slots: [], isStory: false, isStoryR: false };
        var cv = b.coverDesign, hex = function (l, nm) { for (var k = 0; k < l.length; k++) if (l[k][0] === nm) return l[k][1]; return ''; };
        var foil = hex(E.foils, cv.foil), ph = E.photoById(cv.photo);
        var dots = [];
        for (var k = 0; k < n + 2; k++) (function (k) { dots.push({ k: k, label: k === 0 ? 'Front cover' : k === n + 1 ? 'Back cover' : 'Spread ' + k, cls: 'ew-dot' + (k === i ? ' on' : ''), cur: pressed(k === i), go: function () { show(k); } }); })(k);
        return {
          fbCover: isCover, fbBack: isBack, fbSpread: !!sp, fbLay: v.lay, fbSlots: v.slots, fbStory: v.isStory, fbStoryText: v.storyText, fbStoryR: v.isStoryR, fbStoryTextR: v.storyTextR, fbShowCapR: v.showCapR, fbCapL: v.capL, fbCapR: v.capR, fbShowCapL: v.showCapL,
          fbPgL: i * 2 - 1, fbPgR: i * 2,
          fbLabel: isCover ? 'Front cover' : isBack ? 'Back cover' : 'Spread ' + i + ' of ' + n + ' · pages ' + ((i - 1) * 2 + 1) + '–' + (i * 2),
          fbPrev: function () { show(i - 1); }, fbNext: function () { show(i + 1); }, fbDots: dots, fbPos: (i + 1) + ' / ' + (n + 2),
          fbStageCls: 'ew-fb' + (s.zoomed ? ' zoom' : '') + ' t' + (s.turn % 2), fbZoomOn: pressed(s.zoomed), fbToggleZoom: function () { set({ zoomed: !s.zoomed }); },
          fbAuto: pressed(s.auto), fbAutoLabel: s.auto ? 'Pause' : 'Play', fbPlaying: s.auto, fbPaused: !s.auto,
          fbToggleAuto: function () { set({ auto: !s.auto }); setTimeout(restart, 0); },
          fbS3: pressed(s.speed === 3500), fbS6: pressed(s.speed === 6000), fbSpeed3: function () { set({ speed: 3500 }); setTimeout(restart, 0); }, fbSpeed6: function () { set({ speed: 6000 }); setTimeout(restart, 0); },
          fbRef: function (n2) { el = n2; },
          fbFull: function () { try { if (document.fullscreenElement) document.exitFullscreen(); else if (el && el.requestFullscreen) el.requestFullscreen(); else ed.toast('Full screen is not available in this browser.'); } catch (z) {} },
          fbFsOn: pressed(s.fs), fbCanFs: !!(document.documentElement && document.documentElement.requestFullscreen),
          cvStyle: '--cv:' + hex(E.coverColours, cv.color) + ';--foil:' + (foil || 'rgb(255 255 255 / .78)'), cvFoilCls: 'ew-cv' + (foil ? ' foil' : ''), cvFace: isBack ? 'back' : 'front',
          cvKind: cv.kind, cvSrc: ph ? ph.src : '', cvHasPhoto: !!ph && cv.kind !== 'type', cvFull: cv.kind === 'full', cvWin: cv.kind === 'window', cvTitle: cv.title, cvSub: cv.subtitle, cvBack: cv.back, cvLogo: cv.logo,
          cvSpine: cv.spine, cvTitleSize: cv.title.length > 22 ? 'sm' : (cv.title.length > 14 ? 'md' : 'lg'), cvSingle: true, cvFlat: false
        };
      }
    };
  };

  /* =========================================================================================================
     PRINT CHECK: what would go wrong at the printer, with one-tap fixes.
     ========================================================================================================= */
  builders.printcheck = function (x) {
    var S = x.S, set = x.set, ed = x.ed, timer = 0;
    var CIRC = 2 * Math.PI * 52;
    function nextUnused(b) { var used = E.usedMap(b); return E.library(b).filter(function (p) { return !used[p.id] && !p.low; })[0]; }
    function apply(b, is) {
      if (is.fix === 'remove') return E.ops.clearSlot(b, is.sp, is.slot);
      if (is.fix === 'resetZoom') return E.ops.adjust(b, is.sp, is.slot, { z: 1, x: 50, y: 50 });
      if (is.fix === 'fill') { var p = nextUnused(b); return p ? E.ops.place(b, is.sp, is.slot, p.id) : b; }
      if (is.fix.indexOf('trim:') === 0) { var side = +is.fix.slice(5), lim = (side === 0 ? E.lay(b.spreads[is.sp]).textL : E.lay(b.spreads[is.sp]).textR) ? 240 : 90; return E.ops.trimCaption(b, is.sp, side, lim - 1); }
      if (is.fix === 'addSpread') return E.ops.addSpread(b, b.spreads.length - 1);
      return b;
    }
    var AUTO = { remove: 1, resetZoom: 1, fill: 1 };
    return {
      initial: function () { return { pcf: 'all', busy: false, ranAt: Date.now() }; },
      unmount: function () { clearTimeout(timer); },
      vals: function () {
        var s = S(), b = ed.book(), pf = E.preflight(b), st = E.stats(b);
        var list = pf.issues.filter(function (i) { return s.pcf === 'all' || i.sev === s.pcf; });
        var cats = ['Photos', 'Text', 'Book', 'Cover', 'Review'].map(function (c) {
          var items = list.filter(function (i) { return i.cat === c; }), all = pf.issues.filter(function (i) { return i.cat === c; });
          return {
            name: c, ok: all.length === 0, count: all.length, countLabel: all.length ? plural(all.length, 'issue') : 'All clear', cls: 'ew-cat' + (all.length ? '' : ' ok'), show: items.length > 0,
            items: items.map(function (is) {
              var canAuto = !!AUTO[is.fix] || is.fix.indexOf('trim:') === 0 || is.fix === 'addSpread';
              return { id: is.id, text: is.text, sev: is.sev, sevLabel: is.sev === 'bad' ? 'Fix before printing' : 'Worth a look', cls: 'ew-iss ' + is.sev, hasFix: !!is.fix, fixLabel: is.fixLabel || 'Open', hasSp: is.sp != null,
                fix: function () {
                  if (is.fix === 'jump' || !canAuto) { ed.jump(is.sp == null ? 0 : is.sp, is.slot, x.opts.canvas); return; }
                  var nb = apply(b, is); if (nb === b) { ed.toast('No unused photo left to use.'); return; }
                  ed.commit(nb, 'Fixed: ' + is.fixLabel.toLowerCase(), '', 'Print check fix: ' + is.fixLabel.toLowerCase());
                },
                open: function () { ed.jump(is.sp == null ? 0 : is.sp, is.slot, x.opts.canvas); } };
            })
          };
        });
        var fixable = pf.issues.filter(function (i) { return AUTO[i.fix] || i.fix.indexOf('trim:') === 0; });
        var rows = b.spreads.map(function (sp, i) {
          return { n: i + 1, lay: E.lay(sp).name, chips: sp.slots.map(function (t, k) {
            var d = E.dpi(sp, k), cls = !t.p ? 'empty' : d < 150 ? 'bad' : d < 200 ? 'warn' : 'ok';
            return { k: k + 1, label: !t.p ? '–' : String(d), cls: 'ew-dpi ' + cls, title: 'Spread ' + (i + 1) + ' frame ' + (k + 1) + (t.p ? ': ' + d + ' dpi' : ': empty'), open: function () { ed.jump(i, k, x.opts.canvas); } };
          }) };
        });
        var verdict = pf.bad ? 'Needs fixing' : pf.warn ? 'Almost ready' : 'Ready to print';
        return {
          pcRing: pf.bad ? 'is-bad' : pf.warn ? 'is-warn' : 'is-ok', noFix: fixable.length === 0, pcScore: pf.score, pcDash: (CIRC * pf.score / 100).toFixed(1) + ' ' + CIRC.toFixed(1), pcVerdict: verdict, pcVerdictCls: 'ew-verdict ' + (pf.bad ? 'is-bad' : pf.warn ? 'is-warn' : 'is-ok'),
          pcBad: pf.bad, pcWarn: pf.warn, pcOk: pf.ready, pcNotOk: !pf.ready, pcClean: pf.issues.length === 0,
          pcSub: pf.issues.length ? plural(pf.bad, 'must be fixed', 'must be fixed') + ', ' + plural(pf.warn, 'to look at', 'to look at') : 'Nothing found. Every check passed.',
          pcCats: cats, pcNone: list.length === 0, pcAllFilter: pressed(s.pcf === 'all'), pcBadFilter: pressed(s.pcf === 'bad'), pcWarnFilter: pressed(s.pcf === 'warn'),
          fAll: function () { set({ pcf: 'all' }); }, fBad: function () { set({ pcf: 'bad' }); }, fWarn: function () { set({ pcf: 'warn' }); },
          pcFixN: fixable.length, pcCanFix: fixable.length > 0, pcFixLabel: 'Fix ' + plural(fixable.length, 'issue') + ' automatically',
          fixAll: function () {
            var nb = b, done = 0, guard = 0;
            while (guard++ < 60) { var cur = E.preflight(nb).issues.filter(function (i) { return AUTO[i.fix] || i.fix.indexOf('trim:') === 0; })[0]; if (!cur) break; var n2 = apply(nb, cur); if (n2 === nb) break; nb = n2; done++; }
            if (!done) { ed.toast('Nothing could be fixed automatically.'); return; } ed.commit(nb, plural(done, 'issue') + ' fixed', '', 'Print check fixed ' + plural(done, 'issue'));
          },
          pcBusy: s.busy, pcRunLabel: s.busy ? 'Checking…' : 'Run check again', pcAt: 'Checked ' + E.ago(s.ranAt),
          pcRun: function () { if (s.busy) return; set({ busy: true }); timer = setTimeout(function () { set({ busy: false, ranAt: Date.now() }); }, 800); },
          pcRows: rows, pcFrames: st.frames, pcPages: st.pages, pcOrdered: st.total,
          pcMark: pressed(!!b.ready), pcMarked: !!b.ready, pcCanMark: pf.ready, pcNoMark: !pf.ready,
          pcMarkLabel: b.ready ? 'Marked ready for print' : 'Mark ready for print',
          toggleReady: function () { if (!pf.ready) { ed.toast('Fix the red items first.'); return; } ed.commit(E.ops.setMeta(b, { ready: !b.ready }), b.ready ? 'Marked as not ready' : 'Marked ready for print', '', b.ready ? 'Cleared the print-ready mark' : 'Marked the book ready for print'); },
          exportJson: function () { download('book-' + b.order + '.json', 'application/json', JSON.stringify({ order: b.order, title: b.title, round: b.round, status: b.status, style: b.style, cover: b.coverDesign, spreads: b.spreads }, null, 2)); ed.toast('Book data downloaded as JSON'); },
          exportCsv: function () { download('captions-' + b.order + '.csv', 'text/csv', E.csv(b)); ed.toast('Captions downloaded as CSV'); }
        };
      }
    };
  };

  /* =========================================================================================================
     HISTORY: saved versions (compare, restore), comments with replies, and the activity log.
     ========================================================================================================= */
  builders.history = function (x) {
    var S = x.S, set = x.set, ed = x.ed;
    return {
      initial: function () { return { hv: '', cmf: 'open', vname: '', confirm: '', rd: {} }; },
      vals: function () {
        var s = S(), b = ed.book(), studio = x.opts.studio;
        var vers = b.versions.slice().reverse(), sel = vers.filter(function (v) { return v.id === s.hv; })[0] || vers[0];
        var rows = sel ? E.diff(sel.snap, b.spreads) : [];
        var KIND = { added: 'New', removed: 'Removed', moved: 'Moved', changed: 'Changed' };
        var vv = vers.map(function (v) {
          var conf = s.confirm === v.id;
          return { id: v.id, label: v.label, by: v.by, when: E.ago(v.at), n: v.snap.length, nLabel: plural(v.snap.length, 'spread'), thumbs: v.snap.slice(0, 5).map(function (sp) { return cells(sp).filter(function (c) { return c.has; })[0] || { src: '', has: false }; }),
            cls: 'ew-ver' + (sel && sel.id === v.id ? ' sel' : ''), on: pressed(sel && sel.id === v.id), compare: function () { set({ hv: v.id }); },
            restoreLabel: conf ? 'Tap again to restore' : 'Restore', conf: conf, restore: function () {
              if (!conf) { set({ confirm: v.id }); return; }
              var nb = E.ops.saveVersion(b, 'Before restoring ' + v.label, ed.who); nb = E.ops.restoreVersion(nb, v.id);
              ed.commit(nb, v.label + ' restored. Your earlier work is saved as a version.', '', 'Restored ' + v.label); set({ confirm: '' });
            }, cancel: function () { set({ confirm: '' }); }, del: function () { ed.commit(E.ops.deleteVersion(b, v.id), 'Version deleted', '', 'Deleted ' + v.label); }, canDel: studio && vers.length > 1 };
        });
        var cms = b.comments.slice().reverse().filter(function (c) { return s.cmf === 'all' || !c.done; }).map(function (c) {
          var draft = s.rd[c.id] || '';
          return { id: c.id, who: c.who, t: c.t, where: 'Spread ' + (c.sp + 1), when: E.ago(c.at), done: c.done, cls: 'ed-cm' + (c.done ? ' done' : ''), label: c.done ? 'Reopen' : 'Mark fixed',
            replies: c.re.map(function (r) { return { who: r.who, t: r.t, when: E.ago(r.at), mine: r.who === ed.who }; }), hasReplies: c.re.length > 0,
            toggle: function () { ed.commit(E.ops.resolve(b, c.id, !c.done), '', '', (c.done ? 'Reopened' : 'Marked fixed') + ' the comment on spread ' + (c.sp + 1)); },
            jump: function () { ed.jump(c.sp, null, x.opts.canvas); }, draft: draft, onDraft: function (e) { var r = Object.assign({}, S().rd); r[c.id] = e.target.value; set({ rd: r }); },
            send: function () { var t = draft.trim(); if (!t) return; var r = Object.assign({}, S().rd); r[c.id] = ''; set({ rd: r }); ed.commit(E.ops.reply(b, c.id, ed.who, t), 'Reply sent', '', 'Replied on spread ' + (c.sp + 1)); }, replyLabel: 'Reply to the comment on spread ' + (c.sp + 1) };
        });
        var open = b.comments.filter(function (c) { return !c.done; }).length;
        return {
          hvList: vv, hvNone: vv.length === 0, hvSelLabel: sel ? sel.label : '', hvRows: rows.map(function (r) { return { kind: KIND[r.kind], cls: 'ew-df ' + r.kind, text: r.text, jump: function () { if (r.kind !== 'removed') ed.jump(r.n - 1, null, x.opts.canvas); }, canJump: r.kind !== 'removed' }; }),
          hvSame: sel && rows.length === 0, hvDiffN: rows.length, hvDiffLabel: sel ? (rows.length ? plural(rows.length, 'difference') + ' between ' + sel.label + ' and now' : 'No differences between ' + sel.label + ' and now') : '',
          vname: s.vname, onVname: function (e) { set({ vname: e.target.value }); },
          saveNamed: function () { var nm = (s.vname || '').trim() || 'Saved version ' + (b.versions.length + 1); ed.commit(E.ops.saveVersion(b, nm, ed.who), 'Version saved', '', 'Saved version “' + nm + '”'); set({ vname: '' }); },
          cmList: cms, cmNone: cms.length === 0, cmNoneLabel: s.cmf === 'open' ? 'No open comments. Everything has been fixed.' : 'No comments yet.',
          cmOpen: pressed(s.cmf === 'open'), cmAll: pressed(s.cmf === 'all'), setCmOpen: function () { set({ cmf: 'open' }); }, setCmAll: function () { set({ cmf: 'all' }); }, cmOpenN: open, cmAllN: b.comments.length,
          cmWhere: 'Spread ' + (S().sp + 1), cmPrev: function () { ed.go(S().sp - 1); }, cmNext: function () { ed.go(S().sp + 1); }, cmNoPrev: S().sp === 0, cmNoNext: S().sp === b.spreads.length - 1,
          cmDraft: s.cmDraft, onCmDraft: function (e) { set({ cmDraft: e.target.value }); },
          cmAdd: function () { var t = (S().cmDraft || '').trim(); if (!t) return; ed.commit(E.ops.addComment(b, S().sp, ed.who, t), 'Comment added', '', 'Commented on spread ' + (S().sp + 1)); set({ cmDraft: '' }); },
          acList: b.activity.map(function (a) { return { by: a.by, msg: a.msg, when: E.ago(a.t), dot: 'ew-dot2 ' + (a.by === 'Sara' ? 'cu' : 'st') }; }), acNone: b.activity.length === 0
        };
      }
    };
  };

  /* =========================================================================================================
     SEND (customer) / HANDOFF (studio): the last page before a proof goes out or a design is locked.
     ========================================================================================================= */
  builders.send = function (x) {
    var S = x.S, set = x.set, ed = x.ed, studio = x.opts.studio;
    var STEPS = [['draft', 'Draft'], ['proof-requested', 'Proof requested'], ['proof-sent', 'Proof sent'], ['locked', 'Design locked']];
    return {
      initial: function () { return { sure: false }; },
      vals: function () {
        var s = S(), b = ed.book(), pf = E.preflight(b), st = E.stats(b), last = b.versions[b.versions.length - 1];
        var rows = last ? E.diff(last.snap, b.spreads) : [], at = STEPS.map(function (z) { return z[0]; }).indexOf(b.status);
        var steps = STEPS.map(function (z, i) { return { name: z[1], n: i + 1, cls: 'ew-step' + (i < at ? ' done' : i === at ? ' now' : ''), cur: i === at ? 'step' : 'false' }; });
        var checks = [
          { ok: pf.bad === 0, t: pf.bad === 0 ? 'Print check: nothing to fix before printing' : plural(pf.bad, 'item') + ' to fix in the print check', href: x.opts.pages.printcheck },
          { ok: st.empty === 0, t: st.empty === 0 ? 'Every frame has a photo' : plural(st.empty, 'empty frame') + ' left', href: x.opts.pages.layouts },
          { ok: st.openComments === 0, t: st.openComments === 0 ? 'Every comment is marked fixed' : plural(st.openComments, 'comment') + ' still open', href: x.opts.pages.history },
          { ok: st.pages === st.total, t: st.pages === st.total ? 'All ' + st.total + ' pages designed' : st.pages + ' of ' + st.total + ' pages designed', href: x.opts.pages.storyboard }
        ].map(function (c) { return { cls: 'ed-ck ' + (c.ok ? 'is-ok' : 'is-bad'), ok: c.ok, bad: !c.ok, t: c.t, href: c.href, linkLabel: c.ok ? '' : 'Review' }; });
        var round = b.round + 1;
        return {
          sdSteps: steps, sdStatus: b.status, sdRound: round, sdNote: b.sendNote, onNote: function (e) { ed.commit(E.ops.setMeta(b, { sendNote: e.target.value }), '', 'sendnote'); },
          sdRows: rows.map(function (r) { return { kind: ({ added: 'New', removed: 'Removed', moved: 'Moved', changed: 'Changed' })[r.kind], cls: 'ew-df ' + r.kind, text: r.text }; }), sdHasRows: rows.length > 0, sdNoRows: rows.length === 0,
          sdSince: last ? 'Since ' + last.label + ' (' + E.ago(last.at) + ')' : 'Since you started', sdChecks: checks, sdAllOk: checks.every(function (c) { return c.ok; }),
          sdScore: pf.score, sdOpenN: st.openComments,
          sdCanRequest: b.status === 'draft' || b.status === 'proof-sent', sdNoRequest: !(b.status === 'draft' || b.status === 'proof-sent'),
          sdReqLabel: b.status === 'proof-requested' ? 'Proof requested' : b.status === 'locked' ? 'Design locked' : 'Send to proof',
          sdSure: s.sure, sdSureOn: pressed(s.sure), toggleSure: function () { set({ sure: !s.sure }); },
          sdBlock: !s.sure || !(b.status === 'draft' || b.status === 'proof-sent'),
          sdRequest: function () { if (!s.sure) { ed.toast('Tick the box to confirm first.'); return; } ed.commit(E.ops.setStatus(b, 'proof-requested'), 'Sent. Rameen will review your changes and send proof round ' + round + ' within 2 days.', '', 'Asked for proof round ' + round + (b.sendNote ? ' with a note' : '')); set({ sure: false }); },
          sdWait: b.status === 'proof-requested', sdLocked: b.status === 'locked',
          sdPrint: function () { try { window.print(); } catch (z) {} },
          // studio hand-off
          sdSend: function () { ed.commit(E.ops.setStatus(b, 'proof-sent'), 'Proof round ' + round + ' sent to ' + b.owner + ' on WhatsApp', '', 'Proof round ' + round + ' sent to ' + b.owner + ' on WhatsApp'); },
          sdLock: function () { if (!pf.ready) { ed.toast('Fix the red items in the print check before locking.'); return; } ed.commit(E.ops.setStatus(b, 'locked'), 'Design locked. Balance link sent.', '', 'Locked the design'); },
          sdCanSend: b.status !== 'locked', sdNoSend: b.status === 'locked', sdCanLock: b.status !== 'locked' && pf.ready, sdNoLock: !(b.status !== 'locked' && pf.ready),
          sdSendLabel: 'Send proof round ' + round, sdReady: !!b.ready, sdNotReady: !b.ready,
          sdPack: [
            { name: 'Interior PDF', t: st.pages + ' pages · ' + b.style.theme + ' theme', ok: pf.ready },
            { name: 'Cover PDF', t: b.coverDesign.color + ' · ' + b.coverDesign.foil.toLowerCase() + ' foil', ok: b.coverDesign.title.trim().length > 0 },
            { name: 'Customer approval', t: b.status === 'locked' ? 'Design locked' : b.status === 'proof-sent' ? 'Waiting for ' + b.owner : 'Proof not sent yet', ok: b.status === 'locked' },
            { name: 'Print-ready mark', t: b.ready ? 'Marked in the print check' : 'Not marked yet', ok: !!b.ready }
          ].map(function (r) { return { name: r.name, t: r.t, cls: 'ed-ck ' + (r.ok ? 'is-ok' : 'is-bad'), ok: r.ok, bad: !r.ok }; }),
          sdExportJson: function () { download('book-' + b.order + '.json', 'application/json', JSON.stringify({ order: b.order, title: b.title, round: b.round, status: b.status, style: b.style, cover: b.coverDesign, spreads: b.spreads }, null, 2)); ed.toast('Book data downloaded as JSON'); },
          sdExportCsv: function () { download('captions-' + b.order + '.csv', 'text/csv', E.csv(b)); ed.toast('Captions downloaded as CSV'); },
          sdNotes: b.notes, sdOnNotes: function (e) { ed.commit(E.ops.setMeta(b, { notes: e.target.value }), '', 'notes'); }, sdHasCustNote: !!b.sendNote, sdCustNote: b.sendNote
        };
      }
    };
  };


  /* =========================================================================================================
     EASY MODE (phones): the same book, one job per screen.
       Photos  ->  Pages (one screen per book page, with an overview on every screen)  ->  Cover  ->  Send
     ========================================================================================================= */
  var EZ_N = 'miles.editor.easy.n';
  /* what a single book page (1-based) holds: its frames (as fractions of that page), text, and whether it is finished */
  function pageInfo(b, n) {
    var si = Math.floor((n - 1) / 2), side = (n - 1) % 2, sp = b.spreads[si];
    if (!sp) return null;
    var L = E.lay(sp), x0 = side ? .5 : 0, x1 = x0 + .5, frames = [];
    sp.slots.forEach(function (t, i) {
      var g = E.slotGeo(sp, i); if (!g) return;
      var a = Math.max(g[0], x0), c = Math.min(g[0] + g[2], x1); if (c - a <= .001) return;
      frames.push({ i: i, x: (a - x0) * 2, y: g[1], w: (c - a) * 2, h: g[3], spans: g[2] > .51 });
    });
    var text = side ? L.textR : L.textL;
    var done = frames.every(function (f) { return sp.slots[f.i].p; }) && (!text || !!sp.caps[side].trim());
    return { n: n, si: si, side: side, sp: sp, L: L, frames: frames, text: text, done: done };
  }
  function readN(total) {
    var n = 0;
    try { var m = /[?&]n=(\d+)/.exec(location.search); n = m ? +m[1] : +(localStorage.getItem(EZ_N) || 0); } catch (e) {}
    return Math.max(1, Math.min(total, n || 1));
  }
  function easyCommon(x, step) {
    var S = x.S, set = x.set, ed = x.ed, H = x.opts.easy || {};
    function go(href) { location.href = href; }
    function openPage(n) { try { localStorage.setItem(EZ_N, String(n)); } catch (e) {} if (step === 2) { set({ ezn: n, fr: 0, sheet: false }); try { history.replaceState(null, '', '?n=' + n); } catch (e) {} window.scrollTo && window.scrollTo(0, 0); } else go(H.page + '?n=' + n); }
    return {
      mount: function () { try { sessionStorage.removeItem('miles.easy.off'); } catch (e) {} },
      vals: function (cur) {
        var b = ed.book(), total = b.spreads.length * 2, infos = []; for (var n = 1; n <= total; n++) infos.push(pageInfo(b, n));
        var doneN = infos.filter(function (i) { return i.done; }).length, st = E.stats(b), cv = b.coverDesign;
        var frames = infos.reduce(function (s, i) { return s + i.frames.length; }, 0);
        var done = { 1: E.library(b).length >= Math.min(frames, 8), 2: doneN === total, 3: !!cv.title.trim(), 4: b.status !== 'draft' };
        var STEP = [[1, 'Photos', H.photos], [2, 'Pages', H.page], [3, 'Cover', H.cover], [4, 'Send', H.send]];
        var firstTodo = infos.filter(function (i) { return !i.done; })[0];
        var curN = cur || 0;
        var nextHref = !done[1] ? H.photos : firstTodo ? H.page + '?n=' + firstTodo.n : !done[3] ? H.cover : H.send;
        return {
          ezSteps: STEP.map(function (s) { return { n: s[0], name: s[1], href: s[2], cls: 'ez-st' + (s[0] === step ? ' now' : '') + (done[s[0]] && s[0] !== step ? ' done' : ''), cur: s[0] === step ? 'step' : 'false', done: !!done[s[0]], label: 'Step ' + s[0] + ', ' + s[1] + (done[s[0]] ? ', done' : '') }; }),
          ezStepNo: step, ezPagesN: total, ezDoneN: doneN, ezTodoN: total - doneN, ezPct: (doneN / total).toFixed(3), ezAllDone: doneN === total,
          ezOvLabel: doneN + ' of ' + total + ' pages done' + (total < b.pagesTotal ? ' · your book has ' + b.pagesTotal + ' pages' : ''),
          ezPages: infos.map(function (i) {
            return { n: i.n, lay: i.sp.lay, cells: E.cellsFor(i.sp, E.photoById), sideCls: 'ew-half ' + (i.side ? 'r' : 'l'), cls: 'ez-pg' + (i.n === curN ? ' now' : '') + (i.done ? ' done' : ''), cur: i.n === curN ? 'page' : 'false',
              done: i.done, todo: !i.done, label: 'Page ' + i.n + (i.done ? ', done' : ', still to do'), go: function () { openPage(i.n); } };
          }),
          ezAdd: function () { ed.commit(E.ops.addSpread(ed.book(), ed.book().spreads.length - 1), 'Two pages added at the end', '', 'Added 2 pages'); },
          ezFull: H.full, ezHome: H.home, ezNextHref: nextHref, ezContinue: function () { go(nextHref); },
          ezGoHome: function () { go(H.home); }, ezTitle: b.title, ezBookPages: b.pagesTotal,
          ezNextLabel: !done[1] ? 'Add your photos' : firstTodo ? 'Design page ' + firstTodo.n : !done[3] ? 'Finish the cover' : done[4] ? 'See where it is' : 'Send to proof',
          ezStartLabel: doneN === 0 ? 'Start designing' : doneN === total ? 'Review and send' : 'Continue with page ' + (firstTodo ? firstTodo.n : 1),
          ezDoneSteps: STEP.map(function (s) { return { n: s[0], name: s[1], href: s[2], done: !!done[s[0]], cls: 'ez-card ez-step' + (done[s[0]] ? ' done' : ''), line: ({ 1: E.library(b).length + ' photos ready', 2: doneN + ' of ' + total + ' pages done', 3: (cv.title || 'No title yet') + ' · ' + cv.color, 4: b.status === 'draft' ? 'Not sent yet' : b.status === 'proof-requested' ? 'Waiting for the studio' : b.status === 'proof-sent' ? 'Proof sent to you' : 'Design locked' })[s[0]], go: function () { go(s[2]); } }; }),
          ezNextStepLabel: STEP[Math.min(step, 3)][1]
        };
      }
    };
  }
  builders.easyhome = function (x) {
    var c = easyCommon(x, 0);
    return { initial: function () { return {}; }, mount: c.mount, vals: function () { return c.vals(0); } };
  };
  builders.easyphotos = function (x) {
    var inner = builders.photos(x), c = easyCommon(x, 1), H = x.opts.easy, ed = x.ed;
    return {
      initial: function () { var s = inner.initial(); s.phf = 'all'; return s; },
      mount: c.mount, unmount: inner.unmount,
      vals: function () {
        var v = Object.assign(inner.vals(), c.vals(0)), b = ed.book();
        v.phTiles = v.phTiles.map(function (t) { var p = E.photoById(t.id); t.tog = function () { ed.commit(E.ops.setStar(ed.book(), p.id, !E.isStar(ed.book(), p))); }; t.starOn = pressed(t.star); return t; });
        v.ezBackLabel = 'Back'; v.ezBack = c.vals(0).ezGoHome; v.ezNext = function () { location.href = H.page; }; v.ezNextBtn = 'Next: design pages';
        v.ezPhHint = E.library(b).length + ' photos. Tap the star on the ones you love most.';
        return v;
      }
    };
  };
  builders.easycover = function (x) {
    var inner = builders.cover(x), c = easyCommon(x, 3), H = x.opts.easy;
    return {
      initial: inner.initial, mount: c.mount,
      vals: function () { var v = Object.assign(inner.vals(), c.vals(0)); v.ezBack = function () { location.href = H.page; }; v.ezNext = function () { location.href = H.send; }; v.ezBackLabel = 'Back'; v.ezNextBtn = 'Next: send'; return v; }
    };
  };
  builders.easysend = function (x) {
    var inner = builders.send(x), c = easyCommon(x, 4), H = x.opts.easy;
    return {
      initial: inner.initial, mount: c.mount,
      vals: function () { var v = Object.assign(inner.vals(), c.vals(0)); v.ezBack = function () { location.href = H.cover; }; v.ezBackLabel = 'Back'; return v; }
    };
  };
  /* Step 2: the main job. One book page per screen. */
  builders.easypage = function (x) {
    var S = x.S, set = x.set, ed = x.ed, H = x.opts.easy, c = easyCommon(x, 2);
    return {
      initial: function () { return { ezn: readN(E.load().spreads.length * 2), fr: 0, sheet: false, shf: 'unused' }; },
      mount: function () { c.mount(); var t = S().ezn; try { localStorage.setItem(EZ_N, String(t)); } catch (e) {} },
      vals: function () {
        var s = S(), b = ed.book(), total = b.spreads.length * 2, n = Math.max(1, Math.min(total, s.ezn)), info = pageInfo(b, n), sp = info.sp, side = info.side;
        var base = c.vals(n), fr = Math.max(0, Math.min(info.frames.length - 1, s.fr)), cur = info.frames[fr], slot = cur ? sp.slots[cur.i] : null, ph = slot && slot.p ? E.photoById(slot.p) : null;
        var used = E.usedMap(b);
        function move(to) { if (to < 1) { location.href = H.photos; return; } if (to > total) { location.href = H.cover; return; } try { localStorage.setItem(EZ_N, String(to)); history.replaceState(null, '', '?n=' + to); } catch (e) {} set({ ezn: to, fr: 0, sheet: false }); window.scrollTo && window.scrollTo(0, 0); }
        function adj(patch, key) { if (!cur) return; ed.commit(E.ops.adjust(ed.book(), info.si, cur.i, patch), '', 'ez:' + n + ':' + cur.i + ':' + key); }
        var pageName = 'Page ' + n;
        var boxes = info.frames.map(function (f, k) {
          var t = sp.slots[f.i], p = t.p ? E.photoById(t.p) : null, on = k === fr;
          return { k: k + 1, has: !!p, empty: !p, src: p ? p.src : '', alt: p ? p.name : '', img: p ? imgStyle(t) : '', low: !!(p && p.low),
            box: 'left:' + (f.x * 100).toFixed(2) + '%;top:' + (f.y * 100).toFixed(2) + '%;width:' + (f.w * 100).toFixed(2) + '%;height:' + (f.h * 100).toFixed(2) + '%',
            cls: 'ez-fr' + (on ? ' sel' : ''), label: 'Frame ' + (k + 1) + (p ? ': ' + p.name : ': empty') + (on ? ', selected' : ''), pick: function () { set({ fr: k }); if (!p) set({ sheet: true }); } };
        });
        var tiles = E.library(b).filter(function (p) { return s.shf === 'all' || !used[p.id] || (slot && slot.p === p.id); }).sort(function (a, c2) { return (a.low ? 1 : 0) - (c2.low ? 1 : 0); }).map(function (p) {
          return { id: p.id, src: p.src, name: p.name, low: p.low, onPage: used[p.id] ? 'Page ' + (used[p.id] * 2 - 1) + '–' + (used[p.id] * 2) : '', hasOn: !!used[p.id], cls: 'ez-tile' + (slot && slot.p === p.id ? ' sel' : ''), label: p.name + (used[p.id] ? ', already used on spread ' + used[p.id] : ''),
            pick: function () { if (!cur) return; ed.commit(E.ops.place(ed.book(), info.si, cur.i, p.id), 'Photo added to page ' + n, '', 'Placed ' + p.name + ' on page ' + n); set({ sheet: false }); } };
        });
        var lays = E.pageLayouts.map(function (l) {
          var cells = l.cells.map(function (cc, i) { return { k: i, cls: 'gc' + cc[0] + '_' + cc[1] + ' gr' + cc[2] + '_' + cc[3] }; }); if (l.text) cells.push({ k: 0, cls: 'txt gc1_3 gr1_7' });
          var mine = info.L.split ? (side ? info.L.right : info.L.left) : null;
          return { id: l.id, name: l.name, mini: 'pagei', cells: cells, on: pressed(!!mine && mine.id === l.id), label: l.name + ' layout for page ' + n,
            pick: function () { ed.commit(E.ops.setPageLayout(ed.book(), info.si, side, l.id), 'Page ' + n + ': ' + l.name, '', 'Page ' + n + ' set to ' + l.name); set({ fr: 0 }); } };
        });
        var spans = info.frames.some(function (f) { return f.spans; });
        var v = {
          ezN: n, ezTotal: total, ezHead: pageName, ezOf: 'Page ' + n + ' of ' + total, ezSpread: 'Spread ' + (info.si + 1) + ' · pages ' + (info.si * 2 + 1) + '–' + (info.si * 2 + 2) + (side ? ' · right page' : ' · left page'),
          ezBoxes: boxes, ezHasFrames: boxes.length > 0, ezNoFrames: boxes.length === 0, ezIsText: info.text, ezNotText: !info.text, ezBlank: !boxes.length && !info.text,
          ezSpans: spans, ezSpansLabel: 'A photo runs across pages ' + (info.si * 2 + 1) + '–' + (info.si * 2 + 2) + '. Pick a layout below to give this page its own design.',
          ezLays: lays, ezCap: sp.caps[side], ezCapLabel: info.text ? 'Write the story for this page' : 'Caption (optional)',
          onEzCap: function (e) { ed.commit(E.ops.setCaption(ed.book(), info.si, side, e.target.value), '', 'ezcap:' + n); },
          ezHasFr: !!cur, ezFrLabel: cur ? 'Frame ' + (fr + 1) + ' of ' + info.frames.length : '', ezHasPhoto: !!ph, ezNoPhoto: !ph && !!cur, ezFrName: ph ? ph.name : 'Empty frame',
          ezFrLow: !!(ph && ph.low), ezChoose: function () { set({ sheet: true }); }, ezChooseLabel: ph ? 'Change photo' : 'Choose a photo',
          ezRemove: function () { if (!cur) return; ed.commit(E.ops.clearSlot(ed.book(), info.si, cur.i), 'Photo removed'); },
          ezZin: function () { adj({ z: Math.min(3, +((slot.z || 1) + .2).toFixed(2)) }, 'z'); }, ezZout: function () { adj({ z: Math.max(1, +((slot.z || 1) - .2).toFixed(2)) }, 'z'); },
          ezZ: slot ? Math.round(slot.z * 100) + '%' : '', ezReset: function () { adj({ z: 1, x: 50, y: 50, b: 100 }, 'r'); },
          ezPx: slot ? slot.x : 50, ezPy: slot ? slot.y : 50, ezPxL: slot ? slot.x + '%' : '', ezPyL: slot ? slot.y + '%' : '',
          onEzPx: function (e) { adj({ x: +e.target.value }, 'x'); }, onEzPy: function (e) { adj({ y: +e.target.value }, 'y'); },
          ezSheet: s.sheet && !!cur, ezCloseSheet: function () { set({ sheet: false }); }, ezTiles: tiles, ezNoTiles: tiles.length === 0,
          ezShUn: pressed(s.shf === 'unused'), ezShAll: pressed(s.shf === 'all'), ezSetUn: function () { set({ shf: 'unused' }); }, ezSetAll: function () { set({ shf: 'all' }); },
          ezShTitle: 'Choose a photo for page ' + n,
          ezPrev: function () { move(n - 1); }, ezNext: function () { move(n + 1); },
          ezBackBtn: n === 1 ? 'Photos' : 'Page ' + (n - 1), ezNextBtn: n === total ? 'Cover' : 'Page ' + (n + 1),
          ezPageDone: info.done, ezPageTodo: !info.done, ezDoneLabel: info.done ? 'This page is done' : (info.frames.some(function (f) { return !sp.slots[f.i].p; }) ? 'Add a photo to every frame' : 'Write the story'),
          ezDup: function () { ed.commit(E.ops.duplicateSpread(ed.book(), info.si), 'Spread duplicated (photos not copied)'); }
        };
        return Object.assign(base, v);
      }
    };
  };

  /* ---------- glue ---------- */
  function create(name, ed, c, opts) {
    opts = opts || {};
    var ctx = { c: c, ed: ed, opts: opts, S: function () { return c.state; }, set: function (o) { c.setState(o); } };
    var pg = builders[name](ctx);
    return {
      initial: pg.initial || function () { return {}; },
      mount: pg.mount || function () {}, unmount: pg.unmount || function () {},
      vals: pg.vals
    };
  }
  window.MilesEditorPages = { create: create, builders: builders };
})();
