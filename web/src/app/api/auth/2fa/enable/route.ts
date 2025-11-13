import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import crypto from 'crypto'
import { sendTwoFactorEmail } from '@/lib/email'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { 
        id: true, 
        email: true,
        twoFactorEnabled: true
      }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Check if 2FA already enabled
    if (user.twoFactorEnabled) {
      return NextResponse.json({ 
        error: 'Two-factor authentication is already enabled' 
      }, { status: 400 })
    }

    // Generate 6-digit code
    const code = crypto.randomInt(100000, 999999).toString()

    // Delete any existing tokens for this user
    await prisma.twoFactorToken.deleteMany({
      where: { userId: user.id }
    })

    // Store token
    await prisma.twoFactorToken.create({
      data: {
        userId: user.id,
        token: code,
        expires: new Date(Date.now() + 10 * 60 * 1000) // 10 minutes
      }
    })

    // Send email with code
    try {
      await sendTwoFactorEmail(user.email, code, 'enable')
    } catch (emailError) {
      console.error('Failed to send 2FA email:', emailError)
      // Clean up the token
      await prisma.twoFactorToken.deleteMany({
        where: { userId: user.id, token: code }
      })
      return NextResponse.json({ 
        error: 'Failed to send verification email. Please try again.' 
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: 'Verification code sent to your email. After verifying, you will set a 2FA password.'
    })
  } catch (error: any) {
    console.error('Error enabling 2FA:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to enable two-factor authentication' },
      { status: 500 }
    )
  }
}
