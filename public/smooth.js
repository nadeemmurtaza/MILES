/* Option G · pauses looping animations while they are off screen. No effect on layout. */
(function () {
  if (!('IntersectionObserver' in window)) return;
  var SEL = '.orb,.zoom,.bkf,.mq,.streak,.shadow,.gci,.gsh,.bkc,.h6i img,.cue span,.pulse';
  var seen = new WeakSet();
  var io = new IntersectionObserver(function (es) {
    es.forEach(function (e) { if (e.isIntersecting) e.target.removeAttribute('data-off'); else e.target.setAttribute('data-off', ''); });
  }, { rootMargin: '200px 0px' });
  function scan() {
    document.querySelectorAll(SEL).forEach(function (el) { if (!seen.has(el)) { seen.add(el); io.observe(el); } });
  }
  var t = 0;
  function later() { clearTimeout(t); t = setTimeout(scan, 120); }
  scan();
  new MutationObserver(later).observe(document.documentElement, { childList: true, subtree: true });
  document.addEventListener('visibilitychange', function () {
    document.documentElement.toggleAttribute('data-hidden', document.hidden);
  });
})();
