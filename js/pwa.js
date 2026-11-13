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
    en: { btn: "Install the app", close: "Close", how: "To install the app: tap the Share button, then “Add to Home Screen”." },
    fr: { btn: "Installer l'application", close: "Fermer", how: "Pour installer l'application : touchez le bouton Partager, puis « Sur l'écran d'accueil »." }
  };
  function say(k) { return T[fr() ? "fr" : "en"][k]; }

  function hiddenByVisitor() { try { return Date.now() - Number(localStorage.getItem("pwaHide") || 0) < 14 * 86400000; } catch (e) { return false; } }
  function hideForNow() { try { localStorage.setItem("pwaHide", String(Date.now())); } catch (e) {} if (pill) pill.style.display = "none"; }
  function gone() { if (pill) pill.remove(); if (footerLink) footerLink.remove(); if (help) help.remove(); pill = footerLink = help = null; }

  function install() {
    if (deferred) {
      deferred.prompt();
      deferred.userChoice.then(function () { deferred = null; gone(); });
    } else if (ios) {
      if (help) { help.remove(); help = null; return; }
      help = document.createElement("div");
      help.setAttribute("translate", "no"); help.className = "notranslate"; help.setAttribute("data-no-i18n", "");
      help.style.cssText = "position:fixed;left:12px;right:12px;bottom:112px;max-width:340px;z-index:60;background:#fff;color:#4a3b3f;border:2px solid #e8a0b4;border-radius:16px;padding:14px 16px;box-shadow:0 6px 18px rgba(0,0,0,.22);font:600 15px/1.4 Nunito,Arial,sans-serif";
      help.textContent = say("how");
      document.body.appendChild(help);
      setTimeout(function () { if (help) { help.remove(); help = null; } }, 9000);
    }
  }

  function show() {
    if (pill || installed) return;
    // a small button above the language selector (bottom left)
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
    // and a link in the footer, always there
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
  if (ios) setTimeout(show, 2500);                                       // iPhone: the browser gives no offer, so we show how to do it
})();