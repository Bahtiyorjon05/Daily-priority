import type { Metadata } from "next";
import { Geist, Geist_Mono, Amiri } from "next/font/google";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { Toaster } from "sonner";
import { Providers } from "@/components/providers";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { ErrorReporter } from "@/components/shared/ErrorReporter";
import { PrayerPhaseProvider } from "@/components/shared/PrayerPhaseProvider";
import { LocaleProvider } from "@/lib/i18n/client";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const amiri = Amiri({
  weight: ['400', '700'],
  subsets: ['arabic', 'latin'],
  variable: '--font-amiri',
  display: 'swap',
});

const appUrl =
  process.env.NEXT_PUBLIC_BASE_URL ||
  process.env.NEXTAUTH_URL ||
  'https://daily-priority.vercel.app';

export const metadata: Metadata = {
  metadataBase: new URL(appUrl),
  title: {
    default: "Daily Priority - Islamic Productivity & Focus App",
    template: "%s | Daily Priority"
  },
  description: "Daily Priority helps Muslims organize their daily tasks around prayer times. The ultimate Islamic productivity app for focus, habit tracking, and Barakah.",
  keywords: [
    "daily priority",
    "priority",
    "islamic productivity",
    "muslim task management",
    "prayer times",
    "islamic app",
    "productivity app for muslims",
    "daily planner",
    "habit tracker",
    "salah tracker",
    "focus app",
    "barakah productivity"
  ],
  authors: [{ name: "Daily Priority Team" }],
  creator: "Daily Priority",
  publisher: "Daily Priority",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    alternateLocale: ['ar_SA', 'ur_PK', 'id_ID', 'tr_TR'],
    url: '/',
    siteName: 'Daily Priority',
    title: 'Daily Priority - Islamic Productivity & Focus App',
    description: 'Organize your daily tasks around prayer times. Balance your Dunya and Akhirah with purpose-driven productivity.',
    images: [
      {
        url: '/opengraph-image',
        width: 1200,
        height: 630,
        alt: 'Daily Priority - Islamic Productivity App',
        type: 'image/png',
      }
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Daily Priority - Islamic Productivity & Focus App',
    description: 'Organize your daily tasks around prayer times. Build productive habits aligned with Islamic values.',
    images: ['/opengraph-image'],
    creator: '@dailypriority',
  },
  icons: {
    icon: [
      // Real files from the generated set. These used to point at a `/icon`
      // route that drew its own checkmark, so the browser tab showed a different
      // logo from the rest of the app.
      { url: '/favicon-16.png', type: 'image/png', sizes: '16x16' },
      { url: '/favicon-32.png', type: 'image/png', sizes: '32x32' },
      { url: '/icon-192.png', type: 'image/png', sizes: '192x192' },
      { url: '/icon-512.png', type: 'image/png', sizes: '512x512' },
    ],
    apple: [
      { url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    ],
    shortcut: [
      { url: '/favicon-32.png', type: 'image/png' },
    ],
  },
  other: {
    'mobile-web-app-capable': 'yes',
  },
  manifest: '/manifest.json',
  category: 'productivity',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Daily Priority',
  },
  formatDetection: {
    telephone: false,
  },
  verification: {
    // Add these later when you have accounts set up
    // google: 'your-google-verification-code',
    // yandex: 'your-yandex-verification-code',
    // bing: 'your-bing-verification-code',
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  "name": "Daily Priority",
  "applicationCategory": "ProductivityApplication",
  "operatingSystem": "Web, PWA",
  "offers": {
    "@type": "Offer",
    "price": "0",
    "priceCurrency": "USD"
  },
  "description": "Daily Priority helps Muslims organize their daily tasks around prayer times with habit tracking and Islamic productivity principles. Built as Sadaqah Jariyah for the Ummah.",
  "featureList": "Task Management, Prayer Times, Habit Tracking, Goal Setting, Islamic Calendar",
  "screenshot": "https://daily-priority.vercel.app/opengraph-image",
  "softwareHelp": "https://daily-priority.vercel.app/#contact",
  "author": {
      "@type": "Person",
      "name": "Bahtiyorjon"
  }
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Note: the locale is resolved in the browser, not here. Calling `cookies()`
  // in the root layout opts the entire app out of static rendering — measured:
  // it turned every route including the marketing page from ○ into ƒ. The
  // pre-paint script below plus LocaleProvider's layout effect get the same
  // no-flash result while keeping the pages on the CDN.
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function () {
                try {
                  const storageKey = 'theme';
                  const root = document.documentElement;
                  const media = window.matchMedia('(prefers-color-scheme: dark)');

                  const resolveTheme = (value) => {
                    if (value === 'dark' || value === 'light') {
                      return value;
                    }
                    return media.matches ? 'dark' : 'light';
                  };

                  const applyTheme = (value) => {
                    const resolved = resolveTheme(value);
                    root.classList.remove('light', 'dark');
                    root.classList.add(resolved);
                    root.dataset.theme = resolved;
                    root.style.setProperty('color-scheme', resolved);
                  };

                  const storedTheme = localStorage.getItem(storageKey) || 'system';
                  applyTheme(storedTheme);

                  const handleChange = () => {
                    const current = localStorage.getItem(storageKey) || 'system';
                    if (current === 'system') {
                      applyTheme('system');
                    }
                  };

                  if (typeof media.addEventListener === 'function') {
                    media.addEventListener('change', handleChange);
                  } else if (typeof media.addListener === 'function') {
                    media.addListener(handleChange);
                  }
                } catch (error) {
                  document.documentElement.classList.add('light');
                }
              })();
            `,
          }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        {/* Service Worker Registration */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', function() {
                  navigator.serviceWorker.register('/sw.js', { scope: '/' })
                    .then(function(reg) {
                      console.log('[SW] Registered:', reg.scope);
                    })
                    .catch(function(err) {
                      console.warn('[SW] Registration failed:', err);
                    });
                });
              }
            `,
          }}
        />
        {/* PWA meta tags for iOS */}
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="Daily Priority" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        {/* Theme color with dark mode support */}
        <meta name="theme-color" content="#10b981" media="(prefers-color-scheme: light)" />
        <meta name="theme-color" content="#065f46" media="(prefers-color-scheme: dark)" />
        {/* Viewport with safe area */}
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${amiri.variable} antialiased bg-background text-foreground preload`}
        suppressHydrationWarning={true}
      >
        <ErrorReporter />
        <ErrorBoundary>
          <Providers>
            <LocaleProvider>
            <PrayerPhaseProvider>
            {children}
            <Toaster position="top-center" richColors />
            <Analytics />
            <SpeedInsights />
            </PrayerPhaseProvider>
            </LocaleProvider>
          </Providers>
        </ErrorBoundary>
      </body>
    </html>
  );
}
