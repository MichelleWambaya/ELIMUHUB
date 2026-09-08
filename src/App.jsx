import { Routes, Route } from 'react-router-dom';
import { AuthProvider } from './lib/AuthContext';
import { ThemeProvider } from './lib/ThemeContext';
import ProtectedRoute from './components/ProtectedRoute';

import Landing from './pages/Landing';
import Login from './pages/Login';
import Register from './pages/Register';
import Marketplace from './pages/Marketplace';
import ResourceDetail from './pages/ResourceDetail';
import Tutors from './pages/Tutors';
import BecomeATeacher from './pages/Become-a-teacher';
import Terms from './pages/Terms';
import Privacy from './pages/Privacy';
import NotFound from './pages/NotFound';
import DashboardLayout from './pages/DashboardLayout';
import Dashboard from './pages/Dashboard';
import Analytics from './pages/Analytics';
import UploadResource from './pages/UploadResource';
import Payouts from './pages/Payouts';
import Purchases from './pages/Purchases';
import Subscription from './pages/Subscription';
import Settings from './pages/Settings';
import MyResources from './pages/MyResources';
import Tutoring from './pages/Tutoring';
import Bookings from './pages/Bookings';
import Learners from './pages/Learners';
import Saved from './pages/Saved';
import Admin from './pages/Admin';

export default function App() {
  return (
    <AuthProvider>
      <ThemeProvider>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/marketplace" element={<Marketplace />} />
          <Route path="/marketplace/:id" element={<ResourceDetail />} />
          <Route path="/tutors" element={<Tutors />} />
          <Route path="/become-a-teacher" element={<BecomeATeacher />} />
          <Route path="/terms" element={<Terms />} />
          <Route path="/privacy" element={<Privacy />} />

          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <DashboardLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Dashboard />} />
            <Route path="analytics" element={<Analytics />} />
            <Route path="upload" element={<UploadResource />} />
            <Route path="resources" element={<MyResources />} />
            <Route path="tutoring" element={<Tutoring />} />
            <Route path="bookings" element={<Bookings />} />
            <Route path="learners" element={<Learners />} />
            <Route path="saved" element={<Saved />} />
            <Route path="payouts" element={<Payouts />} />
            <Route path="purchases" element={<Purchases />} />
            <Route path="subscription" element={<Subscription />} />
            <Route path="settings" element={<Settings />} />
          </Route>

          <Route
            path="/admin"
            element={
              <ProtectedRoute role="admin">
                <Admin />
              </ProtectedRoute>
            }
          />

          <Route path="*" element={<NotFound />} />
        </Routes>
      </ThemeProvider>
    </AuthProvider>
  );
}
