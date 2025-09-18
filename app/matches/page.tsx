"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/components/auth-provider"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Package, Clock, CheckCircle, XCircle } from "lucide-react"
import Link from "next/link"
import { mockDb } from "@/lib/mock-db"
import type { Match } from "@/lib/types"
import { MatchStatus } from "@/lib/types"
import { formatCurrency } from "@/lib/currency"

export default function MatchesPage() {
  const { user } = useAuth()
  const [matches, setMatches] = useState<Match[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadMatches = async () => {
      if (!user) return

      try {
        const userMatches = await mockDb.getMatchesByUser(user.id)
        setMatches(userMatches)
      } catch (error) {
        console.error("Failed to load matches:", error)
      } finally {
        setLoading(false)
      }
    }

    loadMatches()
  }, [user])

  if (!user) {
    return <div className="min-h-screen bg-background flex items-center justify-center">Please log in</div>
  }

  if (loading) {
    return <div className="min-h-screen bg-background flex items-center justify-center">Loading...</div>
  }

  const getStatusIcon = (status: MatchStatus) => {
    switch (status) {
      case MatchStatus.PENDING:
        return <Clock className="w-4 h-4 text-yellow-600" />
      case MatchStatus.ACCEPTED:
      case MatchStatus.CONFIRMED:
      case MatchStatus.RELEASED:
        return <CheckCircle className="w-4 h-4 text-green-600" />
      case MatchStatus.CANCELLED:
      case MatchStatus.DISPUTED:
        return <XCircle className="w-4 h-4 text-red-600" />
      default:
        return <Clock className="w-4 h-4" />
    }
  }

  const getStatusVariant = (status: MatchStatus): "default" | "secondary" | "destructive" => {
    switch (status) {
      case MatchStatus.PENDING:
        return "secondary"
      case MatchStatus.ACCEPTED:
      case MatchStatus.CONFIRMED:
      case MatchStatus.RELEASED:
        return "default"
      case MatchStatus.CANCELLED:
      case MatchStatus.DISPUTED:
        return "destructive"
      default:
        return "secondary"
    }
  }

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
            <h1 className="text-xl font-bold">My Bookings</h1>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {matches.length > 0 ? (
            <div className="space-y-4">
              <h2 className="text-2xl font-bold mb-6">Your Bookings ({matches.length})</h2>
              {matches.map((match) => (
                <Card key={match.id}>
                  <CardContent className="p-6">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          {getStatusIcon(match.status)}
                          <Badge variant={getStatusVariant(match.status)}>{match.status}</Badge>
                        </div>
                        <h3 className="font-semibold mb-1">{match.quantityKg} kg baggage space</h3>
                        <p className="text-muted-foreground text-sm mb-2">
                          Match #{match.id.slice(-6)} • {match.createdAt.toLocaleDateString()}
                        </p>
                        <p className="text-lg font-bold text-green-600">{formatCurrency(match.totalCents)}</p>
                      </div>
                      <Link href={`/matches/${match.id}`}>
                        <Button variant="outline">View Details</Button>
                      </Link>
                    </div>
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
                  You haven't made any bookings yet. Start by searching for available baggage space.
                </p>
                <Link href="/buyer">
                  <Button>Find Baggage Space</Button>
                </Link>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  )
}
