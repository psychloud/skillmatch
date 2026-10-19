import React from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { ToastProvider } from './context/ToastContext'
import { ProtectedRoute } from './components/ProtectedRoute'
import { ErrorBoundary } from './components/ErrorBoundary'

import Landing from './pages/Landing'
import Login from './pages/Login'
import Register from './pages/Register'
import PerekrutDashboard from './pages/dashboard/Perekrut'
import PelamarDashboard from './pages/dashboard/Pelamar'
import Quiz from './pages/Quiz'

export default function App() {
  return (
    <ErrorBoundary>
      <ToastProvider>
        <AuthProvider>
          <BrowserRouter>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Protected Routes for Perekrut */}
          <Route element={<ProtectedRoute allowedRole="perekrut" />}>
            <Route path="/dashboard/perekrut" element={<PerekrutDashboard />} />
          </Route>

          {/* Protected Routes for Pelamar */}
          <Route element={<ProtectedRoute allowedRole="pelamar" />}>
            <Route path="/dashboard/pelamar" element={<PelamarDashboard />} />
            <Route path="/quiz/:jobId" element={<Quiz />} />
          </Route>

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ToastProvider>
  </ErrorBoundary>
  )
}
