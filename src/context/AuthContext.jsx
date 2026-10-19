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
          ringkasan: role === 'pelamar' ? ringkasan : null,
        },
      },
    })
    if (error) throw error

    // Insert to profiles table if user is created
    if (data.user) {
      const { error: profileError } = await supabase.from('profiles').upsert({
        id: data.user.id,
        role,
        full_name: fullName,
        company_name: role === 'perekrut' ? companyName : null,
        phone: role === 'pelamar' ? phone : null,
        domisili: role === 'pelamar' ? domisili : null,
        pendidikan: role === 'pelamar' ? pendidikan : null,
        ringkasan: role === 'pelamar' ? ringkasan : null,
      })
      if (profileError) {
        console.error('Error creating profile entry:', profileError.message)
      }
      const userProfile = await fetchProfile(data.user.id, data.user.user_metadata)
      return { user: data.user, session: data.session, profile: userProfile }
    }
    return data
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
