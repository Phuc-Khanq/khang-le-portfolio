/* ============================================================
   Cart — khxngLX
   ------------------------------------------------------------
   Holds what's in the cart and tells anyone who cares when it
   changes. Nothing here touches money or personal details: it is
   a list of product ids and quantities, kept in this browser.

   Storage is localStorage, wrapped in try/catch throughout — a
   private window, blocked site data, or a full quota all throw,
   and a cart failing to save should never take the page down.
   The cart simply becomes session-only in that case.
   ============================================================ */

window.KLCart = (function () {
  'use strict';

  var KEY = 'khxnglx.cart.v1';
  var items = {};            // id -> qty
  var listeners = [];

  // ---- storage, defensively ------------------------------------------
  function load() {
    try {
      var raw = window.localStorage.getItem(KEY);
      if (!raw) return {};
      var parsed = JSON.parse(raw);
      if (!parsed || typeof parsed !== 'object') return {};

      // Trust nothing that comes back: quantities must be sane integers.
      var clean = {};
      Object.keys(parsed).forEach(function (id) {
        var n = parseInt(parsed[id], 10);
        if (id && n > 0) clean[id] = Math.min(n, 99);
      });
      return clean;
    } catch (e) {
      return {};
    }
  }

  function save() {
    try {
      window.localStorage.setItem(KEY, JSON.stringify(items));
    } catch (e) {
      /* session-only from here; not worth interrupting anyone over */
    }
  }

  items = load();

  // ---- notify ---------------------------------------------------------
  function emit() {
    for (var i = 0; i < listeners.length; i++) {
      try {
        listeners[i](api.lines(), api.count());
      } catch (e) {
        /* one bad listener shouldn't stop the others */
      }
    }
  }

  // ---- the catalogue lives in content.js; look products up by id ------
  function catalogue() {
    var c = window.KLContent || {};
    var merch = c.merch || {};
    return Array.isArray(merch.featured) ? merch.featured : [];
  }

  function find(id) {
    var all = catalogue();
    for (var i = 0; i < all.length; i++) {
      if (all[i].id === id) return all[i];
    }
    return null;
  }

  var api = {
    /** Every line in the cart, joined to its product. */
    lines: function () {
      return Object.keys(items).map(function (id) {
        var p = find(id);
        var qty = items[id];
        var price = p && typeof p.price === 'number' ? p.price : null;
        return {
          id: id,
          qty: qty,
          product: p,                       // null if it vanished from the catalogue
          price: price,
          total: price === null ? null : price * qty
        };
      });
    },

    /** Total number of things, for the badge. */
    count: function () {
      return Object.keys(items).reduce(function (n, id) { return n + items[id]; }, 0);
    },

    /** Subtotal of the lines that actually have a price. */
    subtotal: function () {
      return api.lines().reduce(function (sum, l) {
        return l.total === null ? sum : sum + l.total;
      }, 0);
    },

    /** True when something in the cart has no price yet. */
    hasUnpriced: function () {
      return api.lines().some(function (l) { return l.price === null; });
    },

    qtyOf: function (id) {
      return items[id] || 0;
    },

    add: function (id, qty) {
      var n = parseInt(qty, 10) || 1;
      if (!id || n <= 0) return;
      items[id] = Math.min((items[id] || 0) + n, 99);
      save();
      emit();
    },

    setQty: function (id, qty) {
      var n = parseInt(qty, 10);
      if (!id) return;
      if (!(n > 0)) return api.remove(id);
      items[id] = Math.min(n, 99);
      save();
      emit();
    },

    remove: function (id) {
      delete items[id];
      save();
      emit();
    },

    clear: function () {
      items = {};
      save();
      emit();
    },

    /** Called back immediately with the current state, then on every change. */
    subscribe: function (fn) {
      if (typeof fn !== 'function') return function () {};
      listeners.push(fn);
      try { fn(api.lines(), api.count()); } catch (e) {}
      return function () {
        listeners = listeners.filter(function (l) { return l !== fn; });
      };
    }
  };

  // Another tab changing the cart should update this one too.
  window.addEventListener('storage', function (e) {
    if (e.key !== KEY) return;
    items = load();
    emit();
  });

  return api;
})();
