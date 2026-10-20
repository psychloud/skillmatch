import React, { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { uploadLogoToStorage } from '../lib/storage'
import { Button } from './ui/button'
import {
  X,
  User,
  Building2,
  Phone,
  MapPin,
  GraduationCap,
  FileText,
  Upload,
  Loader2,
  CheckCircle2,
  Camera,
} from 'lucide-react'

export function EditProfileModal({ isOpen, onClose }) {
  const { user, profile, updateProfile } = useAuth()
  const { toast } = useToast()

  const role = profile?.role || user?.user_metadata?.role || 'pelamar'

  // Perekrut fields
  const [fullName, setFullName] = useState('')
  const [companyName, setCompanyName] = useState('')
  const [logoUrl, setLogoUrl] = useState('')
  const [logoFile, setLogoFile] = useState(null)

  // Pelamar fields
  const [phone, setPhone] = useState('')
  const [domisili, setDomisili] = useState('')
  const [pendidikan, setPendidikan] = useState('SMA/SMK')
  const [ringkasan, setRingkasan] = useState('')

  const [saving, setSaving] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')

  // Initialize/reset form with current profile values when modal opens
  useEffect(() => {
    if (isOpen) {
      setErrorMsg('')
      setLogoFile(null)
      if (profile) {
        setFullName(profile.full_name || '')
        setCompanyName(profile.company_name || '')
        setLogoUrl(profile.logo_url || '')
        setPhone(profile.phone || '')
        setDomisili(profile.domisili || '')
        setPendidikan(profile.pendidikan || 'SMA/SMK')
        setRingkasan(profile.ringkasan || '')
      } else if (user?.user_metadata) {
        const meta = user.user_metadata
        setFullName(meta.full_name || '')
        setCompanyName(meta.company_name || '')
        setPhone(meta.phone || '')
        setDomisili(meta.domisili || '')
        setPendidikan(meta.pendidikan || 'SMA/SMK')
        setRingkasan(meta.ringkasan || '')
      }
    }
  }, [isOpen, profile, user])

  if (!isOpen) return null

  const handleLogoChange = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 5 * 1024 * 1024) {
      setErrorMsg('Ukuran file logo maksimal 5MB')
      return
    }
    setLogoFile(file)
    setLogoUrl(URL.createObjectURL(file))
  }

  const handleSave = async (e) => {
    e.preventDefault()
    setErrorMsg('')

    if (!fullName.trim()) {
      setErrorMsg('Nama lengkap tidak boleh kosong')
      return
    }

    if (role === 'perekrut' && !companyName.trim()) {
      setErrorMsg('Nama perusahaan / UMKM tidak boleh kosong')
      return
    }

    setSaving(true)
    try {
      let updates = {}
      if (role === 'perekrut') {
        let finalLogoUrl = logoUrl
        if (logoFile) {
          finalLogoUrl = await uploadLogoToStorage(logoFile, user?.id)
        }
        updates = {
          full_name: fullName.trim(),
          company_name: companyName.trim(),
          logo_url: finalLogoUrl || null,
        }
      } else {
        updates = {
          full_name: fullName.trim(),
          phone: phone.trim() || null,
          domisili: domisili.trim() || null,
          pendidikan: pendidikan || null,
          ringkasan: ringkasan.trim() || null,
        }
      }

      await updateProfile(updates)
      toast('Profil berhasil diperbarui!', 'success')
      onClose()
    } catch (err) {
      console.error('Error updating profile:', err)
      setErrorMsg(err.message || 'Gagal menyimpan profil. Coba lagi.')
      toast('Gagal menyimpan profil', 'error')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fade-in">
      <div
        className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] flex flex-col shadow-2xl border border-slate-100 overflow-hidden animate-scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-2.5">
            <div
              className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold ${
                role === 'perekrut' ? 'bg-blue-100 text-blue-700' : 'bg-emerald-100 text-emerald-700'
              }`}
            >
              {role === 'perekrut' ? <Building2 className="w-5 h-5" /> : <User className="w-5 h-5" />}
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base">Edit Profil</h3>
              <p className="text-xs text-slate-500">
                {role === 'perekrut' ? 'Perbarui informasi bisnis & perekrut' : 'Perbarui data diri pelamar kerja'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSave} className="flex-1 overflow-y-auto p-6 space-y-4">
          {errorMsg && (
            <div className="p-3 text-xs bg-red-50 text-red-700 border border-red-200 rounded-xl">
              {errorMsg}
            </div>
          )}

          {/* Role Perekrut Fields */}
          {role === 'perekrut' && (
            <>
              {/* Logo Upload Preview */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Logo Usaha / Perusahaan
                </label>
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-xl border border-slate-200 bg-white flex items-center justify-center overflow-hidden shrink-0 shadow-sm relative group">
                    {logoUrl ? (
                      <img src={logoUrl} alt="Logo" className="w-full h-full object-cover rounded-xl" />
                    ) : (
                      <Building2 className="w-8 h-8 text-slate-300" />
                    )}
                  </div>
                  <div className="flex-1">
                    <label className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer transition shadow-xs">
                      <Camera className="w-3.5 h-3.5 text-blue-600" />
                      Unggah Logo Baru
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleLogoChange}
                        className="hidden"
                      />
                    </label>
                    <p className="text-[11px] text-slate-400 mt-1">Format PNG, JPG, atau WEBP. Maks 2MB.</p>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nama Perusahaan / UMKM <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Kopi Kenangan Jiwa, CV Maju Bersama"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nama Penanggung Jawab (Perekrut) <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Budi Santoso"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                />
              </div>
            </>
          )}

          {/* Role Pelamar Fields */}
          {role === 'pelamar' && (
            <>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nama Lengkap <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Rizky Pratama"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Nomor WhatsApp / HP
                  </label>
                  <input
                    type="tel"
                    placeholder="Contoh: 08123456789"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Kota Domisili
                  </label>
                  <input
                    type="text"
                    placeholder="Contoh: Jakarta Selatan, Surabaya"
                    value={domisili}
                    onChange={(e) => setDomisili(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Pendidikan Terakhir
                </label>
                <select
                  value={pendidikan}
                  onChange={(e) => setPendidikan(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 bg-white"
                >
                  <option value="SMA/SMK">SMA / SMK Sederajat</option>
                  <option value="Diploma (D3)">Diploma (D3)</option>
                  <option value="Sarjana (S1)">Sarjana (S1)</option>
                  <option value="Magister (S2)">Magister (S2)</option>
                  <option value="Lainnya">Lainnya</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Ringkasan Diri / Bio Singkat
                </label>
                <textarea
                  rows={3}
                  placeholder="Ceritakan keahlian, minat, atau pengalaman kerja singkat Anda..."
                  value={ringkasan}
                  onChange={(e) => setRingkasan(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 resize-none"
                />
              </div>
            </>
          )}

          {/* Footer Actions */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onClose}
              disabled={saving}
            >
              Batal
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={saving}
              className={`gap-2 ${
                role === 'perekrut'
                  ? 'bg-blue-600 hover:bg-blue-700 text-white'
                  : 'bg-emerald-600 hover:bg-emerald-700 text-white'
              }`}
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Menyimpan...
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  Simpan Perubahan
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
