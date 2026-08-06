'use client'

import { Suspense } from 'react'
import { useT } from '@/lib/i18n/client'
import { SignUpForm } from '@/components/auth/SignUpForm'
import { AuthLayout } from '@/components/auth/AuthLayout'

function SignUpContent() {
  const { t } = useT()
  return (
    <AuthLayout
      title={t('auth.createAccount')}
      subtitle={t('auth.createAccountSub')}
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
