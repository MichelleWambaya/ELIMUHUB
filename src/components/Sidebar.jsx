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

// mobileOpen/onClose let the mobile hamburger button in DashboardLayout
// control this as a slide-in drawer. On md+ screens it behaves exactly
// as before (a normal inline sidebar) and those two props are unused.
export default function Sidebar({ mobileOpen = false, onClose = () => {} }) {
  const { profile } = useAuth();
  const [collapsed, setCollapsed] = useState(false);
  const links = profile?.role === 'teacher' ? TEACHER_LINKS : STUDENT_LINKS;

  return (
    <>
      {/* Backdrop: mobile only, shown behind the drawer so tapping outside closes it */}
      {mobileOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 z-40 bg-black/50 md:hidden"
          aria-hidden="true"
        />
      )}

      <aside
        className={`
          flex flex-col border-r border-border bg-surface transition-all
          fixed inset-y-0 left-0 z-50 w-56
          ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}
          md:static md:translate-x-0 md:z-auto
          ${collapsed ? 'md:w-16' : 'md:w-56'}
        `}
      >
        <div className="flex items-center justify-between px-2">
          <button
            onClick={() => setCollapsed((c) => !c)}
            className="hidden md:block text-muted text-xs px-2 py-4 text-left hover:text-ink transition-colors"
          >
            {collapsed ? '»' : '« Collapse'}
          </button>
          <button
            onClick={onClose}
            className="md:hidden text-muted text-sm px-3 py-4 hover:text-ink transition-colors"
          >
            Close ✕
          </button>
        </div>
        <nav className="flex flex-col gap-1 px-2">
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.to === '/dashboard'}
              onClick={onClose}
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
    </>
  )
}
