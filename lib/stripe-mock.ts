// Mock Stripe implementation for MVP demo
// Replace with real Stripe integration when ready

export interface PaymentIntent {
  id: string
  amount: number
  currency: string
  status:
    | "requires_payment_method"
    | "requires_confirmation"
    | "requires_action"
    | "processing"
    | "requires_capture"
    | "canceled"
    | "succeeded"
  client_secret: string
  created: number
}

export interface PaymentMethod {
  id: string
  type: "card"
  card: {
    brand: string
    last4: string
    exp_month: number
    exp_year: number
  }
}

// Mock Stripe client
export const mockStripe = {
  async createPaymentIntent(amount: number, currency = "usd"): Promise<PaymentIntent> {
    return {
      id: `pi_${Math.random().toString(36).substr(2, 9)}`,
      amount,
      currency,
      status: "requires_payment_method",
      client_secret: `pi_${Math.random().toString(36).substr(2, 9)}_secret_${Math.random().toString(36).substr(2, 9)}`,
      created: Date.now(),
    }
  },

  async confirmPayment(paymentIntentId: string, paymentMethodId: string): Promise<PaymentIntent> {
    return {
      id: paymentIntentId,
      amount: 1000, // Mock amount
      currency: "usd",
      status: "succeeded",
      client_secret: `${paymentIntentId}_secret_confirmed`,
      created: Date.now(),
    }
  },

  async createPaymentMethod(cardDetails: any): Promise<PaymentMethod> {
    return {
      id: `pm_${Math.random().toString(36).substr(2, 9)}`,
      type: "card",
      card: {
        brand: "visa",
        last4: "4242",
        exp_month: 12,
        exp_year: 2025,
      },
    }
  },

  async capturePayment(paymentIntentId: string): Promise<PaymentIntent> {
    return {
      id: paymentIntentId,
      amount: 1000,
      currency: "usd",
      status: "succeeded",
      client_secret: `${paymentIntentId}_secret_captured`,
      created: Date.now(),
    }
  },
}

// Mock escrow service
export const mockEscrow = {
  async holdPayment(paymentIntentId: string, amount: number): Promise<{ success: boolean; escrowId: string }> {
    console.log(`[v0] Holding payment ${paymentIntentId} for amount ${amount} in escrow`)
    return {
      success: true,
      escrowId: `escrow_${Math.random().toString(36).substr(2, 9)}`,
    }
  },

  async releasePayment(escrowId: string, sellerId: string): Promise<{ success: boolean; transferId: string }> {
    console.log(`[v0] Releasing escrow payment ${escrowId} to seller ${sellerId}`)
    return {
      success: true,
      transferId: `tr_${Math.random().toString(36).substr(2, 9)}`,
    }
  },

  async refundPayment(escrowId: string): Promise<{ success: boolean; refundId: string }> {
    console.log(`[v0] Refunding escrow payment ${escrowId}`)
    return {
      success: true,
      refundId: `re_${Math.random().toString(36).substr(2, 9)}`,
    }
  },
}
