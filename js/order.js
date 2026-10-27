// Like / comment / favorite / download, Instagram style. Needs js/products.js, js/catalog.js and js/site.js.
// Used by product.html. (The album page can use the same API: /api/social and /api/track.)
(function () {
  var $ = function (id) { return document.getElementById(id); };
  var q = new URLSearchParams(location.search);
  var item = resolveProduct(q.get("item"), q.get("photo"));
  if (!item || !Object.prototype.hasOwnProperty.call(PRODUCTS, item) || !$("pd-post")) return;

  $("pd-post").hidden = false;
  var vid = window.visitorId();
  var likeBtn = $("pd-like"), favBtn = $("pd-fav"), cCount = $("pd-ccount"), likesTxt = $("pd-likes");

  // ---------- download (counted in the admin page, your own downloads are not) ----------
  var dl = $("pd-download");
  // Phones: a normal download goes to the Downloads / Files folder, often not to the gallery (Photos).
  // So on a phone (iPhone, iPad, Android) the photo is handed to the share sheet ("Save Image" puts it in the gallery).
  // The photo is prepared in advance, because the share must start right at the tap.
  var isPhone = /iPad|iPhone|iPod|Android/.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
  var shareFile = null, shareFor = "";
  function prepareShare(src) {
    shareFile = null; shareFor = src;
    if (!isPhone || !navigator.canShare || !window.File || !src) return;
    fetch(src).then(function (r) { return r.blob(); }).then(function (blob) {
      if (shareFor !== src) return;
      var f = new File([blob], "crochet-handcrafted-shop-" + src.replace(/\.jpe?g.*$/i, "").replace(/^.*\//, "") + ".jpeg", { type: blob.type || "image/jpeg" });
      if (navigator.canShare({ files: [f] })) shareFile = f;
    }).catch(function () {});
  }
  // prepare the photo each time the big photo changes (thumbnails)
  var mainImg = $("pd-main");
  mainImg.addEventListener("load", function () { prepareShare(mainImg.getAttribute("src") || ""); });
  if (mainImg.complete && mainImg.getAttribute("src")) prepareShare(mainImg.getAttribute("src"));
  dl.addEventListener("click", function (e) {
    var src = $("pd-main").getAttribute("src") || "";
    var m = /^(\d+)\.jpeg/.exec(src);
    if (!m) return;
    dl.href = src;
    if (shareFile && shareFor === src) { e.preventDefault(); navigator.share({ files: [shareFile] }).catch(function () {}); }
    dl.setAttribute("download", "crochet-handcrafted-shop-" + m[1] + ".jpeg");
    var owner = false;
    try { owner = localStorage.getItem("shopAdmin") === "1"; } catch (e) {}
    if (owner) return;
    fetch("/api/track", {
      method: "POST", headers: { "Content-Type": "application/json" }, keepalive: true,
      body: JSON.stringify({ kind: "download", vid: vid, item: item, photo: m[1], device: window.innerWidth < 700 ? "phone" : "computer" }),
    }).catch(function () {});
  });

  // ---------- favorite (saved on this device) ----------
  function drawFav() {
    var on = window.Fav.has(item);
    favBtn.setAttribute("aria-pressed", on ? "true" : "false");
    favBtn.classList.toggle("on", on);
    favBtn.setAttribute("aria-label", on ? "Remove from favorites" : "Save to favorites");
  }
  favBtn.addEventListener("click", function () { window.Fav.toggle(item); drawFav(); });
  drawFav();

  // ---------- likes ----------
  function drawLike(d) {
    likeBtn.setAttribute("aria-pressed", d.liked ? "true" : "false");
    likeBtn.classList.toggle("on", !!d.liked);
    likesTxt.textContent = d.likes > 0 ? d.likes + (d.likes === 1 ? " like" : " likes") : "Be the first to like this";
  }
  likeBtn.addEventListener("click", function () {
    likeBtn.disabled = true;
    fetch("/api/social", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "like", item: item, vid: vid }) })
      .then(function (r) { return r.json(); })
      .then(function (d) { if (d.ok) drawLike(d); })
      .catch(function () {})
      .then(function () { likeBtn.disabled = false; });
  });

  // ---------- comments ----------
  var list = $("pd-comments");
  function drawComments(comments) {
    list.innerHTML = "";
    cCount.textContent = comments.length ? String(comments.length) : "";
    comments.forEach(function (c) {
      var row = document.createElement("p"); row.className = "ig-comment";
      var nm = document.createElement("strong"); nm.textContent = c.name;
      row.appendChild(nm); row.appendChild(document.createTextNode(" " + c.body));
      list.appendChild(row);
    });
  }
  fetch("/api/social?item=" + encodeURIComponent(item) + "&vid=" + encodeURIComponent(vid))
    .then(function (r) { return r.json(); })
    .then(function (d) { if (d.ok) { drawLike(d); drawComments(d.comments || []); } else { drawLike({ likes: 0 }); } })
    .catch(function () { drawLike({ likes: 0 }); });

  $("pd-cbtn").addEventListener("click", function () { $("pd-ctext").focus(); });

  var form = $("pd-cform"), msg = $("pd-cmsg");
  // the name is optional; if he writes it once, it is remembered on this device
  try { $("pd-cname").value = localStorage.getItem("commentName") || ""; } catch (e) {}
  form.addEventListener("submit", function (e) {
    e.preventDefault();
    var btn = form.querySelector("button");
    btn.disabled = true; msg.className = "pd-msg"; msg.textContent = "";
    fetch("/api/social", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "comment", item: item, vid: vid, name: $("pd-cname").value.trim(), body: $("pd-ctext").value, website: $("pd-chp").value }),
    })
      .then(function (r) { return r.json().then(function (j) { return { ok: r.ok, j: j }; }); })
      .then(function (res) {
        if (res.ok) {
          msg.textContent = res.j.message || "Thank you!"; $("pd-ctext").value = "";
          try { localStorage.setItem("commentName", $("pd-cname").value.trim()); } catch (e) {}
        }
        else { msg.className = "pd-msg err"; msg.textContent = res.j.error || "Something went wrong."; }
      })
      .catch(function () { msg.className = "pd-msg err"; msg.textContent = "Network problem. Please try again."; })
      .then(function () { btn.disabled = false; });
  });
})();
