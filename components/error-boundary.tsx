'use client'

import React from 'react'
import { AlertTriangle, RefreshCw, Home } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

interface ErrorBoundaryState {
  hasError: boolean
  error: Error | null
  errorInfo: React.ErrorInfo | null
}

export class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  ErrorBoundaryState
> {
  constructor(props: { children: React.ReactNode }) {
    super(props)
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null
    }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    // Update state so the next render will show the fallback UI
    return {
      hasError: true,
      error,
      errorInfo: null
    }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('🚨 ErrorBoundary caught an error:', error)
    console.error('Error Info:', errorInfo)
    
    // Log to external service in production
    if (typeof window !== 'undefined') {
      // You can add error reporting here (Sentry, LogRocket, etc.)
      console.error('Full Error Details:', {
        error: error.toString(),
        stack: error.stack,
        componentStack: errorInfo.componentStack,
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
        url: window.location.href
      })
    }

    this.setState({
      error,
      errorInfo
    })
  }

  handleReload = () => {
    if (typeof window !== 'undefined') {
      window.location.reload()
    }
  }

  handleGoHome = () => {
    if (typeof window !== 'undefined') {
      window.location.href = '/'
    }
  }

  render() {
    if (this.state.hasError) {
      const isDev = process.env.NODE_ENV === 'development'
      
      return (
        <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-2xl">
            <CardHeader className="text-center">
              <div className="flex justify-center mb-4">
                <AlertTriangle className="h-12 w-12 text-red-500" />
              </div>
              <CardTitle className="text-2xl text-red-700">
                Oops! Something went wrong
              </CardTitle>
              <CardDescription className="text-lg">
                We encountered an unexpected error. Don't worry, this has been logged and we'll fix it soon.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* User-friendly actions */}
              <div className="flex flex-col sm:flex-row gap-3">
                <Button 
                  onClick={this.handleReload}
                  className="flex-1"
                  variant="default"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Reload Page
                </Button>
                <Button 
                  onClick={this.handleGoHome}
                  className="flex-1"
                  variant="outline"
                >
                  <Home className="w-4 h-4 mr-2" />
                  Go to Homepage
                </Button>
              </div>

              {/* Error details (collapsible) */}
              <details className="bg-gray-50 rounded-lg p-4">
                <summary className="cursor-pointer text-sm font-medium text-gray-700 hover:text-gray-900">
                  Technical Details (Click to expand)
                </summary>
                <div className="mt-3 space-y-3">
                  <div>
                    <p className="text-xs font-semibold text-gray-600 mb-1">Error Message:</p>
                    <pre className="text-xs bg-red-50 p-2 rounded border overflow-auto">
                      {this.state.error?.toString() || 'Unknown error'}
                    </pre>
                  </div>
                  
                  {isDev && this.state.error?.stack && (
                    <div>
                      <p className="text-xs font-semibold text-gray-600 mb-1">Stack Trace:</p>
                      <pre className="text-xs bg-gray-100 p-2 rounded border overflow-auto max-h-40">
                        {this.state.error.stack}
                      </pre>
                    </div>
                  )}
                  
                  {isDev && this.state.errorInfo?.componentStack && (
                    <div>
                      <p className="text-xs font-semibold text-gray-600 mb-1">Component Stack:</p>
                      <pre className="text-xs bg-blue-50 p-2 rounded border overflow-auto max-h-40">
                        {this.state.errorInfo.componentStack}
                      </pre>
                    </div>
                  )}
                </div>
              </details>

              {/* Help text */}
              <div className="text-center text-sm text-gray-600">
                <p>If this problem persists, please contact support with the error details above.</p>
                <p className="mt-1 text-xs">Error ID: {Date.now().toString(36)}</p>
              </div>
            </CardContent>
          </Card>
        </div>
      )
    }

    return this.props.children
  }
}

// Functional component wrapper for easier usage
export function ErrorBoundaryWrapper({ children }: { children: React.ReactNode }) {
  return <ErrorBoundary>{children}</ErrorBoundary>
}

export default ErrorBoundary
