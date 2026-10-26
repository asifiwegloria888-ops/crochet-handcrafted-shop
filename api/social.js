// /api/social  -  likes and comments on an article page.
//   GET  ?item=Crop+top&vid=...   -> number of likes, did this browser like it, approved comments
//   POST {action:"like", item, vid}                    -> like / unlike
//   POST {action:"comment", item, vid, name, body}      -> saved as "pending": you approve it in the admin page

const L = require("./_lib");

module.exports = async (req, res) => {
  res.setHeader("Cache-Control", "no-store");
  const src = req.method === "GET" ? req.query || {} : req.body && typeof req.body === "object" ? req.body : {};
  const item = L.clean(src.item, 60);
  if (!L.has(L.PRODUCTS, item)) return res.status(400).json({ error: "Unknown item." });
  const vid = L.validVid(src.vid);

  try {
    const sql = L.db();
    await L.ensureSocialSchema(sql);

    const likeInfo = async () => {
      const n = (await sql`SELECT COUNT(*)::int AS n FROM likes WHERE item = ${item}`)[0].n;
      const liked = vid ? (await sql`SELECT 1 AS x FROM likes WHERE item = ${item} AND vid = ${vid}`).length > 0 : false;
      return { likes: n, liked };
    };

    if (req.method === "GET") {
      const comments = await sql`SELECT name, body, created_at FROM comments WHERE item = ${item} AND status = 'approved' ORDER BY id DESC LIMIT 50`;
      return res.status(200).json({ ok: true, ...(await likeInfo()), comments });
    }

    if (req.method !== "POST") {
      res.setHeader("Allow", "GET, POST");
      return res.status(405).json({ error: "Method not allowed" });
    }
    if (!vid) return res.status(400).json({ error: "Please reload the page and try again." });

    if (src.action === "like") {
      const already = (await sql`SELECT 1 AS x FROM likes WHERE item = ${item} AND vid = ${vid}`).length > 0;
      if (already) await sql`DELETE FROM likes WHERE item = ${item} AND vid = ${vid}`;
      else await sql`INSERT INTO likes (item, vid) VALUES (${item}, ${vid})`;
      return res.status(200).json({ ok: true, ...(await likeInfo()) });
    }

    if (src.action === "comment") {
      if (src.website) return res.status(200).json({ ok: true, message: "Thank you! Your comment will appear after I approve it." }); // honeypot
      const name = L.clean(src.name, 40);
      const body = L.clean(src.body, 500);
      if (name.length < 2) return res.status(400).json({ error: "Please write your name (at least 2 letters)." });
      if (body.length < 2) return res.status(400).json({ error: "Please write your comment." });
      if (/https?:\/\/|www\./i.test(body + " " + name)) return res.status(400).json({ error: "Links are not allowed in comments." });
      const recent = (await sql`SELECT COUNT(*)::int AS n FROM comments WHERE vid = ${vid} AND created_at > now() - interval '1 hour'`)[0].n;
      if (recent >= 3) return res.status(429).json({ error: "You wrote several comments already. Please try again later." });
      await sql`INSERT INTO comments (item, vid, name, body) VALUES (${item}, ${vid}, ${name}, ${body})`;
      return res.status(200).json({ ok: true, message: "Thank you! Your comment will appear after I approve it." });
    }

    return res.status(400).json({ error: "Unknown action." });
  } catch (err) {
    console.error("Social error:", err);
    return res.status(500).json({ error: "Something went wrong. Please try again." });
  }
};
