'use client'

import { useState, useEffect, useRef } from 'react'
import { useSession } from 'next-auth/react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { toast } from 'sonner'
import { Save, Upload, X, MapPin, Loader2 } from 'lucide-react'
import { requestGPSLocation, formatLocationForDisplay, formatLocationDetailed, type UnifiedLocation } from '@/lib/location-service'
import { useUserProfile } from '@/hooks/useUserProfile'

export function ProfileSettings() {
  const { data: session } = useSession()
  const { profile, refreshProfile } = useUserProfile()
  const [loading, setLoading] = useState(false)
  const [uploadingImage, setUploadingImage] = useState(false)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [imageCacheBuster, setImageCacheBuster] = useState(Date.now())
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [locationLoading, setLocationLoading] = useState(false)
  const [locationError, setLocationError] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    location: '',
    timezone: '',
  })

  // Update form data when profile loads
  useEffect(() => {
    if (profile) {
      setFormData({
        name: profile.name || '',
        email: profile.email || '',
        location: profile.location || '',
        timezone: profile.timezone || '',
      })
    }
  }, [profile])

  const detectLocation = async () => {
    setLocationLoading(true)
    setLocationError(null)

    try {
      const location: UnifiedLocation = await requestGPSLocation()

      // Format location for display
      const locationString = formatLocationForDisplay(location)

      setFormData(prev => ({
        ...prev,
        location: locationString,
        timezone: location.timezone || prev.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone,
      }))

      toast.success('Location detected successfully')
    } catch (error: any) {
      const errorMessage = error.message || 'Failed to detect location'
      setLocationError(errorMessage)
      toast.error(errorMessage)
    } finally {
      setLocationLoading(false)
    }
  }

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image must be less than 5MB')
      return
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file')
      return
    }

    setSelectedFile(file)

    // Create preview
    const reader = new FileReader()
    reader.onloadend = () => {
      setImagePreview(reader.result as string)
    }
    reader.readAsDataURL(file)
  }

  const handleImageUpload = async () => {
    if (!selectedFile) return

    setUploadingImage(true)
    try {
      const formData = new FormData()
      formData.append('image', selectedFile)

      const response = await fetch('/api/user/upload-image', {
        method: 'POST',
        body: formData,
      })

      const data = await response.json()

      if (!response.ok) throw new Error(data.error || 'Failed to upload image')

      // Clear preview and file
      setImagePreview(null)
      setSelectedFile(null)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }

      // Refresh profile cache to update all components
      await refreshProfile()
      setImageCacheBuster(Date.now())
      
      toast.success('Profile picture updated successfully!')
      
    } catch (error: any) {
      toast.error(error.message || 'Failed to upload image')
    } finally {
      setUploadingImage(false)
    }
  }

  const cancelImageUpload = () => {
    setImagePreview(null)
    setSelectedFile(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validation
    if (!formData.name || formData.name.trim().length === 0) {
      toast.error('Name is required')
      return
    }
    
    if (formData.name.trim().length > 100) {
      toast.error('Name must be less than 100 characters')
      return
    }
    
    setLoading(true)

    try {
      const response = await fetch('/api/user/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name.trim(),
          location: formData.location.trim(),
          timezone: formData.timezone,
        }),
      })

      if (!response.ok) throw new Error('Failed to update profile')

      // Refresh profile cache to update all components
      await refreshProfile()
      
      toast.success('Profile updated successfully')
    } catch (error) {
      toast.error('Failed to update profile')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="border-2 border-slate-200 dark:border-slate-800 shadow-lg">
      <CardHeader className="bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-950/20 dark:to-teal-950/20">
        <CardTitle className="text-2xl">Profile Information</CardTitle>
        <CardDescription className="text-base">Update your personal information and preferences</CardDescription>
      </CardHeader>
      <CardContent className="pt-6">
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Avatar */}
          <div className="space-y-4">
            <Label className="text-base font-semibold">Profile Picture</Label>
            <div className="flex items-start gap-6">
              <Avatar className="h-24 w-24 ring-4 ring-emerald-200 dark:ring-emerald-800 shadow-lg">
                <AvatarImage 
                  src={imagePreview || (profile?.image ? `${profile.image}?t=${imageCacheBuster}` : '')} 
                  key={imageCacheBuster}
                />
                <AvatarFallback className="text-3xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white font-bold">
                  {profile?.name?.charAt(0) || formData.name?.charAt(0) || 'U'}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 space-y-3">
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  JPG, PNG, WebP or GIF. Maximum file size 5MB.
                </p>
                <div className="flex flex-wrap gap-2">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleImageSelect}
                    className="hidden"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                    className="gap-2 border-2"
                    disabled={uploadingImage}
                  >
                    <Upload className="h-4 w-4" />
                    Choose Image
                  </Button>
                  {imagePreview && (
                    <>
                      <Button
                        type="button"
                        size="sm"
                        onClick={handleImageUpload}
                        disabled={uploadingImage}
                        className="gap-2 bg-emerald-600 hover:bg-emerald-700"
                      >
                        {uploadingImage ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Uploading...
                          </>
                        ) : (
                          <>
                            <Save className="h-4 w-4" />
                            Upload
                          </>
                        )}
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={cancelImageUpload}
                        disabled={uploadingImage}
                        className="gap-2"
                      >
                        <X className="h-4 w-4" />
                        Cancel
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Name */}
          <div className="space-y-2">
            <Label htmlFor="name" className="text-base font-semibold">Display Name *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Enter your name"
              className="h-11 text-base"
              required
              maxLength={100}
              autoComplete="name"
            />
            <p className="text-xs text-slate-500">Your display name (max 100 characters)</p>
          </div>

          {/* Email */}
          <div className="space-y-2">
            <Label htmlFor="email" className="text-base font-semibold">Email Address</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              disabled
              className="bg-slate-100 dark:bg-slate-900 h-11 text-base"
            />
            <p className="text-xs text-slate-500">Email cannot be changed for security reasons</p>
          </div>

          {/* Location */}
          <div className="space-y-2">
            <Label htmlFor="location" className="text-base font-semibold">Location</Label>
            <div className="flex gap-2">
              <Input
                id="location"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                placeholder="City, Country or coordinates"
                className="h-11 text-base flex-1"
              />
              <Button
                type="button"
                variant="outline"
                onClick={detectLocation}
                disabled={locationLoading}
                className="gap-2 border-2"
              >
                {locationLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <MapPin className="h-4 w-4" />
                )}
                Detect
              </Button>
            </div>
            {locationError && (
              <p className="text-xs text-red-500">{locationError}</p>
            )}
            <p className="text-xs text-slate-500">
              📍 <strong>Home Location:</strong> This is your default/home location saved for your profile. 
              Prayer times always use your CURRENT location (detected automatically) for accuracy.
            </p>
          </div>

          {/* Timezone */}
          <div className="space-y-2">
            <Label htmlFor="timezone" className="text-base font-semibold">Timezone</Label>
            <Input
              id="timezone"
              value={formData.timezone}
              onChange={(e) => setFormData({ ...formData, timezone: e.target.value })}
              placeholder="e.g. America/New_York"
              className="h-11 text-base"
            />
            <p className="text-xs text-slate-500">Auto-detected from your location</p>
          </div>

          <Button 
            type="submit" 
            disabled={loading}
            className="w-full sm:w-auto gap-2 h-11 text-base bg-emerald-600 hover:bg-emerald-700"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                Save Changes
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
