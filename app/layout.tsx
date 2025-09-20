import type React from "react"
import type { Metadata } from "next"
import { GeistSans } from "geist/font/sans"
import { GeistMono } from "geist/font/mono"
import { Analytics } from "@vercel/analytics/next"
import { AuthProvider } from "@/components/auth-provider"
import { ErrorBoundaryWrapper } from "@/components/error-boundary"
import { ConfigStatusBanner } from "@/components/config-status"
import { Suspense } from "react"
import "./globals.css"

export const metadata: Metadata = {
  title: "BagSwap - Share Baggage Allowance",
  description: "P2P platform for sharing baggage allowance between travelers",
  generator: "v0.app",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={`font-sans ${GeistSans.variable} ${GeistMono.variable}`}>
        <ErrorBoundaryWrapper>
          <ConfigStatusBanner />
          <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-gray-600">Loading SpaceSwap...</p>
              </div>
            </div>
          }>
            <AuthProvider>{children}</AuthProvider>
          </Suspense>
        </ErrorBoundaryWrapper>
        <Analytics />
      </body>
    </html>
  )
}
