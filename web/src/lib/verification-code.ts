/**
 * Email Verification Code System
 * Generate and verify 6-digit codes with 10-minute expiration
 */

import { prisma } from '@/lib/prisma'
import { sendEmail, forRecipient } from '@/lib/email'
import { renderEmail, codeBlock, escapeHtml } from '@/lib/email-template'
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
  const { locale, t } = await forRecipient(email)

  // Sign-up, not password reset. This sender is called from SignUpForm; it was
  // rendering the reset copy, so a new user's first email from us said their
  // password was being reset.
  const subject = t('email.signup.subject')
  const html = renderEmail({
    locale,
    title: t('email.signup.title'),
    eyebrow: t('email.signup.eyebrow'),
    preheader: t('email.signup.preheader', { code }),
    body: `
      <p style="margin:0 0 6px;">${escapeHtml(t('email.signup.lead'))}</p>
      ${codeBlock(code, t('email.verify.expires'))}
      <p style="margin:0;">${escapeHtml(t('email.signup.ignore'))}</p>
    `,
    footerNote: t('email.footerAuto'),
  })


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
