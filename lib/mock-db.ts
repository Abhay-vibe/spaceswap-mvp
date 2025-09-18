// Mock database for MVP - replace with real database later
import type { User, Flight, Listing, Match, MatchStatus } from "./types"

// In-memory storage (replace with real database)
const users: User[] = []
const flights: Flight[] = []
const listings: Listing[] = []
const matches: Match[] = []

// Mock current user for demo
let currentUser: User | null = null

export const mockDb = {
  // Users
  async createUser(userData: Omit<User, "id" | "createdAt" | "ratingAvg">): Promise<User> {
    const user: User = {
      id: Math.random().toString(36).substr(2, 9),
      ratingAvg: 0,
      createdAt: new Date(),
      ...userData,
    }
    users.push(user)
    return user
  },

  async getUserByEmail(email: string): Promise<User | null> {
    return users.find((u) => u.email === email) || null
  },

  async getCurrentUser(): Promise<User | null> {
    return currentUser
  },

  async setCurrentUser(user: User | null): Promise<void> {
    currentUser = user
  },

  // Flights
  async findOrCreateFlight(flightNo: string, date: Date, airline?: string): Promise<Flight> {
    const existing = flights.find((f) => f.flightNo === flightNo && f.date.toDateString() === date.toDateString())

    if (existing) return existing

    const flight: Flight = {
      id: Math.random().toString(36).substr(2, 9),
      flightNo,
      date,
      airline,
      createdAt: new Date(),
    }
    flights.push(flight)
    return flight
  },

  async getFlightById(id: string): Promise<Flight | null> {
    return flights.find((f) => f.id === id) || null
  },

  // Listings
  async createListing(listingData: Omit<Listing, "id" | "createdAt">): Promise<Listing> {
    const listing: Listing = {
      id: Math.random().toString(36).substr(2, 9),
      createdAt: new Date(),
      ...listingData,
    }
    listings.push(listing)
    return listing
  },

  async getListingsByFlight(flightId: string): Promise<Listing[]> {
    return listings.filter((l) => l.flightId === flightId && l.active)
  },

  async getListingById(id: string): Promise<Listing | null> {
    return listings.find((l) => l.id === id) || null
  },

  // Matches
  async createMatch(matchData: Omit<Match, "id" | "createdAt" | "updatedAt">): Promise<Match> {
    const match: Match = {
      id: Math.random().toString(36).substr(2, 9),
      createdAt: new Date(),
      updatedAt: new Date(),
      qrToken: Math.random().toString(36).substr(2, 8).toUpperCase(),
      ...matchData,
    }
    matches.push(match)
    return match
  },

  async getMatchById(id: string): Promise<Match | null> {
    return matches.find((m) => m.id === id) || null
  },

  async updateMatchStatus(id: string, status: MatchStatus): Promise<Match | null> {
    const match = matches.find((m) => m.id === id)
    if (match) {
      match.status = status
      match.updatedAt = new Date()
    }
    return match || null
  },

  async getMatchesByUser(userId: string): Promise<Match[]> {
    return matches.filter((m) => m.buyerId === userId)
  },

  async getListingsByUser(userId: string): Promise<Listing[]> {
    return listings.filter((l) => l.sellerId === userId && l.active)
  },

  async getRequestsForUser(userId: string): Promise<Match[]> {
    // Get matches where user is the seller (requests to their listings)
    const userListings = listings.filter((l) => l.sellerId === userId)
    const userListingIds = userListings.map((l) => l.id)
    return matches.filter((m) => userListingIds.includes(m.listingId) && m.status === "PENDING")
  },

  async getAvailableListingsForUser(userId: string): Promise<Listing[]> {
    // Mock: return some random available listings
    return listings.filter((l) => l.sellerId !== userId && l.active)
  },

  // Seed data for demo
  async seedData(): Promise<void> {
    // Create demo user
    const demoUser = await this.createUser({
      email: "demo@example.com",
      name: "Demo User",
    })

    // Create demo flight
    const demoFlight = await this.findOrCreateFlight("AA123", new Date("2024-12-25"), "American Airlines")

    // Create demo listing
    await this.createListing({
      sellerId: demoUser.id,
      flightId: demoFlight.id,
      weightKg: 15,
      pricePerKg: 500, // $5.00 per kg
      autoAccept: true,
      active: true,
    })
  },
}
