import type { Metadata } from "next";
import { Geist, Geist_Mono, Amiri } from "next/font/google";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { Toaster } from "sonner";
import { Providers } from "@/components/providers";
import { ErrorBoundary } from "@/components/ErrorBoundary";
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
    default: "Daily Priority - Islamic Productivity App",
    template: "%s | Daily Priority"
  },
  description: "Daily Priority helps Muslims organize their daily tasks around prayer times with AI-powered suggestions, habit tracking, and Islamic productivity principles. 100% Free. Built as Sadaqah Jariyah.",
  keywords: [
    "islamic productivity",
    "muslim task management",
    "prayer times",
    "islamic app",
    "productivity app for muslims",
    "daily planner",
    "habit tracker",
    "islamic calendar",
    "salah tracker",
    "quran journal",
    "AI productivity",
    "task management",
    "dunya akhirah balance"
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
    title: 'Daily Priority - Islamic Productivity App',
    description: 'Organize your daily tasks around prayer times with AI-powered suggestions. Built for the Muslim Ummah. 100% Free Forever.',
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
    title: 'Daily Priority - Islamic Productivity App',
    description: 'Organize your daily tasks around prayer times with AI-powered suggestions. Built for Muslims. 100% Free.',
    images: ['/opengraph-image'],
    creator: '@dailypriority',
  },
  icons: {
    icon: [
      { url: '/icon', sizes: '32x32', type: 'image/png' },
      { url: '/icon-192.png', type: 'image/png', sizes: '192x192' },
      { url: '/icon-512.png', type: 'image/png', sizes: '512x512' },
    ],
    apple: [
      { url: '/apple-icon', sizes: '180x180', type: 'image/png' },
    ],
    shortcut: [
      { url: '/icon', type: 'image/png' },
    ],
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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
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
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${amiri.variable} antialiased bg-background text-foreground preload`}
        suppressHydrationWarning={true}
      >
        <ErrorBoundary>
          <Providers>
            {children}
            <Toaster position="top-center" richColors />
            <Analytics />
            <SpeedInsights />
          </Providers>
        </ErrorBoundary>
      </body>
    </html>
  );
}
