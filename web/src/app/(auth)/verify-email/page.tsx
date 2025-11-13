'use client'

import { Suspense, useEffect, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { CheckCircle2, XCircle, Loader2, Mail } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { AuthLayout } from '@/components/auth/AuthLayout'
import { toast } from 'sonner'

function VerifyEmailContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get('token')

  const [status, setStatus] = useState<'verifying' | 'success' | 'error'>('verifying')
  const [message, setMessage] = useState('')
  const [email, setEmail] = useState('')

  useEffect(() => {
    if (!token) {
      setStatus('error')
      setMessage('No verification token provided')
      return
    }

    verifyEmail(token)
  }, [token])

  const verifyEmail = async (token: string) => {
    try {
      const res = await fetch('/api/auth/verify-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      })

      const data = await res.json()

      if (res.ok) {
        setStatus('success')
        setEmail(data.email)
        setMessage('Your email has been verified successfully!')
        
        // Redirect to sign in after 3 seconds
        setTimeout(() => {
          router.push('/signin')
        }, 3000)
      } else {
        setStatus('error')
        setMessage(data.error || 'Verification failed')
      }
    } catch (error) {
      setStatus('error')
      setMessage('An error occurred during verification')
    }
  }

  const handleResend = async () => {
    if (!email) {
      toast.error('Please enter your email address')
      return
    }

    try {
      const res = await fetch('/api/auth/resend-verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })

      const data = await res.json()

      if (res.ok) {
        toast.success('Verification email sent! Check your inbox.')
      } else {
        toast.error(data.error || 'Failed to resend email')
      }
    } catch (error) {
      toast.error('An error occurred')
    }
  }

  return (
    <AuthLayout
      title="Email Verification"
      subtitle={
        status === 'verifying'
          ? 'Please wait while we verify your email...'
          : status === 'success'
          ? 'Your account is now active!'
          : 'Verification Failed'
      }
    >
      <div className="text-center space-y-6">
        {/* Icon */}
        <div className="flex justify-center">
          {status === 'verifying' && (
            <Loader2 className="h-16 w-16 text-blue-600 animate-spin" />
          )}
          {status === 'success' && (
            <CheckCircle2 className="h-16 w-16 text-green-600" />
          )}
          {status === 'error' && (
            <XCircle className="h-16 w-16 text-red-600" />
          )}
        </div>

        {/* Message */}
        <div className="space-y-2">
          <p className="text-lg font-medium text-slate-900 dark:text-slate-100">
            {message}
          </p>

          {status === 'success' && (
            <>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Email verified: <span className="font-medium">{email}</span>
              </p>
              <p className="text-sm text-slate-500">
                Redirecting to sign in...
              </p>
            </>
          )}

          {status === 'error' && (
            <div className="space-y-4 mt-6">
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Common issues:
              </p>
              <ul className="text-sm text-slate-500 space-y-1">
                <li>• The link may have expired (valid for 24 hours)</li>
                <li>• The link may have already been used</li>
                <li>• The link may be invalid or incomplete</li>
              </ul>

              <div className="pt-4">
                <p className="text-sm text-slate-600 dark:text-slate-400 mb-3">
                  Enter your email to receive a new verification link:
                </p>
                <div className="flex gap-2">
                  <input
                    type="email"
                    placeholder="your@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="flex-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                  <Button onClick={handleResend}>
                    <Mail className="h-4 w-4 mr-2" />
                    Resend
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Actions */}
        {status === 'success' && (
          <Link href="/signin" className="block w-full">
            <Button className="w-full">Go to Sign In</Button>
          </Link>
        )}

        {status === 'error' && (
          <div className="space-y-3">
            <Link href="/signup" className="block w-full">
              <Button variant="outline" className="w-full">Create New Account</Button>
            </Link>
            <Link href="/signin" className="block w-full">
              <Button variant="ghost" className="w-full">Back to Sign In</Button>
            </Link>
          </div>
        )}
      </div>
    </AuthLayout>
  )
}

export default function VerifyEmailPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
        </div>
      }
    >
      <VerifyEmailContent />
    </Suspense>
  )
}
