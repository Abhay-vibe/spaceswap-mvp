"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { User, Mail, Phone, Plane } from "lucide-react"

interface UserInfoFormProps {
  title: string
  description: string
  onSubmit: (userInfo: { name: string; email: string; phone: string }) => void
  loading?: boolean
}

export function UserInfoForm({ title, description, onSubmit, loading = false }: UserInfoFormProps) {
  const [userInfo, setUserInfo] = useState({
    name: "",
    email: "",
    phone: "",
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit(userInfo)
  }

  const handleInputChange = (field: string, value: string) => {
    setUserInfo(prev => ({ ...prev, [field]: value }))
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-md mx-auto">
          <div className="text-center mb-8">
            <div className="flex items-center justify-center gap-2 mb-4">
              <Plane className="w-8 h-8 text-blue-600" />
              <h1 className="text-2xl font-bold">SpaceSwap</h1>
            </div>
            <p className="text-muted-foreground">Share baggage space, save money, help fellow travelers</p>
          </div>

          <Card className="shadow-lg">
            <CardHeader className="text-center">
              <CardTitle className="flex items-center justify-center gap-2">
                <User className="w-5 h-5" />
                {title}
              </CardTitle>
              <CardDescription>{description}</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name</Label>
                  <Input
                    id="name"
                    placeholder="John Doe"
                    value={userInfo.name}
                    onChange={(e) => handleInputChange("name", e.target.value)}
                    required
                    className="h-12"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="john@example.com"
                    value={userInfo.email}
                    onChange={(e) => handleInputChange("email", e.target.value)}
                    required
                    className="h-12"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="+91-9876543210"
                    value={userInfo.phone}
                    onChange={(e) => handleInputChange("phone", e.target.value)}
                    required
                    className="h-12"
                  />
                </div>

                <Button type="submit" className="w-full h-12" disabled={loading}>
                  {loading ? "Please wait..." : "Continue"}
                </Button>

                <p className="text-xs text-center text-muted-foreground">
                  Your information is secure and will only be shared when you accept a booking.
                </p>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
