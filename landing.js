/* VulaFlow landing: scroll story.
   1. The wordmark falls in letter by letter.
   2. Scrolling breaks it into three documents that fall behind the opening line.
   3. The documents come back and become the two doors.
   Only movement and fade are animated. If the visitor asks for reduced motion (or this
   script does not run) the page stays as plain stacked sections. */
(function () {
  if (!window.matchMedia || matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  var html = document.documentElement;
  var story = document.getElementById('story');
  var wordmark = document.getElementById('wordmark');
  var docs = [].slice.call(document.querySelectorAll('.doc'));
  var sheet = document.getElementById('sheet');
  var cue = document.getElementById('cue');
  var dsec = document.getElementById('doors-sec');
  var panel = document.getElementById('panel');
  var doorEls = [].slice.call(document.querySelectorAll('.vdoor'));
  if (!story || !wordmark || !sheet || !dsec || !panel) return;

  html.classList.add('js-story');

  var clamp = function (x, a, b) { return Math.max(a === undefined ? 0 : a, Math.min(b === undefined ? 1 : b, x)); };
  var smooth = function (t) { return t * t * (3 - 2 * t); };
  var easeOut = function (t) { return 1 - Math.pow(1 - t, 3); };

  // ---- Part 1: split the wordmark into letters. Outer span = scroll scatter, inner span = fall-in. ----
  var word = 'VulaFlow';
  var tilts = [-9, 7, -6, 10, -8, 6, -10, 8];     // fixed, so every visit looks the same
  var drift = [-.9, .6, -.4, .8, -.7, .5, -.3, .9];
  var spin  = [-70, 50, -40, 80, -60, 45, -35, 65];
  wordmark.textContent = '';
  var letters = [];
  for (var i = 0; i < word.length; i++) {
    var outer = document.createElement('span');
    outer.className = 'lt' + (i >= 4 ? ' fl' : '');
    outer.setAttribute('aria-hidden', 'true');
    var inner = document.createElement('span');
    inner.className = 'lg';
    inner.textContent = word.charAt(i);
    inner.style.setProperty('--r', tilts[i] + 'deg');
    inner.style.animationDelay = (150 + i * 90) + 'ms';
    outer.appendChild(inner);
    wordmark.appendChild(outer);
    letters.push(outer);
  }

  var docTilt = [-8, 5, 9], docSpin = [-34, 22, 40], docSpeed = [1.0, 1.12, .94];
  var doorTilt = [-7, 6, -5], doorStart = [0, 0, 0];

  // distance from the top of the doors section down to an element's natural position
  function offsetIn(el, root) {
    var y = 0;
    while (el && el !== root) { y += el.offsetTop; el = el.offsetParent; }
    return y;
  }

  function update() {
    var vh = window.innerHeight, vw = window.innerWidth;

    /* ---- story progress, 0 at the top to 1 when the pin releases ---- */
    var r = story.getBoundingClientRect();
    var span = story.offsetHeight - vh;
    var P = span > 0 ? clamp(-r.top / span) : 0;

    // letters scatter left to right and fall
    for (var i = 0; i < letters.length; i++) {
      var s = clamp((P - (.05 + i * .014)) / .2);
      var e = s * s;
      letters[i].style.transform = s === 0 ? '' :
        'translate3d(' + (drift[i] * s * vw * .08).toFixed(1) + 'px,' + (e * vh * .95).toFixed(1) + 'px,0) rotate(' + (spin[i] * s).toFixed(1) + 'deg)';
      letters[i].style.opacity = s === 0 ? '' : (1 - clamp((s - .25) / .75)).toFixed(3);
    }

    // documents appear where the letters were, then fall away
    var appear = clamp((P - .10) / .06);
    for (var k = 0; k < docs.length; k++) {
      var f = clamp((P - (.12 + k * .035)) / .4);
      var ty = Math.pow(f, 2.1) * vh * 1.45 * docSpeed[k];
      var rot = docTilt[k] * appear + f * docSpin[k];
      var sc = .8 + .2 * appear;
      docs[k].style.opacity = appear.toFixed(3);
      docs[k].style.transform = 'translate3d(0,' + ty.toFixed(1) + 'px,0) rotate(' + rot.toFixed(1) + 'deg) scale(' + sc.toFixed(3) + ')';
    }

    // the opening line slides up over everything, so the documents fall behind it
    var m = clamp((P - .36) / .32);
    sheet.style.transform = m >= 1 ? 'translateY(0)' : 'translateY(' + ((1 - smooth(m)) * 100).toFixed(2) + '%)';

    // scroll cue: shown at the top, hidden while the story moves, shown again to point on
    var cueO = P < .06 ? 1 : P < .12 ? 1 - (P - .06) / .06 : P < .74 ? 0 : P < .84 ? (P - .74) / .1 : 1;
    cue.style.setProperty('--cue', cueO.toFixed(3));
    if (!html.classList.contains('cue-set') && window.scrollY > 4) html.classList.add('cue-set');

    /* ---- Part 3: documents become the doors ---- */
    var sr = dsec.getBoundingClientRect();
    var items = [panel].concat(doorEls);
    for (var n = 0; n < items.length; n++) {
      var el = items[n];
      var y0 = offsetIn(el, dsec);
      var delay = n === 0 ? 0 : .1 + (n - 1) * .1;
      var p = clamp(((vh * .95 - (sr.top + y0)) / (vh * .62)) - delay);
      var pe = easeOut(p);
      var fall = -(y0 + el.offsetHeight + 80) * (n === 0 ? 1 : .35);
      var ty2 = (1 - pe) * fall;
      var rot2 = (1 - pe) * doorTilt[n];
      var scl = .62 + .38 * pe;
      if (p >= 1) { el.style.transform = ''; }
      else el.style.transform = 'translate3d(0,' + ty2.toFixed(1) + 'px,0) rotate(' + rot2.toFixed(2) + 'deg) scale(' + scl.toFixed(3) + ')';
      if (n === 0) {
        el.style.borderRadius = (8 + 20 * pe).toFixed(1) + 'px';
      } else {
        var top = 6 + 300 * smooth(clamp((p - .1) / .7));
        el.style.borderRadius = top.toFixed(1) + 'px ' + top.toFixed(1) + 'px 6px 6px';
        el.style.setProperty('--c', clamp((p - .6) / .35).toFixed(3));
      }
    }
  }

  var ticking = false;
  function onScroll() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(function () { ticking = false; update(); });
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll);
  window.addEventListener('pageshow', update);
  update();
})();
