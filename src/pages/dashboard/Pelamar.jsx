import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Navbar } from '../../components/Navbar'
import { useAuth } from '../../context/AuthContext'
import { useToast } from '../../context/ToastContext'
import { supabase } from '../../lib/supabase'
import { Button } from '../../components/ui/button'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../components/ui/card'
import { Badge } from '../../components/ui/badge'
import {
  User,
  Briefcase,
  Award,
  CheckCircle2,
  Calendar,
  Building2,
  ChevronRight,
  Sparkles,
  ArrowRight,
  Loader2,
  Search,
  HelpCircle,
  FileText,
  MapPin,
  GraduationCap,
  Phone,
} from 'lucide-react'
import { SkeletonCard, SkeletonStatCard, SkeletonTable } from '../../components/ui/skeleton'

// Category Icon Mapping
const CATEGORY_ICONS = {
  admin: '📋', kasir: '💳', desainer: '🎨', teknisi: '🔧',
  marketing: '📢', gudang: '📦', customer_service: '🎧',
  keuangan: '💰', driver: '🚗', produksi: '🏭',
  it: '💻', fnb: '☕', cleaning: '🧹', security: '🛡️', sales: '📊',
}

export default function PelamarDashboard() {
  const { user, profile } = useAuth()
  const { toast } = useToast()

  // Tabs: 'browse' atau 'applications'
  const [activeTab, setActiveTab] = useState('browse')

  // Data states
  const [jobs, setJobs] = useState([])
  const [applications, setApplications] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')

  // Selected job for detail modal/sheet
  const [selectedJobDetail, setSelectedJobDetail] = useState(null)

  const fetchData = async () => {
    if (!user) return
    setLoading(true)
    try {
      // 1. Ambil semua lowongan aktif beserta nama perusahaan perekrut
      const { data: jobsData, error: jobsError } = await supabase
        .from('jobs')
        .select(`
          id,
          title,
          category,
          description,
          created_at,
          perekrut:perekrut_id (
            company_name,
            full_name,
            logo_url
          )
        `)
        .eq('is_active', true)
        .order('created_at', { ascending: false })

      if (jobsError) throw jobsError

      // 2. Ambil riwayat aplikasi milik pelamar ini
      let appsData = []
      const { data: appsRes, error: appsError } = await supabase
        .from('applications')
        .select(`
          id,
          job_id,
          score,
          status,
          submitted_at,
          job:job_id (
            id,
            title,
            category,
            perekrut:perekrut_id (
              company_name
            )
          )
        `)
        .eq('pelamar_id', user.id)
        .order('submitted_at', { ascending: false })

      if (appsError) {
        console.warn('Fallback applications query in Pelamar.jsx:', appsError.message)
        const fallbackApps = await supabase
          .from('applications')
          .select(`
            id,
            job_id,
            score,
            submitted_at,
            job:job_id (
              id,
              title,
              category,
              perekrut:perekrut_id (
                company_name
              )
            )
          `)
          .eq('pelamar_id', user.id)
          .order('submitted_at', { ascending: false })

        if (fallbackApps.error) throw fallbackApps.error
        appsData = (fallbackApps.data || []).map((app) => ({
          ...app,
          status: app.status || 'Menunggu Review',
        }))
      } else {
        appsData = appsRes || []
      }

      setJobs(jobsData || [])
      setApplications(appsData || [])
    } catch (err) {
      console.error('Error fetching pelamar data:', err)
      toast('Gagal memuat data pekerjaan', 'error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()

    // 1. Auto-refresh saat tab window difokuskan kembali (misal setelah pindah tab perekrut)
    const onFocus = () => fetchData()
    window.addEventListener('focus', onFocus)

    // 2. Real-time subscription Supabase untuk perubahan status lamaran
    const channel = supabase
      .channel('public:applications')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'applications',
          filter: user ? `pelamar_id=eq.${user.id}` : undefined,
        },
        () => {
          fetchData()
        }
      )
      .subscribe()

    return () => {
      window.removeEventListener('focus', onFocus)
      supabase.removeChannel(channel)
    }
  }, [user])

  // Set lowongan yang sudah pernah dikerjakan pelamar
  const appliedJobIds = new Set(applications.map((a) => a.job_id))

  // Filter jobs by search & category
  const filteredJobs = jobs.filter((job) => {
    const matchesSearch =
      job.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (job.perekrut?.company_name || '').toLowerCase().includes(searchQuery.toLowerCase())
    const matchesCategory = selectedCategory === 'all' || job.category === selectedCategory
    return matchesSearch && matchesCategory
  })

  // Quick stats
  const totalApplied = applications.length
  const avgScore =
    totalApplied > 0
      ? Math.round(applications.reduce((acc, a) => acc + (a.score || 0), 0) / totalApplied)
      : 0

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Header */}
        <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200/80 shadow-sm mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-6 animate-fade-in-up">
          <div className="space-y-1.5">
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
              Halo, {profile?.full_name || user?.user_metadata?.full_name || 'Pelamar'}
            </h1>
            <p className="text-sm text-slate-500 leading-relaxed max-w-xl">
              Buktikan kompetensi Anda tanpa bias CV. Ikuti tes studi kasus dan raih kesempatan kerja.
            </p>

            {(profile?.domisili || profile?.pendidikan || profile?.phone) && (
              <div className="flex items-center gap-2 pt-2 flex-wrap text-xs text-slate-600">
                {profile?.domisili && (
                  <span className="inline-flex items-center gap-1.5 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200 font-medium">
                    <MapPin className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                    {profile.domisili}
                  </span>
                )}
                {profile?.pendidikan && (
                  <span className="inline-flex items-center gap-1.5 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200 font-medium">
                    <GraduationCap className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    {profile.pendidikan}
                  </span>
                )}
                {profile?.phone && (
                  <span className="inline-flex items-center gap-1.5 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200 font-medium">
                    <Phone className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                    {profile.phone}
                  </span>
                )}
              </div>
            )}
          </div>

          <div className="w-full sm:w-auto grid grid-cols-2 sm:flex sm:items-center gap-3 shrink-0 pt-2 sm:pt-0">
            <Button
              variant={activeTab === 'browse' ? 'default' : 'outline'}
              onClick={() => setActiveTab('browse')}
              className="gap-2 w-full sm:w-auto justify-center h-11 px-4 sm:px-5 font-semibold text-xs sm:text-sm shadow-sm transition-all"
            >
              <Briefcase className="w-4 h-4 shrink-0" />
              <span>Jelajahi Lowongan</span>
            </Button>
            <Button
              variant={activeTab === 'applications' ? 'default' : 'outline'}
              onClick={() => setActiveTab('applications')}
              className="gap-2 w-full sm:w-auto justify-center h-11 px-4 sm:px-5 font-semibold text-xs sm:text-sm shadow-sm transition-all"
            >
              <Award className="w-4 h-4 shrink-0" />
              <span>Lamaran Saya</span>
              <span
                className={`ml-1 px-1.5 py-0.5 rounded-full text-xs font-bold leading-none ${
                  activeTab === 'applications'
                    ? 'bg-blue-700 text-white'
                    : 'bg-slate-100 text-slate-700 border border-slate-200'
                }`}
              >
                {totalApplied}
              </span>
            </Button>
          </div>
        </div>

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8 animate-fade-in-up stagger-1">
          <Card className="card-hover">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Lowongan Tersedia
              </span>
              <Briefcase className="w-5 h-5 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-slate-900">{jobs.length}</div>
              <p className="text-xs text-slate-500 mt-1">Siap diikuti tes skillnya</p>
            </CardContent>
          </Card>

          <Card className="card-hover">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Quiz Diselesaikan
              </span>
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-slate-900">{totalApplied}</div>
              <p className="text-xs text-slate-500 mt-1">Hasil terkirim ke perekrut</p>
            </CardContent>
          </Card>

          <Card className="card-hover">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Rata-Rata Skor Tes
              </span>
              <Award className="w-5 h-5 text-amber-500" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-slate-900">
                {totalApplied > 0 ? avgScore : '-'}
              </div>
              <p className="text-xs text-slate-500 mt-1">Verifikasi kemampuan riil</p>
            </CardContent>
          </Card>
        </div>

        {/* TAB 1: JELAJAHI LOWONGAN */}
        {activeTab === 'browse' && (
          <div className="space-y-6">
            {/* Filter & Search Bar */}
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Cari posisi atau nama UMKM..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                />
              </div>

              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              >
                <option value="all">Semua Kategori</option>
                <option value="admin">Admin & Kesekretariatan</option>
                <option value="kasir">Kasir & Pembayaran</option>
                <option value="desainer">Desainer Grafis</option>
                <option value="teknisi">Teknisi & Maintenance</option>
                <option value="marketing">Marketing & Media Sosial</option>
                <option value="gudang">Gudang & Logistik</option>
                <option value="customer_service">Customer Service</option>
                <option value="keuangan">Keuangan & Akuntansi</option>
                <option value="driver">Driver & Kurir</option>
                <option value="produksi">Produksi & Manufaktur</option>
                <option value="it">IT & Teknologi</option>
                <option value="fnb">F&B & Barista</option>
                <option value="cleaning">Cleaning Service</option>
                <option value="security">Security</option>
                <option value="sales">Sales & Agen</option>
              </select>
            </div>

            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className={`animate-fade-in-up stagger-${i + 1}`}>
                    <SkeletonCard />
                  </div>
                ))}
              </div>
            ) : filteredJobs.length === 0 ? (
              <Card className="text-center p-12 bg-white border-dashed">
                <Briefcase className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <h3 className="text-base font-semibold text-slate-800">Tidak ada lowongan ditemukan</h3>
                <p className="text-xs text-slate-500 mt-1">
                  Coba ganti kata kunci pencarian atau pilih kategori lain.
                </p>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredJobs.map((job, index) => {
                  const isApplied = appliedJobIds.has(job.id)
                  const myApp = applications.find((a) => a.job_id === job.id)

                  return (
                    <Card
                      key={job.id}
                      className="flex flex-col justify-between hover:shadow-md transition border-slate-200 card-hover animate-fade-in-up"
                      style={{ animationDelay: `${index * 0.05}s` }}
                    >
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between gap-2 mb-2">
                          <Badge variant="default" className="capitalize text-[11px] gap-1">
                            <span>{CATEGORY_ICONS[job.category] || '📌'}</span>
                            {job.category}
                          </Badge>
                          <span className="text-[11px] text-slate-400 flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {new Date(job.created_at).toLocaleDateString('id-ID', {
                              day: 'numeric',
                              month: 'short',
                            })}
                          </span>
                        </div>
                        <CardTitle className="text-lg font-bold text-slate-900 leading-snug line-clamp-1">
                          {job.title}
                        </CardTitle>
                        <div className="flex items-center gap-2 text-xs text-slate-600 font-medium pt-1.5">
                          {job.perekrut?.logo_url ? (
                            <img
                              src={job.perekrut.logo_url}
                              alt={job.perekrut.company_name}
                              className="w-5 h-5 rounded-md object-cover border border-slate-200 shrink-0"
                            />
                          ) : (
                            <Building2 className="w-4 h-4 text-slate-400 shrink-0" />
                          )}
                          <span className="truncate">{job.perekrut?.company_name || 'UMKM Lokal'}</span>
                        </div>
                      </CardHeader>

                      <CardContent className="pt-0 flex-1 flex flex-col justify-between">
                        <p className="text-xs text-slate-600 line-clamp-2 mb-4 leading-relaxed">
                          {job.description || 'Perekrut mencari kandidat yang siap diuji dengan 5 soal studi kasus praktis.'}
                        </p>

                        <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                          {isApplied ? (
                            <div className="flex items-center justify-between w-full">
                              <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600">
                                <CheckCircle2 className="w-4 h-4" /> Sudah Dikerjakan
                              </span>
                              <span className="text-xs font-bold px-2.5 py-1 bg-emerald-50 text-emerald-700 rounded-lg">
                                Skor: {myApp?.score}
                              </span>
                            </div>
                          ) : (
                            <>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setSelectedJobDetail(job)}
                                className="text-xs text-slate-600 hover:text-slate-900"
                              >
                                Detail
                              </Button>
                              <Link to={`/quiz/${job.id}`}>
                                <Button size="sm" className="gap-1.5 bg-blue-600 hover:bg-blue-700 text-xs btn-press">
                                  <Sparkles className="w-3.5 h-3.5" />
                                  Mulai Quiz
                                </Button>
                              </Link>
                            </>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: LAMARAN SAYA */}
        {activeTab === 'applications' && (
          <div className="space-y-4">
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2 mb-4">
              <Award className="w-5 h-5 text-amber-500" />
              Riwayat Tes & Lamaran Saya ({applications.length})
            </h2>

            {loading ? (
              <div className="space-y-4 animate-fade-in">
                <SkeletonTable rows={3} />
              </div>
            ) : applications.length === 0 ? (
              <Card className="text-center p-12 bg-white border-dashed">
                <Award className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <h3 className="text-base font-semibold text-slate-800">Belum Ada Lamaran</h3>
                <p className="text-xs text-slate-500 mt-1 mb-4">
                  Anda belum mengerjakan quiz untuk lowongan manapun.
                </p>
                <Button onClick={() => setActiveTab('browse')} size="sm">
                  Cari Lowongan Sekarang
                </Button>
              </Card>
            ) : (
              <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm animate-fade-in-up">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-slate-50 text-xs font-semibold text-slate-600 uppercase border-b border-slate-100">
                      <tr>
                        <th className="px-6 py-3.5">Posisi Pekerjaan</th>
                        <th className="px-6 py-3.5">Perusahaan UMKM</th>
                        <th className="px-6 py-3.5">Kategori</th>
                        <th className="px-6 py-3.5">Skor Quiz</th>
                        <th className="px-6 py-3.5">Status Lamaran</th>
                        <th className="px-6 py-3.5">Waktu Submit</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {applications.map((app) => {
                        const status = app.status || 'Menunggu Review'
                        const companyName = app.job?.perekrut?.company_name || 'UMKM Perekrut'

                        let statusBadge = (
                          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700">
                            Menunggu Review
                          </span>
                        )

                        if (status === 'Shortlisted') {
                          statusBadge = (
                            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800">
                              Shortlisted
                            </span>
                          )
                        } else if (status === 'Dihubungi') {
                          statusBadge = (
                            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
                              Dihubungi
                            </span>
                          )
                        } else if (status === 'Ditolak') {
                          statusBadge = (
                            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-800">
                              Ditolak
                            </span>
                          )
                        }

                        return (
                          <tr key={app.id} className="hover:bg-slate-50/70 transition">
                            <td className="px-6 py-4">
                              <div className="font-bold text-slate-900">{app.job?.title || 'Posisi Lowongan'}</div>
                            </td>
                            <td className="px-6 py-4 text-slate-700 text-xs font-medium">
                              {companyName}
                            </td>
                            <td className="px-6 py-4">
                              <Badge variant="default" className="text-[10px] capitalize">
                                {app.job?.category || 'Umum'}
                              </Badge>
                            </td>
                            <td className="px-6 py-4">
                              <span
                                className={`inline-flex items-center justify-center min-w-[38px] px-2.5 py-1 rounded-full text-xs font-bold ${
                                  app.score >= 80
                                    ? 'bg-emerald-100 text-emerald-800'
                                    : app.score >= 60
                                      ? 'bg-blue-100 text-blue-800'
                                      : 'bg-amber-100 text-amber-800'
                                }`}
                              >
                                {app.score}
                              </span>
                            </td>
                            <td className="px-6 py-4">
                              {statusBadge}
                            </td>
                            <td className="px-6 py-4 text-xs text-slate-500 whitespace-nowrap">
                              {new Date(app.submitted_at).toLocaleDateString('id-ID', {
                                day: 'numeric',
                                month: 'short',
                                year: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Modal Job Detail */}
      {selectedJobDetail && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 relative animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between mb-4">
              <Badge variant="default" className="capitalize">
                {selectedJobDetail.category}
              </Badge>
              <span className="text-xs text-slate-400">
                Diposting{' '}
                {new Date(selectedJobDetail.created_at).toLocaleDateString('id-ID', {
                  day: 'numeric',
                  month: 'short',
                })}
              </span>
            </div>

            <h2 className="text-xl font-bold text-slate-900">{selectedJobDetail.title}</h2>
            <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-1 mb-4">
              <Building2 className="w-4 h-4 text-slate-400" />
              <span>{selectedJobDetail.perekrut?.company_name || 'UMKM Lokal'}</span>
            </div>

            <div className="bg-slate-50 rounded-xl p-4 border border-slate-100 text-sm text-slate-700 leading-relaxed mb-6">
              <div className="font-semibold text-xs text-slate-500 uppercase tracking-wider mb-1">
                Deskripsi Pekerjaan
              </div>
              <p className="whitespace-pre-line text-xs sm:text-sm">
                {selectedJobDetail.description || 'Tidak ada catatan khusus dari perekrut.'}
              </p>
            </div>

            <div className="bg-blue-50/70 border border-blue-200/60 rounded-xl p-4 mb-6 text-xs text-blue-900 space-y-1">
              <div className="font-bold flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-blue-600" />
                Format Tes Seleksi:
              </div>
              <p>
                Anda akan mengerjakan 5 soal studi kasus pilihan ganda. Skor Anda langsung tercatat dan menjadi dasar seleksi perekrut.
              </p>
            </div>

            <div className="flex items-center justify-end gap-3">
              <Button
                variant="outline"
                onClick={() => setSelectedJobDetail(null)}
              >
                Tutup
              </Button>
              <Link to={`/quiz/${selectedJobDetail.id}`}>
                <Button className="gap-2 bg-blue-600 hover:bg-blue-700 text-white">
                  Mulai Quiz Sekarang
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
