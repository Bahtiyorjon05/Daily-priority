import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { generateVerificationCode, storeVerificationCode, sendVerificationEmail } from '@/lib/email'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { email } = body

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      )
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Please enter a valid email address' },
        { status: 400 }
      )
    }

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { email }
    })

    if (!user) {
      // For security reasons, we don't reveal if the email exists
      // We'll still send a success response to prevent email enumeration
      return NextResponse.json(
        { message: 'If an account exists with this email, a verification code has been sent.' },
        { status: 200 }
      )
    }

    // Generate verification code
    const code = generateVerificationCode()
    
    // Store verification code with expiration
    storeVerificationCode(email, code)
    
    // Send verification email
    const emailSent = await sendVerificationEmail(email, code)
    
    if (!emailSent) {
      return NextResponse.json(
        { error: 'Failed to send verification email. Please try again.' },
        { status: 500 }
      )
    }

    return NextResponse.json(
      { message: 'Verification code sent successfully' },
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