"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useAuth } from "@/components/auth-provider"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Search, Package, Star } from "lucide-react"
import Link from "next/link"
import { mockDb } from "@/lib/mock-db"
import type { Flight, Listing } from "@/lib/types"

export default function BuyerPage() {
  const { user } = useAuth()
  const [searchData, setSearchData] = useState({
    flightNo: "",
    flightDate: "",
  })
  const [flight, setFlight] = useState<Flight | null>(null)
  const [listings, setListings] = useState<Listing[]>([])
  const [loading, setLoading] = useState(false)
  const [searched, setSearched] = useState(false)

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!searchData.flightNo || !searchData.flightDate) return

    setLoading(true)
    setSearched(true)
    try {
      const foundFlight = await mockDb.findOrCreateFlight(
        searchData.flightNo.toUpperCase(),
        new Date(searchData.flightDate),
      )
      setFlight(foundFlight)

      const flightListings = await mockDb.getListingsByFlight(foundFlight.id)
      setListings(flightListings)
    } catch (error) {
      console.error("Search failed:", error)
    } finally {
      setLoading(false)
    }
  }

  // Load demo data on mount
  useEffect(() => {
    const loadDemoData = async () => {
      await mockDb.seedData()
    }
    loadDemoData()
  }, [])

  if (!user) {
    return <div>Please log in to search for listings.</div>
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto px-4 py-4 flex items-center gap-4">
          <Link href="/">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
          </Link>
          <div className="flex items-center gap-2">
            <Search className="w-6 h-6 text-blue-600" />
            <h1 className="text-xl font-bold">Find Baggage Space</h1>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <Card className="max-w-2xl mx-auto mb-8">
          <CardHeader>
            <CardTitle>Search Your Flight</CardTitle>
            <CardDescription>Find available baggage allowance on your flight.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSearch} className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="flightNo">Flight Number</Label>
                  <Input
                    id="flightNo"
                    placeholder="e.g., AA123"
                    value={searchData.flightNo}
                    onChange={(e) => setSearchData((prev) => ({ ...prev, flightNo: e.target.value }))}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="flightDate">Flight Date</Label>
                  <Input
                    id="flightDate"
                    type="date"
                    value={searchData.flightDate}
                    onChange={(e) => setSearchData((prev) => ({ ...prev, flightDate: e.target.value }))}
                    required
                  />
                </div>
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Searching..." : "Search Flight"}
              </Button>
            </form>
          </CardContent>
        </Card>

        {searched && (
          <div className="max-w-4xl mx-auto">
            {flight && (
              <div className="mb-6">
                <h2 className="text-2xl font-bold mb-2">Flight {flight.flightNo}</h2>
                <p className="text-muted-foreground">
                  {flight.date.toLocaleDateString()} {flight.airline && `• ${flight.airline}`}
                </p>
              </div>
            )}

            {listings.length > 0 ? (
              <div className="grid gap-4">
                <h3 className="text-lg font-semibold">
                  Available Baggage Space ({listings.length} listing{listings.length !== 1 ? "s" : ""})
                </h3>
                {listings.map((listing) => (
                  <Card key={listing.id}>
                    <CardContent className="p-6">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <Package className="w-5 h-5 text-blue-600" />
                            <span className="font-semibold">{listing.weightKg} kg available</span>
                            {listing.autoAccept && <Badge variant="secondary">Auto-accept</Badge>}
                          </div>
                          <p className="text-2xl font-bold text-green-600 mb-2">
                            ${(listing.pricePerKg / 100).toFixed(2)} per kg
                          </p>
                          <div className="flex items-center gap-1 text-sm text-muted-foreground">
                            <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                            <span>4.8 rating • 23 reviews</span>
                          </div>
                        </div>
                        <div className="text-right">
                          <Link href={`/match/${listing.id}`}>
                            <Button>Book Now</Button>
                          </Link>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : searched && !loading ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <Package className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No listings found</h3>
                  <p className="text-muted-foreground mb-4">
                    No one has listed spare baggage allowance for this flight yet.
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Try searching for a different flight or check back later.
                  </p>
                </CardContent>
              </Card>
            ) : null}
          </div>
        )}

        {!searched && (
          <Card className="max-w-2xl mx-auto">
            <CardContent className="p-8 text-center">
              <Search className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">Search for your flight</h3>
              <p className="text-muted-foreground">
                Enter your flight details above to find available baggage space from fellow travelers.
              </p>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  )
}
