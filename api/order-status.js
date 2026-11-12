// POST /api/order-status  {ref: "CH-0004", email: "..."}  ->  where the customer's order stands.
// The reference alone is not enough (references are easy to guess): the email used for the order must match too.
// When the order is "confirmed", the answer also carries the payment instructions (variable PAYMENT_INSTRUCTIONS in Vercel),
// so the customer can pay the deposit straight from the tracking page.

const L = require("./_lib");
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

module.exports = async (req, res) => {
  res.setHeader("Cache-Control", "no-store");
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }
  const body = req.body && typeof req.body === "object" ? req.body : {};
  const ref = L.clean(body.ref, 20).toUpperCase().replace(/\s+/g, "");
  const email = L.clean(body.email, 150).toLowerCase();
  const m = /^(?:CH-?)?(\d{1,8})$/.exec(ref);
  if (!m || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ error: "Please write your order reference (for example CH-0004) and the email you used for the order." });
  }
  try {
    const sql = L.db();
    await L.ensureSchema(sql);
    const rows = await sql`SELECT id, email, status, created_at, confirmed_at, paid_at, ready_date, total, deposit, currency FROM orders WHERE id = ${parseInt(m[1], 10)}`;
    const o = rows[0];
    if (!o || String(o.email || "").trim().toLowerCase() !== email) {
      await sleep(700); // slows down people who try to guess
      return res.status(404).json({ error: "We could not find this order. Please check the reference and the email." });
    }

    // Payment details: only after the reference AND the email matched, and only while the order waits for its deposit.
    const instructions = L.paymentFor(o.currency);   // the text for the customer's currency, or the general one
    const pay =
      o.status === "confirmed" && instructions
        ? { instructions, balance: o.total != null && o.deposit != null ? o.total - o.deposit : null }
        : null;

    return res.status(200).json({
      ok: true,
      ref: L.refOf(o.id),
      status: o.status,
      created_at: o.created_at,
      confirmed_at: o.confirmed_at,
      paid_at: o.paid_at,
      ready_date: o.ready_date || "",
      total: o.total,
      deposit: o.deposit,
      pay,
    });
  } catch (err) {
    console.error("Order status error:", err);
    return res.status(500).json({ error: "Something went wrong. Please try again." });
  }
};