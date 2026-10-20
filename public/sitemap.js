/* Miles Retold · "All pages": filter the lists as you type. */
(function () {
  'use strict';
  function go() {
    var q = document.getElementById('sm-q'), n = document.getElementById('sm-n');
    if (!q || q.__on) return; q.__on = true;
    var lis = [].slice.call(document.querySelectorAll('.sm li')), groups = [].slice.call(document.querySelectorAll('.sm-g'));
    q.addEventListener('input', function () {
      var t = q.value.trim().toLowerCase(), shown = 0;
      lis.forEach(function (li) { var ok = !t || li.textContent.toLowerCase().indexOf(t) > -1; li.hidden = !ok; if (ok) shown++; });
      groups.forEach(function (g) { g.hidden = !g.querySelector('li:not([hidden])'); });
      if (n) n.textContent = t ? (shown ? shown + (shown === 1 ? ' page matches' : ' pages match') : 'No page matches “' + q.value.trim() + '”') : lis.length + ' pages';
    });
  }
  go(); setTimeout(go, 600); setTimeout(go, 1800);
})();
