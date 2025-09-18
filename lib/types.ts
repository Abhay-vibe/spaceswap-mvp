export interface User {
  id: string
  email: string
  name?: string
  avatarUrl?: string
  ratingAvg: number
  createdAt: Date
}

export interface Flight {
  id: string
  airline?: string
  flightNo: string
  date: Date
  createdAt: Date
}

export interface Listing {
  id: string
  sellerId: string
  seller?: User
  flightId: string
  flight?: Flight
  weightKg: number
  pricePerKg: number // in cents
  autoAccept: boolean
  active: boolean
  createdAt: Date
}

export interface Match {
  id: string
  listingId: string
  listing?: Listing
  buyerId: string
  buyer?: User
  quantityKg: number
  totalCents: number
  stripePaymentIntentId?: string
  status: MatchStatus
  qrToken?: string
  createdAt: Date
  updatedAt: Date
}

export enum MatchStatus {
  PENDING = "PENDING",
  ACCEPTED = "ACCEPTED",
  CONFIRMED = "CONFIRMED",
  RELEASED = "RELEASED",
  DISPUTED = "DISPUTED",
  CANCELLED = "CANCELLED",
}
