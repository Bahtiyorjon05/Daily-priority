'use client'

import { motion, useReducedMotion } from 'framer-motion'
import type { LucideIcon } from 'lucide-react'

/**
 * The sky-painted header for the feature pages.
 *
 * Distinct from `PageHeader`, which is a plain heading used by settings — that
 * page wants a quiet title, not an atmospheric field, and giving it one would
 * have been an unrequested change.
 *
 * Before this, each page invented its own palette: emerald/teal on prayers,
 * purple/violet/amber on goals, orange/red on journal, and gradient-clipped
 * text in three different directions. Four pages of the same app that looked
 * like four apps — and none of them changed with the prayer day, which is
 * supposed to be the thing that ties the product together.
 *
 * So: one component, painted with `.sky`, so every page picks up the current
 * phase and they all shift together. Text sits on `.sky-scrim` because the sky
 * runs light at the horizon; that's what lets the palette stay saturated
 * without white text failing contrast. Both are covered by
 * `sky-contrast.test.ts`.
 *
 * Deliberately not gradient-clipped text. `bg-clip-text` on a heading is
 * invisible to Windows High Contrast mode and renders as a solid block in some
 * email-adjacent webviews; a plain white heading on a coloured field reads the
 * same everywhere and measures better.
 */

export function PhaseHeader({
  icon: Icon,
  title,
  subtitle,
  meta,
  actions,
  children,
}: {
  icon: LucideIcon
  title: string
  /** One line under the title. Keep it to what the page is for. */
  subtitle?: string
  /** Small print beside the subtitle — a location, a date, a count. */
  meta?: React.ReactNode
  /** Primary actions, top-right on desktop and below the title on phones. */
  actions?: React.ReactNode
  /** Stat tiles or anything else that belongs inside the header field. */
  children?: React.ReactNode
}) {
  const reduceMotion = useReducedMotion()

  return (
    <motion.section
      initial={{ opacity: 0, y: reduceMotion ? 0 : 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: reduceMotion ? 0 : 0.35, ease: 'easeOut' }}
      className="sky relative overflow-hidden rounded-[28px] shadow-[0_18px_50px_-22px_rgb(0_0_0/0.5)] ring-1 ring-white/10"
    >
      {/* Islamic geometry as structure rather than decoration, per DESIGN.md. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.09] mix-blend-overlay"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg width='80' height='80' viewBox='0 0 80 80' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' stroke='%23fff' stroke-width='1'%3E%3Cpath d='M40 0l40 40-40 40L0 40z'/%3E%3Cpath d='M40 12l28 28-28 28-28-28z'/%3E%3C/g%3E%3C/svg%3E\")",
          backgroundSize: '52px 52px',
        }}
      />
      {/* Horizon bloom, so the field reads as sky rather than a flat rectangle. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 bottom-0 h-20"
        style={{
          backgroundImage: 'linear-gradient(to top, rgb(var(--sky-glow) / 0.20), transparent)',
        }}
      />

      <div className="sky-scrim relative px-5 py-5 sm:px-7 sm:py-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex min-w-0 items-start gap-3.5 sm:gap-4">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white/15 ring-1 ring-white/20 backdrop-blur-md sm:h-14 sm:w-14">
              <Icon className="h-6 w-6 text-white drop-shadow-sm sm:h-7 sm:w-7" />
            </span>

            <div className="min-w-0">
              <h1 className="truncate text-[26px] font-bold leading-tight tracking-tight text-white drop-shadow-sm sm:text-[32px]">
                {title}
              </h1>
              {subtitle && (
                <p className="mt-1 text-sm leading-snug text-white/75 sm:text-[15px]">{subtitle}</p>
              )}
              {meta && (
                <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-white/70">
                  {meta}
                </div>
              )}
            </div>
          </div>

          {actions && <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>}
        </div>

        {children && <div className="mt-5">{children}</div>}
      </div>
    </motion.section>
  )
}

/**
 * A stat inside a PhaseHeader.
 *
 * Translucent over the sky rather than an opaque card, so the header stays one
 * surface. White-on-glass is safe here because it sits inside the scrim.
 */
export function HeaderStat({
  label,
  value,
  hint,
  icon: Icon,
}: {
  label: string
  value: React.ReactNode
  hint?: string
  icon?: LucideIcon
}) {
  return (
    <div className="rounded-2xl bg-white/10 p-3.5 ring-1 ring-white/15 backdrop-blur-md">
      <div className="flex items-center gap-1.5">
        {Icon && <Icon className="h-3.5 w-3.5 shrink-0 text-white/70" />}
        <p className="truncate text-[11px] font-semibold uppercase tracking-wider text-white/70">
          {label}
        </p>
      </div>
      <p className="mt-1.5 text-2xl font-bold leading-none text-white tabular-nums">{value}</p>
      {hint && <p className="mt-1 truncate text-[11px] text-white/60">{hint}</p>}
    </div>
  )
}

export default PhaseHeader
