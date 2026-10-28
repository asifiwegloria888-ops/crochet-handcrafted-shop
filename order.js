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
    ready_date: L.clean(body.ready_date, 10),
    lang: body.lang === "fr" ? "fr" : "en",
  };
  const priced = L.priceItems(body.items);

  const errors = [...priced.errors];
  if (customer.name.length < 2) errors.push("Please enter your name.");
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customer.email)) errors.push("Please enter a valid email address.");
  if (!L.has(L.DELIVERY_FEES, customer.delivery)) errors.push("Please choose a delivery option.");
  else if (L.DELIVERY_FEES[customer.delivery] === null && customer.address.length < 10)
    errors.push("Please write your full delivery address (town, area, landmark) so I can quote the delivery price.");
  if (customer.delivery === "Pickup") customer.address = "";
  if (!priced.errors.length) {
    const check = L.checkReadyDate(customer.ready_date, priced.items);
    if (check.error) errors.push(check.error);
  }
  if (errors.length) return res.status(400).json({ error: errors.join(" ") });

  const fee = L.DELIVERY_FEES[customer.delivery]; // null = price quoted by the owner
  const total = fee == null ? null : priced.subtotal + fee;
  const items = priced.items;
  const summary = items.map((i) => `${i.label}${i.size ? " (" + i.size + ")" : ""} x${i.quantity}`).join(", ").slice(0, 400);
  const quantity = items.reduce((s, i) => s + i.quantity, 0);
  const firstPhoto = (items.find((i) => i.photo) || {}).photo || "";

  // ---- 1. Save ----
  let order;
  try {
    const sql = L.db();
    await L.ensureSchema(sql);
    const rows = await sql`
      INSERT INTO orders (name, email, phone, item, colors, size, quantity, notes, photo, address, delivery, delivery_fee, items, total, ready_date, lang)
      VALUES (${customer.name}, ${customer.email}, ${customer.phone}, ${summary}, ${""}, ${""}, ${quantity},
              ${customer.notes}, ${firstPhoto}, ${customer.address}, ${customer.delivery}, ${fee},
              ${JSON.stringify(items)}::jsonb, ${total}, ${customer.ready_date}, ${customer.lang})
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

    // to the customer, in the language he used on the site
    try {
      const lang = L.langOf(order);
      const mail = L.MAIL[lang].received(order.name, reference);
      await transporter.sendMail({
        from,
        to: order.email,
        replyTo: owner,
        subject: mail.subject,
        html: L.WRAP(`
          ${mail.intro}
          ${L.itemsTable(order, undefined, true, lang)}
          ${mail.outro}
          ${L.waButton(reference, lang)}
          <p>Crochet Handcrafted Shop</p>`),
      });
      customerEmailSent = true;
    } catch (err) {
      console.error("EMAIL TO CUSTOMER FAILED:", err);
    }

    try {
      const photos = items.filter((i) => i.photo);
      // the picture the customer chose is shown inside the email, with a clickable link under it (needs SITE_URL in Vercel)
      const photoLinks = photos.length
        ? `<p style="margin:14px 0 4px"><strong>Photos chosen:</strong></p>` +
          photos
            .map((i) => {
              const caption = `${L.esc(i.label)}${i.size ? " (" + L.esc(i.size) + ")" : ""}: ${L.esc(i.photo)}.jpeg`;
              return site
                ? `<p style="margin:8px 0"><a href="${L.esc(site)}/${L.esc(i.photo)}.jpeg"><img src="${L.esc(site)}/${L.esc(i.photo)}.jpeg" alt="${L.esc(i.label)}" width="160" style="display:block;border:0;border-radius:10px;margin-bottom:4px"></a><a href="${L.esc(site)}/${L.esc(i.photo)}.jpeg" style="font-size:13px">${caption}</a></p>`
                : `<p style="margin:4px 0">${caption}</p>`;
            })
            .join("")
        : "";
      const btn = "display:inline-block;background:#c9607f;color:#ffffff;padding:12px 22px;border-radius:8px;text-decoration:none;font-weight:bold;font-size:16px;line-height:20px";
      const buttons =
        site && process.env.CONFIRM_SECRET
          ? `<p style="margin:20px 0 6px"><a href="${site}/api/confirm?id=${order.id}&t=${L.sign(order.id)}" style="${btn}">Manage this order</a></p>
             <p style="margin:0 0 6px;font-size:13px;color:#7a6a6e">Confirm the price, ask the 50% deposit, mark it received.</p>
             <p style="margin:6px 0">Or open your <a href="${site}/admin.html">admin page</a> to see all orders.</p>`
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
