import { withAuth } from "next-auth/middleware"
import { NextResponse } from "next/server"

export default withAuth(
  function middleware(req) {
    const { pathname } = req.nextUrl
    const token = req.nextauth.token
    
    // Public routes that don't require authentication
    const publicRoutes = [
      '/',
      '/signin',
      '/signup',
      '/forgot-password',
      '/forgot-2fa',
      '/reset-password',
      '/verify-code',
      '/verify-2fa-google',
      '/error'
    ]

    // Routes that need authentication but are special (like set-password for OAuth users)
    const semiProtectedRoutes = [
      '/set-password'
    ]

    // Check if current path is a public route
    const isPublicRoute = publicRoutes.some(route => pathname === route || pathname.startsWith(route + '/'))
    const isSemiProtected = semiProtectedRoutes.some(route => pathname === route || pathname.startsWith(route + '/'))
    
    // Allow access to public routes
    if (isPublicRoute) {
      return NextResponse.next()
    }

    // For set-password and similar routes, allow if user is authenticated (even without full setup)
    if (isSemiProtected && token) {
      return NextResponse.next()
    }

    // Protect all other routes - require authentication
    if (!token) {
      const signInUrl = new URL('/signin', req.url)
      signInUrl.searchParams.set('callbackUrl', encodeURIComponent(pathname))
      return NextResponse.redirect(signInUrl)
    }

    // ⚠️ CRITICAL: Check if user needs to set password (required for all users, including Google OAuth)
    // This check must come BEFORE 2FA check, as password is required before enabling 2FA
    if (token.needsPasswordSetup && pathname !== '/set-password') {
      const setPasswordUrl = new URL('/set-password', req.url)
      if (token.email) {
        setPasswordUrl.searchParams.set('email', encodeURIComponent(token.email as string))
        setPasswordUrl.searchParams.set('required', 'true') // Indicate this is mandatory
      }
      return NextResponse.redirect(setPasswordUrl)
    }

    // Check if user needs 2FA verification
    // If they're authenticated but haven't completed 2FA, redirect them
    if (token.needs2FA && pathname !== '/verify-2fa-google') {
      const verify2FAUrl = new URL('/verify-2fa-google', req.url)
      if (token.email) {
        verify2FAUrl.searchParams.set('email', encodeURIComponent(token.email as string))
      }
      return NextResponse.redirect(verify2FAUrl)
    }

    return NextResponse.next()
  },
  {
    callbacks: {
      authorized: ({ token }) => {
        // Return true to allow the middleware function to handle the logic
        // This will be called for all matched routes
        return true
      }
    },
    pages: {
      signIn: '/signin',
    }
  }
)

// Apply middleware to these routes
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public (public files)
     * - manifest.json (PWA manifest)
     * - robots.txt (robots file)
     * - sitemap.xml (sitemap)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|public|manifest.json|robots.txt|sitemap.xml).*)',
  ],
}
