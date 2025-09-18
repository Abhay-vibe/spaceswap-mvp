"use client"

import type React from "react"

import { createContext, useContext, useEffect, useState } from "react"
import type { User } from "@/lib/types"
import { mockDb } from "@/lib/mock-db"

interface AuthContextType {
  user: User | null
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
      const currentUser = await mockDb.getCurrentUser()
      setUser(currentUser)
      setLoading(false)
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
      setUser(user)
    } finally {
      setLoading(false)
    }
  }

  const logout = async () => {
    await mockDb.setCurrentUser(null)
    setUser(null)
  }

  return <AuthContext.Provider value={{ user, login, logout, loading }}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
