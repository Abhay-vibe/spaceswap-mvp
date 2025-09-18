"use client"

import { Button } from "@/components/ui/button"

import { useState, useEffect } from "react"
import { useAuth } from "@/components/auth-provider"
import { BookingConfirmation } from "@/components/booking-confirmation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft, CheckCircle, Clock } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { mockDb } from "@/lib/mock-db"
import type { Match, Listing, Flight } from "@/lib/types"
import { MatchStatus } from "@/lib/types"

interface PaymentPageProps {
  params: {
    matchId: string
  }
}

export default function PaymentPage({ params }: PaymentPageProps) {
  const { user } = useAuth()
  const router = useRouter()
  const [match, setMatch] = useState<Match | null>(null)
  const [listing, setListing] = useState<Listing | null>(null)
  const [flight, setFlight] = useState<Flight | null>(null)
  const [loading, setLoading] = useState(true)
  const [bookingConfirmed, setBookingConfirmed] = useState(false)
  const [confirmingBooking, setConfirmingBooking] = useState(false)

  useEffect(() => {
    const loadMatch = async () => {
      try {
        const matchData = await mockDb.getMatchById(params.matchId)
        if (matchData) {
          setMatch(matchData)
          const listingData = await mockDb.getListingById(matchData.listingId)
          if (listingData) {
            setListing(listingData)
            const flightData = await mockDb.getFlightById(listingData.flightId)
            setFlight(flightData)
          }
        }
      } catch (error) {
        console.error("Failed to load match:", error)
      } finally {
        setLoading(false)
      }
    }

    loadMatch()
  }, [params.matchId])

  const handleConfirmBooking = async () => {
    if (!match) return

    setConfirmingBooking(true)
    try {
      // Update match status to PENDING (waiting for seller acceptance)
      await mockDb.updateMatchStatus(match.id, MatchStatus.PENDING)
      setBookingConfirmed(true)
    } catch (error) {
      console.error("Failed to confirm booking:", error)
    } finally {
      setConfirmingBooking(false)
    }
  }

  if (!user) {
    return <div>Please log in to complete your booking.</div>
  }

  if (loading) {
    return <div>Loading...</div>
  }

  if (!match || !listing || !flight) {
    return <div>Match not found.</div>
  }

  // Show success page after booking confirmation
  if (bookingConfirmed) {
    return (
      <div className="min-h-screen bg-background">
        <header className="border-b">
          <div className="container mx-auto px-4 py-4 flex items-center gap-4">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-6 h-6 text-green-600" />
              <h1 className="text-xl font-bold">Request Sent!</h1>
            </div>
          </div>
        </header>

        <main className="container mx-auto px-4 py-6 max-w-md">
          <div className="space-y-6">
            {/* Success Card */}
            <Card className="border-green-200 bg-green-50">
              <CardContent className="p-6 text-center">
                <CheckCircle className="w-16 h-16 mx-auto text-green-600 mb-4" />
                <h2 className="text-xl font-bold text-green-800 mb-2">
                  Booking request sent! 🎒
                </h2>
                <p className="text-green-700 text-sm mb-4">
                  Flight {flight.flightNo} • {flight.date.toLocaleDateString('en-IN')}
                </p>
                <p className="text-green-700 text-sm">
                  The space provider will review your request and get back to you soon.
                </p>
              </CardContent>
            </Card>

            {/* What's Next */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Clock className="w-5 h-5 text-blue-600" />
                  What Happens Next?
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-xs font-bold text-blue-600">1</span>
                  </div>
                  <div>
                    <p className="text-sm font-medium">Provider Reviews Request</p>
                    <p className="text-xs text-muted-foreground">They'll review your booking request</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-xs font-bold text-green-600">2</span>
                  </div>
                  <div>
                    <p className="text-sm font-medium">Contact Details Shared</p>
                    <p className="text-xs text-muted-foreground">If accepted, you'll get their contact information</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-xs font-bold text-purple-600">3</span>
                  </div>
                  <div>
                    <p className="text-sm font-medium">Coordinate & Meet</p>
                    <p className="text-xs text-muted-foreground">Plan to meet at the airport for baggage check-in</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Action Buttons */}
            <div className="space-y-3">
              <Link href="/matches">
                <Button className="w-full">
                  View My Bookings
                </Button>
              </Link>
              
              <Link href="/">
                <Button variant="outline" className="w-full">
                  Back to Home
                </Button>
              </Link>
            </div>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto px-4 py-4 flex items-center gap-4">
          <Link href={`/match/${listing.id}`}>
            <Button variant="ghost" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
          </Link>
          <h1 className="text-xl font-bold">Confirm Booking</h1>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6">
        <BookingConfirmation
          flight={{
            flightNo: flight.flightNo,
            date: flight.date,
            airline: flight.airline
          }}
          weightKg={match.quantityKg}
          pricePerKg={listing.pricePerKg}
          totalAmount={match.totalCents}
          sellerName="Space Provider"
          onConfirmBooking={handleConfirmBooking}
          loading={confirmingBooking}
        />
      </main>
    </div>
  )
}