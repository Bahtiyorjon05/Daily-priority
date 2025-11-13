import { NextResponse } from 'next/server'
import { sanitizeEmail } from '@/lib/sanitize'
import { createVerificationCode, sendVerificationCode } from '@/lib/verification-code'
import { prisma } from '@/lib/prisma'
import { createLogger } from '@/lib/logger'

const logger = createLogger('SendVerificationCode')

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { email } = body

    // Sanitize email
    const sanitizedEmail = sanitizeEmail(email)

    if (!sanitizedEmail) {
      return NextResponse.json(
        { error: 'Please provide a valid email address' },
        { status: 400 }
      )
    }

    // Check if user already exists with this email
    const existingUser = await prisma.user.findUnique({
      where: { email: sanitizedEmail },
      select: { id: true, password: true, emailVerified: true },
    })

    if (existingUser && existingUser.password) {
      return NextResponse.json(
        { error: 'An account with this email already exists. Please sign in instead.' },
        { status: 400 }
      )
    }

    // Generate and store verification code
    const code = await createVerificationCode(sanitizedEmail)

    // Send verification email
    try {
      await sendVerificationCode(sanitizedEmail, code)
    } catch (emailError) {
      logger.error('Failed to send verification email', emailError)
      return NextResponse.json(
        { error: 'Failed to send verification email. Please try again.' },
        { status: 500 }
      )
    }

    return NextResponse.json(
      {
        message: 'Verification code sent successfully',
        email: sanitizedEmail,
        expiresIn: 600, // 10 minutes in seconds
      },
      { status: 200 }
    )
  } catch (error) {
    logger.error('Send verification code failed', error)
    return NextResponse.json(
      { error: 'Something went wrong. Please try again.' },
      { status: 500 }
    )
  }
}
