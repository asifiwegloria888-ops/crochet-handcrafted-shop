// GET/POST /api/confirm?id=6&t=<token>
// Link in the "New order" email. Step 1: confirm + ask the 50% deposit. Step 2: deposit received.

const L = require("./_lib");

function send(res, status, title, body) {
  res.status(status);
  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.setHeader("Cache-Control", "no-store");
  return res.send(`<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1"><meta name="robots" content="noindex"><title>${L.esc(title)}</title>
<style>
body{margin:0;background:#fff7f2;color:#4a3b3f;font-family:Georgia,serif;line-height:1.6}
main{max-width:520px;margin:0 auto;padding:28px 20px}
h1{color:#c9607f;font-size:1.6rem}
.box{background:#fff;border-radius:16px;padding:20px;box-shadow:0 4px 14px rgba(0,0,0,.08)}
label{display:block;font-weight:bold;margin:14px 0 4px;color:#c9607f}
input{width:100%;box-sizing:border-box;padding:12px;border:1px solid #e8a0b4;border-radius:10px;font-size:1rem;font-family:inherit}
button{margin-top:18px;width:100%;background:#c9607f;color:#fff;border:none;padding:14px;border-radius:10px;font-size:1rem;cursor:pointer}
.err{background:#fde4e4;color:#9b1c1c;padding:10px 14px;border-radius:10px}
.ok{background:#e3f4e8;color:#1b5e34;padding:10px 14px;border-radius:10px}
table{width:100%;border-collapse:collapse;font-size:.95rem}
</style></head><body><main>${body}</main></body></html>`);
}

function summary(order) {
  return `<p><strong>${L.esc(order.name)}</strong><br>${L.esc(order.email)}${order.phone ? "<br>" + L.esc(order.phone) : ""}</p>${L.itemsTable(order)}`;
}

function formPage(res, order, ref, token, error) {
  const guess = L.estimateOf(order) || "";
  const action = `/api/confirm?id=${order.id}&t=${encodeURIComponent(token)}`;
  return send(
    res,
    error ? 400 : 200,
    `Confirm ${ref}`,
    `<h1>Confirm order ${L.esc(ref)}</h1>
<div class="box">
  ${summary(order)}
  ${error ? `<p class="err">${L.esc(error)}</p>` : ""}
  <form method="POST" action="${L.esc(action)}">
    <label for="total">Total price (UGX, delivery included)</label>
    <input id="total" name="total" type="number" min="1" step="1" value="${L.esc(guess)}" required>
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

function depositPage(res, order, ref, token, error) {
  const action = `/api/confirm?id=${order.id}&t=${encodeURIComponent(token)}`;
  return send(
    res,
    error ? 500 : 200,
    `Order ${ref}`,
    `<h1>Order ${L.esc(ref)}</h1>
<div class="box">
  ${summary(order)}
  <p class="ok">Confirmed. Total ${L.esc(L.money(order.total || 0))}, deposit asked ${L.esc(L.money(order.deposit || 0))}.</p>
  ${error ? `<p class="err">${L.esc(error)}</p>` : ""}
  <p>When the customer has paid the deposit, press the button. The customer receives a message saying you are starting the order.</p>
  <form method="POST" action="${L.esc(action)}"><button type="submit">Deposit received: tell the customer</button></form>
</div>`
  );
}

module.exports = async (req, res) => {
  if (req.method !== "GET" && req.method !== "POST") {
    res.setHeader("Allow", "GET, POST");
    return res.status(405).send("Method not allowed");
  }

  const id = parseInt(req.query && req.query.id, 10);
  const token = req.query && req.query.t;
  if (!Number.isInteger(id) || id < 1 || !L.validToken(id, token)) {
    return send(res, 403, "Link not valid", "<h1>Link not valid</h1><p>This confirmation link is not valid.</p>");
  }

  const sql = L.db();
  let order;
  try {
    await L.ensureSchema(sql);
    order = (await sql`SELECT * FROM orders WHERE id = ${id}`)[0];
  } catch (err) {
    console.error("Database error:", err);
    return send(res, 500, "Error", "<h1>Error</h1><p>Could not read the order. Please try again.</p>");
  }
  if (!order) return send(res, 404, "Not found", "<h1>Order not found</h1>");
  const ref = L.refOf(order.id);

  try {
    if (order.status === "new") {
      if (req.method === "GET") return formPage(res, order, ref, token);
      const total = parseInt(req.body && req.body.total, 10);
      if (!Number.isInteger(total) || total < 1 || total > 100000000) return formPage(res, order, ref, token, "Please enter a valid total price.");
      let result;
      try {
        result = await L.doConfirm(sql, order, total);
      } catch (err) {
        if (err.user) return formPage(res, order, ref, token, err.message);
        throw err;
      }
      return send(res, 200, `${ref} confirmed`,
        `<h1>Order ${L.esc(ref)}</h1><p class="ok">Confirmation sent to ${L.esc(order.email)}.<br>Total ${L.esc(L.money(total))}, deposit asked ${L.esc(L.money(result.deposit))}.</p><p>When the deposit arrives, open the same link again and press "Deposit received".</p>`);
    }

    if (order.status === "confirmed") {
      if (req.method === "GET") return depositPage(res, order, ref, token);
      try {
        await L.doDeposit(sql, order);
      } catch (err) {
        if (err.user) return depositPage(res, order, ref, token, err.message);
        throw err;
      }
      return send(res, 200, `${ref} deposit received`,
        `<h1>Order ${L.esc(ref)}</h1><p class="ok">Done. ${L.esc(order.email)} was told that you received the deposit and are starting the order.</p>`);
    }

    return send(res, 200, `Order ${ref}`,
      `<h1>Order ${L.esc(ref)}</h1><div class="box">${summary(order)}<p class="ok">Status: ${L.esc(order.status)}. Use your admin page to manage this order.</p></div>`);
  } catch (err) {
    console.error("Confirm error:", err);
    return send(res, 500, "Error", "<h1>Error</h1><p>Something went wrong. Please try again.</p>");
  }
};
