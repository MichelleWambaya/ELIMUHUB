import { supabase } from '../lib/supabase.js';

export async function requireAuth(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Not signed in.', code: 'not_signed_in' });
  }

  const token = header.slice('Bearer '.length).trim();
  if (!token) {
    return res.status(401).json({ error: 'Not signed in.', code: 'not_signed_in' });
  }

  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data.user) {
    // Distinct code so the frontend can tell "your session expired, log
    // in again" apart from "you were never logged in" — both used to
    // come back identically, which made silent-refresh-and-retry logic
    // impossible to write correctly.
    return res.status(401).json({ error: 'Session expired. Sign in again.', code: 'session_expired' });
  }

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('id, full_name, role, avatar_url')
    .eq('id', data.user.id)
    .single();

  if (profileError || !profile) {
    // The auth user exists but has no matching profiles row — usually
    // means signup's profile insert failed or hasn't landed yet, not that
    // the person isn't logged in. 401 here was misleading; 404 is honest.
    return res.status(404).json({ error: 'Your account profile could not be found.', code: 'profile_not_found' });
  }

  req.user = profile;
  next();
}

export function requireRole(...roles) {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'You do not have access to this.', code: 'forbidden' });
    }
    next();
  };
}
