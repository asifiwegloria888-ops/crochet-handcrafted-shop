// Shared helpers for the API (the "_" in the name means Vercel does NOT publish it as a page).
// Prices come from js/products.js, the same file the website uses.

const { neon } = require("@neondatabase/serverless");
const nodemailer = require("nodemailer");
const crypto = require("crypto");
const LANG_FR = require("../js/lang-fr.js");
const tr = (lang, s) => (lang === "fr" ? LANG_FR.translate(s) : s);   // translate a text for a French customer
const base = require("../js/products.js");
const catalog = require("../js/catalog.js")(base); // fills in titles, colors, preparation days (see js/catalog.js)
const { PRODUCTS, DELIVERY_FEES } = base;
const { leadDaysFor, labelOf } = catalog;

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
  await sql`ALTER TABLE orders ADD COLUMN IF NOT EXISTS ready_date TEXT`;
  await sql`ALTER TABLE orders ADD COLUMN IF NOT EXISTS lang TEXT`;
  schemaReady = true;
}

// Tables for visits, likes and comments (created automatically the first time they are needed)
let socialReady = false;
async function ensureSocialSchema(sql) {
  if (socialReady) return;
  await sql`CREATE TABLE IF NOT EXISTS visits (
    id SERIAL PRIMARY KEY,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    vid TEXT NOT NULL,
    path TEXT NOT NULL,
    device TEXT,
    country TEXT,
    ref TEXT
  )`;
  await sql`CREATE INDEX IF NOT EXISTS visits_created_idx ON visits (created_at)`;
  await sql`CREATE TABLE IF NOT EXISTS live (
    vid TEXT PRIMARY KEY,
    path TEXT,
    last_seen TIMESTAMPTZ NOT NULL DEFAULT now()
  )`;
  await sql`CREATE TABLE IF NOT EXISTS likes (
    item TEXT NOT NULL,
    vid TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    PRIMARY KEY (item, vid)
  )`;
  await sql`CREATE TABLE IF NOT EXISTS comments (
    id SERIAL PRIMARY KEY,
    item TEXT NOT NULL,
    vid TEXT,
    name TEXT NOT NULL,
    body TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
  )`;
  await sql`CREATE TABLE IF NOT EXISTS downloads (
    id SERIAL PRIMARY KEY,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    vid TEXT NOT NULL,
    item TEXT NOT NULL,
    photo TEXT,
    device TEXT,
    country TEXT
  )`;
  socialReady = true;
}

const validVid = (v) => (typeof v === "string" && /^[A-Za-z0-9-]{8,64}$/.test(v) ? v : null);

// Visitor statistics, computed here from simple rows (days are Kampala days).
function buildStats(visits, live, nowMs) {
  const eat = (d) => new Date(new Date(d).getTime() + 3 * 3600 * 1000).toISOString().slice(0, 10);
  const today = eat(nowMs);
  const days = [];
  for (let i = 6; i >= 0; i--) days.push(addDays(today, -i));
  const perDay = {};
  days.forEach((d) => (perDay[d] = { views: 0, vids: new Set() }));
  const count = (map, key) => (map[key] = (map[key] || 0) + 1);
  const top = (map, n) => Object.entries(map).sort((a, b) => b[1] - a[1]).slice(0, n);
  const pages = {}, items = {}, countries = {}, sources = {};
  const devices = { phone: 0, computer: 0 };
  const week = new Set();
  let weekViews = 0;

  visits.forEach((v) => {
    const slot = perDay[eat(v.created_at)];
    if (!slot) return;
    slot.views++;
    slot.vids.add(v.vid);
    week.add(v.vid);
    weekViews++;
    count(pages, String(v.path).split("?")[0]);
    const m = /[?]item=([^&]+)/.exec(v.path);
    if (m) {
      try { count(items, decodeURIComponent(m[1])); } catch (e) {}
    }
    devices[v.device === "phone" ? "phone" : "computer"]++;
    if (v.country) count(countries, v.country);
    if (v.ref) count(sources, v.ref);
  });

  const liveByPath = {};
  live.forEach((r) => count(liveByPath, r.path || "/"));

  return {
    online: {
      count: live.length,
      pages: top(liveByPath, 6).map(([path, n]) => {
        const m = /[?]item=([^&]+)/.exec(path);
        let label = "";
        try { if (m) label = "Article: " + labelOf(decodeURIComponent(m[1])); } catch (e) {}
        return { path, n, label };
      }),
    },
    today: { visitors: perDay[today].vids.size, views: perDay[today].views },
    week: { visitors: week.size, views: weekViews },
    days: days.map((d) => ({ day: d, visitors: perDay[d].vids.size, views: perDay[d].views })),
    pages: top(pages, 8).map(([path, views]) => ({ path, views })),
    items: top(items, 8).map(([item, views]) => ({ item: labelOf(item), views })),
    devices,
    countries: top(countries, 5).map(([country, n]) => ({ country, n })),
    sources: top(sources, 5).map(([ref, n]) => ({ ref, n })),
  };
}

// Photo downloads (only the "Download" button can be counted; a long-press "save image" cannot be detected)
function buildDownloads(rows, nowMs) {
  const eat = (d) => new Date(new Date(d).getTime() + 3 * 3600 * 1000).toISOString().slice(0, 10);
  const today = eat(nowMs);
  const weekStart = addDays(today, -6);
  const byItem = {};
  let todayCount = 0, weekCount = 0;
  rows.forEach((r) => {
    const day = eat(r.created_at);
    if (day === today) todayCount++;
    if (day >= weekStart) {
      weekCount++;
      byItem[r.item] = (byItem[r.item] || 0) + 1;
    }
  });
  return {
    today: todayCount,
    week: weekCount,
    items: Object.entries(byItem).sort((a, b) => b[1] - a[1]).slice(0, 6).map(([item, n]) => ({ item: labelOf(item), n })),
    recent: rows.slice(0, 10).map((r) => ({ at: r.created_at, item: labelOf(r.item), photo: r.photo || "", country: r.country || "", device: r.device || "" })),
  };
}

// ---------- Ready date ----------
// Dates are "YYYY-MM-DD" text. "Today" is Kampala time (UTC+3).
const todayEAT = () => new Date(Date.now() + 3 * 3600 * 1000).toISOString().slice(0, 10);
const addDays = (iso, n) => {
  const d = new Date(iso + "T00:00:00Z");
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
};
const isDate = (s) => /^\d{4}-\d{2}-\d{2}$/.test(s) && new Date(s + "T00:00:00Z").toISOString().slice(0, 10) === s;
const formatDate = (iso, lang) =>
  new Date(iso + "T00:00:00Z").toLocaleDateString(lang === "fr" ? "fr-FR" : "en-GB", { weekday: "short", day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });

function checkReadyDate(value, items) {
  const lead = leadDaysFor(items.map((i) => i.item));
  const min = addDays(todayEAT(), lead);
  if (!isDate(value)) return { error: "Please choose the date you want your order to be ready.", lead, min };
  if (value < min) return { error: `Your items need ${lead} days to be made. Please choose ${formatDate(min)} or a later date.`, lead, min };
  if (value > addDays(todayEAT(), 365)) return { error: "Please choose a date within the next year.", lead, min };
  return { ok: true, lead, min };
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
    const colors = clean(r.colors, 200);
    if (product.colors && product.colors.length && !colors) {
      errors.push(`Please choose a color for ${name}.`);
      return;
    }
    const photo = typeof r.photo === "string" && product.photos.includes(r.photo) ? r.photo : "";
    items.push({ item: name, label: labelOf(name), size, quantity, colors, photo, unit_price: unit, line_total: unit * quantity });
  });

  return { items, errors, subtotal: items.reduce((s, i) => s + i.line_total, 0) };
}

// Lines of an order. Old orders (one single item) are converted so everything looks the same.
function orderLines(o) {
  if (Array.isArray(o.items) && o.items.length) return o.items;
  return [
    {
      item: o.item,
      label: labelOf(o.item),
      size: o.size || "",
      quantity: o.quantity,
      colors: o.colors || "",
      photo: o.photo || "",
      unit_price: o.unit_price || null,
      line_total: o.unit_price ? o.unit_price * o.quantity : null,
    },
  ];
}

// A delivery with no fixed fee ("Other area"): the owner quotes it when confirming.
const needsQuote = (o) => !!o.delivery && o.delivery_fee == null;

function estimateOf(o) {
  if (needsQuote(o)) return null;
  if (o.total != null) return o.total;
  const lines = orderLines(o);
  if (lines.some((l) => l.line_total == null)) return null;
  return lines.reduce((s, l) => s + l.line_total, 0) + (o.delivery_fee || 0);
}

// What the owner types when confirming: the exact delivery fee (delivery orders) or the total (other orders).
function resolveConfirm(order, body) {
  const lines = orderLines(order);
  const itemsSum = lines.every((l) => l.line_total != null) ? lines.reduce((s, l) => s + l.line_total, 0) : null;
  const intIn = (v, min, max) => {
    const n = parseInt(v, 10);
    return Number.isInteger(n) && n >= min && n <= max ? n : null;
  };
  if (needsQuote(order) && itemsSum != null) {
    const fee = intIn(body.delivery_fee, 0, 10000000);
    if (fee === null) throw userError("Please enter the delivery fee (0 if it is free).");
    return { fee, total: itemsSum + fee };
  }
  const total = intIn(body.total, 1, 100000000);
  if (total === null) throw userError("Please enter a valid total price.");
  return { fee: order.delivery_fee != null ? order.delivery_fee : 0, total };
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

function waButton(ref, lang) {
  const fr = lang === "fr";
  const number = (process.env.WHATSAPP_NUMBER || "243978253950").replace(/\D/g, "");
  const text = encodeURIComponent((fr ? "Bonjour, je vous écris au sujet de ma commande " : "Hello, I'm writing about my order ") + ref);
  return `<p style="margin:18px 0"><a href="https://wa.me/${number}?text=${text}" style="display:inline-block;background:#25D366;color:#ffffff;padding:12px 22px;border-radius:8px;text-decoration:none;font-weight:bold;font-size:16px;line-height:20px">${fr ? "Écrivez-moi sur WhatsApp" : "WhatsApp me"}</a></p>`;
}

const TD = 'style="padding:6px 8px;border-bottom:1px solid #f0d5dd;vertical-align:top"';

// Words used in the order table, in English and in French (for the customer)
const LBL = {
  en: { item: "Item", qty: "Qty", price: "Price", colors: "Colors:", toQuote: "to be quoted", included: "included in the total", itemsQuote: "Items (delivery price to be quoted)",
        plusDelivery: " + delivery", toConfirm: "to be confirmed", totalPrice: "Total price", estTotal: "Estimated total", address: "Delivery address:",
        ready: "Wanted ready by:", notes: "Notes:", pickup: "Pick up", deliveryTo: "Delivery to the address below" },
  fr: { item: "Article", qty: "Qté", price: "Prix", colors: "Couleurs :", toQuote: "à confirmer", included: "incluse dans le total", itemsQuote: "Articles (prix de livraison à confirmer)",
        plusDelivery: " + livraison", toConfirm: "à confirmer", totalPrice: "Prix total", estTotal: "Total estimé", address: "Adresse de livraison :",
        ready: "Date souhaitée :", notes: "Notes :", pickup: "Retrait sur place", deliveryTo: "Livraison à l'adresse ci-dessous" },
};

const deliveryLabel = (d, lang) => {
  const w = LBL[lang === "fr" ? "fr" : "en"];
  return d === "Pickup" ? w.pickup : d === "Delivery" ? w.deliveryTo : d ? "Delivery (" + d + ")" : "-";
};

// publicNames = true for emails to the CUSTOMER ("Dress"); false for you and the admin ("Dress #34")
// lang = "fr" writes the table in French
function itemsTable(order, confirmedTotal, publicNames, lang) {
  const fr = lang === "fr";
  const w = LBL[fr ? "fr" : "en"];
  const lines = orderLines(order);
  const rows = lines
    .map((l) => {
      const name = publicNames ? String(l.label || l.item).replace(/ #\d+$/, "") : l.label || l.item;
      return `<tr>
      <td ${TD}>${esc(tr(lang, name))}${l.size ? " (" + esc(tr(lang, l.size)) + ")" : ""}${l.colors ? `<br><span style="color:#7a6a6e;font-size:13px">${w.colors} ${esc(tr(lang, l.colors))}</span>` : ""}</td>
      <td ${TD}>${esc(l.quantity)}</td>
      <td ${TD} align="right">${l.line_total != null ? esc(money(l.line_total)) : w.toQuote}</td></tr>`;
    })
    .join("");
  const quote = needsQuote(order);
  const priced = lines.every((l) => l.line_total != null);
  const itemsSum = priced ? lines.reduce((s, l) => s + l.line_total, 0) : null;
  const estimate = estimateOf(order);

  let deliveryCell, totalLabel, totalCell;
  if (confirmedTotal != null) {
    deliveryCell = quote ? w.included : esc(money(order.delivery_fee || 0));
    totalLabel = w.totalPrice;
    totalCell = esc(money(confirmedTotal));
  } else if (quote) {
    deliveryCell = w.toQuote;
    totalLabel = w.itemsQuote;
    totalCell = itemsSum != null ? esc(money(itemsSum)) + w.plusDelivery : w.toConfirm;
  } else {
    deliveryCell = esc(money(order.delivery_fee || 0));
    totalLabel = w.estTotal;
    totalCell = estimate != null ? esc(money(estimate)) : w.toConfirm;
  }

  return `<table style="border-collapse:collapse;font-size:15px;width:100%;max-width:520px">
    <tr><th align="left" ${TD}>${w.item}</th><th align="left" ${TD}>${w.qty}</th><th align="right" ${TD}>${w.price}</th></tr>
    ${rows}
    <tr><td ${TD} colspan="2">${esc(deliveryLabel(order.delivery, lang))}</td><td ${TD} align="right">${deliveryCell}</td></tr>
    <tr><td ${TD} colspan="2"><strong>${totalLabel}</strong></td><td ${TD} align="right"><strong>${totalCell}</strong></td></tr>
  </table>
  ${order.address ? `<p style="margin:10px 0"><strong>${w.address}</strong> ${esc(order.address)}</p>` : ""}
  ${order.ready_date ? `<p style="margin:10px 0"><strong>${w.ready}</strong> ${esc(formatDate(order.ready_date, lang))}</p>` : ""}
  ${order.notes ? `<p style="margin:10px 0"><strong>${w.notes}</strong> ${esc(order.notes)}</p>` : ""}`;
}

const WRAP = (inner) => `<div style="font-family:Arial,sans-serif;color:#3a2f33;max-width:560px">${inner}</div>`;

// The emails the CUSTOMER receives, in English or French (the language the customer used on the site)
const MAIL = {
  en: {
    received: (name, ref) => ({
      subject: `We received your order ${ref}`,
      intro: `<h2 style="color:#c9607f">Thank you, ${esc(name)}!</h2>
          <p>We have received your order <strong>${ref}</strong>. I will contact you soon to confirm the details and the price. To start your order, a 50% deposit is requested once the price is confirmed.</p>`,
      outro: `<p style="margin-top:20px">You can reply directly to this email, or write to me on WhatsApp:</p>`,
    }),
    confirmed: (name, ref, deposit, balance, instructions) => ({
      subject: `Order ${ref} confirmed: please send your 50% deposit`,
      head: `<h2 style="color:#c9607f">Your order ${esc(ref)} is confirmed</h2>
        <p>Hello ${esc(name)}, thank you for your order. To start working on it, I ask for a 50% deposit.</p>`,
      rows: `<tr><td style="padding:6px 12px 6px 0"><strong>Deposit to pay now (50%)</strong></td><td><strong>${esc(money(deposit))}</strong></td></tr>
          <tr><td style="padding:6px 12px 6px 0"><strong>Remaining balance</strong></td><td>${esc(money(balance))}</td></tr>`,
      how: `<h3>How to pay the deposit</h3>`,
      after: `<p>Please write <strong>${esc(ref)}</strong> as the payment reference. After paying, reply to this email with the transaction ID or a screenshot. I start your order as soon as I receive the deposit.</p>
        <p>A question? Write to me on WhatsApp:</p>`,
    }),
    deposit: (name, ref, deposit, balance) => ({
      subject: `Deposit received for order ${ref}: I am starting your order`,
      body: `<h2 style="color:#c9607f">Thank you, ${esc(name)}!</h2>
        <p>I received your deposit of <strong>${esc(money(deposit))}</strong> for order <strong>${esc(ref)}</strong>.</p>
        <p>I am starting your order now. The remaining balance is <strong>${esc(money(balance))}</strong>. I will contact you as soon as it is ready.</p>
        <p>If you have any question, reply to this email or write to me on WhatsApp:</p>`,
    }),
  },
  fr: {
    received: (name, ref) => ({
      subject: `Nous avons bien reçu votre commande ${ref}`,
      intro: `<h2 style="color:#c9607f">Merci, ${esc(name)} !</h2>
          <p>Nous avons bien reçu votre commande <strong>${ref}</strong>. Je vous contacterai bientôt pour confirmer les détails et le prix. Pour démarrer votre commande, un acompte de 50 % est demandé une fois le prix confirmé.</p>`,
      outro: `<p style="margin-top:20px">Vous pouvez répondre directement à cet email, ou m'écrire sur WhatsApp :</p>`,
    }),
    confirmed: (name, ref, deposit, balance) => ({
      subject: `Commande ${ref} confirmée : merci d'envoyer votre acompte de 50 %`,
      head: `<h2 style="color:#c9607f">Votre commande ${esc(ref)} est confirmée</h2>
        <p>Bonjour ${esc(name)}, merci pour votre commande. Pour commencer à la réaliser, je demande un acompte de 50 %.</p>`,
      rows: `<tr><td style="padding:6px 12px 6px 0"><strong>Acompte à payer maintenant (50 %)</strong></td><td><strong>${esc(money(deposit))}</strong></td></tr>
          <tr><td style="padding:6px 12px 6px 0"><strong>Reste à payer</strong></td><td>${esc(money(balance))}</td></tr>`,
      how: `<h3>Comment payer l'acompte</h3>`,
      after: `<p>Merci d'écrire <strong>${esc(ref)}</strong> comme référence du paiement. Après avoir payé, répondez à cet email avec l'identifiant de la transaction ou une capture d'écran. Je commence votre commande dès que je reçois l'acompte.</p>
        <p>Une question ? Écrivez-moi sur WhatsApp :</p>`,
    }),
    deposit: (name, ref, deposit, balance) => ({
      subject: `Acompte reçu pour la commande ${ref} : je commence votre commande`,
      body: `<h2 style="color:#c9607f">Merci, ${esc(name)} !</h2>
        <p>J'ai bien reçu votre acompte de <strong>${esc(money(deposit))}</strong> pour la commande <strong>${esc(ref)}</strong>.</p>
        <p>Je commence votre commande maintenant. Le reste à payer est de <strong>${esc(money(balance))}</strong>. Je vous contacterai dès qu'elle sera prête.</p>
        <p>Si vous avez une question, répondez à cet email ou écrivez-moi sur WhatsApp :</p>`,
    }),
  },
};
const langOf = (order) => (order && order.lang === "fr" ? "fr" : "en");

// Owner confirms the order and asks for the 50% deposit
async function doConfirm(sql, order, total, fee) {
  const instructions = (process.env.PAYMENT_INSTRUCTIONS || "").trim();
  if (!instructions) throw userError("Add the variable PAYMENT_INSTRUCTIONS in Vercel (your mobile money number and name), then redeploy.");
  const deposit = Math.ceil(total / 2);
  const ref = refOf(order.id);
  const lang = langOf(order);
  const m = MAIL[lang].confirmed(order.name, ref, deposit, total - deposit);
  const { transporter, from, owner } = mailer();
  try {
    await transporter.sendMail({
      from,
      to: order.email,
      bcc: owner,
      replyTo: owner,
      subject: m.subject,
      html: WRAP(`
        ${m.head}
        ${itemsTable({ ...order, delivery_fee: fee }, total, true, lang)}
        <table style="border-collapse:collapse;font-size:15px;margin-top:12px">
          ${m.rows}
        </table>
        ${m.how}
        <p style="background:#fff7f2;padding:12px;border-radius:8px">${esc(instructions).replace(/\r?\n/g, "<br>")}</p>
        ${m.after}
        ${waButton(ref, lang)}
        <p>Crochet Handcrafted Shop</p>`),
    });
  } catch (err) {
    console.error("Email error:", err);
    throw userError("The email could not be sent. Nothing was changed, please try again.");
  }
  await sql`UPDATE orders SET status = 'confirmed', total = ${total}, deposit = ${deposit}, delivery_fee = ${fee}, confirmed_at = now() WHERE id = ${order.id}`;
  return { deposit, balance: total - deposit };
}

// Owner received the deposit
async function doDeposit(sql, order) {
  const ref = refOf(order.id);
  const lang = langOf(order);
  const m = MAIL[lang].deposit(order.name, ref, order.deposit || 0, (order.total || 0) - (order.deposit || 0));
  const { transporter, from, owner } = mailer();
  try {
    await transporter.sendMail({
      from,
      to: order.email,
      bcc: owner,
      replyTo: owner,
      subject: m.subject,
      html: WRAP(`
        ${m.body}
        ${waButton(ref, lang)}
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
  ensureSocialSchema, validVid, buildStats, buildDownloads, labelOf, resolveProduct: catalog.resolveProduct, priceItems, orderLines, estimateOf, needsQuote, deliveryLabel, resolveConfirm, checkReadyDate, formatDate, todayEAT, addDays, sign, validToken, mailer, siteUrl, waButton,
  itemsTable, WRAP, doConfirm, doDeposit, MAIL, langOf, tr,
};
