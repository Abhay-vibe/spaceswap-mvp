// Environment configuration with safe fallbacks to prevent white screen errors

export const getSupabaseConfig = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY

  // In development, provide helpful error messages
  if (process.env.NODE_ENV === 'development') {
    if (!supabaseUrl) {
      console.warn('⚠️  NEXT_PUBLIC_SUPABASE_URL is not set. Some features may not work.')
    }
    if (!supabaseAnonKey) {
      console.warn('⚠️  NEXT_PUBLIC_SUPABASE_ANON_KEY is not set. Authentication may not work.')
    }
    if (!supabaseServiceKey) {
      console.warn('⚠️  SUPABASE_SERVICE_KEY is not set. Server-side operations may not work.')
    }
  }

  return {
    supabaseUrl: supabaseUrl || 'https://placeholder.supabase.co',
    supabaseAnonKey: supabaseAnonKey || 'placeholder-anon-key',
    supabaseServiceKey: supabaseServiceKey || 'placeholder-service-key',
    isConfigured: Boolean(supabaseUrl && supabaseAnonKey && supabaseServiceKey)
  }
}

export const getStripeConfig = () => {
  const publishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
  const secretKey = process.env.STRIPE_SECRET_KEY

  return {
    publishableKey: publishableKey || 'pk_test_placeholder',
    secretKey: secretKey || 'sk_test_placeholder',
    isConfigured: Boolean(publishableKey && secretKey)
  }
}

export const getAppConfig = () => {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 
                 (typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000')
  
  return {
    appUrl,
    adminApiKey: process.env.ADMIN_API_KEY || 'placeholder-admin-key',
    isDevelopment: process.env.NODE_ENV === 'development',
    isProduction: process.env.NODE_ENV === 'production'
  }
}

// Check if all required environment variables are set
export const validateEnvironment = () => {
  const supabase = getSupabaseConfig()
  const stripe = getStripeConfig()
  const app = getAppConfig()

  const issues: string[] = []

  if (!supabase.isConfigured) {
    issues.push('Supabase configuration incomplete')
  }

  if (!stripe.isConfigured && app.isProduction) {
    issues.push('Stripe configuration incomplete')
  }

  return {
    isValid: issues.length === 0,
    issues,
    config: { supabase, stripe, app }
  }
}
