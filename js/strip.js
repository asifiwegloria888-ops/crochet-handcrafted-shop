// Photos that scroll by themselves (a "marquee"), like on modern landing pages.
//
// HOW TO USE: put   <div id="photo-strip"></div>   where you want the strip, and add
//             <script src="js/strip.js"></script>   just before <script src="js/site.js"></script>.
// The photos come from js/products.js (the first photo of each article), so a new article joins the strip by itself.
// Optional settings, written on the div:
//   data-count="12"                 how many photos (default 12, spread over all your articles)
//   data-titles="Dress,Two piece"   only these kinds of articles
//   data-photos="35,34,42"          your own list of photos (overrides the two settings above)
//   data-speed="4"                  seconds per photo: bigger = slower (default 4)
// A click on a photo opens the article. The strip stops when the visitor touches or hovers it.
(function () {
  var box = document.getElementById("photo-strip");
  if (!box) return;

  // js/products.js is loaded here if the page did not load it
  function ready(fn) {
    if (typeof PRODUCTS !== "undefined") return fn();
    var s = document.createElement("script");
    s.src = "js/products.js";
    s.onload = fn;
    document.head.appendChild(s);
  }

  function list() {
    var ids = Object.keys(PRODUCTS);
    var out = [];
    var custom = (box.getAttribute("data-photos") || "").split(",").map(function (x) { return x.trim(); }).filter(Boolean);
    if (custom.length) {
      custom.forEach(function (ph) {
        var id = ids.filter(function (i) { return (PRODUCTS[i].photos || []).map(String).indexOf(ph) !== -1; })[0];
        out.push({ photo: ph, id: id || null });
      });
      return out;
    }
    var only = (box.getAttribute("data-titles") || "").split(",").map(function (x) { return x.trim().toLowerCase(); }).filter(Boolean);
    var seen = {};
    ids.forEach(function (id) {
      var p = PRODUCTS[id];
      if (!p.photos || !p.photos.length) return;
      var title = String(p.title || id).toLowerCase();
      if (only.length && only.indexOf(title) === -1) return;
      var ph = String(p.photos[0]);
      if (seen[ph]) return;
      seen[ph] = true;
      out.push({ photo: ph, id: id });
    });
    var n = parseInt(box.getAttribute("data-count"), 10) || 12;
    if (out.length > n) {
      var step = out.length / n, picked = [];
      for (var k = 0; k < n; k++) picked.push(out[Math.floor(k * step)]);
      out = picked;
    }
    return out;
  }

  function build() {
    var items = list();
    if (!items.length) return;
    var speed = parseFloat(box.getAttribute("data-speed")) || 4;

    var css = document.createElement("style");
    css.textContent =
      "#photo-strip{position:relative;overflow:hidden;padding:26px 0;" +
      "-webkit-mask-image:linear-gradient(90deg,transparent,#000 7%,#000 93%,transparent);mask-image:linear-gradient(90deg,transparent,#000 7%,#000 93%,transparent)}" +
      "#photo-strip .ps-track{display:flex;gap:14px;padding-right:14px;width:max-content;animation:ps-move var(--ps-time,48s) linear infinite;will-change:transform}" +
      "#photo-strip:hover .ps-track,#photo-strip:active .ps-track{animation-play-state:paused}" +
      "#photo-strip .ps-item{display:block;flex:0 0 auto;width:170px;height:230px;border-radius:26px;overflow:hidden;background:#f3d9e0;" +
      "box-shadow:0 8px 22px rgba(0,0,0,.18);transition:transform .3s;text-decoration:none}" +
      "#photo-strip .ps-a{transform:rotate(-3deg) translateY(8px)}#photo-strip .ps-b{transform:rotate(3deg) translateY(-6px)}" +
      "#photo-strip .ps-item:hover{transform:scale(1.05) rotate(0)}" +
      "#photo-strip .ps-item img{width:100%!important;height:100%!important;max-width:none!important;object-fit:cover;display:block;margin:0!important;" +
      "border-radius:0!important;box-shadow:none!important;pointer-events:none;-webkit-user-drag:none}" +
      "@keyframes ps-move{from{transform:translateX(0)}to{transform:translateX(-50%)}}" +
      "@media (min-width:700px){#photo-strip .ps-item{width:210px;height:280px}}" +
      "@media (prefers-reduced-motion:reduce){#photo-strip .ps-track{animation:none}#photo-strip{overflow-x:auto}}";
    document.head.appendChild(css);

    function tile(item, copy, index) {
      var p = item.id ? PRODUCTS[item.id] : null;
      var a = document.createElement(item.id ? "a" : "div");
      a.className = "ps-item " + (index % 2 ? "ps-b" : "ps-a");
      if (item.id) a.href = "product.html?item=" + encodeURIComponent(item.id).replace(/%20/g, "+") + "&photo=" + item.photo;
      var img = document.createElement("img");
      img.src = item.photo + ".jpeg";
      img.alt = copy ? "" : ((p && p.title) || "Crochet");
      img.decoding = "async";
      img.loading = !copy && index < 5 ? "eager" : "lazy";
      img.draggable = false;
      img.addEventListener("error", function () { a.style.display = "none"; });   // a missing photo leaves no empty frame
      if (copy) { a.setAttribute("aria-hidden", "true"); a.tabIndex = -1; }
      a.appendChild(img);
      return a;
    }

    var track = document.createElement("div");
    track.className = "ps-track";
    track.style.setProperty("--ps-time", Math.round(items.length * speed) + "s");
    // the list is written twice: when the first half has gone by, the second one is exactly in its place (endless loop)
    items.forEach(function (it, i) { track.appendChild(tile(it, false, i)); });
    items.forEach(function (it, i) { track.appendChild(tile(it, true, i)); });
    box.innerHTML = "";
    box.appendChild(track);
  }

  ready(build);
})();
