'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Mail, ArrowRight, AlertCircle, Shield, CheckCircle2, Lock, ArrowLeft, Sparkles } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { ThemeToggle } from '@/components/theme-toggle'
import Logo from '@/components/shared/Logo'
import { SUPPORT_EMAIL } from '@/constants/defaults'

export default function Forgot2FAPage() {
  const router = useRouter()
  const [step, setStep] = useState<'email' | 'code' | 'password'>('email')
  const [loading, setLoading] = useState(false)
  const [email, setEmail] = useState('')
  const [code, setCode] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [errors, setErrors] = useState({
    email: '',
    code: '',
    newPassword: '',
    confirmPassword: '',
    general: '',
  })

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  const handleSendRecoveryCode = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Reset errors
    setErrors({
      email: '',
      code: '',
      newPassword: '',
      confirmPassword: '',
      general: '',
    })
    
    // Validate email
    if (!email) {
      setErrors(prev => ({ ...prev, email: 'Email is required' }))
      return
    }
    
    if (!validateEmail(email)) {
      setErrors(prev => ({ ...prev, email: 'Please enter a valid email address' }))
      return
    }
    
    setLoading(true)

    try {
      const response = await fetch('/api/auth/2fa/recovery', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      })

      const data = await response.json()

      if (response.ok) {
        toast.success('Recovery code sent!', {
          description: 'Check your email for the recovery code.',
          duration: 4000,
        })
        setStep('code')
      } else {
        setErrors(prev => ({ ...prev, general: data.error || 'Failed to send recovery code' }))
        toast.error('Failed to send recovery code')
      }
    } catch (error) {
      setErrors(prev => ({ ...prev, general: 'Something went wrong. Please try again.' }))
      toast.error('Failed to send recovery code')
    } finally {
      setLoading(false)
    }
  }

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Reset errors
    setErrors({
      email: '',
      code: '',
      newPassword: '',
      confirmPassword: '',
      general: '',
    })
    
    // Validate code
    if (!code) {
      setErrors(prev => ({ ...prev, code: 'Recovery code is required' }))
      return
    }
    
    if (code.length !== 6) {
      setErrors(prev => ({ ...prev, code: 'Recovery code must be 6 digits' }))
      return
    }
    
    setLoading(true)

    try {
      // Verify the code before proceeding
      const response = await fetch('/api/auth/2fa/verify-recovery', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code })
      })

      const data = await response.json()

      if (response.ok) {
        toast.success('Code verified!', {
          description: 'Now enter your new 2FA password.',
          duration: 3000,
        })
        setStep('password')
      } else {
        setErrors(prev => ({ ...prev, general: data.error || 'Invalid recovery code' }))
        toast.error(data.error || 'Invalid recovery code')
      }
    } catch (error) {
      setErrors(prev => ({ ...prev, general: 'Something went wrong. Please try again.' }))
      toast.error('Failed to verify code')
    } finally {
      setLoading(false)
    }
  }

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Reset errors
    setErrors({
      email: '',
      code: '',
      newPassword: '',
      confirmPassword: '',
      general: '',
    })
    
    // Validate form
    let hasErrors = false
    
    if (!newPassword) {
      setErrors(prev => ({ ...prev, newPassword: 'New 2FA password is required' }))
      hasErrors = true
    } else if (newPassword.length < 6) {
      setErrors(prev => ({ ...prev, newPassword: '2FA password must be at least 6 characters' }))
      hasErrors = true
    }
    
    if (!confirmPassword) {
      setErrors(prev => ({ ...prev, confirmPassword: 'Please confirm your password' }))
      hasErrors = true
    } else if (newPassword !== confirmPassword) {
      setErrors(prev => ({ ...prev, confirmPassword: 'Passwords do not match' }))
      hasErrors = true
    }
    
    if (hasErrors) return
    
    setLoading(true)

    try {
      const response = await fetch('/api/auth/2fa/reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          email, 
          code, 
          newTwoFactorPassword: newPassword 
        })
      })

      const data = await response.json()

      if (response.ok) {
        toast.success('2FA password reset!', {
          description: 'You can now sign in with your new 2FA password.',
          duration: 4000,
        })
        router.push('/signin')
      } else {
        setErrors(prev => ({ ...prev, general: data.error || 'Failed to reset 2FA password' }))
        toast.error(data.error || 'Invalid recovery code')
      }
    } catch (error) {
      setErrors(prev => ({ ...prev, general: 'Something went wrong. Please try again.' }))
      toast.error('Failed to reset 2FA password')
    } finally {
      setLoading(false)
    }
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
            <div className="inline-flex items-center justify-center w-14 h-14 sm:w-16 sm:h-16 lg:w-20 lg:h-20 rounded-2xl bg-gradient-to-br from-orange-500 via-amber-500 to-yellow-500 dark:from-orange-600 dark:via-amber-600 dark:to-yellow-600 shadow-xl animate-pulse-slow">
              <Shield className="w-7 h-7 sm:w-8 sm:h-8 lg:w-10 lg:h-10 text-white drop-shadow-lg" />
            </div>
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold bg-gradient-to-r from-orange-600 via-amber-600 to-yellow-600 dark:from-orange-400 dark:via-amber-400 dark:to-yellow-400 bg-clip-text text-transparent animate-gradient bg-[length:200%_auto]">
              Forgot 2FA Password?
            </h1>
            <p className="text-gray-600 dark:text-gray-400 text-xs sm:text-sm lg:text-base leading-relaxed px-2">
              {step === 'email' 
                ? 'We\'ll send a recovery code to your email address'
                : step === 'code'
                ? 'Enter the 6-digit code sent to your email'
                : 'Create a new 2FA password for your account'
              }
            </p>
          </div>

          {/* Error Message */}
          {errors.general && (
            <div className="p-3 sm:p-4 bg-red-50 dark:bg-red-950/40 backdrop-blur-sm border-2 border-red-300 dark:border-red-600/50 text-red-800 dark:text-red-100 rounded-xl animate-shake relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-red-500/5 to-transparent dark:from-red-400/10"></div>
              <div className="relative flex items-start gap-2 sm:gap-3">
                <div className="flex-shrink-0 w-4 h-4 sm:w-5 sm:h-5 rounded-full bg-red-200 dark:bg-red-800/50 flex items-center justify-center mt-0.5">
                  <AlertCircle className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-red-700 dark:text-red-200" />
                </div>
                <span className="font-semibold text-xs sm:text-sm lg:text-base">{errors.general}</span>
              </div>
            </div>
          )}

          {/* Step 1: Send Recovery Code */}
          {step === 'email' && (
            <form onSubmit={handleSendRecoveryCode} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-xs sm:text-sm lg:text-base font-bold text-gray-800 dark:text-gray-200 flex items-center gap-1.5 sm:gap-2">
                  <Mail className="w-3.5 h-3.5 sm:w-4 sm:h-4 lg:w-5 lg:h-5 text-orange-600 dark:text-orange-400" />
                  Email Address
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value)
                    setErrors(prev => ({ ...prev, email: '', general: '' }))
                  }}
                  className={'h-11 sm:h-12 lg:h-13 text-sm sm:text-base lg:text-lg text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 transition-all duration-300 border-2 rounded-xl ' + (errors.email 
                    ? 'border-red-500 dark:border-red-400 bg-red-50/50 dark:bg-red-950/20 focus:border-red-600 dark:focus:border-red-400' 
                    : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800/90 focus:border-orange-500 dark:focus:border-orange-400 focus:ring-4 focus:ring-orange-500/20 dark:focus:ring-orange-400/20')}
                />
                {errors.email && (
                  <p className="text-red-600 dark:text-red-300 text-xs sm:text-sm font-semibold flex items-center gap-1.5 animate-shake">
                    <AlertCircle className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                    {errors.email}
                  </p>
                )}
              </div>

              <button
                type="submit"
                disabled={loading}
                style={{ 
                  background: 'linear-gradient(to right, #ea580c, #f59e0b, #eab308)',
                  color: '#ffffff'
                }}
                onMouseEnter={(e) => {
                  if (!loading) {
                    e.currentTarget.style.background = 'linear-gradient(to right, #c2410c, #d97706, #ca8a04)'
                  }
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'linear-gradient(to right, #ea580c, #f59e0b, #eab308)'
                }}
                className="w-full h-11 sm:h-12 lg:h-14 inline-flex items-center justify-center gap-1.5 sm:gap-2 text-white font-bold text-sm sm:text-base lg:text-lg rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:scale-100 relative overflow-hidden group"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -skew-x-12 translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-1000"></div>
                <span className="relative flex items-center justify-center gap-1.5 sm:gap-2 text-white" style={{ color: '#ffffff' }}>
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 sm:h-5 sm:w-5 border-2 border-white/30 border-t-white"></div>
                      <span className="text-white" style={{ color: '#ffffff' }}>Sending...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4 sm:h-5 sm:w-5 text-white" style={{ color: '#ffffff', stroke: '#ffffff' }} />
                      <span className="text-white" style={{ color: '#ffffff' }}>Send Recovery Code</span>
                      <ArrowRight className="h-4 w-4 sm:h-5 sm:w-5 group-hover:translate-x-1 transition-transform text-white" style={{ color: '#ffffff', stroke: '#ffffff' }} />
                    </>
                  )}
                </span>
              </button>
            </form>
          )}

          {/* Step 2: Verify Recovery Code */}
          {step === 'code' && (
            <form onSubmit={handleVerifyCode} className="space-y-5">
              {/* Recovery Code */}
              <div className="space-y-2">
                <Label htmlFor="code" className="text-xs sm:text-sm lg:text-base font-bold text-gray-800 dark:text-gray-200 flex items-center gap-1.5 sm:gap-2">
                  <Mail className="w-3.5 h-3.5 sm:w-4 sm:h-4 lg:w-5 lg:h-5 text-orange-600 dark:text-orange-400" />
                  Recovery Code
                </Label>
                <Input
                  id="code"
                  type="text"
                  placeholder="Enter 6-digit code"
                  value={code}
                  onChange={(e) => {
                    setCode(e.target.value.replace(/\D/g, '').slice(0, 6))
                    setErrors(prev => ({ ...prev, code: '', general: '' }))
                  }}
                  maxLength={6}
                  autoFocus
                  className={'h-14 sm:h-16 lg:h-18 text-center text-2xl sm:text-3xl lg:text-4xl tracking-[0.5em] font-mono font-bold border-2 rounded-xl transition-all duration-300 ' + (errors.code 
                    ? 'border-red-500 dark:border-red-400 bg-red-50/50 dark:bg-red-950/20 focus:border-red-600 dark:focus:border-red-400 text-red-900 dark:text-red-100' 
                    : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800/90 focus:border-orange-500 dark:focus:border-orange-400 focus:ring-4 focus:ring-orange-500/20 dark:focus:ring-orange-400/20 text-gray-900 dark:text-white')}
                />
                {errors.code && (
                  <p className="text-red-600 dark:text-red-300 text-xs sm:text-sm font-semibold flex items-center gap-1.5 animate-shake">
                    <AlertCircle className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                    {errors.code}
                  </p>
                )}
              </div>

              {/* Info Box */}
              <div className="flex items-start gap-2 sm:gap-3 p-3 sm:p-4 bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-950/40 dark:to-cyan-950/40 rounded-xl border-2 border-blue-300 dark:border-blue-600/50 shadow-sm">
                <Mail className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600 dark:text-blue-300 flex-shrink-0 mt-0.5" />
                <p className="text-xs sm:text-sm lg:text-base text-blue-800 dark:text-blue-100 font-medium leading-relaxed">
                  Check your email for the 6-digit recovery code. It expires in 10 minutes.
                </p>
              </div>

              {/* Buttons */}
              <div className="space-y-3 pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  style={{ 
                    background: 'linear-gradient(to right, #ea580c, #f59e0b, #eab308)',
                    color: '#ffffff'
                  }}
                  onMouseEnter={(e) => {
                    if (!loading) {
                      e.currentTarget.style.background = 'linear-gradient(to right, #c2410c, #d97706, #ca8a04)'
                    }
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'linear-gradient(to right, #ea580c, #f59e0b, #eab308)'
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
                        <span className="text-white" style={{ color: '#ffffff' }}>Verify Code</span>
                        <ArrowRight className="h-4 w-4 sm:h-5 sm:w-5 group-hover:translate-x-1 transition-transform text-white" style={{ color: '#ffffff', stroke: '#ffffff' }} />
                      </>
                    )}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={handleSendRecoveryCode}
                  disabled={loading}
                  className="w-full h-11 sm:h-12 lg:h-14 px-4 sm:px-6 border-2 border-gray-300 dark:border-gray-600 rounded-xl font-semibold text-sm sm:text-base lg:text-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800/50 hover:border-orange-500 dark:hover:border-orange-400 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  <Mail className="h-4 w-4 sm:h-5 sm:w-5" />
                  Resend Code
                </button>

                <button
                  type="button"
                  onClick={() => setStep('email')}
                  className="w-full h-11 sm:h-12 lg:h-14 px-4 sm:px-6 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 font-medium text-sm sm:text-base lg:text-lg transition-colors flex items-center justify-center gap-2"
                >
                  <ArrowLeft className="h-4 w-4 sm:h-5 sm:w-5" />
                  Back to Email
                </button>
              </div>
            </form>
          )}

          {/* Step 3: Set New Password */}
          {step === 'password' && (
            <form onSubmit={handleResetPassword} className="space-y-5">
              {/* New Password */}
              <div className="space-y-2">
                <Label htmlFor="newPassword" className="text-xs sm:text-sm lg:text-base font-bold text-gray-800 dark:text-gray-200 flex items-center gap-1.5 sm:gap-2">
                  <Lock className="w-3.5 h-3.5 sm:w-4 sm:h-4 lg:w-5 lg:h-5 text-green-600 dark:text-green-400" />
                  New 2FA Password
                </Label>
                <Input
                  id="newPassword"
                  type="password"
                  placeholder="Enter new 2FA password (min. 6 characters)"
                  value={newPassword}
                  onChange={(e) => {
                    setNewPassword(e.target.value)
                    setErrors(prev => ({ ...prev, newPassword: '', general: '' }))
                  }}
                  autoFocus
                  className={'h-11 sm:h-12 lg:h-13 text-sm sm:text-base lg:text-lg border-2 rounded-xl transition-all duration-300 dark:placeholder:text-gray-500 ' + (errors.newPassword 
                    ? 'border-red-500 dark:border-red-400 bg-red-50/50 dark:bg-red-950/20 focus:border-red-600 dark:focus:border-red-400 text-red-900 dark:text-red-100' 
                    : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800/90 focus:border-green-500 dark:focus:border-green-400 focus:ring-4 focus:ring-green-500/20 dark:focus:ring-green-400/20 text-gray-900 dark:text-white')}
                />
                {errors.newPassword && (
                  <p className="text-red-600 dark:text-red-300 text-xs sm:text-sm font-semibold flex items-center gap-1.5 animate-shake">
                    <AlertCircle className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                    {errors.newPassword}
                  </p>
                )}
              </div>

              {/* Confirm Password */}
              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="text-xs sm:text-sm lg:text-base font-bold text-gray-800 dark:text-gray-200 flex items-center gap-1.5 sm:gap-2">
                  <Lock className="w-3.5 h-3.5 sm:w-4 sm:h-4 lg:w-5 lg:h-5 text-green-600 dark:text-green-400" />
                  Confirm 2FA Password
                </Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="Re-enter your new 2FA password"
                  value={confirmPassword}
                  onChange={(e) => {
                    setConfirmPassword(e.target.value)
                    setErrors(prev => ({ ...prev, confirmPassword: '', general: '' }))
                  }}
                  className={'h-11 sm:h-12 lg:h-13 text-sm sm:text-base lg:text-lg border-2 rounded-xl transition-all duration-300 dark:placeholder:text-gray-500 ' + (errors.confirmPassword 
                    ? 'border-red-500 dark:border-red-400 bg-red-50/50 dark:bg-red-950/20 focus:border-red-600 dark:focus:border-red-400 text-red-900 dark:text-red-100' 
                    : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800/90 focus:border-green-500 dark:focus:border-green-400 focus:ring-4 focus:ring-green-500/20 dark:focus:ring-green-400/20 text-gray-900 dark:text-white')}
                />
                {errors.confirmPassword && (
                  <p className="text-red-600 dark:text-red-300 text-xs sm:text-sm font-semibold flex items-center gap-1.5 animate-shake">
                    <AlertCircle className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                    {errors.confirmPassword}
                  </p>
                )}
              </div>

              {/* Info Box */}
              <div className="flex items-start gap-2 sm:gap-3 p-3 sm:p-4 bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-950/40 dark:to-cyan-950/40 rounded-xl border-2 border-blue-300 dark:border-blue-600/50 shadow-sm">
                <Shield className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600 dark:text-blue-300 flex-shrink-0 mt-0.5" />
                <p className="text-xs sm:text-sm lg:text-base text-blue-800 dark:text-blue-100 font-medium leading-relaxed">
                  This will be your new 2FA password for signing in. Make sure to remember it!
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
                  className="w-full h-11 sm:h-12 lg:h-14 inline-flex items-center justify-center gap-1.5 sm:gap-2 text-white font-bold text-sm sm:text-base lg:text-lg rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:scale-100 relative overflow-hidden group"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -skew-x-12 translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-1000"></div>
                  <span className="relative flex items-center justify-center gap-1.5 sm:gap-2 text-white" style={{ color: '#ffffff' }}>
                    {loading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 sm:h-5 sm:w-5 border-2 border-white/30 border-t-white"></div>
                        <span className="text-white" style={{ color: '#ffffff' }}>Resetting...</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="h-4 w-4 sm:h-5 sm:w-5 text-white" style={{ color: '#ffffff', stroke: '#ffffff' }} />
                        <span className="text-white" style={{ color: '#ffffff' }}>Reset 2FA Password</span>
                      </>
                    )}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setStep('code')}
                  className="w-full h-11 sm:h-12 lg:h-14 px-4 sm:px-6 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 font-medium text-sm sm:text-base lg:text-lg transition-colors flex items-center justify-center gap-2"
                >
                  <ArrowLeft className="h-4 w-4 sm:h-5 sm:w-5" />
                  Back to Code
                </button>
              </div>
            </form>
          )}

          {/* Back to Sign In */}
          <div className="pt-6 text-center border-t-2 border-gray-200 dark:border-gray-700/80">
            <Link 
              href="/signin" 
              className="text-sm sm:text-base text-orange-600 hover:text-orange-700 dark:text-orange-400 dark:hover:text-orange-300 font-bold transition-all duration-300 inline-flex items-center gap-2 group hover:gap-3"
            >
              <ArrowLeft className="h-4 w-4 sm:h-5 sm:w-5 group-hover:-translate-x-1 transition-transform" />
              Back to Sign In
            </Link>
          </div>
        </div>

        {/* Help Text */}
        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Need help? Contact{' '}
            <a href={`mailto:${SUPPORT_EMAIL}`} className="text-orange-600 hover:text-orange-700 dark:text-orange-400 dark:hover:text-orange-300 font-semibold hover:underline">
              support
            </a>
          </p>
        </div>
      </div>
    </div>
  )
}
