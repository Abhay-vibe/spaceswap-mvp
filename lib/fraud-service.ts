import { supabaseAdmin, User, FraudFlag } from './supabase'

export interface FraudCheckResult {
  allowed: boolean
  requiresManualReview: boolean
  flags: string[]
  trustScore: number
}

export class FraudService {
  /**
   * Check if user can auto-accept listings
   */
  static canAutoAccept(user: User): boolean {
    return user.match_history_count >= 2 && user.verified === true
  }

  /**
   * Check if user is eligible to be a buyer
   */
  static isBuyerEligible(user: User): boolean {
    return user.past_flights_count >= 1
  }

  /**
   * Calculate trust score based on user history
   */
  static calculateTrustScore(user: User): number {
    let score = 0
    
    // Base score for verified users
    if (user.verified) score += 20
    
    // Points for successful matches
    score += Math.min(user.match_history_count * 10, 50)
    
    // Points for flight history
    score += Math.min(user.past_flights_count * 5, 30)
    
    // Cap at 100
    return Math.min(score, 100)
  }

  /**
   * Check for rapid request patterns (fraud detection)
   */
  static async checkRapidRequests(userId: string): Promise<boolean> {
    const { data: recentMatches } = await supabaseAdmin
      .from('matches')
      .select('created_at')
      .eq('buyer', userId)
      .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()) // Last 24 hours
    
    if (recentMatches && recentMatches.length >= 3) {
      // Flag for manual review
      await this.createFraudFlag(userId, 'RAPID_REQUESTS', {
        count: recentMatches.length,
        timeframe: '24h'
      })
      return true // Suspicious
    }
    
    return false
  }

  /**
   * Comprehensive fraud check before allowing match creation
   */
  static async performFraudCheck(user: User, matchType: 'buy' | 'sell'): Promise<FraudCheckResult> {
    const flags: string[] = []
    let requiresManualReview = false
    
    // Check buyer eligibility
    if (matchType === 'buy' && !this.isBuyerEligible(user)) {
      flags.push('INSUFFICIENT_FLIGHT_HISTORY')
      requiresManualReview = true
    }
    
    // Check for rapid requests
    if (matchType === 'buy') {
      const hasRapidRequests = await this.checkRapidRequests(user.id)
      if (hasRapidRequests) {
        flags.push('RAPID_REQUESTS')
        requiresManualReview = true
      }
    }
    
    // Check new user with high volume
    const isNewUser = new Date(user.created_at) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // 7 days
    if (isNewUser && user.match_history_count === 0) {
      flags.push('NEW_USER')
      if (matchType === 'buy') {
        requiresManualReview = true
      }
    }
    
    const trustScore = this.calculateTrustScore(user)
    
    return {
      allowed: !requiresManualReview || trustScore >= 30,
      requiresManualReview,
      flags,
      trustScore
    }
  }

  /**
   * Create a fraud flag for manual review
   */
  static async createFraudFlag(userId: string, flagType: FraudFlag['flag_type'], details: Record<string, any>): Promise<void> {
    await supabaseAdmin
      .from('fraud_flags')
      .insert({
        user_id: userId,
        flag_type: flagType,
        details
      })
  }

  /**
   * Update user trust metrics after successful match
   */
  static async updateUserMetrics(userId: string, incrementMatches: boolean = true, incrementFlights: boolean = false): Promise<void> {
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()
    
    if (!profile) return
    
    const updates: any = {}
    
    if (incrementMatches) {
      updates.match_history_count = (profile.match_history_count || 0) + 1
    }
    
    if (incrementFlights) {
      updates.past_flights_count = (profile.past_flights_count || 0) + 1
    }
    
    // Recalculate trust score
    const updatedProfile = { ...profile, ...updates }
    updates.trust_score = this.calculateTrustScore({
      id: updatedProfile.id,
      email: updatedProfile.email,
      full_name: updatedProfile.full_name,
      phone: updatedProfile.phone,
      verified: updatedProfile.verified,
      match_history_count: updatedProfile.match_history_count,
      past_flights_count: updatedProfile.past_flights_count,
      trust_score: updatedProfile.trust_score,
      created_at: updatedProfile.created_at
    })
    
    await supabaseAdmin
      .from('profiles')
      .update(updates)
      .eq('id', userId)
  }

  /**
   * Mask contact information for pre-acceptance display
   */
  static maskContactInfo(user: User): Partial<User> {
    return {
      id: user.id,
      full_name: user.full_name ? this.maskName(user.full_name) : undefined,
      email: this.maskEmail(user.email),
      phone: user.phone ? this.maskPhone(user.phone) : undefined,
      verified: user.verified,
      trust_score: user.trust_score,
      match_history_count: user.match_history_count
    }
  }

  /**
   * Mask name (e.g., "John Doe" -> "J. D*****")
   */
  private static maskName(name: string): string {
    const parts = name.trim().split(' ')
    if (parts.length === 1) {
      return parts[0].charAt(0) + '*****'
    }
    return parts[0].charAt(0) + '. ' + parts[parts.length - 1].charAt(0) + '*****'
  }

  /**
   * Mask email (e.g., "john@example.com" -> "j****@example.com")
   */
  private static maskEmail(email: string): string {
    const [local, domain] = email.split('@')
    return local.charAt(0) + '****@' + domain
  }

  /**
   * Mask phone (e.g., "+91-9876543210" -> "+91-98xxxxxx")
   */
  private static maskPhone(phone: string): string {
    if (phone.length <= 6) return 'xxxxxx'
    return phone.substring(0, 6) + 'xxxxxx'
  }
}

export default FraudService
