/* ============================================================
   khang le — app shell
   ------------------------------------------------------------
   Hash routing (works on GitHub Pages with no server config),
   view transitions, and the interaction layer: reveals, marquee,
   magnetic buttons, lightbox, waveform.
   ============================================================ */

(function () {
  'use strict';

  // ---------------------------------------------------------------
  // Content. Edit here — the views read from this.
  // ---------------------------------------------------------------
  // `img` is an id in scripts/media.js. Drop the field and the tile
  // falls back to generated artwork.
  var PROJECTS = [
    { slug: 'untitled',        title: 'untitled',        status: 'coming soon',  year: '2026', role: 'write · produce · mix',
      img: 'dsc9303',
      note: 'The one that started as a voice memo at 3am and refused to leave.' },
    { slug: 'first-release',   title: 'first release',   status: 'in dev',       year: '2026', role: 'write · produce · engineer',
      img: 'haz1026',
      note: 'Everything before this was practice. This is the line in the sand.' },
    { slug: 'love-and-sadness',title: 'love & sadness',  status: 'upcoming',     year: '2026', role: 'write · vocals · produce',
      img: 'dsc9525',
      note: 'Two things that never showed up separately.' },
    { slug: 'night-sessions',  title: 'night sessions',  status: 'in progress',  year: '2026', role: 'produce · engineer',
      img: 'dsc9662',
      note: 'Made entirely between midnight and the point where it stops being night.' },
    { slug: 'working-together',title: 'working together',status: 'collab',       year: '2026', role: 'feature · production',
      img: 'dsc9664',
      note: 'Open door. Bring something honest.' },
    { slug: 'whats-next',      title: "what's next",     status: 'always',       year: '2026', role: 'write · produce',
      img: 'dsc9586',
      note: 'A placeholder that keeps refusing to stay one.' },
    { slug: 'deep-cuts',       title: 'deep cuts',       status: 'recording',    year: '2026', role: 'write · vocals',
      img: 'dsc9717',
      note: 'The songs that did not fit anywhere, which is usually the tell.' },
    { slug: 'soul-beats',      title: 'soul beats',      status: 'mixing',       year: '2026', role: 'produce · mix',
      img: 'dsc9679',
      note: 'Sample-led, warm, deliberately unhurried.' },
    { slug: 'abstract-sounds', title: 'abstract sounds', status: 'experimental', year: '2026', role: 'sound design',
      img: 'dsc9930',
      note: 'Texture first, song second. Sometimes song never.' },
    { slug: 'new-era',         title: 'new era',         status: 'upcoming',     year: '2027', role: 'write · produce · engineer',
      img: 'dsc9601',
      note: 'Naming it early so there is something to live up to.' }
  ];

  // The shoot, in narrative order rather than filename order.
  // Captions are placeholders — rename them to whatever they are.
  var STILLS = [
    { img: 'dsc9303', cap: 'blue hour' },
    { img: 'dsc9592', cap: 'long exposure' },
    { img: 'dsc9601', cap: 'last light' },
    { img: 'dsc9586', cap: 'running' },
    { img: 'dsc9525', cap: 'in the surf' },
    { img: 'dsc9664', cap: 'city behind' },
    { img: 'dsc9662', cap: 'the parapet' },
    { img: 'dsc9671', cap: 'folded' },
    { img: 'dsc9679', cap: 'red tile' },
    { img: 'dsc9695', cap: 'one light' },
    { img: 'dsc9717', cap: 'close' },
    { img: 'dsc9721', cap: 'hands' },
    { img: 'dsc9930', cap: 'blur' },
    { img: 'dsc9971', cap: 'streetlight' },
    { img: 'dsc9972', cap: 'the grass' },
    { img: 'dsc9973', cap: 'field' },
    { img: 'dsc9975', cap: 'the corner' },
    { img: 'dsc9976', cap: 'against the wall' },
    { img: 'haz1026', cap: 'back to the water' }
  ];

  // ---------------------------------------------------------------
  // Utilities
  // ---------------------------------------------------------------
  var app = null;
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // WebGL ripple on tile hover. Off — the photographs read better still.
  // Flip to true to bring it back; scripts/gl.js is still loaded.
  var ENABLE_GL = false;

  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  // "khang" -> "khxng" and "le" -> "LX" line up letter for letter, so the
  // changed glyphs can roll over in place without the line reflowing.
  // Each swap slot is an inline-grid: both glyphs share one cell, so the
  // cell takes the wider of the two and nothing shifts mid-animation.
  function glyphs(from, to) {
    var out = '';
    var n = 0;
    for (var i = 0; i < from.length; i++) {
      var a = from.charAt(i);
      var b = to.charAt(i);
      if (a === b) {
        out += '<span class="g">' + esc(a) + '</span>';
      } else {
        out +=
          '<span class="g g--swap" style="--n:' + n++ + '">' +
          '<i>' + esc(a) + '</i><i>' + esc(b) + '</i>' +
          '</span>';
      }
    }
    return out;
  }

  function findProject(slug) {
    for (var i = 0; i < PROJECTS.length; i++) {
      if (PROJECTS[i].slug === slug) return { p: PROJECTS[i], i: i };
    }
    return null;
  }

  // ---------------------------------------------------------------
  // Views
  // ---------------------------------------------------------------
  function viewHome() {
    var tiles = PROJECTS.map(function (p, i) {
      return [
        '<a class="tile reveal" href="#/project/' + p.slug + '"',
        '   data-art="' + esc(p.title) + '"',
        '   data-img="' + esc(p.img || '') + '"',
        '   data-alt="' + esc(p.title) + ' — cover" style="--i:' + i + '">',
        '  <span class="tile__index">' + String(i + 1).padStart(2, '0') + '</span>',
        '  <span class="tile__art"></span>',
        '  <span class="tile__meta">',
        '    <span class="tile__title">' + esc(p.title) + '</span>',
        '    <span class="tile__status">' + esc(p.status) + '</span>',
        '  </span>',
        '</a>'
      ].join('');
    }).join('');

    return [
      '<section class="hero">',
      '  <p class="hero__eyebrow reveal">artist · producer · engineer</p>',
      '  <h1 class="hero__title reveal" id="wordmark" aria-label="khxngLX — khang LE">',
      '    <span class="ln" aria-hidden="true">' + glyphs('khang', 'khxng') + '</span>',
      '    <span class="ln ln--outline" aria-hidden="true">' + glyphs('LE', 'LX') + '</span>',
      '  </h1>',
      '  <p class="hero__alt" aria-hidden="true">khang LE</p>',
      '  <p class="hero__line reveal">Moody, atmospheric, introspective. Vietnamese roots. Every sound has a purpose.</p>',
      '  <canvas class="wave" aria-hidden="true"></canvas>',
      '</section>',

      '<div class="marquee" aria-hidden="true"><div class="marquee__track">',
      new Array(4).join(''),
      '<span>hip hop</span><span>&middot;</span><span>indie</span><span>&middot;</span><span>experimental</span><span>&middot;</span>',
      '<span>hip hop</span><span>&middot;</span><span>indie</span><span>&middot;</span><span>experimental</span><span>&middot;</span>',
      '<span>hip hop</span><span>&middot;</span><span>indie</span><span>&middot;</span><span>experimental</span><span>&middot;</span>',
      '<span>hip hop</span><span>&middot;</span><span>indie</span><span>&middot;</span><span>experimental</span><span>&middot;</span>',
      '</div></div>',

      '<section class="work">',
      '  <header class="sec-head reveal"><h2>work</h2><span>' + PROJECTS.length + ' pieces</span></header>',
      '  <div class="grid">' + tiles + '</div>',
      '</section>'
    ].join('');
  }

  function viewProject(slug) {
    var found = findProject(slug);
    if (!found) return viewMissing();

    var p = found.p;
    var prev = PROJECTS[(found.i - 1 + PROJECTS.length) % PROJECTS.length];
    var next = PROJECTS[(found.i + 1) % PROJECTS.length];

    return [
      '<article class="project">',
      '  <a class="back" href="#/">&larr; index</a>',

      '  <header class="project__head">',
      '    <p class="project__status reveal">' + esc(p.status) + ' &middot; ' + esc(p.year) + '</p>',
      '    <h1 class="project__title reveal">' + esc(p.title) + '</h1>',
      '  </header>',

      '  <div class="project__art reveal" data-art="' + esc(p.title) + '"' +
         ' data-img="' + esc(p.img || '') + '" data-size="lg"' +
         ' data-alt="' + esc(p.title) + '"></div>',

      '  <div class="project__body">',
      '    <p class="project__note reveal">' + esc(p.note) + '</p>',
      '    <dl class="project__facts reveal">',
      '      <div><dt>role</dt><dd>' + esc(p.role) + '</dd></div>',
      '      <div><dt>status</dt><dd>' + esc(p.status) + '</dd></div>',
      '      <div><dt>year</dt><dd>' + esc(p.year) + '</dd></div>',
      '    </dl>',
      '    <div class="player reveal" role="group" aria-label="audio placeholder">',
      '      <button class="player__btn" type="button" aria-label="play preview">&#9654;</button>',
      '      <div class="player__bars" aria-hidden="true">' +
             new Array(48).join('<i></i>') +
           '</div>',
      '      <span class="player__hint">preview when released</span>',
      '    </div>',
      '  </div>',

      '  <nav class="pager">',
      '    <a href="#/project/' + prev.slug + '"><span>prev</span>' + esc(prev.title) + '</a>',
      '    <a href="#/project/' + next.slug + '" class="pager__next"><span>next</span>' + esc(next.title) + '</a>',
      '  </nav>',
      '</article>'
    ].join('');
  }

  function viewStills() {
    var items = STILLS.map(function (s, i) {
      var m = window.KLMedia && window.KLMedia.images[s.img];
      var tall = m && m.orient === 'portrait' ? ' still--tall' : '';
      return [
        '<button class="still reveal' + tall + '" type="button"',
        '        data-art="' + esc(s.cap) + '"',
        '        data-img="' + esc(s.img) + '"',
        '        data-alt="' + esc(s.cap) + '"',
        '        data-name="' + esc(s.cap) + '" style="--i:' + (i % 6) + '">',
        '  <span class="still__art"></span>',
        '  <span class="still__label">' + esc(s.cap) + '</span>',
        '</button>'
      ].join('');
    }).join('');

    return [
      '<section class="stills">',
      '  <header class="sec-head reveal"><h2>stills</h2><span>' + STILLS.length + ' frames &middot; tap one</span></header>',
      '  <div class="stills__grid">' + items + '</div>',
      '</section>'
    ].join('');
  }

  function viewAbout() {
    return [
      '<section class="about">',
      '  <h1 class="about__title reveal">i&rsquo;m khang</h1>',
      '  <p class="about__handle reveal">releasing as <b>khxngLX</b></p>',
      '  <div class="about__cols">',
      '    <div class="about__text">',
      '      <p class="reveal">Musician and producer working in hip hop, indie and whatever sits between them.</p>',
      '      <p class="reveal">Vietnamese roots. Moody, atmospheric, introspective &mdash; I engineer, produce, write and rap, and I would rather a track be honest than clean.</p>',
      '      <p class="reveal">Authenticity over perfection. Every project starts with a feeling and the details turn into atmosphere.</p>',
      '      <p class="reveal">Open to collaborations with artists and producers who understand the vision.</p>',
      '    </div>',
      '    <ul class="about__list">',
      '      <li class="reveal"><b>artist &amp; songwriter</b><span>vulnerability &amp; emotion</span></li>',
      '      <li class="reveal"><b>producer &amp; engineer</b><span>moody beats &amp; atmosphere</span></li>',
      '      <li class="reveal"><b>rapper &amp; vocalist</b><span>stories through song</span></li>',
      '      <li class="reveal"><b>indie first</b><span>vision over commercial</span></li>',
      '    </ul>',
      '  </div>',
      '  <a class="contact reveal" href="mailto:hello@khangle.com">hello@khangle.com</a>',
      '</section>'
    ].join('');
  }

  function viewMissing() {
    return '<section class="missing"><h1>not here</h1><a href="#/">back to index</a></section>';
  }

  // ---------------------------------------------------------------
  // Router
  // ---------------------------------------------------------------
  function resolve() {
    var raw = (location.hash || '#/').replace(/^#/, '');
    var parts = raw.split('/').filter(Boolean);

    if (!parts.length) return { name: 'home', html: viewHome };
    if (parts[0] === 'project' && parts[1]) {
      return { name: 'project', html: function () { return viewProject(parts[1]); } };
    }
    if (parts[0] === 'stills') return { name: 'stills', html: viewStills };
    if (parts[0] === 'about') return { name: 'about', html: viewAbout };
    return { name: 'missing', html: viewMissing };
  }

  var rendering = false;

  function render() {
    if (rendering) return;
    rendering = true;

    var route = resolve();
    var delay = reduceMotion ? 0 : 260;

    app.classList.add('is-leaving');

    setTimeout(function () {
      app.innerHTML = route.html();
      app.dataset.route = route.name;
      window.scrollTo(0, 0);

      app.classList.remove('is-leaving');
      app.classList.add('is-entering');

      wireUp();
      syncNav(route.name);

      requestAnimationFrame(function () {
        app.classList.remove('is-entering');
        rendering = false;
      });
    }, delay);
  }

  function syncNav(name) {
    var links = document.querySelectorAll('[data-nav]');
    for (var i = 0; i < links.length; i++) {
      links[i].classList.toggle('is-current', links[i].dataset.nav === name);
    }
  }

  // ---------------------------------------------------------------
  // Post-render wiring
  // ---------------------------------------------------------------
  function wireUp() {
    mountArt();
    mountReveals();
    mountMagnetic();
    mountLightbox();
    mountWave();
    mountPlayer();
    mountName();
  }

  // --- intro overlay ----------------------------------------------------
  // khangLE resolves into khxngLX, then the overlay lifts. The fade-out
  // itself is a CSS animation; this only fires the letter swap, allows an
  // early skip, and tidies up afterwards.
  var introRunning = false;

  function mountIntro() {
    var intro = document.getElementById('intro');
    if (!intro) return;

    if (reduceMotion) {
      intro.remove();
      return;
    }

    introRunning = true;
    document.body.classList.add('intro-open');

    var swapTimer = setTimeout(function () {
      intro.classList.add('is-artist');
    }, 1200);

    var endTimer = null;
    var done = false;
    var events = ['click', 'keydown', 'wheel', 'touchstart'];

    function finish() {
      if (done) return;
      done = true;
      clearTimeout(swapTimer);
      clearTimeout(endTimer);
      events.forEach(function (t) { window.removeEventListener(t, skip); });
      introRunning = false;
      document.body.classList.remove('intro-open');
      if (intro.parentNode) intro.parentNode.removeChild(intro);
    }

    function skip() {
      if (done) return;
      clearTimeout(swapTimer);
      // land on the artist name rather than cutting away mid-word
      intro.classList.add('is-artist');
      intro.classList.add('is-done');
      endTimer = setTimeout(finish, 480);
    }

    events.forEach(function (t) {
      window.addEventListener(t, skip, { passive: true });
    });

    // CSS clears it at 2.6s + 0.8s; clean up just after
    endTimer = setTimeout(finish, 3600);
  }

  // --- wordmark: khang le → khxngLX ------------------------------------
  // Lands on the given name, then becomes the artist name. Hovering it
  // turns it back, so the given name is always one gesture away.
  function mountName() {
    var mark = app.querySelector('#wordmark');
    if (!mark) return;

    var alt = app.querySelector('.hero__alt');
    var settled = false;

    function setArtist(on) {
      mark.classList.toggle('is-artist', on);
      if (alt) alt.classList.toggle('is-in', on);
    }

    if (introRunning) {
      // The intro is already telling this story. Don't run the same
      // morph a second time behind the overlay — hold the finished
      // state so the hero reads khxngLX the moment it lifts.
      settled = true;
      setArtist(true);
    } else {
      setTimeout(function () {
        settled = true;
        setArtist(true);
      }, reduceMotion ? 0 : 1400);
    }

    if (window.matchMedia('(hover: none), (pointer: coarse)').matches) return;

    // Listen on the two lines, not the h1 — the h1 spans the full page
    // width, so hovering it would fire with the pointer far from the
    // letters. Each .ln is width:max-content, so its box is the text.
    // A counter keeps the state steady while moving between the lines,
    // where leave on one fires before enter on the other.
    var lines = mark.querySelectorAll('.ln');
    var inside = 0;

    Array.prototype.forEach.call(lines, function (ln) {
      ln.addEventListener('mouseenter', function () {
        inside++;
        if (settled) setArtist(false);
      });

      ln.addEventListener('mouseleave', function () {
        inside = Math.max(0, inside - 1);
        if (settled && inside === 0) setArtist(true);
      });
    });
  }

  // --- artwork, generated only when it comes into view --------------
  function mountArt() {
    var holders = app.querySelectorAll('[data-art]');
    if (!holders.length) return;

    // No photo for this one — fall back to generated artwork.
    var generated = function (host, target) {
      var art = window.KLArt.make(host.dataset.art, 700);
      art.className = 'art';
      target.appendChild(art);
      host._art = art;
      requestAnimationFrame(function () { art.classList.add('is-in'); });
    };

    var build = function (host) {
      if (host.dataset.artDone) return;
      host.dataset.artDone = '1';

      var target = host.querySelector('.tile__art, .still__art') || host;
      var id = host.dataset.img;
      var media = window.KLMedia && id ? window.KLMedia.images[id] : null;

      if (!media) {
        generated(host, target);
        return;
      }

      // Blurred 24px placeholder sits behind until the real file lands,
      // so the tile is never an empty rectangle.
      target.style.backgroundImage = 'url("' + media.lqip + '")';

      var img = new Image();
      img.className = 'art';
      img.alt = host.dataset.alt || '';
      img.decoding = 'async';

      img.onload = function () {
        host._art = img;              // WebGL samples this
        img.classList.add('is-in');
      };

      img.onerror = function () {
        img.remove();
        target.style.backgroundImage = '';
        generated(host, target);      // missing file shouldn't leave a hole
      };

      img.src = window.KLMedia.base + (host.dataset.size || 'sm') + '/' + id + '.webp';
      target.appendChild(img);
    };

    if (!('IntersectionObserver' in window)) {
      Array.prototype.forEach.call(holders, build);
      return;
    }

    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) {
          build(e.target);
          io.unobserve(e.target);
        }
      });
    }, { rootMargin: '200px' });

    Array.prototype.forEach.call(holders, function (h) { io.observe(h); });
  }

  // --- reveal on scroll ---------------------------------------------
  function mountReveals() {
    var items = app.querySelectorAll('.reveal');
    if (!items.length) return;

    if (reduceMotion || !('IntersectionObserver' in window)) {
      Array.prototype.forEach.call(items, function (el) { el.classList.add('is-in'); });
      return;
    }

    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) {
          e.target.classList.add('is-in');
          io.unobserve(e.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });

    Array.prototype.forEach.call(items, function (el) { io.observe(el); });
  }

  // --- magnetic buttons ---------------------------------------------
  function mountMagnetic() {
    if (reduceMotion) return;
    if (window.matchMedia('(hover: none), (pointer: coarse)').matches) return;

    var targets = document.querySelectorAll('[data-magnetic]');

    Array.prototype.forEach.call(targets, function (el) {
      if (el.dataset.magWired) return;
      el.dataset.magWired = '1';

      el.addEventListener('mousemove', function (e) {
        var r = el.getBoundingClientRect();
        var mx = e.clientX - (r.left + r.width / 2);
        var my = e.clientY - (r.top + r.height / 2);
        el.style.transform = 'translate(' + mx * 0.32 + 'px,' + my * 0.32 + 'px)';
      });

      el.addEventListener('mouseleave', function () {
        el.style.transform = '';
      });
    });
  }

  // --- stills lightbox ----------------------------------------------
  function mountLightbox() {
    var stills = app.querySelectorAll('.still');
    if (!stills.length) return;

    var box = document.getElementById('lightbox');
    var stage = box.querySelector('.lightbox__stage');
    var cap = box.querySelector('.lightbox__caption');

    Array.prototype.forEach.call(stills, function (btn) {
      btn.addEventListener('click', function () {
        var id = btn.dataset.img;
        var media = window.KLMedia && id ? window.KLMedia.images[id] : null;

        stage.innerHTML = '';
        stage.classList.toggle('is-tall', !!media && media.orient === 'portrait');

        if (media) {
          stage.style.backgroundImage = 'url("' + media.lqip + '")';
          var img = new Image();
          img.className = 'art';
          img.alt = btn.dataset.name || '';
          img.onload = function () { img.classList.add('is-in'); };
          img.src = window.KLMedia.base + 'lg/' + id + '.webp';
          stage.appendChild(img);
        } else {
          stage.style.backgroundImage = '';
          var art = window.KLArt.make(btn.dataset.name, 1000);
          art.className = 'art is-in';
          stage.appendChild(art);
        }

        cap.textContent = btn.dataset.name;
        box.classList.add('is-open');
        box.setAttribute('aria-hidden', 'false');
      });
    });
  }

  function closeLightbox() {
    var box = document.getElementById('lightbox');
    box.classList.remove('is-open');
    box.setAttribute('aria-hidden', 'true');
  }

  // --- waveform accent ------------------------------------------------
  // Generative, not audio-reactive — there is no audio yet. It leans on
  // scroll speed so it feels connected to what you're doing.
  function mountWave() {
    var cv = app.querySelector('.wave');
    if (!cv) return;

    var ctx = cv.getContext('2d');
    var dpr = Math.min(window.devicePixelRatio || 1, 2);

    // Pull the accent from the stylesheet so the wave follows the palette
    // instead of carrying its own copy of the colour.
    var rootStyle = getComputedStyle(document.documentElement);
    var accent = (rootStyle.getPropertyValue('--accent-rgb') || '255,77,92').trim();
    var w = 0, h = 0;
    var energy = 0;
    var lastY = window.scrollY;
    var alive = true;

    function size() {
      var r = cv.getBoundingClientRect();
      w = Math.max(1, Math.round(r.width));
      h = Math.max(1, Math.round(r.height));
      cv.width = w * dpr;
      cv.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    size();
    window.addEventListener('resize', size);

    window.addEventListener('scroll', function () {
      energy = Math.min(1, energy + Math.abs(window.scrollY - lastY) / 220);
      lastY = window.scrollY;
    }, { passive: true });

    function frame(t) {
      if (!alive || !cv.isConnected) return;

      energy *= 0.94;
      ctx.clearRect(0, 0, w, h);

      var mid = h / 2;
      var amp = h * (0.16 + energy * 0.4);
      var time = t / 1000;

      for (var pass = 0; pass < 2; pass++) {
        ctx.beginPath();
        for (var x = 0; x <= w; x += 3) {
          var n = x / w;
          var y =
            Math.sin(n * 9 + time * (1.1 + pass * 0.4)) * 0.5 +
            Math.sin(n * 21 - time * (0.7 + pass * 0.3)) * 0.3 +
            Math.sin(n * 41 + time * 1.7) * 0.2;
          var env = Math.sin(n * Math.PI); // taper at both ends
          var py = mid + y * amp * env * (pass ? 0.55 : 1);
          if (x === 0) ctx.moveTo(x, py);
          else ctx.lineTo(x, py);
        }
        ctx.strokeStyle = pass
          ? 'rgba(' + accent + ',' + (0.16 + energy * 0.24) + ')'
          : 'rgba(233,230,224,' + (0.20 + energy * 0.35) + ')';
        ctx.lineWidth = pass ? 1 : 1.2;
        ctx.stroke();
      }

      requestAnimationFrame(frame);
    }

    requestAnimationFrame(frame);
  }

  // --- fake transport on project pages --------------------------------
  function mountPlayer() {
    var btn = app.querySelector('.player__btn');
    if (!btn) return;

    btn.addEventListener('click', function () {
      var host = btn.closest('.player');
      var on = host.classList.toggle('is-playing');
      btn.innerHTML = on ? '&#10073;&#10073;' : '&#9654;';
      btn.setAttribute('aria-label', on ? 'pause preview' : 'play preview');
    });
  }

  // ---------------------------------------------------------------
  // Tile hover → WebGL
  // ---------------------------------------------------------------
  function mountGL() {
    if (!ENABLE_GL) return;
    if (window.matchMedia('(hover: none), (pointer: coarse)').matches) return;
    if (!window.KLGL || !window.KLGL.init()) return;

    document.addEventListener('mouseover', function (e) {
      var tile = e.target.closest && e.target.closest('.tile, .project__art');
      if (!tile || !tile._art) return;
      window.KLGL.attach(tile, tile._art);
    }, true);

    document.addEventListener('mouseout', function (e) {
      var tile = e.target.closest && e.target.closest('.tile, .project__art');
      if (!tile) return;
      if (e.relatedTarget && tile.contains(e.relatedTarget)) return;
      window.KLGL.release(tile);
    }, true);

    document.addEventListener('mousemove', function (e) {
      window.KLGL.setMouse(e.clientX, e.clientY);
    }, { passive: true });
  }

  // ---------------------------------------------------------------
  // Boot
  // ---------------------------------------------------------------
  function boot() {
    app = document.getElementById('app');
    if (!app) return;

    if (!location.hash) location.replace('#/');

    window.addEventListener('hashchange', render);

    var box = document.getElementById('lightbox');
    box.addEventListener('click', function (e) {
      if (e.target === box || e.target.closest('.lightbox__close')) closeLightbox();
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') closeLightbox();
    });

    // year in the footer
    var y = document.getElementById('year');
    if (y) y.textContent = new Date().getFullYear();

    mountIntro();
    mountGL();
    render();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
