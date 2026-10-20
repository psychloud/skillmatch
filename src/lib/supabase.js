import { createClient } from '@supabase/supabase-js'

const rawEnvUrl = import.meta.env.VITE_SUPABASE_URL || ''
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || ''

// Bersihkan trailing slash jika ada agar tidak menghasilkan 'Invalid path specified in request URL'
const cleanEnvUrl = rawEnvUrl.trim().replace(/\/+$/, '')

// Gunakan proxy internal (/supabase-proxy) baik di dev (Vite) maupun di prod (Vercel rewrites)
// untuk mencegah pemblokiran ISP / ERR_CONNECTION_CLOSED / ERR_HTTP2_PROTOCOL_ERROR
const isBrowser = typeof window !== 'undefined'
const supabaseUrl = isBrowser
  ? `${window.location.origin}/supabase-proxy`
  : (cleanEnvUrl || 'https://yqocqqrhkbhsvonsnecu.supabase.co')

if (!cleanEnvUrl || !supabaseAnonKey) {
  console.warn('Supabase URL atau Anon Key belum dikonfigurasi di file .env / Vercel Environment Variables')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
