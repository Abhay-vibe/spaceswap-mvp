'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Loader2, CheckCircle, AlertCircle } from 'lucide-react'

export default function AuthCallbackPage() {
  const router = useRouter()
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [message, setMessage] = useState('Processing authentication...')

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        console.log('Starting auth callback process...')
        
        // Get the session from the URL hash
        const { data: { session }, error: sessionError } = await supabase.auth.getSession()
        
        if (sessionError) {
          console.error('Session error:', sessionError)
          setStatus('error')
          setMessage(`Authentication failed: ${sessionError.message}`)
          return
        }

        if (!session?.user) {
          console.error('No session or user found')
          setStatus('error')
          setMessage('No authentication session found. Please try signing in again.')
          return
        }

        console.log('Auth callback - User found:', session.user.email)

        // Sync user profile data with retry logic
        let syncAttempts = 0
        const maxAttempts = 3
        let syncSuccess = false

        while (syncAttempts < maxAttempts && !syncSuccess) {
          try {
            console.log(`Profile sync attempt ${syncAttempts + 1}/${maxAttempts}`)
            
            const syncResponse = await fetch('/api/auth/sync', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${session.access_token}`
              },
              body: JSON.stringify({
                user: session.user
              })
            })

            if (syncResponse.ok) {
              const syncData = await syncResponse.json()
              console.log('Profile synced successfully:', syncData)
              syncSuccess = true
            } else {
              const errorData = await syncResponse.json().catch(() => ({ error: 'Unknown sync error' }))
              console.error(`Profile sync attempt ${syncAttempts + 1} failed:`, errorData)
              
              if (syncAttempts === maxAttempts - 1) {
                // Last attempt failed
                setStatus('error')
                setMessage(`Profile sync failed: ${errorData.error || 'Unknown error'}. You may need to sign in again.`)
                return
              }
            }
          } catch (fetchError) {
            console.error(`Profile sync attempt ${syncAttempts + 1} network error:`, fetchError)
            
            if (syncAttempts === maxAttempts - 1) {
              setStatus('error')
              setMessage('Network error during profile sync. Please check your connection and try again.')
              return
            }
          }
          
          syncAttempts++
          
          // Wait before retry (exponential backoff)
          if (!syncSuccess && syncAttempts < maxAttempts) {
            await new Promise(resolve => setTimeout(resolve, 1000 * syncAttempts))
          }
        }

        if (syncSuccess) {
          setStatus('success')
          setMessage('Successfully authenticated! Redirecting to dashboard...')

          // Redirect to dashboard after a short delay
          setTimeout(() => {
            if (typeof window !== 'undefined') {
              router.push('/')
            }
          }, 2000)
        }

      } catch (error) {
        console.error('Auth callback error:', error)
        setStatus('error')
        setMessage(`Unexpected error: ${error instanceof Error ? error.message : 'Unknown error'}`)
      }
    }

    // Add a small delay to ensure DOM is ready
    const timeoutId = setTimeout(handleAuthCallback, 100)
    
    return () => clearTimeout(timeoutId)
  }, [router])

  const getIcon = () => {
    switch (status) {
      case 'loading':
        return <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      case 'success':
        return <CheckCircle className="h-8 w-8 text-green-600" />
      case 'error':
        return <AlertCircle className="h-8 w-8 text-red-600" />
    }
  }

  const getStatusColor = () => {
    switch (status) {
      case 'loading':
        return 'text-blue-600'
      case 'success':
        return 'text-green-600'
      case 'error':
        return 'text-red-600'
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            {getIcon()}
          </div>
          <CardTitle className={`text-xl ${getStatusColor()}`}>
            {status === 'loading' && 'Authenticating...'}
            {status === 'success' && 'Welcome to SpaceSwap!'}
            {status === 'error' && 'Authentication Failed'}
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center">
          <p className="text-gray-600 mb-4">{message}</p>
          
          {status === 'error' && (
            <div className="space-y-2">
              <button
                onClick={() => router.push('/')}
                className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Return to Home
              </button>
              <button
                onClick={() => {
                  if (typeof window !== 'undefined') {
                    window.location.reload()
                  }
                }}
                className="w-full bg-gray-200 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Try Again
              </button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
