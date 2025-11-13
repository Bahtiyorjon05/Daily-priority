import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'
import crypto from 'crypto'

/**
 * Google OAuth 2FA Verification Route
 * Verifies 2FA password for users signing in with Google
 * Creates a temporary verification token that allows Google signin to proceed
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, twoFactorPassword } = body

    if (!email || !twoFactorPassword) {
      return NextResponse.json(
        { error: 'Email and 2FA password are required' },
        { status: 400 }
      )
    }

    // Find user - use toLowerCase for case-insensitive match
    const emailToSearch = email.toLowerCase()
    
    const user = await prisma.user.findUnique({
      where: { email: emailToSearch },
      select: {
        id: true,
        email: true,
        twoFactorEnabled: true,
        twoFactorSecret: true
      }
    })

    if (!user) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      )
    }

    // Check if 2FA is enabled
    if (!user.twoFactorEnabled) {
      return NextResponse.json(
        { error: '2FA is not enabled for this account' },
        { status: 400 }
      )
    }
    
    if (!user.twoFactorSecret) {
      return NextResponse.json(
        { error: '2FA is enabled but no 2FA password is set. Please disable and re-enable 2FA.' },
        { status: 400 }
      )
    }

    // Verify 2FA password
    const isValid = await bcrypt.compare(twoFactorPassword, user.twoFactorSecret)

    if (!isValid) {
      return NextResponse.json(
        { error: 'Invalid 2FA password. Note: This is NOT your account password, it\'s the separate 2FA password you set when enabling 2FA.' },
        { status: 401 }
      )
    }

    // Create a temporary verification token (expires in 5 minutes)
    // Use the existing TwoFactorToken table
    const verificationToken = `google-2fa-${crypto.randomBytes(32).toString('hex')}`
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000) // 5 minutes

    // Clean up any expired tokens first
    await prisma.twoFactorToken.deleteMany({
      where: {
        userId: user.id,
        token: { startsWith: 'google-2fa-' },
        expires: { lt: new Date() }
      }
    })

    // Store the verification token
    await prisma.twoFactorToken.create({
      data: {
        userId: user.id,
        token: verificationToken,
        expires: expiresAt
      }
    })

    return NextResponse.json({
      success: true,
      verificationToken,
      message: '2FA verified successfully'
    })
  } catch (error) {
    console.error('Error verifying Google OAuth 2FA:', error)
    return NextResponse.json(
      { error: 'Failed to verify 2FA' },
      { status: 500 }
    )
  }
}
