'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Moon, Sun, Menu, X } from 'lucide-react'
import { useTheme } from '@/components/theme-provider'
import { Logo } from './Logo'

export function Navbar() {
  const { theme, setTheme, systemTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  useEffect(() => { setMounted(true) }, [])

  // Get the resolved theme (handle 'system' theme)
  const resolvedTheme = theme === 'system' ? systemTheme : theme

  if (!mounted) return null

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white/95 dark:bg-[#121212]/95 backdrop-blur-xl border-b border-slate-200/50 dark:border-[#404040]/50 shadow-sm dark:shadow-emerald-500/5">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <Link href="/" className="flex-shrink-0">
            <Logo />
          </Link>

          <div className="hidden md:flex items-center gap-6">
            <a
              href="#features"
              className="text-sm font-medium text-slate-700 dark:text-[#D4D4D4] hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors duration-200"
            >
              Features
            </a>
            <a
              href="#contact"
              className="text-sm font-medium text-slate-700 dark:text-[#D4D4D4] hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors duration-200"
            >
              Contact
            </a>
          </div>

          <div className="flex items-center gap-3">
            {/* Awesome Theme Toggle Button */}
            <button
              onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
              className="relative group h-10 w-10 rounded-full bg-gradient-to-br from-emerald-100 to-teal-100 dark:from-slate-700 dark:to-slate-800 hover:from-emerald-200 hover:to-teal-200 dark:hover:from-slate-600 dark:hover:to-slate-700 transition-all duration-300 shadow-md hover:shadow-lg hover:scale-105 flex items-center justify-center overflow-hidden"
              aria-label={`Switch to ${resolvedTheme === 'dark' ? 'light' : 'dark'} mode`}
              title={`Switch to ${resolvedTheme === 'dark' ? 'light' : 'dark'} mode`}
            >
              {/* Glow effect */}
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/20 to-teal-500/20 dark:from-emerald-500/10 dark:to-teal-500/10 rounded-full blur opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

              {/* Icons with smooth rotation animation */}
              <div className="relative w-5 h-5">
                <Sun className={`h-5 w-5 text-amber-600 dark:text-amber-400 absolute inset-0 transition-all duration-500 ease-in-out ${
                  resolvedTheme === 'dark' ? 'rotate-0 scale-100 opacity-100' : 'rotate-180 scale-0 opacity-0'
                }`} />
                <Moon className={`h-5 w-5 text-slate-700 dark:text-slate-300 absolute inset-0 transition-all duration-500 ease-in-out ${
                  resolvedTheme === 'dark' ? '-rotate-180 scale-0 opacity-0' : 'rotate-0 scale-100 opacity-100'
                }`} />
              </div>
            </button>

            <div className="hidden md:flex items-center gap-2">
              <Link href="/signin">
                <Button variant="ghost" className="rounded-md hover:bg-emerald-50 dark:hover:bg-[#1C1C1C] transition-colors duration-200">Sign In</Button>
              </Link>
              <Link href="/signup">
                <Button className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 rounded-md text-white shadow-md hover:shadow-lg transition-all duration-200">
                  Start Free
                </Button>
              </Link>
            </div>

            <Button
              variant="ghost"
              size="icon"
              className="md:hidden rounded-md"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-200 dark:border-[#404040] bg-white/98 dark:bg-[#121212]/98 backdrop-blur-xl">
          <div className="container mx-auto px-4 py-3 space-y-1">
            <a
              href="#features"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2 text-base font-medium text-slate-700 dark:text-[#D4D4D4] hover:text-emerald-600 dark:hover:text-emerald-400 rounded-md hover:bg-emerald-50 dark:hover:bg-[#1C1C1C] transition-colors duration-200"
            >
              Features
            </a>
            <a
              href="#contact"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2 text-base font-medium text-slate-700 dark:text-[#D4D4D4] hover:text-emerald-600 dark:hover:text-emerald-400 rounded-md hover:bg-emerald-50 dark:hover:bg-[#1C1C1C] transition-colors duration-200"
            >
              Contact
            </a>
            <div className="pt-2 border-t border-slate-200 dark:border-[#404040] space-y-2">
              <Link href="/signin">
                <Button variant="outline" className="w-full rounded-md border-slate-300 dark:border-[#404040] hover:bg-emerald-50 dark:hover:bg-[#1C1C1C] transition-colors duration-200">Sign In</Button>
              </Link>
              <Link href="/signup">
                <Button className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 rounded-md text-white shadow-md transition-all duration-200">Start Free</Button>
              </Link>
            </div>
          </div>
        </div>
      )}
    </nav>
  )
}