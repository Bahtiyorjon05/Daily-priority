'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Moon, Sun, Menu, X } from 'lucide-react'
import { useTheme } from '@/components/theme-provider'
import { Logo } from './Logo'
import { AnimatePresence, motion } from 'framer-motion'
import { usePathname } from 'next/navigation'

export function Navbar() {
  const { theme, setTheme, systemTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const pathname = usePathname()

  useEffect(() => { setMounted(true) }, [])

  useEffect(() => {
    setMobileMenuOpen(false)
  }, [pathname])

  // Prevent background scroll when the mobile drawer is open
  useEffect(() => {
    if (typeof document === 'undefined' || !mobileMenuOpen) return

    const originalOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    return () => {
      document.body.style.overflow = originalOverflow
    }
  }, [mobileMenuOpen])

  // Get the resolved theme (handle 'system' theme)
  const resolvedTheme = theme === 'system' ? systemTheme : theme

  // Smooth scrolling function
  const scrollToSection = (e: React.MouseEvent<HTMLAnchorElement>, targetId: string) => {
    e.preventDefault()
    const targetElement = document.getElementById(targetId)
    if (targetElement) {
      window.scrollTo({
        top: targetElement.offsetTop - 80, // Adjust for navbar height
        behavior: 'smooth'
      })
    }
    // Close mobile menu if open
    setMobileMenuOpen(false)
  }

  if (!mounted) return null

  return (
    <>
      <nav className="fixed top-0 left-0 right-0 z-50 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-white/95 via-white/90 to-emerald-50/30 dark:from-[#121212]/95 dark:via-[#121212]/90 dark:to-emerald-950/20 backdrop-blur-xl border-b border-slate-200/50 dark:border-[#404040]/50 shadow-sm dark:shadow-emerald-500/5">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="flex-shrink-0">
              <Logo className="hover:scale-105 transition-transform duration-300" />
            </Link>

            <div className="hidden md:flex items-center gap-1 lg:gap-2">
              <a
                href="#features"
                onClick={(e) => scrollToSection(e, 'features')}
                className="text-sm font-medium text-slate-700 dark:text-[#D4D4D4] hover:text-emerald-600 dark:hover:text-emerald-400 transition-all duration-300 px-3 py-2 rounded-lg hover:bg-emerald-50/50 dark:hover:bg-[#1C1C1C]/50 group relative overflow-hidden"
              >
                <span className="relative z-10">Features</span>
                <span className="absolute inset-0 bg-gradient-to-r from-emerald-500/0 to-emerald-500/10 dark:from-emerald-400/0 dark:to-emerald-400/10 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              </a>
              <a
                href="#contact"
                onClick={(e) => scrollToSection(e, 'contact')}
                className="text-sm font-medium text-slate-700 dark:text-[#D4D4D4] hover:text-emerald-600 dark:hover:text-emerald-400 transition-all duration-300 px-3 py-2 rounded-lg hover:bg-emerald-50/50 dark:hover:bg-[#1C1C1C]/50 group relative overflow-hidden"
              >
                <span className="relative z-10">Contact</span>
                <span className="absolute inset-0 bg-gradient-to-r from-emerald-500/0 to-emerald-500/10 dark:from-emerald-400/0 dark:to-emerald-400/10 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              </a>
            </div>

            <div className="flex items-center gap-2">
            {/* Awesome Theme Toggle Button */}
            <button
              onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
              className="relative group h-11 w-11 md:h-9 md:w-9 rounded-xl md:rounded-full bg-gradient-to-br from-emerald-100 to-teal-100 dark:from-slate-700 dark:to-slate-800 hover:from-emerald-200 hover:to-teal-200 dark:hover:from-slate-600 dark:hover:to-slate-700 transition-all duration-300 shadow-md hover:shadow-lg hover:scale-105 flex items-center justify-center overflow-hidden border border-emerald-200/50 dark:border-slate-600/50"
              aria-label={`Switch to ${resolvedTheme === 'dark' ? 'light' : 'dark'} mode`}
              title={`Switch to ${resolvedTheme === 'dark' ? 'light' : 'dark'} mode`}
            >
              {/* Glow effect */}
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/20 to-teal-500/20 dark:from-emerald-500/10 dark:to-teal-500/10 rounded-xl md:rounded-full blur opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

              {/* Icons with smooth rotation animation */}
              <div className="relative w-6 h-6 md:w-4 md:h-4">
                <Sun className={`h-6 w-6 md:h-4 md:w-4 text-amber-600 dark:text-amber-400 absolute inset-0 transition-all duration-500 ease-in-out ${
                  resolvedTheme === 'dark' ? 'rotate-0 scale-100 opacity-100' : 'rotate-180 scale-0 opacity-0'
                }`} />
                <Moon className={`h-6 w-6 md:h-4 md:w-4 text-slate-700 dark:text-slate-300 absolute inset-0 transition-all duration-500 ease-in-out ${
                  resolvedTheme === 'dark' ? '-rotate-180 scale-0 opacity-0' : 'rotate-0 scale-100 opacity-100'
                }`} />
              </div>
            </button>

              <div className="hidden md:flex items-center gap-2">
                <Link href="/signin">
                  <Button 
                    variant="ghost" 
                    className="relative rounded-lg hover:bg-emerald-100 dark:hover:bg-[#1C1C1C] transition-all duration-200 h-9 px-3 text-sm font-medium group overflow-hidden border border-emerald-200/50 dark:border-emerald-800/50"
                  >
                    <span className="relative z-10 text-emerald-700 dark:text-emerald-300 font-semibold">Sign In</span>
                    <span className="absolute inset-0 bg-gradient-to-r from-emerald-500/10 to-emerald-500/5 dark:from-emerald-400/10 dark:to-emerald-400/5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
                  </Button>
                </Link>
                <Link href="/signup">
                  <Button 
                    className="relative bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 rounded-lg text-slate-900 dark:text-white shadow-lg shadow-emerald-500/40 hover:shadow-emerald-500/60 transition-all duration-200 h-9 px-4 text-sm font-semibold group overflow-hidden transform hover:-translate-y-0.5 hover:scale-105"
                  >
                    <span className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/30 to-white/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    <span className="relative z-10">Get Started</span>
                  </Button>
                </Link>
              </div>

            <Button
              variant="ghost"
              size="icon"
              className="md:hidden rounded-lg h-11 w-11 hover:bg-emerald-100 dark:hover:bg-emerald-900/20 transition-colors"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                aria-label="Toggle menu"
                aria-expanded={mobileMenuOpen}
                aria-controls="marketing-mobile-nav"
              >
                {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile overlay */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-slate-900/30 backdrop-blur-sm md:hidden"
            onClick={() => setMobileMenuOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Mobile menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            id="marketing-mobile-nav"
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.2 }}
            className="md:hidden fixed top-16 left-0 right-0 z-50 border-t border-slate-200 dark:border-[#404040] bg-white/95 dark:bg-[#121212]/95 backdrop-blur-xl shadow-2xl shadow-slate-900/10 dark:shadow-black/30 max-h-[calc(100vh-4rem)] overflow-y-auto"
          >
            <div className="container mx-auto px-4 py-4 space-y-1">
              <a
                href="#features"
                onClick={(e) => scrollToSection(e, 'features')}
                className="block px-3 py-2.5 text-base font-medium text-slate-700 dark:text-[#D4D4D4] hover:text-emerald-600 dark:hover:text-emerald-400 rounded-lg hover:bg-emerald-50 dark:hover:bg-[#1C1C1C] transition-all duration-300 group relative overflow-hidden"
              >
                <span className="relative z-10">Features</span>
                <span className="absolute inset-0 bg-gradient-to-r from-emerald-500/0 to-emerald-500/10 dark:from-emerald-400/0 dark:to-emerald-400/10 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              </a>
              <a
                href="#contact"
                onClick={(e) => scrollToSection(e, 'contact')}
                className="block px-3 py-2.5 text-base font-medium text-slate-700 dark:text-[#D4D4D4] hover:text-emerald-600 dark:hover:text-emerald-400 rounded-lg hover:bg-emerald-50 dark:hover:bg-[#1C1C1C] transition-all duration-300 group relative overflow-hidden"
              >
                <span className="relative z-10">Contact</span>
                <span className="absolute inset-0 bg-gradient-to-r from-emerald-500/0 to-emerald-500/10 dark:from-emerald-400/0 dark:to-emerald-400/10 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              </a>
              <div className="pt-2 border-t border-slate-200 dark:border-[#404040] space-y-2">
                <Link href="/signin">
                  <Button 
                    variant="outline" 
                    className="w-full rounded-lg border-emerald-300 dark:border-emerald-700 hover:bg-emerald-100 dark:hover:bg-[#1C1C1C] transition-all duration-200 h-9 group relative overflow-hidden font-semibold"
                  >
                    <span className="relative z-10 text-emerald-700 dark:text-emerald-300">Sign In</span>
                    <span className="absolute inset-0 bg-gradient-to-r from-emerald-500/10 to-emerald-500/5 dark:from-emerald-400/10 dark:to-emerald-400/5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
                  </Button>
                </Link>
                <Link href="/signup">
                  <Button 
                    className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 rounded-lg text-slate-900 dark:text-white shadow-lg shadow-emerald-500/40 hover:shadow-emerald-500/60 transition-all duration-200 h-9 group relative overflow-hidden font-semibold transform hover:-translate-y-0.5 hover:scale-105"
                  >
                    <span className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/30 to-white/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    <span className="relative z-10">Get Started</span>
                  </Button>
                </Link>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
