import express from 'express';
import { supabase } from '../lib/supabase.js';
import { requireAuth, requireRole } from '../middleware/auth.js';

export const router = express.Router();

router.get('/dashboard', requireAuth, requireRole('teacher'), async (req, res) => {
  const teacherId = req.user.id;

  const { data: resources } = await supabase
    .from('resources')
    .select('id', { count: 'exact' })
    .eq('teacher_id', teacherId);

  const { data: orders } = await supabase
    .from('orders')
    .select('gross_amount_kes, teacher_earnings_kes, status, created_at, resource:resource_id(teacher_id, title)')
    .eq('status', 'paid');

  const myOrders = (orders || []).filter((o) => o.resource?.teacher_id === teacherId);

  const { data: balance } = await supabase
    .from('teacher_balances')
    .select('pending_kes, available_kes')
    .eq('teacher_id', teacherId)
    .maybeSingle();

  const { data: bookings } = await supabase
    .from('bookings')
    .select('id, session_date, start_time, subject, status')
    .eq('tutor_id', teacherId)
    .eq('status', 'confirmed')
    .gte('session_date', new Date().toISOString().slice(0, 10))
    .order('session_date', { ascending: true })
    .limit(5);

  res.json({
    total_resources: resources?.length ?? 0,
    total_sales: myOrders.length,
    total_revenue_kes: myOrders.reduce((sum, o) => sum + Number(o.gross_amount_kes), 0),
    pending_balance_kes: Number(balance?.pending_kes ?? 0),
    available_balance_kes: Number(balance?.available_kes ?? 0),
    recent_orders: myOrders.slice(0, 5),
    upcoming_bookings: bookings || [],
  });
});

// Dedicated analytics endpoint — kept separate from the dashboard summary
// above so the UI can put analytics on its own page.
router.get('/analytics', requireAuth, requireRole('teacher'), async (req, res) => {
  const teacherId = req.user.id;

  const { data: orders } = await supabase
    .from('orders')
    .select('gross_amount_kes, teacher_earnings_kes, created_at, resource:resource_id(teacher_id, title)')
    .eq('status', 'paid');

  const myOrders = (orders || []).filter((o) => o.resource?.teacher_id === teacherId);

  const revenueByMonth = {};
  const salesByResource = {};
  for (const o of myOrders) {
    const month = o.created_at.slice(0, 7); // YYYY-MM
    revenueByMonth[month] = (revenueByMonth[month] || 0) + Number(o.gross_amount_kes);
    const title = o.resource?.title || 'Unknown';
    salesByResource[title] = (salesByResource[title] || 0) + 1;
  }

  res.json({
    revenue_by_month: revenueByMonth,
    sales_by_resource: salesByResource,
    total_earnings_kes: myOrders.reduce((sum, o) => sum + Number(o.teacher_earnings_kes), 0),
  });
});

// Teacher requests a payout of some or all of their available balance.
// Pending balance can't be withdrawn — it moves to available once the
// platform settles it (see admin/settlements/run).
router.post('/payouts/request', requireAuth, requireRole('teacher'), async (req, res) => {
  const { amount_kes } = req.body;
  const teacherId = req.user.id;

  const { data: balance } = await supabase.from('teacher_balances').select('*').eq('teacher_id', teacherId).maybeSingle();
  const available = Number(balance?.available_kes ?? 0);

  if (!amount_kes || amount_kes <= 0 || amount_kes > available) {
    return res.status(400).json({ error: `You can withdraw up to KES ${available}.` });
  }

  const { data: payout, error } = await supabase
    .from('payouts')
    .insert({ teacher_id: teacherId, amount_kes, status: 'pending' })
    .select()
    .single();

  if (error) return res.status(500).json({ error: error.message });

  await supabase
    .from('teacher_balances')
    .update({ available_kes: available - amount_kes })
    .eq('teacher_id', teacherId);

  res.status(201).json({ payout });
});

router.get('/payouts/mine', requireAuth, requireRole('teacher'), async (req, res) => {
  const { data, error } = await supabase
    .from('payouts')
    .select('*')
    .eq('teacher_id', req.user.id)
    .order('requested_at', { ascending: false });

  if (error) return res.status(500).json({ error: error.message });
  res.json({ payouts: data });
});

export default router;
