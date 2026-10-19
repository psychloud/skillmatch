# SkillMatch — Platform Screening Kerja Berbasis AI

> Menghubungkan pencari kerja muda dengan UMKM Indonesia melalui verifikasi skill berbasis bukti nyata, bukan CV.

## 🎯 Problem
Bonus demografi Indonesia 2020–2045 menghasilkan surplus angkatan kerja usia produktif, namun terjadi mismatch kompetensi dengan kebutuhan industri:
- **7,47 Juta** Pengangguran Terbuka (BPS Sakernas Februari 2024).
- **~85% UMKM** (dari 66 juta unit) belum memiliki sistem rekrutmen digital (Laporan ILO Indonesia 2023).
- **59,17%** Angkatan kerja berada di sektor informal tanpa standar sertifikasi formal.

## 💡 Solusi: SkillMatch
SkillMatch adalah platform screening AI dua sisi (*Pelamar & Perekrut*):
1. **Perekrut UMKM** memilih kategori posisi kerja $\rightarrow$ AI SumoPod (`gpt-4o-mini`) secara otomatis menyusun 5 studi kasus soal praktis pilihan ganda.
2. **Pencari Kerja** langsung menguji keahliannya melalui tes 5 menit.
3. Kandidat disaring & diranking otomatis berdasarkan skor objektif (0–100), tanpa harus membuang waktu memilah ratusan lembar CV.

## 🛠 Tech Stack
| Layer | Teknologi |
| --- | --- |
| **Frontend** | React 18, Vite, Tailwind CSS, shadcn/ui design tokens |
| **Icons & UI** | Lucide React |
| **Routing** | React Router DOM v6 (Role-Protected Routes) |
| **Backend & Database** | Supabase (PostgreSQL, JWT Auth, Row Level Security) |
| **AI Engine** | SumoPod API (`gpt-4o-mini`) |
| **Deploy** | Vercel |

## ⚙️ Instalasi Lokal
1. **Clone repository:**
   ```bash
   git clone https://github.com/username/skillmatch.git
   cd skillmatch
   ```
2. **Install dependensi:**
   ```bash
   npm install
   ```
3. **Konfigurasi Environment Variable:**
   Salin `.env.example` menjadi `.env` lalu isi nilai kredensial:
   ```bash
   cp .env.example .env
   ```
   Isi `.env`:
   ```env
   VITE_SUPABASE_URL=https://yqocqqrhkbhsvonsnecu.supabase.co
   VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI...
   VITE_SUMOPOD_API_KEY=your_sumopod_api_key_here
   ```
4. **Jalankan Aplikasi:**
   ```bash
   npm run dev
   ```

## 🚀 Panduan Deploy ke Vercel

### Opsi A: Menggunakan GitHub (Paling Direkomendasikan)
1. Push proyek ini ke repository GitHub Anda:
   ```bash
   git init
   git add .
   git commit -m "feat: complete SkillMatch MVP"
   git branch -M main
   git remote add origin https://github.com/username/skillmatch.git
   git push -u origin main
   ```
2. Buka dashboard [Vercel](https://vercel.com) dan klik **"Add New..."** $\rightarrow$ **"Project"**.
3. Import repository GitHub Anda.
4. Di bagian **Environment Variables**, tambahkan:
   - `VITE_SUPABASE_URL` : URL Supabase Anda
   - `VITE_SUPABASE_ANON_KEY` : Anon Key Supabase Anda
   - `VITE_SUMOPOD_API_KEY` : API Key SumoPod Anda
5. Klik **"Deploy"**.

### Opsi B: Menggunakan Vercel CLI
```bash
npm install -g vercel
vercel
# Ikuti instruksi di terminal dan tambahkan environment variable di dashboard Vercel
```

## 🔒 Skema Database & Keamanan (RLS)
Tabel Supabase:
- `profiles` (id, role: `pelamar`/`perekrut`, full_name, company_name)
- `jobs` (id, perekrut_id, title, category, description, is_active)
- `questions` (id, job_id, question_text, option_a..d, correct_answer, order_num)
- `applications` (id, job_id, pelamar_id, score, answers, submitted_at)

Row Level Security (RLS) diaktifkan untuk memastikan perekrut hanya dapat mengakses kandidat pelamar pada lowongan miliknya, dan pelamar hanya dapat mengubah datanya sendiri.
