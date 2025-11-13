import { NextRequest, NextResponse } from 'next/server'
import { sendContactEmail } from '@/lib/email'
import { z } from 'zod'

// Validation schema - more lenient
const contactSchema = z.object({
  name: z.string().trim().min(1, 'Name is required').max(100, 'Name is too long'),
  email: z.string().trim().email('Invalid email address'),
  message: z.string().trim().min(5, 'Message must be at least 5 characters').max(2000, 'Message is too long'),
})

export async function POST(request: NextRequest) {
  try {
    let body
    try {
      body = await request.json()
    } catch (parseError) {
      console.error('Failed to parse request body:', parseError)
      return NextResponse.json(
        { error: 'Invalid request format. Please check your input.' },
        { status: 400 }
      )
    }

    // Validate request body
    const result = contactSchema.safeParse(body)

    if (!result.success) {
      console.error('Validation failed:', result.error.issues)
      const errorDetails = result.error.issues.map(err => ({
        field: err.path.join('.'),
        message: err.message,
        received: err.path.length > 0 ? body[err.path[0]] : body
      }))
      console.error('Validation error details:', errorDetails)
      
      return NextResponse.json(
        {
          error: 'Validation failed',
          details: result.error.issues.map(err => ({
            field: err.path.join('.'),
            message: err.message
          }))
        },
        { status: 400 }
      )
    }

    const { name, email, message } = result.data

    // Send email
    const emailSent = await sendContactEmail({ name, email, message })

    if (!emailSent) {
      console.error('Email sending failed')
      return NextResponse.json(
        { 
          error: 'Failed to send email. Please try contacting us directly at dailypriorityapp@gmail.com or via Telegram @Bahtiyorjon05' 
        },
        { status: 500 }
      )
    }

    return NextResponse.json(
      {
        success: true,
        message: 'Thank you for your message! We will get back to you soon.'
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Contact form unexpected error:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    console.error('Error details:', errorMessage)
    
    return NextResponse.json(
      { 
        error: 'An unexpected error occurred. Please try contacting us directly at dailypriorityapp@gmail.com or via Telegram @Bahtiyorjon05',
        details: process.env.NODE_ENV === 'development' ? errorMessage : undefined
      },
      { status: 500 }
    )
  }
}
