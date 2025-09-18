// QR code utilities for baggage confirmation
export interface QRData {
  matchId: string
  token: string
  type: "buyer" | "seller"
  timestamp: number
}

export function generateQRToken(): string {
  return Math.random().toString(36).substr(2, 8).toUpperCase()
}

export function createQRData(matchId: string, type: "buyer" | "seller"): QRData {
  return {
    matchId,
    token: generateQRToken(),
    type,
    timestamp: Date.now(),
  }
}

export function encodeQRData(data: QRData): string {
  return btoa(JSON.stringify(data))
}

export function decodeQRData(encoded: string): QRData | null {
  try {
    return JSON.parse(atob(encoded))
  } catch {
    return null
  }
}

export function validateQRData(data: QRData): boolean {
  const now = Date.now()
  const maxAge = 24 * 60 * 60 * 1000 // 24 hours

  return data.matchId && data.token && data.type && data.timestamp && now - data.timestamp < maxAge
}
