// Netlify serverless function — Square Payment Links proxy
// Keeps the Square access token server-side (Netlify environment variable)
// so it is never exposed in client-side HTML.
//
// Set SQUARE_ACCESS_TOKEN in Netlify Dashboard → Site → Environment Variables
// before deploying.

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  const token = process.env.SQUARE_ACCESS_TOKEN;
  if (!token) {
    console.error("SQUARE_ACCESS_TOKEN environment variable not set");
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Payment service not configured" }),
    };
  }

  let body;
  try {
    body = JSON.parse(event.body);
  } catch {
    return { statusCode: 400, body: JSON.stringify({ error: "Invalid request body" }) };
  }

  try {
    const response = await fetch(
      "https://connect.squareup.com/v2/online-checkout/payment-links",
      {
        method: "POST",
        headers: {
          "Square-Version": "2026-01-22",
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      }
    );

    const result = await response.json();

    if (!response.ok) {
      console.error("Square API error:", result);
      return {
        statusCode: response.status,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(result),
      };
    }

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(result),
    };
  } catch (err) {
    console.error("Function error:", err);
    return {
      statusCode: 502,
      body: JSON.stringify({ error: "Payment gateway unreachable" }),
    };
  }
};
