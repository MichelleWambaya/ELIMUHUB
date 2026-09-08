import express from 'express';
import { supabase } from '../lib/supabase.js';
import { requireAuth } from '../middleware/auth.js';

export const router = express.Router();

router.get('/', requireAuth, async (req, res) => {
  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .eq('user_id', req.user.id)
    .order('created_at', { ascending: false })
    .limit(30);

  if (error) return res.status(500).json({ error: error.message });
  res.json({ notifications: data });
});

router.post('/:id/read', requireAuth, async (req, res) => {
  const { data, error } = await supabase
    .from('notifications')
    .update({ read: true })
    .eq('id', req.params.id)
    .eq('user_id', req.user.id)
    .select()
    .single();

  if (error) return res.status(500).json({ error: error.message });
  res.json({ notification: data });
});

router.post('/read-all', requireAuth, async (req, res) => {
  const { error } = await supabase.from('notifications').update({ read: true }).eq('user_id', req.user.id).eq('read', false);
  if (error) return res.status(500).json({ error: error.message });
  res.json({ ok: true });
});

export default router;
