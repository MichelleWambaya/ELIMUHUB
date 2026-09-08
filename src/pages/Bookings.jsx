import { useEffect, useState } from 'react';
import { api } from '../lib/api';
import { useAuth } from '../lib/AuthContext';
import EmptyState from '../components/EmptyState';
import BackLink from '../components/BackLink';

export default function Bookings() {
  const { profile } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [loaded, setLoaded] = useState(false);

  async function load() {
    const res = await api.get('/tutors/bookings/mine');
    setBookings(res.bookings);
    setLoaded(true);
  }

  useEffect(() => {
    load();
  }, []);

  async function respond(id, decision) {
    await api.post(`/tutors/bookings/${id}/respond`, { decision });
    load();
  }

  const isTutor = profile?.role === 'teacher';

  return (
    <div className="max-w-2xl">
      <BackLink to="/dashboard" label="Back to dashboard" />
      <h1 className="text-2xl font-semibold mb-6">Bookings</h1>

      {!loaded ? (
        <p className="text-muted">Loading...</p>
      ) : bookings.length === 0 ? (
        <EmptyState message="No bookings yet." actionLabel={isTutor ? undefined : 'Find a tutor'} onAction={isTutor ? undefined : () => (window.location.href = '/tutors')} />
      ) : (
        <div className="space-y-3">
          {bookings.map((b) => (
            <div key={b.id} className="bg-surface border border-border rounded-lg p-4 flex items-center justify-between flex-wrap gap-3">
              <div>
                <p className="font-medium">{b.subject}</p>
                <p className="text-sm text-muted mt-1">
                  {b.session_date} · {b.start_time}–{b.end_time} · KES {Number(b.price_kes).toLocaleString()}
                </p>
                {b.notes && <p className="text-xs text-muted mt-1">{b.notes}</p>}
              </div>
              {isTutor && b.status === 'pending' ? (
                <div className="flex gap-2">
                  <button onClick={() => respond(b.id, 'confirmed')} className="text-sm bg-accent text-bg px-3 py-1.5 rounded-md">Accept</button>
                  <button onClick={() => respond(b.id, 'cancelled')} className="text-sm border border-border px-3 py-1.5 rounded-md">Decline</button>
                </div>
              ) : (
                <span className="text-sm text-muted capitalize">{b.status}</span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
