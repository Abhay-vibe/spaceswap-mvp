'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { AlertCircle, CheckCircle, XCircle, RefreshCw } from 'lucide-react'

interface DiagnosticData {
  timestamp: string
  environment: string
  configurationStatus: {
    overall: boolean
    supabaseConfigured: boolean
    issues: string[]
    failureReasons: string[]
  }
  environmentVariables: Record<string, any>
  configAnalysis: any
  recommendations: string[]
}

export function ConfigDiagnostic() {
  const [diagnosticData, setDiagnosticData] = useState<DiagnosticData | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const runDiagnostic = async () => {
    setLoading(true)
    setError(null)
    
    try {
      const response = await fetch('/api/diagnostic')
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }
      
      const data = await response.json()
      setDiagnosticData(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to run diagnostic')
      console.error('Diagnostic error:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    runDiagnostic()
  }, [])

  const getStatusIcon = (status: boolean) => {
    return status ? (
      <CheckCircle className="h-5 w-5 text-green-500" />
    ) : (
      <XCircle className="h-5 w-5 text-red-500" />
    )
  }

  const getVariableStatus = (variable: any) => {
    if (!variable.present) return 'text-red-600 bg-red-50'
    if (variable.isPlaceholder) return 'text-orange-600 bg-orange-50'
    return 'text-green-600 bg-green-50'
  }

  return (
    <div className="space-y-4 p-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5" />
            Configuration Diagnostic
            <Button 
              onClick={runDiagnostic} 
              disabled={loading}
              size="sm"
              variant="outline"
            >
              {loading ? <RefreshCw className="h-4 w-4 animate-spin" /> : 'Refresh'}
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="bg-red-50 border border-red-200 rounded p-3 mb-4">
              <div className="flex items-center gap-2 text-red-800">
                <XCircle className="h-4 w-4" />
                <span className="font-medium">Diagnostic Failed</span>
              </div>
              <p className="text-red-700 mt-1">{error}</p>
            </div>
          )}

          {diagnosticData && (
            <div className="space-y-4">
              {/* Overall Status */}
              <div className="bg-gray-50 rounded p-3">
                <div className="flex items-center gap-2 mb-2">
                  {getStatusIcon(diagnosticData.configurationStatus.overall)}
                  <span className="font-medium">
                    Overall Status: {diagnosticData.configurationStatus.overall ? 'CONFIGURED' : 'NOT CONFIGURED'}
                  </span>
                </div>
                <div className="text-sm text-gray-600">
                  Environment: {diagnosticData.environment} | 
                  Timestamp: {new Date(diagnosticData.timestamp).toLocaleString()}
                </div>
              </div>

              {/* Failure Reasons */}
              {diagnosticData.configurationStatus.failureReasons.length > 0 && (
                <div className="bg-red-50 border border-red-200 rounded p-3">
                  <div className="font-medium text-red-800 mb-2">Configuration Issues:</div>
                  <ul className="list-disc list-inside text-red-700 text-sm space-y-1">
                    {diagnosticData.configurationStatus.failureReasons.map((reason, index) => (
                      <li key={index}>{reason}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Environment Variables */}
              <div>
                <h3 className="font-medium mb-2">Environment Variables:</h3>
                <div className="space-y-2">
                  {Object.entries(diagnosticData.environmentVariables).map(([key, variable]: [string, any]) => (
                    <div key={key} className={`p-2 rounded border ${getVariableStatus(variable)}`}>
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-sm">{key}</span>
                        <div className="flex items-center gap-2">
                          {getStatusIcon(variable.present && !variable.isPlaceholder)}
                          <span className="text-xs">
                            {!variable.present ? 'NOT SET' : 
                             variable.isPlaceholder ? 'PLACEHOLDER' : 
                             `SET (${variable.length} chars)`}
                          </span>
                        </div>
                      </div>
                      {variable.value && (
                        <div className="text-xs mt-1 font-mono opacity-75">
                          {variable.value}
                        </div>
                      )}
                      {variable.hasOwnProperty('startsWithEyJ') && (
                        <div className="text-xs mt-1">
                          JWT Format: {variable.startsWithEyJ ? '✓ Valid' : '✗ Invalid (should start with "eyJ")'}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Configuration Analysis */}
              <div>
                <h3 className="font-medium mb-2">Configuration Analysis:</h3>
                <div className="bg-gray-50 rounded p-3 space-y-2">
                  <div className="flex items-center gap-2">
                    {getStatusIcon(diagnosticData.configAnalysis.supabase.isConfigured)}
                    <span>Supabase: {diagnosticData.configAnalysis.supabase.isConfigured ? 'Configured' : 'Not Configured'}</span>
                  </div>
                  <div className="text-sm text-gray-600 ml-7">
                    • URL: {diagnosticData.configAnalysis.supabase.hasUrl ? '✓' : '✗'} 
                    {diagnosticData.configAnalysis.supabase.urlIsPlaceholder && ' (placeholder)'}
                  </div>
                  <div className="text-sm text-gray-600 ml-7">
                    • Anon Key: {diagnosticData.configAnalysis.supabase.hasAnonKey ? '✓' : '✗'}
                    {diagnosticData.configAnalysis.supabase.anonKeyIsPlaceholder && ' (placeholder)'}
                  </div>
                  <div className="text-sm text-gray-600 ml-7">
                    • Service Key: {diagnosticData.configAnalysis.supabase.hasServiceKey ? '✓' : '✗'}
                    {diagnosticData.configAnalysis.supabase.serviceKeyIsPlaceholder && ' (placeholder)'}
                  </div>
                </div>
              </div>

              {/* Recommendations */}
              {diagnosticData.recommendations.length > 0 && (
                <div className="bg-blue-50 border border-blue-200 rounded p-3">
                  <div className="font-medium text-blue-800 mb-2">Recommendations:</div>
                  <ul className="list-disc list-inside text-blue-700 text-sm space-y-1">
                    {diagnosticData.recommendations.map((recommendation, index) => (
                      <li key={index}>{recommendation}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
