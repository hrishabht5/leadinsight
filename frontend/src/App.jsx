import { Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import ErrorBoundary from './components/ErrorBoundary'
import SplashPage    from './pages/SplashPage'
import LoginPage     from './pages/LoginPage'
import RegisterPage  from './pages/RegisterPage'
import DashboardPage from './pages/DashboardPage'
import LeadsPage     from './pages/LeadsPage'
import AnalyticsPage from './pages/AnalyticsPage'
import SettingsPage  from './pages/SettingsPage'
import NotFoundPage  from './pages/NotFoundPage'
import AppLayout     from './components/AppLayout'

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return (
    <div className="min-h-screen flex items-center justify-center gap-3">
      <div className="w-2 h-2 rounded-full bg-green animate-ping" />
      <span className="text-muted text-sm font-mono">Loading…</span>
    </div>
  )
  return user ? children : <Navigate to="/login" replace />
}

function PublicRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return null
  return user ? <Navigate to="/dashboard" replace /> : children
}

export default function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <Routes>
          <Route path="/"         element={<PublicRoute><SplashPage /></PublicRoute>} />
          <Route path="/login"    element={<PublicRoute><LoginPage /></PublicRoute>} />
          <Route path="/register" element={<PublicRoute><RegisterPage /></PublicRoute>} />

          <Route element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
            <Route path="/dashboard" element={<ErrorBoundary><DashboardPage /></ErrorBoundary>} />
            <Route path="/leads"     element={<ErrorBoundary><LeadsPage /></ErrorBoundary>} />
            <Route path="/analytics" element={<ErrorBoundary><AnalyticsPage /></ErrorBoundary>} />
            <Route path="/settings"  element={<ErrorBoundary><SettingsPage /></ErrorBoundary>} />
          </Route>

          <Route path="/404" element={<NotFoundPage />} />
          <Route path="*"    element={<Navigate to="/404" replace />} />
        </Routes>
      </AuthProvider>
    </ErrorBoundary>
  )
}
