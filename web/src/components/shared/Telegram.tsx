'use client'

/**
 * Telegram channel and discussion group.
 *
 * The two URLs live here and nowhere else. They appear in the dashboard header,
 * the profile menu and the marketing footer, and a link that is right in two
 * places and stale in the third is worse than no link at all.
 *
 * The mark is inlined rather than taken from lucide, which has no Telegram
 * glyph — `Send` is a generic paper plane and reads as "submit", not "Telegram".
 * `currentColor` so it inherits whatever ink the surface gives it.
 */

export const TELEGRAM = {
  /** Announcements, one-way. */
  channel: 'https://t.me/daily_priority',
  channelHandle: '@daily_priority',
  /** Where people talk back. */
  group: 'https://t.me/daily_priority_group',
  groupHandle: '@daily_priority_group',
  /** Direct line to the maintainer, from the contact section. */
  support: 'https://t.me/Bahtiyorjon05',
  supportHandle: '@Bahtiyorjon05',
} as const

export function TelegramIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
      focusable="false"
      className={className}
    >
      <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.26-1.91.178-.183 3.247-2.977 3.307-3.23.007-.03.014-.14-.052-.198-.066-.058-.163-.038-.234-.022-.1.023-1.684 1.07-4.753 3.142-.45.309-.856.46-1.221.451-.402-.008-1.176-.227-1.751-.414-.706-.229-1.267-.35-1.242-.738.013-.202.29-.409.83-.62 3.237-1.41 5.394-2.34 6.472-2.786 3.079-1.28 3.717-1.504 4.135-1.511z" />
    </svg>
  )
}
