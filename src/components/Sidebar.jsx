import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../lib/AuthContext';

const TEACHER_LINKS = [
  { to: '/dashboard', label: 'Dashboard' },
  { to: '/dashboard/resources', label: 'My resources' },
  { to: '/dashboard/upload', label: 'Upload resource' },
  { to: '/dashboard/tutoring', label: 'Tutoring' },
  { to: '/dashboard/bookings', label: 'Bookings' },
  { to: '/dashboard/learners', label: 'Learners' },
  { to: '/dashboard/payouts', label: 'Payouts' },
  { to: '/dashboard/subscription', label: 'Subscription' },
  { to: '/dashboard/analytics', label: 'Analytics' },
  { to: '/dashboard/settings', label: 'Settings' },
];

const STUDENT_LINKS = [
  { to: '/dashboard', label: 'Dashboard' },
  { to: '/dashboard/purchases', label: 'My purchases' },
  { to: '/dashboard/bookings', label: 'Bookings' },
  { to: '/dashboard/saved', label: 'Saved' },
  { to: '/dashboard/settings', label: 'Settings' },
];

export default function Sidebar() {
  const { profile } = useAuth();
  const [collapsed, setCollapsed] = useState(false);
  const links = profile?.role === 'teacher' ? TEACHER_LINKS : STUDENT_LINKS;

  return (
    <aside
      className={`hidden md:flex flex-col border-r border-border bg-surface transition-all ${
        collapsed ? 'w-16' : 'w-56'
      }`}
    >
      <button
        onClick={() => setCollapsed((c) => !c)}
        className="text-muted text-xs px-4 py-4 text-left hover:text-ink transition-colors"
      >
        {collapsed ? '»' : '« Collapse'}
      </button>
      <nav className="flex flex-col gap-1 px-2">
        {links.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            end={link.to === '/dashboard'}
            className={({ isActive }) =>
              `px-3 py-2 rounded-md text-sm transition-colors ${
                isActive ? 'bg-surface2 text-accent' : 'text-muted hover:text-ink hover:bg-surface2'
              }`
            }
          >
            {collapsed ? link.label.charAt(0) : link.label}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}
