
import { useState } from 'react'
import {
  Navigate,
  Route,
  Routes,
  useLocation,
} from 'react-router-dom'

import { useAuth } from './context/AuthContext'

import Sidebar from './components/layout/Sidebar'
import Header from './components/layout/Header'

import Dashboard from './pages/Dashboard'
import Transactions from './pages/Transactions'
import Budgets from './pages/Budgets'
import Forecasting from './pages/Forecasting'
import Reports from './pages/Reports'
import AIAssistant from './pages/AIAssistant'
import Settings from './pages/Settings'
import Auth from './pages/Auth'

// Protect application pages
function ProtectedRoute({ children }) {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#080b12]">
        <div className="text-center">
          <div className="mx-auto h-10 w-10 animate-spin rounded-full border-2 border-emerald-400 border-t-transparent" />
          <p className="mt-4 text-sm text-slate-400">
            Loading FinSight AI...
          </p>
        </div>
      </div>
    )
  }

  return user ? children : <Navigate to="/login" replace />
}

// Redirect authenticated users away from authentication pages
function GuestRoute({ children }) {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#080b12]">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-emerald-400 border-t-transparent" />
      </div>
    )
  }

  return user ? <Navigate to="/" replace /> : children
}

// Main dashboard layout
function AppLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="min-h-screen bg-[#080b12]">
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      <div className="min-h-screen lg:pl-64">
        <Header onMenuClick={() => setSidebarOpen(true)} />

        <main className="p-4 sm:p-6 lg:p-8">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/transactions" element={<Transactions />} />
            <Route path="/budgets" element={<Budgets />} />
            <Route path="/forecasting" element={<Forecasting />} />
            <Route path="/reports" element={<Reports />} />
            <Route path="/ai-assistant" element={<AIAssistant />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>
    </div>
  )
}

export default function App() {
  const location = useLocation()

  return (
    <Routes>
      {/* Authentication */}
      <Route
        path="/login"
        element={
          <GuestRoute>
            <Auth key="login" initialMode="login" />
          </GuestRoute>
        }
      />

      <Route
        path="/register"
        element={
          <GuestRoute>
            <Auth key="register" initialMode="register" />
          </GuestRoute>
        }
      />

      {/* Protected application */}
      <Route
        path="/*"
        element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        }
      />
    </Routes>
  )
}
