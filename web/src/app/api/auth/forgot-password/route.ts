import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import {
  generateVerificationCode,
  storeVerificationCode,
  sendVerificationEmail,
} from '@/lib/email'
import { sanitizeEmail } from '@/lib/sanitize'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { email } = body

    // Sanitize email
    const sanitizedEmail = sanitizeEmail(email)

    if (!sanitizedEmail) {
      return NextResponse.json(
        { error: 'Please enter a valid email address' },
        { status: 400 }
      )
    }

    // ⚠️ IMPORTANT: Check if user exists BEFORE sending code
    const user = await prisma.user.findUnique({
      where: { email: sanitizedEmail },
      include: {
        accounts: {
          select: { provider: true }
        }
      }
    })

    if (!user) {
      console.log('[FORGOT-PASSWORD] ❌ No user found with email:', sanitizedEmail)
      return NextResponse.json(
        { error: 'No account found with this email address. Please check your email or sign up.' },
        { status: 404 }
      )
    }

    // Check if user is Google-only (no password set)
    const hasGoogleAccount = user.accounts.some(acc => acc.provider === 'google')
    if (hasGoogleAccount && !user.password) {
      console.log('[FORGOT-PASSWORD] ⚠️ Google user without password:', sanitizedEmail)
      return NextResponse.json(
        { error: 'You signed up with Google. Please sign in with Google or set a password first in your account settings.' },
        { status: 400 }
      )
    }

    console.log('[FORGOT-PASSWORD] ✅ User found:', sanitizedEmail)

    // Generate verification code
    const code = generateVerificationCode()
    console.log('[FORGOT-PASSWORD] Generated code for:', sanitizedEmail)

    // Store verification code with expiration in database
    await storeVerificationCode(sanitizedEmail, code)
    console.log('[FORGOT-PASSWORD] Stored code in DB with 10-minute expiration')

    // Send verification email
    const emailSent = await sendVerificationEmail(sanitizedEmail, code)

    if (!emailSent) {
      return NextResponse.json(
        { error: 'Failed to send verification email. Please try again.' },
        { status: 500 }
      )
    }

    return NextResponse.json(
      {
        message: 'Verification code sent successfully',
        email: sanitizedEmail  // Return sanitized email for frontend storage
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Forgot password error:', error)
    return NextResponse.json(
      { error: 'Something went wrong. Please try again.' },
      { status: 500 }
    )
  }
}