import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-06-20',
})

export interface PaymentIntentData {
  amount: number // in paise (cents for INR)
  currency: string
  matchId: string
  buyerId: string
  sellerId: string
}

export class StripeService {
  /**
   * Create a PaymentIntent with manual capture for escrow
   */
  static async createPaymentIntent(data: PaymentIntentData): Promise<Stripe.PaymentIntent> {
    const paymentIntent = await stripe.paymentIntents.create({
      amount: data.amount,
      currency: data.currency,
      capture_method: 'manual', // Hold funds until confirmation
      metadata: {
        match_id: data.matchId,
        buyer_id: data.buyerId,
        seller_id: data.sellerId,
        service: 'bagswap'
      },
      description: `BagSwap Match ${data.matchId} - Baggage allowance sharing`
    })

    return paymentIntent
  }

  /**
   * Capture a PaymentIntent (release funds from escrow)
   */
  static async capturePaymentIntent(paymentIntentId: string): Promise<Stripe.PaymentIntent> {
    const paymentIntent = await stripe.paymentIntents.capture(paymentIntentId)
    return paymentIntent
  }

  /**
   * Cancel a PaymentIntent (refund held funds)
   */
  static async cancelPaymentIntent(paymentIntentId: string): Promise<Stripe.PaymentIntent> {
    const paymentIntent = await stripe.paymentIntents.cancel(paymentIntentId)
    return paymentIntent
  }

  /**
   * Get PaymentIntent details
   */
  static async getPaymentIntent(paymentIntentId: string): Promise<Stripe.PaymentIntent> {
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId)
    return paymentIntent
  }

  /**
   * Create a confirmation token for frontend
   */
  static async createConfirmationToken(paymentIntentId: string): Promise<string> {
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId)
    return paymentIntent.client_secret!
  }
}

export default StripeService
