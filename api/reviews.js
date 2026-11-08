// /api/reviews  -  customer reviews shown on the home page.
//   GET                                  -> approved reviews, their number and the average rating
//   POST {vid, name, rating, body}       -> saved as "pending": you approve it in the admin page
//
// Reviews live in the same "comments" table as the comments of the article pages (item = "reviews"),
// so you approve, hide or delete them in the admin page exactly like a comment.
// The rating is saved at the start of the text, for example "[5*] Beautiful dress!".

const L = require("./_lib");

const ITEM = "reviews";

function parse(row) {
  const m = /^\[([1-5])\*\] ([\s\S]*)$/.exec(row.body || "");
  if (!m) return null;
  return { name: row.name, rating: parseInt(m[1], 10), body: m[2], created_at: row.created_at };
}

module.exports = async (req, res) => {
  res.setHeader("Cache-Control", "no-store");

  try {
    const sql = L.db();
    await L.ensureSocialSchema(sql);

    if (req.method === "GET") {
      const rows = await sql`SELECT name, body, created_at FROM comments WHERE item = ${ITEM} AND status = 'approved' ORDER BY id DESC LIMIT 100`;
      const reviews = rows.map(parse).filter(Boolean);
      const count = reviews.length;
      const average = count ? Math.round((reviews.reduce((s, r) => s + r.rating, 0) / count) * 10) / 10 : 0;
      return res.status(200).json({ ok: true, count, average, reviews: reviews.slice(0, 12) });
    }

    if (req.method !== "POST") {
      res.setHeader("Allow", "GET, POST");
      return res.status(405).json({ error: "Method not allowed" });
    }

    const src = req.body && typeof req.body === "object" ? req.body : {};
    if (src.website) return res.status(200).json({ ok: true }); // honeypot: a robot filled the hidden field
    const vid = L.validVid(src.vid);
    if (!vid) return res.status(400).json({ error: "Please reload the page and try again." });

    const name = L.clean(src.name, 40);
    const text = L.clean(src.body, 500);
    const rating = parseInt(src.rating, 10);
    if (!Number.isInteger(rating) || rating < 1 || rating > 5) return res.status(400).json({ error: "Please choose a rating from 1 to 5 stars." });
    if (name.length < 2) return res.status(400).json({ error: "Please write your name (at least 2 letters)." });
    if (text.length < 2) return res.status(400).json({ error: "Please write your review." });
    if (/https?:\/\/|www\./i.test(text + " " + name)) return res.status(400).json({ error: "Links are not allowed in comments." });

    const recent = (await sql`SELECT COUNT(*)::int AS n FROM comments WHERE vid = ${vid} AND created_at > now() - interval '1 hour'`)[0].n;
    if (recent >= 3) return res.status(429).json({ error: "You wrote several comments already. Please try again later." });

    await sql`INSERT INTO comments (item, vid, name, body) VALUES (${ITEM}, ${vid}, ${name}, ${"[" + rating + "*] " + text})`;
    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error("Reviews error:", err);
    return res.status(500).json({ error: "Something went wrong. Please try again." });
  }
};
