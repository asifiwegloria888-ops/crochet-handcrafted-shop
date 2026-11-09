// Pages Creation and Article (product.html): a click on a photo opens it big (like Instagram).
// Click it again to zoom, move to look around.
// Close with the cross at the top, the Escape key, or a click outside the photo.
// Nothing else of the pages changes (price, sizes, colors, buttons, thumbnails stay as they are).
// Add it to creation.html AND product.html AFTER js/extras.js:   <script src="js/photo-viewer.js"></script>
(function () {
  if (!document.querySelector(".grille") && !document.getElementById("pd-main")) return;

  // the photos that open in the viewer: the cards of the Creation page, the big photo of an article page
  var PHOTOS = ".grille .produit img, #pd-main";

  function t(s) { return typeof window.t === "function" ? window.t(s) : s; }   // French when the site is in French

  var css = document.createElement("style");
  css.textContent =
    ".grille .produit img,#pd-main{cursor:zoom-in}" +
    ".pv{position:fixed;inset:0;z-index:3000;display:none;align-items:center;justify-content:center;background:rgba(24,12,17,.93);overflow:hidden;overscroll-behavior:contain}" +
    ".pv.on{display:flex}" +
    ".pv-img{display:block;max-width:94vw;max-height:88vh;width:auto;height:auto;object-fit:contain;margin:0!important;border-radius:12px;box-shadow:none!important;cursor:zoom-in;transition:transform .25s ease;user-select:none;-webkit-user-drag:none}" +
    ".pv-img.zoomed{transform:scale(2.4);cursor:zoom-out;touch-action:none}" +
    ".pv-close{position:fixed;top:max(14px,env(safe-area-inset-top,0px));right:14px;z-index:3001;width:46px;height:46px;padding:0;border:0;border-radius:50%;" +
    "background:#fff!important;color:#c9607f!important;font-size:1.9rem;line-height:1;display:flex;align-items:center;justify-content:center;cursor:pointer;" +
    "box-shadow:0 4px 14px rgba(0,0,0,.35)!important;transform:none!important}" +
    ".pv-close:hover{background:#fbe6ec!important}" +
    "@media (prefers-reduced-motion:reduce){.pv-img{transition:none}}";
  document.head.appendChild(css);

  var overlay = document.createElement("div");
  overlay.className = "pv";
  overlay.setAttribute("role", "dialog");
  overlay.setAttribute("aria-modal", "true");
  overlay.setAttribute("aria-label", t("Photo viewer"));

  var big = document.createElement("img");
  big.className = "pv-img";
  big.alt = "";
  big.draggable = false;

  var closeBtn = document.createElement("button");
  closeBtn.type = "button";
  closeBtn.className = "pv-close";
  closeBtn.setAttribute("aria-label", t("Close"));
  closeBtn.innerHTML = "&times;";

  overlay.appendChild(big);
  overlay.appendChild(closeBtn);
  document.body.appendChild(overlay);

  var lastFocus = null;
  var baseRect = null;   // size of the photo before zoom, to follow the finger or the mouse

  function setOrigin(x, y) {
    if (!baseRect) return;
    var px = Math.min(100, Math.max(0, ((x - baseRect.left) / baseRect.width) * 100));
    var py = Math.min(100, Math.max(0, ((y - baseRect.top) / baseRect.height) * 100));
    big.style.transformOrigin = px + "% " + py + "%";
  }

  function unzoom() {
    big.classList.remove("zoomed");
    big.style.transformOrigin = "";
    baseRect = null;
  }

  function open(src, alt) {
    lastFocus = document.activeElement;
    unzoom();
    big.src = src;
    big.alt = alt || "";
    overlay.classList.add("on");
    document.body.style.overflow = "hidden";
    closeBtn.focus();
  }

  function close() {
    if (!overlay.classList.contains("on")) return;
    overlay.classList.remove("on");
    unzoom();
    big.removeAttribute("src");
    document.body.style.overflow = "";
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  }

  // a click on a photo of a card opens the viewer (runs before the page fade and before any link around the photo)
  document.addEventListener("click", function (e) {
    if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    var img = e.target.closest ? e.target.closest(PHOTOS) : null;
    if (!img || !(img.currentSrc || img.getAttribute("src"))) return;
    e.preventDefault();
    e.stopPropagation();
    open(img.currentSrc || img.src, img.alt);
  }, true);

  // click on the photo: zoom in / zoom out
  big.addEventListener("click", function (e) {
    e.stopPropagation();
    if (big.classList.contains("zoomed")) { unzoom(); return; }
    baseRect = big.getBoundingClientRect();
    setOrigin(e.clientX, e.clientY);
    big.classList.add("zoomed");
  });
  big.addEventListener("pointermove", function (e) {
    if (big.classList.contains("zoomed")) setOrigin(e.clientX, e.clientY);
  });

  // close: cross, click outside the photo, Escape
  closeBtn.addEventListener("click", function (e) { e.stopPropagation(); close(); });
  overlay.addEventListener("click", function (e) { if (e.target === overlay) close(); });
  document.addEventListener("keydown", function (e) {
    if (!overlay.classList.contains("on")) return;
    if (e.key === "Escape") { e.preventDefault(); close(); }
    else if (e.key === "Tab") { e.preventDefault(); closeBtn.focus(); }   // keep the focus inside the viewer
  });
})();