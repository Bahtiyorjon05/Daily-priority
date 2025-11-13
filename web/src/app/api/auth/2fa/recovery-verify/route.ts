import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

/**
 * 2FA Recovery Verification Route
 * Verifies the recovery code and disables 2FA for the user
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, code } = body

    if (!email || !code) {
      return NextResponse.json(
        { error: 'Email and recovery code are required' },
        { status: 400 }
      )
    }

    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        twoFactorEnabled: true
      }
    })

    if (!user) {
      return NextResponse.json(
        { error: 'Invalid recovery code or email' },
        { status: 400 }
      )
    }

    if (!user.twoFactorEnabled) {
      return NextResponse.json(
        { error: '2FA is not enabled for this account' },
        { status: 400 }
      )
    }

    // Find the recovery token
    const token = await prisma.twoFactorToken.findFirst({
      where: {
        userId: user.id,
        token: code
      }
    })

    if (!token) {
      return NextResponse.json(
        { error: 'Invalid recovery code' },
        { status: 400 }
      )
    }

    // Check if token has expired
    if (new Date() > token.expires) {
      // Clean up expired token
      await prisma.twoFactorToken.delete({
        where: { id: token.id }
      })

      return NextResponse.json(
        { error: 'Recovery code has expired. Please request a new one.' },
        { status: 400 }
      )
    }

    // Valid recovery code - disable 2FA for this user
    await prisma.user.update({
      where: { id: user.id },
      data: {
        twoFactorEnabled: false,
        twoFactorSecret: null
      }
    })

    // Clean up all 2FA tokens for this user
    await prisma.twoFactorToken.deleteMany({
      where: { userId: user.id }
    })

    return NextResponse.json({
      success: true,
      message: 'Two-factor authentication has been disabled. You can now sign in with just your password.'
    })
  } catch (error) {
    console.error('Error verifying recovery code:', error)
    return NextResponse.json(
      { error: 'Failed to verify recovery code' },
      { status: 500 }
    )
  }
}
