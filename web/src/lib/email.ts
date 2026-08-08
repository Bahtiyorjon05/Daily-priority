
import nodemailer from 'nodemailer'
import { renderEmail, codeBlock, escapeHtml } from './email-template'
import { getLocaleForEmail } from '@/lib/i18n/server'
import { getTranslator } from '@/lib/i18n/translate'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://daily-priority.vercel.app'
import crypto from 'crypto'
import { prisma } from './prisma'

const APP_BASE_URL =
  process.env.NEXT_PUBLIC_BASE_URL ||
  process.env.NEXTAUTH_URL ||
  'https://daily-priority.vercel.app'

const SUPPORT_EMAIL =
  process.env.SUPPORT_EMAIL ||
  process.env.FROM_EMAIL ||
  process.env.NEXT_PUBLIC_SUPPORT_EMAIL ||
  'dailypriorityapp@gmail.com'

const DEFAULT_FROM = process.env.FROM_EMAIL || `"Daily Priority" <${SUPPORT_EMAIL}>`
const SUPPORT_LINK_HTML = `<a href="mailto:${SUPPORT_EMAIL}" style="color: #10b981; text-decoration: none;">${SUPPORT_EMAIL}</a>`

// Using database storage for verification codes (persists across server restarts)

// Create a transporter object using the default SMTP transport
const createTransporter = () => {
  // Use Gmail SMTP if configured, otherwise fall back to Ethereal for testing
  const useGmail = process.env.SMTP_USER && process.env.SMTP_PASS
  
  const isDev = process.env.NODE_ENV !== 'production'

  if (useGmail) {
    if (isDev) {
      console.log('Using Gmail SMTP transport')
    }
    return nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
      tls: {
        rejectUnauthorized: false // Accept self-signed certificates
      }
    })
  } else {
    // Development configuration using Ethereal.email for testing only
    if (isDev) {
      console.log('Using Ethereal SMTP (test mode)')
    }
    return nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      secure: false,
      auth: {
        user: process.env.ETHEREAL_USER || 'your-ethereal-user@ethereal.email',
        pass: process.env.ETHEREAL_PASS || 'your-ethereal-password',
      },
    })
  }
}

// Generate a random 6-digit verification code
/**
 * Copy for one recipient, in their language.
 *
 * Every transactional sender takes an email address rather than a user id, so
 * the language is resolved from the account behind that address. When there is
 * no account — a password-reset request for an unknown address, for instance —
 * this falls back to English rather than failing, which also avoids revealing
 * whether the address is registered.
 */
export const forRecipient = async (email: string) => {
  const locale = await getLocaleForEmail(email)
  return { locale, t: getTranslator(locale) }
}

export const generateVerificationCode = (): string => {
  return crypto.randomInt(0, 1_000_000).toString().padStart(6, '0')
}

// Store verification code with expiration (10 minutes)
export const storeVerificationCode = async (email: string, code: string): Promise<void> => {
  const expires = new Date(Date.now() + 10 * 60 * 1000) // 10 minutes from now
  const trimmedCode = code.trim() // Ensure no whitespace

  // Delete any existing codes for this email
  await prisma.verificationToken.deleteMany({
    where: {
      identifier: `reset:${email}` // prefix to identify password reset codes
    }
  })

  // Store new code in database
  await prisma.verificationToken.create({
    data: {
      identifier: `reset:${email}`,
      token: trimmedCode,
      expires
    }
  })

  console.log('[EMAIL] 📝 Stored verification code in DB:', trimmedCode, 'for:', email, '| Expires:', expires.toISOString())
}

// Mark code as verified with expiration (10 minutes)
export const markCodeAsVerified = async (email: string): Promise<void> => {
  const expires = new Date(Date.now() + 10 * 60 * 1000) // 10 minutes from now

  // Delete the original reset code
  await prisma.verificationToken.deleteMany({
    where: { identifier: `reset:${email}` }
  })

  // Delete any existing verified tokens for this email to avoid unique constraint error
  await prisma.verificationToken.deleteMany({
    where: { identifier: `verified:${email}` }
  })

  // Store verified flag with unique token (email + timestamp for uniqueness)
  const uniqueToken = `VERIFIED_${email}_${Date.now()}`
  await prisma.verificationToken.create({
    data: {
      identifier: `verified:${email}`, // prefix to identify verified codes
      token: uniqueToken, // Unique token to avoid DB constraint violation
      expires
    }
  })

  console.log('[EMAIL] ✅ Marked code as verified in DB for:', email)
}

// Check if code has been verified
export const isCodeVerified = async (email: string): Promise<boolean> => {
  const stored = await prisma.verificationToken.findFirst({
    where: {
      identifier: `verified:${email}`,
      expires: { gt: new Date() } // Not expired
    }
  })

  if (!stored) {
    console.log('[EMAIL] ❌ No verified code found for:', email)
    return false
  }

  console.log('[EMAIL] ✅ Verified code valid for:', email)
  return true
}

// Clear verification after password reset (consume the verification)
export const clearVerification = async (email: string): Promise<void> => {
  await prisma.verificationToken.deleteMany({
    where: { identifier: `verified:${email}` }
  })
  console.log('[EMAIL] 🗑️ Cleared verification for:', email)
}

// Verify code
export const verifyCode = async (email: string, code: string): Promise<boolean> => {
  const trimmedCode = code.trim() // Ensure no whitespace

  console.log('[EMAIL] 🔍 Verifying code for:', email)
  console.log('[EMAIL] 🔍 Provided code:', `"${trimmedCode}"`, '| Length:', trimmedCode.length)

  // Fetch from database
  const stored = await prisma.verificationToken.findFirst({
    where: {
      identifier: `reset:${email}`,
      expires: { gt: new Date() } // Not expired
    }
  })

  if (!stored) {
    console.log('[EMAIL] ❌ No verification code found in DB for:', email)
    // Show all reset codes in DB for debugging
    const allCodes = await prisma.verificationToken.findMany({
      where: { identifier: { startsWith: 'reset:' } },
      select: { identifier: true, token: true, expires: true }
    })
    console.log('[EMAIL] 📋 All reset codes in DB:', allCodes)
    return false
  }

  console.log('[EMAIL] 🔍 Stored code:', `"${stored.token}"`, '| Length:', stored.token.length)
  console.log('[EMAIL] 🔍 Expiration:', stored.expires.toISOString(), '| Now:', new Date().toISOString())

  // Check if code matches
  if (stored.token !== trimmedCode) {
    console.log('[EMAIL] ❌ Verification code mismatch!')
    console.log('[EMAIL] ❌ Expected:', `"${stored.token}"`, '(type:', typeof stored.token, ')')
    console.log('[EMAIL] ❌ Provided:', `"${trimmedCode}"`, '(type:', typeof trimmedCode, ')')
    return false
  }

  // Code is valid, mark it as verified and remove original
  console.log('[EMAIL] ✅ Verification code valid for:', email)
  await markCodeAsVerified(email)
  return true
}

// Send verification email
export const sendVerificationEmail = async (email: string, code: string): Promise<boolean> => {
  try {
    console.log('[EMAIL] 📧 Preparing to send verification email to:', email, '| Code:', code)
    const transporter = createTransporter()

    const { locale, t } = await forRecipient(email)

    const mailOptions = {
      from: DEFAULT_FROM,
      to: email,
      subject: t('email.verify.subject'),
      html: renderEmail({
        locale,
        title: t('email.verify.title'),
        eyebrow: t('email.verify.eyebrow'),
        preheader: t('email.verify.preheader', { code }),
        body: `
          <p style="margin:0 0 6px;">${escapeHtml(t('email.verify.lead'))}</p>
          ${codeBlock(code, t('email.verify.expires'))}
          <p style="margin:0;">${escapeHtml(t('email.verify.ignore'))}</p>
        `,
        footnote: t('email.footerHelp', { email: SUPPORT_LINK_HTML }),
        footerNote: t('email.footerAuto'),
      }),
    }

    const info = await transporter.sendMail(mailOptions)
    console.log('Verification email sent: %s', info.messageId)
    
    // For Ethereal.email, you can preview the email
    if (process.env.NODE_ENV !== 'production') {
      console.log('Preview URL: %s', nodemailer.getTestMessageUrl(info))
    }
    
    return true
  } catch (error) {
    console.error('Error sending verification email:', error)
    return false
  }
}

// Send password reset confirmation email
export const sendPasswordResetEmail = async (email: string): Promise<boolean> => {
  try {
    const transporter = createTransporter()

    const { locale, t } = await forRecipient(email)

    const mailOptions = {
      from: DEFAULT_FROM,
      to: email,
      subject: t('email.changed.subject'),
      html: renderEmail({
        locale,
        title: t('email.changed.title'),
        eyebrow: t('email.changed.eyebrow'),
        preheader: t('email.changed.preheader'),
        body: `
          <p style="margin:0 0 12px;">${escapeHtml(t('email.changed.lead'))}</p>
          <p style="margin:0;">${escapeHtml(t('email.changed.warn'))}</p>
        `,
        cta: { label: t('email.changed.cta'), url: `${APP_URL}/signin` },
        footnote: t('email.footerHelp', { email: SUPPORT_LINK_HTML }),
        footerNote: t('email.footerAuto'),
      }),
    }

    const info = await transporter.sendMail(mailOptions)
    console.log('Password reset confirmation email sent: %s', info.messageId)
    return true
  } catch (error) {
    console.error('Error sending password reset email:', error)
    return false
  }
}

// Send contact form email
export const sendContactEmail = async (data: {
  name: string
  email: string
  message: string
}): Promise<boolean> => {
  try {
    const transporter = createTransporter()

    // Email to admin/support team
    const adminMailOptions = {
      from: DEFAULT_FROM,
      to: process.env.CONTACT_EMAIL || 'dailypriorityapp@gmail.com',
      replyTo: data.email,
      subject: `New Contact Form Submission from ${data.name}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #10b981, #0d9488); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="margin: 0; font-size: 28px;">Daily Priority</h1>
            <p style="margin: 10px 0 0; font-size: 18px; opacity: 0.9;">New Contact Form Submission</p>
          </div>

          <div style="background: white; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 10px 10px;">
            <h2 style="color: #374151; margin-top: 0;">Contact Details</h2>

            <div style="background: #f9fafb; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
              <p style="margin: 10px 0;"><strong style="color: #374151;">Name:</strong> <span style="color: #6b7280;">${data.name}</span></p>
              <p style="margin: 10px 0;"><strong style="color: #374151;">Email:</strong> <span style="color: #6b7280;">${data.email}</span></p>
            </div>

            <h3 style="color: #374151; margin-top: 20px;">Message</h3>
            <div style="background: #f0fdf4; border-left: 4px solid #10b981; padding: 20px; border-radius: 4px; margin: 15px 0;">
              <p style="color: #374151; line-height: 1.6; margin: 0; white-space: pre-wrap;">${data.message}</p>
            </div>

            <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
              <p style="color: #9ca3af; font-size: 14px; margin: 0;">
                This email was sent from the Daily Priority contact form.
                You can reply directly to this email to respond to ${data.name}.
              </p>
            </div>
          </div>

          <div style="text-align: center; margin-top: 20px; color: #9ca3af; font-size: 12px;">
            <p>© 2025 Daily Priority. All rights reserved.</p>
          </div>
        </div>
      `,
    }

    // Confirmation email to user
    const userMailOptions = {
      from: DEFAULT_FROM,
      to: data.email,
      subject: 'We received your message - Daily Priority',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #10b981, #0d9488); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="margin: 0; font-size: 28px;">Daily Priority</h1>
            <p style="margin: 10px 0 0; font-size: 18px; opacity: 0.9;">Thank You for Contacting Us</p>
          </div>

          <div style="background: white; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 10px 10px;">
            <h2 style="color: #374151; margin-top: 0;">Assalamu Alaikum, ${data.name}</h2>

            <p style="color: #6b7280; line-height: 1.6;">
              Thank you for reaching out to Daily Priority. We have received your message and our team will get back to you as soon as possible, typically within 24-48 hours.
            </p>

            <p style="color: #6b7280; line-height: 1.6;">
              In the meantime, feel free to:
            </p>

            <ul style="color: #6b7280; line-height: 1.6; padding-left: 20px;">
              <li>Explore our <a href="${APP_BASE_URL}" style="color: #10b981; text-decoration: none;">productivity features</a></li>
              <li>Read our documentation and guides</li>
              <li>Join our community of Muslim productivity enthusiasts</li>
            </ul>

            <div style="text-align: center; margin: 30px 0;">
              <a href="${APP_BASE_URL}"
                 style="display: inline-block; background: linear-gradient(135deg, #10b981, #0d9488); color: white; padding: 12px 30px; text-decoration: none; border-radius: 8px; font-weight: bold;">
                Visit Daily Priority
              </a>
            </div>

            <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
              <p style="color: #9ca3af; font-size: 14px; margin: 0;">
                If you have any urgent concerns, please reply to this email directly.
              </p>
            </div>
          </div>

          <div style="text-align: center; margin-top: 20px; color: #9ca3af; font-size: 12px;">
            <p>© 2025 Daily Priority. All rights reserved.</p>
            <p>Made with love for the Muslim Ummah</p>
          </div>
        </div>
      `,
    }

    // Send both emails
    console.log('Attempting to send contact emails...')
    const adminInfo = await transporter.sendMail(adminMailOptions)
    console.log('✅ Contact email sent to admin: %s', adminInfo.messageId)

    const userInfo = await transporter.sendMail(userMailOptions)
    console.log('✅ Confirmation email sent to user: %s', userInfo.messageId)

    // For Ethereal.email, you can preview the emails
    if (process.env.NODE_ENV !== 'production') {
      console.log('Admin email preview URL: %s', nodemailer.getTestMessageUrl(adminInfo))
      console.log('User email preview URL: %s', nodemailer.getTestMessageUrl(userInfo))
    }

    return true
  } catch (error) {
    console.error('❌ Error sending contact email:', error)
    if (error instanceof Error) {
      console.error('Error details:', {
        message: error.message,
        name: error.name,
        stack: error.stack,
        cause: error.cause
      })
    }
    
    // Check if it's an email configuration issue
    if (error && typeof error === 'object' && 'code' in error) {
      const emailError = error as { code?: string; command?: string }
      console.error('Email error code:', emailError.code)
      console.error('Email command:', emailError.command)
      
      if (emailError.code === 'EAUTH') {
        console.error('⚠️  Email authentication failed. Check SMTP credentials in .env.local')
      } else if (emailError.code === 'ECONNECTION') {
        console.error('⚠️  Failed to connect to email server. Check SMTP_HOST and SMTP_PORT')
      }
    }
    
    return false
  }
}

/**
 * Send 2FA verification email
 * Used for enabling 2FA and for login verification
 */
export const sendTwoFactorEmail = async (
  email: string,
  code: string,
  type: 'enable' | 'login'
): Promise<boolean> => {
  try {
    const transporter = createTransporter()

    const { locale, t } = await forRecipient(email)

    const mailOptions = {
      from: DEFAULT_FROM,
      to: email,
      subject: t('email.twofactor.subject'),
      html: renderEmail({
        locale,
        title: t('email.twofactor.title'),
        eyebrow: t('email.twofactor.eyebrow'),
        preheader: t('email.twofactor.preheader', { code }),
        body: `
          <p style="margin:0 0 6px;">${escapeHtml(t('email.twofactor.lead'))}</p>
          ${codeBlock(code, t('email.verify.expires'))}
          <p style="margin:0;">${escapeHtml(t('email.twofactor.ignore'))}</p>
        `,
        footnote: t('email.footerHelp', { email: SUPPORT_LINK_HTML }),
        footerNote: t('email.footerAuto'),
      }),
    }

    const info = await transporter.sendMail(mailOptions)
    console.log('2FA email sent: %s', info.messageId)

    // For Ethereal.email, you can preview the email
    if (process.env.NODE_ENV !== 'production') {
      console.log('2FA email preview URL: %s', nodemailer.getTestMessageUrl(info))
    }

    return true
  } catch (error) {
    console.error('Error sending 2FA email:', error)
    return false
  }
}

/**
 * Generic send email function
 * Used for custom email sending (verification, notifications, etc.)
 */
export const sendEmail = async (options: {
  to: string
  subject: string
  html: string
  from?: string
}): Promise<void> => {
  try {
    const transporter = createTransporter()

    const mailOptions = {
      from: options.from || DEFAULT_FROM,
      to: options.to,
      subject: options.subject,
      html: options.html,
    }

    const info = await transporter.sendMail(mailOptions)
    console.log('Email sent: %s', info.messageId)

    // For Ethereal.email, you can preview the email
    if (process.env.NODE_ENV !== 'production') {
      console.log('Email preview URL: %s', nodemailer.getTestMessageUrl(info))
    }
  } catch (error) {
    console.error('Error sending email:', error)
    throw error
  }
}
