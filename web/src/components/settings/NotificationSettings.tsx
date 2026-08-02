'use client'

import { useEffect, useState } from 'react'
import { Bell, BellOff, Loader2, Save } from 'lucide-react'
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
  const { supported, subscribed, permission, busy, subscribe, unsubscribe } = usePushNotifications()
  const [prefs, setPrefs] = useState<Prefs | null>(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetch('/api/notifications/preferences', { cache: 'no-store' })
      .then((r) => r.json())
      .then((d) => setPrefs(d.preferences))
      .catch(() => toast.error('Could not load notification settings'))
  }, [])

  const set = <K extends keyof Prefs>(key: K, value: Prefs[K]) =>
    setPrefs((p) => (p ? { ...p, [key]: value } : p))

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
      toast.success('Notification settings saved')
    } catch {
      toast.error('Failed to save settings')
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
            <Bell className="h-5 w-5 text-emerald-600" /> Device notifications
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
            </div>
          )}
        </CardContent>
      </Card>

      {/* Preferences */}
      <Card>
        <CardHeader>
          <CardTitle level={2} className="text-lg">What to send</CardTitle>
          <CardDescription>These apply across all your devices.</CardDescription>
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
                title="Prayer reminders"
                desc="A nudge shortly before each prayer time."
                checked={prefs.prayerReminders}
                onChange={(v) => set('prayerReminders', v)}
              />
              {prefs.prayerReminders && (
                <div className="ml-1 flex items-center gap-2 text-sm">
                  <Label htmlFor="lead" className="text-muted-foreground">Notify</Label>
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
                title="Habit reminder"
                desc="An evening nudge if habits are still unticked."
                checked={prefs.habitReminders}
                onChange={(v) => set('habitReminders', v)}
              />
              {prefs.habitReminders && (
                <div className="ml-1 flex items-center gap-2 text-sm">
                  <Label htmlFor="habitHour" className="text-muted-foreground">Send at</Label>
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
                title="Overdue task digest"
                desc="A morning summary when tasks are past due."
                checked={prefs.taskReminders}
                onChange={(v) => set('taskReminders', v)}
              />
              <Row
                id="weekly"
                title="Weekly review email"
                desc="A Sunday summary of your week."
                checked={prefs.weeklyReviewEmail}
                onChange={(v) => set('weeklyReviewEmail', v)}
              />

              <div className="border-t pt-4">
                <Label className="text-sm font-medium">Quiet hours</Label>
                <p className="mb-2 text-xs text-muted-foreground">No notifications during this window.</p>
                <div className="flex items-center gap-2 text-sm">
                  <select
                    value={prefs.quietHoursStart ?? ''}
                    onChange={(e) => set('quietHoursStart', e.target.value === '' ? null : Number(e.target.value))}
                    className="rounded-lg border bg-background px-2 py-1"
                  >
                    <option value="">Off</option>
                    {HOURS.map((h) => <option key={h} value={h}>{label(h)}</option>)}
                  </select>
                  <span className="text-muted-foreground">to</span>
                  <select
                    value={prefs.quietHoursEnd ?? ''}
                    onChange={(e) => set('quietHoursEnd', e.target.value === '' ? null : Number(e.target.value))}
                    className="rounded-lg border bg-background px-2 py-1"
                  >
                    <option value="">Off</option>
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
