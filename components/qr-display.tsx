"use client"

import { useEffect, useRef } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { QrCode, Download } from "lucide-react"
import { Button } from "@/components/ui/button"
import type { QRData } from "@/lib/qr-utils"

interface QRDisplayProps {
  data: QRData
  title: string
  description: string
}

export function QRDisplay({ data, title, description }: QRDisplayProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const generateQR = async () => {
      if (!canvasRef.current) return

      // Mock QR code generation - in real app use qrcode library
      const canvas = canvasRef.current
      const ctx = canvas.getContext("2d")
      if (!ctx) return

      // Create a simple pattern as mock QR code
      const size = 200
      canvas.width = size
      canvas.height = size

      // White background
      ctx.fillStyle = "#ffffff"
      ctx.fillRect(0, 0, size, size)

      // Black squares pattern (mock QR)
      ctx.fillStyle = "#000000"
      const squareSize = 10

      for (let i = 0; i < size; i += squareSize) {
        for (let j = 0; j < size; j += squareSize) {
          if (Math.random() > 0.5) {
            ctx.fillRect(i, j, squareSize, squareSize)
          }
        }
      }

      // Add corner markers
      const markerSize = 30
      ctx.fillRect(0, 0, markerSize, markerSize)
      ctx.fillRect(size - markerSize, 0, markerSize, markerSize)
      ctx.fillRect(0, size - markerSize, markerSize, markerSize)
    }

    generateQR()
  }, [data])

  const downloadQR = () => {
    if (!canvasRef.current) return

    const link = document.createElement("a")
    link.download = `bagswap-qr-${data.type}-${data.token}.png`
    link.href = canvasRef.current.toDataURL()
    link.click()
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <QrCode className="w-5 h-5" />
          {title}
        </CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex justify-center">
          <div className="p-4 bg-white rounded-lg border">
            <canvas ref={canvasRef} className="block" />
          </div>
        </div>

        <div className="text-center space-y-2">
          <Badge variant="secondary" className="text-lg px-3 py-1">
            {data.token}
          </Badge>
          <p className="text-sm text-muted-foreground">Show this QR code to the other party at the airport</p>
        </div>

        <Button onClick={downloadQR} variant="outline" className="w-full bg-transparent">
          <Download className="w-4 h-4 mr-2" />
          Download QR Code
        </Button>
      </CardContent>
    </Card>
  )
}
