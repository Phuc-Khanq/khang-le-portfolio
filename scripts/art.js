/* ============================================================
   Procedural cover art — khang le
   ------------------------------------------------------------
   Every project gets its own artwork, generated from its title
   so the same project always looks the same. Dark, atmospheric,
   one hue per piece.

   This is scaffolding: when real cover art exists, give the
   project an `image` field in app.js and this is bypassed.
   ============================================================ */

window.KLArt = (function () {
  'use strict';

  // --- deterministic randomness -------------------------------------
  function hashString(str) {
    var h = 2166136261;
    for (var i = 0; i < str.length; i++) {
      h ^= str.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    return h >>> 0;
  }

  function mulberry32(seed) {
    return function () {
      seed |= 0;
      seed = (seed + 0x6d2b79f5) | 0;
      var t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  // --- a small noise tile, built once and reused ---------------------
  var noiseTile = null;

  function getNoiseTile() {
    if (noiseTile) return noiseTile;

    var n = document.createElement('canvas');
    n.width = n.height = 128;
    var nx = n.getContext('2d');
    var img = nx.createImageData(128, 128);
    var d = img.data;

    for (var i = 0; i < d.length; i += 4) {
      var v = (Math.random() * 255) | 0;
      d[i] = d[i + 1] = d[i + 2] = v;
      d[i + 3] = 22; // barely there — grain, not static
    }

    nx.putImageData(img, 0, 0);
    noiseTile = n;
    return n;
  }

  /**
   * Build one cover. Returns a canvas you can draw or upload as a texture.
   * @param {string} seedStr  project title — same title, same art
   * @param {number} size     square edge in px
   */
  function make(seedStr, size) {
    size = size || 700;

    var rand = mulberry32(hashString(seedStr));
    var c = document.createElement('canvas');
    c.width = c.height = size;
    var ctx = c.getContext('2d');

    // Base — never pure black, so the grain has something to sit on.
    ctx.fillStyle = '#0a0a0b';
    ctx.fillRect(0, 0, size, size);

    // One hue per piece, kept in a narrow moody band and desaturated.
    var baseHue = Math.floor(rand() * 360);
    var hues = [baseHue, (baseHue + 28) % 360, (baseHue + 330) % 360];

    // Soft light sources, blended additively so they pool where they overlap.
    ctx.globalCompositeOperation = 'lighter';

    for (var i = 0; i < 3; i++) {
      var cx = size * (0.2 + rand() * 0.6);
      var cy = size * (0.2 + rand() * 0.6);
      var r = size * (0.35 + rand() * 0.45);
      var hue = hues[i];
      var sat = 30 + rand() * 30;
      var light = 22 + rand() * 20;

      var g = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
      g.addColorStop(0, 'hsla(' + hue + ',' + sat + '%,' + light + '%,0.85)');
      g.addColorStop(0.5, 'hsla(' + hue + ',' + sat + '%,' + light * 0.55 + '%,0.35)');
      g.addColorStop(1, 'hsla(' + hue + ',' + sat + '%,4%,0)');

      ctx.fillStyle = g;
      ctx.fillRect(0, 0, size, size);
    }

    // A couple of drifting bands — gives the square a sense of direction.
    ctx.globalCompositeOperation = 'overlay';
    var bands = 2 + Math.floor(rand() * 2);

    for (var b = 0; b < bands; b++) {
      ctx.save();
      ctx.translate(size / 2, size / 2);
      ctx.rotate((rand() - 0.5) * Math.PI);
      var bw = size * (0.9 + rand() * 0.6);
      var bh = size * (0.02 + rand() * 0.07);
      var bg = ctx.createLinearGradient(-bw / 2, 0, bw / 2, 0);
      bg.addColorStop(0, 'hsla(' + hues[b % 3] + ',40%,50%,0)');
      bg.addColorStop(0.5, 'hsla(' + hues[b % 3] + ',40%,60%,0.5)');
      bg.addColorStop(1, 'hsla(' + hues[b % 3] + ',40%,50%,0)');
      ctx.fillStyle = bg;
      ctx.fillRect(-bw / 2, -bh / 2 + (rand() - 0.5) * size * 0.5, bw, bh);
      ctx.restore();
    }

    // Grain.
    ctx.globalCompositeOperation = 'overlay';
    var tile = ctx.createPattern(getNoiseTile(), 'repeat');
    ctx.fillStyle = tile;
    ctx.fillRect(0, 0, size, size);

    // Vignette, so tiles read as separate objects against the page.
    ctx.globalCompositeOperation = 'source-over';
    var vg = ctx.createRadialGradient(
      size / 2, size / 2, size * 0.25,
      size / 2, size / 2, size * 0.78
    );
    vg.addColorStop(0, 'rgba(0,0,0,0)');
    vg.addColorStop(1, 'rgba(0,0,0,0.72)');
    ctx.fillStyle = vg;
    ctx.fillRect(0, 0, size, size);

    return c;
  }

  return { make: make };
})();
