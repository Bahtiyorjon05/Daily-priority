'use client'

import { Suspense, useCallback, useEffect, useRef, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { signIn } from 'next-auth/react'
import { Loader2, Moon } from 'lucide-react'
import { getWebApp } from '@/lib/telegram/webapp'
import { useT } from '@/lib/i18n/client'

/**
 * The door the Mini App comes in through.
 *
 * Telegram passes `initData` in the URL FRAGMENT (`#tgWebAppData=...`) and its
 * script reads it on load. A fragment does not survive a server-side redirect in
 * Telegram's webview — and `/dashboard` is behind auth, so opening the Mini App
 * there meant: 307 to /signin, fragment gone, `initData` empty forever. Every
 * Telegram feature depended on a value that had been thrown away before a single
 * line of our JavaScript ran, which is why the app looked completely fine and
 * the bot never knew who anyone was.
 *
 * So this route is public and never redirects on the server. It boots the
 * bridge, signs in with the blob it was given, and only then moves on.
 *
 * It also fails loudly. The previous version of all this failed in silence, and
 * silence cost days.
 */

function TelegramEntry() {
  const { t } = useT()
  const router = useRouter()
  const params = useSearchParams()
  const [error, setError] = useState<string | null>(null)
  const started = useRef(false)

  /** Where to go once we are in. Only same-site paths: `to` comes from a URL. */
  const destination = useCallback(() => {
    const raw = params.get('to') ?? '/dashboard'
    return raw.startsWith('/') && !raw.startsWith('//') ? raw : '/dashboard'
  }, [params])

  useEffect(() => {
    if (started.current) return
    started.current = true

    const run = async () => {
      const app = getWebApp()

      /*
        Opened outside Telegram, or the bridge did not load. Nothing to sign in
        with, so hand over to the ordinary sign-in page rather than sitting on a
        spinner.
      */
      if (!app?.initData) {
        router.replace(`/signin?callbackUrl=${encodeURIComponent(destination())}`)
        return
      }

      app.ready()
      app.expand()

      const result = await signIn('telegram', {
        initData: app.initData,
        redirect: false,
      }).catch((e: unknown) => {
        console.error('[tg] signIn threw', e)
        return null
      })

      if (result?.ok) {
        router.replace(destination())
        return
      }

      console.error('[tg] signIn failed', result?.error)
      setError(result?.error ?? 'failed')
    }

    void run()
  }, [router, destination])

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 bg-white p-6 text-center dark:bg-slate-950">
      <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-600 text-white">
        <Moon className="h-7 w-7" />
      </span>

      {error ? (
        <>
          <p className="max-w-sm text-sm text-slate-700 dark:text-slate-200">
            {t('ui.telegramSignInFailed')}
          </p>
          <button
            onClick={() => router.replace(`/signin?callbackUrl=${encodeURIComponent(destination())}`)}
            className="inline-flex h-11 items-center rounded-xl bg-emerald-600 px-5 text-sm font-semibold text-white"
          >
            {t('auth.signIn')}
          </button>
          {/* The reason, in small print. Somebody reporting this can now say what
              it said instead of "it does not work". */}
          <p className="max-w-sm text-xs text-slate-400">{error}</p>
        </>
      ) : (
        <>
          <Loader2 className="h-6 w-6 animate-spin text-emerald-600" />
          <p className="text-sm text-slate-500 dark:text-slate-400">{t('ui.loading')}</p>
        </>
      )}
    </main>
  )
}

/**
 * `useSearchParams` opts a page out of static prerendering unless it sits inside
 * a Suspense boundary -- the build fails outright rather than warning. The
 * fallback is the same spinner the entry shows anyway, so nothing flickers.
 */
export default function TelegramEntryPage() {
  return (
    <Suspense fallback={<EntryShell />}>
      <TelegramEntry />
    </Suspense>
  )
}

function EntryShell() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 bg-white p-6 dark:bg-slate-950">
      <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-600 text-white">
        <Moon className="h-7 w-7" />
      </span>
      <Loader2 className="h-6 w-6 animate-spin text-emerald-600" />
    </main>
  )
}
