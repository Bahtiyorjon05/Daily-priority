'use client'

import { useT } from '@/lib/i18n/client'
import { useState, useEffect } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { User, Shield, Palette, Bell } from 'lucide-react'
import { ProfileSettings } from './ProfileSettings'
import { SecuritySettings } from './SecuritySettings'
import { AppearanceSettings } from './AppearanceSettings'
import { NotificationSettings } from './NotificationSettings'

export function SettingsLayout() {
  const { t } = useT()
  const searchParams = useSearchParams()
  const router = useRouter()
  const tabParam = searchParams.get('tab') || 'profile'
  const [activeTab, setActiveTab] = useState(tabParam)

  useEffect(() => {
    // Update active tab when URL params change
    const tab = searchParams.get('tab') || 'profile'
    setActiveTab(tab)
  }, [searchParams])

  const handleTabChange = (value: string) => {
    setActiveTab(value)
    router.push(`/settings?tab=${value}`, { scroll: false })
  }

  return (
    <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-6">
      <TabsList className="grid w-full grid-cols-4">
        <TabsTrigger value="profile" className="gap-2">
          <User className="h-4 w-4" />
          <span className="hidden sm:inline">{t('ui.profile')}</span>
        </TabsTrigger>
        <TabsTrigger value="notifications" className="gap-2">
          <Bell className="h-4 w-4" />
          <span className="hidden sm:inline">{t('nav.notifications')}</span>
        </TabsTrigger>
        <TabsTrigger value="security" className="gap-2">
          <Shield className="h-4 w-4" />
          <span className="hidden sm:inline">{t('ui.security')}</span>
        </TabsTrigger>
        <TabsTrigger value="appearance" className="gap-2">
          <Palette className="h-4 w-4" />
          <span className="hidden sm:inline">{t('ui.appearance')}</span>
        </TabsTrigger>
      </TabsList>

      <TabsContent value="profile">
        <ProfileSettings />
      </TabsContent>

      <TabsContent value="notifications">
        <NotificationSettings />
      </TabsContent>

      <TabsContent value="security">
        <SecuritySettings />
      </TabsContent>

      <TabsContent value="appearance">
        <AppearanceSettings />
      </TabsContent>
    </Tabs>
  )
}
