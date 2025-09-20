'use client'

import { useState } from 'react'
import { useAuth } from '@/components/auth-provider'
import { Button } from '@/components/ui/button'
import { Loader2, AlertCircle, Shield, AlertTriangle } from 'lucide-react'
import { isSupabaseConfigured } from '@/lib/supabase'
import { OAuthErrorModal } from './oauth-error-modal'

interface GoogleSignInButtonProps {
  className?: string
  children?: React.ReactNode
}

export function GoogleSignInButton({ className, children }: GoogleSignInButtonProps) {
  const { loginWithGoogle } = useAuth()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showErrorModal, setShowErrorModal] = useState(false)
  const [modalErrorInfo, setModalErrorInfo] = useState<any>(null)

  // Client-side sanity checks
  const getSupabaseUrl = () => {
    if (typeof window !== 'undefined') {
      return process.env.NEXT_PUBLIC_SUPABASE_URL
    }
    return null
  }

  const checkSupabaseUrl = () => {
    const supabaseUrl = getSupabaseUrl()
    const isPlaceholder = !supabaseUrl || 
      supabaseUrl.includes('your-project') || 
      supabaseUrl.includes('placeholder') ||
      supabaseUrl.includes('example') ||
      supabaseUrl === 'https://placeholder.supabase.co'
    
    return {
      url: supabaseUrl,
      isValid: !isPlaceholder && supabaseUrl?.startsWith('https://') && supabaseUrl?.includes('.supabase.co'),
      isPlaceholder
    }
  }

  const supabaseCheck = checkSupabaseUrl()

  const handleGoogleSignIn = async () => {
    const timestamp = new Date().toISOString()
    
    // Pre-flight checks
    if (!isSupabaseConfigured || !supabaseCheck.isValid) {
      const errorInfo = {
        error: {
          name: 'ConfigurationError',
          message: supabaseCheck.isPlaceholder 
            ? 'Supabase URL is a placeholder - update environment variables'
            : 'Supabase not properly configured'
        },
        debugInfo: {
          supabaseUrl: supabaseCheck.url,
          timestamp,
          userAgent: navigator.userAgent,
          currentUrl: window.location.href,
          configIssue: true,
          networkError: false
        }
      }
      
      setModalErrorInfo(errorInfo)
      setShowErrorModal(true)
      return
    }

    setLoading(true)
    setError(null)
    
    try {
      await loginWithGoogle()
    } catch (error) {
      console.error('Google sign-in failed:', error)
      setLoading(false)
      
      // Determine error type
      const isNetworkError = error instanceof Error && (
        error.message.includes('fetch') ||
        error.message.includes('network') ||
        error.message.includes('connection') ||
        error.message.includes('CORS')
      )
      
      const errorInfo = {
        error: {
          name: error instanceof Error ? error.name : 'UnknownError',
          message: error instanceof Error ? error.message : 'Authentication failed',
          stack: error instanceof Error ? error.stack : undefined
        },
        debugInfo: {
          supabaseUrl: supabaseCheck.url,
          timestamp,
          userAgent: navigator.userAgent,
          currentUrl: window.location.href,
          configIssue: false,
          networkError: isNetworkError
        }
      }
      
      // Auto-report critical errors
      if (isNetworkError || supabaseCheck.isPlaceholder) {
        try {
          await fetch('/api/log-client-error', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              error: errorInfo.error,
              context: 'oauth-auto-report',
              userAgent: navigator.userAgent,
              url: window.location.href,
              timestamp,
              debugInfo: errorInfo.debugInfo,
              sessionId: `auto-${Date.now()}`
            })
          })
        } catch (reportError) {
          console.error('Failed to auto-report error:', reportError)
        }
      }
      
      setModalErrorInfo(errorInfo)
      setShowErrorModal(true)
    }
    // Don't set loading to false here as we'll be redirecting on success
  }

  const getButtonState = () => {
    if (loading) {
      return {
        disabled: true,
        icon: <Loader2 className="mr-2 h-4 w-4 animate-spin" />,
        text: 'Authenticating...',
        className: 'bg-blue-50 border-blue-200'
      }
    }
    
    if (supabaseCheck.isPlaceholder) {
      return {
        disabled: false, // Allow click to show error modal
        icon: <AlertTriangle className="mr-2 h-4 w-4 text-red-500" />,
        text: 'Configuration Required',
        className: 'bg-red-50 border-red-200 text-red-700 hover:bg-red-100'
      }
    }
    
    if (!isSupabaseConfigured || !supabaseCheck.isValid) {
      return {
        disabled: false, // Allow click to show error modal
        icon: <AlertCircle className="mr-2 h-4 w-4 text-orange-500" />,
        text: 'Setup Required',
        className: 'bg-orange-50 border-orange-200 text-orange-700 hover:bg-orange-100'
      }
    }
    
    return {
      disabled: false,
      icon: (
        <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
          <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
          <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
          <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
          <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
        </svg>
      ),
      text: children || 'Continue with Google',
      className: 'bg-white hover:bg-gray-50 text-gray-900 border-gray-300'
    }
  }

  const buttonState = getButtonState()

  return (
    <>
      <div className="space-y-2">
        <div className="relative">
          <Button
            onClick={handleGoogleSignIn}
            disabled={buttonState.disabled}
            variant="outline"
            className={`w-full ${buttonState.className} ${className}`}
          >
            {buttonState.icon}
            {buttonState.text}
          </Button>
          
          {/* Debug Badge for Placeholder URLs */}
          {supabaseCheck.isPlaceholder && (
            <div className="absolute -top-2 -right-2 bg-red-500 text-white text-xs px-2 py-1 rounded-full shadow-lg">
              <Shield className="h-3 w-3 inline mr-1" />
              Debug
            </div>
          )}
        </div>

        {/* Configuration Warning */}
        {(supabaseCheck.isPlaceholder || !supabaseCheck.isValid) && (
          <div className="text-xs bg-yellow-50 border border-yellow-200 rounded p-2">
            <div className="flex items-center gap-1 text-yellow-800">
              <AlertTriangle className="h-3 w-3" />
              <span className="font-medium">Configuration Issue:</span>
            </div>
            <p className="text-yellow-700 mt-1">
              {supabaseCheck.isPlaceholder 
                ? 'Supabase URL is a placeholder. Click to see setup instructions.'
                : 'Supabase configuration incomplete. Authentication will not work.'
              }
            </p>
          </div>
        )}
        
        {error && (
          <div className="text-xs text-red-600 bg-red-50 p-2 rounded border border-red-200">
            <div className="flex items-center gap-1">
              <AlertCircle className="h-3 w-3" />
              <span className="font-medium">Authentication Error:</span>
            </div>
            <p className="mt-1">{error}</p>
          </div>
        )}
      </div>

      {/* Error Modal */}
      {showErrorModal && modalErrorInfo && (
        <OAuthErrorModal
          isOpen={showErrorModal}
          onClose={() => setShowErrorModal(false)}
          error={modalErrorInfo.error}
          debugInfo={modalErrorInfo.debugInfo}
        />
      )}
    </>
  )
}

export default GoogleSignInButton
