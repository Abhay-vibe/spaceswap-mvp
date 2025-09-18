"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/components/auth-provider"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Shield,
  Users,
  Package,
  DollarSign,
  AlertTriangle,
  CheckCircle,
  ArrowLeft,
  MoreHorizontal,
  Ban,
} from "lucide-react"
import Link from "next/link"
import { adminService, type AdminStats, type AdminUser, type AdminMatch } from "@/lib/admin-utils"
import { MatchStatus } from "@/lib/types"

export default function AdminDashboard() {
  const { user } = useAuth()
  const [stats, setStats] = useState<AdminStats | null>(null)
  const [users, setUsers] = useState<AdminUser[]>([])
  const [matches, setMatches] = useState<AdminMatch[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadAdminData = async () => {
      try {
        const [statsData, usersData, matchesData] = await Promise.all([
          adminService.getStats(),
          adminService.getUsers(),
          adminService.getMatches(),
        ])

        setStats(statsData)
        setUsers(usersData)
        setMatches(matchesData)
      } catch (error) {
        console.error("Failed to load admin data:", error)
      } finally {
        setLoading(false)
      }
    }

    loadAdminData()
  }, [])

  const handleResolveDispute = async (matchId: string, resolution: "refund" | "release") => {
    try {
      await adminService.resolveDispute(matchId, resolution)
      // Refresh matches data
      const updatedMatches = await adminService.getMatches()
      setMatches(updatedMatches)
    } catch (error) {
      console.error("Failed to resolve dispute:", error)
    }
  }

  const handleSuspendUser = async (userId: string, reason: string) => {
    try {
      await adminService.suspendUser(userId, reason)
      // Refresh users data
      const updatedUsers = await adminService.getUsers()
      setUsers(updatedUsers)
    } catch (error) {
      console.error("Failed to suspend user:", error)
    }
  }

  if (!user) {
    return <div className="min-h-screen bg-background flex items-center justify-center">Please log in</div>
  }

  if (loading) {
    return <div className="min-h-screen bg-background flex items-center justify-center">Loading admin dashboard...</div>
  }

  const getStatusBadge = (status: MatchStatus) => {
    const variants = {
      [MatchStatus.PENDING]: { variant: "secondary" as const, label: "Pending" },
      [MatchStatus.ACCEPTED]: { variant: "default" as const, label: "Accepted" },
      [MatchStatus.CONFIRMED]: { variant: "default" as const, label: "Confirmed" },
      [MatchStatus.RELEASED]: { variant: "default" as const, label: "Released" },
      [MatchStatus.CANCELLED]: { variant: "destructive" as const, label: "Cancelled" },
      [MatchStatus.DISPUTED]: { variant: "destructive" as const, label: "Disputed" },
    }

    const config = variants[status]
    return <Badge variant={config.variant}>{config.label}</Badge>
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto px-4 py-4 flex items-center gap-4">
          <Link href="/">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to App
            </Button>
          </Link>
          <div className="flex items-center gap-2">
            <Shield className="w-6 h-6 text-blue-600" />
            <h1 className="text-xl font-bold">Admin Dashboard</h1>
          </div>
          <div className="ml-auto">
            <Badge variant="secondary">Admin: {user.name || user.email}</Badge>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Stats Overview */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-blue-600" />
                  <div>
                    <p className="text-2xl font-bold">{stats.totalUsers.toLocaleString()}</p>
                    <p className="text-xs text-muted-foreground">Total Users</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <Package className="w-4 h-4 text-green-600" />
                  <div>
                    <p className="text-2xl font-bold">{stats.totalMatches.toLocaleString()}</p>
                    <p className="text-xs text-muted-foreground">Total Matches</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-green-600" />
                  <div>
                    <p className="text-2xl font-bold">${stats.totalRevenue.toLocaleString()}</p>
                    <p className="text-xs text-muted-foreground">Total Revenue</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <Package className="w-4 h-4 text-blue-600" />
                  <div>
                    <p className="text-2xl font-bold">{stats.activeListings}</p>
                    <p className="text-xs text-muted-foreground">Active Listings</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-red-600" />
                  <div>
                    <p className="text-2xl font-bold">{stats.disputedMatches}</p>
                    <p className="text-xs text-muted-foreground">Disputes</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  <div>
                    <p className="text-2xl font-bold">{stats.completedMatches}</p>
                    <p className="text-xs text-muted-foreground">Completed</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Main Content Tabs */}
        <Tabs defaultValue="users" className="space-y-6">
          <TabsList>
            <TabsTrigger value="users">Users</TabsTrigger>
            <TabsTrigger value="matches">Matches</TabsTrigger>
            <TabsTrigger value="disputes">Disputes</TabsTrigger>
          </TabsList>

          {/* Users Tab */}
          <TabsContent value="users">
            <Card>
              <CardHeader>
                <CardTitle>User Management</CardTitle>
                <CardDescription>Manage platform users and their activity</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {users.map((user) => (
                    <div key={user.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex-1">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                            <Users className="w-5 h-5 text-blue-600" />
                          </div>
                          <div>
                            <p className="font-semibold">{user.name}</p>
                            <p className="text-sm text-muted-foreground">{user.email}</p>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-6 text-sm">
                        <div className="text-center">
                          <p className="font-semibold">{user.totalBookings}</p>
                          <p className="text-muted-foreground">Bookings</p>
                        </div>
                        <div className="text-center">
                          <p className="font-semibold">{user.totalListings}</p>
                          <p className="text-muted-foreground">Listings</p>
                        </div>
                        <div className="text-center">
                          <p className="font-semibold">${user.totalEarned.toFixed(2)}</p>
                          <p className="text-muted-foreground">Earned</p>
                        </div>
                        <div className="text-center">
                          <p className="font-semibold">{user.ratingAvg.toFixed(1)}</p>
                          <p className="text-muted-foreground">Rating</p>
                        </div>
                        <Button variant="outline" size="sm" onClick={() => handleSuspendUser(user.id, "Admin action")}>
                          <Ban className="w-4 h-4 mr-1" />
                          Suspend
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Matches Tab */}
          <TabsContent value="matches">
            <Card>
              <CardHeader>
                <CardTitle>Transaction Management</CardTitle>
                <CardDescription>Monitor all platform transactions and matches</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {matches.map((match) => (
                    <div key={match.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex-1">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                            <Package className="w-5 h-5 text-green-600" />
                          </div>
                          <div>
                            <p className="font-semibold">
                              {match.buyerName} → {match.sellerName}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              Flight {match.flightNo} • {match.flightDate} • {match.quantityKg} kg
                            </p>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className="font-semibold">${(match.totalCents / 100).toFixed(2)}</p>
                          <p className="text-sm text-muted-foreground">{match.createdAt.toLocaleDateString()}</p>
                        </div>
                        {getStatusBadge(match.status)}
                        <Button variant="ghost" size="sm">
                          <MoreHorizontal className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Disputes Tab */}
          <TabsContent value="disputes">
            <Card>
              <CardHeader>
                <CardTitle>Dispute Resolution</CardTitle>
                <CardDescription>Handle disputed transactions and user conflicts</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {matches
                    .filter((m) => m.status === MatchStatus.DISPUTED)
                    .map((match) => (
                      <div key={match.id} className="p-4 border border-red-200 rounded-lg bg-red-50">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <AlertTriangle className="w-5 h-5 text-red-600" />
                              <p className="font-semibold">Disputed Transaction</p>
                              <Badge variant="destructive">Requires Action</Badge>
                            </div>
                            <p className="text-sm mb-2">
                              <strong>Parties:</strong> {match.buyerName} (Buyer) ↔ {match.sellerName} (Seller)
                            </p>
                            <p className="text-sm mb-2">
                              <strong>Flight:</strong> {match.flightNo} on {match.flightDate}
                            </p>
                            <p className="text-sm mb-4">
                              <strong>Amount:</strong> ${(match.totalCents / 100).toFixed(2)} for {match.quantityKg} kg
                            </p>
                            <p className="text-sm text-muted-foreground mb-4">
                              Dispute reported on {match.updatedAt.toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            onClick={() => handleResolveDispute(match.id, "refund")}
                            className="bg-red-600 hover:bg-red-700"
                          >
                            Refund Buyer
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => handleResolveDispute(match.id, "release")}
                            className="bg-green-600 hover:bg-green-700"
                          >
                            Release to Seller
                          </Button>
                          <Button variant="outline" size="sm">
                            Contact Parties
                          </Button>
                        </div>
                      </div>
                    ))}

                  {matches.filter((m) => m.status === MatchStatus.DISPUTED).length === 0 && (
                    <div className="text-center py-8">
                      <CheckCircle className="w-12 h-12 mx-auto text-green-600 mb-4" />
                      <h3 className="text-lg font-semibold mb-2">No Active Disputes</h3>
                      <p className="text-muted-foreground">All transactions are running smoothly!</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}
