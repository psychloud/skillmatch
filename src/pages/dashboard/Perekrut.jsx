import React, { useState, useEffect } from 'react'
import { Navbar } from '../../components/Navbar'
import { useAuth } from '../../context/AuthContext'
import { useToast } from '../../context/ToastContext'
import { supabase } from '../../lib/supabase'
import { generateQuiz, formatJobDescription } from '../../lib/ai'
import { Button } from '../../components/ui/button'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../components/ui/card'
import { Badge } from '../../components/ui/badge'
import {
  Building2,
  Plus,
  Users,
  FileCheck2,
  Sparkles,
  Loader2,
  Trophy,
  Calendar,
  ChevronRight,
  HelpCircle,
  Briefcase,
  X,
  AlertCircle,
  Eye,
  Phone,
  MapPin,
  GraduationCap,
  CheckCircle2,
  XCircle,
  Trash2,
  ToggleLeft,
  ToggleRight,
  AlertTriangle,
} from 'lucide-react'
import { SkeletonJobRow, SkeletonStatCard, SkeletonTable } from '../../components/ui/skeleton'

// Category Icon Mapping
const CATEGORY_ICONS = {
  admin: '📋', kasir: '💳', desainer: '🎨', teknisi: '🔧',
  marketing: '📢', gudang: '📦', customer_service: '🎧',
  keuangan: '💰', driver: '🚗', produksi: '🏭',
  it: '💻', fnb: '☕', cleaning: '🧹', security: '🛡️', sales: '📊',
}

const JOB_CATEGORIES = [
  { value: 'admin', label: 'Admin & Kesekretariatan' },
  { value: 'kasir', label: 'Kasir & Pembayaran' },
  { value: 'desainer', label: 'Desainer Grafis' },
  { value: 'teknisi', label: 'Teknisi & Maintenance' },
  { value: 'marketing', label: 'Marketing & Media Sosial' },
  { value: 'gudang', label: 'Gudang & Logistik' },
  { value: 'customer_service', label: 'Customer Service' },
  { value: 'keuangan', label: 'Keuangan & Akuntansi' },
  { value: 'driver', label: 'Driver & Kurir' },
  { value: 'produksi', label: 'Produksi & Manufaktur' },
  { value: 'it', label: 'IT & Teknologi' },
  { value: 'fnb', label: 'F&B & Barista' },
  { value: 'cleaning', label: 'Cleaning Service' },
  { value: 'security', label: 'Security' },
  { value: 'sales', label: 'Sales & Agen' },
]

export default function PerekrutDashboard() {
  const { user, profile } = useAuth()
  const { toast } = useToast()

  // State lowongan & kandidat
  const [jobs, setJobs] = useState([])
  const [loadingJobs, setLoadingJobs] = useState(true)
  const [selectedJob, setSelectedJob] = useState(null)
  const [applicants, setApplicants] = useState([])
  const [jobQuestions, setJobQuestions] = useState([])
  const [loadingApplicants, setLoadingApplicants] = useState(false)
  const [activeApplicant, setActiveApplicant] = useState(null)

  // State toggle & delete
  const [jobToDelete, setJobToDelete] = useState(null)
  const [deletingJob, setDeletingJob] = useState(false)
  const [togglingJobId, setTogglingJobId] = useState(null)

  // State generate ulang soal
  const [regeneratingQuestions, setRegeneratingQuestions] = useState(false)
  const [showRegenerateConfirm, setShowRegenerateConfirm] = useState(false)

  // Modal / Form state
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [creating, setCreating] = useState(false)
  const [jobTitle, setJobTitle] = useState('')
  const [category, setCategory] = useState('admin')
  const [description, setDescription] = useState('')

  // Fetch semua lowongan milik perekrut ini
  const fetchJobs = async () => {
    if (!user) return
    setLoadingJobs(true)
    try {
      const { data: jobsData, error: jobsError } = await supabase
        .from('jobs')
        .select(`
          id,
          title,
          category,
          description,
          is_active,
          created_at,
          applications (
            id,
            score
          )
        `)
        .eq('perekrut_id', user.id)
        .order('created_at', { ascending: false })

      if (jobsError) throw jobsError

      // Format data: hitung applicant count & average score
      const formatted = (jobsData || []).map((job) => {
        const apps = job.applications || []
        const count = apps.length
        const avg = count > 0 ? Math.round(apps.reduce((sum, a) => sum + (a.score || 0), 0) / count) : 0
        return {
          ...job,
          is_active: job.is_active !== false,
          applicantCount: count,
          averageScore: avg,
        }
      })

      setJobs(formatted)

      // Auto-select job pertama jika belum ada yang dipilih
      if (formatted.length > 0 && !selectedJob) {
        selectJob(formatted[0])
      } else if (selectedJob) {
        const matched = formatted.find((j) => j.id === selectedJob.id)
        if (matched) {
          setSelectedJob((prev) => ({ ...prev, ...matched }))
        }
      }
    } catch (err) {
      console.error('Error fetching jobs:', err)
      toast('Gagal memuat daftar lowongan', 'error')
    } finally {
      setLoadingJobs(false)
    }
  }

  // Toggle status aktif/nonaktif lowongan
  const toggleJobStatus = async (job, e) => {
    if (e) e.stopPropagation()
    const newStatus = !(job.is_active !== false)
    setTogglingJobId(job.id)
    try {
      const { error } = await supabase
        .from('jobs')
        .update({ is_active: newStatus })
        .eq('id', job.id)

      if (error) throw error

      setJobs((prev) =>
        prev.map((j) => (j.id === job.id ? { ...j, is_active: newStatus } : j))
      )
      if (selectedJob?.id === job.id) {
        setSelectedJob((prev) => ({ ...prev, is_active: newStatus }))
      }
      toast(
        newStatus
          ? `Lowongan "${job.title}" diaktifkan (siap dilamar)`
          : `Lowongan "${job.title}" dinonaktifkan`,
        'success'
      )
    } catch (err) {
      console.error('Error toggling job status:', err)
      toast('Gagal mengubah status lowongan', 'error')
    } finally {
      setTogglingJobId(null)
    }
  }

  // Hapus lowongan & relasi aplikasi dan pertanyaan
  const handleDeleteJob = async () => {
    if (!jobToDelete) return
    setDeletingJob(true)
    try {
      // 1. Hapus lamaran yang terkait (mencegah foreign key constraint error jika cascade belum aktif)
      const { error: appErr } = await supabase
        .from('applications')
        .delete()
        .eq('job_id', jobToDelete.id)

      if (appErr) console.warn('Note deleting applications:', appErr.message)

      // 2. Hapus pertanyaan kuis yang terkait
      const { error: qErr } = await supabase
        .from('questions')
        .delete()
        .eq('job_id', jobToDelete.id)

      if (qErr) console.warn('Note deleting questions:', qErr.message)

      // 3. Hapus data lowongan
      const { error: jobErr } = await supabase
        .from('jobs')
        .delete()
        .eq('id', jobToDelete.id)

      if (jobErr) throw jobErr

      toast(`Lowongan "${jobToDelete.title}" berhasil dihapus`, 'success')

      const remainingJobs = jobs.filter((j) => j.id !== jobToDelete.id)
      setJobs(remainingJobs)

      if (selectedJob?.id === jobToDelete.id) {
        if (remainingJobs.length > 0) {
          selectJob(remainingJobs[0])
        } else {
          setSelectedJob(null)
          setApplicants([])
          setJobQuestions([])
        }
      }

      setJobToDelete(null)
    } catch (err) {
      console.error('Error deleting job:', err)
      toast(`Gagal menghapus lowongan: ${err.message || 'Error server'}`, 'error')
    } finally {
      setDeletingJob(false)
    }
  }

  useEffect(() => {
    fetchJobs()
  }, [user])

  // Pilih lowongan untuk melihat pelamar & soalnya
  const selectJob = async (job) => {
    setSelectedJob(job)
    setLoadingApplicants(true)
    try {
      // 1. Ambil applications beserta profil pelamar (dengan fallback jika kolom baru belum dimigrasi di SQL)
      let appsData = null
      let { data, error } = await supabase
        .from('applications')
        .select(`
          id,
          score,
          answers,
          status,
          submitted_at,
          pelamar:pelamar_id (
            id,
            full_name,
            phone,
            domisili,
            pendidikan,
            ringkasan
          )
        `)
        .eq('job_id', job.id)
        .order('score', { ascending: false })

      if (error) {
        // Fallback jika kolom phone/domisili/pendidikan/status belum ada di DB
        console.warn('Fallback query applicants due to missing columns:', error.message)
        const fallbackRes = await supabase
          .from('applications')
          .select(`
            id,
            score,
            answers,
            submitted_at,
            pelamar:pelamar_id (
              id,
              full_name
            )
          `)
          .eq('job_id', job.id)
          .order('score', { ascending: false })

        if (fallbackRes.error) throw fallbackRes.error
        appsData = (fallbackRes.data || []).map((app) => ({
          ...app,
          status: app.status || 'Menunggu Review',
        }))
      } else {
        appsData = data || []
      }

      setApplicants(appsData)

      // 2. Ambil soal yang digenerate AI untuk lowongan ini
      const { data: qData, error: qError } = await supabase
        .from('questions')
        .select('*')
        .eq('job_id', job.id)
        .order('order_num', { ascending: true })

      if (!qError) {
        setJobQuestions(qData || [])
      }
    } catch (err) {
      console.error('Error fetching applicants:', err)
      toast('Gagal mengambil daftar pelamar', 'error')
    } finally {
      setLoadingApplicants(false)
    }
  }

  // Update status pelamar (Menunggu Review, Shortlisted, Dihubungi, Ditolak)
  const handleUpdateStatus = async (applicationId, newStatus) => {
    try {
      const { error } = await supabase
        .from('applications')
        .update({ status: newStatus })
        .eq('id', applicationId)

      if (error) throw error

      setApplicants((prev) =>
        prev.map((app) => (app.id === applicationId ? { ...app, status: newStatus } : app))
      )
      if (activeApplicant?.id === applicationId) {
        setActiveApplicant((prev) => ({ ...prev, status: newStatus }))
      }

      toast(`Status kandidat berhasil diubah jadi "${newStatus}"`, 'success')
    } catch (err) {
      console.error('Failed to update status:', err)
      toast(`Gagal mengubah status: ${err.message}`, 'error')
    }
  }

  // Handle Generate Ulang Soal Tes AI
  const handleRegenerateQuestions = async () => {
    if (!selectedJob) return
    setShowRegenerateConfirm(false)
    setRegeneratingQuestions(true)
    toast('Loading...', 'info', 3000)

    try {
      // 1. Call generateQuiz(category, jobTitle) for that job
      const newQuestions = await generateQuiz(selectedJob.category, selectedJob.title)
      if (!newQuestions || newQuestions.length === 0) {
        throw new Error('Gagal menghasilkan soal dari AI')
      }

      // 2. Delete existing questions for that job_id from questions table
      const { error: delError } = await supabase
        .from('questions')
        .delete()
        .eq('job_id', selectedJob.id)

      if (delError) {
        console.warn('Note deleting old questions:', delError)
      }

      // 3. Format and insert new 5 questions
      const questionsToInsert = newQuestions.map((q, idx) => ({
        job_id: selectedJob.id,
        question_text: q.question,
        option_a: q.option_a,
        option_b: q.option_b,
        option_c: q.option_c,
        option_d: q.option_d,
        correct_answer: (q.correct_answer || 'a').toLowerCase(),
        order_num: idx + 1,
      }))

      const { data: insertedData, error: insError } = await supabase
        .from('questions')
        .insert(questionsToInsert)
        .select()

      if (insError) throw insError

      // 4. Refresh the questions display
      if (insertedData && insertedData.length > 0) {
        setJobQuestions(insertedData)
      } else {
        const { data: freshQ } = await supabase
          .from('questions')
          .select('*')
          .eq('job_id', selectedJob.id)
          .order('order_num', { ascending: true })
        setJobQuestions(freshQ || questionsToInsert)
      }

      // 5. Show success toast
      toast('5 soal baru berhasil dibuat', 'success')
    } catch (err) {
      console.error('Error regenerating questions:', err)
      toast(`Gagal membuat soal baru: ${err.message || 'Error AI'}`, 'error')
    } finally {
      setRegeneratingQuestions(false)
    }
  }

  // Handle pembuatan lowongan baru + AI generation
  const handleCreateJob = async (e) => {
    e.preventDefault()
    if (!jobTitle.trim()) {
      toast('Judul lowongan wajib diisi', 'error')
      return
    }

    setCreating(true)
    toast('Sedang merancang soal tes & merapikan deskripsi dengan AI...', 'info', 3000)

    try {
      // 1. Call generateQuiz dan formatJobDescription secara paralel via Promise.all
      const [questions, formattedDesc] = await Promise.all([
        generateQuiz(category, jobTitle),
        formatJobDescription(description, jobTitle, category)
      ])

      if (!questions || questions.length === 0) {
        throw new Error('Gagal menghasilkan soal dari AI')
      }

      // 2. Pastikan profil perekrut ada di tabel profiles (mencegah foreign key constraint error)
      const { error: profileCheckError } = await supabase.from('profiles').upsert({
        id: user.id,
        role: profile?.role || user.user_metadata?.role || 'perekrut',
        full_name: profile?.full_name || user.user_metadata?.full_name || user.email?.split('@')[0],
        company_name: profile?.company_name || user.user_metadata?.company_name || 'Perusahaan UMKM',
        ...(profile?.logo_url ? { logo_url: profile.logo_url } : {}),
      })
      if (profileCheckError) {
        console.warn('Upsert profile notice:', profileCheckError)
      }

      // 3. Simpan Job ke database Supabase dengan deskripsi yang sudah diformat AI
      const { data: newJob, error: jobError } = await supabase
        .from('jobs')
        .insert({
          perekrut_id: user.id,
          title: jobTitle,
          category,
          description: formattedDesc || description || null,
          is_active: true,
        })
        .select()
        .single()

      if (jobError) throw jobError

      // 3. Simpan 5 Pertanyaan ke database Supabase
      const questionsToInsert = questions.map((q, idx) => ({
        job_id: newJob.id,
        question_text: q.question,
        option_a: q.option_a,
        option_b: q.option_b,
        option_c: q.option_c,
        option_d: q.option_d,
        correct_answer: (q.correct_answer || 'a').toLowerCase(),
        order_num: idx + 1,
      }))

      const { error: qError } = await supabase.from('questions').insert(questionsToInsert)
      if (qError) {
        console.warn('Questions insert error:', qError)
      }

      toast('Lowongan & 5 Soal AI berhasil diterbitkan!', 'success')

      // Reset form & reload
      setJobTitle('')
      setDescription('')
      setShowCreateModal(false)
      await fetchJobs()
      selectJob({ ...newJob, applicantCount: 0, averageScore: 0 })
    } catch (err) {
      console.error(err)
      toast(`Gagal membuat lowongan: ${err.message}`, 'error')
    } finally {
      setCreating(false)
    }
  }

  // Ringkasan metrik statistik
  const totalJobs = jobs.length
  const activeJobsCount = jobs.filter((j) => j.is_active !== false).length
  const totalApplicants = jobs.reduce((sum, j) => sum + (j.applicantCount || 0), 0)
  const overallAvg =
    totalApplicants > 0
      ? Math.round(
        jobs.reduce((sum, j) => sum + (j.averageScore * j.applicantCount), 0) / totalApplicants
      )
      : 0

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header Section */}
        <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200/80 shadow-sm mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-6 animate-fade-in-up">
          <div className="flex items-center gap-4">
            {/* Logo Usaha / UMKM */}
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl border border-slate-200 bg-white flex items-center justify-center overflow-hidden shrink-0 shadow-xs">
              {profile?.logo_url ? (
                <img
                  src={profile.logo_url}
                  alt={profile?.company_name || user?.user_metadata?.company_name || 'Logo UMKM'}
                  className="w-full h-full object-cover rounded-2xl"
                />
              ) : (
                <Building2 className="w-8 h-8 sm:w-10 sm:h-10 text-slate-400" />
              )}
            </div>

            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">
                {profile?.company_name || user?.user_metadata?.company_name || 'Usaha / UMKM Anda'}
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-xl leading-relaxed">
                Buat lowongan dengan prompt singkat. Sistem otomatis menyusun 5 tes studi kasus untuk menyaring kandidat terbaik.
              </p>
            </div>
          </div>

          <Button
            onClick={() => setShowCreateModal(true)}
            size="lg"
            className="gap-2 shrink-0 self-start sm:self-center shadow-lg shadow-blue-500/20 btn-press"
          >
            <Plus className="w-5 h-5" />
            Buka Lowongan Baru
          </Button>
        </div>

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8 animate-fade-in-up stagger-1">
          <Card className="card-hover">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Total Lowongan
              </span>
              <FileCheck2 className="w-5 h-5 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-slate-900">{totalJobs}</div>
              <p className="text-xs text-slate-500 mt-1">
                {activeJobsCount} posisi aktif dibuka
              </p>
            </CardContent>
          </Card>

          <Card className="card-hover">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Total Pelamar Masuk
              </span>
              <Users className="w-5 h-5 text-emerald-600" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-slate-900">{totalApplicants}</div>
              <p className="text-xs text-slate-500 mt-1">Kandidat yang telah menyelesaikan tes</p>
            </CardContent>
          </Card>

          <Card className="card-hover">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Rata-rata Skor Tes
              </span>
              <Trophy className="w-5 h-5 text-amber-500" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-slate-900">
                {totalApplicants > 0 ? overallAvg : '-'}
              </div>
              <p className="text-xs text-slate-500 mt-1">Skor validasi kemampuan nyata</p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content: Split View Table Lowongan & Detail Ranking */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Kolom Kiri: Tabel Daftar Lowongan (5 Kolom di Layar Lebar) */}
          <div className="lg:col-span-5 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Briefcase className="w-5 h-5 text-blue-600" />
                Daftar Lowongan ({jobs.length})
              </h2>
            </div>

            {loadingJobs ? (
              <div className="p-12 text-center bg-white rounded-2xl border border-slate-200 animate-fade-in">
                <Loader2 className="w-6 h-6 animate-spin text-blue-600 mx-auto mb-2" />
                <span className="text-xs text-slate-500">Memuat lowongan...</span>
              </div>
            ) : jobs.length === 0 ? (
              <Card className="text-center p-8 bg-white border-dashed animate-scale-in">
                <Building2 className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <h3 className="text-sm font-semibold text-slate-800">Belum Ada Lowongan</h3>
                <p className="text-xs text-slate-500 mt-1 mb-4">
                  Klik tombol di bawah untuk membuat lowongan pertama Anda.
                </p>
                <Button onClick={() => setShowCreateModal(true)} size="sm" variant="outline">
                  <Plus className="w-4 h-4 mr-1" /> Buat Lowongan
                </Button>
              </Card>
            ) : (
              <div className="space-y-3">
                {jobs.map((job) => {
                  const isSelected = selectedJob?.id === job.id
                  const isActive = job.is_active !== false

                  return (
                    <div
                      key={job.id}
                      onClick={() => selectJob(job)}
                      className={`p-4 rounded-xl border transition-all duration-200 cursor-pointer card-hover animate-fade-in-up ${isSelected
                          ? isActive
                            ? 'bg-blue-50/70 border-blue-400 ring-2 ring-blue-500/20 shadow-sm'
                            : 'bg-slate-100/90 border-slate-300 ring-2 ring-slate-400/20 shadow-sm opacity-85'
                          : isActive
                            ? 'bg-white border-slate-200 hover:border-slate-300 hover:shadow-sm'
                            : 'bg-slate-50/80 border-slate-200 opacity-60 grayscale-[30%] hover:opacity-85'
                        }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                            <Badge variant="default" className="text-[10px] px-2 py-0.5 capitalize gap-1">
                              <span>{CATEGORY_ICONS[job.category] || '📌'}</span>
                              {job.category}
                            </Badge>
                            <span
                              className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border ${isActive
                                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                  : 'bg-slate-200/70 text-slate-600 border-slate-300'
                                }`}
                            >
                              <span
                                className={`w-1.5 h-1.5 rounded-full ${isActive ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'
                                  }`}
                              ></span>
                              {isActive ? 'Aktif' : 'Nonaktif'}
                            </span>
                          </div>
                          <h3
                            className={`font-bold text-sm ${isActive ? 'text-slate-900' : 'text-slate-600'
                              }`}
                          >
                            {job.title}
                          </h3>
                        </div>
                        <ChevronRight
                          className={`w-5 h-5 transition shrink-0 ${isSelected ? 'text-blue-600 translate-x-1' : 'text-slate-400'
                            }`}
                        />
                      </div>

                      <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                        <div className="flex items-center gap-3 text-slate-500">
                          <span className="flex items-center gap-1 font-medium text-slate-700">
                            <Users className="w-3.5 h-3.5 text-blue-600" />
                            {job.applicantCount} Pelamar
                          </span>
                          <span>
                            Rata-rata:{' '}
                            <strong className="text-slate-800">
                              {job.applicantCount > 0 ? `${job.averageScore} pt` : '-'}
                            </strong>
                          </span>
                        </div>

                        {/* Action Buttons: Toggle Active & Delete */}
                        <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                          <button
                            type="button"
                            onClick={(e) => toggleJobStatus(job, e)}
                            disabled={togglingJobId === job.id}
                            title={isActive ? 'Klik untuk menonaktifkan lowongan' : 'Klik untuk mengaktifkan lowongan'}
                            className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-lg border transition shadow-2xs ${isActive
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                                : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
                              }`}
                          >
                            {togglingJobId === job.id ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : isActive ? (
                              <ToggleRight className="w-4 h-4 text-emerald-600" />
                            ) : (
                              <ToggleLeft className="w-4 h-4 text-slate-400" />
                            )}
                            <span className="hidden sm:inline">{isActive ? 'Aktif' : 'Nonaktif'}</span>
                          </button>

                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation()
                              setJobToDelete(job)
                            }}
                            title="Hapus lowongan & pelamar terkait"
                            className="p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg border border-transparent hover:border-red-200 transition"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Kolom Kanan: Detail Ranking Pelamar untuk Job Terpilih (7 Kolom di Layar Lebar) */}
          <div className="lg:col-span-7">
            {selectedJob ? (
              <Card className="bg-white">
                <CardHeader className="border-b border-slate-100 pb-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                        <Badge variant="default" className="capitalize text-xs gap-1">
                          <span>{CATEGORY_ICONS[selectedJob.category] || '📌'}</span>
                          {selectedJob.category}
                        </Badge>
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${selectedJob.is_active !== false
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : 'bg-slate-100 text-slate-600 border-slate-300'
                            }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${selectedJob.is_active !== false ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'
                              }`}
                          ></span>
                          {selectedJob.is_active !== false ? 'Aktif Menerima Lamaran' : 'Lowongan Nonaktif'}
                        </span>
                        <span className="text-xs text-slate-400 flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {new Date(selectedJob.created_at).toLocaleDateString('id-ID', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </span>
                      </div>
                      <CardTitle className="text-xl font-bold text-slate-900">{selectedJob.title}</CardTitle>
                      {selectedJob.description && (
                        <p className="text-xs text-slate-600 mt-1 leading-relaxed">{selectedJob.description}</p>
                      )}
                    </div>

                    {/* Action buttons in detail pane */}
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={(e) => toggleJobStatus(selectedJob, e)}
                        disabled={togglingJobId === selectedJob.id}
                        title={selectedJob.is_active !== false ? 'Nonaktifkan lowongan ini' : 'Aktifkan lowongan ini'}
                        className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1.5 rounded-xl border transition shadow-xs ${selectedJob.is_active !== false
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                            : 'bg-slate-100 text-slate-700 border-slate-300 hover:bg-slate-200'
                          }`}
                      >
                        {togglingJobId === selectedJob.id ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : selectedJob.is_active !== false ? (
                          <ToggleRight className="w-4 h-4 text-emerald-600" />
                        ) : (
                          <ToggleLeft className="w-4 h-4 text-slate-400" />
                        )}
                        <span>{selectedJob.is_active !== false ? 'Aktif' : 'Nonaktif'}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setJobToDelete(selectedJob)}
                        title="Hapus Lowongan Ini"
                        className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl border border-slate-200 hover:border-red-200 transition shadow-xs"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="pt-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                      <Trophy className="w-4 h-4 text-amber-500" />
                      Peringkat Pelamar Teratas (Berdasarkan Skor)
                    </h3>
                    <span className="text-xs text-slate-500">
                      Total: {applicants.length} kandidat
                    </span>
                  </div>

                  {loadingApplicants ? (
                    <div className="p-12 text-center animate-fade-in">
                      <Loader2 className="w-6 h-6 animate-spin text-blue-600 mx-auto mb-2" />
                      <span className="text-xs text-slate-500">Memuat peringkat kandidat...</span>
                    </div>
                  ) : applicants.length === 0 ? (
                    <div className="text-center py-12 px-4 border border-dashed rounded-xl bg-slate-50/50">
                      <Users className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                      <p className="text-sm font-medium text-slate-700">Belum ada pelamar yang submit quiz</p>
                      <p className="text-xs text-slate-400 mt-1">
                        Ketika pelamar mengerjakan quiz pada lowongan ini, nama dan skornya akan otomatis muncul di sini.
                      </p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto border border-slate-100 rounded-xl">
                      <table className="w-full text-left text-sm">
                        <thead className="bg-slate-50 text-xs font-semibold text-slate-600 uppercase border-b border-slate-100">
                          <tr>
                            <th className="px-4 py-3">Rank</th>
                            <th className="px-4 py-3">Nama Pelamar</th>
                            <th className="px-4 py-3 text-center">Skor Tes</th>
                            <th className="px-4 py-3">Status Lamaran</th>
                            <th className="px-4 py-3">Waktu Submit</th>
                            <th className="px-4 py-3 text-right">Aksi</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {applicants.map((app, index) => {
                            const pelamar = app.pelamar || {}
                            const currentStatus = app.status || 'Menunggu Review'
                            return (
                              <tr
                                key={app.id}
                                className={`transition hover:bg-slate-50/80 ${index === 0 ? 'bg-amber-50/40' : ''
                                  }`}
                              >
                                <td className="px-4 py-3 font-bold">
                                  {index === 0 && <span className="text-amber-500 mr-1">🥇</span>}
                                  {index === 1 && <span className="text-slate-400 mr-1">🥈</span>}
                                  {index === 2 && <span className="text-amber-700 mr-1">🥉</span>}
                                  #{index + 1}
                                </td>
                                <td className="px-4 py-3">
                                  <div className="font-semibold text-slate-900">
                                    {pelamar.full_name || 'Pelamar Kerja'}
                                  </div>
                                </td>
                                <td className="px-4 py-3 text-center">
                                  <span
                                    className={`inline-flex items-center justify-center min-w-[38px] px-2.5 py-1 rounded-full text-xs font-bold ${app.score >= 80
                                        ? 'bg-emerald-100 text-emerald-800'
                                        : app.score >= 60
                                          ? 'bg-blue-100 text-blue-800'
                                          : 'bg-amber-100 text-amber-800'
                                      }`}
                                  >
                                    {app.score}
                                  </span>
                                </td>
                                <td className="px-4 py-3">
                                  <select
                                    value={currentStatus}
                                    onChange={(e) => handleUpdateStatus(app.id, e.target.value)}
                                    className={`text-xs font-semibold px-2.5 py-1 rounded-lg border focus:outline-none focus:ring-2 focus:ring-blue-500 transition cursor-pointer ${currentStatus === 'Shortlisted'
                                        ? 'bg-blue-50 text-blue-700 border-blue-200'
                                        : currentStatus === 'Dihubungi'
                                          ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                                          : currentStatus === 'Ditolak'
                                            ? 'bg-red-50 text-red-700 border-red-200'
                                            : 'bg-slate-100 text-slate-700 border-slate-200'
                                      }`}
                                  >
                                    <option value="Menunggu Review">Menunggu Review</option>
                                    <option value="Shortlisted">Shortlisted</option>
                                    <option value="Dihubungi">Dihubungi</option>
                                    <option value="Ditolak">Ditolak</option>
                                  </select>
                                </td>
                                <td className="px-4 py-3 text-xs text-slate-500 whitespace-nowrap">
                                  {new Date(app.submitted_at).toLocaleDateString('id-ID', {
                                    day: 'numeric',
                                    month: 'short',
                                    hour: '2-digit',
                                    minute: '2-digit',
                                  })}
                                </td>
                                <td className="px-4 py-3 text-right">
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => setActiveApplicant(app)}
                                    className="gap-1.5 text-xs text-blue-600 border-blue-200 hover:bg-blue-50 hover:text-blue-700"
                                  >
                                    <Eye className="w-3.5 h-3.5" />
                                    Lihat Profil
                                  </Button>
                                </td>
                              </tr>
                            )
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}

                  {/* 5 Soal yang Digenerate AI */}
                  <div className="mt-8 pt-6 border-t border-slate-100">
                    <div className="flex items-center justify-between gap-2 mb-3 flex-wrap">
                      <div className="flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-blue-600" />
                        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                          5 Soal Studi Kasus
                        </h4>
                      </div>

                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled={regeneratingQuestions}
                        onClick={() => setShowRegenerateConfirm(true)}
                        className="gap-1.5 text-xs text-blue-600 border-blue-200 hover:bg-blue-50 hover:text-blue-700 shadow-2xs transition"
                      >
                        {regeneratingQuestions ? (
                          <>
                            <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-600" />
                            <span>Membuat Soal Baru...</span>
                          </>
                        ) : (
                          <>
                            <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                            <span>Generate Ulang Soal</span>
                          </>
                        )}
                      </Button>
                    </div>

                    {jobQuestions.length === 0 ? (
                      <div className="p-6 text-center bg-slate-50 border border-dashed border-slate-200 rounded-xl">
                        <p className="text-xs text-slate-500 mb-3">Belum ada bank soal untuk lowongan ini.</p>
                        <Button
                          size="sm"
                          disabled={regeneratingQuestions}
                          onClick={() => setShowRegenerateConfirm(true)}
                          className="gap-1.5 text-xs bg-blue-600 hover:bg-blue-700 text-white"
                        >
                          <Sparkles className="w-3.5 h-3.5" /> Buat Soal Sekarang
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {jobQuestions.map((q, idx) => (
                          <div
                            key={q.id || idx}
                            className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/70 text-xs space-y-1.5"
                          >
                            <p className="font-semibold text-slate-900">
                              {idx + 1}. {q.question_text}
                            </p>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 text-slate-600 pl-4">
                              <span className={q.correct_answer === 'a' ? 'font-bold text-emerald-600' : ''}>
                                A. {q.option_a}
                              </span>
                              <span className={q.correct_answer === 'b' ? 'font-bold text-emerald-600' : ''}>
                                B. {q.option_b}
                              </span>
                              <span className={q.correct_answer === 'c' ? 'font-bold text-emerald-600' : ''}>
                                C. {q.option_c}
                              </span>
                              <span className={q.correct_answer === 'd' ? 'font-bold text-emerald-600' : ''}>
                                D. {q.option_d}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card className="p-12 text-center bg-white border-dashed">
                <Briefcase className="w-12 h-12 text-slate-300 mx-auto mb-2" />
                <h3 className="text-base font-semibold text-slate-800">Pilih Lowongan</h3>
                <p className="text-xs text-slate-500 mt-1">
                  Pilih lowongan di sebelah kiri untuk melihat peringkat pelamar dan bank soal AI.
                </p>
              </Card>
            )}
          </div>
        </div>
      </main>

      {/* Modal Buat Lowongan Baru */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 relative animate-in fade-in zoom-in-95 duration-200">
            <button
              onClick={() => !creating && setShowCreateModal(false)}
              className="absolute top-5 right-5 text-slate-400 hover:text-slate-600 transition"
              disabled={creating}
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2 mb-2">
              <span className="p-2 bg-blue-50 text-blue-600 rounded-xl">
                <Sparkles className="w-5 h-5" />
              </span>
              <h2 className="text-xl font-bold text-slate-900">Buka Lowongan Baru</h2>
            </div>
            <p className="text-xs text-slate-500 mb-6">
             Sistem akan secara otomatis membuat 5 soal studi kasus nyata pilihan ganda berdasarkan posisi ini.
            </p>

            <form onSubmit={handleCreateJob} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Judul Posisi Pekerjaan
                </label>
                <input
                  type="text"
                  required
                  value={jobTitle}
                  onChange={(e) => setJobTitle(e.target.value)}
                  placeholder="Contoh: Kasir Shift Pagi Resto Kopi"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Kategori Posisi (Target Soal AI)
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                >
                  {JOB_CATEGORIES.map((cat) => (
                    <option key={cat.value} value={cat.value}>
                      {cat.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Deskripsi Singkat / Syarat Khusus (Opsional)
                </label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Contoh: Lokasi outlet Jakarta Selatan, jam kerja 08:00 - 16:00, teliti & ramah."
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="pt-3 flex items-center justify-end gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowCreateModal(false)}
                  disabled={creating}
                >
                  Batal
                </Button>
                <Button
                  type="submit"
                  disabled={creating}
                  className="gap-2 bg-blue-600 hover:bg-blue-700 text-white"
                >
                  {creating ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Merancang Soal...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      <span>Terbitkan & Buat Quiz</span>
                    </>
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Detail Profil & Jawaban Kuis Pelamar */}
      {activeApplicant && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-100 max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between border-b border-slate-100 pb-4 mb-5">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-blue-600 bg-blue-50 px-2.5 py-1 rounded-md">
                  Profil Pelamar & Hasil Quiz
                </span>
                <h3 className="text-xl font-bold text-slate-900 mt-2">
                  {activeApplicant.pelamar?.full_name || 'Pelamar Kerja'}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Melamar untuk posisi: <span className="font-semibold text-slate-700">{selectedJob?.title}</span>
                </p>
              </div>
              <button
                onClick={() => setActiveApplicant(null)}
                className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Profile Information Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6 bg-slate-50 p-4 rounded-xl border border-slate-100 text-xs">
              <div className="flex items-center gap-2 text-slate-700">
                <Phone className="w-4 h-4 text-emerald-600 shrink-0" />
                <div>
                  <span className="text-[10px] text-slate-400 block uppercase font-semibold">Nomor WhatsApp / HP</span>
                  <span className="font-medium text-slate-900">{activeApplicant.pelamar?.phone || '-'}</span>
                </div>
              </div>

              <div className="flex items-center gap-2 text-slate-700">
                <MapPin className="w-4 h-4 text-rose-600 shrink-0" />
                <div>
                  <span className="text-[10px] text-slate-400 block uppercase font-semibold">Domisili</span>
                  <span className="font-medium text-slate-900">{activeApplicant.pelamar?.domisili || '-'}</span>
                </div>
              </div>

              <div className="flex items-center gap-2 text-slate-700">
                <GraduationCap className="w-4 h-4 text-indigo-600 shrink-0" />
                <div>
                  <span className="text-[10px] text-slate-400 block uppercase font-semibold">Pendidikan Terakhir</span>
                  <span className="font-medium text-slate-900">{activeApplicant.pelamar?.pendidikan || '-'}</span>
                </div>
              </div>

              <div className="flex items-center gap-2 text-slate-700">
                <Trophy className="w-4 h-4 text-amber-500 shrink-0" />
                <div>
                  <span className="text-[10px] text-slate-400 block uppercase font-semibold">Skor Tes Kuis</span>
                  <span className="font-bold text-slate-900 text-sm">
                    {activeApplicant.score}
                  </span>
                </div>
              </div>

              {activeApplicant.pelamar?.ringkasan && (
                <div className="sm:col-span-2 pt-2 border-t border-slate-200/60 mt-1">
                  <span className="text-[10px] text-slate-400 block uppercase font-semibold mb-1">
                    Ringkasan Diri / Bio
                  </span>
                  <p className="text-slate-700 leading-relaxed italic bg-white p-2.5 rounded-lg border border-slate-200">
                    "{activeApplicant.pelamar.ringkasan}"
                  </p>
                </div>
              )}
            </div>

            {/* Breakdown Jawaban Soal Quiz */}
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-blue-600" />
                  Rincian Jawaban Soal Quiz ({jobQuestions.length} Soal)
                </h4>
                <span className="text-xs text-slate-500">
                  Kunci Hijau = Benar, Merah = Jawaban Salah
                </span>
              </div>

              {jobQuestions.length === 0 ? (
                <p className="text-xs text-slate-500 italic py-4 text-center">Data pertanyaan tidak ditemukan.</p>
              ) : (
                <div className="space-y-4">
                  {jobQuestions.map((q, idx) => {
                    const applicantAnswer = activeApplicant.answers?.[q.id] || activeApplicant.answers?.[`q${idx + 1}`] || activeApplicant.answers?.[idx]
                    const isCorrect = applicantAnswer && applicantAnswer.toLowerCase() === (q.correct_answer || '').toLowerCase()

                    return (
                      <div
                        key={q.id || idx}
                        className="p-4 rounded-xl border border-slate-200 bg-white space-y-3"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <p className="text-xs font-semibold text-slate-900">
                            <span className="text-blue-600 mr-1.5">Soal {idx + 1}.</span>
                            {q.question_text}
                          </p>
                          {isCorrect ? (
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md shrink-0">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                              Benar (+20)
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-md shrink-0">
                              <XCircle className="w-3.5 h-3.5 text-rose-600" />
                              Salah (0)
                            </span>
                          )}
                        </div>

                        {/* Opsi Jawaban */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                          {['a', 'b', 'c', 'd'].map((opt) => {
                            const optText = q[`option_${opt}`]
                            const isSelected = applicantAnswer && applicantAnswer.toLowerCase() === opt
                            const isKey = (q.correct_answer || '').toLowerCase() === opt

                            let styleClass = 'border-slate-200 bg-slate-50 text-slate-600'
                            if (isSelected && isKey) {
                              styleClass = 'border-emerald-400 bg-emerald-50/80 text-emerald-900 font-medium ring-1 ring-emerald-500'
                            } else if (isSelected && !isKey) {
                              styleClass = 'border-rose-400 bg-rose-50/80 text-rose-900 font-medium ring-1 ring-rose-500'
                            } else if (isKey) {
                              styleClass = 'border-emerald-300 bg-emerald-50/40 text-emerald-800'
                            }

                            return (
                              <div
                                key={opt}
                                className={`p-2.5 rounded-lg border text-xs flex items-start gap-2 ${styleClass}`}
                              >
                                <span className="font-bold uppercase shrink-0">{opt}.</span>
                                <span className="flex-1">{optText}</span>
                                {isSelected && (
                                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded uppercase bg-white/80 shrink-0">
                                    Pilihan Pelamar
                                  </span>
                                )}
                                {isKey && !isSelected && (
                                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded uppercase bg-emerald-100 text-emerald-800 shrink-0">
                                    Kunci Jawaban
                                  </span>
                                )}
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            <div className="mt-6 pt-4 border-t border-slate-100 flex justify-end">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setActiveApplicant(null)}
              >
                Tutup
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Konfirmasi Hapus Lowongan */}
      {jobToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fade-in">
          <div
            className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100 animate-scale-in"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-12 h-12 rounded-2xl bg-red-50 border border-red-100 text-red-600 flex items-center justify-center mb-4">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <h3 className="text-lg font-bold text-slate-900">Hapus Lowongan Kerja?</h3>
            <p className="text-sm text-slate-600 mt-2 leading-relaxed">
              Apakah Anda yakin ingin menghapus lowongan{' '}
              <strong className="text-slate-900 font-semibold">"{jobToDelete.title}"</strong>?
            </p>

            <div className="mt-3 p-3 bg-red-50/80 rounded-xl border border-red-100 text-xs text-red-700 leading-normal">
              ⚠️ <strong>Perhatian:</strong> Menghapus lowongan ini akan menghapus seluruh data lamaran ({jobToDelete.applicantCount} pelamar) dan soal kuis yang terkait secara permanen.
            </div>

            <div className="mt-6 flex items-center justify-end gap-2.5">
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={deletingJob}
                onClick={() => setJobToDelete(null)}
              >
                Batal
              </Button>
              <Button
                type="button"
                size="sm"
                disabled={deletingJob}
                onClick={handleDeleteJob}
                className="bg-red-600 hover:bg-red-700 text-white gap-2 shadow-sm"
              >
                {deletingJob ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Menghapus...
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4" />
                    Hapus Permanen
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Konfirmasi Generate Ulang Soal */}
      {showRegenerateConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fade-in">
          <div
            className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100 animate-scale-in"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-12 h-12 rounded-2xl bg-blue-50 border border-blue-100 text-blue-600 flex items-center justify-center mb-4">
              <Sparkles className="w-6 h-6" />
            </div>

            <h3 className="text-lg font-bold text-slate-900">Generate Ulang Soal?</h3>
            <p className="text-sm text-slate-600 mt-2 leading-relaxed">
              Soal lama akan diganti. Lanjutkan?
            </p>

            <div className="mt-3 p-3 bg-blue-50/70 rounded-xl border border-blue-100 text-xs text-blue-800 leading-normal">
              💡 AI akan merancang 5 soal studi kasus baru pilihan ganda berdasarkan posisi <strong className="font-semibold text-blue-950">"{selectedJob?.title}"</strong>.
            </div>

            <div className="mt-6 flex items-center justify-end gap-2.5">
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={regeneratingQuestions}
                onClick={() => setShowRegenerateConfirm(false)}
              >
                Batal
              </Button>
              <Button
                type="button"
                size="sm"
                disabled={regeneratingQuestions}
                onClick={handleRegenerateQuestions}
                className="bg-blue-600 hover:bg-blue-700 text-white gap-2 shadow-sm"
              >
                {regeneratingQuestions ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Memproses...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    Lanjutkan
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
