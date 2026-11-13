// GET /api/share?item=dress-35&lang=fr&c=RWF&s=a3f9c2d1  -  the link to send on WhatsApp.
//   - WhatsApp and Facebook read this page to build the preview (photo, name, price in the sharer's money AND dollars);
//     the visitor is then sent to the article page.
//   - add &format=json to get the same text for the share button of the site ({ ok, title, price, text }).
//   - c = the money of the person who shares (UGX, RWF, KES...). Without it, the money of the country of the request (USD if unknown).
// The dollar price needs the rate (shillings for 1 dollar): USD_RATE in Vercel -> Settings -> Environment Variables.

const L = require("./_lib");
const base = require("../js/products.js");

// the currencies and rates of the site (js/rates.js, written for the browser: it is loaded here with a fake "window")
let R = null;
try {
  const hadWindow = typeof globalThis.window !== "undefined";
  if (!hadWindow) globalThis.window = {};
  const m = require("../js/rates.js");
  R = (m && typeof m.show === "function" ? m : null) || globalThis.window.SHOP_RATES || null;
  if (!hadWindow) delete globalThis.window;
} catch (e) { R = null; }
if (R && typeof R.show !== "function") R = null;

const usdRate = () => parseFloat(process.env.USD_RATE) || parseFloat(base.USD_RATE) || 0;
const spaced = (n) => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, " ");

function usd(ugx, lang) {
  const rate = usdRate();
  if (!(rate > 0)) return "";
  const v = ugx / rate;
  const n = String(v >= 20 ? Math.round(v) : Math.round(v * 10) / 10);
  return lang === "fr" ? n.replace(".", ",") + " $" : "$" + n;
}

// the money to show: the one chosen by the sharer (c), else the one of the country of the request, else dollars
function currencyFor(req, q) {
  if (!R) return "";
  const c = String(q.c || "").toUpperCase();
  if (/^[A-Z]{3}$/.test(c) && (typeof R.isCode !== "function" || R.isCode(c))) return c;
  const country = String(req.headers["x-vercel-ip-country"] || "").toUpperCase();
  return (R.BY_REGION && R.BY_REGION[country]) || "USD";
}

// one price: "6 000 RWF (≈ $4.05)"
function money(ugx, cur, lang) {
  if (R && cur) {
    const s = R.show(ugx, cur);
    if (s) return s;
  }
  const d = usd(ugx, lang);                                   // without rates.js: shillings + dollars, as before
  return spaced(ugx) + " UGX" + (d ? " (" + (lang === "fr" ? "environ " : "about ") + d + ")" : "");
}

// "70 000 UGX (≈ $18.92)" + "90 000 UGX (≈ $24.32)"  ->  "70 000 UGX - 90 000 UGX (≈ $18.92 - $24.32)"
function joinRange(a, b) {
  const re = /^(.+?)\s*\(\s*(≈|environ|about)?\s*([^)]*)\)\s*$/;
  const x = re.exec(a), y = re.exec(b);
  if (x && y) return x[1] + " - " + y[1] + " (" + (x[2] ? x[2] + " " : "") + x[3] + " - " + y[3] + ")";
  return a + " - " + b;
}

// the price of an article: one price, or the lowest and the highest when the sizes do not cost the same (no more "From")
function priceText(p, lang, cur) {
  const prices = Array.from(new Set((p.sizes ? Object.values(p.sizes) : [p.price]).filter((x) => x > 0))).sort((a, b) => a - b);
  if (!prices.length) return "";
  const low = money(prices[0], cur, lang);
  if (prices.length === 1) return low;
  return joinRange(low, money(prices[prices.length - 1], cur, lang));
}

module.exports = async (req, res) => {
  const site = L.siteUrl() || "https://" + (req.headers["x-forwarded-host"] || req.headers.host || "");
  const q = req.query || {};
  const item = L.clean(q.item, 60);
  const lang = q.lang === "fr" ? "fr" : "en";
  const s = /^[A-Za-z0-9-]{8}$/.test(String(q.s || "")) ? String(q.s) : "";
  if (!L.has(L.PRODUCTS, item)) {
    if (q.format === "json") return res.status(404).json({ ok: false });
    res.writeHead(302, { Location: site + "/creation.html" });
    return res.end();
  }
  const cur = currencyFor(req, q);
  const p = L.PRODUCTS[item];
  const title = L.tr(lang, p.title || item);
  const price = priceText(p, lang, cur);
  const photo = String((p.photos || [""])[0]);
  const image = site + "/" + encodeURIComponent(photo) + ".jpeg";
  const target = site + "/product.html?item=" + encodeURIComponent(item) + "&photo=" + encodeURIComponent(photo) + (s ? "&s=" + s : "");
  const shareUrl = site + "/api/share?item=" + encodeURIComponent(item) + (lang === "fr" ? "&lang=fr" : "") + (q.c ? "&c=" + encodeURIComponent(String(q.c).toUpperCase().slice(0, 3)) : "") + (s ? "&s=" + s : "");
  const desc = L.tr(lang, (p.desc || (lang === "fr" ? "Crochet fait main, avec amour." : "Handmade crochet, made with love.")).trim());
  // the page depends on the money: it is kept in memory only when the money is written in the link
  const cache = q.c ? "public, max-age=300, s-maxage=300" : "no-store";

  if (q.format === "json") {
    res.setHeader("Cache-Control", cache);
    return res.status(200).json({ ok: true, title, price, text: price ? title + " - " + price : title, url: shareUrl });
  }

  const e = L.esc;
  const html = `<!DOCTYPE html>
<html lang="${lang}"><head><meta charset="utf-8">
<title>${e(title)} | Crochet Handcrafted Shop</title>
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta property="og:type" content="website">
<meta property="og:site_name" content="Crochet Handcrafted Shop">
<meta property="og:title" content="${e(price ? title + " - " + price : title)}">
<meta property="og:description" content="${e(desc)}">
<meta property="og:image" content="${e(image)}">
<meta property="og:url" content="${e(shareUrl)}">
<meta name="twitter:card" content="summary_large_image">
<link rel="canonical" href="${e(target)}">
<meta http-equiv="refresh" content="0;url=${e(target)}">
</head><body><p><a href="${e(target)}">${e(title)}</a></p>
<script>location.replace(${JSON.stringify(target).replace(/</g, "\\u003c")});</script></body></html>`;
  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.setHeader("Cache-Control", cache);
  return res.status(200).send(html);
};