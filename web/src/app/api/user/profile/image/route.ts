import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// POST /api/user/profile/image - Update user profile image
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { image } = body

    if (!image) {
      return NextResponse.json({ error: 'Image URL is required' }, { status: 400 })
    }

    // Update user profile image
    const updatedUser = await prisma.user.update({
      where: { id: session.user.id },
      data: { image },
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
      }
    })

    return NextResponse.json({
      message: 'Profile image updated successfully',
      user: updatedUser
    })
  } catch (error) {
    console.error('Error updating profile image:', error)
    return NextResponse.json({ error: 'Failed to update profile image' }, { status: 500 })
  }
}

// DELETE /api/user/profile/image - Remove user profile image
export async function DELETE() {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Remove user profile image
    const updatedUser = await prisma.user.update({
      where: { id: session.user.id },
      data: { image: null },
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
      }
    })

    return NextResponse.json({
      message: 'Profile image removed successfully',
      user: updatedUser
    })
  } catch (error) {
    console.error('Error removing profile image:', error)
    return NextResponse.json({ error: 'Failed to remove profile image' }, { status: 500 })
  }
}
