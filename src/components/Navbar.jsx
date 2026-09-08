import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../lib/AuthContext';

const LINKS = [
  { to: '/marketplace', label: 'Browse resources' },
  { to: '/tutors', label: 'Find tutors' },
  { to: '/become-a-teacher', label: 'Become a teacher' },
];

export default function Navbar() {
  const { session, profile } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="border-b border-border relative">
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        <Link to="/" className="text-lg font-semibold tracking-tight" onClick={() => setMenuOpen(false)}>
          Elimu<span className="text-accent">Hub</span>
        </Link>

        <nav className="hidden md:flex items-center gap-8 text-sm text-muted">
          {LINKS.map((link) => (
            <Link key={link.to} to={link.to} className="hover:text-ink transition-colors">
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <div className="hidden md:flex items-center gap-3">
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

          <button
            onClick={() => setMenuOpen((o) => !o)}
            className="md:hidden text-ink text-xl leading-none px-1"
            aria-label="Open menu"
          >
            {menuOpen ? '✕' : '☰'}
          </button>
        </div>
      </div>

      {menuOpen && (
        <nav className="md:hidden border-t border-border px-6 py-4 flex flex-col gap-4 text-sm bg-surface">
          {LINKS.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              onClick={() => setMenuOpen(false)}
              className="text-muted hover:text-ink transition-colors"
            >
              {link.label}
            </Link>
          ))}
          <div className="border-t border-border pt-4 flex flex-col gap-4">
            {session ? (
              <Link
                to={profile?.role === 'admin' ? '/admin' : '/dashboard'}
                onClick={() => setMenuOpen(false)}
                className="font-medium text-accent"
              >
                Dashboard
              </Link>
            ) : (
              <>
                <Link to="/login" onClick={() => setMenuOpen(false)} className="text-muted hover:text-ink transition-colors">
                  Log in
                </Link>
                <Link to="/register" onClick={() => setMenuOpen(false)} className="font-medium text-accent">
                  Sign up
                </Link>
              </>
            )}
          </div>
        </nav>
      )}
    </header>
  );
}
      </div>
    </header>
  );
}
