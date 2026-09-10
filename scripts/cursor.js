/* ============================================================
   Custom cursor — khang le
   ------------------------------------------------------------
   A dot that tracks the mouse exactly, plus a ring that eases
   in behind it. The system pointer is hidden in CSS
   (cursor: none) so this never flips back to the arrow or the
   hand — not on buttons, not on links, not while clicking.

   Nothing here calls preventDefault(), so every link, button
   and form keeps working normally.
   ============================================================ */

(function () {
  'use strict';

  // No mouse? No follower. Touch users get their normal cursor back.
  if (window.matchMedia('(hover: none), (pointer: coarse)').matches) return;

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Elements that should make the ring swell.
  var HOVER_SELECTOR = 'a, button, [role="button"], .project-card, .btn, label, summary';
  // Elements that should turn the ring into a text bar.
  var TEXT_SELECTOR = 'input, textarea, [contenteditable="true"]';

  var dot = document.createElement('div');
  var ring = document.createElement('div');
  dot.className = 'kl-dot';
  ring.className = 'kl-ring';
  dot.setAttribute('aria-hidden', 'true');
  ring.setAttribute('aria-hidden', 'true');

  function mount() {
    document.body.appendChild(ring);
    document.body.appendChild(dot);
  }

  if (document.body) {
    mount();
  } else {
    document.addEventListener('DOMContentLoaded', mount);
  }

  // Live mouse position, and the ring's eased position chasing it.
  var mouseX = -100;
  var mouseY = -100;
  var ringX = -100;
  var ringY = -100;
  var started = false;

  // Half-sizes, so the shapes stay centred on the pointer.
  var DOT_HALF = 3.5;
  var RING_HALF = 18;

  document.addEventListener(
    'mousemove',
    function (e) {
      mouseX = e.clientX;
      mouseY = e.clientY;

      // First real movement: drop the ring onto the pointer instead of
      // letting it fly in from the corner.
      if (!started) {
        started = true;
        ringX = mouseX;
        ringY = mouseY;
      }

      dot.style.transform =
        'translate3d(' + (mouseX - DOT_HALF) + 'px,' + (mouseY - DOT_HALF) + 'px,0)';
    },
    { passive: true }
  );

  // Ring easing loop. A lower factor = longer trail.
  var EASE = reduceMotion ? 1 : 0.19;

  function tick() {
    ringX += (mouseX - ringX) * EASE;
    ringY += (mouseY - ringY) * EASE;

    ring.style.transform =
      'translate3d(' + (ringX - RING_HALF) + 'px,' + (ringY - RING_HALF) + 'px,0)';

    requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);

  // ---- hover / text states -------------------------------------------
  function applyState(node) {
    var isText = false;
    var isHover = false;

    if (node && node.nodeType === 1 && node.closest) {
      isText = !!node.closest(TEXT_SELECTOR);
      isHover = !isText && !!node.closest(HOVER_SELECTOR);
    }

    ring.classList.toggle('is-text', isText);
    dot.classList.toggle('is-text', isText);
    ring.classList.toggle('is-hover', isHover);
    dot.classList.toggle('is-hover', isHover);
  }

  // Delegated, so cards and links added later still work.
  document.addEventListener(
    'mouseover',
    function (e) {
      applyState(e.target);
    },
    true
  );

  // The project cards move under the pointer while you scroll (parallax),
  // so a stationary mouse can end up over a different element without any
  // mouseover firing. Re-check what's actually under the pointer on scroll.
  var scrollQueued = false;
  window.addEventListener(
    'scroll',
    function () {
      if (scrollQueued || !started) return;
      scrollQueued = true;

      requestAnimationFrame(function () {
        scrollQueued = false;
        applyState(document.elementFromPoint(mouseX, mouseY));
      });
    },
    { passive: true }
  );

  // ---- pressed state --------------------------------------------------
  document.addEventListener('mousedown', function () {
    ring.classList.add('is-down');
  });

  document.addEventListener('mouseup', function () {
    ring.classList.remove('is-down');
  });

  // ---- hide when the mouse leaves the window --------------------------
  document.addEventListener('mouseleave', function () {
    dot.classList.add('is-hidden');
    ring.classList.add('is-hidden');
  });

  document.addEventListener('mouseenter', function () {
    dot.classList.remove('is-hidden');
    ring.classList.remove('is-hidden');
  });

  // Dragging out of the window can strand the pressed state.
  window.addEventListener('blur', function () {
    ring.classList.remove('is-down');
  });
})();
