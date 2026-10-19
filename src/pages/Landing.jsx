import React from 'react'
import { Link } from 'react-router-dom'
import { Navbar } from '../components/Navbar'
import { Button } from '../components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card'
import { Badge } from '../components/ui/badge'
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
} from 'lucide-react'

export default function Landing() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans selection:bg-blue-100 selection:text-blue-900">
      <Navbar />

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-16 pb-20 md:pt-24 md:pb-28 bg-gradient-to-b from-blue-50/70 via-white to-slate-50 border-b border-slate-200/60">
        {/* Subtle decorative background circles */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-400/10 rounded-full blur-3xl pointer-events-none -z-0" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <Badge variant="default" className="px-3.5 py-1.5 mb-6 text-xs sm:text-sm font-semibold gap-1.5">
            <Sparkles className="w-4 h-4 text-blue-600" />
            Solusi Nyata Mismatch Tenaga Kerja Indonesia 2045
          </Badge>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-slate-900 tracking-tight max-w-4xl mx-auto leading-[1.15]">
            Verifikasi Skill Nyata, <br className="hidden sm:inline" />
            <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              Bukan Sekadar Tumpukan CV.
            </span>
          </h1>

          <p className="mt-6 text-base sm:text-lg md:text-xl text-slate-600 max-w-2xl mx-auto leading-relaxed">
            Menghubungkan pencari kerja muda dengan UMKM menengah di Indonesia. Perekrut pilih kategori posisi, AI otomatis generate quiz skill praktis, dan kandidat tersaring otomatis dari skor nyata.
          </p>

          {/* CTA Buttons */}
          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4 max-w-md mx-auto sm:max-w-none">
            <Link to="/register?role=pelamar" className="w-full sm:w-auto">
              <Button size="lg" className="w-full sm:w-auto gap-2 bg-blue-600 hover:bg-blue-700 font-semibold shadow-lg shadow-blue-500/25">
                Cari Kerja & Tes Skill
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>

            <Link to="/register?role=perekrut" className="w-full sm:w-auto">
              <Button size="lg" variant="outline" className="w-full sm:w-auto gap-2 border-slate-300 font-semibold hover:border-blue-400 hover:text-blue-600">
                <Building2 className="w-4 h-4 text-blue-600" />
                Rekrut Sekarang (Perekrut)
              </Button>
            </Link>
          </div>

          <div className="mt-8 flex items-center justify-center gap-6 text-xs text-slate-500">
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" /> Tanpa biaya awal
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" /> Soal AI praktis & kontekstual
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" /> Hasil instan
            </span>
          </div>
        </div>
      </section>

      {/* Stats Section (Hardcode Data BPS) */}
      <section className="py-14 bg-white border-b border-slate-200/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-xl mx-auto mb-10">
            <h2 className="text-xs uppercase tracking-widest font-bold text-blue-600 mb-1">
              Fakta & Urgensi Nasional
            </h2>
            <p className="text-xl sm:text-2xl font-bold text-slate-900">
              Jurang Pemisah Antara Lulusan Muda & UMKM
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
            <Card className="border-blue-100 bg-gradient-to-br from-white to-blue-50/30">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between text-blue-600 mb-2">
                  <Badge variant="default" className="bg-blue-100 text-blue-800">BPS Feb 2024</Badge>
                  <TrendingDown className="w-5 h-5 text-blue-600" />
                </div>
                <CardTitle className="text-3xl lg:text-4xl font-extrabold text-blue-600">
                  7,47 Juta
                </CardTitle>
                <div className="text-base font-bold text-slate-800 pt-1">
                  Tingkat Pengangguran Terbuka
                </div>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-slate-600 text-xs sm:text-sm leading-relaxed">
                  1 dari 3 fresh graduate menganggur &gt;6 bulan akibat ketiadaan bukti skill nyata di luar ijazah formal.
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="border-emerald-100 bg-gradient-to-br from-white to-emerald-50/30">
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

            <Card className="border-purple-100 bg-gradient-to-br from-white to-purple-50/30">
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

      {/* How It Works Section */}
      <section className="py-20 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <Badge variant="default" className="mb-3">Alur Kerja Platform</Badge>
            <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight sm:text-4xl">
              Cara Kerja SkillMatch
            </h2>
            <p className="mt-3 text-slate-600 text-sm sm:text-base">
              Proses screening otomatis 3 langkah tanpa repot screening ratusan lembar CV.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
            {/* Perekrut Flow */}
            <Card className="border-slate-200/90 shadow-sm relative overflow-hidden">
              <div className="h-1.5 w-full bg-blue-600 top-0 left-0 absolute" />
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold">
                    <Building2 className="w-5 h-5" />
                  </div>
                  <div>
                    <CardTitle className="text-xl">3 Langkah untuk Perekrut UMKM</CardTitle>
                    <CardDescription>Buka lowongan dan dapatkan kandidat siap kerja</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6 pt-2">
                <div className="flex gap-4 items-start">
                  <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 font-bold text-sm flex items-center justify-center shrink-0 border border-blue-200">
                    1
                  </div>
                  <div>
                    <h4 className="font-semibold text-slate-900 text-sm">Pilih Kategori Posisi Pekerjaan</h4>
                    <p className="text-xs sm:text-sm text-slate-600 mt-1">
                      Pilih dari kategori siap pakai (Kasir, Admin, Desainer, Teknisi, dll) dan tulis deskripsi singkat kebutuhan usaha Anda.
                    </p>
                  </div>
                </div>

                <div className="flex gap-4 items-start">
                  <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 font-bold text-sm flex items-center justify-center shrink-0 border border-blue-200">
                    2
                  </div>
                  <div>
                    <h4 className="font-semibold text-slate-900 text-sm">AI Otomatis Generate 5 Soal Kasus</h4>
                    <p className="text-xs sm:text-sm text-slate-600 mt-1">
                      Engine AI SumoPod langsung menyusun 5 studi kasus praktis pilihan ganda yang relevan dengan tantangan UMKM harian.
                    </p>
                  </div>
                </div>

                <div className="flex gap-4 items-start">
                  <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 font-bold text-sm flex items-center justify-center shrink-0 border border-blue-200">
                    3
                  </div>
                  <div>
                    <h4 className="font-semibold text-slate-900 text-sm">Lihat Ranking Kandidat Berdasarkan Skor</h4>
                    <p className="text-xs sm:text-sm text-slate-600 mt-1">
                      Pelamar langsung diranking otomatis berdasarkan skor tes objektif (0-100). Rekrut yang terbukti kompeten!
                    </p>
                  </div>
                </div>

                <div className="pt-2">
                  <Link to="/register?role=perekrut">
                    <Button variant="outline" className="w-full gap-2 border-blue-200 text-blue-600 hover:bg-blue-50">
                      Mulai Buka Lowongan Gratis
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>

            {/* Pelamar Flow */}
            <Card className="border-slate-200/90 shadow-sm relative overflow-hidden">
              <div className="h-1.5 w-full bg-emerald-600 top-0 left-0 absolute" />
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
                    <Users className="w-5 h-5" />
                  </div>
                  <div>
                    <CardTitle className="text-xl">3 Langkah untuk Pelamar Kerja</CardTitle>
                    <CardDescription>Buktikan kompetensi Anda tanpa bias latar belakang</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6 pt-2">
                <div className="flex gap-4 items-start">
                  <div className="w-8 h-8 rounded-full bg-emerald-50 text-emerald-600 font-bold text-sm flex items-center justify-center shrink-0 border border-emerald-200">
                    1
                  </div>
                  <div>
                    <h4 className="font-semibold text-slate-900 text-sm">Cari Lowongan UMKM yang Cocok</h4>
                    <p className="text-xs sm:text-sm text-slate-600 mt-1">
                      Jelajahi daftar pekerjaan aktif dari UMKM terpercaya tanpa syarat formal yang berbelit-belit.
                    </p>
                  </div>
                </div>

                <div className="flex gap-4 items-start">
                  <div className="w-8 h-8 rounded-full bg-emerald-50 text-emerald-600 font-bold text-sm flex items-center justify-center shrink-0 border border-emerald-200">
                    2
                  </div>
                  <div>
                    <h4 className="font-semibold text-slate-900 text-sm">Kerjakan Quiz Praktis 5 Menit</h4>
                    <p className="text-xs sm:text-sm text-slate-600 mt-1">
                      Jawab 5 soal interaktif berbasis skenario kerja nyata. Tunjukkan bagaimana Anda menyelesaikan masalah di lapangan.
                    </p>
                  </div>
                </div>

                <div className="flex gap-4 items-start">
                  <div className="w-8 h-8 rounded-full bg-emerald-50 text-emerald-600 font-bold text-sm flex items-center justify-center shrink-0 border border-emerald-200">
                    3
                  </div>
                  <div>
                    <h4 className="font-semibold text-slate-900 text-sm">Skor Masuk ke Radar Pemilik Usaha</h4>
                    <p className="text-xs sm:text-sm text-slate-600 mt-1">
                      Hasil tes Anda langsung tersimpan dan menjadi bukti keahlian yang dilihat oleh perekrut untuk dipanggil wawancara.
                    </p>
                  </div>
                </div>

                <div className="pt-2">
                  <Link to="/register?role=pelamar">
                    <Button variant="outline" className="w-full gap-2 border-emerald-200 text-emerald-700 hover:bg-emerald-50">
                      Mulai Kerjakan Tes Sekarang
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Value Proposition Grid */}
      <section className="py-16 bg-white border-t border-slate-200/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200/60">
              <FileX className="w-7 h-7 text-blue-600 mb-3" />
              <h4 className="font-bold text-slate-900 text-sm">Skill-First Screening</h4>
              <p className="text-xs text-slate-500 mt-1">Kualifikasi ditentukan oleh kemampuan nyata, bukan format CV atau gelar.</p>
            </div>
            <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200/60">
              <BrainCircuit className="w-7 h-7 text-indigo-600 mb-3" />
              <h4 className="font-bold text-slate-900 text-sm">AI-Powered Questioning</h4>
              <p className="text-xs text-slate-500 mt-1">Soal disesuaikan dengan konteks UMKM lokal di Indonesia secara dinamis.</p>
            </div>
            <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200/60">
              <Target className="w-7 h-7 text-emerald-600 mb-3" />
              <h4 className="font-bold text-slate-900 text-sm">Zero Friction HR</h4>
              <p className="text-xs text-slate-500 mt-1">Pemilik UMKM tidak perlu membuang waktu berminggu-minggu memilah pelamar.</p>
            </div>
            <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200/60">
              <Award className="w-7 h-7 text-amber-600 mb-3" />
              <h4 className="font-bold text-slate-900 text-sm">Transparan & Adil</h4>
              <p className="text-xs text-slate-500 mt-1">Pelamar langsung mengetahui skor performanya secara instan setelah tes.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-400 py-10 mt-auto border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
          <div className="flex items-center gap-2 text-white font-bold text-base">
            <span className="p-1.5 bg-blue-600 text-white rounded-lg inline-flex">
              <Sparkles className="w-4 h-4" />
            </span>
            SkillMatch
          </div>
          <p>© 2026 SkillMatch Indonesia. Menjawab mismatch tenaga kerja bonus demografi 2045.</p>
          <div className="flex items-center gap-4">
            <Link to="/login" className="hover:text-white transition">Masuk</Link>
            <Link to="/register" className="hover:text-white transition">Daftar</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
