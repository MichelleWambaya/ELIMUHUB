import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../lib/api';
import EmptyState from '../components/EmptyState';
import BackLink from '../components/BackLink';

const STATUS_STYLES = {
  draft: 'text-muted',
  pending_review: 'text-amber-400',
  approved: 'text-accent',
  changes_requested: 'text-amber-400',
  rejected: 'text-red-400',
};

export default function MyResources() {
  const [resources, setResources] = useState([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    api.get('/resources/mine/list').then((res) => setResources(res.resources)).finally(() => setLoaded(true));
  }, []);

  return (
    <div>
      <BackLink to="/dashboard" label="Back to dashboard" />
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold">My resources</h1>
        <Link to="/dashboard/upload" className="text-sm text-accent hover:underline">Upload resource</Link>
      </div>

      {!loaded ? (
        <p className="text-muted">Loading...</p>
      ) : resources.length === 0 ? (
        <EmptyState message="You have not uploaded a resource yet." actionLabel="Upload a resource" onAction={() => (window.location.href = '/dashboard/upload')} />
      ) : (
        <div className="space-y-3">
          {resources.map((r) => (
            <div key={r.id} className="bg-surface border border-border rounded-lg p-4 flex items-center justify-between flex-wrap gap-2">
              <div>
                <p className="font-medium">{r.title}</p>
                <p className="text-sm text-muted mt-1">KES {Number(r.price_kes).toLocaleString()}</p>
                {r.status === 'rejected' && r.rejection_reason && (
                  <p className="text-xs text-red-400 mt-1">{r.rejection_reason}</p>
                )}
              </div>
              <span className={`text-sm capitalize font-medium ${STATUS_STYLES[r.status] || 'text-muted'}`}>
                {r.status.replace('_', ' ')}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
