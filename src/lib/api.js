import { supabase } from './supabaseClient';

const BASE_URL = import.meta.env.VITE_API_URL || '/api';

async function doFetch(path, options, token) {
  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });
  const body = await res.json().catch(() => ({}));
  return { res, body };
}

async function request(path, options = {}) {
  const { data } = await supabase.auth.getSession();
  let token = data.session?.access_token;

  let { res, body } = await doFetch(path, options, token);

  // A 401 here almost always means the access token expired between
  // page load and this request — getSession() only refreshes if
  // supabase-js's own expiry check already ran, which can lose a race
  // right after a long idle tab. One explicit refresh-and-retry clears
  // the large majority of "random" 401s without the person noticing.
  if (res.status === 401 && body.code === 'session_expired') {
    const { data: refreshed, error: refreshError } = await supabase.auth.refreshSession();
    if (!refreshError && refreshed.session) {
      token = refreshed.session.access_token;
      ({ res, body } = await doFetch(path, options, token));
    }
  }

  if (!res.ok) {
    const error = new Error(body.error || 'Request failed.');
    error.code = body.code;
    error.status = res.status;
    throw error;
  }
  return body;
}

export const api = {
  get: (path) => request(path),
  post: (path, body) => request(path, { method: 'POST', body: JSON.stringify(body) }),
  put: (path, body) => request(path, { method: 'PUT', body: JSON.stringify(body) }),
};

export async function getAccessToken() {
  const { data } = await supabase.auth.getSession();
  return data.session?.access_token;
}
