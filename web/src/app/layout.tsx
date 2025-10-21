import type { Metadata } from "next";
import { Geist, Geist_Mono, Amiri } from "next/font/google";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { Toaster } from "sonner";
import { Providers } from "@/components/providers";
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

export const metadata: Metadata = {
  title: "Daily Priority - Master Your Daily Tasks with AI",
  description: "Smart task management app with AI-powered insights, Eisenhower Matrix prioritization, and beautiful analytics",
  keywords: ["task management", "productivity", "AI", "todo", "eisenhower matrix"],
  icons: {
    icon: 'data:,',
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
        <link rel="icon" href="data:," />
        <link rel="shortcut icon" href="data:," />
        <link rel="apple-touch-icon" href="data:," />
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
        <Providers>
          {children}
          <Toaster position="top-center" richColors />
          <Analytics />
          <SpeedInsights />
        </Providers>
      </body>
    </html>
  );
}
