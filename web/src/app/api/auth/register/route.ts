import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { email, password, name } = body

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    })

    if (existingUser) {
      // If user exists but has no password, allow them to set one
      if (!existingUser.password) {
        // Hash password
        const hashedPassword = await bcrypt.hash(password, 12)

        // Update user with password
        const user = await prisma.user.update({
          where: { email },
          data: {
            password: hashedPassword,
            name: name || existingUser.name || email.split('@')[0]
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
      
      // If user exists and already has a password, return error
      return NextResponse.json(
        { error: 'User already exists' },
        { status: 400 }
      )
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12)

    // Create user
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name: name || email.split('@')[0]
      }
    })

    return NextResponse.json(
      { 
        message: 'User created successfully',
        user: {
          id: user.id,
          email: user.email,
          name: user.name
        }
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Registration error:', error)
    return NextResponse.json(
      { error: 'Something went wrong' },
      { status: 500 }
    )
  }
}