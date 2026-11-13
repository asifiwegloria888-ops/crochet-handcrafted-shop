// GET /api/share?item=dress-35&lang=fr  -  the link to send on WhatsApp.
//   - WhatsApp and Facebook read this page to build the preview (photo, name, price in shillings AND dollars);
//     the visitor is then sent to the article page.
//   - add &format=json to get the same text for the share button of the site ({ ok, title, price, text }).
// The dollar price needs the rate (shillings for 1 dollar): write it in Vercel -> Settings -> Environment Variables as USD_RATE
// (the same number your site uses). Without it, only the shilling price is shown.

const L = require("./_lib");
const base = require("../js/products.js");

const usdRate = () => parseFloat(process.env.USD_RATE) || parseFloat(base.USD_RATE) || 0;
const spaced = (n) => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, " ");

function usd(ugx, lang) {
  const rate = usdRate();
  if (!(rate > 0)) return "";
  const v = ugx / rate;
  const n = String(v >= 20 ? Math.round(v) : Math.round(v * 10) / 10);
  return lang === "fr" ? n.replace(".", ",") + " $" : "$" + n;
}

// "From 15 000 UGX (about $4)"  /  "À partir de 15 000 UGX (environ 4 $)"
function priceText(p, lang) {
  const prices = (p.sizes ? Object.values(p.sizes) : [p.price]).filter((x) => x > 0);
  if (!prices.length) return "";
  const from = Math.min.apply(null, prices);
  const several = new Set(prices).size > 1;
  const lead = several ? (lang === "fr" ? "À partir de " : "From ") : "";
  const d = usd(from, lang);
  return lead + spaced(from) + " UGX" + (d ? " (" + (lang === "fr" ? "environ " : "about ") + d + ")" : "");
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
  const p = L.PRODUCTS[item];
  const title = L.tr(lang, p.title || item);
  const price = priceText(p, lang);
  const photo = String((p.photos || [""])[0]);
  const image = site + "/" + encodeURIComponent(photo) + ".jpeg";
  const target = site + "/product.html?item=" + encodeURIComponent(item) + "&photo=" + encodeURIComponent(photo) + (s ? "&s=" + s : "");
  const shareUrl = site + "/api/share?item=" + encodeURIComponent(item) + (lang === "fr" ? "&lang=fr" : "") + (s ? "&s=" + s : "");
  const desc = L.tr(lang, (p.desc || (lang === "fr" ? "Crochet fait main, avec amour." : "Handmade crochet, made with love.")).trim());

  if (q.format === "json") {
    res.setHeader("Cache-Control", "public, max-age=300, s-maxage=300");
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
  res.setHeader("Cache-Control", "public, max-age=300, s-maxage=300");
  return res.status(200).send(html);
};
