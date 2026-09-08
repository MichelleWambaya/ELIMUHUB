import express from 'express';
import { supabase } from '../lib/supabase.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { getPaymentAdapter } from '../lib/payments.js';
import { fulfillOrder, notifyAllAdmins } from '../lib/orderFulfillment.js';

export const router = express.Router();

// Student purchases a resource. Payment must succeed before any
// entitlement or balance change happens.
router.post('/', requireAuth, requireRole('student'), async (req, res) => {
  const { resource_id, phone_number } = req.body;

  const { data: resource } = await supabase
    .from('resources')
    .select('id, teacher_id, price_kes, status, title')
    .eq('id', resource_id)
    .eq('status', 'approved')
    .single();

  if (!resource) return res.status(404).json({ error: 'Resource not available for purchase.' });

  const { data: settingRow } = await supabase
    .from('platform_settings')
    .select('value')
    .eq('key', 'commission_rate_default')
    .single();
  const commissionRate = Number(settingRow?.value ?? 0.5);

  const gross = Number(resource.price_kes);
  const commission = Math.round(gross * commissionRate * 100) / 100;
  const teacherEarnings = Math.round((gross - commission) * 100) / 100;

  const reference = `EH-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
  const { data: order, error: orderError } = await supabase
    .from('orders')
    .insert({
      student_id: req.user.id,
      resource_id: resource.id,
      gross_amount_kes: gross,
      commission_rate: commissionRate,
      commission_kes: commission,
      teacher_earnings_kes: teacherEarnings,
      status: 'pending',
      payment_reference: reference,
    })
    .select()
    .single();

  if (orderError) return res.status(500).json({ error: orderError.message });

  let paymentResult;
  try {
    paymentResult = await getPaymentAdapter().charge({ amountKes: gross, reference, phoneNumber: phone_number });
  } catch (err) {
    await supabase.from('orders').update({ status: 'failed' }).eq('id', order.id);
    return res.status(502).json({ error: err.message });
  }

  if (!paymentResult.success) {
    await supabase.from('orders').update({ status: 'failed' }).eq('id', order.id);
    return res.status(402).json({ error: 'Payment was not successful.' });
  }

  // The adapter may hand back a different reference (e.g. M-Pesa's
  // CheckoutRequestID) — that's what the callback will look up later.
  if (paymentResult.reference !== reference) {
    await supabase.from('orders').update({ payment_reference: paymentResult.reference }).eq('id', order.id);
  }

  // Dev adapter confirms immediately; M-Pesa and manual both stay pending
  // — M-Pesa until its callback arrives (routes/payments.js), manual
  // until the student submits a code and an admin confirms it below.
  if (paymentResult.status !== 'paid') {
    return res.status(202).json({ order: { ...order, status: 'pending' } });
  }

  await fulfillOrder(order);
  res.status(201).json({ order: { ...order, status: 'paid' } });
});

// Student submits the M-Pesa transaction code from their till/QR payment.
// This does NOT mark the order paid — it only queues it for an admin to
// cross-check against the till statement (see routes/admin.js).
router.post('/:id/submit-code', requireAuth, requireRole('student'), async (req, res) => {
  const { code } = req.body;
  if (!code || code.trim().length < 5) {
    return res.status(400).json({ error: 'Enter the full M-Pesa transaction code from your confirmation SMS.' });
  }

  const { data: order } = await supabase
    .from('orders')
    .select('id, status, student_id, resource:resource_id(title)')
    .eq('id', req.params.id)
    .eq('student_id', req.user.id)
    .single();

  if (!order) return res.status(404).json({ error: 'Order not found.' });
  if (order.status !== 'pending') return res.status(400).json({ error: 'This order is no longer awaiting payment.' });

  const { data, error } = await supabase
    .from('orders')
    .update({ manual_code: code.trim().toUpperCase() })
    .eq('id', order.id)
    .select()
    .single();

  if (error) return res.status(500).json({ error: error.message });

  await notifyAllAdmins({
    type: 'payment_verification_needed',
    message: `A payment code was submitted for "${order.resource.title}" — verify it in Admin > Pending payments.`,
  });

  res.json({ order: data });
});

// Client polls this while an M-Pesa order is pending, since confirmation
// arrives asynchronously via the callback rather than in the request above.
router.get('/:id/status', requireAuth, async (req, res) => {
  const { data, error } = await supabase
    .from('orders')
    .select('id, status')
    .eq('id', req.params.id)
    .eq('student_id', req.user.id)
    .single();

  if (error || !data) return res.status(404).json({ error: 'Order not found.' });
  res.json({ order: data });
});

// Student's purchase history.
router.get('/mine', requireAuth, requireRole('student'), async (req, res) => {
  const { data, error } = await supabase
    .from('orders')
    .select('id, gross_amount_kes, status, created_at, resource:resource_id(id, title, cover_image_path)')
    .eq('student_id', req.user.id)
    .order('created_at', { ascending: false });

  if (error) return res.status(500).json({ error: error.message });
  res.json({ orders: data });
});

// Protected download: only if a valid entitlement exists. Returns a
// short-lived signed URL from Supabase Storage rather than a public path.
router.get('/resources/:resourceId/download', requireAuth, async (req, res) => {
  const { data: entitlement } = await supabase
    .from('entitlements')
    .select('id')
    .eq('student_id', req.user.id)
    .eq('resource_id', req.params.resourceId)
    .maybeSingle();

  if (!entitlement) return res.status(403).json({ error: 'You have not purchased this resource.' });

  const { data: files } = await supabase
    .from('resource_files')
    .select('storage_path, file_name')
    .eq('resource_id', req.params.resourceId);

  const links = await Promise.all(
    (files || []).map(async (f) => {
      const { data: signed } = await supabase.storage
        .from('resource-files')
        .createSignedUrl(f.storage_path, 60 * 5); // 5-minute expiry
      return { file_name: f.file_name, url: signed?.signedUrl };
    })
  );

  res.json({ files: links });
});

export default router;
