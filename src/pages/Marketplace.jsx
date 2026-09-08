import { useEffect, useState } from 'react';
import Navbar from '../components/Navbar';
import BackLink from '../components/BackLink';
import ResourceCard from '../components/ResourceCard';
import EmptyState from '../components/EmptyState';
import { api } from '../lib/api';

export default function Marketplace() {
  const [resources, setResources] = useState([]);
  const [q, setQ] = useState('');
  const [filters, setFilters] = useState({ category_id: '', subject_id: '', education_level_id: '' });
  const [taxonomy, setTaxonomy] = useState({ categories: [], subjects: [], education_levels: [] });
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    api.get('/taxonomy').then(setTaxonomy);
  }, []);

  useEffect(() => {
    const params = new URLSearchParams();
    if (q) params.set('q', q);
    if (filters.category_id) params.set('category_id', filters.category_id);
    if (filters.subject_id) params.set('subject_id', filters.subject_id);
    if (filters.education_level_id) params.set('education_level_id', filters.education_level_id);
    const qs = params.toString();

    setLoaded(false);
    api.get(`/resources${qs ? `?${qs}` : ''}`).then((res) => setResources(res.resources)).finally(() => setLoaded(true));
  }, [q, filters]);

  return (
    <div>
      <Navbar />
      <div className="max-w-6xl mx-auto px-6 py-10">
        <BackLink to="/" label="Back to home" />
        <h1 className="text-2xl font-semibold mb-6">Browse resources</h1>
        <input
          placeholder="Search by title"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          className="w-full max-w-sm bg-surface border border-border rounded-md px-4 py-2 mb-4 focus:border-accent outline-none"
        />

        <div className="flex flex-wrap gap-3 mb-8">
          <select
            value={filters.category_id}
            onChange={(e) => setFilters({ ...filters, category_id: e.target.value })}
            className="bg-surface border border-border rounded-md px-3 py-2 text-sm focus:border-accent outline-none"
          >
            <option value="">All categories</option>
            {taxonomy.categories.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
          <select
            value={filters.subject_id}
            onChange={(e) => setFilters({ ...filters, subject_id: e.target.value })}
            className="bg-surface border border-border rounded-md px-3 py-2 text-sm focus:border-accent outline-none"
          >
            <option value="">All subjects</option>
            {taxonomy.subjects.map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
          <select
            value={filters.education_level_id}
            onChange={(e) => setFilters({ ...filters, education_level_id: e.target.value })}
            className="bg-surface border border-border rounded-md px-3 py-2 text-sm focus:border-accent outline-none"
          >
            <option value="">All levels</option>
            {taxonomy.education_levels.map((l) => (
              <option key={l.id} value={l.id}>{l.name}</option>
            ))}
          </select>
        </div>

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
