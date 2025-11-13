import { NextResponse } from 'next/server'
import { sanitizeEmail } from '@/lib/sanitize'
import { verifyCode } from '@/lib/verification-code'
import { createLogger } from '@/lib/logger'

const logger = createLogger('VerifySignupCode')

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { email, code } = body

    // Sanitize email
    const sanitizedEmail = sanitizeEmail(email)

    if (!sanitizedEmail || !code) {
      return NextResponse.json(
        { error: 'Email and verification code are required' },
        { status: 400 }
      )
    }

    // Verify the code
    const result = await verifyCode(sanitizedEmail, code.trim())

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Invalid verification code' },
        { status: 400 }
      )
    }

    return NextResponse.json(
      {
        message: 'Email verified successfully',
        email: sanitizedEmail,
        verified: true,
      },
      { status: 200 }
    )
  } catch (error) {
    logger.error('Verify signup code failed', error)
    return NextResponse.json(
      { error: 'Something went wrong. Please try again.' },
      { status: 500 }
    )
  }
}
