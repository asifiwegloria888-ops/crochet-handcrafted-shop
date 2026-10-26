// Article page: like, favorite, comments.  Needs js/products.js and js/site.js.
(function () {
  var $ = function (id) { return document.getElementById(id); };
  var q = new URLSearchParams(location.search);
  var item = resolveProduct(q.get("item"), q.get("photo"));
  if (!item || !Object.prototype.hasOwnProperty.call(PRODUCTS, item) || !$("pd-actions")) return;

  $("pd-actions").hidden = false;
  $("pd-comments-box").hidden = false;
  var vid = window.visitorId();

  // ---------- download the photo (counted, you see it in the admin page) ----------
  var dl = $("pd-download");
  if (dl) {
    dl.hidden = false;
    dl.addEventListener("click", function () {
      var src = $("pd-main").getAttribute("src") || "";
      var m = /^(\d+)\.jpeg/.exec(src);
      if (!m) return;
      dl.href = src;
      dl.setAttribute("download", "crochet-handcrafted-shop-" + m[1] + ".jpeg");
      var owner = false;
      try { owner = localStorage.getItem("shopAdmin") === "1"; } catch (e) {}
      if (owner) return; // your own downloads are not counted
      fetch("/api/track", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kind: "download", vid: vid, item: item, photo: m[1], device: window.innerWidth < 700 ? "phone" : "computer" }),
        keepalive: true,
      }).catch(function () {});
    });
  }

  // ---------- favorite (saved on this device) ----------
  var favBtn = $("pd-fav");
  function drawFav() {
    var on = window.Fav.has(item);
    favBtn.setAttribute("aria-pressed", on ? "true" : "false");
    favBtn.classList.toggle("on", on);
    favBtn.querySelector(".ic").textContent = on ? "\u2605" : "\u2606";
    favBtn.querySelector(".lbl").textContent = on ? "In my favorites" : "Add to favorites";
  }
  favBtn.addEventListener("click", function () { window.Fav.toggle(item); drawFav(); });
  drawFav();

  // ---------- likes ----------
  var likeBtn = $("pd-like"), likeCount = $("pd-likes");
  function drawLike(data) {
    likeBtn.setAttribute("aria-pressed", data.liked ? "true" : "false");
    likeBtn.classList.toggle("on", !!data.liked);
    likeBtn.querySelector(".ic").textContent = data.liked ? "\u2665" : "\u2661";
    likeCount.textContent = data.likes > 0 ? String(data.likes) : "";
  }
  likeBtn.addEventListener("click", function () {
    likeBtn.disabled = true;
    fetch("/api/social", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "like", item: item, vid: vid }),
    })
      .then(function (r) { return r.json(); })
      .then(function (d) { if (d.ok) drawLike(d); })
      .catch(function () {})
      .then(function () { likeBtn.disabled = false; });
  });

  // ---------- comments ----------
  var list = $("pd-comments");
  function drawComments(comments) {
    list.innerHTML = "";
    if (!comments.length) {
      var none = document.createElement("p"); none.className = "pd-none"; none.textContent = "No comment yet. Be the first!"; list.appendChild(none);
      return;
    }
    comments.forEach(function (c) {
      var row = document.createElement("div"); row.className = "pd-comment";
      var who = document.createElement("p"); who.className = "pd-cwho";
      var nm = document.createElement("strong"); nm.textContent = c.name; who.appendChild(nm);
      var d = new Date(c.created_at);
      if (!isNaN(d)) who.appendChild(document.createTextNode("  " + d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })));
      var txt = document.createElement("p"); txt.className = "pd-ctext"; txt.textContent = c.body;
      row.appendChild(who); row.appendChild(txt); list.appendChild(row);
    });
  }

  fetch("/api/social?item=" + encodeURIComponent(item) + "&vid=" + encodeURIComponent(vid))
    .then(function (r) { return r.json(); })
    .then(function (d) { if (d.ok) { drawLike(d); drawComments(d.comments || []); } else { drawComments([]); } })
    .catch(function () { drawComments([]); });

  var form = $("pd-cform"), msg = $("pd-cmsg");
  form.addEventListener("submit", function (e) {
    e.preventDefault();
    var btn = form.querySelector("button");
    btn.disabled = true;
    msg.className = "pd-msg";
    msg.textContent = "";
    fetch("/api/social", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "comment", item: item, vid: vid, name: $("pd-cname").value, body: $("pd-ctext").value, website: $("pd-chp").value }),
    })
      .then(function (r) { return r.json().then(function (j) { return { ok: r.ok, j: j }; }); })
      .then(function (res) {
        if (res.ok) { msg.textContent = res.j.message || "Thank you!"; form.reset(); }
        else { msg.className = "pd-msg err"; msg.textContent = res.j.error || "Something went wrong."; }
      })
      .catch(function () { msg.className = "pd-msg err"; msg.textContent = "Network problem. Please try again."; })
      .then(function () { btn.disabled = false; });
  });
})();
