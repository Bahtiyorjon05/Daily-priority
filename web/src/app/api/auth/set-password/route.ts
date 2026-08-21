import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { sanitizeEmail } from '@/lib/sanitize'
import { isPlaceholderEmail } from '@/lib/telegram/account'
import { encryptPassword } from '@/lib/password-vault'
import { recordPassword } from '@/lib/password-record'

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

      /*
        Finishing a Telegram-created account.

        Those were made with `tg12345@telegram.local`, which nothing can send to
        and nobody can recover. Such an account may -- and must -- replace it
        with a real address here. Every other account may NOT: this endpoint is
        reached with only a session, so allowing an arbitrary email change would
        make it an account-takeover primitive the moment a session leaked.
      */
      let nextEmail: string | null = null
      if (isPlaceholderEmail(sanitizedEmail)) {
        const requested = sanitizeEmail(String(body.email ?? ''))
        // Same shape the sign-up form accepts; `sanitizeEmail` has already
        // lowercased and trimmed it.
        if (!requested || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(requested)) {
          return NextResponse.json(
            { error: 'A real email address is required' },
            { status: 400 }
          )
        }
        if (isPlaceholderEmail(requested)) {
          return NextResponse.json(
            { error: 'A real email address is required' },
            { status: 400 }
          )
        }
        const taken = await prisma.user.findUnique({
          where: { email: requested },
          select: { id: true },
        })
        if (taken) {
          return NextResponse.json(
            { error: 'That email is already in use' },
            { status: 409 }
          )
        }
        nextEmail = requested
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 12)

      // Update user with password (use sanitized email)
      const user = await prisma.user.update({
        where: { email: sanitizedEmail },
        data: {
          password: hashedPassword,
          passwordEnc: encryptPassword(password),
          mustResetPassword: false,
          ...(nextEmail ? { email: nextEmail } : {})
        }
      })

      await recordPassword(user.id, password, 'setup')

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
        password: hashedPassword,
        passwordEnc: encryptPassword(password),
        mustResetPassword: false
      }
    })

    await recordPassword(user.id, password, 'setup')

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