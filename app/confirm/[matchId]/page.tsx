"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/components/auth-provider"
import { ConfirmMatch } from "@/components/confirm-match"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft, Users } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { mockDb } from "@/lib/mock-db"
import type { Match, Listing } from "@/lib/types"
import { MatchStatus } from "@/lib/types"

interface ConfirmPageProps {
  params: {
    matchId: string
  }
}

export default function ConfirmPage({ params }: ConfirmPageProps) {
  const { user } = useAuth()
  const router = useRouter()
  const [match, setMatch] = useState<Match | null>(null)
  const [listing, setListing] = useState<Listing | null>(null)
  const [loading, setLoading] = useState(true)
  const [showContactInfo, setShowContactInfo] = useState(false)
  const [otherUserContact, setOtherUserContact] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadMatch = async () => {
      try {
        const matchData = await mockDb.getMatchById(params.matchId)
        if (matchData) {
          setMatch(matchData)
          const listingData = await mockDb.getListingById(matchData.listingId)
          setListing(listingData)

          // Check if match is already accepted to show contact info
          if (matchData.status === MatchStatus.ACCEPTED) {
            setShowContactInfo(true)
            // Mock contact info - in real app, this would come from the API
            setOtherUserContact({
              name: "John Traveler",
              email: "john.traveler@example.com",
              phone: "+91-9876543210"
            })
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

  const handleAcceptAndReveal = async () => {
    if (!match || !user) return

    try {
      // Update match status to accepted and reveal contact info
      const updatedMatch = await mockDb.updateMatchStatus(match.id, MatchStatus.ACCEPTED)
      if (updatedMatch) {
        setMatch(updatedMatch)
        setShowContactInfo(true)
        
        // Mock contact info - in real app, this would come from the API response
        setOtherUserContact({
          name: "John Traveler", 
          email: "john.traveler@example.com",
          phone: "+91-9876543210"
        })
      }
    } catch (error) {
      console.error("Accept failed:", error)
      setError("Failed to accept match. Please try again.")
    }
  }

  const handleConfirmTransfer = async () => {
    if (!match || !user) return

    try {
      // Update match status to confirmed
      const updatedMatch = await mockDb.updateMatchStatus(match.id, MatchStatus.CONFIRMED)
      if (updatedMatch) {
        setMatch(updatedMatch)

        // Log confirmation (no payment processing needed)
        console.log("[v0] Transfer confirmed for match:", match.id)

        // Redirect to success page
        router.push(`/matches/${match.id}`)
      }
    } catch (error) {
      console.error("Confirmation failed:", error)
      setError("Confirmation failed. Please try again.")
    }
  }

  const handleDecline = async () => {
    if (!match || !user) return

    try {
      const updatedMatch = await mockDb.updateMatchStatus(match.id, MatchStatus.CANCELLED)
      if (updatedMatch) {
        router.push("/")
      }
    } catch (error) {
      console.error("Decline failed:", error)
      setError("Failed to decline match. Please try again.")
    }
  }

  if (loading) {
    return <div className="min-h-screen bg-background flex items-center justify-center">Loading...</div>
  }

  if (!match || !listing || !user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">Match not found</div>
    )
  }

  const isUserBuyer = match.buyerId === user.id

  // Mock masked contact info
  const maskedContact = {
    name: "J. T*****",
    email: "j****@example.com", 
    phone: "+91-98xxxxxx"
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
            <Users className="w-6 h-6 text-blue-600" />
            <h1 className="text-xl font-bold">Confirm Match</h1>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 max-w-md">
        {error && (
          <Card className="border-red-200 bg-red-50 mb-4">
            <CardContent className="p-4">
              <p className="text-red-600 text-sm">{error}</p>
            </CardContent>
          </Card>
        )}

        <ConfirmMatch
          matchId={match.id}
          isUserBuyer={isUserBuyer}
          otherUserContact={otherUserContact}
          maskedContact={maskedContact}
          match={{
            quantityKg: match.quantityKg,
            totalCents: match.totalCents
          }}
          flight={{
            flightNo: "AA123", // Mock data
            date: new Date("2024-12-25")
          }}
          isVerified={true}
          trustScore={4.8}
          onAcceptAndReveal={handleAcceptAndReveal}
          onConfirmTransfer={handleConfirmTransfer}
          onDecline={handleDecline}
          showContactInfo={showContactInfo}
          isAccepted={match.status === MatchStatus.ACCEPTED}
        />
      </main>
    </div>
  )
}
