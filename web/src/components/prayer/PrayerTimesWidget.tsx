/**
 * PrayerTimesWidget Component
 * THE canonical prayer times widget - single source of truth
 * Consolidates 4 duplicate versions into one stunning component
 */

'use client'

import { memo, useMemo } from 'react'
import { motion } from 'framer-motion'
import {
  Sunrise,
  Sun,
  CloudSun,
  Sunset,
  Moon,
  Clock,
  MapPin,
  RefreshCcw,
  CheckCircle2,
  Circle
} from 'lucide-react'
import { format } from 'date-fns'
import { cn } from '@/lib/utils'
import type { PrayerTimesWidgetProps } from '@/types/components'
import { PrayerName } from '@/types/models'
import { PRAYER_COLORS, GRADIENT_COLORS, BG_LIGHT_COLORS, TEXT_COLORS } from '@/constants/colors'
import { CARD_STYLES, TRANSITION_STYLES, BADGE_STYLES } from '@/constants/styles'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import LoadingState from '../shared/LoadingState'

interface PrayerTimeItem {
  name: PrayerName
  displayName: string
  time: string
  icon: typeof Sunrise
  isNext: boolean
  isPast: boolean
  timeUntil?: string
}

const PrayerTimesWidget = memo<PrayerTimesWidgetProps>(({
  prayerTimes,
  isLoading = false,
  onRefresh,
  compact = false,
  showNextPrayer = true,
  className,
}) => {
  // Prayer icons mapping
  const prayerIcons = {
    FAJR: Sunrise,
    DHUHR: Sun,
    ASR: CloudSun,
    MAGHRIB: Sunset,
    ISHA: Moon,
  }

  // Build prayer times array
  const prayers = useMemo<PrayerTimeItem[]>(() => {
    if (!prayerTimes) return []

    const now = new Date()
    const currentTime = now.getTime()

    const items: PrayerTimeItem[] = [
      { name: PrayerName.FAJR, displayName: 'Fajr', time: prayerTimes.fajr, icon: Sunrise, isNext: false, isPast: false },
      { name: PrayerName.DHUHR, displayName: 'Dhuhr', time: prayerTimes.dhuhr, icon: Sun, isNext: false, isPast: false },
      { name: PrayerName.ASR, displayName: 'Asr', time: prayerTimes.asr, icon: CloudSun, isNext: false, isPast: false },
      { name: PrayerName.MAGHRIB, displayName: 'Maghrib', time: prayerTimes.maghrib, icon: Sunset, isNext: false, isPast: false },
      { name: PrayerName.ISHA, displayName: 'Isha', time: prayerTimes.isha, icon: Moon, isNext: false, isPast: false },
    ]

    // Determine which prayers have passed and which is next
    let foundNext = false
    items.forEach((prayer, index) => {
      const [hours, minutes] = prayer.time.split(':').map(Number)
      const prayerDate = new Date(now)
      prayerDate.setHours(hours, minutes, 0, 0)
      const prayerTime = prayerDate.getTime()

      if (prayerTime < currentTime) {
        prayer.isPast = true
      } else if (!foundNext && prayerTime >= currentTime) {
        prayer.isNext = true
        foundNext = true

        // Calculate time until
        const diff = prayerTime - currentTime
        const hoursUntil = Math.floor(diff / (1000 * 60 * 60))
        const minutesUntil = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))

        if (hoursUntil > 0) {
          prayer.timeUntil = `in ${hoursUntil}h ${minutesUntil}m`
        } else {
          prayer.timeUntil = `in ${minutesUntil}m`
        }
      }
    })

    // If no next prayer found (all passed), next is Fajr tomorrow
    if (!foundNext && items.length > 0) {
      items[0].isNext = true
      items[0].timeUntil = 'tomorrow'
    }

    return items
  }, [prayerTimes])

  const nextPrayer = prayers.find(p => p.isNext)

  if (isLoading) {
    return (
      <div className={cn(CARD_STYLES.base, 'p-6', className)}>
        <LoadingState text="Loading prayer times..." size="sm" />
      </div>
    )
  }

  if (!prayerTimes) {
    return (
      <div className={cn(CARD_STYLES.base, 'p-6', className)}>
        <p className="text-sm text-muted-foreground text-center">
          Prayer times unavailable
        </p>
      </div>
    )
  }

  if (compact) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className={cn(CARD_STYLES.base, 'p-4', className)}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className={cn(
              'h-10 w-10 rounded-lg bg-gradient-to-br flex items-center justify-center text-white',
              GRADIENT_COLORS.purple
            )}>
              <Moon className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-semibold">Prayer Times</h3>
              {prayerTimes.location && (
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <MapPin className="h-3 w-3" />
                  {prayerTimes.location}
                </p>
              )}
            </div>
          </div>
          {onRefresh && (
            <Button variant="ghost" size="sm" onClick={onRefresh} className="h-8 w-8 p-0">
              <RefreshCcw className="h-4 w-4" />
            </Button>
          )}
        </div>

        {/* Next Prayer Highlight */}
        {showNextPrayer && nextPrayer && (
          <div className={cn(
            'p-3 rounded-lg mb-3',
            BG_LIGHT_COLORS[PRAYER_COLORS[nextPrayer.name]]
          )}>
            <p className="text-xs font-medium text-muted-foreground mb-1">Next Prayer</p>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <nextPrayer.icon className={cn('h-5 w-5', TEXT_COLORS[PRAYER_COLORS[nextPrayer.name]])} />
                <span className="font-semibold">{nextPrayer.displayName}</span>
              </div>
              <div className="text-right">
                <p className="font-bold">{nextPrayer.time}</p>
                {nextPrayer.timeUntil && (
                  <p className="text-xs text-muted-foreground">{nextPrayer.timeUntil}</p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Compact Prayer List */}
        <div className="space-y-2">
          {prayers.map((prayer) => (
            <div
              key={prayer.name}
              className={cn(
                'flex items-center justify-between py-2 px-2 rounded-md transition-colors',
                prayer.isNext && 'bg-muted',
                prayer.isPast && 'opacity-50'
              )}
            >
              <div className="flex items-center gap-2">
                <prayer.icon className={cn('h-4 w-4', TEXT_COLORS[PRAYER_COLORS[prayer.name]])} />
                <span className="text-sm font-medium">{prayer.displayName}</span>
              </div>
              <span className="text-sm font-mono">{prayer.time}</span>
            </div>
          ))}
        </div>
      </motion.div>
    )
  }

  // Full version
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(CARD_STYLES.base, 'overflow-hidden', className)}
    >
      {/* Header with gradient background */}
      <div className={cn(
        'p-6 bg-gradient-to-br text-white relative overflow-hidden',
        GRADIENT_COLORS.purple
      )}>
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-3xl" />
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                <Moon className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold">Prayer Times</h3>
                <p className="text-sm text-white/80 flex items-center gap-1">
                  <MapPin className="h-3 w-3" />
                  {prayerTimes.location || 'Local Time'}
                </p>
              </div>
            </div>
            {onRefresh && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onRefresh}
                className="text-white hover:bg-white/20 h-9 w-9 p-0"
              >
                <RefreshCcw className="h-4 w-4" />
              </Button>
            )}
          </div>

          <div className="flex items-center gap-2 text-sm text-white/80">
            <Clock className="h-4 w-4" />
            <span>{format(new Date(prayerTimes.date), 'EEEE, MMMM d, yyyy')}</span>
          </div>
        </div>
      </div>

      {/* Next Prayer Banner */}
      {showNextPrayer && nextPrayer && (
        <div className="p-4 border-b bg-gradient-to-r from-primary/5 to-transparent">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-1">
                Next Prayer
              </p>
              <div className="flex items-center gap-2">
                <nextPrayer.icon className={cn('h-5 w-5', TEXT_COLORS[PRAYER_COLORS[nextPrayer.name]])} />
                <span className="font-bold text-lg">{nextPrayer.displayName}</span>
                <Badge variant="secondary">{nextPrayer.time}</Badge>
              </div>
            </div>
            {nextPrayer.timeUntil && (
              <div className="text-right">
                <p className="text-xs text-muted-foreground mb-1">Starts</p>
                <p className="font-semibold text-sm">{nextPrayer.timeUntil}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Prayer Times List */}
      <div className="p-4 space-y-3">
        {prayers.map((prayer, index) => (
          <motion.div
            key={prayer.name}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.05 }}
            className={cn(
              'flex items-center justify-between p-3 rounded-lg transition-all',
              TRANSITION_STYLES.base,
              prayer.isNext && cn('ring-2 ring-primary ring-offset-2', BG_LIGHT_COLORS[PRAYER_COLORS[prayer.name]]),
              !prayer.isNext && 'hover:bg-muted',
              prayer.isPast && 'opacity-60'
            )}
          >
            <div className="flex items-center gap-3">
              <div className={cn(
                'h-10 w-10 rounded-lg bg-gradient-to-br flex items-center justify-center text-white shadow-sm',
                GRADIENT_COLORS[PRAYER_COLORS[prayer.name]]
              )}>
                <prayer.icon className="h-5 w-5" />
              </div>
              <div>
                <p className="font-semibold">{prayer.displayName}</p>
                {prayer.timeUntil && (
                  <p className="text-xs text-muted-foreground">{prayer.timeUntil}</p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-3">
              <span className="font-mono font-bold text-lg">{prayer.time}</span>
              {prayer.isPast ? (
                <CheckCircle2 className="h-5 w-5 text-emerald-600" />
              ) : (
                <Circle className="h-5 w-5 text-muted-foreground" />
              )}
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  )
})

PrayerTimesWidget.displayName = 'PrayerTimesWidget'

export default PrayerTimesWidget
