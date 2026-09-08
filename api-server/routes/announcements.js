import express from 'express';
import { supabase } from '../lib/supabase.js';
import { requireAuth, requireRole } from '../middleware/auth.js';

export const router = express.Router();

router.get('/', requireAuth, async (req, res) => {
  const { data, error } = await supabase
    .from('announcements')
    .select('*')
    .or(`audience.is.null,audience.eq.${req.user.role}`)
    .order('created_at', { ascending: false })
    .limit(10);

  if (error) return res.status(500).json({ error: error.message });
  res.json({ announcements: data });
});

router.post('/', requireAuth, requireRole('admin'), async (req, res) => {
  const { title, body, audience } = req.body;
  const { data, error } = await supabase.from('announcements').insert({ title, body, audience: audience || null }).select().single();
  if (error) return res.status(500).json({ error: error.message });
  res.status(201).json({ announcement: data });
});

export default router;
