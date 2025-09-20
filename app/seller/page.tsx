"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useAuth } from "@/components/auth-provider"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { ArrowLeft, Plane, CheckCircle, Package, Users, Edit, Eye } from "lucide-react"
import Link from "next/link"
import SupabaseService from "@/lib/supabase-service"
import { formatCurrency } from "@/lib/currency"
import { UserInfoForm } from "@/components/user-info-form"

export default function SellerPage() {
  const { user, setUser } = useAuth()
  const [loading, setLoading] = useState(false)
  const [showConfirmation, setShowConfirmation] = useState(false)
  const [showUserForm, setShowUserForm] = useState(!user)
  const [createdListing, setCreatedListing] = useState<any>(null)
  const [formData, setFormData] = useState({
    flightNo: "",
    flightDate: "",
    airline: "",
    weightKg: "",
    pricePerKg: "",
    autoAccept: true,
  })
  const [isEditing, setIsEditing] = useState(false)
  const [editingListingId, setEditingListingId] = useState<string | null>(null)

  // Check for editing data on component mount
  useEffect(() => {
    const editData = sessionStorage.getItem('editListing')
    if (editData) {
      try {
        const listing = JSON.parse(editData)
        setFormData({
          flightNo: listing.flightNo,
          flightDate: listing.flightDate,
          airline: listing.airline,
          weightKg: listing.weightKg,
          pricePerKg: listing.pricePerKg,
          autoAccept: listing.autoAccept,
        })
        setIsEditing(true)
        setEditingListingId(listing.id)
        sessionStorage.removeItem('editListing') // Clear after loading
      } catch (error) {
        console.error('Failed to parse edit data:', error)
      }
    }
  }, [])

  const handleUserInfoSubmit = async (userInfo: { name: string; email: string; phone: string }) => {
    setLoading(true)
    try {
      // Create user in Supabase
      const newUser = await SupabaseService.createUser({
        email: userInfo.email,
        name: userInfo.name,
        phone: userInfo.phone,
      })
      setUser(newUser)
      setShowUserForm(false)
    } catch (error) {
      console.error("Failed to create user:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return

    setLoading(true)
    try {
      // Create or find flight
      const flight = await SupabaseService.findOrCreateFlight(
        formData.flightNo.toUpperCase(),
        new Date(formData.flightDate),
        formData.airline || undefined,
      )

      // Create listing
      const listing = await SupabaseService.createListing({
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

  // Show user info form if no user
  if (showUserForm) {
    return (
      <UserInfoForm
        title="List Your Space"
        description="Share your details to start listing baggage space"
        onSubmit={handleUserInfoSubmit}
        loading={loading}
      />
    )
  }

  if (showConfirmation && createdListing) {
    const pendingRequests = 2; // Mock pending requests
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
                <div className="grid grid-cols-2 gap-4 text-center">
                  <div>
                    <p className="text-2xl font-bold text-green-600">
                      {formatCurrency(potentialEarnings)}
                    </p>
                    <p className="text-xs text-green-700">Potential earnings</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-blue-600">{pendingRequests}</p>
                    <p className="text-xs text-blue-700">Requests pending</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Listing Details Card */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Package className="w-5 h-5 text-blue-600" />
                  Listing Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Available weight</span>
                  <span className="font-semibold">{createdListing.weightKg} kg</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Price per kg</span>
                  <span className="font-semibold">{formatCurrency(createdListing.pricePerKg)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Auto-accept</span>
                  <span className="font-semibold">{createdListing.autoAccept ? 'Yes' : 'No'}</span>
                </div>
              </CardContent>
            </Card>

            {/* Action Buttons */}
            <div className="space-y-3">
              <div className="flex gap-2">
                <Button 
                  size="sm" 
                  variant="outline" 
                  className="flex-1 text-xs h-8"
                  onClick={() => {
                    // Reset form with current listing data
                    setFormData({
                      flightNo: createdListing.flight.flightNo,
                      flightDate: createdListing.flight.date.toISOString().split('T')[0],
                      airline: createdListing.flight.airline || '',
                      weightKg: createdListing.weightKg.toString(),
                      pricePerKg: (createdListing.pricePerKg / 100).toString(),
                      autoAccept: createdListing.autoAccept,
                    })
                    setShowConfirmation(false)
                  }}
                >
                  <Edit className="w-3 h-3 mr-1" />
                  Edit Listing
                </Button>
                <Link href="/matches" className="flex-1">
                  <Button 
                    size="sm" 
                    className="w-full text-xs h-8"
                  >
                    <Eye className="w-3 h-3 mr-1" />
                    View Requests ({pendingRequests})
                  </Button>
                </Link>
              </div>
              
              <Link href="/">
                <Button variant="ghost" className="w-full">
                  Back to Dashboard
                </Button>
              </Link>
            </div>

            {/* What's Next */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">What's Next?</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm text-muted-foreground">
                <p>• Travelers will see your listing when searching for your flight</p>
                <p>• You'll get notifications when someone requests your space</p>
                <p>• Accept requests and coordinate at the airport</p>
                <p>• Get paid after successful baggage transfer</p>
              </CardContent>
            </Card>
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
            <Package className="w-6 h-6 text-blue-600" />
            <h1 className="text-xl font-bold">List Your Space</h1>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 max-w-md">
        <Card className="shadow-sm">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg">
              {isEditing ? 'Edit Your Listing' : 'Share Your Spare Baggage Allowance'}
            </CardTitle>
            <CardDescription className="text-sm">
              {isEditing ? 'Update your baggage space details' : 'Help fellow travelers while earning money 💸'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                <Label htmlFor="flightNo" className="text-sm">Flight Number</Label>
                  <Input
                    id="flightNo"
                  placeholder="AI101, 6E2134, UK955"
                    value={formData.flightNo}
                    onChange={(e) => handleInputChange("flightNo", e.target.value)}
                    required
                  className="h-12"
                  />
                </div>

                <div className="space-y-2">
                <Label htmlFor="flightDate" className="text-sm">Flight Date</Label>
                  <Input
                    id="flightDate"
                    type="date"
                    value={formData.flightDate}
                    onChange={(e) => handleInputChange("flightDate", e.target.value)}
                    required
                  className="h-12"
                  />
              </div>

              <div className="space-y-2">
                <Label htmlFor="airline" className="text-sm">Airline (Optional)</Label>
                <Input
                  id="airline"
                  placeholder="Air India, IndiGo, Vistara"
                  value={formData.airline}
                  onChange={(e) => handleInputChange("airline", e.target.value)}
                  className="h-12"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="weightKg" className="text-sm">Available Weight (kg)</Label>
                  <Input
                    id="weightKg"
                    type="number"
                    placeholder="15"
                    min="1"
                    max="30"
                    value={formData.weightKg}
                    onChange={(e) => handleInputChange("weightKg", e.target.value)}
                    required
                    className="h-12"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="pricePerKg" className="text-sm">Price per kg (₹)</Label>
                  <Input
                    id="pricePerKg"
                    type="number"
                    placeholder="20"
                    min="1"
                    step="1"
                    value={formData.pricePerKg}
                    onChange={(e) => handleInputChange("pricePerKg", e.target.value)}
                    required
                    className="h-12"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                <div className="space-y-1">
                  <Label htmlFor="autoAccept" className="text-sm font-medium">Auto-accept bookings</Label>
                  <p className="text-xs text-muted-foreground">Automatically accept requests without manual approval</p>
                </div>
                <Switch
                  id="autoAccept"
                  checked={formData.autoAccept}
                  onCheckedChange={(checked) => handleInputChange("autoAccept", checked)}
                />
              </div>

              <Button type="submit" className="w-full h-12" disabled={loading}>
                {loading ? (isEditing ? "Updating Listing..." : "Creating Listing...") : (isEditing ? "Update Listing ✈️" : "Create Listing ✈️")}
              </Button>
            </form>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}