import { useEffect, useState } from 'react';
import { api } from '../lib/api';
import EmptyState from '../components/EmptyState';

export default function Analytics() {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/teacher/analytics').then(setData).catch((err) => setError(err.message || 'Could not load analytics.'));
  }, []);

  if (error) return <p className="text-sm text-red-400">{error}</p>;
  if (!data) return <p className="text-muted">Loading...</p>;

  const months = Object.keys(data.revenue_by_month).sort();
  const resourceTitles = Object.keys(data.sales_by_resource);

  return (
    <div className="space-y-10">
      <h1 className="text-2xl font-semibold">Analytics</h1>

      <div className="grid md:grid-cols-3 gap-4">
        <Stat label="Total earnings" value={`KES ${data.total_earnings_kes.toLocaleString()}`} />
        <Stat label="Resources sold" value={Object.values(data.sales_by_resource).reduce((a, b) => a + b, 0)} />
        <Stat label="Active months" value={months.length} />
      </div>

      <section>
        <h2 className="text-lg font-medium mb-4">Revenue by month</h2>
        {months.length === 0 ? (
          <EmptyState message="No sales recorded yet." />
        ) : (
          <div className="space-y-2">
            {months.map((m) => (
              <BarRow key={m} label={m} value={data.revenue_by_month[m]} max={Math.max(...Object.values(data.revenue_by_month))} />
            ))}
          </div>
        )}
      </section>

      <section>
        <h2 className="text-lg font-medium mb-4">Sales by resource</h2>
        {resourceTitles.length === 0 ? (
          <EmptyState message="No sales recorded yet." />
        ) : (
          <div className="space-y-2">
            {resourceTitles.map((title) => (
              <BarRow
                key={title}
                label={title}
                value={data.sales_by_resource[title]}
                max={Math.max(...Object.values(data.sales_by_resource))}
                suffix=" sold"
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function Stat({ label, value }) {
  return (
    <div className="bg-surface border border-border rounded-lg p-5">
      <p className="text-sm text-muted">{label}</p>
      <p className="text-2xl font-semibold mt-1">{value}</p>
    </div>
  );
}

function BarRow({ label, value, max, suffix = '' }) {
  const width = max ? Math.max((value / max) * 100, 4) : 4;
  return (
    <div>
      <div className="flex justify-between text-sm mb-1">
        <span className="text-muted">{label}</span>
        <span>{typeof value === 'number' && suffix === '' ? `KES ${value.toLocaleString()}` : `${value}${suffix}`}</span>
      </div>
      <div className="h-2 bg-surface2 rounded-full overflow-hidden">
        <div className="h-full bg-accent rounded-full" style={{ width: `${width}%` }} />
      </div>
    </div>
  );
}
