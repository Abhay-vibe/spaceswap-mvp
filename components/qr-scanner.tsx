"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Camera, Hash } from "lucide-react"
import { validateQRData, type QRData } from "@/lib/qr-utils"

interface QRScannerProps {
  onScan: (data: QRData) => void
  onError: (error: string) => void
}

export function QRScanner({ onScan, onError }: QRScannerProps) {
  const [manualToken, setManualToken] = useState("")
  const [scanning, setScanning] = useState(false)

  const handleManualEntry = () => {
    if (!manualToken.trim()) {
      onError("Please enter a token")
      return
    }

    // Mock QR data for manual entry
    const mockData: QRData = {
      matchId: "mock_match_id",
      token: manualToken.toUpperCase(),
      type: "buyer",
      timestamp: Date.now(),
    }

    if (validateQRData(mockData)) {
      onScan(mockData)
    } else {
      onError("Invalid token format")
    }
  }

  const startCamera = () => {
    setScanning(true)
    // Mock camera scanning - in real app would use camera API
    setTimeout(() => {
      const mockScannedData: QRData = {
        matchId: "scanned_match_id",
        token: "SCAN123",
        type: "seller",
        timestamp: Date.now(),
      }
      onScan(mockScannedData)
      setScanning(false)
    }, 2000)
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Camera className="w-5 h-5" />
            Scan QR Code
          </CardTitle>
          <CardDescription>Scan the other party's QR code to confirm the baggage transfer</CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={startCamera} disabled={scanning} className="w-full">
            {scanning ? "Scanning..." : "Start Camera Scan"}
          </Button>
          {scanning && (
            <div className="mt-4 p-8 bg-muted rounded-lg text-center">
              <Camera className="w-12 h-12 mx-auto text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground">
                Mock camera scanning... This would open the camera in a real app.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Hash className="w-5 h-5" />
            Manual Entry
          </CardTitle>
          <CardDescription>Or enter the 8-character token manually</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="token">Token</Label>
            <Input
              id="token"
              placeholder="e.g., ABC12345"
              value={manualToken}
              onChange={(e) => setManualToken(e.target.value)}
              maxLength={8}
            />
          </div>
          <Button onClick={handleManualEntry} variant="outline" className="w-full bg-transparent">
            Confirm Token
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
