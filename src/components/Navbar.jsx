import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { Sparkles, LogOut, User, Building2, UserCog } from 'lucide-react'
import { EditProfileModal } from './EditProfileModal'

export function Navbar() {
  const { user, profile, logout } = useAuth()
  const [showEditModal, setShowEditModal] = useState(false)

  const dashboardUrl = profile?.role === 'perekrut' ? '/dashboard/perekrut' : '/dashboard/pelamar'

  return (
    <>
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link
            to={user ? dashboardUrl : '/'}
            className="flex items-center hover:opacity-90 transition"
          >
            <img
              src="/Logo_SkillMatch.png"
              alt="SkillMatch Logo"
              className="h-10 sm:h-12 w-auto object-contain max-h-12"
            />
          </Link>

          <div className="flex items-center gap-3">
            {user ? (
              <div className="flex items-center gap-2 sm:gap-3">
                <Link
                  to={dashboardUrl}
                  className="hidden sm:flex flex-col text-right hover:opacity-80 transition"
                >
                  <span className="text-xs font-semibold text-slate-800">
                    {profile?.full_name || user.email}
                  </span>
                  <span className="text-[10px] uppercase font-bold tracking-wider text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full inline-block self-end">
                    {profile?.role === 'perekrut' ? `Perekrut • ${profile?.company_name || 'UMKM'}` : 'Pelamar'}
                  </span>
                </Link>

                {/* Edit Profile Button */}
                <button
                  onClick={() => setShowEditModal(true)}
                  title="Edit Profil"
                  className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 hover:text-blue-600 px-2.5 py-1.5 rounded-lg border border-slate-200 hover:border-blue-200 hover:bg-blue-50/50 transition shadow-xs"
                >
                  <UserCog className="w-4 h-4 text-blue-600" />
                  <span className="hidden md:inline">Edit Profil</span>
                </button>

                {/* Logout Button */}
                <button
                  onClick={logout}
                  title="Keluar"
                  className="flex items-center gap-1.5 text-xs font-medium text-slate-600 hover:text-red-600 p-2 rounded-lg hover:bg-slate-100 transition"
                >
                  <LogOut className="w-4 h-4" />
                  <span className="hidden sm:inline">Keluar</span>
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <Link
                  to="/login"
                  className="text-sm font-medium text-slate-700 hover:text-blue-600 px-3 py-1.5 rounded-lg transition"
                >
                  Masuk
                </Link>
                <Link
                  to="/register"
                  className="text-sm font-medium bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl transition shadow-sm"
                >
                  Daftar
                </Link>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Modal Edit Profil */}
      <EditProfileModal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
      />
    </>
  )
}
