// Customer reviews of the home page: shows the approved reviews and sends a new one (you approve it in the admin page).
// Needs: <section class="reviews"> in index.html, api/reviews.js, and js/site.js (for window.visitorId).
(function () {
  var list = document.getElementById("reviews-list");
  var form = document.getElementById("review-form");
  if (!list || !form) return;

  function t(s) { return typeof window.t === "function" ? window.t(s) : s; }   // French when the site is in French
  function el(tag, cls, text) { var e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; }
  function stars(n) { return "\u2605\u2605\u2605\u2605\u2605".slice(0, n) + "\u2606\u2606\u2606\u2606\u2606".slice(0, 5 - n); }

  var sum = document.getElementById("reviews-sum");
  var status = document.getElementById("review-status");
  var locale = window.SHOP_LANG === "fr" ? "fr-FR" : "en-GB";

  function showStatus(text, kind) {
    status.textContent = text ? t(text) : "";
    status.className = "review-status" + (kind ? " " + kind : "");
  }

  function render(data) {
    list.innerHTML = "";
    var reviews = (data && data.reviews) || [];
    if (!reviews.length) {
      sum.textContent = "";
      list.appendChild(el("p", "review-empty", t("No reviews yet. Be the first to share your experience!")));
      return;
    }
    sum.textContent = "\u2605 " + data.average.toFixed(1) + " / 5  \u00B7  " + data.count + " " + t(data.count === 1 ? "review" : "reviews");
    reviews.forEach(function (r) {
      var card = el("article", "review-card");
      var top = el("div", "review-top");
      top.appendChild(el("span", "review-stars", stars(r.rating)));
      var when = "";
      try { when = new Date(r.created_at).toLocaleDateString(locale, { month: "long", year: "numeric" }); } catch (e) {}
      if (when) top.appendChild(el("span", "review-date", when));
      card.appendChild(top);
      card.appendChild(el("p", "review-text", r.body));
      card.appendChild(el("p", "review-name", "\u2014 " + r.name));
      list.appendChild(card);
    });
  }

  function load() {
    fetch("/api/reviews")
      .then(function (r) { return r.json(); })
      .then(render)
      .catch(function () { render(null); });
  }
  load();

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    var checked = form.querySelector('input[name="rating"]:checked');
    var name = form.elements.name.value.trim();
    var body = form.elements.body.value.trim();
    if (!checked) return showStatus("Please choose a rating from 1 to 5 stars.", "error");
    if (name.length < 2) return showStatus("Please write your name (at least 2 letters).", "error");
    if (body.length < 2) return showStatus("Please write your review.", "error");

    var button = form.querySelector("button[type=submit]");
    button.disabled = true;
    showStatus("Sending...", "");
    fetch("/api/reviews", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        vid: window.visitorId ? window.visitorId() : "",
        name: name,
        rating: parseInt(checked.value, 10),
        body: body,
        website: form.elements.website.value
      })
    })
      .then(function (r) { return r.json().then(function (d) { return { ok: r.ok, data: d }; }); })
      .then(function (res) {
        if (!res.ok || !res.data.ok) throw new Error(res.data.error || "Something went wrong.");
        form.reset();
        showStatus("Thank you!", "success");
      })
      .catch(function (err) {
        showStatus(err && err.message && err.message !== "Failed to fetch" ? err.message : "Network problem. Please try again.", "error");
      })
      .then(function () { button.disabled = false; });
  });
})();
