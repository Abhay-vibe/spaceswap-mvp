import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { 
      error, 
      context, 
      userAgent, 
      url, 
      timestamp, 
      debugInfo,
      sessionId 
    } = body

    // Create error log entry
    const errorLog = {
      level: 'error',
      message: `Client OAuth Error: ${error?.message || 'Unknown error'}`,
      payload: {
        error: {
          name: error?.name,
          message: error?.message,
          stack: error?.stack
        },
        context: context || 'oauth-flow',
        userAgent,
        url,
        timestamp: timestamp || new Date().toISOString(),
        debugInfo,
        sessionId,
        source: 'client-side'
      }
    }

    // Log to Supabase logs table
    const { error: logError } = await supabaseAdmin
      .from('logs')
      .insert(errorLog)

    if (logError) {
      console.error('Failed to log client error to database:', logError)
      // Still continue to provide response to client
    }

    // Also log to server console for immediate debugging
    console.error('🚨 CLIENT OAUTH ERROR:', {
      timestamp: new Date().toISOString(),
      error: error?.message || 'Unknown error',
      context,
      url,
      userAgent: userAgent?.substring(0, 100) + '...', // Truncate for readability
      debugInfo
    })

    // Generate error report ID for user reference
    const errorId = `client-${Date.now().toString(36)}-${Math.random().toString(36).substr(2, 5)}`

    return NextResponse.json({
      success: true,
      errorId,
      message: 'Error logged successfully',
      timestamp: new Date().toISOString()
    })

  } catch (logError) {
    console.error('Failed to process client error log:', logError)
    
    return NextResponse.json({
      success: false,
      error: 'Failed to log error',
      message: logError instanceof Error ? logError.message : 'Unknown logging error'
    }, { status: 500 })
  }
}

// Also support GET for basic health check
export async function GET() {
  return NextResponse.json({
    endpoint: '/api/log-client-error',
    status: 'active',
    timestamp: new Date().toISOString(),
    usage: 'POST error details to log client-side OAuth failures'
  })
}
