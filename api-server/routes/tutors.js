import express from 'express';
import { supabase } from '../lib/supabase.js';
import { requireAuth, requireRole } from '../middleware/auth.js';

export const router = express.Router();

// Public tutor discovery — only real, existing profiles.
router.get('/', async (req, res) => {
  const { subject, teaching_mode } = req.query;

  let query = supabase
    .from('tutor_profiles')
    .select('user_id, bio, subjects, education_levels, years_experience, teaching_mode, location, hourly_rate_kes, profile:user_id(full_name, avatar_url)')
    .eq('verified', true);

  if (teaching_mode) query = query.eq('teaching_mode', teaching_mode);
  if (subject) query = query.contains('subjects', [subject]);

  const { data, error } = await query;
  if (error) return res.status(500).json({ error: error.message });
  res.json({ tutors: data });
});

router.post('/profile', requireAuth, async (req, res) => {
  const { bio, subjects, education_levels, qualifications, years_experience, teaching_mode, location, hourly_rate_kes } = req.body;

  const { data, error } = await supabase
    .from('tutor_profiles')
    .upsert({
      user_id: req.user.id,
      bio,
      subjects,
      education_levels,
      qualifications,
      years_experience,
      teaching_mode,
      location,
      hourly_rate_kes,
    })
    .select()
    .single();

  if (error) return res.status(500).json({ error: error.message });
  res.json({ tutor_profile: data });
});

router.post('/availability', requireAuth, async (req, res) => {
  const { slots } = req.body; // [{ day_of_week, start_time, end_time }]
  await supabase.from('availability').delete().eq('tutor_id', req.user.id);
  const { data, error } = await supabase
    .from('availability')
    .insert(slots.map((s) => ({ ...s, tutor_id: req.user.id })))
    .select();

  if (error) return res.status(500).json({ error: error.message });
  res.json({ availability: data });
});

// Student requests a booking.
router.post('/bookings', requireAuth, requireRole('student'), async (req, res) => {
  const { tutor_id, subject, session_date, start_time, end_time, notes } = req.body;

  const { data: tutor } = await supabase
    .from('tutor_profiles')
    .select('hourly_rate_kes')
    .eq('user_id', tutor_id)
    .single();

  if (!tutor) return res.status(404).json({ error: 'Tutor not found.' });

  const { data, error } = await supabase
    .from('bookings')
    .insert({
      student_id: req.user.id,
      tutor_id,
      subject,
      session_date,
      start_time,
      end_time,
      price_kes: tutor.hourly_rate_kes,
      notes,
      status: 'pending',
    })
    .select()
    .single();

  if (error) return res.status(500).json({ error: error.message });

  await supabase.from('notifications').insert({
    user_id: tutor_id,
    type: 'booking_request',
    message: `New booking request for ${subject} on ${session_date}.`,
  });

  res.status(201).json({ booking: data });
});

// Tutor accepts/rejects a booking.
router.post('/bookings/:id/respond', requireAuth, async (req, res) => {
  const { decision } = req.body; // 'confirmed' | 'cancelled'
  const { data: booking } = await supabase.from('bookings').select('*').eq('id', req.params.id).single();

  if (!booking || booking.tutor_id !== req.user.id) return res.status(404).json({ error: 'Booking not found.' });

  const { data, error } = await supabase
    .from('bookings')
    .update({ status: decision })
    .eq('id', req.params.id)
    .select()
    .single();

  if (error) return res.status(500).json({ error: error.message });

  await supabase.from('notifications').insert({
    user_id: booking.student_id,
    type: `booking_${decision}`,
    message: `Your booking for ${booking.subject} was ${decision}.`,
  });

  res.json({ booking: data });
});

router.get('/bookings/mine', requireAuth, async (req, res) => {
  const column = req.user.role === 'teacher' ? 'tutor_id' : 'student_id';
  const { data, error } = await supabase
    .from('bookings')
    .select('*')
    .eq(column, req.user.id)
    .order('session_date', { ascending: true });

  if (error) return res.status(500).json({ error: error.message });
  res.json({ bookings: data });
});

// Simple learner CRM — only learners with a real booking/enrollment relationship.
router.get('/learners', requireAuth, async (req, res) => {
  const { data, error } = await supabase
    .from('learners')
    .select('*, student:student_id(full_name)')
    .eq('tutor_id', req.user.id);

  if (error) return res.status(500).json({ error: error.message });
  res.json({ learners: data });
});

export default router;
