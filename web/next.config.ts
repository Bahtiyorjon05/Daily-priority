import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  devIndicators: false,
  compiler: {
    // Strip debug logging in production but KEEP error/warn — otherwise real
    // failures become invisible in server logs and the browser console.
    removeConsole:
      process.env.NODE_ENV === "production"
        ? { exclude: ["error", "warn"] }
        : false,
  },
  // TypeScript errors WILL prevent builds (safe defaults)
  typescript: {
    ignoreBuildErrors: false, // ✅ Catch TypeScript errors during build
  },
  onDemandEntries: {
    maxInactiveAge: 60 * 1000, // Increased cache time
    pagesBufferLength: 5, // Increased buffer
  },
  experimental: {
    serverActions: {
      bodySizeLimit: "2mb",
    },
    optimizeCss: true,
    optimizePackageImports: ['lucide-react', '@radix-ui/react-icons'],
  },
  turbopack: {
    rules: {
      '*.svg': {
        loaders: ['@svgr/webpack'],
        as: '*.js',
      },
    },
  },
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "avatars.githubusercontent.com" },
      { protocol: "https", hostname: "api.dicebear.com" },
      { protocol: "https", hostname: "lh3.googleusercontent.com" }, // Google OAuth avatars
    ],
    // Allow local uploads
    unoptimized: false,
    dangerouslyAllowSVG: true,
    contentDispositionType: 'attachment',
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },
  async headers() {
    const isProd = process.env.NODE_ENV === 'production'

    // More restrictive CSP for production
    const cspDirectives = [
      "default-src 'self'",
      /*
        Scripts: self, inline (required for Next.js), and telegram.org.

        telegram.org serves the Mini App bridge, which is what defines
        `window.Telegram.WebApp` and carries `initData`. Without it in this list
        the browser blocks the script and the bridge simply never exists -- no
        auto sign-in, no theme, no safe-area insets, no back button. The page
        still loads and looks perfectly fine, which is exactly why this cost a
        day: the app worked, and only the half that makes it a Mini App did not.
      */
      isProd
        ? "script-src 'self' 'unsafe-inline' https://telegram.org"
        : "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://telegram.org",
      // Styles: Allow self and inline (required for styled-components/emotion)
      "style-src 'self' 'unsafe-inline'",
      // Images: Allow self, data URIs, and approved external sources
      "img-src 'self' data: https://images.unsplash.com https://avatars.githubusercontent.com https://api.dicebear.com https://lh3.googleusercontent.com",
      // Fonts: Allow self and data URIs
      "font-src 'self' data:",
      // Connect: API calls to self and approved external services
      "connect-src 'self' https://api.dicebear.com https://images.unsplash.com https://accounts.google.com",
      // Media: Only from self
      "media-src 'self'",
      // Objects: None
      "object-src 'none'",
      // Base URI: Restrict to self
      "base-uri 'self'",
      // Forms: Only submit to self
      "form-action 'self'",
      /*
        Frame ancestors: nobody except Telegram.

        Telegram Web and Telegram Desktop run a Mini App inside an iframe, so
        'none' forbids the app from rendering there at all. Mobile uses a webview
        and is unaffected, which is why this can look like it works while being
        broken for every desktop user.

        Not loosened to '*': this is the clickjacking defence, and the only thing
        gained is Telegram's own domains.
      */
      "frame-ancestors 'self' https://web.telegram.org https://*.telegram.org https://telegram.org",
      // Upgrade insecure requests in production
      isProd ? 'upgrade-insecure-requests' : '',
    ]
      .filter(Boolean)
      .join('; ')

    return [
      {
        source: '/(.*)',
        headers: [
          /*
            X-Frame-Options has no syntax for an allow-list, and DENY overrides
            the frame-ancestors above in browsers that honour both. CSP is the
            modern, more precise control and every browser Telegram ships
            supports it, so the blunt header goes and frame-ancestors does the
            job.
          */
          // Prevent MIME type sniffing
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          // Referrer policy
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          // Content Security Policy
          {
            key: 'Content-Security-Policy',
            value: cspDirectives,
          },
          // Permissions Policy (formerly Feature Policy)
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=(self), interest-cohort=()',
          },
          // XSS Protection (legacy but still useful for older browsers)
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
        ],
      },
    ]
  },
};

export default nextConfig;
