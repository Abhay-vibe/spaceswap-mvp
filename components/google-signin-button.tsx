'use client'

import { useState } from 'react'
import { useAuth } from '@/components/auth-provider'
import { Button } from '@/components/ui/button'
import { Loader2, AlertCircle } from 'lucide-react'
import { isSupabaseConfigured } from '@/lib/supabase'

interface GoogleSignInButtonProps {
  className?: string
  children?: React.ReactNode
}

export function GoogleSignInButton({ className, children }: GoogleSignInButtonProps) {
  const { loginWithGoogle } = useAuth()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleGoogleSignIn = async () => {
    // Check if Supabase is properly configured
    if (!isSupabaseConfigured) {
      setError('Supabase not configured. Please check environment variables.')
      if (typeof window !== 'undefined') {
        window.open('/SUPABASE_OAUTH_SETUP.md', '_blank')
      }
      return
    }

    setLoading(true)
    setError(null)
    
    try {
      await loginWithGoogle()
    } catch (error) {
      console.error('Google sign-in failed:', error)
      setError(error instanceof Error ? error.message : 'Authentication failed')
      setLoading(false)
    }
    // Don't set loading to false here as we'll be redirecting
  }

  return (
    <div className="space-y-2">
      <Button
        onClick={handleGoogleSignIn}
        disabled={loading || !isSupabaseConfigured}
        variant="outline"
        className={`w-full bg-white hover:bg-gray-50 text-gray-900 border-gray-300 ${
          !isSupabaseConfigured ? 'opacity-50 cursor-not-allowed' : ''
        } ${className}`}
      >
        {loading ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : !isSupabaseConfigured ? (
          <AlertCircle className="mr-2 h-4 w-4 text-orange-500" />
        ) : (
          <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
            <path
              fill="currentColor"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="currentColor"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="currentColor"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            />
            <path
              fill="currentColor"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            />
          </svg>
        )}
        {!isSupabaseConfigured 
          ? 'Setup Required' 
          : children || 'Continue with Google'
        }
      </Button>
      
      {error && (
        <div className="text-xs text-red-600 bg-red-50 p-2 rounded border border-red-200">
          <div className="flex items-center gap-1">
            <AlertCircle className="h-3 w-3" />
            <span className="font-medium">Authentication Error:</span>
          </div>
          <p className="mt-1">{error}</p>
          {error.includes('Supabase') && (
            <button 
              onClick={() => window.open('/SUPABASE_OAUTH_SETUP.md', '_blank')}
              className="mt-1 text-xs underline hover:no-underline"
            >
              View setup guide →
            </button>
          )}
        </div>
      )}
    </div>
  )
}

export default GoogleSignInButton
