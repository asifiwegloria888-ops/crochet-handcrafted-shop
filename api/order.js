// Vercel serverless function: POST /api/order
// 1) validates the order  2) saves it in Postgres (Neon)  3) emails the customer and the shop owner

const { neon } = require("@neondatabase/serverless");
const nodemailer = require("nodemailer");
const crypto = require("crypto");

// Prices in UGX. The server decides the price, never the browser.
// Items without a price are quoted by the shop owner.
// Items with sizes: price depends on the size chosen
const SIZE_PRICES = {
  "Crop top": { "Small": 25000, "Medium": 28000, "Large": 32000, "XL": 36000 },
  "Ruffle crochet hat": { "Child": 15000, "Adult": 20000 },
  "Sweater": { "Small": 50000, "Medium": 60000, "Large": 80000, "XL": 90000 },
  "Dress": { "Small": 50000, "Medium": 60000, "Large": 80000, "XL": 100000 },
  "Small bag": { "Small": 15000, "Big": 25000 },
  "Crochet flower": { "Small": 50000, "Big": 80000 },
};

// Items with one single price
const PRICES = {
  "Scrunchies": 5000,
  "Hair scrunchie": 5000,
};

const DELIVERY_FEES = { "Pickup": 0, "Kampala": 5000,"Mukono": 5000, "Outside Kampala": 10000 };

// Items with fixed sizes but no fixed price (you quote the price yourself)
const SIZES_ONLY = {
  "Skirt": ["Small", "Medium", "Large", "XL"],
};

const has = (obj, key) => Object.prototype.hasOwnProperty.call(obj, key);

function unitPriceFor(item, size) {
  if (has(SIZE_PRICES, item)) return has(SIZE_PRICES[item], size) ? SIZE_PRICES[item][size] : null;
  return has(PRICES, item) ? PRICES[item] : null;
}

function sizesFor(item) {
  if (has(SIZE_PRICES, item)) return Object.keys(SIZE_PRICES[item]);
  return has(SIZES_ONLY, item) ? SIZES_ONLY[item] : null;
}


const esc = (s) =>
  String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

// Secret link used by the owner to confirm an order (see api/confirm.js)
const sign = (id) =>
  crypto.createHmac("sha256", process.env.CONFIRM_SECRET || "").update(String(id)).digest("hex").slice(0, 32);

const clean = (v, max) => (typeof v === "string" ? v.trim().slice(0, max) : "");

const money = (n) => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, " ") + " UGX";

function validate(body) {
  const order = {
    name: clean(body.name, 100),
    email: clean(body.email, 150),
    phone: clean(body.phone, 30),
    item: clean(body.item, 50),
    colors: clean(body.colors, 200),
    size: clean(body.size, 100),
    quantity: parseInt(body.quantity, 10),
    notes: clean(body.notes, 1500),
    photo: /^\d{1,3}$/.test(clean(body.photo, 3)) ? clean(body.photo, 3) : "",
    address: clean(body.address, 300),
    delivery: clean(body.delivery, 50),
  };

  const errors = [];
  if (order.name.length < 2) errors.push("Please enter your name.");
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(order.email)) errors.push("Please enter a valid email address.");
  if (!order.item) errors.push("Please choose an item.");
  if (!Number.isInteger(order.quantity) || order.quantity < 1 || order.quantity > 100)
    errors.push("Quantity must be between 1 and 100.");
  if (order.address.length < 5) errors.push("Please enter your delivery address.");
  order.unitPrice = unitPriceFor(order.item, order.size);
  const allowedSizes = sizesFor(order.item);
  if (allowedSizes && !allowedSizes.includes(order.size)) errors.push("Please choose a size.");

  if (!has(DELIVERY_FEES, order.delivery)) errors.push("Please choose a delivery option.");
  order.deliveryFee = DELIVERY_FEES[order.delivery] || 0;
  order.total = order.unitPrice ? order.unitPrice * order.quantity + order.deliveryFee : null;

  return { order, errors };
}

function row(label, value) {
  return `<tr><td style="padding:6px 12px 6px 0;color:#4F5480;vertical-align:top"><strong>${label}</strong></td><td style="padding:6px 0">${esc(value || "-")}</td></tr>`;
}

function detailsTable(o) {
  const price = o.unitPrice
    ? `${money(o.unitPrice)} each, estimated total with delivery ${money(o.total)} (to be confirmed)`
    : "To be confirmed";
  return `<table style="border-collapse:collapse;font-size:15px">
    ${row("Item", o.item)}
    ${row("Quantity", String(o.quantity))}
    ${row("Price", price)}
    ${row("Colors", o.colors)}
    ${row("Size", o.size)}
    ${row("Notes", o.notes)}
    ${row("Delivery address", o.address)}
    ${row("Delivery", o.delivery + " (" + money(o.deliveryFee) + ")")}
  </table>`;
}

module.exports = async (req, res) => {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  const body = req.body && typeof req.body === "object" ? req.body : {};

  // Honeypot: real people never fill this hidden field, bots do.
  if (body.website) return res.status(200).json({ ok: true });

  const { order, errors } = validate(body);
  if (errors.length) return res.status(400).json({ error: errors.join(" ") });

  // ---- 1. Save in the database ----
  let id;
  try {
    const sql = neon(process.env.POSTGRES_URL);
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
    const rows = await sql`
      INSERT INTO orders (name, email, phone, item, colors, size, quantity, notes, photo, unit_price,address,delivery, delivery_fee)
      VALUES (${order.name}, ${order.email}, ${order.phone}, ${order.item}, ${order.colors},
              ${order.size}, ${order.quantity}, ${order.notes}, ${order.photo}, ${order.unitPrice},${order.address},${order.delivery}, ${order.deliveryFee})
      RETURNING id`;
    id = rows[0].id;
  } catch (err) {
    console.error("Database error:", err);
    return res.status(500).json({ error: "Sorry, we could not save your order. Please try again." });
  }

  const reference = "CH-" + String(id).padStart(4, "0");

  // ---- 2. Send the emails (the order is already saved, so an email problem never loses it) ----
  try {
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: { user: process.env.GMAIL_USER, pass: process.env.GMAIL_APP_PASSWORD },
    });
    const from = `"Crochet Handcrafted Shop" <${process.env.GMAIL_USER}>`;
    const owner = process.env.OWNER_EMAIL || process.env.GMAIL_USER;
    const siteUrl = (process.env.SITE_URL || "").replace(/\/$/, "");
    const photoLink =
      order.photo && siteUrl
        ? `<p style="margin-top:12px">Photo chosen by the customer: <a href="${esc(siteUrl)}/${order.photo}.jpeg">${esc(siteUrl)}/${order.photo}.jpeg</a></p>`
        : order.photo
        ? `<p style="margin-top:12px">Photo chosen by the customer: <strong>${order.photo}.jpeg</strong></p>`
        : "";

    const confirmButton =
      siteUrl && process.env.CONFIRM_SECRET
        ? `<p style="margin:18px 0"><a href="${siteUrl}/api/confirm?id=${id}&t=${sign(id)}" style="background:#c9607f;color:#fff;padding:12px 20px;border-radius:8px;text-decoration:none;font-weight:bold">Confirm order and ask 50% deposit</a></p>`
        : "";

    const results = await Promise.allSettled([
      // to the customer
      transporter.sendMail({
        from,
        to: order.email,
        replyTo: owner,
        subject: `We received your order ${reference}`,
        html: `<div style="font-family:Arial,sans-serif;color:#1B2150;max-width:560px">
          <h2 style="color:#2A3584">Thank you, ${esc(order.name)}!</h2>
          <p>We have received your order <strong>${reference}</strong>. I will contact you soon to confirm the details and the price. To start your order, a 50% deposit is requested once the price is confirmed.</p>
          ${detailsTable(order)}
          <p style="margin-top:20px">You can reply directly to this email if you want to change anything.</p>
          <p>Crochet Handcrafted Shop</p>
        </div>`,
      }),
      // to the shop owner
      transporter.sendMail({
        from,
        to: owner,
        replyTo: order.email,
        subject: `New order ${reference} from ${order.name}`,
        html: `<div style="font-family:Arial,sans-serif;color:#1B2150;max-width:560px">
          <h2 style="color:#C4263B">New order ${reference}</h2>
          <table style="border-collapse:collapse;font-size:15px">
            ${row("Name", order.name)}
            ${row("Email", order.email)}
            ${row("Phone", order.phone)}
          </table>
          <hr style="border:none;border-top:1px solid #DEE4F8;margin:12px 0">
          ${detailsTable(order)}
          ${photoLink}
          ${confirmButton}
          <p style="margin-top:20px">Or reply to this email to answer the customer directly.</p>
        </div>`,
      }),
    ]);
    results.forEach((r, i) => {
      if (r.status === "rejected") console.error(`Email ${i === 0 ? "customer" : "owner"} failed:`, r.reason);
    });
  } catch (err) {
    console.error("Email setup error:", err);
  }

  return res.status(200).json({ ok: true, reference });
};
