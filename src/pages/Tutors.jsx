import { useEffect, useState } from 'react';
import Navbar from '../components/Navbar';
import EmptyState from '../components/EmptyState';
import { api } from '../lib/api';
import { useAuth } from '../lib/AuthContext';

export default function Tutors() {
  const [tutors, setTutors] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const { session } = useAuth();

  useEffect(() => {
    api.get('/tutors').then((res) => setTutors(res.tutors)).finally(() => setLoaded(true));
  }, []);

  async function requestBooking(tutorId) {
    if (!session) return (window.location.href = '/login');
    const subject = window.prompt('Which subject?');
    const date = window.prompt('Session date (YYYY-MM-DD)?');
    if (!subject || !date) return;
    await api.post('/tutors/bookings', {
      tutor_id: tutorId,
      subject,
      session_date: date,
      start_time: '16:00',
      end_time: '17:00',
    });
    alert('Booking request sent.');
  }

  return (
    <div>
      <Navbar />
      <div className="max-w-6xl mx-auto px-6 py-10">
        <h1 className="text-2xl font-semibold mb-8">Find a tutor</h1>

        {!loaded ? (
          <p className="text-muted">Loading...</p>
        ) : tutors.length === 0 ? (
          <EmptyState message="No tutors are listed yet." />
        ) : (
          <div className="grid md:grid-cols-3 gap-5">
            {tutors.map((t) => (
              <div key={t.user_id} className="bg-surface border border-border rounded-lg p-5">
                <p className="font-medium">{t.profile?.full_name}</p>
                <p className="text-sm text-muted mt-1">{(t.subjects || []).join(', ')}</p>
                <p className="text-sm text-muted">{t.teaching_mode} · {t.years_experience || 0} yrs experience</p>
                <p className="font-semibold mt-3">KES {Number(t.hourly_rate_kes).toLocaleString()}/hr</p>
                <button
                  onClick={() => requestBooking(t.user_id)}
                  className="mt-4 w-full bg-accent text-bg font-medium py-2 rounded-md hover:bg-accentDim transition-colors"
                >
                  Request a session
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
