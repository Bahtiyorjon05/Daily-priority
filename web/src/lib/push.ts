/**
 * Web Push delivery.
 *
 * Sends notifications to a user's registered browser/device endpoints so
 * reminders arrive even when the app is fully closed. Subscriptions that the
 * push service reports as gone (404/410) are pruned automatically.
 */

import webpush from 'web-push'
import { prisma } from './prisma'

let configured = false

function ensureConfigured(): boolean {
  if (configured) return true
  const publicKey = process.env.VAPID_PUBLIC_KEY
  const privateKey = process.env.VAPID_PRIVATE_KEY
  const subject = process.env.VAPID_SUBJECT || 'mailto:support@dailypriority.app'
  if (!publicKey || !privateKey) return false
  webpush.setVapidDetails(subject, publicKey, privateKey)
  configured = true
  return true
}

export function isPushConfigured(): boolean {
  return ensureConfigured()
}

export interface PushPayload {
  title: string
  body: string
  url?: string
  tag?: string
}

/**
 * Sends `payload` to every endpoint registered for `userId`.
 * Returns how many were delivered and how many dead endpoints were removed.
 */
export async function sendPushToUser(
  userId: string,
  payload: PushPayload
): Promise<{ sent: number; removed: number }> {
  if (!ensureConfigured()) return { sent: 0, removed: 0 }

  const subs = await prisma.pushSubscription.findMany({ where: { userId } })
  if (subs.length === 0) return { sent: 0, removed: 0 }

  const body = JSON.stringify({
    title: payload.title,
    body: payload.body,
    url: payload.url || '/dashboard',
    tag: payload.tag,
  })

  let sent = 0
  const dead: string[] = []

  await Promise.all(
    subs.map(async (sub) => {
      try {
        await webpush.sendNotification(
          { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
          body
        )
        sent++
      } catch (error) {
        const status = (error as { statusCode?: number }).statusCode
        // 404/410 mean the browser dropped the subscription for good.
        if (status === 404 || status === 410) dead.push(sub.id)
        else console.error('[push] send failed', status, (error as Error).message)
      }
    })
  )

  if (dead.length > 0) {
    await prisma.pushSubscription.deleteMany({ where: { id: { in: dead } } })
  }
  if (sent > 0) {
    await prisma.pushSubscription
      .updateMany({ where: { userId }, data: { lastUsedAt: new Date() } })
      .catch(() => {})
  }

  return { sent, removed: dead.length }
}

/** True when `hour` (0-23) falls inside the user's configured quiet hours. */
export function isQuietHour(
  hour: number,
  start?: number | null,
  end?: number | null
): boolean {
  if (start == null || end == null) return false
  // Ranges may wrap past midnight (e.g. 22 -> 7).
  return start <= end ? hour >= start && hour < end : hour >= start || hour < end
}
