// Small service worker: lets the site be installed as an app and shows a friendly page when there is no connection.
// Pages and files are always fetched from the internet first (so your changes show up at once); the saved copy is only used offline.
// To force every phone to forget the saved copies, change the number in CACHE.
const CACHE = "crochet-shop-v1";
const OFFLINE = "offline.html";

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll([OFFLINE, "icons/icon-192.png"])).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (e) => {
  const req = e.request;
  const url = new URL(req.url);
  // only simple page/file requests of this site; never the orders, comments, likes... (api) and never anything that sends data
  if (req.method !== "GET" || url.origin !== location.origin || url.pathname.startsWith("/api/")) return;
  e.respondWith(
    fetch(req)
      .then((res) => {
        if (res && res.ok) { const copy = res.clone(); caches.open(CACHE).then((c) => c.put(req, copy)); }
        return res;
      })
      .catch(() => caches.match(req).then((hit) => hit || (req.mode === "navigate" ? caches.match(OFFLINE) : Response.error())))
  );
});