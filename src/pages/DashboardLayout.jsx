import { useState } from 'react';
import { Outlet, Link } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import NotificationBell from '../components/NotificationBell';
import { useAuth } from '../lib/AuthContext';

export default function DashboardLayout() {
  const { profile, signOut } = useAuth();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  return (
    <div className="flex min-h-screen">
      <Sidebar mobileOpen={mobileNavOpen} onClose={() => setMobileNavOpen(false)} />
      <div className="flex-1">
        <header className="h-16 border-b border-border flex items-center justify-between px-4 md:px-6">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileNavOpen(true)}
              className="md:hidden text-ink text-xl leading-none px-1"
              aria-label="Open menu"
            >
              ☰
            </button>
            <Link to="/" className="font-semibold">Elimu<span className="text-accent">Hub</span></Link>
          </div>
          <div className="flex items-center gap-4 text-sm text-muted">
            <NotificationBell />
            <span className="hidden sm:inline">{profile?.full_name}</span>
            <button onClick={signOut} className="hover:text-ink transition-colors">Log out</button>
          </div>
        </header>
        <main className="p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
