"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { CheckCircle, Info } from "lucide-react"
import { formatCurrency } from "@/lib/currency"

interface PaymentFormProps {
  amount: number
  onPaymentSuccess: (paymentIntentId: string) => void
  onPaymentError: (error: string) => void
}

export function PaymentForm({ amount, onPaymentSuccess, onPaymentError }: PaymentFormProps) {
  const [loading, setLoading] = useState(false)

  const handleConfirm = async () => {
    setLoading(true)

    try {
      // Simulate processing delay
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      // Generate a mock transaction ID
      const transactionId = `txn_${Math.random().toString(36).substr(2, 9)}`
      console.log("[v0] Transaction confirmed:", transactionId)

      onPaymentSuccess(transactionId)
    } catch (error) {
      console.error("[v0] Confirmation failed:", error)
      onPaymentError("Confirmation failed. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CheckCircle className="w-5 h-5" />
          Confirm Booking
        </CardTitle>
        <CardDescription>Confirm your baggage booking request</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="p-4 bg-muted rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <Info className="w-4 h-4 text-blue-600" />
              <span className="text-sm font-medium">Booking Amount</span>
            </div>
            <p className="text-sm text-muted-foreground">
              Total amount: <strong>{formatCurrency(amount)}</strong>
            </p>
            <p className="text-xs text-muted-foreground mt-2">
              Payment will be handled at the airport upon baggage transfer confirmation.
            </p>
          </div>

          <Button onClick={handleConfirm} className="w-full" disabled={loading}>
            {loading ? "Confirming..." : `Confirm Booking for ${formatCurrency(amount)}`}
          </Button>

          <p className="text-xs text-muted-foreground text-center">
            No payment required at this time. This is a booking confirmation only.
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
