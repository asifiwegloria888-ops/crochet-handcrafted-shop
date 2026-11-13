// Makes the site an installable app. Add this line before </body> on every page:
//   <script src="js/pwa.js" defer></script>
(function () {
  "use strict";
  function add(tag, attrs) {
    var sel = tag + "[" + Object.keys(attrs)[0] + '="' + attrs[Object.keys(attrs)[0]] + '"]';
    if (document.head.querySelector(sel)) return;          // already written in the page
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
})();