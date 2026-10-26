// POST /api/track  -  anonymous visit counting for the admin page.
// Stores: a random id of the browser, the page, phone/computer, the country (from Vercel) and the site the visitor came from.
// Never stores: name, email, IP address.

const L = require("./_lib");

const PAGES = ["index.html", "creation.html", "album.html", "contact.html", "order.html", "cart.html", "product.html", "favorites.html"];

module.exports = async (req, res) => {
  res.setHeader("Cache-Control", "no-store");
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }
  const b = req.body && typeof req.body === "object" ? req.body : {};

  const vid = L.validVid(b.vid);
  const page = L.clean(b.page, 40);
  if (!vid) return res.status(200).json({ ok: false });

  // a photo downloaded with the "Download" button on an article page
  if (b.kind === "download") {
    const id = L.clean(b.item, 60);
    const photo = L.clean(b.photo, 6);
    if (!L.has(L.PRODUCTS, id) || !L.PRODUCTS[id].photos.includes(photo)) return res.status(200).json({ ok: false });
    const dev = b.device === "phone" ? "phone" : "computer";
    const ctry = /^[A-Z]{2}$/.test(String(req.headers["x-vercel-ip-country"] || "")) ? req.headers["x-vercel-ip-country"] : "";
    try {
      const sql = L.db();
      await L.ensureSocialSchema(sql);
      const recent = (await sql`SELECT COUNT(*)::int AS n FROM downloads WHERE vid = ${vid} AND created_at > now() - interval '1 hour'`)[0].n;
      if (recent < 30) await sql`INSERT INTO downloads (vid, item, photo, device, country) VALUES (${vid}, ${id}, ${photo}, ${dev}, ${ctry})`;
      return res.status(200).json({ ok: true });
    } catch (err) {
      console.error("Download track error:", err);
      return res.status(200).json({ ok: false });
    }
  }

  if (!PAGES.includes(page)) return res.status(200).json({ ok: false });

  let path = "/" + page;
  const item = L.clean(b.item, 60);
  if (page === "product.html" && L.has(L.PRODUCTS, item)) path += "?item=" + encodeURIComponent(item);

  const device = b.device === "phone" ? "phone" : "computer";
  const country = /^[A-Z]{2}$/.test(String(req.headers["x-vercel-ip-country"] || "")) ? req.headers["x-vercel-ip-country"] : "";
  const ref = /^[a-z0-9.-]{3,60}$/i.test(String(b.ref || "")) ? String(b.ref).toLowerCase() : "";

  try {
    const sql = L.db();
    await L.ensureSocialSchema(sql);
    if (b.kind === "view") {
      // at most 20 page views per minute for one browser (protects the numbers from spam)
      const recent = (await sql`SELECT COUNT(*)::int AS n FROM visits WHERE vid = ${vid} AND created_at > now() - interval '1 minute'`)[0].n;
      if (recent < 20) {
        await sql`INSERT INTO visits (vid, path, device, country, ref) VALUES (${vid}, ${path}, ${device}, ${country}, ${ref})`;
      }
    }
    await sql`INSERT INTO live (vid, path, last_seen) VALUES (${vid}, ${path}, now())
              ON CONFLICT (vid) DO UPDATE SET path = EXCLUDED.path, last_seen = now()`;
    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error("Track error:", err);
    return res.status(200).json({ ok: false });
  }
};
