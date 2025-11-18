import type { NextRequest } from "next/server"
import { NextResponse } from "next/server"
import { jwtVerify, type JWTPayload } from "jose"

const publicRoutes = new Set([
  '/',
  '/signin',
  '/signup',
  '/forgot-password',
  '/forgot-2fa',
  '/reset-password',
  '/verify-code',
  '/verify-2fa-google',
  '/error'
])

const semiProtectedRoutes = new Set(['/set-password'])
const authCookieNames = ['next-auth.session-token', '__Secure-next-auth.session-token']
const secret = process.env.NEXTAUTH_SECRET
const secretKey = secret ? new TextEncoder().encode(secret) : null
const authEnabled = Boolean(secretKey)

type AuthPayload = JWTPayload & {
  email?: string
  needs2FA?: boolean
  needsPasswordSetup?: boolean
}

function matchesRoute(pathname: string, routes: Set<string>) {
  for (const route of routes) {
    if (pathname === route || pathname.startsWith(`${route}/`)) {
      return true
    }
  }
  return false
}

function getSessionToken(req: NextRequest) {
  const cookieHeader = req.headers.get('cookie')
  if (!cookieHeader) return null

  const cookies = cookieHeader.split(';').map((part) => part.trim())
  for (const cookie of cookies) {
    const [name, ...rest] = cookie.split('=')
    if (authCookieNames.includes(name)) {
      const rawValue = rest.join('=')
      try {
        return decodeURIComponent(rawValue)
      } catch {
        return rawValue
      }
    }
  }
  return null
}

async function decodeToken(tokenValue: string): Promise<AuthPayload | null> {
  if (!secretKey) return null

  try {
    const { payload } = await jwtVerify<AuthPayload>(tokenValue, secretKey)
    return payload
  } catch (error) {
    console.warn('[middleware] Failed to verify session token', error)
    return null
  }
}

function redirectToSignIn(req: NextRequest) {
  const signInUrl = new URL('/signin', req.url)
  signInUrl.searchParams.set('callbackUrl', encodeURIComponent(req.nextUrl.pathname))

  const response = NextResponse.redirect(signInUrl)
  authCookieNames.forEach((name) => {
    response.cookies.set({
      name,
      value: '',
      path: '/',
      expires: new Date(0),
    })
  })
  return response
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl

  if (!authEnabled) {
    if (process.env.NODE_ENV !== 'production') {
      console.warn('[middleware] NEXTAUTH_SECRET missing; allowing request without auth.')
    }
    return NextResponse.next()
  }

  if (matchesRoute(pathname, publicRoutes)) {
    return NextResponse.next()
  }

  const sessionToken = getSessionToken(req)
  const tokenPayload = sessionToken ? await decodeToken(sessionToken) : null

  if (!tokenPayload) {
    return redirectToSignIn(req)
  }

  if (matchesRoute(pathname, semiProtectedRoutes)) {
    return NextResponse.next()
  }

  if (tokenPayload.needsPasswordSetup && pathname !== '/set-password') {
    const setPasswordUrl = new URL('/set-password', req.url)
    if (tokenPayload.email) {
      setPasswordUrl.searchParams.set('email', encodeURIComponent(tokenPayload.email))
      setPasswordUrl.searchParams.set('required', 'true')
    }
    return NextResponse.redirect(setPasswordUrl)
  }

  if (tokenPayload.needs2FA && pathname !== '/verify-2fa-google') {
    const verify2FAUrl = new URL('/verify-2fa-google', req.url)
    if (tokenPayload.email) {
      verify2FAUrl.searchParams.set('email', encodeURIComponent(tokenPayload.email))
    }
    return NextResponse.redirect(verify2FAUrl)
  }

  return NextResponse.next()
}

export const config = {
  // Keep middleware off of Next.js internals and run in the Node runtime so we avoid
  // the edge-only request-cookies adapter that has been crashing in dev.
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|public|manifest.json|robots.txt|sitemap.xml).*)',
  ],
  runtime: 'nodejs',
}
