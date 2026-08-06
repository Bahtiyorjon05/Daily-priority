'use client'

import { useT } from '@/lib/i18n/client'
import { useEffect, useState } from 'react'
import { Bell, BellOff, Loader2, Save, Send } from 'lucide-react'
import { toast } from 'sonner'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { usePushNotifications } from '@/hooks/usePushNotifications'

interface Prefs {
  prayerReminders: boolean
  prayerLeadMinutes: number
  taskReminders: boolean
  habitReminders: boolean
  habitReminderHour: number
  weeklyReviewEmail: boolean
  quietHoursStart: number | null
  quietHoursEnd: number | null
}

const HOURS = Array.from({ length: 24 }, (_, i) => i)
const label = (h: number) => `${String(h).padStart(2, '0')}:00`

export function NotificationSettings() {
  const { t } = useT()
  const { supported, subscribed, permission, busy, subscribe, unsubscribe } = usePushNotifications()
  const [prefs, setPrefs] = useState<Prefs | null>(null)
  const [saving, setSaving] = useState(false)
  const [testing, setTesting] = useState(false)

  useEffect(() => {
    fetch('/api/notifications/preferences', { cache: 'no-store' })
      .then((r) => r.json())
      .then((d) => setPrefs(d.preferences))
      .catch(() => toast.error(t('ui.couldNotLoadNotificationSettings')))
  }, [])

  const set = <K extends keyof Prefs>(key: K, value: Prefs[K]) =>
    setPrefs((p) => (p ? { ...p, [key]: value } : p))

  async function sendTest() {
    setTesting(true)
    try {
      const res = await fetch('/api/push/test', { method: 'POST' })
      const data = await res.json().catch(() => ({}))
      if (res.ok && data.ok) toast.success(data.message || 'Test notification sent')
      else toast.error(data.error || data.message || 'Could not send test notification')
    } catch {
      toast.error(t('ui.couldNotSendTestNotification'))
    } finally {
      setTesting(false)
    }
  }

  async function save() {
    if (!prefs) return
    setSaving(true)
    try {
      const res = await fetch('/api/notifications/preferences', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(prefs),
      })
      if (!res.ok) throw new Error()
      toast.success(t('ui.notificationSettingsSaved'))
    } catch {
      toast.error(t('ui.failedToSaveSettings'))
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Device push */}
      <Card>
        <CardHeader>
          <CardTitle level={2} className="flex items-center gap-2 text-lg">
            <Bell className="h-5 w-5 text-emerald-600" /> {t('ui.deviceNotifications')}
          </CardTitle>
          <CardDescription>
            Get reminders on this device even when the app is closed. Works in the installed app too.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {!supported ? (
            <p className="text-sm text-muted-foreground">
              This browser doesn&apos;t support push notifications. Try installing the app, or use Chrome/Edge/Safari 16.4+.
            </p>
          ) : (
            <div className="flex flex-wrap items-center gap-3">
              <Button
                onClick={() => (subscribed ? unsubscribe() : subscribe())}
                disabled={busy}
                variant={subscribed ? 'outline' : 'default'}
                className="gap-2"
              >
                {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : subscribed ? <BellOff className="h-4 w-4" /> : <Bell className="h-4 w-4" />}
                {subscribed ? 'Turn off on this device' : 'Enable on this device'}
              </Button>
              <span className="text-xs text-muted-foreground">
                {permission === 'denied'
                  ? 'Blocked in browser settings — allow notifications for this site first.'
                  : subscribed
                    ? 'Enabled on this device.'
                    : 'Not enabled on this device.'}
              </span>

              {subscribed && (
                <Button variant="outline" onClick={sendTest} disabled={testing} className="gap-2">
                  {testing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                  Send test notification
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Preferences */}
      <Card>
        <CardHeader>
          <CardTitle level={2} className="text-lg">{t('ui.whatToSend')}</CardTitle>
          <CardDescription>{t('ui.theseApplyAcrossAllYourDevices')}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          {!prefs ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" /> Loading…
            </div>
          ) : (
            <>
              <Row
                id="prayer"
                title={t('ui.prayerReminders')}
                desc="A nudge shortly before each prayer time."
                checked={prefs.prayerReminders}
                onChange={(v) => set('prayerReminders', v)}
              />
              {prefs.prayerReminders && (
                <div className="ml-1 flex items-center gap-2 text-sm">
                  <Label htmlFor="lead" className="text-muted-foreground">{t('ui.notify')}</Label>
                  <select
                    id="lead"
                    value={prefs.prayerLeadMinutes}
                    onChange={(e) => set('prayerLeadMinutes', Number(e.target.value))}
                    className="rounded-lg border bg-background px-2 py-1"
                  >
                    {[0, 5, 10, 15, 20, 30].map((m) => (
                      <option key={m} value={m}>{m === 0 ? 'at prayer time' : `${m} min before`}</option>
                    ))}
                  </select>
                </div>
              )}

              <Row
                id="habits"
                title={t('ui.habitReminder')}
                desc="An evening nudge if habits are still unticked."
                checked={prefs.habitReminders}
                onChange={(v) => set('habitReminders', v)}
              />
              {prefs.habitReminders && (
                <div className="ml-1 flex items-center gap-2 text-sm">
                  <Label htmlFor="habitHour" className="text-muted-foreground">{t('ui.sendAt')}</Label>
                  <select
                    id="habitHour"
                    value={prefs.habitReminderHour}
                    onChange={(e) => set('habitReminderHour', Number(e.target.value))}
                    className="rounded-lg border bg-background px-2 py-1"
                  >
                    {HOURS.map((h) => <option key={h} value={h}>{label(h)}</option>)}
                  </select>
                </div>
              )}

              <Row
                id="tasks"
                title={t('ui.overdueTaskDigest')}
                desc="A morning summary when tasks are past due."
                checked={prefs.taskReminders}
                onChange={(v) => set('taskReminders', v)}
              />
              <Row
                id="weekly"
                title={t('ui.weeklyReviewEmail')}
                desc="A Sunday summary of your week."
                checked={prefs.weeklyReviewEmail}
                onChange={(v) => set('weeklyReviewEmail', v)}
              />

              <div className="border-t pt-4">
                <Label className="text-sm font-medium">{t('ui.quietHours')}</Label>
                <p className="mb-2 text-xs text-muted-foreground">{t('ui.noNotificationsDuringThisWindow')}</p>
                <div className="flex items-center gap-2 text-sm">
                  <select
                    value={prefs.quietHoursStart ?? ''}
                    onChange={(e) => set('quietHoursStart', e.target.value === '' ? null : Number(e.target.value))}
                    className="rounded-lg border bg-background px-2 py-1"
                  >
                    <option value="">{t('common.off')}</option>
                    {HOURS.map((h) => <option key={h} value={h}>{label(h)}</option>)}
                  </select>
                  <span className="text-muted-foreground">to</span>
                  <select
                    value={prefs.quietHoursEnd ?? ''}
                    onChange={(e) => set('quietHoursEnd', e.target.value === '' ? null : Number(e.target.value))}
                    className="rounded-lg border bg-background px-2 py-1"
                  >
                    <option value="">{t('common.off')}</option>
                    {HOURS.map((h) => <option key={h} value={h}>{label(h)}</option>)}
                  </select>
                </div>
              </div>

              <Button onClick={save} disabled={saving} className="gap-2">
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                Save preferences
              </Button>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

function Row({
  id, title, desc, checked, onChange,
}: {
  id: string; title: string; desc: string; checked: boolean; onChange: (v: boolean) => void
}) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div className="min-w-0">
        <Label htmlFor={id} className="text-sm font-medium">{title}</Label>
        <p className="text-xs text-muted-foreground">{desc}</p>
      </div>
      <Switch id={id} checked={checked} onCheckedChange={onChange} />
    </div>
  )
}
