// Loaded on every customer page: the cart, the "Cart (n)" link in the menu, the WhatsApp button.

// Your WhatsApp number: international format, digits only, no + and no spaces.
window.SHOP_WHATSAPP = "243978253950";

// Anonymous id of this browser (random, no name, no IP). Used for likes and to count visits.
window.visitorId = function () {
  var id = "";
  try { id = localStorage.getItem("vid") || ""; } catch (e) {}
  if (!/^[A-Za-z0-9-]{8,64}$/.test(id)) {
    id = window.crypto && crypto.randomUUID ? crypto.randomUUID() : "v" + Date.now().toString(36) + Math.random().toString(36).slice(2, 12);
    try { localStorage.setItem("vid", id); } catch (e) {}
  }
  return id;
};

// Favorites: saved on this device only (no account needed)
window.Fav = (function () {
  var KEY = "favorites";
  function read() {
    try {
      var list = JSON.parse(localStorage.getItem(KEY) || "[]");
      return Array.isArray(list) ? list.filter(function (n) { return typeof n === "string"; }) : [];
    } catch (e) { return []; }
  }
  function write(list) {
    try { localStorage.setItem(KEY, JSON.stringify(list)); } catch (e) {}
    window.updateFavBadge();
  }
  return {
    read: read,
    has: function (name) { return read().indexOf(name) !== -1; },
    toggle: function (name) {
      var list = read(), i = list.indexOf(name);
      if (i === -1) list.push(name); else list.splice(i, 1);
      write(list);
      return i === -1;
    },
  };
})();

window.updateFavBadge = function () {
  var badge = document.querySelector(".fav-link .new-badge");
  if (!badge) return;
  var n = window.Fav.read().length;
  badge.textContent = n;
  badge.hidden = n === 0;
};

window.Cart = (function () {
  var KEY = "cart";

  function read() {
    try {
      var list = JSON.parse(localStorage.getItem(KEY) || "[]");
      return Array.isArray(list)
        ? list
            .filter(function (l) { return l && typeof l.item === "string" && parseInt(l.qty, 10) >= 1; })
            .map(function (l) {
              // an old cart line (item "Dress", photo 31) is moved to the right article ("dress-31")
              if (typeof window.resolveProduct === "function") {
                var id = window.resolveProduct(l.item, l.photo);
                if (id) l.item = id;
              }
              return l;
            })
        : [];
    } catch (e) {
      return [];
    }
  }
  function write(lines) {
    try { localStorage.setItem(KEY, JSON.stringify(lines)); } catch (e) {}
    window.updateCartBadge();
  }
  function count() {
    return read().reduce(function (sum, l) { return sum + (parseInt(l.qty, 10) || 0); }, 0);
  }
  return { read: read, write: write, count: count, clear: function () { write([]); } };
})();

window.updateCartBadge = function () {
  var badge = document.querySelector(".cart-link .cart-badge");
  if (!badge) return;
  var n = window.Cart.count();
  badge.textContent = n;
  badge.hidden = n === 0;
};

(function () {
  var css = document.createElement("style");
  css.textContent =
    ".cart-badge,.new-badge{display:inline-block;min-width:20px;padding:0 6px;margin-left:4px;border-radius:10px;" +
    "background:#fff;color:#c9607f;font-size:.8rem;font-weight:bold;line-height:20px;text-align:center}" +
    ".cart-badge[hidden],.new-badge[hidden]{display:none}" +
    ".new-badge{background:#ffe9b8;color:#7a5200}" +
    ".whatsapp-flottant{position:fixed;right:16px;bottom:16px;z-index:50;background:#25D366;color:#fff;" +
    "padding:12px 18px;border-radius:30px;font-weight:bold;font-size:.95rem;text-decoration:none;" +
    "box-shadow:0 4px 14px rgba(0,0,0,.25)}" +
    ".whatsapp-flottant:hover{background:#1ebe5a;text-decoration:none}" +
    "@media (max-width:480px){header .main-nav ul{gap:2px}header .main-nav li a{padding:6px 7px;font-size:.88rem}}" +
    "@media (max-width:380px){header{padding-left:4px!important;padding-right:4px!important}header .main-nav ul{gap:0}header .main-nav li a{padding:6px 5px;font-size:.82rem}}" +
    ".whatsapp-flottant .wa-icon{font-size:1.1rem}" +
    "@media (max-width:600px){.whatsapp-flottant{right:12px;bottom:12px;width:48px;height:48px;padding:0;" +
    "display:flex;align-items:center;justify-content:center}.whatsapp-flottant .wa-label{display:none}" +
    ".whatsapp-flottant .wa-icon{font-size:1.5rem}}";
  document.head.appendChild(css);

  // Creation page: load the catalog files so articles of js/products.js without a card get one automatically
  if (document.querySelector(".grille") && typeof window.PRODUCTS === "undefined" && document.readyState === "loading") {
    document.write('<script src="js/products.js"><\/script><script src="js/catalog.js"><\/script>');
  }

  // "Cart (n)" takes the place of the "Order" link in the menu (the cart leads to the order page)
  var menu = document.querySelector(".main-nav ul");
  if (menu && !menu.querySelector(".cart-link")) {
    var link = menu.querySelector('a[href="order.html"]');
    var li = link ? link.parentNode : document.createElement("li");
    var a = link || document.createElement("a");
    a.href = "cart.html";
    a.className = "cart-link";
    a.textContent = "Cart";
    var badge = document.createElement("span");
    badge.className = "cart-badge";
    a.appendChild(badge);
    if (/(cart|order)\.html$/.test(location.pathname)) a.setAttribute("aria-current", "page");
    else a.removeAttribute("aria-current");
    if (!link) { li.appendChild(a); menu.appendChild(li); }
  }
  window.updateCartBadge();

  // heart link: my favorites
  if (menu && !menu.querySelector(".fav-link")) {
    var fLi = document.createElement("li");
    var fLink = document.createElement("a");
    fLink.href = "favorites.html";
    fLink.className = "fav-link";
    fLink.setAttribute("aria-label", "My favorites");
    fLink.title = "My favorites";
    fLink.appendChild(document.createTextNode("\u2665"));
    var fBadge = document.createElement("span");
    fBadge.className = "new-badge";
    fLink.appendChild(fBadge);
    if (/favorites\.html$/.test(location.pathname)) fLink.setAttribute("aria-current", "page");
    fLi.appendChild(fLink);
    var cartLi = menu.querySelector(".cart-link");
    if (cartLi && cartLi.parentNode.nextSibling) menu.insertBefore(fLi, cartLi.parentNode.nextSibling);
    else menu.appendChild(fLi);
  }
  window.updateFavBadge();

  // "Admin (n)" link: only shown on a device where the owner has logged in to admin.html.
  // Customers never see it. The page itself is always protected by the password on the server.
  var owner = false;
  try { owner = localStorage.getItem("shopAdmin") === "1"; } catch (e) {}
  if (owner && menu && !menu.querySelector(".admin-link")) {
    var aLi = document.createElement("li");
    var aLink = document.createElement("a");
    aLink.href = "admin.html";
    aLink.className = "admin-link";
    aLink.textContent = "Admin";
    var newBadge = document.createElement("span");
    newBadge.className = "new-badge";
    newBadge.hidden = true;
    newBadge.title = "New orders";
    aLink.appendChild(newBadge);
    aLi.appendChild(aLink);
    menu.appendChild(aLi);
    fetch("/api/admin", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "same-origin",
      body: JSON.stringify({ action: "count" }),
    })
      .then(function (res) { return res.ok ? res.json() : null; })
      .then(function (data) {
        var todo = data ? (data["new"] || 0) + (data.comments || 0) : 0;
        if (todo > 0) { newBadge.textContent = todo; newBadge.title = "New orders and comments to approve"; newBadge.hidden = false; }
      })
      .catch(function () {});
  }

  // WhatsApp button
  var wa = document.createElement("a");
  wa.className = "whatsapp-flottant";
  wa.href = "https://wa.me/" + window.SHOP_WHATSAPP + "?text=" +
    encodeURIComponent("Hello, I have a question about your crochet shop");
  wa.target = "_blank";
  wa.rel = "noopener";
  wa.setAttribute("aria-label", "Chat with us on WhatsApp");
  var icon = document.createElement("span"); icon.className = "wa-icon"; icon.textContent = "\uD83D\uDCAC";
  var label = document.createElement("span"); label.className = "wa-label"; label.textContent = " Chat on WhatsApp";
  wa.appendChild(icon); wa.appendChild(label);
  document.body.appendChild(wa);

  // the cart can be changed in another tab
  window.addEventListener("storage", function () { window.updateCartBadge(); window.updateFavBadge(); });

  // Anonymous visit counting for the admin page (not counted on the owner's own device)
  if (!owner) {
    var page = location.pathname.split("/").pop() || "index.html";
    if (!/\.html$/.test(page)) page = "index.html";
    var item = new URLSearchParams(location.search).get("item") || "";
    var ref = "";
    try {
      if (document.referrer) {
        var host = new URL(document.referrer).hostname;
        if (host && host !== location.hostname) ref = host;
      }
    } catch (e) {}
    var send = function (kind) {
      try {
        fetch("/api/track", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ kind: kind, vid: window.visitorId(), page: page, item: item, device: window.innerWidth < 700 ? "phone" : "computer", ref: ref }),
          keepalive: true,
        }).catch(function () {});
      } catch (e) {}
    };
    send("view");
    setInterval(function () { if (document.visibilityState === "visible") send("ping"); }, 60000);
  }
})();
