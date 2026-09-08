import { useEffect, useState } from 'react';
import { api } from '../lib/api';
import EmptyState from '../components/EmptyState';
import BackLink from '../components/BackLink';

export default function Learners() {
  const [learners, setLearners] = useState([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    api.get('/tutors/learners').then((res) => setLearners(res.learners)).finally(() => setLoaded(true));
  }, []);

  return (
    <div className="max-w-2xl">
      <BackLink to="/dashboard" label="Back to dashboard" />
      <h1 className="text-2xl font-semibold mb-6">Learners</h1>

      {!loaded ? (
        <p className="text-muted">Loading...</p>
      ) : learners.length === 0 ? (
        <EmptyState message="Learners appear here once a booking turns into an ongoing arrangement." />
      ) : (
        <div className="space-y-3">
          {learners.map((l) => (
            <div key={l.id} className="bg-surface border border-border rounded-lg p-4">
              <p className="font-medium">{l.student?.full_name}</p>
              <p className="text-sm text-muted mt-1">{l.subject}{l.education_level ? ` · ${l.education_level}` : ''}</p>
              {l.notes && <p className="text-xs text-muted mt-1">{l.notes}</p>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
