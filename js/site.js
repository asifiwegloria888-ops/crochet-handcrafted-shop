// Loaded on every customer page: the cart, the "Cart (n)" link in the menu, the WhatsApp button.

// Your WhatsApp number: international format, digits only, no + and no spaces.
window.SHOP_WHATSAPP = "243978253950";

window.Cart = (function () {
  var KEY = "cart";

  function read() {
    try {
      var list = JSON.parse(localStorage.getItem(KEY) || "[]");
      return Array.isArray(list)
        ? list.filter(function (l) { return l && typeof l.item === "string" && parseInt(l.qty, 10) >= 1; })
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
  var badge = document.querySelector(".cart-badge");
  if (!badge) return;
  var n = window.Cart.count();
  badge.textContent = n;
  badge.hidden = n === 0;
};

(function () {
  var css = document.createElement("style");
  css.textContent =
    ".cart-badge{display:inline-block;min-width:20px;padding:0 6px;margin-left:4px;border-radius:10px;" +
    "background:#fff;color:#c9607f;font-size:.8rem;font-weight:bold;line-height:20px;text-align:center}" +
    ".cart-badge[hidden]{display:none}" +
    ".whatsapp-flottant{position:fixed;right:16px;bottom:16px;z-index:50;background:#25D366;color:#fff;" +
    "padding:12px 18px;border-radius:30px;font-weight:bold;font-size:.95rem;text-decoration:none;" +
    "box-shadow:0 4px 14px rgba(0,0,0,.25)}" +
    ".whatsapp-flottant:hover{background:#1ebe5a;text-decoration:none}" +
    ".whatsapp-flottant .wa-icon{font-size:1.1rem}" +
    "@media (max-width:600px){.whatsapp-flottant{right:12px;bottom:12px;width:48px;height:48px;padding:0;" +
    "display:flex;align-items:center;justify-content:center}.whatsapp-flottant .wa-label{display:none}" +
    ".whatsapp-flottant .wa-icon{font-size:1.5rem}}";
  document.head.appendChild(css);

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
  window.addEventListener("storage", window.updateCartBadge);
})();
