import { type NextRequest, NextResponse } from "next/server"

// Force this route to be dynamic since it uses request headers for webhook signature
export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const body = await request.text()
    const signature = request.headers.get("stripe-signature")

    // In a real implementation, verify the webhook signature
    console.log("[v0] Received Stripe webhook:", { body, signature })

    // Mock webhook event processing
    const event = JSON.parse(body)

    switch (event.type) {
      case "payment_intent.succeeded":
        console.log("[v0] Payment succeeded:", event.data.object.id)
        // Update match status and hold in escrow
        break

      case "payment_intent.payment_failed":
        console.log("[v0] Payment failed:", event.data.object.id)
        // Update match status to failed
        break

      default:
        console.log("[v0] Unhandled webhook event:", event.type)
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error("[v0] Webhook error:", error)
    return NextResponse.json({ error: "Webhook processing failed" }, { status: 400 })
  }
}
