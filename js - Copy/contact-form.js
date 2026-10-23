// Contact form: sends the message to /api/contact, which emails the shop owner.
(function () {
  var form = document.getElementById("contact-form");
  if (!form) return;
  var status = document.getElementById("contact-status");
  var button = form.querySelector("button[type='submit']");

  function show(message, type) {
    status.textContent = message;
    status.className = "contact-status " + type;
  }

  form.addEventListener("submit", function (event) {
    event.preventDefault();
    var data = Object.fromEntries(new FormData(form).entries());
    button.disabled = true;
    button.textContent = "Sending...";
    show("", "");

    fetch("/api/contact", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    })
      .then(function (res) {
        return res.json().then(function (json) { return { ok: res.ok, json: json }; });
      })
      .then(function (result) {
        if (result.ok) {
          show("Thank you! Your message was sent. I will answer you soon.", "success");
          form.reset();
        } else {
          show(result.json.error || "Something went wrong. Please try again.", "error");
        }
      })
      .catch(function () {
        show("Network problem. Please check your connection and try again.", "error");
      })
      .finally(function () {
        button.disabled = false;
        button.textContent = "Send Message";
      });
  });
})();
