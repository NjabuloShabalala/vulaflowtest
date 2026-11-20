/* Door arrival: if the visitor just came through a home-page door, tell the CSS to fade the page in from warm light. */
(function () {
  try {
    var t = +sessionStorage.getItem('vf-door'); sessionStorage.removeItem('vf-door');
    if (t && Date.now() - t < 8000 && !matchMedia('(prefers-reduced-motion: reduce)').matches) document.documentElement.classList.add('door-arrive');
  } catch (e) {}
})();
