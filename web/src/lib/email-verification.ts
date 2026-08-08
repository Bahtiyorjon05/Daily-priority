/**
 * Email Verification System
 * Generate and verify email verification tokens
 */

import { prisma } from '@/lib/prisma'
import { sendEmail, forRecipient } from '@/lib/email'
import { renderEmail, escapeHtml } from '@/lib/email-template'
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

  const { locale, t } = await forRecipient(email)

  const subject = t('email.confirm.subject')
  const html = renderEmail({
    locale,
    title: t('email.confirm.title'),
    eyebrow: t('email.confirm.eyebrow'),
    preheader: t('email.confirm.preheaderLink'),
    body: `
      <p style="margin:0 0 6px;">${escapeHtml(t('email.confirm.lead'))}</p>
    `,
    cta: { label: t('email.confirm.cta'), url: verificationUrl },
    footnote: t('email.footerHelp', { email: SUPPORT_EMAIL }),
    footerNote: t('email.footerAuto'),
  })


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
