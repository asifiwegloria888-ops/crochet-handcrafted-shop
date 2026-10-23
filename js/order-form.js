// Order form: prefills from the catalog link, shows the price by size, sends the order to /api/order.
(function () {
  var form = document.getElementById("order-form");
  if (!form) return;

  var status = document.getElementById("form-status");
  var button = form.querySelector("button[type='submit']");
  var itemSelect = document.getElementById("item");
  var photoInput = document.getElementById("photo");
  var sizeSelect = document.getElementById("size-select");
  var sizeFree = document.getElementById("size-free");
  var qtyInput = document.getElementById("quantity");
  var priceNote = document.getElementById("price-note");

  // Display only: the real price is always decided by the server.
  // KEEP THESE TWO BLOCKS IDENTICAL TO api/order.js (same names, same spelling).
 var SIZE_PRICES = {
  "Ruffle crochet hat": { "Child": 15000, "Adult": 20000 },
  "Sweater": { "Small": 50000, "Medium": 60000, "Large": 80000, "XL": 90000 },
  "Dress": { "Small": 50000, "Medium": 60000, "Large": 80000, "XL": 100000 },
  "Small bag": { "Small": 15000, "Big": 25000 },
  "Crochet flower": { "Small": 50000, "Big": 80000 }
};
var PRICES = { "Scrunchies": 5000, "Hair scrunchie": 5000 };
var DELIVERY_FEES = { "Pickup": 0, "Kampala": 5000, "Outside Kampala": 10000 };
var deliverySelect = document.getElementById("delivery");

// Items with fixed sizes but no fixed price (same as api/order.js)
var SIZES_ONLY = {
  
  "Skirt": ["Small", "Medium", "Large", "XL"],
  "Crop top": ["Small", "Medium", "Large","XL"],
  "Ruffle crochet hat": ["Child","Adult"],
  "Sweater": ["Small", "Medium", "Large","XL"],
  "Small bag": ["Small","Big"],
  "Crochet flower": ["Small","Big"],
  "Dress": ["Small", "Medium", "Large","XL"],
  "Skirt": ["Small", "Medium", "Large", "XL"]
};
function sizesFor(item) {
  if (SIZE_PRICES[item]) return Object.keys(SIZE_PRICES[item]);
  return SIZES_ONLY[item] || null;
}
  function money(n) {
    return String(n).replace(/\B(?=(\d{3})+(?!\d))/g, " ") + " UGX";
  }

  function unitPrice() {
    var item = itemSelect.value;
    if (SIZE_PRICES[item]) return SIZE_PRICES[item][sizeSelect.value] || null;
    return PRICES[item] || null;
  }

  // Shows the size list (with prices) for items that have fixed sizes, a free text field otherwise.
  function updateSize() {
  var item = itemSelect.value;
  var names = sizesFor(item);
  if (names) {
    var previous = sizeSelect.value;
    sizeSelect.innerHTML = "";
    names.forEach(function (name) {
      var opt = document.createElement("option");
      opt.value = name;
      opt.textContent = SIZE_PRICES[item] ? name + " - " + money(SIZE_PRICES[item][name]) : name;
      sizeSelect.appendChild(opt);
    });
    if (names.indexOf(previous) !== -1) sizeSelect.value = previous;
    sizeSelect.hidden = false;
    sizeSelect.disabled = false;
    sizeFree.hidden = true;
    sizeFree.disabled = true;
  } else {
    sizeSelect.hidden = true;
    sizeSelect.disabled = true;
    sizeFree.hidden = false;
    sizeFree.disabled = false;
  }
}

  function updatePrice() {
    var price = unitPrice();
    var qty = parseInt(qtyInput.value, 10);
    if (price && qty > 0) {
      var fee = DELIVERY_FEES[deliverySelect.value] || 0;
      priceNote.textContent = money(price) + " each, delivery " + money(fee) + ", estimated total " + money(price * qty + fee) + " (to be confirmed)";
    } else {
      priceNote.textContent = "Price to be confirmed after your order.";
    }
    var box = document.getElementById("order-product");
    if (box) {
      var label = box.querySelector(".order-product-name");
      label.textContent = itemSelect.value + (price ? " - " + money(price) + " each" : "");
    }
  }

  function refresh() {
    updateSize();
    updatePrice();
  }

  // ---- Prefill from creation.html?item=Crop%20top&photo=4 ----
  var params = new URLSearchParams(window.location.search);
  var wantedItem = params.get("item");
  var wantedPhoto = params.get("photo");

  if (wantedItem && wantedItem.length <= 50) {
    var known = false;
    Array.prototype.forEach.call(itemSelect.options, function (opt) {
      if (opt.value === wantedItem || opt.text === wantedItem) known = true;
    });
    // an item that is not in the list yet (new product) is added on the fly
    if (!known) {
      var extra = document.createElement("option");
      extra.textContent = wantedItem;
      itemSelect.insertBefore(extra, itemSelect.firstChild);
    }
    itemSelect.value = wantedItem;
  }

  var box = document.getElementById("order-product");
  if (box && wantedPhoto && /^\d{1,3}$/.test(wantedPhoto)) {
    photoInput.value = wantedPhoto;
    var img = box.querySelector("img");
    img.src = wantedPhoto + ".jpeg";
    img.alt = "Selected " + itemSelect.value;
    box.hidden = false;
  }

  itemSelect.addEventListener("change", refresh);
  sizeSelect.addEventListener("change", updatePrice);
  qtyInput.addEventListener("input", updatePrice);
  itemSelect.addEventListener("change", refresh);
  sizeSelect.addEventListener("change", updatePrice);
  qtyInput.addEventListener("input", updatePrice);
  deliverySelect.addEventListener("change", updatePrice);
  refresh();

  // ---- Submit ----
  function show(message, type) {
    status.textContent = message;
    status.className = "form-status " + type;
  }

  form.addEventListener("submit", function (event) {
    event.preventDefault();

    var data = Object.fromEntries(new FormData(form).entries());
    button.disabled = true;
    button.textContent = "Sending...";
    show("", "");

    fetch("/api/order", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    })
      .then(function (res) {
        return res.json().then(function (json) {
          return { ok: res.ok, json: json };
        });
      })
      .then(function (result) {
        if (result.ok) {
          var ref = result.json.reference ? " Your reference is " + result.json.reference + "." : "";
          show("Thank you! Your order was sent." + ref + " Check your email for the confirmation.", "success");
          form.reset();
          if (box) box.hidden = true;
          photoInput.value = "";
          refresh();
        } else {
          show(result.json.error || "Something went wrong. Please try again.", "error");
        }
      })
      .catch(function () {
        show("Network problem. Please check your connection and try again.", "error");
      })
      .finally(function () {
        button.disabled = false;
        button.textContent = "Send my order";
      });
  });
})();