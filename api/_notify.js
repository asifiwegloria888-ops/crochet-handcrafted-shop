// Notification on the owner's phone, through the free ntfy app (https://ntfy.sh).
// The "_" in the name means Vercel does NOT publish this file as a page.
//
// Needs ONE variable in Vercel (Settings -> Environment Variables):
//   NTFY_TOPIC   a long secret name that only you know, for example  crochet-k7x2m9q4w8p3r5t1
// Without NTFY_TOPIC nothing is sent and nothing breaks.
// Optional: NTFY_SERVER (default https://ntfy.sh).
//
// It never throws and gives up after 4 seconds: a notification problem can NEVER lose or slow down an order.

module.exports = async function notifyOwner(opts) {
  const topic = (process.env.NTFY_TOPIC || "").trim();
  if (!topic) return false;
  const server = (process.env.NTFY_SERVER || "https://ntfy.sh").replace(/\/$/, "");
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 4000);
  try {
    const payload = { topic, title: opts.title, message: opts.message, priority: 4, tags: ["shopping_cart"] };
    if (opts.click) payload.click = opts.click;
    const r = await fetch(server, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });
    if (!r.ok) console.error("NOTIFY FAILED: ntfy answered", r.status);
    return r.ok;
  } catch (err) {
    console.error("NOTIFY FAILED:", err && err.message);
    return false;
  } finally {
    clearTimeout(timer);
  }
};