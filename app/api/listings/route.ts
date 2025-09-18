import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import FraudService from '@/lib/fraud-service'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { 
      userId,
      flightNo, 
      flightDate, 
      airline, 
      weightKg, 
      pricePerKg, 
      autoAccept = false 
    } = body

    if (!userId || !flightNo || !flightDate || !weightKg || !pricePerKg) {
      return NextResponse.json(
        { error: 'Missing required fields' },
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

    // Check if user can auto-accept (fraud prevention)
    const canUserAutoAccept = FraudService.canAutoAccept(user)
    const finalAutoAccept = autoAccept && canUserAutoAccept

    if (autoAccept && !canUserAutoAccept) {
      console.log('User requested auto-accept but does not meet requirements. Defaulting to manual.')
    }

    // Create or find flight
    let flight
    const { data: existingFlight, error: flightFindError } = await supabaseAdmin
      .from('flights')
      .select('*')
      .eq('flight_no', flightNo.toUpperCase())
      .eq('flight_date', flightDate)
      .single()

    if (existingFlight) {
      flight = existingFlight
    } else {
      const { data: newFlight, error: flightCreateError } = await supabaseAdmin
        .from('flights')
        .insert({
          airline: airline || null,
          flight_no: flightNo.toUpperCase(),
          flight_date: flightDate
        })
        .select('*')
        .single()

      if (flightCreateError) {
        return NextResponse.json(
          { error: 'Failed to create flight record' },
          { status: 500 }
        )
      }
      flight = newFlight
    }

    // Create listing
    const { data: listing, error: listingError } = await supabaseAdmin
      .from('listings')
      .insert({
        seller: userId,
        flight_id: flight.id,
        weight_kg: parseInt(weightKg),
        price_per_kg: parseInt(pricePerKg),
        auto_accept: finalAutoAccept,
        active: true
      })
      .select(`
        *,
        flight:flights(*),
        seller_data:auth.users(*)
      `)
      .single()

    if (listingError) {
      return NextResponse.json(
        { error: 'Failed to create listing' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      listing,
      autoAcceptAdjusted: autoAccept !== finalAutoAccept,
      userTrustScore: FraudService.calculateTrustScore(user)
    })

  } catch (error) {
    console.error('Listing creation error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const flightNo = searchParams.get('flightNo')
    const flightDate = searchParams.get('flightDate')
    const userId = searchParams.get('userId')
    const sellerId = searchParams.get('sellerId')

    let query = supabaseAdmin
      .from('listings')
      .select(`
        *,
        flight:flights(*),
        seller_data:auth.users(id, full_name, verified, trust_score, match_history_count)
      `)
      .eq('active', true)

    // Filter by flight if specified
    if (flightNo && flightDate) {
      const { data: flight } = await supabaseAdmin
        .from('flights')
        .select('id')
        .eq('flight_no', flightNo.toUpperCase())
        .eq('flight_date', flightDate)
        .single()

      if (flight) {
        query = query.eq('flight_id', flight.id)
      } else {
        // No flight found, return empty results
        return NextResponse.json({ listings: [] })
      }
    }

    // Filter by seller if specified
    if (sellerId) {
      query = query.eq('seller', sellerId)
    }

    const { data: listings, error } = await query.order('created_at', { ascending: false })

    if (error) {
      return NextResponse.json(
        { error: 'Failed to fetch listings' },
        { status: 500 }
      )
    }

    // Mask seller contact info if userId is not the seller
    const processedListings = listings.map(listing => {
      if (listing.seller !== userId) {
        listing.seller_data = FraudService.maskContactInfo(listing.seller_data)
      }
      return listing
    })

    return NextResponse.json({ listings: processedListings })

  } catch (error) {
    console.error('Listings fetch error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
