import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseConfig, getStripeConfig, getAppConfig, validateEnvironment } from '@/lib/env-config'

export async function GET(request: NextRequest) {
  try {
    // Get all configuration details
    const supabaseConfig = getSupabaseConfig()
    const stripeConfig = getStripeConfig()
    const appConfig = getAppConfig()
    const validation = validateEnvironment()

    // Check individual environment variables
    const envVars = {
      // Supabase variables
      NEXT_PUBLIC_SUPABASE_URL: {
        value: process.env.NEXT_PUBLIC_SUPABASE_URL || null,
        present: Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL),
        isPlaceholder: process.env.NEXT_PUBLIC_SUPABASE_URL?.includes('placeholder') || 
                      process.env.NEXT_PUBLIC_SUPABASE_URL?.includes('your-project') || false,
        length: process.env.NEXT_PUBLIC_SUPABASE_URL?.length || 0
      },
      NEXT_PUBLIC_SUPABASE_ANON_KEY: {
        value: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 
               `${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY.substring(0, 20)}...` : null,
        present: Boolean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY),
        isPlaceholder: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.includes('placeholder') || false,
        length: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.length || 0,
        startsWithEyJ: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.startsWith('eyJ') || false
      },
      SUPABASE_SERVICE_KEY: {
        value: process.env.SUPABASE_SERVICE_KEY ? 
               `${process.env.SUPABASE_SERVICE_KEY.substring(0, 20)}...` : null,
        present: Boolean(process.env.SUPABASE_SERVICE_KEY),
        isPlaceholder: process.env.SUPABASE_SERVICE_KEY?.includes('placeholder') || false,
        length: process.env.SUPABASE_SERVICE_KEY?.length || 0,
        startsWithEyJ: process.env.SUPABASE_SERVICE_KEY?.startsWith('eyJ') || false
      },
      
      // Stripe variables
      NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: {
        value: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ? 
               `${process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY.substring(0, 20)}...` : null,
        present: Boolean(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY),
        isPlaceholder: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY?.includes('placeholder') || false,
        length: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY?.length || 0
      },
      STRIPE_SECRET_KEY: {
        value: process.env.STRIPE_SECRET_KEY ? 
               `${process.env.STRIPE_SECRET_KEY.substring(0, 20)}...` : null,
        present: Boolean(process.env.STRIPE_SECRET_KEY),
        isPlaceholder: process.env.STRIPE_SECRET_KEY?.includes('placeholder') || false,
        length: process.env.STRIPE_SECRET_KEY?.length || 0
      },
      
      // App variables
      ADMIN_API_KEY: {
        value: process.env.ADMIN_API_KEY ? 
               `${process.env.ADMIN_API_KEY.substring(0, 10)}...` : null,
        present: Boolean(process.env.ADMIN_API_KEY),
        isPlaceholder: process.env.ADMIN_API_KEY?.includes('placeholder') || false,
        length: process.env.ADMIN_API_KEY?.length || 0
      },
      NEXT_PUBLIC_APP_URL: {
        value: process.env.NEXT_PUBLIC_APP_URL || null,
        present: Boolean(process.env.NEXT_PUBLIC_APP_URL),
        isPlaceholder: process.env.NEXT_PUBLIC_APP_URL?.includes('localhost') || false,
        length: process.env.NEXT_PUBLIC_APP_URL?.length || 0
      }
    }

    // Configuration status analysis
    const configAnalysis = {
      supabase: {
        isConfigured: supabaseConfig.isConfigured,
        hasUrl: Boolean(supabaseConfig.supabaseUrl && supabaseConfig.supabaseUrl !== 'https://placeholder.supabase.co'),
        hasAnonKey: Boolean(supabaseConfig.supabaseAnonKey && supabaseConfig.supabaseAnonKey !== 'placeholder-anon-key'),
        hasServiceKey: Boolean(supabaseConfig.supabaseServiceKey && supabaseConfig.supabaseServiceKey !== 'placeholder-service-key'),
        urlIsPlaceholder: supabaseConfig.supabaseUrl === 'https://placeholder.supabase.co',
        anonKeyIsPlaceholder: supabaseConfig.supabaseAnonKey === 'placeholder-anon-key',
        serviceKeyIsPlaceholder: supabaseConfig.supabaseServiceKey === 'placeholder-service-key'
      },
      stripe: {
        isConfigured: stripeConfig.isConfigured,
        hasPublishableKey: Boolean(stripeConfig.publishableKey && stripeConfig.publishableKey !== 'pk_test_placeholder'),
        hasSecretKey: Boolean(stripeConfig.secretKey && stripeConfig.secretKey !== 'sk_test_placeholder')
      },
      app: {
        environment: process.env.NODE_ENV,
        isDevelopment: appConfig.isDevelopment,
        isProduction: appConfig.isProduction,
        appUrl: appConfig.appUrl
      }
    }

    // Specific failure reasons
    const failureReasons = []
    if (!envVars.NEXT_PUBLIC_SUPABASE_URL.present) {
      failureReasons.push('NEXT_PUBLIC_SUPABASE_URL is not set')
    } else if (envVars.NEXT_PUBLIC_SUPABASE_URL.isPlaceholder) {
      failureReasons.push('NEXT_PUBLIC_SUPABASE_URL is a placeholder value')
    }

    if (!envVars.NEXT_PUBLIC_SUPABASE_ANON_KEY.present) {
      failureReasons.push('NEXT_PUBLIC_SUPABASE_ANON_KEY is not set')
    } else if (envVars.NEXT_PUBLIC_SUPABASE_ANON_KEY.isPlaceholder) {
      failureReasons.push('NEXT_PUBLIC_SUPABASE_ANON_KEY is a placeholder value')
    } else if (!envVars.NEXT_PUBLIC_SUPABASE_ANON_KEY.startsWithEyJ) {
      failureReasons.push('NEXT_PUBLIC_SUPABASE_ANON_KEY does not appear to be a valid JWT (should start with "eyJ")')
    }

    if (!envVars.SUPABASE_SERVICE_KEY.present) {
      failureReasons.push('SUPABASE_SERVICE_KEY is not set')
    } else if (envVars.SUPABASE_SERVICE_KEY.isPlaceholder) {
      failureReasons.push('SUPABASE_SERVICE_KEY is a placeholder value')
    } else if (!envVars.SUPABASE_SERVICE_KEY.startsWithEyJ) {
      failureReasons.push('SUPABASE_SERVICE_KEY does not appear to be a valid JWT (should start with "eyJ")')
    }

    return NextResponse.json({
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV,
      configurationStatus: {
        overall: validation.isValid,
        supabaseConfigured: supabaseConfig.isConfigured,
        stripeConfigured: stripeConfig.isConfigured,
        issues: validation.issues,
        failureReasons
      },
      environmentVariables: envVars,
      configAnalysis,
      recommendations: [
        ...(!envVars.NEXT_PUBLIC_SUPABASE_URL.present ? ['Set NEXT_PUBLIC_SUPABASE_URL in Vercel environment variables'] : []),
        ...(!envVars.NEXT_PUBLIC_SUPABASE_ANON_KEY.present ? ['Set NEXT_PUBLIC_SUPABASE_ANON_KEY in Vercel environment variables'] : []),
        ...(!envVars.SUPABASE_SERVICE_KEY.present ? ['Set SUPABASE_SERVICE_KEY in Vercel environment variables'] : []),
        ...(envVars.NEXT_PUBLIC_SUPABASE_URL.isPlaceholder ? ['Replace placeholder SUPABASE_URL with actual project URL'] : []),
        ...(envVars.NEXT_PUBLIC_SUPABASE_ANON_KEY.isPlaceholder ? ['Replace placeholder ANON_KEY with actual key from Supabase'] : []),
        ...(envVars.SUPABASE_SERVICE_KEY.isPlaceholder ? ['Replace placeholder SERVICE_KEY with actual key from Supabase'] : [])
      ]
    })

  } catch (error) {
    console.error('Diagnostic endpoint error:', error)
    return NextResponse.json(
      { 
        error: 'Diagnostic check failed',
        details: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    )
  }
}
