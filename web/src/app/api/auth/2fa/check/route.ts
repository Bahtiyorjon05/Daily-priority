import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

/**
 * Check if a user has 2FA enabled (before showing 2FA input during login)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email } = body

    if (!email) {
      return NextResponse.json({ 
        error: 'Email is required' 
      }, { status: 400 })
    }

    // Get user 2FA status
    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        twoFactorEnabled: true
      }
    })

    if (!user) {
      // Don't reveal if user exists or not
      return NextResponse.json({
        twoFactorEnabled: false
      })
    }

    return NextResponse.json({
      twoFactorEnabled: user.twoFactorEnabled || false
    })
  } catch (error) {
    console.error('Error checking 2FA status:', error)
    return NextResponse.json(
      { twoFactorEnabled: false },
      { status: 200 }
    )
  }
}
