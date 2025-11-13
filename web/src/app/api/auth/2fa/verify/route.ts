import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { code, twoFactorPassword } = body

    if (!code) {
      return NextResponse.json({ 
        error: 'Verification code is required' 
      }, { status: 400 })
    }

    if (!twoFactorPassword) {
      return NextResponse.json({ 
        error: '2FA password is required' 
      }, { status: 400 })
    }

    if (twoFactorPassword.length < 6) {
      return NextResponse.json({ 
        error: '2FA password must be at least 6 characters' 
      }, { status: 400 })
    }

    // Verify email code token
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

    // Hash the 2FA password
    const hashedTwoFactorPassword = await bcrypt.hash(twoFactorPassword, 12)

    // Enable 2FA and store the hashed 2FA password
    await prisma.user.update({
      where: { id: session.user.id },
      data: {
        twoFactorEnabled: true,
        twoFactorSecret: hashedTwoFactorPassword
      }
    })

    // Delete the verification token
    await prisma.twoFactorToken.delete({
      where: { id: validToken.id }
    })

    // Delete any other tokens for this user
    await prisma.twoFactorToken.deleteMany({
      where: { userId: session.user.id }
    })

    return NextResponse.json({
      success: true,
      message: 'Two-factor authentication enabled successfully! You will be asked for this password when signing in.'
    })
  } catch (error) {
    console.error('Error verifying 2FA code:', error)
    return NextResponse.json(
      { error: 'Failed to verify code and enable 2FA' },
      { status: 500 }
    )
  }
}
