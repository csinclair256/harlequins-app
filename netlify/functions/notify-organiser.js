// Netlify serverless function — grading registration email notification
// Sends a structured organiser email via Gmail SMTP on each completed registration.
//
// Required env vars (Netlify Dashboard → Site → Environment Variables):
//   GMAIL_USER          = harlequinsbjj@gmail.com
//   GMAIL_APP_PASSWORD  = <16-char Google App Password>

const nodemailer = require("nodemailer");

const CLASS_LABEL = { adults: "Adults", mini: "Mini Quinns (4–7 yrs)", warriors: "Harlequin Warriors (8–14 yrs)" };
const PAYMENT_LABEL = { stripe: "Card (Square)", bank: "Bank Transfer", cash: "Cash on Day" };

const EVENT = {
  name:      "Harlequins BJJ Mid-Year Grading 2026",
  date:      "Saturday, 13 June 2026",
  timeYouth: "8:45 AM – 9:45 AM",
  timeAdult: "10:30 AM – 12:00 PM",
  location:  "18/200 Grand Ave, Forest Lake QLD 4078",
  mapUrl:    "https://maps.google.com/?q=18/200+Grand+Ave+Forest+Lake+QLD+4078",
};

function sessionTime(participants) {
  const hasYouth  = participants.some(p => p.class === "mini" || p.class === "warriors");
  const hasAdults = participants.some(p => p.class === "adults");
  if (hasYouth && hasAdults) return `Youth: ${EVENT.timeYouth} &nbsp;|&nbsp; Adults: ${EVENT.timeAdult}`;
  if (hasYouth)  return `Youth — ${EVENT.timeYouth}`;
  return `Adults — ${EVENT.timeAdult}`;
}

function buildRegistrantEmail(data) {
  const { contact, participants = [], payment, paymentStatus, total, totalCombinedSavings, notes } = data;
  const isPaid    = payment === "stripe" || paymentStatus === "paid";
  const isBank    = payment === "bank";
  const isCash    = payment === "cash";

  // Participant summary rows
  const participantRows = participants.map(p => {
    const classLabel = CLASS_LABEL[p.class] || p.class;
    const beltLabel  = p.belt ? p.belt.charAt(0).toUpperCase() + p.belt.slice(1) : "—";
    const stripes    = p.stripes && p.stripes !== "0" ? ` · ${p.stripes} stripe${p.stripes === "1" ? "" : "s"}` : "";

    let productLine = "";
    if (p.product && p.product !== "none") {
      const sizes = [];
      if (p.giSize)        sizes.push(p.giSize === "store" ? "size in store" : p.giSize);
      if (p.rashguardSize) sizes.push(`rashguard ${p.rashguardSize === "store" ? "in store" : p.rashguardSize}`);
      if (p.shortsSize)    sizes.push(`shorts ${p.shortsSize === "store" ? "in store" : p.shortsSize}`);
      productLine = `<div style="margin-top:4px;color:#555;font-size:13px">&#128230; ${p.productName}${sizes.length ? ` — ${sizes.join(", ")}` : ""}</div>`;
    }

    const gradingLine = p.freeGrading
      ? `<span style="color:#2e7d32;font-size:12px">Grading FREE with purchase</span>`
      : `<span style="font-size:12px;color:#555">Grading fee: $${Number(p.gradingPrice).toFixed(2)}</span>`;

    return `
<tr>
  <td style="padding:12px 0;border-bottom:1px solid #f0f0f0;vertical-align:top">
    <div style="font-weight:bold;font-size:15px">${p.first} ${p.last}</div>
    <div style="color:#888;font-size:13px;margin-top:2px">${classLabel} &nbsp;|&nbsp; ${beltLabel} belt${stripes}</div>
    ${productLine}
    <div style="margin-top:4px">${gradingLine}</div>
  </td>
</tr>`;
  }).join("");

  // Payment status block
  let paymentBlock;
  if (isPaid) {
    paymentBlock = `
<div style="background:#e8f5e9;border-left:4px solid #2e7d32;border-radius:0 6px 6px 0;padding:14px 16px;margin:20px 0">
  <div style="color:#2e7d32;font-weight:bold;font-size:15px">&#10003; Payment Confirmed</div>
  <div style="color:#555;margin-top:4px;font-size:13px">$${Number(total).toFixed(2)} paid via card. Your spot is locked in.</div>
  ${Number(totalCombinedSavings) > 0 ? `<div style="color:#2e7d32;font-size:13px;margin-top:4px">You saved $${Number(totalCombinedSavings).toFixed(2)} with your package deal!</div>` : ""}
</div>`;
  } else if (isBank) {
    paymentBlock = `
<div style="background:#fff8e1;border-left:4px solid #f9a825;border-radius:0 6px 6px 0;padding:14px 16px;margin:20px 0">
  <div style="color:#e65100;font-weight:bold;font-size:15px">&#9888; Bank Transfer Required</div>
  <div style="color:#555;margin-top:4px;font-size:13px">Please transfer <strong>$${Number(total).toFixed(2)}</strong> to secure your spot. Your registration is provisional until payment is received.</div>
  <div style="color:#555;font-size:13px;margin-top:6px">Contact us at harlequinsbjj@gmail.com for bank details.</div>
</div>`;
  } else {
    paymentBlock = `
<div style="background:#fff8e1;border-left:4px solid #f9a825;border-radius:0 6px 6px 0;padding:14px 16px;margin:20px 0">
  <div style="color:#e65100;font-weight:bold;font-size:15px">&#9888; Cash on the Day</div>
  <div style="color:#555;margin-top:4px;font-size:13px">Please bring <strong>$${Number(total).toFixed(2)} cash</strong> to sign-in on grading day. Exact change appreciated.</div>
</div>`;
  }

  const notesLine = notes
    ? `<div style="margin-top:16px;padding:12px 16px;background:#f9f9f9;border-radius:6px;font-size:13px;color:#555;font-style:italic">"${notes}"</div>`
    : "";

  const names = participants.map(p => p.first).join(" & ");

  return `<!DOCTYPE html>
<html>
<body style="margin:0;padding:16px;background:#f0f0f0;font-family:Arial,sans-serif">
<div style="max-width:600px;margin:0 auto;background:#fff;border-radius:8px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.1)">

  <!-- Header -->
  <div style="background:#121212;padding:28px 24px 20px;text-align:center">
    <img src="https://harlequins-comp-tracker.netlify.app/assets/assets/logo.49d129e73b3bd523144766212fc551bd.png"
         alt="Harlequins BJJ"
         width="300"
         style="max-width:85%;height:auto;display:block;margin:0 auto" />
    <div style="font-size:40px;margin:14px 0 8px">🥋</div>
    <h1 style="color:#D4A017;margin:0;font-size:26px;font-weight:900;letter-spacing:-0.5px">You're In!</h1>
    <div style="color:#aaa;font-size:14px;margin-top:8px">Registration confirmed for ${names}</div>
  </div>

  <!-- Intro -->
  <div style="padding:28px 24px 0">
    <p style="font-size:16px;color:#333;margin:0;line-height:1.6">
      Hey <strong>${contact.first}</strong>! The mat is booked, the belt is on the line —
      it's time for ${names} to show what ${participants.length === 1 ? "they've" : "they've all"} been working for.
      We'll see you on <strong>13 June</strong>. Come ready.
    </p>
  </div>

  <!-- Event details -->
  <div style="padding:24px 24px 0">
    <h2 style="margin:0 0 12px;font-size:13px;text-transform:uppercase;letter-spacing:1px;color:#D4A017;border-bottom:1px solid #eee;padding-bottom:8px">Event Details</h2>
    <table style="width:100%;border-collapse:collapse">
      <tr>
        <td style="padding:5px 0;color:#888;width:90px;font-size:13px">&#128197; Date</td>
        <td style="padding:5px 0;font-size:14px"><strong>${EVENT.date}</strong></td>
      </tr>
      <tr>
        <td style="padding:5px 0;color:#888;font-size:13px">&#128336; Time</td>
        <td style="padding:5px 0;font-size:14px">${sessionTime(participants)}</td>
      </tr>
      <tr>
        <td style="padding:5px 0;color:#888;font-size:13px">&#128205; Location</td>
        <td style="padding:5px 0;font-size:14px"><a href="${EVENT.mapUrl}" style="color:#1565c0">${EVENT.location}</a></td>
      </tr>
    </table>
  </div>

  <!-- Participants -->
  <div style="padding:24px 24px 0">
    <h2 style="margin:0 0 4px;font-size:13px;text-transform:uppercase;letter-spacing:1px;color:#D4A017;border-bottom:1px solid #eee;padding-bottom:8px">Who's Grading</h2>
    <table style="width:100%;border-collapse:collapse">${participantRows}</table>
  </div>

  <!-- Payment -->
  <div style="padding:0 24px">
    ${paymentBlock}
  </div>

  ${notesLine ? `<div style="padding:0 24px">${notesLine}</div>` : ""}

  <!-- What to bring -->
  <div style="padding:24px">
    <h2 style="margin:0 0 12px;font-size:13px;text-transform:uppercase;letter-spacing:1px;color:#D4A017;border-bottom:1px solid #eee;padding-bottom:8px">What to Bring</h2>
    <ul style="margin:0;padding-left:20px;color:#444;font-size:14px;line-height:2">
      <li>Clean gi and/or no-gi gear</li>
      <li>Mouthguard</li>
      <li>Water bottle</li>
      <li>Your best attitude — leave nerves at the door</li>
      ${isCash || isBank ? `<li><strong>$${Number(total).toFixed(2)}${isCash ? " cash" : " bank transfer completed"}</strong></li>` : ""}
    </ul>
  </div>

  <!-- Closing -->
  <div style="background:#1a1a1a;padding:24px;text-align:center">
    <div style="font-size:22px;margin-bottom:8px">🤙</div>
    <div style="color:#D4A017;font-weight:bold;font-size:16px">See you on the mats!</div>
    <div style="color:#aaa;font-size:13px;margin-top:6px">The Harlequins BJJ Team</div>
    <div style="margin-top:12px;padding-top:12px;border-top:1px solid #333;font-size:11px;color:#666">
      Questions? Reply to this email or contact us at harlequinsbjj@gmail.com
    </div>
  </div>

</div>
</body>
</html>`;
}

function belt(p) {
  const b = p.belt ? p.belt.charAt(0).toUpperCase() + p.belt.slice(1) : "—";
  const s = p.stripes ? ` · ${p.stripes} stripe${p.stripes === "1" ? "" : "s"}` : "";
  return b + s;
}

function equipmentBlock(p) {
  if (!p.product || p.product === "none") {
    return `<tr>
      <td style="padding:10px 16px;color:#555;font-style:italic">Grading only — no equipment order</td>
    </tr>`;
  }

  const rows = [];

  rows.push(`<tr>
    <td style="padding:6px 16px 2px;color:#888;font-size:12px;text-transform:uppercase;letter-spacing:0.5px" colspan="2">Equipment Order</td>
  </tr>`);

  rows.push(`<tr>
    <td style="padding:3px 16px;color:#555;width:160px">Product</td>
    <td style="padding:3px 16px"><strong>${p.productName || "—"}</strong></td>
  </tr>`);

  if (p.giSize) {
    const sizeLabel = p.giSize === "store" ? "Measure in store" : p.giSize;
    rows.push(`<tr>
      <td style="padding:3px 16px;color:#555">Gi Size</td>
      <td style="padding:3px 16px"><strong>${sizeLabel}</strong></td>
    </tr>`);
  }

  if (p.rashguardSize) {
    const sizeLabel = p.rashguardSize === "store" ? "Measure in store" : p.rashguardSize;
    rows.push(`<tr>
      <td style="padding:3px 16px;color:#555">Rashguard Size</td>
      <td style="padding:3px 16px"><strong>${sizeLabel}</strong></td>
    </tr>`);
  }

  if (p.shortsSize) {
    const sizeLabel = p.shortsSize === "store" ? "Measure in store" : p.shortsSize;
    rows.push(`<tr>
      <td style="padding:3px 16px;color:#555">Shorts Size</td>
      <td style="padding:3px 16px"><strong>${sizeLabel}</strong></td>
    </tr>`);
  }

  const gradingLine = p.freeGrading
    ? '<span style="color:#2e7d32">FREE — included with purchase</span>'
    : `$${Number(p.gradingPrice).toFixed(2)}`;

  rows.push(`<tr>
    <td style="padding:3px 16px;color:#555">Grading Fee</td>
    <td style="padding:3px 16px">${gradingLine}</td>
  </tr>`);

  rows.push(`<tr>
    <td style="padding:3px 16px 10px;color:#555">Subtotal</td>
    <td style="padding:3px 16px 10px"><strong>$${Number(p.totalPrice).toFixed(2)}</strong></td>
  </tr>`);

  return rows.join("\n");
}

function coachBlock(p) {
  const rows = [];

  rows.push(`<tr>
    <td style="padding:10px 16px 2px;color:#888;font-size:12px;text-transform:uppercase;letter-spacing:0.5px" colspan="2">Coach Assessment</td>
  </tr>`);

  rows.push(`<tr>
    <td style="padding:3px 16px;color:#555;width:160px">Current Belt</td>
    <td style="padding:3px 16px"><strong>${belt(p)}</strong></td>
  </tr>`);

  if (p.beltTime) {
    rows.push(`<tr>
      <td style="padding:3px 16px;color:#555">Time at Belt</td>
      <td style="padding:3px 16px">${p.beltTime}</td>
    </tr>`);
  }

  if (p.timeBJJ) {
    rows.push(`<tr>
      <td style="padding:3px 16px;color:#555">Total BJJ Training</td>
      <td style="padding:3px 16px">${p.timeBJJ}</td>
    </tr>`);
  }

  return rows.join("\n");
}

function participantCard(p, idx) {
  const classLabel = CLASS_LABEL[p.class] || p.class || "—";

  return `
<div style="border:1px solid #ddd;border-radius:6px;overflow:hidden;margin-bottom:16px">

  <!-- Participant header -->
  <div style="background:#f5f5f5;padding:12px 16px;border-bottom:1px solid #ddd">
    <span style="font-weight:bold;font-size:15px">${p.first} ${p.last}</span>
    <span style="color:#666;font-size:13px;margin-left:24px">${classLabel}</span>
  </div>

  <table style="width:100%;border-collapse:collapse">

    <!-- Coach assessment -->
    ${coachBlock(p)}

    <!-- Divider -->
    <tr><td colspan="2" style="padding:0 16px"><div style="border-top:1px solid #eee"></div></td></tr>

    <!-- Equipment order -->
    ${equipmentBlock(p)}

  </table>
</div>`;
}

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  const user = process.env.GMAIL_USER;
  const pass = process.env.GMAIL_APP_PASSWORD;
  if (!user || !pass) {
    console.error("GMAIL_USER or GMAIL_APP_PASSWORD not set");
    return { statusCode: 500, body: JSON.stringify({ error: "Email service not configured" }) };
  }

  let data;
  try {
    data = JSON.parse(event.body);
  } catch {
    return { statusCode: 400, body: JSON.stringify({ error: "Invalid request body" }) };
  }

  const { contact, participants = [], total, payment, paymentStatus, paymentConfirmedAt, totalCombinedSavings, notes } = data;

  const isPaid = payment === "stripe" || paymentStatus === "paid";
  const isBankTransfer = payment === "bank";
  const isCash = payment === "cash";

  // Top banner — quick scan indicator only
  const bannerBg    = isPaid ? "#e8f5e9" : "#fff3e0";
  const bannerBorder = isPaid ? "#2e7d32" : "#e65100";
  const bannerText  = isPaid
    ? `<strong style="color:#2e7d32">&#10003; PAID — Card (Square)</strong>`
    : isBankTransfer
      ? `<strong style="color:#e65100">&#9888; AWAITING BANK TRANSFER</strong>`
      : `<strong style="color:#e65100">&#9888; CASH COLLECTION REQUIRED</strong>`;

  const confirmedAt = paymentConfirmedAt
    ? new Date(paymentConfirmedAt).toLocaleString("en-AU", { timeZone: "Australia/Brisbane" })
    : new Date().toLocaleString("en-AU", { timeZone: "Australia/Brisbane" });

  const totalStr = `$${Number(total).toFixed(2)}`;

  // Full payment section
  const savingsRow = Number(totalCombinedSavings) > 0
    ? `<tr>
        <td style="padding:4px 0;color:#888;width:130px;font-size:13px">Savings Applied</td>
        <td style="padding:4px 0;color:#2e7d32">&#8722;$${Number(totalCombinedSavings).toFixed(2)}</td>
      </tr>`
    : "";

  let paymentStatusRow, paymentActionBlock;
  if (isPaid) {
    paymentStatusRow = `<tr>
      <td style="padding:4px 0;color:#888;font-size:13px">Status</td>
      <td style="padding:4px 0"><span style="color:#2e7d32;font-weight:bold">&#10003; Paid in Full</span></td>
    </tr>
    <tr>
      <td style="padding:4px 0;color:#888;font-size:13px">Confirmed</td>
      <td style="padding:4px 0">${confirmedAt}</td>
    </tr>`;
    paymentActionBlock = `<div style="background:#e8f5e9;border-left:4px solid #2e7d32;border-radius:0 4px 4px 0;padding:12px 16px;margin-top:14px">
      <strong style="color:#2e7d32">No further action required.</strong>
      <div style="margin-top:4px;color:#555;font-size:13px">Payment received via Square. Registration is confirmed.</div>
    </div>`;
  } else if (isBankTransfer) {
    paymentStatusRow = `<tr>
      <td style="padding:4px 0;color:#888;font-size:13px">Status</td>
      <td style="padding:4px 0"><span style="color:#e65100;font-weight:bold">&#9888; Awaiting Receipt</span></td>
    </tr>`;
    paymentActionBlock = `<div style="background:#fff3e0;border-left:4px solid #e65100;border-radius:0 4px 4px 0;padding:14px 16px;margin-top:14px">
      <strong style="color:#e65100">Action Required — Bank Transfer</strong>
      <ul style="margin:10px 0 0;padding-left:18px;color:#444;font-size:13px;line-height:1.8">
        <li>Look for an incoming transfer of <strong>${totalStr}</strong></li>
        <li>Reference may include: <strong>${contact.first} ${contact.last}</strong></li>
        <li>If not received by <strong>10 June 2026</strong>, follow up with registrant</li>
        <li>Contact: ${contact.first} ${contact.last} &bull; <a href="tel:${contact.phone}" style="color:#1565c0">${contact.phone || "no phone provided"}</a> &bull; <a href="mailto:${contact.email}" style="color:#1565c0">${contact.email}</a></li>
      </ul>
    </div>`;
  } else {
    paymentStatusRow = `<tr>
      <td style="padding:4px 0;color:#888;font-size:13px">Status</td>
      <td style="padding:4px 0"><span style="color:#e65100;font-weight:bold">&#9888; Collect on Grading Day</span></td>
    </tr>`;
    paymentActionBlock = `<div style="background:#fff3e0;border-left:4px solid #e65100;border-radius:0 4px 4px 0;padding:14px 16px;margin-top:14px">
      <strong style="color:#e65100">Action Required — Cash Collection</strong>
      <ul style="margin:10px 0 0;padding-left:18px;color:#444;font-size:13px;line-height:1.8">
        <li>Collect <strong>${totalStr} cash</strong> from <strong>${contact.first} ${contact.last}</strong> at sign-in</li>
        <li>Grading day: <strong>13 June 2026</strong></li>
        <li>Contact: <a href="tel:${contact.phone}" style="color:#1565c0">${contact.phone || "no phone provided"}</a> &bull; <a href="mailto:${contact.email}" style="color:#1565c0">${contact.email}</a></li>
        <li>Do not issue equipment until cash is collected</li>
      </ul>
    </div>`;
  }

  const paymentSection = `
<div style="padding:16px 24px 20px;background:#fff">
  <h2 style="margin:0 0 12px;font-size:13px;text-transform:uppercase;letter-spacing:1px;color:#D4A017;border-bottom:1px solid #eee;padding-bottom:8px">Payment</h2>
  <table style="width:100%;border-collapse:collapse">
    <tr>
      <td style="padding:4px 0;color:#888;width:130px;font-size:13px">Method</td>
      <td style="padding:4px 0"><strong>${PAYMENT_LABEL[payment] || payment}</strong></td>
    </tr>
    <tr>
      <td style="padding:4px 0;color:#888;font-size:13px">Amount</td>
      <td style="padding:4px 0"><strong>${totalStr}</strong></td>
    </tr>
    ${savingsRow}
    ${paymentStatusRow}
  </table>
  ${paymentActionBlock}
</div>`;

  const participantCards = participants.map((p, i) => participantCard(p, i)).join("\n");

  const notesBlock = notes
    ? `<div style="padding:16px 24px 0;background:#fff">
        <h2 style="margin:0 0 10px;font-size:13px;text-transform:uppercase;letter-spacing:1px;color:#D4A017;border-bottom:1px solid #eee;padding-bottom:8px">Registrant Notes</h2>
        <p style="margin:0;color:#444;font-style:italic">"${notes}"</p>
      </div>`
    : "";

  const html = `
<!DOCTYPE html>
<html>
<body style="margin:0;padding:16px;background:#f0f0f0;font-family:Arial,sans-serif">
<div style="max-width:600px;margin:0 auto;background:#fff;border-radius:8px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.1)">

  <!-- Header -->
  <div style="background:#D4A017;padding:24px;text-align:center">
    <div style="color:#fff;font-size:11px;text-transform:uppercase;letter-spacing:2px;opacity:0.85;margin-bottom:4px">Harlequins BJJ</div>
    <h1 style="color:#fff;margin:0;font-size:22px;font-weight:bold">New Grading Registration</h1>
    <div style="color:#fff;opacity:0.85;font-size:13px;margin-top:6px">Mid-Year Grading &mdash; 13 June 2026</div>
  </div>

  <!-- Status banner — quick scan indicator -->
  <div style="background:${bannerBg};border-left:4px solid ${bannerBorder};padding:12px 20px">
    ${bannerText}
    <span style="color:#666;margin-left:10px;font-size:13px">${confirmedAt}</span>
  </div>

  <!-- Contact -->
  <div style="padding:20px 24px;background:#fff">
    <h2 style="margin:0 0 12px;font-size:13px;text-transform:uppercase;letter-spacing:1px;color:#D4A017;border-bottom:1px solid #eee;padding-bottom:8px">Contact</h2>
    <table style="width:100%;border-collapse:collapse">
      <tr>
        <td style="padding:4px 0;color:#888;width:130px;font-size:13px">Name</td>
        <td style="padding:4px 0"><strong>${contact.first} ${contact.last}</strong>${contact.role ? ` <span style="color:#888;font-weight:normal">(${contact.role})</span>` : ""}</td>
      </tr>
      <tr>
        <td style="padding:4px 0;color:#888;font-size:13px">Email</td>
        <td style="padding:4px 0"><a href="mailto:${contact.email}" style="color:#1565c0">${contact.email}</a></td>
      </tr>
      <tr>
        <td style="padding:4px 0;color:#888;font-size:13px">Phone</td>
        <td style="padding:4px 0">${contact.phone ? `<a href="tel:${contact.phone}" style="color:#1565c0">${contact.phone}</a>` : "—"}</td>
      </tr>
    </table>
  </div>

  <!-- Participants -->
  <div style="padding:0 24px 4px;background:#fff">
    <h2 style="margin:0 0 14px;font-size:13px;text-transform:uppercase;letter-spacing:1px;color:#D4A017;border-bottom:1px solid #eee;padding-bottom:8px">
      Participants (${participants.length})
    </h2>
    ${participantCards}
  </div>

  ${notesBlock}

  ${paymentSection}

  <!-- Footer -->
  <div style="padding:14px 24px;background:#f9f9f9;text-align:center;font-size:11px;color:#aaa;border-top:1px solid #eee">
    Harlequins BJJ Grading Registration System &mdash; harlequins-comp-tracker.netlify.app
  </div>

</div>
</body>
</html>`;

  const subject = isPaid
    ? `[PAID] Grading Registration — ${participants.map(p => `${p.first} ${p.last}`).join(", ")} · $${Number(total).toFixed(2)}`
    : `[${isBankTransfer ? "BANK PENDING" : "CASH ON DAY"}] Grading Registration — ${participants.map(p => `${p.first} ${p.last}`).join(", ")}`;

  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: { user, pass },
  });

  // Supabase write — fire alongside email, failures logged but don't block response
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  const supabaseWrite = supabaseUrl && supabaseKey
    ? fetch(`${supabaseUrl}/rest/v1/grading_registrations`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${supabaseKey}`,
          "apikey": supabaseKey,
          "Prefer": "return=minimal",
        },
        body: JSON.stringify({
          submitted_at: data.submittedAt || new Date().toISOString(),
          grading_date: "2026-06-13",
          contact: data.contact,
          participants: data.participants,
          payment: data.payment,
          payment_status: isPaid ? "paid" : "pending",
          payment_confirmed_at: data.paymentConfirmedAt || null,
          total: Number(data.total),
          total_savings: Number(data.totalCombinedSavings || 0),
          notes: data.notes || null,
        }),
      }).then(async (res) => {
        if (!res.ok) {
          const body = await res.text();
          console.error("Supabase write error:", res.status, body);
        } else {
          console.log("Supabase write OK");
        }
      }).catch((err) => console.error("Supabase write failed:", err))
    : Promise.resolve();

  const registrantHtml    = buildRegistrantEmail(data);
  const registrantSubject = `You're registered — Harlequins BJJ Grading, 13 June 2026`;
  const registrantEmail   = data.contact?.email;

  try {
    await Promise.all([
      transporter.sendMail({
        from: `"Harlequins BJJ Grading" <${user}>`,
        to: user,
        subject,
        html,
      }),
      registrantEmail
        ? transporter.sendMail({
            from: `"Harlequins BJJ" <${user}>`,
            to: registrantEmail,
            subject: registrantSubject,
            html: registrantHtml,
          })
        : Promise.resolve(),
      supabaseWrite,
    ]);
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
