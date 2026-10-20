import React, { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { LogOut, UserCog, ChevronDown } from 'lucide-react'
import { EditProfileModal } from './EditProfileModal'

export function Navbar() {
  const { user, profile, logout } = useAuth()
  const [showEditModal, setShowEditModal] = useState(false)
  const [showDropdown, setShowDropdown] = useState(false)
  const dropdownRef = useRef(null)

  const dashboardUrl = profile?.role === 'perekrut' ? '/dashboard/perekrut' : '/dashboard/pelamar'

  // Tutup dropdown jika user klik di luar area profil
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

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
              <div className="relative" ref={dropdownRef}>
                {/* Trigger Profil: Nama & Status Bersebelahan */}
                <button
                  type="button"
                  onClick={() => setShowDropdown(!showDropdown)}
                  className="flex items-center gap-2 py-1.5 px-3 rounded-xl border border-slate-200 hover:border-slate-300 hover:bg-slate-50/80 transition cursor-pointer group shadow-2xs"
                >
                  <span className="text-xs font-bold text-slate-800 group-hover:text-blue-600 transition truncate max-w-[140px] sm:max-w-[200px]">
                    {profile?.role === 'perekrut'
                      ? (profile?.company_name || profile?.full_name || 'UMKM')
                      : (profile?.full_name || user.email?.split('@')[0])}
                  </span>

                  <span
                    className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full shrink-0 ${
                      profile?.role === 'perekrut'
                        ? 'text-blue-700 bg-blue-50 border border-blue-200'
                        : 'text-emerald-700 bg-emerald-50 border border-emerald-200'
                    }`}
                  >
                    {profile?.role === 'perekrut' ? 'Perekrut' : 'Pelamar'}
                  </span>

                  <ChevronDown
                    className={`w-3.5 h-3.5 text-slate-400 group-hover:text-slate-600 transition-transform duration-200 ${
                      showDropdown ? 'rotate-180' : ''
                    }`}
                  />
                </button>

                {/* Dropdown Menu Bersih: Edit Profil & Logout */}
                {showDropdown && (
                  <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border border-slate-100 py-1.5 z-50 animate-scale-in">
                    <div className="px-3.5 py-2.5 border-b border-slate-100">
                      {profile?.role === 'perekrut' ? (
                        <>
                          <p className="text-xs font-bold text-slate-900 truncate">
                            {profile?.company_name || 'Nama Perusahaan UMKM'}
                          </p>
                          <p className="text-[11px] font-medium text-slate-600 truncate mt-0.5">
                            {profile?.full_name || 'Penanggung Jawab'}
                          </p>
                          <p className="text-[10px] text-slate-400 truncate mt-0.5">
                            {user.email}
                          </p>
                        </>
                      ) : (
                        <>
                          <p className="text-xs font-bold text-slate-900 truncate">
                            {profile?.full_name || 'Pelamar Kerja'}
                          </p>
                          <p className="text-[11px] text-slate-400 truncate mt-0.5">
                            {user.email}
                          </p>
                        </>
                      )}
                    </div>

                    <div className="p-1">
                      <button
                        type="button"
                        onClick={() => {
                          setShowDropdown(false)
                          setShowEditModal(true)
                        }}
                        className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-slate-700 hover:text-blue-600 hover:bg-blue-50/70 rounded-xl transition"
                      >
                        <UserCog className="w-4 h-4 text-blue-600" />
                        Edit Profil
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setShowDropdown(false)
                          logout()
                        }}
                        className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-red-600 hover:bg-red-50 rounded-xl transition"
                      >
                        <LogOut className="w-4 h-4 text-red-600" />
                        Keluar
                      </button>
                    </div>
                  </div>
                )}
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
