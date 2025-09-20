"use client"

import type React from "react"

import { createContext, useContext, useEffect, useState } from "react"
import type { User } from "@/lib/types"
import { supabase } from "@/lib/supabase"
import type { Session } from '@supabase/supabase-js'

interface AuthContextType {
  user: User | null
  setUser: (user: User | null) => void
  session: Session | null
  login: (email: string) => Promise<void>
  loginWithGoogle: () => Promise<void>
  logout: () => Promise<void>
  loading: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Get initial session
    const getInitialSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession()
        if (error) {
          console.error('Error getting session:', error)
          return
        }
        
        setSession(session)
        
        if (session?.user) {
          await syncUserProfile(session.user)
        }
      } catch (error) {
        console.error('Auth initialization failed:', error)
      } finally {
        setLoading(false)
      }
    }

    getInitialSession()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event, session?.user?.email)
        setSession(session)
        
        if (event === 'SIGNED_IN' && session?.user) {
          await syncUserProfile(session.user)
        } else if (event === 'SIGNED_OUT') {
          setUser(null)
          if (typeof window !== 'undefined') {
            localStorage.removeItem('spaceswap_user')
          }
        }
      }
    )

    return () => {
      subscription?.unsubscribe()
    }
  }, [])

  const syncUserProfile = async (supabaseUser: any) => {
    try {
      // Fetch user profile from our profiles table
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', supabaseUser.id)
        .single()

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching profile:', error)
        return
      }

      let userProfile: User
      
      if (profile) {
        // Convert profile to our User type
        userProfile = {
          id: profile.id,
          email: profile.email,
          name: profile.full_name,
          phone: profile.phone,
          avatarUrl: profile.avatar_url,
          ratingAvg: profile.trust_score || 0,
          createdAt: new Date(profile.created_at)
        }
      } else {
        // Fallback to Supabase user data if no profile exists
        userProfile = {
          id: supabaseUser.id,
          email: supabaseUser.email,
          name: supabaseUser.user_metadata?.full_name || supabaseUser.user_metadata?.name,
          phone: supabaseUser.user_metadata?.phone,
          avatarUrl: supabaseUser.user_metadata?.avatar_url,
          ratingAvg: 0,
          createdAt: new Date(supabaseUser.created_at)
        }
      }

      setUser(userProfile)
      if (typeof window !== 'undefined') {
        localStorage.setItem('spaceswap_user', JSON.stringify(userProfile))
      }
    } catch (error) {
      console.error('Failed to sync user profile:', error)
    }
  }

  const login = async (email: string) => {
    setLoading(true)
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback`
        }
      })
      
      if (error) {
        console.error('Login error:', error)
        throw error
      }
      
      // The auth state change will handle setting the user
    } finally {
      setLoading(false)
    }
  }

  const loginWithGoogle = async () => {
    setLoading(true)
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback`
        }
      })
      
      if (error) {
        console.error('Google login error:', error)
        throw error
      }
      
      // The redirect will handle the rest
    } finally {
      setLoading(false)
    }
  }

  const logout = async () => {
    const { error } = await supabase.auth.signOut()
    if (error) {
      console.error('Logout error:', error)
    }
    // The auth state change will handle clearing the user
  }

  const persistUser = (user: User | null) => {
    if (typeof window !== 'undefined') {
      if (user) {
        localStorage.setItem('spaceswap_user', JSON.stringify(user))
      } else {
        localStorage.removeItem('spaceswap_user')
      }
    }
    setUser(user)
  }

  return (
    <AuthContext.Provider 
      value={{ 
        user, 
        setUser: persistUser, 
        session,
        login, 
        loginWithGoogle,
        logout, 
        loading 
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
