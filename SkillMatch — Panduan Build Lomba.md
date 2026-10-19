# SkillMatch — Panduan Build Lomba

Oct 19, 2026 · @hasan

## Overview

**SkillMatch** adalah platform screening kerja berbasis AI untuk menghubungkan pencari kerja muda dengan UMKM menengah di Indonesia. Perekrut memilih kategori posisi, AI otomatis generate quiz skill, dan kandidat disaring berdasarkan skor — bukan CV.

**Tujuan lomba:** Menjawab mismatch tenaga kerja bonus demografi Indonesia 2045 dengan solusi yang scalable dan konkret.

| Item | Detail |
| --- | --- |
| Stack | React + Vite + Tailwind + shadcn/ui |
| Backend | Supabase (Auth + Database + Storage) |
| AI | SumoPod API (OpenAI-compatible) |
| Deploy | Vercel |
| Target demo | 70% fitur jalan dalam 1 hari |
| Roles | Pelamar & Perekrut |

## Problem Statement & Data

Bonus demografi Indonesia 2020–2045 menghasilkan surplus tenaga kerja usia produktif, tetapi mayoritas tidak terserap secara optimal karena **mismatch skill vs kebutuhan industri**.

| Data | Angka | Sumber |
| --- | --- | --- |
| Tingkat pengangguran terbuka | 4,82% (7,47 juta jiwa) | BPS Februari 2024 |
| Pekerja informal | 59,17% dari total angkatan kerja | BPS Agustus 2023 |
| UMKM aktif | 66 juta unit | Kemenkop 2023 |
| UMKM tanpa sistem rekrutmen digital | \~85% | Laporan ILO Indonesia 2023 |
| Fresh graduate menganggur >6 bulan | 1 dari 3 lulusan | BPS Sakernas 2023 |

**Root cause yang diaddress SkillMatch:**

1. Platform rekrutmen existing (LinkedIn, JobStreet) terlalu formal untuk UMKM dan pekerja informal
2. Tidak ada mekanisme verifikasi skill berbasis bukti nyata — semua masih CV dan klaim sepihak
3. UMKM tidak punya kapasitas HR untuk screening manual ratusan pelamar

## Arsitektur & Tech Stack

```
User (Browser)
    ↓
React + Vite (Frontend) → Vercel
    ↓              ↓
Supabase Auth    SumoPod API
(JWT Token)      (Quiz Generation)
    ↓
Supabase DB (PostgreSQL)
    ↓
Supabase Storage (Upload hasil quiz)
```

| Layer | Teknologi | Alasan |
| --- | --- | --- |
| Frontend | React + Vite | Fast build, familiar, deploy-ready |
| UI Components | shadcn/ui + Tailwind | Komponen jadi, UI profesional tanpa desain dari nol |
| Auth | Supabase Auth | JWT built-in, dua role (pelamar/perekrut) dalam 20 menit |
| Database | Supabase PostgreSQL | REST API otomatis dari schema, no backend code |
| AI | SumoPod API | OpenAI-compatible, produk lokal Indonesia, 52+ model |
| Deploy | Vercel | Push = deploy, zero config untuk React |

**Kenapa tidak pakai Laravel:** Setup minimum 2-3 jam untuk auth + API + deploy. Supabase menggantikan seluruh backend dalam 20 menit.

## Scope MVP

Prioritas: **fitur yang 100% working lebih baik dari banyak fitur yang broken.**

| # | Fitur | Role | Prioritas | Estimasi |
| --- | --- | --- | --- | --- |
| 1 | Landing page + statistik mismatch (data BPS hardcode) | Public | WAJIB | 1 jam |
| 2 | Register & Login (2 role: Pelamar / Perekrut) | Both | WAJIB | 1 jam |
| 3 | Perekrut: pilih kategori posisi → AI generate 5 soal otomatis | Perekrut | WAJIB | 2 jam |
| 4 | Perekrut: publish lowongan dengan quiz terlampir | Perekrut | WAJIB | 1 jam |
| 5 | Pelamar: browse lowongan → kerjakan quiz → submit | Pelamar | WAJIB | 2 jam |
| 6 | Perekrut: lihat ranking kandidat berdasarkan skor | Perekrut | WAJIB | 1 jam |
| 7 | Polish UI + responsif mobile | Both | PENTING | 1 jam |
| 8 | Notifikasi email hasil quiz | Pelamar | SKIP | — |
| 9 | Filter lowongan by lokasi/gaji | Pelamar | SKIP | — |
| 10 | Perekrut edit soal manual | Perekrut | SKIP | — |

**Total estimasi fitur wajib: \~9 jam.** Sisanya untuk debug, polish, dan dokumentasi.

> Fitur SKIP bukan tidak ada — **pitch ke juri sebagai roadmap Phase 2**, bukan keterbatasan.

## Schema Database Supabase

Copy-paste langsung ke **SQL Editor** di Supabase dashboard.

```sql
-- 1. Profiles (extend auth.users)
CREATE TABLE profiles (
  id UUID REFERENCES auth.users PRIMARY KEY,
  role TEXT CHECK (role IN ('pelamar', 'perekrut', 'admin')) NOT NULL,
  full_name TEXT,
  company_name TEXT, -- hanya untuk perekrut
  phone TEXT, -- nomor telepon / WA pelamar
  domisili TEXT, -- kota domisili pelamar
  pendidikan TEXT, -- SMP, SMA/SMK, D3, S1, S2
  ringkasan TEXT, -- ringkasan diri pelamar
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Note: Jika tabel profiles sudah ada sebelumnya, gunakan migrasi ini di SQL Editor:
-- ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
-- ALTER TABLE profiles ADD CONSTRAINT profiles_role_check CHECK (role IN ('pelamar', 'perekrut', 'admin'));
-- ALTER TABLE profiles ADD COLUMN IF NOT EXISTS phone TEXT;
-- ALTER TABLE profiles ADD COLUMN IF NOT EXISTS domisili TEXT;
-- ALTER TABLE profiles ADD COLUMN IF NOT EXISTS pendidikan TEXT;
-- ALTER TABLE profiles ADD COLUMN IF NOT EXISTS ringkasan TEXT;

-- 2. Job listings
CREATE TABLE jobs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  perekrut_id UUID REFERENCES profiles(id) NOT NULL,
  title TEXT NOT NULL,
  category TEXT NOT NULL, -- 'admin', 'kasir', 'desainer', dst
  description TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Quiz questions (AI generated)
CREATE TABLE questions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  job_id UUID REFERENCES jobs(id) ON DELETE CASCADE,
  question_text TEXT NOT NULL,
  option_a TEXT, option_b TEXT, option_c TEXT, option_d TEXT,
  correct_answer TEXT CHECK (correct_answer IN ('a','b','c','d')),
  order_num INT
);

-- 4. Applications + quiz results
CREATE TABLE applications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  job_id UUID REFERENCES jobs(id),
  pelamar_id UUID REFERENCES profiles(id),
  score INT DEFAULT 0, -- 0-100
  answers JSONB, -- {"q1":"a", "q2":"c", ...}
  status TEXT DEFAULT 'Menunggu Review' CHECK (status IN ('Menunggu Review', 'Shortlisted', 'Dihubungi', 'Ditolak')),
  submitted_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(job_id, pelamar_id) -- 1 pelamar 1x per lowongan
);

-- Note: Jika tabel applications sudah ada, jalankan migrasi ini:
-- ALTER TABLE applications ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'Menunggu Review' CHECK (status IN ('Menunggu Review', 'Shortlisted', 'Dihubungi', 'Ditolak'));
-- CREATE POLICY "perekrut_update_application_status" ON applications FOR UPDATE USING (job_id IN (SELECT id FROM jobs WHERE perekrut_id = auth.uid()));

-- RLS: Perekrut hanya lihat aplikasi ke job miliknya
ALTER TABLE applications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "perekrut_own_jobs" ON applications
  FOR SELECT USING (
    job_id IN (SELECT id FROM jobs WHERE perekrut_id = auth.uid())
  );
```

## Alur Kerja di Antigravity

Antigravity adalah agentic IDE — lo **prompt dalam bahasa natural**, dia yang generate dan jalankan kode. Urutan ini penting: jangan skip step, jangan prompt semua sekaligus.

### Step 1 — Setup Project (prompt ke Antigravity)

```
Create a new React + Vite project with Tailwind CSS and shadcn/ui.
Install dependencies: @supabase/supabase-js, react-router-dom, lucide-react.
Create .env file with VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY and VITE_SUMOPOD_API_KEY placeholders.
Setup supabase client in src/lib/supabase.js.
```

### Step 2 — Auth & Routing

```
Create auth flow with Supabase: Register and Login pages.
After login, check user role from profiles table.
If role = 'perekrut' redirect to /dashboard/perekrut
If role = 'pelamar' redirect to /dashboard/pelamar
Use react-router-dom for routing. Protect routes — redirect to /login if not authenticated.
```

### Step 3 — Landing Page

```
Create a landing page that shows:
- Hero section: headline about job mismatch in Indonesia
- Stats section (hardcode): 7.47 juta pengangguran, 66 juta UMKM, 59% pekerja informal
- How it works: 3 steps for perekrut, 3 steps for pelamar
- CTA buttons: Cari Kerja (pelamar) and Rekrut Sekarang (perekrut)
Use shadcn/ui components. Make it responsive.
```

### Step 4 — AI Quiz Generator

```
Create a function generateQuiz(category, jobTitle) in src/lib/ai.js.
Call SumoPod API at https://api-gate.sumopod.com/webhook/sumopod/ai/chat
Use Authorization: Bearer with env VITE_SUMOPOD_API_KEY
Model: gpt-4o-mini
Return 5 multiple choice questions as JSON array:
[{ question, option_a, option_b, option_c, option_d, correct_answer }]
Handle errors gracefully — show toast if AI fails.
```

### Step 5 — Dashboard Perekrut

```
Create /dashboard/perekrut page with:
1. Form: create job listing (title, category dropdown, description)
2. On submit: call generateQuiz(category, title), save job + questions to Supabase
3. Job list table: show all jobs with applicant count and average score
4. Click job: show ranked applicant list (name, score, submitted_at)
```

### Step 6 — Dashboard Pelamar

```
Create /dashboard/pelamar page with:
1. Browse active job listings as cards (title, company, category)
2. Click job: show job detail + Start Quiz button
3. Quiz page: show 5 questions one by one, radio buttons for options
4. On submit: calculate score, save to applications table, show result
5. My Applications tab: list all applied jobs with score
```

### Step 7 — Polish & Deploy

```
Make all pages mobile responsive.
Add loading states for all async operations.
Add error boundaries.
Build the project: npm run build
Deploy to Vercel: connect GitHub repo or use vercel CLI.
Make sure all env variables are set in Vercel dashboard.
```

> **Aturan penting saat pakai Antigravity:** Satu prompt = satu task. Jangan campur Step 2 dan 3 dalam satu prompt. Kalau output-nya salah, debug dulu sebelum lanjut ke step berikutnya.

## Prompt Template AI Quiz Generator

Ini prompt yang dikirim ke SumoPod API saat perekrut buat lowongan.

````javascript
// src/lib/ai.js
export async function generateQuiz(category, jobTitle) {
  const prompt = `
Kamu adalah HR specialist yang membuat soal screening untuk posisi ${jobTitle} di UMKM Indonesia.

Buat 5 soal pilihan ganda yang menguji keahlian praktis untuk kategori: ${category}.

Aturan soal:
- Gunakan skenario nyata yang terjadi di tempat kerja UMKM Indonesia
- Bahasa Indonesia yang mudah dipahami
- Setiap soal punya 4 pilihan (a, b, c, d)
- Satu jawaban benar
- Tingkat kesulitan: sedang (bukan teori, tapi aplikasi praktis)

Format respons HANYA JSON array, tanpa penjelasan tambahan:
[
  {
    "question": "...",
    "option_a": "...",
    "option_b": "...",
    "option_c": "...",
    "option_d": "...",
    "correct_answer": "a"
  }
]
`;

  const response = await fetch('https://api-gate.sumopod.com/webhook/sumopod/ai/chat', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${import.meta.env.VITE_SUMOPOD_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 1500
    })
  });

  const data = await response.json();
  const text = data.choices[0].message.content;
  
  // Strip markdown fences jika ada
  const clean = text.replace(/```json|```/g, '').trim();
  return JSON.parse(clean);
}
````

**Kategori yang tersedia (hardcode sebagai dropdown):**

| Value | Label |
| --- | --- |
| admin | Admin & Kesekretariatan |
| kasir | Kasir & Pembayaran |
| desainer | Desain Grafis |
| teknisi | Teknisi & Maintenance |
| marketing | Marketing & Media Sosial |
| gudang | Gudang & Logistik |
| customer\_service | Customer Service |

## Checklist Aspek Penilaian

### UI/UX

- [ ] Landing page hero section jelas dan informatif
- [ ] Navigasi intuitif — tidak perlu instruksi untuk pakai
- [ ] Responsif di mobile dan desktop
- [ ] Loading state untuk semua operasi async
- [ ] Konsistensi warna dan font (shadcn/ui default sudah cukup)
- [ ] Error message yang human-readable

### Dokumentasi

- [ ] README.md: problem statement, tech stack, cara install, screenshot
- [ ] `.env.example` tersedia di repo
- [ ] Komentar kode di fungsi kritis (generateQuiz, scoring)
- [ ] ERD atau screenshot schema database
- [ ] Link demo live (Vercel URL)

### Keamanan

- [ ] Row Level Security (RLS) aktif di Supabase — perekrut hanya lihat data miliknya
- [ ] API key SumoPod tidak expose di frontend (gunakan env variable)
- [ ] Input validation sebelum insert ke database
- [ ] Auth check di semua protected routes
- [ ] HTTPS enforced (Vercel otomatis handle ini)

### Berjalan Sesuai

- [ ] Register & login dua role berfungsi
- [ ] AI generate 5 soal tanpa error
- [ ] Pelamar bisa submit quiz dan dapat skor
- [ ] Perekrut bisa lihat ranking kandidat
- [ ] Tidak ada console error saat demo
- [ ] Test di Chrome dan Firefox

### Inovasi

- [ ] AI quiz generation berbasis kategori — bukan soal statis
- [ ] Skill-based screening, bukan CV-based
- [ ] Target segmen yang ignored platform besar (UMKM & pekerja informal)
- [ ] Data mismatch tenaga kerja Indonesia ditampilkan di landing

### Kompatibilitas

- [ ] Berjalan di Chrome, Firefox, Safari
- [ ] Responsif di viewport 375px (mobile) dan 1280px (desktop)
- [ ] Deploy di Vercel (public URL, bukan localhost)

## Pitch Defense — Jawaban untuk Juri

| Pertanyaan Juri | Jawaban |
| --- | --- |
| "Bedanya apa sama LinkedIn/JobStreet?" | Mereka CV-based dan terlalu formal untuk UMKM. SkillMatch skill-task-based — kandidat dibuktikan lewat hasil, bukan klaim di kertas. Target segmen yang mereka abaikan. |
| "UMKM gaptek, siapa yang mau pakai?" | Target bukan UMKM gaptek. Target UMKM menengah yang sudah punya IG/Tokopedia, sudah hire pegawai, tapi belum punya sistem screening. Ada 5-6 juta di segmen ini. |
| "AI quiz-nya akurat tidak?" | Quiz di-generate berdasarkan skenario kerja nyata, bukan teori. Akurasi bisa ditingkatkan dengan fine-tuning berdasarkan feedback perekrut — itu roadmap Phase 2. |
| "Kalau perekrut tidak ngerti AI bagaimana?" | Perekrut tidak perlu ngerti AI. Mereka cukup pilih kategori posisi dari dropdown, quiz langsung jadi. Zero friction. |
| "Monetisasinya bagaimana?" | Freemium B2B — gratis sampai skala tertentu, berbayar untuk fitur lanjutan. Jangka panjang, data skill gap real-time kami adalah aset yang bisa dimonetisasi ke Kemendikbud dan lembaga pelatihan. |
| "Kenapa pakai SumoPod bukan OpenAI?" | SumoPod adalah produk AI Indonesia — ini konsisten dengan semangat Indonesia Emas. Infrastruktur AI lokal yang mendukung ekosistem tech nasional. |
| "Ini bisa scale tidak?" | Supabase dan Vercel keduanya serverless — scale otomatis dengan traffic. Tidak perlu DevOps. |

## README Template

Copy-paste ke `README.md` di root project, isi bagian yang kosong.

````markdown
# SkillMatch — Platform Screening Kerja Berbasis AI

> Menghubungkan pencari kerja muda dengan UMKM Indonesia melalui verifikasi skill berbasis bukti nyata, bukan CV.

## 🎯 Problem

Bonus demografi Indonesia 2045 menghasilkan jutaan angkatan kerja baru, namun:
- 7,47 juta pengangguran terbuka (BPS 2024)
- 85% UMKM tidak punya sistem rekrutmen digital
- Platform existing terlalu formal untuk segmen UMKM & pekerja informal

## 💡 Solusi

SkillMatch menggunakan AI untuk generate quiz skill otomatis berdasarkan kebutuhan perekrut. Kandidat disaring berdasarkan skor, bukan CV.

## 🚀 Demo

**Live:** [https://skillmatch.vercel.app](https://skillmatch.vercel.app)

| Role | Email | Password |
| --- | --- | --- |
| Perekrut | demo-perekrut@test.com | demo123 |
| Pelamar | demo-pelamar@test.com | demo123 |

## 🛠 Tech Stack

| Layer | Teknologi |
| --- | --- |
| Frontend | React + Vite + Tailwind CSS |
| UI Components | shadcn/ui |
| Backend & Auth | Supabase |
| AI Quiz Generator | SumoPod API (gpt-4o-mini) |
| Deploy | Vercel |

## ⚙️ Instalasi Lokal

```bash
git clone https://github.com/username/skillmatch
cd skillmatch
npm install
cp .env.example .env
# Isi .env dengan kredensial Supabase dan SumoPod kamu
npm run dev
````

## 🗄 Setup Database

1. Buat project baru di [supabase.com](https://supabase.com)
2. Buka SQL Editor
3. Copy-paste schema dari `database/schema.sql`
4. Jalankan query

## 🔒 Keamanan

- Row Level Security (RLS) aktif di semua tabel
- JWT auth via Supabase
- Environment variables untuk semua API key
- Input validation di semua form

## 📁 Struktur Folder

```
src/
├── components/     # Reusable UI components
├── pages/          # Route pages
│   ├── Landing.jsx
│   ├── Login.jsx
│   ├── Register.jsx
│   ├── dashboard/
│   │   ├── Perekrut.jsx
│   │   └── Pelamar.jsx
│   └── Quiz.jsx
├── lib/
│   ├── supabase.js # Supabase client
│   └── ai.js       # SumoPod quiz generator
└── App.jsx
```

```
```
