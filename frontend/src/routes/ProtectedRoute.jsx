import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { homeFor, useAuth } from '../context/AuthContext';
import { FullPageSpinner } from '../components/Spinner';

// Requires a logged-in user. When `roles` is given the user's role must match,
// otherwise they are sent to their own home. (The backend enforces roles too.)
export function ProtectedRoute({ roles }) {
  const { user, loading } = useAuth();
  const location = useLocation();
  if (loading) return <FullPageSpinner />;
  if (!user) return <Navigate to="/login" state={{ from: location }} replace />;
  if (roles && !roles.includes(user.role)) return <Navigate to={homeFor(user)} replace />;
  return <Outlet />;
}

// Login/Register are only for signed-out visitors.
export function GuestRoute() {
  const { user, loading } = useAuth();
  if (loading) return <FullPageSpinner />;
  if (user) return <Navigate to={homeFor(user)} replace />;
  return <Outlet />;
}
