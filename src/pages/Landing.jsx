import React, { useState, useEffect } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { Navbar } from '../components/Navbar'
import { Button } from '../components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card'
import { Badge } from '../components/ui/badge'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { SkeletonCard } from '../components/ui/skeleton'
import {
  Sparkles,
  ArrowRight,
  TrendingDown,
  Building2,
  Users,
  CheckCircle2,
  BrainCircuit,
  Target,
  FileX,
  Award,
  BarChart3,
  ChevronRight,
  Briefcase,
  MapPin,
  Calendar,
  Radio,
  FileText,
} from 'lucide-react'

// Category Icon Mapping
const CATEGORY_ICONS = {
  admin: '📋', kasir: '💳', desainer: '🎨', teknisi: '🔧',
  marketing: '📢', gudang: '📦', customer_service: '🎧',
  keuangan: '💰', driver: '🚗', produksi: '🏭',
  it: '💻', fnb: '☕', cleaning: '🧹', security: '🛡️', sales: '📊',
}

const CATEGORY_LABELS = {
  admin: 'Admin & Kesekretariatan',
  kasir: 'Kasir & Pembayaran',
  desainer: 'Desainer Grafis',
  teknisi: 'Teknisi & Maintenance',
  marketing: 'Marketing & Media Sosial',
  gudang: 'Gudang & Logistik',
  customer_service: 'Customer Service',
  keuangan: 'Keuangan & Akuntansi',
  driver: 'Driver & Kurir',
  produksi: 'Produksi & Manufaktur',
  it: 'IT & Teknologi',
  fnb: 'F&B & Barista',
  cleaning: 'Cleaning Service',
  security: 'Security',
  sales: 'Sales & Agen',
}

export default function Landing() {
  const { user, profile, loading } = useAuth()
  const [liveJobs, setLiveJobs] = useState([])
  const [loadingJobs, setLoadingJobs] = useState(true)

  // Jika user sudah login, langsung alihkan ke dashboard masing-masing
  if (!loading && user) {
    const role = profile?.role || user.user_metadata?.role
    if (role === 'perekrut') {
      return <Navigate to="/dashboard/perekrut" replace />
    }
    return <Navigate to="/dashboard/pelamar" replace />
  }

  useEffect(() => {
    async function fetchLiveJobs() {
      try {
        const { data, error } = await supabase
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
          .limit(6)

        if (!error && data) {
          setLiveJobs(data)
        }
      } catch (err) {
        console.error('Error fetching live jobs:', err)
      } finally {
        setLoadingJobs(false)
      }
    }

    fetchLiveJobs()
  }, [])

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans selection:bg-blue-100 selection:text-blue-900">
      <Navbar />

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-12 pb-16 md:pt-16 md:pb-24 bg-gradient-to-b from-blue-50/60 via-white to-slate-50 border-b border-slate-200/60 animated-gradient-hero">
        {/* Subtle decorative background glow */}
        <div className="absolute top-1/3 left-1/4 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-blue-400/10 rounded-full blur-3xl pointer-events-none -z-0" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-0 items-center">
            {/* Column 1: Headline, Copy, CTA, Badges (On mobile: order-2, on desktop: order-1) */}
            <div className="order-2 lg:order-1 lg:col-span-6 xl:col-span-6 text-left animate-fade-in-up relative z-20">
              <h1 className="text-3xl sm:text-4xl lg:text-[40px] xl:text-[46px] font-extrabold text-slate-950 tracking-tight leading-[1.18]">
                Rekrut Lebih Cepat, <br />
                <span className="text-blue-700 font-extrabold sm:whitespace-nowrap">
                  Screening Lebih Objektif
                </span>
              </h1>

              <p className="mt-4 text-sm sm:text-base text-slate-700 max-w-lg leading-relaxed font-normal">
                Platform rekrutmen untuk UMKM Indonesia. Posting lowongan, AI buatkan soal seleksinya, kandidat tersaring otomatis berdasarkan skor.
              </p>

              {/* CTA Buttons */}
              <div className="mt-6 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                <Link to="/register?role=pelamar">
                  <Button size="default" className="w-full sm:w-auto gap-2 bg-blue-600 hover:bg-blue-700 font-semibold shadow-md shadow-blue-500/25 btn-press px-5 py-5 text-xs sm:text-sm">
                    Cari Kerja & Tes Skill
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </Link>

                <Link to="/register?role=perekrut">
                  <Button size="default" variant="outline" className="w-full sm:w-auto gap-2 border-slate-300 font-semibold hover:border-blue-400 hover:text-blue-600 btn-press px-4 py-5 text-xs sm:text-sm bg-white/90 shadow-sm">
                    <Building2 className="w-4 h-4 text-blue-600" />
                    Rekrut Sekarang (Perekrut)
                  </Button>
                </Link>
              </div>
            </div>

            {/* Column 2: 3D Hero Illustration (On mobile: order-1, on desktop: order-2) */}
            <div className="order-1 lg:order-2 lg:col-span-6 xl:col-span-6 flex items-center justify-center lg:justify-start animate-fade-in-up stagger-1 relative z-10 lg:-ml-8 xl:-ml-12 pointer-events-none">
              <div className="relative w-full flex justify-center lg:justify-start">
                <img
                  src="/hero_image.png"
                  alt="SkillMatch Hero Illustration"
                  className="w-full max-w-[420px] sm:max-w-[500px] lg:max-w-[760px] xl:max-w-[820px] h-auto object-contain drop-shadow-xl select-none pointer-events-none transform lg:scale-110 lg:origin-left"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section (Hardcode Data BPS) */}
      <section className="py-14 bg-white border-b border-slate-200/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-xl mx-auto mb-10">
            <h2 className="text-xs uppercase tracking-widest font-bold text-blue-600 mb-1">
              Tahukah Kamu ?
            </h2>
            <p className="text-xl sm:text-2xl font-bold text-slate-900">
              Terdapat Gap Antara Lulusan Muda & UMKM
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
            <Card className="border-blue-100 bg-gradient-to-br from-white to-blue-50/30 card-hover animate-fade-in-up stagger-1">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between text-blue-600 mb-2">
                  <Badge variant="default" className="bg-blue-100 text-blue-800">BPS Feb 2024</Badge>
                  <TrendingDown className="w-5 h-5 text-blue-600" />
                </div>
                <CardTitle className="text-3xl lg:text-4xl font-extrabold text-blue-600">
                  7,47 Juta
                </CardTitle>
                <div className="text-base font-bold text-slate-800 pt-1">
                  Total Penganggur Terbuka
                </div>
                <div className="text-xs text-blue-700 font-semibold">
                  TPT Nasional: 4,82%
                </div>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-slate-600 text-xs sm:text-sm leading-relaxed">
                  Didominasi lulusan muda &amp; fresh graduate (youth unemployment) akibat kesenjangan keterampilan (skill gap) dengan kebutuhan nyata dunia usaha.
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="border-emerald-100 bg-gradient-to-br from-white to-emerald-50/30 card-hover animate-fade-in-up stagger-2">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between text-emerald-600 mb-2">
                  <Badge variant="success">Kemenkop 2023</Badge>
                  <Building2 className="w-5 h-5 text-emerald-600" />
                </div>
                <CardTitle className="text-3xl lg:text-4xl font-extrabold text-emerald-600">
                  66 Juta
                </CardTitle>
                <div className="text-base font-bold text-slate-800 pt-1">
                  Unit UMKM Aktif
                </div>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-slate-600 text-xs sm:text-sm leading-relaxed">
                  ~85% UMKM tidak memiliki tim HR atau sistem rekrutmen digital untuk menyaring kandidat secara terukur.
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="border-purple-100 bg-gradient-to-br from-white to-purple-50/30 card-hover animate-fade-in-up stagger-3">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between text-purple-600 mb-2">
                  <Badge variant="secondary" className="bg-purple-100 text-purple-800">BPS Ags 2023</Badge>
                  <Users className="w-5 h-5 text-purple-600" />
                </div>
                <CardTitle className="text-3xl lg:text-4xl font-extrabold text-purple-600">
                  59,17%
                </CardTitle>
                <div className="text-base font-bold text-slate-800 pt-1">
                  Pekerja di Sektor Informal
                </div>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-slate-600 text-xs sm:text-sm leading-relaxed">
                  Platform rekrutmen konvensional terlalu kaku dan mahal, mengabaikan potensi talenta praktis siap kerja.
                </CardDescription>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Lowongan Aktif Terbaru (Live Job Postings) */}
      <section className="py-20 bg-slate-50 border-t border-slate-200/80" id="lowongan">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10">
            <div>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                Lowongan Kerja Terbaru Sedang Dibuka
              </h2>
              <p className="mt-2 text-slate-600 text-xs sm:text-sm">
                Diposting langsung oleh pemilik usaha & HRD UMKM. Buktikan kemampuanmu melalui kuis skenario kerja singkat.
              </p>
            </div>

            <Link to="/register?role=pelamar" className="shrink-0">
              <Button variant="outline" className="gap-2 border-slate-300 font-semibold hover:border-blue-500 hover:text-blue-600">
                Lihat Semua Lowongan
                <ChevronRight className="w-4 h-4" />
              </Button>
            </Link>
          </div>

          {/* Job Cards Grid */}
          {loadingJobs ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="animate-fade-in-up">
                  <SkeletonCard />
                </div>
              ))}
            </div>
          ) : liveJobs.length === 0 ? (
            <Card className="text-center p-12 bg-white border-dashed">
              <Briefcase className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <h3 className="text-base font-semibold text-slate-800">Belum Ada Lowongan Aktif</h3>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                Pemilik usaha UMKM dapat mulai memposting lowongan sekarang dan sistem AI akan membuatkan soal tesnya.
              </p>
              <div className="mt-5">
                <Link to="/register?role=perekrut">
                  <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white">
                    Buka Lowongan Sekarang
                  </Button>
                </Link>
              </div>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {liveJobs.map((job, index) => {
                const categoryIcon = CATEGORY_ICONS[job.category] || '💼'
                const categoryLabel = CATEGORY_LABELS[job.category] || job.category

                return (
                  <Card
                    key={job.id}
                    className="flex flex-col justify-between hover:shadow-lg transition-all duration-300 border-slate-200/90 hover:border-blue-300 bg-white group card-hover animate-fade-in-up"
                    style={{ animationDelay: `${index * 80}ms` }}
                  >
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between gap-3 mb-2">
                        {job.perekrut?.logo_url ? (
                          <div className="w-11 h-11 rounded-xl bg-white border border-slate-200/80 p-1 flex items-center justify-center shrink-0 shadow-sm group-hover:scale-105 transition-transform overflow-hidden">
                            <img
                              src={job.perekrut.logo_url}
                              alt={job.perekrut?.company_name || 'Logo UMKM'}
                              className="w-full h-full object-contain rounded-lg"
                            />
                          </div>
                        ) : (
                          <span className="text-2xl p-2 rounded-xl bg-slate-50 border border-slate-100 group-hover:scale-110 transition-transform">
                            {categoryIcon}
                          </span>
                        )}
                        <Badge variant="secondary" className="text-[11px] font-medium bg-slate-100 text-slate-700">
                          {categoryLabel}
                        </Badge>
                      </div>

                      <CardTitle className="text-base font-bold text-slate-900 group-hover:text-blue-600 transition-colors line-clamp-1">
                        {job.title}
                      </CardTitle>

                      <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium pt-1">
                        <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="truncate">
                          {job.perekrut?.company_name || 'UMKM Indonesia'}
                        </span>
                      </div>
                    </CardHeader>

                    <CardContent className="pt-0">
                      <p className="text-xs text-slate-600 line-clamp-4 whitespace-pre-line leading-relaxed mb-4">
                        {job.description || 'Tidak ada deskripsi khusus untuk lowongan ini.'}
                      </p>

                      <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400">
                        <span className="flex items-center gap-1 text-[11px]">
                          <Calendar className="w-3 h-3" />
                          {new Date(job.created_at).toLocaleDateString('id-ID', {
                            day: 'numeric',
                            month: 'short',
                          })}
                        </span>
                        <span className="text-[11px] font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">
                          Quiz AI Siap
                        </span>
                      </div>

                      <div className="mt-4">
                        <Link to={`/quiz/${job.id}`}>
                          <Button className="w-full gap-2 bg-blue-600 hover:bg-blue-700 text-white font-medium text-xs py-2 shadow-sm btn-press">
                            Mulai Tes Skill
                            <ArrowRight className="w-3.5 h-3.5" />
                          </Button>
                        </Link>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}
        </div>
      </section>


      {/* Clean & Aesthetic Footer */}
      <footer className="bg-slate-950 text-slate-400 pt-12 pb-10 mt-auto border-t border-slate-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-8 pb-10 border-b border-slate-900">
            {/* Brand */}
            <div className="space-y-3">
              <Link to="/" className="inline-block hover:opacity-90 transition">
                <img
                  src="/Logo_SkillMatch.png"
                  alt="SkillMatch Logo"
                  className="h-11 w-auto object-contain brightness-105"
                />
              </Link>
              <p className="text-xs text-slate-400 max-w-sm leading-relaxed">
                Platform rekrutmen berbasis evaluasi keterampilan nyata dan skenario praktis kerja untuk UMKM Indonesia.
              </p>
            </div>

            {/* Quick Links & CTA */}
            <div className="flex flex-wrap items-center gap-6 text-xs font-medium">
              <a href="#masalah" className="hover:text-white transition">Tentang Kami</a>
              <a href="#kategori" className="hover:text-white transition">Kategori Pekerjaan</a>
              <Link to="/login" className="hover:text-white transition">Masuk</Link>
              <Link
                to="/register"
                className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold transition"
              >
                Mulai Sekarang
              </Link>
            </div>
          </div>

          {/* Bottom Bar */}
          <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-400">
            <p>© 2026 SkillMatch Indonesia. Hak cipta dilindungi.</p>
            <div className="flex items-center gap-6">
              <span className="hover:text-slate-300 cursor-pointer transition">Kebijakan Privasi</span>
              <span className="hover:text-slate-300 cursor-pointer transition">Syarat & Ketentuan</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
