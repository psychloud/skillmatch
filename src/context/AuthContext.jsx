import React, { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  const fetchProfile = async (userId, userMetadata = null) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle()

      if (error) {
        console.error('Error fetching profile:', error.message)
      }

      if (data) {
        setProfile(data)
        return data
      }

      // Fallback ke user_metadata dari auth.users jika data profile di DB belum siap/ada
      if (userMetadata || user?.user_metadata) {
        const meta = userMetadata || user?.user_metadata || {}
        const fallbackProfile = {
          id: userId,
          role: meta.role || 'pelamar',
          full_name: meta.full_name || '',
          company_name: meta.company_name || null,
        }
        setProfile(fallbackProfile)
        return fallbackProfile
      }

      return null
    } catch (err) {
      console.error('Unexpected profile fetch error:', err)
      return null
    }
  }

  useEffect(() => {
    // Initial session check
    supabase.auth.getSession().then(({ data: { session } }) => {
      const currentUser = session?.user ?? null
      setUser(currentUser)
      if (currentUser) {
        fetchProfile(currentUser.id, currentUser.user_metadata).finally(() => setLoading(false))
      } else {
        setProfile(null)
        setLoading(false)
      }
    })

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      const currentUser = session?.user ?? null
      setUser(currentUser)
      if (currentUser) {
        await fetchProfile(currentUser.id, currentUser.user_metadata)
      } else {
        setProfile(null)
      }
      setLoading(false)
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  const login = async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    if (error) throw error
    if (data.user) {
      const userProfile = await fetchProfile(data.user.id, data.user.user_metadata)
      return { user: data.user, profile: userProfile }
    }
    return data
  }

  const register = async ({
    email,
    password,
    role,
    fullName,
    companyName,
    logoUrl,
    phone,
    domisili,
    pendidikan,
    ringkasan,
  }) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          role,
          company_name: role === 'perekrut' ? companyName : null,
          phone: role === 'pelamar' ? phone : null,
          domisili: role === 'pelamar' ? domisili : null,
          pendidikan: role === 'pelamar' ? pendidikan : null,
          // JANGAN masukkan logo_url atau ringkasan ke data auth agar token JWT tidak bengkak
        },
      },
    })
    if (error) throw error

    // Insert to profiles table if user is created
    if (data.user) {
      const fullProfileData = {
        id: data.user.id,
        role,
        full_name: fullName,
        company_name: role === 'perekrut' ? companyName : null,
        logo_url: role === 'perekrut' ? logoUrl : null,
        phone: role === 'pelamar' ? phone : null,
        domisili: role === 'pelamar' ? domisili : null,
        pendidikan: role === 'pelamar' ? pendidikan : null,
        ringkasan: role === 'pelamar' ? ringkasan : null,
      }

      let { error: profileError } = await supabase.from('profiles').upsert(fullProfileData)
      
      // Jika error karena kolom baru belum ditambahkan di Supabase, fallback ke field dasar
      if (profileError) {
        console.warn('Upsert full profile failed, trying basic fields fallback:', profileError.message)
        const basicProfileData = {
          id: data.user.id,
          role,
          full_name: fullName,
          company_name: role === 'perekrut' ? companyName : null,
        }
        const { error: basicError } = await supabase.from('profiles').upsert(basicProfileData)
        if (basicError) {
          console.error('Error creating basic profile entry:', basicError.message)
        }
      }

      const userProfile = await fetchProfile(data.user.id, data.user.user_metadata)
      return { user: data.user, session: data.session, profile: userProfile }
    }
    return data
  }

  const updateProfile = async (updates) => {
    if (!user) throw new Error('User belum login')

    // 1. Simpan semua data lengkap (termasuk logo_url dan ringkasan) ke tabel DB profiles
    const { error: profileError } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', user.id)

    if (profileError) throw profileError

    // 2. Sync HANYA metadata teks ringan ke auth.users (hapus logo_url & ringkasan agar JWT tetap kecil <1KB)
    try {
      const { logo_url, ringkasan, ...lightweightData } = updates
      await supabase.auth.updateUser({
        data: {
          ...lightweightData,
          logo_url: null, // Hapus logo_url dari auth metadata agar tidak masuk ke header JWT
        },
      })
    } catch (e) {
      console.warn('Could not sync user_metadata:', e)
    }

    // 3. Re-fetch fresh profile
    const updated = await fetchProfile(user.id, updates)
    return updated
  }

  const logout = async () => {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
    setUser(null)
    setProfile(null)
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        loading,
        login,
        register,
        logout,
        fetchProfile,
        updateProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
