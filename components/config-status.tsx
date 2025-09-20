'use client'

import { useEffect, useState } from 'react'
import { validateEnvironment } from '@/lib/env-config'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { AlertTriangle, CheckCircle, Settings, ExternalLink } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface ConfigStatus {
  isValid: boolean
  issues: string[]
  config: any
}

export function ConfigStatusBanner() {
  const [configStatus, setConfigStatus] = useState<ConfigStatus | null>(null)
  const [showDetails, setShowDetails] = useState(false)

  useEffect(() => {
    // Only check config status in development or if there are issues
    if (typeof window !== 'undefined') {
      const status = validateEnvironment()
      setConfigStatus(status)
      
      // Auto-show details if there are issues
      if (!status.isValid) {
        setShowDetails(true)
      }
    }
  }, [])

  if (!configStatus) return null

  // Don't show banner in production if everything is working
  if (configStatus.isValid && process.env.NODE_ENV === 'production') {
    return null
  }

  return (
    <div className={`w-full ${configStatus.isValid ? 'bg-green-50 border-green-200' : 'bg-yellow-50 border-yellow-200'} border-b`}>
      <div className="container mx-auto px-4 py-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {configStatus.isValid ? (
              <CheckCircle className="h-4 w-4 text-green-600" />
            ) : (
              <AlertTriangle className="h-4 w-4 text-yellow-600" />
            )}
            <span className={`text-sm font-medium ${configStatus.isValid ? 'text-green-800' : 'text-yellow-800'}`}>
              {configStatus.isValid 
                ? 'Configuration OK' 
                : `Configuration Issues (${configStatus.issues.length})`
              }
            </span>
            {!configStatus.isValid && (
              <span className="text-xs text-yellow-600">
                - Some features may not work properly
              </span>
            )}
          </div>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowDetails(!showDetails)}
            className="text-xs"
          >
            <Settings className="h-3 w-3 mr-1" />
            {showDetails ? 'Hide' : 'Show'} Details
          </Button>
        </div>

        {showDetails && (
          <div className="mt-3 pt-3 border-t border-yellow-200">
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {/* Supabase Status */}
              <div className="flex items-center gap-2">
                {configStatus.config.supabase.isConfigured ? (
                  <CheckCircle className="h-4 w-4 text-green-600" />
                ) : (
                  <AlertTriangle className="h-4 w-4 text-red-600" />
                )}
                <span className="text-xs">
                  Supabase: {configStatus.config.supabase.isConfigured ? 'Configured' : 'Missing'}
                </span>
              </div>

              {/* Stripe Status */}
              <div className="flex items-center gap-2">
                {configStatus.config.stripe.isConfigured ? (
                  <CheckCircle className="h-4 w-4 text-green-600" />
                ) : (
                  <AlertTriangle className="h-4 w-4 text-yellow-600" />
                )}
                <span className="text-xs">
                  Stripe: {configStatus.config.stripe.isConfigured ? 'Configured' : 'Missing'}
                </span>
              </div>

              {/* Environment */}
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-blue-600" />
                <span className="text-xs">
                  Environment: {configStatus.config.app.isDevelopment ? 'Development' : 'Production'}
                </span>
              </div>
            </div>

            {!configStatus.isValid && (
              <div className="mt-3 p-3 bg-yellow-100 rounded-lg">
                <p className="text-xs font-semibold text-yellow-800 mb-2">Setup Required:</p>
                <ul className="text-xs text-yellow-700 space-y-1">
                  {configStatus.issues.map((issue, index) => (
                    <li key={index} className="flex items-center gap-2">
                      <span className="w-1 h-1 bg-yellow-600 rounded-full"></span>
                      {issue}
                    </li>
                  ))}
                </ul>
                <div className="mt-2 flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-xs h-6"
                    onClick={() => window.open('/GOOGLE_OAUTH_SETUP.md', '_blank')}
                  >
                    <ExternalLink className="h-3 w-3 mr-1" />
                    Setup Guide
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

// Fallback component for when configuration is completely broken
export function ConfigErrorFallback() {
  return (
    <div className="min-h-screen bg-yellow-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-lg">
        <CardHeader>
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-6 w-6 text-yellow-600" />
            <CardTitle className="text-yellow-800">Configuration Required</CardTitle>
          </div>
          <CardDescription>
            SpaceSwap needs to be configured before it can run properly.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-white p-4 rounded-lg border">
            <h4 className="font-semibold text-sm mb-2">Missing Configuration:</h4>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• Supabase URL and API keys</li>
              <li>• Stripe payment configuration</li>
              <li>• Google OAuth credentials</li>
            </ul>
          </div>
          
          <div className="flex gap-2">
            <Button 
              onClick={() => window.open('/GOOGLE_OAUTH_SETUP.md', '_blank')}
              className="flex-1"
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              View Setup Guide
            </Button>
            <Button 
              variant="outline"
              onClick={() => window.location.reload()}
            >
              Retry
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
