// GET /api/share?item=dress-35  -  the link to send on WhatsApp.
// WhatsApp and Facebook read this page to build the preview (photo, name, price); the visitor is then sent to the article page.

const L = require("./_lib");

module.exports = async (req, res) => {
  const site = L.siteUrl() || "https://" + (req.headers["x-forwarded-host"] || req.headers.host || "");
  const item = L.clean((req.query || {}).item, 60);
  if (!L.has(L.PRODUCTS, item)) {
    res.writeHead(302, { Location: site + "/creation.html" });
    return res.end();
  }
  const p = L.PRODUCTS[item];
  const title = p.title || item;
  const prices = p.sizes ? Object.values(p.sizes) : [p.price];
  const from = Math.min.apply(null, prices);
  const price = String(from).replace(/\B(?=(\d{3})+(?!\d))/g, " ") + " UGX";
  const photo = String((p.photos || [""])[0]);
  const image = site + "/" + encodeURIComponent(photo) + ".jpeg";
  const target = site + "/product.html?item=" + encodeURIComponent(item) + "&photo=" + encodeURIComponent(photo);
  const shown = (p.sizes ? "From " : "") + price;
  const desc = (p.desc || "Handmade crochet, made with love.").trim();
  const e = L.esc;

  const html = `<!DOCTYPE html>
<html lang="en"><head><meta charset="utf-8">
<title>${e(title)} | Crochet Handcrafted Shop</title>
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta property="og:type" content="website">
<meta property="og:site_name" content="Crochet Handcrafted Shop">
<meta property="og:title" content="${e(title)} - ${e(shown)}">
<meta property="og:description" content="${e(desc)}">
<meta property="og:image" content="${e(image)}">
<meta property="og:url" content="${e(site + "/api/share?item=" + encodeURIComponent(item))}">
<meta name="twitter:card" content="summary_large_image">
<link rel="canonical" href="${e(target)}">
<meta http-equiv="refresh" content="0;url=${e(target)}">
</head><body><p><a href="${e(target)}">${e(title)}</a></p>
<script>location.replace(${JSON.stringify(target).replace(/</g, "\\u003c")});</script></body></html>`;
  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.setHeader("Cache-Control", "public, max-age=300, s-maxage=300");
  return res.status(200).send(html);
};
