// GET /api/top  ->  the articles with the most likes (used for the "Most loved" label on the Creation page)

const L = require("./_lib");

module.exports = async (req, res) => {
  res.setHeader("Cache-Control", "public, s-maxage=300, stale-while-revalidate=600");
  try {
    const sql = L.db();
    await L.ensureSocialSchema(sql);
    const rows = await sql`SELECT item, COUNT(*)::int AS n FROM likes GROUP BY item ORDER BY n DESC, item LIMIT 5`;
    return res.status(200).json({ ok: true, top: rows.filter((r) => L.has(L.PRODUCTS, r.item)) });
  } catch (err) {
    console.error("Top error:", err);
    return res.status(200).json({ ok: true, top: [] }); // the labels are only decoration: an error shows nothing
  }
};
