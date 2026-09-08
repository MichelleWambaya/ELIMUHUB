import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';

export default function NotFound() {
  return (
    <div>
      <Navbar />
      <div className="max-w-md mx-auto px-6 py-24 text-center">
        <p className="text-accent text-sm font-medium tracking-wide uppercase mb-3">404</p>
        <h1 className="text-2xl font-semibold">This page does not exist.</h1>
        <p className="text-muted mt-3">
          The link may be broken, or the page may have moved.
        </p>
        <Link
          to="/"
          className="inline-block mt-6 bg-accent text-bg font-medium px-6 py-2.5 rounded-md hover:bg-accentDim transition-colors"
        >
          Back to home
        </Link>
      </div>
    </div>
  );
}
