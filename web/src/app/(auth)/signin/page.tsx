'use client'

import { Suspense } from 'react'
import { SignInForm } from '@/components/auth/SignInForm'
import { AuthLayout } from '@/components/auth/AuthLayout'

function SignInContent() {
  return (
    <AuthLayout
      title="Welcome Back"
      subtitle="Sign in to continue your journey"
    >
      <SignInForm />
    </AuthLayout>
  )
}

export default function SignInPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    }>
      <SignInContent />
    </Suspense>
  )
}
