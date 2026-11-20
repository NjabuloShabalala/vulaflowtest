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
  var stage = document.getElementById('stage');
  var head = document.querySelector('.site-head');
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
    var d = (150 + i * 60) + 'ms';
    inner.style.animationDelay = d + ', ' + d;   // pop and fade share the same delay
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
    // Progress is measured in a fixed scroll distance (1.275 screens), so the early timing stays
    // the same. The pinned area ends just after the navy section lands (P about .77), which
    // leaves no frozen scroll before the page moves on to the doors.
    var P = clamp(-r.top / (vh * 1.275));

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
    var cueO = P < .06 ? 1 : P < .12 ? 1 - (P - .06) / .06 : P < .68 ? 0 : P < .75 ? (P - .68) / .07 : 1;
    cue.style.setProperty('--cue', cueO.toFixed(3));
    cue.classList.toggle('on-dark', P > .5);

    // top bar goes dark while the navy section is under it
    var st = stage.getBoundingClientRect();
    var sheetTop = st.top + (m >= 1 ? 0 : (1 - smooth(m)) * vh);
    head.classList.toggle('head-dark', sheetTop < 34 && st.bottom > 34);
    if (!html.classList.contains('cue-set') && window.scrollY > 4) html.classList.add('cue-set');

    /* ---- Part 3: documents become the doors ---- */
    var sr = dsec.getBoundingClientRect();
    var items = [panel].concat(doorEls);
    var narrow = vw < 760;              // doors stack in one column on phones
    for (var n = 0; n < items.length; n++) {
      var el = items[n];
      var y0 = offsetIn(el, dsec);
      // Phones: every door animates from its own position with no delay, so one door never
      // moves over its neighbour. Wide screens keep a small stagger between the two doors.
      var delay = narrow || n === 0 ? 0 : .06 + (n - 1) * .06;
      var p = clamp(((vh * .95 - (sr.top + y0)) / (vh * (narrow ? .34 : .5))) - delay);
      var pe = easeOut(p);
      var ty2, rot2, scl;
      if (narrow) {
        // phones: the panel stays put, each door just rises into place
        ty2 = n === 0 ? 0 : (1 - pe) * 40;
        rot2 = 0;
        scl = n === 0 ? 1 : .94 + .06 * pe;
      } else {
        var fall = -(y0 + el.offsetHeight + 80) * (n === 0 ? 1 : .35);
        ty2 = (1 - pe) * fall;
        rot2 = (1 - pe) * doorTilt[n];
        scl = .62 + .38 * pe;
      }
      if (p >= 1) { el.style.transform = ''; }
      else el.style.transform = 'translate3d(0,' + ty2.toFixed(1) + 'px,0) rotate(' + rot2.toFixed(2) + 'deg) scale(' + scl.toFixed(3) + ')';
      if (n === 0) {
        el.style.borderRadius = (8 + 20 * pe).toFixed(1) + 'px';
      } else {
        var top = 6 + 300 * smooth(clamp((p - .1) / .7));
        el.style.borderRadius = top.toFixed(1) + 'px ' + top.toFixed(1) + 'px 6px 6px';
        el.style.setProperty('--c', clamp((p - .5) / .4).toFixed(3));
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

/* Door opening. A plain click on a door plays a short "open the door" move (about 0.9 s), then goes to the link.
   Doors stay real links: right-click, new tab, Ctrl/Cmd-click and reduced motion skip the move.
   Door destinations are the hrefs in the HTML. The sign-up buttons are not touched by this. */
(function () {
  var links = [].slice.call(document.querySelectorAll('.vdoor h2 a'));
  if (!links.length || !window.Element || !Element.prototype.animate) return;
  var busy = false, parts = [], anims = [], timers = [], hiddenDoor = null;
  var reduce = function () { return window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches; };
  function el(cls) { var d = document.createElement('div'); d.className = cls; return d; }
  function run(node, kf, opt) { opt.fill = 'forwards'; var a = node.animate(kf, opt); anims.push(a); return a; }

  // Back button / page restored from cache: put the doors back to normal
  function reset() {
    timers.forEach(clearTimeout); timers = [];
    anims.forEach(function (a) { try { a.cancel(); } catch (e) {} }); anims = [];
    parts.forEach(function (n) { if (n.parentNode) n.parentNode.removeChild(n); }); parts = [];
    if (hiddenDoor) { hiddenDoor.style.visibility = ''; hiddenDoor = null; }
    busy = false;
  }

  function open(link) {
    var door = link.closest('.vdoor'), vw = innerWidth, vh = innerHeight;
    var r = door.getBoundingClientRect(), radius = getComputedStyle(door).borderRadius;
    var dx = vw / 2 - (r.left + r.width / 2), dy = vh / 2 - (r.top + r.height / 2);
    var S = Math.max(vw / r.width, vh / r.height) * 1.8;
    busy = true;

    // start loading the next page while the door opens
    var pf = document.createElement('link'); pf.rel = 'prefetch'; pf.href = link.href;
    document.head.appendChild(pf); parts.push(pf);

    var veil = el('dx-veil'), box = el('dx'), frame = el('dx-frame'), leaf = el('dx-leaf'), flood = el('dx-flood');
    box.style.cssText = 'left:' + r.left + 'px;top:' + r.top + 'px;width:' + r.width + 'px;height:' + r.height + 'px';
    frame.style.borderRadius = leaf.style.borderRadius = radius;
    var copy = door.cloneNode(true); copy.removeAttribute('style'); copy.style.borderRadius = radius;
    leaf.appendChild(copy); box.appendChild(frame); box.appendChild(leaf);
    [veil, box, flood].forEach(function (n) { n.setAttribute('inert', ''); n.setAttribute('aria-hidden', 'true'); document.body.appendChild(n); parts.push(n); });
    door.style.visibility = 'hidden'; hiddenDoor = door;

    // 1. the other door fades and slides away
    [].slice.call(document.querySelectorAll('.vdoor')).forEach(function (d) {
      if (d === door) return;
      var o = d.getBoundingClientRect(), stacked = vw < 760;
      var sx = stacked ? 0 : (o.left > r.left ? 60 : -60), sy = stacked ? (o.top > r.top ? 40 : -40) : 0;
      run(d, [{ opacity: 1, transform: 'none' }, { opacity: 0, transform: 'translate(' + sx + 'px,' + sy + 'px) scale(.96)' }], { duration: 260, easing: 'ease-out' });
    });
    run(veil, [{ opacity: 0 }, { opacity: .72 }], { duration: 260, easing: 'ease-out' });

    // 2. the chosen door slides to the centre, 3. its front swings open on a hinge, 4. it grows until light fills the screen
    var mid = 'translate(' + dx + 'px,' + dy + 'px) scale(';
    run(box, [
      { transform: 'translate(0,0) scale(1)', offset: 0, easing: 'cubic-bezier(.2,.7,.2,1)' },
      { transform: mid + '1.06)', offset: .29, easing: 'ease-in-out' },
      { transform: mid + '1.1)', offset: .69, easing: 'cubic-bezier(.5,0,.9,.4)' },
      { transform: mid + S + ')', offset: 1 }
    ], { duration: 900 });
    run(leaf, [
      { transform: 'rotateY(0deg)', offset: 0 },
      { transform: 'rotateY(0deg)', offset: .29, easing: 'cubic-bezier(.65,0,.35,1)' },
      { transform: 'rotateY(-110deg)', offset: .69 },
      { transform: 'rotateY(-110deg)', offset: 1 }
    ], { duration: 900 });
    run(flood, [{ opacity: 0, offset: 0 }, { opacity: 0, offset: .78 }, { opacity: 1, offset: 1 }], { duration: 900 });

    // go to the page; the timers also cover a slow connection (the light just holds) or a blocked navigation
    timers.push(setTimeout(function () {
      try { sessionStorage.setItem('vf-door', String(Date.now())); } catch (e) {}
      location.href = link.href;
      timers.push(setTimeout(reset, 5000));
    }, 920));
  }

  links.forEach(function (a) {
    a.addEventListener('click', function (e) {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || a.target === '_blank' || a.hasAttribute('download') || reduce()) return;
      e.preventDefault();
      if (!busy) open(a);
    });
  });
  window.addEventListener('pageshow', function (e) { if (e.persisted) reset(); });
})();
