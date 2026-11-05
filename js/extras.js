// Little extras for the whole site, in one file (add it to every page, AFTER js/site.js):
//   <script src="js/extras.js"></script>
//
//   all pages      - a thin progress bar at the top, a "back to top" button, a soft fade between pages,
//                    an optional announcement banner, the app icon (for "Add to home screen"), a "Track my order" link in the footer
//   Creation page  - "New" and "Most loved" labels on the cards
//   Article page   - a "Share on WhatsApp" button, and on a phone a bar at the bottom with the price and "Add to cart"
//   Home page      - a "How to order" section in 4 steps, wherever you write  <div id="how-to-order"></div>
(function () {
  // ======================= YOUR SETTINGS =======================
  var ANNOUNCEMENT = "";      // a message at the very top of every page, for example "Free delivery in Mukono this weekend!" ("" = none)
  var NEW_COUNT = 6;          // the last 6 articles of js/products.js get the "New" label (0 = none)
  var MIN_LIKES = 2;          // an article needs at least this many likes to get "Most loved"
  // =============================================================

  var $ = function (id) { return document.getElementById(id); };
  var reduce = !!(window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  var isPhone = window.matchMedia && window.matchMedia("(max-width: 700px)").matches;
  function t(s) { return typeof window.t === "function" ? window.t(s) : s; }   // French when the site is in French (js/lang-fr.js)
  function el(tag, cls, html) { var e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; }

  // ---------- styles ----------
  var css = document.createElement("style");
  css.textContent =
    ".ex-progress{position:fixed;top:0;left:0;right:0;height:3px;z-index:2000;background:#c9607f;transform:scaleX(0);transform-origin:left;pointer-events:none}" +
    ".ex-top{position:fixed;right:16px;bottom:84px;z-index:49;width:44px;height:44px;border-radius:50%;border:0;background:#fff;color:#c9607f;box-shadow:0 4px 14px rgba(0,0,0,.25);cursor:pointer;" +
    "display:flex;align-items:center;justify-content:center;opacity:0;transform:translateY(12px);pointer-events:none;transition:opacity .3s,transform .3s}" +
    ".ex-top.on{opacity:1;transform:none;pointer-events:auto}" +
    "body.ex-fade{animation:ex-in .5s ease both}@keyframes ex-in{from{opacity:0}to{opacity:1}}" +
    "body.ex-leave{opacity:0;transition:opacity .18s ease}" +
    ".ex-banner{position:relative;background:#c9607f;color:#fff;text-align:center;padding:9px 44px 9px 14px;font-size:.95rem}" +
    ".ex-banner button{position:absolute;right:8px;top:50%;transform:translateY(-50%);background:none;border:0;color:#fff;font-size:1.3rem;cursor:pointer;line-height:1}" +
    ".produit{position:relative}" +
    ".ex-badge{position:absolute;top:10px;left:10px;z-index:3;padding:4px 12px;border-radius:14px;font-size:.78rem;font-weight:bold;color:#fff;background:#c9607f;box-shadow:0 2px 8px rgba(0,0,0,.25)}" +
    ".ex-badge.love{left:auto;right:10px;background:#e0245e}" +
    ".ex-share{display:inline-flex;align-items:center;gap:8px;margin:10px 0 0 8px;padding:9px 16px;border-radius:20px;border:2px solid #25D366;color:#1a9c4a!important;background:#fff;font:inherit;font-weight:bold;text-decoration:none;cursor:pointer}" +
    ".ex-share:hover{background:#25D366;color:#fff!important}" +
    ".ex-sticky{position:fixed;left:0;right:0;bottom:0;z-index:48;display:flex;align-items:center;justify-content:space-between;gap:12px;padding:10px 14px calc(10px + env(safe-area-inset-bottom,0px));" +
    "background:#fff;box-shadow:0 -4px 16px rgba(0,0,0,.18);transform:translateY(110%);transition:transform .3s ease}" +
    ".ex-sticky.on{transform:none}" +
    ".ex-sticky b{color:#9e3c5a;font-size:1.05rem}" +
    ".ex-sticky button{border:0;border-radius:22px;background:#c9607f;color:#fff;padding:11px 22px;font:inherit;font-weight:bold;cursor:pointer}" +
    "body.ex-has-sticky .whatsapp-flottant,body.ex-has-sticky .lang-pick{bottom:84px}body.ex-has-sticky .ex-top{bottom:150px}" +
    // how to order
    ".ex-how{max-width:1000px;margin:36px auto;padding:0 16px}" +
    ".ex-steps{list-style:none;margin:26px 0 0;padding:0;display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:22px;position:relative}" +
    ".ex-steps::before{content:'';position:absolute;top:34px;left:12%;right:12%;border-top:2px dashed #e8a5b8;z-index:0}" +
    ".ex-step{position:relative;z-index:1;text-align:center;padding:0 6px;opacity:0;transform:translateY(22px)}" +
    ".ex-step.ex-in{opacity:1;transform:none;transition:opacity .6s ease,transform .6s cubic-bezier(.2,.9,.2,1)}" +
    ".ex-ico{display:inline-flex;align-items:center;justify-content:center;width:68px;height:68px;border-radius:50%;background:#fff;border:3px solid #c9607f;color:#c9607f;box-shadow:0 6px 16px rgba(201,96,127,.25)}" +
    ".ex-n{display:block;margin-top:10px;font-weight:bold;color:#c9607f;font-size:.85rem;letter-spacing:.08em}" +
    ".ex-step h3{margin:2px 0 6px;color:#9e3c5a}.ex-step p{margin:0;text-align:center;font-size:.95rem}" +
    "@media (max-width:640px){.ex-steps::before{display:none}.ex-steps{grid-template-columns:1fr 1fr}}" +
    "@media (prefers-reduced-motion:reduce){body.ex-fade{animation:none}.ex-step{opacity:1;transform:none}}";
  document.head.appendChild(css);

  // ---------- the app icon (for "Add to home screen") ----------
  function headTag(tag, attrs) { var e = document.createElement(tag); for (var k in attrs) e.setAttribute(k, attrs[k]); document.head.appendChild(e); }
  if (!document.querySelector('link[rel="manifest"]')) headTag("link", { rel: "manifest", href: "manifest.webmanifest" });
  if (!document.querySelector('meta[name="theme-color"]')) headTag("meta", { name: "theme-color", content: "#c9607f" });
  if (!document.querySelector('link[rel="apple-touch-icon"]')) headTag("link", { rel: "apple-touch-icon", href: "apple-touch-icon.png" });
  if (!document.querySelector('link[rel~="icon"]')) headTag("link", { rel: "icon", type: "image/png", href: "favicon-32.png" });
  headTag("meta", { name: "apple-mobile-web-app-title", content: "Crochet Shop" });

  // ---------- announcement banner ----------
  if (ANNOUNCEMENT) {
    var seen = "";
    try { seen = localStorage.getItem("exBanner") || ""; } catch (e) {}
    if (seen !== ANNOUNCEMENT) {
      var b = el("div", "ex-banner");
      b.appendChild(document.createTextNode(t(ANNOUNCEMENT)));
      var x = el("button", "", "&times;");
      x.type = "button"; x.setAttribute("aria-label", t("Close"));
      x.addEventListener("click", function () { b.remove(); try { localStorage.setItem("exBanner", ANNOUNCEMENT); } catch (e) {} });
      b.appendChild(x);
      document.body.insertBefore(b, document.body.firstChild);
    }
  }

  // ---------- progress bar + back to top ----------
  var bar = el("div", "ex-progress"); bar.setAttribute("aria-hidden", "true");
  var up = el("button", "ex-top", '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="18 15 12 9 6 15"/></svg>');
  up.type = "button"; up.setAttribute("aria-label", t("Back to top"));
  up.addEventListener("click", function () { window.scrollTo({ top: 0, behavior: reduce ? "auto" : "smooth" }); });
  document.body.appendChild(bar); document.body.appendChild(up);
  var ticking = false;
  function onScroll() {
    ticking = false;
    var h = document.documentElement.scrollHeight - window.innerHeight;
    var y = window.pageYOffset || document.documentElement.scrollTop || 0;
    bar.style.transform = "scaleX(" + (h > 0 ? Math.min(1, y / h) : 0) + ")";
    up.classList.toggle("on", y > 600);
  }
  window.addEventListener("scroll", function () { if (!ticking) { ticking = true; (window.requestAnimationFrame || setTimeout)(onScroll); } }, { passive: true });
  onScroll();

  // ---------- soft fade between pages ----------
  if (!reduce) {
    document.body.classList.add("ex-fade");
    window.addEventListener("pageshow", function (e) { if (e.persisted) document.body.classList.remove("ex-leave"); });   // back button
    document.addEventListener("click", function (e) {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      var a = e.target.closest ? e.target.closest("a[href]") : null;
      if (!a || (a.target && a.target !== "_self") || a.hasAttribute("download") || a.hasAttribute("data-no-fade")) return;
      var url;
      try { url = new URL(a.href, location.href); } catch (err) { return; }
      if (url.origin !== location.origin || !/^https?:$/.test(url.protocol)) return;
      if (url.pathname === location.pathname && url.search === location.search) return;   // same page (anchors, hash)
      if (/^\/api\//.test(url.pathname)) return;
      e.preventDefault();
      document.body.classList.add("ex-leave");
      setTimeout(function () { location.href = url.href; }, 180);
    });
  }

  // ---------- "Track my order" link in the footer ----------
  var footer = document.querySelector(".site-footer");
  if (footer && !/track-order/.test(location.pathname) && !footer.querySelector('a[href="track-order.html"]')) {
    var fp = el("p"); var fa = el("a"); fa.href = "track-order.html"; fa.textContent = t("Track my order");
    fp.appendChild(fa); footer.appendChild(fp);
  }

  // ---------- Creation page: "New" and "Most loved" labels ----------
  var grid = document.querySelector(".grille");
  if (grid) {
    var loved = {}, lovedDone = false, tries = 0;
    var tryBadges = function () {
      if (typeof PRODUCTS === "undefined" || typeof resolveProduct !== "function") { if (++tries < 20) setTimeout(tryBadges, 300); return; }
      var newest = {};
      if (NEW_COUNT > 0) Object.keys(PRODUCTS).slice(-NEW_COUNT).forEach(function (id) { newest[id] = true; });
      var paint = function () {
        Array.prototype.forEach.call(grid.querySelectorAll(".produit"), function (card) {
          if (card.getAttribute("data-ex")) return;
          var a = card.querySelector("a.btn"); if (!a) return;
          var u; try { u = new URL(a.getAttribute("href"), location.href); } catch (e) { return; }
          var id = resolveProduct(u.searchParams.get("item"), u.searchParams.get("photo"));
          if (!id) return;
          card.setAttribute("data-ex", "1");
          if (newest[id]) card.appendChild(el("span", "ex-badge", t("New")));
          if (loved[id]) card.appendChild(el("span", "ex-badge love", "&#9829; " + t("Most loved")));
        });
      };
      paint();
      fetch("/api/top").then(function (r) { return r.json(); }).then(function (d) {
        (d.top || []).slice(0, 3).forEach(function (r) { if (r.n >= MIN_LIKES) loved[r.item] = true; });
        Array.prototype.forEach.call(grid.querySelectorAll(".produit"), function (c) { c.removeAttribute("data-ex"); Array.prototype.forEach.call(c.querySelectorAll(".ex-badge"), function (b2) { b2.remove(); }); });
        paint();
      }).catch(function () {});
      if (window.MutationObserver) new MutationObserver(paint).observe(grid, { childList: true });   // cards added later
    };
    tryBadges();
  }

  // ---------- Article page: WhatsApp share + bar at the bottom of a phone ----------
  var add = $("pd-add");
  if (add) {
    var q = new URLSearchParams(location.search);
    var id = typeof resolveProduct === "function" ? resolveProduct(q.get("item"), q.get("photo")) : q.get("item");
    if (id) {
      var title = (typeof PRODUCTS !== "undefined" && PRODUCTS[id] && PRODUCTS[id].title) || id;
      var share = el("a", "ex-share", '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 11.5a8.4 8.4 0 0 1-9 8.4 8.5 8.5 0 0 1-3.8-.9L3 21l1.9-5.2A8.4 8.4 0 1 1 21 11.5z"/></svg><span></span>');
      share.querySelector("span").textContent = t("Share on WhatsApp");
      share.target = "_blank"; share.rel = "noopener";
      // the message: name + price in shillings AND dollars (written by the server, in the language of the visitor) + the link
      var lang = window.SHOP_LANG === "fr" ? "fr" : "en";
      var link = location.origin + "/api/share?item=" + encodeURIComponent(id) + (lang === "fr" ? "&lang=fr" : "");
      var setShare = function (text) { share.href = "https://wa.me/?text=" + encodeURIComponent(text + "\n" + link); };
      setShare(title);
      fetch("/api/share?item=" + encodeURIComponent(id) + "&lang=" + lang + "&format=json")
        .then(function (r) { return r.json(); })
        .then(function (d) { if (d && d.ok && d.text) setShare(d.text); })
        .catch(function () {});
      add.parentNode.insertBefore(share, add.nextSibling);
    }
    if (isPhone && "IntersectionObserver" in window && $("pd-total")) {
      var sticky = el("div", "ex-sticky");
      var total = el("b"); var go = el("button"); go.type = "button"; go.textContent = t("Add to cart");
      sticky.appendChild(total); sticky.appendChild(go); document.body.appendChild(sticky);
      var syncTotal = function () { total.textContent = $("pd-total").textContent; };
      syncTotal();
      if (window.MutationObserver) new MutationObserver(syncTotal).observe($("pd-total"), { childList: true, characterData: true, subtree: true });
      go.addEventListener("click", function () {
        add.click();
        setTimeout(function () {                       // an error (size, color...) is written near the real button: show it
          var m = $("pd-msg");
          if (m && /err/.test(m.className) && m.scrollIntoView) m.scrollIntoView({ behavior: "smooth", block: "center" });
        }, 80);
      });
      new IntersectionObserver(function (entries) {
        var visible = !entries[0].isIntersecting && entries[0].boundingClientRect.top > 0;   // the real button is still below: show the bar
        sticky.classList.toggle("on", visible);
        document.body.classList.toggle("ex-has-sticky", visible);
      }).observe(add);
    }
  }

  // ---------- Home page: "How to order" ----------
  var how = $("how-to-order");
  if (how) {
    var ICON = {
      choose: '<path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1-1.1a5.5 5.5 0 0 0-7.8 7.8l1 1.1L12 21.2l7.8-7.7 1-1.1a5.5 5.5 0 0 0 0-7.8z"/>',
      order: '<path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/>',
      pay: '<rect x="5" y="2" width="14" height="20" rx="2"/><line x1="12" y1="18" x2="12" y2="18.01"/>',
      receive: '<path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/>'
    };
    var STEPS = [
      ["choose", "Choose", "Pick the creation you love, then choose your size and your color."],
      ["order", "Order", "Send your order with the date you want it to be ready."],
      ["pay", "Pay 50%", "I confirm the price by email, then you send the deposit."],
      ["receive", "Receive", "Pick it up or get it delivered when it is ready."]
    ];
    var sec = el("section", "ex-how"); sec.setAttribute("aria-labelledby", "ex-how-h");
    var h = el("h2"); h.id = "ex-how-h"; h.textContent = t("How to order"); sec.appendChild(h);
    var ol = el("ol", "ex-steps");
    STEPS.forEach(function (s, i) {
      var li = el("li", "ex-step");
      li.innerHTML = '<span class="ex-ico"><svg viewBox="0 0 24 24" width="30" height="30" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + ICON[s[0]] + '</svg></span><span class="ex-n"></span><h3></h3><p></p>';
      li.querySelector(".ex-n").textContent = t("Step") + " " + (i + 1);
      li.querySelector("h3").textContent = t(s[1]);
      li.querySelector("p").textContent = t(s[2]);
      ol.appendChild(li);
    });
    sec.appendChild(ol); how.appendChild(sec);
    var steps = Array.prototype.slice.call(ol.children);
    if (reduce || !("IntersectionObserver" in window)) steps.forEach(function (s) { s.classList.add("ex-in"); });
    else {
      new IntersectionObserver(function (entries, ob) {
        if (!entries.some(function (e) { return e.isIntersecting; })) return;
        ob.disconnect();
        steps.forEach(function (s, i) { setTimeout(function () { s.classList.add("ex-in"); }, i * 220); });   // one after the other
      }, { threshold: 0.25 }).observe(ol);
      setTimeout(function () { steps.forEach(function (s) { s.classList.add("ex-in"); }); }, 12000);   // safety
    }
  }
})();
