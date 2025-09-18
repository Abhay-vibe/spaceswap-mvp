"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { formatCurrency } from "@/lib/currency"
import { 
  Plane, 
  Package, 
  Users, 
  Clock, 
  CheckCircle,
  AlertCircle,
  Star,
  Shield
} from "lucide-react"

interface DashboardCardProps {
  title: string
  description?: string
  icon?: React.ReactNode
  children?: React.ReactNode
  className?: string
}

export function DashboardCard({ title, description, icon, children, className = "" }: DashboardCardProps) {
  return (
    <Card className={`shadow-sm ${className}`}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          {icon}
          {title}
        </CardTitle>
        {description && (
          <CardDescription className="text-sm">{description}</CardDescription>
        )}
      </CardHeader>
      {children && <CardContent className="pt-0">{children}</CardContent>}
    </Card>
  )
}

interface ListingCardProps {
  flight: {
    flightNo: string
    date: Date
    airline?: string
  }
  weightKg: number
  pricePerKg: number
  pendingRequests: number
  isVerified?: boolean
  trustScore?: number
  onViewRequests: () => void
  onEditListing: () => void
}

export function ListingCard({ 
  flight, 
  weightKg, 
  pricePerKg, 
  pendingRequests,
  isVerified = false,
  trustScore = 4.8,
  onViewRequests,
  onEditListing 
}: ListingCardProps) {
  const totalEarnings = weightKg * pricePerKg;

  return (
    <Card className="shadow-sm hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2">
            <Plane className="w-5 h-5 text-blue-600" />
            <div>
              <p className="font-semibold text-sm">{flight.flightNo}</p>
              <p className="text-xs text-muted-foreground">
                {flight.date.toLocaleDateString('en-IN')}
                {flight.airline && ` • ${flight.airline}`}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            {isVerified && (
              <Shield className="w-4 h-4 text-green-600" />
            )}
            <div className="flex items-center gap-1">
              <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
              <span className="text-xs text-muted-foreground">{trustScore}</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 mb-3">
          <div>
            <p className="text-xs text-muted-foreground">Available</p>
            <p className="font-semibold text-sm">{weightKg} kg</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Per kg</p>
            <p className="font-semibold text-sm">{formatCurrency(pricePerKg)}</p>
          </div>
        </div>

        <div className="flex items-center justify-between mb-3">
          <div>
            <p className="text-xs text-muted-foreground">Potential earnings</p>
            <p className="font-bold text-green-600">{formatCurrency(totalEarnings)}</p>
          </div>
          {pendingRequests > 0 && (
            <Badge variant="secondary" className="text-xs">
              {pendingRequests} request{pendingRequests > 1 ? 's' : ''}
            </Badge>
          )}
        </div>

        <div className="flex gap-2">
          <Button 
            size="sm" 
            variant="outline" 
            onClick={onEditListing}
            className="flex-1 text-xs h-8"
          >
            Edit
          </Button>
          <Button 
            size="sm" 
            onClick={onViewRequests}
            className="flex-1 text-xs h-8"
            disabled={pendingRequests === 0}
          >
            {pendingRequests > 0 ? 'View Requests' : 'No Requests'}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

interface RequestCardProps {
  buyerName: string
  flight: {
    flightNo: string
    date: Date
  }
  requestedKg: number
  offeredPrice: number
  timeAgo: string
  isVerified?: boolean
  onAccept: () => void
  onDecline: () => void
}

export function RequestCard({
  buyerName,
  flight,
  requestedKg,
  offeredPrice,
  timeAgo,
  isVerified = false,
  onAccept,
  onDecline
}: RequestCardProps) {
  const maskedName = buyerName.charAt(0) + '. ' + buyerName.split(' ')[1]?.charAt(0) + '*****';
  
  return (
    <Card className="shadow-sm">
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-blue-600" />
            <div>
              <p className="font-semibold text-sm flex items-center gap-1">
                {maskedName}
                {isVerified && <Shield className="w-3 h-3 text-green-600" />}
              </p>
              <p className="text-xs text-muted-foreground">{timeAgo}</p>
            </div>
          </div>
          <Clock className="w-4 h-4 text-orange-500" />
        </div>

        <div className="grid grid-cols-2 gap-3 mb-3">
          <div>
            <p className="text-xs text-muted-foreground">Flight</p>
            <p className="font-semibold text-sm">{flight.flightNo}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Weight needed</p>
            <p className="font-semibold text-sm">{requestedKg} kg</p>
          </div>
        </div>

        <div className="mb-3">
          <p className="text-xs text-muted-foreground">Offering</p>
          <p className="font-bold text-green-600">{formatCurrency(offeredPrice)}</p>
        </div>

        <div className="flex gap-2">
          <Button 
            size="sm" 
            variant="outline" 
            onClick={onDecline}
            className="flex-1 text-xs h-8"
          >
            Decline
          </Button>
          <Button 
            size="sm" 
            onClick={onAccept}
            className="flex-1 text-xs h-8"
          >
            Accept & Reveal Contact
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

interface AvailableListingCardProps {
  flight: {
    flightNo: string
    date: Date
    airline?: string
  }
  sellerName: string
  weightKg: number
  pricePerKg: number
  isVerified?: boolean
  trustScore?: number
  matchHistory: number
  onBook: () => void
}

export function AvailableListingCard({
  flight,
  sellerName,
  weightKg,
  pricePerKg,
  isVerified = false,
  trustScore = 4.8,
  matchHistory = 0,
  onBook
}: AvailableListingCardProps) {
  const maskedSellerName = sellerName.charAt(0) + '. ' + sellerName.split(' ')[1]?.charAt(0) + '*****';

  return (
    <Card className="shadow-sm hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2">
            <Package className="w-5 h-5 text-green-600" />
            <div>
              <p className="font-semibold text-sm">{flight.flightNo}</p>
              <p className="text-xs text-muted-foreground">
                {flight.date.toLocaleDateString('en-IN')}
                {flight.airline && ` • ${flight.airline}`}
              </p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-xs text-muted-foreground">Available</p>
            <p className="font-semibold text-sm">{weightKg} kg</p>
          </div>
        </div>

        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
              <Users className="w-4 h-4 text-blue-600" />
            </div>
            <div>
              <p className="font-semibold text-sm flex items-center gap-1">
                {maskedSellerName}
                {isVerified && <Shield className="w-3 h-3 text-green-600" />}
              </p>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                  <span>{trustScore}</span>
                </div>
                <span>•</span>
                <span>{matchHistory} swaps</span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between mb-3">
          <div>
            <p className="text-xs text-muted-foreground">Price per kg</p>
            <p className="font-bold text-green-600">{formatCurrency(pricePerKg)}</p>
          </div>
        </div>

        <Button 
          size="sm" 
          onClick={onBook}
          className="w-full text-xs h-8"
        >
          Book Now 🎒
        </Button>
      </CardContent>
    </Card>
  )
}
