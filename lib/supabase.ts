import { createClient } from '@supabase/supabase-js'
import { getSupabaseConfig } from './env-config'

const config = getSupabaseConfig()

// Client for frontend operations (with RLS)
export const supabase = createClient(config.supabaseUrl, config.supabaseAnonKey, {
  auth: {
    // Only persist session if properly configured
    persistSession: config.isConfigured,
    autoRefreshToken: config.isConfigured
  }
})

// Admin client for backend operations (bypasses RLS)
export const supabaseAdmin = createClient(config.supabaseUrl, config.supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

// Export configuration status for components to check
export const isSupabaseConfigured = config.isConfigured

// Debug helper for client-side environment variable verification
export const getClientSupabaseConfig = () => {
  if (typeof window !== 'undefined') {
    return {
      url: process.env.NEXT_PUBLIC_SUPABASE_URL,
      hasAnonKey: Boolean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY),
      isConfigured: config.isConfigured,
      isPlaceholder: config.supabaseUrl.includes('placeholder') || config.supabaseUrl.includes('your-project')
    }
  }
  return null
}

// Database types
export interface User {
  id: string
  email: string
  full_name?: string
  phone?: string
  verified: boolean
  match_history_count: number
  past_flights_count: number
  trust_score: number
  created_at: string
}

export interface Flight {
  id: string
  airline?: string
  flight_no: string
  flight_date: string
  created_at: string
}

export interface Listing {
  id: string
  seller: string
  flight_id: string
  weight_kg: number
  price_per_kg: number
  auto_accept: boolean
  active: boolean
  created_at: string
  // Joined data
  flight?: Flight
  seller_data?: User
}

export interface Match {
  id: string
  listing_id: string
  buyer: string
  quantity_kg: number
  total_amount: number
  booking_reference?: string
  status: 'PENDING' | 'ACCEPTED' | 'CONFIRMED' | 'RELEASED' | 'DISPUTED' | 'CANCELLED'
  created_at: string
  // Joined data
  listing?: Listing
  buyer_data?: User
}

// Fraud check flags
export interface FraudFlag {
  id: string
  user_id: string
  flag_type: 'RAPID_REQUESTS' | 'NEW_USER_HIGH_VOLUME' | 'SUSPICIOUS_PATTERN'
  details: Record<string, any>
  created_at: string
}
