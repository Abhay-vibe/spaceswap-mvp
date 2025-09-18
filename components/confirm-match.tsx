"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { UploadBoardingPassModal } from "./upload-boarding-pass-modal"
import { formatCurrency } from "@/lib/currency"
import { 
  Users, 
  Shield, 
  CheckCircle, 
  Upload, 
  Phone, 
  Mail,
  Star,
  AlertTriangle
} from "lucide-react"

interface ContactInfo {
  name: string
  email: string
  phone: string
}

interface ConfirmMatchProps {
  matchId: string
  isUserBuyer: boolean
  otherUserContact: ContactInfo | null
  maskedContact: {
    name: string
    email: string
    phone: string
  }
  match: {
    quantityKg: number
    totalCents: number
  }
  flight: {
    flightNo: string
    date: Date
  }
  isVerified?: boolean
  trustScore?: number
  onAcceptAndReveal: () => void
  onConfirmTransfer: () => void
  onDecline?: () => void
  showContactInfo: boolean
  isAccepted: boolean
}

export function ConfirmMatch({
  matchId,
  isUserBuyer,
  otherUserContact,
  maskedContact,
  match,
  flight,
  isVerified = false,
  trustScore = 4.8,
  onAcceptAndReveal,
  onConfirmTransfer,
  onDecline,
  showContactInfo = false,
  isAccepted = false
}: ConfirmMatchProps) {
  const [showUploadModal, setShowUploadModal] = useState(false)
  const [boardingPassUploaded, setBoardingPassUploaded] = useState(false)
  const [confirming, setConfirming] = useState(false)

  const handleUploadSuccess = (imageUrl: string) => {
    setBoardingPassUploaded(true)
    setShowUploadModal(false)
    console.log('Boarding pass uploaded:', imageUrl)
  }

  const handleConfirm = async () => {
    setConfirming(true)
    try {
      await onConfirmTransfer()
    } finally {
      setConfirming(false)
    }
  }

  const displayContact = showContactInfo ? otherUserContact : null

  return (
    <div className="space-y-4">
      {/* Match Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            Match Details
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Flight</p>
              <p className="font-semibold">{flight.flightNo}</p>
              <p className="text-xs text-muted-foreground">
                {flight.date.toLocaleDateString('en-IN')}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Baggage Weight</p>
              <p className="font-semibold">{match.quantityKg} kg</p>
            </div>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Total Amount</p>
            <p className="font-bold text-green-600 text-lg">
              {formatCurrency(match.totalCents)}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Contact Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            {isUserBuyer ? 'Seller' : 'Buyer'} Information
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
            <div className="flex-1">
              <p className="font-semibold flex items-center gap-2">
                {displayContact?.name || maskedContact.name}
                {isVerified && <Shield className="w-4 h-4 text-green-600" />}
              </p>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                  <span>{trustScore}</span>
                </div>
                <span>•</span>
                <span>Verified ID</span>
              </div>
            </div>
          </div>

          {displayContact ? (
            <div className="space-y-2 p-3 bg-green-50 rounded-lg">
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-green-600" />
                <span className="text-sm">{displayContact.email}</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-green-600" />
                <span className="text-sm">{displayContact.phone}</span>
              </div>
            </div>
          ) : (
            <div className="space-y-2 p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-gray-400" />
                <span className="text-sm text-gray-500">{maskedContact.email}</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-gray-400" />
                <span className="text-sm text-gray-500">{maskedContact.phone}</span>
              </div>
              <p className="text-xs text-muted-foreground">
                Contact details will be revealed after acceptance
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Actions */}
      {!isAccepted && !showContactInfo && (
        <Card>
          <CardHeader>
            <CardTitle>Action Required</CardTitle>
            <CardDescription>
              {isUserBuyer 
                ? "Waiting for seller to accept your request"
                : "Accept this request to reveal contact information"
              }
            </CardDescription>
          </CardHeader>
          <CardContent>
            {!isUserBuyer && (
              <div className="flex gap-3">
                {onDecline && (
                  <Button 
                    variant="outline" 
                    onClick={onDecline}
                    className="flex-1"
                  >
                    Decline
                  </Button>
                )}
                <Button 
                  onClick={onAcceptAndReveal}
                  className="flex-1"
                >
                  Accept & Reveal Contact
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Confirmation Actions */}
      {isAccepted && showContactInfo && (
        <Card>
          <CardHeader>
            <CardTitle>Airport Confirmation</CardTitle>
            <CardDescription>
              Meet at the airport and confirm the baggage transfer
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <Button
                onClick={handleConfirm}
                disabled={confirming}
                className="w-full h-12"
              >
                <CheckCircle className="w-5 h-5 mr-2" />
                {confirming 
                  ? "Confirming..." 
                  : "I confirm - my bag will be checked under your allowance ✅"
                }
              </Button>

              <div className="text-center text-sm text-muted-foreground">or</div>

              <Button
                variant="outline"
                onClick={() => setShowUploadModal(true)}
                className="w-full h-12"
                disabled={boardingPassUploaded}
              >
                <Upload className="w-5 h-5 mr-2" />
                {boardingPassUploaded 
                  ? "Boarding Pass Uploaded ✅" 
                  : "Upload Boarding Pass Photo (Optional)"
                }
              </Button>

              {boardingPassUploaded && (
                <div className="flex items-center gap-2 p-3 bg-green-50 rounded-lg">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  <span className="text-sm text-green-700">
                    Boarding pass uploaded successfully!
                  </span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Legal Disclaimer */}
      {isAccepted && (
        <Card className="border-orange-200 bg-orange-50">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-orange-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-semibold text-orange-800 text-sm mb-1">
                  ⚠️ Disclaimer
                </p>
                <p className="text-xs text-orange-700">
                  Both parties agree that this arrangement is voluntary and they accept 
                  responsibility for their baggage. Do this at your own risk.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Upload Modal */}
      <UploadBoardingPassModal
        isOpen={showUploadModal}
        onClose={() => setShowUploadModal(false)}
        onUploadSuccess={handleUploadSuccess}
        matchId={matchId}
      />
    </div>
  )
}
