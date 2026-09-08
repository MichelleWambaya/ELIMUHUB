import express from 'express';
import { supabase } from '../lib/supabase.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { getPaymentAdapter } from '../lib/payments.js';

export const router = express.Router();

router.get('/plans', async (req, res) => {
  const { data, error } = await supabase
    .from('subscription_plans')
    .select('*')
    .eq('active', true)
    .order('price_kes', { ascending: true });

  if (error) return res.status(500).json({ error: error.message });
  res.json({ plans: data });
});

router.get('/mine', requireAuth, requireRole('teacher'), async (req, res) => {
  const { data, error } = await supabase
    .from('subscriptions')
    .select('*, plan:plan_id(*)')
    .eq('teacher_id', req.user.id)
    .eq('status', 'active')
    .order('started_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) return res.status(500).json({ error: error.message });
  res.json({ subscription: data });
});

// Teacher subscribes to a plan. Free plans skip payment entirely.
router.post('/subscribe', requireAuth, requireRole('teacher'), async (req, res) => {
  const { plan_id, phone_number } = req.body;

  const { data: plan } = await supabase.from('subscription_plans').select('*').eq('id', plan_id).single();
  if (!plan) return res.status(404).json({ error: 'Plan not found.' });

  let reference = null;
  if (Number(plan.price_kes) > 0) {
    reference = `SUB-${Date.now()}`;
    try {
      const result = await getPaymentAdapter().charge({ amountKes: plan.price_kes, reference, phoneNumber: phone_number });
      if (result.status !== 'paid') {
        return res.status(202).json({ message: 'Payment initiated. Check your phone to complete it, then check back.' });
      }
      reference = result.reference;
    } catch (err) {
      return res.status(502).json({ error: err.message });
    }
  }

  await supabase.from('subscriptions').update({ status: 'expired' }).eq('teacher_id', req.user.id).eq('status', 'active');

  const renewsAt = new Date();
  renewsAt.setDate(renewsAt.getDate() + (plan.billing_period === 'yearly' ? 365 : 30));

  const { data, error } = await supabase
    .from('subscriptions')
    .insert({
      teacher_id: req.user.id,
      plan_id: plan.id,
      status: 'active',
      payment_reference: reference,
      renews_at: renewsAt.toISOString(),
    })
    .select('*, plan:plan_id(*)')
    .single();

  if (error) return res.status(500).json({ error: error.message });
  res.status(201).json({ subscription: data });
});

// Admin: manage plans.
router.post('/plans', requireAuth, requireRole('admin'), async (req, res) => {
  const { name, price_kes, billing_period, max_resources, featured_listings, description } = req.body;
  const { data, error } = await supabase
    .from('subscription_plans')
    .insert({ name, price_kes, billing_period, max_resources, featured_listings, description })
    .select()
    .single();

  if (error) return res.status(500).json({ error: error.message });
  res.status(201).json({ plan: data });
});

router.put('/plans/:id', requireAuth, requireRole('admin'), async (req, res) => {
  const { data, error } = await supabase
    .from('subscription_plans')
    .update(req.body)
    .eq('id', req.params.id)
    .select()
    .single();

  if (error) return res.status(500).json({ error: error.message });
  res.json({ plan: data });
});

export default router;
