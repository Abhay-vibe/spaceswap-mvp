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
    const { userId } = body
    const { matchId } = params

    if (!userId) {
      return NextResponse.json(
        { error: 'userId required' },
        { status: 400 }
      )
    }

    // Get match with listing details
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

    // Verify user is the seller
    if (match.listing.seller !== userId) {
      return NextResponse.json(
        { error: 'Only the seller can accept this match' },
        { status: 403 }
      )
    }

    // Check if match is in PENDING status
    if (match.status !== 'PENDING') {
      return NextResponse.json(
        { error: `Match cannot be accepted. Current status: ${match.status}` },
        { status: 400 }
      )
    }

    // Get seller data for fraud checks
    const { data: seller, error: sellerError } = await supabaseAdmin
      .from('auth.users')
      .select('*')
      .eq('id', userId)
      .single()

    if (sellerError || !seller) {
      return NextResponse.json(
        { error: 'Seller not found' },
        { status: 404 }
      )
    }

    // Check if seller can auto-accept or needs manual review
    const canAutoAccept = FraudService.canAutoAccept(seller)
    
    if (!canAutoAccept && !match.listing.auto_accept) {
      // For MVP, we'll allow manual acceptance regardless
      console.log('Manual acceptance by seller with limited history')
    }

    // Update match status to ACCEPTED
    const { data: updatedMatch, error: updateError } = await supabaseAdmin
      .from('matches')
      .update({ status: 'ACCEPTED' })
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
        { error: 'Failed to accept match' },
        { status: 500 }
      )
    }

    // Return full contact info for both parties
    const sellerContact = {
      id: seller.id,
      full_name: seller.full_name,
      email: seller.email,
      phone: seller.phone,
      verified: seller.verified,
      trust_score: seller.trust_score,
      match_history_count: seller.match_history_count
    }

    const buyerContact = {
      id: match.buyer_data.id,
      full_name: match.buyer_data.full_name,
      email: match.buyer_data.email,
      phone: match.buyer_data.phone,
      verified: match.buyer_data.verified,
      trust_score: match.buyer_data.trust_score,
      match_history_count: match.buyer_data.match_history_count
    }

    return NextResponse.json({
      match: updatedMatch,
      contacts: {
        seller: sellerContact,
        buyer: buyerContact
      },
      message: 'Match accepted successfully. Contact information revealed.'
    })

  } catch (error) {
    console.error('Match acceptance error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
