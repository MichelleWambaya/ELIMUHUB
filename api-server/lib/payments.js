// Payment provider abstraction.
//
// Route code only ever calls getPaymentAdapter().charge(...) — it never
// talks to a provider directly. That keeps marketplace logic the same
// regardless of which provider is configured.

import { darajaBaseUrl, getDarajaAccessToken } from './darajaClient.js';

/**
 * @typedef {Object} ChargeResult
 * @property {boolean} success
 * @property {string} reference   - opaque id used to reconcile later
 * @property {'paid'|'pending'|'failed'} status
 */

class DevPaymentAdapter {
  // Development-only adapter. Marks payments as paid immediately so the
  // rest of the app can be built and tested before real credentials exist.
  // Must never run when PAYMENT_PROVIDER is set to a real provider.
  async charge({ amountKes, reference }) {
    console.warn(
      `[DEV PAYMENT ADAPTER] Simulating payment of KES ${amountKes} (ref: ${reference}). ` +
      'This is NOT a real payment. Configure PAYMENT_PROVIDER=mpesa with real credentials before launch.'
    );
    return { success: true, reference, status: 'paid' };
  }
}

class MpesaPaymentAdapter {
  // Real Safaricom Daraja STK Push integration. M-Pesa payments are
  // asynchronous: this method only *initiates* the payment on the
  // customer's phone. The actual result arrives later at the callback URL
  // (see routes/payments.js), which is what marks the order paid.
  constructor() {
    this.shortcode = process.env.DARAJA_SHORTCODE;
    this.passkey = process.env.DARAJA_PASSKEY;
    this.callbackUrl = process.env.DARAJA_CALLBACK_URL;
    this.baseUrl = darajaBaseUrl();

    const missing = ['shortcode', 'passkey', 'callbackUrl'].filter((k) => !this[k]);
    if (missing.length) {
      throw new Error(
        `M-Pesa adapter is missing configuration: ${missing.join(', ')}. ` +
        'Set DARAJA_SHORTCODE, DARAJA_PASSKEY and DARAJA_CALLBACK_URL (consumer key/secret are read separately).'
      );
    }
  }

  _timestamp() {
    const d = new Date();
    const pad = (n) => String(n).padStart(2, '0');
    return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}${pad(d.getHours())}${pad(
      d.getMinutes()
    )}${pad(d.getSeconds())}`;
  }

  // phoneNumber must be in 2547XXXXXXXX format.
  async charge({ amountKes, reference, phoneNumber }) {
    if (!phoneNumber || !/^254\d{9}$/.test(phoneNumber)) {
      throw new Error('A valid M-Pesa phone number (format 2547XXXXXXXX) is required.');
    }

    const token = await getDarajaAccessToken();
    const timestamp = this._timestamp();
    const password = Buffer.from(`${this.shortcode}${this.passkey}${timestamp}`).toString('base64');

    const res = await fetch(`${this.baseUrl}/mpesa/stkpush/v1/processrequest`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        BusinessShortCode: this.shortcode,
        Password: password,
        Timestamp: timestamp,
        TransactionType: 'CustomerPayBillOnline',
        Amount: Math.round(amountKes),
        PartyA: phoneNumber,
        PartyB: this.shortcode,
        PhoneNumber: phoneNumber,
        CallBackURL: this.callbackUrl,
        AccountReference: reference,
        TransactionDesc: 'ElimuHub purchase',
      }),
    });

    const data = await res.json();
    if (!res.ok || !data.CheckoutRequestID) {
      throw new Error(data.errorMessage || 'M-Pesa did not accept the payment request.');
    }

    // The CheckoutRequestID is what Safaricom's callback will reference,
    // so it becomes our reconciliation key — not the original `reference`.
    return { success: true, reference: data.CheckoutRequestID, status: 'pending' };
  }
}

class ManualPaymentAdapter {
  // For paying directly to a till/QR outside the app. The order is
  // created as 'pending' immediately with no external call — the
  // student later submits the M-Pesa transaction code they received by
  // SMS, and an admin cross-checks it against the till statement before
  // marking the order paid. See routes/orders.js (submit-code) and
  // routes/admin.js (confirm/reject).
  async charge({ amountKes, reference }) {
    console.warn(
      `[MANUAL PAYMENT] Order ${reference} for KES ${amountKes} is awaiting a till/QR payment and admin verification.`
    );
    return { success: true, reference, status: 'pending' };
  }
}

export function getPaymentAdapter() {
  const provider = process.env.PAYMENT_PROVIDER || 'dev';
  if (provider === 'mpesa') return new MpesaPaymentAdapter();
  if (provider === 'dev') return new DevPaymentAdapter();
  if (provider === 'manual') return new ManualPaymentAdapter();
  throw new Error(`Unknown PAYMENT_PROVIDER: ${provider}`);
}
