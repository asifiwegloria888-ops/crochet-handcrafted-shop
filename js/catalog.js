// The "engine" of your catalog. You normally NEVER edit this file: your articles are in js/products.js.
// It fills in everything you do not write for an article, so that a new article needs only a few lines.

(function () {
  // Kinds of articles. Used when an article does not say it itself:
  //   leadDays = days needed to make it (the customer must pick a ready date at least that far)
  //   cat      = filter button of the creation page: "vetements" (Clothes), "accessoires" (Accessories), "maison" (Scrunchies)
  var TYPES = {
    "Scrunchies":         { leadDays: 3,  cat: "maison" },
    "Dress":              { leadDays: 14, cat: "vetements" },
    "Sweater":            { leadDays: 14, cat: "vetements" },
    "Crop top":           { leadDays: 7,  cat: "vetements" },
    "Skirt":              { leadDays: 7,  cat: "vetements" },
    "Ruffle crochet hat": { leadDays: 7,  cat: "accessoires" },
    "Small bag":          { leadDays: 7,  cat: "accessoires" },
    "Two-piece":          { leadDays: 14,  cat: "vetements"},
    "Couple outfits":     { leadDays: 20, cat: "vetements"},
    "Crochet flower":     { leadDays: 7,  cat: "accessoires" }
  };

  // used only if products.js has no COLORS list
  var FALLBACK_COLORS = ["Black", "White", "Red", "Pink", "Yellow", "Orange", "Blue", "Green", "Purple", "Brown", "Beige", "Grey"];

  function install(data) {
    var PRODUCTS = data.PRODUCTS;
    var COLORS = data.COLORS && data.COLORS.length ? data.COLORS : FALLBACK_COLORS;
    var DEFAULT_LEAD = data.DEFAULT_LEAD_DAYS || 7;
    var ids = Object.keys(PRODUCTS);

    // defaults for every article
    ids.forEach(function (id) {
      var p = PRODUCTS[id];
      p.id = id;
      p.title = p.title || p.tittle || id;          // "tittle" (typo) is accepted too
      p.type = p.type || p.title;                    // the kind of article, e.g. "Dress"
      var kind = TYPES[p.type] || {};
      if (p.colors === undefined) p.colors = COLORS; // colors: [] means "no color choice"
      if (p.leadDays == null) p.leadDays = kind.leadDays != null ? kind.leadDays : DEFAULT_LEAD;
      p.cat = p.cat || kind.cat || "accessoires";
      p.photos = (p.photos || []).map(String);
    });

    // The customer sees the title only ("Dress"). With labelOf(id, true) (admin page and your own emails)
    // a small number tells identical titles apart: "Dress #31"
    var sameTitle = {};
    ids.forEach(function (id) { sameTitle[PRODUCTS[id].title] = (sameTitle[PRODUCTS[id].title] || 0) + 1; });

    function labelOf(id, forOwner) {
      var p = PRODUCTS[id];
      if (!p) return String(id);
      return forOwner && sameTitle[p.title] > 1 ? p.title + " #" + p.photos[0] : p.title;
    }

    // days needed for a list of articles: the longest one
    function leadDaysFor(list) {
      var days = 0;
      list.forEach(function (id) {
        var p = PRODUCTS[id];
        var d = p && p.leadDays != null ? p.leadDays : DEFAULT_LEAD;
        if (d > days) days = d;
      });
      return days;
    }

    // Finds the article for an old link or an old cart: ?item=Dress&photo=31 -> "dress-31"
    function resolveProduct(item, photo) {
      var has = Object.prototype.hasOwnProperty.call(PRODUCTS, item);
      photo = photo == null ? "" : String(photo);
      if (has && (!photo || PRODUCTS[item].photos.indexOf(photo) !== -1)) return item;
      if (photo) {
        for (var i = 0; i < ids.length; i++) if (PRODUCTS[ids[i]].photos.indexOf(photo) !== -1) return ids[i];
      }
      return has ? item : null;
    }

    return { TYPES: TYPES, labelOf: labelOf, leadDaysFor: leadDaysFor, resolveProduct: resolveProduct, ids: ids };
  }

  // ---- Server (Node): require("../js/catalog.js")(dataFromProductsJs) ----
  if (typeof module !== "undefined" && module.exports) {
    module.exports = install;
    return;
  }

  // ---- Browser ----
  var api = install({
    PRODUCTS: PRODUCTS,
    COLORS: typeof COLORS !== "undefined" ? COLORS : null,
    DEFAULT_LEAD_DAYS: typeof DEFAULT_LEAD_DAYS !== "undefined" ? DEFAULT_LEAD_DAYS : 7
  });
  window.labelOf = api.labelOf;
  window.leadDaysFor = api.leadDaysFor;
  window.resolveProduct = api.resolveProduct;

  // Creation page: every article of products.js gets a card automatically.
  // Cards you wrote by hand in creation.html stay as they are; only articles without a card are added.
  var grid = document.querySelector(".grille");
  if (grid) {
    var covered = {};
    Array.prototype.forEach.call(grid.querySelectorAll("a.btn"), function (a) {
      var m = /[?&]photo=([^&]+)/.exec(a.getAttribute("href") || "");
      if (m) covered[decodeURIComponent(m[1])] = true;
    });
    api.ids.forEach(function (id) {
      var p = PRODUCTS[id];
      if (p.photos.some(function (ph) { return covered[ph]; })) return;
      var card = document.createElement("article");
      card.className = "produit";
      card.setAttribute("data-cat", p.cat);
      var img = document.createElement("img");
      img.src = p.photos[0] + ".jpeg";
      img.alt = api.labelOf(id);
      img.loading = "lazy";
      var infos = document.createElement("div");
      infos.className = "infos";
      var h3 = document.createElement("h3"); h3.textContent = p.title;
      var desc = document.createElement("p"); desc.className = "desc"; desc.textContent = p.desc || "";
      var more = document.createElement("a"); more.className = "btn";
      more.href = "product.html?item=" + encodeURIComponent(id).replace(/%20/g, "+") + "&photo=" + p.photos[0];
      more.textContent = "View details";
      infos.appendChild(h3); infos.appendChild(desc); infos.appendChild(more);
      card.appendChild(img); card.appendChild(infos);
      grid.appendChild(card);
    });
  }
})();
