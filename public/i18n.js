/* Miles Retold · English <-> Arabic (RTL) for the customer pages of option G.
   - the language button (ع / EN) is added to the header; the choice is remembered ('miles.lang')
   - text is translated in the browser from /i18n/ar.js (built from i18n-src/ by scripts/build-i18n.mjs):
       exact sentences, patterns with live values, and per-page overrides
   - a headline split into one <span> per word is matched as one sentence
   - English is kept in memory, so switching back restores it exactly
   To keep a node in English add data-no-i18n to it or a parent.                                              */
(function () {
  'use strict';
  var LS = {
    get: function (k) { try { return localStorage.getItem(k); } catch (e) { return null; } },
    set: function (k, v) { try { localStorage.setItem(k, v); } catch (e) {} }
  };
  var file = (location.pathname.split('/').pop() || '').replace('.dc.html', '');
  var page = file.replace(/^GL(?=\d)/, 'G');
  var lang = LS.get('miles.lang') === 'ar' ? 'ar' : 'en';
  var dict = null, loading = false, applying = false, pending = false;
  var ATTRS = ['placeholder', 'aria-label', 'title', 'alt'];
  var SKIP = { SCRIPT: 1, STYLE: 1, NOSCRIPT: 1, TEXTAREA: 1, CODE: 1, SVG: 1, svg: 1 };
  var INLINE = { SPAN: 1, EM: 1, I: 1, B: 1, STRONG: 1, BR: 1, SMALL: 1, U: 1, MARK: 1, IMG: 1 };
  var orig = new WeakMap();
  var norm = function (s) { return s.replace(/\s+/g, ' ').trim(); };
  var hasLetters = function (s) { return /[A-Za-z]{2,}/.test(s); };

  function loadDict(cb) {
    if (dict) return cb();
    if (loading) return; loading = true;
    var s = document.createElement('script');
    s.src = '/i18n/ar.js';
    s.onload = function () { dict = window.MILES_AR || { exact: {}, patterns: [] }; dict.re = (dict.patterns || []).map(function (p) { return [new RegExp(p[0]), p[1]]; }); cb(); };
    s.onerror = function () { loading = false; };
    document.head.appendChild(s);
  }
  function lookup(k) {
    var pg = dict.page && dict.page[page];
    if (pg && pg[k] != null) return pg[k];
    return dict.exact[k] != null ? dict.exact[k] : null;
  }
  function tr(text) {
    var k = norm(text); if (!k) return null;
    var hit = lookup(k); if (hit != null) return hit;
    for (var i = 0; i < dict.re.length; i++) {
      var m = k.match(dict.re[i][0]);
      if (m) {
        return dict.re[i][1].replace(/@(\d)\[([^\]]*)\]/g, function (_, n, forms) {
          var num = parseInt(m[+n], 10), f = forms.split('|'), r = num % 100;
          var form = num === 0 ? 0 : num === 1 ? 1 : num === 2 ? 2 : (r >= 3 && r <= 10) ? 3 : 4;
          return (f[form] != null && f[form] !== '' ? f[form] : f[4] || f[f.length - 1]).replace('#', num);
        }).replace(/\$(\d)/g, function (_, n) { var part = m[+n] || ''; var t = lookup(part); return t != null ? t : part; });
      }
    }
    return null;
  }
  function putText(node, en, ar) {
    var lead = en.match(/^\s*/)[0], trail = en.match(/\s*$/)[0];
    var out = ar === '' ? '' : lead + ar + trail;
    orig.set(node, { en: en, ar: out });
    if (node.nodeValue !== out) node.nodeValue = out;
  }
  function sourceOf(node) { var o = orig.get(node); return (o !== undefined && node.nodeValue === o.ar) ? o.en : node.nodeValue; }

  /* all text nodes below el (skipping svg / scripts), in order */
  function textNodes(el, out) {
    for (var c = el.firstChild; c; c = c.nextSibling) {
      if (c.nodeType === 3) out.push(c);
      else if (c.nodeType === 1 && !SKIP[c.nodeName]) textNodes(c, out);
    }
    return out;
  }
  /* A container whose children are only inline elements (a headline with one span per word, a price line ...):
     the whole sentence is the key, the Arabic goes into the first text node and the rest are emptied. */
  function flatKey(el) {
    var kids = el.children, i;
    if (kids.length < 1) return null;
    for (i = 0; i < kids.length; i++) {
      var k = kids[i];
      if (!INLINE[k.nodeName] && !SKIP[k.nodeName]) return null;
      for (var d = k.firstElementChild; d; d = d.nextElementSibling) if (!INLINE[d.nodeName] && !SKIP[d.nodeName]) return null;
    }
    var nodes = textNodes(el, []), parts = [];
    nodes.forEach(function (n) { parts.push(sourceOf(n)); });
    var key = norm(parts.join(' ')).replace(/\s+([.,;:!?’”)])/g, '$1').replace(/([“(‘])\s+/g, '$1');
    return hasLetters(key) ? { nodes: nodes, key: key } : null;
  }
  function translateFlat(el, handled) {
    var f = flatKey(el); if (!f) return false;
    var ar = lookup(f.key) != null ? lookup(f.key) : tr(f.key);
    if (ar == null) return false;
    var first = true;
    f.nodes.forEach(function (n) {
      var en = sourceOf(n);
      if (first && hasLetters(en)) { putText(n, en, ar); first = false; }
      else if (hasLetters(en) || /\S/.test(en)) putText(n, en, '');
      handled.add(n);
    });
    return true;
  }
  /* text + inline elements / live values: "Order {0} confirmed" */
  function translateBlock(el, handled) {
    var kids = el.childNodes, key = '', n = 0, hasEl = false, hasTxt = false, i, c;
    for (i = 0; i < kids.length; i++) {
      c = kids[i];
      if (c.nodeType === 3) { var v = sourceOf(c); key += v; if (hasLetters(v)) hasTxt = true; }
      else if (c.nodeType === 1 && hasLetters(c.textContent)) { key += '\u0002'; hasEl = true; }   /* icons and numbers are not slots */
    }
    if (!hasEl || !hasTxt) return;
    key = norm(key.replace(/\u0002/g, function () { return '{' + (n++) + '}'; }));
    var ar = lookup(key); if (ar == null) return;
    var segs = ar.split(/\{\d+\}/); if (segs.length !== n + 1) return;
    var slots = [[]], j = 0;
    for (i = 0; i < kids.length; i++) { c = kids[i]; if (c.nodeType === 3) slots[j].push(c); else if (c.nodeType === 1 && hasLetters(c.textContent)) { j++; slots[j] = []; } }
    for (j = 0; j < segs.length; j++) {
      var ns = slots[j] || [], seg = norm(segs[j]), first = true;
      for (i = 0; i < ns.length; i++) {
        var en = sourceOf(ns[i]);
        if (first && (seg || hasLetters(en))) { putText(ns[i], en, seg); first = false; }
        else if (hasLetters(en)) putText(ns[i], en, '');
        handled.add(ns[i]);
      }
    }
  }
  function translateNode(node, handled) {
    if (node.nodeType === 3) {
      if (handled.has(node)) return;
      var p = node.parentNode;
      if (!p || SKIP[p.nodeName] || (p.closest && p.closest('[data-no-i18n]'))) return;
      var src = sourceOf(node);
      if (!/[A-Za-z]/.test(src)) return;
      var ar = tr(src);
      if (ar != null) putText(node, src, ar);
    } else if (node.nodeType === 1) {
      if (node.nodeName === 'SCRIPT' || node.nodeName === 'STYLE' || node.hasAttribute('data-no-i18n')) return;
      for (var i = 0; i < ATTRS.length; i++) {
        var a = ATTRS[i];
        if (!node.hasAttribute(a)) continue;
        var rec = orig.get(node) || {};
        var curA = node.getAttribute(a);
        var srcA = (rec[a] && curA === rec[a].ar) ? rec[a].en : curA;
        var arA = hasLetters(srcA) ? tr(srcA) : null;
        if (arA != null && arA !== curA) { rec[a] = { en: srcA, ar: arA }; orig.set(node, rec); node.setAttribute(a, arA); }
      }
      if (SKIP[node.nodeName]) return;            /* attributes only (a textarea's placeholder), never its typed content or an svg */
      if (translateFlat(node, handled)) return;
      translateBlock(node, handled);
      for (var c = node.firstChild; c; c = c.nextSibling) translateNode(c, handled);
    }
  }
  function restoreAll(root) {
    var w = document.createTreeWalker(root, NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_TEXT), n;
    while ((n = w.nextNode())) {
      var o = orig.get(n); if (!o) continue;
      if (n.nodeType === 3) { if (n.nodeValue === o.ar) n.nodeValue = o.en; }
      else Object.keys(o).forEach(function (a) { if (n.getAttribute && n.getAttribute(a) === o[a].ar) n.setAttribute(a, o[a].en); });
    }
  }
  /* arrows and chevrons mirror in RTL */
  var ARROWS = ['M5 12h14', 'M19 12H5', 'M9 6l6 6-6 6', 'M15 6l-6 6 6 6', 'M7 17 17 7', 'M15 6l-6 6 6 6', 'M9 6l6 6-6 6', 'M6 12h11'];
  function mirrorIcons() {
    [].forEach.call(document.querySelectorAll('svg path[d]'), function (p) {
      var d = p.getAttribute('d') || '';
      for (var i = 0; i < ARROWS.length; i++) if (d.indexOf(ARROWS[i]) === 0) { var sv = p.closest('svg'); if (sv && !sv.hasAttribute('data-mirror')) sv.setAttribute('data-mirror', ''); return; }
    });
  }
  function fixFieldDir(on) {
    [].forEach.call(document.querySelectorAll('input, textarea'), function (i) {
      if (/^(checkbox|radio|range|hidden|file|submit|button|color)$/.test(i.type)) return;
      if (on && !i.hasAttribute('dir')) { i.setAttribute('dir', 'auto'); i.setAttribute('data-ar-dir', ''); }
      else if (!on && i.hasAttribute('data-ar-dir')) { i.removeAttribute('data-ar-dir'); i.removeAttribute('dir'); }
    });
  }
  function applyAll() {
    if (lang !== 'ar' || !dict) return;
    applying = true;
    try {
      mirrorIcons();
      translateNode(document.body, new WeakSet());
      fixFieldDir(true);
      var t = document.title, ta = tr(t.replace(/^Light · /, ''));
      if (ta && !document.documentElement.__titleEn) { document.documentElement.__titleEn = t; document.title = ta; }
    } finally { applying = false; if (window.__milesObs) window.__milesObs.takeRecords(); }
  }
  function schedule() { if (pending) return; pending = true; (window.requestAnimationFrame || setTimeout)(function () { pending = false; applyAll(); }); }

  /* the language button, added once next to the theme switch */
  function ensureButton() {
    var host = document.querySelector('.nva');
    if (!host || host.querySelector('[data-lang-toggle]')) return;
    var b = document.createElement('button');
    b.type = 'button'; b.className = 'thm lang-btn'; b.setAttribute('data-lang-toggle', ''); b.setAttribute('data-no-i18n', '');
    var thm = host.querySelector('.thm');
    host.insertBefore(b, thm || host.firstChild);
    paintButton(b);
  }
  function paintButton(b) {
    var ar = lang === 'ar';
    b.textContent = ar ? 'EN' : 'ع';
    if (ar) b.removeAttribute('lang'); else b.setAttribute('lang', 'ar');
    b.setAttribute('aria-label', ar ? 'English — switch to English' : 'العربية — switch to Arabic');
    b.setAttribute('title', ar ? 'English' : 'العربية');
  }
  function setLangUI() {
    var de = document.documentElement, ar = lang === 'ar', dir = ar ? 'rtl' : 'ltr';
    if (de.lang !== lang) de.lang = lang;
    if (de.dir !== dir) de.dir = dir;
    if (de.classList.contains('is-ar') !== ar) de.classList.toggle('is-ar', ar);
    [].forEach.call(document.querySelectorAll('[data-lang-toggle]'), paintButton);
  }
  function setLang(next) {
    lang = next; LS.set('miles.lang', lang);
    try { document.dispatchEvent(new CustomEvent('miles:lang', { detail: lang })); } catch (e) {}
    if (lang === 'ar') loadDict(function () { setLangUI(); applyAll(); });
    else {
      applying = true;
      try { restoreAll(document.body); fixFieldDir(false); if (document.documentElement.__titleEn) { document.title = document.documentElement.__titleEn; document.documentElement.__titleEn = null; } }
      finally { applying = false; }
      setLangUI();
    }
  }
  document.addEventListener('click', function (e) {
    var t = e.target.closest && e.target.closest('[data-lang-toggle]');
    if (t) { e.preventDefault(); setLang(lang === 'ar' ? 'en' : 'ar'); }
  });
  function start() {
    ensureButton(); setLangUI();
    if (lang === 'ar') loadDict(function () { setLangUI(); applyAll(); });
    var obs = new MutationObserver(function () {
      if (applying) return;
      ensureButton(); setLangUI();
      obs.takeRecords();
      if (lang === 'ar' && dict) schedule();
    });
    obs.observe(document.body, { childList: true, subtree: true, characterData: true, attributes: true, attributeFilter: ATTRS });
    window.__milesObs = obs;
  }
  /* html lang / dir are set before first paint so the page does not flash left-to-right */
  if (lang === 'ar') { var de = document.documentElement; de.lang = 'ar'; de.dir = 'rtl'; de.classList.add('is-ar'); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start); else start();
  /* maintenance helper: window.milesI18n.keys() lists every English key this page asks the dictionary for */
  function keys(split) {
    var out = {}, flats = {};
    (function walk(node) {
      if (node.nodeType === 3) { var p = node.parentNode; if (!p || SKIP[p.nodeName] || (p.closest && p.closest('[data-no-i18n]'))) return; var v = norm(node.nodeValue); if (hasLetters(v)) out[v] = 1; return; }
      if (node.nodeType !== 1 || SKIP[node.nodeName] || node.hasAttribute('data-no-i18n')) return;
      ATTRS.forEach(function (a) { var v = node.getAttribute(a); if (v && hasLetters(v)) out[norm(v)] = 1; });
      var f = flatKey(node); if (f) { out[f.key] = 1; flats[f.key] = f.nodes.filter(function (n) { return hasLetters(n.nodeValue); }).length + ':' + f.nodes.filter(function (n) { return hasLetters(n.nodeValue) && norm(n.nodeValue).split(' ').length <= 2; }).length; }
      var kids = node.childNodes, key = '', n = 0, hasEl = false, hasTxt = false, i, c;
      for (i = 0; i < kids.length; i++) { c = kids[i]; if (c.nodeType === 3) { key += c.nodeValue; if (hasLetters(c.nodeValue)) hasTxt = true; } else if (c.nodeType === 1 && hasLetters(c.textContent)) { key += '\u0002'; hasEl = true; } }
      if (hasEl && hasTxt) out[norm(key.replace(/\u0002/g, function () { return '{' + (n++) + '}'; }))] = 1;
      for (c = node.firstChild; c; c = c.nextSibling) walk(c);
    })(document.body);
    return split ? { flat: flats, all: Object.keys(out) } : Object.keys(out);
  }
  window.milesI18n = { keys: keys, setLang: setLang, apply: applyAll, get lang() { return lang; } };
})();
