import { Link } from 'react-router-dom';

// A small, consistent back arrow for pages nested under the marketplace,
// the dashboard, or a resource. Pass `to` for a fixed destination —
// omit it and it falls back to the browser's own back behavior.
export default function BackLink({ to, label = 'Back' }) {
  if (to) {
    return (
      <Link to={to} className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-ink transition-colors mb-6">
        <ArrowIcon />
        {label}
      </Link>
    );
  }

  return (
    <button
      onClick={() => window.history.back()}
      className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-ink transition-colors mb-6"
    >
      <ArrowIcon />
      {label}
    </button>
  );
}

function ArrowIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M19 12H5M12 19l-7-7 7-7" />
    </svg>
  );
}
