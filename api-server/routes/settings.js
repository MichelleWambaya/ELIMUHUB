import express from 'express';
import multer from 'multer';
import { supabase } from '../lib/supabase.js';
import { requireAuth } from '../middleware/auth.js';

export const router = express.Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });

// Profile photo. Stored in the public 'avatars' bucket (created by
// supabase/fixes.sql) since avatars are meant to be visible everywhere
// a person's name shows up.
router.post('/avatar', requireAuth, upload.single('avatar'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No image was attached.' });
  if (!req.file.mimetype.startsWith('image/')) {
    return res.status(400).json({ error: 'Avatar must be an image file.' });
  }

  const storagePath = `${req.user.id}/${Date.now()}-${req.file.originalname}`;
  const { error: uploadError } = await supabase.storage
    .from('avatars')
    .upload(storagePath, req.file.buffer, { contentType: req.file.mimetype, upsert: true });

  if (uploadError) return res.status(500).json({ error: uploadError.message });

  const { data: publicUrl } = supabase.storage.from('avatars').getPublicUrl(storagePath);

  const { data, error } = await supabase
    .from('profiles')
    .update({ avatar_url: publicUrl.publicUrl })
    .eq('id', req.user.id)
    .select('id, full_name, role, avatar_url')
    .single();

  if (error) return res.status(500).json({ error: error.message });
  res.json({ profile: data });
});

const DEFAULTS = {
  theme: 'dark',
  accent_color: '62 250 118',
  font_scale: 1.0,
  reduce_motion: false,
  high_contrast: false,
};

router.get('/preferences', requireAuth, async (req, res) => {
  const { data } = await supabase.from('user_settings').select('*').eq('user_id', req.user.id).maybeSingle();
  res.json({ preferences: data || { user_id: req.user.id, ...DEFAULTS } });
});

router.put('/preferences', requireAuth, async (req, res) => {
  const { theme, accent_color, font_scale, reduce_motion, high_contrast } = req.body;

  if (theme && !['dark', 'light'].includes(theme)) {
    return res.status(400).json({ error: 'Theme must be "dark" or "light".' });
  }
  if (font_scale && (font_scale < 0.85 || font_scale > 1.3)) {
    return res.status(400).json({ error: 'Font scale must be between 0.85 and 1.3.' });
  }

  const { data, error } = await supabase
    .from('user_settings')
    .upsert({
      user_id: req.user.id,
      theme: theme ?? DEFAULTS.theme,
      accent_color: accent_color ?? DEFAULTS.accent_color,
      font_scale: font_scale ?? DEFAULTS.font_scale,
      reduce_motion: reduce_motion ?? false,
      high_contrast: high_contrast ?? false,
      updated_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) return res.status(500).json({ error: error.message });
  res.json({ preferences: data });
});

export default router;
