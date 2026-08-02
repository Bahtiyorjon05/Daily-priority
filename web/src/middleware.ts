import type { NextRequest } from "next/server"
import { NextResponse } from "next/server"
import { getToken } from "next-auth/jwt"
import { ADMIN_COOKIE, verifyAdminSession } from "@/lib/admin-auth"

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

  // --- Admin dashboard (independent from the app's NextAuth session) ---
  if (pathname.startsWith('/admin') || pathname.startsWith('/api/admin')) {
    // The login page and login/logout APIs must stay reachable.
    const isAdminPublic =
      pathname === '/admin/login' ||
      pathname === '/api/admin/login' ||
      pathname === '/api/admin/logout'
    if (isAdminPublic) {
      return NextResponse.next()
    }

    const adminUser = await verifyAdminSession(req.cookies.get(ADMIN_COOKIE)?.value)
    if (!adminUser) {
      if (pathname.startsWith('/api/admin')) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }
      const loginUrl = new URL('/admin/login', req.url)
      return NextResponse.redirect(loginUrl)
    }
    return NextResponse.next()
  }

  if (!authEnabled) {
    if (process.env.NODE_ENV !== 'production') {
      console.warn('[middleware] NEXTAUTH_SECRET missing; allowing request without auth.')
    }
    return NextResponse.next()
  }

  if (matchesRoute(pathname, publicRoutes)) {
    return NextResponse.next()
  }

  // Data API requests can't be answered with a redirect — they need a status
  // the caller can act on.
  const isApi = pathname.startsWith('/api/')

  // Use getToken which automatically handles decryption/verification of JWE/JWS
  const token = await getToken({ req, secret })

  if (!token) {
    if (isApi) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    return redirectToSignIn(req)
  }

  if (matchesRoute(pathname, semiProtectedRoutes)) {
    return NextResponse.next()
  }

  // Check custom flags in the token
  // Cast to any because standard JWT type doesn't know about our custom properties
  const customToken = token as any

  // Every account must have a password, including Google sign-ups. Until one is
  // set the session can't touch app data — otherwise the page-level redirect
  // could be sidestepped by calling the API directly.
  if (customToken.needsPasswordSetup && pathname !== '/set-password') {
    if (isApi) {
      return NextResponse.json(
        { error: 'Password setup required', code: 'PASSWORD_SETUP_REQUIRED' },
        { status: 403 }
      )
    }
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
    // Skip Next internals, and any static asset with a file extension (icons,
    // sw.js, images, fonts, manifest, etc.) so PWA/static files aren't
    // redirected to sign-in by the auth guard.
    '/((?!api|_next/static|_next/image|favicon.ico|manifest.json|robots.txt|sitemap.xml|.*\\.(?:png|jpg|jpeg|gif|svg|webp|avif|ico|js|css|txt|xml|json|md|woff|woff2|ttf|otf|eot|map|mp3|ogg|wav|m4a|aac|mp4|webm|pdf)).*)',
    // Admin API needs the auth guard too (the pattern above skips /api).
    '/api/admin/:path*',
    // Data APIs enforce "every account has a password" as well, so the
    // page-level redirect can't be bypassed by calling the API directly.
    // Excluded, because they must work without a user session:
    //   auth        - sign-in / register / set-password themselves
    //   admin       - has its own password + signed-cookie guard
    //   health      - uptime checks
    //   cron        - authenticated by CRON_SECRET, no session
    //   contact     - public contact form on the marketing page
    //   geocode / hijri / qibla / prayer-times / location - public lookups
    //   errors      - crash reports must post even when signed out
    '/api/((?!auth|admin|health|cron|contact|geocode|hijri|qibla|prayer-times|location|errors).*)',
  ],
  // runtime: 'nodejs', // Commenting this out to let Next.js decide, or keep if necessary. getToken works in Edge too.
}
