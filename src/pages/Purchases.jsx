import { useEffect, useState } from 'react';
import { api } from '../lib/api';
import EmptyState from '../components/EmptyState';

export default function Purchases() {
  const [orders, setOrders] = useState([]);
  const [links, setLinks] = useState({});
  const [loading, setLoading] = useState({});

  useEffect(() => {
    api.get('/orders/mine').then((res) => setOrders(res.orders));
  }, []);

  async function getDownload(resourceId) {
    setLoading((l) => ({ ...l, [resourceId]: true }));
    try {
      const res = await api.get(`/orders/resources/${resourceId}/download`);
      setLinks((l) => ({ ...l, [resourceId]: res.files }));
    } finally {
      setLoading((l) => ({ ...l, [resourceId]: false }));
    }
  }

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-semibold mb-6">My purchases</h1>

      {orders.length === 0 ? (
        <EmptyState message="You have not purchased anything yet." />
      ) : (
        <div className="space-y-3">
          {orders
            .filter((o) => o.status !== 'failed')
            .map((o) => (
              <div key={o.id} className="bg-surface border border-border rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">{o.resource?.title}</p>
                    <p className="text-xs text-muted mt-1">{new Date(o.created_at).toLocaleDateString()} · {o.status}</p>
                  </div>
                  {o.status === 'paid' && (
                    <button
                      onClick={() => getDownload(o.resource.id)}
                      disabled={loading[o.resource.id]}
                      className="text-sm border border-border px-3 py-1.5 rounded-md hover:border-accent"
                    >
                      {loading[o.resource.id] ? 'Loading...' : 'Get download link'}
                    </button>
                  )}
                </div>
                {links[o.resource?.id] && (
                  <ul className="mt-3 text-sm space-y-1">
                    {links[o.resource.id].map((f, i) => (
                      <li key={i}>
                        <a href={f.url} target="_blank" rel="noreferrer" className="text-accent hover:underline">
                          {f.file_name}
                        </a>
                        <span className="text-muted"> — link expires in 5 minutes</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
        </div>
      )}
    </div>
  );
}
