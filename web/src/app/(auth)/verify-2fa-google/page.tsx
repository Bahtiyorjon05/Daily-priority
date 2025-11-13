'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { signIn, useSession } from 'next-auth/react'
import Link from 'next/link'
import { Shield, ArrowRight, AlertCircle, Eye, EyeOff, ArrowLeft, CheckCircle2 } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { ThemeToggle } from '@/components/theme-toggle'
import Logo from '@/components/shared/Logo'

function Verify2FAGoogleContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const email = searchParams.get('email')
  const { data: session, update } = useSession()
  
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [twoFactorPassword, setTwoFactorPassword] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    // If no email in query params, redirect to signin
    if (!email) {
      router.push('/signin')
    }
  }, [email, router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    setError('')
    
    if (!twoFactorPassword) {
      setError('2FA password is required')
      return
    }

    if (!email) {
      setError('Email not found. Please try signing in again.')
      return
    }

    setLoading(true)

    try {
      // Decode the email (it comes URL encoded from query params)
      const decodedEmail = decodeURIComponent(email)
      
      // Verify 2FA password and create verification token
      const verify2FAResponse = await fetch('/api/auth/2fa/verify-google', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          email: decodedEmail, 
          twoFactorPassword 
        })
      })

      const data = await verify2FAResponse.json()

      if (!verify2FAResponse.ok) {
        setError(data.error || 'Invalid 2FA password')
        toast.error('Invalid 2FA password')
        setLoading(false)
        return
      }

      // 2FA verified! Token created in DB.
      console.log('[2FA] Verification successful, token created')
      
      // Force multiple session updates to clear the needs2FA flag
      console.log('[2FA] Updating session...')
      await update({ forceRefresh: true })
      await new Promise(resolve => setTimeout(resolve, 500))
      await update({ forceRefresh: true })
      
      toast.success('2FA verified!', {
        description: 'Redirecting to dashboard...',
        duration: 1500,
      })

      await new Promise(resolve => setTimeout(resolve, 800))
      
      console.log('[2FA] Redirecting to dashboard...')
      window.location.href = '/dashboard'

    } catch (error) {
      console.error('2FA verification error:', error)
      setError('Something went wrong. Please try again.')
      toast.error('Verification failed')
      setLoading(false)
    }
  }

  if (!email) {
    return null // Will redirect via useEffect
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 sm:p-6 bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 dark:from-gray-950 dark:via-slate-950 dark:to-gray-900 relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 -left-4 w-72 h-72 bg-purple-300 dark:bg-purple-900 rounded-full mix-blend-multiply dark:mix-blend-soft-light filter blur-xl opacity-20 dark:opacity-10 animate-blob"></div>
        <div className="absolute top-0 -right-4 w-72 h-72 bg-yellow-300 dark:bg-yellow-900 rounded-full mix-blend-multiply dark:mix-blend-soft-light filter blur-xl opacity-20 dark:opacity-10 animate-blob animation-delay-2000"></div>
        <div className="absolute -bottom-8 left-20 w-72 h-72 bg-pink-300 dark:bg-pink-900 rounded-full mix-blend-multiply dark:mix-blend-soft-light filter blur-xl opacity-20 dark:opacity-10 animate-blob animation-delay-4000"></div>
      </div>

      {/* Theme Toggle Button */}
      <div className="absolute top-4 right-4 sm:top-6 sm:right-6 z-50">
        <ThemeToggle />
      </div>

      <div className="w-full max-w-[95%] sm:max-w-md lg:max-w-lg relative z-10">
        <div className="bg-white/95 dark:bg-gray-900/95 backdrop-blur-2xl shadow-2xl rounded-3xl border-2 border-gray-200/80 dark:border-gray-700/80 p-4 sm:p-6 lg:p-8 space-y-5 sm:space-y-6">
          {/* Logo and Header */}
          <div className="text-center space-y-3 sm:space-y-4">
            <div className="flex justify-center mb-3 sm:mb-4">
              <Logo size="xl" />
            </div>
            <div className="inline-flex items-center justify-center w-14 h-14 sm:w-16 sm:h-16 lg:w-20 lg:h-20 rounded-2xl bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-500 dark:from-emerald-600 dark:via-teal-600 dark:to-cyan-600 shadow-xl animate-pulse-slow">
              <Shield className="w-7 h-7 sm:w-8 sm:h-8 lg:w-10 lg:h-10 text-white drop-shadow-lg" />
            </div>
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 dark:from-emerald-400 dark:via-teal-400 dark:to-cyan-400 bg-clip-text text-transparent animate-gradient bg-[length:200%_auto]">
              Two-Factor Authentication
            </h1>
            <p className="text-gray-600 dark:text-gray-400 text-xs sm:text-sm lg:text-base leading-relaxed px-2">
              Enter your 2FA password to complete sign in with Google
            </p>
            {email && (
              <div className="flex items-center justify-center gap-2 text-xs sm:text-sm text-gray-500 dark:text-gray-400 bg-blue-50 dark:bg-blue-950/30 rounded-lg p-2 border border-blue-200 dark:border-blue-800/50">
                <span className="font-medium">{decodeURIComponent(email)}</span>
              </div>
            )}
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-3 sm:p-4 bg-red-50 dark:bg-red-950/40 backdrop-blur-sm border-2 border-red-300 dark:border-red-600/50 text-red-800 dark:text-red-100 rounded-xl animate-shake relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-red-500/5 to-transparent dark:from-red-400/10"></div>
              <div className="relative flex items-start gap-2 sm:gap-3">
                <div className="flex-shrink-0 w-4 h-4 sm:w-5 sm:h-5 rounded-full bg-red-200 dark:bg-red-800/50 flex items-center justify-center mt-0.5">
                  <AlertCircle className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-red-700 dark:text-red-200" />
                </div>
                <span className="font-semibold text-xs sm:text-sm lg:text-base">{error}</span>
              </div>
            </div>
          )}

          {/* 2FA Password Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* 2FA Password Field */}
            <div className="space-y-2">
              <Label htmlFor="twoFactorPassword" className="text-xs sm:text-sm lg:text-base font-bold text-gray-800 dark:text-gray-200 flex items-center gap-1.5 sm:gap-2">
                <Shield className="w-3.5 h-3.5 sm:w-4 sm:h-4 lg:w-5 lg:h-5 text-emerald-600 dark:text-emerald-400" />
                2FA Password
              </Label>
              <div className="relative">
                <Input
                  id="twoFactorPassword"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter your 2FA password"
                  value={twoFactorPassword}
                  onChange={(e) => {
                    setTwoFactorPassword(e.target.value)
                    setError('')
                  }}
                  autoFocus
                  className={'h-11 sm:h-12 lg:h-13 pr-10 text-sm sm:text-base lg:text-lg border-2 rounded-xl transition-all duration-300 dark:placeholder:text-gray-500 ' + (error 
                    ? 'border-red-500 dark:border-red-400 bg-red-50/50 dark:bg-red-950/20 focus:border-red-600 dark:focus:border-red-400 text-red-900 dark:text-red-100' 
                    : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800/90 focus:border-emerald-500 dark:focus:border-emerald-400 focus:ring-4 focus:ring-emerald-500/20 dark:focus:ring-emerald-400/20 text-gray-900 dark:text-white')}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-gray-100 dark:hover:bg-gray-700/50 rounded-lg transition-colors"
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4 sm:w-5 sm:w-5 text-gray-400 dark:text-gray-500" />
                  ) : (
                    <Eye className="w-4 h-4 sm:w-5 sm:w-5 text-gray-400 dark:text-gray-500" />
                  )}
                </button>
              </div>
              <div className="flex items-center justify-end">
                <Link
                  href="/forgot-2fa"
                  className="text-xs sm:text-sm text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 dark:hover:text-emerald-300 font-semibold transition-colors duration-300 underline-offset-2 hover:underline"
                >
                  Forgot 2FA password?
                </Link>
              </div>
            </div>

            {/* Info Box */}
            <div className="flex items-start gap-2 sm:gap-3 p-3 sm:p-4 bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-950/40 dark:to-cyan-950/40 rounded-xl border-2 border-blue-300 dark:border-blue-600/50 shadow-sm">
              <Shield className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600 dark:text-blue-300 flex-shrink-0 mt-0.5" />
              <p className="text-xs sm:text-sm lg:text-base text-blue-800 dark:text-blue-100 font-medium leading-relaxed">
                Your account is protected with two-factor authentication. Enter your 2FA password to continue.
              </p>
            </div>

            {/* Buttons */}
            <div className="space-y-3 pt-2">
              <button
                type="submit"
                disabled={loading}
                style={{ 
                  background: 'linear-gradient(to right, #059669, #047857, #0f766e)',
                  color: '#ffffff'
                }}
                onMouseEnter={(e) => {
                  if (!loading) {
                    e.currentTarget.style.background = 'linear-gradient(to right, #047857, #065f46, #134e4a)'
                  }
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'linear-gradient(to right, #059669, #047857, #0f766e)'
                }}
                className="w-full h-11 sm:h-12 lg:h-14 rounded-xl font-bold text-sm sm:text-base lg:text-lg shadow-xl hover:shadow-2xl transition-all duration-300 relative overflow-hidden group disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -skew-x-12 translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-1000"></div>
                <span className="relative flex items-center justify-center gap-1.5 sm:gap-2 text-white" style={{ color: '#ffffff' }}>
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 sm:h-5 sm:w-5 border-2 border-white/30 border-t-white"></div>
                      <span className="text-white" style={{ color: '#ffffff' }}>Verifying...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="h-4 w-4 sm:h-5 sm:w-5 text-white" style={{ color: '#ffffff', stroke: '#ffffff' }} />
                      <span className="text-white" style={{ color: '#ffffff' }}>Verify & Continue</span>
                      <ArrowRight className="h-4 w-4 sm:h-5 sm:w-5 group-hover:translate-x-1 transition-transform text-white" style={{ color: '#ffffff', stroke: '#ffffff' }} />
                    </>
                  )}
                </span>
              </button>

              <button
                type="button"
                onClick={() => router.push('/signin')}
                className="w-full h-11 sm:h-12 lg:h-14 px-4 sm:px-6 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 font-medium text-sm sm:text-base lg:text-lg transition-colors flex items-center justify-center gap-2"
              >
                <ArrowLeft className="h-4 w-4 sm:h-5 sm:w-5" />
                Back to Sign In
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

export default function Verify2FAGooglePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600" />
      </div>
    }>
      <Verify2FAGoogleContent />
    </Suspense>
  )
}
