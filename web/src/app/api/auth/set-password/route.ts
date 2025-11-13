import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { sanitizeEmail } from '@/lib/sanitize'

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    // If user is already signed in, we can set password for their account
    if (session?.user?.email) {
      const body = await request.json()
      const { password } = body

      if (!password) {
        return NextResponse.json(
          { error: 'Password is required' },
          { status: 400 }
        )
      }

      // Sanitize email to ensure it matches database format
      const sanitizedEmail = sanitizeEmail(session.user.email)
      if (!sanitizedEmail) {
        return NextResponse.json(
          { error: 'Invalid email address' },
          { status: 400 }
        )
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 12)

      // Update user with password (use sanitized email)
      const user = await prisma.user.update({
        where: { email: sanitizedEmail },
        data: {
          password: hashedPassword
        }
      })

      return NextResponse.json(
        { 
          message: 'Password set successfully',
          user: {
            id: user.id,
            email: user.email,
            name: user.name
          }
        },
        { status: 200 }
      )
    }

    // If user is not signed in, check if they're trying to set password for an existing Google account
    const body = await request.json()
    const { email, password } = body

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      )
    }

    // Sanitize email to match database format
    const sanitizedEmail = sanitizeEmail(email)
    if (!sanitizedEmail) {
      return NextResponse.json(
        { error: 'Invalid email address' },
        { status: 400 }
      )
    }

    // Check if user exists and has no password (Google signup)
    const existingUser = await prisma.user.findUnique({
      where: { email: sanitizedEmail }
    })

    if (!existingUser) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    if (existingUser.password) {
      return NextResponse.json(
        { error: 'Password already set for this account. Please sign in normally.' },
        { status: 400 }
      )
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12)

    // Update user with password (use sanitized email)
    const user = await prisma.user.update({
      where: { email: sanitizedEmail },
      data: {
        password: hashedPassword
      }
    })

    return NextResponse.json(
      { 
        message: 'Password set successfully',
        user: {
          id: user.id,
          email: user.email,
          name: user.name
        }
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Set password error:', error)
    return NextResponse.json(
      { error: 'Something went wrong' },
      { status: 500 }
    )
  }
}