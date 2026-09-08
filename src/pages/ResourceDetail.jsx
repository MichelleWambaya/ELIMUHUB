import { useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { api } from '../lib/api';
import { useAuth } from '../lib/AuthContext';

export default function ResourceDetail() {
  const { id } = useParams();
  const { session } = useAuth();
  const [resource, setResource] = useState(null);
  const [till, setTill] = useState(null);
  const [order, setOrder] = useState(null);
  const [code, setCode] = useState('');
  const [status, setStatus] = useState('idle'); // idle | starting | awaiting_code | submitted | purchased | error
  const [error, setError] = useState('');
  const pollRef = useRef(null);

  useEffect(() => {
    api.get(`/resources/${id}`).then((res) => setResource(res.resource));
    api.get('/payments/manual/info').then(setTill);
    return () => clearInterval(pollRef.current);
  }, [id]);

  function pollOrder(orderId) {
    pollRef.current = setInterval(async () => {
      const res = await api.get(`/orders/${orderId}/status`);
      if (res.order.status === 'paid') {
        clearInterval(pollRef.current);
        setStatus('purchased');
      } else if (res.order.status === 'failed') {
        clearInterval(pollRef.current);
        setStatus('error');
        setError('Your payment code could not be verified. Check the code and try again, or contact support.');
      }
    }, 5000);
  }

  async function startOrder() {
    if (!session) return (window.location.href = '/login');
    setStatus('starting');
    setError('');
    try {
      const res = await api.post('/orders', { resource_id: id });
      setOrder(res.order);
      setStatus('awaiting_code');
    } catch (err) {
      setStatus('error');
      setError(err.message);
    }
  }

  async function submitCode() {
    setError('');
    try {
      await api.post(`/orders/${order.id}/submit-code`, { code });
      setStatus('submitted');
      pollOrder(order.id);
    } catch (err) {
      setError(err.message);
    }
  }

  if (!resource) return <p className="text-muted px-6 py-10">Loading...</p>;

  return (
    <div>
      <Navbar />
      <div className="max-w-3xl mx-auto px-6 py-10">
        <h1 className="text-2xl font-semibold">{resource.title}</h1>
        <p className="text-muted mt-2">By {resource.teacher?.full_name}</p>
        <p className="mt-6 leading-relaxed">{resource.description}</p>

        <div className="mt-8 bg-surface border border-border rounded-lg p-6">
          {status === 'idle' && (
            <div className="flex items-center justify-between">
              <span className="text-xl font-semibold">KES {Number(resource.price_kes).toLocaleString()}</span>
              <button onClick={startOrder} className="bg-accent text-bg font-medium px-6 py-2 rounded-md hover:bg-accentDim transition-colors">
                Buy resource
              </button>
            </div>
          )}

          {status === 'starting' && <p className="text-muted">Starting your order...</p>}

          {(status === 'awaiting_code' || status === 'submitted') && (
            <div>
              <p className="text-sm text-muted mb-3">
                Pay KES {Number(resource.price_kes).toLocaleString()} to the till below, then enter the transaction code from your M-Pesa confirmation SMS.
              </p>

              <div className="flex flex-wrap items-center gap-6 mb-5">
                {till?.till_qr_url && (
                  <img src={till.till_qr_url} alt="Till QR code" className="w-32 h-32 rounded-md border border-border object-contain bg-white" />
                )}
                <div>
                  <p className="text-xs text-muted">Till number</p>
                  <p className="text-2xl font-semibold tracking-wide">{till?.till_number || 'Not set yet — contact support'}</p>
                </div>
              </div>

              {status === 'awaiting_code' && (
                <div className="flex gap-3">
                  <input
                    placeholder="e.g. QGH7XYZ123"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    className="flex-1 bg-surface2 border border-border rounded-md px-4 py-2 focus:border-accent outline-none uppercase"
                  />
                  <button onClick={submitCode} disabled={!code} className="bg-accent text-bg font-medium px-5 py-2 rounded-md hover:bg-accentDim transition-colors disabled:opacity-50">
                    Submit code
                  </button>
                </div>
              )}

              {status === 'submitted' && (
                <p className="text-sm text-accent">
                  Code submitted. A team member will verify it against the till statement — this page updates automatically once confirmed.
                </p>
              )}
            </div>
          )}
        </div>

        {status === 'error' && <p className="text-sm text-red-400 mt-3">{error}</p>}
        {status === 'purchased' && <p className="text-sm text-accent mt-3">Payment confirmed. Go to your dashboard to download this resource.</p>}
      </div>
    </div>
  );
}
