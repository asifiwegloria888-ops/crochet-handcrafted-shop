// Photos that scroll by themselves (a "marquee"), like on modern landing pages.
//
// HOW TO USE: put   <div class="photo-strip"></div>   where you want a strip, and add
//             <script src="js/strip.js"></script>   just before <script src="js/site.js"></script>.
// You can have several strips on a page (give each one its own settings). Use class="photo-strip", not id.
// The photos come from js/products.js (the first photo of each article), so a new article joins the strip by itself.
// Optional settings, written on the div:
//   data-count="12"                 how many photos (default 12, spread over all your articles)
//   data-titles="Dress,Two piece"   only these kinds of articles (capitals, spaces and dashes do not matter)
//   data-photos="35,34,42"          your own list of photos (overrides the two settings above)
//   data-speed="4"                  seconds per photo: bigger = slower (default 4)
// A click on a photo opens the article. The strip stops when the visitor touches or hovers it.
// If something is wrong (a photo is not on the server, a title matches nothing), the browser console (F12) says what.
(function () {
  var seen = [];
  var boxes = Array.prototype.slice.call(document.querySelectorAll("#photo-strip, .photo-strip")).filter(function (b) {
    if (seen.indexOf(b) !== -1) return false;
    seen.push(b);
    return true;
  });
  if (!boxes.length) return;

  function warn(msg) { if (window.console && console.warn) console.warn("[photo strip] " + msg); }
  var norm = function (s) { return String(s).toLowerCase().replace(/[^a-z0-9]/g, ""); };

  // js/products.js is loaded here if the page did not load it
  function ready(fn) {
    if (typeof PRODUCTS !== "undefined") return fn();
    var s = document.createElement("script");
    s.src = "js/products.js";
    s.onload = fn;
    s.onerror = function () { warn("js/products.js could not be loaded: is the file on the server?"); };
    document.head.appendChild(s);
  }

  function list(box) {
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
    var only = (box.getAttribute("data-titles") || "").split(",").map(norm).filter(Boolean);
    var seenPhotos = {};
    function collect(filter) {
      var res = [];
      seenPhotos = {};
      ids.forEach(function (id) {
        var p = PRODUCTS[id];
        if (!p.photos || !p.photos.length) return;
        if (filter) {
          var names = [norm(p.title || id), norm(id), norm(p.type || "")];
          if (!names.some(function (n) { return n && filter.indexOf(n) !== -1; })) return;
        }
        var ph = String(p.photos[0]);
        if (seenPhotos[ph]) return;
        seenPhotos[ph] = true;
        res.push({ photo: ph, id: id });
      });
      return res;
    }
    out = collect(only.length ? only : null);
    if (only.length && !out.length) {
      warn("No article matches data-titles=\"" + box.getAttribute("data-titles") + "\". Articles you have: " + ids.join(", ") + ". Showing all articles instead.");
      out = collect(null);
    }
    var n = parseInt(box.getAttribute("data-count"), 10) || 12;
    if (out.length > n) {
      var step = out.length / n, picked = [];
      for (var k = 0; k < n; k++) picked.push(out[Math.floor(k * step)]);
      out = picked;
    }
    return out;
  }

  function addStyles() {
    if (document.getElementById("ps-styles")) return;
    var css = document.createElement("style");
    css.id = "ps-styles";
    css.textContent =
      ".photo-strip,#photo-strip{position:relative;overflow:hidden;padding:26px 0;" +
      "-webkit-mask-image:linear-gradient(90deg,transparent,#000 7%,#000 93%,transparent);mask-image:linear-gradient(90deg,transparent,#000 7%,#000 93%,transparent)}" +
      ".ps-track{display:flex;gap:14px;padding-right:14px;width:max-content;animation:ps-move var(--ps-time,48s) linear infinite;will-change:transform}" +
      ".photo-strip:hover .ps-track,.photo-strip:active .ps-track,#photo-strip:hover .ps-track,#photo-strip:active .ps-track{animation-play-state:paused}" +
      ".ps-item{display:block;flex:0 0 auto;width:170px;height:230px;border-radius:26px;overflow:hidden;background:#f3d9e0;" +
      "box-shadow:0 8px 22px rgba(0,0,0,.18);transition:transform .3s;text-decoration:none}" +
      ".ps-a{transform:rotate(-3deg) translateY(8px)}.ps-b{transform:rotate(3deg) translateY(-6px)}" +
      ".ps-item:hover{transform:scale(1.05) rotate(0)}" +
      ".ps-item img{width:100%!important;height:100%!important;max-width:none!important;object-fit:cover;display:block;margin:0!important;" +
      "border-radius:0!important;box-shadow:none!important;pointer-events:none;-webkit-user-drag:none}" +
      "@keyframes ps-move{from{transform:translateX(0)}to{transform:translateX(-50%)}}" +
      "@media (min-width:700px){.ps-item{width:210px;height:280px}}" +
      "@media (prefers-reduced-motion:reduce){.ps-track{animation:none}.photo-strip,#photo-strip{overflow-x:auto}}";
    document.head.appendChild(css);
  }

  function build(box) {
    var items = list(box);
    if (!items.length) { warn("There is no photo to show (is js/products.js empty?)."); return; }
    var speed = parseFloat(box.getAttribute("data-speed")) || 4;
    var total = items.length, failed = 0, answered = 0;

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
      img.addEventListener("error", function () {        // a missing photo leaves no empty frame, and the console tells which one
        a.style.display = "none";
        if (!copy) {
          failed++;
          warn("This photo cannot be loaded: " + img.src + "  -> check that the file is on the server with exactly this name (same capitals, extension .jpeg).");
        }
        if (!copy && failed === total) {
          warn("None of the photos could be loaded, so the strip is empty. Push the photos to GitHub.");
          box.innerHTML = "";
        }
      });
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

  ready(function () {
    addStyles();
    boxes.forEach(build);
  });
})();