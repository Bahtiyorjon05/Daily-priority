import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'
import { sanitizeEmail, sanitizeTitle } from '@/lib/sanitize'
import { hasValidCode, deleteVerificationCode } from '@/lib/verification-code'
import { createLogger } from '@/lib/logger'

const logger = createLogger('RegisterAPI')

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { email, password, confirmPassword, name, verificationCode } = body

    // Sanitize inputs
    const sanitizedEmail = sanitizeEmail(email)
    const sanitizedName = name ? sanitizeTitle(name) : null

    if (!sanitizedEmail || !password || !confirmPassword) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(sanitizedEmail)) {
      return NextResponse.json(
        { error: 'Please provide a valid email address' },
        { status: 400 }
      )
    }

    // Password confirmation validation
    if (password !== confirmPassword) {
      return NextResponse.json(
        { error: 'Passwords do not match' },
        { status: 400 }
      )
    }

    // Password strength validation
    if (password.length < 8) {
      return NextResponse.json(
        { error: 'Password must be at least 8 characters long' },
        { status: 400 }
      )
    }

    // Verify that the email was verified with a code
    if (!verificationCode) {
      return NextResponse.json(
        { error: 'Email verification is required. Please verify your email first.' },
        { status: 400 }
      )
    }

    // Check if valid verification code exists
    const hasValid = await hasValidCode(sanitizedEmail)
    if (!hasValid) {
      return NextResponse.json(
        { error: 'Email verification expired or invalid. Please request a new code.' },
        { status: 400 }
      )
    }

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { email: sanitizedEmail },
    })

    if (existingUser && existingUser.password) {
      // Delete the verification code
      await deleteVerificationCode(sanitizedEmail)

      return NextResponse.json(
        { error: 'An account with this email already exists' },
        { status: 400 }
      )
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12)

    // Create user with verified email
    const user = await prisma.user.create({
      data: {
        email: sanitizedEmail,
        password: hashedPassword,
        name: sanitizedName || sanitizedEmail.split('@')[0],
        emailVerified: new Date(), // Mark email as verified
      },
    })

    // Delete the verification code after successful registration
    await deleteVerificationCode(sanitizedEmail)

    return NextResponse.json(
      {
        message: 'Account created successfully',
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
        },
      },
      { status: 201 }
    )
  } catch (error) {
    logger.error('Registration failed', error)
    return NextResponse.json(
      { error: 'Something went wrong. Please try again.' },
      { status: 500 }
    )
  }
}