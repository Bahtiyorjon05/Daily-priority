import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'
import { existsSync } from 'fs'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get('image') as File
    const type = formData.get('type') as string || 'general'

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      return NextResponse.json({ error: 'Invalid file type. Only images are allowed.' }, { status: 400 })
    }

    // Validate file size (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: 'File size too large. Maximum 5MB allowed.' }, { status: 400 })
    }

    // Create uploads directory if it doesn't exist
    const uploadsDir = join(process.cwd(), 'public', 'uploads', session.user.id)
    if (!existsSync(uploadsDir)) {
      await mkdir(uploadsDir, { recursive: true })
    }

    // Generate unique filename
    const timestamp = Date.now()
    const fileExtension = file.name.split('.').pop()
    const filename = (type) + '_' + (timestamp) + '.' + (fileExtension)
    const filepath = join(uploadsDir, filename)

    // Convert file to buffer and save
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    await writeFile(filepath, buffer)

    // Return the public URL
    const publicUrl = '/uploads/' + (session.user.id) + '/' + (filename)

    return NextResponse.json({
      success: true,
      url: publicUrl,
      filename,
      size: file.size,
      type: file.type
    })

  } catch (error) {
    console.error('Upload error:', error)
    return NextResponse.json(
      { error: 'Internal server error during file upload' },
      { status: 500 }
    )
  }
}

// Handle GET request to list user's uploaded files
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type')

    const uploadsDir = join(process.cwd(), 'public', 'uploads', session.user.id)
    
    if (!existsSync(uploadsDir)) {
      return NextResponse.json({ files: [] })
    }

    const { readdir, stat } = await import('fs/promises')
    const files = await readdir(uploadsDir)
    
    const fileList = await Promise.all(
      files
        .filter(file => !type || file.startsWith((type) + '_'))
        .map(async (file) => {
          const filepath = join(uploadsDir, file)
          const stats = await stat(filepath)
          return {
            filename: file,
            url: '/uploads/' + (session.user.id) + '/' + (file),
            size: stats.size,
            createdAt: stats.birthtime,
            type: file.split('_')[0]
          }
        })
    )

    return NextResponse.json({ files: fileList })

  } catch (error) {
    console.error('File list error:', error)
    return NextResponse.json(
      { error: 'Internal server error while listing files' },
      { status: 500 }
    )
  }
}