import React from 'react'
import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { Loader2 } from 'lucide-react'

export function ProtectedRoute({ allowedRole }) {
  const { user, profile, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          <p className="text-sm text-slate-500 font-medium">Memverifikasi sesi...</p>
        </div>
      </div>
    )
  }

  // Not logged in -> redirect to login
  if (!user) {
    return <Navigate to="/login" replace />
  }

  // If role is required and user has different role, redirect to appropriate dashboard
  if (allowedRole && profile?.role && profile.role !== allowedRole) {
    const targetDashboard = profile.role === 'perekrut' ? '/dashboard/perekrut' : '/dashboard/pelamar'
    return <Navigate to={targetDashboard} replace />
  }

  return <Outlet />
}
