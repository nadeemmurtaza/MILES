/* Random twinkling stars for the dark edition: one star per ~60,000 px2 of page, each with its own
   place, size, speed, start time and brightness range. Stars sit inside .atmo, behind the content. */
(function () {
  var DENSITY = 60000;
  function rnd(a, b) { return a + Math.random() * (b - a); }
  function build() {
    var atmo = document.querySelector('.atmo');
    if (!atmo || atmo.querySelector('.sky-star')) return;
    var w = atmo.clientWidth || window.innerWidth, h = Math.max(atmo.clientHeight, window.innerHeight);
    var n = Math.min(160, Math.round(w * h / DENSITY)), f = document.createDocumentFragment();
    for (var i = 0; i < n; i++) {
      var s = document.createElement('i'), z = Math.random() < .12 ? rnd(2.4, 3.2) : rnd(1.4, 2.2);
      s.className = 'sky-star';
      s.setAttribute('aria-hidden', 'true');
      s.style.cssText = 'left:' + rnd(0, 100).toFixed(2) + '%;top:' + Math.floor(rnd(0, h)) + 'px;width:' + z.toFixed(1) + 'px;height:' + z.toFixed(1) + 'px;' +
        '--d:' + rnd(1.8, 7).toFixed(2) + 's;--dl:-' + rnd(0, 8).toFixed(2) + 's;--lo:' + rnd(0, .3).toFixed(2) + ';--hi:' + rnd(.55, 1).toFixed(2);
      f.appendChild(s);
    }
    atmo.appendChild(f);
  }
  function go() { build(); setTimeout(build, 600); setTimeout(build, 2000); }   // the page is rendered after load; retry until .atmo exists
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', go); else go();
})();
