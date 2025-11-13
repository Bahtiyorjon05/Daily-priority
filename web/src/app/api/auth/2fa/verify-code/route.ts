import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

/**
 * Verify the 2FA enable code without completing the setup
 * This is just to check if the code is valid before asking for 2FA password
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { code } = body

    if (!code) {
      return NextResponse.json({ 
        error: 'Verification code is required' 
      }, { status: 400 })
    }

    // Check if the token exists and is valid
    const validToken = await prisma.twoFactorToken.findFirst({
      where: {
        userId: session.user.id,
        token: code,
        expires: {
          gt: new Date()
        }
      }
    })

    if (!validToken) {
      return NextResponse.json({ 
        error: 'Invalid or expired verification code. Please request a new code.' 
      }, { status: 400 })
    }

    // Code is valid - return success (don't delete token yet, will delete on complete setup)
    return NextResponse.json({
      success: true,
      message: 'Code verified successfully'
    })
  } catch (error) {
    console.error('Error verifying code:', error)
    return NextResponse.json(
      { error: 'Failed to verify code' },
      { status: 500 }
    )
  }
}
