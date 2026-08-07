'use client'

import { useState } from 'react'
import { signOut } from 'next-auth/react'
import { AlertTriangle, Loader2, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { useT } from '@/lib/i18n/client'

/**
 * Account deletion.
 *
 * Two deliberate points of friction, because this is the one action in the app
 * that can't be walked back by the person taking it:
 *
 *  1. A first click only opens the confirmation — it never deletes. So a
 *     mis-tap can't close an account.
 *  2. The confirm button stays disabled until the typed email matches this
 *     account exactly. Typing your own address out is slow enough to be a
 *     decision rather than a reflex, and it makes "which account is this?"
 *     unambiguous on a shared machine.
 *
 * The same email check runs server-side; this is the affordance, not the
 * boundary.
 *
 * The copy states what the user loses and that closure is immediate, without
 * describing internal storage — that belongs in the privacy policy, not in a
 * settings panel.
 */
export function DeleteAccountCard({ email }: { email: string }) {
  const { t } = useT()
  const [confirming, setConfirming] = useState(false)
  const [typed, setTyped] = useState('')
  const [reason, setReason] = useState('')
  const [busy, setBusy] = useState(false)

  const matches = typed.trim().toLowerCase() === email.trim().toLowerCase()

  const handleDelete = async () => {
    if (!matches || busy) return
    setBusy(true)
    try {
      const res = await fetch('/api/user/account', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ confirmEmail: typed.trim(), reason: reason.trim() || undefined }),
      })
      const data = await res.json().catch(() => ({}))

      if (!res.ok) {
        toast.error(data.error || t('error.generic'))
        setBusy(false)
        return
      }

      toast.success(t('account.deleted'))
      // Straight out — leaving them on a dashboard for a closed account would
      // just produce a wall of failed requests.
      await signOut({ callbackUrl: '/' })
    } catch {
      toast.error(t('error.network'))
      setBusy(false)
    }
  }

  return (
    <section className="rounded-2xl border border-red-200 bg-red-50/60 p-5 dark:border-red-900/50 dark:bg-red-950/20">
      <div className="flex items-start gap-3">
        <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-red-100 dark:bg-red-900/40">
          <AlertTriangle className="h-4 w-4 text-red-600 dark:text-red-400" />
        </span>
        <div className="min-w-0 flex-1">
          <h3 className="text-base font-bold text-red-900 dark:text-red-200">
            {t('account.deleteTitle')}
          </h3>
          <p className="mt-1 text-sm leading-relaxed text-red-800/90 dark:text-red-300/90">
            {t('account.deleteBody')}
          </p>

          {!confirming ? (
            <button
              type="button"
              onClick={() => setConfirming(true)}
              className="mt-4 inline-flex items-center gap-2 rounded-xl border border-red-300 bg-white px-4 py-2 text-sm font-semibold text-red-700 transition-colors hover:bg-red-50 dark:border-red-800 dark:bg-transparent dark:text-red-300 dark:hover:bg-red-950/40"
            >
              <Trash2 className="h-4 w-4" />
              {t('account.deleteAction')}
            </button>
          ) : (
            <div className="mt-4 space-y-3">
              {/* The second warning. The first click was cheap; this one asks
                  them to stop and think, and names what is lost. */}
              <div className="rounded-xl border border-red-300 bg-white p-3.5 dark:border-red-800/60 dark:bg-red-950/30">
                <p className="text-sm font-semibold text-red-900 dark:text-red-200">
                  {t('account.deleteWarnTitle')}
                </p>
                <ul className="mt-2 space-y-1 text-sm text-red-800/90 dark:text-red-300/90">
                  <li>• {t('account.deleteWarn1')}</li>
                  <li>• {t('account.deleteWarn2')}</li>
                  <li>• {t('account.deleteWarn3')}</li>
                </ul>
              </div>

              <div>
                <label
                  htmlFor="confirm-email"
                  className="block text-sm font-medium text-red-900 dark:text-red-200"
                >
                  {t('account.typeEmailToConfirm')}
                </label>
                {/* The address is shown so it can be copied deliberately rather
                    than recalled — the point is confirmation, not a memory test. */}
                <p className="mt-1 font-mono text-xs text-red-700/80 dark:text-red-400/80">
                  {email}
                </p>
                <input
                  id="confirm-email"
                  type="email"
                  autoComplete="off"
                  spellCheck={false}
                  value={typed}
                  onChange={e => setTyped(e.target.value)}
                  placeholder={email}
                  className="mt-2 w-full rounded-xl border border-red-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none ring-red-400/40 placeholder:text-slate-400 focus:ring-2 dark:border-red-800 dark:bg-slate-900 dark:text-slate-100"
                />
              </div>

              <div>
                <label
                  htmlFor="delete-reason"
                  className="block text-sm font-medium text-red-900 dark:text-red-200"
                >
                  {t('account.reasonLabel')}
                </label>
                <input
                  id="delete-reason"
                  type="text"
                  value={reason}
                  onChange={e => setReason(e.target.value)}
                  placeholder={t('account.reasonPlaceholder')}
                  className="mt-2 w-full rounded-xl border border-red-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none ring-red-400/40 placeholder:text-slate-400 focus:ring-2 dark:border-red-900 dark:bg-slate-900 dark:text-slate-100"
                />
              </div>

              <div className="flex flex-wrap gap-2 pt-1">
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={!matches || busy}
                  className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-45"
                >
                  {busy ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      {t('common.loading')}
                    </>
                  ) : (
                    <>
                      <Trash2 className="h-4 w-4" />
                      {t('account.deleteConfirm')}
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setConfirming(false)
                    setTyped('')
                    setReason('')
                  }}
                  disabled={busy}
                  className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50 disabled:opacity-50 dark:border-slate-700 dark:bg-transparent dark:text-slate-200 dark:hover:bg-slate-800"
                >
                  {t('account.keepAccount')}
                </button>
              </div>

              {typed.length > 0 && !matches && (
                <p className="text-xs font-medium text-red-700 dark:text-red-400">
                  {t('account.emailMismatch')}
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </section>
  )
}

export default DeleteAccountCard
