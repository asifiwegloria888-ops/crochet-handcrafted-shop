// Pretty animations for the Album page, in one file. It does not change the album itself (likes, comments, download stay as they are).
//
//   GRID      - while a photo loads, a soft pink shimmer; photos then arrive one after the other (a small "pop")
//             - on a computer: the photo tilts toward the mouse and zooms inside its frame; on a phone: a soft press effect
//   VIEWER    - the big photo "flies" out of the small one you touched, and slides in when you go to the next/previous one
//             - on a phone: swipe left/right to change photo, swipe down to close, double-tap the photo to like it
//             - the heart bounces and a small burst of hearts flies out when a photo is liked (also the bookmark bounces)
//             - the background and the buttons fade in and out softly
//
// HOW TO USE: in album.html, add   <script src="js/album-fx.js"></script>   just before <script src="js/site.js"></script>
// Nothing is slowed down: no blur effects, only light movements. A phone set to "reduce motion" gets a calm page.
(function () {
  var album = document.getElementById("album"), lb = document.getElementById("lb");
  if (!album || !lb) return;
  var $ = function (id) { return document.getElementById(id); };
  var reduce = !!(window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  var stage = $("lb-stage"), img = $("lb-img"), likeBtn = $("lb-like"), favBtn = $("lb-fav");
  var tiles = Array.prototype.slice.call(album.querySelectorAll("button"));
  tiles.forEach(function (t) { t.setAttribute("data-mo", "fx"); });   // js/motion.js leaves these tiles to this file

  // ---------- styles ----------
  var css = document.createElement("style");
  css.textContent =
    ".album button{position:relative;transition:transform .35s cubic-bezier(.2,.8,.2,1),box-shadow .35s ease;will-change:transform}" +
    ".album button img{transition:transform .7s cubic-bezier(.2,.8,.2,1),opacity .5s ease}" +
    ".album button:active{transform:scale(.96)}" +
    "@media (hover:hover){.album button:hover{box-shadow:0 14px 30px rgba(201,96,127,.38);z-index:2}.album button:hover img{transform:scale(1.09)}}" +
    ".album button.fx-tilt{transform:perspective(800px) rotateX(var(--rx,0deg)) rotateY(var(--ry,0deg)) scale(1.04);transition:transform .12s linear,box-shadow .35s ease}" +
    ".album button.fx-pending{background:linear-gradient(110deg,#f3d9e0 8%,#fdf1f4 18%,#f3d9e0 33%);background-size:200% 100%;animation:fx-shimmer 1.3s linear infinite}" +
    ".album button.fx-pending img{opacity:0}" +
    ".album button.fx-hide{opacity:0;transform:translateY(30px) scale(.9)}" +
    ".album button.fx-show{opacity:1;transform:none;transition:opacity .7s cubic-bezier(.2,.8,.2,1),transform .7s cubic-bezier(.2,.8,.2,1)}" +
    "@keyframes fx-shimmer{to{background-position:-200% 0}}" +
    // the viewer fades in and out (the page only shows or hides it)
    ".lb{display:flex!important;visibility:hidden;opacity:0;pointer-events:none;transition:opacity .3s ease,visibility 0s linear .3s;" +
    "background:radial-gradient(circle at 50% 30%,rgba(70,22,40,.95),rgba(0,0,0,.97))}" +
    ".lb.open{visibility:visible;opacity:1;pointer-events:auto;transition:opacity .3s ease}" +
    ".lb.open .lb-info{animation:fx-up .45s .12s cubic-bezier(.2,.8,.2,1) both}" +
    ".lb.open .lb-bar{animation:fx-up .45s .2s cubic-bezier(.2,.8,.2,1) both}" +
    "@keyframes fx-up{from{opacity:0;transform:translateY(18px)}to{opacity:1;transform:none}}" +
    ".fx-heart{position:fixed;pointer-events:none;z-index:1100;width:96px;height:96px;margin:-48px 0 0 -48px}" +
    ".fx-spark{position:fixed;pointer-events:none;z-index:1100;width:16px;height:16px;margin:-8px 0 0 -8px}" +
    ".lb-stage{touch-action:pan-y}" +
    "@media (prefers-reduced-motion:reduce){.album button,.album button img{transition:none}.album button.fx-pending{animation:none}.lb.open .lb-info,.lb.open .lb-bar{animation:none}}";
  document.head.appendChild(css);

  var HEART = '<svg viewBox="0 0 24 24" width="100%" height="100%"><path fill="#ff4d6d" d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1-1.1a5.5 5.5 0 0 0-7.8 7.8l1 1.1L12 21.2l7.8-7.7 1-1.1a5.5 5.5 0 0 0 0-7.8z"/></svg>';

  // ---------- GRID: shimmer while a photo loads ----------
  tiles.forEach(function (t) {
    var im = t.querySelector("img");
    if (!im || (im.complete && im.naturalWidth)) return;
    t.classList.add("fx-pending");
    var done = function () { t.classList.remove("fx-pending"); };
    im.addEventListener("load", done);
    im.addEventListener("error", done);
  });

  // ---------- GRID: photos arrive one after the other ----------
  if (!reduce && "IntersectionObserver" in window) {
    var io = new IntersectionObserver(function (entries) {
      var shown = entries.filter(function (e) { return e.isIntersecting; }).map(function (e) { return e.target; });
      shown.sort(function (a, b) {
        var ra = a.getBoundingClientRect(), rb = b.getBoundingClientRect();
        return (Math.round(ra.top / 40) - Math.round(rb.top / 40)) || (ra.left - rb.left);
      });
      shown.forEach(function (el, i) {
        io.unobserve(el);
        var d = Math.min(i, 8) * 60;
        el.style.transitionDelay = d + "ms";
        el.classList.remove("fx-hide");
        el.classList.add("fx-show");
        setTimeout(function () { el.classList.remove("fx-show"); el.style.transitionDelay = ""; }, 1000 + d);
      });
    }, { rootMargin: "0px 0px -5% 0px", threshold: 0.05 });
    tiles.forEach(function (t) { t.classList.add("fx-hide"); io.observe(t); });
    setTimeout(function () { tiles.forEach(function (t) { t.classList.remove("fx-hide"); }); }, 5000);   // safety: nothing stays hidden
  }

  // ---------- GRID: tilt toward the mouse (computer only) ----------
  if (!reduce && window.matchMedia && window.matchMedia("(hover:hover) and (pointer:fine)").matches) {
    tiles.forEach(function (t) {
      var raf = 0;
      t.addEventListener("pointermove", function (e) {
        if (e.pointerType !== "mouse" || raf) return;
        raf = requestAnimationFrame(function () {
          raf = 0;
          var r = t.getBoundingClientRect();
          var x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height;
          t.style.setProperty("--rx", ((0.5 - y) * 10).toFixed(1) + "deg");
          t.style.setProperty("--ry", ((x - 0.5) * 12).toFixed(1) + "deg");
          t.classList.add("fx-tilt");
        });
      });
      t.addEventListener("pointerleave", function () {
        t.classList.remove("fx-tilt");
        t.style.removeProperty("--rx");
        t.style.removeProperty("--ry");
      });
    });
  }

  if (reduce || !img.animate) return;   // everything below is movement

  // ---------- VIEWER: the photo flies out of its small frame, then slides from one to the next ----------
  var lastTile = null, wasOpen = false, openedAt = 0, dir = 1, photoToken = 0;

  album.addEventListener("click", function (e) {
    var b = e.target.closest ? e.target.closest("button") : null;
    if (b && album.contains(b)) lastTile = b;
  }, true);
  $("lb-next").addEventListener("click", function () { dir = 1; }, true);
  $("lb-prev").addEventListener("click", function () { dir = -1; }, true);
  document.addEventListener("keydown", function (e) {
    if (e.key === "ArrowRight") dir = 1;
    if (e.key === "ArrowLeft") dir = -1;
  }, true);

  // (created first, so that it runs before the observer of the photo)
  new MutationObserver(function () {
    var open = lb.classList.contains("open");
    if (open && !wasOpen) openedAt = Date.now();
    wasOpen = open;
  }).observe(lb, { attributes: true, attributeFilter: ["class"] });

  function flyFromTile() {
    if (!lastTile) return;
    var r = img.getBoundingClientRect(), t = lastTile.getBoundingClientRect();
    if (!r.width || !t.width) return;
    var dx = (t.left + t.width / 2) - (r.left + r.width / 2);
    var dy = (t.top + t.height / 2) - (r.top + r.height / 2);
    var s = Math.min(t.width / r.width, t.height / r.height);
    img.animate([
      { transform: "translate(" + dx + "px," + dy + "px) scale(" + s + ")", opacity: 0.4, borderRadius: "24px" },
      { transform: "none", opacity: 1, borderRadius: "0px" }
    ], { duration: 480, easing: "cubic-bezier(.2,.8,.2,1)" });
  }
  function slideIn() {
    img.animate([
      { transform: "translateX(" + (dir * 70) + "px) scale(.96)", opacity: 0 },
      { transform: "none", opacity: 1 }
    ], { duration: 380, easing: "cubic-bezier(.2,.8,.2,1)" });
  }
  function arrived() {                  // the new photo is ready to be shown
    img.style.opacity = "";
    if (Date.now() - openedAt < 800) flyFromTile(); else slideIn();
  }
  new MutationObserver(function () {
    var token = ++photoToken;
    if (img.complete && img.naturalWidth) { arrived(); return; }
    img.style.opacity = "0";            // the old photo is hidden while the new one loads
    var ok = function () { img.removeEventListener("load", ok); img.removeEventListener("error", ok); if (token === photoToken) arrived(); };
    img.addEventListener("load", ok);
    img.addEventListener("error", ok);
    setTimeout(function () { if (token === photoToken) img.style.opacity = ""; }, 8000);
  }).observe(img, { attributes: true, attributeFilter: ["src"] });

  // ---------- VIEWER: swipe on a phone (left/right = other photo, down = close) ----------
  var sx = 0, sy = 0, dx = 0, dy = 0, dragging = false;
  stage.addEventListener("touchstart", function (e) {
    if (e.touches.length !== 1 || stage.classList.contains("zoomed")) { dragging = false; return; }
    sx = e.touches[0].clientX; sy = e.touches[0].clientY; dx = dy = 0; dragging = true;
    img.style.transition = "none";
  }, { passive: true });
  stage.addEventListener("touchmove", function (e) {
    if (!dragging) return;
    dx = e.touches[0].clientX - sx; dy = e.touches[0].clientY - sy;
    if (Math.abs(dx) > Math.abs(dy)) img.style.transform = "translateX(" + dx + "px) rotate(" + (dx / 40) + "deg)";
    else if (dy > 0) img.style.transform = "translateY(" + dy + "px) scale(" + Math.max(0.7, 1 - dy / 900) + ")";
  }, { passive: true });
  stage.addEventListener("touchend", function () {
    if (!dragging) return;
    dragging = false;
    img.style.transition = "transform .2s ease, opacity .2s ease";
    if (Math.abs(dx) > 70 && Math.abs(dx) > Math.abs(dy)) {
      dir = dx < 0 ? 1 : -1;
      img.style.transform = "translateX(" + (dx < 0 ? -90 : 90) + "px)";
      img.style.opacity = "0";
      setTimeout(function () {
        img.style.transition = ""; img.style.transform = "";
        (dir === 1 ? $("lb-next") : $("lb-prev")).click();
        setTimeout(function () { img.style.opacity = ""; }, 1500);
      }, 180);
    } else if (dy > 110 && Math.abs(dy) > Math.abs(dx)) {
      $("lb-close").click();
      setTimeout(function () { img.style.transition = ""; img.style.transform = ""; }, 350);
    } else {
      img.style.transform = "";
      setTimeout(function () { img.style.transition = ""; }, 220);
    }
  });

  // ---------- VIEWER: hearts ----------
  function heartAt(x, y) {
    var h = document.createElement("div");
    h.className = "fx-heart";
    h.style.left = x + "px"; h.style.top = y + "px";
    h.innerHTML = HEART;
    lb.appendChild(h);
    var a = h.animate([
      { transform: "scale(.2)", opacity: 0 },
      { transform: "scale(1.25)", opacity: 1, offset: 0.3 },
      { transform: "scale(1) translateY(-40px)", opacity: 1, offset: 0.7 },
      { transform: "scale(1) translateY(-95px)", opacity: 0 }
    ], { duration: 900, easing: "ease-out" });
    a.onfinish = function () { h.remove(); };
  }
  function pop(btn) {
    btn.animate([{ transform: "scale(1)" }, { transform: "scale(1.5)" }, { transform: "scale(.9)" }, { transform: "scale(1)" }], { duration: 420, easing: "ease-out" });
  }
  function burst(btn) {
    var r = btn.getBoundingClientRect(), cx = r.left + r.width / 2, cy = r.top + r.height / 2;
    for (var i = 0; i < 8; i++) {
      var s = document.createElement("div");
      s.className = "fx-spark";
      s.style.left = cx + "px"; s.style.top = cy + "px";
      s.innerHTML = HEART;
      lb.appendChild(s);
      var angle = (Math.PI * 2 * i) / 8, dist = 46 + (i % 2) * 18;
      (function (el) {
        var a = el.animate([
          { transform: "translate(0,0) scale(.4)", opacity: 1 },
          { transform: "translate(" + Math.cos(angle) * dist + "px," + Math.sin(angle) * dist + "px) scale(1)", opacity: 0 }
        ], { duration: 650, easing: "cubic-bezier(.2,.8,.2,1)" });
        a.onfinish = function () { el.remove(); };
      })(s);
    }
  }
  var lastLike = 0, lastFav = 0;
  likeBtn.addEventListener("click", function () { lastLike = Date.now(); }, true);
  favBtn.addEventListener("click", function () { lastFav = Date.now(); }, true);
  new MutationObserver(function () {   // only when the visitor has just clicked (not when a photo that was already liked opens)
    if (likeBtn.classList.contains("on") && Date.now() - lastLike < 4000) { lastLike = 0; pop(likeBtn); burst(likeBtn); }
  }).observe(likeBtn, { attributes: true, attributeFilter: ["class"] });
  new MutationObserver(function () {
    if (favBtn.classList.contains("on") && Date.now() - lastFav < 4000) { lastFav = 0; pop(favBtn); }
  }).observe(favBtn, { attributes: true, attributeFilter: ["class"] });

  // ---------- VIEWER: double-tap the photo to like it ----------
  var lastTap = { t: 0, x: 0, y: 0 }, suppress = false;
  stage.addEventListener("pointerup", function (e) {
    if (e.target !== img || likeBtn.hidden) { lastTap.t = 0; return; }
    var now = Date.now();
    if (now - lastTap.t < 320 && Math.hypot(e.clientX - lastTap.x, e.clientY - lastTap.y) < 50) {
      lastTap.t = 0;
      suppress = true; setTimeout(function () { suppress = false; }, 400);
      stage.classList.remove("zoomed");
      heartAt(e.clientX, e.clientY);
      if (!likeBtn.classList.contains("on") && !likeBtn.disabled) likeBtn.click();
    } else {
      lastTap = { t: now, x: e.clientX, y: e.clientY };
    }
  });
  stage.addEventListener("click", function (e) { if (suppress) e.stopPropagation(); }, true);   // the 2nd tap does not zoom
})();
