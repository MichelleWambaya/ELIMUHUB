import { Outlet, Link } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import NotificationBell from '../components/NotificationBell';
import { useAuth } from '../lib/AuthContext';

export default function DashboardLayout() {
  const { profile, signOut } = useAuth();

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="flex-1">
        <header className="h-16 border-b border-border flex items-center justify-between px-6">
          <div>
            <Link to="/" className="font-semibold">Elimu<span className="text-accent">Hub</span></Link>
          </div>
          <div className="flex items-center gap-4 text-sm text-muted">
            <NotificationBell />
            <span>{profile?.full_name}</span>
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
