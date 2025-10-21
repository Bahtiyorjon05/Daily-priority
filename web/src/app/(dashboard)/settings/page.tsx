'use client'

import { SettingsLayout } from '@/components/settings/SettingsLayout'
import { PageHeader } from '@/components/shared/PageHeader'

export default function SettingsPage() {
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
