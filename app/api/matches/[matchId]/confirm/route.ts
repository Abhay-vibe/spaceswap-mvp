import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import FraudService from '@/lib/fraud-service'

interface RouteParams {
  params: {
    matchId: string
  }
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const body = await request.json()
    const { userId, confirmationType = 'both' } = body // 'both', 'seller', 'buyer'
    const { matchId } = params

    if (!userId) {
      return NextResponse.json(
        { error: 'userId required' },
        { status: 400 }
      )
    }

    // Get match with all related data
    const { data: match, error: matchError } = await supabaseAdmin
      .from('matches')
      .select(`
        *,
        listing:listings(
          *,
          seller_data:auth.users(*),
          flight:flights(*)
        ),
        buyer_data:auth.users(*)
      `)
      .eq('id', matchId)
      .single()

    if (matchError || !match) {
      return NextResponse.json(
        { error: 'Match not found' },
        { status: 404 }
      )
    }

    // Check if match is in ACCEPTED status
    if (match.status !== 'ACCEPTED') {
      return NextResponse.json(
        { error: `Match cannot be confirmed. Current status: ${match.status}` },
        { status: 400 }
      )
    }

    // Verify user is part of this match
    const isSeller = match.listing.seller === userId
    const isBuyer = match.buyer === userId

    if (!isSeller && !isBuyer) {
      return NextResponse.json(
        { error: 'Only match participants can confirm' },
        { status: 403 }
      )
    }

    // For MVP, we'll allow either party to confirm (simulating both parties confirming)
    // In production, you might want to track separate confirmations
    
    try {
      // Update match status to RELEASED (no payment processing needed)
      const { data: updatedMatch, error: updateError } = await supabaseAdmin
        .from('matches')
        .update({ status: 'RELEASED' })
        .eq('id', matchId)
        .select(`
          *,
          listing:listings(
            *,
            seller_data:auth.users(*),
            flight:flights(*)
          ),
          buyer_data:auth.users(*)
        `)
        .single()

      if (updateError) {
        return NextResponse.json(
          { error: 'Failed to update match status' },
          { status: 500 }
        )
      }

      // Update user metrics (increment match history for both users)
      await Promise.all([
        FraudService.updateUserMetrics(match.listing.seller, true, false),
        FraudService.updateUserMetrics(match.buyer, true, false)
      ])

      // Optionally update flight count if this was their first flight
      if (match.buyer_data.past_flights_count === 0) {
        FraudService.updateUserMetrics(match.buyer, false, true)
      }

      return NextResponse.json({
        match: updatedMatch,
        payment: {
          status: 'confirmed',
          amount: match.total_amount
        },
        message: 'Match confirmed successfully. Payment will be handled at the airport.'
      })

    } catch (error) {
      console.error('Match confirmation error:', error)
      
      // If confirmation fails, set status to DISPUTED
      await supabaseAdmin
        .from('matches')
        .update({ status: 'DISPUTED' })
        .eq('id', matchId)

      return NextResponse.json(
        { error: 'Match confirmation failed. Marked for manual review.' },
        { status: 500 }
      )
    }

  } catch (error) {
    console.error('Match confirmation error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
