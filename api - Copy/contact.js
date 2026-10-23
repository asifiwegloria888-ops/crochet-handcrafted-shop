// Vercel serverless function: POST /api/contact
// Emails the message from the contact page to the shop owner. Reply goes straight to the visitor.

const nodemailer = require("nodemailer");

const esc = (s) =>
  String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const clean = (v, max) => (typeof v === "string" ? v.trim().slice(0, max) : "");

module.exports = async (req, res) => {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  const body = req.body && typeof req.body === "object" ? req.body : {};

  // Honeypot: real people never fill this hidden field, bots do.
  if (body.website) return res.status(200).json({ ok: true });

  const name = clean(body.name, 100);
  const email = clean(body.email, 150);
  const message = clean(body.message, 3000);

  const errors = [];
  if (name.length < 2) errors.push("Please enter your name.");
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.push("Please enter a valid email address.");
  if (message.length < 3) errors.push("Please write your message.");
  if (errors.length) return res.status(400).json({ error: errors.join(" ") });

  try {
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: { user: process.env.GMAIL_USER, pass: process.env.GMAIL_APP_PASSWORD },
    });
    const owner = process.env.OWNER_EMAIL || process.env.GMAIL_USER;
    await transporter.sendMail({
      from: `"Crochet Handcrafted Shop" <${process.env.GMAIL_USER}>`,
      to: owner,
      replyTo: email,
      subject: `New message from ${name}`,
      html: `<div style="font-family:Arial,sans-serif;color:#1B2150;max-width:560px">
        <h2 style="color:#c9607f">New message from the contact page</h2>
        <p><strong>${esc(name)}</strong><br>${esc(email)}</p>
        <p style="white-space:pre-wrap;background:#fff7f2;padding:12px;border-radius:8px">${esc(message)}</p>
        <p>Reply to this email to answer ${esc(name)} directly.</p>
      </div>`,
    });
  } catch (err) {
    console.error("Contact email failed:", err);
    return res.status(500).json({ error: "Sorry, your message could not be sent. Please try again." });
  }

  return res.status(200).json({ ok: true });
};
