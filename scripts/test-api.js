#!/usr/bin/env node

/**
 * BagSwap API Testing Script
 * Run with: node scripts/test-api.js
 */

const BASE_URL = 'http://localhost:3000'
const ADMIN_KEY = process.env.ADMIN_API_KEY || 'your-admin-key-here'

async function testAPI() {
  console.log('🧪 Testing BagSwap API endpoints...\n')

  // Test 1: Admin Stats
  console.log('1️⃣ Testing Admin Stats...')
  try {
    const response = await fetch(`${BASE_URL}/api/admin/stats`, {
      headers: {
        'x-admin-key': ADMIN_KEY
      }
    })
    const data = await response.json()
    
    if (response.ok) {
      console.log('✅ Admin stats working')
      console.log(`   Users: ${data.stats.totalUsers}`)
      console.log(`   Matches: ${data.stats.totalMatches}`)
      console.log(`   Revenue: ₹${data.stats.totalRevenue}`)
    } else {
      console.log('❌ Admin stats failed:', data.error)
    }
  } catch (error) {
    console.log('❌ Admin stats error:', error.message)
  }

  console.log()

  // Test 2: Listings (without auth - should work for public listings)
  console.log('2️⃣ Testing Listings...')
  try {
    const response = await fetch(`${BASE_URL}/api/listings`)
    const data = await response.json()
    
    if (response.ok) {
      console.log('✅ Listings endpoint working')
      console.log(`   Found ${data.listings?.length || 0} listings`)
    } else {
      console.log('❌ Listings failed:', data.error)
    }
  } catch (error) {
    console.log('❌ Listings error:', error.message)
  }

  console.log()

  // Test 3: Create Listing (will fail without auth, but tests endpoint)
  console.log('3️⃣ Testing Create Listing (expect auth error)...')
  try {
    const response = await fetch(`${BASE_URL}/api/listings`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        userId: 'test-user-id',
        flightNo: 'AI101',
        flightDate: '2024-12-25',
        airline: 'Air India',
        weightKg: 15,
        pricePerKg: 50000
      })
    })
    const data = await response.json()
    
    if (response.status === 404 && data.error === 'User not found') {
      console.log('✅ Create listing endpoint working (expected auth error)')
    } else {
      console.log('❓ Unexpected response:', data)
    }
  } catch (error) {
    console.log('❌ Create listing error:', error.message)
  }

  console.log()

  // Test 4: Database Connection (via admin stats)
  console.log('4️⃣ Testing Database Connection...')
  try {
    const response = await fetch(`${BASE_URL}/api/admin/stats`, {
      headers: {
        'x-admin-key': ADMIN_KEY
      }
    })
    
    if (response.ok) {
      console.log('✅ Database connection working')
    } else {
      console.log('❌ Database connection issues')
    }
  } catch (error) {
    console.log('❌ Database connection error:', error.message)
  }

  console.log('\n🏁 API testing complete!')
  console.log('\n📝 Next steps:')
  console.log('   1. Set up Supabase project and run migrations')
  console.log('   2. Configure environment variables')
  console.log('   3. Create test users via Supabase Auth')
  console.log('   4. Test full user flow with authentication')
}

// Run if called directly
if (require.main === module) {
  testAPI().catch(console.error)
}

module.exports = { testAPI }
