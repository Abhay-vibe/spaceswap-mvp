"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Camera, Upload, X, CheckCircle } from "lucide-react"

interface UploadBoardingPassModalProps {
  isOpen: boolean
  onClose: () => void
  onUploadSuccess: (imageUrl: string) => void
  matchId: string
}

export function UploadBoardingPassModal({
  isOpen,
  onClose,
  onUploadSuccess,
  matchId
}: UploadBoardingPassModalProps) {
  const [uploading, setUploading] = useState(false)
  const [uploadedImage, setUploadedImage] = useState<string | null>(null)
  const [dragOver, setDragOver] = useState(false)

  if (!isOpen) return null

  const handleFileSelect = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file')
      return
    }

    if (file.size > 5 * 1024 * 1024) { // 5MB limit
      alert('File size must be less than 5MB')
      return
    }

    setUploading(true)

    try {
      // Convert to base64 for demo (in production, upload to S3/CloudStorage)
      const reader = new FileReader()
      reader.onload = async (e) => {
        const base64 = e.target?.result as string
        
        // Mock API call - in production, upload to /api/uploads
        await new Promise(resolve => setTimeout(resolve, 1500)) // Simulate upload
        
        setUploadedImage(base64)
        setUploading(false)
        
        // Mock API response
        const mockImageUrl = `https://example.com/boarding-passes/${matchId}-${Date.now()}.jpg`
        onUploadSuccess(mockImageUrl)
      }
      reader.readAsDataURL(file)
    } catch (error) {
      console.error('Upload failed:', error)
      setUploading(false)
      alert('Upload failed. Please try again.')
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer.files[0]
    if (file) {
      handleFileSelect(file)
    }
  }

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      handleFileSelect(file)
    }
  }

  const startCamera = async () => {
    try {
      // Mock camera capture - in production, use camera API
      setUploading(true)
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      // Mock captured image
      const mockCapturedImage = "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABmX/9k="
      
      setUploadedImage(mockCapturedImage)
      setUploading(false)
      
      const mockImageUrl = `https://example.com/boarding-passes/${matchId}-camera-${Date.now()}.jpg`
      onUploadSuccess(mockImageUrl)
    } catch (error) {
      console.error('Camera capture failed:', error)
      setUploading(false)
      alert('Camera capture failed. Please try file upload instead.')
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-md">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Upload className="w-5 h-5" />
              Upload Boarding Pass
            </CardTitle>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          </div>
          <CardDescription>
            Optional: Upload your boarding pass as proof of check-in (helps build trust)
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {uploadedImage ? (
            <div className="space-y-4">
              <div className="flex items-center gap-2 p-3 bg-green-50 rounded-lg">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <span className="text-sm text-green-700">Boarding pass uploaded successfully!</span>
              </div>
              <img 
                src={uploadedImage} 
                alt="Uploaded boarding pass" 
                className="w-full h-32 object-cover rounded-lg border"
              />
              <Button onClick={onClose} className="w-full">
                Done
              </Button>
            </div>
          ) : (
            <>
              {/* Camera Option */}
              <Button
                onClick={startCamera}
                disabled={uploading}
                className="w-full"
                variant="outline"
              >
                <Camera className="w-4 h-4 mr-2" />
                {uploading ? "Capturing..." : "Take Photo"}
              </Button>

              <div className="text-center text-sm text-muted-foreground">or</div>

              {/* File Upload */}
              <div
                className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
                  dragOver ? "border-blue-400 bg-blue-50" : "border-gray-300"
                } ${uploading ? "opacity-50" : ""}`}
                onDrop={handleDrop}
                onDragOver={(e) => {
                  e.preventDefault()
                  setDragOver(true)
                }}
                onDragLeave={() => setDragOver(false)}
              >
                <Upload className="w-8 h-8 mx-auto text-gray-400 mb-2" />
                <p className="text-sm text-muted-foreground mb-2">
                  Drop your boarding pass here, or click to browse
                </p>
                <Label htmlFor="file-upload">
                  <Button variant="outline" size="sm" disabled={uploading} asChild>
                    <span>{uploading ? "Uploading..." : "Choose File"}</span>
                  </Button>
                </Label>
                <Input
                  id="file-upload"
                  type="file"
                  accept="image/*"
                  onChange={handleFileInput}
                  className="hidden"
                  disabled={uploading}
                />
                <p className="text-xs text-muted-foreground mt-2">
                  PNG, JPG up to 5MB
                </p>
              </div>

              <div className="flex gap-2">
                <Button variant="outline" onClick={onClose} className="flex-1">
                  Skip
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
