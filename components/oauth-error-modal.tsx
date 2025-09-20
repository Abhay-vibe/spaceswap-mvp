'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { AlertTriangle, Copy, Send, CheckCircle, ExternalLink, X } from 'lucide-react'

interface OAuthErrorModalProps {
  isOpen: boolean
  onClose: () => void
  error: {
    message: string
    name?: string
    stack?: string
  }
  debugInfo: {
    supabaseUrl?: string
    timestamp: string
    userAgent: string
    currentUrl: string
    networkError?: boolean
    configIssue?: boolean
  }
}

export function OAuthErrorModal({ isOpen, onClose, error, debugInfo }: OAuthErrorModalProps) {
  const [reportStatus, setReportStatus] = useState<'idle' | 'sending' | 'sent' | 'failed'>('idle')
  const [copiedDebugInfo, setCopiedDebugInfo] = useState(false)

  if (!isOpen) return null

  // Generate debug report
  const debugReport = {
    error: {
      message: error.message,
      name: error.name,
      stack: error.stack
    },
    environment: {
      supabaseUrl: debugInfo.supabaseUrl,
      timestamp: debugInfo.timestamp,
      userAgent: debugInfo.userAgent,
      currentUrl: debugInfo.currentUrl
    },
    flags: {
      networkError: debugInfo.networkError,
      configIssue: debugInfo.configIssue,
      isPlaceholderUrl: debugInfo.supabaseUrl?.includes('placeholder') || debugInfo.supabaseUrl?.includes('your-project')
    }
  }

  const handleCopyDebugInfo = async () => {
    try {
      const debugText = `
SpaceSwap OAuth Error Report
============================
Time: ${debugInfo.timestamp}
Error: ${error.message}
Supabase URL: ${debugInfo.supabaseUrl || 'Not set'}
Current Page: ${debugInfo.currentUrl}

Technical Details:
${JSON.stringify(debugReport, null, 2)}

User Agent: ${debugInfo.userAgent}
      `.trim()

      await navigator.clipboard.writeText(debugText)
      setCopiedDebugInfo(true)
      setTimeout(() => setCopiedDebugInfo(false), 2000)
    } catch (err) {
      console.error('Failed to copy debug info:', err)
    }
  }

  const handleSendReport = async () => {
    setReportStatus('sending')
    
    try {
      const response = await fetch('/api/log-client-error', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          error,
          context: 'oauth-modal-report',
          userAgent: debugInfo.userAgent,
          url: debugInfo.currentUrl,
          timestamp: debugInfo.timestamp,
          debugInfo: debugReport,
          sessionId: `modal-${Date.now()}`
        })
      })

      if (response.ok) {
        const result = await response.json()
        console.log('Error report sent:', result.errorId)
        setReportStatus('sent')
        setTimeout(() => setReportStatus('idle'), 3000)
      } else {
        throw new Error(`HTTP ${response.status}`)
      }
    } catch (err) {
      console.error('Failed to send error report:', err)
      setReportStatus('failed')
      setTimeout(() => setReportStatus('idle'), 3000)
    }
  }

  const getQuickFix = () => {
    if (debugInfo.supabaseUrl?.includes('placeholder') || debugInfo.supabaseUrl?.includes('your-project')) {
      return {
        title: 'Configuration Issue Detected',
        description: 'Your Supabase URL appears to be a placeholder',
        action: 'Update environment variables',
        link: '/SUPABASE_OAUTH_SETUP.md'
      }
    }
    
    if (debugInfo.networkError) {
      return {
        title: 'Connection Issue',
        description: 'Unable to reach Supabase servers',
        action: 'Check network and Supabase status',
        link: 'https://status.supabase.com'
      }
    }

    return {
      title: 'Authentication Error',
      description: 'OAuth flow encountered an unexpected error',
      action: 'Try again or check configuration',
      link: '/SUPABASE_OAUTH_SETUP.md'
    }
  }

  const quickFix = getQuickFix()

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <CardHeader className="pb-4">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-6 w-6 text-red-500" />
              <div>
                <CardTitle className="text-red-700">Google Sign-In Failed</CardTitle>
                <CardDescription className="mt-1">
                  We encountered an error during authentication
                </CardDescription>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Quick Fix Section */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="font-semibold text-blue-800 mb-2">{quickFix.title}</h3>
            <p className="text-sm text-blue-700 mb-3">{quickFix.description}</p>
            <div className="flex gap-2">
              <Button
                size="sm"
                onClick={() => window.open(quickFix.link, '_blank')}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <ExternalLink className="h-3 w-3 mr-1" />
                {quickFix.action}
              </Button>
            </div>
          </div>

          {/* Error Details */}
          <div className="space-y-3">
            <h3 className="font-semibold text-gray-800">Error Details</h3>
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-sm font-mono text-red-800">{error.message}</p>
              {error.name && (
                <p className="text-xs text-red-600 mt-1">Type: {error.name}</p>
              )}
            </div>
          </div>

          {/* Debug Information */}
          <details className="border rounded-lg">
            <summary className="p-3 cursor-pointer hover:bg-gray-50 font-medium">
              Technical Debug Information
            </summary>
            <div className="px-3 pb-3 border-t bg-gray-50">
              <div className="text-xs font-mono bg-white p-3 rounded border mt-2 overflow-auto max-h-40">
                <pre>{JSON.stringify(debugReport, null, 2)}</pre>
              </div>
              <div className="flex gap-2 mt-3">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleCopyDebugInfo}
                  className="text-xs"
                >
                  {copiedDebugInfo ? (
                    <>
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="h-3 w-3 mr-1" />
                      Copy Debug Info
                    </>
                  )}
                </Button>
              </div>
            </div>
          </details>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t">
            <Button
              onClick={handleSendReport}
              disabled={reportStatus === 'sending'}
              className="flex-1"
            >
              {reportStatus === 'sending' && (
                <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white mr-2" />
              )}
              {reportStatus === 'sent' ? (
                <>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Report Sent
                </>
              ) : reportStatus === 'failed' ? (
                <>
                  <AlertTriangle className="h-4 w-4 mr-2" />
                  Send Failed
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Send Error Report
                </>
              )}
            </Button>
            
            <Button variant="outline" onClick={onClose} className="flex-1">
              Close
            </Button>
          </div>

          {/* Help Text */}
          <div className="text-xs text-gray-600 bg-gray-50 p-3 rounded">
            <p className="font-medium mb-1">Need Help?</p>
            <p>
              1. Click "Send Error Report" to automatically log this issue<br/>
              2. Copy the debug information and share with your developer<br/>
              3. Check the setup guide for configuration issues
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default OAuthErrorModal
