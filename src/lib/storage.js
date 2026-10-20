import { supabase } from './supabase'

/**
 * Memastikan bucket 'logos' ada dan diset sebagai public di Supabase Storage.
 */
export async function ensureLogosBucket() {
  try {
    const { data: buckets, error: listError } = await supabase.storage.listBuckets()
    if (listError) {
      console.warn('Notice saat memeriksa bucket storage:', listError.message)
      return
    }

    const bucketExists = buckets?.some((b) => b.name === 'logos')
    if (!bucketExists) {
      const { error: createError } = await supabase.storage.createBucket('logos', {
        public: true,
        fileSizeLimit: 5242880, // Maksimal 5MB
        allowedMimeTypes: [
          'image/png',
          'image/jpeg',
          'image/jpg',
          'image/webp',
          'image/svg+xml',
          'image/gif',
        ],
      })
      if (createError) {
        console.warn('Notice saat membuat bucket logos:', createError.message)
      }
    }
  } catch (err) {
    console.warn('Gagal memastikan bucket logos:', err?.message)
  }
}

/**
 * Mengunggah file gambar logo ke Supabase Storage bucket 'logos'
 * dan mengembalikan public URL yang valid.
 *
 * @param {File|Blob} file - Objek file gambar yang dipilih user
 * @param {string|null} userId - ID user untuk penamaan unik (opsional)
 * @returns {Promise<string>} Public URL dari file yang diunggah
 */
export async function uploadLogoToStorage(file, userId = null) {
  if (!file) return null

  // 1. Pastikan bucket 'logos' tersedia
  await ensureLogosBucket()

  // 2. Siapkan ekstensi dan nama file yang aman & unik
  const rawExt = file.name ? file.name.split('.').pop() : 'png'
  const cleanExt = rawExt.toLowerCase().replace(/[^a-z0-9]/g, '') || 'png'
  const timestamp = Date.now()
  const randomStr = Math.random().toString(36).substring(2, 8)
  const fileName = userId
    ? `${userId}-${timestamp}.${cleanExt}`
    : `logo-${timestamp}-${randomStr}.${cleanExt}`
  const filePath = fileName

  // 3. Upload file ke Supabase Storage bucket 'logos'
  const { data: uploadData, error: uploadError } = await supabase.storage
    .from('logos')
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: true,
      contentType: file.type || `image/${cleanExt}`,
    })

  if (uploadError) {
    console.error('Error uploading logo to Supabase Storage:', uploadError)
    throw new Error(`Gagal mengunggah logo ke Supabase Storage: ${uploadError.message}`)
  }

  // 4. Dapatkan public URL
  const { data: urlData } = supabase.storage
    .from('logos')
    .getPublicUrl(uploadData?.path || filePath)

  const rawPublicUrl = urlData?.publicUrl || ''

  // 5. Normalisasi URL agar selalu menggunakan domain resmi Supabase publik (bukan internal proxy localhost)
  const cleanEnvUrl = (
    import.meta.env.VITE_SUPABASE_URL || 'https://yqocqqrhkbhsvonsnecu.supabase.co'
  ).replace(/\/+$/, '')

  let finalPublicUrl = rawPublicUrl
  if (finalPublicUrl.includes('/supabase-proxy/')) {
    finalPublicUrl = finalPublicUrl.replace(/^https?:\/\/[^\/]+\/supabase-proxy/, cleanEnvUrl)
  } else if (!finalPublicUrl.startsWith('http')) {
    finalPublicUrl = `${cleanEnvUrl}/storage/v1/object/public/logos/${filePath}`
  }

  return finalPublicUrl
}
