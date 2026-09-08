import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import ResourceCard from '../components/ResourceCard';
import EmptyState from '../components/EmptyState';
import { api } from '../lib/api';

export default function Landing() {
  const [resources, setResources] = useState([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    api.get('/resources').then((res) => setResources(res.resources)).finally(() => setLoaded(true));
  }, []);

  return (
    <div>
      <Navbar />

      <section className="max-w-6xl mx-auto px-6 pt-20 pb-16 grid md:grid-cols-2 gap-12 items-center">
        <div>
          <p className="text-accent text-sm font-medium tracking-wide uppercase mb-4">
            Built by teachers, for the classroom
          </p>
          <h1 className="text-5xl font-semibold leading-tight tracking-tight">
            Everything a Kenyan classroom needs, in one place.
          </h1>
          <p className="text-muted mt-5 text-lg leading-relaxed max-w-md">
            Revision papers, schemes of work, past exams and one-on-one
            tutoring — sourced from teachers who've actually stood in front
            of the syllabus you're studying.
          </p>
          <div className="flex gap-4 mt-8">
            <Link to="/marketplace" className="bg-accent text-bg font-medium px-6 py-3 rounded-md hover:bg-accentDim transition-colors">
              Browse resources
            </Link>
            <Link to="/register?role=teacher" className="border border-border font-medium px-6 py-3 rounded-md hover:border-accent transition-colors">
              Become a teacher
            </Link>
          </div>
        </div>

        <div className="bg-surface border border-border rounded-xl p-8 shadow-glow">
          <p className="text-sm text-muted">Why teachers list here</p>
          <div className="mt-4 space-y-4">
            <Highlight
              title="Get paid for your work"
              body="Every approved resource earns you money, every time it sells."
            />
            <Highlight
              title="Reach students beyond your classroom"
              body="Your materials reach learners across the country, not just your own school."
            />
            <Highlight
              title="Only quality content goes live"
              body="A review step keeps the marketplace credible for buyers and teachers alike."
            />
          </div>
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-6 py-16 border-t border-border">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl font-semibold">Fresh on the marketplace</h2>
          <Link to="/marketplace" className="text-sm text-accent hover:underline">See all</Link>
        </div>

        {!loaded ? (
          <p className="text-muted">Loading resources...</p>
        ) : resources.length === 0 ? (
          <EmptyState message="Be the first to list a resource." actionLabel="Become a teacher" onAction={() => (window.location.href = '/register?role=teacher')} />
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
            {resources.slice(0, 8).map((r) => (
              <ResourceCard key={r.id} resource={r} />
            ))}
          </div>
        )}
      </section>

      <section className="max-w-6xl mx-auto px-6 py-16 border-t border-border grid md:grid-cols-3 gap-6">
        <FeatureCard title="Sell what you've already built" body="Turn revision papers, schemes of work, and past exams you've already written into income." />
        <FeatureCard title="Tutor on your own terms" body="Set your subjects, your rate, your hours — and take bookings that fit your schedule." />
        <FeatureCard title="Learn from teachers who've been there" body="Every resource passes a review step before it reaches a single student." />
      </section>

      <footer className="border-t border-border px-6 py-8 text-sm text-muted flex justify-between max-w-6xl mx-auto">
        <span>ElimuHub</span>
        <div className="flex gap-6">
          <Link to="/terms" className="hover:text-ink">Terms</Link>
          <Link to="/privacy" className="hover:text-ink">Privacy</Link>
        </div>
      </footer>
    </div>
  );
}

function Highlight({ title, body }) {
  return (
    <div>
      <p className="text-sm font-medium">{title}</p>
      <p className="text-sm text-muted mt-1 leading-relaxed">{body}</p>
    </div>
  );
}

function FeatureCard({ title, body }) {
  return (
    <div className="bg-surface border border-border rounded-lg p-6 hover:border-accent transition-colors">
      <h3 className="font-medium">{title}</h3>
      <p className="text-sm text-muted mt-2 leading-relaxed">{body}</p>
    </div>
  );
}