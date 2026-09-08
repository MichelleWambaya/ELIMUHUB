// Shared low-level Daraja helpers. STK push (lib/payments.js) and C2B
// registration (triggered from the admin panel) both need an OAuth token
// against the same base URL, so that logic lives here once.

export function darajaBaseUrl() {
  return process.env.DARAJA_ENV === 'production'
    ? 'https://api.safaricom.co.ke'
    : 'https://sandbox.safaricom.co.ke';
}

export async function getDarajaAccessToken() {
  const consumerKey = process.env.DARAJA_CONSUMER_KEY;
  const consumerSecret = process.env.DARAJA_CONSUMER_SECRET;
  if (!consumerKey || !consumerSecret) {
    throw new Error('DARAJA_CONSUMER_KEY and DARAJA_CONSUMER_SECRET must be set.');
  }

  const credentials = Buffer.from(`${consumerKey}:${consumerSecret}`).toString('base64');
  const res = await fetch(`${darajaBaseUrl()}/oauth/v1/generate?grant_type=client_credentials`, {
    headers: { Authorization: `Basic ${credentials}` },
  });
  if (!res.ok) throw new Error('Could not authenticate with Daraja. Check your consumer key/secret.');
  const data = await res.json();
  return data.access_token;
}

// One-time setup action: tells Safaricom where to send C2B payment
// notifications for this shortcode. Must be re-run if the callback
// domain ever changes. Buy Goods (till) shortcodes use the same
// registerurl endpoint as PayBill.
export async function registerC2BUrls() {
  const shortcode = process.env.DARAJA_SHORTCODE;
  const validationUrl = process.env.DARAJA_C2B_VALIDATION_URL;
  const confirmationUrl = process.env.DARAJA_C2B_CONFIRMATION_URL;

  const missing = ['DARAJA_SHORTCODE', 'DARAJA_C2B_VALIDATION_URL', 'DARAJA_C2B_CONFIRMATION_URL'].filter(
    (k) => !process.env[k]
  );
  if (missing.length) throw new Error(`Missing configuration: ${missing.join(', ')}`);

  const token = await getDarajaAccessToken();
  const res = await fetch(`${darajaBaseUrl()}/mpesa/c2b/v1/registerurl`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      ShortCode: shortcode,
      ResponseType: 'Completed',
      ConfirmationURL: confirmationUrl,
      ValidationURL: validationUrl,
    }),
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.errorMessage || 'Safaricom rejected the C2B URL registration.');
  return data;
}
