'use client'

import { useT } from '@/lib/i18n/client'
import { useEffect, useState, useRef } from 'react'
import { useSession } from 'next-auth/react'
import { motion, AnimatePresence } from 'framer-motion'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Brain, Settings, CheckCircle2 } from 'lucide-react'
import { toast } from 'sonner'
import { clientCache } from '@/lib/performance'

import { FocusTimer } from '@/components/focus/FocusTimer'
import { FocusStatistics } from '@/components/focus/FocusStatistics'
import { FocusSettingsPanel } from '@/components/focus/FocusSettingsPanel'
import { PhaseHeader } from '@/components/shared/PhaseHeader'

interface FocusStats {
  today: { focusTime: number; sessions: number }
  week: { focusTime: number; sessions: number; avgDailyFocusTime: number; avgDailySessions: number }
  month: { focusTime: number; sessions: number; avgDailyFocusTime: number; avgDailySessions: number }
  allTime: { totalSessions: number; totalFocusTime: number; currentStreak: number; longestStreak: number }
  last7Days: Array<{ date: string; sessions: number; focusTime: number }>
  last30Days: Array<{ date: string; sessions: number; focusTime: number }>
  typeBreakdown: Array<{ type: string; count: number; totalTime: number }>
}

interface FocusSettings {
  focusDuration: number
  shortBreakDuration: number
  longBreakDuration: number
  autoStartBreaks: boolean
  autoStartFocus: boolean
  enableMusic: boolean
  musicVolume: number
}

type TimerMode = 'focus' | 'shortBreak' | 'longBreak'

export default function FocusPage() {
  const { t } = useT()
  const { data: session } = useSession()
  const [stats, setStats] = useState<FocusStats | null>(null)
  const [settings, setSettings] = useState<FocusSettings>({
    focusDuration: 25,
    shortBreakDuration: 5,
    longBreakDuration: 15,
    autoStartBreaks: false,
    autoStartFocus: false,
    enableMusic: true,
    musicVolume: 50
  })
  const [mode, setMode] = useState<TimerMode>('focus')
  const [timeLeft, setTimeLeft] = useState(1500)
  const [isActive, setIsActive] = useState(false)
  const [sessionStart, setSessionStart] = useState<Date | null>(null)
  const [completedSessions, setCompletedSessions] = useState(0)
  const [activeTab, setActiveTab] = useState('timer')
  const [showSettings, setShowSettings] = useState(false)
  const [isMuted, setIsMuted] = useState(false)
  const [showCompletionBadge, setShowCompletionBadge] = useState(false)
  
  const audioRef = useRef<HTMLAudioElement | null>(null)
  // Wall-clock timestamp (ms) at which the current run reaches zero.
  const deadlineRef = useRef<number | null>(null)
  // Guards against handleTimerComplete firing twice for one completion.
  const completingRef = useRef(false)

  useEffect(() => {
    if (session?.user?.email) {
      fetchStats()
      fetchSettings()
    }
  }, [session?.user?.email])

  // Timestamp-based countdown.
  //
  // A plain `setInterval(..., 1000)` is throttled to ~once per minute in
  // background tabs, so a 25-minute session left in the background would run
  // far past its real duration. We instead store the wall-clock deadline and
  // derive the remaining time from Date.now(), which stays correct no matter
  // how often the tick actually fires (and re-syncs on tab focus).
  useEffect(() => {
    if (!isActive) return

    const tick = () => {
      const deadline = deadlineRef.current
      if (deadline == null) return
      const remaining = Math.max(0, Math.round((deadline - Date.now()) / 1000))
      setTimeLeft(remaining)
      if (remaining === 0 && !completingRef.current) {
        completingRef.current = true
        handleTimerComplete()
      }
    }

    tick()
    const interval = setInterval(tick, 250)
    document.addEventListener('visibilitychange', tick)
    window.addEventListener('focus', tick)

    return () => {
      clearInterval(interval)
      document.removeEventListener('visibilitychange', tick)
      window.removeEventListener('focus', tick)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isActive])

  // Music management - initialize audio once
  useEffect(() => {
    // Initialize audio element once
    if (!audioRef.current) {
      audioRef.current = new Audio('/music/focus/sea.mp3')
      audioRef.current.loop = true
      audioRef.current.volume = settings.musicVolume / 100
    }

    // Cleanup on unmount only
    return () => {
      if (audioRef.current) {
        audioRef.current.pause()
        audioRef.current.src = ''
        audioRef.current.load()
        audioRef.current = null
      }
    }
  }, []) // Run only once on mount

  // Handle music playback based on state
  useEffect(() => {
    if (!audioRef.current) return

    const playMusic = async () => {
      try {
        await audioRef.current!.play()
      } catch (error) {
        // Browser blocked autoplay - will work after user interaction
        console.log('Audio autoplay blocked - waiting for user interaction')
      }
    }

    const stopMusic = () => {
      audioRef.current!.pause()
      // Don't reset currentTime - let it continue from where it was paused
    }

    if (isActive && mode === 'focus' && settings.enableMusic && !isMuted) {
      playMusic()
    } else {
      stopMusic()
    }
  }, [isActive, mode, settings.enableMusic, isMuted])

  // Update volume dynamically without stopping playback
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = settings.musicVolume / 100
    }
  }, [settings.musicVolume])

  const stopMusic = () => {
    if (audioRef.current) {
      audioRef.current.pause()
    }
  }

  const toggleMute = () => {
    const newMutedState = !isMuted
    setIsMuted(newMutedState)

    // Just toggle the muted property without stopping playback
    if (audioRef.current) {
      audioRef.current.muted = newMutedState
    }
  }

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/focus')
      if (response.ok) {
        const data = await response.json()
        setStats(data)
      }
    } catch (error) {
      console.error('Failed to fetch focus stats:', error)
    }
  }

  const fetchSettings = async () => {
    try {
      const response = await fetch('/api/focus/settings')
      if (response.ok) {
        const data = await response.json()
        setSettings(data)
        setTimeLeft(data.focusDuration * 60)
      }
    } catch (error) {
      console.error('Failed to fetch settings:', error)
    }
  }

  const saveSettings = async () => {
    try {
      const response = await fetch('/api/focus/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings)
      })

      if (response.ok) {
        toast.success(t('ui.settingsSaved'))
        setShowSettings(false)
        if (!isActive) {
          const durations = {
            focus: settings.focusDuration * 60,
            shortBreak: settings.shortBreakDuration * 60,
            longBreak: settings.longBreakDuration * 60
          }
          setTimeLeft(durations[mode])
        }
      }
    } catch (error) {
      toast.error(t('ui.failedToSaveSettings'))
    }
  }

  const handleTimerComplete = async () => {
    setIsActive(false)
    deadlineRef.current = null
    stopMusic()

    // Record the time the timer actually ran, not wall-clock since start —
    // wall-clock counted paused minutes as focus time.
    if (sessionStart) {
      const plannedSeconds =
        (mode === 'focus'
          ? settings.focusDuration
          : mode === 'shortBreak'
            ? settings.shortBreakDuration
            : settings.longBreakDuration) * 60
      const duration = Math.round(plannedSeconds / 60)

      // Ensure duration is at least 1 minute
      if (duration < 1) {
        console.log('Session too short, not recording')
        completingRef.current = false
        setSessionStart(null)
        return
      }

      try {
        await fetch('/api/focus', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            duration, 
            sessionType: mode,
            completedAt: new Date() 
          })
        })

        if (mode === 'focus') {
          const newCompletedCount = completedSessions + 1
          setCompletedSessions(newCompletedCount)
          toast.success(t('ui.focusSessionCompleted'), {
            description: `${duration} minutes of deep focus!`
          })
          
          // Show completion badge briefly
          setShowCompletionBadge(true)
          setTimeout(() => setShowCompletionBadge(false), 5000)
          
          // Auto-switch to next mode after focus
          const nextMode = newCompletedCount % 4 === 0 ? 'longBreak' : 'shortBreak'
          setMode(nextMode)
          setTimeLeft(nextMode === 'longBreak' ? settings.longBreakDuration * 60 : settings.shortBreakDuration * 60)
          
          // Only show break notification if not auto-starting
          if (!settings.autoStartBreaks) {
            toast.info(t('ui.timeForABreak'))
          } else {
            setTimeout(() => startTimer(), 3000)
          }
        } else {
          toast.success(`✅ ${mode === 'shortBreak' ? 'Short' : 'Long'} break completed!`)
          
          // Auto-switch back to focus after break
          setMode('focus')
          setTimeLeft(settings.focusDuration * 60)
          
          // Only show focus notification if not auto-starting
          if (!settings.autoStartFocus) {
            toast.info(t('ui.breakCompleteReadyToFocus'))
          } else {
            setTimeout(() => startTimer(), 3000)
          }
        }
        
        // Clear cache to ensure dashboard gets fresh data
        clientCache.delete('focus_stats')
        await fetchStats()
      } catch (error) {
        console.error('Failed to record session:', error)
        toast.error(t('ui.failedToSaveSession'))
      }
    } else {
      console.warn('No session start time recorded')
    }

    setSessionStart(null)
    completingRef.current = false
  }

  const startTimer = () => {
    // Anchor the countdown to a wall-clock deadline so backgrounding the tab
    // (or locking the phone) can't stretch the session.
    deadlineRef.current = Date.now() + timeLeft * 1000
    completingRef.current = false
    setIsActive(true)
    // Only stamp the session start on a fresh run, not when resuming a pause —
    // resuming used to reset it, which under-counted the recorded duration.
    setSessionStart((prev) => prev ?? new Date())

    // Ensure audio is ready to play (user interaction trigger)
    if (audioRef.current && mode === 'focus' && settings.enableMusic && !isMuted) {
      audioRef.current.play().catch(() => {
        console.log('Audio playback will start on user interaction')
      })
    }
  }

  const pauseTimer = () => {
    // Freeze the countdown at the true remaining time.
    if (deadlineRef.current != null) {
      setTimeLeft(Math.max(0, Math.round((deadlineRef.current - Date.now()) / 1000)))
    }
    deadlineRef.current = null
    setIsActive(false)
    // Music will pause automatically via useEffect when isActive changes
  }

  const resetTimer = () => {
    setIsActive(false)
    deadlineRef.current = null
    completingRef.current = false
    stopMusic()
    // Reset music to start when explicitly resetting timer
    if (audioRef.current) {
      audioRef.current.currentTime = 0
    }
    const durations = {
      focus: settings.focusDuration * 60,
      shortBreak: settings.shortBreakDuration * 60,
      longBreak: settings.longBreakDuration * 60
    }
    setTimeLeft(durations[mode])
    setSessionStart(null)
  }

  const switchMode = (newMode: TimerMode) => {
    setMode(newMode)
    const durations = {
      focus: settings.focusDuration * 60,
      shortBreak: settings.shortBreakDuration * 60,
      longBreak: settings.longBreakDuration * 60
    }
    setTimeLeft(durations[newMode])
    setIsActive(false)
    stopMusic()
    // Reset music to start when switching modes
    if (audioRef.current) {
      audioRef.current.currentTime = 0
    }
    setSessionStart(null)
  }

  return (
    <div data-accent="focus" className="accent-canvas min-h-screen p-4 text-slate-900 dark:text-gray-100 md:p-8">
      <div className="max-w-7xl mx-auto space-y-4 sm:space-y-6">
        <PhaseHeader
          accent="focus"
          icon={Brain}
          title={t('ui.focusSession')}
          subtitle={t('ui.deepWorkTimerWithStatistics')}
          actions={
            <button
              onClick={() => setShowSettings(!showSettings)}
              className="inline-flex h-11 items-center gap-2 rounded-xl bg-white/15 px-4 text-sm font-semibold text-white ring-1 ring-white/25 backdrop-blur-md transition-colors hover:bg-white/25"
            >
              <Settings className="h-4 w-4" />
              {t('nav.settings')}
            </button>
          }
        />

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid h-12 w-full grid-cols-2 border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <TabsTrigger 
              value="timer" 
              className="h-10 font-semibold text-slate-600 data-[state=active]:accent-soft data-[state=active]:shadow-sm dark:text-slate-400"
            >
              {t('ui.timer')}
            </TabsTrigger>
            <TabsTrigger 
              value="statistics" 
              className="h-10 font-semibold text-slate-600 data-[state=active]:accent-soft data-[state=active]:shadow-sm dark:text-slate-400"
            >
              {t('ui.statistics')}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="timer" className="space-y-4 sm:space-y-6">
            <FocusSettingsPanel
              show={showSettings}
              settings={settings}
              onSettingsChange={setSettings}
              onSave={saveSettings}
            />

            <FocusTimer
              mode={mode}
              timeLeft={timeLeft}
              isActive={isActive}
              completedSessions={completedSessions}
              settings={settings}
              isMuted={isMuted}
              onStart={startTimer}
              onPause={pauseTimer}
              onReset={resetTimer}
              onSwitchMode={switchMode}
              onToggleMute={toggleMute}
            />
          </TabsContent>

          <TabsContent value="statistics" className="space-y-4 sm:space-y-6">
            {stats && stats.allTime.totalSessions > 0 ? (
              <FocusStatistics stats={stats} />
            ) : (
              <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed py-16 text-center">
                <div className="accent-soft mb-4 flex h-16 w-16 items-center justify-center rounded-2xl">
                  <Brain className="accent-ink h-8 w-8" />
                </div>
                <h3 className="text-lg font-semibold">{t('ui.noFocusSessionsYet')}</h3>
                <p className="mt-1 max-w-xs text-sm text-muted-foreground">
{t('ui.runYourFirstSessionAndYourStreaksTotalsAndDa')}
</p>
                <Button className="mt-5" onClick={() => setActiveTab('timer')}>
                  {t('ui.startASession')}
                </Button>
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* Completion Badge - Shows briefly after completing a session */}
        <AnimatePresence>
          {showCompletionBadge && completedSessions > 0 && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.8, y: 20 }}
              className="fixed inset-x-4 bottom-24 z-50 sm:inset-x-auto sm:bottom-8 sm:right-8"
            >
              <div className="flex items-center gap-3 rounded-2xl border border-emerald-300 bg-emerald-50 p-4 shadow-2xl dark:border-emerald-700 dark:bg-emerald-950">
                <CheckCircle2 className="h-8 w-8 shrink-0 text-emerald-600 dark:text-emerald-400" />
                <div className="min-w-0">
                  <p className="font-semibold text-emerald-900 dark:text-emerald-100">
                    {t('ui.sessionsToday', { count: completedSessions })}
                  </p>
                  <p className="text-sm text-emerald-700 dark:text-emerald-300">{t('ui.keepGoing')}</p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
