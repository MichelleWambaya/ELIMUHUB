import { useEffect, useState } from 'react';
import { api } from '../lib/api';

export default function Subscription() {
  const [plans, setPlans] = useState([]);
  const [current, setCurrent] = useState(null);
  const [phone, setPhone] = useState('');
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');

  async function load() {
    const [plansRes, mineRes] = await Promise.all([api.get('/subscriptions/plans'), api.get('/subscriptions/mine')]);
    setPlans(plansRes.plans);
    setCurrent(mineRes.subscription);
  }

  useEffect(() => {
    load();
  }, []);

  async function subscribe(plan) {
    setError('');
    if (Number(plan.price_kes) > 0 && !phone) {
      setError('Enter your M-Pesa phone number (format 2547XXXXXXXX) to subscribe to a paid plan.');
      return;
    }
    setStatus(plan.id);
    try {
      const res = await api.post('/subscriptions/subscribe', { plan_id: plan.id, phone_number: phone });
      if (res.message) {
        setError(res.message);
      } else {
        await load();
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setStatus('');
    }
  }

  return (
    <div className="max-w-2xl space-y-8">
      <h1 className="text-2xl font-semibold">Subscription</h1>

      {current && (
        <div className="bg-surface2 border border-border rounded-lg p-4">
          <p className="text-sm text-muted">Current plan</p>
          <p className="text-lg font-semibold">{current.plan?.name}</p>
          <p className="text-xs text-muted mt-1">Renews {new Date(current.renews_at).toLocaleDateString()}</p>
        </div>
      )}

      <input
        placeholder="M-Pesa phone number (2547XXXXXXXX) — only needed for paid plans"
        value={phone}
        onChange={(e) => setPhone(e.target.value)}
        className="w-full bg-surface border border-border rounded-md px-4 py-2 focus:border-accent outline-none"
      />
      {error && <p className="text-sm text-red-400">{error}</p>}

      <div className="grid md:grid-cols-2 gap-4">
        {plans.map((plan) => (
          <div key={plan.id} className="bg-surface border border-border rounded-lg p-5">
            <p className="font-semibold text-lg">{plan.name}</p>
            <p className="text-2xl font-semibold mt-2">
              KES {Number(plan.price_kes).toLocaleString()}
              <span className="text-sm text-muted font-normal"> / {plan.billing_period}</span>
            </p>
            <p className="text-sm text-muted mt-3">{plan.description}</p>
            <ul className="text-sm text-muted mt-3 space-y-1">
              <li>{plan.max_resources ? `Up to ${plan.max_resources} resources` : 'Unlimited resources'}</li>
              {plan.featured_listings && <li>Featured marketplace placement</li>}
            </ul>
            <button
              onClick={() => subscribe(plan)}
              disabled={status === plan.id || current?.plan?.id === plan.id}
              className="mt-4 w-full bg-accent text-bg font-medium py-2 rounded-md hover:bg-accentDim transition-colors disabled:opacity-50"
            >
              {current?.plan?.id === plan.id ? 'Current plan' : status === plan.id ? 'Processing...' : 'Choose plan'}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
