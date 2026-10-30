// Soft animations for the whole site, in one file. Nothing to write in your pages except one script line.
//   1. Blocks (cards, sections) fade in gently when the visitor scrolls down to them.
//   2. Cards zoom a little when touched or hovered.
//   3. On the home page, the big photo changes by itself (soft cross-fade).
//
// HOW TO USE: add   <script src="js/motion.js"></script>   just before <script src="js/site.js"></script>
//             in the pages where you want it (index.html, creation.html, album.html...).
// Home photo: it changes between photos taken from your articles. To choose them yourself, write on the
//             <div class="home-photo" data-rotate="49,35,34,42"> the numbers of the photos.
// Everything stops by itself for visitors whose phone asks for "reduced motion", and nothing waits for the network.
(function () {
  var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // ---------- the styles ----------
  var css = document.createElement("style");
  css.textContent =
    // cards: soft zoom when touched (phone) or hovered (computer)
    ".produit,.featured-item,.service-card{transition:transform .25s ease,box-shadow .25s ease}" +
    "body .produit:active,body .featured-item:active,body .service-card:active{transform:scale(1.03)}" +
    "@media (hover:hover){body .produit:hover,body .featured-item:hover,body .service-card:hover{transform:translateY(-4px) scale(1.02);box-shadow:0 10px 26px rgba(0,0,0,.16)}}" +
    // appear while scrolling
    ".mo-hide{opacity:0;transform:translateY(18px)}" +
    ".mo-in{opacity:1;transform:none;transition:opacity .6s ease,transform .6s ease}" +
    // home photo that changes
    ".mo-hero{position:relative}.mo-hero img{display:block}" +
    ".mo-hero .mo-hero-b{position:absolute;left:0;top:0;width:100%;height:100%;opacity:0;transition:opacity 1s ease}" +
    ".mo-hero .mo-hero-b.on{opacity:1}" +
    "@media (prefers-reduced-motion:reduce){.produit,.featured-item,.service-card{transition:none}.mo-hide{opacity:1;transform:none}}";
  document.head.appendChild(css);

  // ---------- 1. appear while scrolling ----------
  var SELECTOR = ".service-card,.featured-item,.produit,.about,.hours,.album button";
  var io = null;

  function reveal(list) {
    // list = the blocks that just came into view; a short delay between them makes them appear one after the other
    list.forEach(function (el, i) {
      el.style.transitionDelay = Math.min(i, 5) * 70 + "ms";
      el.classList.remove("mo-hide");
      el.classList.add("mo-in");
      setTimeout(function () {                       // when finished, the block goes back to its natural state (hover zoom works normally)
        el.classList.remove("mo-in");
        el.style.transitionDelay = "";
      }, 900 + Math.min(i, 5) * 70);
    });
  }

  function watch(el) {
    if (!io || el.getAttribute("data-mo")) return;
    el.setAttribute("data-mo", "1");
    var r = el.getBoundingClientRect();
    if (r.top < window.innerHeight && r.bottom > 0) return;   // already on screen: left alone (no flash)
    el.classList.add("mo-hide");
    io.observe(el);
  }

  function startReveal() {
    if (reduce || !("IntersectionObserver" in window)) return;
    io = new IntersectionObserver(function (entries) {
      var showing = [];
      entries.forEach(function (e) {
        if (e.isIntersecting) { showing.push(e.target); io.unobserve(e.target); }
      });
      if (showing.length) reveal(showing);
    }, { rootMargin: "0px 0px -8% 0px", threshold: 0.05 });
    Array.prototype.forEach.call(document.querySelectorAll(SELECTOR), watch);

    // cards added later by js/catalog.js (new articles) are watched too
    ["grille", "album"].forEach(function (cls) {
      var box = document.querySelector("." + cls) || document.getElementById(cls);
      if (!box || !window.MutationObserver) return;
      new MutationObserver(function () {
        Array.prototype.forEach.call(box.querySelectorAll(SELECTOR), watch);
      }).observe(box, { childList: true });
    });
  }

  // ---------- 3. home photo that changes ----------
  function ready(fn) {   // js/products.js is loaded here if the page does not have it
    if (typeof PRODUCTS !== "undefined") return fn();
    var s = document.createElement("script");
    s.src = "js/products.js";
    s.onload = fn;
    document.head.appendChild(s);
  }

  function startHero() {
    var holder = document.querySelector(".home-photo");
    var base = holder && holder.querySelector("img");
    if (!base || reduce) return;
    if (navigator.connection && navigator.connection.saveData) return;   // visitor saves data: the photo stays still

    function begin() {
      var current = (base.getAttribute("src") || "").replace(/\.jpe?g.*$/i, "").replace(/^.*\//, "");
      var list = (holder.getAttribute("data-rotate") || "").split(",").map(function (x) { return x.trim(); }).filter(Boolean);
      if (!list.length && typeof PRODUCTS !== "undefined") {
        var firsts = [];
        Object.keys(PRODUCTS).forEach(function (id) { var p = PRODUCTS[id]; if (p.photos && p.photos.length) firsts.push(String(p.photos[0])); });
        var step = Math.max(1, Math.floor(firsts.length / 6));
        for (var i = 0; i < firsts.length && list.length < 6; i += step) list.push(firsts[i]);
      }
      var photos = [current];
      list.forEach(function (p) { if (p && photos.indexOf(p) === -1) photos.push(p); });
      if (photos.length < 2) return;

      var wrap = document.createElement("div");
      wrap.className = "mo-hero";
      base.parentNode.insertBefore(wrap, base);
      wrap.appendChild(base);
      var top = base.cloneNode(false);
      top.className = (base.className ? base.className + " " : "") + "mo-hero-b";
      top.alt = "";
      top.setAttribute("aria-hidden", "true");
      top.removeAttribute("loading");
      wrap.appendChild(top);

      var index = 0, busy = false;
      function next() {
        if (busy || document.hidden) return;
        busy = true;
        var n = (index + 1) % photos.length;
        var src = photos[n] + ".jpeg";
        var probe = new Image();                                   // the next photo is loaded first: no blank moment
        probe.onload = function () {
          top.src = src;
          top.classList.add("on");
          setTimeout(function () {
            base.src = src;
            top.classList.remove("on");
            index = n;
            busy = false;
          }, 1100);
        };
        probe.onerror = function () { photos.splice(n, 1); if (index >= photos.length) index = 0; busy = false; };   // missing photo: skipped
        probe.src = src;
      }
      setInterval(next, 4500);
    }
    ready(begin);
  }

  // ---------- start ----------
  function start() { startReveal(); startHero(); }
  if (document.readyState === "complete") setTimeout(start, 0);
  else window.addEventListener("load", function () { setTimeout(start, 300); });   // after the page has loaded: never slows the first display
})();
