'use client'

import { useEffect, useRef, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { signIn, useSession } from 'next-auth/react'
import { toast } from 'sonner'
import { getWebApp, isInsideTelegram } from '@/lib/telegram/webapp'
import { useT } from '@/lib/i18n/client'

/**
 * Running the app inside Telegram.
 *
 * Everything Telegram-specific happens here so no page has to know it might be
 * in a Mini App. Four jobs:
 *
 *   1. Boot the bridge: `ready()`, expand to full height, stop a downward swipe
 *      from closing the app mid-scroll.
 *   2. Publish the safe-area insets as CSS variables, because Telegram's own
 *      header and the phone's home indicator both overlap the viewport and the
 *      bottom nav would otherwise sit under them.
 *   3. Sign the visitor in from `initData`, once, silently.
 *   4. Wire Telegram's back button to the router, so the platform control does
 *      what the platform's users expect.
 *
 * Renders nothing. Outside Telegram every branch is skipped and this costs one
 * `initData` check.
 */

/** Marks the <html> element so CSS can target the Mini App without a media query. */
const TELEGRAM_CLASS = 'in-telegram'

export function TelegramProvider() {
  const { t } = useT()
  const { status } = useSession()
  const router = useRouter()
  const pathname = usePathname()
  const [inTelegram, setInTelegram] = useState(false)
  /* One attempt per page load. A failed sign-in that retried on every render
     would hammer the endpoint and, worse, loop forever on a stale initData. */
  const attempted = useRef(false)

  useEffect(() => {
    const app = getWebApp()
    if (!app || !isInsideTelegram()) return
    setInTelegram(true)
    document.documentElement.classList.add(TELEGRAM_CLASS)

    app.ready()
    app.expand()
    // A vertical swipe inside a scrollable page would otherwise dismiss the app
    // -- the single most reported annoyance in Mini Apps, and this app is one
    // long scroll on every screen.
    app.disableVerticalSwipes?.()

    const applyInsets = () => {
      const safe = app.safeAreaInset ?? { top: 0, bottom: 0, left: 0, right: 0 }
      const content = app.contentSafeAreaInset ?? { top: 0, bottom: 0, left: 0, right: 0 }
      const root = document.documentElement.style
      // Both matter and they are not the same: `safeAreaInset` is the device
      // (notch, home indicator), `contentSafeAreaInset` is Telegram's own header.
      root.setProperty('--tg-safe-top', `${safe.top + content.top}px`)
      root.setProperty('--tg-safe-bottom', `${safe.bottom + content.bottom}px`)
      root.setProperty('--tg-safe-left', `${safe.left}px`)
      root.setProperty('--tg-safe-right', `${safe.right}px`)
      root.setProperty('--tg-viewport-height', `${app.viewportStableHeight || app.viewportHeight}px`)
    }
    applyInsets()

    app.onEvent('viewportChanged', applyInsets)
    app.onEvent('safeAreaChanged', applyInsets)
    app.onEvent('contentSafeAreaChanged', applyInsets)

    /*
      Follow Telegram's own light/dark rather than the app's stored preference.

      Someone reading in a dark Telegram does not want a white page thrown at
      them because they once chose light on the website. The stored preference is
      left untouched, so the website keeps whatever they picked there.
    */
    const applyScheme = () => {
      const dark = app.colorScheme === 'dark'
      document.documentElement.classList.toggle('dark', dark)
      // Paint Telegram's own chrome to match, or the header sits in a different
      // colour from the page under it.
      app.setHeaderColor?.(dark ? '#0f172a' : '#ffffff')
      app.setBackgroundColor?.(dark ? '#0f172a' : '#ffffff')
    }
    applyScheme()
    app.onEvent('themeChanged', applyScheme)

    return () => {
      app.offEvent('viewportChanged', applyInsets)
      app.offEvent('safeAreaChanged', applyInsets)
      app.offEvent('contentSafeAreaChanged', applyInsets)
      app.offEvent('themeChanged', applyScheme)
    }
  }, [])

  /* Sign in from the signed blob Telegram handed the page. */
  useEffect(() => {
    if (!inTelegram || attempted.current) return
    // `loading` means NextAuth has not answered yet; acting now would sign in
    // someone who already has a session.
    if (status !== 'unauthenticated') return

    const app = getWebApp()
    if (!app?.initData) return

    attempted.current = true
    void signIn('telegram', { initData: app.initData, redirect: false })
      .then((res) => {
        if (res?.ok) {
          router.refresh()
          return
        }
        /*
          Not fatal -- the ordinary sign-in page still works inside Telegram --
          but it must not be silent. This failing quietly is how the bot spent a
          day telling people to "open the app first" while they had, repeatedly.
        */
        console.error('[telegram] sign-in failed', res?.error)
        toast.error(t('ui.telegramSignInFailed'))
      })
      .catch((error) => {
        console.error('[telegram] sign-in threw', error)
        toast.error(t('ui.telegramSignInFailed'))
      })
  }, [inTelegram, status, router])

  /*
    Someone who signed in the ordinary way, inside Telegram.

    Auto-login only fires for `unauthenticated`, so a person who already had an
    account with an email and password and typed it into the sign-in page inside
    Telegram would end up signed in with no Telegram link at all -- and the bot
    would keep telling them to "open the app once first" forever.

    Cheap to call repeatedly, and idempotent server-side, but still gated on a
    ref: this runs on every session change.
  */
  const linked = useRef(false)
  useEffect(() => {
    if (!inTelegram || linked.current || status !== 'authenticated') return
    const app = getWebApp()
    if (!app?.initData) return

    linked.current = true
    void fetch('/api/telegram/link', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ initData: app.initData }),
    })
      .then(async (res) => {
        if (res.ok) return
        /*
          A 409 means that Telegram account belongs to someone else, which is a
          refusal working as designed. Anything else means the bot will not know
          who this person is, and they will be told to "open the app first"
          forever with no idea why -- so it says so.
        */
        if (res.status === 409) return
        console.error('[telegram] link failed', res.status, await res.text().catch(() => ''))
        toast.error(t('ui.telegramLinkFailed'))
      })
      .catch((error) => {
        console.error('[telegram] link threw', error)
      })
  }, [inTelegram, status])

  /*
    Telegram's back button, wired to the router.

    Shown everywhere except the dashboard, which is the app's root -- offering
    "back" there would either do nothing or drop the person out of the app.
  */
  useEffect(() => {
    if (!inTelegram) return
    const back = getWebApp()?.BackButton
    if (!back) return

    const atRoot = pathname === '/dashboard' || pathname === '/'
    const onClick = () => router.back()

    if (atRoot) {
      back.hide()
    } else {
      back.onClick(onClick)
      back.show()
    }
    return () => {
      back.offClick(onClick)
    }
  }, [inTelegram, pathname, router])

  return null
}

export default TelegramProvider
