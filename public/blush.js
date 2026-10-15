/* Light edition: three large silk-like colour fields (rose, champagne, sage) that drift and slowly turn behind the content. */
(function () {
  var FIELDS = [['--silk-rose', 62, .78], ['--silk-champagne', 70, .7], ['--silk-sage', 58, .82]];   // colour, size in vmin, aspect
  function rnd(a, b) { return a + Math.random() * (b - a); }
  function build() {
    var atmo = document.querySelector('.atmo');
    if (!atmo || atmo.querySelector('.silk')) return;
    var f = document.createDocumentFragment();
    FIELDS.forEach(function (c) {
      var d = document.createElement('i');
      d.className = 'silk';
      d.setAttribute('aria-hidden', 'true');
      d.style.cssText = '--bc:var(' + c[0] + ');--sz:' + c[1] + 'vmin;--ar:' + c[2] + ';--tx:' + rnd(55, 95).toFixed(1) + 's;--ty:' + rnd(65, 110).toFixed(1) + 's;--tr:' + rnd(150, 240).toFixed(0) + 's;--dx:-' + rnd(0, 80).toFixed(1) + 's;--dy:-' + rnd(0, 90).toFixed(1) + 's;--dr:-' + rnd(0, 150).toFixed(0) + 's;--sx:' + rnd(5, 55).toFixed(0) + 'vw;--sy:' + rnd(0, 40).toFixed(0) + 'vh';
      f.appendChild(d);
    });
    atmo.appendChild(f);
  }
  function go() { build(); setTimeout(build, 600); setTimeout(build, 2000); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', go); else go();
})();
