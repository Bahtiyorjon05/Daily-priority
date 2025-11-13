import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET: Check if current logged-in user has password and 2FA status
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { 
        password: true,
        twoFactorEnabled: true
      }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    return NextResponse.json({
      hasPassword: !!user.password,
      twoFactorEnabled: user.twoFactorEnabled ?? false
    })
  } catch (error) {
    console.error('Check password error:', error)
    return NextResponse.json(
      { error: 'Something went wrong' },
      { status: 500 }
    )
  }
}

// POST: Check if a specific email has password (for forgot password flow)
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const rawEmail = typeof body.email === 'string' ? body.email.trim().toLowerCase() : ''

    // Check if user exists and has a password
    const user = rawEmail
      ? await prisma.user.findUnique({
          where: { email: rawEmail },
          select: { password: true },
        })
      : null

    // Return whether the user has a password set
    return NextResponse.json(
      { hasPassword: !!user?.password },
      { status: 200 }
    )
  } catch (error) {
    console.error('Check password error:', error)
    return NextResponse.json(
      { error: 'Something went wrong' },
      { status: 500 }
    )
  }
}
