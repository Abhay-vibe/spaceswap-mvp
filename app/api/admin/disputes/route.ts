import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import StripeService from '@/lib/stripe-service'

// Force this route to be dynamic since it uses request headers for auth
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    // Simple admin auth check
    const adminKey = request.headers.get('x-admin-key')
    if (!adminKey || adminKey !== process.env.ADMIN_API_KEY) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get all disputed matches with details
    const { data: disputes, error } = await supabaseAdmin
      .from('matches')
      .select(`
        *,
        listing:listings(
          *,
          flight:flights(*),
          seller_data:auth.users(*)
        ),
        buyer_data:auth.users(*)
      `)
      .eq('status', 'DISPUTED')
      .order('created_at', { ascending: false })

    if (error) {
      return NextResponse.json(
        { error: 'Failed to fetch disputes' },
        { status: 500 }
      )
    }

    // Get associated dispute records
    const disputeIds = disputes?.map(d => d.id) || []
    const { data: disputeRecords } = await supabaseAdmin
      .from('disputes')
      .select('*')
      .in('match_id', disputeIds)

    // Combine data
    const disputesWithDetails = disputes?.map(dispute => {
      const disputeRecord = disputeRecords?.find(dr => dr.match_id === dispute.id)
      return {
        ...dispute,
        dispute_details: disputeRecord
      }
    })

    return NextResponse.json({
      disputes: disputesWithDetails
    })

  } catch (error) {
    console.error('Admin disputes fetch error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    // Simple admin auth check
    const adminKey = request.headers.get('x-admin-key')
    if (!adminKey || adminKey !== process.env.ADMIN_API_KEY) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { matchId, resolution, adminNotes } = body

    if (!matchId || !resolution) {
      return NextResponse.json(
        { error: 'matchId and resolution required' },
        { status: 400 }
      )
    }

    if (!['refund', 'release', 'partial'].includes(resolution)) {
      return NextResponse.json(
        { error: 'Invalid resolution. Must be: refund, release, or partial' },
        { status: 400 }
      )
    }

    // Get match details
    const { data: match, error: matchError } = await supabaseAdmin
      .from('matches')
      .select('*')
      .eq('id', matchId)
      .single()

    if (matchError || !match) {
      return NextResponse.json(
        { error: 'Match not found' },
        { status: 404 }
      )
    }

    let newStatus = 'RELEASED'
    let paymentAction = 'none'

    try {
      if (resolution === 'refund') {
        // Cancel/refund the PaymentIntent
        if (match.stripe_payment_intent) {
          await StripeService.cancelPaymentIntent(match.stripe_payment_intent)
          paymentAction = 'refunded'
        }
        newStatus = 'CANCELLED'
      } else if (resolution === 'release') {
        // Capture the PaymentIntent (release to seller)
        if (match.stripe_payment_intent) {
          await StripeService.capturePaymentIntent(match.stripe_payment_intent)
          paymentAction = 'released'
        }
        newStatus = 'RELEASED'
      }
      // For 'partial', would need custom Stripe logic - not implemented in MVP

      // Update match status
      const { data: updatedMatch, error: updateError } = await supabaseAdmin
        .from('matches')
        .update({ status: newStatus })
        .eq('id', matchId)
        .select('*')
        .single()

      if (updateError) {
        return NextResponse.json(
          { error: 'Failed to update match status' },
          { status: 500 }
        )
      }

      // Update dispute record
      await supabaseAdmin
        .from('disputes')
        .update({
          status: 'RESOLVED',
          resolution,
          admin_notes: adminNotes,
          resolved_at: new Date().toISOString()
        })
        .eq('match_id', matchId)

      return NextResponse.json({
        match: updatedMatch,
        resolution,
        paymentAction,
        message: `Dispute resolved: ${resolution}`
      })

    } catch (stripeError) {
      console.error('Stripe error during dispute resolution:', stripeError)
      return NextResponse.json(
        { error: 'Payment processing failed during dispute resolution' },
        { status: 500 }
      )
    }

  } catch (error) {
    console.error('Admin dispute resolution error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
