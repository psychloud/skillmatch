import { createClient } from '@supabase/supabase-js'

const envUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// Di local development, gunakan proxy internal Vite (/supabase-proxy) agar 100% bebas dari blokir CORS/Ekstensi browser
const supabaseUrl = import.meta.env.DEV
  ? `${window.location.origin}/supabase-proxy`
  : envUrl

if (!envUrl || !supabaseAnonKey) {
  console.warn('Supabase URL atau Anon Key belum dikonfigurasi di file .env')
}

export const supabase = createClient(supabaseUrl || '', supabaseAnonKey || '')
