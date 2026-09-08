import { useEffect, useState } from 'react';
import Navbar from '../components/Navbar';
import ResourceCard from '../components/ResourceCard';
import EmptyState from '../components/EmptyState';
import { api } from '../lib/api';

export default function Marketplace() {
  const [resources, setResources] = useState([]);
  const [q, setQ] = useState('');
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const params = q ? `?q=${encodeURIComponent(q)}` : '';
    api.get(`/resources${params}`).then((res) => setResources(res.resources)).finally(() => setLoaded(true));
  }, [q]);

  return (
    <div>
      <Navbar />
      <div className="max-w-6xl mx-auto px-6 py-10">
        <h1 className="text-2xl font-semibold mb-6">Browse resources</h1>
        <input
          placeholder="Search by title"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          className="w-full max-w-sm bg-surface border border-border rounded-md px-4 py-2 mb-8 focus:border-accent outline-none"
        />

        {!loaded ? (
          <p className="text-muted">Loading...</p>
        ) : resources.length === 0 ? (
          <EmptyState message="No resources match your search." />
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
            {resources.map((r) => (
              <ResourceCard key={r.id} resource={r} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
