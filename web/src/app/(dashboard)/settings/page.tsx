'use client'

import { useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { SettingsLayout } from '@/components/settings/SettingsLayout'
import { PageHeader } from '@/components/shared/PageHeader'

export default function SettingsPage() {
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    // Clean up any leftover email parameter from redirects
    if (searchParams.has('email')) {
      const tab = searchParams.get('tab')
      const newUrl = tab ? `/settings?tab=${tab}` : '/settings'
      router.replace(newUrl)
    }
  }, [searchParams, router])

  return (
    <div className="space-y-6">
      <PageHeader
        title="Settings"
        description="Manage your account and preferences"
      />
      <SettingsLayout />
    </div>
  )
}
