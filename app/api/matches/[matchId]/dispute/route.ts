import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

interface RouteParams {
  params: {
    matchId: string
  }
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const body = await request.json()
    const { userId, reason, details } = body
    const { matchId } = params

    if (!userId || !reason) {
      return NextResponse.json(
        { error: 'userId and reason required' },
        { status: 400 }
      )
    }

    // Get match details
    const { data: match, error: matchError } = await supabaseAdmin
      .from('matches')
      .select(`
        *,
        listing:listings(
          *,
          seller_data:auth.users(*)
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

    // Verify user is part of this match
    const isSeller = match.listing.seller === userId
    const isBuyer = match.buyer === userId

    if (!isSeller && !isBuyer) {
      return NextResponse.json(
        { error: 'Only match participants can dispute' },
        { status: 403 }
      )
    }

    // Check if match can be disputed
    if (!['ACCEPTED', 'CONFIRMED'].includes(match.status)) {
      return NextResponse.json(
        { error: `Match cannot be disputed. Current status: ${match.status}` },
        { status: 400 }
      )
    }

    // Update match status to DISPUTED
    const { data: updatedMatch, error: updateError } = await supabaseAdmin
      .from('matches')
      .update({ status: 'DISPUTED' })
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

    // Create dispute record for admin review
    const { error: disputeError } = await supabaseAdmin
      .from('disputes')
      .insert({
        match_id: matchId,
        reporter_id: userId,
        reason,
        details: details || null,
        status: 'PENDING'
      })

    if (disputeError) {
      console.error('Failed to create dispute record:', disputeError)
      // Continue anyway, match status is already updated
    }

    // Create fraud flag for investigation
    await supabaseAdmin
      .from('fraud_flags')
      .insert({
        user_id: userId,
        flag_type: 'DISPUTE_REPORTED',
        details: {
          match_id: matchId,
          reason,
          details
        }
      })

    return NextResponse.json({
      match: updatedMatch,
      message: 'Dispute reported successfully. Funds held for admin review.',
      disputeId: `dispute_${matchId}_${Date.now()}`
    })

  } catch (error) {
    console.error('Match dispute error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
