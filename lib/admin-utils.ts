// Admin utilities and mock data
import type { User, Match } from "./types"
import { MatchStatus } from "./types"

export interface AdminStats {
  totalUsers: number
  totalMatches: number
  totalRevenue: number
  activeListings: number
  disputedMatches: number
  completedMatches: number
}

export interface AdminUser extends User {
  totalBookings: number
  totalListings: number
  totalSpent: number
  totalEarned: number
  joinedDays: number
}

export interface AdminMatch extends Match {
  buyerName: string
  sellerName: string
  flightNo: string
  flightDate: string
}

// Mock admin data service
export const adminService = {
  async getStats(): Promise<AdminStats> {
    return {
      totalUsers: 1247,
      totalMatches: 892,
      totalRevenue: 12450.75,
      activeListings: 156,
      disputedMatches: 3,
      completedMatches: 834,
    }
  },

  async getUsers(): Promise<AdminUser[]> {
    return [
      {
        id: "user1",
        email: "john.doe@example.com",
        name: "John Doe",
        ratingAvg: 4.8,
        createdAt: new Date("2024-01-15"),
        totalBookings: 12,
        totalListings: 8,
        totalSpent: 245.5,
        totalEarned: 180.0,
        joinedDays: 45,
      },
      {
        id: "user2",
        email: "jane.smith@example.com",
        name: "Jane Smith",
        ratingAvg: 4.9,
        createdAt: new Date("2024-02-01"),
        totalBookings: 8,
        totalListings: 15,
        totalSpent: 120.0,
        totalEarned: 340.75,
        joinedDays: 28,
      },
      {
        id: "user3",
        email: "mike.wilson@example.com",
        name: "Mike Wilson",
        ratingAvg: 4.2,
        createdAt: new Date("2024-01-20"),
        totalBookings: 5,
        totalListings: 3,
        totalSpent: 85.25,
        totalEarned: 45.0,
        joinedDays: 40,
      },
    ]
  },

  async getMatches(): Promise<AdminMatch[]> {
    return [
      {
        id: "match1",
        listingId: "listing1",
        buyerId: "user1",
        quantityKg: 10,
        totalCents: 5000,
        status: MatchStatus.CONFIRMED,
        createdAt: new Date("2024-03-01"),
        updatedAt: new Date("2024-03-01"),
        buyerName: "John Doe",
        sellerName: "Jane Smith",
        flightNo: "AA123",
        flightDate: "2024-03-15",
      },
      {
        id: "match2",
        listingId: "listing2",
        buyerId: "user2",
        quantityKg: 5,
        totalCents: 2500,
        status: MatchStatus.DISPUTED,
        createdAt: new Date("2024-03-02"),
        updatedAt: new Date("2024-03-02"),
        buyerName: "Jane Smith",
        sellerName: "Mike Wilson",
        flightNo: "UA456",
        flightDate: "2024-03-20",
      },
      {
        id: "match3",
        listingId: "listing3",
        buyerId: "user3",
        quantityKg: 15,
        totalCents: 7500,
        status: MatchStatus.PENDING,
        createdAt: new Date("2024-03-03"),
        updatedAt: new Date("2024-03-03"),
        buyerName: "Mike Wilson",
        sellerName: "John Doe",
        flightNo: "DL789",
        flightDate: "2024-03-25",
      },
    ]
  },

  async resolveDispute(matchId: string, resolution: "refund" | "release"): Promise<boolean> {
    console.log(`[v0] Admin resolving dispute ${matchId} with ${resolution}`)
    return true
  },

  async suspendUser(userId: string, reason: string): Promise<boolean> {
    console.log(`[v0] Admin suspending user ${userId} for: ${reason}`)
    return true
  },
}
