"use client"

import { useAuth } from "@/components/auth-provider"
import { LoginForm } from "@/components/login-form"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { DashboardCard, ListingCard, RequestCard, AvailableListingCard } from "@/components/dashboard-card"
import { ConfigDiagnostic } from "@/components/config-diagnostic"
import { Plane, Package, Shield, Users, Plus, Search } from "lucide-react"
import Link from "next/link"
import { useEffect, useState } from "react"
import SupabaseService from "@/lib/supabase-service"
import type { Listing, Match, User as UserType } from "@/lib/types"
import { MatchStatus } from "@/lib/types"

export default function HomePage() {
  const { user, logout } = useAuth()
  const [listings, setListings] = useState<(Listing & { flight?: any })[]>([])
  const [requests, setRequests] = useState<Match[]>([])
  const [availableOnFlights, setAvailableOnFlights] = useState<(Listing & { flight?: any })[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user) {
      console.log('Loading dashboard data for user:', user.name || user.email)
      loadDashboardData()
    }
  }, [user])

  const loadDashboardData = async () => {
    try {
      // Ensure demo data exists
      await SupabaseService.seedData()
      
      // Load user's listings with flight data
      const userListings = await SupabaseService.getListingsByUser(user!.id) || []
      console.log('User listings:', userListings)
      const listingsWithFlights = await Promise.all(
        userListings.map(async (listing) => {
          const flight = await SupabaseService.getFlightById(listing.flightId)
          return { ...listing, flight }
        })
      )
      setListings(listingsWithFlights)

      // Load incoming requests (for seller)
      const incomingRequests = await SupabaseService.getRequestsForUser(user!.id) || []
      console.log('Incoming requests:', incomingRequests)
      setRequests(incomingRequests)

      // Load available listings on user's flights (for buyer) with flight data
      const availableListings = await SupabaseService.getAvailableListingsForUser(user!.id) || []
      console.log('Available listings:', availableListings)
      const availableWithFlights = await Promise.all(
        availableListings.map(async (listing) => {
          const flight = await SupabaseService.getFlightById(listing.flightId)
          return { ...listing, flight }
        })
      )
      setAvailableOnFlights(availableWithFlights)
    } catch (error) {
      console.error('Failed to load dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  // Show login form if user is not authenticated
  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
        <div className="container mx-auto px-4 py-8 sm:py-16">
          {/* Hero Section */}
          <div className="text-center mb-8 sm:mb-12">
            <div className="mb-6">
              <img 
                src="https://images.unsplash.com/photo-1436491865332-7a61a109cc05?w=400&h=200&fit=crop&crop=center" 
                alt="Airplane flying over clouds"
                className="w-full max-w-md mx-auto rounded-2xl shadow-lg"
              />
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-4">
              SpaceSwap ✈️
            </h1>
            <p className="text-lg sm:text-xl text-gray-600 dark:text-gray-300 mb-8">
              Share baggage space, save money, help fellow travelers
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 mb-8 sm:mb-12">
            <Link href="/seller">
              <Card className="cursor-pointer hover:shadow-lg transition-shadow">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Package className="w-5 h-5 text-blue-600" />
                    Share Space
                  </CardTitle>
                  <CardDescription>
                    List your extra baggage allowance
                  </CardDescription>
                </CardHeader>
              </Card>
            </Link>

            <Link href="/buyer">
              <Card className="cursor-pointer hover:shadow-lg transition-shadow">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Search className="w-5 h-5 text-green-600" />
                    Find Space
                  </CardTitle>
                  <CardDescription>
                    Book baggage space for your items
                  </CardDescription>
                </CardHeader>
              </Card>
            </Link>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Shield className="w-5 h-5 text-purple-600" />
                  Secure Payment
                </CardTitle>
                <CardDescription>
                  Pay only after confirmation - no upfront payment required
                </CardDescription>
              </CardHeader>
            </Card>
          </div>

          <div className="max-w-md mx-auto">
            <LoginForm />
          </div>

          {/* Configuration Diagnostic - Temporary for debugging */}
          <div className="mt-8 max-w-4xl mx-auto">
            <ConfigDiagnostic />
          </div>

          <div className="mt-8 sm:mt-12 text-center">
            <div className="flex justify-center gap-4 sm:gap-8 mb-6">
              <Link href="/seller">
                <Button size="lg" className="bg-blue-600 hover:bg-blue-700">
                  <Plus className="w-4 h-4 mr-2" />
                  Share Space
                </Button>
              </Link>
              <Link href="/buyer">
                <Button size="lg" variant="outline">
                  <Search className="w-4 h-4 mr-2" />
                  Find Space
                </Button>
              </Link>
            </div>
            <p className="text-center text-sm text-muted-foreground">
              Join thousands of travelers sharing baggage space 🌍
            </p>
          </div>
        </div>
      </div>
    )
  }

  // Main dashboard for authenticated users
  return (
    <div className="min-h-screen bg-background">
      {/* Mobile-First Header */}
      <header className="border-b bg-white">
        <div className="container mx-auto px-4 py-3">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <Plane className="w-6 h-6 text-blue-600" />
              <h1 className="text-lg font-bold">SpaceSwap</h1>
            </div>
            <div className="flex items-center gap-2">
              <div className="hidden sm:flex items-center gap-1">
                <Shield className="w-4 h-4 text-green-600" />
                <span className="text-xs text-muted-foreground">Verified</span>
              </div>
              <Button variant="ghost" size="sm" onClick={logout} className="text-xs">
                Sign out
              </Button>
            </div>
          </div>
          <div className="mt-2">
            <p className="text-xs text-muted-foreground">
              Welcome back, {user.name || user.email.split('@')[0]} 👋
            </p>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 max-w-4xl">
        {loading ? (
          <div className="space-y-6">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-6">
                  <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2 mb-4"></div>
                  <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="space-y-6">
            {/* Your Listings Card */}
            <DashboardCard 
              title="Your Listings ✈️" 
              description="Manage your baggage space offerings"
              isEmpty={listings.length === 0}
              emptyMessage="No listings yet"
              emptyAction={
                <Link href="/seller">
                  <Button className="w-full">
                    <Plus className="w-4 h-4 mr-2" />
                    Create First Listing
                  </Button>
                </Link>
              }
            >
              {listings.length > 0 && (
                <div className="space-y-3">
                  {listings.slice(0, 2).map((listing) => (
                    <ListingCard
                      key={listing.id}
                      listing={listing}
                      pendingRequests={requests.filter(r => r.listingId === listing.id).length}
                      isVerified={true}
                      trustScore={85}
                      onViewRequests={() => {
                        if (typeof window !== 'undefined') {
                          window.location.href = '/matches'
                        }
                      }}
                      onEditListing={() => {
                        if (typeof window !== 'undefined') {
                          sessionStorage.setItem('editListing', JSON.stringify({
                            id: listing.id,
                            flightNo: listing.flight?.flightNo || '',
                            flightDate: listing.flight?.date ? new Date(listing.flight.date).toISOString().split('T')[0] : '',
                            airline: listing.flight?.airline || '',
                            weightKg: listing.weightKg.toString(),
                            pricePerKg: (listing.pricePerKg / 100).toString(),
                            autoAccept: listing.autoAccept
                          }))
                          window.location.href = '/seller'
                        }
                      }}
                    />
                  ))}
                  {listings.length > 2 && (
                    <div className="text-center pt-2">
                      <Link href="/seller">
                        <Button variant="outline" size="sm">
                          View All {listings.length} Listings
                        </Button>
                      </Link>
                    </div>
                  )}
                </div>
              )}
            </DashboardCard>

            {/* Requests to You Card */}
            <DashboardCard 
              title="Requests 🔔" 
              description="Incoming booking requests"
              isEmpty={requests.length === 0}
              emptyMessage="No pending requests"
            >
              {requests.length > 0 && (
                <div className="space-y-3">
                  {requests.slice(0, 2).map((request) => (
                    <RequestCard
                      key={request.id}
                      request={request}
                      onAccept={() => {
                        if (typeof window !== 'undefined') {
                          window.location.href = `/matches/${request.id}`
                        }
                      }}
                      onDecline={() => {
                        // Handle decline logic
                      }}
                    />
                  ))}
                </div>
              )}
            </DashboardCard>

            {/* Available on Your Flights Card */}
            <DashboardCard 
              title="Available on Your Flights 🔍" 
              description="Find space on your upcoming trips"
              isEmpty={availableOnFlights.length === 0}
              emptyMessage="No available listings on your flights"
            >
              {availableOnFlights.length > 0 && (
                <div className="space-y-3">
                  {availableOnFlights.slice(0, 2).map((listing) => (
                    <AvailableListingCard
                      key={listing.id}
                      listing={listing}
                      onBook={() => {
                        if (typeof window !== 'undefined') {
                          window.location.href = `/match/${listing.id}`
                        }
                      }}
                      onViewDetails={() => {
                        if (typeof window !== 'undefined') {
                          window.location.href = `/match/${listing.id}`
                        }
                      }}
                    />
                  ))}
                </div>
              )}
            </DashboardCard>

            {/* Quick Actions */}
            <div className="flex gap-4 pt-4">
              <Link href="/seller" className="flex-1">
                <Button className="w-full" size="lg">
                  <Plus className="w-4 h-4 mr-2" />
                  List Space
                </Button>
              </Link>
              <Link href="/buyer" className="flex-1">
                <Button variant="outline" className="w-full" size="lg">
                  <Search className="w-4 h-4 mr-2" />
                  Find Space
                </Button>
              </Link>
            </div>

            {/* Bottom Navigation Hint */}
            <div className="text-center pt-6 pb-4">
              <p className="text-xs text-muted-foreground">
                💡 Tip: Create listings for upcoming flights to earn extra money
              </p>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}