'use client'

import Link from 'next/link'
import { ArrowLeft, Home } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { ThemeToggle } from '@/components/theme-toggle'
import { Logo } from '@/components/marketing/Logo'

interface AuthLayoutProps {
  title: string
  subtitle: string
  children: React.ReactNode
}

export function AuthLayout({ title, subtitle, children }: AuthLayoutProps) {
  return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-slate-50 via-gray-50 to-slate-100 dark:from-slate-950 dark:via-gray-950 dark:to-slate-900">
      {/* SPECTACULAR Background Effects */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-100/80 via-gray-50/90 to-slate-200/70 dark:from-slate-950/95 dark:via-gray-950/98 dark:to-slate-900/95"></div>
        <div className="absolute inset-0 bg-gradient-radial from-transparent via-emerald-50/20 to-transparent dark:from-transparent dark:via-emerald-950/30 dark:to-transparent"></div>
        
        {/* Islamic pattern overlay */}
        <div className="absolute inset-0 opacity-[0.02] dark:opacity-[0.05]" style={{ 
          backgroundImage: 'url(/islamic-pattern.svg)', 
          backgroundSize: '140px 140px' 
        }} />
        
        {/* Floating Orbs - More vibrant in dark mode */}
        <div className="absolute top-1/5 left-1/6 w-96 h-96 bg-gradient-to-br from-emerald-400/20 via-teal-400/15 to-cyan-400/25 dark:from-emerald-500/30 dark:via-teal-500/25 dark:to-cyan-500/35 rounded-full blur-3xl animate-float opacity-40 dark:opacity-70"></div>
        <div className="absolute bottom-1/5 right-1/6 w-80 h-80 bg-gradient-to-tl from-purple-400/15 via-pink-400/12 to-rose-400/18 dark:from-purple-500/25 dark:via-pink-500/20 dark:to-rose-500/30 rounded-full blur-3xl animate-float-slow opacity-35 dark:opacity-60"></div>
        <div className="absolute top-1/2 right-1/4 w-72 h-72 bg-gradient-to-r from-blue-400/12 via-indigo-400/15 to-purple-400/20 dark:from-blue-500/22 dark:via-indigo-500/28 dark:to-purple-500/35 rounded-full blur-2xl animate-pulse opacity-30 dark:opacity-55"></div>
        <div className="absolute top-1/3 left-1/2 w-64 h-64 bg-gradient-to-bl from-teal-400/18 via-cyan-400/15 to-emerald-400/22 dark:from-teal-500/28 dark:via-cyan-500/25 dark:to-emerald-500/35 rounded-full blur-3xl animate-float-slower opacity-25 dark:opacity-50"></div>
        <div className="absolute bottom-1/3 left-1/4 w-88 h-88 bg-gradient-to-tr from-rose-400/10 via-pink-400/8 to-purple-400/15 dark:from-rose-500/18 dark:via-pink-500/15 dark:to-purple-500/25 rounded-full blur-3xl animate-float opacity-20 dark:opacity-45"></div>
      </div>

      {/* Enhanced Header */}
      <div className="absolute top-0 left-0 right-0 z-50">
        <div className="backdrop-blur-3xl bg-white/95 dark:bg-gray-900/95 border-b border-emerald-200/60 dark:border-emerald-700/60 shadow-lg shadow-emerald-500/5 dark:shadow-emerald-500/10">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3 sm:gap-4">
                <Link 
                  href="/"
                  className="group flex items-center gap-2 hover:bg-emerald-50 dark:hover:bg-emerald-950/50 px-3 sm:px-4 py-2.5 rounded-xl transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-emerald-500/10 dark:hover:shadow-emerald-400/20"
                >
                  <div className="p-1 bg-emerald-100 dark:bg-emerald-900/50 rounded-lg group-hover:bg-emerald-200 dark:group-hover:bg-emerald-800/70 transition-all duration-300">
                    <ArrowLeft className="h-3 w-3 sm:h-4 sm:w-4 text-emerald-600 dark:text-emerald-400 group-hover:translate-x-[-2px] transition-transform duration-300" />
                  </div>
                  <div className="p-1 bg-teal-100 dark:bg-teal-900/50 rounded-lg group-hover:bg-teal-200 dark:group-hover:bg-teal-800/70 transition-all duration-300">
                    <Home className="h-3 w-3 sm:h-4 sm:w-4 text-teal-600 dark:text-teal-400 group-hover:scale-110 transition-transform duration-300" />
                  </div>
                  <span className="hidden sm:inline text-sm font-semibold text-gray-700 dark:text-gray-300 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors duration-300">
                    Back to Home
                  </span>
                </Link>
                
                <div className="flex items-center gap-2 sm:gap-3 pl-3 sm:pl-4 border-l border-gray-200/60 dark:border-gray-600/60">
                  <Logo showText={false} className="scale-90 sm:scale-100" />
                  <div className="hidden sm:block">
                    <span className="font-bold text-lg sm:text-xl bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 dark:from-emerald-400 dark:via-teal-400 dark:to-emerald-300 bg-clip-text text-transparent">
                      Daily Priority
                    </span>
                  </div>
                </div>
              </div>

              <ThemeToggle />
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="relative z-10 min-h-screen flex items-center justify-center p-3 sm:p-4 md:p-6 pt-20 sm:pt-24 md:pt-28 pb-6 sm:pb-8">
        <div className="w-full max-w-[95%] sm:max-w-md md:max-w-2xl lg:max-w-3xl xl:max-w-4xl animate-fade-in-scale">
          <Card className="relative backdrop-blur-3xl bg-white/98 dark:bg-slate-900/98 border-2 border-emerald-200/70 dark:border-emerald-500/40 shadow-2xl shadow-emerald-500/10 dark:shadow-emerald-400/30 rounded-xl sm:rounded-2xl overflow-hidden">

            {/* Ambient glow */}
            <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/3 via-teal-500/3 to-emerald-500/3 dark:from-emerald-400/15 dark:via-teal-400/12 dark:to-emerald-400/15 rounded-xl sm:rounded-2xl blur-xl -z-10"></div>
            <div className="absolute -inset-1 bg-gradient-to-r from-emerald-400/0 via-emerald-400/5 to-teal-400/0 dark:from-emerald-400/10 dark:via-teal-400/8 dark:to-emerald-400/10 rounded-xl sm:rounded-2xl blur-lg opacity-0 hover:opacity-100 transition-opacity duration-500 -z-20"></div>

            <CardContent className="p-5 sm:p-6 md:p-8 lg:p-10">
              {/* Header */}
              <div className="text-center mb-4 sm:mb-5 md:mb-7">
                <div className="flex justify-center mb-3 sm:mb-4 md:mb-5">
                  <Logo showText={false} className="scale-90 sm:scale-100 md:scale-125" />
                </div>
                <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-1.5 sm:mb-2">
                  {title}
                </h1>
                <p className="text-gray-600 dark:text-gray-300 text-xs sm:text-sm md:text-base px-2">
                  {subtitle}
                </p>
              </div>

              {/* Content */}
              {children}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
