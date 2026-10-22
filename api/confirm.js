// Vercel serverless function: /api/confirm?id=6&t=<token>
// The shop owner opens this link from the "New order" email, checks the total price,
// and one click sends the customer: confirmation + 50% deposit amount + payment instructions.

const { neon } = require("@neondatabase/serverless");
const nodemailer = require("nodemailer");
const crypto = require("crypto");

const esc = (s) =>
  String(s == null ? "" : s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const money = (n) => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, " ") + " UGX";

// Same signature as in order.js: only someone with the email link can confirm an order.
const sign = (id) =>
  crypto.createHmac("sha256", process.env.CONFIRM_SECRET || "").update(String(id)).digest("hex").slice(0, 32);

function validToken(id, token) {
  if (!process.env.CONFIRM_SECRET || typeof token !== "string") return false;
  const a = Buffer.from(sign(id));
  const b = Buffer.from(token);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

function send(res, status, title, body) {
  res.status(status);
  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.setHeader("Cache-Control", "no-store");
  return res.send(`<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1"><title>${esc(title)}</title>
<style>
body{margin:0;background:#fff7f2;color:#4a3b3f;font-family:Georgia,serif;line-height:1.6}
main{max-width:520px;margin:0 auto;padding:28px 20px}
h1{color:#c9607f;font-size:1.6rem}
.box{background:#fff;border-radius:16px;padding:20px;box-shadow:0 4px 14px rgba(0,0,0,.08)}
label{display:block;font-weight:bold;margin:14px 0 4px;color:#c9607f}
input{width:100%;padding:12px;border:1px solid #e8a0b4;border-radius:10px;font-size:1rem;font-family:inherit}
button{margin-top:18px;width:100%;background:#c9607f;color:#fff;border:none;padding:14px;border-radius:10px;font-size:1rem;cursor:pointer}
.err{background:#fde4e4;color:#9b1c1c;padding:10px 14px;border-radius:10px}
.ok{background:#e3f4e8;color:#1b5e34;padding:10px 14px;border-radius:10px}
</style></head><body><main>${body}</main></body></html>`);
}

function formPage(res, order, ref, token, error) {
  const guess = order.unit_price ? order.unit_price * order.quantity : "";
  const action = `/api/confirm?id=${order.id}&t=${encodeURIComponent(token)}`;
  return send(
    res,
    error ? 400 : 200,
    `Confirm ${ref}`,
    `<h1>Confirm order ${esc(ref)}</h1>
<div class="box">
  <p><strong>${esc(order.name)}</strong><br>${esc(order.email)}${order.phone ? "<br>" + esc(order.phone) : ""}</p>
  <p>${esc(order.item)} x ${esc(order.quantity)}<br>Colors: ${esc(order.colors || "-")}<br>Size: ${esc(order.size || "-")}<br>Notes: ${esc(order.notes || "-")}</p>
  ${error ? `<p class="err">${esc(error)}</p>` : ""}
  <form method="POST" action="${esc(action)}">
    <label for="total">Total price (UGX)</label>
    <input id="total" name="total" type="number" min="1" step="1" value="${esc(guess)}" required>
    <p id="dep"></p>
    <button type="submit">Send confirmation and deposit request</button>
  </form>
</div>
<script>
 var t=document.getElementById("total"),d=document.getElementById("dep");
 function u(){var v=parseInt(t.value,10);d.textContent=v>0?"Deposit asked (50%): "+Math.ceil(v/2).toString().replace(/\\B(?=(\\d{3})+(?!\\d))/g," ")+" UGX":"";}
 t.addEventListener("input",u);u();
</script>`
  );
}

module.exports = async (req, res) => {
  if (req.method !== "GET" && req.method !== "POST") {
    res.setHeader("Allow", "GET, POST");
    return res.status(405).send("Method not allowed");
  }

  const id = parseInt(req.query && req.query.id, 10);
  const token = req.query && req.query.t;
  if (!Number.isInteger(id) || id < 1 || !validToken(id, token)) {
    return send(res, 403, "Link not valid", "<h1>Link not valid</h1><p>This confirmation link is not valid.</p>");
  }

  const sql = neon(process.env.POSTGRES_URL || process.env.DATABASE_URL);
  let order;
  try {
    await sql`ALTER TABLE orders ADD COLUMN IF NOT EXISTS total INT`;
    await sql`ALTER TABLE orders ADD COLUMN IF NOT EXISTS deposit INT`;
    await sql`ALTER TABLE orders ADD COLUMN IF NOT EXISTS confirmed_at TIMESTAMPTZ`;
    const rows = await sql`SELECT * FROM orders WHERE id = ${id}`;
    order = rows[0];
  } catch (err) {
    console.error("Database error:", err);
    return send(res, 500, "Error", "<h1>Error</h1><p>Could not read the order. Please try again.</p>");
  }
  if (!order) return send(res, 404, "Not found", "<h1>Order not found</h1>");

  const ref = "CH-" + String(order.id).padStart(4, "0");

  if (order.status === "confirmed") {
    return send(
      res,
      200,
      `${ref} already confirmed`,
      `<h1>Order ${esc(ref)}</h1><p class="ok">This order is already confirmed.<br>Total ${esc(money(order.total || 0))}, deposit asked ${esc(money(order.deposit || 0))}.</p>`
    );
  }

  if (req.method === "GET") return formPage(res, order, ref, token);

  // ---- POST: confirm ----
  const total = parseInt(req.body && req.body.total, 10);
  if (!Number.isInteger(total) || total < 1 || total > 100000000) {
    return formPage(res, order, ref, token, "Please enter a valid total price.");
  }
  const instructions = (process.env.PAYMENT_INSTRUCTIONS || "").trim();
  if (!instructions) {
    return send(
      res,
      500,
      "Missing setting",
      "<h1>Missing setting</h1><p class=\"err\">Add the variable PAYMENT_INSTRUCTIONS in Vercel (your mobile money number and name), then redeploy.</p>"
    );
  }

  const deposit = Math.ceil(total / 2);
  const balance = total - deposit;

  try {
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: { user: process.env.GMAIL_USER, pass: process.env.GMAIL_APP_PASSWORD },
    });
    const owner = process.env.OWNER_EMAIL || process.env.GMAIL_USER;
    await transporter.sendMail({
      from: `"Crochet Handcrafted Shop" <${process.env.GMAIL_USER}>`,
      to: order.email,
      bcc: owner,
      replyTo: owner,
      subject: `Order ${ref} confirmed: please send your 50% deposit`,
      html: `<div style="font-family:Arial,sans-serif;color:#1B2150;max-width:560px">
        <h2 style="color:#c9607f">Your order ${esc(ref)} is confirmed</h2>
        <p>Hello ${esc(order.name)}, thank you for your order. To start working on it, I ask for a 50% deposit.</p>
        <table style="border-collapse:collapse;font-size:15px">
          <tr><td style="padding:6px 12px 6px 0"><strong>Item</strong></td><td>${esc(order.item)} x ${esc(order.quantity)}</td></tr>
          <tr><td style="padding:6px 12px 6px 0"><strong>Total price</strong></td><td>${esc(money(total))}</td></tr>
          <tr><td style="padding:6px 12px 6px 0"><strong>Deposit to pay now (50%)</strong></td><td><strong>${esc(money(deposit))}</strong></td></tr>
          <tr><td style="padding:6px 12px 6px 0"><strong>Remaining balance</strong></td><td>${esc(money(balance))}</td></tr>
        </table>
        <h3>How to pay the deposit</h3>
        <p style="background:#fff7f2;padding:12px;border-radius:8px">${esc(instructions).replace(/\r?\n/g, "<br>")}</p>
        <p>Please write <strong>${esc(ref)}</strong> as the payment reference. After paying, reply to this email with the transaction ID or a screenshot. I start your order as soon as I receive the deposit.</p>
        <p>Crochet Handcrafted Shop</p>
      </div>`,
    });
  } catch (err) {
    console.error("Email error:", err);
    return formPage(res, order, ref, token, "The email could not be sent. Nothing was saved, please try again.");
  }

  try {
    await sql`UPDATE orders SET status = 'confirmed', total = ${total}, deposit = ${deposit}, confirmed_at = now() WHERE id = ${id}`;
  } catch (err) {
    console.error("Database update error:", err);
  }

  return send(
    res,
    200,
    `${ref} confirmed`,
    `<h1>Order ${esc(ref)}</h1><p class="ok">Confirmation sent to ${esc(order.email)}.<br>Total ${esc(money(total))}, deposit asked ${esc(money(deposit))}.</p>`
  );
};
