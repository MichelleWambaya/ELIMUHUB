import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import BackLink from '../components/BackLink';
import { useAuth } from '../lib/AuthContext';
import { api } from '../lib/api';

export default function BecomeATeacher() {
  const { session, profile, loading } = useAuth();
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  async function convert() {
    setStatus('converting');
    setError('');
    try {
      await api.post('/teacher/become', {});
      navigate('/dashboard');
      window.location.reload(); // profile.role is cached in AuthContext; a reload keeps this simple.
    } catch (err) {
      setError(err.message);
      setStatus('');
    }
  }

  return (
    <div>
      <Navbar />
      <div className="max-w-2xl mx-auto px-6 py-16">
        <BackLink to="/" label="Back to home" />

        <h1 className="text-3xl font-semibold">Become a teacher on ElimuHub</h1>
        <p className="text-muted mt-4 leading-relaxed">
          List revision papers, schemes of work, and past exams for sale, or
          open up tutoring with your own subjects, rate, and hours. Every
          resource goes through a short review before it appears in the
          marketplace, so buyers can trust what they find.
        </p>

        <div className="grid sm:grid-cols-3 gap-4 mt-8">
          <Perk title="Get paid" body="Earn a share of every sale, paid out to you on request." />
          <Perk title="Reach more students" body="Your materials reach learners outside your own school." />
          <Perk title="Set your own terms" body="Choose your prices, your tutoring hours, and your subjects." />
        </div>

        <div className="mt-10 bg-surface border border-border rounded-lg p-6">
          {loading ? (
            <p className="text-muted text-sm">Loading...</p>
          ) : !session ? (
            <>
              <p className="text-sm text-muted mb-4">Create an account to get started.</p>
              <Link
                to="/register?role=teacher"
                className="inline-block bg-accent text-bg font-medium px-6 py-2.5 rounded-md hover:bg-accentDim transition-colors"
              >
                Sign up as a teacher
              </Link>
            </>
          ) : profile?.role === 'teacher' ? (
            <>
              <p className="text-sm text-muted mb-4">You're already set up as a teacher.</p>
              <Link
                to="/dashboard/upload"
                className="inline-block bg-accent text-bg font-medium px-6 py-2.5 rounded-md hover:bg-accentDim transition-colors"
              >
                Upload a resource
              </Link>
            </>
          ) : (
            <>
              <p className="text-sm text-muted mb-4">
                You're signed in as {profile?.full_name}. Switch your account to a teacher account to start listing.
              </p>
              {error && <p className="text-sm text-red-400 mb-3">{error}</p>}
              <button
                onClick={convert}
                disabled={status === 'converting'}
                className="bg-accent text-bg font-medium px-6 py-2.5 rounded-md hover:bg-accentDim transition-colors disabled:opacity-50"
              >
                {status === 'converting' ? 'Setting up...' : 'Become a teacher'}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function Perk({ title, body }) {
  return (
    <div className="bg-surface border border-border rounded-lg p-4">
      <p className="text-sm font-medium">{title}</p>
      <p className="text-xs text-muted mt-1.5 leading-relaxed">{body}</p>
    </div>
  );
}
