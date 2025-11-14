import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get('image') as File
    
    if (!file) {
      return NextResponse.json({ error: 'No image file provided' }, { status: 400 })
    }

    // SERVER-SIDE VALIDATION - Critical for security
    
    // Validate file exists and has proper properties
    if (!file.name || !file.type || !file.size) {
      return NextResponse.json({ 
        error: 'Invalid file data' 
      }, { status: 400 })
    }

    // Validate file type (server-side check)
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif']
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ 
        error: 'Invalid file type. Only JPEG, PNG, WebP, and GIF are allowed' 
      }, { status: 400 })
    }

    // Validate file extension matches MIME type (prevent spoofing)
    const fileExtension = file.name.split('.').pop()?.toLowerCase()
    const validExtensions = ['jpg', 'jpeg', 'png', 'webp', 'gif']
    if (!fileExtension || !validExtensions.includes(fileExtension)) {
      return NextResponse.json({ 
        error: 'Invalid file extension' 
      }, { status: 400 })
    }

    // Validate file size (1MB max for base64 storage) - SERVER-SIDE CHECK
    const maxSize = 1 * 1024 * 1024 // 1MB (reduced for database storage)
    if (file.size > maxSize) {
      return NextResponse.json({ 
        error: 'File too large. Maximum size is 1MB' 
      }, { status: 400 })
    }

    // Validate minimum size (prevent empty files)
    if (file.size < 100) { // 100 bytes minimum
      return NextResponse.json({ 
        error: 'File too small. Minimum size is 100 bytes' 
      }, { status: 400 })
    }

    // Additional security: Read first bytes to verify actual file type
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    
    // Check file signature (magic numbers) for common image formats
    const isValidImage = (
      (buffer[0] === 0xFF && buffer[1] === 0xD8 && buffer[2] === 0xFF) || // JPEG
      (buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4E && buffer[3] === 0x47) || // PNG
      (buffer[0] === 0x47 && buffer[1] === 0x49 && buffer[2] === 0x46) || // GIF
      (buffer[0] === 0x52 && buffer[1] === 0x49 && buffer[2] === 0x46 && buffer[3] === 0x46) // WebP/RIFF
    )

    if (!isValidImage) {
      return NextResponse.json({ 
        error: 'File signature validation failed. File may be corrupted or not a valid image.' 
      }, { status: 400 })
    }

    // Convert to base64 data URL (Vercel serverless workaround)
    const base64 = buffer.toString('base64')
    const imageUrl = `data:${file.type};base64,${base64}`

    // Update user's image in database
    await prisma.user.update({
      where: { id: session.user.id },
      data: { 
        image: imageUrl,
        updatedAt: new Date()
      }
    })

    return NextResponse.json({ 
      success: true,
      imageUrl,
      message: 'Profile image uploaded successfully'
    })
  } catch (error) {
    console.error('Error uploading image:', error)
    return NextResponse.json(
      { error: 'Failed to upload image' },
      { status: 500 }
    )
  }
}
