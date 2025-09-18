import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin, Match } from '@/lib/supabase'
import StripeService from '@/lib/stripe-service'
import FraudService from '@/lib/fraud-service'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { listingId, quantityKg, userId } = body

    if (!listingId || !quantityKg || !userId) {
      return NextResponse.json(
        { error: 'Missing required fields: listingId, quantityKg, userId' },
        { status: 400 }
      )
    }

    // Get user data for fraud checks
    const { data: user, error: userError } = await supabaseAdmin
      .from('auth.users')
      .select('*')
      .eq('id', userId)
      .single()

    if (userError || !user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Perform fraud check
    const fraudCheck = await FraudService.performFraudCheck(user, 'buy')
    
    if (!fraudCheck.allowed) {
      return NextResponse.json(
        { 
          error: 'Match creation not allowed',
          reason: 'FRAUD_CHECK_FAILED',
          flags: fraudCheck.flags,
          requiresManualReview: fraudCheck.requiresManualReview
        },
        { status: 403 }
      )
    }

    // Get listing details
    const { data: listing, error: listingError } = await supabaseAdmin
      .from('listings')
      .select(`
        *,
        flight:flights(*),
        seller_data:auth.users(*)
      `)
      .eq('id', listingId)
      .eq('active', true)
      .single()

    if (listingError || !listing) {
      return NextResponse.json(
        { error: 'Listing not found or inactive' },
        { status: 404 }
      )
    }

    // Check if seller is different from buyer
    if (listing.seller === userId) {
      return NextResponse.json(
        { error: 'Cannot book your own listing' },
        { status: 400 }
      )
    }

    // Check if enough weight is available
    if (quantityKg > listing.weight_kg) {
      return NextResponse.json(
        { error: 'Requested weight exceeds available capacity' },
        { status: 400 }
      )
    }

    // Calculate total amount
    const totalAmount = listing.price_per_kg * quantityKg

    // Create Stripe PaymentIntent
    const paymentIntent = await StripeService.createPaymentIntent({
      amount: totalAmount,
      currency: 'inr',
      matchId: 'temp', // Will update after match creation
      buyerId: userId,
      sellerId: listing.seller
    })

    // Create match record
    const { data: match, error: matchError } = await supabaseAdmin
      .from('matches')
      .insert({
        listing_id: listingId,
        buyer: userId,
        quantity_kg: quantityKg,
        total_amount: totalAmount,
        stripe_payment_intent: paymentIntent.id,
        status: 'PENDING'
      })
      .select(`
        *,
        listing:listings(*),
        buyer_data:auth.users(*)
      `)
      .single()

    if (matchError) {
      // Cancel the PaymentIntent if match creation failed
      await StripeService.cancelPaymentIntent(paymentIntent.id)
      
      return NextResponse.json(
        { error: 'Failed to create match', details: matchError.message },
        { status: 500 }
      )
    }

    // Update PaymentIntent metadata with actual match ID
    await StripeService.createPaymentIntent({
      amount: totalAmount,
      currency: 'inr',
      matchId: match.id,
      buyerId: userId,
      sellerId: listing.seller
    })

    // Return match details with payment client secret
    return NextResponse.json({
      match,
      paymentClientSecret: paymentIntent.client_secret,
      fraudCheck: {
        trustScore: fraudCheck.trustScore,
        flags: fraudCheck.flags
      }
    })

  } catch (error) {
    console.error('Match creation error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const type = searchParams.get('type') // 'buyer' or 'seller'

    if (!userId) {
      return NextResponse.json(
        { error: 'userId parameter required' },
        { status: 400 }
      )
    }

    let query = supabaseAdmin
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

    if (type === 'buyer') {
      query = query.eq('buyer', userId)
    } else if (type === 'seller') {
      // Get matches for listings owned by this seller
      query = query.eq('listing.seller', userId)
    } else {
      // Get all matches where user is buyer or seller
      query = query.or(`buyer.eq.${userId},listing.seller.eq.${userId}`)
    }

    const { data: matches, error } = await query.order('created_at', { ascending: false })

    if (error) {
      return NextResponse.json(
        { error: 'Failed to fetch matches' },
        { status: 500 }
      )
    }

    return NextResponse.json({ matches })

  } catch (error) {
    console.error('Matches fetch error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
