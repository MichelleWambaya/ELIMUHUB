import express from 'express';
import { supabase } from '../lib/supabase.js';
import { fulfillOrder, notifyAllAdmins } from '../lib/orderFulfillment.js';

export const router = express.Router();

// Public settings the checkout screen needs before payment even starts:
// the till number and QR image for the manual payment flow. Deliberately
// read-only and unauthenticated — it's the same information shown at any
// physical till.
router.get('/manual/info', async (req, res) => {
  const { data } = await supabase
    .from('platform_settings')
    .select('key, value')
    .in('key', ['till_number', 'till_qr_url']);

  const settings = Object.fromEntries((data || []).map((row) => [row.key, row.value]));
  res.json({ till_number: settings.till_number || '', till_qr_url: settings.till_qr_url || '' });
});

// Safaricom calls this URL after the customer approves/declines/times out
// on their phone. Nothing here is trusted just because it looks like a
// valid payload — mark-paid only happens off ResultCode === 0 and only
// for an order we already created with this CheckoutRequestID.
router.post('/mpesa/callback', async (req, res) => {
  const stkCallback = req.body?.Body?.stkCallback;
  if (!stkCallback) return res.status(400).json({ error: 'Malformed callback.' });

  const { CheckoutRequestID, ResultCode } = stkCallback;

  const { data: order } = await supabase
    .from('orders')
    .select('id, resource_id, student_id, teacher_earnings_kes, status')
    .eq('payment_reference', CheckoutRequestID)
    .maybeSingle();

  // Always return 200 to Safaricom even if we don't recognize the
  // reference — a non-200 just causes Safaricom to retry the same callback.
  if (!order) return res.json({ received: true });
  if (order.status !== 'pending') return res.json({ received: true }); // already handled

  if (ResultCode !== 0) {
    await supabase.from('orders').update({ status: 'failed' }).eq('id', order.id);
    await supabase.from('notifications').insert({
      user_id: order.student_id,
      type: 'payment_failed',
      message: 'Your M-Pesa payment was not completed.',
    });
    return res.json({ received: true });
  }

  await fulfillOrder(order);
  res.json({ received: true });
});

// Safaricom calls this first, before completing a C2B payment, to ask
// whether the transaction should proceed. Buy Goods (till) payments don't
// carry any reference we set, so there's nothing meaningful to reject
// here — we accept everything and do the real matching in /confirmation
// once the money has actually moved.
router.post('/mpesa/c2b/validation', async (req, res) => {
  res.json({ ResultCode: 0, ResultDesc: 'Accepted' });
});

// Safaricom calls this after a customer pays the till directly (by QR or
// manually entering the till number) — this is what makes the manual
// payment flow automatic instead of needing an admin to check every code.
//
// Till (Buy Goods) C2B payloads don't include a custom reference field,
// so matching to a specific order is amount-based:
//   - exactly one pending order at that amount  → confirm it automatically
//   - zero or multiple matches                  → store as unmatched,
//     flag it for an admin to pick the right order by hand
router.post('/mpesa/c2b/confirmation', async (req, res) => {
  const body = req.body || {};
  const transId = body.TransID;
  const amount = Number(body.TransAmount);
  const phone = body.MSISDN;

  if (!transId || !amount) {
    return res.json({ ResultCode: 0, ResultDesc: 'Accepted' }); // malformed, but still ack so Safaricom stops retrying
  }

  const { data: existing } = await supabase.from('c2b_transactions').select('id').eq('trans_id', transId).maybeSingle();
  if (existing) return res.json({ ResultCode: 0, ResultDesc: 'Accepted' }); // Safaricom occasionally retries the same confirmation

  const { data: candidates } = await supabase
    .from('orders')
    .select('id, resource_id, student_id, teacher_earnings_kes, status, gross_amount_kes')
    .eq('status', 'pending')
    .eq('gross_amount_kes', amount);

  let matchedOrderId = null;

  if (candidates?.length === 1) {
    // Re-check status right before fulfilling — the student may have
    // submitted a manual code and had it confirmed by an admin in the
    // few seconds since we queried above.
    const { data: fresh } = await supabase.from('orders').select('*').eq('id', candidates[0].id).single();
    if (fresh?.status === 'pending') {
      await fulfillOrder(fresh);
      matchedOrderId = fresh.id;
    }
  } else if (candidates?.length > 1) {
    await notifyAllAdmins({
      type: 'payment_needs_matching',
      message: `A till payment of KES ${amount} came in but matches ${candidates.length} pending orders — pick the right one in Admin > Unmatched till payments.`,
    });
  } else {
    await notifyAllAdmins({
      type: 'payment_needs_matching',
      message: `A till payment of KES ${amount} came in with no matching pending order — check Admin > Unmatched till payments.`,
    });
  }

  await supabase.from('c2b_transactions').insert({
    trans_id: transId,
    amount_kes: amount,
    phone,
    matched_order_id: matchedOrderId,
    raw: body,
  });

  res.json({ ResultCode: 0, ResultDesc: 'Accepted' });
});

export default router;
