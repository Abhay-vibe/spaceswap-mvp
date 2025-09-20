"use client"

import { useAuth } from "@/components/auth-provider"
import { LoginForm } from "@/components/login-form"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { DashboardCard, ListingCard, RequestCard, AvailableListingCard } from "@/components/dashboard-card"
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
              <Card className="shadow-sm hover:shadow-md transition-shadow cursor-pointer">
                <CardHeader className="text-center pb-3">
                  <Package className="w-10 h-10 mx-auto text-blue-600 mb-2" />
                  <CardTitle className="text-lg">Share Space 🎒</CardTitle>
              </CardHeader>
                <CardContent className="pt-0">
                  <CardDescription className="text-center text-sm">
                  Got extra baggage allowance? List it and earn money helping other travelers.
                </CardDescription>
              </CardContent>
            </Card>
            </Link>

            <Link href="/buyer">
              <Card className="shadow-sm hover:shadow-md transition-shadow cursor-pointer">
                <CardHeader className="text-center pb-3">
                  <Users className="w-10 h-10 mx-auto text-green-600 mb-2" />
                  <CardTitle className="text-lg">Find Space 🔍</CardTitle>
              </CardHeader>
                <CardContent className="pt-0">
                  <CardDescription className="text-center text-sm">
                  Need extra baggage space? Find travelers on your flight willing to share.
                </CardDescription>
              </CardContent>
            </Card>
            </Link>

            <Card className="shadow-sm sm:col-span-2 lg:col-span-1">
              <CardHeader className="text-center pb-3">
                <Shield className="w-10 h-10 mx-auto text-purple-600 mb-2" />
                <CardTitle className="text-lg">Secure Payment 💸</CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <CardDescription className="text-center text-sm">
                  No upfront payment required. Pay directly to space providers after confirmation.
                </CardDescription>
              </CardContent>
            </Card>
          </div>

          <div className="max-w-md mx-auto space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <Link href="/seller">
                <Button className="w-full h-12">
                  <Package className="w-4 h-4 mr-2" />
                  List Your Space
                </Button>
              </Link>
              <Link href="/buyer">
                <Button variant="outline" className="w-full h-12">
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

      <main className="container mx-auto px-4 py-6 max-w-md">
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-4">
                  <div className="h-4 bg-gray-200 rounded mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
        {!loading && (
          <div className="space-y-6">
            {/* Your Listings Card */}
            <DashboardCard 
              title="Your Listings ✈️" 
              description="Manage your baggage space offerings"
              icon={<Package className="w-5 h-5 text-blue-600" />}
            >
              {listings.length > 0 ? (
                <div className="space-y-3">
                  {listings.slice(0, 2).map((listing) => (
                    <ListingCard
                      key={listing.id}
                      listing={listing}
                      pendingRequests={Math.floor(Math.random() * 3)}
                      isVerified={true}
                      trustScore={4.8}
                      onViewRequests={() => {
                        window.location.href = '/matches'
                      }}
                      onEditListing={() => {
                        // Store listing data in sessionStorage for editing
                        if (listing.flight) {
                          sessionStorage.setItem('editListing', JSON.stringify({
                            id: listing.id,
                            flightNo: listing.flight.flightNo,
                            flightDate: listing.flight.date.toISOString().split('T')[0],
                            airline: listing.flight.airline || '',
                            weightKg: listing.weightKg.toString(),
                            pricePerKg: (listing.pricePerKg / 100).toString(),
                            autoAccept: listing.autoAccept
                          }))
                        }
                        window.location.href = '/seller'
                      }}
                    />
                  ))}
                  {listings.length > 2 && (
                    <Button variant="ghost" size="sm" className="w-full text-xs">
                      View all {listings.length} listings
                    </Button>
                  )}
                </div>
              ) : (
                <div className="text-center py-4">
                  <Package className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
                  <p className="text-sm text-muted-foreground mb-3">No listings yet</p>
                  <Link href="/seller">
                    <Button size="sm" className="w-full">
                      <Plus className="w-4 h-4 mr-1" />
                      Create First Listing
                    </Button>
                  </Link>
                </div>
              )}
            </DashboardCard>

            {/* Requests to You Card */}
            <DashboardCard
              title="Requests 🎒"
              description="Incoming booking requests"
              icon={<Users className="w-5 h-5 text-green-600" />}
            >
              {requests.length > 0 ? (
                <div className="space-y-3">
                  {requests.slice(0, 2).map((request) => (
                    <RequestCard
                      key={request.id}
                      buyerName="John Traveler"
                      flight={{
                        flightNo: "AA123",
                        date: new Date("2024-12-25")
                      }}
                      requestedKg={request.quantityKg}
                      offeredPrice={request.totalCents}
                      timeAgo="2h ago"
                      isVerified={true}
                      onAccept={() => {}}
                      onDecline={() => {}}
                    />
                  ))}
                </div>
              ) : (
                <div className="text-center py-4">
                  <Users className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
                  <p className="text-sm text-muted-foreground">No pending requests</p>
                </div>
              )}
            </DashboardCard>

            {/* Available on Your Flights Card */}
            <DashboardCard
              title="Available on Your Flights 🔍"
              description="Find space on your upcoming trips"
              icon={<Plane className="w-5 h-5 text-purple-600" />}
            >
              {availableOnFlights.length > 0 ? (
                <div className="space-y-3">
                  {availableOnFlights.slice(0, 2).map((listing) => (
                    <AvailableListingCard
                      key={listing.id}
                      flight={listing.flight || {
                        flightNo: "TBD",
                        date: new Date(),
                        airline: "TBD"
                      }}
                      sellerName="Space Provider"
                      weightKg={listing.weightKg}
                      pricePerKg={listing.pricePerKg}
                      isVerified={true}
                      trustScore={4.9}
                      matchHistory={12}
                      onBook={() => {
                        window.location.href = `/match/${listing.id}`
                      }}
                    />
                  ))}
                </div>
              ) : (
                <div className="text-center py-4">
                  <Plane className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
                  <p className="text-sm text-muted-foreground mb-3">No available space on your flights</p>
                  <Link href="/buyer">
                    <Button size="sm" variant="outline" className="w-full">
                      Browse All Listings
                    </Button>
                  </Link>
                </div>
              )}
            </DashboardCard>

            {/* Quick Actions */}
            <div className="grid grid-cols-2 gap-3 pt-2">
              <Link href="/seller">
                <Button className="w-full h-12 text-sm">
                  <Plus className="w-4 h-4 mr-1" />
                  List Space
                </Button>
              </Link>
              <Link href="/buyer">
                <Button variant="outline" className="w-full h-12 text-sm">
                  <Package className="w-4 h-4 mr-1" />
                  Find Space
                </Button>
              </Link>
            </div>

            {/* Bottom Navigation Hint */}
            <div className="text-center pt-4 pb-8">
              <Link href="/matches" className="text-xs text-muted-foreground hover:text-foreground">
                View all bookings & matches →
              </Link>
            </div>
        </div>
        )}
      </main>
    </div>
  )
}
