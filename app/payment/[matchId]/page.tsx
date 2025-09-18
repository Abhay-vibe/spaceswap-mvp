"use client"

import { Button } from "@/components/ui/button"

import { useState, useEffect } from "react"
import { useAuth } from "@/components/auth-provider"
import { PaymentForm } from "@/components/payment-form"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft, Package, Shield } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { mockDb } from "@/lib/mock-db"
import type { Match, Listing } from "@/lib/types"
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
  const [loading, setLoading] = useState(true)
  const [paymentError, setPaymentError] = useState<string | null>(null)

  useEffect(() => {
    const loadMatch = async () => {
      try {
        const matchData = await mockDb.getMatchById(params.matchId)
        if (matchData) {
          setMatch(matchData)
          const listingData = await mockDb.getListingById(matchData.listingId)
          setListing(listingData)
        }
      } catch (error) {
        console.error("Failed to load match:", error)
      } finally {
        setLoading(false)
      }
    }

    loadMatch()
  }, [params.matchId])

  const handlePaymentSuccess = async (paymentIntentId: string) => {
    if (!match) return

    try {
      // Update match with payment info
      const updatedMatch = await mockDb.updateMatchStatus(match.id, MatchStatus.ACCEPTED)
      if (updatedMatch) {
        // In a real app, we'd store the payment intent ID
        console.log("[v0] Payment successful, match updated:", updatedMatch.id)
        router.push(`/matches/${match.id}`)
      }
    } catch (error) {
      console.error("Failed to update match after payment:", error)
      setPaymentError("Payment processed but failed to update booking. Please contact support.")
    }
  }

  const handlePaymentError = (error: string) => {
    setPaymentError(error)
  }

  if (loading) {
    return <div className="min-h-screen bg-background flex items-center justify-center">Loading...</div>
  }

  if (!match || !listing || !user) {
    return <div className="min-h-screen bg-background flex items-center justify-center">Payment session not found</div>
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto px-4 py-4 flex items-center gap-4">
          <Link href={`/matches/${match.id}`}>
            <Button variant="ghost" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Match
            </Button>
          </Link>
          <div className="flex items-center gap-2">
            <Shield className="w-6 h-6 text-blue-600" />
            <h1 className="text-xl font-bold">Secure Payment</h1>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto space-y-6">
          {/* Order Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="w-5 h-5" />
                Order Summary
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between">
                <span>Baggage space ({match.quantityKg} kg)</span>
                <span>${(match.totalCents / 100).toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Service fee</span>
                <span>$0.00</span>
              </div>
              <hr />
              <div className="flex justify-between font-bold text-lg">
                <span>Total</span>
                <span>${(match.totalCents / 100).toFixed(2)}</span>
              </div>
            </CardContent>
          </Card>

          {/* Payment Error */}
          {paymentError && (
            <Card className="border-red-200">
              <CardContent className="p-4">
                <p className="text-red-600 text-sm">{paymentError}</p>
              </CardContent>
            </Card>
          )}

          {/* Payment Form */}
          <PaymentForm
            amount={match.totalCents}
            onPaymentSuccess={handlePaymentSuccess}
            onPaymentError={handlePaymentError}
          />

          {/* Security Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-green-600" />
                Payment Security
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>• Your payment is held securely in escrow</li>
                <li>• Funds are only released after both parties confirm the baggage transfer</li>
                <li>• Full refund if the arrangement is cancelled</li>
                <li>• 256-bit SSL encryption protects your payment information</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
