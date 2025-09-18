"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { CreditCard, Lock } from "lucide-react"
import { mockStripe, mockEscrow } from "@/lib/stripe-mock"
import { formatCurrency } from "@/lib/currency"

interface PaymentFormProps {
  amount: number
  onPaymentSuccess: (paymentIntentId: string) => void
  onPaymentError: (error: string) => void
}

export function PaymentForm({ amount, onPaymentSuccess, onPaymentError }: PaymentFormProps) {
  const [loading, setLoading] = useState(false)
  const [cardDetails, setCardDetails] = useState({
    number: "",
    expiry: "",
    cvc: "",
    name: "",
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      // Create payment intent
      const paymentIntent = await mockStripe.createPaymentIntent(amount)
      console.log("[v0] Created payment intent:", paymentIntent.id)

      // Create payment method
      const paymentMethod = await mockStripe.createPaymentMethod(cardDetails)
      console.log("[v0] Created payment method:", paymentMethod.id)

      // Confirm payment
      const confirmedPayment = await mockStripe.confirmPayment(paymentIntent.id, paymentMethod.id)
      console.log("[v0] Payment confirmed:", confirmedPayment.status)

      // Hold in escrow
      const escrowResult = await mockEscrow.holdPayment(confirmedPayment.id, amount)
      console.log("[v0] Payment held in escrow:", escrowResult.escrowId)

      onPaymentSuccess(confirmedPayment.id)
    } catch (error) {
      console.error("[v0] Payment failed:", error)
      onPaymentError("Payment failed. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (field: string, value: string) => {
    setCardDetails((prev) => ({ ...prev, [field]: value }))
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CreditCard className="w-5 h-5" />
          Payment Details
        </CardTitle>
        <CardDescription>Your payment will be held securely until confirmation at the airport.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="cardNumber">Card Number</Label>
            <Input
              id="cardNumber"
              placeholder="1234 5678 9012 3456"
              value={cardDetails.number}
              onChange={(e) => handleInputChange("number", e.target.value)}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="expiry">Expiry Date</Label>
              <Input
                id="expiry"
                placeholder="MM/YY"
                value={cardDetails.expiry}
                onChange={(e) => handleInputChange("expiry", e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cvc">CVC</Label>
              <Input
                id="cvc"
                placeholder="123"
                value={cardDetails.cvc}
                onChange={(e) => handleInputChange("cvc", e.target.value)}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="cardName">Cardholder Name</Label>
            <Input
              id="cardName"
              placeholder="John Doe"
              value={cardDetails.name}
              onChange={(e) => handleInputChange("name", e.target.value)}
              required
            />
          </div>

          <div className="p-4 bg-muted rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <Lock className="w-4 h-4 text-green-600" />
              <span className="text-sm font-medium">Secure Escrow Payment</span>
            </div>
            <p className="text-sm text-muted-foreground">
              Your payment of <strong>{formatCurrency(amount)}</strong> will be held securely until both parties
              confirm the baggage transfer at the airport.
            </p>
          </div>

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Processing Payment..." : `Pay ${formatCurrency(amount)}`}
          </Button>

          <p className="text-xs text-muted-foreground text-center">
            This is a demo payment form. No real charges will be made.
          </p>
        </form>
      </CardContent>
    </Card>
  )
}
