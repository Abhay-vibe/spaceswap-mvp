"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/components/auth-provider"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Package, Clock, CheckCircle, XCircle, AlertCircle, Users } from "lucide-react"
import { formatCurrency } from "@/lib/currency"
import Link from "next/link"
import { mockDb } from "@/lib/mock-db"
import type { Match, Listing, User as UserType } from "@/lib/types"
import { MatchStatus } from "@/lib/types"

interface MatchPageProps {
  params: {
    matchId: string
  }
}

export default function MatchDetailsPage({ params }: MatchPageProps) {
  const { user } = useAuth()
  const [match, setMatch] = useState<Match | null>(null)
  const [listing, setListing] = useState<Listing | null>(null)
  const [otherUser, setOtherUser] = useState<UserType | null>(null)
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)

  useEffect(() => {
    const loadMatch = async () => {
      try {
        const matchData = await mockDb.getMatchById(params.matchId)
        if (matchData) {
          setMatch(matchData)

          const listingData = await mockDb.getListingById(matchData.listingId)
          setListing(listingData)

          // Get actual other user data
          const isUserBuyer = matchData.buyerId === user?.id
          const otherUserId = isUserBuyer ? listingData?.sellerId : matchData.buyerId
          if (otherUserId) {
            const otherUserData = await mockDb.getUserById(otherUserId)
            if (otherUserData) {
              setOtherUser(otherUserData)
            } else {
              setOtherUser({
                id: otherUserId,
                email: isUserBuyer ? "seller@example.com" : "buyer@example.com",
                name: isUserBuyer ? "Space Provider" : "Traveler",
                ratingAvg: 4.8,
                createdAt: new Date(),
              })
            }
          }
        }
      } catch (error) {
        console.error("Failed to load match:", error)
      } finally {
        setLoading(false)
      }
    }

    loadMatch()
  }, [params.matchId, user?.id])

  const handleAccept = async () => {
    if (!match || !user) return

    setActionLoading(true)
    try {
      const updatedMatch = await mockDb.updateMatchStatus(match.id, MatchStatus.ACCEPTED)
      if (updatedMatch) {
        setMatch(updatedMatch)
      }
    } catch (error) {
      console.error("Failed to accept match:", error)
    } finally {
      setActionLoading(false)
    }
  }

  const handleReject = async () => {
    if (!match || !user) return

    setActionLoading(true)
    try {
      const updatedMatch = await mockDb.updateMatchStatus(match.id, MatchStatus.CANCELLED)
      if (updatedMatch) {
        setMatch(updatedMatch)
      }
    } catch (error) {
      console.error("Failed to reject match:", error)
    } finally {
      setActionLoading(false)
    }
  }

  if (loading) {
    return <div className="min-h-screen bg-background flex items-center justify-center">Loading...</div>
  }

  if (!match || !listing || !user) {
    return <div className="min-h-screen bg-background flex items-center justify-center">Match not found</div>
  }

  const isUserBuyer = match.buyerId === user.id
  const statusConfig = {
    [MatchStatus.PENDING]: {
      icon: Clock,
      color: "text-yellow-600",
      bg: "bg-yellow-100",
      label: "Pending Approval",
    },
    [MatchStatus.ACCEPTED]: {
      icon: CheckCircle,
      color: "text-green-600",
      bg: "bg-green-100",
      label: "Accepted",
    },
    [MatchStatus.CONFIRMED]: {
      icon: CheckCircle,
      color: "text-blue-600",
      bg: "bg-blue-100",
      label: "Confirmed",
    },
    [MatchStatus.RELEASED]: {
      icon: CheckCircle,
      color: "text-green-600",
      bg: "bg-green-100",
      label: "Completed",
    },
    [MatchStatus.CANCELLED]: {
      icon: XCircle,
      color: "text-red-600",
      bg: "bg-red-100",
      label: "Cancelled",
    },
    [MatchStatus.DISPUTED]: {
      icon: AlertCircle,
      color: "text-orange-600",
      bg: "bg-orange-100",
      label: "Disputed",
    },
  }

  const currentStatus = statusConfig[match.status]
  const StatusIcon = currentStatus.icon

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto px-4 py-4 flex items-center gap-4">
          <Link href="/">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Button>
          </Link>
          <div className="flex items-center gap-2">
            <Package className="w-6 h-6 text-blue-600" />
            <h1 className="text-xl font-bold">Match Details</h1>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto space-y-6">
          {/* Status Card */}
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className={`p-3 rounded-full ${currentStatus.bg}`}>
                  <StatusIcon className={`w-6 h-6 ${currentStatus.color}`} />
                </div>
                <div>
                  <h2 className="text-xl font-bold">{currentStatus.label}</h2>
                  <p className="text-muted-foreground">
                    {isUserBuyer ? "Your booking" : "Booking request"} • Match #{match.id.slice(-6)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Match Details */}
          <Card>
            <CardHeader>
              <CardTitle>Booking Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Weight</p>
                  <p className="font-semibold">{match.quantityKg} kg</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Cost</p>
                  <p className="font-semibold text-green-600">{formatCurrency(match.totalCents)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Price per kg</p>
                  <p className="font-semibold">{formatCurrency(listing.pricePerKg)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Created</p>
                  <p className="font-semibold">{match.createdAt.toLocaleDateString()}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Other User Info */}
          <Card>
            <CardHeader>
              <CardTitle>{isUserBuyer ? "Seller" : "Buyer"} Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                  <Package className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <p className="font-semibold">{otherUser?.name}</p>
                  <p className="text-sm text-muted-foreground">Rating: {otherUser?.ratingAvg}/5</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          {match.status === MatchStatus.PENDING && !isUserBuyer && (
            <Card>
              <CardHeader>
                <CardTitle>Action Required</CardTitle>
                <CardDescription>
                  A traveler wants to book {match.quantityKg} kg of your baggage allowance.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex gap-4">
                  <Button onClick={handleAccept} disabled={actionLoading} className="flex-1">
                    Accept Booking
                  </Button>
                  <Button
                    variant="outline"
                    onClick={handleReject}
                    disabled={actionLoading}
                    className="flex-1 bg-transparent"
                  >
                    Decline
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {match.status === MatchStatus.ACCEPTED && (
            <Card>
              <CardHeader>
                <CardTitle>Ready for Airport Confirmation</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-4">
                  Your booking has been accepted! Meet at the airport to confirm the baggage transfer using QR codes.
                </p>
                <Link href={`/confirm/${match.id}`}>
                  <Button className="w-full">
                    <Users className="w-4 h-4 mr-2" />
                    Confirm at Airport
                  </Button>
                </Link>
              </CardContent>
            </Card>
          )}

          {match.status === MatchStatus.CONFIRMED && (
            <Card>
              <CardHeader>
                <CardTitle>Transfer Confirmed</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-4">
                  The baggage transfer has been confirmed by both parties.
                  {isUserBuyer ? " Payment has been released to the seller." : " You will receive payment shortly."}
                </p>
                <Badge variant="default">Transaction Complete</Badge>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  )
}
