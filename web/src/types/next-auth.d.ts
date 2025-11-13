import 'next-auth'
import { DefaultSession } from 'next-auth'

declare module 'next-auth' {
  /**
   * Extended session interface with custom user fields
   */
  interface Session extends DefaultSession {
    user: {
      id: string
      email: string
      name?: string | null
      image?: string | null
      location?: string | null
      timezone?: string | null
    } & DefaultSession['user']
  }

  /**
   * Extended user interface with custom fields
   */
  interface User {
    id: string
    email: string
    name?: string | null
    image?: string | null
    password?: string | null
    location?: string | null
    timezone?: string | null
    emailVerified?: Date | null
  }

  /**
   * Extended profile interface for OAuth providers
   */
  interface Profile {
    sub: string
    email: string
    name?: string
    picture?: string
  }
}

declare module 'next-auth/jwt' {
  /**
   * Extended JWT interface with custom token fields
   */
  interface JWT {
    id?: string
    sub?: string
    email?: string | null
    name?: string | null
    image?: string | null
    location?: string | null
    timezone?: string | null
    iat?: number
    exp?: number
    jti?: string
  }
}
