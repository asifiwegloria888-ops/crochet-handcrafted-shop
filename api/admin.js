// POST /api/admin  -  private API of the admin page. Everything except "login" needs the owner's session cookie.

const crypto = require("crypto");
const L = require("./_lib");

const SESSION_HOURS = 12;
const STATUSES = ["new", "confirmed", "paid", "done", "cancelled"];

const secretKey = () => (process.env.ADMIN_PASSWORD || "") + "|" + (process.env.CONFIRM_SECRET || "");
const mac = (text) => crypto.createHmac("sha256", secretKey()).update(text).digest("hex");
const sha = (text) => crypto.createHash("sha256").update(String(text)).digest();
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function configured() {
  return (process.env.ADMIN_PASSWORD || "").length >= 10 && !!process.env.CONFIRM_SECRET;
}

function makeToken() {
  const exp = Date.now() + SESSION_HOURS * 3600 * 1000;
  return exp + "." + mac("adm" + exp);
}

function validSession(req) {
  const m = (req.headers.cookie || "").match(/(?:^|;\s*)adm=([^;]+)/);
  if (!m) return false;
  const [exp, sig] = decodeURIComponent(m[1]).split(".");
  if (!exp || !sig || !(Number(exp) > Date.now())) return false;
  const a = Buffer.from(mac("adm" + exp));
  const b = Buffer.from(sig);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

const cookie = (value, maxAge) => `adm=${value}; Path=/api; HttpOnly; Secure; SameSite=Strict; Max-Age=${maxAge}`;

function publicOrder(o) {
  return {
    id: o.id,
    ref: L.refOf(o.id),
    created_at: o.created_at,
    status: o.status,
    name: o.name,
    email: o.email,
    phone: o.phone || "",
    address: o.address || "",
    delivery: o.delivery || "",
    delivery_fee: o.delivery_fee,
    delivery_quote: L.needsQuote(o),
    ready_date: o.ready_date || "",
    items_subtotal: L.orderLines(o).every((l) => l.line_total != null) ? L.orderLines(o).reduce((s, l) => s + l.line_total, 0) : null,
    notes: o.notes || "",
    items: L.orderLines(o),
    estimate: L.estimateOf(o),
    total: o.total,
    deposit: o.deposit,
  };
}

module.exports = async (req, res) => {
  res.setHeader("Cache-Control", "no-store");
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }
  if (!(req.headers["content-type"] || "").includes("application/json")) {
    return res.status(415).json({ error: "Unsupported request" });
  }
  if (!configured()) {
    return res.status(500).json({ error: "Admin is not set up. Add ADMIN_PASSWORD (at least 10 characters) and CONFIRM_SECRET in Vercel, then redeploy." });
  }

  const b = req.body && typeof req.body === "object" ? req.body : {};

  if (b.action === "login") {
    const ok = typeof b.password === "string" && crypto.timingSafeEqual(sha(b.password), sha(process.env.ADMIN_PASSWORD));
    if (!ok) {
      await sleep(1200); // slows down password guessing
      return res.status(401).json({ error: "Wrong password." });
    }
    res.setHeader("Set-Cookie", cookie(encodeURIComponent(makeToken()), SESSION_HOURS * 3600));
    return res.status(200).json({ ok: true });
  }

  if (b.action === "logout") {
    res.setHeader("Set-Cookie", cookie("", 0));
    return res.status(200).json({ ok: true });
  }

  if (!validSession(req)) return res.status(401).json({ error: "Please log in." });

  try {
    const sql = L.db();
    await L.ensureSchema(sql);

    if (b.action === "check") return res.status(200).json({ ok: true });

    if (b.action === "count") {
      const rows = await sql`SELECT COUNT(*)::int AS n FROM orders WHERE status = 'new'`;
      await L.ensureSocialSchema(sql);
      const pending = await sql`SELECT COUNT(*)::int AS n FROM comments WHERE status = 'pending'`;
      return res.status(200).json({ ok: true, new: rows[0].n, comments: pending[0].n });
    }

    if (b.action === "stats") {
      await L.ensureSocialSchema(sql);
      await sql`DELETE FROM visits WHERE created_at < now() - interval '90 days'`;
      const visits = await sql`SELECT vid, path, device, country, ref, created_at FROM visits WHERE created_at > now() - interval '8 days' ORDER BY id DESC LIMIT 30000`;
      const live = await sql`SELECT path FROM live WHERE last_seen > now() - interval '2 minutes'`;
      const downloads = await sql`SELECT item, photo, device, country, created_at FROM downloads WHERE created_at > now() - interval '8 days' ORDER BY id DESC LIMIT 5000`;
      return res.status(200).json({ ok: true, stats: { ...L.buildStats(visits, live, Date.now()), downloads: L.buildDownloads(downloads, Date.now()) } });
    }

    if (b.action === "comments") {
      await L.ensureSocialSchema(sql);
      const rows = await sql`SELECT id, item, name, body, status, created_at FROM comments ORDER BY id DESC LIMIT 200`;
      return res.status(200).json({ ok: true, comments: rows.map((c) => ({ ...c, label: L.labelOf(c.item) })) });
    }

    if (b.action === "comment_status" || b.action === "comment_delete") {
      await L.ensureSocialSchema(sql);
      const cid = parseInt(b.id, 10);
      if (!Number.isInteger(cid) || cid < 1) return res.status(400).json({ error: "Invalid comment." });
      if (b.action === "comment_delete") {
        await sql`DELETE FROM comments WHERE id = ${cid}`;
      } else {
        if (!["approved", "hidden", "pending"].includes(b.status)) return res.status(400).json({ error: "Invalid status." });
        await sql`UPDATE comments SET status = ${b.status} WHERE id = ${cid}`;
      }
      return res.status(200).json({ ok: true });
    }

    if (b.action === "list") {
      const rows = await sql`SELECT * FROM orders ORDER BY id DESC LIMIT 300`;
      return res.status(200).json({ ok: true, orders: rows.map(publicOrder) });
    }

    const id = parseInt(b.id, 10);
    if (!Number.isInteger(id) || id < 1) return res.status(400).json({ error: "Invalid order." });
    const order = (await sql`SELECT * FROM orders WHERE id = ${id}`)[0];
    if (!order) return res.status(404).json({ error: "Order not found." });

    if (b.action === "confirm") {
      if (order.status !== "new") return res.status(400).json({ error: "This order is already confirmed." });
      const { fee, total } = L.resolveConfirm(order, b);
      await L.doConfirm(sql, order, total, fee);
      return res.status(200).json({ ok: true });
    }

    if (b.action === "deposit") {
      if (order.status !== "confirmed") return res.status(400).json({ error: "Confirm the order first." });
      await L.doDeposit(sql, order);
      return res.status(200).json({ ok: true });
    }

    if (b.action === "status") {
      if (!STATUSES.includes(b.status)) return res.status(400).json({ error: "Invalid status." });
      await sql`UPDATE orders SET status = ${b.status} WHERE id = ${id}`;
      return res.status(200).json({ ok: true });
    }

    return res.status(400).json({ error: "Unknown action." });
  } catch (err) {
    if (err.user) return res.status(400).json({ error: err.message });
    console.error("Admin error:", err);
    return res.status(500).json({ error: "Server error. Please try again." });
  }
};
