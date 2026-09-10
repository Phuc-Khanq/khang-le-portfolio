/* ============================================================
   WebGL hover distortion — khang le
   ------------------------------------------------------------
   One shared WebGL canvas. When you hover a tile it parks itself
   over that tile, takes the tile's artwork as a texture, and
   renders it with a ripple that follows the pointer plus a touch
   of chromatic aberration.

   One context, not one per tile — browsers cap live WebGL
   contexts, and ten of them would be wasteful anyway.

   If WebGL is missing or the context is lost, everything here
   quietly no-ops and the plain CSS hover still carries the page.
   ============================================================ */

window.KLGL = (function () {
  'use strict';

  var VERT = [
    'attribute vec2 aPos;',
    'varying vec2 vUv;',
    'void main() {',
    '  vUv = aPos * 0.5 + 0.5;',
    '  vUv.y = 1.0 - vUv.y;',
    '  gl_Position = vec4(aPos, 0.0, 1.0);',
    '}'
  ].join('\n');

  var FRAG = [
    'precision mediump float;',
    'uniform sampler2D uTex;',
    'uniform vec2  uMouse;',
    'uniform float uTime;',
    'uniform float uHover;',
    'varying vec2 vUv;',
    'void main() {',
    '  vec2 uv = vUv;',
    '  vec2 d = uv - uMouse;',
    '  float dist = length(d);',
    // ring travelling out from the pointer, dying off with distance
    '  float ripple = sin(dist * 22.0 - uTime * 3.2) * exp(-dist * 5.0) * 0.028 * uHover;',
    '  uv += normalize(d + vec2(0.0001)) * ripple;',
    // pull the channels apart very slightly, strongest near the pointer
    '  float ca = 0.005 * uHover * exp(-dist * 3.0);',
    '  float r = texture2D(uTex, uv + vec2(ca, 0.0)).r;',
    '  float g = texture2D(uTex, uv).g;',
    '  float b = texture2D(uTex, uv - vec2(ca, 0.0)).b;',
    // lift a touch on hover so the hovered tile reads as active
    '  vec3 col = vec3(r, g, b) * (1.0 + 0.14 * uHover);',
    '  gl_FragColor = vec4(col, 1.0);',
    '}'
  ].join('\n');

  var canvas = null;
  var gl = null;
  var prog = null;
  var uni = {};
  var tex = null;
  var ok = false;

  var activeEl = null;       // tile currently hovered
  var mouse = { x: 0.5, y: 0.5 };
  var hover = 0;             // eased 0..1
  var targetHover = 0;
  var start = performance.now();

  function compile(type, src) {
    var s = gl.createShader(type);
    gl.shaderSource(s, src);
    gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
      gl.deleteShader(s);
      return null;
    }
    return s;
  }

  function init() {
    if (canvas) return ok;

    canvas = document.createElement('canvas');
    canvas.className = 'kl-gl';
    canvas.setAttribute('aria-hidden', 'true');

    try {
      gl =
        canvas.getContext('webgl', { antialias: false, alpha: false }) ||
        canvas.getContext('experimental-webgl', { antialias: false, alpha: false });
    } catch (e) {
      gl = null;
    }

    if (!gl) return (ok = false);

    var vs = compile(gl.VERTEX_SHADER, VERT);
    var fs = compile(gl.FRAGMENT_SHADER, FRAG);
    if (!vs || !fs) return (ok = false);

    prog = gl.createProgram();
    gl.attachShader(prog, vs);
    gl.attachShader(prog, fs);
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) return (ok = false);

    gl.useProgram(prog);

    var buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]),
      gl.STATIC_DRAW
    );

    var loc = gl.getAttribLocation(prog, 'aPos');
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);

    uni.tex = gl.getUniformLocation(prog, 'uTex');
    uni.mouse = gl.getUniformLocation(prog, 'uMouse');
    uni.time = gl.getUniformLocation(prog, 'uTime');
    uni.hover = gl.getUniformLocation(prog, 'uHover');

    tex = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, tex);
    // NPOT-safe: clamp + linear, no mipmaps
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.uniform1i(uni.tex, 0);

    canvas.addEventListener('webglcontextlost', function (e) {
      e.preventDefault();
      ok = false;
      detach();
    });

    document.body.appendChild(canvas);
    ok = true;
    requestAnimationFrame(loop);
    return ok;
  }

  function detach() {
    activeEl = null;
    targetHover = 0;
    if (canvas) canvas.classList.remove('is-on');
  }

  /** Take over a tile. `source` is the canvas holding its artwork. */
  function attach(el, source) {
    if (!ok || !el || !source) return;

    activeEl = el;
    targetHover = 1;

    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, source);

    canvas.classList.add('is-on');
  }

  function release(el) {
    if (el && el !== activeEl) return;
    detach();
  }

  /** Pointer position in viewport px; converted to tile-local UV. */
  function setMouse(px, py) {
    if (!activeEl) return;
    var r = activeEl.getBoundingClientRect();
    if (!r.width || !r.height) return;
    mouse.x = (px - r.left) / r.width;
    mouse.y = 1 - (py - r.top) / r.height;
  }

  function loop() {
    if (!ok) return;

    hover += (targetHover - hover) * 0.12;

    if (activeEl) {
      var r = activeEl.getBoundingClientRect();
      var dpr = Math.min(window.devicePixelRatio || 1, 2);
      var w = Math.max(1, Math.round(r.width));
      var h = Math.max(1, Math.round(r.height));

      // Follow the tile — the grid moves under the pointer as you scroll.
      canvas.style.transform = 'translate3d(' + r.left + 'px,' + r.top + 'px,0)';
      canvas.style.width = w + 'px';
      canvas.style.height = h + 'px';

      if (canvas.width !== w * dpr || canvas.height !== h * dpr) {
        canvas.width = w * dpr;
        canvas.height = h * dpr;
      }

      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.uniform2f(uni.mouse, mouse.x, mouse.y);
      gl.uniform1f(uni.time, (performance.now() - start) / 1000);
      gl.uniform1f(uni.hover, hover);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    } else if (hover < 0.01 && canvas.classList.contains('is-on')) {
      canvas.classList.remove('is-on');
    }

    requestAnimationFrame(loop);
  }

  return {
    init: init,
    attach: attach,
    release: release,
    setMouse: setMouse,
    get available() {
      return ok;
    }
  };
})();
