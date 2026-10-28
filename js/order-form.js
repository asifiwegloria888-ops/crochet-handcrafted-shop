// Order page: shows the cart, adds the delivery fee, sends ONE order with all the items to /api/order.
(function () {
  var params = new URLSearchParams(window.location.search);

  // Old links like order.html?item=Crop+top&photo=4 now open the item page,
  // where the customer picks size and quantity and adds it to the cart.
  if (params.get("item")) {
    var target = "product.html?item=" + encodeURIComponent(params.get("item")).replace(/%20/g, "+");
    if (params.get("photo")) target += "&photo=" + encodeURIComponent(params.get("photo"));
    window.location.replace(target);
    return;
  }

  var $ = function (id) { return document.getElementById(id); };
  var form = $("order-form");
  if (!form) return;

  function money(n) { return String(n).replace(/\B(?=(\d{3})+(?!\d))/g, " ") + " UGX"; }
  var has = function (o, k) { return Object.prototype.hasOwnProperty.call(o, k); };

  function unitPrice(l) {
    var p = has(PRODUCTS, l.item) ? PRODUCTS[l.item] : null;
    if (!p) return null;
    if (p.sizes) return has(p.sizes, l.size) ? p.sizes[l.size] : null;
    return p.price;
  }

  var lines = Cart.read().filter(function (l) { return unitPrice(l) !== null; });
  var deliverySelect = $("delivery");
  var status = $("form-status");
  var button = form.querySelector("button[type='submit']");

  if (lines.length === 0) {
    $("order-empty").hidden = false;
    return;
  }
  // every item that has a color list needs a color (chosen in the cart)
  var missingColor = lines.some(function (l) {
    var a = PRODUCTS[l.item];
    return a.colors && a.colors.length && !String(l.colors || "").trim();
  });
  if (missingColor) {
    $("order-colors").hidden = false;
    return;
  }
  $("order-main").hidden = false;

  // ready date: at least "leadDays" after today (Kampala time), the longest time of the items in the cart
  var lead = leadDaysFor(lines.map(function (l) { return l.item; }));
  function addDays(iso, n) {
    var d = new Date(iso + "T00:00:00Z");
    d.setUTCDate(d.getUTCDate() + n);
    return d.toISOString().slice(0, 10);
  }
  var today = new Date(Date.now() + 3 * 3600 * 1000).toISOString().slice(0, 10);
  var minDate = addDays(today, lead);
  var readyInput = $("ready-date");
  readyInput.min = minDate;
  readyInput.max = addDays(today, 365);
  function prettyDate(iso) {
    return new Date(iso + "T00:00:00Z").toLocaleDateString(window.shopLocale || "en-GB", { weekday: "short", day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });
  }
  var times = {};
  lines.forEach(function (l) { times[labelOf(l.item)] = leadDaysFor([l.item]); });
  $("ready-hint").textContent = "Earliest date: " + prettyDate(minDate) + ". Making time: " +
    Object.keys(times).map(function (n) { return n + " " + times[n] + " days"; }).join(", ") + ".";

  // delivery options come from js/products.js
  Object.keys(DELIVERY_FEES).forEach(function (key) {
    var fee = DELIVERY_FEES[key];
    var opt = document.createElement("option");
    opt.value = key;
    if (fee === null) opt.textContent = "Delivery to my address (price confirmed by me)";
    else if (fee === 0) opt.textContent = "Pick up (free)";
    else opt.textContent = key + " - " + money(fee);
    deliverySelect.appendChild(opt);
  });

  // items summary
  var box = $("os-lines");
  var subtotal = 0;
  lines.forEach(function (l) {
    var price = unitPrice(l) * l.qty;
    subtotal += price;
    var row = document.createElement("div"); row.className = "os-line";
    var img = document.createElement("img");
    img.src = (l.photo || PRODUCTS[l.item].photos[0]) + ".jpeg"; img.alt = labelOf(l.item);
    var mid = document.createElement("div");
    var n = document.createElement("p"); n.className = "os-name"; n.textContent = labelOf(l.item); mid.appendChild(n);
    var s = document.createElement("p"); s.className = "os-sub";
    s.textContent = (l.size ? l.size + ", " : "") + "qty " + l.qty + (l.colors ? ", " + l.colors : "");
    mid.appendChild(s);
    var pr = document.createElement("p"); pr.className = "os-price"; pr.textContent = money(price);
    row.appendChild(img); row.appendChild(mid); row.appendChild(pr);
    box.appendChild(row);
  });
  $("os-subtotal").textContent = money(subtotal);

  var addressField = $("address-field");
  var addressInput = $("address");

  function updateTotal() {
    // no address needed to pick up the order yourself
    var pickup = DELIVERY_FEES[deliverySelect.value] === 0;
    addressField.hidden = pickup;
    addressInput.disabled = pickup;
    addressInput.required = !pickup;
    var fee = DELIVERY_FEES[deliverySelect.value];
    if (fee === null) {
      $("os-fee").textContent = "price confirmed by me";
      $("os-total").textContent = money(subtotal) + " + delivery";
    } else {
      $("os-fee").textContent = money(fee || 0);
      $("os-total").textContent = money(subtotal + (fee || 0));
    }
  }
  deliverySelect.addEventListener("change", updateTotal);
  updateTotal();

  function showError(message) {
    status.textContent = message;
    status.className = "form-status " + (message ? "error" : "");
  }

  form.addEventListener("submit", function (event) {
    event.preventDefault();
    var data = Object.fromEntries(new FormData(form).entries());
    data.lang = window.SHOP_LANG || "en";
    if (!data.ready_date) { showError("Please choose the date you want your order ready."); readyInput.focus(); return; }
    if (data.ready_date < minDate) { showError("Your items need " + lead + " days. Please choose " + prettyDate(minDate) + " or a later date."); readyInput.focus(); return; }
    data.items = lines.map(function (l) {
      return { item: l.item, size: l.size || "", qty: l.qty, colors: l.colors || "", photo: l.photo || "" };
    });

    button.disabled = true;
    button.textContent = "Sending...";
    showError("");

    fetch("/api/order", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    })
      .then(function (res) {
        return res.json().then(function (json) { return { ok: res.ok, json: json }; });
      })
      .then(function (result) {
        if (!result.ok) {
          showError(result.json.error || "Something went wrong. Please try again.");
          return;
        }
        var reference = result.json.reference || "";
        Cart.clear();
        $("order-main").hidden = true;
        $("order-done").hidden = false;
        $("done-text").textContent =
          "Your reference is " + reference + ". " +
          (result.json.emailSent === false
            ? "We could not send the confirmation email, but I will contact you soon."
            : "Check your email for the confirmation (and your spam folder).");
        var wa = document.createElement("a");
        wa.href = "https://wa.me/" + (window.SHOP_WHATSAPP || "") + "?text=" +
          encodeURIComponent("Hello, I'm writing about my order " + reference);
        wa.target = "_blank";
        wa.rel = "noopener";
        wa.textContent = "Chat with me on WhatsApp";
        $("done-wa").appendChild(wa);
        window.scrollTo(0, 0);
      })
      .catch(function () {
        showError("Network problem. Please check your connection and try again.");
      })
      .finally(function () {
        button.disabled = false;
        button.textContent = "Send my order";
      });
  });
})();
