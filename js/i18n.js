// The language of the site.
//  - French and English are built in (js/lang-fr.js): fast, no outside service.
//  - Other languages (Kiswahili, Luganda, Lingala, Kinyarwanda, Arabic, Spanish...) use Google Translate, loaded only for those visitors.
// The language is chosen from the phone's language. The visitor can change it with the small selector at the bottom left.

(function () {
  var LANGS = [["en", "English"], ["fr", "Français"], ["sw", "Kiswahili"], ["lg", "Luganda"], ["ln", "Lingála"], ["rw", "Kinyarwanda"],
    ["ar", "العربية"], ["es", "Español"], ["pt", "Português"], ["de", "Deutsch"], ["it", "Italiano"], ["zh-CN", "中文"],
    ["rn", "Kirundi"], ["am", "አማርኛ"], ["so", "Soomaali"], ["hi", "हिन्दी"], ["tr", "Türkçe"], ["ru", "Русский"], ["nl", "Nederlands"]];
  var known = {};
  LANGS.forEach(function (l) { known[l[0].toLowerCase()] = l[0]; });

  function saved() { try { return localStorage.getItem("lang"); } catch (e) { return null; } }

  function detect() {
    var s = saved();
    if (s && known[String(s).toLowerCase()]) return known[String(s).toLowerCase()];
    var list = navigator.languages && navigator.languages.length ? navigator.languages : [navigator.language || "en"];
    for (var i = 0; i < list.length; i++) {
      var code = String(list[i]).toLowerCase();
      if (known[code]) return known[code];
      var primary = code.split("-")[0];
      if (primary === "zh") return "zh-CN";
      if (known[primary]) return known[primary];
    }
    return "en";
  }

  var lang = detect();
  var french = lang === "fr";
  window.SHOP_LANG = french ? "fr" : "en";            // language of the texts written by the shop (also sent with the order)
  window.shopLocale = french ? "fr-FR" : "en-GB";     // for dates
  window.t = function (s) { return french && window.LANG_FR ? window.LANG_FR.translate(s) : s; };
  document.documentElement.setAttribute("lang", french ? "fr" : "en");

  // ---------- French: translate the page, now and whenever the page changes ----------
  function startFrench() {
    var FR = window.LANG_FR;
    if (!FR) return;
    var SKIP = { SCRIPT: 1, STYLE: 1, TEXTAREA: 1, NOSCRIPT: 1 };
    var ATTRS = ["placeholder", "alt", "title", "aria-label"];

    // skipped(el, true): only the elements marked "do not translate" (used for attributes such as placeholder)
    function skipped(el, attributesOnly) {
      for (var e = el; e && e !== document.documentElement; e = e.parentElement) {
        if ((!attributesOnly && SKIP[e.tagName]) || (e.hasAttribute && (e.hasAttribute("data-no-i18n") || e.getAttribute("translate") === "no")) ||
            (e.classList && e.classList.contains("notranslate"))) return true;
      }
      return false;
    }

    function doAttrs(el) {
      if (el.nodeType !== 1 || skipped(el, true)) return;
      // an <option> keeps its English value (the server and the cart use it); only the text is translated
      if (el.tagName === "OPTION" && !el.hasAttribute("value")) el.setAttribute("value", el.textContent);
      ATTRS.forEach(function (a) {
        var v = el.getAttribute(a);
        if (!v) return;
        var t = FR.translate(v.trim());
        if (t !== v.trim()) el.setAttribute(a, t);
      });
    }

    function doText(node) {
      var p = node.parentElement;
      if (!p || skipped(p)) return;
      var raw = node.nodeValue;
      var core = raw.replace(/\s+/g, " ").trim();
      if (!core) return;
      var t = FR.translate(core);
      if (t !== core) node.nodeValue = raw.match(/^\s*/)[0] + t + raw.match(/\s*$/)[0];
    }

    function doTree(root) {
      if (root.nodeType === 3) { doText(root); return; }
      if (root.nodeType !== 1) return;
      doAttrs(root);
      var all = root.querySelectorAll("*");
      for (var i = 0; i < all.length; i++) doAttrs(all[i]);
      var walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, null);
      var n, list = [];
      while ((n = walker.nextNode())) list.push(n);
      list.forEach(doText);
    }

    function doTitle() {
      var t = FR.translate(document.title);
      if (t !== document.title) document.title = t;
    }

    doTitle();
    doTree(document.body);

    var observer = new MutationObserver(function (changes) {
      changes.forEach(function (c) {
        if (c.type === "childList") {
          for (var i = 0; i < c.addedNodes.length; i++) doTree(c.addedNodes[i]);
          if (c.target.nodeName === "TITLE") doTitle();
        } else if (c.type === "characterData") {
          doText(c.target);
        } else if (c.type === "attributes") {
          doAttrs(c.target);
        }
      });
    });
    observer.observe(document.body, { childList: true, subtree: true, characterData: true, attributes: true, attributeFilter: ATTRS });
    var titleEl = document.querySelector("title");
    if (titleEl) observer.observe(titleEl, { childList: true });

    // Developer help: open the site with  ?i18n=missing  to list the texts that are still in English
    if (/[?&]i18n=missing/.test(location.search)) {
      setTimeout(function () { console.log("Texts still in English:", FR.missing()); }, 1500);
    }
  }

  // ---------- prices in the visitor's currency next to the shillings ----------
  // every "15 000 UGX" written on the page becomes the money of the visitor's country with the dollars in brackets:
  // "6 000 RWF (≈ $4.05)" (Uganda: "15 000 UGX (≈ $4.05)"). Country found automatically; the visitor can change it with the small selector. Only the display changes: the real prices stay in UGX on the server.
  // The currencies and their rates are in js/rates.js (change the numbers there).
  var SELF = document.currentScript && document.currentScript.src ? document.currentScript.src : "";

  // rates.js is normally loaded by the page; if a page forgot it, it is loaded from here
  function withRates(go) {
    if (window.SHOP_RATES) return go();
    if (!SELF) return;
    var s = document.createElement("script");
    s.src = SELF.replace(/i18n\.js(\?.*)?$/, "rates.js");
    s.onload = go;
    document.head.appendChild(s);
  }

  function savedCurrency(R) {
    try { var s = localStorage.getItem("currency"); if (s && R.isCode(s)) return s; } catch (e) {}
    return "";
  }

  // The country of the visitor: asked once to the site (api/country.js) and remembered on the phone.
  function detectCountry(done) {
    try { var c = localStorage.getItem("geo"); if (c) return done(c); } catch (e) {}
    var finished = false;
    function end(c) { if (finished) return; finished = true; try { if (c) localStorage.setItem("geo", c); } catch (e) {} done(c || ""); }
    setTimeout(function () { end(""); }, 2500);
    try {
      fetch("/api/country", { cache: "no-store" })
        .then(function (r) { return r.ok ? r.json() : {}; })
        .then(function (d) { end(String((d && d.country) || "").toUpperCase()); })
        .catch(function () { end(""); });
    } catch (e) { end(""); }
  }

  // second chance when the country is unknown: the region of the phone's language ("fr-CD" -> Congo)
  function guessFromLanguage(R) {
    var list = navigator.languages && navigator.languages.length ? navigator.languages : [navigator.language || "en"];
    for (var i = 0; i < list.length; i++) {
      var region = String(list[i]).split("-")[1];
      if (region && R.BY_REGION[region.toUpperCase()]) return R.BY_REGION[region.toUpperCase()];
    }
    return "";
  }

  function startCurrency(box) {
    var R = window.SHOP_RATES;
    var cur = savedCurrency(R);
    // the server reads this cookie when an order is placed, to write the prices in this currency in the emails
    function remember(c) { try { document.cookie = "shopcur=" + c + "; path=/; max-age=31536000; SameSite=Lax"; } catch (e) {} }

    var sel = document.createElement("select");
    sel.setAttribute("aria-label", "Currency / Devise");
    sel.style.marginLeft = "6px";
    R.CODES.forEach(function (c) {
      var o = document.createElement("option");
      o.value = c; o.textContent = c;
      sel.appendChild(o);
    });
    sel.value = cur || "USD";
    sel.addEventListener("change", function () {
      try { localStorage.setItem("currency", sel.value); } catch (e) {}
      remember(sel.value);
      location.reload();
    });
    box.appendChild(sel);

    // the visitor never chose: use the money of the country he is visiting from
    if (cur) return apply(cur);
    detectCountry(function (country) {
      apply(R.BY_REGION[country] || guessFromLanguage(R) || "USD");
    });

    function apply(c) {
      cur = c;
      window.SHOP_CURRENCY = c;
      sel.value = c;
      remember(c);
      convertPrices(c);
    }

    function convertPrices(cur) {
    // the admin page keeps the real prices in shillings (you need them to confirm an order)
    if (/\/admin(\.html)?\/?$/.test(location.pathname)) return;
    var SKIP = { SCRIPT: 1, STYLE: 1, TEXTAREA: 1, NOSCRIPT: 1 };
    // a price already followed by "(≈" is skipped, so a price is never converted twice
    var PRICE = /(\d[\d   ]*)\s*UGX(?!\s*\(≈)/g;

    function skipped(el) {
      for (var e = el; e && e !== document.documentElement; e = e.parentElement) {
        if (SKIP[e.tagName] || (e.hasAttribute && (e.hasAttribute("data-no-i18n") || e.getAttribute("translate") === "no")) ||
            (e.classList && e.classList.contains("notranslate"))) return true;
      }
      return false;
    }
    function convertText(node) {
      var v = node.nodeValue;
      if (!v || v.indexOf("UGX") === -1) return;
      var p = node.parentElement;
      if (!p || skipped(p)) return;
      var out = v.replace(PRICE, function (m, num) {
        var n = parseInt(num.replace(/\D/g, ""), 10);
        return isNaN(n) ? m : (R.show(n, cur) || m);   // "15 000 UGX" becomes "6 000 RWF (≈ $4.05)": the money of the country, dollars in brackets
      });
      if (out !== v) node.nodeValue = out;
    }
    function convertTree(root) {
      if (root.nodeType === 3) { convertText(root); return; }
      if (root.nodeType !== 1) return;
      var walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, null);
      var n, list = [];
      while ((n = walker.nextNode())) list.push(n);
      list.forEach(convertText);
    }

    convertTree(document.body);
    // prices written later by the page (cart, order total, delivery list...) are converted too
    new MutationObserver(function (changes) {
      changes.forEach(function (c) {
        if (c.type === "childList") for (var i = 0; i < c.addedNodes.length; i++) convertTree(c.addedNodes[i]);
        else if (c.type === "characterData") convertText(c.target);
      });
    }).observe(document.body, { childList: true, subtree: true, characterData: true });
    }
  }

  // ---------- other languages: Google Translate (only for these visitors) ----------
  function startGoogle(code) {
    try {
      var value = "/en/" + code;
      document.cookie = "googtrans=" + value + "; path=/";
      document.cookie = "googtrans=" + value + "; path=/; domain=" + location.hostname;
    } catch (e) {}
    var css = document.createElement("style");
    css.textContent = ".goog-te-banner-frame,#goog-gt-tt,.goog-te-balloon-frame,.skiptranslate iframe{display:none!important}body{top:0!important}";
    document.head.appendChild(css);
    var holder = document.createElement("div");
    holder.id = "google_translate_element";
    holder.style.display = "none";
    document.body.appendChild(holder);
    window.googleTranslateElementInit = function () {
      /* global google */
      new google.translate.TranslateElement({ pageLanguage: "en", autoDisplay: false }, "google_translate_element");
    };
    var s = document.createElement("script");
    s.src = "https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit";
    s.async = true;
    document.head.appendChild(s);
  }

  function clearGoogle() {
    var past = "expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/";
    try {
      document.cookie = "googtrans=; " + past;
      document.cookie = "googtrans=; " + past + "; domain=" + location.hostname;
    } catch (e) {}
  }

  // ---------- the language selector ----------
  function addSelector() {
    var box = document.createElement("div");
    box.setAttribute("translate", "no");
    box.className = "notranslate lang-box";
    box.setAttribute("data-no-i18n", "");
    var sel = document.createElement("select");
    sel.setAttribute("aria-label", "Language / Langue");
    LANGS.forEach(function (l) {
      var o = document.createElement("option");
      o.value = l[0];
      o.textContent = l[1];
      sel.appendChild(o);
    });
    sel.value = lang;
    sel.addEventListener("change", function () {
      try { localStorage.setItem("lang", sel.value); } catch (e) {}
      if (sel.value === "en" || sel.value === "fr") clearGoogle();
      location.reload();
    });
    var icon = document.createElement("span");
    icon.textContent = "\uD83C\uDF10 ";
    box.appendChild(icon);
    box.appendChild(sel);
    var css = document.createElement("style");
    css.textContent =
      ".lang-box{position:fixed;left:12px;bottom:12px;z-index:50;background:#fff;border:2px solid #e8a0b4;border-radius:22px;padding:4px 8px 4px 10px;" +
      "box-shadow:0 3px 10px rgba(0,0,0,.18);font-size:.85rem;line-height:1}" +
      ".lang-box select{border:none;background:transparent;font:inherit;color:#c9607f;font-weight:bold;cursor:pointer;max-width:120px}.lang-box select+select{max-width:80px}";
    document.head.appendChild(css);
    document.body.appendChild(box);
    return box;
  }

  var selectorBox = addSelector();
  // French first, then the dollars: the French rules (for example "... UGX each") must see the price before it gets its dollar amount
  if (french) startFrench();
  else if (lang !== "en") startGoogle(lang);
  else clearGoogle();
  withRates(function () { startCurrency(selectorBox); });   // for every language, English included
})();