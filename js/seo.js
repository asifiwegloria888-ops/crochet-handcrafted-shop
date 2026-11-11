// Google visibility: titles, descriptions, canonical links and product information (name, price in shillings, photo).
// Add this line before </body> on index.html, creation.html, contact.html and product.html:
//   <script src="js/seo.js" defer></script>
// product.html must also load js/products.js (it already does for the price).
(function () {
  "use strict";

  // ======================= YOUR SETTINGS =======================
  var SITE = "https://glo-crochet.vercel.app";   // the address of your site. Change it if you get your own domain.
  var SHOP = "Crochet Handcrafted Shop";
  var USD_RATE_DEFAULT = 3700;   // shillings for 1 dollar: keep it the same as UGX_PER_USD in js/i18n.js.
                                 // If js/products.js has a line "var USD_RATE = ...", that number is used instead.
  // =============================================================

  var french = window.SHOP_LANG === "fr";
  var page = location.pathname.split("/").pop() || "index.html";
  if (!/\.html$/.test(page)) page = "index.html";

  /* ---------- small helpers ---------- */
  function head(el) { document.head.appendChild(el); return el; }
  function meta(attr, name, content) {
    var m = document.head.querySelector("meta[" + attr + '="' + name + '"]');
    if (!m) { m = document.createElement("meta"); m.setAttribute(attr, name); head(m); }
    m.setAttribute("content", content);
  }
  function canonical(url) {
    var l = document.head.querySelector('link[rel="canonical"]');
    if (!l) { l = document.createElement("link"); l.setAttribute("rel", "canonical"); head(l); }
    l.setAttribute("href", url);
  }
  function json(id, data) {
    var old = document.getElementById(id);
    if (old) old.remove();
    var s = document.createElement("script");
    s.type = "application/ld+json"; s.id = id;
    s.textContent = JSON.stringify(data).replace(/</g, "\\u003c");
    head(s);
  }
  function cut(s, n) { s = String(s || "").replace(/\s+/g, " ").trim(); return s.length > n ? s.slice(0, n - 1).replace(/\s+\S*$/, "") + "…" : s; }
  function fmt(n) { return String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ","); }

  /* ---------- the fixed pages ---------- */
  var PAGES = {
    "index.html": {
      path: "/",
      title: "Handmade crochet clothes and accessories | " + SHOP,
      desc: "Handmade crochet dresses, two pieces, tops, bags, scarves and more, made to measure in the colors you choose. Order online and pay a 50% deposit."
    },
    "creation.html": {
      path: "/creation.html",
      title: "Crochet creations: dresses, two pieces, tops and bags | " + SHOP,
      desc: "See all our handmade crochet creations: dresses, two pieces, crop tops, sweaters, skirts, bags, scarves and hats. Made to measure, in your colors."
    },
    "contact.html": {
      path: "/contact.html",
      title: "Contact | " + SHOP,
      desc: "Write to " + SHOP + " on WhatsApp or by email to ask a question or start your custom crochet order."
    }
  };

  function fixedPage(p) {
    if (!french) document.title = p.title;            // French visitors keep the French title of the site
    meta("name", "description", p.desc);
    meta("property", "og:title", p.title);
    meta("property", "og:description", p.desc);
    meta("property", "og:site_name", SHOP);
    canonical(SITE + p.path);
  }

  /* ---------- the home page: who we are ---------- */
  function homeData() {
    var phone = "+" + String(window.SHOP_WHATSAPP || "").replace(/\D/g, "");
    var org = { "@type": "Organization", "@id": SITE + "/#shop", name: SHOP, url: SITE + "/" };
    if (phone.length > 8) org.contactPoint = { "@type": "ContactPoint", telephone: phone, contactType: "customer service" };
    json("ld-shop", { "@context": "https://schema.org", "@graph": [
      org,
      { "@type": "WebSite", "@id": SITE + "/#site", name: SHOP, url: SITE + "/", publisher: { "@id": SITE + "/#shop" } }
    ] });
  }

  /* ---------- an article page: name, price, photo ---------- */
  function prices(p) {
    if (typeof p.price === "number") return [p.price];
    var out = [];
    Object.keys(p.sizes || {}).forEach(function (k) { if (typeof p.sizes[k] === "number" && p.sizes[k] > 0) out.push(p.sizes[k]); });
    return out;
  }

  function findId(item, photo) {
    if (typeof window.resolveProduct === "function") {
      try { var r = window.resolveProduct(item, photo); if (r && PRODUCTS[r]) return r; } catch (e) {}
    }
    if (item && Object.prototype.hasOwnProperty.call(PRODUCTS, item)) return item;
    if (photo) {
      var keys = Object.keys(PRODUCTS);
      for (var i = 0; i < keys.length; i++) if ((PRODUCTS[keys[i]].photos || []).map(String).indexOf(String(photo)) !== -1) return keys[i];
    }
    return "";
  }

  function productPage() {
    var tries = 0;
    (function go() {
      if (typeof PRODUCTS === "undefined") { if (++tries < 20) setTimeout(go, 300); return; }
      var q = new URLSearchParams(location.search);
      var id = findId(q.get("item"), q.get("photo"));
      if (!id) { meta("name", "robots", "noindex"); return; }      // unknown article: not for Google
      var p = PRODUCTS[id];
      var photo = String((p.photos || [""])[0]);
      var url = SITE + "/product.html?item=" + encodeURIComponent(id) + "&photo=" + encodeURIComponent(photo);   // ONE address per article
      var image = SITE + "/" + encodeURIComponent(photo) + ".jpeg";
      var name = (p.title || id) + " #" + photo;
      var list = prices(p);
      var low = list.length ? Math.min.apply(null, list) : 0;
      var high = list.length ? Math.max.apply(null, list) : 0;
      var base = String(p.desc || "").replace(/\s+/g, " ").trim() || "Handmade crochet, made with love.";
      var baseEnd = /[.!?]$/.test(base) ? base : base + ".";
      var rate = typeof USD_RATE === "number" && USD_RATE > 0 ? USD_RATE : USD_RATE_DEFAULT;
      var usdNum = function (ugx) { var d = ugx / rate; return d >= 100 ? Math.round(d) : Math.round(d * 100) / 100; };
      var usdText = function (ugx) { var d = ugx / rate; return "$" + (d >= 100 ? fmt(Math.round(d)) : d.toFixed(2)); };
      var desc = cut("Handmade crochet " + String(p.title || "").toLowerCase() + ". " + baseEnd + (low ? " From " + fmt(low) + " UGX (about " + usdText(low) + ")." : ""), 158);
      var title = "Handmade crochet " + name + " | " + SHOP;

      if (!french) document.title = title;
      meta("name", "description", desc);
      meta("property", "og:title", title);
      meta("property", "og:description", desc);
      meta("property", "og:image", image);
      meta("property", "og:url", url);
      meta("property", "og:site_name", SHOP);
      canonical(url);

      var product = {
        "@context": "https://schema.org",
        "@type": "Product",
        name: name,
        description: base,
        image: [image],
        sku: id,
        brand: { "@type": "Brand", name: SHOP }
      };
      if (low) {
        // one offer in shillings (the real price) and one in dollars (the same price, converted)
        var offer = function (cur, a, b) {
          var common = { priceCurrency: cur, availability: "https://schema.org/InStock", itemCondition: "https://schema.org/NewCondition", url: url };
          return a === b
            ? Object.assign({ "@type": "Offer", price: a }, common)
            : Object.assign({ "@type": "AggregateOffer", lowPrice: a, highPrice: b, offerCount: list.length }, common);
        };
        product.offers = [offer("UGX", low, high), offer("USD", usdNum(low), usdNum(high))];
      }
      json("ld-product", product);
    })();
  }

  /* ---------- go ---------- */
  if (page === "product.html") productPage();
  else if (PAGES[page]) {
    fixedPage(PAGES[page]);
    if (page === "index.html") homeData();
  }
})();