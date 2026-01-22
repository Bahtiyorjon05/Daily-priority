import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  devIndicators: false,
  compiler: {
    removeConsole: process.env.NODE_ENV === "production",
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
      // Scripts: Allow self and inline (required for Next.js)
      isProd
        ? "script-src 'self' 'unsafe-inline'"
        : "script-src 'self' 'unsafe-eval' 'unsafe-inline'",
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
      // Frame ancestors: Prevent framing
      "frame-ancestors 'none'",
      // Upgrade insecure requests in production
      isProd ? 'upgrade-insecure-requests' : '',
    ]
      .filter(Boolean)
      .join('; ')

    return [
      {
        source: '/(.*)',
        headers: [
          // Prevent clickjacking
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
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
