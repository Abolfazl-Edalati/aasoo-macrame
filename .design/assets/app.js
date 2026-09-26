/* گِرِه — app layer: cart store, reveal engine, knots, filters, forms, toast
   Motion: transform/opacity only; full prefers-reduced-motion fallback. */
(function () {
  "use strict";
  var G = (window.GEREH = window.GEREH || {});
  var D = window.GEREH_DATA || { products: [], collections: [], articles: [], site: {} };
  G.data = D;
  var reduced = window.matchMedia("(prefers-reduced-motion: reduce)");

  /* ---------- helpers ---------- */
  var FA = "۰۱۲۳۴۵۶۷۸۹";
  G.fa = function (n) {
    return String(n).replace(/\d/g, function (d) { return FA[+d]; });
  };
  G.group = function (n) {
    return String(n).replace(/\B(?=(\d{3})+(?!\d))/g, "٬");
  };
  G.price = function (toman) {
    return '<span class="mono-num">' + G.fa(G.group(Math.round(toman))) + "</span> <small>تومان</small>";
  };
  G.money = function (toman) { return Math.round(toman); };
  G.el = function (tag, cls, html) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (html != null) e.innerHTML = html;
    return e;
  };
  G.qs = function (s, r) { return (r || document).querySelector(s); };
  G.qsa = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  G.esc = function (s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  };
  G.param = function (k) { return new URLSearchParams(location.search).get(k); };

  /* ---------- cart store (localStorage gereh.cart.v1) ---------- */
  var CART_KEY = "gereh.cart.v1";
  var cart = load();
  function load() {
    try {
      var raw = localStorage.getItem(CART_KEY);
      var arr = raw ? JSON.parse(raw) : [];
      return Array.isArray(arr) ? arr : [];
    } catch (e) { return []; }
  }
  function save() {
    try { localStorage.setItem(CART_KEY, JSON.stringify(cart)); } catch (e) {}
    G.renderBadge();
    document.dispatchEvent(new CustomEvent("gereh:cart", { detail: cart.slice() }));
  }
  G.getCart = function () { return cart.slice(); };
  G.findLine = function (id, size, color) {
    return cart.filter(function (l) { return l.id === id && l.size === size && l.color === color; })[0] || null;
  };
  G.addToCart = function (item, qty) {
    var p = D.products.filter(function (x) { return x.id === item.id; })[0];
    if (!p) return;
    qty = Math.max(1, Math.min(qty || 1, p.stock));
    var line = G.findLine(item.id, item.size, item.color);
    if (line) {
      line.qty = Math.min(line.qty + qty, p.stock);
    } else {
      cart.push({ id: p.id, size: item.size || (p.sizes[0] && p.sizes[0].id), color: item.color || (p.colors[0] && p.colors[0].id), qty: qty });
    }
    save();
    G.bumpBadge();
    G.toast("«" + p.name + "» به سبد اضافه شد", "check");
  };
  G.setQty = function (id, size, color, qty) {
    var p = D.products.filter(function (x) { return x.id === id; })[0];
    var line = G.findLine(id, size, color);
    if (!line) return;
    line.qty = qty;
    if (qty <= 0) cart.splice(cart.indexOf(line), 1);
    else if (p && qty > p.stock) line.qty = p.stock;
    save();
  };
  G.removeFromCart = function (id, size, color) {
    cart = cart.filter(function (l) { return !(l.id === id && l.size === size && l.color === color); });
    save();
  };
  G.clearCart = function () { cart = []; save(); };
  G.linePrice = function (line) {
    var p = D.products.filter(function (x) { return x.id === line.id; })[0];
    if (!p) return 0;
    var s = p.sizes.filter(function (z) { return z.id === line.size; })[0];
    return p.priceTomans + ((s && s.delta) || 0);
  };
  G.cartCount = function () { return cart.reduce(function (a, l) { return a + l.qty; }, 0); };
  G.cartTotal = function () { return cart.reduce(function (a, l) { return a + G.linePrice(l) * l.qty; }, 0); };

  G.renderBadge = function () {
    var n = G.cartCount();
    G.qsa(".cart-count").forEach(function (b) {
      b.textContent = G.fa(n);
      b.toggleAttribute("hidden", n === 0);
    });
  };
  G.bumpBadge = function () {
    G.qsa(".cart-count").forEach(function (b) {
      b.classList.remove("bump");
      void b.offsetWidth;
      b.classList.add("bump");
    });
  };

  /* ---------- product lookup / cards ---------- */
  G.product = function (id) { return D.products.filter(function (p) { return p.id === id; })[0] || null; };
  G.priceOf = function (p, sizeId) {
    var s = p.sizes.filter(function (z) { return z.id === sizeId; })[0];
    return p.priceTomans + ((s && s.delta) || 0);
  };
  G.starsHTML = function (r) {
    var out = "";
    for (var i = 1; i <= 5; i++) {
      out += '<svg class="icon ' + (i <= Math.round(r) ? "" : "empty") + '" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3l2.7 5.6 6.1.8-4.5 4.2 1.1 6-5.4-3-5.4 3 1.1-6L3.2 9.4l6.1-.8z"/></svg>';
    }
    return '<span class="stars" role="img" aria-label="امتیاز ' + G.fa(r) + ' از ۵">' + out + "</span>";
  };
  G.tileHTML = function (p, i) {
    var im = p.images[0];
    var ratio = (im.w / im.h).toFixed(4);
    var off = p.compareAtTomans ? Math.round((1 - p.priceTomans / p.compareAtTomans) * 100) : 0;
    var badge = "";
    if (p.stock === 0) badge = '<span class="badge badge--sold">ناموجود</span>';
    else if (off) badge = '<span class="badge badge--sale">٪' + G.fa(off) + "−</span>";
    else if (p.isNew) badge = '<span class="badge badge--new">جدید</span>';
    return '' +
      '<a class="tile od-tile reveal' + (p.stock === 0 ? " is-sold" : "") + '" style="--i:' + (i % 9) + '" href="product.html?id=' + p.id + '" data-card="' + p.id + '">' +
      badge +
      '<span class="tile-media"><img class="od-media" style="--od-ratio:' + ratio + '" src="' + im.src + '" width="' + im.w + '" height="' + im.h + '" alt="' + G.esc(im.alt) + '" loading="lazy"></span>' +
      '<span class="tile-body">' +
        '<span class="od-stack" style="--od-gap:2px">' +
          '<span class="tile-name">' + G.esc(p.name) + "</span>" +
          '<span class="tile-sub od-clamp-2">' + G.esc(p.subtitle) + "</span>" +
        "</span>" +
        '<span class="tile-price">' +
          '<span class="od-stack" style="--od-gap:0">' +
            '<span class="od-row od-nowrap">' + G.starsHTML(p.rating) + '<span class="muted">(' + G.fa(p.reviews) + ")</span></span>" +
          "</span>" +
          '<span class="od-stack" style="--od-gap:0;text-align:end">' +
            (p.compareAtTomans ? '<span class="price-was">' + G.price(p.compareAtTomans) + "</span>" : "") +
            '<span class="price">' + G.price(p.priceTomans) + "</span>" +
          "</span>" +
        "</span>" +
      "</span></a>";
  };

  /* ---------- reveal engine (IntersectionObserver, 40ms stagger) ---------- */
  G.observeReveals = function (root) {
    var els = G.qsa(".reveal,.reveal-x,.reveal-scale", root);
    if (reduced.matches || !("IntersectionObserver" in window)) {
      els.forEach(function (e) { e.classList.add("is-visible"); });
      return;
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add("is-visible"); io.unobserve(en.target); }
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -6% 0px" });
    els.forEach(function (e) { io.observe(e); });
  };

  /* ---------- knot draw: measure rope path lengths ---------- */
  G.drawKnots = function (root) {
    G.qsa("svg.knot .rope", root).forEach(function (p) {
      var len = 400;
      try { len = Math.ceil(p.getTotalLength()); } catch (e) {}
      p.style.setProperty("--len", len);
    });
    if (reduced.matches || !("IntersectionObserver" in window)) {
      G.qsa("svg.knot", root).forEach(function (k) { k.classList.add("is-visible"); });
      return;
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add("is-visible"); io.unobserve(en.target); }
      });
    }, { threshold: 0.35 });
    G.qsa("svg.knot", root).forEach(function (k) { io.observe(k); });
  };

  /* ---------- parallax + magnetic (rAF, transform-only) ---------- */
  function initMotion() {
    if (reduced.matches) return;
    var px = G.qsa(".parallax");
    var mag = G.qsa(".magnetic");
    var raf = null;
    function onScroll() {
      if (raf) return;
      raf = requestAnimationFrame(function () {
        raf = null;
        var vh = innerHeight;
        px.forEach(function (e) {
          var r = e.getBoundingClientRect();
          var mid = r.top + r.height / 2 - vh / 2;
          var sp = parseFloat(e.dataset.speed || "0.06");
          e.style.transform = "translate3d(0," + (-mid * sp).toFixed(1) + "px,0)";
        });
      });
    }
    addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    mag.forEach(function (b) {
      b.addEventListener("pointermove", function (ev) {
        var r = b.getBoundingClientRect();
        var dx = (ev.clientX - (r.left + r.width / 2)) * 0.18;
        var dy = (ev.clientY - (r.top + r.height / 2)) * 0.28;
        b.style.transform = "translate(" + dx.toFixed(1) + "px," + dy.toFixed(1) + "px)";
      });
      b.addEventListener("pointerleave", function () { b.style.transform = ""; });
    });
  }

  /* ---------- toast ---------- */
  G.toast = function (msg, icon) {
    var region = G.qs(".toast-region");
    if (!region) {
      region = G.el("div", "toast-region");
      region.setAttribute("role", "status");
      region.setAttribute("aria-live", "polite");
      document.body.appendChild(region);
    }
    var t = G.el("div", "toast");
    var ic = icon === "check"
      ? '<svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M4 12.5l5 5L20 6.5"/></svg>'
      : '<svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 8v5M12 16.5v.5"/><circle cx="12" cy="12" r="9"/></svg>';
    t.innerHTML = ic + "<span>" + G.esc(msg) + "</span>";
    region.appendChild(t);
    setTimeout(function () {
      t.classList.add("is-leaving");
      setTimeout(function () { t.remove(); }, 320);
    }, 2600);
  };

  /* ---------- forms: validate on blur + summary ---------- */
  var RULES = {
    required: function (v) { return v.trim() ? "" : "این فیلد الزامی است."; },
    name: function (v) { return /^[\p{L} ]{2,40}$/u.test(v.trim()) ? "" : "نام را کامل بنویسید (بدون عدد)."; },
    phone: function (v) { return /^09\d{9}$/.test(v.replace(/[۰-۹]/g, function (d) { return "۰۱۲۳۴۵۶۷۸۹".indexOf(d); })) ? "" : "شماره موبایل ۱۱ رقمی و با ۰۹ شروع می‌شود."; },
    email: function (v) { return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim()) ? "" : "ایمیل معتبر نیست؛ نشانی را بررسی کنید."; }
  };
  G.fieldError = function (input) {
    var kind = input.dataset.validate || (input.required ? "required" : "");
    if (!input.value && !input.required && !input.dataset.validate) return "";
    if (input.required && !input.value.trim()) return "این فیلد الزامی است.";
    if (kind && RULES[kind]) return RULES[kind](input.value || "");
    return "";
  };
  G.markField = function (input, msg) {
    var field = input.closest(".field") || input.parentElement;
    var err = field.querySelector(".error");
    if (msg) {
      field.classList.add("is-invalid");
      input.setAttribute("aria-invalid", "true");
      if (err) { err.textContent = msg; input.setAttribute("aria-describedby", err.id || ""); }
    } else {
      field.classList.remove("is-invalid");
      input.removeAttribute("aria-invalid");
      if (err) err.textContent = "";
    }
  };
  G.bindForm = function (form, onSubmit) {
    var inputs = G.qsa("input,textarea,select", form).filter(function (i) { return i.type !== "hidden"; });
    inputs.forEach(function (i) {
      i.addEventListener("blur", function () { G.markField(i, G.fieldError(i)); });
      i.addEventListener("input", function () {
        var field = i.closest(".field");
        if (field && field.classList.contains("is-invalid")) G.markField(i, G.fieldError(i));
      });
    });
    form.addEventListener("submit", function (ev) {
      ev.preventDefault();
      var errs = [];
      inputs.forEach(function (i) {
        var m = G.fieldError(i);
        G.markField(i, m);
        if (m) errs.push({ input: i, msg: m });
      });
      var box = form.querySelector(".summary-box");
      if (errs.length) {
        if (box) {
          box.hidden = false;
          box.innerHTML = "<p>چند مورد نیاز به اصلاح دارد:</p><ul>" +
            errs.map(function (e) {
              var id = e.input.id || "";
              return '<li><a href="#' + id + '" data-focus="' + id + '">' + G.esc((e.input.labels[0] ? e.input.labels[0].textContent : e.input.name) + " — " + e.msg) + "</a></li>";
            }).join("") + "</ul>";
          box.setAttribute("tabindex", "-1");
          box.focus();
        }
        errs[0].input.focus();
        return;
      }
      if (box) box.hidden = true;
      onSubmit(form);
    });
  };
  document.addEventListener("click", function (ev) {
    var a = ev.target.closest && ev.target.closest("[data-focus]");
    if (a) {
      ev.preventDefault();
      var t = document.getElementById(a.getAttribute("data-focus"));
      if (t) { t.focus(); t.scrollIntoView({ block: "center", behavior: reduced.matches ? "auto" : "smooth" }); }
    }
  });

  /* ---------- header chrome bindings ---------- */
  function initChrome() {
    G.renderBadge();
    var toggle = G.qs(".nav-toggle");
    var header = G.qs(".site-header");
    if (toggle && header) {
      toggle.addEventListener("click", function () {
        var open = header.getAttribute("data-open") === "1";
        header.setAttribute("data-open", open ? "0" : "1");
        toggle.setAttribute("aria-expanded", open ? "false" : "true");
      });
      document.addEventListener("click", function (e) {
        if (!e.target.closest(".site-header")) header.setAttribute("data-open", "0");
      });
      addEventListener("keydown", function (e) {
        if (e.key === "Escape") header.setAttribute("data-open", "0");
      });
    }
    G.qsa("a[href]").forEach(function (a) {
      if (a.hostname && a.hostname !== location.hostname) return;
      if (a.getAttribute("href").indexOf(location.pathname.split("/").pop()) === 0 && !a.hasAttribute("data-no-mark")) {
        var path = location.pathname.split("/").pop() || "index.html";
        if (a.getAttribute("href").split("?")[0] === path) a.setAttribute("aria-current", "page");
      }
    });
  }

  /* ---------- scroll restore (predictable back behavior) ---------- */
  function initScrollMemory() {
    var key = "gereh.scroll." + (location.pathname.split("/").pop() || "index.html");
    var saved = sessionStorage.getItem(key);
    if (saved && history.scrollRestoration !== undefined) {
      addEventListener("load", function () {
        setTimeout(function () { scrollTo(0, parseInt(saved, 10)); }, 60);
      });
    }
    var t = null;
    addEventListener("scroll", function () {
      if (t) return;
      t = setTimeout(function () { t = null; sessionStorage.setItem(key, String(scrollY)); }, 250);
    }, { passive: true });
    addEventListener("pagehide", function () { sessionStorage.setItem(key, String(scrollY)); });
  }

  /* ---------- page transition curtain ---------- */
  function initCurtain() {
    if (reduced.matches) return;
    G.qsa("a[data-nav]").forEach(function (a) {
      a.addEventListener("click", function (ev) {
        var href = a.getAttribute("href");
        if (!href || href.indexOf(".html") < 0) return;
        ev.preventDefault();
        if (document.getElementById("nav-curtain")) return;
        var curtain = G.el("div", "page-curtain");
        curtain.id = "nav-curtain";
        document.body.appendChild(curtain);
        setTimeout(function () { location.href = href; }, 420);
      });
    });
  }

  /* ---------- boot ---------- */
  function boot() {
    initChrome();
    initScrollMemory();
    G.observeReveals();
    G.drawKnots();
    initMotion();
    initCurtain();
    document.dispatchEvent(new CustomEvent("gereh:ready"));
  }
  if (document.readyState === "loading") addEventListener("DOMContentLoaded", boot);
  else boot();
})();
