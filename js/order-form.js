// Order form: prefills from the catalog link, then sends the order to /api/order.
(function () {
  var form = document.getElementById("order-form");
  if (!form) return;

  var status = document.getElementById("form-status");
  var button = form.querySelector("button[type='submit']");
  var itemSelect = document.getElementById("item");
  var photoInput = document.getElementById("photo");

  // Display only: the real price is always decided by the server.
  var PRICES = { "Hair scrunchie": 5000, "Crop top": 25000, "Ruffle crochet hat": 20000 };
  function money(n) {
    return String(n).replace(/\B(?=(\d{3})+(?!\d))/g, " ") + " UGX";
  }

  // ---- Prefill from creation.html?item=Crop%20top&photo=4 ----
  var params = new URLSearchParams(window.location.search);
  var wantedItem = params.get("item");
  var wantedPhoto = params.get("photo");

  if (wantedItem) {
    Array.prototype.forEach.call(itemSelect.options, function (opt) {
      if (opt.value === wantedItem) itemSelect.value = wantedItem;
    });
  }

  var box = document.getElementById("order-product");
  if (box && wantedPhoto && /^\d{1,3}$/.test(wantedPhoto)) {
    photoInput.value = wantedPhoto;
    var img = box.querySelector("img");
    img.src = wantedPhoto + ".jpeg";
    img.alt = "Selected " + itemSelect.value;
    box.hidden = false;
  }

  function updateProduct() {
    if (!box) return;
    var label = box.querySelector(".order-product-name");
    var price = PRICES[itemSelect.value];
    label.textContent = itemSelect.value + (price ? " - " + money(price) + " each" : "");
  }
  itemSelect.addEventListener("change", updateProduct);
  updateProduct();

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
