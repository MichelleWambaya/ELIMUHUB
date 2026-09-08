import { useEffect, useState } from 'react';
import { api } from '../lib/api';
import EmptyState from '../components/EmptyState';

export default function Payouts() {
  const [dashboard, setDashboard] = useState(null);
  const [payouts, setPayouts] = useState([]);
  const [amount, setAmount] = useState('');
  const [error, setError] = useState('');
  const [loadError, setLoadError] = useState('');
  const [status, setStatus] = useState('');

  async function load() {
    try {
      const [dashboardRes, payoutsRes] = await Promise.all([api.get('/teacher/dashboard'), api.get('/teacher/payouts/mine')]);
      setDashboard(dashboardRes);
      setPayouts(payoutsRes.payouts);
    } catch (err) {
      setLoadError(err.message || 'Could not load payouts.');
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function requestPayout(e) {
    e.preventDefault();
    setError('');
    setStatus('requesting');
    try {
      await api.post('/teacher/payouts/request', { amount_kes: Number(amount) });
      setAmount('');
      await load();
    } catch (err) {
      setError(err.message);
    } finally {
      setStatus('');
    }
  }

  if (loadError) return <p className="text-sm text-red-400">{loadError}</p>;
  if (!dashboard) return <p className="text-muted">Loading...</p>;

  return (
    <div className="max-w-lg space-y-8">
      <h1 className="text-2xl font-semibold">Payouts</h1>

      <div className="grid grid-cols-2 gap-4">
        <div className="bg-surface border border-border rounded-lg p-4">
          <p className="text-sm text-muted">Pending balance</p>
          <p className="text-xl font-semibold mt-1">KES {dashboard.pending_balance_kes.toLocaleString()}</p>
          <p className="text-xs text-muted mt-1">Settles after the platform's refund window.</p>
        </div>
        <div className="bg-surface border border-border rounded-lg p-4">
          <p className="text-sm text-muted">Available balance</p>
          <p className="text-xl font-semibold mt-1 text-accent">KES {dashboard.available_balance_kes.toLocaleString()}</p>
        </div>
      </div>

      <form onSubmit={requestPayout} className="space-y-3">
        <input
          type="number"
          placeholder="Amount to withdraw (KES)"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          className="w-full bg-surface border border-border rounded-md px-4 py-2 focus:border-accent outline-none"
          required
        />
        {error && <p className="text-sm text-red-400">{error}</p>}
        <button
          type="submit"
          disabled={status === 'requesting'}
          className="bg-accent text-bg font-medium px-6 py-2 rounded-md hover:bg-accentDim transition-colors disabled:opacity-50"
        >
          {status === 'requesting' ? 'Requesting...' : 'Request payout'}
        </button>
      </form>

      <div>
        <h2 className="text-lg font-medium mb-3">History</h2>
        {payouts.length === 0 ? (
          <EmptyState message="No payouts requested yet." />
        ) : (
          <div className="space-y-2">
            {payouts.map((p) => (
              <div key={p.id} className="flex justify-between text-sm bg-surface border border-border rounded-md p-3">
                <span>KES {Number(p.amount_kes).toLocaleString()}</span>
                <span className="text-muted capitalize">{p.status}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
