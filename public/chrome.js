/* Shared behaviour for the site header + footer, loaded by every customer page.
   - language switch (English <-> Arabic, RTL) with a dictionary-based DOM translator
   - cart count and sign-in state (kept in localStorage; this is a prototype, no backend)
   - footer newsletter form, current-page highlight                                    */
(function () {
  'use strict';
  var LS = {
    get: function (k) { try { return localStorage.getItem(k); } catch (e) { return null; } },
    set: function (k, v) { try { localStorage.setItem(k, v); } catch (e) {} },
    del: function (k) { try { localStorage.removeItem(k); } catch (e) {} }
  };
  var page = (location.pathname.split('/').pop() || '').replace('.dc.html', '');

  /* ---------- sign-in state ---------- */
  // Visiting a signed-in area implies the demo customer is signed in.
  var ACCOUNT_PAGES = ['D4-Upload', 'D5-Portal', 'D6-Proof', 'D12-Confirmed', 'D20-Balance', 'D22-Order', 'D23-Account'];
  if (ACCOUNT_PAGES.indexOf(page) > -1 && !LS.get('miles.user')) LS.set('miles.user', 'Sara');
  window.milesAuth = {
    signedIn: function () { return !!LS.get('miles.user'); },
    signIn: function (name) { LS.set('miles.user', name || 'Sara'); },
    signOut: function () { LS.del('miles.user'); }
  };

  /* ---------- language ---------- */
  var lang = LS.get('miles.lang') === 'ar' ? 'ar' : 'en';
  var dict = null, loading = false, applying = false, pending = false;
  var ATTRS = ['placeholder', 'aria-label', 'title', 'alt', 'aria-description'];
  var SKIP = { SCRIPT: 1, STYLE: 1, NOSCRIPT: 1, TEXTAREA: 1, CODE: 1 };
  var orig = new WeakMap();   // node/element -> original English
  var norm = function (s) { return s.replace(/\s+/g, ' ').trim(); };

  function loadDict(cb) {
    if (dict) return cb();
    if (loading) return;
    loading = true;
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
    var k = norm(text);
    if (!k) return null;
    var hit = lookup(k);
    if (hit != null) return hit;
    for (var i = 0; i < dict.re.length; i++) {
      var m = k.match(dict.re[i][0]);
      if (m) {
        // "@1[zero|one|two|few|many]" picks the Arabic number form for capture 1 ("#" = the number)
        return dict.re[i][1].replace(/@(\d)\[([^\]]*)\]/g, function (_, n, forms) {
          var num = parseInt(m[+n], 10), f = forms.split('|'), r = num % 100;
          var form = num === 0 ? 0 : num === 1 ? 1 : num === 2 ? 2 : (r >= 3 && r <= 10) ? 3 : 4;
          return (f[form] != null && f[form] !== '' ? f[form] : f[4] || f[f.length - 1]).replace('#', num);
        }).replace(/\$(\d)/g, function (_, n) {
          var part = m[+n] || '';
          var t = lookup(part);
          return t != null ? t : part;     // translate captured words too
        });
      }
    }
    return null;
  }
  function hasLetters(s) { return /[A-Za-z]{2,}/.test(s); }
  function putText(node, en, ar) {
    var lead = en.match(/^\s*/)[0], trail = en.match(/\s*$/)[0];
    var out = ar === '' ? '' : lead + ar + trail;
    orig.set(node, { en: en, ar: out });
    if (node.nodeValue !== out) node.nodeValue = out;
  }
  function sourceOf(node) { var o = orig.get(node); return (o !== undefined && node.nodeValue === o.ar) ? o.en : node.nodeValue; }
  /* A sentence made of text plus inline elements / live values ({{x}} renders as <span class="sc-interp">).
     Match the whole sentence ("Order {0} confirmed") and put each Arabic segment into the matching text node. */
  function translateBlock(el, handled) {
    var kids = el.childNodes, key = '', n = 0, hasEl = false, hasTxt = false, i, c;
    for (i = 0; i < kids.length; i++) {
      c = kids[i];
      if (c.nodeType === 3) { var v = sourceOf(c); key += v; if (hasLetters(v)) hasTxt = true; }
      else if (c.nodeType === 1) { key += '\u0002'; hasEl = true; }
    }
    if (!hasEl || !hasTxt) return;
    key = norm(key.replace(/\u0002/g, function () { return '{' + (n++) + '}'; }));
    var ar = lookup(key);
    if (ar == null) return;
    var segs = ar.split(/\{\d+\}/);
    if (segs.length !== n + 1) return;
    var slots = [[]], j = 0;
    for (i = 0; i < kids.length; i++) {
      c = kids[i];
      if (c.nodeType === 3) slots[j].push(c);
      else if (c.nodeType === 1) { j++; slots[j] = []; }
    }
    for (j = 0; j < segs.length; j++) if (norm(segs[j]) && !(slots[j] || []).some(function (t) { return hasLetters(sourceOf(t)) || true; })) return;
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
      if (SKIP[node.nodeName]) return;            // attributes only (e.g. a textarea's placeholder), never its typed content
      translateBlock(node, handled);
      for (var c = node.firstChild; c; c = c.nextSibling) translateNode(c, handled);
    }
  }
  function restoreAll(root) {
    var w = document.createTreeWalker(root, NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_TEXT);
    var n;
    while ((n = w.nextNode())) {
      var o = orig.get(n);
      if (!o) continue;
      if (n.nodeType === 3) { if (n.nodeValue === o.ar) n.nodeValue = o.en; }
      else Object.keys(o).forEach(function (a) { if (n.getAttribute(a) === o[a].ar) n.setAttribute(a, o[a].en); });
    }
  }
  var ARROWS = ['M5 12h14', 'M19 12H5', 'M9 6l6 6-6 6', 'M15 6l-6 6 6 6', 'M12 19V5M6 11'];
  function mirrorIcons() {
    [].forEach.call(document.querySelectorAll('svg path[d]'), function (p) {
      var d = p.getAttribute('d') || '';
      if (d.indexOf('M12 19V5') === 0) return;   // up arrow stays
      for (var i = 0; i < 4; i++) if (d.indexOf(ARROWS[i]) === 0) { var sv = p.closest('svg'); if (sv && !sv.hasAttribute('data-mirror')) sv.setAttribute('data-mirror', ''); return; }
    });
  }
  function applyAll() {
    if (lang !== 'ar' || !dict) return;
    applying = true;
    try {
      mirrorIcons();
      translateNode(document.body, new WeakSet());
      var t = document.title, ta = tr(t);
      if (ta && !document.documentElement.__titleEn) { document.documentElement.__titleEn = t; document.title = ta; }
    } finally { applying = false; if (window.__milesObs) window.__milesObs.takeRecords(); }
  }
  function schedule() {
    if (pending) return;
    pending = true;
    (window.requestAnimationFrame || setTimeout)(function () { pending = false; applyAll(); });
  }
  function setLangUI() {
    var de = document.documentElement, ar = lang === 'ar';
    if (de.lang !== lang) de.lang = lang;
    var dir = ar ? 'rtl' : 'ltr';
    if (de.dir !== dir) de.dir = dir;
    if (de.classList.contains('is-ar') !== ar) de.classList.toggle('is-ar', ar);
    var label = ar ? 'English — switch to English' : 'العربية — switch to Arabic';
    [].forEach.call(document.querySelectorAll('[data-lang-set]'), function (b) {
      var on = b.getAttribute('data-lang-set') === lang;
      if (b.getAttribute('aria-pressed') !== String(on)) b.setAttribute('aria-pressed', String(on));
      if (b.classList.contains('btn') && (b.classList.contains('bp') !== on || b.classList.contains('bs') === on)) { b.classList.toggle('bp', on); b.classList.toggle('bs', !on); }
    });
    [].forEach.call(document.querySelectorAll('[data-lang-toggle]'), function (b) {
      if (b.classList.contains('sh-lang')) {
        var sp = b.firstElementChild, want = ar ? 'EN' : 'ع';
        if (sp && sp.textContent !== want) sp.textContent = want;
        if (sp) { if (ar) { if (sp.hasAttribute('lang')) sp.removeAttribute('lang'); } else if (sp.getAttribute('lang') !== 'ar') sp.setAttribute('lang', 'ar'); }
      } else {
        var w = ar ? 'English' : 'العربية';
        if (b.textContent !== w) b.textContent = w;
        if (ar) { if (b.hasAttribute('lang')) b.removeAttribute('lang'); } else if (b.getAttribute('lang') !== 'ar') b.setAttribute('lang', 'ar');
      }
      if (b.getAttribute('aria-label') !== label && b.classList.contains('sh-lang')) b.setAttribute('aria-label', label);
    });
  }
  function ensureArabicFont() {
    if (document.getElementById('miles-ar-font')) return;
    var l = document.createElement('link');
    l.id = 'miles-ar-font'; l.rel = 'stylesheet';
    l.href = 'https://fonts.googleapis.com/css2?family=Noto+Kufi+Arabic:wght@400;500;600;700&family=Noto+Naskh+Arabic:wght@400;500;600;700&display=swap';
    document.head.appendChild(l);
  }
  function setLang(next) {
    lang = next;
    LS.set('miles.lang', lang);
    if (lang === 'ar') {
      ensureArabicFont();
      loadDict(function () { setLangUI(); applyAll(); });
    } else {
      applying = true;
      try { restoreAll(document.body); if (document.documentElement.__titleEn) { document.title = document.documentElement.__titleEn; document.documentElement.__titleEn = null; } }
      finally { applying = false; }
      setLangUI();
    }
  }

  /* ---------- header / footer state ---------- */
  function cartCount() { var n = parseInt(LS.get('miles.cart'), 10); return isNaN(n) ? 4 : n; }
  window.milesCart = { set: function (n) { LS.set('miles.cart', String(n)); refreshChrome(); } };
  function setText(el, v) { if (el.textContent !== v) el.textContent = v; }
  function setAttr(el, k, v) { if (el.getAttribute(k) !== v) el.setAttribute(k, v); }
  function refreshChrome() {
    var n = cartCount();
    [].forEach.call(document.querySelectorAll('[data-cart-count]'), function (b) { setText(b, String(n)); if (b.hidden !== n < 1) b.hidden = n < 1; });
    [].forEach.call(document.querySelectorAll('[data-cart]'), function (a) {
      var en = 'Cart, ' + n + (n === 1 ? ' item' : ' items');
      var rec = orig.get(a), cur = a.getAttribute('aria-label');
      if (lang === 'ar' && rec && rec['aria-label'] && rec['aria-label'].en === en && cur === rec['aria-label'].ar) return;   // already translated
      if (cur !== en && !(lang === 'ar' && dict && cur === tr(en))) setAttr(a, 'aria-label', en);
    });
    var inn = window.milesAuth.signedIn();
    [].forEach.call(document.querySelectorAll('[data-auth-link]'), function (a) {
      var st = inn ? 'in' : 'out';
      if (a.getAttribute('data-auth-state') === st) return;          // already in the right state
      a.setAttribute('data-auth-state', st);
      a.setAttribute('href', inn ? 'D5-Portal.dc.html' : 'D11-SignIn.dc.html');
      if (a.firstChild) orig.delete(a.firstChild);
      a.textContent = inn ? 'Account' : 'Sign in';
    });
    [].forEach.call(document.querySelectorAll('.sh-nav a,.sh-drawer a,.sh-track'), function (a) {
      var href = a.getAttribute('href') || '', h = href.split('#')[0].replace('.dc.html', '');
      if (h && h === page && href.indexOf('#') < 0) setAttr(a, 'aria-current', 'page');
    });
  }

  document.addEventListener('click', function (e) {
    var so = e.target.closest && e.target.closest('[data-signout]');
    if (so) { window.milesAuth.signOut(); }
    var t = e.target.closest && e.target.closest('[data-lang-toggle]');
    if (t) { e.preventDefault(); setLang(lang === 'ar' ? 'en' : 'ar'); }
    var ls = e.target.closest && e.target.closest('[data-lang-set]');
    if (ls) { e.preventDefault(); setLang(ls.getAttribute('data-lang-set') === 'ar' ? 'ar' : 'en'); }
  });
  document.addEventListener('submit', function (e) {
    var f = e.target.closest && e.target.closest('[data-newsletter]');
    if (!f) return;
    e.preventDefault();
    var inp = f.querySelector('input'), msg = f.querySelector('.sf-nlmsg');
    var ok = /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(inp.value.trim());
    msg.textContent = ok ? 'Thanks — you’re on the list ✓' : 'Please enter a valid email address.';
    msg.style.color = ok ? '#F2B880' : '#FFB4B4';
    if (ok) inp.value = '';
    if (lang === 'ar') schedule();
  });

  function start() {
    refreshChrome();
    setLangUI();
    if (lang === 'ar') { ensureArabicFont(); loadDict(function () { setLangUI(); applyAll(); }); }
    var obs = new MutationObserver(function () {
      if (applying) return;
      refreshChrome();
      setLangUI();
      obs.takeRecords();                       // drop mutations we just caused ourselves
      if (lang === 'ar' && dict) schedule();
    });
    obs.observe(document.body, { childList: true, subtree: true, characterData: true, attributes: true, attributeFilter: ATTRS });
    window.__milesObs = obs;
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start); else start();
  window.addEventListener('storage', function (e) { if (e.key === 'miles.cart' || e.key === 'miles.user') refreshChrome(); });
  window.milesI18n = { setLang: setLang, apply: applyAll, get lang() { return lang; } };
})();
