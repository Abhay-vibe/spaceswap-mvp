import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseConfig, getAppConfig, validateEnvironment } from '@/lib/env-config'

export async function GET(request: NextRequest) {
  try {
    // Get configuration status
    const validation = validateEnvironment()
    const supabaseConfig = getSupabaseConfig()
    const appConfig = getAppConfig()

    // Test Supabase connectivity
    let supabaseConnectivity = {
      reachable: false,
      error: null as string | null,
      responseTime: null as number | null
    }

    if (supabaseConfig.isConfigured) {
      try {
        const startTime = Date.now()
        const response = await fetch(`${supabaseConfig.supabaseUrl}/rest/v1/`, {
          method: 'HEAD',
          headers: {
            'apikey': supabaseConfig.supabaseAnonKey,
            'Authorization': `Bearer ${supabaseConfig.supabaseAnonKey}`
          },
          // Timeout after 10 seconds
          signal: AbortSignal.timeout(10000)
        })
        
        supabaseConnectivity.reachable = response.ok
        supabaseConnectivity.responseTime = Date.now() - startTime
        
        if (!response.ok) {
          supabaseConnectivity.error = `HTTP ${response.status}: ${response.statusText}`
        }
      } catch (error) {
        supabaseConnectivity.error = error instanceof Error ? error.message : 'Connection failed'
      }
    } else {
      supabaseConnectivity.error = 'Supabase not configured'
    }

    // Create diagnostic report
    const diagnostic = {
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV,
      validation: validation,
      connectivity: {
        supabase: supabaseConnectivity
      },
      configuration: {
        supabaseUrl: supabaseConfig.supabaseUrl,
        supabaseUrlMasked: supabaseConfig.supabaseUrl.replace(/https:\/\/([a-z0-9]+)/, 'https://***$1***'),
        isPlaceholderUrl: supabaseConfig.supabaseUrl.includes('your-project') || supabaseConfig.supabaseUrl.includes('placeholder'),
        supabaseConfigured: supabaseConfig.isConfigured,
        appUrl: appConfig.appUrl,
        hasAnonKey: Boolean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY),
        hasServiceKey: Boolean(process.env.SUPABASE_SERVICE_KEY),
        hasGoogleClientId: Boolean(process.env.GOOGLE_CLIENT_ID),
        anonKeyPrefix: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.substring(0, 20) + '...',
        serviceKeyPrefix: process.env.SUPABASE_SERVICE_KEY?.substring(0, 20) + '...'
      },
      recommendations: []
    }

    // Add recommendations based on findings
    if (!supabaseConfig.isConfigured) {
      diagnostic.recommendations.push({
        priority: 'HIGH',
        issue: 'Supabase not configured',
        action: 'Set NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, and SUPABASE_SERVICE_KEY environment variables',
        guide: '/SUPABASE_OAUTH_SETUP.md'
      })
    }

    if (supabaseConfig.isConfigured && !supabaseConnectivity.reachable) {
      diagnostic.recommendations.push({
        priority: 'HIGH',
        issue: 'Supabase unreachable',
        action: 'Verify Supabase project URL and check project status at https://status.supabase.com',
        guide: '/SUPABASE_OAUTH_SETUP.md'
      })
    }

    if (supabaseConfig.supabaseUrl.includes('placeholder')) {
      diagnostic.recommendations.push({
        priority: 'CRITICAL',
        issue: 'Using placeholder Supabase URL',
        action: 'Replace placeholder URL with real Supabase project URL',
        guide: '/SUPABASE_OAUTH_SETUP.md'
      })
    }

    if (supabaseConnectivity.responseTime && supabaseConnectivity.responseTime > 5000) {
      diagnostic.recommendations.push({
        priority: 'MEDIUM',
        issue: 'Slow Supabase response',
        action: 'Check network connectivity and Supabase region settings',
        guide: null
      })
    }

    return NextResponse.json(diagnostic, { 
      status: validation.isValid ? 200 : 500,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate'
      }
    })

  } catch (error) {
    console.error('Diagnostic error:', error)
    return NextResponse.json({
      error: 'Diagnostic failed',
      message: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}
