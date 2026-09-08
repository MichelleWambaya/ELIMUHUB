import express from 'express';
import multer from 'multer';
import { supabase } from '../lib/supabase.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { fulfillOrder } from '../lib/orderFulfillment.js';
import { registerC2BUrls } from '../lib/darajaClient.js';

export const router = express.Router();
router.use(requireAuth, requireRole('admin'));
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });

// One-time (or one-time-per-domain-change) action: tells Safaricom where
// to send C2B confirmations for this shortcode. Needs DARAJA_* env vars
// set, including DARAJA_C2B_VALIDATION_URL / DARAJA_C2B_CONFIRMATION_URL.
router.post('/mpesa/register-c2b', async (req, res) => {
  try {
    const result = await registerC2BUrls();
    res.json({ registered: true, result });
  } catch (err) {
    res.status(502).json({ error: err.message });
  }
});

// Till payments that came in but couldn't be auto-matched to exactly one
// pending order (amount collision, or no matching order at all).
router.get('/c2b/unmatched', async (req, res) => {
  const { data, error } = await supabase
    .from('c2b_transactions')
    .select('*')
    .is('matched_order_id', null)
    .order('created_at', { ascending: false });

  if (error) return res.status(500).json({ error: error.message });
  res.json({ transactions: data });
});

// Pending orders an admin can manually link an unmatched transaction to.
router.get('/orders/awaiting-payment', async (req, res) => {
  const { data, error } = await supabase
    .from('orders')
    .select('id, gross_amount_kes, created_at, student:student_id(full_name), resource:resource_id(title)')
    .eq('status', 'pending')
    .order('created_at', { ascending: true });

  if (error) return res.status(500).json({ error: error.message });
  res.json({ orders: data });
});

router.post('/c2b/:id/match', async (req, res) => {
  const { order_id } = req.body;

  const { data: order } = await supabase.from('orders').select('*').eq('id', order_id).eq('status', 'pending').single();
  if (!order) return res.status(404).json({ error: 'That order is not awaiting payment.' });

  await fulfillOrder(order);
  await supabase.from('c2b_transactions').update({ matched_order_id: order.id }).eq('id', req.params.id);
  await supabase.from('audit_log').insert({ actor_id: req.user.id, action: 'c2b_manual_match', target_table: 'orders', target_id: order.id });

  res.json({ matched: true });
});

router.get('/overview', async (req, res) => {
  const [{ count: users }, { count: teachers }, { count: students }, { count: resources }, { count: pending }] =
    await Promise.all([
      supabase.from('profiles').select('id', { count: 'exact', head: true }),
      supabase.from('teacher_profiles').select('user_id', { count: 'exact', head: true }),
      supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('role', 'student'),
      supabase.from('resources').select('id', { count: 'exact', head: true }).eq('status', 'approved'),
      supabase.from('resources').select('id', { count: 'exact', head: true }).eq('status', 'pending_review'),
    ]);

  const { data: paidOrders } = await supabase.from('orders').select('gross_amount_kes, commission_kes').eq('status', 'paid');

  res.json({
    total_users: users ?? 0,
    active_teachers: teachers ?? 0,
    students: students ?? 0,
    listed_resources: resources ?? 0,
    pending_reviews: pending ?? 0,
    gross_marketplace_sales_kes: (paidOrders || []).reduce((s, o) => s + Number(o.gross_amount_kes), 0),
    platform_revenue_kes: (paidOrders || []).reduce((s, o) => s + Number(o.commission_kes), 0),
  });
});

router.get('/users', async (req, res) => {
  const { data, error } = await supabase.from('profiles').select('id, full_name, role, created_at').order('created_at', { ascending: false });
  if (error) return res.status(500).json({ error: error.message });
  res.json({ users: data });
});

router.post('/users/:id/suspend', async (req, res) => {
  const { error } = await supabase.auth.admin.updateUserById(req.params.id, { ban_duration: '876000h' });
  if (error) return res.status(500).json({ error: error.message });

  await supabase.from('audit_log').insert({ actor_id: req.user.id, action: 'suspend_user', target_table: 'profiles', target_id: req.params.id });
  res.json({ suspended: true });
});

router.get('/settings/commission', async (req, res) => {
  const { data } = await supabase.from('platform_settings').select('value').eq('key', 'commission_rate_default').single();
  res.json({ commission_rate_default: Number(data?.value ?? 0.5) });
});

router.put('/settings/commission', async (req, res) => {
  const { rate } = req.body;
  if (typeof rate !== 'number' || rate < 0 || rate > 1) {
    return res.status(400).json({ error: 'Rate must be a number between 0 and 1.' });
  }

  const { error } = await supabase.from('platform_settings').upsert({ key: 'commission_rate_default', value: rate });
  if (error) return res.status(500).json({ error: error.message });

  await supabase.from('audit_log').insert({ actor_id: req.user.id, action: 'update_commission_rate' });
  res.json({ commission_rate_default: rate });
});

router.get('/payouts', async (req, res) => {
  const { data, error } = await supabase.from('payouts').select('*, teacher:teacher_id(full_name)').order('requested_at', { ascending: false });
  if (error) return res.status(500).json({ error: error.message });
  res.json({ payouts: data });
});

router.post('/payouts/:id/mark-paid', async (req, res) => {
  const { data, error } = await supabase
    .from('payouts')
    .update({ status: 'paid', paid_at: new Date().toISOString() })
    .eq('id', req.params.id)
    .select()
    .single();

  if (error) return res.status(500).json({ error: error.message });
  await supabase.from('audit_log').insert({ actor_id: req.user.id, action: 'payout_marked_paid', target_table: 'payouts', target_id: req.params.id });
  res.json({ payout: data });
});

// Moves every teacher's pending balance into their available (withdrawable)
// balance. In production this would run on a schedule after a refund
// window — exposed here as an explicit admin action rather than invented
// automatic timing.
router.post('/settlements/run', async (req, res) => {
  const { data: balances, error } = await supabase.from('teacher_balances').select('*').gt('pending_kes', 0);
  if (error) return res.status(500).json({ error: error.message });

  for (const b of balances) {
    await supabase
      .from('teacher_balances')
      .update({
        pending_kes: 0,
        available_kes: Number(b.available_kes) + Number(b.pending_kes),
      })
      .eq('teacher_id', b.teacher_id);
  }

  await supabase.from('audit_log').insert({ actor_id: req.user.id, action: 'settlements_run' });
  res.json({ settled_teachers: balances.length });
});

// Orders awaiting manual verification: a student submitted a transaction
// code, and it needs to be checked against the real till statement.
router.get('/orders/pending', async (req, res) => {
  const { data, error } = await supabase
    .from('orders')
    .select('id, gross_amount_kes, manual_code, created_at, student:student_id(full_name), resource:resource_id(title)')
    .eq('status', 'pending')
    .not('manual_code', 'is', null)
    .order('created_at', { ascending: true });

  if (error) return res.status(500).json({ error: error.message });
  res.json({ orders: data });
});

router.post('/orders/:id/confirm', async (req, res) => {
  const { data: order } = await supabase
    .from('orders')
    .select('id, resource_id, student_id, teacher_earnings_kes, status')
    .eq('id', req.params.id)
    .single();

  if (!order) return res.status(404).json({ error: 'Order not found.' });
  if (order.status !== 'pending') return res.status(400).json({ error: 'This order was already resolved.' });

  await fulfillOrder(order);
  await supabase.from('audit_log').insert({ actor_id: req.user.id, action: 'manual_payment_confirmed', target_table: 'orders', target_id: order.id });
  res.json({ confirmed: true });
});

router.post('/orders/:id/reject', async (req, res) => {
  const { reason } = req.body;
  const { data: order } = await supabase
    .from('orders')
    .select('id, student_id, status, resource:resource_id(title)')
    .eq('id', req.params.id)
    .single();

  if (!order) return res.status(404).json({ error: 'Order not found.' });
  if (order.status !== 'pending') return res.status(400).json({ error: 'This order was already resolved.' });

  await supabase.from('orders').update({ status: 'failed' }).eq('id', order.id);
  await supabase.from('notifications').insert({
    user_id: order.student_id,
    type: 'payment_failed',
    message: `Your payment code for "${order.resource.title}" could not be verified. ${reason || ''}`.trim(),
  });
  await supabase.from('audit_log').insert({ actor_id: req.user.id, action: 'manual_payment_rejected', target_table: 'orders', target_id: order.id });

  res.json({ rejected: true });
});

// Till number + QR shown to students on the manual payment checkout screen.
router.get('/settings/till', async (req, res) => {
  const { data } = await supabase.from('platform_settings').select('key, value').in('key', ['till_number', 'till_qr_url']);
  const settings = Object.fromEntries((data || []).map((row) => [row.key, row.value]));
  res.json({ till_number: settings.till_number || '', till_qr_url: settings.till_qr_url || '' });
});

router.put('/settings/till', async (req, res) => {
  const { till_number } = req.body;
  await supabase.from('platform_settings').upsert({ key: 'till_number', value: till_number });
  res.json({ till_number });
});

router.post('/settings/till/qr', upload.single('qr'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No image was attached.' });

  const path = `till-qr-${Date.now()}-${req.file.originalname}`;
  const { error: uploadError } = await supabase.storage
    .from('platform-assets')
    .upload(path, req.file.buffer, { contentType: req.file.mimetype, upsert: true });

  if (uploadError) return res.status(500).json({ error: uploadError.message });

  const { data: publicUrl } = supabase.storage.from('platform-assets').getPublicUrl(path);
  await supabase.from('platform_settings').upsert({ key: 'till_qr_url', value: publicUrl.publicUrl });

  res.json({ till_qr_url: publicUrl.publicUrl });
});

export default router;
