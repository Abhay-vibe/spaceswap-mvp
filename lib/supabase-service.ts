// Supabase service layer to replace mockDb
import { supabase, supabaseAdmin } from '@/lib/supabase'
import type { User, Flight, Listing, Match } from '@/lib/types'

export class SupabaseService {
  // Users
  static async createUser(userData: Omit<User, 'id' | 'created_at'>): Promise<User> {
    try {
      console.log('[SupabaseService] Creating user:', userData)
      
      // Sign up user with Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: userData.email,
        password: 'temp-password-123', // In real app, user would provide this
        options: {
          data: {
            full_name: userData.name,
            phone: userData.phone
          }
        }
      })

      if (authError) {
        console.error('[SupabaseService] Auth signup error:', authError)
        throw authError
      }

      if (!authData.user) {
        throw new Error('User creation failed - no user returned')
      }

      // Update user profile in auth.users table
      const { error: updateError } = await supabaseAdmin
        .from('auth.users')
        .update({
          full_name: userData.name,
          phone: userData.phone,
          verified: false,
          match_history_count: 0,
          past_flights_count: 0,
          trust_score: 0
        })
        .eq('id', authData.user.id)

      if (updateError) {
        console.error('[SupabaseService] User profile update error:', updateError)
      }

      const user: User = {
        id: authData.user.id,
        email: userData.email,
        name: userData.name,
        phone: userData.phone,
        ratingAvg: 0,
        createdAt: new Date(authData.user.created_at)
      }

      console.log('[SupabaseService] User created successfully:', user.id)
      return user
    } catch (error) {
      console.error('[SupabaseService] Create user failed:', error)
      throw error
    }
  }

  static async getUserByEmail(email: string): Promise<User | null> {
    try {
      const { data, error } = await supabaseAdmin
        .from('auth.users')
        .select('*')
        .eq('email', email)
        .single()

      if (error) {
        if (error.code === 'PGRST116') return null // Not found
        throw error
      }

      return {
        id: data.id,
        email: data.email,
        name: data.full_name,
        phone: data.phone,
        ratingAvg: data.trust_score || 0,
        createdAt: new Date(data.created_at)
      }
    } catch (error) {
      console.error('[SupabaseService] Get user by email failed:', error)
      return null
    }
  }

  static async getUserById(id: string): Promise<User | null> {
    try {
      const { data, error } = await supabaseAdmin
        .from('auth.users')
        .select('*')
        .eq('id', id)
        .single()

      if (error) {
        if (error.code === 'PGRST116') return null // Not found
        throw error
      }

      return {
        id: data.id,
        email: data.email,
        name: data.full_name,
        phone: data.phone,
        ratingAvg: data.trust_score || 0,
        createdAt: new Date(data.created_at)
      }
    } catch (error) {
      console.error('[SupabaseService] Get user by id failed:', error)
      return null
    }
  }

  // Flights
  static async findOrCreateFlight(flightNo: string, date: Date, airline?: string): Promise<Flight> {
    try {
      const dateStr = date.toISOString().split('T')[0]
      
      // Try to find existing flight
      const { data: existingFlight, error: findError } = await supabaseAdmin
        .from('flights')
        .select('*')
        .eq('flight_no', flightNo.toUpperCase())
        .eq('flight_date', dateStr)
        .single()

      if (existingFlight) {
        return {
          id: existingFlight.id,
          flightNo: existingFlight.flight_no,
          date: new Date(existingFlight.flight_date),
          airline: existingFlight.airline,
          createdAt: new Date(existingFlight.created_at)
        }
      }

      // Create new flight
      const { data: newFlight, error: createError } = await supabaseAdmin
        .from('flights')
        .insert({
          flight_no: flightNo.toUpperCase(),
          flight_date: dateStr,
          airline: airline || null
        })
        .select('*')
        .single()

      if (createError) {
        console.error('[SupabaseService] Create flight error:', createError)
        throw createError
      }

      console.log('[SupabaseService] Flight created:', newFlight.id)
      return {
        id: newFlight.id,
        flightNo: newFlight.flight_no,
        date: new Date(newFlight.flight_date),
        airline: newFlight.airline,
        createdAt: new Date(newFlight.created_at)
      }
    } catch (error) {
      console.error('[SupabaseService] Find/create flight failed:', error)
      throw error
    }
  }

  static async getFlightById(id: string): Promise<Flight | null> {
    try {
      const { data, error } = await supabaseAdmin
        .from('flights')
        .select('*')
        .eq('id', id)
        .single()

      if (error) {
        if (error.code === 'PGRST116') return null
        throw error
      }

      return {
        id: data.id,
        flightNo: data.flight_no,
        date: new Date(data.flight_date),
        airline: data.airline,
        createdAt: new Date(data.created_at)
      }
    } catch (error) {
      console.error('[SupabaseService] Get flight failed:', error)
      return null
    }
  }

  // Listings
  static async createListing(listingData: {
    sellerId: string
    flightId: string
    weightKg: number
    pricePerKg: number
    autoAccept: boolean
    active: boolean
  }): Promise<Listing> {
    try {
      console.log('[SupabaseService] Creating listing:', listingData)
      
      const { data, error } = await supabaseAdmin
        .from('listings')
        .insert({
          seller: listingData.sellerId,
          flight_id: listingData.flightId,
          weight_kg: listingData.weightKg,
          price_per_kg: listingData.pricePerKg,
          auto_accept: listingData.autoAccept,
          active: listingData.active
        })
        .select('*')
        .single()

      if (error) {
        console.error('[SupabaseService] Create listing error:', error)
        throw error
      }

      console.log('[SupabaseService] Listing created:', data.id)
      return {
        id: data.id,
        sellerId: data.seller,
        flightId: data.flight_id,
        weightKg: data.weight_kg,
        pricePerKg: data.price_per_kg,
        autoAccept: data.auto_accept,
        active: data.active,
        createdAt: new Date(data.created_at)
      }
    } catch (error) {
      console.error('[SupabaseService] Create listing failed:', error)
      throw error
    }
  }

  static async getListingById(id: string): Promise<Listing | null> {
    try {
      const { data, error } = await supabaseAdmin
        .from('listings')
        .select('*')
        .eq('id', id)
        .single()

      if (error) {
        if (error.code === 'PGRST116') return null
        throw error
      }

      return {
        id: data.id,
        sellerId: data.seller,
        flightId: data.flight_id,
        weightKg: data.weight_kg,
        pricePerKg: data.price_per_kg,
        autoAccept: data.auto_accept,
        active: data.active,
        createdAt: new Date(data.created_at)
      }
    } catch (error) {
      console.error('[SupabaseService] Get listing failed:', error)
      return null
    }
  }

  static async getListingsByUser(userId: string): Promise<Listing[]> {
    try {
      const { data, error } = await supabaseAdmin
        .from('listings')
        .select('*')
        .eq('seller', userId)
        .eq('active', true)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('[SupabaseService] Get user listings error:', error)
        return []
      }

      return data.map(item => ({
        id: item.id,
        sellerId: item.seller,
        flightId: item.flight_id,
        weightKg: item.weight_kg,
        pricePerKg: item.price_per_kg,
        autoAccept: item.auto_accept,
        active: item.active,
        createdAt: new Date(item.created_at)
      }))
    } catch (error) {
      console.error('[SupabaseService] Get user listings failed:', error)
      return []
    }
  }

  static async getListingsByFlight(flightId: string): Promise<Listing[]> {
    try {
      const { data, error } = await supabaseAdmin
        .from('listings')
        .select('*')
        .eq('flight_id', flightId)
        .eq('active', true)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('[SupabaseService] Get flight listings error:', error)
        return []
      }

      return data.map(item => ({
        id: item.id,
        sellerId: item.seller,
        flightId: item.flight_id,
        weightKg: item.weight_kg,
        pricePerKg: item.price_per_kg,
        autoAccept: item.auto_accept,
        active: item.active,
        createdAt: new Date(item.created_at)
      }))
    } catch (error) {
      console.error('[SupabaseService] Get flight listings failed:', error)
      return []
    }
  }

  // Matches
  static async createMatch(matchData: {
    listingId: string
    buyerId: string
    quantityKg: number
    totalCents: number
    status: string
  }): Promise<Match> {
    try {
      console.log('[SupabaseService] Creating match:', matchData)
      
      const { data, error } = await supabaseAdmin
        .from('matches')
        .insert({
          listing_id: matchData.listingId,
          buyer: matchData.buyerId,
          quantity_kg: matchData.quantityKg,
          total_amount: matchData.totalCents,
          status: matchData.status
        })
        .select('*')
        .single()

      if (error) {
        console.error('[SupabaseService] Create match error:', error)
        throw error
      }

      console.log('[SupabaseService] Match created:', data.id)
      return {
        id: data.id,
        listingId: data.listing_id,
        buyerId: data.buyer,
        quantityKg: data.quantity_kg,
        totalCents: data.total_amount,
        status: data.status,
        qrToken: '', // Not used in Supabase version
        createdAt: new Date(data.created_at),
        updatedAt: new Date(data.updated_at || data.created_at)
      }
    } catch (error) {
      console.error('[SupabaseService] Create match failed:', error)
      throw error
    }
  }

  static async getMatchById(id: string): Promise<Match | null> {
    try {
      const { data, error } = await supabaseAdmin
        .from('matches')
        .select('*')
        .eq('id', id)
        .single()

      if (error) {
        if (error.code === 'PGRST116') return null
        throw error
      }

      return {
        id: data.id,
        listingId: data.listing_id,
        buyerId: data.buyer,
        quantityKg: data.quantity_kg,
        totalCents: data.total_amount,
        status: data.status,
        qrToken: '', // Not used in Supabase version
        createdAt: new Date(data.created_at),
        updatedAt: new Date(data.updated_at || data.created_at)
      }
    } catch (error) {
      console.error('[SupabaseService] Get match failed:', error)
      return null
    }
  }

  static async getMatchesByUser(userId: string): Promise<Match[]> {
    try {
      const { data, error } = await supabaseAdmin
        .from('matches')
        .select('*')
        .eq('buyer', userId)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('[SupabaseService] Get user matches error:', error)
        return []
      }

      return data.map(item => ({
        id: item.id,
        listingId: item.listing_id,
        buyerId: item.buyer,
        quantityKg: item.quantity_kg,
        totalCents: item.total_amount,
        status: item.status,
        qrToken: '', // Not used in Supabase version
        createdAt: new Date(item.created_at),
        updatedAt: new Date(item.updated_at || item.created_at)
      }))
    } catch (error) {
      console.error('[SupabaseService] Get user matches failed:', error)
      return []
    }
  }

  static async getRequestsForUser(userId: string): Promise<Match[]> {
    try {
      // Get matches for listings owned by this user
      const { data, error } = await supabaseAdmin
        .from('matches')
        .select(`
          *,
          listing:listings!inner(seller)
        `)
        .eq('listing.seller', userId)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('[SupabaseService] Get user requests error:', error)
        return []
      }

      return data.map(item => ({
        id: item.id,
        listingId: item.listing_id,
        buyerId: item.buyer,
        quantityKg: item.quantity_kg,
        totalCents: item.total_amount,
        status: item.status,
        qrToken: '', // Not used in Supabase version
        createdAt: new Date(item.created_at),
        updatedAt: new Date(item.updated_at || item.created_at)
      }))
    } catch (error) {
      console.error('[SupabaseService] Get user requests failed:', error)
      return []
    }
  }

  static async updateMatchStatus(id: string, status: string): Promise<Match | null> {
    try {
      const { data, error } = await supabaseAdmin
        .from('matches')
        .update({ status })
        .eq('id', id)
        .select('*')
        .single()

      if (error) {
        console.error('[SupabaseService] Update match status error:', error)
        return null
      }

      console.log('[SupabaseService] Match status updated:', id, status)
      return {
        id: data.id,
        listingId: data.listing_id,
        buyerId: data.buyer,
        quantityKg: data.quantity_kg,
        totalCents: data.total_amount,
        status: data.status,
        qrToken: '', // Not used in Supabase version
        createdAt: new Date(data.created_at),
        updatedAt: new Date(data.updated_at || data.created_at)
      }
    } catch (error) {
      console.error('[SupabaseService] Update match status failed:', error)
      return null
    }
  }

  // Session management (simplified)
  static currentUser: User | null = null

  static async getCurrentUser(): Promise<User | null> {
    return this.currentUser
  }

  static async setCurrentUser(user: User | null): Promise<void> {
    this.currentUser = user
  }

  // Demo data seeding
  static async seedData(): Promise<void> {
    try {
      console.log('[SupabaseService] Checking if demo data needed...')
      
      // Check if any listings exist
      const { count } = await supabaseAdmin
        .from('listings')
        .select('*', { count: 'exact', head: true })

      if (count === 0) {
        console.log('[SupabaseService] Seeding demo data...')
        await this.seedDemoData()
      }
    } catch (error) {
      console.error('[SupabaseService] Seed data check failed:', error)
    }
  }

  private static async seedDemoData(): Promise<void> {
    // This would need to be implemented based on your seeding requirements
    console.log('[SupabaseService] Demo data seeding would happen here')
    // For now, just log that it would seed data
  }

  // Utility methods for compatibility
  static async getAvailableListingsForUser(userId: string): Promise<Listing[]> {
    try {
      const { data, error } = await supabaseAdmin
        .from('listings')
        .select('*')
        .neq('seller', userId)
        .eq('active', true)
        .order('created_at', { ascending: false })
        .limit(10)

      if (error) {
        console.error('[SupabaseService] Get available listings error:', error)
        return []
      }

      return data.map(item => ({
        id: item.id,
        sellerId: item.seller,
        flightId: item.flight_id,
        weightKg: item.weight_kg,
        pricePerKg: item.price_per_kg,
        autoAccept: item.auto_accept,
        active: item.active,
        createdAt: new Date(item.created_at)
      }))
    } catch (error) {
      console.error('[SupabaseService] Get available listings failed:', error)
      return []
    }
  }
}

// Export as default for drop-in replacement of mockDb
export default SupabaseService
