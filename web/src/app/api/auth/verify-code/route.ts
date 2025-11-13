import { NextResponse } from 'next/server'
import { verifyCode } from '@/lib/email'
import { sanitizeEmail } from '@/lib/sanitize'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { email, code } = body

    if (!email || !code) {
      return NextResponse.json(
        { error: 'Email and verification code are required' },
        { status: 400 }
      )
    }

    // Sanitize email to match how it was stored
    const sanitizedEmail = sanitizeEmail(email)

    if (!sanitizedEmail) {
      return NextResponse.json(
        { error: 'Please enter a valid email address' },
        { status: 400 }
      )
    }

    // Trim and validate code format (should be 6 digits)
    const trimmedCode = code.trim()
    console.log('[VERIFY-CODE] Received code:', `"${code}"`, '| Trimmed:', `"${trimmedCode}"`)

    if (!/^\d{6}$/.test(trimmedCode)) {
      return NextResponse.json(
        { error: 'Invalid verification code format' },
        { status: 400 }
      )
    }

    // Verify the code (use sanitized email)
    console.log('[VERIFY-CODE] Attempting to verify code for:', sanitizedEmail)
    const isValid = await verifyCode(sanitizedEmail, trimmedCode)

    if (!isValid) {
      console.log('[VERIFY-CODE] ❌ Verification failed for:', sanitizedEmail)
      return NextResponse.json(
        { error: 'Invalid or expired verification code' },
        { status: 400 }
      )
    }

    console.log('[VERIFY-CODE] ✅ Code verified successfully for:', sanitizedEmail)

    // Return the sanitized email so frontend can store it correctly
    return NextResponse.json(
      {
        message: 'Verification code is valid',
        email: sanitizedEmail  // Return sanitized email
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Code verification error:', error)
    return NextResponse.json(
      { error: 'Something went wrong. Please try again.' },
      { status: 500 }
    )
  }
}
