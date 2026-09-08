import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../lib/api';
import EmptyState from '../components/EmptyState';
import BackLink from '../components/BackLink';

export default function Saved() {
  const [saved, setSaved] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState('');

  async function load() {
    try {
      const res = await api.get('/resources/saved/mine');
      setSaved(res.saved);
    } catch (err) {
      setError(err.message || 'Could not load saved resources.');
    } finally {
      setLoaded(true);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function remove(resourceId) {
    await api.delete(`/resources/${resourceId}/save`);
    setSaved((s) => s.filter((item) => item.resource.id !== resourceId));
  }

  return (
    <div>
      <BackLink to="/dashboard" label="Back to dashboard" />
      <h1 className="text-2xl font-semibold mb-6">Saved</h1>

      {!loaded ? (
        <p className="text-muted">Loading...</p>
      ) : error ? (
        <p className="text-sm text-red-400">{error}</p>
      ) : saved.length === 0 ? (
        <EmptyState message="Resources you save will show up here." actionLabel="Browse resources" onAction={() => (window.location.href = '/marketplace')} />
      ) : (
        <div className="grid md:grid-cols-3 gap-4">
          {saved.map((item) => (
            <div key={item.id} className="bg-surface border border-border rounded-lg p-4">
              <Link to={`/marketplace/${item.resource.id}`} className="font-medium hover:text-accent transition-colors">
                {item.resource.title}
              </Link>
              <p className="text-sm text-muted mt-1">KES {Number(item.resource.price_kes).toLocaleString()}</p>
              <button onClick={() => remove(item.resource.id)} className="text-xs text-muted hover:text-ink mt-2">
                Remove
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
