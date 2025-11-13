import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { password } = body

    if (!password) {
      return NextResponse.json({ 
        error: 'Password is required to disable 2FA' 
      }, { status: 400 })
    }

    // Get user with password and 2FA status
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { 
        id: true,
        password: true,
        twoFactorEnabled: true 
      }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    if (!user.twoFactorEnabled) {
      return NextResponse.json({ 
        error: 'Two-factor authentication is not enabled' 
      }, { status: 400 })
    }

    // Verify password (if user has one - OAuth users might not)
    if (user.password) {
      const isPasswordValid = await bcrypt.compare(password, user.password)
      if (!isPasswordValid) {
        return NextResponse.json({ 
          error: 'Incorrect password' 
        }, { status: 400 })
      }
    }

    // Disable 2FA
    await prisma.user.update({
      where: { id: user.id },
      data: {
        twoFactorEnabled: false,
        twoFactorSecret: null
      }
    })

    // Delete all existing 2FA tokens for this user
    await prisma.twoFactorToken.deleteMany({
      where: { userId: user.id }
    })

    return NextResponse.json({
      success: true,
      message: 'Two-factor authentication disabled successfully'
    })
  } catch (error) {
    console.error('Error disabling 2FA:', error)
    return NextResponse.json(
      { error: 'Failed to disable two-factor authentication' },
      { status: 500 }
    )
  }
}
