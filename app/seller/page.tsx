"use client"

import type React from "react"

import { useState } from "react"
import { useAuth } from "@/components/auth-provider"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { ArrowLeft, Plane, CheckCircle, Package, Users } from "lucide-react"
import Link from "next/link"
import { mockDb } from "@/lib/mock-db"
import { useRouter } from "next/navigation"
import { formatCurrency } from "@/lib/currency"

export default function SellerPage() {
  const { user } = useAuth()
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [showConfirmation, setShowConfirmation] = useState(false)
  const [createdListing, setCreatedListing] = useState<any>(null)
  const [formData, setFormData] = useState({
    flightNo: "",
    flightDate: "",
    airline: "",
    weightKg: "",
    pricePerKg: "",
    autoAccept: true,
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return

    setLoading(true)
    try {
      // Create or find flight
      const flight = await mockDb.findOrCreateFlight(
        formData.flightNo.toUpperCase(),
        new Date(formData.flightDate),
        formData.airline || undefined,
      )

      // Create listing
      const listing = await mockDb.createListing({
        sellerId: user.id,
        flightId: flight.id,
        weightKg: Number.parseInt(formData.weightKg),
        pricePerKg: Math.round(Number.parseFloat(formData.pricePerKg) * 100), // Convert to cents
        autoAccept: formData.autoAccept,
        active: true,
      })

      // Show confirmation instead of redirecting immediately
      setCreatedListing({ ...listing, flight })
      setShowConfirmation(true)
    } catch (error) {
      console.error("Failed to create listing:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  if (!user) {
    return <div>Please log in to create a listing.</div>
  }

  if (showConfirmation && createdListing) {
    const pendingRequests = Math.floor(Math.random() * 3); // Mock pending requests
    const potentialEarnings = createdListing.weightKg * createdListing.pricePerKg;

    return (
      <div className="min-h-screen bg-background">
        <header className="border-b">
          <div className="container mx-auto px-4 py-4 flex items-center gap-4">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-6 h-6 text-green-600" />
              <h1 className="text-xl font-bold">Listing Created!</h1>
            </div>
          </div>
        </header>

        <main className="container mx-auto px-4 py-6 max-w-md">
          <div className="space-y-4">
            {/* Success Card */}
            <Card className="border-green-200 bg-green-50">
              <CardContent className="p-6 text-center">
                <CheckCircle className="w-16 h-16 mx-auto text-green-600 mb-4" />
                <h2 className="text-xl font-bold text-green-800 mb-2">
                  Your {createdListing.weightKg} kg listing is live! ✈️
                </h2>
                <p className="text-green-700 text-sm mb-4">
                  Flight {createdListing.flight.flightNo} • {createdListing.flight.date.toLocaleDateString('en-IN')}
                </p>
                <div className="bg-white rounded-lg p-4 mb-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Price per kg</p>
                      <p className="font-semibold">{formatCurrency(createdListing.pricePerKg)}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Potential earnings</p>
                      <p className="font-bold text-green-600">{formatCurrency(potentialEarnings)}</p>
                    </div>
                  </div>
                </div>
                {pendingRequests > 0 && (
                  <div className="flex items-center justify-center gap-2 mb-4">
                    <Users className="w-4 h-4 text-blue-600" />
                    <span className="text-sm font-semibold text-blue-600">
                      {pendingRequests} request{pendingRequests > 1 ? 's' : ''} pending!
                    </span>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Actions */}
            <div className="grid grid-cols-2 gap-3">
              <Button 
                variant="outline" 
                onClick={() => router.push("/")}
                className="h-12"
              >
                View Dashboard
              </Button>
              <Button 
                onClick={() => {
                  setShowConfirmation(false)
                  setCreatedListing(null)
                  setFormData({
                    flightNo: "",
                    flightDate: "",
                    airline: "",
                    weightKg: "",
                    pricePerKg: "",
                    autoAccept: true,
                  })
                }}
                className="h-12"
              >
                <Package className="w-4 h-4 mr-1" />
                Create Another
              </Button>
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
          <Link href="/">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
          </Link>
          <div className="flex items-center gap-2">
            <Plane className="w-6 h-6 text-blue-600" />
            <h1 className="text-lg sm:text-xl font-bold">List Your Space 🎒</h1>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 max-w-md">
        <Card className="shadow-sm">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg">List Your Spare Baggage Allowance</CardTitle>
            <CardDescription className="text-sm">Help fellow travelers while earning money 💸</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="flightNo" className="text-sm">Flight Number *</Label>
                  <Input
                    id="flightNo"
                    placeholder="e.g., AI101, 6E234"
                    value={formData.flightNo}
                    onChange={(e) => handleInputChange("flightNo", e.target.value)}
                    className="h-12"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="flightDate" className="text-sm">Flight Date *</Label>
                  <Input
                    id="flightDate"
                    type="date"
                    value={formData.flightDate}
                    onChange={(e) => handleInputChange("flightDate", e.target.value)}
                    className="h-12"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="airline" className="text-sm">Airline (Optional)</Label>
                <Input
                  id="airline"
                  placeholder="e.g., Air India, IndiGo"
                  value={formData.airline}
                  onChange={(e) => handleInputChange("airline", e.target.value)}
                  className="h-12"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="weightKg" className="text-sm">Weight (kg) *</Label>
                  <Input
                    id="weightKg"
                    type="number"
                    min="1"
                    max="50"
                    placeholder="15"
                    value={formData.weightKg}
                    onChange={(e) => handleInputChange("weightKg", e.target.value)}
                    className="h-12"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="pricePerKg" className="text-sm">Price per kg (₹) *</Label>
                  <Input
                    id="pricePerKg"
                    type="number"
                    min="1"
                    step="1"
                    placeholder="400"
                    value={formData.pricePerKg}
                    onChange={(e) => handleInputChange("pricePerKg", e.target.value)}
                    className="h-12"
                    required
                  />
                </div>
              </div>

              <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                <div>
                  <Label htmlFor="autoAccept" className="text-sm font-medium">Auto-accept bookings</Label>
                  <p className="text-xs text-muted-foreground">Accept requests automatically</p>
                </div>
                <Switch
                  id="autoAccept"
                  checked={formData.autoAccept}
                  onCheckedChange={(checked) => handleInputChange("autoAccept", checked)}
                />
              </div>

              <Button type="submit" className="w-full h-12" disabled={loading}>
                {loading ? "Creating Listing..." : "Create Listing ✈️"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
