import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

/**
 * Verify 2FA password during login
 * This is called after user enters email/password, but before granting access
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, twoFactorPassword } = body

    if (!email || !twoFactorPassword) {
      return NextResponse.json({ 
        error: 'Email and 2FA password are required' 
      }, { status: 400 })
    }

    // Get user with 2FA info - use toLowerCase for case-insensitive match
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
      return NextResponse.json({ 
        error: 'Invalid 2FA password' 
      }, { status: 401 })
    }

    if (!user.twoFactorEnabled || !user.twoFactorSecret) {
      return NextResponse.json({ 
        error: '2FA is not enabled for this account' 
      }, { status: 400 })
    }

    // Verify 2FA password
    const isValid = await bcrypt.compare(twoFactorPassword, user.twoFactorSecret)

    if (!isValid) {
      return NextResponse.json({ 
        error: 'Invalid 2FA password' 
      }, { status: 401 })
    }

    return NextResponse.json({
      success: true,
      message: '2FA verified successfully'
    })
  } catch (error) {
    console.error('Error verifying 2FA login:', error)
    return NextResponse.json(
      { error: 'Failed to verify 2FA' },
      { status: 500 }
    )
  }
}
