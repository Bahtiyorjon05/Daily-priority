import { NextAuthOptions, Session, User, Account, Profile } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import GoogleProvider from 'next-auth/providers/google'
import { prisma } from './prisma'
import bcrypt from 'bcryptjs'
import type { JWT } from 'next-auth/jwt'
import './env-validation' // Validate environment variables
import { createLogger } from './logger'
import { sanitizeEmail } from './sanitize'

const logger = createLogger('Auth')

export const authOptions: NextAuthOptions = {
  pages: {
    signIn: '/signin',
    signOut: '/signout',
    error: '/signin', // Redirect errors back to signin page
  },
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: {
        params: {
          prompt: "consent",
          access_type: "offline",
          response_type: "code",
          scope: "openid email profile"
        }
      },
      profile(profile) {
        return {
          id: profile.sub,
          name: profile.name,
          email: profile.email,
          image: profile.picture,
        }
      },
      allowDangerousEmailAccountLinking: false,
    }),
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('Invalid credentials')
        }

        // Sanitize email to match registration format (lowercase, trimmed)
        const sanitizedEmail = sanitizeEmail(credentials.email)
        if (!sanitizedEmail) {
          throw new Error('Invalid credentials')
        }

        // Optimized: Only select fields we need for authentication
        const user = await prisma.user.findUnique({
          where: { email: sanitizedEmail },
          select: {
            id: true,
            email: true,
            name: true,
            image: true,
            password: true
          }
        })

        if (!user) {
          throw new Error('Invalid credentials')
        }

        // If user has no password, it means they signed up with Google
        if (!user.password) {
          throw new Error('Account created with Google. Please sign in with Google.')
        }

        const isPasswordValid = await bcrypt.compare(
          credentials.password,
          user.password
        )

        if (!isPasswordValid) {
          throw new Error('Invalid credentials')
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.image,
        }
      }
    })
  ],
  session: {
    strategy: 'jwt'
  },
  debug: process.env.NODE_ENV === 'development',
  callbacks: {
    async redirect({ url, baseUrl }) {
      // If user explicitly wants to go to signup, let them go there
      if (url.includes('/signup')) return (baseUrl) + '/signup'
      // Allows relative callback URLs
      if (url.startsWith("/")) return (baseUrl) + (url)
      // Allows callback URLs on the same origin
      else if (new URL(url).origin === baseUrl) return url
      // Default redirect to dashboard after successful auth
      return (baseUrl) + '/dashboard'
    },
    async session({ session, token }: { session: Session; token: JWT }) {
      if (token && session.user) {
        session.user.id = token.sub as string
        session.user.name = token.name ?? null
        session.user.email = token.email ?? ''
        // DON'T store base64 image in session - causes 494 header too large error
        // Fetch image separately when needed
        session.user.image = null
        // Pass 2FA verification status to client-side session
        ;(session as unknown as { needs2FA?: boolean }).needs2FA = token.needs2FA as boolean | undefined
      }
      return session
    },
    async jwt({ token, user, account, trigger, session }: {
      token: JWT;
      user?: User;
      account?: Account | null;
      trigger?: 'signIn' | 'signUp' | 'update';
      session?: Session
    }) {
      // Update token when session is updated (e.g., profile image change)
      if (trigger === 'update' && session && session.user) {
        token.name = session.user.name || token.name
        // Don't store image in JWT - causes 494 header too large
        token.email = session.user.email || token.email
        return token
      }

      // Handle Credentials provider - set token on initial login
      if (user && !account?.provider) {
        token.id = user.id
        token.sub = user.id
        token.name = user.name
        token.email = user.email
        // Don't store image in JWT - causes 494 header too large
        return token
      }

      // Refresh user data from database on subsequent requests (after initial login)
      // This ensures profile image and other data stays in sync
      if (token.sub && !user && !account) {
        try {
          const dbUser = await prisma.user.findUnique({
            where: { id: token.sub },
            select: {
              id: true,
              name: true,
              email: true,
              image: true,
              location: true,
              timezone: true,
              password: true,
              twoFactorEnabled: true,
              twoFactorSecret: true
            }
          })

          if (dbUser) {
            // ⚠️ CRITICAL: Check if password exists and clear the setup flag
            if (dbUser.password) {
              logger.info('[JWT Refresh] User has password, clearing needsPasswordSetup flag', {
                userId: dbUser.id
              })
              token.needsPasswordSetup = false
            } else {
              logger.info('[JWT Refresh] User has NO password, setting needsPasswordSetup flag', {
                userId: dbUser.id
              })
              token.needsPasswordSetup = true
            }

            // ALWAYS check for 2FA tokens and clear the flag if token exists
            // This is important because needs2FA might be set in the token from previous signin
            if (dbUser.twoFactorEnabled && dbUser.twoFactorSecret) {
              logger.info('[JWT Refresh] User has 2FA enabled, checking for verification token', { 
                userId: dbUser.id,
                currentNeeds2FA: token.needs2FA 
              })
              
              const validToken = await prisma.twoFactorToken.findFirst({
                where: {
                  userId: dbUser.id,
                  token: { startsWith: 'google-2fa-' },
                  expires: { gt: new Date() }
                }
              })

              if (validToken) {
                // Token found! User has verified 2FA - clear the flag
                logger.info('[JWT Refresh] ✅ 2FA token found! User verified - clearing needs2FA flag', { 
                  userId: dbUser.id,
                  tokenId: validToken.id 
                })
                await prisma.twoFactorToken.delete({
                  where: { id: validToken.id }
                })
                token.needs2FA = false
              } else if (token.needs2FA) {
                // No token found but flag is set - keep it
                logger.info('[JWT Refresh] ❌ No 2FA token found, user still needs to verify', { userId: dbUser.id })
              }
            }
            
            // Update token with user data
            token.name = dbUser.name
            token.email = dbUser.email
            // token.image removed - causes 494 header too large
            token.location = dbUser.location
            token.timezone = dbUser.timezone
          }
        } catch (error) {
          logger.error('Error refreshing user data in JWT', error)
          // Continue with existing token data if DB fetch fails
        }
        return token
      }

      // Handle Google OAuth - only on initial login (when account is present)
      if (account?.provider === 'google' && user?.email) {
        try {
          // Sanitize email from Google to ensure consistency (lowercase, trimmed)
          const sanitizedEmail = sanitizeEmail(user.email)
          if (!sanitizedEmail) {
            logger.error('Invalid email from Google OAuth', { email: user.email })
            throw new Error('Invalid email address')
          }

          // Check if Google account already exists (optimized - no include)
          const existingAccount = await prisma.account.findUnique({
            where: {
              provider_providerAccountId: {
                provider: account.provider,
                providerAccountId: account.providerAccountId,
              },
            },
            select: { userId: true }
          })

          if (existingAccount) {
            // Clean up any old Google 2FA tokens for this user
            await prisma.twoFactorToken.deleteMany({
              where: {
                userId: existingAccount.userId,
                token: { startsWith: 'google-2fa-' }
              }
            })
            logger.info('Cleaned up old Google 2FA tokens on new signin', { userId: existingAccount.userId })
            
            // Account already linked, fetch user data for token
            const existingUser = await prisma.user.findUnique({
              where: { id: existingAccount.userId },
              select: {
                id: true,
                name: true,
                email: true,
                image: true,
                location: true,
                timezone: true,
                password: true,
                twoFactorEnabled: true,
                twoFactorSecret: true
              }
            })
            if (existingUser) {
              // ⚠️ CRITICAL: Check if user has password set (required for all users)
              if (!existingUser.password) {
                logger.info('[JWT] Google user has no password, redirecting to set-password', {
                  userId: existingUser.id,
                  email: existingUser.email
                })
                // User must set password before accessing dashboard
                token.needsPasswordSetup = true
                token.sub = existingUser.id
                token.id = existingUser.id
                token.name = existingUser.name
                token.email = existingUser.email
                // token.image removed - causes 494 header too large
                token.location = existingUser.location
                token.timezone = existingUser.timezone
                return token
              }

              // ✅ Password exists! Clear the password setup flag
              token.needsPasswordSetup = false

              // Check if 2FA is enabled
              if (existingUser.twoFactorEnabled && existingUser.twoFactorSecret) {
                logger.info('[JWT] User has 2FA enabled, checking for verification token', {
                  userId: existingUser.id,
                  email: existingUser.email
                })

                // Check for valid verification token
                const validToken = await prisma.twoFactorToken.findFirst({
                  where: {
                    userId: existingUser.id,
                    token: { startsWith: 'google-2fa-' },
                    expires: { gt: new Date() }
                  }
                })

                if (!validToken) {
                  logger.info('[JWT] No valid 2FA token found, redirecting to verify-2fa-google', {
                    userId: existingUser.id
                  })
                  // No valid token - mark as needing 2FA and set all required fields
                  token.needs2FA = true
                  token.sub = existingUser.id
                  token.id = existingUser.id
                  token.name = existingUser.name
                  token.email = existingUser.email
                  // token.image removed - causes 494 header too large
                  token.location = existingUser.location
                  token.timezone = existingUser.timezone
                  return token
                }

                // Valid token exists - delete it and clear 2FA flag
                await prisma.twoFactorToken.delete({
                  where: { id: validToken.id }
                })
                logger.info('2FA verified for Google signin', { userId: existingUser.id })
                // Clear the needs2FA flag
                token.needs2FA = false
              }

              token.sub = existingUser.id
              token.id = existingUser.id
              token.name = existingUser.name
              token.email = existingUser.email
              // token.image removed - causes 494 header too large
              token.location = existingUser.location
              token.timezone = existingUser.timezone
            }
            return token
          }

          // Check if user exists with this email (use sanitized email)
          let dbUser = await prisma.user.findUnique({
            where: { email: sanitizedEmail },
            select: {
              id: true,
              name: true,
              email: true,
              image: true,
              location: true,
              timezone: true,
              password: true,
              twoFactorEnabled: true,
              twoFactorSecret: true
            }
          })

          if (dbUser) {
            // Clean up any old Google 2FA tokens for this user
            await prisma.twoFactorToken.deleteMany({
              where: {
                userId: dbUser.id,
                token: { startsWith: 'google-2fa-' }
              }
            })

            // ⚠️ CRITICAL: Check if user has password set (required for all users)
            if (!dbUser.password) {
              logger.info('[JWT] Existing user linking Google has no password, redirecting to set-password', {
                userId: dbUser.id,
                email: dbUser.email
              })
              // User must set password before accessing dashboard
              token.needsPasswordSetup = true
              token.sub = dbUser.id
              token.id = dbUser.id
              token.name = dbUser.name
              token.email = dbUser.email
              // token.image removed - causes 494 header too large
              token.location = dbUser.location
              token.timezone = dbUser.timezone
              return token
            }

            // ✅ Password exists! Clear the password setup flag
            token.needsPasswordSetup = false

            // Check if 2FA is enabled BEFORE linking account
            if (dbUser.twoFactorEnabled && dbUser.twoFactorSecret) {
              logger.info('User has 2FA, requiring verification before linking Google account', { userId: dbUser.id })
              
              // Check for valid verification token
              const validToken = await prisma.twoFactorToken.findFirst({
                where: {
                  userId: dbUser.id,
                  token: { startsWith: 'google-2fa-' },
                  expires: { gt: new Date() }
                }
              })

              if (!validToken) {
                // No valid token - mark as needing 2FA and set all required fields
                token.needs2FA = true
                token.sub = dbUser.id
                token.id = dbUser.id
                token.name = dbUser.name
                token.email = dbUser.email
                // token.image removed - causes 494 header too large
                token.location = dbUser.location
                token.timezone = dbUser.timezone
                return token
              }

              // Valid token exists - delete it and clear 2FA flag
              await prisma.twoFactorToken.delete({
                where: { id: validToken.id }
              })
              logger.info('2FA verified for Google signin (existing user)', { userId: dbUser.id })
              // Clear the needs2FA flag
              token.needs2FA = false
            }

            // User exists, link Google account
            logger.info('Linking Google account to existing user', { userId: dbUser.id })
            await prisma.account.create({
              data: {
                userId: dbUser.id,
                type: account.type,
                provider: account.provider,
                providerAccountId: account.providerAccountId,
                refresh_token: account.refresh_token,
                access_token: account.access_token,
                expires_at: account.expires_at,
                token_type: account.token_type,
                scope: account.scope,
                id_token: account.id_token,
                session_state: account.session_state,
              }
            })

            // Update profile
            const updateData: Record<string, unknown> = {}
            if (user.name && user.name !== dbUser.name) {
              updateData.name = user.name
            }
            if (user.image && user.image !== dbUser.image) {
              updateData.image = user.image
            }
            if (Object.keys(updateData).length > 0) {
              dbUser = await prisma.user.update({
                where: { id: dbUser.id },
                data: updateData
              })
            }

            token.sub = dbUser.id
            token.id = dbUser.id
            token.name = dbUser.name
            token.email = sanitizedEmail
            // token.image removed - causes 494 header too large
            token.location = dbUser.location
            token.timezone = dbUser.timezone
          } else {
            // Create new user and link Google account (use sanitized email)
            logger.info('Creating new user for Google account', { email: sanitizedEmail })
            dbUser = await prisma.user.create({
              data: {
                email: sanitizedEmail,
                name: user.name,
                image: user.image,
                emailVerified: new Date(), // Google already verified the email
              },
              select: {
                id: true,
                name: true,
                email: true,
                image: true,
                location: true,
                timezone: true,
                password: true,
                twoFactorEnabled: true,
                twoFactorSecret: true
              }
            })

            await prisma.account.create({
              data: {
                userId: dbUser.id,
                type: account.type,
                provider: account.provider,
                providerAccountId: account.providerAccountId,
                refresh_token: account.refresh_token,
                access_token: account.access_token,
                expires_at: account.expires_at,
                token_type: account.token_type,
                scope: account.scope,
                id_token: account.id_token,
                session_state: account.session_state,
              }
            })

            // ⚠️ CRITICAL: New Google users don't have password - MUST set one
            if (!dbUser.password) {
              logger.info('[JWT] New Google user created without password, redirecting to set-password', {
                userId: dbUser.id,
                email: dbUser.email
              })
              // User must set password before accessing dashboard
              token.needsPasswordSetup = true
              token.sub = dbUser.id
              token.id = dbUser.id
              token.name = dbUser.name
              token.email = dbUser.email
              // token.image removed - causes 494 header too large
              token.location = dbUser.location
              token.timezone = dbUser.timezone
              return token
            }

            // ✅ Password exists! Clear the password setup flag
            token.needsPasswordSetup = false

            // Check if new user has 2FA enabled (unlikely, but check anyway)
            if (dbUser.twoFactorEnabled && dbUser.twoFactorSecret) {
              const validToken = await prisma.twoFactorToken.findFirst({
                where: {
                  userId: dbUser.id,
                  token: { startsWith: 'google-2fa-' },
                  expires: { gt: new Date() }
                }
              })

              if (!validToken) {
                // No valid token - mark as needing 2FA and set all required fields
                token.needs2FA = true
                token.sub = dbUser.id
                token.id = dbUser.id
                token.name = dbUser.name
                token.email = dbUser.email
                // token.image removed - causes 494 header too large
                token.location = dbUser.location
                token.timezone = dbUser.timezone
                return token
              }

              await prisma.twoFactorToken.delete({
                where: { id: validToken.id }
              })
              logger.info('2FA verified for new Google user', { userId: dbUser.id })
              // Clear the needs2FA flag
              token.needs2FA = false
            }

            logger.info('Created new user successfully', { userId: dbUser.id })
            token.sub = dbUser.id
            token.id = dbUser.id
            token.name = dbUser.name
            token.email = dbUser.email
            // token.image removed - causes 494 header too large
            token.location = dbUser.location
            token.timezone = dbUser.timezone
          }
        } catch (error: any) {
          logger.error('JWT callback error', error)
          // If it's a unique constraint error, try to fetch the user again
          if (error.code === 'P2002' && user?.email) {
            const dbUser = await prisma.user.findUnique({
              where: { email: user.email }
            })
            if (dbUser) {
              token.sub = dbUser.id
              token.id = dbUser.id
            }
          }
        }
      }

      return token
    },
    async signIn({ user, account, profile }: { user: User; account: Account | null; profile?: Profile }) {
      // Allow all sign-ins to proceed - 2FA check will happen in JWT callback
      return true
    }
  }
}

