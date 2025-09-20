"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useAuth } from "./auth-provider"
import { GoogleSignInButton } from "./google-signin-button"

export function LoginForm() {
  const [email, setEmail] = useState("")
  const [loading, setLoading] = useState(false)
  const { login } = useAuth()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email) return

    setLoading(true)
    try {
      await login(email)
    } catch (error) {
      console.error("Login failed:", error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl font-bold">Welcome to SpaceSwap ✈️</CardTitle>
        <CardDescription>Share baggage allowance with fellow travelers</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Google Sign-In - Primary option */}
        <GoogleSignInButton />
        
        {/* Divider */}
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-background px-2 text-muted-foreground">Or continue with email</span>
          </div>
        </div>

        {/* Email Sign-In - Secondary option */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Input
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <Button type="submit" variant="outline" className="w-full" disabled={loading}>
            {loading ? "Sending magic link..." : "Sign in with Email"}
          </Button>
        </form>
        
        <p className="text-xs text-muted-foreground text-center">
          By signing in, you agree to our terms of service and privacy policy
        </p>
      </CardContent>
    </Card>
  )
}
