'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { 
  Mail, 
  ArrowRight, 
  AlertCircle,
  Home,
  ArrowLeft,
  Shield
} from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import { ThemeToggle } from '@/components/theme-toggle'
import { Logo } from '@/components/marketing/Logo'
import { toast } from 'sonner'

export default function ForgotPasswordPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const [emailData, setEmailData] = useState({
    email: '',
  })

  const [errors, setErrors] = useState({
    email: '',
    general: '',
  })

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validate email
    if (!emailData.email) {
      setErrors(prev => ({ ...prev, email: 'Email is required', general: '' }))
      return
    }
    
    if (!validateEmail(emailData.email)) {
      setErrors(prev => ({ ...prev, email: 'Please enter a valid email address', general: '' }))
      return
    }
    
    setErrors({ email: '', general: '' })
    setLoading(true)
    
    try {
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: emailData.email,
        }),
      })

      const data = await response.json()

      if (response.ok) {
        // Store sanitized email from API in localStorage for the next step
        if (typeof window !== 'undefined') {
          localStorage.setItem('resetEmail', data.email || emailData.email)
          localStorage.setItem('resetCodeCountdown', '600') // 10 minutes
        }
        toast.success('Verification code sent!', {
          description: 'Check your email inbox for the 6-digit code.',
          duration: 5000,
        })
        // Small delay before redirect for better UX
        setTimeout(() => {
          router.push('/verify-code')
        }, 1000)
      } else {
        setErrors(prev => ({ ...prev, general: data.error || 'Failed to send verification code. Please try again.' }))
        toast.error(data.error || 'Failed to send code', {
          duration: 4000,
        })
      }
    } catch (error) {
      console.error('Forgot password error:', error)
      setErrors(prev => ({ ...prev, general: 'Something went wrong. Please try again.' }))
      toast.error('Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  if (!mounted) {
    return null
  }

  return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-slate-50 via-gray-50 to-slate-100 dark:from-slate-950 dark:via-gray-950 dark:to-slate-900">
      {/* SPECTACULAR Background with Enhanced Dark Mode */}
      <div className="absolute inset-0">
        {/* Enhanced base gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-slate-100/80 via-gray-50/90 to-slate-200/70 dark:from-slate-950/95 dark:via-gray-950/98 dark:to-slate-900/95"></div>
        <div className="absolute inset-0 bg-gradient-radial from-transparent via-emerald-50/20 to-transparent dark:from-transparent dark:via-emerald-950/30 dark:to-transparent"></div>
        
        {/* Islamic pattern overlay */}
        <div className="absolute inset-0 opacity-[0.02] dark:opacity-[0.05]" style={{ 
          backgroundImage: 'url(/islamic-pattern.svg)', 
          backgroundSize: '140px 140px' 
        }} />
        
        {/* Floating Orbs */}
        <div className="absolute top-1/5 left-1/6 w-96 h-96 bg-gradient-to-br from-emerald-400/20 via-teal-400/15 to-cyan-400/25 dark:from-emerald-500/30 dark:via-teal-500/25 dark:to-cyan-500/35 rounded-full blur-3xl animate-float opacity-40 dark:opacity-70"></div>
        <div className="absolute bottom-1/5 right-1/6 w-80 h-80 bg-gradient-to-tl from-purple-400/15 via-pink-400/12 to-rose-400/18 dark:from-purple-500/25 dark:via-pink-500/20 dark:to-rose-500/30 rounded-full blur-3xl animate-float-slow opacity-35 dark:opacity-60"></div>
        <div className="absolute top-1/2 right-1/4 w-72 h-72 bg-gradient-to-r from-blue-400/12 via-indigo-400/15 to-purple-400/20 dark:from-blue-500/22 dark:via-indigo-500/28 dark:to-purple-500/35 rounded-full blur-2xl animate-pulse opacity-30 dark:opacity-55"></div>
        <div className="absolute top-1/3 left-1/2 w-64 h-64 bg-gradient-to-bl from-teal-400/18 via-cyan-400/15 to-emerald-400/22 dark:from-teal-500/28 dark:via-cyan-500/25 dark:to-emerald-500/35 rounded-full blur-3xl animate-float-slower opacity-25 dark:opacity-50"></div>
      </div>

      {/* Enhanced Header */}
      <div className="absolute top-0 left-0 right-0 z-50">
        <div className="backdrop-blur-3xl bg-white/95 dark:bg-gray-900/95 border-b border-emerald-200/60 dark:border-emerald-700/60 shadow-lg shadow-emerald-500/5 dark:shadow-emerald-500/10">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center justify-between">
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
                  <Logo showText={false} className="scale-75 sm:scale-90" />
                  <div className="hidden sm:block">
                    <span className="font-bold text-lg sm:text-xl bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 dark:from-emerald-400 dark:via-teal-400 dark:to-emerald-300 bg-clip-text text-transparent">
                      Daily Priority
                    </span>
                    <p className="text-xs text-gray-500 dark:text-gray-400 -mt-1">Reset your password</p>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 sm:gap-3">
                <Link href="/signin">
                  <button 
                    className="relative overflow-hidden text-white font-semibold px-3 sm:px-6 py-2 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 group text-xs sm:text-sm"
                    style={{ 
                      background: 'linear-gradient(to right, #059669, #0f766e)',
                      color: '#ffffff'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = 'linear-gradient(to right, #047857, #0d9488)'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'linear-gradient(to right, #059669, #0f766e)'
                    }}
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -skew-x-12 translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-1000"></div>
                    <span className="relative flex items-center gap-1 sm:gap-2 text-white" style={{ color: '#ffffff' }}>
                      <Shield className="h-3 w-3 sm:h-4 sm:w-4 text-white" style={{ color: '#ffffff', stroke: '#ffffff' }} />
                      <span className="hidden sm:inline text-white" style={{ color: '#ffffff' }}>Sign In</span>
                      <span className="sm:hidden text-white" style={{ color: '#ffffff' }}>Sign In</span>
                    </span>
                  </button>
                </Link>
                <ThemeToggle />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="relative z-10 min-h-screen flex items-center justify-center p-3 sm:p-4 pt-20 sm:pt-24 pb-6 sm:pb-8">
        <div className={'w-full max-w-[95%] sm:max-w-md lg:max-w-lg ' + (mounted ? 'animate-fade-in-scale' : 'opacity-0')}>
          <Card className="relative backdrop-blur-3xl bg-white/96 dark:bg-slate-900/98 border-2 border-emerald-200/70 dark:border-emerald-500/40 shadow-2xl shadow-emerald-500/10 dark:shadow-emerald-400/30 rounded-2xl overflow-hidden">
            
            {/* Ambient glow */}
            <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/3 via-teal-500/3 to-emerald-500/3 dark:from-emerald-400/15 dark:via-teal-400/12 dark:to-emerald-400/15 rounded-2xl blur-xl -z-10"></div>
            <div className="absolute -inset-1 bg-gradient-to-r from-emerald-400/0 via-emerald-400/5 to-teal-400/0 dark:from-emerald-400/10 dark:via-teal-400/8 dark:to-emerald-400/10 rounded-2xl blur-lg opacity-0 hover:opacity-100 transition-opacity duration-500 -z-20"></div>
            
            <CardContent className="p-5 sm:p-6 md:p-8 lg:p-10">
              {/* Header */}
              <div className="text-center pb-5 sm:pb-6 md:pb-8">
                <div className="flex justify-center mb-3 sm:mb-4 md:mb-5">
                  <Logo showText={false} className="scale-110 sm:scale-125 md:scale-150" />
                </div>
                <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold text-gray-900 dark:text-white mb-2 sm:mb-3">Forgot Password?</h1>
                <p className="text-gray-600 dark:text-gray-300 text-xs sm:text-sm md:text-base lg:text-lg leading-relaxed px-2">
                  No worries! Enter your email and we'll send you a verification code.
                </p>
              </div>
              
              {/* Error Message */}
              {errors.general && (
                <div className="mb-3 sm:mb-4 md:mb-6 p-3 sm:p-3.5 md:p-4 bg-red-50/80 dark:bg-red-950/30 backdrop-blur-sm border border-red-200/60 dark:border-red-500/20 text-red-800 dark:text-red-300 rounded-xl animate-shake relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-r from-red-500/5 to-transparent dark:from-red-400/10 dark:to-transparent"></div>
                  <div className="relative flex items-start gap-2 sm:gap-3">
                    <div className="flex-shrink-0 w-4 h-4 sm:w-5 sm:h-5 rounded-full bg-red-100 dark:bg-red-500/20 flex items-center justify-center mt-0.5">
                      <AlertCircle className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-red-600 dark:text-red-400" />
                    </div>
                    <span className="font-medium text-xs sm:text-sm leading-relaxed">{errors.general}</span>
                  </div>
                </div>
              )}
              
              <form onSubmit={handleEmailSubmit}>
                <div className="space-y-3 sm:space-y-4 md:space-y-5">
                  <div className="space-y-1.5 sm:space-y-2">
                    <Label htmlFor="email" className="text-xs sm:text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-1.5 sm:gap-2">
                      <Mail className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                      <span>Email Address</span>
                    </Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      placeholder="Enter your email address"
                      value={emailData.email}
                      onChange={(e) => {
                        setEmailData(prev => ({ ...prev, email: e.target.value }))
                        setErrors({ email: '', general: '' })
                      }}
                      className={'h-10 sm:h-11 md:h-12 text-xs sm:text-sm md:text-base text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 transition-all duration-300 ' + (errors.email 
                          ? 'border-red-500 dark:border-red-400 bg-red-50/30 dark:bg-red-950/20' 
                          : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800/80 focus:border-emerald-500 dark:focus:border-emerald-400 focus:ring-2 focus:ring-emerald-500/20 dark:focus:ring-emerald-400/20')}
                    />
                    {errors.email && (
                      <p className="text-red-500 dark:text-red-400 text-xs sm:text-sm flex items-center gap-1 mt-1 animate-shake">
                        <AlertCircle className="h-3 w-3 sm:h-4 sm:w-4" />
                        {errors.email}
                      </p>
                    )}
                  </div>
                </div>
                <div className="mt-5 sm:mt-6 md:mt-8">
                  <button
                    type="submit"
                    className="w-full h-10 sm:h-11 md:h-12 lg:h-14 text-white font-semibold text-xs sm:text-sm md:text-base lg:text-lg px-4 sm:px-5 md:px-6 py-2 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] group relative overflow-hidden disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:scale-100"
                    disabled={loading}
                    style={{ 
                      background: 'linear-gradient(to right, #059669, #0f766e)',
                      color: '#ffffff'
                    }}
                    onMouseEnter={(e) => {
                      if (!loading) {
                        e.currentTarget.style.background = 'linear-gradient(to right, #047857, #0d9488)'
                      }
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'linear-gradient(to right, #059669, #0f766e)'
                    }}
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -skew-x-12 translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-1000"></div>
                    <span className="relative flex items-center justify-center gap-1.5 sm:gap-2 text-white" style={{ color: '#ffffff' }}>
                      {loading ? (
                        <>
                          <div className="animate-spin rounded-full h-3.5 w-3.5 sm:h-4 sm:w-4 md:h-5 md:w-5 border-2 border-white/30 border-t-white"></div>
                          <span className="text-white" style={{ color: '#ffffff' }}>Sending...</span>
                        </>
                      ) : (
                        <>
                          <Mail className="h-3.5 w-3.5 sm:h-4 sm:w-4 md:h-5 md:w-5 text-white" style={{ color: '#ffffff', stroke: '#ffffff' }} />
                          <span className="text-white" style={{ color: '#ffffff' }}>Send Verification Code</span>
                          <ArrowRight className="h-3.5 w-3.5 sm:h-4 sm:w-4 md:h-5 md:w-5 group-hover:translate-x-1 transition-transform duration-300 text-white" style={{ color: '#ffffff', stroke: '#ffffff' }} />
                        </>
                      )}
                    </span>
                  </button>
                </div>
                <div className="mt-4 sm:mt-5 md:mt-6 text-center">
                  <p className="text-xs sm:text-sm md:text-base text-gray-600 dark:text-gray-400">
                    Remember your password?{' '}
                    <Link href="/signin" className="text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 dark:hover:text-emerald-300 font-semibold transition-colors duration-300 underline-offset-2 hover:underline inline-flex items-center gap-1 group">
                      Sign In
                      <Shield className="h-3 w-3 sm:h-4 sm:w-4 group-hover:scale-110 transition-transform" />
                    </Link>
                  </p>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}