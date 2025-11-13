'use client'

import { Camera, Upload } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'

interface Props {
  imageUrl: string | null
  uploading: boolean
  onUpload: (e: React.ChangeEvent<HTMLInputElement>) => void
  onRemove: () => void
  fallbackInitial: string
}

export default function ProfilePictureCard({ imageUrl, uploading, onUpload, onRemove, fallbackInitial }: Props) {
  return (
    <Card className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:border-emerald-300 dark:hover:border-emerald-600 transition-all duration-300">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-gray-900 dark:text-gray-100">
          <Camera className="h-5 w-5 text-emerald-600" />
          Profile Picture
        </CardTitle>
        <CardDescription className="text-gray-700 dark:text-gray-300">Update your profile photo</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-6">
          <div className="relative">
            <Avatar className="h-24 w-24 ring-4 ring-emerald-100 dark:ring-emerald-900 hover:ring-emerald-200 dark:hover:ring-emerald-800 transition-all duration-300">
              <AvatarImage src={imageUrl || ''} />
              <AvatarFallback className="text-2xl font-bold bg-gradient-to-br from-emerald-400 to-emerald-600 text-white">
                {fallbackInitial}
              </AvatarFallback>
            </Avatar>
            <div className="absolute inset-0 bg-black/40 rounded-full opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer">
              <Camera className="h-6 w-6 text-white" />
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Label htmlFor="avatar-upload" className={"cursor-pointer " + (uploading ? 'opacity-60 pointer-events-none' : '')}>
                <Button variant="outline" className="gap-2" disabled={uploading}>
                  <Upload className="h-4 w-4" />
                  {uploading ? 'Uploading...' : 'Upload Photo'}
                </Button>
              </Label>
              {imageUrl && !uploading && (
                <Button variant="ghost" onClick={onRemove} className="text-red-600 hover:text-red-700">
                  Remove
                </Button>
              )}
            </div>
            <input id="avatar-upload" type="file" accept="image/*" onChange={onUpload} className="hidden" />
            <p className="text-sm text-gray-600 dark:text-gray-300">JPG, PNG or GIF. Max size 5MB.</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}



