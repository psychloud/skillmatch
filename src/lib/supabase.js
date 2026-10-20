import { createClient } from '@supabase/supabase-js'

const rawEnvUrl = import.meta.env.VITE_SUPABASE_URL || ''
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || ''

// Bersihkan trailing slash jika ada agar tidak menghasilkan 'Invalid path specified in request URL'
const cleanEnvUrl = rawEnvUrl.trim().replace(/\/+$/, '')

// Di local development, gunakan proxy internal Vite (/supabase-proxy) jika ada blokir CORS
const supabaseUrl = import.meta.env.DEV
  ? `${window.location.origin}/supabase-proxy`
  : cleanEnvUrl

if (!cleanEnvUrl || !supabaseAnonKey) {
  console.warn('Supabase URL atau Anon Key belum dikonfigurasi di file .env / Vercel Environment Variables')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
