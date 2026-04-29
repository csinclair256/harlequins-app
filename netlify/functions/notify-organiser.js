// Netlify serverless function — grading registration email notification
// Sends a confirmation email to the organiser via Gmail SMTP.
//
// Required env vars in Netlify Dashboard → Site → Environment Variables:
//   GMAIL_USER          = harlequinsbjj@gmail.com
//   GMAIL_APP_PASSWORD  = <16-char Google App Password>

const nodemailer = require("nodemailer");

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  const user = process.env.GMAIL_USER;
  const pass = process.env.GMAIL_APP_PASSWORD;
  if (!user || !pass) {
    console.error("Gmail credentials not configured");
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Email service not configured" }),
    };
  }

  let data;
  try {
    data = JSON.parse(event.body);
  } catch {
    return { statusCode: 400, body: JSON.stringify({ error: "Invalid request body" }) };
  }

  const { contact, participants, total, paymentConfirmedAt, totalCombinedSavings } = data;

  const participantRows = (participants || []).map((p) => {
    const lines = [
      `<strong>${p.first} ${p.last}</strong>`,
      `Class: ${p.class}`,
      `Belt: ${p.belt}`,
    ];
    if (p.product && p.product !== "none") lines.push(`Product: ${p.productName}`);
    if (p.freeGrading) lines.push('<span style="color:#2e7d32">FREE Grading included</span>');
    if (p.giSize) lines.push(`Gi size: ${p.giSize}`);
    if (p.rashguardSize) lines.push(`Rashguard: ${p.rashguardSize}`);
    if (p.shortsSize) lines.push(`Shorts: ${p.shortsSize}`);
    lines.push(`Subtotal: <strong>$${Number(p.totalPrice).toFixed(2)}</strong>`);
    return `<tr><td style="padding:10px 8px;border-bottom:1px solid #eee;vertical-align:top">${lines.join("<br>")}</td></tr>`;
  }).join("");

  const confirmedAt = paymentConfirmedAt
    ? new Date(paymentConfirmedAt).toLocaleString("en-AU", { timeZone: "Australia/Brisbane" })
    : new Date().toLocaleString("en-AU", { timeZone: "Australia/Brisbane" });

  const totalStr = `$${Number(total).toFixed(2)}`;
  const savingsBlock =
    Number(totalCombinedSavings) > 0
      ? `<br><span style="color:#2e7d32">Savings applied: $${Number(totalCombinedSavings).toFixed(2)}</span>`
      : "";

  const html = `
<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;border:1px solid #ddd">
  <div style="background:#D4A017;padding:20px;text-align:center">
    <h1 style="color:#fff;margin:0;font-size:20px">Harlequins BJJ — New Grading Registration</h1>
  </div>
  <div style="padding:24px;background:#fff">
    <h2 style="color:#333;margin-top:0">Card Payment Confirmed ✓</h2>

    <table style="width:100%;border-collapse:collapse;margin-bottom:20px">
      <tr>
        <td style="padding:6px 0;color:#666;width:130px">Contact</td>
        <td style="padding:6px 0"><strong>${contact.first} ${contact.last}</strong></td>
      </tr>
      <tr>
        <td style="padding:6px 0;color:#666">Email</td>
        <td style="padding:6px 0">${contact.email}</td>
      </tr>
      <tr>
        <td style="padding:6px 0;color:#666">Phone</td>
        <td style="padding:6px 0">${contact.phone || "—"}</td>
      </tr>
      <tr>
        <td style="padding:6px 0;color:#666">Role</td>
        <td style="padding:6px 0">${contact.role || "—"}</td>
      </tr>
      <tr>
        <td style="padding:6px 0;color:#666">Payment</td>
        <td style="padding:6px 0">Card (Square)</td>
      </tr>
      <tr>
        <td style="padding:6px 0;color:#666">Confirmed</td>
        <td style="padding:6px 0">${confirmedAt}</td>
      </tr>
    </table>

    <h3 style="color:#333;border-top:2px solid #D4A017;padding-top:14px;margin-bottom:0">Participants</h3>
    <table style="width:100%;border-collapse:collapse;margin-bottom:16px">
      ${participantRows}
    </table>

    <div style="background:#f5f5f5;padding:14px;border-radius:4px">
      <strong>Total Paid: ${totalStr}</strong>${savingsBlock}
    </div>
  </div>
  <div style="padding:12px 24px;background:#f9f9f9;font-size:12px;color:#999;text-align:center">
    Harlequins BJJ Mid-Year Grading &mdash; 13 June 2026
  </div>
</div>`;

  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: { user, pass },
  });

  try {
    await transporter.sendMail({
      from: `"Harlequins BJJ Grading" <${user}>`,
      to: user,
      subject: `Grading Registration: ${contact.first} ${contact.last} — ${totalStr} paid`,
      html,
    });
    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ok: true }),
    };
  } catch (err) {
    console.error("Email send error:", err);
    return {
      statusCode: 502,
      body: JSON.stringify({ error: "Email send failed" }),
    };
  }
};
