'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { 
  Shield, 
  ArrowRight, 
  AlertCircle, 
  CheckCircle2,
  Home,
  ArrowLeft
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ThemeToggle } from '@/components/theme-toggle'

export default function ResetPasswordPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [email, setEmail] = useState('')

  useEffect(() => {
    setMounted(true)
    
    // Get email from localStorage or redirect to forgot-password if not available
    const storedEmail = localStorage.getItem('verifiedEmail')
    if (!storedEmail) {
      router.push('/forgot-password')
      return
    }
    setEmail(storedEmail)
  }, [router])

  const [resetData, setResetData] = useState({
    password: '',
    confirmPassword: '',
  })

  const [errors, setErrors] = useState({
    password: '',
    confirmPassword: '',
    general: '',
  })

  const handleResetSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validate passwords
    if (!resetData.password) {
      setErrors(prev => ({ ...prev, password: 'Password is required' }))
      return
    }
    
    if (resetData.password.length < 8) {
      setErrors(prev => ({ ...prev, password: 'Password must be at least 8 characters' }))
      return
    }
    
    if (!resetData.confirmPassword) {
      setErrors(prev => ({ ...prev, confirmPassword: 'Please confirm your password' }))
      return
    }
    
    if (resetData.password !== resetData.confirmPassword) {
      setErrors(prev => ({ ...prev, confirmPassword: 'Passwords do not match' }))
      return
    }
    
    setErrors(prev => ({ 
      ...prev, 
      password: '', 
      confirmPassword: '', 
      general: '' 
    }))
    setLoading(true)
    
    try {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          password: resetData.password,
        }),
      })

      if (response.ok) {
        // Clear localStorage items used for password reset flow
        localStorage.removeItem('resetEmail')
        localStorage.removeItem('verifiedEmail')
        localStorage.removeItem('verifiedCode')
        localStorage.removeItem('resetCodeCountdown')
        
        // Redirect to success page or signin with success message
        router.push('/signin?message=Password reset successfully! Please sign in with your new password.')
      } else {
        const data = await response.json()
        setErrors(prev => ({ ...prev, general: data.error || 'Failed to reset password. Please try again.' }))
      }
    } catch (error) {
      console.error('Password reset error:', error)
      setErrors(prev => ({ ...prev, general: 'Something went wrong. Please try again.' }))
    } finally {
      setLoading(false)
    }
  }

  if (!mounted) {
    return null
  }

  return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-slate-50 via-gray-50 to-slate-100 dark:from-slate-950 dark:via-gray-950 dark:to-slate-900">
      {/* Background elements */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-100/80 via-gray-50/90 to-slate-200/70 dark:from-slate-950/95 dark:via-gray-950/98 dark:to-slate-900/95"></div>
        <div className="absolute inset-0 bg-gradient-radial from-transparent via-emerald-50/20 to-transparent dark:from-transparent dark:via-emerald-950/30 dark:to-transparent"></div>
        
        <div className="absolute inset-0 opacity-[0.02] dark:opacity-[0.05]" style={{ 
          backgroundImage: 'url(/islamic-pattern.svg)', 
          backgroundSize: '140px 140px' 
        }} />
        
        <div className="absolute top-1/5 left-1/6 w-96 h-96 bg-gradient-to-br from-emerald-400/20 via-teal-400/15 to-cyan-400/25 dark:from-emerald-500/25 dark:via-teal-500/20 dark:to-cyan-500/30 rounded-full blur-3xl animate-float opacity-40 dark:opacity-60"></div>
        <div className="absolute bottom-1/5 right-1/6 w-80 h-80 bg-gradient-to-tl from-purple-400/15 via-pink-400/12 to-rose-400/18 dark:from-purple-500/20 dark:via-pink-500/15 dark:to-rose-500/25 rounded-full blur-3xl animate-float-slow opacity-35 dark:opacity-50"></div>
        <div className="absolute top-1/2 right-1/4 w-72 h-72 bg-gradient-to-r from-blue-400/12 via-indigo-400/15 to-purple-400/20 dark:from-blue-500/18 dark:via-indigo-500/22 dark:to-purple-500/28 rounded-full blur-2xl animate-pulse opacity-30 dark:opacity-45"></div>
        <div className="absolute top-1/3 left-1/2 w-64 h-64 bg-gradient-to-bl from-teal-400/18 via-cyan-400/15 to-emerald-400/22 dark:from-teal-500/25 dark:via-cyan-500/20 dark:to-emerald-500/30 rounded-full blur-3xl animate-float-slower opacity-25 dark:opacity-40"></div>
        <div className="absolute bottom-1/3 left-1/4 w-88 h-88 bg-gradient-to-tr from-rose-400/10 via-pink-400/8 to-purple-400/15 dark:from-rose-500/15 dark:via-pink-500/12 dark:to-purple-500/20 rounded-full blur-3xl animate-float opacity-20 dark:opacity-35"></div>
        
        <div className="absolute inset-0 bg-gradient-radial from-transparent via-white/5 to-slate-100/30 dark:from-transparent dark:via-slate-900/20 dark:to-slate-800/15"></div>
      </div>

      {/* Header */}
      <div className="absolute top-0 left-0 right-0 z-50">
        <div className="backdrop-blur-3xl bg-white/95 dark:bg-gray-900/95 border-b border-emerald-200/60 dark:border-emerald-700/60 shadow-lg shadow-emerald-500/5 dark:shadow-emerald-500/10">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Link 
                  href="/"
                  className="group flex items-center gap-2 hover:bg-emerald-50 dark:hover:bg-emerald-950/50 px-4 py-2.5 rounded-xl transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-emerald-500/10 dark:hover:shadow-emerald-400/20"
                >
                  <div className="p-1 bg-emerald-100 dark:bg-emerald-900/50 rounded-lg group-hover:bg-emerald-200 dark:group-hover:bg-emerald-800/70 transition-all duration-300">
                    <ArrowLeft className="h-4 w-4 text-emerald-600 dark:text-emerald-400 group-hover:translate-x-[-2px] transition-transform duration-300" />
                  </div>
                  <div className="p-1 bg-teal-100 dark:bg-teal-900/50 rounded-lg group-hover:bg-teal-200 dark:group-hover:bg-teal-800/70 transition-all duration-300">
                    <Home className="h-4 w-4 text-teal-600 dark:text-teal-400 group-hover:scale-110 transition-transform duration-300" />
                  </div>
                  <span className="text-sm font-semibold text-gray-700 dark:text-gray-300 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors duration-300">
                    Back to Home
                  </span>
                </Link>
              </div>

              <div className="flex items-center gap-3">
                <Link href="/signin">
                  <Button className="relative overflow-hidden bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 dark:from-emerald-500 dark:to-teal-500 dark:hover:from-emerald-400 dark:hover:to-teal-400 text-white font-semibold px-6 py-2 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 group">
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -skew-x-12 translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-1000"></div>
                    <span className="relative flex items-center gap-2">
                      <Shield className="h-4 w-4" />
                      Sign In
                    </span>
                  </Button>
                </Link>
                <ThemeToggle />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="relative z-10 min-h-screen flex items-center justify-center p-4 pt-24">
        <div className={'w-full max-w-md ' + (mounted ? 'animate-fade-in-scale' : 'opacity-0')}>
          <Card className="relative backdrop-blur-3xl bg-white/96 dark:bg-slate-900/98 border-2 border-emerald-200/70 dark:border-emerald-500/40 shadow-2xl shadow-emerald-500/10 dark:shadow-emerald-400/30 rounded-2xl overflow-hidden">
            
            <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/3 via-teal-500/3 to-emerald-500/3 dark:from-emerald-400/15 dark:via-teal-400/12 dark:to-emerald-400/15 rounded-2xl blur-xl -z-10"></div>
            <div className="absolute -inset-1 bg-gradient-to-r from-emerald-400/0 via-emerald-400/5 to-teal-400/0 dark:from-emerald-400/10 dark:via-teal-400/8 dark:to-emerald-400/10 rounded-2xl blur-lg opacity-0 hover:opacity-100 transition-opacity duration-500 -z-20"></div>
            
            <CardContent className="p-8">
              <CardHeader className="text-center pb-8">
                <CardTitle className="text-3xl font-bold text-gray-900 dark:text-white mb-2">New Password</CardTitle>
                <CardDescription className="text-gray-600 dark:text-gray-300 text-lg">
                  Create a new password for your account
                </CardDescription>
              </CardHeader>
              
              {errors.general && (
                <div className="mb-6 p-4 bg-red-50/80 dark:bg-red-950/30 backdrop-blur-sm border border-red-200/60 dark:border-red-500/20 text-red-800 dark:text-red-300 rounded-xl animate-shake relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-r from-red-500/5 to-transparent dark:from-red-400/10 dark:to-transparent"></div>
                  <div className="relative flex items-start gap-3">
                    <div className="flex-shrink-0 w-5 h-5 rounded-full bg-red-100 dark:bg-red-500/20 flex items-center justify-center mt-0.5">
                      <AlertCircle className="w-3 h-3 text-red-600 dark:text-red-400" />
                    </div>
                    <span className="font-medium text-sm leading-relaxed">{errors.general}</span>
                  </div>
                </div>
              )}
              
              <form onSubmit={handleResetSubmit}>
                <div className="space-y-5">
                  <div className="space-y-2">
                    <Label htmlFor="password" className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                      <Shield className="w-4 h-4" />
                      New Password
                    </Label>
                    <Input
                      id="password"
                      name="password"
                      type="password"
                      placeholder="Create a strong password"
                      value={resetData.password}
                      onChange={(e) => {
                        setResetData(prev => ({ ...prev, password: e.target.value }))
                        setErrors(prev => ({ ...prev, password: '', general: '' }))
                      }}
                      className={`h-12 text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 ${
                        errors.password 
                          ? 'border-red-500 dark:border-red-400 bg-red-50/30 dark:bg-red-950/20' 
                          : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800/80 focus:border-emerald-500 dark:focus:border-emerald-400'
                      }`}
                    />
                    {errors.password && (
                      <p className="text-red-500 dark:text-red-400 text-sm flex items-center gap-1 mt-1">
                        <AlertCircle className="h-4 w-4" />
                        {errors.password}
                      </p>
                    )}
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword" className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4" />
                      Confirm Password
                    </Label>
                    <Input
                      id="confirmPassword"
                      name="confirmPassword"
                      type="password"
                      placeholder="Confirm your new password"
                      value={resetData.confirmPassword}
                      onChange={(e) => {
                        setResetData(prev => ({ ...prev, confirmPassword: e.target.value }))
                        setErrors(prev => ({ ...prev, confirmPassword: '', general: '' }))
                      }}
                      className={`h-12 text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 ${
                        errors.confirmPassword 
                          ? 'border-red-500 dark:border-red-400 bg-red-50/30 dark:bg-red-950/20' 
                          : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800/80 focus:border-emerald-500 dark:focus:border-emerald-400'
                      }`}
                    />
                    {errors.confirmPassword && (
                      <p className="text-red-500 dark:text-red-400 text-sm flex items-center gap-1 mt-1">
                        <AlertCircle className="h-4 w-4" />
                        {errors.confirmPassword}
                      </p>
                    )}
                  </div>
                </div>
                <div className="mt-8">
                  <Button
                    type="submit"
                    className="w-full h-12 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 dark:from-emerald-500 dark:to-teal-500 dark:hover:from-emerald-400 dark:hover:to-teal-400 text-white font-semibold px-6 py-2 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 group relative overflow-hidden"
                    disabled={loading}
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -skew-x-12 translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-1000"></div>
                    <span className="relative flex items-center justify-center gap-2">
                      {loading ? (
                        <>
                          <div className="animate-spin rounded-full h-5 w-5 border-2 border-white/30 border-t-white"></div>
                          Resetting Password...
                        </>
                      ) : (
                        <>
                          <Shield className="h-5 w-5" />
                          Reset Password
                          <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform duration-300" />
                        </>
                      )}
                    </span>
                  </Button>
                </div>
                <div className="mt-6 text-center">
                  <p className="text-gray-600 dark:text-gray-400">
                    Changed your mind?{' '}
                    <button 
                      type="button"
                      onClick={() => {
                        localStorage.removeItem('resetEmail')
                        localStorage.removeItem('verifiedEmail')
                        localStorage.removeItem('verifiedCode')
                        router.push('/forgot-password')
                      }}
                      className="text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 dark:hover:text-emerald-300 font-semibold transition-colors duration-300 underline-offset-2 hover:underline"
                    >
                      Start over
                    </button>
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