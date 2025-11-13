import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'
import { isCodeVerified, clearVerification, sendPasswordResetEmail } from '@/lib/email'
import { sanitizeEmail } from '@/lib/sanitize'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { email, password } = body

    // Sanitize email
    const sanitizedEmail = sanitizeEmail(email)

    if (!sanitizedEmail || !password) {
      return NextResponse.json(
        { error: 'Valid email and password are required' },
        { status: 400 }
      )
    }

    // Validate password strength
    if (password.length < 8) {
      return NextResponse.json(
        { error: 'Password must be at least 8 characters long' },
        { status: 400 }
      )
    }

    // Check if user exists
    const userExists = await prisma.user.findUnique({
      where: { email: sanitizedEmail },
    })

    if (!userExists) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // ⚠️ CRITICAL SECURITY CHECK: Verify that the code was verified
    const codeVerified = await isCodeVerified(sanitizedEmail)

    if (!codeVerified) {
      console.log('[RESET-PASSWORD] ❌ Verification check failed for:', sanitizedEmail)
      return NextResponse.json(
        { error: 'Verification code not verified or expired. Please request a new code.' },
        { status: 400 }
      )
    }

    console.log('[RESET-PASSWORD] ✅ Verification check passed for:', sanitizedEmail)

    // Hash the new password
    const hashedPassword = await bcrypt.hash(password, 12)

    // Update user's password
    const user = await prisma.user.update({
      where: { email: sanitizedEmail },
      data: { password: hashedPassword },
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // ⚠️ IMPORTANT: Clear the verification after successful password reset
    // This prevents reusing the same verification to reset password again
    await clearVerification(sanitizedEmail)
    console.log('[RESET-PASSWORD] ✅ Password updated and verification cleared for:', sanitizedEmail)

    // Send password reset confirmation email
    await sendPasswordResetEmail(sanitizedEmail)

    return NextResponse.json(
      { message: 'Password reset successfully' },
      { status: 200 }
    )
  } catch (error) {
    console.error('Password reset error:', error)
    return NextResponse.json(
      { error: 'Something went wrong. Please try again.' },
      { status: 500 }
    )
  }
}
