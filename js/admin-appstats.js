// Ajoute à la page admin : installations, ouvertures dans l'application et partages WhatsApp.
(function () {
  if (!/admin(\.html)?\/?$/.test(location.pathname)) return;
  var CARDS = [["install", "Installations de l'application"], ["app_open", "Ouvertures dans l'application"],
               ["share", "Partages WhatsApp (clics)"], ["share_visit", "Visites venues d'un partage"]];
  var LABEL = { install: "Installation", app_open: "Ouverture dans l'app", share: "Partage WhatsApp", share_visit: "Visite via un partage" };
  var box = null, tries = 0;

  function el(tag, text, css) { var e = document.createElement(tag); if (text != null) e.textContent = text; if (css) e.style.cssText = css; return e; }
  function when(iso) { try { return new Date(iso).toLocaleString("fr-FR", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }); } catch (e) { return ""; } }

  function table(title, heads, rows) {
    var wrap = el("div", null, "margin:18px 0;overflow-x:auto");
    wrap.appendChild(el("h3", title, "margin:0 0 6px"));
    if (!rows.length) { wrap.appendChild(el("p", "Rien pour le moment.", "color:#7a6a6e;margin:0")); return wrap; }
    var t = el("table", null, "border-collapse:collapse;width:100%;font-size:.92rem");
    var hr = el("tr");
    heads.forEach(function (h) { hr.appendChild(el("th", h, "text-align:left;padding:6px 8px;border-bottom:2px solid #e8a0b4")); });
    t.appendChild(hr);
    rows.forEach(function (r) {
      var tr = el("tr");
      r.forEach(function (c) { tr.appendChild(el("td", c, "padding:6px 8px;border-bottom:1px solid #f0d5dd")); });
      t.appendChild(tr);
    });
    wrap.appendChild(t);
    return wrap;
  }

  function draw(d) {
    if (box) box.remove();
    box = el("section", null, "max-width:1000px;margin:30px auto;padding:0 14px;text-align:left");
    box.id = "appstats";
    box.appendChild(el("h2", "Application et partages"));

    var grid = el("div", null, "display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:12px");
    CARDS.forEach(function (c) {
      var n = d.counts[c[0]] || { people: 0, events: 0, people_7d: 0 };
      var card = el("div", null, "background:#fff;border-radius:14px;padding:14px;box-shadow:0 2px 8px rgba(0,0,0,.08)");
      card.appendChild(el("div", String(n.people), "font-size:1.8rem;font-weight:bold;color:#9e3c5a"));
      card.appendChild(el("div", c[1], "font-weight:bold"));
      card.appendChild(el("div", n.people_7d + " personnes ces 7 derniers jours (" + n.events + " fois au total)", "font-size:.85rem;color:#7a6a6e"));
      grid.appendChild(card);
    });
    box.appendChild(grid);

    box.appendChild(table("Qui partage le plus", ["Visiteur", "Partages", "Personnes amenées", "Dernier partage"],
      d.sharers.map(function (s) { return [s.code, String(s.shares), String(s.brought), when(s.last_at)]; })));
    box.appendChild(table("Articles les plus partagés", ["Article", "Partages"],
      d.items.map(function (i) { return [i.item, String(i.shares)]; })));
    box.appendChild(table("Derniers événements", ["Date", "Quoi", "Article", "Visiteur", "Appareil", "Pays"],
      d.recent.map(function (r) {
        var who = r.kind === "share_visit" && r.via ? r.code + " (via " + r.via + ")" : r.code;
        return [when(r.at), LABEL[r.kind] || r.kind, r.item, who, r.device === "phone" ? "téléphone" : "ordinateur", r.country];
      })));

    var again = el("button", "Actualiser", "padding:8px 16px;border-radius:18px;border:2px solid #c9607f;background:#fff;color:#c9607f;font-weight:bold;cursor:pointer");
    again.type = "button";
    again.addEventListener("click", load);
    box.appendChild(again);
    (document.querySelector("main") || document.body).appendChild(box);
  }

  // même appel que le badge "Admin" du site : il marche seulement si tu es connectée comme propriétaire
  function load() {
    fetch("/api/admin", { method: "POST", headers: { "Content-Type": "application/json" }, credentials: "same-origin", body: JSON.stringify({ action: "appstats" }) })
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (d) { if (d && d.counts) draw(d); else retry(); })
      .catch(retry);
  }
  function retry() { if (++tries < 40) setTimeout(load, 3000); }   // attend que tu sois connectée
  load();
})();