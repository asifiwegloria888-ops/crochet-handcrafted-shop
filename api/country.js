// GET /api/country  ->  {"country":"RW"}   the country the visitor is connecting from (Vercel gives it for free).
// The site uses it to show prices in the money of that country. Nothing is stored here.
module.exports = (req, res) => {
  res.setHeader("Cache-Control", "no-store");
  res.status(200).json({ country: String(req.headers["x-vercel-ip-country"] || "").toUpperCase().slice(0, 2) });
};