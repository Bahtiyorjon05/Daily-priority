import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

/**
 * Verify 2FA Recovery Code Route
 * Checks if the recovery code is valid before allowing password reset
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, code } = body

    if (!email || !code) {
      return NextResponse.json(
        { error: 'Email and code are required' },
        { status: 400 }
      )
    }

    // Validate code format
    if (code.length !== 6 || !/^\d+$/.test(code)) {
      return NextResponse.json(
        { error: 'Invalid code format. Code must be 6 digits.' },
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

    // Verify the recovery code (but don't delete it yet)
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

    // Code is valid - return success
    // Note: We don't delete the token here, it will be deleted when the password is actually reset
    return NextResponse.json({
      success: true,
      message: 'Recovery code verified successfully.'
    })
  } catch (error) {
    console.error('Error verifying recovery code:', error)
    return NextResponse.json(
      { error: 'Failed to verify recovery code' },
      { status: 500 }
    )
  }
}
