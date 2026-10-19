import React, { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { Navbar } from '../components/Navbar'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { supabase } from '../lib/supabase'
import { Button } from '../components/ui/button'
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/card'
import { Badge } from '../components/ui/badge'
import {
  HelpCircle,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  Clock,
  Award,
  Loader2,
  AlertCircle,
  Sparkles,
  Trophy,
  Check,
  Building2
} from 'lucide-react'

export default function Quiz() {
  const { jobId } = useParams()
  const { user } = useAuth()
  const { toast } = useToast()
  const navigate = useNavigate()

  const [job, setJob] = useState(null)
  const [questions, setQuestions] = useState([])
  const [loading, setLoading] = useState(true)
  const [alreadyApplied, setAlreadyApplied] = useState(false)
  const [existingApp, setExistingApp] = useState(null)

  // Quiz state
  const [currentIndex, setCurrentIndex] = useState(0)
  const [answers, setAnswers] = useState({}) // { 0: 'a', 1: 'c', ... }
  const [submitting, setSubmitting] = useState(false)
  const [quizFinished, setQuizFinished] = useState(false)
  const [finalScore, setFinalScore] = useState(0)

  // Load Job & Questions
  useEffect(() => {
    const fetchQuizData = async () => {
      if (!jobId || !user) return
      setLoading(true)

      try {
        // 1. Cek apakah sudah pernah apply lowongan ini
        const { data: existing, error: existingError } = await supabase
          .from('applications')
          .select('*')
          .eq('job_id', jobId)
          .eq('pelamar_id', user.id)
          .maybeSingle()

        if (existing) {
          setAlreadyApplied(true)
          setExistingApp(existing)
        }

        // 2. Fetch Job Details
        const { data: jobData, error: jobError } = await supabase
          .from('jobs')
          .select(`
            id,
            title,
            category,
            description,
            perekrut:perekrut_id (
              company_name,
              full_name
            )
          `)
          .eq('id', jobId)
          .single()

        if (jobError) throw jobError
        setJob(jobData)

        // 3. Fetch Questions
        const { data: qData, error: qError } = await supabase
          .from('questions')
          .select('*')
          .eq('job_id', jobId)
          .order('order_num', { ascending: true })

        if (qError) throw qError
        setQuestions(qData || [])
      } catch (err) {
        console.error('Error loading quiz:', err)
        toast('Gagal memuat soal tes', 'error')
      } finally {
        setLoading(false)
      }
    }

    fetchQuizData()
  }, [jobId, user])

  const selectOption = (opt) => {
    setAnswers((prev) => ({
      ...prev,
      [currentIndex]: opt,
    }))
  }

  const handleNext = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex((prev) => prev + 1)
    }
  }

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1)
    }
  }

  const handleSubmitQuiz = async () => {
    // Validasi apakah semua soal sudah dijawab
    const answeredCount = Object.keys(answers).length
    if (answeredCount < questions.length) {
      const confirmSubmit = window.confirm(
        `Anda baru menjawab ${answeredCount} dari ${questions.length} soal. Yakin ingin mengumpulkan sekarang?`
      )
      if (!confirmSubmit) return
    }

    setSubmitting(true)
    try {
      // Hitung skor: Tiap jawaban benar bernilai (100 / jumlah soal)
      let correctCount = 0
      questions.forEach((q, idx) => {
        const userAnswer = answers[idx]
        if (userAnswer && userAnswer.toLowerCase() === (q.correct_answer || '').toLowerCase()) {
          correctCount++
        }
      })

      const calculatedScore = Math.round((correctCount / questions.length) * 100)
      setFinalScore(calculatedScore)

      // Simpan ke tabel applications Supabase
      const { error: appError } = await supabase.from('applications').insert({
        job_id: jobId,
        pelamar_id: user.id,
        score: calculatedScore,
        answers: answers,
      })

      if (appError) throw appError

      setQuizFinished(true)
      toast('Jawaban berhasil dikumpulkan!', 'success')
    } catch (err) {
      console.error('Error submitting application:', err)
      toast(`Gagal mengumpulkan: ${err.message}`, 'error')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            <p className="text-sm text-slate-500 font-medium">Menyiapkan ruang ujian...</p>
          </div>
        </div>
      </div>
    )
  }

  if (alreadyApplied && !quizFinished) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
        <Navbar />
        <div className="flex-1 max-w-lg w-full mx-auto p-4 flex items-center justify-center">
          <Card className="text-center p-8 bg-white shadow-xl">
            <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="w-9 h-9 text-blue-600" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900 mb-2">Anda Sudah Mengerjakan Tes Ini</h2>
            <p className="text-sm text-slate-500 mb-6">
              Sesuai aturan verifikasi 1 pelamar 1x kesempatan, nilai Anda telah tercatat di sistem perekrut.
            </p>
            <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 mb-6">
              <span className="text-xs uppercase font-bold text-slate-500">Skor Anda</span>
              <div className="text-4xl font-extrabold text-blue-600 mt-1">
                {existingApp?.score} <span className="text-lg text-slate-400">/ 100</span>
              </div>
            </div>
            <Link to="/dashboard/pelamar">
              <Button className="w-full">Kembali ke Dashboard</Button>
            </Link>
          </Card>
        </div>
      </div>
    )
  }

  if (questions.length === 0) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
        <Navbar />
        <div className="flex-1 max-w-md w-full mx-auto p-4 flex items-center justify-center">
          <Card className="text-center p-8 bg-white">
            <AlertCircle className="w-12 h-12 text-amber-500 mx-auto mb-3" />
            <h3 className="text-lg font-bold text-slate-900">Soal Belum Tersedia</h3>
            <p className="text-xs text-slate-500 mt-1 mb-6">
              Lowongan ini belum memiliki butir soal yang di-generate. Silakan coba lowongan lain.
            </p>
            <Link to="/dashboard/pelamar">
              <Button variant="outline" className="w-full">Kembali ke Lowongan</Button>
            </Link>
          </Card>
        </div>
      </div>
    )
  }

  // Tampilan Hasil Akhir Setelah Submit
  if (quizFinished) {
    const isPassed = finalScore >= 60
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
        <Navbar />
        <div className="flex-1 max-w-md w-full mx-auto p-4 flex items-center justify-center">
          <Card className="text-center p-8 bg-white shadow-xl border-slate-200">
            <div
              className={`w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 ${
                isPassed ? 'bg-emerald-100 text-emerald-600' : 'bg-amber-100 text-amber-600'
              }`}
            >
              <Trophy className="w-9 h-9" />
            </div>

            <h2 className="text-2xl font-bold text-slate-900 mb-1">
              {isPassed ? 'Luar Biasa! Tes Selesai' : 'Tes Telah Selesai'}
            </h2>
            <p className="text-xs text-slate-500 mb-6">
              Hasil verifikasi kompetensi Anda telah langsung dikirim ke radar perekrut{' '}
              <strong>{job?.perekrut?.company_name || 'UMKM'}</strong>.
            </p>

            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 mb-6">
              <div className="text-xs uppercase font-bold text-slate-400 tracking-wider">
                Skor Kompetensi Nyata
              </div>
              <div className="text-5xl font-black text-slate-900 mt-2 mb-1">
                {finalScore}
                <span className="text-xl font-medium text-slate-400">/100</span>
              </div>
              <div className="mt-3">
                <Badge variant={isPassed ? 'success' : 'warning'}>
                  {finalScore >= 80
                    ? 'Kemampuan Sangat Baik (Top Tier)'
                    : isPassed
                    ? 'Lolos Kualifikasi Dasar'
                    : 'Perlu Asah Skill Tambahan'}
                </Badge>
              </div>
            </div>

            <div className="space-y-3">
              <Link to="/dashboard/pelamar">
                <Button className="w-full gap-2">
                  Kembali ke Dashboard Pelamar
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
            </div>
          </Card>
        </div>
      </div>
    )
  }

  const currentQ = questions[currentIndex]
  const currentAnswer = answers[currentIndex]
  const isLastQuestion = currentIndex === questions.length - 1

  const optionsList = [
    { key: 'a', text: currentQ?.option_a },
    { key: 'b', text: currentQ?.option_b },
    { key: 'c', text: currentQ?.option_c },
    { key: 'd', text: currentQ?.option_d },
  ]

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      <Navbar />

      <main className="flex-1 max-w-3xl w-full mx-auto px-4 sm:px-6 py-8 flex flex-col justify-center">
        {/* Quiz Header Bar */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Badge variant="default" className="text-[10px] capitalize">
                {job?.category}
              </Badge>
              <span className="text-xs text-slate-500 font-medium">
                {job?.perekrut?.company_name || 'UMKM Rekruter'}
              </span>
            </div>
            <h1 className="text-lg font-bold text-slate-900">{job?.title}</h1>
          </div>

          <div className="flex items-center gap-3">
            <div className="px-3.5 py-1.5 bg-blue-50 text-blue-700 font-bold rounded-xl text-sm flex items-center gap-1.5">
              <HelpCircle className="w-4 h-4" />
              Soal {currentIndex + 1} dari {questions.length}
            </div>
          </div>
        </div>

        {/* Question Progress Dots */}
        <div className="grid grid-cols-5 gap-2 mb-6">
          {questions.map((_, idx) => {
            const isAnswered = answers[idx] !== undefined
            const isCurrent = idx === currentIndex
            return (
              <button
                key={idx}
                onClick={() => setCurrentIndex(idx)}
                className={`h-2.5 rounded-full transition-all ${
                  isCurrent
                    ? 'bg-blue-600 ring-2 ring-blue-300'
                    : isAnswered
                    ? 'bg-emerald-500'
                    : 'bg-slate-200 hover:bg-slate-300'
                }`}
                title={`Pindah ke soal ${idx + 1}`}
              />
            )
          })}
        </div>

        {/* Current Question Card */}
        <Card className="bg-white border-slate-200/90 shadow-md mb-6">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
              <span className="font-semibold text-blue-600 uppercase tracking-wider">
                Studi Kasus Praktis #{currentIndex + 1}
              </span>
              <span className="flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-blue-500" />
                AI Generated
              </span>
            </div>
            <CardTitle className="text-base sm:text-lg text-slate-900 leading-relaxed font-semibold">
              {currentQ?.question_text}
            </CardTitle>
          </CardHeader>

          <CardContent className="space-y-3 pt-2">
            {optionsList.map((opt) => {
              const isSelected = currentAnswer === opt.key
              return (
                <div
                  key={opt.key}
                  onClick={() => selectOption(opt.key)}
                  className={`p-4 rounded-xl border transition cursor-pointer flex items-start gap-3.5 ${
                    isSelected
                      ? 'bg-blue-50/80 border-blue-500 ring-2 ring-blue-500/20 shadow-sm'
                      : 'bg-white border-slate-200 hover:bg-slate-50/70 hover:border-slate-300'
                  }`}
                >
                  <div
                    className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs uppercase shrink-0 transition ${
                      isSelected
                        ? 'bg-blue-600 text-white'
                        : 'bg-slate-100 text-slate-600 border border-slate-300'
                    }`}
                  >
                    {isSelected ? <Check className="w-3.5 h-3.5" /> : opt.key}
                  </div>
                  <div className="text-sm text-slate-800 leading-relaxed pt-0.5">
                    {opt.text}
                  </div>
                </div>
              )
            })}
          </CardContent>
        </Card>

        {/* Navigation Buttons */}
        <div className="flex items-center justify-between gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={handlePrev}
            disabled={currentIndex === 0 || submitting}
            className="gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Sebelumnya
          </Button>

          {isLastQuestion ? (
            <Button
              type="button"
              onClick={handleSubmitQuiz}
              disabled={submitting}
              className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-600/20"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Menghitung Skor...
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  Kumpulkan Jawaban
                </>
              )}
            </Button>
          ) : (
            <Button
              type="button"
              onClick={handleNext}
              disabled={submitting}
              className="gap-2 bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-600/20"
            >
              Selanjutnya
              <ArrowRight className="w-4 h-4" />
            </Button>
          )}
        </div>
      </main>
    </div>
  )
}
