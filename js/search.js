/* Search, type filters, sorting and price filter for creation.html
   Reads the cards already on the page + PRODUCTS (products.js).
   Needs: <script src="products.js"></script> loaded BEFORE this file. */
(function () {
  "use strict";

  var grid = document.querySelector(".grille");
  if (!grid || typeof PRODUCTS === "undefined") return;

  /* ---------- Style (inside this file, so only ONE file has to be updated) ---------- */
  var css = document.createElement("style");
  css.textContent = [
    ".filtres{display:none}",
    ".bx-tools{margin:16px 0}",
    ".bx-tools .bx-search{display:block;width:100%!important;max-width:none!important;box-sizing:border-box;padding:12px 14px;font-size:16px;border:1px solid #e8a0b4;border-radius:10px;background:#fff;color:#3a2f33}",
    ".bx-tools .bx-row{display:flex;flex-wrap:wrap;gap:8px;margin:10px 0}",
    ".bx-tools .bx-row select{flex:1 1 150px;width:auto;box-sizing:border-box;padding:10px;font-size:16px;border:1px solid #e8a0b4;border-radius:10px;background:#fff;color:#3a2f33}",
    ".bx-tools .bx-types{display:flex;flex-wrap:wrap;gap:8px;margin:6px 0}",
    ".bx-tools .bx-chip{all:unset;box-sizing:border-box;display:inline-block!important;width:auto!important;height:auto!important;min-width:0!important;padding:8px 14px!important;border:1px solid #c9607f!important;border-radius:999px!important;background:#fff!important;color:#9e3c5a!important;font-family:inherit;font-size:14px!important;font-weight:bold;line-height:1.2!important;text-indent:0!important;text-align:center;white-space:nowrap;cursor:pointer;-webkit-text-fill-color:#9e3c5a!important}",
    ".bx-tools .bx-chip.bx-on{background:#c9607f!important;color:#fff!important;-webkit-text-fill-color:#fff!important}",
    ".bx-tools .bx-count{margin:8px 0;font-size:14px}",
    ".bx-tools .bx-reset{all:unset;margin-left:8px;color:#c9607f;font-weight:bold;text-decoration:underline;cursor:pointer}"
  ].join("\n");
  document.head.appendChild(css);

  /* ---------- Texts (English / French) ---------- */
  var T = {
    en: {
      search: "Search: dress, bag, scarf...",
      all: "All",
      sortDefault: "Default order",
      sortAsc: "Price: low to high",
      sortDesc: "Price: high to low",
      anyPrice: "Any price",
      upTo: "Up to",
      over: "Over",
      cur: "UGX",
      from: "From",
      none: "item",
      many: "items",
      empty: "No item found. Try another word or clear the filters.",
      reset: "Clear filters"
    },
    fr: {
      search: "Recherche : robe, sac, écharpe...",
      all: "Tout",
      sortDefault: "Ordre normal",
      sortAsc: "Prix : du moins cher au plus cher",
      sortDesc: "Prix : du plus cher au moins cher",
      anyPrice: "Tous les prix",
      upTo: "Jusqu'à",
      over: "Plus de",
      cur: "UGX",
      from: "À partir de",
      none: "article",
      many: "articles",
      empty: "Aucun article trouvé. Essaie un autre mot ou efface les filtres.",
      reset: "Effacer les filtres"
    }
  };

  /* ---------- Types: English label + French label ---------- */
  var TYPES = {
    "dress": { en: "Dress", fr: "Robe" },
    "two piece": { en: "Two piece", fr: "Ensemble" },
    "crop top": { en: "Crop top", fr: "Crop top" },
    "sweater": { en: "Sweater", fr: "Pull" },
    "skirt": { en: "Skirt", fr: "Jupe" },
    "shirt": { en: "Shirt", fr: "Chemise" },
    "short": { en: "Short", fr: "Short" },
    "bikini": { en: "Bikini", fr: "Bikini" },
    "small bag": { en: "Small bag", fr: "Petit sac" },
    "scarf": { en: "Scarf", fr: "Écharpe" },
    "scarf and hat": { en: "Scarf and hat", fr: "Écharpe et bonnet" },
    "ruffle crochet hat": { en: "Ruffle crochet hat", fr: "Bonnet crochet à volants" },
    "crochet flower": { en: "Crochet flower", fr: "Fleur au crochet" },
    "scrunchies": { en: "Scrunchies", fr: "Chouchous" },
    "couple outfits": { en: "Couple outfits", fr: "Tenues de couple" }
  };

  var RANGES = [
    { id: "all" },
    { id: "u20", max: 20000 },
    { id: "u30", max: 30000 },
    { id: "u50", max: 50000 },
    { id: "u100", max: 100000 },
    { id: "o100", min: 100000 }
  ];

  /* ---------- Helpers ---------- */
  function lang() {
    var l = "";
    try {
      l = localStorage.getItem("lang") || localStorage.getItem("language") ||
          localStorage.getItem("langue") || "";
    } catch (e) {}
    l = l || document.documentElement.lang || "en";
    return String(l).toLowerCase().indexOf("fr") === 0 ? "fr" : "en";
  }

  function norm(s) {
    return String(s || "").toLowerCase()
      .normalize("NFD").replace(/[̀-ͯ]/g, "")
      .replace(/\s+/g, " ").trim();
  }

  // Makes "Two-piece", "Two pieces", "Crochet flowerg", "scarf"... land in the right type.
  function typeKey(title) {
    var t = String(title || "").toLowerCase().replace(/-/g, " ").replace(/\s+/g, " ").trim();
    if (t.indexOf("crochet flower") === 0) return "crochet flower";
    if (t.indexOf("two piece") === 0) return "two piece";
    if (t.indexOf("couple outfit") === 0) return "couple outfits";
    return t;
  }

  function typeLabel(key, l) {
    if (TYPES[key]) return TYPES[key][l];
    return key.charAt(0).toUpperCase() + key.slice(1);
  }

  function pricesOf(p) {
    if (typeof p.price === "number") return [p.price];
    var out = [];
    Object.keys(p.sizes || {}).forEach(function (k) {
      if (typeof p.sizes[k] === "number") out.push(p.sizes[k]);
    });
    return out;
  }

  function fmt(n, l) {
    return n.toLocaleString(l === "fr" ? "fr-FR" : "en-US");
  }

  /* ---------- Link each card to its article in PRODUCTS (by photo number) ---------- */
  var byPhoto = {};
  Object.keys(PRODUCTS).forEach(function (k) {
    var p = PRODUCTS[k];
    (p.photos || []).forEach(function (ph, i) {
      ph = String(ph);
      if (!byPhoto[ph] || i === 0) byPhoto[ph] = p;
    });
  });

  var cards = Array.prototype.slice.call(grid.querySelectorAll(".produit")).map(function (el, i) {
    var img = el.querySelector("img");
    var m = ((img && img.getAttribute("src")) || "").match(/(\d+)\.[a-z]+$/i);
    var p = m ? byPhoto[m[1]] : null;
    var h3 = el.querySelector("h3");
    var d = el.querySelector(".desc");
    var prices = p ? pricesOf(p) : [];
    var min = prices.length ? Math.min.apply(null, prices) : null;
    var max = prices.length ? Math.max.apply(null, prices) : null;
    return {
      el: el,
      index: i,
      key: typeKey(p ? p.title : (h3 ? h3.textContent : "")),
      min: min,
      own: norm((h3 ? h3.textContent : "") + " " + (d ? d.textContent : "") + " " + (p ? p.desc : ""))
    };
  });

  /* ---------- Build the controls ---------- */
  var bar = document.createElement("div");
  bar.className = "bx-tools";
  bar.innerHTML =
    '<input type="search" class="bx-search" autocomplete="off">' +
    '<div class="bx-row"><select class="bx-sort"></select><select class="bx-price"></select></div>' +
    '<div class="bx-types"></div>' +
    '<p class="bx-count" aria-live="polite"></p>' +
    '<p class="bx-empty" style="display:none"></p>';
  grid.parentNode.insertBefore(bar, grid);

  var elSearch = bar.querySelector(".bx-search");
  var elSort = bar.querySelector(".bx-sort");
  var elPrice = bar.querySelector(".bx-price");
  var elTypes = bar.querySelector(".bx-types");
  var elCount = bar.querySelector(".bx-count");
  var elEmpty = bar.querySelector(".bx-empty");

  var state = { q: "", type: "all", sort: "default", range: "all" };

  // Types found on the page, biggest first
  var counts = {};
  cards.forEach(function (c) { counts[c.key] = (counts[c.key] || 0) + 1; });
  var keys = Object.keys(counts).sort(function (a, b) { return counts[b] - counts[a]; });

  /* ---------- Texts that depend on the language ---------- */
  function applyLang() {
    var l = lang();
    var t = T[l];

    elSearch.placeholder = t.search;
    elSearch.setAttribute("aria-label", t.search);

    elSort.innerHTML =
      '<option value="default">' + t.sortDefault + "</option>" +
      '<option value="asc">' + t.sortAsc + "</option>" +
      '<option value="desc">' + t.sortDesc + "</option>";
    elSort.value = state.sort;

    elPrice.innerHTML = RANGES.map(function (r) {
      var label = t.anyPrice;
      if (r.max) label = t.upTo + " " + fmt(r.max, l) + " " + t.cur;
      if (r.min) label = t.over + " " + fmt(r.min, l) + " " + t.cur;
      return '<option value="' + r.id + '">' + label + "</option>";
    }).join("");
    elPrice.value = state.range;

    var html = '<button type="button" class="bx-chip" data-type="all">' + t.all + "</button>";
    keys.forEach(function (k) {
      html += '<button type="button" class="bx-chip" data-type="' + k + '">' + typeLabel(k, l) + "</button>";
    });
    elTypes.innerHTML = html;

    cards.forEach(function (c) {
      // search words in both languages, so "robe" and "dress" both work
      var tp = TYPES[c.key];
      c.text = c.own + " " + norm(tp ? tp.en + " " + tp.fr : c.key);
    });

    elEmpty.textContent = t.empty;
    render();
  }

  /* ---------- Filter + sort + show ---------- */
  function render() {
    var t = T[lang()];
    var q = norm(state.q);
    var words = q ? q.split(" ") : [];
    var range = RANGES.filter(function (r) { return r.id === state.range; })[0];

    var shown = 0;
    cards.forEach(function (c) {
      var ok = true;
      if (state.type !== "all" && c.key !== state.type) ok = false;
      if (ok && words.length) {
        words.forEach(function (w) { if (c.text.indexOf(w) === -1) ok = false; });
      }
      if (ok && (range.max || range.min)) {
        if (c.min === null) ok = false;
        else if (range.max && c.min > range.max) ok = false;
        else if (range.min && c.min <= range.min) ok = false;
      }
      c.el.style.display = ok ? "" : "none";
      c.ok = ok;
      if (ok) shown++;
    });

    var sorted = cards.slice().sort(function (a, b) {
      if (state.sort === "default") return a.index - b.index;
      if (a.min === null && b.min === null) return a.index - b.index;
      if (a.min === null) return 1;
      if (b.min === null) return -1;
      var d = state.sort === "asc" ? a.min - b.min : b.min - a.min;
      return d || a.index - b.index;
    });
    sorted.forEach(function (c) { grid.appendChild(c.el); });

    Array.prototype.forEach.call(elTypes.querySelectorAll("button"), function (b) {
      var on = b.getAttribute("data-type") === state.type;
      b.className = on ? "bx-chip bx-on" : "bx-chip";
      b.setAttribute("aria-pressed", on ? "true" : "false");
    });

    var active = state.q || state.type !== "all" || state.sort !== "default" || state.range !== "all";
    elCount.innerHTML = shown + " " + (shown === 1 ? t.none : t.many) +
      (active ? ' <button type="button" class="bx-reset">' + t.reset + "</button>" : "");
    elEmpty.style.display = shown === 0 ? "" : "none";
  }

  /* ---------- Events ---------- */
  elSearch.addEventListener("input", function () { state.q = elSearch.value; render(); });
  elSort.addEventListener("change", function () { state.sort = elSort.value; render(); });
  elPrice.addEventListener("change", function () { state.range = elPrice.value; render(); });

  elTypes.addEventListener("click", function (e) {
    var b = e.target.closest("button");
    if (!b) return;
    state.type = b.getAttribute("data-type");
    render();
  });

  elCount.addEventListener("click", function (e) {
    if (!e.target.classList.contains("bx-reset")) return;
    state = { q: "", type: "all", sort: "default", range: "all" };
    elSearch.value = "";
    elSort.value = "default";
    elPrice.value = "all";
    render();
  });

  // If the language button changes <html lang="...">, the texts follow.
  new MutationObserver(applyLang).observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["lang"]
  });
  window.refreshShopSearch = applyLang; // can be called by the language button

  applyLang();
})();