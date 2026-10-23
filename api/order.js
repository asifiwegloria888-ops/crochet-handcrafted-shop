// POST /api/order  -  one order with one or several items (the cart).
// 1) checks everything  2) computes the prices itself  3) saves in the database  4) emails customer and owner

const L = require("./_lib");

module.exports = async (req, res) => {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  const body = req.body && typeof req.body === "object" ? req.body : {};

  // Honeypot: real people never fill this hidden field, bots do.
  if (body.website) return res.status(200).json({ ok: true });

  const customer = {
    name: L.clean(body.name, 100),
    email: L.clean(body.email, 150),
    phone: L.clean(body.phone, 30),
    address: L.clean(body.address, 300),
    delivery: L.clean(body.delivery, 50),
    notes: L.clean(body.notes, 1500),
  };
  const priced = L.priceItems(body.items);

  const errors = [...priced.errors];
  if (customer.name.length < 2) errors.push("Please enter your name.");
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customer.email)) errors.push("Please enter a valid email address.");
  if (customer.address.length < 5) errors.push("Please enter your delivery address.");
  if (!L.has(L.DELIVERY_FEES, customer.delivery)) errors.push("Please choose a delivery option.");
  if (errors.length) return res.status(400).json({ error: errors.join(" ") });

  const fee = L.DELIVERY_FEES[customer.delivery];
  const total = priced.subtotal + fee;
  const items = priced.items;
  const summary = items.map((i) => `${i.item}${i.size ? " (" + i.size + ")" : ""} x${i.quantity}`).join(", ").slice(0, 400);
  const quantity = items.reduce((s, i) => s + i.quantity, 0);
  const firstPhoto = (items.find((i) => i.photo) || {}).photo || "";

  // ---- 1. Save ----
  let order;
  try {
    const sql = L.db();
    await L.ensureSchema(sql);
    const rows = await sql`
      INSERT INTO orders (name, email, phone, item, colors, size, quantity, notes, photo, address, delivery, delivery_fee, items, total)
      VALUES (${customer.name}, ${customer.email}, ${customer.phone}, ${summary}, ${""}, ${""}, ${quantity},
              ${customer.notes}, ${firstPhoto}, ${customer.address}, ${customer.delivery}, ${fee},
              ${JSON.stringify(items)}::jsonb, ${total})
      RETURNING id`;
    order = { id: rows[0].id, ...customer, items, delivery_fee: fee, total, status: "new" };
  } catch (err) {
    console.error("Database error:", err);
    return res.status(500).json({ error: "Sorry, we could not save your order. Please try again." });
  }
  const reference = L.refOf(order.id);

  // ---- 2. Emails (the order is already saved, so an email problem never loses it) ----
  let customerEmailSent = false;
  try {
    const { transporter, from, owner } = L.mailer();
    const site = L.siteUrl();

    try {
      await transporter.sendMail({
        from,
        to: order.email,
        replyTo: owner,
        subject: `We received your order ${reference}`,
        html: L.WRAP(`
          <h2 style="color:#c9607f">Thank you, ${L.esc(order.name)}!</h2>
          <p>We have received your order <strong>${reference}</strong>. I will contact you soon to confirm the details and the price. To start your order, a 50% deposit is requested once the price is confirmed.</p>
          ${L.itemsTable(order)}
          <p style="margin-top:20px">You can reply directly to this email, or write to me on WhatsApp:</p>
          ${L.waButton(reference)}
          <p>Crochet Handcrafted Shop</p>`),
      });
      customerEmailSent = true;
    } catch (err) {
      console.error("EMAIL TO CUSTOMER FAILED:", err);
    }

    try {
      const photos = items.filter((i) => i.photo);
      const photoLinks = photos.length
        ? `<p style="margin-top:12px"><strong>Photos chosen:</strong><br>${photos
            .map((i) => (site ? `<a href="${L.esc(site)}/${i.photo}.jpeg">${L.esc(i.item)}: ${i.photo}.jpeg</a>` : `${L.esc(i.item)}: ${i.photo}.jpeg`))
            .join("<br>")}</p>`
        : "";
      const buttons =
        site && process.env.CONFIRM_SECRET
          ? `<p style="margin:18px 0"><a href="${site}/api/confirm?id=${order.id}&t=${L.sign(order.id)}" style="background:#c9607f;color:#fff;padding:12px 20px;border-radius:8px;text-decoration:none;font-weight:bold">Open order: confirm and manage the 50% deposit</a></p>
             <p style="margin:6px 0">Or manage all orders in your <a href="${site}/admin.html">admin page</a>.</p>`
          : "";
      await transporter.sendMail({
        from,
        to: owner,
        replyTo: order.email,
        subject: `New order ${reference} from ${order.name}`,
        html: L.WRAP(`
          <h2 style="color:#9e1b2e">New order ${reference}</h2>
          ${customerEmailSent ? "" : '<p style="background:#fde4e4;color:#9b1c1c;padding:10px;border-radius:8px"><strong>The confirmation email to the customer could not be sent.</strong> Please contact them yourself.</p>'}
          <p><strong>${L.esc(order.name)}</strong><br>${L.esc(order.email)}${order.phone ? "<br>" + L.esc(order.phone) : ""}</p>
          ${L.itemsTable(order)}
          ${photoLinks}
          ${buttons}
          <p style="margin-top:20px">Or reply to this email to answer the customer directly.</p>`),
      });
    } catch (err) {
      console.error("EMAIL TO OWNER FAILED:", err);
    }
  } catch (err) {
    console.error("Email setup error:", err);
  }

  return res.status(200).json({ ok: true, reference, emailSent: customerEmailSent });
};
