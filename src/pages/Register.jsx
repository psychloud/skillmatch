import React, { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { UserPlus, Sparkles, AlertCircle, Loader2, Building2, User, Mail } from 'lucide-react'

export default function Register() {
  const [searchParams] = useSearchParams()
  const initialRole = searchParams.get('role') === 'perekrut' ? 'perekrut' : 'pelamar'

  const [role, setRole] = useState(initialRole)
  const [fullName, setFullName] = useState('')
  const [companyName, setCompanyName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  
  // Pelamar specific profile fields
  const [phone, setPhone] = useState('')
  const [domisili, setDomisili] = useState('')
  const [pendidikan, setPendidikan] = useState('SMA/SMK')
  const [ringkasan, setRingkasan] = useState('')

  const [errorMsg, setErrorMsg] = useState('')
  const [successInfo, setSuccessInfo] = useState('')
  const [loading, setLoading] = useState(false)

  const { register } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setErrorMsg('')
    setSuccessInfo('')
    setLoading(true)

    try {
      const res = await register({
        email,
        password,
        role,
        fullName,
        companyName,
        phone: role === 'pelamar' ? phone : null,
        domisili: role === 'pelamar' ? domisili : null,
        pendidikan: role === 'pelamar' ? pendidikan : null,
        ringkasan: role === 'pelamar' ? ringkasan : null,
      })

      // Jika email confirmation aktif di Supabase, user belum punya session aktif
      if (res?.session) {
        if (role === 'perekrut') {
          navigate('/dashboard/perekrut')
        } else {
          navigate('/dashboard/pelamar')
        }
      } else {
        // Mode verifikasi email aktif
        setSuccessInfo(
          `Pendaftaran berhasil! Tautan konfirmasi telah dikirim ke ${email}. Silakan periksa inbox/spam email Anda untuk verifikasi akun, lalu login.`
        )
      }
    } catch (err) {
      console.error(err)
      setErrorMsg(err.message || 'Gagal mendaftar. Silakan coba lagi.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 py-8">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-100 p-8">
        {/* Brand / Logo */}
        <div className="text-center mb-6">
          <Link to="/" className="inline-flex items-center gap-2 text-2xl font-extrabold text-blue-600">
            <span className="p-2 bg-blue-50 text-blue-600 rounded-xl">
              <Sparkles className="w-5 h-5" />
            </span>
            SkillMatch
          </Link>
          <h2 className="text-xl font-bold text-slate-900 mt-4">Buat Akun Baru</h2>
          <p className="text-sm text-slate-500 mt-1">Pilih peran Anda dan mulai verifikasi skill nyata</p>
        </div>

        {/* Role Selector Tabs */}
        <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 rounded-xl mb-6">
          <button
            type="button"
            onClick={() => setRole('pelamar')}
            className={`flex items-center justify-center gap-2 py-2 px-3 text-sm font-semibold rounded-lg transition ${
              role === 'pelamar'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <User className="w-4 h-4" />
            Pelamar Kerja
          </button>
          <button
            type="button"
            onClick={() => setRole('perekrut')}
            className={`flex items-center justify-center gap-2 py-2 px-3 text-sm font-semibold rounded-lg transition ${
              role === 'perekrut'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Building2 className="w-4 h-4" />
            Perekrut UMKM
          </button>
        </div>

        {errorMsg && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
            <span>{errorMsg}</span>
          </div>
        )}

        {successInfo && (
          <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm rounded-xl flex items-start gap-3">
            <Mail className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            <div className="space-y-2">
              <p className="font-semibold text-emerald-900">Email Verifikasi Terkirim!</p>
              <p className="text-emerald-700 leading-relaxed">{successInfo}</p>
              <Link
                to="/login"
                className="inline-block mt-2 font-medium text-emerald-800 underline hover:text-emerald-950"
              >
                Ke Halaman Login &rarr;
              </Link>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Nama Lengkap
            </label>
            <input
              type="text"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Contoh: Budi Pratama"
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition text-sm"
            />
          </div>

          {role === 'perekrut' ? (
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Nama Perusahaan / UMKM
              </label>
              <input
                type="text"
                required
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder="Contoh: Kopi Nusantara Mandiri"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition text-sm"
              />
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                    Nomor WhatsApp / HP
                  </label>
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="Contoh: 08123456789"
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                    Kota Domisili
                  </label>
                  <input
                    type="text"
                    required
                    value={domisili}
                    onChange={(e) => setDomisili(e.target.value)}
                    placeholder="Contoh: Jakarta Selatan"
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Pendidikan Terakhir
                </label>
                <select
                  value={pendidikan}
                  onChange={(e) => setPendidikan(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition text-sm bg-white"
                >
                  <option value="SMP">SMP</option>
                  <option value="SMA/SMK">SMA/SMK</option>
                  <option value="D3">D3</option>
                  <option value="S1">S1</option>
                  <option value="S2">S2</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Ringkasan Diri (Bio Singkat)
                </label>
                <textarea
                  rows={3}
                  required
                  value={ringkasan}
                  onChange={(e) => setRingkasan(e.target.value)}
                  placeholder="Ceritakan pengalaman singkat, keahlian, atau motivasi kerja Anda..."
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition text-sm resize-none"
                />
              </div>
            </>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Email
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="nama@email.com"
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Password
            </label>
            <input
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Minimal 6 karakter"
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition text-sm"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-xl transition shadow-md shadow-blue-500/20 disabled:opacity-50 mt-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Mendaftarkan...</span>
              </>
            ) : (
              <>
                <UserPlus className="w-4 h-4" />
                <span>Daftar sebagai {role === 'perekrut' ? 'Perekrut' : 'Pelamar'}</span>
              </>
            )}
          </button>
        </form>

        <p className="text-center text-sm text-slate-600 mt-6">
          Sudah punya akun?{' '}
          <Link to="/login" className="font-semibold text-blue-600 hover:text-blue-700 hover:underline">
            Masuk di sini
          </Link>
        </p>
      </div>
    </div>
  )
}
