import { withAuth } from "next-auth/middleware"
import { NextResponse } from "next/server"

export default withAuth(
  function middleware(req) {
    // Allow access to auth pages and API routes
    const { pathname } = req.nextUrl
    
    // Allow access to public routes
    if (
      pathname.startsWith('/signin') ||
      pathname.startsWith('/signup') ||
      pathname.startsWith('/forgot-password') ||
      pathname.startsWith('/set-password') ||
      pathname.startsWith('/api/auth') ||
      pathname.startsWith('/api/register') ||
      pathname.startsWith('/api/forgot-password') ||
      pathname.startsWith('/api/reset-password') ||
      pathname.startsWith('/api/set-password') ||
      pathname.startsWith('/api/verify-code') ||
      pathname.startsWith('/_next') ||
      pathname.startsWith('/help') ||
      pathname.startsWith('/error') ||
      pathname === '/'
    ) {
      return NextResponse.next()
    }

    // Redirect unauthenticated users to signin
    if (!req.nextauth.token) {
      const signInUrl = new URL('/signin', req.url)
      signInUrl.searchParams.set('callbackUrl', req.url)
      return NextResponse.redirect(signInUrl)
    }

    return NextResponse.next()
  },
  {
    callbacks: {
      authorized: () => true // Let the middleware function handle authorization
    },
  }
)

// Apply middleware to these routes
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api/auth (NextAuth API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public (public files)
     */
    '/((?!api/auth|_next/static|_next/image|favicon.ico|public).*)',
  ],
}