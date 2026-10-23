// Shared helpers for the API (the "_" in the name means Vercel does NOT publish it as a page).
// Prices come from js/products.js, the same file the website uses.

const { neon } = require("@neondatabase/serverless");
const nodemailer = require("nodemailer");
const crypto = require("crypto");
const { PRODUCTS, DELIVERY_FEES } = require("../js/products.js");

const has = (o, k) => Object.prototype.hasOwnProperty.call(o, k);
const esc = (s) =>
  String(s == null ? "" : s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const clean = (v, max) => (typeof v === "string" ? v.trim().slice(0, max) : "");
const money = (n) => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, " ") + " UGX";
const refOf = (id) => "CH-" + String(id).padStart(4, "0");
const userError = (message) => Object.assign(new Error(message), { user: true });

// ---------- Database ----------
const db = () => neon(process.env.POSTGRES_URL || process.env.DATABASE_URL);

let schemaReady = false;
async function ensureSchema(sql) {
  if (schemaReady) return;
  await sql`
    CREATE TABLE IF NOT EXISTS orders (
      id SERIAL PRIMARY KEY,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      name TEXT NOT NULL,
      email TEXT NOT NULL,
      phone TEXT,
      item TEXT NOT NULL,
      colors TEXT,
      size TEXT,
      quantity INT NOT NULL,
      notes TEXT,
      status TEXT NOT NULL DEFAULT 'new'
    )`;
  await sql`ALTER TABLE orders ADD COLUMN IF NOT EXISTS photo TEXT`;
  await sql`ALTER TABLE orders ADD COLUMN IF NOT EXISTS unit_price INT`;
  await sql`ALTER TABLE orders ADD COLUMN IF NOT EXISTS address TEXT`;
  await sql`ALTER TABLE orders ADD COLUMN IF NOT EXISTS delivery TEXT`;
  await sql`ALTER TABLE orders ADD COLUMN IF NOT EXISTS delivery_fee INT`;
  await sql`ALTER TABLE orders ADD COLUMN IF NOT EXISTS items JSONB`;
  await sql`ALTER TABLE orders ADD COLUMN IF NOT EXISTS total INT`;
  await sql`ALTER TABLE orders ADD COLUMN IF NOT EXISTS deposit INT`;
  await sql`ALTER TABLE orders ADD COLUMN IF NOT EXISTS confirmed_at TIMESTAMPTZ`;
  await sql`ALTER TABLE orders ADD COLUMN IF NOT EXISTS paid_at TIMESTAMPTZ`;
  schemaReady = true;
}

// ---------- Prices (decided here, never by the browser) ----------
function priceItems(raw) {
  const errors = [];
  const items = [];
  if (!Array.isArray(raw) || raw.length === 0) return { items, errors: ["Your cart is empty."], subtotal: 0 };
  if (raw.length > 30) errors.push("Too many items in one order.");

  raw.slice(0, 30).forEach((r) => {
    r = r && typeof r === "object" ? r : {};
    const name = clean(r.item, 60);
    if (!has(PRODUCTS, name)) {
      errors.push("One item is not available anymore.");
      return;
    }
    const product = PRODUCTS[name];
    let size = clean(r.size, 40);
    let unit;
    if (product.sizes) {
      if (!has(product.sizes, size)) {
        errors.push(`Please choose a size for ${name}.`);
        return;
      }
      unit = product.sizes[size];
    } else {
      size = "";
      unit = product.price;
    }
    const quantity = parseInt(r.qty != null ? r.qty : r.quantity, 10);
    if (!Number.isInteger(quantity) || quantity < 1 || quantity > 100) {
      errors.push(`Quantity for ${name} must be between 1 and 100.`);
      return;
    }
    const photo = typeof r.photo === "string" && product.photos.includes(r.photo) ? r.photo : "";
    items.push({ item: name, size, quantity, colors: clean(r.colors, 200), photo, unit_price: unit, line_total: unit * quantity });
  });

  return { items, errors, subtotal: items.reduce((s, i) => s + i.line_total, 0) };
}

// Lines of an order. Old orders (one single item) are converted so everything looks the same.
function orderLines(o) {
  if (Array.isArray(o.items) && o.items.length) return o.items;
  return [
    {
      item: o.item,
      size: o.size || "",
      quantity: o.quantity,
      colors: o.colors || "",
      photo: o.photo || "",
      unit_price: o.unit_price || null,
      line_total: o.unit_price ? o.unit_price * o.quantity : null,
    },
  ];
}

function estimateOf(o) {
  if (o.total != null) return o.total;
  const lines = orderLines(o);
  if (lines.some((l) => l.line_total == null)) return null;
  return lines.reduce((s, l) => s + l.line_total, 0) + (o.delivery_fee || 0);
}

// ---------- Security: link in the owner email ----------
const sign = (id) =>
  crypto.createHmac("sha256", process.env.CONFIRM_SECRET || "").update(String(id)).digest("hex").slice(0, 32);

function validToken(id, token) {
  if (!process.env.CONFIRM_SECRET || typeof token !== "string") return false;
  const a = Buffer.from(sign(id));
  const b = Buffer.from(token);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

// ---------- Email ----------
function mailer() {
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: { user: process.env.GMAIL_USER, pass: process.env.GMAIL_APP_PASSWORD },
  });
  return {
    transporter,
    from: `"Crochet Handcrafted Shop" <${process.env.GMAIL_USER}>`,
    owner: process.env.OWNER_EMAIL || process.env.GMAIL_USER,
  };
}

const siteUrl = () => (process.env.SITE_URL || "").replace(/\/$/, "");

function waButton(ref) {
  const number = (process.env.WHATSAPP_NUMBER || "256791908861").replace(/\D/g, "");
  const text = encodeURIComponent("Hello, I'm writing about my order " + ref);
  return `<p style="margin:18px 0"><a href="https://wa.me/${number}?text=${text}" style="background:#25D366;color:#fff;padding:10px 18px;border-radius:8px;text-decoration:none;font-weight:bold">Chat with me on WhatsApp</a></p>`;
}

const TD = 'style="padding:6px 8px;border-bottom:1px solid #f0d5dd;vertical-align:top"';

function itemsTable(order) {
  const lines = orderLines(order);
  const rows = lines
    .map(
      (l) => `<tr>
      <td ${TD}>${esc(l.item)}${l.size ? " (" + esc(l.size) + ")" : ""}${l.colors ? `<br><span style="color:#7a6a6e;font-size:13px">Colors: ${esc(l.colors)}</span>` : ""}</td>
      <td ${TD}>${esc(l.quantity)}</td>
      <td ${TD} align="right">${l.line_total != null ? esc(money(l.line_total)) : "to be quoted"}</td></tr>`
    )
    .join("");
  const fee = order.delivery_fee || 0;
  const estimate = estimateOf(order);
  return `<table style="border-collapse:collapse;font-size:15px;width:100%;max-width:520px">
    <tr><th align="left" ${TD}>Item</th><th align="left" ${TD}>Qty</th><th align="right" ${TD}>Price</th></tr>
    ${rows}
    <tr><td ${TD} colspan="2">Delivery (${esc(order.delivery || "-")})</td><td ${TD} align="right">${esc(money(fee))}</td></tr>
    <tr><td ${TD} colspan="2"><strong>Estimated total</strong></td><td ${TD} align="right"><strong>${estimate != null ? esc(money(estimate)) : "to be confirmed"}</strong></td></tr>
  </table>
  ${order.address ? `<p style="margin:10px 0"><strong>Delivery address:</strong> ${esc(order.address)}</p>` : ""}
  ${order.notes ? `<p style="margin:10px 0"><strong>Notes:</strong> ${esc(order.notes)}</p>` : ""}`;
}

const WRAP = (inner) => `<div style="font-family:Arial,sans-serif;color:#3a2f33;max-width:560px">${inner}</div>`;

// Owner confirms the order and asks for the 50% deposit
async function doConfirm(sql, order, total) {
  const instructions = (process.env.PAYMENT_INSTRUCTIONS || "").trim();
  if (!instructions) throw userError("Add the variable PAYMENT_INSTRUCTIONS in Vercel (your mobile money number and name), then redeploy.");
  const deposit = Math.ceil(total / 2);
  const ref = refOf(order.id);
  const { transporter, from, owner } = mailer();
  try {
    await transporter.sendMail({
      from,
      to: order.email,
      bcc: owner,
      replyTo: owner,
      subject: `Order ${ref} confirmed: please send your 50% deposit`,
      html: WRAP(`
        <h2 style="color:#c9607f">Your order ${esc(ref)} is confirmed</h2>
        <p>Hello ${esc(order.name)}, thank you for your order. To start working on it, I ask for a 50% deposit.</p>
        ${itemsTable(order)}
        <table style="border-collapse:collapse;font-size:15px;margin-top:12px">
          <tr><td style="padding:6px 12px 6px 0"><strong>Total price</strong></td><td>${esc(money(total))}</td></tr>
          <tr><td style="padding:6px 12px 6px 0"><strong>Deposit to pay now (50%)</strong></td><td><strong>${esc(money(deposit))}</strong></td></tr>
          <tr><td style="padding:6px 12px 6px 0"><strong>Remaining balance</strong></td><td>${esc(money(total - deposit))}</td></tr>
        </table>
        <h3>How to pay the deposit</h3>
        <p style="background:#fff7f2;padding:12px;border-radius:8px">${esc(instructions).replace(/\r?\n/g, "<br>")}</p>
        <p>Please write <strong>${esc(ref)}</strong> as the payment reference. After paying, reply to this email with the transaction ID or a screenshot. I start your order as soon as I receive the deposit.</p>
        <p>A question? Write to me on WhatsApp:</p>
        ${waButton(ref)}
        <p>Crochet Handcrafted Shop</p>`),
    });
  } catch (err) {
    console.error("Email error:", err);
    throw userError("The email could not be sent. Nothing was changed, please try again.");
  }
  await sql`UPDATE orders SET status = 'confirmed', total = ${total}, deposit = ${deposit}, confirmed_at = now() WHERE id = ${order.id}`;
  return { deposit, balance: total - deposit };
}

// Owner received the deposit
async function doDeposit(sql, order) {
  const ref = refOf(order.id);
  const { transporter, from, owner } = mailer();
  try {
    await transporter.sendMail({
      from,
      to: order.email,
      bcc: owner,
      replyTo: owner,
      subject: `Deposit received for order ${ref}: I am starting your order`,
      html: WRAP(`
        <h2 style="color:#c9607f">Thank you, ${esc(order.name)}!</h2>
        <p>I received your deposit of <strong>${esc(money(order.deposit || 0))}</strong> for order <strong>${esc(ref)}</strong>.</p>
        <p>I am starting your order now. The remaining balance is <strong>${esc(money((order.total || 0) - (order.deposit || 0)))}</strong>. I will contact you as soon as it is ready.</p>
        <p>If you have any question, reply to this email or write to me on WhatsApp:</p>
        ${waButton(ref)}
        <p>Crochet Handcrafted Shop</p>`),
    });
  } catch (err) {
    console.error("Email error:", err);
    throw userError("The email could not be sent. Nothing was changed, please try again.");
  }
  await sql`UPDATE orders SET status = 'paid', paid_at = now() WHERE id = ${order.id}`;
}

module.exports = {
  PRODUCTS, DELIVERY_FEES, has, esc, clean, money, refOf, userError, db, ensureSchema,
  priceItems, orderLines, estimateOf, sign, validToken, mailer, siteUrl, waButton,
  itemsTable, WRAP, doConfirm, doDeposit,
};
