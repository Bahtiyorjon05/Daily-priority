/**
 * Email Verification System
 * Generate and verify email verification tokens
 */

import { prisma } from '@/lib/prisma'
import { sendEmail } from '@/lib/email'
import crypto from 'crypto'

const SUPPORT_EMAIL =
  process.env.SUPPORT_EMAIL ||
  process.env.FROM_EMAIL ||
  process.env.NEXT_PUBLIC_SUPPORT_EMAIL ||
  'dailypriorityapp@gmail.com'

interface VerificationToken {
  token: string
  expires: Date
}

/**
 * Generate a verification token
 */
export function generateVerificationToken(): VerificationToken {
  const token = crypto.randomBytes(32).toString('hex')
  const expires = new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours

  return { token, expires }
}

/**
 * Store verification token in database
 */
export async function createVerificationToken(
  email: string
): Promise<string> {
  // Delete any existing tokens for this email
  await prisma.verificationToken.deleteMany({
    where: { identifier: email },
  })

  // Generate new token
  const { token, expires } = generateVerificationToken()

  // Store in database
  await prisma.verificationToken.create({
    data: {
      identifier: email,
      token,
      expires,
    },
  })

  return token
}

/**
 * Send verification email
 */
export async function sendVerificationEmail(
  email: string,
  name: string
): Promise<void> {
  const token = await createVerificationToken(email)
  const verificationUrl = `${process.env.NEXTAUTH_URL}/verify-email?token=${token}`

  const subject = 'Verify your email - Daily Priority'
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
          }
          .container {
            background-color: #ffffff;
            border-radius: 8px;
            padding: 40px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
          }
          .header {
            text-align: center;
            margin-bottom: 30px;
          }
          .logo {
            font-size: 28px;
            font-weight: bold;
            color: #3B82F6;
            margin-bottom: 10px;
          }
          .content {
            margin-bottom: 30px;
          }
          .button {
            display: inline-block;
            padding: 14px 32px;
            background-color: #3B82F6;
            color: #ffffff !important;
            text-decoration: none;
            border-radius: 6px;
            font-weight: 600;
            text-align: center;
          }
          .button-container {
            text-align: center;
            margin: 30px 0;
          }
          .footer {
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #e5e7eb;
            text-align: center;
            font-size: 14px;
            color: #6b7280;
          }
          .alt-link {
            margin-top: 20px;
            padding: 15px;
            background-color: #f9fafb;
            border-radius: 4px;
            font-size: 12px;
            color: #6b7280;
            word-break: break-all;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="logo">📅 Daily Priority</div>
            <p style="color: #6b7280; margin: 0;">Islamic Productivity Planner</p>
          </div>
          
          <div class="content">
            <h2 style="color: #1f2937; margin-bottom: 20px;">Welcome, ${name}!</h2>
            <p>Thank you for joining Daily Priority. To get started, please verify your email address by clicking the button below:</p>
          </div>

          <div class="button-container">
            <a href="${verificationUrl}" class="button">Verify Email Address</a>
          </div>

          <div class="content">
            <p><strong>This link will expire in 24 hours.</strong></p>
            <p>If you didn't create an account with Daily Priority, you can safely ignore this email.</p>
          </div>

          <div class="alt-link">
            <p><strong>Or copy and paste this URL into your browser:</strong></p>
            <p>${verificationUrl}</p>
          </div>

          <div class="footer">
            <p>© ${new Date().getFullYear()} Daily Priority. All rights reserved.</p>
            <p style="margin-top: 10px;">
              If you have any questions, please contact us at ${SUPPORT_EMAIL}
            </p>
          </div>
        </div>
      </body>
    </html>
  `

  await sendEmail({
    to: email,
    subject,
    html,
  })
}

/**
 * Verify email token
 */
export async function verifyEmailToken(
  token: string
): Promise<{ success: boolean; email?: string; error?: string }> {
  // Find token in database
  const verificationToken = await prisma.verificationToken.findUnique({
    where: { token },
  })

  if (!verificationToken) {
    return {
      success: false,
      error: 'Invalid verification token',
    }
  }

  // Check if token has expired
  if (verificationToken.expires < new Date()) {
    // Delete expired token
    await prisma.verificationToken.delete({
      where: { token },
    })

    return {
      success: false,
      error: 'Verification token has expired',
    }
  }

  const email = verificationToken.identifier

  // Update user's emailVerified field
  await prisma.user.update({
    where: { email },
    data: { emailVerified: new Date() },
  })

  // Delete used token
  await prisma.verificationToken.delete({
    where: { token },
  })

  return {
    success: true,
    email,
  }
}

/**
 * Check if user's email is verified
 */
export async function isEmailVerified(email: string): Promise<boolean> {
  const user = await prisma.user.findUnique({
    where: { email },
    select: { emailVerified: true },
  })

  return user?.emailVerified !== null
}

/**
 * Resend verification email
 */
export async function resendVerificationEmail(
  email: string
): Promise<{ success: boolean; error?: string }> {
  // Check if user exists
  const user = await prisma.user.findUnique({
    where: { email },
    select: { name: true, emailVerified: true },
  })

  if (!user) {
    return {
      success: false,
      error: 'User not found',
    }
  }

  if (user.emailVerified) {
    return {
      success: false,
      error: 'Email already verified',
    }
  }

  // Send new verification email
  await sendVerificationEmail(email, user.name || 'User')

  return { success: true }
}
