"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/components/auth-provider"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ArrowLeft, Package, Clock, CheckCircle, XCircle, Users, Plane, Phone, Mail, User } from "lucide-react"
import Link from "next/link"
import { mockDb } from "@/lib/mock-db"
import type { Match, Listing, Flight } from "@/lib/types"
import { MatchStatus } from "@/lib/types"
import { formatCurrency } from "@/lib/currency"

interface EnrichedMatch extends Match {
  listing?: Listing & { flight?: Flight }
  buyer?: any
  seller?: any
}

export default function MatchesPage() {
  const { user } = useAuth()
  const [incomingRequests, setIncomingRequests] = useState<EnrichedMatch[]>([])
  const [myBookings, setMyBookings] = useState<EnrichedMatch[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadMatches = async () => {
      if (!user) return

      try {
        // Load incoming requests (where user is the seller)
        const requests = await mockDb.getRequestsForUser(user.id)
        const enrichedRequests = await Promise.all(
          requests.map(async (match) => {
            const listing = await mockDb.getListingById(match.listingId)
            let enrichedListing = listing
            if (listing) {
              const flight = await mockDb.getFlightById(listing.flightId)
              enrichedListing = { ...listing, flight }
            }
            // Get actual buyer data
            const buyerData = await mockDb.getUserById(match.buyerId)
            return {
              ...match,
              listing: enrichedListing,
              buyer: buyerData || { name: "Traveler", phone: "+91-9876543210", email: "traveler@example.com" }
            }
          })
        )
        setIncomingRequests(enrichedRequests)

        // Load user's bookings (where user is the buyer)
        const userMatches = await mockDb.getMatchesByUser(user.id)
        const enrichedBookings = await Promise.all(
          userMatches.map(async (match) => {
            const listing = await mockDb.getListingById(match.listingId)
            let enrichedListing = listing
            if (listing) {
              const flight = await mockDb.getFlightById(listing.flightId)
              enrichedListing = { ...listing, flight }
            }
            // Get actual seller data
            const sellerData = listing ? await mockDb.getUserById(listing.sellerId) : null
            return {
              ...match,
              listing: enrichedListing,
              seller: sellerData || { name: "Space Provider", phone: "+91-9876543211", email: "provider@example.com" }
            }
          })
        )
        setMyBookings(enrichedBookings)
      } catch (error) {
        console.error("Failed to load matches:", error)
      } finally {
        setLoading(false)
      }
    }

    loadMatches()
  }, [user])

  const handleAcceptRequest = async (matchId: string) => {
    try {
      await mockDb.updateMatchStatus(matchId, MatchStatus.ACCEPTED)
      // Refresh data
      if (typeof window !== 'undefined') {
        window.location.reload()
      }
    } catch (error) {
      console.error("Failed to accept request:", error)
    }
  }

  const handleDeclineRequest = async (matchId: string) => {
    try {
      await mockDb.updateMatchStatus(matchId, MatchStatus.CANCELLED)
      // Refresh data
      if (typeof window !== 'undefined') {
        window.location.reload()
      }
    } catch (error) {
      console.error("Failed to decline request:", error)
    }
  }

  const getStatusBadge = (status: MatchStatus) => {
    switch (status) {
      case MatchStatus.PENDING:
        return <Badge variant="outline" className="text-yellow-600">Pending</Badge>
      case MatchStatus.ACCEPTED:
        return <Badge variant="outline" className="text-green-600">Accepted</Badge>
      case MatchStatus.CONFIRMED:
        return <Badge variant="outline" className="text-blue-600">Confirmed</Badge>
      case MatchStatus.CANCELLED:
        return <Badge variant="outline" className="text-red-600">Cancelled</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  if (!user) {
    return <div className="min-h-screen bg-background flex items-center justify-center">Please log in</div>
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
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
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
            </Link>
            <h1 className="text-xl font-bold">My Requests & Bookings</h1>
          </div>
          <Link href="/">
            <Button variant="ghost" size="sm" className="p-2">
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </Link>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 max-w-4xl">
        <Tabs defaultValue="requests" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="requests" className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              Incoming Requests ({incomingRequests.length})
            </TabsTrigger>
            <TabsTrigger value="bookings" className="flex items-center gap-2">
              <Package className="w-4 h-4" />
              My Bookings ({myBookings.length})
            </TabsTrigger>
          </TabsList>

          {/* Incoming Requests Tab */}
          <TabsContent value="requests" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5 text-green-600" />
                  Incoming Booking Requests
                </CardTitle>
                <CardDescription>
                  Requests from travelers who want to use your baggage space
                </CardDescription>
              </CardHeader>
            </Card>

            {incomingRequests.length > 0 ? (
              <div className="space-y-4">
                {incomingRequests.map((request) => (
                  <Card key={request.id} className="shadow-sm">
                    <CardContent className="p-6">
                      <div className="flex justify-between items-start mb-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                            <User className="w-5 h-5 text-blue-600" />
                          </div>
                          <div>
                            <p className="font-semibold">{request.buyer?.name}</p>
                            <p className="text-sm text-muted-foreground">
                              {request.status === MatchStatus.ACCEPTED ? request.buyer?.phone : "+91-98xxxxxx"}
                            </p>
                          </div>
                        </div>
                        {getStatusBadge(request.status)}
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                        <div className="flex items-center gap-2">
                          <Plane className="w-4 h-4 text-blue-600" />
                          <div>
                            <p className="font-semibold text-sm">{request.listing?.flight?.flightNo}</p>
                            <p className="text-xs text-muted-foreground">
                              {request.listing?.flight?.date.toLocaleDateString('en-IN')}
                            </p>
                          </div>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Weight needed</p>
                          <p className="font-semibold">{request.quantityKg} kg</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Offering</p>
                          <p className="font-semibold text-green-600">{formatCurrency(request.totalCents)}</p>
                        </div>
                      </div>

                      {request.status === MatchStatus.PENDING && (
                        <div className="flex gap-2">
                          <Button 
                            size="sm" 
                            variant="outline" 
                            onClick={() => handleDeclineRequest(request.id)}
                            className="flex-1"
                          >
                            <XCircle className="w-4 h-4 mr-1" />
                            Decline
                          </Button>
                          <Button 
                            size="sm" 
                            onClick={() => handleAcceptRequest(request.id)}
                            className="flex-1"
                          >
                            <CheckCircle className="w-4 h-4 mr-1" />
                            Accept & Reveal Contact
                          </Button>
                        </div>
                      )}

                      {request.status === MatchStatus.ACCEPTED && (
                        <div className="mt-4 p-3 bg-green-50 rounded-lg">
                          <p className="text-sm font-medium text-green-800 mb-2">✅ Contact Details Shared</p>
                          <div className="flex items-center gap-4 text-sm">
                            <div className="flex items-center gap-1">
                              <Phone className="w-3 h-3" />
                              <span>{request.buyer?.phone}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Mail className="w-3 h-3" />
                              <span>{request.buyer?.email}</span>
                            </div>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="p-8 text-center">
                  <Users className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No incoming requests</h3>
                  <p className="text-muted-foreground mb-4">
                    When travelers request your baggage space, they'll appear here.
                  </p>
                  <Link href="/seller">
                    <Button>Create a Listing</Button>
                  </Link>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* My Bookings Tab */}
          <TabsContent value="bookings" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="w-5 h-5 text-blue-600" />
                  My Bookings
                </CardTitle>
                <CardDescription>
                  Your requests for baggage space from other travelers
                </CardDescription>
              </CardHeader>
            </Card>

            {myBookings.length > 0 ? (
              <div className="space-y-4">
                {myBookings.map((booking) => (
                  <Card key={booking.id} className="shadow-sm">
                    <CardContent className="p-6">
                      <div className="flex justify-between items-start mb-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                            <User className="w-5 h-5 text-green-600" />
                          </div>
                          <div>
                            <p className="font-semibold">{booking.seller?.name}</p>
                            <p className="text-sm text-muted-foreground">Space Provider</p>
                          </div>
                        </div>
                        {getStatusBadge(booking.status)}
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                        <div className="flex items-center gap-2">
                          <Plane className="w-4 h-4 text-blue-600" />
                          <div>
                            <p className="font-semibold text-sm">{booking.listing?.flight?.flightNo}</p>
                            <p className="text-xs text-muted-foreground">
                              {booking.listing?.flight?.date.toLocaleDateString('en-IN')}
                            </p>
                          </div>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Weight booked</p>
                          <p className="font-semibold">{booking.quantityKg} kg</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Total cost</p>
                          <p className="font-semibold text-green-600">{formatCurrency(booking.totalCents)}</p>
                        </div>
                      </div>

                      {booking.status === MatchStatus.ACCEPTED && (
                        <div className="mt-4 p-3 bg-green-50 rounded-lg">
                          <p className="text-sm font-medium text-green-800 mb-2">✅ Booking Confirmed</p>
                          <div className="flex items-center gap-4 text-sm">
                            <div className="flex items-center gap-1">
                              <Phone className="w-3 h-3" />
                              <span>{booking.seller?.phone}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Mail className="w-3 h-3" />
                              <span>{booking.seller?.email}</span>
                            </div>
                          </div>
                          <p className="text-xs text-green-700 mt-2">
                            Coordinate with the space provider for airport meetup
                          </p>
                        </div>
                      )}

                      {booking.status === MatchStatus.PENDING && (
                        <div className="mt-4 p-3 bg-yellow-50 rounded-lg">
                          <p className="text-sm text-yellow-800">⏳ Waiting for provider to accept your request</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="p-8 text-center">
                  <Package className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No bookings yet</h3>
                  <p className="text-muted-foreground mb-4">
                    When you book baggage space, your requests will appear here.
                  </p>
                  <Link href="/buyer">
                    <Button>Find Space</Button>
                  </Link>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}