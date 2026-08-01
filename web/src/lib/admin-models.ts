/**
 * Registry of every database table exposed in the admin dashboard.
 *
 * Prisma 7's client does not ship `Prisma.dmmf`, so the model list is declared
 * explicitly. `key` is the Prisma Client delegate name (prisma[key]); `label`
 * and `group` are for display only.
 */

import { prisma } from './prisma'

export type AdminModelKey =
  | 'user'
  | 'account'
  | 'session'
  | 'verificationToken'
  | 'task'
  | 'subtask'
  | 'category'
  | 'tag'
  | 'habit'
  | 'habitCompletion'
  | 'analytics'
  | 'islamicQuote'
  | 'prayerTime'
  | 'prayerTracking'
  | 'journalEntry'
  | 'goal'
  | 'userPreference'
  | 'focusSession'
  | 'calendarEvent'
  | 'adhkarProgress'
  | 'userSettings'
  | 'twoFactorToken'

export interface AdminModel {
  key: AdminModelKey
  label: string
  group: 'Identity & Auth' | 'Productivity' | 'Spiritual' | 'System'
}

export const ADMIN_MODELS: AdminModel[] = [
  { key: 'user', label: 'Users', group: 'Identity & Auth' },
  { key: 'account', label: 'OAuth Accounts', group: 'Identity & Auth' },
  { key: 'session', label: 'Sessions', group: 'Identity & Auth' },
  { key: 'verificationToken', label: 'Verification Tokens', group: 'Identity & Auth' },
  { key: 'twoFactorToken', label: 'Two-Factor Tokens', group: 'Identity & Auth' },

  { key: 'task', label: 'Tasks', group: 'Productivity' },
  { key: 'subtask', label: 'Subtasks', group: 'Productivity' },
  { key: 'category', label: 'Categories', group: 'Productivity' },
  { key: 'tag', label: 'Tags', group: 'Productivity' },
  { key: 'habit', label: 'Habits', group: 'Productivity' },
  { key: 'habitCompletion', label: 'Habit Completions', group: 'Productivity' },
  { key: 'goal', label: 'Goals', group: 'Productivity' },
  { key: 'focusSession', label: 'Focus Sessions', group: 'Productivity' },
  { key: 'calendarEvent', label: 'Calendar Events', group: 'Productivity' },
  { key: 'journalEntry', label: 'Journal Entries', group: 'Productivity' },

  { key: 'prayerTime', label: 'Prayer Times', group: 'Spiritual' },
  { key: 'prayerTracking', label: 'Prayer Tracking', group: 'Spiritual' },
  { key: 'adhkarProgress', label: 'Adhkar Progress', group: 'Spiritual' },
  { key: 'islamicQuote', label: 'Islamic Quotes', group: 'Spiritual' },

  { key: 'analytics', label: 'Analytics', group: 'System' },
  { key: 'userPreference', label: 'User Preferences', group: 'System' },
  { key: 'userSettings', label: 'User Settings', group: 'System' },
]

export function getAdminModel(key: string): AdminModel | undefined {
  return ADMIN_MODELS.find((m) => m.key === key)
}

// Models whose table has no `createdAt` column — ordering by it would error.
const NO_CREATED_AT = new Set<AdminModelKey>([
  'account',
  'session',
  'verificationToken',
  'habitCompletion',
  'prayerTime',
  'prayerTracking',
  'userPreference',
])

/** Preferred ordering column for a model, or null if none is safe. */
export function getOrderBy(key: AdminModelKey): Record<string, 'desc'> | undefined {
  return NO_CREATED_AT.has(key) ? undefined : { createdAt: 'desc' }
}

// Column used to filter a model by a given user id (for the "filter per user"
// feature). The User model filters on its own `id`; models without any direct
// user link are omitted.
const USER_FILTER_FIELD: Partial<Record<AdminModelKey, 'id' | 'userId'>> = {
  user: 'id',
  account: 'userId',
  session: 'userId',
  task: 'userId',
  category: 'userId',
  habit: 'userId',
  analytics: 'userId',
  prayerTime: 'userId',
  prayerTracking: 'userId',
  journalEntry: 'userId',
  goal: 'userId',
  userPreference: 'userId',
  focusSession: 'userId',
  calendarEvent: 'userId',
  adhkarProgress: 'userId',
  userSettings: 'userId',
  twoFactorToken: 'userId',
}

export function getUserFilterField(key: AdminModelKey): 'id' | 'userId' | undefined {
  return USER_FILTER_FIELD[key]
}

/** The Prisma delegate for a model key (any-typed: the key is validated first). */
export function getDelegate(key: AdminModelKey): {
  findMany: (args: unknown) => Promise<unknown[]>
  count: (args?: unknown) => Promise<number>
} {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (prisma as any)[key]
}
