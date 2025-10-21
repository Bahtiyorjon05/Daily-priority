import { NextResponse } from 'next/server'
import { verifyCode } from '@/lib/email'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { email, code } = body

    console.log('Verify code request for email:', email, 'code:', code)

    if (!email || !code) {
      return NextResponse.json(
        { error: 'Email and verification code are required' },
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

    // Validate code format (should be 6 digits)
    if (!/^\d{6}$/.test(code)) {
      return NextResponse.json(
        { error: 'Invalid verification code format' },
        { status: 400 }
      )
    }

    // Verify the code
    const isValid = verifyCode(email, code)
    console.log('Code verification result:', isValid)
    
    if (!isValid) {
      return NextResponse.json(
        { error: 'Invalid or expired verification code' },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { message: 'Verification code is valid' },
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