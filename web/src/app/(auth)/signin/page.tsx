'use client'

import { Suspense } from 'react'
import { useT } from '@/lib/i18n/client'
import { SignInForm } from '@/components/auth/SignInForm'
import { AuthLayout } from '@/components/auth/AuthLayout'

function SignInContent() {
  const { t } = useT()
  return (
    <AuthLayout
      title={t('auth.welcomeBack')}
      subtitle={t('auth.welcomeBackSub')}
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
