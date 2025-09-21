import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

// Force this route to be dynamic 
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    // Note: No authentication required for demo purposes
    // In production, implement proper admin authentication

    // Get total users count
    const { count: totalUsers } = await supabaseAdmin
      .from('auth.users')
      .select('*', { count: 'exact', head: true })

    // Get total matches count
    const { count: totalMatches } = await supabaseAdmin
      .from('matches')
      .select('*', { count: 'exact', head: true })

    // Get active listings count
    const { count: activeListings } = await supabaseAdmin
      .from('listings')
      .select('*', { count: 'exact', head: true })
      .eq('active', true)

    // Get disputed matches count
    const { count: disputedMatches } = await supabaseAdmin
      .from('matches')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'DISPUTED')

    // Get completed matches count
    const { count: completedMatches } = await supabaseAdmin
      .from('matches')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'RELEASED')

    // Calculate total revenue (sum of completed matches)
    const { data: revenueData } = await supabaseAdmin
      .from('matches')
      .select('total_amount')
      .eq('status', 'RELEASED')

    const totalRevenue = revenueData?.reduce((sum, match) => sum + (match.total_amount || 0), 0) || 0

    // Get fraud flags count
    const { count: fraudFlags } = await supabaseAdmin
      .from('fraud_flags')
      .select('*', { count: 'exact', head: true })

    return NextResponse.json({
      stats: {
        totalUsers: totalUsers || 0,
        totalMatches: totalMatches || 0,
        activeListings: activeListings || 0,
        disputedMatches: disputedMatches || 0,
        completedMatches: completedMatches || 0,
        totalRevenue: totalRevenue / 100, // Convert from paise to rupees
        fraudFlags: fraudFlags || 0
      },
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('Admin stats error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
