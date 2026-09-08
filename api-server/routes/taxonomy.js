import express from 'express';
import { supabase } from '../lib/supabase.js';

export const router = express.Router();

// Powers the filter dropdowns on Marketplace and the category/subject/
// level pickers on UploadResource. Public — no auth required.
router.get('/', async (req, res) => {
  const [categories, subjects, educationLevels] = await Promise.all([
    supabase.from('categories').select('id, name').order('name'),
    supabase.from('subjects').select('id, name').order('name'),
    supabase.from('education_levels').select('id, name').order('name'),
  ]);

  const firstError = categories.error || subjects.error || educationLevels.error;
  if (firstError) return res.status(500).json({ error: firstError.message });

  res.json({
    categories: categories.data || [],
    subjects: subjects.data || [],
    education_levels: educationLevels.data || [],
  });
});

export default router;
