import type { NextRequest } from "next/server"
import { NextResponse } from "next/server"
import { getToken } from "next-auth/jwt"

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
// We don't need to manually encode the secret for getToken, it handles it.
const secret = process.env.NEXTAUTH_SECRET
const authEnabled = Boolean(secret)

function matchesRoute(pathname: string, routes: Set<string>) {
  for (const route of routes) {
    if (pathname === route || pathname.startsWith(`${route}/`)) {
      return true
    }
  }
  return false
}

function redirectToSignIn(req: NextRequest) {
  const signInUrl = new URL('/signin', req.url)
  signInUrl.searchParams.set('callbackUrl', encodeURIComponent(req.nextUrl.pathname))

  const response = NextResponse.redirect(signInUrl)
  // We can try to clear cookies, but it's tricky with HttpOnly. 
  // Let's leave cookie clearing to the signin page or NextAuth's signOut.
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

  // Use getToken which automatically handles decryption/verification of JWE/JWS
  const token = await getToken({ req, secret })

  if (!token) {
    return redirectToSignIn(req)
  }

  if (matchesRoute(pathname, semiProtectedRoutes)) {
    return NextResponse.next()
  }

  // Check custom flags in the token
  // Cast to any because standard JWT type doesn't know about our custom properties
  const customToken = token as any

  if (customToken.needsPasswordSetup && pathname !== '/set-password') {
    const setPasswordUrl = new URL('/set-password', req.url)
    if (customToken.email) {
      setPasswordUrl.searchParams.set('email', encodeURIComponent(customToken.email))
      setPasswordUrl.searchParams.set('required', 'true')
    }
    return NextResponse.redirect(setPasswordUrl)
  }

  if (customToken.needs2FA && pathname !== '/verify-2fa-google') {
    const verify2FAUrl = new URL('/verify-2fa-google', req.url)
    if (customToken.email) {
      verify2FAUrl.searchParams.set('email', encodeURIComponent(customToken.email))
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
  // runtime: 'nodejs', // Commenting this out to let Next.js decide, or keep if necessary. getToken works in Edge too.
}
