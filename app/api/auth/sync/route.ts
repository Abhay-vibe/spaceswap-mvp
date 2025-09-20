import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { user } = body

    if (!user?.id || !user?.email) {
      return NextResponse.json(
        { error: 'Missing user data' },
        { status: 400 }
      )
    }

    console.log('[Auth Sync] Processing user:', user.id, user.email)

    // Check for existing profile with same email but different ID (duplicate detection)
    const { data: existingProfile, error: checkError } = await supabaseAdmin
      .from('profiles')
      .select('id, email')
      .eq('email', user.email.toLowerCase())
      .neq('id', user.id)
      .single()

    if (checkError && checkError.code !== 'PGRST116') {
      console.error('[Auth Sync] Error checking for duplicates:', checkError)
      return NextResponse.json(
        { error: 'Failed to check for existing accounts' },
        { status: 500 }
      )
    }

    if (existingProfile) {
      console.warn('[Auth Sync] Duplicate email detected:', user.email, 'existing ID:', existingProfile.id, 'new ID:', user.id)
      return NextResponse.json(
        { 
          error: 'An account with this email already exists. Please sign in with your original provider or contact support.',
          code: 'DUPLICATE_EMAIL',
          existingAccountId: existingProfile.id
        },
        { status: 409 }
      )
    }

    // Extract profile data from user metadata
    const profileData = {
      id: user.id,
      email: user.email.toLowerCase(),
      full_name: user.user_metadata?.full_name || 
                 user.user_metadata?.name || 
                 user.user_metadata?.display_name ||
                 null,
      avatar_url: user.user_metadata?.avatar_url || 
                  user.user_metadata?.picture ||
                  null,
      phone: user.user_metadata?.phone || null,
      verified: user.email_confirmed_at ? true : false,
      match_history_count: 0,
      past_flights_count: 0,
      trust_score: 0
    }

    console.log('[Auth Sync] Upserting profile data:', profileData)

    // Upsert profile data
    const { data: profile, error: upsertError } = await supabaseAdmin
      .from('profiles')
      .upsert(profileData, { 
        onConflict: 'id',
        ignoreDuplicates: false
      })
      .select('*')
      .single()

    if (upsertError) {
      console.error('[Auth Sync] Profile upsert error:', upsertError)
      
      // Log error to database if possible
      try {
        await supabaseAdmin
          .from('logs')
          .insert({
            level: 'error',
            message: `Profile sync failed for user ${user.id}: ${upsertError.message}`,
            payload: { userId: user.id, error: upsertError }
          })
      } catch (logError) {
        console.error('[Auth Sync] Failed to log error:', logError)
      }

      return NextResponse.json(
        { error: 'Failed to sync profile data', details: upsertError.message },
        { status: 500 }
      )
    }

    console.log('[Auth Sync] Profile synced successfully:', profile.id)

    // Log successful sync
    try {
      await supabaseAdmin
        .from('logs')
        .insert({
          level: 'info',
          message: `User profile synced successfully: ${user.id}`,
          payload: { userId: user.id, email: user.email, provider: user.app_metadata?.provider }
        })
    } catch (logError) {
      console.error('[Auth Sync] Failed to log success:', logError)
    }

    return NextResponse.json({
      success: true,
      profile,
      message: 'Profile synced successfully'
    })

  } catch (error) {
    console.error('[Auth Sync] Unhandled error:', error)
    
    // Log unhandled error
    try {
      await supabaseAdmin
        .from('logs')
        .insert({
          level: 'error',
          message: `Auth sync unhandled error: ${error instanceof Error ? error.message : 'Unknown error'}`,
          payload: { error: error instanceof Error ? error.stack : error }
        })
    } catch (logError) {
      console.error('[Auth Sync] Failed to log unhandled error:', logError)
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
