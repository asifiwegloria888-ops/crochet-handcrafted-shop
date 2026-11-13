// Makes the site an installable app and shows an "Install the app" button. Add this line before </body> on every page:
//   <script src="js/pwa.js" defer></script>
(function () {
  "use strict";

  /* ---------- 1. what the browser needs to install the site ---------- */
  function add(tag, attrs) {
    var first = Object.keys(attrs)[0];
    if (document.head.querySelector(tag + "[" + first + '="' + attrs[first] + '"]')) return;   // already written in the page
    var el = document.createElement(tag);
    Object.keys(attrs).forEach(function (k) { el.setAttribute(k, attrs[k]); });
    document.head.appendChild(el);
  }
  add("link", { rel: "manifest", href: "/manifest.json" });
  add("meta", { name: "theme-color", content: "#c9607f" });
  add("link", { rel: "apple-touch-icon", href: "/icons/apple-touch-icon.png" });
  add("meta", { name: "apple-mobile-web-app-capable", content: "yes" });
  add("meta", { name: "apple-mobile-web-app-title", content: "Crochet Shop" });
  if ("serviceWorker" in navigator) {
    window.addEventListener("load", function () { navigator.serviceWorker.register("/sw.js").catch(function () {}); });
  }

  /* ---------- 2. the "Install the app" button ---------- */
  if (/\/admin(\.html)?\/?$/.test(location.pathname)) return;           // not on your admin page
  var installed = (window.matchMedia && window.matchMedia("(display-mode: standalone)").matches) || window.navigator.standalone === true;
  if (installed) return;                                                // already the app: no button

  var ios = /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
  var deferred = null;                                                   // the install offer given by the browser (Android, computer)
  var pill = null, footerLink = null, help = null;

  function fr() { return document.documentElement.getAttribute("lang") === "fr"; }
  var T = {
    en: { btn: "Install the app", close: "Close", ok: "OK", how: "To install the app: tap the Share button (the square with an arrow), then “Add to Home Screen”." },
    fr: { btn: "Installer l'application", close: "Fermer", ok: "OK", how: "Pour installer l'application : touchez le bouton Partager (le carré avec une flèche), puis « Sur l'écran d'accueil »." }
  };
  function say(k) { return T[fr() ? "fr" : "en"][k]; }

  function hiddenByVisitor() { try { return Date.now() - Number(localStorage.getItem("pwaHide") || 0) < 14 * 86400000; } catch (e) { return false; } }
  function hideForNow() { try { localStorage.setItem("pwaHide", String(Date.now())); } catch (e) {} if (pill) pill.style.display = "none"; }
  function closeHelp() { if (help) { help.remove(); help = null; } }
  function gone() { if (pill) pill.remove(); if (footerLink) footerLink.remove(); closeHelp(); pill = footerLink = null; }

  // iPhone: a clean window in the middle of the screen (nothing piles up on the other buttons)
  function openHelp() {
    if (help) return;
    help = document.createElement("div");
    help.setAttribute("translate", "no"); help.className = "notranslate"; help.setAttribute("data-no-i18n", "");
    help.style.cssText = "position:fixed;left:0;top:0;right:0;bottom:0;z-index:100;background:rgba(0,0,0,.45);display:flex;align-items:center;justify-content:center;padding:20px";
    var card = document.createElement("div");
    card.style.cssText = "background:#fff;color:#4a3b3f;border-radius:18px;padding:22px 20px 18px;max-width:320px;text-align:center;font:600 16px/1.45 Nunito,Arial,sans-serif;box-shadow:0 8px 24px rgba(0,0,0,.3)";
    var msg = document.createElement("p");
    msg.style.cssText = "margin:0 0 16px";
    msg.textContent = say("how");
    var ok = document.createElement("button");
    ok.type = "button"; ok.textContent = say("ok");
    ok.style.cssText = "border:0;border-radius:22px;background:#c9607f;color:#fff;padding:10px 34px;font:inherit;font-weight:700;cursor:pointer";
    card.appendChild(msg); card.appendChild(ok);
    help.appendChild(card);
    help.addEventListener("click", closeHelp);                           // a tap anywhere closes it
    document.body.appendChild(help);
  }

  function install() {
    if (deferred) {
      deferred.prompt();                                                 // Android / computer: the phone asks "Install?" directly
      deferred.userChoice.then(function () { deferred = null; gone(); });
    } else if (ios) {
      openHelp();
    }
  }

  function show() {
    if (installed) return;
    // Android / computer: a small button above the language selector (bottom left). Not on iPhone: it would only pile up.
    if (!ios && !pill) {
      pill = document.createElement("div");
      pill.setAttribute("translate", "no"); pill.className = "notranslate"; pill.setAttribute("data-no-i18n", "");
      pill.style.cssText = "position:fixed;left:12px;bottom:58px;z-index:49;display:flex;align-items:center;background:#c9607f;color:#fff;border-radius:22px;box-shadow:0 3px 10px rgba(0,0,0,.25);font:700 14px/1 Nunito,Arial,sans-serif;overflow:hidden";
      var b = document.createElement("button");
      b.type = "button"; b.textContent = "📲 " + say("btn");
      b.style.cssText = "all:unset;cursor:pointer;padding:10px 6px 10px 14px;color:#fff;font:inherit;white-space:nowrap";
      b.addEventListener("click", install);
      var x = document.createElement("button");
      x.type = "button"; x.textContent = "✕"; x.setAttribute("aria-label", say("close"));
      x.style.cssText = "all:unset;cursor:pointer;padding:10px 12px 10px 6px;color:#fff;opacity:.85;font:inherit";
      x.addEventListener("click", hideForNow);
      pill.appendChild(b); pill.appendChild(x);
      if (!hiddenByVisitor()) document.body.appendChild(pill);
    }
    // the link in the footer: always there (the only button on iPhone)
    var links = document.querySelector(".footer-links");
    if (links && !footerLink) {
      footerLink = document.createElement("a");
      footerLink.href = "#"; footerLink.textContent = "📲 " + say("btn");
      footerLink.addEventListener("click", function (e) { e.preventDefault(); install(); });
      links.appendChild(footerLink);
    }
  }

  window.addEventListener("beforeinstallprompt", function (e) { e.preventDefault(); deferred = e; show(); });   // Android and computer
  window.addEventListener("appinstalled", gone);
  if (ios) setTimeout(show, 2500);                                       // iPhone: only the footer link
})();