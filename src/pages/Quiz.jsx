import React, { useState, useEffect, useRef, useCallback } from 'react'
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
  Building2,
  Timer
} from 'lucide-react'

// ─── Timer Countdown Component ───────────────────────────────
const QUIZ_DURATION = 300 // 5 minutes in seconds

function CountdownTimer({ timeLeft, totalTime }) {
  const minutes = Math.floor(timeLeft / 60)
  const seconds = timeLeft % 60
  const progress = timeLeft / totalTime
  const circumference = 2 * Math.PI * 20
  const strokeOffset = circumference * (1 - progress)

  // Color based on remaining time
  let colorClass = 'text-emerald-600'
  let strokeColor = '#059669'
  let bgClass = 'bg-emerald-50 border-emerald-200'

  if (progress <= 0.2) {
    colorClass = 'text-red-600'
    strokeColor = '#dc2626'
    bgClass = 'bg-red-50 border-red-200'
  } else if (progress <= 0.4) {
    colorClass = 'text-amber-600'
    strokeColor = '#d97706'
    bgClass = 'bg-amber-50 border-amber-200'
  }

  const isUrgent = progress <= 0.2

  return (
    <div className={`flex items-center gap-2.5 px-3.5 py-2 rounded-xl border font-bold text-sm ${bgClass} ${isUrgent ? 'timer-urgent' : ''}`}>
      <div className="relative w-10 h-10">
        <svg className="w-10 h-10 -rotate-90" viewBox="0 0 44 44">
          <circle
            cx="22" cy="22" r="20"
            fill="none"
            stroke="currentColor"
            strokeWidth="3"
            className="text-slate-200"
          />
          <circle
            cx="22" cy="22" r="20"
            fill="none"
            stroke={strokeColor}
            strokeWidth="3"
            strokeDasharray={circumference}
            strokeDashoffset={strokeOffset}
            strokeLinecap="round"
            className="transition-all duration-1000 ease-linear"
          />
        </svg>
        <Timer className={`w-4 h-4 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 ${colorClass}`} />
      </div>
      <div className={colorClass}>
        <span className="tabular-nums text-base">
          {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
        </span>
        <span className="text-[10px] block opacity-70 font-medium -mt-0.5">Sisa Waktu</span>
      </div>
    </div>
  )
}

// ─── Confetti Burst Component ────────────────────────────────
function ConfettiBurst() {
  const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4']
  const pieces = Array.from({ length: 40 }, (_, i) => ({
    id: i,
    color: colors[i % colors.length],
    left: `${Math.random() * 100}%`,
    delay: `${Math.random() * 0.8}s`,
    duration: `${1.5 + Math.random() * 2}s`,
    size: `${6 + Math.random() * 6}px`,
    rotation: `${Math.random() * 360}deg`,
  }))

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none z-10">
      {pieces.map((p) => (
        <div
          key={p.id}
          className="confetti-piece"
          style={{
            backgroundColor: p.color,
            left: p.left,
            top: '-10px',
            width: p.size,
            height: p.size,
            animationDelay: p.delay,
            animationDuration: p.duration,
            borderRadius: Math.random() > 0.5 ? '50%' : '2px',
          }}
        />
      ))}
    </div>
  )
}

// ─── Animated Score Ring ─────────────────────────────────────
function AnimatedScoreRing({ score, isPassed }) {
  const [displayScore, setDisplayScore] = useState(0)
  const circumference = 2 * Math.PI * 45
  const strokeOffset = circumference * (1 - score / 100)

  const ringColor = score >= 80
    ? '#059669'
    : score >= 60
      ? '#2563eb'
      : '#d97706'

  // Count-up animation
  useEffect(() => {
    const duration = 1500
    const steps = 60
    const increment = score / steps
    let current = 0
    const timer = setInterval(() => {
      current += increment
      if (current >= score) {
        setDisplayScore(score)
        clearInterval(timer)
      } else {
        setDisplayScore(Math.round(current))
      }
    }, duration / steps)

    return () => clearInterval(timer)
  }, [score])

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg className="w-40 h-40 -rotate-90" viewBox="0 0 100 100">
        {/* Background ring */}
        <circle
          cx="50" cy="50" r="45"
          fill="none"
          stroke="#e2e8f0"
          strokeWidth="6"
        />
        {/* Progress ring */}
        <circle
          cx="50" cy="50" r="45"
          fill="none"
          stroke={ringColor}
          strokeWidth="6"
          strokeDasharray={circumference}
          strokeDashoffset={strokeOffset}
          strokeLinecap="round"
          className="score-ring-animate"
          style={{ strokeDashoffset: strokeOffset }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center score-number-animate">
        <span className="text-4xl font-black text-slate-900 tabular-nums">{displayScore}</span>
        <span className="text-sm font-medium text-slate-400">/100</span>
      </div>
    </div>
  )
}

// ─── Main Quiz Component ─────────────────────────────────────
export default function Quiz() {
  const { jobId } = useParams()
  const { user, profile } = useAuth()
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

  // Timer state
  const [timeLeft, setTimeLeft] = useState(QUIZ_DURATION)
  const [timerActive, setTimerActive] = useState(false)
  const timerRef = useRef(null)

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

        // Start timer if not already applied
        if (!existing && qData && qData.length > 0) {
          setTimerActive(true)
        }
      } catch (err) {
        console.error('Error loading quiz:', err)
        toast('Gagal memuat soal tes', 'error')
      } finally {
        setLoading(false)
      }
    }

    fetchQuizData()
  }, [jobId, user])

  // Timer countdown
  useEffect(() => {
    if (!timerActive || quizFinished) return

    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current)
          // Auto-submit when time runs out
          handleAutoSubmit()
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timerRef.current)
  }, [timerActive, quizFinished])

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

  // Auto-submit when timer runs out
  const handleAutoSubmit = useCallback(async () => {
    if (submitting || quizFinished) return
    toast('⏰ Waktu habis! Jawaban otomatis dikumpulkan.', 'info')
    await submitQuiz()
  }, [answers, questions, submitting, quizFinished])

  const submitQuiz = async () => {
    setSubmitting(true)
    try {
      let correctCount = 0
      questions.forEach((q, idx) => {
        const userAnswer = answers[idx]
        if (userAnswer && userAnswer.toLowerCase() === (q.correct_answer || '').toLowerCase()) {
          correctCount++
        }
      })

      const calculatedScore = Math.round((correctCount / questions.length) * 100)
      setFinalScore(calculatedScore)

      // Pastikan data pelamar ada di tabel profiles untuk menghindari foreign key constraint error
      const { error: profileCheckError } = await supabase.from('profiles').upsert({
        id: user.id,
        role: profile?.role || user.user_metadata?.role || 'pelamar',
        full_name: profile?.full_name || user.user_metadata?.full_name || user.email?.split('@')[0],
      })
      if (profileCheckError) {
        console.warn('Pelamar profile upsert notice:', profileCheckError.message)
      }

      const { error: appError } = await supabase.from('applications').insert({
        job_id: jobId,
        pelamar_id: user.id,
        score: calculatedScore,
        answers: answers,
        status: 'Menunggu Review',
      })

      if (appError) {
        // Jika 409 (sudah pernah disubmit / unique violation 23505), update record yang ada
        if (appError.code === '23505' || appError.message?.includes('duplicate key')) {
          console.warn('Application already exists, updating score and answers...')
          const { error: updateError } = await supabase
            .from('applications')
            .update({
              score: calculatedScore,
              answers: answers,
              submitted_at: new Date().toISOString(),
            })
            .eq('job_id', jobId)
            .eq('pelamar_id', user.id)

          if (updateError) throw updateError
        } else {
          throw appError
        }
      }

      setQuizFinished(true)
      setTimerActive(false)
      clearInterval(timerRef.current)
      toast('Jawaban berhasil dikumpulkan!', 'success')
    } catch (err) {
      console.error('Error submitting application:', err)
      toast(`Gagal mengumpulkan: ${err.message}`, 'error')
    } finally {
      setSubmitting(false)
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

    await submitQuiz()
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <div className="flex flex-col items-center gap-3 animate-fade-in-up">
            <div className="relative">
              <div className="w-16 h-16 rounded-2xl bg-blue-50 flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
              </div>
            </div>
            <p className="text-sm text-slate-500 font-medium">Menyiapkan ruang ujian...</p>
            <div className="flex gap-1.5 mt-1">
              <div className="skeleton w-2 h-2 rounded-full" style={{ animationDelay: '0s' }} />
              <div className="skeleton w-2 h-2 rounded-full" style={{ animationDelay: '0.2s' }} />
              <div className="skeleton w-2 h-2 rounded-full" style={{ animationDelay: '0.4s' }} />
            </div>
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
          <Card className="text-center p-8 bg-white shadow-xl animate-scale-in">
            <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="w-9 h-9 text-blue-600" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900 mb-2">Anda Sudah Mengerjakan Tes Ini</h2>
            <p className="text-sm text-slate-500 mb-6">
              Sesuai aturan verifikasi 1 pelamar 1x kesempatan, nilai Anda telah tercatat di sistem perekrut.
            </p>
            <div className="mb-6">
              <AnimatedScoreRing score={existingApp?.score || 0} isPassed={existingApp?.score >= 60} />
            </div>
            <Link to="/dashboard/pelamar">
              <Button className="w-full btn-press">Kembali ke Dashboard</Button>
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
          <Card className="text-center p-8 bg-white animate-scale-in">
            <AlertCircle className="w-12 h-12 text-amber-500 mx-auto mb-3" />
            <h3 className="text-lg font-bold text-slate-900">Soal Belum Tersedia</h3>
            <p className="text-xs text-slate-500 mt-1 mb-6">
              Lowongan ini belum memiliki butir soal yang di-generate. Silakan coba lowongan lain.
            </p>
            <Link to="/dashboard/pelamar">
              <Button variant="outline" className="w-full btn-press">Kembali ke Lowongan</Button>
            </Link>
          </Card>
        </div>
      </div>
    )
  }

  // Tampilan Hasil Akhir Setelah Submit
  if (quizFinished) {
    const isPassed = finalScore >= 60
    const showConfetti = finalScore >= 80

    return (
      <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
        <Navbar />
        <div className="flex-1 max-w-md w-full mx-auto p-4 flex items-center justify-center">
          <Card className="text-center p-8 bg-white shadow-xl border-slate-200 relative overflow-hidden animate-scale-in">
            {showConfetti && <ConfettiBurst />}

            <div className="relative z-20">
              <div
                className={`w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 ${isPassed ? 'bg-emerald-100 text-emerald-600' : 'bg-amber-100 text-amber-600'
                  }`}
              >
                <Trophy className="w-9 h-9" />
              </div>

              <h2 className="text-2xl font-bold text-slate-900 mb-1">
                {showConfetti ? '🎉 Luar Biasa!' : isPassed ? 'Tes Selesai!' : 'Tes Telah Selesai'}
              </h2>
              <p className="text-xs text-slate-500 mb-6">
                Hasil verifikasi kompetensi Anda telah langsung dikirim ke perekrut{' '}
                <strong>{job?.perekrut?.company_name || 'UMKM'}</strong>.
              </p>

              {/* Animated Score Ring */}
              <div className="mb-6">
                <AnimatedScoreRing score={finalScore} isPassed={isPassed} />
              </div>

              <div className="mb-6">
                <Badge variant={isPassed ? 'success' : 'warning'} className="text-xs px-3 py-1">
                  {finalScore >= 80
                    ? '⭐ Kemampuan Sangat Baik (Top Tier)'
                    : isPassed
                      ? '✅ Lolos Kualifikasi Dasar'
                      : '📚 Perlu Asah Skill Tambahan'}
                </Badge>
              </div>

              <div className="space-y-3">
                <Link to="/dashboard/pelamar">
                  <Button className="w-full gap-2 btn-press">
                    Kembali ke Dashboard Pelamar
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </Link>
              </div>
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

      <main className="flex-1 max-w-3xl w-full mx-auto px-4 sm:px-6 py-8 flex flex-col justify-center animate-fade-in-up">
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
            {/* Timer Countdown */}
            <CountdownTimer timeLeft={timeLeft} totalTime={QUIZ_DURATION} />

            <div className="px-3.5 py-1.5 bg-blue-50 text-blue-700 font-bold rounded-xl text-sm flex items-center gap-1.5">
              <HelpCircle className="w-4 h-4" />
              {currentIndex + 1}/{questions.length}
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
                className={`h-2.5 rounded-full transition-all duration-300 ${isCurrent
                    ? 'bg-blue-600 ring-2 ring-blue-300 scale-110'
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
        <Card className="bg-white border-slate-200/90 shadow-md mb-6 animate-fade-in" key={currentIndex}>
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
                  className={`p-4 rounded-xl border transition-all duration-200 cursor-pointer flex items-start gap-3.5 card-hover ${isSelected
                      ? 'bg-blue-50/80 border-blue-500 ring-2 ring-blue-500/20 shadow-sm scale-[1.01]'
                      : 'bg-white border-slate-200 hover:bg-slate-50/70 hover:border-slate-300'
                    }`}
                >
                  <div
                    className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs uppercase shrink-0 transition-all duration-200 ${isSelected
                        ? 'bg-blue-600 text-white scale-110'
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
            className="gap-2 btn-press"
          >
            <ArrowLeft className="w-4 h-4" />
            Sebelumnya
          </Button>

          {isLastQuestion ? (
            <Button
              type="button"
              onClick={handleSubmitQuiz}
              disabled={submitting}
              className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-600/20 btn-press"
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
              className="gap-2 bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-600/20 btn-press"
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
