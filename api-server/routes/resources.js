import express from 'express';
import multer from 'multer';
import { supabase } from '../lib/supabase.js';
import { requireAuth, requireRole } from '../middleware/auth.js';

export const router = express.Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 25 * 1024 * 1024 } });

// Public marketplace: only approved resources, real data only.
router.get('/', async (req, res) => {
  const { subject_id, education_level_id, category_id, q } = req.query;

  let query = supabase
    .from('resources')
    .select(
      'id, title, description, price_kes, cover_image_path, created_at, updated_at, teacher:teacher_id(full_name), subjects:subject_id(name), education_levels:education_level_id(name), categories:category_id(name)'
    )
    .eq('status', 'approved')
    .order('created_at', { ascending: false });

  if (subject_id) query = query.eq('subject_id', subject_id);
  if (education_level_id) query = query.eq('education_level_id', education_level_id);
  if (category_id) query = query.eq('category_id', category_id);
  if (q) query = query.ilike('title', `%${q}%`);

  const { data, error } = await query;
  if (error) return res.status(500).json({ error: error.message });
  res.json({ resources: data });
});

router.get('/:id', async (req, res) => {
  const { data, error } = await supabase
    .from('resources')
    .select(
      'id, title, description, price_kes, status, cover_image_path, preview_file_path, created_at, updated_at, teacher:teacher_id(id, full_name)'
    )
    .eq('id', req.params.id)
    .eq('status', 'approved')
    .single();

  if (error || !data) return res.status(404).json({ error: 'Resource not found.' });
  res.json({ resource: data });
});

// Teacher: create a draft resource.
router.post('/', requireAuth, requireRole('teacher'), async (req, res) => {
  const { title, description, category_id, subject_id, education_level_id, price_kes } = req.body;
  if (!title || !description) return res.status(400).json({ error: 'Title and description are required.' });

  const { data: subscription } = await supabase
    .from('subscriptions')
    .select('plan:plan_id(max_resources, name)')
    .eq('teacher_id', req.user.id)
    .eq('status', 'active')
    .maybeSingle();

  const { data: freePlan } = await supabase.from('subscription_plans').select('max_resources').eq('name', 'Free').single();
  const maxResources = subscription?.plan?.max_resources ?? freePlan?.max_resources ?? null;

  if (maxResources !== null) {
    const { count } = await supabase
      .from('resources')
      .select('id', { count: 'exact', head: true })
      .eq('teacher_id', req.user.id);

    if ((count ?? 0) >= maxResources) {
      return res.status(403).json({
        error: `Your plan allows up to ${maxResources} resources. Upgrade your subscription to add more.`,
      });
    }
  }

  const { data, error } = await supabase
    .from('resources')
    .insert({
      teacher_id: req.user.id,
      title,
      description,
      category_id,
      subject_id,
      education_level_id,
      price_kes,
      status: 'draft',
    })
    .select()
    .single();

  if (error) return res.status(500).json({ error: error.message });
  res.status(201).json({ resource: data });
});

// Teacher: list own resources with real status, no fabricated data.
router.get('/mine/list', requireAuth, requireRole('teacher'), async (req, res) => {
  const { data, error } = await supabase
    .from('resources')
    .select('id, title, price_kes, status, rejection_reason, created_at, updated_at')
    .eq('teacher_id', req.user.id)
    .order('updated_at', { ascending: false });

  if (error) return res.status(500).json({ error: error.message });
  res.json({ resources: data });
});

// Teacher: submit a draft for review.
router.post('/:id/submit', requireAuth, requireRole('teacher'), async (req, res) => {
  const { data: resource } = await supabase
    .from('resources')
    .select('id, teacher_id, status')
    .eq('id', req.params.id)
    .single();

  if (!resource || resource.teacher_id !== req.user.id) {
    return res.status(404).json({ error: 'Resource not found.' });
  }
  if (!['draft', 'changes_requested'].includes(resource.status)) {
    return res.status(400).json({ error: 'Only drafts or resources needing changes can be submitted.' });
  }

  const { data, error } = await supabase
    .from('resources')
    .update({ status: 'pending_review', updated_at: new Date().toISOString() })
    .eq('id', req.params.id)
    .select()
    .single();

  if (error) return res.status(500).json({ error: error.message });
  res.json({ resource: data });
});

// Admin: queue of resources awaiting a moderation decision.
router.get('/admin/queue', requireAuth, requireRole('admin'), async (req, res) => {
  const { data, error } = await supabase
    .from('resources')
    .select('id, title, price_kes, status, created_at, teacher:teacher_id(full_name)')
    .eq('status', 'pending_review')
    .order('created_at', { ascending: true });

  if (error) return res.status(500).json({ error: error.message });
  res.json({ resources: data });
});

// Admin: approve / request changes / reject, with an audit trail.
router.post('/:id/moderate', requireAuth, requireRole('admin'), async (req, res) => {
  const { decision, notes } = req.body; // 'approved' | 'changes_requested' | 'rejected'
  if (!['approved', 'changes_requested', 'rejected'].includes(decision)) {
    return res.status(400).json({ error: 'Invalid decision.' });
  }

  const { data, error } = await supabase
    .from('resources')
    .update({
      status: decision,
      rejection_reason: decision === 'rejected' ? notes : null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', req.params.id)
    .select()
    .single();

  if (error) return res.status(500).json({ error: error.message });

  await supabase.from('moderation_reviews').insert({
    resource_id: req.params.id,
    reviewer_id: req.user.id,
    decision,
    notes,
  });

  await supabase.from('notifications').insert({
    user_id: data.teacher_id,
    type: `resource_${decision}`,
    message:
      decision === 'approved'
        ? `"${data.title}" was approved and is now listed.`
        : decision === 'changes_requested'
        ? `Changes were requested on "${data.title}".`
        : `"${data.title}" was rejected. ${notes || ''}`.trim(),
  });

  res.json({ resource: data });
});

// Teacher: upload a downloadable file onto a draft/changes-requested resource.
// Stored in the private 'resource-files' bucket — never a public path.
router.post('/:id/files', requireAuth, requireRole('teacher'), upload.single('file'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file was attached.' });

  const { data: resource } = await supabase
    .from('resources')
    .select('id, teacher_id')
    .eq('id', req.params.id)
    .single();

  if (!resource || resource.teacher_id !== req.user.id) {
    return res.status(404).json({ error: 'Resource not found.' });
  }

  const storagePath = `${req.user.id}/${resource.id}/${Date.now()}-${req.file.originalname}`;
  const { error: uploadError } = await supabase.storage
    .from('resource-files')
    .upload(storagePath, req.file.buffer, { contentType: req.file.mimetype });

  if (uploadError) return res.status(500).json({ error: uploadError.message });

  const { data, error } = await supabase
    .from('resource_files')
    .insert({ resource_id: resource.id, storage_path: storagePath, file_name: req.file.originalname })
    .select()
    .single();

  if (error) return res.status(500).json({ error: error.message });
  res.status(201).json({ file: data });
});

router.get('/:id/files', requireAuth, requireRole('teacher'), async (req, res) => {
  const { data: resource } = await supabase.from('resources').select('teacher_id').eq('id', req.params.id).single();
  if (!resource || resource.teacher_id !== req.user.id) return res.status(404).json({ error: 'Resource not found.' });

  const { data, error } = await supabase
    .from('resource_files')
    .select('id, file_name, created_at')
    .eq('resource_id', req.params.id);

  if (error) return res.status(500).json({ error: error.message });
  res.json({ files: data });
});

// Teacher: upload a cover image. Stored in a public bucket since covers
// are meant to be visible in marketplace listings before purchase.
router.post('/:id/cover', requireAuth, requireRole('teacher'), upload.single('cover'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No image was attached.' });

  const { data: resource } = await supabase
    .from('resources')
    .select('id, teacher_id')
    .eq('id', req.params.id)
    .single();

  if (!resource || resource.teacher_id !== req.user.id) {
    return res.status(404).json({ error: 'Resource not found.' });
  }

  const storagePath = `${resource.id}/${Date.now()}-${req.file.originalname}`;
  const { error: uploadError } = await supabase.storage
    .from('resource-covers')
    .upload(storagePath, req.file.buffer, { contentType: req.file.mimetype, upsert: true });

  if (uploadError) return res.status(500).json({ error: uploadError.message });

  const { data: publicUrl } = supabase.storage.from('resource-covers').getPublicUrl(storagePath);

  const { data, error } = await supabase
    .from('resources')
    .update({ cover_image_path: publicUrl.publicUrl })
    .eq('id', resource.id)
    .select()
    .single();

  if (error) return res.status(500).json({ error: error.message });
  res.json({ resource: data });
});

export default router;
