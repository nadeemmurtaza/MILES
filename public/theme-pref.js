/* Light is the default theme on every page, storefront and studio. A visitor who switches to dark keeps dark until they switch back.
   Runs first in <head>: if the page is in the other theme than the saved one, it swaps to its twin (G1-Home <-> GL1-Home) before anything paints. */
(function () {
  var m = location.pathname.match(/\/(GL?)(\d+-[^\/]*\.dc\.html)$/);
  if (!m) return;
  var KEY = 'miles.theme', cur = m[1] === 'GL' ? 'light' : 'dark', base = m[2], pref = 'light';
  try { pref = window.localStorage.getItem(KEY) || 'light'; } catch (e) {}
  if (pref !== cur) { location.replace('/' + (pref === 'light' ? 'GL' : 'G') + base + location.search + location.hash); return; }
  document.addEventListener('click', function (e) {
    var a = e.target && e.target.closest ? e.target.closest('a[href]') : null;
    if (!a) return;
    var t = a.getAttribute('href').replace(/^\//, '').split(/[?#]/)[0].match(/^(GL?)(\d+-.*\.dc\.html)$/);
    if (t && t[2] === base && t[1] !== m[1]) { try { window.localStorage.setItem(KEY, t[1] === 'GL' ? 'light' : 'dark'); } catch (e2) {} }
  }, true);
})();
