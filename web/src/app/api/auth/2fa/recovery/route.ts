import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { sendTwoFactorEmail } from '@/lib/email'
import crypto from 'crypto'

/**
 * 2FA Recovery Route
 * Sends a recovery code to the user's email to disable 2FA if they lost access
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email } = body

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      )
    }

    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        name: true,
        twoFactorEnabled: true
      }
    })

    if (!user) {
      // Return success even if user not found (security best practice)
      return NextResponse.json({
        success: true,
        message: 'If an account with this email exists and has 2FA enabled, a recovery code has been sent.'
      })
    }

    if (!user.twoFactorEnabled) {
      // Return success even if 2FA not enabled (security best practice)
      return NextResponse.json({
        success: true,
        message: 'If an account with this email exists and has 2FA enabled, a recovery code has been sent.'
      })
    }

    // Generate a secure 6-digit recovery code
    const recoveryCode = Math.floor(100000 + Math.random() * 900000).toString()

    // Store the recovery code with 15-minute expiration (longer than regular 2FA)
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000) // 15 minutes

    await prisma.twoFactorToken.create({
      data: {
        userId: user.id,
        token: recoveryCode,
        expires: expiresAt
      }
    })

    // Send recovery email
    const emailSent = await sendTwoFactorEmail(user.email, recoveryCode, 'enable')

    if (!emailSent) {
      // Clean up the token if email fails
      await prisma.twoFactorToken.deleteMany({
        where: {
          userId: user.id,
          token: recoveryCode
        }
      })

      return NextResponse.json(
        { error: 'Failed to send recovery email. Please try again.' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'If an account with this email exists and has 2FA enabled, a recovery code has been sent.'
    })
  } catch (error) {
    console.error('Error sending 2FA recovery code:', error)
    return NextResponse.json(
      { error: 'Failed to process recovery request' },
      { status: 500 }
    )
  }
}
