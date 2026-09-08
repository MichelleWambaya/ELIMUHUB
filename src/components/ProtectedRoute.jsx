import { Navigate } from 'react-router-dom';
import { useAuth } from '../lib/AuthContext';

export default function ProtectedRoute({ children, role }) {
  const { session, profile, loading } = useAuth();

  if (loading) return <p className="text-muted px-6 py-10">Loading...</p>;
  if (!session) return <Navigate to="/login" replace />;
  if (role && profile?.role !== role) return <Navigate to="/dashboard" replace />;

  return children;
}
