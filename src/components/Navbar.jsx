import { Link } from 'react-router-dom';
import { useAuth } from '../lib/AuthContext';

export default function Navbar() {
  const { session, profile } = useAuth();

  return (
    <header className="border-b border-border">
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        <Link to="/" className="text-lg font-semibold tracking-tight">
          Elimu<span className="text-accent">Hub</span>
        </Link>

        <nav className="hidden md:flex items-center gap-8 text-sm text-muted">
          <Link to="/marketplace" className="hover:text-ink transition-colors">Browse resources</Link>
          <Link to="/tutors" className="hover:text-ink transition-colors">Find tutors</Link>
          <Link to="/become-a-teacher" className="hover:text-ink transition-colors">Become a teacher</Link>
        </nav>

        <div className="flex items-center gap-3">
          {session ? (
            <Link
              to={profile?.role === 'admin' ? '/admin' : '/dashboard'}
              className="text-sm font-medium bg-accent text-bg px-4 py-2 rounded-md hover:bg-accentDim transition-colors"
            >
              Dashboard
            </Link>
          ) : (
            <>
              <Link to="/login" className="text-sm text-muted hover:text-ink transition-colors">Log in</Link>
              <Link to="/register" className="text-sm font-medium bg-accent text-bg px-4 py-2 rounded-md hover:bg-accentDim transition-colors">
                Sign up
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
