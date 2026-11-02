// "Pro" text animations for the HOME page.
//
//   WELCOME BLOCK - the small label pops in, the big title rises word by word from behind an invisible line,
//                   the paragraph appears word by word, then the buttons rise, while the photo slides in.
//   TITLES        - each section title (h2) rises word by word when the visitor scrolls down to it.
//   "ABOUT ME"    - the paragraph lights up word by word as it is scrolled into the middle of the screen.
//
// HOW TO USE (2 small changes in index.html):
//   1. in <head>, right after <link rel="stylesheet" href="css/style.css">, add these 2 lines (they stop the text from "blinking" before the animation):
//        <script>document.documentElement.className+=" tx-pre";setTimeout(function(){document.documentElement.classList.remove("tx-pre")},2500)</script>
//        <style>.tx-pre .home-hero .home-text>*,.tx-pre .home-hero .home-photo{opacity:0}</style>
//   2. at the bottom, add  <script src="js/text-fx.js"></script>  AFTER  <script src="js/site.js"></script>
//      (after site.js, so the text is already translated when it is cut into words)
//
// The translation keeps working: French and English are cut into words after being translated. For the other languages
// (translated by Google) the words are NOT cut (the translation would be bad): the blocks only fade in.
// A phone set to "reduce motion" gets the plain page.
(function () {
  var root = document.documentElement;
  var reduce = !!(window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  if (reduce) { root.classList.remove("tx-pre"); return; }
  var google = /(?:^|;\s*)googtrans=\/en\/(?!en\b|fr\b)/.test(document.cookie);   // another language, translated by Google
  var canSplit = !google;

  var css = document.createElement("style");
  css.textContent =
    ".tx-mask{display:inline-block;overflow:hidden;vertical-align:bottom;padding-bottom:.14em;margin-bottom:-.14em}" +
    ".tx-word{display:inline-block;transform:translateY(112%) rotate(5deg);transform-origin:left bottom;transition:transform .9s cubic-bezier(.2,.9,.2,1) var(--d,0ms)}" +
    ".tx-go .tx-word{transform:none}" +
    ".tx-fw{display:inline-block;opacity:0;transform:translateY(10px);transition:opacity .6s ease var(--d,0ms),transform .6s ease var(--d,0ms)}" +
    ".tx-go .tx-fw{opacity:1;transform:none}" +
    ".tx-block{opacity:0;transform:translateY(18px);transition:opacity .7s ease var(--d,0ms),transform .7s cubic-bezier(.2,.9,.2,1) var(--d,0ms)}" +
    ".tx-go .tx-block,.tx-block.tx-go{opacity:1;transform:none}" +
    ".tx-pop{opacity:0;transform:scale(.8);transition:opacity .6s ease var(--d,0ms),transform .7s cubic-bezier(.3,1.5,.5,1) var(--d,0ms)}" +
    ".tx-go .tx-pop{opacity:1;transform:none}" +
    ".tx-photo{opacity:0;transform:translateX(34px) scale(.95);transition:opacity 1s ease var(--d,0ms),transform 1.1s cubic-bezier(.2,.9,.2,1) var(--d,0ms)}" +
    ".tx-go .tx-photo{opacity:1;transform:none}" +
    ".tx-lit{opacity:.22;transition:opacity .3s ease}.tx-lit.on{opacity:1}";
  document.head.appendChild(css);

  // the text of an element is cut into words; the whole text stays readable for screen readers
  function cut(el, kind, start, step) {
    var text = el.textContent.replace(/\s+/g, " ").trim();
    if (!text) return 0;
    el.setAttribute("aria-label", text);
    el.setAttribute("translate", "no");            // set first: the language system leaves these words alone
    el.classList.add("notranslate");
    el.textContent = "";
    var words = text.split(" ");
    words.forEach(function (w, i) {
      var inner = document.createElement("span");
      inner.textContent = w;
      inner.setAttribute("aria-hidden", "true");
      var node = inner;
      if (kind === "mask") {
        inner.className = "tx-word";
        inner.style.setProperty("--d", (start + i * step) + "ms");
        node = document.createElement("span");
        node.className = "tx-mask";
        node.setAttribute("aria-hidden", "true");
        node.appendChild(inner);
      } else if (kind === "fade") {
        inner.className = "tx-fw";
        inner.style.setProperty("--d", (start + i * step) + "ms");
      } else {
        inner.className = "tx-lit";
      }
      el.appendChild(node);
      if (i < words.length - 1) el.appendChild(document.createTextNode(" "));
    });
    return words.length;
  }
  function block(el, delay) { el.classList.add("tx-block"); el.style.setProperty("--d", delay + "ms"); }
  function frames(fn) {
    if (window.requestAnimationFrame) requestAnimationFrame(function () { requestAnimationFrame(fn); });
    else setTimeout(fn, 60);
  }

  // ---------- WELCOME BLOCK ----------
  var hero = document.querySelector(".home-hero");
  if (hero) {
    var label = hero.querySelector(".label"), h1 = hero.querySelector("h1");
    var p = hero.querySelector(".home-text > p"), photo = hero.querySelector(".home-photo");
    var buttons = hero.querySelectorAll(".home-actions .btn");
    if (label) { label.classList.add("tx-pop"); label.style.setProperty("--d", "0ms"); }
    var n1 = 1, n2 = 1;
    if (h1) { if (canSplit) n1 = cut(h1, "mask", 140, 90); else block(h1, 140); }
    var afterTitle = 140 + n1 * 90 + 120;
    if (p) { if (canSplit) n2 = cut(p, "fade", afterTitle, 26); else block(p, afterTitle); }
    var afterText = afterTitle + n2 * 26 + 100;
    Array.prototype.forEach.call(buttons, function (b, i) { block(b, afterText + i * 120); });
    if (photo) { photo.classList.add("tx-photo"); photo.style.setProperty("--d", "250ms"); }
    root.classList.remove("tx-pre");                    // the text is ready to be animated: it can be shown (it starts hidden)
    frames(function () { hero.classList.add("tx-go"); });
    setTimeout(function () {                            // when finished, the pieces go back to their natural state (hover effects work normally)
      Array.prototype.forEach.call(hero.querySelectorAll(".tx-block,.tx-pop,.tx-photo"), function (e) {
        e.classList.remove("tx-block", "tx-pop", "tx-photo");
        e.style.removeProperty("--d");
      });
    }, afterText + 2600);
  } else {
    root.classList.remove("tx-pre");
  }

  // ---------- TITLES (h2) rise word by word when scrolled to ----------
  var titles = Array.prototype.slice.call(document.querySelectorAll("main h2"));
  titles.forEach(function (h) { if (canSplit) cut(h, "mask", 0, 80); else block(h, 0); });
  function showTitle(h) { h.classList.add("tx-go"); }
  if ("IntersectionObserver" in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) { if (e.isIntersecting) { io.unobserve(e.target); showTitle(e.target); } });
    }, { rootMargin: "0px 0px -12% 0px", threshold: 0.3 });
    titles.forEach(function (h) { io.observe(h); });
    setTimeout(function () { titles.forEach(showTitle); }, 15000);   // safety
  } else {
    titles.forEach(showTitle);
  }

  // ---------- "ABOUT ME": the paragraph lights up word by word ----------
  var about = document.querySelector(".about p");
  if (about && canSplit) {
    cut(about, "lit");
    var spans = Array.prototype.slice.call(about.querySelectorAll(".tx-lit"));
    var ticking = false;
    var update = function () {
      ticking = false;
      var r = about.getBoundingClientRect(), vh = window.innerHeight || 700;
      var progress = Math.max(0, Math.min(1, (vh * 0.9 - r.top) / (vh * 0.45 + r.height)));
      var lit = Math.round(progress * spans.length);
      spans.forEach(function (s, i) { s.classList.toggle("on", i < lit); });
    };
    window.addEventListener("scroll", function () {
      if (!ticking) { ticking = true; (window.requestAnimationFrame || setTimeout)(update); }
    }, { passive: true });
    update();
  }
})();
