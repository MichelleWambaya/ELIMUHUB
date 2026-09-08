import { useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import Navbar from '../components/Navbar';
import BackLink from '../components/BackLink';
import { RatingStars } from '../components/ResourceCard';
import { api } from '../lib/api';
import { useAuth } from '../lib/AuthContext';

export default function ResourceDetail() {
  const { id } = useParams();
  const { session, profile } = useAuth();
  const [resource, setResource] = useState(null);
  const [till, setTill] = useState(null);
  const [order, setOrder] = useState(null);
  const [code, setCode] = useState('');
  const [status, setStatus] = useState('idle'); // idle | starting | awaiting_code | submitted | purchased | error
  const [error, setError] = useState('');
  const [reviews, setReviews] = useState([]);
  const [canReview, setCanReview] = useState(false);
  const [saved, setSaved] = useState(false);
  const [reviewForm, setReviewForm] = useState({ rating: 5, comment: '' });
  const pollRef = useRef(null);

  useEffect(() => {
    api.get(`/resources/${id}`).then((res) => setResource(res.resource));
    api.get('/payments/manual/info').then(setTill);
    api.get(`/resources/${id}/reviews`).then((res) => setReviews(res.reviews));

    if (session && profile?.role === 'student') {
      api.get('/orders/mine').then((res) => {
        setCanReview((res.orders || []).some((o) => o.resource?.id === id && o.status === 'paid'));
      });
    }

    return () => clearInterval(pollRef.current);
  }, [id, session, profile]);

  async function toggleSave() {
    if (!session) return (window.location.href = '/login');
    if (saved) {
      await api.delete(`/resources/${id}/save`);
      setSaved(false);
    } else {
      await api.post(`/resources/${id}/save`, {});
      setSaved(true);
    }
  }

  async function submitReview(e) {
    e.preventDefault();
    const res = await api.post(`/resources/${id}/reviews`, reviewForm);
    setReviews((r) => [res.review, ...r]);
    setCanReview(false);
  }

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
        <BackLink to="/marketplace" label="Back to marketplace" />

        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold">{resource.title}</h1>
            <p className="text-muted mt-2">By {resource.teacher?.full_name}</p>
            {resource.rating && (
              <div className="mt-2">
                <RatingStars value={resource.rating.avg} count={resource.rating.count} size="md" />
              </div>
            )}
          </div>
          {profile?.role !== 'teacher' && (
            <button
              onClick={toggleSave}
              className="text-sm border border-border px-3 py-1.5 rounded-md hover:border-accent whitespace-nowrap"
            >
              {saved ? 'Saved' : 'Save'}
            </button>
          )}
        </div>

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

        <section className="mt-12">
          <h2 className="text-lg font-medium mb-4">Reviews</h2>

          {canReview && (
            <form onSubmit={submitReview} className="bg-surface border border-border rounded-lg p-4 mb-5 space-y-3">
              <p className="text-sm font-medium">Leave a review</p>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((n) => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => setReviewForm({ ...reviewForm, rating: n })}
                    className={n <= reviewForm.rating ? 'text-accent' : 'text-muted'}
                  >
                    ★
                  </button>
                ))}
              </div>
              <textarea
                placeholder="What did you think? (optional)"
                value={reviewForm.comment}
                onChange={(e) => setReviewForm({ ...reviewForm, comment: e.target.value })}
                className="w-full bg-surface2 border border-border rounded-md px-3 py-2 text-sm h-20 focus:border-accent outline-none"
              />
              <button type="submit" className="text-sm bg-accent text-bg font-medium px-4 py-1.5 rounded-md">
                Submit review
              </button>
            </form>
          )}

          {reviews.length === 0 ? (
            <p className="text-sm text-muted">No reviews yet.</p>
          ) : (
            <div className="space-y-3">
              {reviews.map((r) => (
                <div key={r.id} className="bg-surface border border-border rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium">{r.student?.full_name}</p>
                    <span className="text-accent text-sm">{'★'.repeat(r.rating)}{'☆'.repeat(5 - r.rating)}</span>
                  </div>
                  {r.comment && <p className="text-sm text-muted mt-2">{r.comment}</p>}
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
