/**
 * Email Verification Code System
 * Generate and verify 6-digit codes with 10-minute expiration
 */

import { prisma } from '@/lib/prisma'
import { sendEmail } from '@/lib/email'
import crypto from 'crypto'

/**
 * Generate a 6-digit verification code
 */
export function generateVerificationCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

/**
 * Store verification code in database
 */
export async function createVerificationCode(
  email: string
): Promise<string> {
  // Delete any existing tokens for this email
  await prisma.verificationToken.deleteMany({
    where: { identifier: email },
  })

  // Generate new 6-digit code
  const code = generateVerificationCode()
  const expires = new Date(Date.now() + 10 * 60 * 1000) // 10 minutes

  // Store in database
  await prisma.verificationToken.create({
    data: {
      identifier: email,
      token: code,
      expires,
    },
  })

  return code
}

/**
 * Send verification code email
 */
export async function sendVerificationCode(
  email: string,
  code: string
): Promise<void> {
  const subject = 'Your Daily Priority Verification Code'
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
            background-color: #f9fafb;
          }
          .container {
            background-color: #ffffff;
            border-radius: 12px;
            padding: 40px;
            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
          }
          .header {
            text-align: center;
            margin-bottom: 30px;
          }
          .logo {
            font-size: 32px;
            font-weight: bold;
            background: linear-gradient(135deg, #059669 0%, #0f766e 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            margin-bottom: 10px;
          }
          .code-box {
            background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%);
            border: 2px solid #059669;
            border-radius: 12px;
            padding: 30px;
            text-align: center;
            margin: 30px 0;
          }
          .code {
            font-size: 48px;
            font-weight: 700;
            letter-spacing: 8px;
            color: #059669;
            font-family: 'Courier New', monospace;
          }
          .content {
            margin-bottom: 20px;
            color: #374151;
          }
          .warning {
            background-color: #fef3c7;
            border-left: 4px solid #f59e0b;
            padding: 15px;
            margin: 20px 0;
            border-radius: 4px;
            font-size: 14px;
            color: #78350f;
          }
          .footer {
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #e5e7eb;
            text-align: center;
            font-size: 14px;
            color: #6b7280;
          }
          .security-note {
            margin-top: 20px;
            padding: 15px;
            background-color: #eff6ff;
            border-radius: 8px;
            font-size: 13px;
            color: #1e40af;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="logo">📅 Daily Priority</div>
            <p style="color: #6b7280; margin: 0; font-size: 14px;">Islamic Productivity Planner</p>
          </div>

          <div class="content">
            <h2 style="color: #1f2937; margin-bottom: 20px;">Verify Your Email</h2>
            <p>Thank you for creating an account with Daily Priority! Please use the verification code below to complete your registration:</p>
          </div>

          <div class="code-box">
            <p style="margin: 0 0 10px 0; font-size: 14px; color: #059669; font-weight: 600;">VERIFICATION CODE</p>
            <div class="code">${code}</div>
          </div>

          <div class="warning">
            <strong>⏰ This code will expire in 10 minutes.</strong><br>
            Please complete your registration before the code expires.
          </div>

          <div class="content">
            <p style="margin-top: 25px;">Enter this code on the registration page to verify your email address and complete your account setup.</p>
          </div>

          <div class="security-note">
            <strong>🔒 Security Note:</strong> Never share this code with anyone. Daily Priority will never ask you for this code via phone, email, or any other method.
          </div>

          <div class="content" style="margin-top: 25px;">
            <p style="font-size: 14px;">If you didn't request this code, you can safely ignore this email. Your email address may have been entered by mistake.</p>
          </div>

          <div class="footer">
            <p>© ${new Date().getFullYear()} Daily Priority. All rights reserved.</p>
            <p style="margin-top: 10px; font-size: 12px;">
              Built as Sadaqah Jariyah for the Muslim Ummah 🤲
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
 * Verify email code
 */
export async function verifyCode(
  email: string,
  code: string
): Promise<{ success: boolean; error?: string }> {
  // Find token in database
  const verificationToken = await prisma.verificationToken.findFirst({
    where: {
      identifier: email,
      token: code,
    },
  })

  if (!verificationToken) {
    return {
      success: false,
      error: 'Invalid verification code',
    }
  }

  // Check if token has expired
  if (verificationToken.expires < new Date()) {
    // Delete expired token
    await prisma.verificationToken.deleteMany({
      where: { identifier: email },
    })

    return {
      success: false,
      error: 'Verification code has expired. Please request a new one.',
    }
  }

  // Don't delete the token yet - we'll delete it after account creation
  // This allows us to verify the code was used

  return {
    success: true,
  }
}

/**
 * Delete verification code after successful registration
 */
export async function deleteVerificationCode(email: string): Promise<void> {
  await prisma.verificationToken.deleteMany({
    where: { identifier: email },
  })
}

/**
 * Check if a valid verification code exists for an email
 */
export async function hasValidCode(email: string): Promise<boolean> {
  const token = await prisma.verificationToken.findFirst({
    where: {
      identifier: email,
      expires: { gt: new Date() },
    },
  })

  return token !== null
}
