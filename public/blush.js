/* Four blush blobs that wander the screen at different speeds, like a screen saver. Sits inside .atmo, behind the content. */
(function () {
  var COLOURS = ['--blush', '--blush-2', '--blush-2', '--blush'];
  function rnd(a, b) { return a + Math.random() * (b - a); }
  function build() {
    var atmo = document.querySelector('.atmo');
    if (!atmo || atmo.querySelector('.blush')) return;
    var f = document.createDocumentFragment();
    COLOURS.forEach(function (c) {
      var d = document.createElement('i');
      d.className = 'blush';
      d.setAttribute('aria-hidden', 'true');
      d.style.cssText = '--bc:var(' + c + ');--tx:' + rnd(38, 70).toFixed(1) + 's;--ty:' + rnd(47, 83).toFixed(1) + 's;--dx:-' + rnd(0, 60).toFixed(1) + 's;--dy:-' + rnd(0, 80).toFixed(1) + 's;--sx:' + rnd(5, 60).toFixed(0) + 'vw;--sy:' + rnd(5, 60).toFixed(0) + 'vh';
      f.appendChild(d);
    });
    atmo.appendChild(f);
  }
  function go() { build(); setTimeout(build, 600); setTimeout(build, 2000); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', go); else go();
})();
