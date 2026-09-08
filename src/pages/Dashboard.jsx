import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../lib/AuthContext';
import { api } from '../lib/api';
import AnnouncementCard from '../components/AnnouncementCard';
import EmptyState from '../components/EmptyState';

export default function Dashboard() {
  const { profile } = useAuth();
  const [announcements, setAnnouncements] = useState([]);
  const [resources, setResources] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const calls = [api.get('/announcements')];

    if (profile?.role === 'teacher') {
      calls.push(api.get('/resources/mine/list'));
      calls.push(api.get('/tutors/bookings/mine'));
    } else {
      calls.push(api.get('/orders/mine'));
    }

    Promise.all(calls)
      .then(([announcementRes, secondRes, thirdRes]) => {
        setAnnouncements(announcementRes.announcements || []);
        if (profile?.role === 'teacher') {
          setResources(secondRes.resources || []);
          setBookings(thirdRes?.bookings || []);
        } else {
          setResources((secondRes.orders || []).map((o) => o.resource));
        }
      })
      .finally(() => setLoaded(true));
  }, [profile]);

  if (!loaded) return <p className="text-muted">Loading...</p>;

  return (
    <div className="space-y-10">
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">
            {profile?.role === 'teacher' ? 'My resources' : 'My purchases'}
          </h2>
          {profile?.role === 'teacher' && (
            <Link to="/dashboard/upload" className="text-sm text-accent hover:underline">Upload resource</Link>
          )}
        </div>

        {resources.length === 0 ? (
          <EmptyState
            message={profile?.role === 'teacher' ? 'You have not uploaded a resource yet.' : 'You have not purchased anything yet.'}
            actionLabel={profile?.role === 'teacher' ? 'Upload a resource' : 'Browse resources'}
            onAction={() => (window.location.href = profile?.role === 'teacher' ? '/dashboard/upload' : '/marketplace')}
          />
        ) : (
          <div className="grid md:grid-cols-3 gap-4">
            {resources.map((r) => (
              <div key={r.id} className="bg-surface border border-border rounded-lg p-4">
                <p className="font-medium">{r.title}</p>
                {profile?.role === 'teacher' && (
                  <p className="text-xs text-muted mt-1 capitalize">{r.status.replace('_', ' ')}</p>
                )}
              </div>
            ))}
          </div>
        )}
      </section>

      {profile?.role === 'teacher' && (
        <section>
          <h2 className="text-lg font-semibold mb-4">Tutoring services</h2>
          {bookings.length === 0 ? (
            <EmptyState message="No bookings yet." actionLabel="Set up tutoring" onAction={() => (window.location.href = '/dashboard/tutoring')} />
          ) : (
            <div className="grid md:grid-cols-3 gap-4">
              {bookings.slice(0, 3).map((b) => (
                <div key={b.id} className="bg-surface border border-border rounded-lg p-4">
                  <p className="font-medium">{b.subject}</p>
                  <p className="text-sm text-muted">{b.session_date} · {b.status}</p>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      <section>
        <h2 className="text-lg font-semibold mb-4">Announcements</h2>
        {announcements.length === 0 ? (
          <EmptyState message="No announcements right now." />
        ) : (
          <div className="grid md:grid-cols-2 gap-4">
            {announcements.map((a) => (
              <AnnouncementCard key={a.id} announcement={a} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
