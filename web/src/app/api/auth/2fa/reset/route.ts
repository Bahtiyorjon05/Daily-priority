import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

/**
 * 2FA Reset Route
 * Verifies the recovery code and sets a new 2FA password
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, code, newTwoFactorPassword } = body

    if (!email || !code || !newTwoFactorPassword) {
      return NextResponse.json(
        { error: 'Email, code, and new 2FA password are required' },
        { status: 400 }
      )
    }

    // Validate password strength
    if (newTwoFactorPassword.length < 6) {
      return NextResponse.json(
        { error: '2FA password must be at least 6 characters long' },
        { status: 400 }
      )
    }

    // Find user
    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true, twoFactorEnabled: true }
    })

    if (!user) {
      return NextResponse.json(
        { error: 'Invalid code or email' },
        { status: 400 }
      )
    }

    if (!user.twoFactorEnabled) {
      return NextResponse.json(
        { error: 'This account does not have 2FA enabled' },
        { status: 400 }
      )
    }

    // Verify the recovery code
    const validToken = await prisma.twoFactorToken.findFirst({
      where: {
        userId: user.id,
        token: code,
        expires: {
          gt: new Date()
        }
      }
    })

    if (!validToken) {
      return NextResponse.json(
        { error: 'Invalid or expired recovery code. Please request a new code.' },
        { status: 400 }
      )
    }

    // Hash the new 2FA password
    const hashedPassword = await bcrypt.hash(newTwoFactorPassword, 12)

    // Update user's 2FA password
    await prisma.user.update({
      where: { id: user.id },
      data: {
        twoFactorSecret: hashedPassword
      }
    })

    // Delete the used recovery token
    await prisma.twoFactorToken.delete({
      where: { id: validToken.id }
    })

    return NextResponse.json({
      success: true,
      message: 'Your 2FA password has been reset successfully. You can now sign in with your new 2FA password.'
    })
  } catch (error) {
    console.error('Error resetting 2FA password:', error)
    return NextResponse.json(
      { error: 'Failed to reset 2FA password' },
      { status: 500 }
    )
  }
}
