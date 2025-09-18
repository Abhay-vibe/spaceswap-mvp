"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/components/auth-provider"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Package, Star, User, Plane } from "lucide-react"
import Link from "next/link"
import { mockDb } from "@/lib/mock-db"
import { useRouter } from "next/navigation"
import type { Listing, User as UserType } from "@/lib/types"
import { MatchStatus } from "@/lib/types"
import { formatCurrency } from "@/lib/currency"

interface MatchPageProps {
  params: {
    listingId: string
  }
}

export default function MatchPage({ params }: MatchPageProps) {
  const { user } = useAuth()
  const router = useRouter()
  const [listing, setListing] = useState<Listing | null>(null)
  const [seller, setSeller] = useState<UserType | null>(null)
  const [loading, setLoading] = useState(true)
  const [booking, setBooking] = useState(false)
  const [quantity, setQuantity] = useState("1")

  useEffect(() => {
    const loadListing = async () => {
      try {
        const listingData = await mockDb.getListingById(params.listingId)
        if (listingData) {
          setListing(listingData)
          // Fetch the actual seller data
          const sellerData = await mockDb.getUserById(listingData.sellerId)
          if (sellerData) {
            setSeller(sellerData)
          } else {
            // Fallback if seller not found
            setSeller({
              id: listingData.sellerId,
              email: "seller@example.com",
              name: "Space Provider",
              ratingAvg: 4.8,
              createdAt: new Date(),
            })
          }
        }
      } catch (error) {
        console.error("Failed to load listing:", error)
      } finally {
        setLoading(false)
      }
    }

    loadListing()
  }, [params.listingId])

  const handleBooking = async () => {
    if (!user || !listing) return

    const quantityNum = Number.parseInt(quantity)
    if (quantityNum <= 0 || quantityNum > listing.weightKg) return

    setBooking(true)
    try {
      const totalCents = listing.pricePerKg * quantityNum

      const match = await mockDb.createMatch({
        listingId: listing.id,
        buyerId: user.id,
        quantityKg: quantityNum,
        totalCents,
        status: MatchStatus.PENDING,
      })

      router.push(`/payment/${match.id}`)
    } catch (error) {
      console.error("Booking failed:", error)
    } finally {
      setBooking(false)
    }
  }

  if (loading) {
    return <div className="min-h-screen bg-background flex items-center justify-center">Loading...</div>
  }

  if (!listing || !seller) {
    return <div className="min-h-screen bg-background flex items-center justify-center">Listing not found</div>
  }

  if (!user) {
    return <div className="min-h-screen bg-background flex items-center justify-center">Please log in to book</div>
  }

  const totalPrice = listing.pricePerKg * Number.parseInt(quantity || "0")

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/buyer">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Search
              </Button>
            </Link>
            <div className="flex items-center gap-2">
              <Package className="w-6 h-6 text-blue-600" />
              <h1 className="text-xl font-bold">Book Baggage Space</h1>
            </div>
          </div>
          <Link href="/">
            <Button variant="ghost" size="sm" className="p-2">
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </Link>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto space-y-6">
          {/* Listing Details */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Plane className="w-5 h-5" />
                Flight Details
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <p>
                  <strong>Flight:</strong> AA123
                </p>
                <p>
                  <strong>Date:</strong> December 25, 2024
                </p>
                <p>
                  <strong>Available Weight:</strong> {listing.weightKg} kg
                </p>
                <p>
                  <strong>Price:</strong> {formatCurrency(listing.pricePerKg)} per kg
                </p>
                {listing.autoAccept && <Badge variant="secondary">Auto-accept enabled</Badge>}
              </div>
            </CardContent>
          </Card>

          {/* Seller Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="w-5 h-5" />
                Seller Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                  <User className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <p className="font-semibold">{seller.name}</p>
                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                    <span>{seller.ratingAvg} rating • 23 reviews</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Booking Form */}
          <Card>
            <CardHeader>
              <CardTitle>Book This Space</CardTitle>
              <CardDescription>You'll be redirected to secure payment after booking.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="quantity">Weight needed (kg)</Label>
                  <Input
                    id="quantity"
                    type="number"
                    min="1"
                    max={listing.weightKg}
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                  />
                  <p className="text-sm text-muted-foreground">Maximum available: {listing.weightKg} kg</p>
                </div>

                <div className="p-4 bg-muted rounded-lg">
                  <div className="flex justify-between items-center">
                    <span>Total Cost:</span>
                    <span className="text-2xl font-bold text-green-600">{formatCurrency(totalPrice)}</span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    {quantity} kg × {formatCurrency(listing.pricePerKg)} per kg
                  </p>
                </div>

                <Button
                  onClick={handleBooking}
                  className="w-full h-12"
                  disabled={booking || !quantity || Number.parseInt(quantity) <= 0}
                >
                  {booking ? "Processing..." : `Continue to Payment - ${formatCurrency(totalPrice)}`}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
