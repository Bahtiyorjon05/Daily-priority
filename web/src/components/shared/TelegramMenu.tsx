'use client'

import { useState } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { MessagesSquare, Megaphone, ExternalLink } from 'lucide-react'
import { useT } from '@/lib/i18n/client'
import { useDismissable } from '@/hooks/useDismissable'
import { TELEGRAM, TelegramIcon } from './Telegram'

/**
 * The Telegram control in the dashboard header.
 *
 * There are two destinations, not one — a channel to read and a group to talk
 * in — so a single link would have to pick a favourite and hide the other. A
 * small menu costs one tap and makes both discoverable.
 *
 * Sized and shaped like the language, notification, phase and theme buttons
 * beside it: 44×44 minimum, same rounding, same neutral tile. A brand-coloured
 * button here would pull the eye away from the page for no reason.
 */
export function TelegramMenu() {
  const { t } = useT()
  const [open, setOpen] = useState(false)
  const reduceMotion = useReducedMotion()
  // Wraps the trigger as well as the panel — see useDismissable for why the
  // panel alone makes the button look stuck.
  const shell = useDismissable<HTMLDivElement>(open, () => setOpen(false))

  const items = [
    {
      href: TELEGRAM.channel,
      handle: TELEGRAM.channelHandle,
      icon: Megaphone,
      title: t('ui.telegramChannel'),
      blurb: t('ui.telegramChannelBlurb'),
    },
    {
      href: TELEGRAM.group,
      handle: TELEGRAM.groupHandle,
      icon: MessagesSquare,
      title: t('ui.telegramGroup'),
      blurb: t('ui.telegramGroupBlurb'),
    },
  ]

  return (
    <div ref={shell} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={t('ui.joinUsOnTelegram')}
        title={t('ui.joinUsOnTelegram')}
        className="flex h-11 w-11 min-h-[44px] min-w-[44px] shrink-0 items-center justify-center rounded-2xl bg-gray-100 shadow-sm transition-all duration-200 hover:scale-105 hover:bg-gray-200 hover:shadow-md dark:bg-gray-800 dark:hover:bg-gray-700"
      >
        <TelegramIcon className="h-5 w-5 text-[#229ED9] dark:text-[#3EAEE5]" />
      </button>

      <AnimatePresence>
        {open && (
          <>
            {/* Phones get a backdrop so a tap anywhere closes it without having
                to find the small trigger again. */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setOpen(false)}
              className="fixed inset-0 z-[65] bg-black/40 backdrop-blur-[2px] sm:hidden"
              aria-hidden="true"
            />
            <motion.div
              role="menu"
              initial={{ opacity: 0, y: reduceMotion ? 0 : 8, scale: reduceMotion ? 1 : 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: reduceMotion ? 0 : 8, scale: reduceMotion ? 1 : 0.97 }}
              transition={{ duration: reduceMotion ? 0 : 0.16 }}
              className="fixed inset-x-4 top-20 z-[70] rounded-2xl border border-black/5 bg-white p-2 shadow-2xl dark:border-white/10 dark:bg-gray-900 sm:absolute sm:inset-x-auto sm:right-0 sm:top-auto sm:mt-2 sm:w-80"
            >
              <p className="px-3 py-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                {t('ui.joinUsOnTelegram')}
              </p>

              {items.map(({ href, handle, icon: Icon, title, blurb }) => (
                <a
                  key={href}
                  role="menuitem"
                  href={href}
                  target="_blank"
                  // noreferrer alongside noopener: without it the new tab can
                  // reach back through window.opener.
                  rel="noopener noreferrer"
                  onClick={() => setOpen(false)}
                  className="flex items-start gap-3 rounded-xl p-3 transition-colors hover:bg-gray-100 dark:hover:bg-gray-800"
                >
                  <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#229ED9]/10 text-[#229ED9] dark:text-[#3EAEE5]">
                    <Icon className="h-4 w-4" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center gap-1.5">
                      <span className="truncate text-sm font-semibold">{title}</span>
                      <ExternalLink className="h-3 w-3 shrink-0 text-muted-foreground" />
                    </span>
                    <span className="mt-0.5 block text-xs leading-snug text-muted-foreground">
                      {blurb}
                    </span>
                    <span className="mt-1 block truncate text-[11px] font-medium text-[#229ED9] dark:text-[#3EAEE5]">
                      {handle}
                    </span>
                  </span>
                </a>
              ))}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}
