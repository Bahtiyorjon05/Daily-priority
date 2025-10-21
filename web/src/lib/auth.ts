import { NextAuthOptions } from 'next-auth'
import { PrismaAdapter } from '@auth/prisma-adapter'
import CredentialsProvider from 'next-auth/providers/credentials'
import GoogleProvider from 'next-auth/providers/google'
import { prisma } from './prisma'
import bcrypt from 'bcryptjs'
import type { Adapter } from 'next-auth/adapters'
import './env-validation' // Validate environment variables

export const authOptions: NextAuthOptions = {
  // Don't use adapter - we'll handle everything manually in callbacks
  // This is necessary to allow dangerous email account linking
  adapter: undefined as any,
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

        // Optimized: Only select fields we need for authentication
        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
          select: {
            id: true,
            email: true,
            name: true,
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
        }
      }
    })
  ],
  session: {
    strategy: 'jwt'
  },
  debug: process.env.NODE_ENV === 'development',
  callbacks: {
    async redirect({ url, baseUrl }: { url: string; baseUrl: string }) {
      // If user explicitly wants to go to signup, let them go there
      if (url.includes('/signup')) return (baseUrl) + '/signup'
      // Allows relative callback URLs
      if (url.startsWith("/")) return (baseUrl) + (url)
      // Allows callback URLs on the same origin
      else if (new URL(url).origin === baseUrl) return url
      // Default redirect to dashboard after successful auth
      return (baseUrl) + '/dashboard'
    },
    async session({ session, token }: { session: any; token: any }) {
      if (token && session.user) {
        session.user.id = token.sub!
      }
      return session
    },
    async jwt({ token, user, account, trigger }: { token: any; user: any; account: any; trigger?: string }) {
      // Handle Credentials provider - no DB queries needed, just set token
      if (user && !account?.provider) {
        token.id = user.id
        token.sub = user.id
        return token
      }

      // Handle Google OAuth - only on initial login (when account is present)
      if (account?.provider === 'google' && user?.email) {
        try {
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
            // Account already linked, use existing user
            console.log('Using existing Google account:', existingAccount.userId)
            token.sub = existingAccount.userId
            token.id = existingAccount.userId
            return token
          }

          // Check if user exists with this email (optimized - no include)
          let dbUser = await prisma.user.findUnique({
            where: { email: user.email },
            select: { id: true, name: true, image: true }
          })

          if (dbUser) {
            // User exists, link Google account
            console.log('Linking Google account to existing user:', dbUser.id)
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
          } else {
            // Create new user and link Google account
            console.log('Creating new user for Google account')
            dbUser = await prisma.user.create({
              data: {
                email: user.email,
                name: user.name,
                image: user.image,
                emailVerified: new Date(), // Google already verified the email
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

            console.log('Created new user:', dbUser.id)
            token.sub = dbUser.id
            token.id = dbUser.id
          }
        } catch (error: any) {
          console.error('JWT callback error:', error)
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
    async signIn({ user, account, profile }: { user: any; account: any; profile?: any }) {
      // Always allow signin - account linking happens in JWT callback
      return true
    }
  }
}