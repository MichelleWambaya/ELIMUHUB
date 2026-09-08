import { useEffect, useState } from 'react';
import { api } from '../lib/api';
import { supabase } from '../lib/supabaseClient';
import EmptyState from '../components/EmptyState';
import { useAuth } from '../lib/AuthContext';

export default function Admin() {
  const { signOut } = useAuth();
  const [overview, setOverview] = useState(null);
  const [queue, setQueue] = useState([]);
  const [rate, setRate] = useState('');
  const [plans, setPlans] = useState([]);
  const [settleStatus, setSettleStatus] = useState('');
  const [pendingPayments, setPendingPayments] = useState([]);
  const [till, setTill] = useState({ till_number: '', till_qr_url: '' });
  const [qrFile, setQrFile] = useState(null);
  const [unmatched, setUnmatched] = useState([]);
  const [awaitingOrders, setAwaitingOrders] = useState([]);
  const [c2bStatus, setC2bStatus] = useState('');

  useEffect(() => {
    api.get('/admin/overview').then(setOverview);
    api.get('/resources/admin/queue').then((res) => setQueue(res.resources));
    api.get('/admin/settings/commission').then((res) => setRate(String(res.commission_rate_default)));
    api.get('/subscriptions/plans').then((res) => setPlans(res.plans));
    api.get('/admin/orders/pending').then((res) => setPendingPayments(res.orders));
    api.get('/admin/settings/till').then(setTill);
    api.get('/admin/c2b/unmatched').then((res) => setUnmatched(res.transactions));
    api.get('/admin/orders/awaiting-payment').then((res) => setAwaitingOrders(res.orders));
  }, []);

  async function registerC2b() {
    setC2bStatus('registering');
    try {
      await api.post('/admin/mpesa/register-c2b', {});
      alert('Registered with Safaricom. Till payments should now confirm automatically.');
    } catch (err) {
      alert(err.message);
    } finally {
      setC2bStatus('');
    }
  }

  async function matchTransaction(transactionId, orderId) {
    if (!orderId) return;
    await api.post(`/admin/c2b/${transactionId}/match`, { order_id: orderId });
    setUnmatched((u) => u.filter((t) => t.id !== transactionId));
    setAwaitingOrders((o) => o.filter((ord) => ord.id !== orderId));
  }

  async function confirmPayment(id) {
    await api.post(`/admin/orders/${id}/confirm`, {});
    setPendingPayments((p) => p.filter((o) => o.id !== id));
  }

  async function rejectPayment(id) {
    const reason = window.prompt('Why is this code invalid? (shown to the student)');
    await api.post(`/admin/orders/${id}/reject`, { reason });
    setPendingPayments((p) => p.filter((o) => o.id !== id));
  }

  async function saveTillNumber() {
    await api.put('/admin/settings/till', { till_number: till.till_number });
    alert('Till number updated.');
  }

  async function uploadQr() {
    if (!qrFile) return;
    const body = new FormData();
    body.append('qr', qrFile);
    const { data } = await supabase.auth.getSession();
    const res = await fetch('/api/admin/settings/till/qr', {
      method: 'POST',
      headers: { Authorization: `Bearer ${data.session?.access_token}` },
      body,
    });
    const json = await res.json();
    if (res.ok) {
      setTill((t) => ({ ...t, till_qr_url: json.till_qr_url }));
      setQrFile(null);
    } else {
      alert(json.error);
    }
  }

  async function updatePlan(id, field, value) {
    setPlans((p) => p.map((plan) => (plan.id === id ? { ...plan, [field]: value } : plan)));
  }

  async function savePlan(plan) {
    await api.put(`/subscriptions/plans/${plan.id}`, {
      price_kes: Number(plan.price_kes),
      max_resources: plan.max_resources === '' ? null : Number(plan.max_resources),
      featured_listings: plan.featured_listings,
    });
    alert(`${plan.name} updated.`);
  }

  async function runSettlements() {
    setSettleStatus('running');
    const res = await api.post('/admin/settlements/run', {});
    setSettleStatus('');
    alert(`Settled balances for ${res.settled_teachers} teacher(s).`);
  }

  async function moderate(id, decision) {
    const notes = decision !== 'approved' ? window.prompt('Notes for the teacher?') : undefined;
    await api.post(`/resources/${id}/moderate`, { decision, notes });
    setQueue((q) => q.filter((r) => r.id !== id));
  }

  async function saveRate() {
    await api.put('/admin/settings/commission', { rate: Number(rate) });
    alert('Commission rate updated.');
  }

  return (
    <div className="max-w-6xl mx-auto px-6 py-10">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-semibold">Admin</h1>
        <button onClick={signOut} className="text-sm text-muted hover:text-ink">Log out</button>
      </div>

      {overview && (
        <div className="grid md:grid-cols-4 gap-4 mb-10">
          <Stat label="Users" value={overview.total_users} />
          <Stat label="Teachers" value={overview.active_teachers} />
          <Stat label="Listed resources" value={overview.listed_resources} />
          <Stat label="Pending reviews" value={overview.pending_reviews} />
          <Stat label="Gross sales" value={`KES ${overview.gross_marketplace_sales_kes.toLocaleString()}`} />
          <Stat label="Platform revenue" value={`KES ${overview.platform_revenue_kes.toLocaleString()}`} />
        </div>
      )}

      <section className="mb-10">
        <h2 className="text-lg font-medium mb-4">Pending payments</h2>
        <p className="text-sm text-muted mb-4 max-w-md">
          Students who paid your till/QR directly and submitted a code. Check each code against your till statement before confirming.
        </p>
        {pendingPayments.length === 0 ? (
          <EmptyState message="No payment codes waiting for verification." />
        ) : (
          <div className="space-y-3">
            {pendingPayments.map((o) => (
              <div key={o.id} className="bg-surface border border-border rounded-lg p-4 flex items-center justify-between flex-wrap gap-3">
                <div>
                  <p className="font-medium">{o.resource?.title}</p>
                  <p className="text-sm text-muted">{o.student?.full_name} · KES {o.gross_amount_kes}</p>
                  <p className="text-sm font-mono text-accent mt-1">{o.manual_code}</p>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => confirmPayment(o.id)} className="text-sm bg-accent text-bg px-3 py-1.5 rounded-md">Confirm paid</button>
                  <button onClick={() => rejectPayment(o.id)} className="text-sm border border-border px-3 py-1.5 rounded-md">Reject</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="mb-10">
        <h2 className="text-lg font-medium mb-4">Moderation queue</h2>
        {queue.length === 0 ? (
          <EmptyState message="Nothing is waiting for review." />
        ) : (
          <div className="space-y-3">
            {queue.map((r) => (
              <div key={r.id} className="bg-surface border border-border rounded-lg p-4 flex items-center justify-between">
                <div>
                  <p className="font-medium">{r.title}</p>
                  <p className="text-sm text-muted">{r.teacher?.full_name} · KES {r.price_kes}</p>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => moderate(r.id, 'approved')} className="text-sm bg-accent text-bg px-3 py-1.5 rounded-md">Approve</button>
                  <button onClick={() => moderate(r.id, 'changes_requested')} className="text-sm border border-border px-3 py-1.5 rounded-md">Request changes</button>
                  <button onClick={() => moderate(r.id, 'rejected')} className="text-sm border border-border px-3 py-1.5 rounded-md">Reject</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <section>
        <h2 className="text-lg font-medium mb-4">Platform commission</h2>
        <div className="flex items-center gap-3">
          <input
            type="number"
            step="0.01"
            min="0"
            max="1"
            value={rate}
            onChange={(e) => setRate(e.target.value)}
            className="bg-surface border border-border rounded-md px-4 py-2 w-32 focus:border-accent outline-none"
          />
          <button onClick={saveRate} className="bg-accent text-bg font-medium px-4 py-2 rounded-md">Save</button>
        </div>
        <p className="text-xs text-muted mt-2">Enter as a decimal, e.g. 0.5 for 50%.</p>
      </section>

      <section className="mt-10">
        <h2 className="text-lg font-medium mb-4">Till / QR payment settings</h2>
        <p className="text-sm text-muted mb-4 max-w-md">Shown to students on the checkout screen for the manual payment flow.</p>

        <div className="flex items-center gap-3 mb-4">
          <input
            placeholder="Till number"
            value={till.till_number}
            onChange={(e) => setTill({ ...till, till_number: e.target.value })}
            className="bg-surface border border-border rounded-md px-4 py-2 w-48 focus:border-accent outline-none"
          />
          <button onClick={saveTillNumber} className="bg-accent text-bg font-medium px-4 py-2 rounded-md">Save</button>
        </div>

        <div className="flex items-center gap-4">
          {till.till_qr_url && <img src={till.till_qr_url} alt="Current till QR" className="w-20 h-20 rounded-md border border-border bg-white object-contain" />}
          <input type="file" accept="image/*" onChange={(e) => setQrFile(e.target.files[0])} className="text-sm text-muted" />
          <button onClick={uploadQr} disabled={!qrFile} className="text-sm border border-border px-3 py-1.5 rounded-md hover:border-accent disabled:opacity-50">
            Upload QR
          </button>
        </div>
        <p className="text-xs text-muted mt-2">Use the official "My Sticker" QR from your M-Pesa Business app, not a self-generated one.</p>
      </section>

      <section className="mt-10">
        <h2 className="text-lg font-medium mb-4">Automatic till payments (C2B)</h2>
        <p className="text-sm text-muted mb-4 max-w-md">
          Registers this shortcode with Safaricom so till payments confirm automatically instead of waiting on a
          student-submitted code. Needs <code className="text-accent">DARAJA_C2B_VALIDATION_URL</code> and{' '}
          <code className="text-accent">DARAJA_C2B_CONFIRMATION_URL</code> set on the server first — see the README.
        </p>
        <button
          onClick={registerC2b}
          disabled={c2bStatus === 'registering'}
          className="text-sm border border-border px-4 py-2 rounded-md hover:border-accent disabled:opacity-50"
        >
          {c2bStatus === 'registering' ? 'Registering...' : 'Register with Safaricom'}
        </button>

        <h3 className="text-sm font-medium mt-8 mb-3">Unmatched till payments</h3>
        <p className="text-sm text-muted mb-4 max-w-md">
          Payments that came in but couldn't be matched to exactly one pending order — either the amount matched
          more than one order, or none at all. Pick the right order below.
        </p>
        {unmatched.length === 0 ? (
          <EmptyState message="No unmatched till payments." />
        ) : (
          <div className="space-y-3">
            {unmatched.map((t) => (
              <UnmatchedRow key={t.id} transaction={t} orders={awaitingOrders} onMatch={matchTransaction} />
            ))}
          </div>
        )}
      </section>

      <section className="mt-10">
        <h2 className="text-lg font-medium mb-4">Subscription plans</h2>
        <div className="space-y-3">
          {plans.map((plan) => (
            <div key={plan.id} className="bg-surface border border-border rounded-lg p-4 flex flex-wrap items-center gap-4">
              <span className="font-medium w-24">{plan.name}</span>
              <label className="text-sm text-muted">
                Price (KES){' '}
                <input
                  type="number"
                  value={plan.price_kes}
                  onChange={(e) => updatePlan(plan.id, 'price_kes', e.target.value)}
                  className="w-24 bg-surface2 border border-border rounded-md px-2 py-1 ml-1"
                />
              </label>
              <label className="text-sm text-muted">
                Max resources{' '}
                <input
                  type="number"
                  value={plan.max_resources ?? ''}
                  placeholder="unlimited"
                  onChange={(e) => updatePlan(plan.id, 'max_resources', e.target.value)}
                  className="w-24 bg-surface2 border border-border rounded-md px-2 py-1 ml-1"
                />
              </label>
              <label className="text-sm text-muted flex items-center gap-1">
                <input
                  type="checkbox"
                  checked={plan.featured_listings}
                  onChange={(e) => updatePlan(plan.id, 'featured_listings', e.target.checked)}
                />
                Featured listings
              </label>
              <button onClick={() => savePlan(plan)} className="text-sm bg-accent text-bg px-3 py-1.5 rounded-md ml-auto">
                Save
              </button>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-10">
        <h2 className="text-lg font-medium mb-4">Settlements</h2>
        <p className="text-sm text-muted mb-3 max-w-md">
          Moves every teacher's pending balance into their withdrawable balance. Run this after your refund window has passed.
        </p>
        <button
          onClick={runSettlements}
          disabled={settleStatus === 'running'}
          className="text-sm border border-border px-4 py-2 rounded-md hover:border-accent disabled:opacity-50"
        >
          {settleStatus === 'running' ? 'Running...' : 'Run settlements'}
        </button>
      </section>
    </div>
  );
}

function UnmatchedRow({ transaction, orders, onMatch }) {
  const [selected, setSelected] = useState('');

  return (
    <div className="bg-surface border border-border rounded-lg p-4 flex items-center justify-between flex-wrap gap-3">
      <div>
        <p className="font-medium">KES {transaction.amount_kes}</p>
        <p className="text-sm text-muted">{transaction.phone} · {transaction.trans_id}</p>
      </div>
      <div className="flex gap-2">
        <select
          value={selected}
          onChange={(e) => setSelected(e.target.value)}
          className="bg-surface2 border border-border rounded-md px-3 py-1.5 text-sm"
        >
          <option value="">Select the matching order</option>
          {orders.map((o) => (
            <option key={o.id} value={o.id}>
              {o.resource?.title} — {o.student?.full_name} — KES {o.gross_amount_kes}
            </option>
          ))}
        </select>
        <button
          onClick={() => onMatch(transaction.id, selected)}
          disabled={!selected}
          className="text-sm bg-accent text-bg px-3 py-1.5 rounded-md disabled:opacity-50"
        >
          Match & confirm
        </button>
      </div>
    </div>
  );
}

function Stat({ label, value }) {
  return (
    <div className="bg-surface border border-border rounded-lg p-4">
      <p className="text-sm text-muted">{label}</p>
      <p className="text-xl font-semibold mt-1">{value}</p>
    </div>
  );
}
