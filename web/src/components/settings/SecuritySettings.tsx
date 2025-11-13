'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSession, signOut } from 'next-auth/react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { LogOut, Lock, Loader2, Shield, ShieldCheck, ShieldAlert, Mail } from 'lucide-react'
import { toast } from 'sonner'

export function SecuritySettings() {
  const { data: session, status } = useSession()
  const [loading, setLoading] = useState(false)
  const [passwords, setPasswords] = useState({
    current: '',
    new: '',
    confirm: ''
  })
  const [hasPassword, setHasPassword] = useState<boolean | null>(null)
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false)
  const [showEnableModal, setShowEnableModal] = useState(false)
  const [showDisableModal, setShowDisableModal] = useState(false)
  const [verificationCode, setVerificationCode] = useState('')
  const [disablePassword, setDisablePassword] = useState('')
  const [twoFactorPassword, setTwoFactorPassword] = useState('')
  const [twoFactorPasswordConfirm, setTwoFactorPasswordConfirm] = useState('')
  const [step, setStep] = useState<'code' | 'password'>('code')
  const [isLoadingSettings, setIsLoadingSettings] = useState(false)
  const [loadError, setLoadError] = useState<string | null>(null)

  // Load user security status with retry mechanism
  const loadSecuritySettings = useCallback(async () => {
    if (!session?.user?.id || status !== 'authenticated') {
      return
    }

    setIsLoadingSettings(true)
    try {
      setLoadError(null)
      const response = await fetch('/api/auth/check-password', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        cache: 'no-store'
      })
      
      if (!response.ok) {
        throw new Error('Failed to load settings')
      }
      
      const data = await response.json()
      
      setHasPassword(data.hasPassword ?? false)
      setTwoFactorEnabled(data.twoFactorEnabled ?? false)
    } catch (error: any) {
      console.error('Error loading security settings:', error)
      setLoadError(error.message)
      setHasPassword(false)
      setTwoFactorEnabled(false)
    } finally {
      setIsLoadingSettings(false)
    }
  }, [session?.user?.id, status])

  useEffect(() => {
    if (status === 'authenticated' && session?.user?.id) {
      loadSecuritySettings()
    }
  }, [status, session?.user?.id, loadSecuritySettings])

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!passwords.current || !passwords.new || !passwords.confirm) {
      toast.error('Please fill in all password fields')
      return
    }

    if (passwords.new !== passwords.confirm) {
      toast.error('New passwords do not match')
      return
    }

    if (passwords.new.length < 8) {
      toast.error('Password must be at least 8 characters long')
      return
    }

    setLoading(true)
    try {
      const response = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentPassword: passwords.current,
          newPassword: passwords.new
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to change password')
      }

      toast.success('Password changed successfully')
      setPasswords({ current: '', new: '', confirm: '' })
    } catch (error: any) {
      toast.error(error.message || 'Failed to change password')
    } finally {
      setLoading(false)
    }
  }

  const handleEnable2FA = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/auth/2fa/enable', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      })

      const data = await response.json()

      if (!response.ok) {
        toast.error(data.error || 'Failed to send verification code')
        throw new Error(data.error || 'Failed to enable 2FA')
      }

      setStep('code')
      setShowEnableModal(true)
      toast.success('Verification code sent to your email! Check your inbox.')
    } catch (error: any) {
      console.error('2FA enable error:', error)
      // Error already shown via toast above
    } finally {
      setLoading(false)
    }
  }

  const handleVerifyCode = async () => {
    if (!verificationCode || verificationCode.length !== 6) {
      toast.error('Please enter the 6-digit code from your email')
      return
    }

    setLoading(true)
    try {
      // Verify the code exists in the database before proceeding
      const response = await fetch('/api/auth/2fa/verify-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: verificationCode
        })
      })

      const data = await response.json()

      if (!response.ok) {
        toast.error(data.error || 'Invalid or expired verification code')
        return
      }

      // Move to password setup step only if code is valid
      setStep('password')
      toast.success('Code verified! Now set your 2FA password.')
    } catch (error: any) {
      console.error('Code verification error:', error)
      toast.error('Failed to verify code. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleComplete2FASetup = async () => {
    if (!twoFactorPassword || twoFactorPassword.length < 6) {
      toast.error('2FA password must be at least 6 characters')
      return
    }

    if (twoFactorPassword !== twoFactorPasswordConfirm) {
      toast.error('Passwords do not match')
      return
    }

    setLoading(true)
    try {
      const response = await fetch('/api/auth/2fa/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: verificationCode,
          twoFactorPassword: twoFactorPassword
        })
      })

      const data = await response.json()

      if (!response.ok) {
        if (data.error?.includes('expired') || data.error?.includes('Invalid')) {
          toast.error('Verification code is wrong or expired. Please start over.')
          setShowEnableModal(false)
          setStep('code')
          setVerificationCode('')
          setTwoFactorPassword('')
          setTwoFactorPasswordConfirm('')
        } else {
          toast.error(data.error || 'Failed to enable 2FA')
        }
        throw new Error(data.error || 'Failed to verify code')
      }

      setTwoFactorEnabled(true)
      setShowEnableModal(false)
      setStep('code')
      setVerificationCode('')
      setTwoFactorPassword('')
      setTwoFactorPasswordConfirm('')
      toast.success('Two-factor authentication enabled! You will need this password when signing in.', {
        duration: 5000
      })
    } catch (error: any) {
      console.error('2FA setup error:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDisable2FA = async () => {
    if (!disablePassword) {
      toast.error('Please enter your password to disable 2FA')
      return
    }

    setLoading(true)
    try {
      const response = await fetch('/api/auth/2fa/disable', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          password: disablePassword
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to disable 2FA')
      }

      setTwoFactorEnabled(false)
      setShowDisableModal(false)
      setDisablePassword('')
      toast.success('Two-factor authentication disabled')
    } catch (error: any) {
      toast.error(error.message || 'Failed to disable 2FA')
    } finally {
      setLoading(false)
    }
  }

  const handleSignOut = async () => {
    await signOut({ callbackUrl: '/' })
  }

  // Show message if not authenticated
  if (!session || status !== 'authenticated') {
    return (
      <div className="flex flex-col items-center justify-center p-12 gap-4">
        <Lock className="h-12 w-12 text-slate-400" />
        <p className="text-sm text-slate-500">Please sign in to manage security settings</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Error state banner */}
      {loadError && (
        <Card className="border-2 border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950/20">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <ShieldAlert className="h-5 w-5 text-red-600 dark:text-red-400" />
              <div className="flex-1">
                <p className="text-sm font-medium text-red-900 dark:text-red-100">Failed to load security settings</p>
                <p className="text-xs text-red-700 dark:text-red-300 mt-1">{loadError}</p>
              </div>
              <Button onClick={loadSecuritySettings} variant="outline" size="sm" className="gap-2">
                <Loader2 className="h-4 w-4" />
                Retry
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Google-Only User Info Card */}
      {!hasPassword && hasPassword !== null && (
        <Card className="border-2 border-blue-200 dark:border-blue-800 shadow-lg bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-950/30 dark:to-cyan-950/30">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              <CardTitle className="text-2xl">Google Account Security</CardTitle>
            </div>
            <CardDescription className="text-base">
              Your account is secured through Google OAuth
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-start gap-3 p-4 bg-white dark:bg-gray-900/50 rounded-lg border border-blue-300 dark:border-blue-700">
              <ShieldCheck className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
              <div className="flex-1 space-y-2">
                <p className="font-medium text-gray-900 dark:text-gray-100">
                  Want to enable password login and 2FA?
                </p>
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  You're currently using Google to sign in. To enable two-factor authentication or password-based login, you need to set a password first.
                </p>
                <Button
                  onClick={() => window.location.href = '/set-password'}
                  className="mt-3 gap-2"
                  variant="outline"
                >
                  <Lock className="h-4 w-4" />
                  Set Account Password
                </Button>
              </div>
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
              <p className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-blue-500 rounded-full"></span>
                After setting a password, you can sign in with either Google or email/password
              </p>
              <p className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-blue-500 rounded-full"></span>
                Enable two-factor authentication for extra security
              </p>
              <p className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-blue-500 rounded-full"></span>
                Your Google sign-in will continue to work normally
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 2FA Card */}
      {hasPassword && (
        <Card className="border-2 border-slate-200 dark:border-slate-800 shadow-lg">
          <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {twoFactorEnabled ? (
                  <ShieldCheck className="h-5 w-5 text-green-600 dark:text-green-400" />
                ) : (
                  <ShieldAlert className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                )}
                <CardTitle className="text-2xl">Two-Factor Authentication</CardTitle>
              </div>
              <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                twoFactorEnabled 
                  ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                  : 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400'
              }`}>
                {twoFactorEnabled ? 'Enabled' : 'Disabled'}
              </div>
            </div>
            <CardDescription className="text-base">
              {twoFactorEnabled 
                ? 'Your account is protected with two-factor authentication'
                : 'Add an extra layer of security to your account'}
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="space-y-4">
              <div className="flex items-start gap-3 p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
                <Mail className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5" />
                <div className="flex-1">
                  <p className="font-medium text-blue-900 dark:text-blue-100">
                    Email-Based 2FA
                  </p>
                  <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                    When enabled, you'll receive a verification code via email each time you sign in.
                  </p>
                </div>
              </div>

              {twoFactorEnabled ? (
                <div className="space-y-3">
                  <Button 
                    variant="outline"
                    onClick={() => setShowDisableModal(true)}
                    className="w-full sm:w-auto gap-2 h-11 text-base border-2"
                    disabled={loading}
                  >
                    <ShieldAlert className="h-4 w-4" />
                    Disable 2FA
                  </Button>
                  <p className="text-sm text-slate-500">
                    Lost access? You can{' '}
                    <a href="/forgot-2fa" className="text-blue-600 hover:underline">
                      recover your account via email
                    </a>
                  </p>
                </div>
              ) : (
                <Button 
                  onClick={handleEnable2FA}
                  disabled={loading}
                  className="w-full sm:w-auto gap-2 h-11 text-base bg-green-600 hover:bg-green-700"
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <ShieldCheck className="h-4 w-4" />
                      Enable 2FA
                    </>
                  )}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Change Password Card */}
      {hasPassword && (
        <Card className="border-2 border-slate-200 dark:border-slate-800 shadow-lg">
          <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20">
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              <CardTitle className="text-2xl">Change Password</CardTitle>
            </div>
            <CardDescription className="text-base">Update your account password for security</CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <form onSubmit={handlePasswordChange} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="current-password" className="text-base font-semibold">Current Password</Label>
                <Input
                  id="current-password"
                  type="password"
                  value={passwords.current}
                  onChange={(e) => setPasswords({ ...passwords, current: e.target.value })}
                  placeholder="Enter your current password"
                  className="h-11 text-base"
                  disabled={loading}
                  autoComplete="current-password"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="new-password" className="text-base font-semibold">New Password</Label>
                <Input
                  id="new-password"
                  type="password"
                  value={passwords.new}
                  onChange={(e) => setPasswords({ ...passwords, new: e.target.value })}
                  placeholder="Enter a strong password (min. 8 characters)"
                  className="h-11 text-base"
                  disabled={loading}
                  autoComplete="new-password"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirm-password" className="text-base font-semibold">Confirm New Password</Label>
                <Input
                  id="confirm-password"
                  type="password"
                  value={passwords.confirm}
                  onChange={(e) => setPasswords({ ...passwords, confirm: e.target.value })}
                  placeholder="Re-enter your new password"
                  className="h-11 text-base"
                  disabled={loading}
                  autoComplete="new-password"
                />
              </div>
              <Button 
                type="submit" 
                disabled={loading}
                className="w-full sm:w-auto gap-2 h-11 text-base bg-blue-600 hover:bg-blue-700"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Updating...
                  </>
                ) : (
                  <>
                    <Lock className="h-4 w-4" />
                    Update Password
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Sign Out Card */}
      <Card className="border-2 border-slate-200 dark:border-slate-800 shadow-lg">
        <CardHeader className="bg-gradient-to-r from-red-50 to-orange-50 dark:from-red-950/20 dark:to-orange-950/20">
          <div className="flex items-center gap-2">
            <LogOut className="h-5 w-5 text-red-600 dark:text-red-400" />
            <CardTitle className="text-2xl">Sign Out</CardTitle>
          </div>
          <CardDescription className="text-base">Sign out of your account on this device</CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          <Button 
            variant="destructive" 
            onClick={handleSignOut}
            className="gap-2 h-11 text-base"
          >
            <LogOut className="h-4 w-4" />
            Sign Out from All Devices
          </Button>
          <p className="text-sm text-slate-500 mt-3">
            You'll be redirected to the home page after signing out
          </p>
        </CardContent>
      </Card>

      {/* Enable 2FA Modal */}
      <Dialog open={showEnableModal} onOpenChange={(open) => {
        setShowEnableModal(open)
        if (!open) {
          setStep('code')
          setVerificationCode('')
          setTwoFactorPassword('')
          setTwoFactorPasswordConfirm('')
        }
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {step === 'code' ? 'Verify Your Email' : 'Set 2FA Password'}
            </DialogTitle>
            <DialogDescription>
              {step === 'code' 
                ? "We've sent a 6-digit verification code to your email. Enter it below."
                : 'Create a password that will be required when signing in. This is different from your account password.'}
            </DialogDescription>
          </DialogHeader>
          
          {step === 'code' ? (
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="verification-code">Verification Code</Label>
                <Input
                  id="verification-code"
                  name="otp-code"
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  placeholder="Enter 6-digit code"
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  maxLength={6}
                  className="text-center text-2xl tracking-widest font-mono"
                  autoComplete="one-time-code"
                />
              </div>
              <p className="text-sm text-slate-500">
                The code will expire in 10 minutes. Check your spam folder if you don't see it.
              </p>
            </div>
          ) : (
            <form autoComplete="off" onSubmit={(e) => e.preventDefault()}>
              <div className="space-y-4 py-4">
                <input
                  type="text"
                  name="fake-username"
                  autoComplete="username"
                  style={{ display: 'none' }}
                  tabIndex={-1}
                  aria-hidden="true"
                />
                <div className="space-y-2">
                  <Label htmlFor="twoFactorPassword">2FA Password</Label>
                  <Input
                    id="twoFactorPassword"
                    name="two-factor-password"
                    type="password"
                    placeholder="Enter 2FA password (min. 6 characters)"
                    value={twoFactorPassword}
                    onChange={(e) => setTwoFactorPassword(e.target.value)}
                    autoComplete="off"
                    data-lpignore="true"
                    data-form-type="other"
                    data-1p-ignore="true"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="twoFactorPasswordConfirm">Confirm 2FA Password</Label>
                  <Input
                    id="twoFactorPasswordConfirm"
                    name="two-factor-password-confirm"
                    type="password"
                    placeholder="Re-enter 2FA password"
                    value={twoFactorPasswordConfirm}
                    onChange={(e) => setTwoFactorPasswordConfirm(e.target.value)}
                    autoComplete="off"
                    data-lpignore="true"
                    data-form-type="other"
                    data-1p-ignore="true"
                  />
                </div>
              </div>
            </form>
          )} 
          {step === 'password' && (
            <div className="flex items-start gap-2 p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
              <ShieldCheck className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
              <p className="text-sm text-blue-700 dark:text-blue-300">
                This password will be required each time you sign in, after entering your regular password.
              </p>
            </div>
          )}
          
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowEnableModal(false)
                setStep('code')
                setVerificationCode('')
                setTwoFactorPassword('')
                setTwoFactorPasswordConfirm('')
              }}
              disabled={loading}
            >
              Cancel
            </Button>
            {step === 'code' ? (
              <Button 
                onClick={handleVerifyCode}
                disabled={loading || verificationCode.length !== 6}
                className="gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Verifying...
                  </>
                ) : (
                  <>
                    <Mail className="h-4 w-4" />
                    Verify Code
                  </>
                )}
              </Button>
            ) : (
              <Button 
                onClick={handleComplete2FASetup}
                disabled={loading || !twoFactorPassword || !twoFactorPasswordConfirm}
                className="gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Enabling...
                  </>
                ) : (
                  <>
                    <ShieldCheck className="h-4 w-4" />
                    Enable 2FA
                  </>
                )}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Disable 2FA Modal */}
      <Dialog open={showDisableModal} onOpenChange={setShowDisableModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Disable Two-Factor Authentication</DialogTitle>
            <DialogDescription>
              Enter your password to confirm disabling 2FA. This will make your account less secure.
            </DialogDescription>
          </DialogHeader>
          <form autoComplete="off" onSubmit={(e) => e.preventDefault()}>
            <div className="space-y-4 py-4">
              <input
                type="text"
                name="fake-username-disable"
                autoComplete="username"
                style={{ display: 'none' }}
                tabIndex={-1}
                aria-hidden="true"
              />
              <div className="space-y-2">
                <Label htmlFor="disable-password">Current Password</Label>
                <Input
                  id="disable-password"
                  name="disable-2fa-password"
                  type="password"
                  placeholder="Enter your password"
                  value={disablePassword}
                  onChange={(e) => setDisablePassword(e.target.value)}
                  autoComplete="off"
                  data-lpignore="true"
                  data-form-type="other"
                  data-1p-ignore="true"
                />
              </div>
              <div className="flex items-start gap-2 p-3 bg-orange-50 dark:bg-orange-950/20 rounded-lg border border-orange-200 dark:border-orange-800">
                <ShieldAlert className="h-5 w-5 text-orange-600 dark:text-orange-400 mt-0.5 flex-shrink-0" />
                <p className="text-sm text-orange-700 dark:text-orange-300">
                  Disabling 2FA will reduce your account security. Only your password will be required to sign in.
                </p>
              </div>
            </div>
          </form>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowDisableModal(false)
                setDisablePassword('')
              }}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button 
              variant="destructive"
              onClick={handleDisable2FA}
              disabled={loading || !disablePassword}
              className="gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Disabling...
                </>
              ) : (
                <>
                  <ShieldAlert className="h-4 w-4" />
                  Disable 2FA
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
