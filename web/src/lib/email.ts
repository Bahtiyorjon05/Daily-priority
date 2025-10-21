import nodemailer from 'nodemailer'

// In-memory storage for verification codes (in production, use a database)
const verificationCodes = new Map<string, { code: string; expires: number }>()
const verifiedCodes = new Map<string, { expires: number }>() // Store verified codes temporarily

// Create a transporter object using the default SMTP transport
const createTransporter = () => {
  // For localhost development, we'll use Ethereal.email to simulate email sending
  // In production, you would use your actual SMTP credentials
  
  // Check if we're in production or development
  if (process.env.NODE_ENV === 'production') {
    // Production SMTP configuration
    return nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
      auth: {
        user: process.env.SMTP_USER || 'support@dailypriority.app',
        pass: process.env.SMTP_PASS || 'your-app-password',
      },
    })
  } else {
    // Development configuration using Ethereal.email
    // This is for testing purposes only
    return nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      secure: false, // true for 465, false for other ports
      auth: {
        user: process.env.ETHEREAL_USER || 'your-ethereal-user@ethereal.email',
        pass: process.env.ETHEREAL_PASS || 'your-ethereal-password',
      },
    })
  }
}

// Generate a random 6-digit verification code
export const generateVerificationCode = (): string => {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

// Store verification code with expiration (10 minutes)
export const storeVerificationCode = (email: string, code: string): void => {
  const expires = Date.now() + 10 * 60 * 1000 // 10 minutes from now
  verificationCodes.set(email, { code, expires })
  console.log('Verification code ' + (code) + ' stored for ' + (email) + ', expires at ' + (new Date(expires).toISOString()))
}

// Mark code as verified with expiration (10 minutes)
export const markCodeAsVerified = (email: string): void => {
  const expires = Date.now() + 10 * 60 * 1000 // 10 minutes from now
  verifiedCodes.set(email, { expires })
  
  // Also remove the original code since it's been verified
  verificationCodes.delete(email)
  console.log('Code marked as verified for ' + (email) + ', expires at ' + (new Date(expires).toISOString()))
}

// Check if code has been verified
export const isCodeVerified = (email: string): boolean => {
  const stored = verifiedCodes.get(email)
  
  if (!stored) {
    console.log('No verified code found for ' + (email))
    return false
  }
  
  // Check if verification is expired
  if (Date.now() > stored.expires) {
    verifiedCodes.delete(email)
    console.log('Verified code expired for ' + (email))
    return false
  }
  
  console.log('Verified code is valid for ' + (email))
  return true
}

// Verify code
export const verifyCode = (email: string, code: string): boolean => {
  const stored = verificationCodes.get(email)
  
  if (!stored) {
    console.log('No verification code found for ' + (email))
    return false
  }
  
  // Check if code is expired
  if (Date.now() > stored.expires) {
    verificationCodes.delete(email)
    console.log('Verification code expired for ' + (email))
    return false
  }
  
  // Check if code matches
  if (stored.code !== code) {
    console.log('Verification code mismatch for ' + (email) + '. Expected: ' + (stored.code) + ', Got: ' + (code))
    return false
  }
  
  // Code is valid, mark it as verified and remove original
  console.log('Verification code valid for ' + (email) + ', marking as verified')
  markCodeAsVerified(email)
  return true
}

// Send verification email
export const sendVerificationEmail = async (email: string, code: string): Promise<boolean> => {
  try {
    const transporter = createTransporter()
    
    const mailOptions = {
      from: process.env.FROM_EMAIL || '"Daily Priority" <support@dailypriority.app>',
      to: email,
      subject: 'Password Reset Verification Code',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #10b981, #0d9488); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="margin: 0; font-size: 28px;">Daily Priority</h1>
            <p style="margin: 10px 0 0; font-size: 18px; opacity: 0.9;">Password Reset Request</p>
          </div>

          <div style="background: white; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 10px 10px;">
            <h2 style="color: #374151; margin-top: 0;">Verification Code</h2>

            <p style="color: #6b7280; line-height: 1.6;">
              You have requested to reset your password for your Daily Priority account.
              Please use the verification code below to complete the process:
            </p>

            <div style="text-align: center; margin: 30px 0;">
              <div style="display: inline-block; background: #f0fdf4; border: 2px dashed #10b981; padding: 20px 40px; border-radius: 10px;">
                <div style="font-size: 32px; font-weight: bold; color: #0d9488; letter-spacing: 5px;">
                  ${code}
                </div>
                <div style="color: #6b7280; font-size: 14px; margin-top: 10px;">
                  This code will expire in 10 minutes
                </div>
              </div>
            </div>

            <p style="color: #6b7280; line-height: 1.6;">
              If you didn't request this password reset, please ignore this email or contact our support team.
            </p>

            <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
              <p style="color: #9ca3af; font-size: 14px; margin: 0;">
                This email was sent from Daily Priority.
                If you have any questions, please contact our support team at support@dailypriority.app
              </p>
            </div>
          </div>

          <div style="text-align: center; margin-top: 20px; color: #9ca3af; font-size: 12px;">
            <p>© 2025 Daily Priority. All rights reserved.</p>
            <p>Made with ❤️ for the Muslim community</p>
          </div>
        </div>
      `,
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
    
    const mailOptions = {
      from: process.env.FROM_EMAIL || '"Daily Priority" <support@dailypriority.app>',
      to: email,
      subject: 'Password Successfully Reset',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #10b981, #0d9488); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="margin: 0; font-size: 28px;">Daily Priority</h1>
            <p style="margin: 10px 0 0; font-size: 18px; opacity: 0.9;">Password Reset Successful</p>
          </div>

          <div style="background: white; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 10px 10px;">
            <h2 style="color: #374151; margin-top: 0;">Password Changed</h2>

            <p style="color: #6b7280; line-height: 1.6;">
              Your Daily Priority account password has been successfully reset.
              You can now sign in with your new password.
            </p>

            <div style="text-align: center; margin: 30px 0;">
              <div style="display: inline-block; background: #f0fdf4; border: 2px solid #10b981; padding: 20px; border-radius: 10px;">
                <div style="font-size: 24px; font-weight: bold; color: #0d9488;">
                  ✅ Password Reset Successful
                </div>
              </div>
            </div>

            <p style="color: #6b7280; line-height: 1.6;">
              For security reasons, we recommend:
            </p>

            <ul style="color: #6b7280; line-height: 1.6; padding-left: 20px;">
              <li>Using a strong, unique password</li>
              <li>Enabling two-factor authentication if available</li>
              <li>Not sharing your password with anyone</li>
            </ul>

            <div style="text-align: center; margin: 30px 0;">
              <a href="${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/signin"
                 style="display: inline-block; background: linear-gradient(135deg, #10b981, #0d9488); color: white; padding: 12px 30px; text-decoration: none; border-radius: 8px; font-weight: bold;">
                Sign In to Your Account
              </a>
            </div>

            <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
              <p style="color: #9ca3af; font-size: 14px; margin: 0;">
                This email was sent from Daily Priority.
                If you have any questions, please contact our support team at support@dailypriority.app
              </p>
            </div>
          </div>

          <div style="text-align: center; margin-top: 20px; color: #9ca3af; font-size: 12px;">
            <p>© 2025 Daily Priority. All rights reserved.</p>
            <p>Made with ❤️ for the Muslim community</p>
          </div>
        </div>
      `,
    }

    const info = await transporter.sendMail(mailOptions)
    console.log('Password reset confirmation email sent: %s', info.messageId)
    return true
  } catch (error) {
    console.error('Error sending password reset email:', error)
    return false
  }
}