'use client'

import { Suspense } from 'react'
import { SignUpForm } from '@/components/auth/SignUpForm'
import { AuthLayout } from '@/components/auth/AuthLayout'

function SignUpContent() {
  return (
    <AuthLayout
      title="Create Account"
      subtitle="Start your productivity journey today"
    >
      <SignUpForm />
    </AuthLayout>
  )
}

export default function SignUpPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    }>
      <SignUpContent />
    </Suspense>
  )
}
