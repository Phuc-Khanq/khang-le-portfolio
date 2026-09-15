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
  // Everything below comes from content.json, via scripts/content.js
  // which the build generates. To change any of it: edit content.json
  // and run `npm run build`. Nothing here needs touching.
  // ---------------------------------------------------------------
  var C = window.KLContent || {};
  var SITE = C.site || {};
  var HERO = C.hero || {};
  var ABOUT = C.about || {};
  var PROJECTS = Array.isArray(C.projects) ? C.projects : [];
  var STILLS = Array.isArray(C.stills) ? C.stills : [];
  var MARQUEE = Array.isArray(C.marquee) ? C.marquee : [];
  var LINKS = Array.isArray(C.links) ? C.links : [];
  var MERCH = C.merch || {};


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

  /** Prices are plain numbers in content.json; the symbol lives in shop. */
  function money(n) {
    if (typeof n !== 'number') return 'price tbd';
    var cur = (MERCH.shop && MERCH.shop.currency) || '$';
    return cur + n.toFixed(2);
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

    var l1 = HERO.lineOne || { from: '', to: '' };
    var l2 = HERO.lineTwo || { from: '', to: '' };

    // One group of words, repeated. The track slides by -50%, so the
    // content has to repeat evenly for the loop to be seamless.
    var group = MARQUEE.map(function (word) {
      return '<span>' + esc(word) + '</span><span>&middot;</span>';
    }).join('');
    var track = group + group + group + group;

    // Fills the empty space to the right of the wordmark. Goes through
    // the usual image pipeline, so it gets the blurred placeholder and
    // the fade-in. No portrait in content and the name takes the width.
    var heroShot = HERO.portrait
      ? '<div class="hero__portrait reveal" data-art="portrait"' +
        ' data-img="' + esc(HERO.portrait) + '" data-size="lg"' +
        ' data-alt="' + esc(SITE.artistName || 'portrait') + '"></div>'
      : '';

    return [
      '<section class="hero">',
      '  <div class="hero__main">',
      '    <div class="hero__text">',
      '      <p class="hero__eyebrow reveal">' + esc(HERO.eyebrow || '') + '</p>',
      '      <h1 class="hero__title reveal" id="wordmark" aria-label="' +
             esc((SITE.artistName || '') + ' — ' + (SITE.givenName || '')) + '">',
      '        <span class="ln" aria-hidden="true">' + glyphs(l1.from, l1.to) + '</span>',
      '        <span class="ln ln--outline" aria-hidden="true">' + glyphs(l2.from, l2.to) + '</span>',
      '      </h1>',
      '      <p class="hero__alt" aria-hidden="true">' + esc(SITE.givenName || '') + '</p>',
      '      <p class="hero__line reveal">' + esc(HERO.statement || '') + '</p>',
      '    </div>',
      heroShot,
      '  </div>',
      '  <canvas class="wave" aria-hidden="true"></canvas>',
      '</section>',

      '<div class="marquee" aria-hidden="true"><div class="marquee__track">',
      track,
      '</div></div>',

      '<section class="work">',
      '  <header class="sec-head reveal"><h2>work</h2><span>' + PROJECTS.length +
         (PROJECTS.length === 1 ? ' piece' : ' pieces') + '</span></header>',
      // Plain grid by default. mountWall turns it into the pinned
      // horizontal track only when the browser can actually handle it,
      // so no JS or a touch screen still gets something sensible.
      '  <div class="wall">',
      '    <div class="wall__stage">',
      '      <div class="wall__track">' + tiles + '</div>',
      '    </div>',
      '  </div>',
      '</section>',

      viewSocial()
    ].join('');
  }

  // --- social list -------------------------------------------------------
  function viewSocial() {
    var s = C.social || {};
    var items = Array.isArray(s.items) ? s.items : [];
    if (!items.length) return '';

    var live = items.filter(function (x) { return x && x.url; }).length;

    var rows = items.map(function (it, i) {
      var on = !!(it && it.url);
      var inner = [
        '<span class="social__name">' + esc(it.platform || '') + '</span>',
        '<span class="social__handle">' + esc(on ? (it.handle || '') : 'soon') + '</span>',
        '<span class="social__mark" aria-hidden="true">' + (on ? '&rarr;' : '') + '</span>'
      ].join('');

      // No url means no link — a dead anchor is worse than an honest row.
      return on
        ? '<li class="social__row reveal" style="--i:' + (i % 6) + '">' +
          '<a class="social__link" href="' + esc(it.url) + '"' +
          ' target="_blank" rel="noopener noreferrer">' + inner + '</a></li>'
        : '<li class="social__row is-soon reveal" style="--i:' + (i % 6) + '">' +
          '<span class="social__link">' + inner + '</span></li>';
    }).join('');

    return [
      '<section class="social">',
      '  <header class="sec-head reveal"><h2>' + esc(s.title || 'elsewhere') + '</h2>',
      '    <span>' + live + ' live</span></header>',
      '  <ul class="social__list">' + rows + '</ul>',
      '</section>'
    ].join('');
  }

  // --- horizontal project wall -------------------------------------------
  // Native scroll, one transform. The outer section is made tall enough to
  // act as a runway; a sticky stage pins for its duration and the track
  // slides left by exactly its own overflow.
  function mountWall() {
    var wall = app.querySelector('.wall');
    if (!wall) return;

    var stage = wall.querySelector('.wall__stage');
    var track = wall.querySelector('.wall__track');
    if (!stage || !track) return;

    var coarse = window.matchMedia('(hover: none), (pointer: coarse)').matches;
    if (coarse || reduceMotion) return;   // stays a normal grid

    wall.classList.add('is-pinned');

    var distance = 0;

    // A wheel notch scrolls the page 120px instantly, so mapping scroll to
    // transform 1:1 left the track still for five frames then jumping the
    // whole 120 at once — stuttery even at a steady 60fps. Instead the
    // track eases toward where the scroll says it should be, so every
    // frame moves a little. WALL_EASE is the dial: higher is tighter and
    // more literal, lower is floatier and lags further behind.
    var WALL_EASE = 0.11;
    var current = 0;
    var raf = null;

    function measure() {
      distance = Math.max(0, track.scrollWidth - window.innerWidth);
      // runway = one screen to pin, plus exactly the overflow to travel
      wall.style.height = (window.innerHeight + distance) + 'px';
      current = readTarget();
      draw();
      kick();
    }

    function readTarget() {
      if (distance <= 0) return 0;
      var top = wall.getBoundingClientRect().top;
      var progress = Math.min(1, Math.max(0, -top / distance));
      return -progress * distance;
    }

    function draw() {
      // sub-pixel on purpose — rounding to whole px reintroduces the steps
      track.style.transform = 'translate3d(' + current.toFixed(2) + 'px,0,0)';
    }

    function frame() {
      var diff = readTarget() - current;

      // Close enough: land exactly and stop the loop rather than burning
      // frames forever on a fraction of a pixel.
      if (Math.abs(diff) < 0.08) {
        current += diff;
        draw();
        raf = null;
        return;
      }

      current += diff * WALL_EASE;
      draw();
      raf = requestAnimationFrame(frame);
    }

    function kick() {
      if (raf === null) raf = requestAnimationFrame(frame);
    }

    window.addEventListener('scroll', kick, { passive: true });
    window.addEventListener('resize', measure);

    measure();

    // Scroll and resize are on window, so they outlive the DOM that
    // render() throws away. Without this, every trip back to the index
    // leaves another handler running against a detached element.
    teardowns.push(function () {
      window.removeEventListener('scroll', kick);
      window.removeEventListener('resize', measure);
      if (raf !== null) cancelAnimationFrame(raf);
    });
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
    var paras = (ABOUT.paragraphs || []).map(function (t) {
      return '<p class="reveal">' + esc(t) + '</p>';
    }).join('');

    var items = (ABOUT.highlights || []).map(function (h) {
      return '<li class="reveal"><b>' + esc(h.label || '') + '</b>' +
             '<span>' + esc(h.note || '') + '</span></li>';
    }).join('');

    var email = SITE.email || '';
    var phone = SITE.phone || '';

    // tel: wants digits, so strip the spaces people read by
    var tel = phone.replace(/[^\d+]/g, '');

    var row = [];
    if (phone) {
      row.push('<li><a href="tel:' + esc(tel) + '">' + esc(phone) + '</a></li>');
    }
    LINKS.forEach(function (l) {
      if (!l || !l.url) return;
      row.push('<li><a href="' + esc(l.url) + '" target="_blank" rel="noopener noreferrer">' +
               esc(l.label || l.url) + '</a></li>');
    });

    // Headshot goes through the same pipeline as everything else, so it
    // gets the blurred placeholder and the fade-in for free.
    var shot = ABOUT.headshot
      ? '<div class="about__portrait reveal" data-art="portrait"' +
        ' data-img="' + esc(ABOUT.headshot) + '" data-size="lg"' +
        ' data-alt="' + esc(SITE.artistName || 'portrait') + '"></div>'
      : '';

    return [
      '<section class="about">',
      '  <h1 class="about__title reveal">' + esc(ABOUT.title || '') + '</h1>',
      '  <p class="about__handle reveal">' + esc(ABOUT.handleLine || '') +
         ' <b>' + esc(SITE.artistName || '') + '</b></p>',
      '  <div class="about__cols">',
      shot,
      '    <div class="about__text">' + paras + '</div>',
      '  </div>',
      '  <ul class="about__list">' + items + '</ul>',
      viewResume(),
      email
        ? '  <a class="contact reveal" href="mailto:' + esc(email) + '">' + esc(email) + '</a>'
        : '',
      row.length ? '  <ul class="links reveal">' + row.join('') + '</ul>' : '',
      '</section>'
    ].join('');
  }

  // --- resume ------------------------------------------------------------
  // A section with "from": "projects" builds itself from the projects list,
  // so a release never has to be typed in two places.
  // Four fields per entry, all optional: period sits in the left column,
  // subtitle tucks under the title, detail runs down the right.
  function resumeRows(section) {
    var entries = section.from === 'projects'
      ? PROJECTS.map(function (p) {
          return {
            period: p.year || '',
            title: p.title || '',
            subtitle: p.status || '',
            detail: p.role || ''
          };
        })
      : (section.entries || []);

    return entries.map(function (e) {
      var main = '<span class="cv__title">' + esc(e.title || '') + '</span>';
      if (e.subtitle) {
        main += '<span class="cv__subtitle">' + esc(e.subtitle) + '</span>';
      }

      return [
        '<li class="cv__row">',
        '<span class="cv__period">' + esc(e.period || '') + '</span>',
        '<span class="cv__main">' + main + '</span>',
        '<span class="cv__detail">' + esc(e.detail || '') + '</span>',
        '</li>'
      ].join('');
    }).join('');
  }

  function viewResume() {
    var cv = C.resume || {};
    var sections = (cv.sections || []).map(function (s) {
      var rows = resumeRows(s);
      if (!rows) return '';
      return [
        '<div class="cv__group">',
        '<h3 class="cv__heading">' + esc(s.title || '') + '</h3>',
        s.text ? '<p class="cv__text">' + esc(s.text) + '</p>' : '',
        '<ul class="cv__list">' + rows + '</ul>',
        '</div>'
      ].join('');
    }).join('');

    if (!sections) return '';

    // expandable: false leaves it open, with no button at all
    if (cv.expandable === false) {
      return [
        '<div class="resume resume--open reveal">',
        '  <h2 class="resume__label resume__label--static">' + esc(cv.label || 'resume') + '</h2>',
        '  <div class="resume__inner">' + sections + '</div>',
        '</div>'
      ].join('');
    }

    return [
      '<div class="resume reveal">',
      '  <button class="resume__toggle" type="button" aria-expanded="false" aria-controls="cv">',
      '    <span class="resume__label">' + esc(cv.label || 'resume') + '</span>',
      '    <span class="resume__sign" aria-hidden="true"></span>',
      '  </button>',
      '  <div class="resume__body" id="cv">',
      '    <div class="resume__inner">' + sections + '</div>',
      '  </div>',
      '</div>'
    ].join('');
  }

  function mountResume() {
    var box = app.querySelector('.resume');
    if (!box) return;

    var btn = box.querySelector('.resume__toggle');
    btn.addEventListener('click', function () {
      var open = box.classList.toggle('is-open');
      btn.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
  }

  // --- merch -------------------------------------------------------------
  function viewMerch() {
    var cats = Array.isArray(MERCH.categories) ? MERCH.categories : [];
    var items = Array.isArray(MERCH.featured) ? MERCH.featured : [];
    var catchAll = cats[0] || 'all';

    var bars = cats.map(function (cat, i) {
      return '<button class="bar' + (i === 0 ? ' is-on' : '') + '" type="button"' +
             ' data-cat="' + esc(cat) + '"' +
             ' aria-pressed="' + (i === 0 ? 'true' : 'false') + '">' +
             esc(cat) + '</button>';
    }).join('');

    var cards = items.map(function (p, i) {
      var buyable = p.available === true;

      var buy = buyable
        ? [
            '  <div class="buy">',
            '    <div class="qty" role="group" aria-label="quantity">',
            '      <button class="qty__btn" type="button" data-step="-1" aria-label="one fewer">&minus;</button>',
            '      <input class="qty__n" type="text" inputmode="numeric" value="1"',
            '             aria-label="quantity for ' + esc(p.name || '') + '">',
            '      <button class="qty__btn" type="button" data-step="1" aria-label="one more">+</button>',
            '    </div>',
            '    <button class="btn-add" type="button" data-add="' + esc(p.id || '') + '">add to cart</button>',
            '  </div>'
          ].join('')
        : '  <p class="mitem__soon">' + esc(p.status || 'not available yet') + '</p>';

      return [
        '<article class="mitem reveal" data-cat="' + esc(p.category || '') + '"',
        '         data-id="' + esc(p.id || '') + '" style="--i:' + i + '">',
        '  <div class="mitem__art" data-art="' + esc(p.name || 'merch') + '"',
        '       data-img="' + esc(p.img || '') + '"',
        '       data-alt="' + esc(p.name || '') + '"></div>',
        '  <div class="mitem__meta">',
        '    <span class="mitem__cat">' + esc(p.category || '') + '</span>',
        '    <h3 class="mitem__name">' + esc(p.name || '') + '</h3>',
        p.meta ? '    <p class="mitem__spec">' + esc(p.meta) + '</p>' : '',
        '    <p class="mitem__price">' + esc(money(p.price)) + '</p>',
        '  </div>',
        buy,
        '</article>'
      ].join('');
    }).join('');

    return [
      '<section class="merch">',
      '  <header class="merch__head">',
      '    <h1 class="merch__season reveal">' + esc(MERCH.season || '') + '</h1>',
      MERCH.note ? '    <p class="merch__note reveal">' + esc(MERCH.note) + '</p>' : '',
      '  </header>',
      cats.length
        ? '  <nav class="bars reveal" aria-label="product categories" data-all="' +
          esc(catchAll) + '">' + bars + '</nav>'
        : '',
      '  <header class="sec-head reveal"><h2>best sellers</h2><span>' +
         items.length + (items.length === 1 ? ' piece' : ' pieces') + '</span></header>',
      '  <div class="mgrid">' + cards + '</div>',
      '  <p class="merch__empty" hidden>nothing here yet.</p>',
      '</section>'
    ].join('');
  }

  // Shared by the merch cards and the cart page.
  function mountQtySteppers(scope) {
    var groups = scope.querySelectorAll('.qty');

    Array.prototype.forEach.call(groups, function (group) {
      var input = group.querySelector('.qty__n');
      if (!input) return;

      var clamp = function (n) { return Math.max(1, Math.min(99, n || 1)); };

      group.addEventListener('click', function (e) {
        var btn = e.target.closest('.qty__btn');
        if (!btn) return;
        input.value = clamp(parseInt(input.value, 10) + Number(btn.dataset.step));
        input.dispatchEvent(new Event('change', { bubbles: true }));
      });

      // typing is allowed, nonsense is not
      input.addEventListener('change', function () {
        input.value = clamp(parseInt(input.value, 10));
      });
    });
  }

  function mountMerch() {
    // add-to-cart lives on the merch grid
    var grid = app.querySelector('.mgrid');
    if (grid) {
      mountQtySteppers(grid);

      grid.addEventListener('click', function (e) {
        var btn = e.target.closest('[data-add]');
        if (!btn) return;

        var card = btn.closest('.mitem');
        var input = card && card.querySelector('.qty__n');
        var qty = input ? parseInt(input.value, 10) || 1 : 1;

        window.KLCart.add(btn.dataset.add, qty);

        // brief confirmation, so it's obvious something happened
        btn.classList.add('is-added');
        btn.textContent = 'added';
        setTimeout(function () {
          btn.classList.remove('is-added');
          btn.textContent = 'add to cart';
        }, 1200);
      });
    }

    var nav = app.querySelector('.bars');
    if (!nav) return;

    var catchAll = nav.dataset.all;
    var bars = nav.querySelectorAll('.bar');
    var items = app.querySelectorAll('.mitem');
    var empty = app.querySelector('.merch__empty');

    Array.prototype.forEach.call(bars, function (bar) {
      bar.addEventListener('click', function () {
        var cat = bar.dataset.cat;

        Array.prototype.forEach.call(bars, function (b) {
          var on = b === bar;
          b.classList.toggle('is-on', on);
          b.setAttribute('aria-pressed', on ? 'true' : 'false');
        });

        var shown = 0;
        Array.prototype.forEach.call(items, function (it) {
          var match = cat === catchAll || it.dataset.cat === cat;
          it.hidden = !match;
          if (match) shown++;
        });

        if (empty) empty.hidden = shown > 0;
      });
    });
  }

  // --- cart --------------------------------------------------------------
  function viewCart() {
    var cart = window.KLCart;
    var lines = cart ? cart.lines() : [];
    var shop = MERCH.shop || {};

    if (!lines.length) {
      return [
        '<section class="cart">',
        '  <h1 class="cart__title reveal">cart</h1>',
        '  <p class="cart__empty reveal">Nothing in here yet.</p>',
        '  <a class="btn-line reveal" href="#/merch">back to merch</a>',
        '</section>'
      ].join('');
    }

    var rows = lines.map(function (l) {
      var p = l.product;
      var name = p ? p.name : 'no longer available';

      return [
        '<li class="line" data-line="' + esc(l.id) + '">',
        '  <div class="line__art" data-art="' + esc(name) + '"',
        '       data-img="' + esc((p && p.img) || '') + '" data-alt="' + esc(name) + '"></div>',
        '  <div class="line__meta">',
        '    <h3 class="line__name">' + esc(name) + '</h3>',
        p && p.meta ? '    <p class="line__spec">' + esc(p.meta) + '</p>' : '',
        '    <p class="line__unit">' + esc(money(l.price)) + ' each</p>',
        '  </div>',
        '  <div class="qty" role="group" aria-label="quantity">',
        '    <button class="qty__btn" type="button" data-step="-1" aria-label="one fewer">&minus;</button>',
        '    <input class="qty__n" type="text" inputmode="numeric" value="' + l.qty + '"',
        '           aria-label="quantity for ' + esc(name) + '">',
        '    <button class="qty__btn" type="button" data-step="1" aria-label="one more">+</button>',
        '  </div>',
        '  <p class="line__total">' + esc(l.total === null ? '—' : money(l.total)) + '</p>',
        '  <button class="line__rm" type="button" data-remove="' + esc(l.id) + '"',
        '          aria-label="remove ' + esc(name) + '">&times;</button>',
        '</li>'
      ].join('');
    }).join('');

    var unpriced = cart.hasUnpriced();

    return [
      '<section class="cart">',
      '  <h1 class="cart__title reveal">cart</h1>',
      '  <ul class="cart__lines">' + rows + '</ul>',
      '  <div class="cart__foot reveal">',
      '    <div class="cart__sum">',
      '      <span>subtotal</span>',
      '      <strong>' + esc(money(cart.subtotal())) + '</strong>',
      '    </div>',
      unpriced
        ? '    <p class="cart__warn">Some items aren&rsquo;t priced yet, so this total is incomplete.</p>'
        : '    <p class="cart__warn">Shipping and tax are worked out at checkout.</p>',
      '    <div class="cart__acts">',
      '      <a class="btn-line" href="#/merch">keep looking</a>',
      '      <a class="btn-solid" href="#/checkout">checkout</a>',
      '    </div>',
      '  </div>',
      '</section>'
    ].join('');
  }

  // --- checkout ----------------------------------------------------------
  // Deliberately no name, address, or card fields. This site is static
  // files with no server behind it — anything typed here would have
  // nowhere to go. The handoff below is where a real processor takes over,
  // collects those details on its own secure pages, and sends the receipt.
  function viewCheckout() {
    var cart = window.KLCart;
    var lines = cart ? cart.lines() : [];
    var shop = MERCH.shop || {};

    if (!lines.length) {
      return [
        '<section class="cart">',
        '  <h1 class="cart__title reveal">checkout</h1>',
        '  <p class="cart__empty reveal">There&rsquo;s nothing to check out.</p>',
        '  <a class="btn-line reveal" href="#/merch">back to merch</a>',
        '</section>'
      ].join('');
    }

    var rows = lines.map(function (l) {
      var name = l.product ? l.product.name : 'no longer available';
      return [
        '<li class="review__row">',
        '<span class="review__qty">' + l.qty + '&times;</span>',
        '<span class="review__name">' + esc(name) + '</span>',
        '<span class="review__total">' + esc(l.total === null ? '—' : money(l.total)) + '</span>',
        '</li>'
      ].join('');
    }).join('');

    var canPay = shop.open === true && !!shop.checkoutUrl;

    var handoff = canPay
      ? '<a class="btn-solid" href="' + esc(shop.checkoutUrl) + '"' +
        ' target="_blank" rel="noopener noreferrer">continue to payment</a>'
      : [
          '<div class="notopen">',
          '  <p>' + esc(shop.closedNote || 'The shop isn’t open yet.') + '</p>',
          '</div>'
        ].join('');

    return [
      '<section class="cart">',
      '  <h1 class="cart__title reveal">checkout</h1>',
      '  <p class="cart__lead reveal">Check the order, then payment and delivery details ' +
         'are handled on the payment provider&rsquo;s own secure pages.</p>',
      '  <ul class="review reveal">' + rows + '</ul>',
      '  <div class="review__sum reveal">',
      '    <span>subtotal</span><strong>' + esc(money(cart.subtotal())) + '</strong>',
      '  </div>',
      '  <div class="cart__acts reveal">',
      '    <a class="btn-line" href="#/cart">back to cart</a>',
      handoff,
      '  </div>',
      '</section>'
    ].join('');
  }

  function refreshCart() {
    if (app.dataset.route !== 'cart') return;
    app.innerHTML = viewCart();
    wireUp();
    // already on screen — don't replay the entrance animation
    Array.prototype.forEach.call(app.querySelectorAll('.reveal'), function (el) {
      el.classList.add('is-in');
    });
  }

  function mountCart() {
    var box = app.querySelector('.cart');
    if (!box || !window.KLCart) return;

    mountQtySteppers(box);

    box.addEventListener('click', function (e) {
      var rm = e.target.closest('[data-remove]');
      if (!rm) return;
      window.KLCart.remove(rm.dataset.remove);
      refreshCart();
    });

    box.addEventListener('change', function (e) {
      var input = e.target.closest('.qty__n');
      if (!input) return;
      var line = input.closest('[data-line]');
      if (!line) return;
      window.KLCart.setQty(line.dataset.line, input.value);
      refreshCart();
    });
  }

  function mountCartBadge() {
    var badge = document.querySelector('[data-cart-count]');
    if (!badge || !window.KLCart) return;

    window.KLCart.subscribe(function (lines, count) {
      badge.textContent = count;
      badge.hidden = count === 0;
    });
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
    if (parts[0] === 'merch') return { name: 'merch', html: viewMerch };
    if (parts[0] === 'cart') return { name: 'cart', html: viewCart };
    if (parts[0] === 'checkout') return { name: 'checkout', html: viewCheckout };
    if (parts[0] === 'about') return { name: 'about', html: viewAbout };
    return { name: 'missing', html: viewMissing };
  }

  var rendering = false;

  // Anything a view attaches outside #app has to be removed when that view
  // goes away — window listeners survive innerHTML being replaced.
  var teardowns = [];

  function cleanUp() {
    while (teardowns.length) {
      try { teardowns.pop()(); } catch (e) {}
    }
  }

  function render() {
    if (rendering) return;
    rendering = true;

    var route = resolve();
    var delay = reduceMotion ? 0 : 260;

    app.classList.add('is-leaving');

    setTimeout(function () {
      cleanUp();
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
    mountResume();
    mountMerch();
    mountCart();
    mountWall();
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

    Array.prototype.forEach.call(holders, function (h) {
      // Tiles in the horizontal track start translated off to the right,
      // so the observer wouldn't fire until they slide in and you'd watch
      // them load one at a time. Ten small files — just fetch them.
      if (h.closest && h.closest('.wall__track')) {
        build(h);
        return;
      }
      io.observe(h);
    });
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
    mountCartBadge();
    mountGL();
    render();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
