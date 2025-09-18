"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { CheckCircle, Plane, Package, Users, Clock, AlertTriangle } from "lucide-react"
import { formatCurrency } from "@/lib/currency"

interface BookingConfirmationProps {
  flight: {
    flightNo: string
    date: Date
    airline?: string
  }
  weightKg: number
  pricePerKg: number
  totalAmount: number
  sellerName?: string
  onConfirmBooking: () => void
  loading?: boolean
}

export function BookingConfirmation({
  flight,
  weightKg,
  pricePerKg,
  totalAmount,
  sellerName = "Space Provider",
  onConfirmBooking,
  loading = false
}: BookingConfirmationProps) {
  return (
    <div className="max-w-md mx-auto space-y-6">
      {/* Booking Summary */}
      <Card className="shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Package className="w-5 h-5 text-blue-600" />
            Booking Summary
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
            <Plane className="w-5 h-5 text-blue-600" />
            <div>
              <p className="font-semibold">{flight.flightNo}</p>
              <p className="text-sm text-muted-foreground">
                {flight.date.toLocaleDateString('en-IN')}
                {flight.airline && ` • ${flight.airline}`}
              </p>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Baggage space ({weightKg} kg)</span>
              <span className="font-semibold">{formatCurrency(totalAmount)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Service fee</span>
              <span className="font-semibold">₹0.00</span>
            </div>
            <div className="border-t pt-3">
              <div className="flex justify-between">
                <span className="font-semibold">Total</span>
                <span className="font-bold text-lg">{formatCurrency(totalAmount)}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Space Provider Info */}
      <Card className="shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Users className="w-5 h-5 text-green-600" />
            Space Provider
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
              <Users className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="font-semibold">{sellerName}</p>
              <p className="text-sm text-muted-foreground">Contact details will be shared after confirmation</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* How it Works */}
      <Card className="shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Clock className="w-5 h-5 text-purple-600" />
            What Happens Next?
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-start gap-3">
            <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
              <span className="text-xs font-bold text-blue-600">1</span>
            </div>
            <div>
              <p className="text-sm font-medium">Request Sent</p>
              <p className="text-xs text-muted-foreground">Your booking request is sent to the space provider</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
              <span className="text-xs font-bold text-green-600">2</span>
            </div>
            <div>
              <p className="text-sm font-medium">Provider Accepts</p>
              <p className="text-xs text-muted-foreground">They'll accept and share contact details</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-6 h-6 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
              <span className="text-xs font-bold text-purple-600">3</span>
            </div>
            <div>
              <p className="text-sm font-medium">Meet at Airport</p>
              <p className="text-xs text-muted-foreground">Coordinate baggage check-in together</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Disclaimer */}
      <Card className="shadow-sm border-orange-200">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-orange-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-orange-800">⚠️ Disclaimer</p>
              <p className="text-xs text-orange-700 mt-1">
                Both parties agree that this arrangement is voluntary and they accept responsibility for their baggage. Do this at your own risk.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Confirm Button */}
      <Button 
        onClick={onConfirmBooking} 
        className="w-full h-12 text-base" 
        disabled={loading}
      >
        {loading ? (
          "Sending Request..."
        ) : (
          <>
            <CheckCircle className="w-4 h-4 mr-2" />
            Send Booking Request
          </>
        )}
      </Button>

      <p className="text-xs text-center text-muted-foreground">
        No payment required now. Pay directly to the space provider after confirmation.
      </p>
    </div>
  )
}
