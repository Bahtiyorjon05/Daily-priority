'use client'

import { useState, useEffect, useCallback } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  Mail, Lock, User, ArrowRight, Eye, EyeOff, AlertCircle,
  CheckCircle2, Shield, Sparkles, ArrowLeft, Clock,
  Send, RefreshCw, Check
} from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { calculatePasswordStrength } from '@/lib/password-strength'
import styles from './SignUpForm.module.css'

type Step = 'email' | 'code' | 'password'

export function SignUpForm() {
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState<Step>('email')
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [timeLeft, setTimeLeft] = useState(600) // 10 minutes
  const [timerActive, setTimerActive] = useState(false)
  const [canResend, setCanResend] = useState(false)

  const [formData, setFormData] = useState({
    email: '',
    verificationCode: '',
    name: '',
    password: '',
    confirmPassword: '',
  })

  const [errors, setErrors] = useState({
    email: '',
    code: '',
    name: '',
    password: '',
    confirmPassword: '',
    general: '',
  })

  // Password strength calculation
  const passwordStrength = formData.password
    ? calculatePasswordStrength(formData.password)
    : null

  // Password match indicator
  const passwordsMatch = formData.password && formData.confirmPassword
    ? formData.password === formData.confirmPassword
    : null

  // Timer countdown
  useEffect(() => {
    if (timerActive && timeLeft > 0) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000)
      return () => clearTimeout(timer)
    } else if (timeLeft === 0) {
      setTimerActive(false)
      toast.error('Verification code expired', {
        description: 'Please request a new code',
      })
    }
  }, [timerActive, timeLeft])

  // Resend cooldown (60 seconds)
  useEffect(() => {
    if (timerActive && !canResend) {
      const timer = setTimeout(() => setCanResend(true), 60000)
      return () => clearTimeout(timer)
    }
  }, [timerActive, canResend])

  // Format time as MM:SS
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  // Step 1: Send verification code
  const handleSendCode = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrors({ email: '', code: '', name: '', password: '', confirmPassword: '', general: '' })

    if (!formData.email) {
      setErrors(prev => ({ ...prev, email: 'Email is required' }))
      return
    }

    if (!validateEmail(formData.email)) {
      setErrors(prev => ({ ...prev, email: 'Please enter a valid email address' }))
      return
    }

    setLoading(true)

    try {
      const res = await fetch('/api/auth/send-verification-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: formData.email }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Failed to send verification code')
      }

      toast.success('Verification code sent!', {
        description: 'Check your email for the 6-digit code',
      })

      setCurrentStep('code')
      setTimeLeft(600) // Reset to 10 minutes
      setTimerActive(true)
      setCanResend(false)
    } catch (error: any) {
      setErrors(prev => ({ ...prev, general: error.message || 'Failed to send code' }))
      toast.error(error.message || 'Failed to send code')
    } finally {
      setLoading(false)
    }
  }

  // Resend verification code
  const handleResendCode = async () => {
    if (!canResend) return

    setLoading(true)

    try {
      const res = await fetch('/api/auth/send-verification-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: formData.email }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Failed to resend code')
      }

      toast.success('New code sent!', {
        description: 'Check your email',
      })

      setTimeLeft(600)
      setTimerActive(true)
      setCanResend(false)
      setFormData(prev => ({ ...prev, verificationCode: '' }))
    } catch (error: any) {
      toast.error(error.message || 'Failed to resend code')
    } finally {
      setLoading(false)
    }
  }

  // Step 2: Verify code
  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrors({ email: '', code: '', name: '', password: '', confirmPassword: '', general: '' })

    if (!formData.verificationCode || formData.verificationCode.length !== 6) {
      setErrors(prev => ({ ...prev, code: 'Please enter the 6-digit code' }))
      return
    }

    setLoading(true)

    try {
      const res = await fetch('/api/auth/verify-signup-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: formData.email,
          code: formData.verificationCode,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Invalid verification code')
      }

      toast.success('Email verified!', {
        description: 'Now create your password',
      })

      setCurrentStep('password')
      setTimerActive(false)
    } catch (error: any) {
      setErrors(prev => ({ ...prev, code: error.message || 'Invalid code' }))
      toast.error(error.message || 'Invalid code')
    } finally {
      setLoading(false)
    }
  }

  // Auto-verify when 6 digits entered
  useEffect(() => {
    if (currentStep === 'code' && formData.verificationCode.length === 6 && !loading) {
      handleVerifyCode({ preventDefault: () => {} } as React.FormEvent)
    }
  }, [formData.verificationCode])

  // Step 3: Create account
  const handleCreateAccount = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrors({ email: '', code: '', name: '', password: '', confirmPassword: '', general: '' })

    let hasErrors = false

    if (!formData.name.trim()) {
      setErrors(prev => ({ ...prev, name: 'Name is required' }))
      hasErrors = true
    } else if (formData.name.trim().length < 2) {
      setErrors(prev => ({ ...prev, name: 'Name must be at least 2 characters' }))
      hasErrors = true
    }

    if (!formData.password) {
      setErrors(prev => ({ ...prev, password: 'Password is required' }))
      hasErrors = true
    } else if (formData.password.length < 8) {
      setErrors(prev => ({ ...prev, password: 'Password must be at least 8 characters' }))
      hasErrors = true
    }

    if (!formData.confirmPassword) {
      setErrors(prev => ({ ...prev, confirmPassword: 'Please confirm your password' }))
      hasErrors = true
    } else if (formData.password !== formData.confirmPassword) {
      setErrors(prev => ({ ...prev, confirmPassword: 'Passwords do not match' }))
      hasErrors = true
    }

    if (hasErrors) return

    setLoading(true)

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: formData.email,
          name: formData.name,
          password: formData.password,
          confirmPassword: formData.confirmPassword,
          verificationCode: formData.verificationCode,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Registration failed')
      }

      toast.success('Account created!', {
        description: 'Signing you in...',
        duration: 2000,
      })

      // Auto sign in
      const result = await signIn('credentials', {
        email: formData.email,
        password: formData.password,
        redirect: false,
      })

      if (result?.ok) {
        router.push('/dashboard')
        router.refresh()
      } else {
        setErrors(prev => ({
          ...prev,
          general: 'Account created but sign-in failed. Please try signing in manually.',
        }))
      }
    } catch (error: any) {
      setErrors(prev => ({ ...prev, general: error.message || 'Something went wrong' }))
      toast.error(error.message || 'Registration failed')
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleSignIn = async () => {
    try {
      await signIn('google', { callbackUrl: '/dashboard' })
    } catch (error) {
      toast.error('Google sign-up failed')
    }
  }

  // Progress steps
  const steps = [
    { id: 'email', label: 'Email', number: 1 },
    { id: 'code', label: 'Verify', number: 2 },
    { id: 'password', label: 'Password', number: 3 },
  ]

  const currentStepNumber = steps.findIndex(s => s.id === currentStep) + 1

  return (
    <div className="space-y-3 sm:space-y-4 md:space-y-5">
      {/* Progress Indicator */}
      <div className="flex items-center justify-center gap-1.5 sm:gap-2 md:gap-3 pb-3 sm:pb-4">
        {steps.map((step, index) => (
          <div key={step.id} className="flex items-center gap-1.5 sm:gap-2">
            <div className="flex flex-col items-center gap-0.5 sm:gap-1">
              <div
                className={`w-7 h-7 sm:w-9 sm:h-9 md:w-10 md:h-10 rounded-full flex items-center justify-center font-bold text-xs sm:text-sm md:text-base transition-all duration-300 ${
                  currentStepNumber > step.number
                    ? 'bg-emerald-600 text-white'
                    : currentStepNumber === step.number
                    ? 'bg-emerald-600 text-white ring-4 ring-emerald-100 dark:ring-emerald-900/50'
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400'
                }`}
              >
                {currentStepNumber > step.number ? (
                  <Check className="w-4 h-4 sm:w-5 sm:h-5" />
                ) : (
                  step.number
                )}
              </div>
              <span className={`text-[10px] sm:text-xs font-medium ${
                currentStepNumber >= step.number
                  ? 'text-emerald-600 dark:text-emerald-400'
                  : 'text-gray-500 dark:text-gray-400'
              }`}>
                {step.label}
              </span>
            </div>
            {index < steps.length - 1 && (
              <div
                className={`w-6 sm:w-10 md:w-12 h-0.5 mb-5 sm:mb-6 transition-all duration-300 ${
                  currentStepNumber > step.number
                    ? 'bg-emerald-600'
                    : 'bg-gray-200 dark:bg-gray-700'
                }`}
              />
            )}
          </div>
        ))}
      </div>

      {/* Error Message */}
      {errors.general && (
        <div className="p-3 sm:p-4 bg-red-50/80 dark:bg-red-950/30 backdrop-blur-sm border border-red-200/60 dark:border-red-500/20 text-red-800 dark:text-red-300 rounded-xl animate-shake relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-red-500/5 to-transparent dark:from-red-400/10 dark:to-transparent"></div>
          <div className="relative flex items-start gap-2 sm:gap-3">
            <div className="flex-shrink-0 w-4 h-4 sm:w-5 sm:h-5 rounded-full bg-red-100 dark:bg-red-500/20 flex items-center justify-center mt-0.5">
              <AlertCircle className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-red-600 dark:text-red-400" />
            </div>
            <span className="font-medium text-xs sm:text-sm leading-relaxed">{errors.general}</span>
          </div>
        </div>
      )}

      {/* Step 1: Email Entry */}
      {currentStep === 'email' && (
        <>
          {/* Google Sign Up */}
          <button
            type="button"
            onClick={handleGoogleSignIn}
            className="w-full h-9 sm:h-10 md:h-11 inline-flex items-center justify-center gap-1 sm:gap-1.5 border-2 border-gray-200 dark:border-gray-700 hover:border-emerald-300 dark:hover:border-emerald-600 bg-white dark:bg-gray-800 hover:bg-emerald-50/50 dark:hover:bg-emerald-950/30 rounded-lg sm:rounded-xl transition-all duration-300 hover:scale-[1.02] hover:shadow-lg group font-semibold text-[11px] sm:text-xs md:text-sm text-gray-700 dark:text-gray-200"
          >
            <svg className="w-4 h-4 sm:w-5 sm:h-5 group-hover:scale-110 transition-transform flex-shrink-0" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            <span className="truncate">Continue with Google</span>
          </button>

          {/* Divider */}
          <div className="relative py-2 sm:py-3">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-gray-200 dark:border-gray-700" />
            </div>
            <div className="relative flex justify-center text-[10px] sm:text-xs md:text-sm uppercase">
              <span className="bg-white dark:bg-slate-900 px-2 sm:px-3 text-gray-500 dark:text-gray-400 font-medium">
                Or continue with email
              </span>
            </div>
          </div>

          {/* Email Form */}
          <form onSubmit={handleSendCode} className="space-y-3 sm:space-y-4">
            <div className="space-y-1.5 sm:space-y-2">
              <Label htmlFor="email" className="text-xs sm:text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-1.5 sm:gap-2">
                <Mail className="w-3 h-3 sm:w-4 sm:h-4" />
                Email Address
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={formData.email}
                onChange={(e) => {
                  setFormData({ ...formData, email: e.target.value })
                  setErrors(prev => ({ ...prev, email: '', general: '' }))
                }}
                className={'h-10 sm:h-11 md:h-12 text-xs sm:text-sm md:text-base text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 transition-all duration-300 ' + (errors.email
                    ? 'border-red-500 dark:border-red-400 bg-red-50/30 dark:bg-red-950/20 focus:border-red-500 dark:focus:border-red-400'
                    : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800/80 focus:border-emerald-500 dark:focus:border-emerald-400 focus:ring-2 focus:ring-emerald-500/20 dark:focus:ring-emerald-400/20')}
              />
              {errors.email && (
                <p className="text-red-500 dark:text-red-400 text-[10px] sm:text-xs md:text-sm flex items-center gap-1 mt-1 animate-shake">
                  <AlertCircle className="h-2.5 w-2.5 sm:h-3 sm:w-3 md:h-4 md:w-4 flex-shrink-0" />
                  {errors.email}
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full h-11 sm:h-12 md:h-13 inline-flex items-center justify-center gap-2 text-white font-bold text-sm sm:text-base px-4 sm:px-6 rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 group relative overflow-hidden disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:scale-100 border-0"
              style={{
                background: 'linear-gradient(to right, #059669, #047857, #0f766e)',
                color: '#ffffff'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'linear-gradient(to right, #047857, #065f46, #134e4a)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'linear-gradient(to right, #059669, #047857, #0f766e)'
              }}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -skew-x-12 translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-1000"></div>
              <span className="relative flex items-center justify-center gap-2 drop-shadow-md text-white" style={{ color: '#ffffff' }}>
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 sm:h-5 sm:w-5 border-2 border-white/30 border-t-white"></div>
                    <span className="font-semibold text-white" style={{ color: '#ffffff' }}>Sending...</span>
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0 text-white" style={{ color: '#ffffff', stroke: '#ffffff' }} />
                    <span className="font-semibold text-white" style={{ color: '#ffffff' }}>Send Verification Code</span>
                  </>
                )}
              </span>
            </button>
          </form>
        </>
      )}

      {/* Step 2: Code Verification */}
      {currentStep === 'code' && (
        <div className="space-y-4 sm:space-y-5">
          {/* Timer Display */}
          <div className="text-center space-y-1.5 sm:space-y-2 p-3 sm:p-4 bg-emerald-50/50 dark:bg-emerald-950/30 rounded-lg sm:rounded-xl border border-emerald-200/60 dark:border-emerald-800/60">
            <div className="flex items-center justify-center gap-1.5 sm:gap-2">
              <Clock className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
              <p className="text-xs sm:text-sm md:text-base text-gray-700 dark:text-gray-300 font-medium truncate">
                Code sent to <span className="font-bold text-emerald-600 dark:text-emerald-400 break-all">{formData.email}</span>
              </p>
            </div>
            <p className="text-xl sm:text-2xl md:text-3xl font-mono font-bold text-emerald-600 dark:text-emerald-400">
              {formatTime(timeLeft)}
            </p>
            <p className="text-[10px] sm:text-xs md:text-sm text-gray-600 dark:text-gray-400">
              Expires in {formatTime(timeLeft)}
            </p>
          </div>

          {/* Code Input Form */}
          <form onSubmit={handleVerifyCode} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="code" className="text-sm sm:text-base font-semibold text-gray-700 dark:text-gray-300 text-center block">
                Enter 6-Digit Verification Code
              </Label>
              <Input
                id="code"
                type="text"
                inputMode="numeric"
                maxLength={6}
                placeholder="000000"
                value={formData.verificationCode}
                onChange={(e) => {
                  const value = e.target.value.replace(/\D/g, '')
                  setFormData({ ...formData, verificationCode: value })
                  setErrors(prev => ({ ...prev, code: '', general: '' }))
                }}
                className={'h-16 sm:h-20 text-center text-3xl sm:text-4xl font-mono font-bold tracking-widest transition-all duration-300 ' + (errors.code
                    ? 'border-red-500 dark:border-red-400 bg-red-50/30 dark:bg-red-950/20'
                    : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 focus:border-emerald-500 dark:focus:border-emerald-400 focus:ring-4 focus:ring-emerald-500/20')}
              />
              {errors.code && (
                <p className="text-red-500 dark:text-red-400 text-xs sm:text-sm flex items-center justify-center gap-1 mt-2 animate-shake">
                  <AlertCircle className="h-4 w-4 flex-shrink-0" />
                  {errors.code}
                </p>
              )}
              <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 text-center">
                Check your email for the verification code
              </p>
            </div>

            {/* Verify Button */}
            <button
              type="submit"
              disabled={loading || formData.verificationCode.length !== 6}
              className="w-full h-12 sm:h-13 inline-flex items-center justify-center gap-2 text-white font-bold text-sm sm:text-base rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 hover:scale-[1.02] disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:scale-100"
              style={{
                background: 'linear-gradient(to right, #059669, #047857, #0f766e)',
              }}
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-2 border-white/30 border-t-white"></div>
                  <span>Verifying...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-5 w-5" />
                  <span>Verify Code</span>
                </>
              )}
            </button>
          </form>

          {/* Resend & Back Buttons */}
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
            <button
              type="button"
              onClick={() => {
                setCurrentStep('email')
                setTimerActive(false)
                setFormData(prev => ({ ...prev, verificationCode: '' }))
              }}
              className="flex-1 h-10 sm:h-11 inline-flex items-center justify-center gap-2 border-2 border-gray-200 dark:border-gray-700 hover:border-emerald-300 dark:hover:border-emerald-600 bg-white dark:bg-gray-800 hover:bg-emerald-50/50 dark:hover:bg-emerald-950/30 rounded-xl transition-all duration-300 text-sm font-semibold text-gray-700 dark:text-gray-200"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Change Email</span>
            </button>
            <button
              type="button"
              onClick={handleResendCode}
              disabled={!canResend || loading}
              className="flex-1 h-10 sm:h-11 inline-flex items-center justify-center gap-2 border-2 border-gray-200 dark:border-gray-700 hover:border-emerald-300 dark:hover:border-emerald-600 bg-white dark:bg-gray-800 hover:bg-emerald-50/50 dark:hover:bg-emerald-950/30 rounded-xl transition-all duration-300 text-sm font-semibold text-gray-700 dark:text-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <RefreshCw className="w-4 h-4" />
              <span>{canResend ? 'Resend Code' : 'Wait 60s to resend'}</span>
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Password Creation */}
      {currentStep === 'password' && (
        <form onSubmit={handleCreateAccount} className="space-y-3 sm:space-y-4 md:space-y-5">
          {/* Success Message */}
          <div className="p-3 sm:p-4 bg-emerald-50/80 dark:bg-emerald-950/30 backdrop-blur-sm border border-emerald-200/60 dark:border-emerald-500/20 text-emerald-800 dark:text-emerald-300 rounded-xl">
            <div className="flex items-start gap-2 sm:gap-3">
              <div className="flex-shrink-0 w-5 h-5 rounded-full bg-emerald-100 dark:bg-emerald-500/20 flex items-center justify-center mt-0.5">
                <CheckCircle2 className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div>
                <p className="font-medium text-sm sm:text-base">Email verified successfully!</p>
                <p className="text-xs sm:text-sm text-emerald-700 dark:text-emerald-400 mt-1">
                  {formData.email}
                </p>
              </div>
            </div>
          </div>

          {/* Name Field */}
          <div className="space-y-1.5 sm:space-y-2">
            <Label htmlFor="name" className="text-xs sm:text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-1.5 sm:gap-2">
              <User className="w-3 h-3 sm:w-4 sm:h-4" />
              Full Name
            </Label>
            <Input
              id="name"
              type="text"
              placeholder="John Doe"
              value={formData.name}
              onChange={(e) => {
                setFormData({ ...formData, name: e.target.value })
                setErrors(prev => ({ ...prev, name: '', general: '' }))
              }}
              className={'h-10 sm:h-11 md:h-12 text-xs sm:text-sm md:text-base text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 transition-all duration-300 ' + (errors.name
                  ? 'border-red-500 dark:border-red-400 bg-red-50/30 dark:bg-red-950/20'
                  : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800/80 focus:border-emerald-500 dark:focus:border-emerald-400 focus:ring-2 focus:ring-emerald-500/20')}
            />
            {errors.name && (
              <p className="text-red-500 dark:text-red-400 text-[10px] sm:text-xs flex items-center gap-1 mt-1 animate-shake">
                <AlertCircle className="h-3 w-3 flex-shrink-0" />
                {errors.name}
              </p>
            )}
          </div>

          {/* Password Field */}
          <div className="space-y-1.5 sm:space-y-2">
            <Label htmlFor="password" className="text-xs sm:text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-1.5 sm:gap-2">
              <Lock className="w-3 h-3 sm:w-4 sm:h-4" />
              Password
            </Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                placeholder="Create a strong password"
                value={formData.password}
                onChange={(e) => {
                  setFormData({ ...formData, password: e.target.value })
                  setErrors(prev => ({ ...prev, password: '', general: '' }))
                }}
                className={'h-10 sm:h-11 md:h-12 pr-10 text-xs sm:text-sm md:text-base text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 transition-all duration-300 ' + (errors.password
                    ? 'border-red-500 dark:border-red-400 bg-red-50/30 dark:bg-red-950/20'
                    : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800/80 focus:border-emerald-500 dark:focus:border-emerald-400 focus:ring-2 focus:ring-emerald-500/20')}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
              >
                {showPassword ? <EyeOff className="h-4 w-4 sm:h-5 sm:w-5" /> : <Eye className="h-4 w-4 sm:h-5 sm:w-5" />}
              </button>
            </div>
            {errors.password && (
              <p className="text-red-500 dark:text-red-400 text-[10px] sm:text-xs flex items-center gap-1 mt-1 animate-shake">
                <AlertCircle className="h-3 w-3 flex-shrink-0" />
                {errors.password}
              </p>
            )}

            {/* Password Strength Indicator */}
            {passwordStrength && formData.password.length >= 1 && (
              <div className="space-y-1.5 sm:space-y-2 mt-2">
                <div className="flex items-center justify-between text-[10px] sm:text-xs">
                  <span className="text-gray-600 dark:text-gray-400 font-medium">Password strength:</span>
                  <span className="font-semibold capitalize" style={{ color: passwordStrength.color }}>
                    {passwordStrength.strength.replace('-', ' ')}
                  </span>
                </div>
                <div className="h-1.5 sm:h-2 bg-gray-200 dark:bg-gray-800 rounded-full overflow-hidden">
                  <div
                    className="h-full transition-all duration-300 rounded-full"
                    style={{
                      width: `${passwordStrength.percentage}%`,
                      backgroundColor: passwordStrength.color,
                    }}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Confirm Password Field */}
          <div className="space-y-1.5 sm:space-y-2">
            <Label htmlFor="confirmPassword" className="text-xs sm:text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-1.5 sm:gap-2">
              <Lock className="w-3 h-3 sm:w-4 sm:h-4" />
              Confirm Password
            </Label>
            <div className="relative">
              <Input
                id="confirmPassword"
                type={showConfirmPassword ? 'text' : 'password'}
                placeholder="Confirm your password"
                value={formData.confirmPassword}
                onChange={(e) => {
                  setFormData({ ...formData, confirmPassword: e.target.value })
                  setErrors(prev => ({ ...prev, confirmPassword: '', general: '' }))
                }}
                className={'h-10 sm:h-11 md:h-12 pr-10 text-xs sm:text-sm md:text-base text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 transition-all duration-300 ' + (errors.confirmPassword
                    ? 'border-red-500 dark:border-red-400 bg-red-50/30 dark:bg-red-950/20'
                    : passwordsMatch === true
                    ? 'border-emerald-500 dark:border-emerald-400 bg-emerald-50/30 dark:bg-emerald-950/20 focus:border-emerald-500 dark:focus:border-emerald-400'
                    : passwordsMatch === false
                    ? 'border-red-500 dark:border-red-400 bg-red-50/30 dark:bg-red-950/20'
                    : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800/80 focus:border-emerald-500 dark:focus:border-emerald-400 focus:ring-2 focus:ring-emerald-500/20')}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
              >
                {showConfirmPassword ? <EyeOff className="h-4 w-4 sm:h-5 sm:w-5" /> : <Eye className="h-4 w-4 sm:h-5 sm:w-5" />}
              </button>
            </div>
            {errors.confirmPassword && (
              <p className="text-red-500 dark:text-red-400 text-[10px] sm:text-xs flex items-center gap-1 mt-1 animate-shake">
                <AlertCircle className="h-3 w-3 flex-shrink-0" />
                {errors.confirmPassword}
              </p>
            )}
            {passwordsMatch === true && (
              <p className="text-emerald-600 dark:text-emerald-400 text-[10px] sm:text-xs flex items-center gap-1 mt-1">
                <CheckCircle2 className="h-3 w-3 flex-shrink-0" />
                Passwords match
              </p>
            )}
            {passwordsMatch === false && (
              <p className="text-red-500 dark:text-red-400 text-[10px] sm:text-xs flex items-center gap-1 mt-1">
                <AlertCircle className="h-3 w-3 flex-shrink-0" />
                Passwords do not match
              </p>
            )}
          </div>

          {/* Create Account Button */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={loading}
              className="w-full h-11 sm:h-12 md:h-13 inline-flex items-center justify-center gap-2 text-white font-bold text-sm sm:text-base px-4 sm:px-6 rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] group relative overflow-hidden disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:scale-100"
              style={{
                background: 'linear-gradient(to right, #059669, #047857, #0f766e)',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'linear-gradient(to right, #047857, #065f46, #134e4a)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'linear-gradient(to right, #059669, #047857, #0f766e)'
              }}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -skew-x-12 translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-1000"></div>
              <span className="relative flex items-center justify-center gap-2 drop-shadow-md">
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-2 border-white/30 border-t-white"></div>
                    <span>Creating...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="h-5 w-5 flex-shrink-0" />
                    <span>Create Account</span>
                    <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform flex-shrink-0" />
                  </>
                )}
              </span>
            </button>
          </div>
        </form>
      )}

      {/* Sign In Link */}
      <div className="pt-2 text-center">
        <p className="text-xs sm:text-sm md:text-base text-gray-600 dark:text-gray-400">
          Already have an account?{' '}
          <Link href="/signin" className="text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 dark:hover:text-emerald-300 font-semibold transition-colors duration-300 underline-offset-2 hover:underline inline-flex items-center gap-1 group">
            Sign In
            <Shield className="h-3 w-3 sm:h-4 sm:w-4 group-hover:scale-110 transition-transform" />
          </Link>
        </p>
      </div>

      {/* Features List */}
      {currentStep === 'email' && (
        <div className="pt-3 sm:pt-4 md:pt-6 border-t border-gray-200/60 dark:border-gray-700/60">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-3 md:gap-4">
            <div className="flex items-center gap-1.5 sm:gap-2 text-[10px] sm:text-xs md:text-sm text-gray-600 dark:text-gray-400">
              <div className="flex-shrink-0 w-5 h-5 sm:w-6 sm:h-6 rounded-lg bg-emerald-100 dark:bg-emerald-900/50 flex items-center justify-center">
                <CheckCircle2 className="w-3 h-3 sm:w-4 sm:h-4 text-emerald-600 dark:text-emerald-400" />
              </div>
              <span>Free Forever</span>
            </div>
            <div className="flex items-center gap-1.5 sm:gap-2 text-[10px] sm:text-xs md:text-sm text-gray-600 dark:text-gray-400">
              <div className="flex-shrink-0 w-5 h-5 sm:w-6 sm:h-6 rounded-lg bg-teal-100 dark:bg-teal-900/50 flex items-center justify-center">
                <CheckCircle2 className="w-3 h-3 sm:w-4 sm:h-4 text-teal-600 dark:text-teal-400" />
              </div>
              <span>Email Verified</span>
            </div>
            <div className="flex items-center gap-1.5 sm:gap-2 text-[10px] sm:text-xs md:text-sm text-gray-600 dark:text-gray-400">
              <div className="flex-shrink-0 w-5 h-5 sm:w-6 sm:h-6 rounded-lg bg-purple-100 dark:bg-purple-900/50 flex items-center justify-center">
                <CheckCircle2 className="w-3 h-3 sm:w-4 sm:h-4 text-purple-600 dark:text-purple-400" />
              </div>
              <span>Secure</span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
