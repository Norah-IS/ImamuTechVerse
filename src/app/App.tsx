import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { LanguageProvider } from './context/LanguageContext';
import { LoginPage } from './components/LoginPage';
import { PreferencesPage } from './components/PreferencesPage';
import { HomePage } from './components/HomePage';
import { EventDetailsPage } from './components/EventDetailsPage';
import { AdminDashboard } from './components/AdminDashboard';
import { UserProfilePage } from './components/UserProfilePage';
import { WaitlistDemo } from './components/WaitlistDemo';
import { OrganizerScannerPage } from './components/OrganizerScannerPage';
import { EventQRDisplayPage } from './components/EventQRDisplayPage';
import { AIChatWidget } from './components/AIChatWidget';

/** Guard for student-only pages */
function StudentRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, user, hasCompletedPreferences } = useAuth();

  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (user?.role === 'admin') return <Navigate to="/admin" replace />;
  if (!hasCompletedPreferences) return <Navigate to="/preferences" replace />;

  return <>{children}</>;
}

/** Guard for preferences page (students only, not yet completed) */
function PreferencesRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, user, hasCompletedPreferences } = useAuth();

  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (user?.role === 'admin') return <Navigate to="/admin" replace />;
  if (hasCompletedPreferences) return <Navigate to="/" replace />;

  return <>{children}</>;
}

/** Guard for admin-only pages */
function AdminRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, user } = useAuth();

  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (user?.role !== 'admin') return <Navigate to="/" replace />;

  return <>{children}</>;
}

function AppRoutes() {
  const { isAuthenticated, user, hasCompletedPreferences } = useAuth();

  const getDefaultRedirect = () => {
    if (!isAuthenticated) return '/login';
    if (user?.role === 'admin') return '/admin';
    if (!hasCompletedPreferences) return '/preferences';
    return '/';
  };

  return (
    <Routes>
      <Route
        path="/login"
        element={
          isAuthenticated ? (
            <Navigate to={getDefaultRedirect()} replace />
          ) : (
            <LoginPage />
          )
        }
      />

      {/* Student-only: Preferences (only before completing prefs) */}
      <Route
        path="/preferences"
        element={
          <PreferencesRoute>
            <PreferencesPage />
          </PreferencesRoute>
        }
      />

      {/* Student-only pages */}
      <Route
        path="/"
        element={
          <StudentRoute>
            <HomePage />
          </StudentRoute>
        }
      />
      <Route
        path="/event/:id"
        element={
          <StudentRoute>
            <EventDetailsPage />
          </StudentRoute>
        }
      />
      <Route
        path="/profile"
        element={
          <StudentRoute>
            <UserProfilePage />
          </StudentRoute>
        }
      />

      {/* Admin-only pages */}
      <Route
        path="/admin"
        element={
          <AdminRoute>
            <AdminDashboard />
          </AdminRoute>
        }
      />
      <Route
        path="/admin/event/:id"
        element={
          <AdminRoute>
            <EventDetailsPage adminView />
          </AdminRoute>
        }
      />

      {/* Organizer scanner */}
      <Route
        path="/admin/scan"
        element={
          <AdminRoute>
            <OrganizerScannerPage />
          </AdminRoute>
        }
      />

      {/* Event QR display screen */}
      <Route
        path="/admin/event/:id/qr"
        element={
          <AdminRoute>
            <EventQRDisplayPage />
          </AdminRoute>
        }
      />

      {/* Public demo page — no auth required */}
      <Route path="/waitlist-demo" element={<WaitlistDemo />} />

      <Route path="*" element={<Navigate to={getDefaultRedirect()} replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>

      <LanguageProvider>
        <AuthProvider>
          <AppRoutes />
          <AIChatWidget />
        </AuthProvider>
      </LanguageProvider>
    </BrowserRouter>
  );
}
