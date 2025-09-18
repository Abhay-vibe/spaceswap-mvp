"use client"

import type React from "react"

import { createContext, useContext, useEffect, useState } from "react"
import type { User } from "@/lib/types"
import { mockDb } from "@/lib/mock-db"

interface AuthContextType {
  user: User | null
  setUser: (user: User | null) => void
  login: (email: string) => Promise<void>
  logout: () => Promise<void>
  loading: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Check for existing session
    const checkAuth = async () => {
      try {
        // First check localStorage for user session
        const storedUser = localStorage.getItem('spaceswap_user')
        if (storedUser) {
          const user = JSON.parse(storedUser)
          await mockDb.setCurrentUser(user)
          setUser(user)
        } else {
          // Fallback to mockDb
          const currentUser = await mockDb.getCurrentUser()
          setUser(currentUser)
        }
      } catch (error) {
        console.error('Auth check failed:', error)
        setUser(null)
      } finally {
        setLoading(false)
      }
    }
    checkAuth()
  }, [])

  const login = async (email: string) => {
    setLoading(true)
    try {
      let user = await mockDb.getUserByEmail(email)
      if (!user) {
        // Create new user for demo
        user = await mockDb.createUser({ email, name: email.split("@")[0] })
      }
      await mockDb.setCurrentUser(user)
      localStorage.setItem('spaceswap_user', JSON.stringify(user))
      setUser(user)
    } finally {
      setLoading(false)
    }
  }

  const logout = async () => {
    await mockDb.setCurrentUser(null)
    localStorage.removeItem('spaceswap_user')
    setUser(null)
  }

  const persistUser = (user: User | null) => {
    if (user) {
      localStorage.setItem('spaceswap_user', JSON.stringify(user))
    } else {
      localStorage.removeItem('spaceswap_user')
    }
    setUser(user)
  }

  return <AuthContext.Provider value={{ user, setUser: persistUser, login, logout, loading }}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
