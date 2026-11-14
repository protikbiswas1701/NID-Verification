import { Navigate, Route, Routes } from 'react-router-dom';
import { GuestRoute, ProtectedRoute } from './routes/ProtectedRoute';
import DashboardLayout from './layouts/DashboardLayout';
import Landing from './pages/Landing';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Upload from './pages/Upload';
import History from './pages/History';
import Details from './pages/Details';
import Settings from './pages/Settings';
import NotFound from './pages/NotFound';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminUsers from './pages/admin/AdminUsers';
import AdminVerifications from './pages/admin/AdminVerifications';
import AdminVerificationDetails from './pages/admin/AdminVerificationDetails';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />

      <Route element={<GuestRoute />}>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
      </Route>

      <Route element={<ProtectedRoute roles={['user']} />}>
        <Route path="/app" element={<DashboardLayout variant="user" />}>
          <Route index element={<Dashboard />} />
          <Route path="upload" element={<Upload />} />
          <Route path="verifications" element={<History />} />
          <Route path="verifications/:id" element={<Details />} />
          <Route path="settings" element={<Settings />} />
          <Route path="*" element={<Navigate to="/app" replace />} />
        </Route>
      </Route>

      <Route element={<ProtectedRoute roles={['admin']} />}>
        <Route path="/admin" element={<DashboardLayout variant="admin" />}>
          <Route index element={<AdminDashboard />} />
          <Route path="verifications" element={<AdminVerifications />} />
          <Route path="verifications/:id" element={<AdminVerificationDetails />} />
          <Route path="users" element={<AdminUsers />} />
          <Route path="settings" element={<Settings />} />
          <Route path="*" element={<Navigate to="/admin" replace />} />
        </Route>
      </Route>

      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
